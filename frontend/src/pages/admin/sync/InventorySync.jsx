import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowPathIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { LoadingSpinner, ButtonLoader } from '../../../components/shared/LoadingStates';
import StatusBadge from '../../../components/shared/StatusBadge';
import SyncHistory from './SyncHistory';
import ConflictResolver from './ConflictResolver';
import SyncScheduler from './SyncScheduler';
import ErrorLog from './ErrorLog';
import { 
  getSyncStatus, 
  triggerManualSync, 
  getSyncSuppliers 
} from '../../../services/api/inventorySyncApi';

const InventorySync = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview'); // overview, history, conflicts, schedule, errors
  const [selectedSupplier, setSelectedSupplier] = useState('all');

  // Fetch sync status
  const { data: syncStatus, isLoading } = useQuery({
    queryKey: ['syncStatus', selectedSupplier],
    queryFn: () => getSyncStatus(selectedSupplier),
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch suppliers
  const { data: suppliers = [] } = useQuery({
    queryKey: ['syncSuppliers'],
    queryFn: getSyncSuppliers
  });

  // Manual sync mutation
  const syncMutation = useMutation({
    mutationFn: (supplierId) => triggerManualSync(supplierId),
    onSuccess: () => {
      queryClient.invalidateQueries(['syncStatus']);
      queryClient.invalidateQueries(['syncHistory']);
      alert('Sync triggered successfully! Check history for progress.');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to trigger sync');
    }
  });

  const handleManualSync = (supplierId) => {
    if (window.confirm(`Trigger manual sync for ${supplierId === 'all' ? 'all suppliers' : 'selected supplier'}?`)) {
      syncMutation.mutate(supplierId);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate stats
  const stats = syncStatus ? [
    {
      label: 'Active Suppliers',
      value: syncStatus.activeSuppliers || 0,
      icon: '🏢',
      color: 'blue'
    },
    {
      label: 'Last Sync',
      value: formatDate(syncStatus.lastSyncTime),
      icon: '⏱️',
      color: 'green'
    },
    {
      label: 'Items Synced',
      value: syncStatus.totalItemsSynced || 0,
      icon: '📦',
      color: 'purple'
    },
    {
      label: 'Conflicts',
      value: syncStatus.pendingConflicts || 0,
      icon: '⚠️',
      color: 'orange'
    }
  ] : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Sync Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Monitor and manage supplier inventory synchronization
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('schedule')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            <Cog6ToothIcon className="w-4 h-4" />
            Configure
          </button>
          <button
            onClick={() => handleManualSync(selectedSupplier)}
            disabled={syncMutation.isPending || syncStatus?.isSyncing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-4 h-4 ${(syncMutation.isPending || syncStatus?.isSyncing) ? 'animate-spin' : ''}`} />
            {syncMutation.isPending || syncStatus?.isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{stat.label}</span>
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Active Sync Status */}
      {syncStatus?.isSyncing && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <ArrowPathIcon className="w-5 h-5 text-blue-600 animate-spin" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900">Sync in Progress</h3>
              <p className="text-sm text-blue-700 mt-1">
                {syncStatus.currentSupplier} - {syncStatus.progress || 0}% complete
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-600">{syncStatus.itemsProcessed || 0} / {syncStatus.totalItems || 0} items</p>
            </div>
          </div>
          <div className="mt-3 w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${syncStatus.progress || 0}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supplier
            </label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Suppliers</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name} ({supplier.itemCount} items)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Auto-Sync Status
            </label>
            <div className="flex items-center gap-2 h-10">
              <StatusBadge status={syncStatus?.autoSyncEnabled ? 'active' : 'inactive'} />
              <span className="text-sm text-gray-600">
                {syncStatus?.autoSyncEnabled ? `Every ${syncStatus.syncFrequency}` : 'Disabled'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Next Scheduled Sync
            </label>
            <div className="flex items-center gap-2 h-10">
              <ClockIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-900">{formatDate(syncStatus?.nextSyncTime)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Supplier Status Grid */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Supplier Sync Status</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              {suppliers.map(supplier => (
                <div
                  key={supplier.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{supplier.name}</h4>
                      <p className="text-sm text-gray-600">{supplier.itemCount} items</p>
                    </div>
                    <StatusBadge status={supplier.syncStatus} />
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Last Sync:</span>
                      <span className="font-medium text-gray-900">{formatDate(supplier.lastSyncTime)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Success Rate:</span>
                      <span className="font-medium text-green-600">{supplier.successRate || 0}%</span>
                    </div>
                    {supplier.pendingConflicts > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Conflicts:</span>
                        <span className="font-medium text-orange-600">{supplier.pendingConflicts}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleManualSync(supplier.id)}
                    disabled={syncMutation.isPending}
                    className="mt-3 w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Sync Now
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-4 pt-6 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-4 pt-6 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'history'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Sync History
            </button>
            <button
              onClick={() => setActiveTab('conflicts')}
              className={`pb-4 pt-6 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'conflicts'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Conflicts {syncStatus?.pendingConflicts > 0 && `(${syncStatus.pendingConflicts})`}
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`pb-4 pt-6 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'schedule'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Schedule
            </button>
            <button
              onClick={() => setActiveTab('errors')}
              className={`pb-4 pt-6 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'errors'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Error Log
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'history' && <SyncHistory supplierId={selectedSupplier} />}
          {activeTab === 'conflicts' && <ConflictResolver supplierId={selectedSupplier} />}
          {activeTab === 'schedule' && <SyncScheduler />}
          {activeTab === 'errors' && <ErrorLog supplierId={selectedSupplier} />}
        </div>
      </div>
    </div>
  );
};

export default InventorySync;
