import { useState } from 'react';
import { FiPlus, FiCalendar, FiMapPin, FiSun, FiCloud, FiCloudRain, FiTrash2 } from 'react-icons/fi';
import ConfirmDialog from '../ConfirmDialog';

const DaySidebar = ({ days, selectedDay, onSelectDay, onAddDay, onDeleteDay, stats }) => {
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, dayId: null, dayNumber: null });
  const getWeatherIcon = (condition) => {
    if (!condition) return <FiSun className="w-4 h-4" />;
    
    const lower = condition.toLowerCase();
    if (lower.includes('rain') || lower.includes('storm')) {
      return <FiCloudRain className="w-4 h-4" />;
    } else if (lower.includes('cloud') || lower.includes('overcast')) {
      return <FiCloud className="w-4 h-4" />;
    }
    return <FiSun className="w-4 h-4" />;
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Trip Timeline</h2>
        
        {/* Summary Stats */}
        {stats && (
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-blue-50 rounded-lg p-2">
              <div className="text-xs text-blue-600">Total Days</div>
              <div className="text-lg font-semibold text-blue-900">{stats.totalDays}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-2">
              <div className="text-xs text-green-600">Components</div>
              <div className="text-lg font-semibold text-green-900">{stats.totalComponents}</div>
            </div>
          </div>
        )}
      </div>

      {/* Days List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {days && days.length > 0 ? (
          days.map((day, index) => (
            <div
              key={day._id || index}
              className={`relative rounded-lg transition-all group ${
                selectedDay?._id === day._id
                  ? 'bg-primary-50 border-2 border-primary-500 shadow-sm'
                  : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
              }`}
            >
              <button
                onClick={() => onSelectDay(day)}
                className="w-full text-left p-3"
              >
              {/* Day Number Badge */}
              <div className="flex items-start justify-between mb-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    selectedDay?._id === day._id
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-300 text-gray-700'
                  }`}
                >
                  D{day.dayNumber || index + 1}
                </div>
                
                {/* Weather */}
                {day.weather && (
                  <div className="flex items-center text-xs text-gray-500">
                    {getWeatherIcon(day.weather.condition)}
                    <span className="ml-1">
                      {day.weather.temperature?.max}°C
                    </span>
                  </div>
                )}
              </div>

              {/* Day Title */}
              <h3 className={`font-medium mb-1 line-clamp-1 ${
                selectedDay?._id === day._id ? 'text-primary-900' : 'text-gray-900'
              }`}>
                {day.title || `Day ${day.dayNumber || index + 1}`}
              </h3>

              {/* Date */}
              <div className="flex items-center text-xs text-gray-500 mb-1">
                <FiCalendar className="w-3 h-3 mr-1" />
                {day.date ? new Date(day.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                }) : 'No date set'}
              </div>

              {/* Location */}
              {day.location && (
                <div className="flex items-center text-xs text-gray-500">
                  <FiMapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="line-clamp-1">
                    {day.location.city || day.location.name || 'No location'}
                  </span>
                </div>
              )}

              {/* Component Count */}
              {day.components && day.components.length > 0 && (
                <div className="mt-2 flex items-center space-x-2">
                  {day.components.slice(0, 3).map((comp, idx) => (
                    <span
                      key={idx}
                      className="w-6 h-6 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-xs"
                      title={comp.type}
                    >
                      {comp.type === 'stay' && '🏨'}
                      {comp.type === 'transfer' && '🚗'}
                      {comp.type === 'activity' && '🎭'}
                      {comp.type === 'meal' && '🍽️'}
                      {comp.type === 'note' && '📝'}
                    </span>
                  ))}
                  {day.components.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{day.components.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </button>
            
            {/* Delete Button - Only show on hover and if there's more than 1 day */}
            {days.length > 1 && onDeleteDay && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteConfirm({ 
                    isOpen: true, 
                    dayId: day._id,
                    dayNumber: day.dayNumber 
                  });
                }}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                title="Delete day"
              >
                <FiTrash2 className="w-3 h-3" />
              </button>
            )}
          </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">No days added yet</p>
            <p className="text-xs mt-1">Click below to add your first day</p>
          </div>
        )}
      </div>

      {/* Add Day Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onAddDay}
          className="w-full btn btn-primary flex items-center justify-center"
        >
          <FiPlus className="w-4 h-4 mr-2" />
          Add New Day
        </button>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, dayId: null, dayNumber: null })}
        onConfirm={() => {
          onDeleteDay(deleteConfirm.dayId);
          setDeleteConfirm({ isOpen: false, dayId: null, dayNumber: null });
        }}
        type="danger"
        title="Delete Day"
        message={`Are you sure you want to delete Day ${deleteConfirm.dayNumber}? This will renumber all following days and cannot be undone.`}
      />
    </div>
  );
};

export default DaySidebar;
