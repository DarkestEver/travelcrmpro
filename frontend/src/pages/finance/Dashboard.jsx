import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DollarSign,
  FileText,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import financeAPI from '../../services/financeAPI';
import toast from 'react-hot-toast';

export default function FinanceDashboard() {
  // Fetch dashboard data
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['finance-dashboard'],
    queryFn: financeAPI.getFinanceDashboard,
    retry: 1,
    // Show default data if API fails
    placeholderData: { data: {} },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show warning but continue rendering if error
  if (error) {
    console.error('Finance dashboard error:', error);
    toast.error('Unable to load dashboard data. Showing defaults.');
  }

  const { 
    paymentSummary = [], 
    invoiceSummary = [], 
    unreconciledCount = 0, 
    pendingDisbursements = { count: 0, totalAmount: 0 }, 
    taxSettings = { globalTaxRate: 0 } 
  } = dashboardData?.data || {};

  // Calculate totals from payment summary
  const paymentTotals = paymentSummary?.reduce((acc, item) => ({
    total: acc.total + item.totalAmount,
    tax: acc.tax + item.totalTax,
    fees: acc.fees + item.totalGatewayFees,
    count: acc.count + item.count,
  }), { total: 0, tax: 0, fees: 0, count: 0 }) || {};

  const completedPayments = paymentSummary?.find(p => p._id === 'completed') || {};
  const pendingPayments = paymentSummary?.find(p => p._id === 'pending') || {};

  // Calculate totals from invoice summary
  const invoiceTotals = invoiceSummary?.reduce((acc, item) => ({
    total: acc.total + item.totalAmount,
    paid: acc.paid + item.totalPaid,
    due: acc.due + item.totalDue,
    count: acc.count + item.count,
  }), { total: 0, paid: 0, due: 0, count: 0 }) || {};

  const stats = [
    {
      name: 'Total Revenue',
      value: `$${completedPayments.totalAmount?.toLocaleString() || 0}`,
      change: `${completedPayments.count || 0} transactions`,
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      name: 'Tax Collected',
      value: `$${paymentTotals.tax?.toLocaleString() || 0}`,
      change: `${taxSettings?.globalTaxRate || 0}% rate`,
      icon: FileText,
      color: 'bg-blue-500',
    },
    {
      name: 'Pending Payments',
      value: `$${pendingPayments.totalAmount?.toLocaleString() || 0}`,
      change: `${pendingPayments.count || 0} pending`,
      icon: Clock,
      color: 'bg-yellow-500',
    },
    {
      name: 'Unreconciled',
      value: unreconciledCount || 0,
      change: 'Transactions',
      icon: RefreshCw,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Finance Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of financial operations and status
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 ${stat.color} rounded-md p-3`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{stat.value}</div>
                      </dd>
                      <dd className="text-xs text-gray-500 mt-1">{stat.change}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Status</h2>
          <div className="space-y-4">
            {paymentSummary?.map((status) => (
              <div key={status._id} className="flex items-center justify-between">
                <div className="flex items-center">
                  {status._id === 'completed' && <CheckCircle className="h-5 w-5 text-green-500 mr-2" />}
                  {status._id === 'pending' && <Clock className="h-5 w-5 text-yellow-500 mr-2" />}
                  {status._id === 'failed' && <XCircle className="h-5 w-5 text-red-500 mr-2" />}
                  <span className="text-sm font-medium text-gray-700 capitalize">{status._id}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    ${status.totalAmount?.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">{status.count} payments</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Status</h2>
          <div className="space-y-4">
            {invoiceSummary?.map((status) => (
              <div key={status._id} className="flex items-center justify-between">
                <div className="flex items-center">
                  {status._id === 'paid' && <CheckCircle className="h-5 w-5 text-green-500 mr-2" />}
                  {status._id === 'sent' && <Clock className="h-5 w-5 text-blue-500 mr-2" />}
                  {status._id === 'overdue' && <AlertCircle className="h-5 w-5 text-red-500 mr-2" />}
                  <span className="text-sm font-medium text-gray-700 capitalize">{status._id}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    ${status.totalAmount?.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">{status.count} invoices</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pending Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Unreconciled Payments</h3>
              <RefreshCw className="h-5 w-5 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{unreconciledCount || 0}</p>
            <a href="/finance/reconciliation" className="text-xs text-blue-600 hover:text-blue-700 mt-2 inline-block">
              View Details →
            </a>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Pending Disbursements</h3>
              <DollarSign className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{pendingDisbursements.count || 0}</p>
            <p className="text-xs text-gray-500 mt-1">
              ${pendingDisbursements.totalAmount?.toLocaleString() || 0}
            </p>
            <a href="/finance/payments" className="text-xs text-blue-600 hover:text-blue-700 mt-2 inline-block">
              View Details →
            </a>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Tax Filing</h3>
              <FileText className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-sm font-medium text-gray-900">
              {taxSettings?.nextFilingDate 
                ? new Date(taxSettings.nextFilingDate).toLocaleDateString()
                : 'Not set'}
            </p>
            <p className="text-xs text-gray-500 mt-1">{taxSettings?.taxFilingFrequency || 'N/A'}</p>
            <a href="/finance/tax-settings" className="text-xs text-blue-600 hover:text-blue-700 mt-2 inline-block">
              Manage Tax →
            </a>
          </div>
        </div>
      </div>

      {/* Tax Information */}
      {taxSettings && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <FileText className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-900">Current Tax Configuration</h3>
              <div className="mt-2 text-sm text-blue-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="font-medium">Tax Type:</span> {taxSettings.taxType}
                  </div>
                  <div>
                    <span className="font-medium">Rate:</span> {taxSettings.globalTaxRate}%
                  </div>
                  <div>
                    <span className="font-medium">Currency:</span> {taxSettings.currency}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
