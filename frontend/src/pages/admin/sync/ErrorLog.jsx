import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { DataTable, StatusBadge } from '../../../components/shared';
import { LoadingSpinner } from '../../../components/shared/LoadingStates';
import { getSyncErrors, retrySyncOperation, clearResolvedErrors } from '../../../services/api/inventorySyncApi';

const ErrorLog = ({ supplierId = null }) => {
  const queryClient = useQueryClient();
  const [selectedError, setSelectedError] = useState(null);

  const { data: errors = [], isLoading } = useQuery({
    queryKey: ['syncErrors', supplierId],
    queryFn: () => getSyncErrors(supplierId),
    refetchInterval: 60000, // Refresh every minute
  });

  const retryMutation = useMutation({
    mutationFn: (errorId) => retrySyncOperation(errorId),
    onSuccess: () => {
      queryClient.invalidateQueries(['syncErrors']);
      queryClient.invalidateQueries(['syncStatus']);
      alert('Retry initiated successfully!');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to retry operation');
    }
  });

  const clearMutation = useMutation({
    mutationFn: () => clearResolvedErrors(supplierId),
    onSuccess: () => {
      queryClient.invalidateQueries(['syncErrors']);
      alert('Resolved errors cleared successfully!');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to clear errors');
    }
  });

  const handleRetry = (errorId) => {
    if (window.confirm('Retry this failed sync operation?')) {
      retryMutation.mutate(errorId);
    }
  };

  const handleClearResolved = () => {
    if (window.confirm('Clear all resolved errors from the log?')) {
      clearMutation.mutate();
    }
  };

  const handleExportCSV = () => {
    if (errors.length === 0) return;

    const headers = ['Timestamp', 'Supplier', 'Error Type', 'Severity', 'Message', 'Operation', 'Status', 'Retries'];
    const rows = errors.map(error => [
      new Date(error.timestamp).toLocaleString(),
      error.supplier?.name || 'N/A',
      error.errorType,
      error.severity,
      error.message,
      error.operation || 'N/A',
      error.status,
      error.retryCount || 0
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sync-errors-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'text-red-600 bg-red-100',
      error: 'text-orange-600 bg-orange-100',
      warning: 'text-yellow-600 bg-yellow-100',
      info: 'text-blue-600 bg-blue-100'
    };
    return colors[severity] || colors.error;
  };

  const columns = [
    {
      key: 'timestamp',
      label: 'Timestamp',
      render: (error) => (
        <div className="text-sm">
          <div className="text-gray-900">{new Date(error.timestamp).toLocaleDateString()}</div>
          <div className="text-gray-500">{new Date(error.timestamp).toLocaleTimeString()}</div>
        </div>
      )
    },
    {
      key: 'supplier',
      label: 'Supplier',
      render: (error) => (
        <div className="text-sm font-medium text-gray-900">
          {error.supplier?.name || 'Unknown'}
        </div>
      )
    },
    {
      key: 'severity',
      label: 'Severity',
      render: (error) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(error.severity)}`}>
          {error.severity.toUpperCase()}
        </span>
      )
    },
    {
      key: 'errorType',
      label: 'Error Type',
      render: (error) => (
        <div className="text-sm text-gray-900">{error.errorType}</div>
      )
    },
    {
      key: 'message',
      label: 'Error Message',
      render: (error) => (
        <div className="text-sm text-gray-700 max-w-md truncate" title={error.message}>
          {error.message}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (error) => (
        <StatusBadge status={error.status} />
      )
    },
    {
      key: 'retries',
      label: 'Retries',
      render: (error) => (
        <div className="text-sm text-gray-900 text-center">
          {error.retryCount || 0}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (error) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedError(error)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Details
          </button>
          {error.status === 'failed' && (
            <button
              onClick={() => handleRetry(error._id)}
              disabled={retryMutation.isPending}
              className="text-orange-600 hover:text-orange-700 text-sm font-medium disabled:opacity-50"
            >
              Retry
            </button>
          )}
        </div>
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ExclamationTriangleIcon className="w-6 h-6 text-orange-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Error Log</h2>
            <p className="text-sm text-gray-600">
              {errors.length} error{errors.length !== 1 ? 's' : ''} recorded
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={errors.length === 0}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Export CSV
          </button>
          <button
            onClick={handleClearResolved}
            disabled={clearMutation.isPending || errors.filter(e => e.status === 'resolved').length === 0}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {clearMutation.isPending ? (
              <ArrowPathIcon className="w-4 h-4 animate-spin" />
            ) : (
              'Clear Resolved'
            )}
          </button>
        </div>
      </div>

      {/* Error Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-2xl font-bold text-red-900">
            {errors.filter(e => e.severity === 'critical').length}
          </div>
          <div className="text-sm text-red-700">Critical Errors</div>
        </div>
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="text-2xl font-bold text-orange-900">
            {errors.filter(e => e.status === 'failed').length}
          </div>
          <div className="text-sm text-orange-700">Failed Operations</div>
        </div>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-2xl font-bold text-yellow-900">
            {errors.filter(e => e.status === 'retrying').length}
          </div>
          <div className="text-sm text-yellow-700">Retrying</div>
        </div>
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-2xl font-bold text-green-900">
            {errors.filter(e => e.status === 'resolved').length}
          </div>
          <div className="text-sm text-green-700">Resolved</div>
        </div>
      </div>

      {/* Error Table */}
      {errors.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <ExclamationTriangleIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No sync errors recorded</p>
        </div>
      ) : (
        <DataTable columns={columns} data={errors} />
      )}

      {/* Error Detail Modal */}
      {selectedError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Error Details</h3>
                <button
                  onClick={() => setSelectedError(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timestamp</label>
                <div className="text-sm text-gray-900">
                  {new Date(selectedError.timestamp).toLocaleString()}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                <div className="text-sm text-gray-900">
                  {selectedError.supplier?.name || 'Unknown'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(selectedError.severity)}`}>
                    {selectedError.severity.toUpperCase()}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <StatusBadge status={selectedError.status} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Error Type</label>
                <div className="text-sm text-gray-900">{selectedError.errorType}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Error Message</label>
                <div className="text-sm text-gray-900 p-3 bg-red-50 border border-red-200 rounded-lg">
                  {selectedError.message}
                </div>
              </div>

              {selectedError.operation && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Operation</label>
                  <div className="text-sm text-gray-900">{selectedError.operation}</div>
                </div>
              )}

              {selectedError.stackTrace && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stack Trace</label>
                  <pre className="text-xs text-gray-700 p-3 bg-gray-50 border border-gray-200 rounded-lg overflow-x-auto">
                    {selectedError.stackTrace}
                  </pre>
                </div>
              )}

              {selectedError.retryCount > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Retry Attempts</label>
                  <div className="text-sm text-gray-900">
                    {selectedError.retryCount} {selectedError.retryCount === 1 ? 'attempt' : 'attempts'}
                  </div>
                </div>
              )}

              {selectedError.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <div className="text-sm text-gray-900">{selectedError.notes}</div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              {selectedError.status === 'failed' && (
                <button
                  onClick={() => {
                    handleRetry(selectedError._id);
                    setSelectedError(null);
                  }}
                  disabled={retryMutation.isPending}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                >
                  Retry Operation
                </button>
              )}
              <button
                onClick={() => setSelectedError(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
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

export default ErrorLog;
