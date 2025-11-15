import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClockIcon } from '@heroicons/react/24/outline';
import { DataTable } from '../../../components/shared';
import { LoadingSpinner } from '../../../components/shared/LoadingStates';
import { getAPIResponseTimes } from '../../../services/api/performanceApi';

const APIResponseTimes = () => {
  const [timeRange, setTimeRange] = useState('1h');
  const [sortBy, setSortBy] = useState('p95'); // p50, p95, p99, avg

  const { data: endpoints = [], isLoading } = useQuery({
    queryKey: ['apiResponseTimes', timeRange],
    queryFn: () => getAPIResponseTimes(timeRange),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const handleExportCSV = () => {
    if (endpoints.length === 0) return;

    const headers = ['Endpoint', 'Method', 'Avg Time', 'P50', 'P95', 'P99', 'Requests', 'Errors', 'Error Rate'];
    const rows = endpoints.map(e => [
      e.endpoint,
      e.method,
      `${e.avgResponseTime}ms`,
      `${e.p50}ms`,
      `${e.p95}ms`,
      `${e.p99}ms`,
      e.requestCount,
      e.errorCount,
      `${e.errorRate}%`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-response-times-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getSeverityColor = (time, percentile) => {
    const thresholds = {
      p50: { warning: 100, critical: 200 },
      p95: { warning: 300, critical: 500 },
      p99: { warning: 500, critical: 1000 },
      avg: { warning: 150, critical: 300 }
    };
    
    const threshold = thresholds[percentile] || thresholds.avg;
    
    if (time > threshold.critical) return 'text-red-600 bg-red-100';
    if (time > threshold.warning) return 'text-orange-600 bg-orange-100';
    return 'text-green-600 bg-green-100';
  };

  const getMethodColor = (method) => {
    const colors = {
      GET: 'text-blue-600 bg-blue-100',
      POST: 'text-green-600 bg-green-100',
      PUT: 'text-orange-600 bg-orange-100',
      PATCH: 'text-purple-600 bg-purple-100',
      DELETE: 'text-red-600 bg-red-100'
    };
    return colors[method] || 'text-gray-600 bg-gray-100';
  };

  const sortedEndpoints = [...endpoints].sort((a, b) => {
    return b[sortBy] - a[sortBy];
  });

  const columns = [
    {
      key: 'endpoint',
      label: 'Endpoint',
      render: (e) => (
        <div className="text-sm">
          <div className="text-gray-900 font-medium max-w-md truncate" title={e.endpoint}>
            {e.endpoint}
          </div>
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getMethodColor(e.method)}`}>
            {e.method}
          </span>
        </div>
      )
    },
    {
      key: 'avgResponseTime',
      label: 'Avg Time',
      render: (e) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(e.avgResponseTime, 'avg')}`}>
          {e.avgResponseTime}ms
        </span>
      )
    },
    {
      key: 'p50',
      label: 'P50',
      render: (e) => (
        <div className="text-sm">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(e.p50, 'p50')}`}>
            {e.p50}ms
          </span>
        </div>
      )
    },
    {
      key: 'p95',
      label: 'P95',
      render: (e) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(e.p95, 'p95')}`}>
          {e.p95}ms
        </span>
      )
    },
    {
      key: 'p99',
      label: 'P99',
      render: (e) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(e.p99, 'p99')}`}>
          {e.p99}ms
        </span>
      )
    },
    {
      key: 'requestCount',
      label: 'Requests',
      render: (e) => (
        <div className="text-sm text-gray-900">
          {e.requestCount?.toLocaleString() || 0}
        </div>
      )
    },
    {
      key: 'errorRate',
      label: 'Error Rate',
      render: (e) => (
        <div className="text-sm">
          <div className={e.errorRate > 5 ? 'text-red-600 font-medium' : 'text-gray-900'}>
            {e.errorRate}%
          </div>
          <div className="text-xs text-gray-500">
            {e.errorCount} errors
          </div>
        </div>
      )
    },
    {
      key: 'trend',
      label: 'Trend',
      render: (e) => (
        <div className="flex items-center gap-1">
          {e.trend > 0 ? (
            <span className="text-red-600 text-sm">↑ {e.trend}%</span>
          ) : e.trend < 0 ? (
            <span className="text-green-600 text-sm">↓ {Math.abs(e.trend)}%</span>
          ) : (
            <span className="text-gray-500 text-sm">—</span>
          )}
        </div>
      )
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClockIcon className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">API Response Times</h2>
            <p className="text-sm text-gray-600">
              {endpoints.length} endpoints monitored
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="avg">Sort by Average</option>
            <option value="p50">Sort by P50</option>
            <option value="p95">Sort by P95</option>
            <option value="p99">Sort by P99</option>
            <option value="requestCount">Sort by Requests</option>
          </select>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
          <button
            onClick={handleExportCSV}
            disabled={endpoints.length === 0}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-2xl font-bold text-green-900">
            {endpoints.filter(e => e.avgResponseTime < 200).length}
          </div>
          <div className="text-sm text-green-700">Fast (&lt;200ms)</div>
        </div>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-2xl font-bold text-yellow-900">
            {endpoints.filter(e => e.avgResponseTime >= 200 && e.avgResponseTime < 500).length}
          </div>
          <div className="text-sm text-yellow-700">Moderate (200-500ms)</div>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-2xl font-bold text-red-900">
            {endpoints.filter(e => e.avgResponseTime >= 500).length}
          </div>
          <div className="text-sm text-red-700">Slow (&gt;500ms)</div>
        </div>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-2xl font-bold text-blue-900">
            {endpoints.reduce((sum, e) => sum + (e.requestCount || 0), 0).toLocaleString()}
          </div>
          <div className="text-sm text-blue-700">Total Requests</div>
        </div>
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="text-2xl font-bold text-purple-900">
            {(endpoints.reduce((sum, e) => sum + (e.avgResponseTime || 0), 0) / endpoints.length || 0).toFixed(0)}ms
          </div>
          <div className="text-sm text-purple-700">Overall Avg</div>
        </div>
      </div>

      {/* Response Time Chart Legend */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Percentile Explanation</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-900">P50 (Median):</span>
            <p className="text-gray-600">50% of requests are faster than this</p>
          </div>
          <div>
            <span className="font-medium text-gray-900">P95:</span>
            <p className="text-gray-600">95% of requests are faster than this</p>
          </div>
          <div>
            <span className="font-medium text-gray-900">P99:</span>
            <p className="text-gray-600">99% of requests are faster than this</p>
          </div>
        </div>
      </div>

      {/* Endpoints Table */}
      {sortedEndpoints.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No API metrics available</p>
        </div>
      ) : (
        <DataTable columns={columns} data={sortedEndpoints} />
      )}

      {/* Performance Insights */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <h4 className="font-semibold text-orange-900 mb-2">Slowest Endpoints</h4>
          <ul className="space-y-2 text-sm">
            {sortedEndpoints.slice(0, 3).map((e, idx) => (
              <li key={idx} className="flex items-center justify-between">
                <span className="text-orange-800 truncate max-w-xs" title={e.endpoint}>
                  {e.method} {e.endpoint}
                </span>
                <span className="font-medium text-orange-900">{e.avgResponseTime}ms</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-semibold text-red-900 mb-2">High Error Rate</h4>
          <ul className="space-y-2 text-sm">
            {endpoints
              .filter(e => e.errorRate > 1)
              .sort((a, b) => b.errorRate - a.errorRate)
              .slice(0, 3)
              .map((e, idx) => (
                <li key={idx} className="flex items-center justify-between">
                  <span className="text-red-800 truncate max-w-xs" title={e.endpoint}>
                    {e.method} {e.endpoint}
                  </span>
                  <span className="font-medium text-red-900">{e.errorRate}%</span>
                </li>
              ))}
            {endpoints.filter(e => e.errorRate > 1).length === 0 && (
              <li className="text-red-800">No high error rates detected</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default APIResponseTimes;
