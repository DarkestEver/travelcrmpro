import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BanknotesIcon, 
  ArrowPathIcon, 
  DocumentArrowUpIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';
import { getBankAccounts, getUnmatchedTransactions, getDiscrepancies } from '../../../services/api/bankReconciliationApi';
import DataTable from '../../../components/shared/DataTable';
import StatusBadge from '../../../components/shared/StatusBadge';
import { LoadingSpinner, CardSkeleton } from '../../../components/shared/LoadingStates';
import TransactionMatcher from './TransactionMatcher';
import StatementUploader from './StatementUploader';
import DiscrepancyReviewer from './DiscrepancyReviewer';

const BankReconciliation = () => {
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, match, upload, discrepancies
  const [showUploader, setShowUploader] = useState(false);
  const [showMatcher, setShowMatcher] = useState(false);
  const [showDiscrepancies, setShowDiscrepancies] = useState(false);

  // Fetch bank accounts
  const { data: accounts, isLoading: loadingAccounts } = useQuery({
    queryKey: ['bankAccounts'],
    queryFn: getBankAccounts
  });

  // Fetch unmatched transactions for selected account
  const { data: unmatchedTransactions = [], isLoading: loadingTransactions, refetch: refetchTransactions } = useQuery({
    queryKey: ['unmatchedTransactions', selectedAccount?.id],
    queryFn: () => getUnmatchedTransactions(selectedAccount?.id),
    enabled: !!selectedAccount
  });

  // Fetch discrepancies for selected account
  const { data: discrepancies = [], isLoading: loadingDiscrepancies, refetch: refetchDiscrepancies } = useQuery({
    queryKey: ['discrepancies', selectedAccount?.id],
    queryFn: () => getDiscrepancies(selectedAccount?.id),
    enabled: !!selectedAccount
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

  const accountColumns = [
    {
      key: 'bankName',
      header: 'Bank Name',
      sortable: true
    },
    {
      key: 'accountNumber',
      header: 'Account Number',
      render: (row) => `****${row.accountNumber.slice(-4)}`
    },
    {
      key: 'accountType',
      header: 'Type',
      render: (row) => (
        <span className="capitalize">{row.accountType}</span>
      )
    },
    {
      key: 'balance',
      header: 'Balance',
      render: (row) => formatCurrency(row.balance, row.currency),
      sortable: true
    },
    {
      key: 'lastReconciled',
      header: 'Last Reconciled',
      render: (row) => row.lastReconciled ? formatDate(row.lastReconciled) : 'Never',
      sortable: true
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} size="sm" />
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <button
          onClick={() => setSelectedAccount(row)}
          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
        >
          Reconcile
        </button>
      )
    }
  ];

  const transactionColumns = [
    {
      key: 'date',
      header: 'Date',
      render: (row) => formatDate(row.date),
      sortable: true
    },
    {
      key: 'description',
      header: 'Description'
    },
    {
      key: 'reference',
      header: 'Reference',
      render: (row) => row.reference || '-'
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (row) => (
        <span className={row.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
          {row.type === 'credit' ? '+' : '-'}{formatCurrency(Math.abs(row.amount), row.currency)}
        </span>
      ),
      sortable: true
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => (
        <span className="capitalize">{row.type}</span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} size="sm" />
    }
  ];

  if (loadingAccounts) {
    return (
      <div className="p-6">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <BanknotesIcon className="w-8 h-8 mr-3 text-blue-600" />
          Bank Reconciliation
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Match bank statements with internal records and resolve discrepancies
        </p>
      </div>

      {!selectedAccount ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Accounts</p>
                  <p className="text-2xl font-bold text-gray-900">{accounts?.length || 0}</p>
                </div>
                <BanknotesIcon className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Unmatched</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {accounts?.reduce((sum, acc) => sum + (acc.unmatchedCount || 0), 0) || 0}
                  </p>
                </div>
                <ExclamationTriangleIcon className="w-8 h-8 text-orange-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Discrepancies</p>
                  <p className="text-2xl font-bold text-red-600">
                    {accounts?.reduce((sum, acc) => sum + (acc.discrepancyCount || 0), 0) || 0}
                  </p>
                </div>
                <ChartBarIcon className="w-8 h-8 text-red-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Reconciled</p>
                  <p className="text-2xl font-bold text-green-600">
                    {accounts?.filter(acc => acc.status === 'reconciled').length || 0}
                  </p>
                </div>
                <CheckCircleIcon className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          {/* Accounts Table */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Bank Accounts</h2>
              <button
                onClick={() => setShowUploader(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <DocumentArrowUpIcon className="w-5 h-5 mr-2" />
                Upload Statement
              </button>
            </div>
            
            <DataTable
              columns={accountColumns}
              data={accounts || []}
              searchable
              pagination
              pageSize={10}
            />
          </div>
        </>
      ) : (
        <>
          {/* Account Details Header */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <button
                  onClick={() => setSelectedAccount(null)}
                  className="mr-4 text-gray-600 hover:text-gray-900"
                >
                  ← Back
                </button>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedAccount.bankName}</h2>
                  <p className="text-sm text-gray-600">****{selectedAccount.accountNumber.slice(-4)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Current Balance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(selectedAccount.balance, selectedAccount.currency)}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => setShowUploader(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <DocumentArrowUpIcon className="w-5 h-5 mr-2" />
                Upload Statement
              </button>
              <button
                onClick={() => {
                  setShowMatcher(true);
                  refetchTransactions();
                }}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <ArrowPathIcon className="w-5 h-5 mr-2" />
                Match Transactions ({unmatchedTransactions.length})
              </button>
              <button
                onClick={() => {
                  setShowDiscrepancies(true);
                  refetchDiscrepancies();
                }}
                className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                Review Discrepancies ({discrepancies.length})
              </button>
            </div>
          </div>

          {/* Unmatched Transactions Table */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Unmatched Transactions
            </h3>
            
            {loadingTransactions ? (
              <CardSkeleton count={3} />
            ) : (
              <DataTable
                columns={transactionColumns}
                data={unmatchedTransactions}
                searchable
                pagination
                pageSize={15}
                emptyMessage="No unmatched transactions"
              />
            )}
          </div>
        </>
      )}

      {/* Modals */}
      {showUploader && (
        <StatementUploader
          account={selectedAccount}
          onClose={() => setShowUploader(false)}
          onSuccess={() => {
            setShowUploader(false);
            refetchTransactions();
          }}
        />
      )}

      {showMatcher && (
        <TransactionMatcher
          account={selectedAccount}
          transactions={unmatchedTransactions}
          onClose={() => setShowMatcher(false)}
          onSuccess={() => {
            setShowMatcher(false);
            refetchTransactions();
            refetchDiscrepancies();
          }}
        />
      )}

      {showDiscrepancies && (
        <DiscrepancyReviewer
          account={selectedAccount}
          discrepancies={discrepancies}
          onClose={() => setShowDiscrepancies(false)}
          onSuccess={() => {
            setShowDiscrepancies(false);
            refetchDiscrepancies();
          }}
        />
      )}
    </div>
  );
};

export default BankReconciliation;
