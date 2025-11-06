import ErrorDisplay from './ErrorDisplay';

/**
 * ApiErrorBoundary Component
 * Wraps content and shows error display when error occurs
 */
const ApiErrorBoundary = ({ 
  error, 
  loading, 
  onRetry,
  children,
  showHomeButton = true,
  loadingComponent = null
}) => {
  // Show loading state
  if (loading && !error) {
    return loadingComponent || (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !loading) {
    return (
      <ErrorDisplay
        type={error.type || 'general'}
        message={error.message}
        onRetry={onRetry}
        showHomeButton={showHomeButton}
      />
    );
  }

  // Show content
  return <>{children}</>;
};

export default ApiErrorBoundary;
