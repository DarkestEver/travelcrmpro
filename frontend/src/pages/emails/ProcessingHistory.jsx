import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

const ProcessingHistory = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [emails, setEmails] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    byStatus: [],
    bySource: [],
    byCategory: []
  });
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    source: 'all',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    currentPage: 1
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadEmails(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmails = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.source !== 'all') params.append('source', filters.source);
      if (filters.category !== 'all') params.append('category', filters.category);
      params.append('page', filters.page);
      params.append('limit', filters.limit);

      const response = await api.get(`/emails?${params}`);
      if (response.success) {
        setEmails(response.data || []); // API returns data array directly
        setPagination({
          total: response.pagination?.total || 0,
          pages: response.pagination?.pages || 0,
          currentPage: response.pagination?.page || 1
        });
      }
    } catch (error) {
      console.error('Failed to load emails:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/emails/stats');
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleRetry = async (emailId) => {
    try {
      const response = await api.post(`/emails/${emailId}/retry`);
      if (response.success) {
        alert('Email re-queued for processing!');
        loadEmails();
      }
    } catch (error) {
      alert('Failed to retry email: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⏳', label: 'Pending' },
      processing: { bg: 'bg-blue-100', text: 'text-blue-800', icon: '🔄', label: 'Processing' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', icon: '✅', label: 'Completed' },
      failed: { bg: 'bg-red-100', text: 'text-red-800', icon: '❌', label: 'Failed' },
      converted_to_quote: { bg: 'bg-purple-100', text: 'text-purple-800', icon: '💼', label: 'Quote Created' },
      duplicate_detected: { bg: 'bg-gray-100', text: 'text-gray-800', icon: '🔁', label: 'Duplicate' }
    };
    
    const badge = badges[status] || badges.pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <span className="mr-1">{badge.icon}</span>
        {badge.label}
      </span>
    );
  };

  const getSourceBadge = (source) => {
    const badges = {
      imap: { bg: 'bg-blue-100', text: 'text-blue-800', icon: '📧', label: 'IMAP' },
      webhook: { bg: 'bg-green-100', text: 'text-green-800', icon: '🌐', label: 'Webhook' },
      manual: { bg: 'bg-gray-100', text: 'text-gray-800', icon: '✍️', label: 'Manual' }
    };
    
    const badge = badges[source] || badges.manual;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <span className="mr-1">{badge.icon}</span>
        {badge.label}
      </span>
    );
  };

  const getCategoryBadge = (category) => {
    if (!category) return <span className="text-gray-400 text-xs">-</span>;
    
    const badges = {
      CUSTOMER: { bg: 'bg-indigo-100', text: 'text-indigo-800', icon: '👤', label: 'Customer' },
      SUPPLIER: { bg: 'bg-orange-100', text: 'text-orange-800', icon: '🏨', label: 'Supplier' },
      AGENT: { bg: 'bg-teal-100', text: 'text-teal-800', icon: '🤝', label: 'Agent' },
      FINANCE: { bg: 'bg-emerald-100', text: 'text-emerald-800', icon: '💰', label: 'Finance' },
      OTHER: { bg: 'bg-gray-100', text: 'text-gray-800', icon: '📄', label: 'Other' }
    };
    
    const badge = badges[category] || badges.OTHER;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <span className="mr-1">{badge.icon}</span>
        {badge.label}
      </span>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProcessingTime = (email) => {
    if (!email.processedAt || !email.receivedAt) return '-';
    const diff = new Date(email.processedAt) - new Date(email.receivedAt);
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  const getCountByStatus = (status) => {
    if (!stats.byStatus || !Array.isArray(stats.byStatus)) return 0;
    const item = stats.byStatus.find(s => s._id === status);
    return item?.count || 0;
  };

  if (loading && emails.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <span className="mr-2">📊</span>
          Email Processing History
        </h1>
        <p className="text-gray-600 mt-1">
          Track and monitor all email processing activities
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Emails</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <div className="text-3xl">📧</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{getCountByStatus('completed')}</p>
            </div>
            <div className="text-3xl">✅</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{getCountByStatus('pending')}</p>
            </div>
            <div className="text-3xl">⏳</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-red-600">{getCountByStatus('failed')}</p>
            </div>
            <div className="text-3xl">❌</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Processing Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">⏳ Pending</option>
              <option value="processing">🔄 Processing</option>
              <option value="completed">✅ Completed</option>
              <option value="failed">❌ Failed</option>
              <option value="converted_to_quote">💼 Converted to Quote</option>
              <option value="duplicate_detected">🔁 Duplicate</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="CUSTOMER">👤 Customer</option>
              <option value="SUPPLIER">🏨 Supplier</option>
              <option value="AGENT">🤝 Agent</option>
              <option value="FINANCE">💰 Finance</option>
              <option value="OTHER">📄 Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Source
            </label>
            <select
              value={filters.source}
              onChange={(e) => setFilters({ ...filters, source: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Sources</option>
              <option value="imap">📧 IMAP (Auto-fetched)</option>
              <option value="webhook">🌐 Webhook (Website)</option>
              <option value="manual">✍️ Manual</option>
            </select>
          </div>
        </div>
      </div>

      {/* Email List Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date/Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  From
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quote
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {emails.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                    No emails found
                  </td>
                </tr>
              ) : (
                emails.map((email) => (
                  <tr key={email._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(email.receivedAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate" title={email.from?.email}>
                        {email.from?.name || email.from?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate" title={email.subject}>
                        {email.subject}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getSourceBadge(email.source)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getCategoryBadge(email.category)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(email.processingStatus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getProcessingTime(email)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {email.quoteId ? (
                        <Link 
                          to={`/quotes/${email.quoteId}`}
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          View Quote
                        </Link>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <Link
                          to={`/emails/${email._id}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View
                        </Link>
                        {email.processingStatus === 'failed' && (
                          <button
                            onClick={() => handleRetry(email._id)}
                            className="text-green-600 hover:text-green-800"
                          >
                            Retry
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{(filters.page - 1) * filters.limit + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(filters.page * filters.limit, pagination.total)}
              </span>{' '}
              of <span className="font-medium">{pagination.total}</span> results
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                disabled={filters.page === 1}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                disabled={filters.page >= pagination.pages}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
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

export default ProcessingHistory;
