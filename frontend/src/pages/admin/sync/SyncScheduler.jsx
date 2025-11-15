import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClockIcon } from '@heroicons/react/24/outline';
import { LoadingSpinner, ButtonLoader } from '../../../components/shared/LoadingStates';
import { getSyncSchedule, updateSyncSchedule } from '../../../services/api/inventorySyncApi';

const SyncScheduler = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    autoSyncEnabled: false,
    frequency: 'hourly',
    customInterval: 60,
    syncTimes: ['00:00', '12:00'],
    daysOfWeek: [],
    excludeWeekends: false,
    supplierSchedules: {}
  });

  const { data: schedule, isLoading } = useQuery({
    queryKey: ['syncSchedule'],
    queryFn: getSyncSchedule,
  });

  useEffect(() => {
    if (schedule) {
      setFormData({
        autoSyncEnabled: schedule.autoSyncEnabled || false,
        frequency: schedule.frequency || 'hourly',
        customInterval: schedule.customInterval || 60,
        syncTimes: schedule.syncTimes || ['00:00', '12:00'],
        daysOfWeek: schedule.daysOfWeek || [],
        excludeWeekends: schedule.excludeWeekends || false,
        supplierSchedules: schedule.supplierSchedules || {}
      });
    }
  }, [schedule]);

  const updateMutation = useMutation({
    mutationFn: (data) => updateSyncSchedule(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['syncSchedule']);
      queryClient.invalidateQueries(['syncStatus']);
      alert('Sync schedule updated successfully!');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to update schedule');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleDayToggle = (day) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day]
    }));
  };

  const addSyncTime = () => {
    const newTime = '12:00';
    setFormData(prev => ({
      ...prev,
      syncTimes: [...prev.syncTimes, newTime]
    }));
  };

  const removeSyncTime = (index) => {
    setFormData(prev => ({
      ...prev,
      syncTimes: prev.syncTimes.filter((_, i) => i !== index)
    }));
  };

  const updateSyncTime = (index, value) => {
    setFormData(prev => ({
      ...prev,
      syncTimes: prev.syncTimes.map((time, i) => i === index ? value : time)
    }));
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Auto-Sync Toggle */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ClockIcon className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-900">Automatic Synchronization</h3>
              <p className="text-sm text-blue-700 mt-1">
                Enable scheduled automatic syncs with suppliers
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.autoSyncEnabled}
              onChange={(e) => setFormData(prev => ({ ...prev, autoSyncEnabled: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {/* Frequency Settings */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sync Frequency</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <label className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              formData.frequency === 'realtime' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            }`}>
              <input
                type="radio"
                name="frequency"
                value="realtime"
                checked={formData.frequency === 'realtime'}
                onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                className="sr-only"
              />
              <div className="font-semibold text-gray-900">Real-time</div>
              <p className="text-sm text-gray-600 mt-1">Sync immediately when changes detected</p>
            </label>

            <label className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              formData.frequency === 'hourly' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            }`}>
              <input
                type="radio"
                name="frequency"
                value="hourly"
                checked={formData.frequency === 'hourly'}
                onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                className="sr-only"
              />
              <div className="font-semibold text-gray-900">Hourly</div>
              <p className="text-sm text-gray-600 mt-1">Sync every hour</p>
            </label>

            <label className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              formData.frequency === 'daily' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            }`}>
              <input
                type="radio"
                name="frequency"
                value="daily"
                checked={formData.frequency === 'daily'}
                onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                className="sr-only"
              />
              <div className="font-semibold text-gray-900">Daily</div>
              <p className="text-sm text-gray-600 mt-1">Sync once per day</p>
            </label>

            <label className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              formData.frequency === 'custom' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            }`}>
              <input
                type="radio"
                name="frequency"
                value="custom"
                checked={formData.frequency === 'custom'}
                onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                className="sr-only"
              />
              <div className="font-semibold text-gray-900">Custom</div>
              <p className="text-sm text-gray-600 mt-1">Set custom interval</p>
            </label>
          </div>

          {formData.frequency === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sync Interval (minutes)
              </label>
              <input
                type="number"
                min="5"
                max="1440"
                value={formData.customInterval}
                onChange={(e) => setFormData(prev => ({ ...prev, customInterval: parseInt(e.target.value) || 60 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Sync Times (for daily) */}
      {formData.frequency === 'daily' && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sync Times</h3>
          
          <div className="space-y-3">
            {formData.syncTimes.map((time, index) => (
              <div key={index} className="flex items-center gap-3">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => updateSyncTime(index, e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {formData.syncTimes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSyncTime(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addSyncTime}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              + Add Another Time
            </button>
          </div>
        </div>
      )}

      {/* Days of Week */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Days</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-7 gap-2">
            {days.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => handleDayToggle(day)}
                className={`p-3 text-sm font-medium rounded-lg transition-colors ${
                  formData.daysOfWeek.includes(day)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {day.substring(0, 3)}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.excludeWeekends}
              onChange={(e) => setFormData(prev => ({ ...prev, excludeWeekends: e.target.checked }))}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Exclude weekends (Saturday & Sunday)</span>
          </label>
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-2">Schedule Summary</h4>
        <div className="text-sm text-gray-700 space-y-1">
          <p>
            <span className="font-medium">Status:</span>{' '}
            {formData.autoSyncEnabled ? (
              <span className="text-green-600">Enabled</span>
            ) : (
              <span className="text-red-600">Disabled</span>
            )}
          </p>
          <p>
            <span className="font-medium">Frequency:</span>{' '}
            {formData.frequency === 'custom' 
              ? `Every ${formData.customInterval} minutes`
              : formData.frequency.charAt(0).toUpperCase() + formData.frequency.slice(1)}
          </p>
          {formData.frequency === 'daily' && (
            <p>
              <span className="font-medium">Times:</span> {formData.syncTimes.join(', ')}
            </p>
          )}
          {formData.daysOfWeek.length > 0 && (
            <p>
              <span className="font-medium">Active Days:</span> {formData.daysOfWeek.join(', ')}
            </p>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {updateMutation.isPending ? <ButtonLoader /> : 'Save Schedule'}
        </button>
      </div>
    </form>
  );
};

export default SyncScheduler;
