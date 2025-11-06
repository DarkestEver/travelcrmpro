import { useState, useCallback } from 'react';

/**
 * Custom hook for API calls with automatic error handling
 * Returns data, loading, error state, and a function to make the API call
 */
const useApiCall = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (apiFunction, ...args) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFunction(...args);
      setData(response.data);
      return response.data;
    } catch (err) {
      console.error('API call error:', err);
      
      // Determine error type
      let errorType = 'general';
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (err.response) {
        // Server responded with error status
        const status = err.response.status;
        errorMessage = err.response.data?.message || errorMessage;
        
        if (status === 403) {
          errorType = '403';
          errorMessage = err.response.data?.message || 'You don\'t have permission to access this resource.';
        } else if (status === 401) {
          errorType = '403'; // Treat 401 as 403 for display purposes
          errorMessage = 'Your session has expired. Please log in again.';
        } else if (status === 404) {
          errorType = '404';
          errorMessage = 'The requested resource was not found.';
        } else if (status >= 500) {
          errorType = '500';
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (err.request) {
        // Request made but no response
        errorType = 'network';
        errorMessage = 'Unable to connect to the server. Please check your connection.';
      }
      
      setError({ type: errorType, message: errorMessage, originalError: err });
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset
  };
};

export default useApiCall;
