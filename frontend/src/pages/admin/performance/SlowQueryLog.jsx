import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClockIcon } from '@heroicons/react/24/outline';
import { DataTable, Modal } from '../../../components/shared';
import { LoadingSpinner } from '../../../components/shared/LoadingStates';
import { getSlowQueries } from '../../../services/api/performanceApi';

const SlowQueryLog = () => {
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [timeRange, setTimeRange] = useState('1h');

  const { data: queries = [], isLoading } = useQuery({
    queryKey: ['slowQueries', timeRange],
    queryFn: () => getSlowQueries(timeRange),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleExportCSV = () => {
    if (queries.length === 0) return;

    const headers = ['Query', 'Execution Time', 'Frequency', 'Last Executed', 'Database', 'Collection'];
    const rows = queries.map(q => [
      q.query,
      `${q.executionTime}ms`,
      q.frequency,
      new Date(q.lastExecuted).toLocaleString(),
      q.database || 'N/A',
      q.collection || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `slow-queries-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getSeverityColor = (time) => {
    if (time > 1000) return 'text-red-600 bg-red-100';
    if (time > 500) return 'text-orange-600 bg-orange-100';
    return 'text-yellow-600 bg-yellow-100';
  };

  const getOptimizationSuggestion = (query) => {
    const suggestions = [];
    
    if (!query.hasIndex) {
      suggestions.push('Add index to improve lookup speed');
    }
    if (query.scannedDocs > 1000) {
      suggestions.push('Reduce scanned documents with better filters');
    }
    if (query.query.includes('$or')) {
      suggestions.push('Consider splitting $or queries or adding compound index');
    }
    if (query.returnsLargeDocuments) {
      suggestions.push('Use projection to return only needed fields');
    }
    
    return suggestions.length > 0 ? suggestions : ['Query appears optimized'];
  };

  const columns = [
    {
      key: 'query',
      label: 'Query',
      render: (q) => (
        <div className="text-sm max-w-md">
          <code className="text-xs bg-gray-100 p-1 rounded block truncate">
            {q.query}
          </code>
          <div className="text-gray-500 mt-1">
            {q.collection || 'Unknown Collection'}
          </div>
        </div>
      )
    },
    {
      key: 'executionTime',
      label: 'Execution Time',
      render: (q) => (
        <div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(q.executionTime)}`}>
            {q.executionTime}ms
          </span>
        </div>
      )
    },
    {
      key: 'frequency',
      label: 'Frequency',
      render: (q) => (
        <div className="text-sm text-gray-900">
          {q.frequency} <span className="text-gray-500">times</span>
        </div>
      )
    },
    {
      key: 'scannedDocs',
      label: 'Docs Scanned',
      render: (q) => (
        <div className="text-sm">
          <div className="text-gray-900">{q.scannedDocs?.toLocaleString() || 0}</div>
          <div className="text-gray-500 text-xs">
            Returned: {q.returnedDocs || 0}
          </div>
        </div>
      )
    },
    {
      key: 'lastExecuted',
      label: 'Last Executed',
      render: (q) => (
        <div className="text-sm text-gray-900">
          {new Date(q.lastExecuted).toLocaleString()}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (q) => (
        <button
          onClick={() => setSelectedQuery(q)}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          Analyze
        </button>
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
          <ClockIcon className="w-6 h-6 text-orange-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Slow Query Log</h2>
            <p className="text-sm text-gray-600">
              {queries.length} slow {queries.length === 1 ? 'query' : 'queries'} detected
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <button
            onClick={handleExportCSV}
            disabled={queries.length === 0}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-2xl font-bold text-red-900">
            {queries.filter(q => q.executionTime > 1000).length}
          </div>
          <div className="text-sm text-red-700">Critical (&gt;1s)</div>
        </div>
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="text-2xl font-bold text-orange-900">
            {queries.filter(q => q.executionTime > 500 && q.executionTime <= 1000).length}
          </div>
          <div className="text-sm text-orange-700">Warning (500ms-1s)</div>
        </div>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-2xl font-bold text-yellow-900">
            {queries.filter(q => q.executionTime <= 500).length}
          </div>
          <div className="text-sm text-yellow-700">Slow (&lt;500ms)</div>
        </div>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-2xl font-bold text-blue-900">
            {queries.reduce((sum, q) => sum + (q.frequency || 0), 0)}
          </div>
          <div className="text-sm text-blue-700">Total Executions</div>
        </div>
      </div>

      {/* Query Table */}
      {queries.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No slow queries detected</p>
        </div>
      ) : (
        <DataTable columns={columns} data={queries} />
      )}

      {/* Query Detail Modal */}
      {selectedQuery && (
        <Modal isOpen={true} onClose={() => setSelectedQuery(null)} title="Query Analysis">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Query</label>
              <pre className="text-xs bg-gray-100 p-3 rounded-lg overflow-x-auto">
                {JSON.stringify(JSON.parse(selectedQuery.query), null, 2)}
              </pre>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Execution Time</label>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(selectedQuery.executionTime)}`}>
                  {selectedQuery.executionTime}ms
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                <div className="text-sm text-gray-900">{selectedQuery.frequency} times</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Documents Scanned</label>
                <div className="text-sm text-gray-900">{selectedQuery.scannedDocs?.toLocaleString()}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Documents Returned</label>
                <div className="text-sm text-gray-900">{selectedQuery.returnedDocs}</div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Execution Plan</label>
              <div className="text-sm space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-gray-700">Index Used:</span>
                  <span className={selectedQuery.hasIndex ? 'text-green-600' : 'text-red-600'}>
                    {selectedQuery.hasIndex ? '✓ Yes' : '✕ No'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-gray-700">Collection Scan:</span>
                  <span className={selectedQuery.collectionScan ? 'text-red-600' : 'text-green-600'}>
                    {selectedQuery.collectionScan ? '✕ Yes' : '✓ No'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Optimization Suggestions</label>
              <ul className="space-y-2">
                {getOptimizationSuggestion(selectedQuery).map((suggestion, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-blue-600">💡</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>

            {selectedQuery.explainPlan && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Explain Plan</label>
                <pre className="text-xs bg-gray-100 p-3 rounded-lg overflow-x-auto max-h-60">
                  {JSON.stringify(selectedQuery.explainPlan, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SlowQueryLog;
