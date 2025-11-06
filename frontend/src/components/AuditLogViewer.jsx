import { useState, useEffect } from 'react';
import { Search, Filter, Download, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';
import DataTable from './DataTable';
import { auditLogsAPI } from '../services/apiEndpoints';

/**
 * Audit Log Viewer Component
 * Displays and filters audit logs
 */
const AuditLogViewer = ({ 
  resourceType = null, 
  resourceId = null,
  userId = null,
  compact = false 
}) => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    user: userId || '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: compact ? 10 : 20
  });
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadLogs();
    if (!resourceType && !resourceId && !userId) {
      loadStats();
    }
  }, [filters.page, resourceType, resourceId, userId]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      let response;
      
      if (resourceType && resourceId) {
        response = await auditLogsAPI.getByResource(resourceType, resourceId, filters).catch(() => ({ data: { logs: [], totalPages: 1 } }));
      } else if (userId) {
        response = await auditLogsAPI.getByUser(userId, filters).catch(() => ({ data: { logs: [], totalPages: 1 } }));
      } else {
        response = await auditLogsAPI.getAll(filters).catch(() => ({ data: { logs: [], totalPages: 1 } }));
      }

      setLogs(response.data.logs || response.data || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      toast.error('Failed to load audit logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await auditLogsAPI.getStats(filters).catch(() => ({ data: { totalLogs: 0, uniqueUsers: 0, actionsToday: 0 } }));
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
      setStats({ totalLogs: 0, uniqueUsers: 0, actionsToday: 0 });
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleSearch = () => {
    loadLogs();
    loadStats();
  };

  const handleReset = () => {
    setFilters({
      action: '',
      user: userId || '',
      startDate: '',
      endDate: '',
      page: 1,
      limit: compact ? 10 : 20
    });
    setTimeout(() => {
      loadLogs();
      loadStats();
    }, 100);
  };

  const handleExport = () => {
    // Export audit logs as CSV
    const csv = convertToCSV(logs);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    toast.success('Audit logs exported');
  };

  const convertToCSV = (data) => {
    const headers = ['Timestamp', 'User', 'Action', 'Resource Type', 'Resource ID', 'IP Address', 'Details'];
    const rows = data.map(log => [
      new Date(log.timestamp).toLocaleString(),
      log.user?.name || log.userId || 'System',
      log.action,
      log.resourceType || '',
      log.resourceId || '',
      log.ipAddress || '',
      log.details ? JSON.stringify(log.details) : ''
    ]);
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  };

  const actionTypes = [
    { value: '', label: 'All Actions' },
    { value: 'create', label: 'Create' },
    { value: 'update', label: 'Update' },
    { value: 'delete', label: 'Delete' },
    { value: 'view', label: 'View' },
    { value: 'login', label: 'Login' },
    { value: 'logout', label: 'Logout' },
    { value: 'export', label: 'Export' }
  ];

  const getActionBadgeColor = (action) => {
    const colors = {
      create: 'bg-green-100 text-green-800',
      update: 'bg-blue-100 text-blue-800',
      delete: 'bg-red-100 text-red-800',
      view: 'bg-gray-100 text-gray-800',
      login: 'bg-purple-100 text-purple-800',
      logout: 'bg-orange-100 text-orange-800',
      export: 'bg-yellow-100 text-yellow-800'
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  const columns = compact ? [
    {
      key: 'timestamp',
      label: 'Time',
      render: (log) => new Date(log.timestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    {
      key: 'action',
      label: 'Action',
      render: (log) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionBadgeColor(log.action)}`}>
          {log.action}
        </span>
      )
    },
    {
      key: 'user',
      label: 'User',
      render: (log) => log.user?.name || log.userId || 'System'
    },
    {
      key: 'details',
      label: 'Details',
      render: (log) => (
        <span className="text-sm text-gray-600 truncate max-w-xs">
          {log.details ? JSON.stringify(log.details).slice(0, 50) : '-'}
        </span>
      )
    }
  ] : [
    {
      key: 'timestamp',
      label: 'Timestamp',
      render: (log) => new Date(log.timestamp).toLocaleString()
    },
    {
      key: 'user',
      label: 'User',
      render: (log) => (
        <div>
          <div className="font-medium">{log.user?.name || 'System'}</div>
          {log.user?.email && (
            <div className="text-sm text-gray-500">{log.user.email}</div>
          )}
        </div>
      )
    },
    {
      key: 'action',
      label: 'Action',
      render: (log) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionBadgeColor(log.action)}`}>
          {log.action}
        </span>
      )
    },
    {
      key: 'resource',
      label: 'Resource',
      render: (log) => log.resourceType ? (
        <div>
          <div className="font-medium">{log.resourceType}</div>
          {log.resourceId && (
            <div className="text-xs text-gray-500 font-mono">{log.resourceId.slice(0, 8)}...</div>
          )}
        </div>
      ) : '-'
    },
    {
      key: 'ipAddress',
      label: 'IP Address',
      render: (log) => log.ipAddress || '-'
    },
    {
      key: 'details',
      label: 'Details',
      render: (log) => log.details ? (
        <details className="text-sm">
          <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
            View
          </summary>
          <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto max-w-md">
            {JSON.stringify(log.details, null, 2)}
          </pre>
        </details>
      ) : '-'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Statistics Cards */}
      {stats && !compact && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600">Total Logs</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalLogs}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600">Unique Users</div>
            <div className="text-2xl font-bold text-gray-900">{stats.uniqueUsers}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600">Actions Today</div>
            <div className="text-2xl font-bold text-gray-900">{stats.actionsToday || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600">Most Common Action</div>
            <div className="text-lg font-semibold text-gray-900 capitalize">
              {stats.topActions?.[0]?.action || 'N/A'}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {!compact && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
            >
              <Filter className="w-4 h-4" />
              <span className="font-medium">Filters</span>
            </button>
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Action Type
                  </label>
                  <select
                    value={filters.action}
                    onChange={(e) => handleFilterChange('action', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {actionTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {!userId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      User ID
                    </label>
                    <input
                      type="text"
                      value={filters.user}
                      onChange={(e) => handleFilterChange('user', e.target.value)}
                      placeholder="Enter user ID..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Reset
                </button>
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <DataTable
          columns={columns}
          data={logs}
          loading={loading}
          emptyMessage="No audit logs found"
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Page {filters.page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleFilterChange('page', filters.page - 1)}
                disabled={filters.page === 1}
                className="px-3 py-1.5 text-sm bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handleFilterChange('page', filters.page + 1)}
                disabled={filters.page === totalPages}
                className="px-3 py-1.5 text-sm bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
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

export default AuditLogViewer;
