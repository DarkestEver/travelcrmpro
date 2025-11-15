import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { LoadingSpinner, ButtonLoader } from '../../../components/shared/LoadingStates';
import { getSyncConflicts, resolveConflict } from '../../../services/api/inventorySyncApi';

const ConflictResolver = ({ supplierId }) => {
  const queryClient = useQueryClient();
  const [expandedConflict, setExpandedConflict] = useState(null);

  const { data: conflicts = [], isLoading } = useQuery({
    queryKey: ['syncConflicts', supplierId],
    queryFn: () => getSyncConflicts(supplierId),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ conflictId, resolution, value }) => resolveConflict(conflictId, resolution, value),
    onSuccess: () => {
      queryClient.invalidateQueries(['syncConflicts']);
      queryClient.invalidateQueries(['syncStatus']);
      alert('Conflict resolved successfully!');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to resolve conflict');
    }
  });

  const handleResolve = (conflictId, resolution, value = null) => {
    resolveMutation.mutate({ conflictId, resolution, value });
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (conflicts.length === 0) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No conflicts to resolve</p>
        <p className="text-sm text-gray-400 mt-1">All syncs completed successfully</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Sync Conflicts</h3>
          <p className="text-sm text-gray-600 mt-1">{conflicts.length} conflicts require attention</p>
        </div>
      </div>

      {/* Conflicts List */}
      {conflicts.map((conflict) => {
        const isExpanded = expandedConflict === conflict.id;

        return (
          <div
            key={conflict.id}
            className="p-4 bg-orange-50 border border-orange-200 rounded-lg"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3 flex-1">
                <ExclamationTriangleIcon className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{conflict.itemName}</h4>
                  <p className="text-sm text-gray-600 mt-1">{conflict.supplierName}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Detected: {formatDate(conflict.detectedAt)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setExpandedConflict(isExpanded ? null : conflict.id)}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                {isExpanded ? 'Hide' : 'Resolve'}
              </button>
            </div>

            <div className="pl-8">
              <p className="text-sm text-orange-800 mb-3">
                <span className="font-medium">Conflict Type:</span> {conflict.conflictType}
              </p>

              {/* Comparison */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-white border border-orange-200 rounded">
                  <p className="text-xs font-semibold text-gray-700 mb-2">LOCAL VERSION</p>
                  {Object.entries(conflict.localVersion || {}).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 capitalize">{key}:</span>
                      <span className="font-medium text-gray-900">
                        {typeof value === 'number' && key.includes('price') 
                          ? formatCurrency(value)
                          : value?.toString()}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-white border border-orange-200 rounded">
                  <p className="text-xs font-semibold text-gray-700 mb-2">REMOTE VERSION</p>
                  {Object.entries(conflict.remoteVersion || {}).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 capitalize">{key}:</span>
                      <span className="font-medium text-gray-900">
                        {typeof value === 'number' && key.includes('price')
                          ? formatCurrency(value)
                          : value?.toString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resolution Options */}
              {isExpanded && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 mb-2">Choose Resolution:</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleResolve(conflict.id, 'keep_local')}
                      disabled={resolveMutation.isPending}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {resolveMutation.isPending ? <ButtonLoader /> : 'Keep Local'}
                    </button>
                    <button
                      onClick={() => handleResolve(conflict.id, 'use_remote')}
                      disabled={resolveMutation.isPending}
                      className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50"
                    >
                      {resolveMutation.isPending ? <ButtonLoader /> : 'Use Remote'}
                    </button>
                    <button
                      onClick={() => {
                        const merged = { ...conflict.localVersion, ...conflict.remoteVersion };
                        handleResolve(conflict.id, 'merge', merged);
                      }}
                      disabled={resolveMutation.isPending}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {resolveMutation.isPending ? <ButtonLoader /> : 'Merge Both'}
                    </button>
                    <button
                      onClick={() => handleResolve(conflict.id, 'skip')}
                      disabled={resolveMutation.isPending}
                      className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-50"
                    >
                      Skip For Now
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ConflictResolver;
