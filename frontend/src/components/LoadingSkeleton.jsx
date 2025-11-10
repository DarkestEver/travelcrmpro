// Loading Skeleton Components for Travel CRM

// Table Skeleton
export const TableSkeleton = ({ rows = 5, columns = 5 }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Table Header */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-4 p-4">
          {[...Array(columns)].map((_, i) => (
            <div
              key={i}
              className="h-4 bg-gray-200 rounded animate-pulse"
              style={{ width: `${100 / columns}%` }}
            />
          ))}
        </div>
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-gray-200">
        {[...Array(rows)].map((_, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-4 p-4">
            {[...Array(columns)].map((_, colIndex) => (
              <div
                key={colIndex}
                className="h-4 bg-gray-200 rounded animate-pulse"
                style={{
                  width: `${100 / columns}%`,
                  animationDelay: `${(rowIndex + colIndex) * 0.05}s`
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// Card Skeleton
export const CardSkeleton = ({ count = 1 }) => {
  return (
    <>
      {[...Array(count)].map((_, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow-sm p-6"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse" />
            <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
          </div>

          {/* Content */}
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse" />
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <div className="h-8 bg-gray-200 rounded w-24 animate-pulse" />
              <div className="h-8 bg-gray-200 rounded w-24 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

// Form Skeleton
export const FormSkeleton = ({ fields = 5 }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="space-y-6">
        {[...Array(fields)].map((_, index) => (
          <div key={index} style={{ animationDelay: `${index * 0.05}s` }}>
            {/* Label */}
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2 animate-pulse" />
            
            {/* Input */}
            <div className="h-10 bg-gray-200 rounded w-full animate-pulse" />
          </div>
        ))}

        {/* Buttons */}
        <div className="flex items-center gap-4 pt-4">
          <div className="h-10 bg-gray-200 rounded w-24 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded w-24 animate-pulse" />
        </div>
      </div>
    </div>
  );
};

// Dashboard Widget Skeleton
export const DashboardWidgetSkeleton = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(count)].map((_, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow-sm p-6"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          {/* Icon */}
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
          </div>

          {/* Value */}
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
          
          {/* Label */}
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
        </div>
      ))}
    </div>
  );
};

// Profile Skeleton
export const ProfileSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 h-32" />

      <div className="px-6 pb-6">
        {/* Avatar */}
        <div className="flex items-end -mt-16 mb-6">
          <div className="h-32 w-32 bg-gray-200 rounded-full border-4 border-white animate-pulse" />
          <div className="ml-4 pb-2">
            <div className="h-6 bg-gray-200 rounded w-48 mb-2 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded w-24 animate-pulse" />
          ))}
        </div>

        {/* Content */}
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// List Item Skeleton
export const ListItemSkeleton = ({ count = 5 }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm divide-y divide-gray-200">
      {[...Array(count)].map((_, index) => (
        <div
          key={index}
          className="p-4 flex items-center gap-4"
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          {/* Avatar/Icon */}
          <div className="h-12 w-12 bg-gray-200 rounded-full flex-shrink-0 animate-pulse" />

          {/* Content */}
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
            <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
          </div>

          {/* Action */}
          <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
};

// Chart Skeleton
export const ChartSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Title */}
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-6 animate-pulse" />

      {/* Chart Area */}
      <div className="h-64 bg-gray-100 rounded flex items-end gap-2 p-4">
        {[...Array(12)].map((_, index) => (
          <div
            key={index}
            className="flex-1 bg-gray-200 rounded-t animate-pulse"
            style={{
              height: `${Math.random() * 100}%`,
              animationDelay: `${index * 0.1}s`
            }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-3 w-3 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
};

// Page Header Skeleton
export const PageHeaderSkeleton = () => {
  return (
    <div className="mb-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4">
        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
        <span className="text-gray-400">/</span>
        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
      </div>

      {/* Title & Actions */}
      <div className="flex items-center justify-between">
        <div className="h-8 bg-gray-200 rounded w-64 animate-pulse" />
        <div className="flex items-center gap-2">
          <div className="h-10 bg-gray-200 rounded w-24 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
        </div>
      </div>

      {/* Description */}
      <div className="h-4 bg-gray-200 rounded w-96 mt-2 animate-pulse" />
    </div>
  );
};

// Full Page Loading
export const PageLoadingSkeleton = () => {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeaderSkeleton />
      <DashboardWidgetSkeleton />
      <TableSkeleton />
    </div>
  );
};

// Spinner (for inline loading)
export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
    xl: 'h-16 w-16 border-4'
  };

  return (
    <div
      className={`inline-block animate-spin rounded-full border-blue-600 border-t-transparent ${sizes[size]} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// Button Loading State
export const ButtonSpinner = () => {
  return (
    <svg
      className="animate-spin h-5 w-5 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

export default {
  TableSkeleton,
  CardSkeleton,
  FormSkeleton,
  DashboardWidgetSkeleton,
  ProfileSkeleton,
  ListItemSkeleton,
  ChartSkeleton,
  PageHeaderSkeleton,
  PageLoadingSkeleton,
  Spinner,
  ButtonSpinner
};
