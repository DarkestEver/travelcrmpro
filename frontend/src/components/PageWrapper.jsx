import ErrorDisplay from './ErrorDisplay';

/**
 * PageWrapper Component
 * Automatically handles loading and error states for pages
 * Usage:
 * <PageWrapper loading={isLoading} error={error} onRetry={refetch}>
 *   <YourPageContent />
 * </PageWrapper>
 */
const PageWrapper = ({ 
  loading, 
  error,
  errorType,
  errorMessage,
  onRetry,
  children,
  showHomeButton = true,
  minHeight = '400px'
}) => {
  // Show error if present
  if (error && !loading) {
    // Determine error type
    let displayErrorType = errorType || 'general';
    let displayMessage = errorMessage || 'An unexpected error occurred';
    
    if (error.response) {
      const status = error.response.status;
      displayMessage = error.response.data?.message || displayMessage;
      
      if (status === 403 || status === 401) {
        displayErrorType = '403';
      } else if (status === 404) {
        displayErrorType = '404';
      } else if (status >= 500) {
        displayErrorType = '500';
      }
    } else if (error.request) {
      displayErrorType = 'network';
      displayMessage = 'Unable to connect to the server';
    } else if (error.message) {
      displayMessage = error.message;
    }
    
    return (
      <div style={{ minHeight }}>
        <ErrorDisplay
          type={displayErrorType}
          message={displayMessage}
          onRetry={onRetry}
          showHomeButton={showHomeButton}
        />
      </div>
    );
  }

  // Show loading
  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show content
  return <>{children}</>;
};

export default PageWrapper;
