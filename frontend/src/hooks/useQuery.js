import { useQuery as useReactQuery } from '@tanstack/react-query';

/**
 * Custom useQuery hook with automatic error type detection
 * Wraps react-query's useQuery and adds error type classification
 */
export const useQuery = (options) => {
  const result = useReactQuery(options);
  
  // Add error type classification
  if (result.error) {
    let errorType = 'general';
    let errorMessage = 'An unexpected error occurred';
    
    if (result.error.response) {
      const status = result.error.response.status;
      errorMessage = result.error.response.data?.message || errorMessage;
      
      if (status === 403 || status === 401) {
        errorType = '403';
      } else if (status === 404) {
        errorType = '404';
      } else if (status >= 500) {
        errorType = '500';
      }
    } else if (result.error.request) {
      errorType = 'network';
      errorMessage = 'Unable to connect to the server';
    }
    
    result.errorType = errorType;
    result.errorMessage = errorMessage;
  }
  
  return result;
};

export default useQuery;
