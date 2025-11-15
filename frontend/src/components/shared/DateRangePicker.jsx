import React, { useState } from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';

const DateRangePicker = ({ 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange,
  onRangeChange,
  minDate,
  maxDate,
  disabled = false,
  label = 'Date Range',
  className = ''
}) => {
  const [localStartDate, setLocalStartDate] = useState(startDate || '');
  const [localEndDate, setLocalEndDate] = useState(endDate || '');
  const [error, setError] = useState('');

  const validateDateRange = (start, end) => {
    if (start && end && new Date(start) > new Date(end)) {
      return 'Start date must be before end date';
    }
    return '';
  };

  const handleStartDateChange = (e) => {
    const value = e.target.value;
    setLocalStartDate(value);
    
    const validationError = validateDateRange(value, localEndDate);
    setError(validationError);

    if (!validationError) {
      onStartDateChange && onStartDateChange(value);
      onRangeChange && onRangeChange({ start: value, end: localEndDate });
    }
  };

  const handleEndDateChange = (e) => {
    const value = e.target.value;
    setLocalEndDate(value);
    
    const validationError = validateDateRange(localStartDate, value);
    setError(validationError);

    if (!validationError) {
      onEndDateChange && onEndDateChange(value);
      onRangeChange && onRangeChange({ start: localStartDate, end: value });
    }
  };

  const clearDates = () => {
    setLocalStartDate('');
    setLocalEndDate('');
    setError('');
    onStartDateChange && onStartDateChange('');
    onEndDateChange && onEndDateChange('');
    onRangeChange && onRangeChange({ start: '', end: '' });
  };

  // Quick select presets
  const setPresetRange = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    setLocalStartDate(startStr);
    setLocalEndDate(endStr);
    setError('');

    onStartDateChange && onStartDateChange(startStr);
    onEndDateChange && onEndDateChange(endStr);
    onRangeChange && onRangeChange({ start: startStr, end: endStr });
  };

  return (
    <div className={`${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      <div className="flex flex-col space-y-3">
        {/* Date Inputs */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Start Date */}
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">From</label>
            <div className="relative">
              <input
                type="date"
                value={localStartDate}
                onChange={handleStartDateChange}
                min={minDate}
                max={maxDate}
                disabled={disabled}
                className={`
                  w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  ${error ? 'border-red-300' : 'border-gray-300'}
                  ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
                `}
              />
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* End Date */}
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">To</label>
            <div className="relative">
              <input
                type="date"
                value={localEndDate}
                onChange={handleEndDateChange}
                min={minDate || localStartDate}
                max={maxDate}
                disabled={disabled}
                className={`
                  w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  ${error ? 'border-red-300' : 'border-gray-300'}
                  ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
                `}
              />
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* Clear Button */}
          {(localStartDate || localEndDate) && !disabled && (
            <div className="flex items-end">
              <button
                onClick={clearDates}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {/* Quick Select Buttons */}
        {!disabled && (
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-gray-500 self-center mr-2">Quick select:</span>
            <button
              onClick={() => setPresetRange(7)}
              className="px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Last 7 days
            </button>
            <button
              onClick={() => setPresetRange(30)}
              className="px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Last 30 days
            </button>
            <button
              onClick={() => setPresetRange(90)}
              className="px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Last 90 days
            </button>
            <button
              onClick={() => {
                const start = new Date();
                start.setDate(1);
                const startStr = start.toISOString().split('T')[0];
                const endStr = new Date().toISOString().split('T')[0];
                setLocalStartDate(startStr);
                setLocalEndDate(endStr);
                onRangeChange && onRangeChange({ start: startStr, end: endStr });
              }}
              className="px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50"
            >
              This month
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DateRangePicker;
