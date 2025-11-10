import { useState } from 'react';
import { CubeIcon, PlusIcon } from '@heroicons/react/24/outline';

const SupplierInventory = () => {
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all', name: 'All Services' },
    { id: 'hotels', name: 'Hotels' },
    { id: 'activities', name: 'Activities' },
    { id: 'transport', name: 'Transportation' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Inventory</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your service offerings and availability
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
          <PlusIcon className="h-5 w-5" />
          Add Service
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Empty State */}
      <div className="bg-white shadow rounded-lg border border-gray-200">
        <div className="px-6 py-12 text-center">
          <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No services yet
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first service to the inventory
          </p>
          <div className="mt-6">
            <button className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700">
              <PlusIcon className="h-5 w-5" />
              Add Service
            </button>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <span className="font-medium">Coming Soon:</span> Full inventory management functionality is under development. 
          You'll be able to add hotels, activities, transportation services, manage pricing, and set availability calendars.
        </p>
      </div>
    </div>
  );
};

export default SupplierInventory;
