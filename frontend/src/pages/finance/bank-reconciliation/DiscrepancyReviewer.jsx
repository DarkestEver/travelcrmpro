import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ExclamationTriangleIcon, CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Modal from '../../../components/shared/Modal';
import StatusBadge from '../../../components/shared/StatusBadge';
import { resolveDiscrepancy } from '../../../services/api/bankReconciliationApi';
import { ButtonLoader } from '../../../components/shared/LoadingStates';

const DiscrepancyReviewer = ({ account, discrepancies, onClose, onSuccess }) => {
  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState(null);
  const [resolutionType, setResolutionType] = useState('approve'); // approve, reject, adjust, investigate
  const [notes, setNotes] = useState('');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');

  const resolveMutation = useMutation({
    mutationFn: (data) => resolveDiscrepancy(selectedDiscrepancy.id, data),
    onSuccess: () => {
      alert('Discrepancy resolved successfully!');
      setSelectedDiscrepancy(null);
      setNotes('');
      setAdjustmentAmount('');
      onSuccess();
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to resolve discrepancy');
    }
  });

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleResolve = () => {
    if (!selectedDiscrepancy) {
      alert('Please select a discrepancy to resolve');
      return;
    }

    if (!notes.trim()) {
      alert('Please provide resolution notes');
      return;
    }

    if (resolutionType === 'adjust' && !adjustmentAmount) {
      alert('Please enter adjustment amount');
      return;
    }

    const resolutionData = {
      resolutionType,
      notes,
      accountId: account.id
    };

    if (resolutionType === 'adjust') {
      resolutionData.adjustmentAmount = parseFloat(adjustmentAmount);
    }

    resolveMutation.mutate(resolutionData);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getDiscrepancyIcon = (type) => {
    switch (type) {
      case 'amount_mismatch':
        return '💰';
      case 'missing_transaction':
        return '❓';
      case 'duplicate':
        return '📋';
      case 'date_mismatch':
        return '📅';
      case 'unreconciled':
        return '⚠️';
      default:
        return '🔍';
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Review Discrepancies"
      size="xl"
    >
      <div className="space-y-6">
        {/* Account Info */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Account</p>
              <p className="font-semibold text-gray-900">{account.bankName}</p>
              <p className="text-sm text-gray-500">****{account.accountNumber.slice(-4)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Discrepancies</p>
              <p className="text-2xl font-bold text-red-600">{discrepancies.length}</p>
            </div>
          </div>
        </div>

        {/* Discrepancies List */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Discrepancy to Review
          </label>
          <div className="border border-gray-300 rounded-lg max-h-96 overflow-y-auto">
            {discrepancies.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <CheckCircleIcon className="w-12 h-12 mx-auto mb-3 text-green-600" />
                <p>No discrepancies found</p>
                <p className="text-sm mt-1">All transactions are reconciled</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {discrepancies.map((discrepancy) => (
                  <div
                    key={discrepancy.id}
                    onClick={() => setSelectedDiscrepancy(discrepancy)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${
                      selectedDiscrepancy?.id === discrepancy.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-2xl">{getDiscrepancyIcon(discrepancy.type)}</span>
                          <div>
                            <p className="font-medium text-gray-900">{discrepancy.title}</p>
                            <p className="text-sm text-gray-600">{discrepancy.description}</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          <span className={`text-xs px-2 py-1 rounded border capitalize ${getSeverityColor(discrepancy.severity)}`}>
                            {discrepancy.severity} Priority
                          </span>
                          <span className="text-xs text-gray-600">
                            Found: {formatDate(discrepancy.detectedAt)}
                          </span>
                          {discrepancy.reference && (
                            <span className="text-xs text-gray-500">
                              Ref: {discrepancy.reference}
                            </span>
                          )}
                        </div>

                        {/* Discrepancy Details */}
                        <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Bank Amount</p>
                            <p className="font-medium text-gray-900">
                              {formatCurrency(discrepancy.bankAmount, account.currency)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">System Amount</p>
                            <p className="font-medium text-gray-900">
                              {formatCurrency(discrepancy.systemAmount, account.currency)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Difference</p>
                            <p className={`font-bold ${discrepancy.difference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {formatCurrency(Math.abs(discrepancy.difference), account.currency)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Status</p>
                            <StatusBadge status={discrepancy.status} size="sm" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedDiscrepancy && (
          <>
            {/* Resolution Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resolution Type
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: 'approve', label: 'Approve', icon: '✓' },
                  { value: 'reject', label: 'Reject', icon: '✗' },
                  { value: 'adjust', label: 'Adjust', icon: '⚖️' },
                  { value: 'investigate', label: 'Investigate', icon: '🔍' }
                ].map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setResolutionType(type.value)}
                    disabled={resolveMutation.isPending}
                    className={`px-3 py-2 border rounded-lg font-medium ${
                      resolutionType === type.value
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    } disabled:opacity-50`}
                  >
                    <span className="mr-2">{type.icon}</span>
                    {type.label}
                  </button>
                ))}
              </div>
              
              {/* Resolution Type Descriptions */}
              <div className="mt-2 text-xs text-gray-600">
                {resolutionType === 'approve' && (
                  <p>✓ Accept the discrepancy as correct and update records accordingly</p>
                )}
                {resolutionType === 'reject' && (
                  <p>✗ Mark as incorrect and require further investigation</p>
                )}
                {resolutionType === 'adjust' && (
                  <p>⚖️ Make an adjustment entry to reconcile the difference</p>
                )}
                {resolutionType === 'investigate' && (
                  <p>🔍 Flag for detailed investigation by finance team</p>
                )}
              </div>
            </div>

            {/* Adjustment Amount (only for adjust type) */}
            {resolutionType === 'adjust' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adjustment Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(e.target.value)}
                  placeholder="Enter adjustment amount"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={resolveMutation.isPending}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Suggested: {formatCurrency(selectedDiscrepancy.difference, account.currency)}
                </p>
              </div>
            )}

            {/* Resolution Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resolution Notes <span className="text-red-600">*</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Explain the resolution decision and any actions taken..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={resolveMutation.isPending}
              />
              <p className="mt-1 text-xs text-gray-500">
                Required: Provide detailed notes for audit trail
              </p>
            </div>
          </>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-end space-x-3 mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          disabled={resolveMutation.isPending}
        >
          Cancel
        </button>
        <button
          onClick={handleResolve}
          disabled={!selectedDiscrepancy || !notes.trim() || resolveMutation.isPending}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resolveMutation.isPending ? (
            <ButtonLoader />
          ) : (
            <>
              <CheckCircleIcon className="w-5 h-5 mr-2" />
              Resolve Discrepancy
            </>
          )}
        </button>
      </div>
    </Modal>
  );
};

export default DiscrepancyReviewer;
