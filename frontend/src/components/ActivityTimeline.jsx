import PropTypes from 'prop-types';
import { 
  FiUser, 
  FiFileText, 
  FiDollarSign, 
  FiCalendar,
  FiCheckCircle,
  FiXCircle,
  FiEdit,
  FiTrash2,
  FiSend,
  FiClock
} from 'react-icons/fi';

const ActivityTimeline = ({ activities = [], loading = false }) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FiClock className="w-12 h-12 mx-auto mb-2 text-gray-400" />
        <p>No activities yet</p>
      </div>
    );
  }

  const getActivityIcon = (type) => {
    const icons = {
      user: FiUser,
      booking: FiCalendar,
      quote: FiFileText,
      payment: FiDollarSign,
      approved: FiCheckCircle,
      rejected: FiXCircle,
      updated: FiEdit,
      deleted: FiTrash2,
      sent: FiSend,
      default: FiClock,
    };
    return icons[type] || icons.default;
  };

  const getActivityColor = (type) => {
    const colors = {
      user: 'bg-blue-100 text-blue-600',
      booking: 'bg-green-100 text-green-600',
      quote: 'bg-purple-100 text-purple-600',
      payment: 'bg-yellow-100 text-yellow-600',
      approved: 'bg-green-100 text-green-600',
      rejected: 'bg-red-100 text-red-600',
      updated: 'bg-blue-100 text-blue-600',
      deleted: 'bg-red-100 text-red-600',
      sent: 'bg-purple-100 text-purple-600',
      default: 'bg-gray-100 text-gray-600',
    };
    return colors[type] || colors.default;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
      });
    }
  };

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>

      {/* Timeline items */}
      <div className="space-y-6">
        {activities.map((activity, index) => {
          const Icon = getActivityIcon(activity.type);
          const colorClass = getActivityColor(activity.type);

          return (
            <div key={activity.id || index} className="relative flex gap-4">
              {/* Icon */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full ${colorClass} flex items-center justify-center z-10`}>
                <Icon className="w-5 h-5" />
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {activity.title}
                      </h4>
                      {activity.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {activity.description}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                      {formatTimestamp(activity.timestamp)}
                    </span>
                  </div>

                  {/* Metadata */}
                  {(activity.user || activity.metadata) && (
                    <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                      {activity.user && (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                            {activity.user.name?.charAt(0) || 'U'}
                          </div>
                          <span className="text-sm text-gray-700">
                            {activity.user.name}
                          </span>
                        </div>
                      )}

                      {activity.metadata && (
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(activity.metadata).map(([key, value]) => (
                            <span
                              key={key}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                            >
                              {key}: <span className="ml-1 font-semibold">{value}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  {activity.actions && activity.actions.length > 0 && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                      {activity.actions.map((action, actionIndex) => (
                        <button
                          key={actionIndex}
                          onClick={action.onClick}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

ActivityTimeline.propTypes = {
  activities: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      type: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
      timestamp: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.instanceOf(Date),
      ]).isRequired,
      user: PropTypes.shape({
        name: PropTypes.string,
        avatar: PropTypes.string,
      }),
      metadata: PropTypes.object,
      actions: PropTypes.arrayOf(
        PropTypes.shape({
          label: PropTypes.string.isRequired,
          onClick: PropTypes.func.isRequired,
        })
      ),
    })
  ),
  loading: PropTypes.bool,
};

export default ActivityTimeline;