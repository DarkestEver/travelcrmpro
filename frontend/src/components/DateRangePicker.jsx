import { useState } from 'react';
import PropTypes from 'prop-types';
import { FiCalendar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const DateRangePicker = ({
  startDate: initialStartDate,
  endDate: initialEndDate,
  onChange,
  minDate,
  maxDate,
  presets = true,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState(initialStartDate || null);
  const [endDate, setEndDate] = useState(initialEndDate || null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingStart, setSelectingStart] = useState(true);

  const presetRanges = [
    {
      label: 'Today',
      getValue: () => {
        const today = new Date();
        return { start: today, end: today };
      },
    },
    {
      label: 'Last 7 Days',
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 6);
        return { start, end };
      },
    },
    {
      label: 'Last 30 Days',
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 29);
        return { start, end };
      },
    },
    {
      label: 'This Month',
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { start, end };
      },
    },
    {
      label: 'Last Month',
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        return { start, end };
      },
    },
  ];

  const handleDateClick = (date) => {
    if (selectingStart) {
      setStartDate(date);
      setEndDate(null);
      setSelectingStart(false);
    } else {
      if (date < startDate) {
        setStartDate(date);
        setEndDate(startDate);
      } else {
        setEndDate(date);
      }
      setSelectingStart(true);
      
      // Call onChange callback
      if (onChange && date >= startDate) {
        onChange({ start: startDate, end: date });
      }
    }
  };

  const handlePresetClick = (preset) => {
    const { start, end } = preset.getValue();
    setStartDate(start);
    setEndDate(end);
    if (onChange) {
      onChange({ start, end });
    }
    setIsOpen(false);
  };

  const handleApply = () => {
    if (startDate && endDate && onChange) {
      onChange({ start: startDate, end: endDate });
    }
    setIsOpen(false);
  };

  const handleCancel = () => {
    setStartDate(initialStartDate || null);
    setEndDate(initialEndDate || null);
    setIsOpen(false);
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const isDateInRange = (date) => {
    if (!date || !startDate || !endDate) return false;
    return date >= startDate && date <= endDate;
  };

  const isDateSelected = (date) => {
    if (!date) return false;
    const dateStr = date.toDateString();
    return (
      (startDate && dateStr === startDate.toDateString()) ||
      (endDate && dateStr === endDate.toDateString())
    );
  };

  const isDateDisabled = (date) => {
    if (!date) return false;
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const formatDateRange = () => {
    if (!startDate && !endDate) return 'Select date range';
    if (startDate && !endDate) return startDate.toLocaleDateString();
    if (startDate && endDate) {
      return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    }
    return 'Select date range';
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={`relative ${className}`}>
      {/* Input Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="input flex items-center justify-between w-full"
      >
        <span className={startDate || endDate ? 'text-gray-900' : 'text-gray-500'}>
          {formatDateRange()}
        </span>
        <FiCalendar className="w-5 h-5 text-gray-400" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
          <div className="flex gap-4">
            {/* Presets */}
            {presets && (
              <div className="border-r pr-4 space-y-1">
                <p className="text-xs font-medium text-gray-500 mb-2">Quick Select</p>
                {presetRanges.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => handlePresetClick(preset)}
                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            )}

            {/* Calendar */}
            <div>
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={previousMonth}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <FiChevronLeft className="w-5 h-5" />
                </button>
                <span className="font-medium">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </span>
                <button
                  onClick={nextMonth}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <FiChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Day Names */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-medium text-gray-500 p-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {getDaysInMonth(currentMonth).map((date, index) => {
                  if (!date) {
                    return <div key={index} className="p-2"></div>;
                  }

                  const isSelected = isDateSelected(date);
                  const isInRange = isDateInRange(date);
                  const isDisabled = isDateDisabled(date);

                  return (
                    <button
                      key={index}
                      onClick={() => !isDisabled && handleDateClick(date)}
                      disabled={isDisabled}
                      className={`
                        p-2 text-sm rounded
                        ${isDisabled 
                          ? 'text-gray-300 cursor-not-allowed' 
                          : 'hover:bg-blue-50 cursor-pointer'
                        }
                        ${isSelected 
                          ? 'bg-blue-500 text-white hover:bg-blue-600' 
                          : ''
                        }
                        ${isInRange && !isSelected 
                          ? 'bg-blue-100 text-blue-900' 
                          : ''
                        }
                      `}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                <button
                  onClick={handleCancel}
                  className="btn-secondary text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  className="btn btn-primary text-sm"
                  disabled={!startDate || !endDate}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

DateRangePicker.propTypes = {
  startDate: PropTypes.instanceOf(Date),
  endDate: PropTypes.instanceOf(Date),
  onChange: PropTypes.func,
  minDate: PropTypes.instanceOf(Date),
  maxDate: PropTypes.instanceOf(Date),
  presets: PropTypes.bool,
  className: PropTypes.string,
};

export default DateRangePicker;