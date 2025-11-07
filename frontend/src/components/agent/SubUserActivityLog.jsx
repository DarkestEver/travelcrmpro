import { useQuery } from '@tanstack/react-query';
import { getSubUserActivityLogs } from '../../services/agentSubUserAPI';
import {
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

const actionColors = {
  create: 'bg-green-100 text-green-800',
  update: 'bg-blue-100 text-blue-800',
  delete: 'bg-red-100 text-red-800',
  login: 'bg-purple-100 text-purple-800',
  view: 'bg-gray-100 text-gray-800',
};

const actionIcons = {
  create: DocumentTextIcon,
  update: DocumentTextIcon,
  delete: ExclamationCircleIcon,
  login: UserIcon,
  view: ClockIcon,
};

const SubUserActivityLog = ({ subUserId }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['sub-user-activity', subUserId],
    queryFn: () => getSubUserActivityLogs(subUserId),
    enabled: !!subUserId,
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-800 text-sm">
          Error loading activity logs: {error.message}
        </p>
      </div>
    );
  }

  const logs = data?.logs || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Activity Log</h3>
        <span className="text-sm text-gray-500">
          {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No activity yet
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Activity logs will appear here when this sub-user performs actions
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            <div className="divide-y divide-gray-200">
              {logs.map((log, index) => {
                const Icon = actionIcons[log.action] || DocumentTextIcon;
                return (
                  <div
                    key={log._id || index}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      {/* Action Icon */}
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          actionColors[log.action] || 'bg-gray-100'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>

                      {/* Log Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {log.description || `${log.action} action`}
                          </p>
                          <span className="text-xs text-gray-500">
                            {formatDate(log.timestamp || log.createdAt)}
                          </span>
                        </div>

                        {/* Resource Info */}
                        {log.resourceType && (
                          <div className="mt-1 flex items-center space-x-2">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                actionColors[log.action] || 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {log.action.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-600">
                              {log.resourceType}
                              {log.resourceId && ` #${log.resourceId.slice(-6)}`}
                            </span>
                          </div>
                        )}

                        {/* Additional Details */}
                        {log.details && typeof log.details === 'object' && (
                          <div className="mt-2 text-xs text-gray-500">
                            {Object.entries(log.details).map(([key, value]) => (
                              <div key={key} className="flex items-center space-x-1">
                                <span className="font-medium">{key}:</span>
                                <span>{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* IP Address */}
                        {log.ipAddress && (
                          <p className="mt-1 text-xs text-gray-500">
                            IP: {log.ipAddress}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Pagination Info (if needed) */}
      {data?.pagination && data.pagination.total > logs.length && (
        <div className="text-center pt-4">
          <p className="text-sm text-gray-500">
            Showing {logs.length} of {data.pagination.total} activities
          </p>
        </div>
      )}
    </div>
  );
};

export default SubUserActivityLog;
