import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

const ProcessingHistory = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [emails, setEmails] = useState([]);
  const [stats, setStats] = useState({ total: 0, byStatus: [], bySource: [], byCategory: [] });
  const [filters, setFilters] = useState({ status: 'all', category: 'all', source: 'all', page: 1, limit: 20 });
  const [pagination, setPagination] = useState({ total: 0, pages: 0, currentPage: 1 });

  useEffect(() => { loadData(); }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadEmails(), loadStats()]);
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
        setEmails(response.data || []);
        setPagination({ total: response.pagination?.total || 0, pages: response.pagination?.pages || 0, currentPage: response.pagination?.page || 1 });
      }
    } catch (error) { console.error('Failed to load emails:', error); }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/emails/stats');
      if (response.success) setStats(response.data);
    } catch (error) { console.error('Failed to load stats:', error); }
  };

  const handleRetry = async (emailId) => {
    try {
      const response = await api.post(`/emails/${emailId}/retry`);
      if (response.success) { alert('Email re-queued!'); loadEmails(); }
    } catch (error) { alert('Failed: ' + (error.response?.data?.message || 'Error')); }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⏳', label: 'Pending' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', icon: '✅', label: 'Done' },
      failed: { bg: 'bg-red-100', text: 'text-red-800', icon: '❌', label: 'Failed' },
    };
    const badge = badges[status] || badges.pending;
    return <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs ${badge.bg} ${badge.text}`}>{badge.icon} {badge.label}</span>;
  };

  const getSourceBadge = (source) => {
    const badges = {
      imap: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'IMAP' },
      webhook: { bg: 'bg-green-100', text: 'text-green-800', label: 'Web' },
    };
    const badge = badges[source] || badges.imap;
    return <span className={`px-1.5 py-0.5 rounded text-xs ${badge.bg} ${badge.text}`}>{badge.label}</span>;
  };

  const getCategoryBadge = (category) => {
    if (!category) return <span className="text-gray-400 text-xs">-</span>;
    const badges = {
      CUSTOMER: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Customer' },
      SUPPLIER: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Supplier' },
    };
    const badge = badges[category] || badges.CUSTOMER;
    return <span className={`px-1.5 py-0.5 rounded text-xs ${badge.bg} ${badge.text}`}>{badge.label}</span>;
  };

  const formatDate = (date) => new Date(date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const getCountByStatus = (status) => {
    if (!stats.byStatus || !Array.isArray(stats.byStatus)) return 0;
    const item = stats.byStatus.find(s => s._id === status);
    return item?.count || 0;
  };

  if (loading && emails.length === 0) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>;
  }

  return (
    <div className="p-2">
      {/* Header - Compact */}
      <div className="mb-2">
        <h1 className="text-lg font-bold text-gray-800">📊 Email Processing History</h1>
      </div>

      {/* Stats - Ultra Compact */}
      <div className="grid grid-cols-4 gap-2 mb-2">
        <div className="bg-white rounded shadow p-1.5">
          <p className="text-xs text-gray-600">Total</p>
          <p className="text-xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white rounded shadow p-1.5">
          <p className="text-xs text-gray-600">Done</p>
          <p className="text-xl font-bold text-green-600">{getCountByStatus('completed')}</p>
        </div>
        <div className="bg-white rounded shadow p-1.5">
          <p className="text-xs text-gray-600">Pending</p>
          <p className="text-xl font-bold text-yellow-600">{getCountByStatus('pending')}</p>
        </div>
        <div className="bg-white rounded shadow p-1.5">
          <p className="text-xs text-gray-600">Failed</p>
          <p className="text-xl font-bold text-red-600">{getCountByStatus('failed')}</p>
        </div>
      </div>

      {/* Filters - Compact */}
      <div className="bg-white rounded shadow p-2 mb-2">
        <div className="grid grid-cols-3 gap-2">
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })} className="w-full px-2 py-1 text-xs border rounded">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
          <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })} className="w-full px-2 py-1 text-xs border rounded">
            <option value="all">All Categories</option>
            <option value="CUSTOMER">Customer</option>
            <option value="SUPPLIER">Supplier</option>
          </select>
          <select value={filters.source} onChange={(e) => setFilters({ ...filters, source: e.target.value, page: 1 })} className="w-full px-2 py-1 text-xs border rounded">
            <option value="all">All Sources</option>
            <option value="imap">IMAP</option>
            <option value="webhook">Webhook</option>
          </select>
        </div>
      </div>

      {/* Table - Ultra Compact */}
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-1 text-left font-medium text-gray-500">DATE/TIME</th>
              <th className="px-2 py-1 text-left font-medium text-gray-500">FROM</th>
              <th className="px-2 py-1 text-left font-medium text-gray-500">CONTACT</th>
              <th className="px-2 py-1 text-left font-medium text-gray-500">SUBJECT</th>
              <th className="px-2 py-1 text-left font-medium text-gray-500">SOURCE</th>
              <th className="px-2 py-1 text-left font-medium text-gray-500">CATEGORY</th>
              <th className="px-2 py-1 text-left font-medium text-gray-500">STATUS</th>
              <th className="px-2 py-1 text-left font-medium text-gray-500">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {emails.length === 0 ? (
              <tr><td colSpan="8" className="px-2 py-8 text-center text-gray-500">No emails found</td></tr>
            ) : (
              emails.map((email) => (
                <tr key={email._id} className="hover:bg-gray-50">
                  <td className="px-2 py-1 whitespace-nowrap">{formatDate(email.receivedAt)}</td>
                  <td className="px-2 py-1"><div className="max-w-[150px] truncate">{email.from?.name || email.from?.email}</div></td>
                  <td className="px-2 py-1">
                    {email.extractedData?.customerInfo ? (
                      <div className="max-w-[120px] truncate">{email.extractedData.customerInfo.name || '—'}</div>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-2 py-1"><div className="max-w-[250px] truncate">{email.subject}</div></td>
                  <td className="px-2 py-1">{getSourceBadge(email.source)}</td>
                  <td className="px-2 py-1">{getCategoryBadge(email.category)}</td>
                  <td className="px-2 py-1">{getStatusBadge(email.processingStatus)}</td>
                  <td className="px-2 py-1">
                    <div className="flex gap-1">
                      <Link to={`/emails/${email._id}`} className="px-2 py-0.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">View</Link>
                      {email.processingStatus === 'failed' && (
                        <button onClick={() => handleRetry(email._id)} className="px-2 py-0.5 bg-green-600 text-white rounded text-xs hover:bg-green-700">Retry</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination - Compact */}
      <div className="bg-white rounded shadow mt-2 px-3 py-2 flex justify-between items-center text-xs">
        <div>Showing {((pagination.currentPage - 1) * filters.limit) + 1}-{Math.min(pagination.currentPage * filters.limit, pagination.total)} of {pagination.total}</div>
        <div className="flex gap-1">
          <button onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })} disabled={pagination.currentPage === 1} className="px-3 py-1 border rounded disabled:opacity-50">← Prev</button>
          <span className="px-3 py-1 border rounded bg-gray-50">Page {pagination.currentPage}</span>
          <button onClick={() => setFilters({ ...filters, page: Math.min(pagination.pages, filters.page + 1) })} disabled={pagination.currentPage === pagination.pages} className="px-3 py-1 border rounded disabled:opacity-50">Next →</button>
        </div>
      </div>
    </div>
  );
};

export default ProcessingHistory;
