import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import Modal from '../../../components/shared/Modal';
import { 
  getAvailability, 
  updateAvailability, 
  bulkUpdateAvailability 
} from '../../../services/api/inventoryApi';
import { LoadingSpinner, ButtonLoader } from '../../../components/shared/LoadingStates';

const AvailabilityCalendar = ({ item, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState([]);
  const [bulkQuantity, setBulkQuantity] = useState(0);
  const [bulkStatus, setBulkStatus] = useState('available');
  const [viewMode, setViewMode] = useState('month'); // month or week

  // Get month/year from current date
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Fetch availability data
  const { data: availability = [], isLoading } = useQuery({
    queryKey: ['availability', item?.id, year, month],
    queryFn: () => getAvailability(item.id, { year, month: month + 1 }),
    enabled: !!item
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ date, quantity, status }) => 
      updateAvailability(item.id, date, { quantity, status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['availability', item?.id]);
      alert('Availability updated successfully!');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to update availability');
    }
  });

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: ({ dates, quantity, status }) => 
      bulkUpdateAvailability(item.id, { dates, quantity, status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['availability', item?.id]);
      setSelectedDates([]);
      alert('Bulk availability updated successfully!');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to bulk update availability');
    }
  });

  // Calendar helpers
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const getAvailabilityForDate = (date) => {
    const dateStr = formatDate(date);
    return availability.find(a => a.date === dateStr);
  };

  // Navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Date selection
  const toggleDateSelection = (date) => {
    const dateStr = formatDate(date);
    setSelectedDates(prev => {
      if (prev.includes(dateStr)) {
        return prev.filter(d => d !== dateStr);
      } else {
        return [...prev, dateStr];
      }
    });
  };

  const selectAllDates = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const dates = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      if (date >= new Date()) { // Only future dates
        dates.push(formatDate(date));
      }
    }
    setSelectedDates(dates);
  };

  const clearSelection = () => {
    setSelectedDates([]);
  };

  // Bulk operations
  const handleBulkUpdate = () => {
    if (selectedDates.length === 0) {
      alert('Please select at least one date');
      return;
    }

    bulkUpdateMutation.mutate({
      dates: selectedDates,
      quantity: bulkQuantity,
      status: bulkStatus
    });
  };

  const blockSelectedDates = () => {
    if (selectedDates.length === 0) {
      alert('Please select at least one date');
      return;
    }

    bulkUpdateMutation.mutate({
      dates: selectedDates,
      quantity: 0,
      status: 'unavailable'
    });
  };

  // Render calendar grid
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-24 bg-gray-50 border border-gray-200"></div>
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = formatDate(date);
      const avail = getAvailabilityForDate(date);
      const isPast = date < today;
      const isSelected = selectedDates.includes(dateStr);
      const isToday = date.getTime() === today.getTime();

      let bgColor = 'bg-white';
      let textColor = 'text-gray-900';
      let borderColor = 'border-gray-200';

      if (isPast) {
        bgColor = 'bg-gray-100';
        textColor = 'text-gray-400';
      } else if (avail) {
        if (avail.status === 'available') {
          if (avail.quantity === 0) {
            bgColor = 'bg-red-50';
            textColor = 'text-red-900';
          } else if (avail.quantity <= item.minQuantity) {
            bgColor = 'bg-orange-50';
            textColor = 'text-orange-900';
          } else {
            bgColor = 'bg-green-50';
            textColor = 'text-green-900';
          }
        } else if (avail.status === 'unavailable') {
          bgColor = 'bg-red-50';
          textColor = 'text-red-900';
        }
      }

      if (isSelected) {
        borderColor = 'border-blue-500 border-2';
      }

      if (isToday) {
        borderColor = 'border-purple-500 border-2';
      }

      days.push(
        <div
          key={day}
          onClick={() => !isPast && toggleDateSelection(date)}
          className={`h-24 p-2 border ${bgColor} ${borderColor} ${
            isPast ? 'cursor-not-allowed' : 'cursor-pointer hover:border-blue-300'
          } transition-colors`}
        >
          <div className={`font-semibold ${textColor} text-sm mb-1`}>{day}</div>
          {avail && !isPast && (
            <div className="text-xs space-y-1">
              <div className={textColor}>
                Qty: {avail.quantity || 0}
              </div>
              <div className="flex items-center gap-1">
                {avail.status === 'available' && avail.quantity > 0 ? (
                  <CheckCircleIcon className="w-3 h-3 text-green-600" />
                ) : (
                  <XCircleIcon className="w-3 h-3 text-red-600" />
                )}
                <span className="text-xs capitalize">{avail.status}</span>
              </div>
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (isLoading) {
    return (
      <Modal isOpen={true} onClose={onClose} title="Availability Calendar" size="xl">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Availability Calendar - ${item?.name}`}
      size="full"
    >
      <div className="space-y-6">
        {/* Header Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold">
              {monthNames[month]} {year}
            </h2>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Today
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={selectAllDates}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg"
            >
              Select All
            </button>
            <button
              onClick={clearSelection}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
              disabled={selectedDates.length === 0}
            >
              Clear ({selectedDates.length})
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
            <span className="text-sm text-gray-700">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded"></div>
            <span className="text-sm text-gray-700">Low Stock</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
            <span className="text-sm text-gray-700">Unavailable</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white border-2 border-purple-500 rounded"></div>
            <span className="text-sm text-gray-700">Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white border-2 border-blue-500 rounded"></div>
            <span className="text-sm text-gray-700">Selected</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Week day headers */}
          <div className="grid grid-cols-7 bg-gray-50">
            {weekDays.map(day => (
              <div key={day} className="p-2 text-center font-semibold text-sm text-gray-700 border-b border-gray-200">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7">
            {renderCalendar()}
          </div>
        </div>

        {/* Bulk Actions Panel */}
        {selectedDates.length > 0 && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
            <h3 className="font-semibold text-blue-900">
              Bulk Update ({selectedDates.length} dates selected)
            </h3>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  value={bulkQuantity}
                  onChange={(e) => setBulkQuantity(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="available">Available</option>
                  <option value="unavailable">Unavailable</option>
                  <option value="on_request">On Request</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleBulkUpdate}
                  disabled={bulkUpdateMutation.isPending}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {bulkUpdateMutation.isPending ? <ButtonLoader /> : 'Apply'}
                </button>
              </div>

              <div className="flex items-end">
                <button
                  onClick={blockSelectedDates}
                  disabled={bulkUpdateMutation.isPending}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Block Dates
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AvailabilityCalendar;
