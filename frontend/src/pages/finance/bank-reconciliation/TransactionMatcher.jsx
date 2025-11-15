import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CheckCircleIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Modal from '../../../components/shared/Modal';
import { matchTransaction } from '../../../services/api/bankReconciliationApi';
import { ButtonLoader } from '../../../components/shared/LoadingStates';
import StatusBadge from '../../../components/shared/StatusBadge';

const TransactionMatcher = ({ account, transactions, onClose, onSuccess }) => {
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [matchType, setMatchType] = useState('booking'); // booking, invoice, payment, manual
  const [matchedItem, setMatchedItem] = useState(null);
  const [manualDescription, setManualDescription] = useState('');

  const matchMutation = useMutation({
    mutationFn: (data) => matchTransaction(selectedTransaction.id, data),
    onSuccess: () => {
      alert('Transaction matched successfully!');
      setSelectedTransaction(null);
      setMatchedItem(null);
      setManualDescription('');
      onSuccess();
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to match transaction');
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
      day: 'numeric'
    });
  };

  const handleMatch = () => {
    if (!selectedTransaction) {
      alert('Please select a transaction first');
      return;
    }

    const matchData = {
      matchType,
      accountId: account.id
    };

    if (matchType === 'manual') {
      if (!manualDescription.trim()) {
        alert('Please provide a description');
        return;
      }
      matchData.description = manualDescription;
    } else {
      if (!matchedItem) {
        alert(`Please select a ${matchType} to match`);
        return;
      }
      matchData[`${matchType}Id`] = matchedItem.id;
    }

    matchMutation.mutate(matchData);
  };

  const filteredTransactions = transactions.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Mock data for matching candidates - in real app, fetch from API
  const matchingCandidates = {
    booking: [
      { id: 1, reference: 'BK-2024-001', customer: 'John Doe', amount: 1500, date: new Date() },
      { id: 2, reference: 'BK-2024-002', customer: 'Jane Smith', amount: 2500, date: new Date() }
    ],
    invoice: [
      { id: 1, number: 'INV-001', customer: 'ABC Corp', amount: 1500, date: new Date() },
      { id: 2, number: 'INV-002', customer: 'XYZ Ltd', amount: 2500, date: new Date() }
    ],
    payment: [
      { id: 1, reference: 'PAY-001', customer: 'John Doe', amount: 1500, date: new Date() },
      { id: 2, reference: 'PAY-002', customer: 'Jane Smith', amount: 2500, date: new Date() }
    ]
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Match Transactions"
      size="xl"
    >
      <div className="space-y-6">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Instructions:</strong> Select a transaction from the list below, then choose what to match it with.
            You can match with bookings, invoices, payments, or create a manual entry.
          </p>
        </div>

        {/* Search Transactions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Transactions
          </label>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by description or reference..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Transactions List */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Transaction ({filteredTransactions.length})
          </label>
          <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
            {filteredTransactions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No transactions found
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    onClick={() => setSelectedTransaction(transaction)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${
                      selectedTransaction?.id === transaction.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-sm text-gray-600">{formatDate(transaction.date)}</span>
                          {transaction.reference && (
                            <span className="text-sm text-gray-500">Ref: {transaction.reference}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className={`font-bold ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                        </p>
                        <StatusBadge status={transaction.status} size="sm" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedTransaction && (
          <>
            {/* Match Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Match Type
              </label>
              <div className="grid grid-cols-4 gap-3">
                {['booking', 'invoice', 'payment', 'manual'].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setMatchType(type);
                      setMatchedItem(null);
                      setManualDescription('');
                    }}
                    className={`px-4 py-2 border rounded-lg font-medium capitalize ${
                      matchType === type
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Match Candidates or Manual Input */}
            {matchType === 'manual' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={manualDescription}
                  onChange={(e) => setManualDescription(e.target.value)}
                  placeholder="Enter description for this transaction..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select {matchType.charAt(0).toUpperCase() + matchType.slice(1)}
                </label>
                <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                  {matchingCandidates[matchType]?.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setMatchedItem(item)}
                      className={`p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-200 last:border-0 ${
                        matchedItem?.id === item.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {item.reference || item.number}
                          </p>
                          <p className="text-sm text-gray-600">{item.customer}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{formatCurrency(item.amount)}</p>
                          <p className="text-sm text-gray-500">{formatDate(item.date)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-end space-x-3 mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          disabled={matchMutation.isPending}
        >
          Cancel
        </button>
        <button
          onClick={handleMatch}
          disabled={!selectedTransaction || matchMutation.isPending}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {matchMutation.isPending ? (
            <ButtonLoader />
          ) : (
            <>
              <CheckCircleIcon className="w-5 h-5 mr-2" />
              Match Transaction
            </>
          )}
        </button>
      </div>
    </Modal>
  );
};

export default TransactionMatcher;
