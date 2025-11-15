import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DocumentArrowDownIcon, EyeIcon } from '@heroicons/react/24/outline';
import DataTable from '../../../components/shared/DataTable';
import StatusBadge from '../../../components/shared/StatusBadge';
import { LoadingSpinner } from '../../../components/shared/LoadingStates';
import { getSyncHistory } from '../../../services/api/inventorySyncApi';

const SyncHistory = ({ supplierId }) => {
  const [selectedLog, setSelectedLog] = useState(null);

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['syncHistory', supplierId],
    queryFn: () => getSyncHistory(supplierId),
  });

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const exportHistory = () => {
    let csv = 'Date,Supplier,Status,Items Synced,Duration,Added,Updated,Deleted,Errors\n';
    history.forEach(log => {
      csv += `${formatDate(log.startTime)},${log.supplierName},${log.status},${log.itemsSynced},${formatDuration(log.duration)},${log.itemsAdded},${log.itemsUpdated},${log.itemsDeleted},${log.errors}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sync_history_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const columns = [
    {
      key: 'startTime',
      label: 'Date & Time',
      render: (log) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">{formatDate(log.startTime)}</div>
          <div className="text-gray-500">Duration: {formatDuration(log.duration)}</div>
        </div>
      )
    },
    {
      key: 'supplier',
      label: 'Supplier',
      render: (log) => (
        <div className="text-sm font-medium text-gray-900">{log.supplierName}</div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (log) => <StatusBadge status={log.status} />
    },
    {
      key: 'items',
      label: 'Items Synced',
      render: (log) => (
        <div className="text-sm">
          <div className="font-semibold text-gray-900">{log.itemsSynced} total</div>
          <div className="text-xs text-gray-500 mt-1">
            <span className="text-green-600">+{log.itemsAdded}</span>
            {' • '}
            <span className="text-blue-600">{log.itemsUpdated} updated</span>
            {' • '}
            <span className="text-red-600">-{log.itemsDeleted}</span>
          </div>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Sync Type',
      render: (log) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          log.syncType === 'manual' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
        }`}>
          {log.syncType}
        </span>
      )
    },
    {
      key: 'errors',
      label: 'Errors',
      render: (log) => (
        <span className={`font-semibold ${log.errors > 0 ? 'text-red-600' : 'text-green-600'}`}>
          {log.errors > 0 ? log.errors : '✓'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (log) => (
        <button
          onClick={() => setSelectedLog(log)}
          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
          title="View Details"
        >
          <EyeIcon className="w-4 h-4" />
        </button>
      )
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Sync History</h3>
          <p className="text-sm text-gray-600 mt-1">{history.length} sync operations recorded</p>
        </div>
        <button
          onClick={exportHistory}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <DocumentArrowDownIcon className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* History Table */}
      <DataTable
        columns={columns}
        data={history}
        searchable={false}
        sortable={true}
        pagination={true}
        pageSize={10}
      />

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Sync Details</h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Supplier</p>
                  <p className="font-semibold text-gray-900">{selectedLog.supplierName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <StatusBadge status={selectedLog.status} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Start Time</p>
                  <p className="font-semibold text-gray-900">{formatDate(selectedLog.startTime)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-semibold text-gray-900">{formatDuration(selectedLog.duration)}</p>
                </div>
              </div>

              {/* Statistics */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Statistics</h4>
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">Total Items</p>
                    <p className="text-xl font-bold text-gray-900">{selectedLog.itemsSynced}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-green-600">Added</p>
                    <p className="text-xl font-bold text-green-900">{selectedLog.itemsAdded}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-600">Updated</p>
                    <p className="text-xl font-bold text-blue-900">{selectedLog.itemsUpdated}</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="text-xs text-red-600">Deleted</p>
                    <p className="text-xl font-bold text-red-900">{selectedLog.itemsDeleted}</p>
                  </div>
                </div>
              </div>

              {/* Error Details */}
              {selectedLog.errorDetails && selectedLog.errorDetails.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Errors ({selectedLog.errors})</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedLog.errorDetails.map((error, index) => (
                      <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
                        <p className="font-medium text-red-900">{error.message}</p>
                        {error.item && (
                          <p className="text-red-700 mt-1">Item: {error.item}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedLog.notes && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Notes</h4>
                  <p className="text-sm text-gray-600">{selectedLog.notes}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyncHistory;
