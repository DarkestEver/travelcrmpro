import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DocumentTextIcon,
  PlusIcon,
  FunnelIcon,
  EyeIcon,
  PaperAirplaneIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import {
  getInvoiceSummary,
  getMyInvoices,
  sendInvoice,
  downloadInvoicePDF,
  cancelInvoice
} from '../../services/agentInvoiceAPI';
import { formatCurrency, formatDate } from '../../utils/format';

const Invoices = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    search: '',
    page: 1,
    limit: 10
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Fetch summary
  const { data: summary } = useQuery({
    queryKey: ['invoice-summary'],
    queryFn: getInvoiceSummary
  });

  // Fetch invoices
  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ['invoices', filters],
    queryFn: () => getMyInvoices(filters)
  });

  // Send invoice mutation
  const sendMutation = useMutation({
    mutationFn: sendInvoice,
    onSuccess: () => {
      toast.success('Invoice sent successfully');
      queryClient.invalidateQueries(['invoices']);
      queryClient.invalidateQueries(['invoice-summary']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to send invoice');
    }
  });

  // Cancel invoice mutation
  const cancelMutation = useMutation({
    mutationFn: cancelInvoice,
    onSuccess: () => {
      toast.success('Invoice cancelled successfully');
      queryClient.invalidateQueries(['invoices']);
      queryClient.invalidateQueries(['invoice-summary']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to cancel invoice');
    }
  });

  const handleDownloadPDF = async (invoiceId, invoiceNumber) => {
    try {
      const blob = await downloadInvoicePDF(invoiceId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      toast.error('Failed to download invoice');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      partially_paid: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-600'
    };
    return colors[status] || colors.draft;
  };

  const summaryCards = summary ? [
    {
      title: 'Total Invoices',
      value: summary.totalInvoices || 0,
      color: 'blue',
      icon: DocumentTextIcon
    },
    {
      title: 'Total Amount',
      value: formatCurrency(summary.totalAmount || 0),
      color: 'indigo',
      icon: DocumentTextIcon
    },
    {
      title: 'Amount Paid',
      value: formatCurrency(summary.totalPaid || 0),
      color: 'green',
      icon: CheckIcon
    },
    {
      title: 'Amount Due',
      value: formatCurrency(summary.totalDue || 0),
      color: 'red',
      icon: XMarkIcon
    }
  ] : [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and track your invoices
          </p>
        </div>
        <button
          onClick={() => window.location.href = '/agent/invoices/new'}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Invoice
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div className={`p-3 bg-${card.color}-100 rounded-lg`}>
                  <Icon className={`h-6 w-6 text-${card.color}-600`} />
                </div>
              </div>
              <p className="mt-4 text-sm font-medium text-gray-500">{card.title}</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Status Summary */}
      {summary && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-600">{summary.draftCount || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Draft</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{summary.sentCount || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Sent</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{summary.paidCount || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Paid</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{summary.overdueCount || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Overdue</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Invoice List</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                  <option value="partially_paid">Partially Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value, page: 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value, page: 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                  placeholder="Invoice # or customer..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Invoice Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoicesData?.data && invoicesData.data.length > 0 ? (
                invoicesData.data.map((invoice) => (
                  <tr key={invoice._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {invoice.invoiceNumber}
                          </div>
                          {invoice.bookingId && (
                            <div className="text-xs text-gray-500">
                              Booking: {invoice.bookingId.bookingNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{invoice.customerId?.name}</div>
                      <div className="text-xs text-gray-500">{invoice.customerId?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invoice.invoiceDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invoice.dueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(invoice.total)}
                      </div>
                      {invoice.amountDue > 0 && invoice.status !== 'draft' && (
                        <div className="text-xs text-red-600">
                          Due: {formatCurrency(invoice.amountDue)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                        {invoice.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => window.location.href = `/agent/invoices/${invoice._id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="View"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        
                        {invoice.status === 'draft' && (
                          <button
                            onClick={() => sendMutation.mutate(invoice._id)}
                            className="text-green-600 hover:text-green-900"
                            title="Send"
                            disabled={sendMutation.isLoading}
                          >
                            <PaperAirplaneIcon className="h-5 w-5" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDownloadPDF(invoice._id, invoice.invoiceNumber)}
                          className="text-purple-600 hover:text-purple-900"
                          title="Download PDF"
                        >
                          <ArrowDownTrayIcon className="h-5 w-5" />
                        </button>
                        
                        {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to cancel this invoice?')) {
                                cancelMutation.mutate(invoice._id);
                              }
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="Cancel"
                            disabled={cancelMutation.isLoading}
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-sm text-gray-500">
                    No invoices found. Create your first invoice!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {invoicesData && invoicesData.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Page {invoicesData.page} of {invoicesData.pages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                disabled={filters.page === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                disabled={filters.page === invoicesData.pages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Invoices;
