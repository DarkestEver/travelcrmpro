import React, { useState, useEffect } from 'react';
import {
  Mail,
  Inbox,
  Archive,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  Search,
  Eye,
  Trash2,
  RotateCw,
  TrendingUp,
  DollarSign,
  Users,
  Package
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import emailAPI from '../../services/emailAPI';

const EmailDashboard = () => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    searchTerm: '',
    requiresReview: false
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Fetch on mount and when filters/page change
  useEffect(() => {
    fetchEmails();
    fetchStats();
  }, [filters, pagination.page]);

  // Refetch when component becomes visible (browser back button)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchEmails();
        fetchStats();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const response = await emailAPI.getEmails({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });
      
      setEmails(response.data || []);
      
      // Safely handle pagination
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch emails:', error);
      toast.error('Failed to load emails');
      setEmails([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await emailAPI.getStats();
      setStats(response.data || {
        total: 0,
        customer_inquiry: 0,
        supplier_package: 0,
        booking_confirmation: 0,
        processed: 0,
        pending: 0,
        failed: 0
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      // Set default stats on error
      setStats({
        total: 0,
        customer_inquiry: 0,
        supplier_package: 0,
        booking_confirmation: 0,
        processed: 0,
        pending: 0,
        failed: 0
      });
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleViewEmail = (emailId) => {
    window.location.href = `/emails/${emailId}`;
  };

  const handleDeleteEmail = async (emailId) => {
    if (!confirm('Are you sure you want to delete this email?')) return;

    try {
      await emailAPI.deleteEmail(emailId);
      toast.success('Email deleted successfully');
      fetchEmails();
      fetchStats();
    } catch (error) {
      console.error('Failed to delete email:', error);
      toast.error('Failed to delete email');
    }
  };

  const handleReprocess = async (emailId) => {
    try {
      await emailAPI.categorizeEmail(emailId);
      toast.success('Email reprocessing started');
      fetchEmails();
    } catch (error) {
      console.error('Failed to reprocess email:', error);
      toast.error('Failed to reprocess email');
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      CUSTOMER: 'bg-blue-100 text-blue-800',
      SUPPLIER: 'bg-green-100 text-green-800',
      AGENT: 'bg-purple-100 text-purple-800',
      FINANCE: 'bg-yellow-100 text-yellow-800',
      SPAM: 'bg-red-100 text-red-800',
      OTHER: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.OTHER;
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="w-4 h-4 text-yellow-500" />,
      processing: <RotateCw className="w-4 h-4 text-blue-500 animate-spin" />,
      processed: <CheckCircle className="w-4 h-4 text-green-500" />,
      failed: <AlertCircle className="w-4 h-4 text-red-500" />
    };
    return icons[status] || icons.pending;
  };

  return (
    <div className="p-6 pb-12 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Dashboard</h1>
        <p className="text-gray-600">AI-powered email management and automation</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Emails</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.categories?.reduce((sum, c) => sum + c.count, 0) || 0}
                </p>
              </div>
              <Mail className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Needs Review</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.reviewQueue || 0}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">AI Cost (Total)</p>
                <p className="text-2xl font-bold text-green-600">
                  ${stats.costs?.totalCost?.toFixed(2) || '0.00'}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Queue</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.queue?.waiting + stats.queue?.active || 0}
                </p>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search emails..."
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Category Filter */}
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            <option value="CUSTOMER">Customer</option>
            <option value="SUPPLIER">Supplier</option>
            <option value="AGENT">Agent</option>
            <option value="FINANCE">Finance</option>
            <option value="SPAM">Spam</option>
            <option value="OTHER">Other</option>
          </select>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="processed">Processed</option>
            <option value="failed">Failed</option>
          </select>

          {/* Review Filter */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.requiresReview}
              onChange={(e) => handleFilterChange('requiresReview', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Needs Review</span>
          </label>

          {/* Refresh Button */}
          <button
            onClick={() => { fetchEmails(); fetchStats(); }}
            className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2"
          >
            <RotateCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Email List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RotateCw className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : emails.length === 0 ? (
          <div className="text-center py-12">
            <Inbox className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No emails found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {emails.map((email) => (
              <div
                key={email._id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Email Header */}
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(email.processingStatus)}
                      <span className="font-medium text-gray-900 truncate">
                        {email.from.name || email.from.email}
                      </span>
                      <span className="text-sm text-gray-500 truncate">
                        &lt;{email.from.email}&gt;
                      </span>
                      {email.category && (
                        <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(email.category)}`}>
                          {email.category}
                        </span>
                      )}
                      {email.requiresReview && (
                        <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                          Review
                        </span>
                      )}
                      {email.categoryConfidence && (
                        <span className="text-xs text-gray-500">
                          {email.categoryConfidence}% confidence
                        </span>
                      )}
                    </div>

                    {/* Subject */}
                    <p className="text-sm font-medium text-gray-900 mb-1 truncate">
                      {email.subject}
                    </p>

                    {/* Snippet */}
                    <p className="text-sm text-gray-600 truncate">
                      {email.snippet}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>
                        {new Date(email.receivedAt).toLocaleString()}
                      </span>
                      {email.matchingResults?.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          {email.matchingResults.length} matches
                        </span>
                      )}
                      {email.responseGenerated && (
                        <span className="text-green-600">Response Ready</span>
                      )}
                      {email.openaiCost && (
                        <span>${email.openaiCost.toFixed(4)}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewEmail(email._id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleReprocess(email._id)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      title="Reprocess"
                    >
                      <RotateCw className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteEmail(email._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-700">
              Showing page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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

export default EmailDashboard;
