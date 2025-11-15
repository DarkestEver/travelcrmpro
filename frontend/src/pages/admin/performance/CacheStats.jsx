import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ServerIcon, TrashIcon } from '@heroicons/react/24/outline';
import { DataTable } from '../../../components/shared';
import { LoadingSpinner, ButtonLoader } from '../../../components/shared/LoadingStates';
import { getCacheStats, clearCache, clearCacheKey } from '../../../services/api/performanceApi';

const CacheStats = () => {
  const queryClient = useQueryClient();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['cacheStats'],
    queryFn: getCacheStats,
    refetchInterval: 5000,
  });

  const clearAllMutation = useMutation({
    mutationFn: clearCache,
    onSuccess: () => {
      queryClient.invalidateQueries(['cacheStats']);
      alert('Cache cleared successfully!');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to clear cache');
    }
  });

  const clearKeyMutation = useMutation({
    mutationFn: (key) => clearCacheKey(key),
    onSuccess: () => {
      queryClient.invalidateQueries(['cacheStats']);
      alert('Cache key cleared successfully!');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to clear cache key');
    }
  });

  const handleClearAll = () => {
    if (window.confirm('Clear entire cache? This will temporarily impact performance.')) {
      clearAllMutation.mutate();
    }
  };

  const handleClearKey = (key) => {
    if (window.confirm(`Clear cache key: ${key}?`)) {
      clearKeyMutation.mutate(key);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatTTL = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  const columns = [
    {
      key: 'key',
      label: 'Cache Key',
      render: (item) => (
        <div className="text-sm">
          <div className="text-gray-900 font-medium">{item.key}</div>
          <div className="text-gray-500 text-xs">{item.pattern || 'Single Key'}</div>
        </div>
      )
    },
    {
      key: 'hits',
      label: 'Hits',
      render: (item) => (
        <div className="text-sm text-gray-900">
          {item.hits?.toLocaleString() || 0}
        </div>
      )
    },
    {
      key: 'misses',
      label: 'Misses',
      render: (item) => (
        <div className="text-sm text-gray-900">
          {item.misses?.toLocaleString() || 0}
        </div>
      )
    },
    {
      key: 'hitRate',
      label: 'Hit Rate',
      render: (item) => {
        const rate = item.hits / (item.hits + item.misses) * 100 || 0;
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full ${rate > 80 ? 'bg-green-500' : rate > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${rate}%` }}
              />
            </div>
            <span className="text-sm text-gray-900 w-12">{rate.toFixed(1)}%</span>
          </div>
        );
      }
    },
    {
      key: 'size',
      label: 'Size',
      render: (item) => (
        <div className="text-sm text-gray-900">
          {formatBytes(item.size || 0)}
        </div>
      )
    },
    {
      key: 'ttl',
      label: 'TTL',
      render: (item) => (
        <div className="text-sm text-gray-900">
          {item.ttl ? formatTTL(item.ttl) : 'No expiry'}
        </div>
      )
    },
    {
      key: 'lastAccessed',
      label: 'Last Accessed',
      render: (item) => (
        <div className="text-sm text-gray-900">
          {new Date(item.lastAccessed).toLocaleString()}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item) => (
        <button
          onClick={() => handleClearKey(item.key)}
          disabled={clearKeyMutation.isPending}
          className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
        >
          Clear
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
          <ServerIcon className="w-6 h-6 text-purple-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Cache Statistics</h2>
            <p className="text-sm text-gray-600">
              {stats?.totalKeys || 0} keys • {formatBytes(stats?.totalMemory || 0)} used
            </p>
          </div>
        </div>
        <button
          onClick={handleClearAll}
          disabled={clearAllMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          {clearAllMutation.isPending ? (
            <ButtonLoader />
          ) : (
            <>
              <TrashIcon className="w-4 h-4" />
              Clear All Cache
            </>
          )}
        </button>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-2xl font-bold text-green-900">
            {stats?.overallHitRate || 0}%
          </div>
          <div className="text-sm text-green-700">Overall Hit Rate</div>
          <div className="mt-2 text-xs text-green-600">
            {stats?.totalHits?.toLocaleString() || 0} hits
          </div>
        </div>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-2xl font-bold text-blue-900">
            {formatBytes(stats?.memoryUsage || 0)}
          </div>
          <div className="text-sm text-blue-700">Memory Usage</div>
          <div className="mt-2 text-xs text-blue-600">
            {stats?.memoryLimit ? `${((stats.memoryUsage / stats.memoryLimit) * 100).toFixed(1)}% of limit` : 'No limit'}
          </div>
        </div>
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="text-2xl font-bold text-orange-900">
            {stats?.evictions?.toLocaleString() || 0}
          </div>
          <div className="text-sm text-orange-700">Evictions</div>
          <div className="mt-2 text-xs text-orange-600">
            Last hour
          </div>
        </div>
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="text-2xl font-bold text-purple-900">
            {stats?.totalKeys || 0}
          </div>
          <div className="text-sm text-purple-700">Total Keys</div>
          <div className="mt-2 text-xs text-purple-600">
            Active in cache
          </div>
        </div>
      </div>

      {/* Hit/Miss Chart */}
      <div className="p-4 bg-white border border-gray-200 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Cache Performance (Last Hour)</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Hits</span>
              <span className="font-medium text-green-600">
                {stats?.totalHits?.toLocaleString() || 0}
              </span>
            </div>
            <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-green-500 h-full transition-all"
                style={{
                  width: `${(stats?.totalHits / (stats?.totalHits + stats?.totalMisses) * 100) || 0}%`
                }}
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Misses</span>
              <span className="font-medium text-red-600">
                {stats?.totalMisses?.toLocaleString() || 0}
              </span>
            </div>
            <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-red-500 h-full transition-all"
                style={{
                  width: `${(stats?.totalMisses / (stats?.totalHits + stats?.totalMisses) * 100) || 0}%`
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Cache Keys Table */}
      {stats?.keys && stats.keys.length > 0 ? (
        <DataTable columns={columns} data={stats.keys} />
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <ServerIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No cache data available</p>
        </div>
      )}

      {/* Cache Recommendations */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">Optimization Recommendations</h4>
        <ul className="space-y-1 text-sm text-blue-800">
          {stats?.overallHitRate < 80 && (
            <li>• Hit rate below target (80%). Review cache strategy and TTL settings.</li>
          )}
          {stats?.evictions > 100 && (
            <li>• High eviction rate detected. Consider increasing cache memory limit.</li>
          )}
          {stats?.memoryUsage > stats?.memoryLimit * 0.9 && (
            <li>• Cache memory usage above 90%. Adjust TTL or increase memory allocation.</li>
          )}
          {stats?.totalKeys > 10000 && (
            <li>• Large number of cache keys. Implement key namespacing and cleanup strategy.</li>
          )}
          {stats?.overallHitRate >= 80 && stats?.evictions < 100 && (
            <li>✓ Cache performance is optimal. Continue monitoring.</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default CacheStats;
