import React from 'react';

// Spinner Loading
export const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizes[size]}`}></div>
    </div>
  );
};

// Skeleton Loading
export const SkeletonLoader = ({ lines = 3, className = '' }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {[...Array(lines)].map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  );
};

// Card Skeleton
export const CardSkeleton = ({ count = 1, className = '' }) => {
  return (
    <div className={`grid gap-4 ${className}`}>
      {[...Array(count)].map((_, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      ))}
    </div>
  );
};

// Table Skeleton
export const TableSkeleton = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {[...Array(columns)].map((_, index) => (
              <th key={index} className="px-6 py-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {[...Array(rows)].map((_, rowIndex) => (
            <tr key={rowIndex}>
              {[...Array(columns)].map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Full Page Loading
export const PageLoader = ({ message = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
      <div className="text-center">
        <LoadingSpinner size="xl" />
        <p className="mt-4 text-gray-600 text-lg">{message}</p>
      </div>
    </div>
  );
};

// Button Loading
export const ButtonLoader = () => {
  return (
    <div className="inline-flex items-center">
      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Loading...
    </div>
  );
};

// Inline Loading
export const InlineLoader = ({ text = 'Loading' }) => {
  return (
    <div className="flex items-center space-x-2 text-gray-600">
      <LoadingSpinner size="sm" />
      <span>{text}</span>
    </div>
  );
};

// Progress Bar
export const ProgressBar = ({ progress = 0, showPercentage = true, className = '' }) => {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-1">
        {showPercentage && (
          <span className="text-sm font-medium text-gray-700">{Math.round(progress)}%</span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(progress, 100)}%` }}
        ></div>
      </div>
    </div>
  );
};

// Dots Loading
export const DotsLoader = ({ className = '' }) => {
  return (
    <div className={`flex space-x-2 ${className}`}>
      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
  );
};

export default {
  LoadingSpinner,
  SkeletonLoader,
  CardSkeleton,
  TableSkeleton,
  PageLoader,
  ButtonLoader,
  InlineLoader,
  ProgressBar,
  DotsLoader
};
