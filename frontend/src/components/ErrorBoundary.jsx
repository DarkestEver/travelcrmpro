import React from 'react';
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }

    // Update state with error details
    this.setState({
      error,
      errorInfo,
      errorCount: this.state.errorCount + 1,
    });

    // Send error to logging service (e.g., Sentry, LogRocket)
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Call custom reset handler if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          resetError: this.handleReset,
        });
      }

      // Default fallback UI
      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorCount={this.state.errorCount}
          onReset={this.handleReset}
          showDetails={this.props.showDetails !== false}
        />
      );
    }

    return this.props.children;
  }
}

// Default Error Fallback UI
const DefaultErrorFallback = ({ error, errorInfo, errorCount, onReset, showDetails }) => {
  const [showStackTrace, setShowStackTrace] = React.useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <FiAlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        {/* Error Message */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Oops! Something went wrong
          </h1>
          <p className="text-gray-600">
            We're sorry for the inconvenience. The application encountered an unexpected error.
          </p>
        </div>

        {/* Error Details */}
        {showDetails && error && (
          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-mono text-red-800 break-all">
                {error.toString()}
              </p>
            </div>

            {/* Stack Trace Toggle */}
            {errorInfo && (
              <div className="mt-4">
                <button
                  onClick={() => setShowStackTrace(!showStackTrace)}
                  className="text-sm text-blue-500 hover:text-blue-600 font-medium"
                >
                  {showStackTrace ? 'Hide' : 'Show'} technical details
                </button>

                {showStackTrace && (
                  <div className="mt-2 bg-gray-100 border border-gray-300 rounded-lg p-4 max-h-64 overflow-auto">
                    <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Error Count Warning */}
        {errorCount > 1 && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Warning:</strong> This error has occurred {errorCount} times. 
              If the problem persists, please refresh the page or contact support.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onReset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            <FiRefreshCw className="w-5 h-5" />
            Try Again
          </button>

          <button
            onClick={() => window.location.href = '/'}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            <FiHome className="w-5 h-5" />
            Go to Home
          </button>
        </div>

        {/* Support Contact */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            Need help? Contact our support team at{' '}
            <a 
              href="mailto:support@travelcrm.com" 
              className="text-blue-500 hover:text-blue-600 font-medium"
            >
              support@travelcrm.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

// Smaller error boundary for components
export const ComponentErrorBoundary = ({ children, fallback }) => {
  return (
    <ErrorBoundary
      fallback={fallback || ComponentErrorFallback}
      showDetails={false}
    >
      {children}
    </ErrorBoundary>
  );
};

// Minimal fallback for component errors
const ComponentErrorFallback = ({ error, resetError }) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <FiAlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-red-900 mb-1">
            Failed to load component
          </h4>
          <p className="text-sm text-red-700 mb-3">
            {error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={resetError}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
};

// Async error boundary for lazy-loaded components
export const AsyncErrorBoundary = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <FiAlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Failed to load page
            </h2>
            <p className="text-gray-600 mb-4">
              {error?.message || 'This page could not be loaded.'}
            </p>
            <button
              onClick={resetError}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Reload Page
            </button>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
};

// Hook to manually report errors
export const useErrorHandler = () => {
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return setError;
};

export default ErrorBoundary;