import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { getMyQuoteRequests, cancelQuoteRequest } from '../../services/agentQuoteRequestAPI';
import QuoteDetailModal from '../../components/agent/QuoteDetailModal';

export default function QuoteRequests() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const limit = 10;

  // Fetch quote requests
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['myQuoteRequests', currentPage, searchTerm, statusFilter],
    queryFn: () =>
      getMyQuoteRequests({
        page: currentPage,
        limit,
        search: searchTerm,
        status: statusFilter || undefined,
        sortBy: '-createdAt',
      }),
  });

  const quoteRequests = data?.data?.quoteRequests || [];
  const pagination = data?.data?.pagination || {};

  // Handle view details
  const handleViewDetails = (quote) => {
    setSelectedQuote(quote);
    setIsDetailModalOpen(true);
  };

  // Handle cancel
  const handleCancel = async (quoteId) => {
    if (!window.confirm('Are you sure you want to cancel this quote request?')) {
      return;
    }

    try {
      await cancelQuoteRequest(quoteId, 'Cancelled by agent');
      refetch();
      alert('Quote request cancelled successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel quote request');
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewing: 'bg-blue-100 text-blue-800',
      quoted: 'bg-green-100 text-green-800',
      accepted: 'bg-indigo-100 text-indigo-800',
      rejected: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quote Requests</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track and manage your quote requests
          </p>
        </div>
        <button
          onClick={() => navigate('/agent/quotes/new')}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Quote Request
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer name or destination..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="reviewing">Reviewing</option>
            <option value="quoted">Quoted</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Quote Requests Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-sm text-gray-500">Loading quote requests...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-600">Failed to load quote requests</p>
            <button
              onClick={() => refetch()}
              className="mt-4 text-sm text-indigo-600 hover:text-indigo-700"
            >
              Try again
            </button>
          </div>
        ) : quoteRequests.length === 0 ? (
          <div className="p-8 text-center">
            <PlusIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No quote requests</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter
                ? 'No quote requests match your filters'
                : 'Get started by creating your first quote request'}
            </p>
            {!searchTerm && !statusFilter && (
              <button
                onClick={() => navigate('/agent/quotes/new')}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                New Quote Request
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Destination
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Travel Dates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Travelers
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {quoteRequests.map((quote) => (
                    <tr key={quote._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {quote.customerId?.firstName} {quote.customerId?.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{quote.customerId?.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {quote.destination?.city
                            ? `${quote.destination.city}, ${quote.destination.country}`
                            : quote.destination?.country}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(quote.travelDates.startDate).toLocaleDateString()} -{' '}
                          {new Date(quote.travelDates.endDate).toLocaleDateString()}
                        </div>
                        {quote.travelDates.flexible && (
                          <span className="text-xs text-gray-500">(Flexible)</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {quote.travelers.adults}A
                        {quote.travelers.children > 0 && `, ${quote.travelers.children}C`}
                        {quote.travelers.infants > 0 && `, ${quote.travelers.infants}I`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            quote.status
                          )}`}
                        >
                          {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(quote.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewDetails(quote)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                          title="View Details"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        {['pending', 'reviewing'].includes(quote.status) && (
                          <button
                            onClick={() => handleCancel(quote._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Cancel Request"
                          >
                            <XCircleIcon className="h-5 w-5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === pagination.pages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(currentPage - 1) * limit + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * limit, pagination.total)}
                      </span>{' '}
                      of <span className="font-medium">{pagination.total}</span> requests
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === pagination.pages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Quote Detail Modal */}
      {isDetailModalOpen && selectedQuote && (
        <QuoteDetailModal
          quote={selectedQuote}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedQuote(null);
          }}
          onSuccess={() => {
            setIsDetailModalOpen(false);
            setSelectedQuote(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
