import { AlertCircle, RefreshCw, Home, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * ErrorDisplay Component
 * Beautiful error page with different error types
 */
const ErrorDisplay = ({ 
  type = 'general',
  title,
  message,
  onRetry,
  showHomeButton = true,
  customAction
}) => {
  const navigate = useNavigate();

  const errorTypes = {
    403: {
      icon: Lock,
      iconColor: 'text-red-500',
      bgColor: 'bg-red-50',
      defaultTitle: 'Access Denied',
      defaultMessage: 'You don\'t have permission to access this resource. Please contact your administrator if you believe this is an error.'
    },
    404: {
      icon: AlertCircle,
      iconColor: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      defaultTitle: 'Not Found',
      defaultMessage: 'The resource you\'re looking for doesn\'t exist or has been removed.'
    },
    500: {
      icon: AlertCircle,
      iconColor: 'text-red-500',
      bgColor: 'bg-red-50',
      defaultTitle: 'Server Error',
      defaultMessage: 'Something went wrong on our end. Please try again later.'
    },
    network: {
      icon: AlertCircle,
      iconColor: 'text-orange-500',
      bgColor: 'bg-orange-50',
      defaultTitle: 'Network Error',
      defaultMessage: 'Unable to connect to the server. Please check your internet connection.'
    },
    general: {
      icon: AlertCircle,
      iconColor: 'text-gray-500',
      bgColor: 'bg-gray-50',
      defaultTitle: 'Something went wrong',
      defaultMessage: 'An unexpected error occurred. Please try again.'
    }
  };

  const config = errorTypes[type] || errorTypes.general;
  const Icon = config.icon;
  const displayTitle = title || config.defaultTitle;
  const displayMessage = message || config.defaultMessage;

  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        {/* Icon */}
        <div className={`${config.bgColor} w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6`}>
          <Icon className={`w-10 h-10 ${config.iconColor}`} />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
          {displayTitle}
        </h2>

        {/* Message */}
        <p className="text-gray-600 text-center mb-8">
          {displayMessage}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </button>
          )}

          {showHomeButton && (
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </button>
          )}

          {customAction && (
            <button
              onClick={customAction.onClick}
              className="inline-flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              {customAction.label}
            </button>
          )}
        </div>

        {/* Additional Help */}
        {type === '403' && (
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Need Help?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Make sure you're logged in with the correct account</li>
              <li>• Your session may have expired - try logging out and back in</li>
              <li>• Contact your system administrator for access</li>
            </ul>
          </div>
        )}

        {type === 'network' && (
          <div className="mt-8 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <h3 className="text-sm font-semibold text-orange-900 mb-2">Troubleshooting</h3>
            <ul className="text-sm text-orange-800 space-y-1">
              <li>• Check your internet connection</li>
              <li>• Make sure the server is running</li>
              <li>• Try refreshing the page</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;
