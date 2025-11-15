// Skeleton loading components for better UX

// Base skeleton component
export const Skeleton = ({ className = '', width, height, variant = 'rect' }) => {
  const variantClasses = {
    rect: 'rounded',
    circle: 'rounded-full',
    text: 'rounded h-4',
  };

  return (
    <div
      className={`animate-pulse bg-gray-200 ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
    ></div>
  );
};

// Table skeleton
export const TableSkeleton = ({ rows = 5, columns = 5 }) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50 p-4">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="flex-1">
              <Skeleton height="20px" />
            </div>
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="flex gap-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div key={colIndex} className="flex-1">
                  <Skeleton height="16px" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Card skeleton
export const CardSkeleton = ({ count = 1 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton width="60px" height="16px" />
            <Skeleton variant="circle" width="40px" height="40px" />
          </div>
          <Skeleton width="80px" height="32px" className="mb-2" />
          <Skeleton width="120px" height="14px" />
        </div>
      ))}
    </div>
  );
};

// Form skeleton
export const FormSkeleton = ({ fields = 6 }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <Skeleton width="200px" height="28px" className="mb-6" />
      
      <div className="space-y-6">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i}>
            <Skeleton width="120px" height="16px" className="mb-2" />
            <Skeleton width="100%" height="40px" />
          </div>
        ))}
      </div>

      <div className="flex gap-4 mt-8">
        <Skeleton width="100px" height="40px" />
        <Skeleton width="100px" height="40px" />
      </div>
    </div>
  );
};

// Profile skeleton
export const ProfileSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-6 mb-8">
        <Skeleton variant="circle" width="100px" height="100px" />
        <div className="flex-1">
          <Skeleton width="200px" height="24px" className="mb-2" />
          <Skeleton width="150px" height="16px" className="mb-2" />
          <Skeleton width="180px" height="16px" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <Skeleton width="100px" height="14px" className="mb-2" />
            <Skeleton width="100%" height="40px" />
          </div>
        ))}
      </div>
    </div>
  );
};

// Dashboard skeleton
export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <CardSkeleton count={4} />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <Skeleton width="150px" height="20px" className="mb-4" />
          <Skeleton width="100%" height="300px" />
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <Skeleton width="150px" height="20px" className="mb-4" />
          <Skeleton width="100%" height="300px" />
        </div>
      </div>

      {/* Table */}
      <TableSkeleton rows={5} columns={4} />
    </div>
  );
};

// List skeleton
export const ListSkeleton = ({ items = 5 }) => {
  return (
    <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="p-4">
          <div className="flex items-center gap-4">
            <Skeleton variant="circle" width="48px" height="48px" />
            <div className="flex-1">
              <Skeleton width="60%" height="16px" className="mb-2" />
              <Skeleton width="40%" height="14px" />
            </div>
            <Skeleton width="80px" height="32px" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Timeline skeleton
export const TimelineSkeleton = ({ items = 5 }) => {
  return (
    <div className="space-y-6">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton variant="circle" width="40px" height="40px" />
          <div className="flex-1">
            <Skeleton width="40%" height="16px" className="mb-2" />
            <Skeleton width="80%" height="14px" className="mb-2" />
            <Skeleton width="60%" height="12px" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Page skeleton (full page)
export const PageSkeleton = ({ type = 'table' }) => {
  const skeletons = {
    table: <TableSkeleton />,
    form: <FormSkeleton />,
    dashboard: <DashboardSkeleton />,
    profile: <ProfileSkeleton />,
    list: <ListSkeleton />,
  };

  return (
    <div className="p-6">
      {/* Page header */}
      <div className="mb-6">
        <Skeleton width="200px" height="32px" className="mb-2" />
        <Skeleton width="300px" height="16px" />
      </div>

      {/* Search and filter bar */}
      <div className="flex gap-4 mb-6">
        <Skeleton width="300px" height="40px" />
        <Skeleton width="120px" height="40px" />
        <Skeleton width="120px" height="40px" />
      </div>

      {/* Content */}
      {skeletons[type] || skeletons.table}
    </div>
  );
};

// Chart skeleton
export const ChartSkeleton = ({ height = '300px' }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton width="150px" height="20px" />
        <Skeleton width="100px" height="32px" />
      </div>
      <Skeleton width="100%" height={height} />
    </div>
  );
};

// Modal skeleton
export const ModalSkeleton = () => {
  return (
    <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
      <Skeleton width="200px" height="24px" className="mb-6" />
      
      <div className="space-y-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <Skeleton width="100px" height="14px" className="mb-2" />
            <Skeleton width="100%" height="40px" />
          </div>
        ))}
      </div>

      <div className="flex gap-4 justify-end">
        <Skeleton width="80px" height="36px" />
        <Skeleton width="80px" height="36px" />
      </div>
    </div>
  );
};

export default {
  Skeleton,
  TableSkeleton,
  CardSkeleton,
  FormSkeleton,
  ProfileSkeleton,
  DashboardSkeleton,
  ListSkeleton,
  TimelineSkeleton,
  PageSkeleton,
  ChartSkeleton,
  ModalSkeleton,
};
