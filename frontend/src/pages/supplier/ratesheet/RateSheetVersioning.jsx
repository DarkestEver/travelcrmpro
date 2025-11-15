import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClockIcon, ArrowPathIcon, EyeIcon } from '@heroicons/react/24/outline';
import Modal from '../../../components/shared/Modal';
import { getRateSheetVersions, restoreRateSheetVersion, compareRateSheetVersions } from '../../../services/api/rateSheetApi';
import { LoadingSpinner, ButtonLoader } from '../../../components/shared/LoadingStates';
import StatusBadge from '../../../components/shared/StatusBadge';

const RateSheetVersioning = ({ rateSheet, onClose, onRestore }) => {
  const queryClient = useQueryClient();
  const [compareMode, setCompareMode] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState([]);

  // Fetch versions
  const { data: versions = [], isLoading } = useQuery({
    queryKey: ['rateSheetVersions', rateSheet?.id],
    queryFn: () => getRateSheetVersions(rateSheet.id),
    enabled: !!rateSheet
  });

  // Restore mutation
  const restoreMutation = useMutation({
    mutationFn: (versionId) => restoreRateSheetVersion(rateSheet.id, versionId),
    onSuccess: () => {
      queryClient.invalidateQueries(['rateSheets']);
      queryClient.invalidateQueries(['rateSheetVersions']);
      alert('Version restored successfully!');
      onRestore();
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to restore version');
    }
  });

  const handleRestore = (versionId) => {
    if (window.confirm('Restore this version? This will create a new version based on the selected one.')) {
      restoreMutation.mutate(versionId);
    }
  };

  const toggleVersionSelection = (versionId) => {
    setSelectedVersions(prev => {
      if (prev.includes(versionId)) {
        return prev.filter(id => id !== versionId);
      } else if (prev.length < 2) {
        return [...prev, versionId];
      } else {
        return [prev[1], versionId];
      }
    });
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getChangeType = (version) => {
    if (!version.changes) return null;
    const { added = 0, modified = 0, removed = 0 } = version.changes;
    return { added, modified, removed };
  };

  if (isLoading) {
    return (
      <Modal isOpen={true} onClose={onClose} title="Version History" size="xl">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </Modal>
    );
  }

  if (compareMode && selectedVersions.length === 2) {
    return (
      <Modal isOpen={true} onClose={() => setCompareMode(false)} title="Compare Versions" size="full">
        <VersionComparison
          rateSheetId={rateSheet.id}
          versionIds={selectedVersions}
          versions={versions}
          onBack={() => setCompareMode(false)}
        />
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Version History - ${rateSheet?.name}`}
      size="xl"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div>
            <p className="text-sm text-blue-900">
              Current Version: <span className="font-semibold">v{rateSheet.version}</span>
            </p>
            <p className="text-xs text-blue-700 mt-1">
              {versions.length} versions available
            </p>
          </div>
          {selectedVersions.length === 2 && (
            <button
              onClick={() => setCompareMode(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <EyeIcon className="w-4 h-4" />
              Compare Selected
            </button>
          )}
        </div>

        {/* Version Timeline */}
        <div className="space-y-3">
          {versions.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No version history available</p>
            </div>
          ) : (
            versions.map((version, index) => {
              const changes = getChangeType(version);
              const isSelected = selectedVersions.includes(version.id);
              const isCurrent = version.version === rateSheet.version;

              return (
                <div
                  key={version.id}
                  className={`p-4 border rounded-lg transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Version Number */}
                      <div className="flex-shrink-0">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                          isCurrent ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          v{version.version}
                        </div>
                      </div>

                      {/* Version Details */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{version.name || `Version ${version.version}`}</h4>
                          {isCurrent && <StatusBadge status="current" />}
                        </div>

                        <p className="text-sm text-gray-600 mb-3">{version.description || 'No description'}</p>

                        {/* Change Summary */}
                        {changes && (
                          <div className="flex items-center gap-4 text-xs">
                            {changes.added > 0 && (
                              <span className="text-green-600">
                                +{changes.added} added
                              </span>
                            )}
                            {changes.modified > 0 && (
                              <span className="text-blue-600">
                                {changes.modified} modified
                              </span>
                            )}
                            {changes.removed > 0 && (
                              <span className="text-red-600">
                                -{changes.removed} removed
                              </span>
                            )}
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <ClockIcon className="w-3 h-3" />
                            {formatDate(version.createdAt)}
                          </span>
                          <span>By {version.createdBy?.name || 'Unknown'}</span>
                          <span>{version.itemCount || 0} items</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleVersionSelection(version.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          disabled={selectedVersions.length === 2 && !isSelected}
                        />
                        <span className="text-sm text-gray-600">Compare</span>
                      </label>

                      {!isCurrent && (
                        <button
                          onClick={() => handleRestore(version.id)}
                          disabled={restoreMutation.isPending}
                          className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {restoreMutation.isPending ? (
                            <ButtonLoader />
                          ) : (
                            <>
                              <ArrowPathIcon className="w-4 h-4" />
                              Restore
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Version Notes */}
                  {version.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-600 italic">{version.notes}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

// Version Comparison Component
const VersionComparison = ({ rateSheetId, versionIds, versions, onBack }) => {
  const { data: comparison, isLoading } = useQuery({
    queryKey: ['rateSheetComparison', rateSheetId, versionIds],
    queryFn: () => compareRateSheetVersions(rateSheetId, versionIds[0], versionIds[1]),
  });

  const version1 = versions.find(v => v.id === versionIds[0]);
  const version2 = versions.find(v => v.id === versionIds[1]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Version Comparison</h3>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
        >
          Back to History
        </button>
      </div>

      {/* Version Headers */}
      <div className="grid grid-cols-2 gap-6">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900">Version {version1?.version}</h4>
          <p className="text-sm text-blue-700 mt-1">
            {new Date(version1?.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h4 className="font-semibold text-purple-900">Version {version2?.version}</h4>
          <p className="text-sm text-purple-700 mt-1">
            {new Date(version2?.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Differences */}
      <div className="space-y-4">
        {/* Added Items */}
        {comparison?.added?.length > 0 && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-3">
              Added Items ({comparison.added.length})
            </h4>
            <div className="space-y-2">
              {comparison.added.map((item, index) => (
                <div key={index} className="text-sm text-green-800">
                  + {item.service} - {formatCurrency(item.sellPrice)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modified Items */}
        {comparison?.modified?.length > 0 && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-3">
              Modified Items ({comparison.modified.length})
            </h4>
            <div className="space-y-2">
              {comparison.modified.map((item, index) => (
                <div key={index} className="text-sm">
                  <div className="text-blue-800 font-medium">{item.service}</div>
                  <div className="flex items-center gap-4 mt-1 text-xs">
                    <span className="text-red-600">
                      {formatCurrency(item.oldPrice)}
                    </span>
                    <span>→</span>
                    <span className="text-green-600">
                      {formatCurrency(item.newPrice)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Removed Items */}
        {comparison?.removed?.length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-semibold text-red-900 mb-3">
              Removed Items ({comparison.removed.length})
            </h4>
            <div className="space-y-2">
              {comparison.removed.map((item, index) => (
                <div key={index} className="text-sm text-red-800">
                  - {item.service} - {formatCurrency(item.sellPrice)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RateSheetVersioning;
