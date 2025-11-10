import { UserCircleIcon } from '@heroicons/react/24/outline';

const SupplierProfile = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your supplier profile and settings
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white shadow rounded-lg border border-gray-200">
        <div className="px-6 py-12 text-center">
          <UserCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Profile Management
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Profile editing features coming soon
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <span className="font-medium">Coming Soon:</span> Complete profile management with company details, 
          contact information, document uploads, and preference settings.
        </p>
      </div>
    </div>
  );
};

export default SupplierProfile;
