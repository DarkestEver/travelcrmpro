import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { LoadingSpinner } from '../../../components/shared/LoadingStates';
import { getHealthMetrics } from '../../../services/api/healthApi';

const HealthMetrics = () => {
  const [timeRange, setTimeRange] = useState('24h');

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['healthMetrics', timeRange],
    queryFn: () => getHealthMetrics(timeRange),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getStatusColor = (value, thresholds) => {
    if (value >= thresholds.critical) return 'text-red-600 bg-red-100';
    if (value >= thresholds.warning) return 'text-orange-600 bg-orange-100';
    return 'text-green-600 bg-green-100';
  };

  const getHealthColor = (percentage) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-yellow-500';
    if (percentage >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ChartBarIcon className="w-6 h-6 text-green-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Health Metrics</h2>
            <p className="text-sm text-gray-600">System health trends over time</p>
          </div>
        </div>
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
      </div>

      {/* Current Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">CPU Usage</div>
          <div className="text-2xl font-bold text-gray-900">{metrics?.cpu?.current || 0}%</div>
          <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all ${getHealthColor(100 - (metrics?.cpu?.current || 0))}`}
              style={{ width: `${metrics?.cpu?.current || 0}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-gray-600">
            Avg: {metrics?.cpu?.average || 0}% | Peak: {metrics?.cpu?.peak || 0}%
          </div>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Memory Usage</div>
          <div className="text-2xl font-bold text-gray-900">{metrics?.memory?.current || 0}%</div>
          <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all ${getHealthColor(100 - (metrics?.memory?.current || 0))}`}
              style={{ width: `${metrics?.memory?.current || 0}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-gray-600">
            Avg: {metrics?.memory?.average || 0}% | Peak: {metrics?.memory?.peak || 0}%
          </div>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Database Connections</div>
          <div className="text-2xl font-bold text-gray-900">{metrics?.database?.connections || 0}</div>
          <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all ${getHealthColor(100 - ((metrics?.database?.connections / metrics?.database?.maxConnections) * 100 || 0))}`}
              style={{ width: `${(metrics?.database?.connections / metrics?.database?.maxConnections) * 100 || 0}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-gray-600">
            Max: {metrics?.database?.maxConnections || 0} | Pool: {metrics?.database?.poolSize || 0}
          </div>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Error Rate</div>
          <div className="text-2xl font-bold text-gray-900">{metrics?.errorRate?.current || 0}%</div>
          <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all ${metrics?.errorRate?.current > 5 ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: `${metrics?.errorRate?.current || 0}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-gray-600">
            Total Errors: {metrics?.errorRate?.totalErrors || 0}
          </div>
        </div>
      </div>

      {/* Trend Charts */}
      <div className="grid grid-cols-2 gap-6">
        {/* CPU Trend */}
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-4">CPU Usage Trend</h4>
          <div className="h-48 flex items-end gap-1">
            {metrics?.cpu?.history?.map((value, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center">
                <div
                  className={`w-full ${getHealthColor(100 - value)} rounded-t transition-all hover:opacity-75`}
                  style={{ height: `${value}%` }}
                  title={`${value}%`}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-3 text-xs text-gray-600">
            <span>-{timeRange}</span>
            <span>Now</span>
          </div>
        </div>

        {/* Memory Trend */}
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-4">Memory Usage Trend</h4>
          <div className="h-48 flex items-end gap-1">
            {metrics?.memory?.history?.map((value, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center">
                <div
                  className={`w-full ${getHealthColor(100 - value)} rounded-t transition-all hover:opacity-75`}
                  style={{ height: `${value}%` }}
                  title={`${value}%`}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-3 text-xs text-gray-600">
            <span>-{timeRange}</span>
            <span>Now</span>
          </div>
        </div>

        {/* Response Time Trend */}
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-4">Response Time Trend</h4>
          <div className="h-48 flex items-end gap-1">
            {metrics?.responseTime?.history?.map((value, idx) => {
              const normalized = Math.min((value / 1000) * 100, 100); // Normalize to 0-100%
              return (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div
                    className={`w-full ${value > 500 ? 'bg-red-500' : value > 200 ? 'bg-yellow-500' : 'bg-green-500'} rounded-t transition-all hover:opacity-75`}
                    style={{ height: `${normalized}%` }}
                    title={`${value}ms`}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-3 text-xs text-gray-600">
            <span>-{timeRange}</span>
            <span>Now</span>
          </div>
        </div>

        {/* Error Rate Trend */}
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-4">Error Rate Trend</h4>
          <div className="h-48 flex items-end gap-1">
            {metrics?.errorRate?.history?.map((value, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center">
                <div
                  className={`w-full ${value > 5 ? 'bg-red-500' : value > 1 ? 'bg-orange-500' : 'bg-green-500'} rounded-t transition-all hover:opacity-75`}
                  style={{ height: `${Math.min(value * 10, 100)}%` }}
                  title={`${value}%`}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-3 text-xs text-gray-600">
            <span>-{timeRange}</span>
            <span>Now</span>
          </div>
        </div>
      </div>

      {/* Database Metrics */}
      <div className="p-4 bg-white border border-gray-200 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-4">Database Performance</h4>
        <div className="grid grid-cols-4 gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-xs text-blue-600 mb-1">Query Time (Avg)</div>
            <div className="text-xl font-bold text-blue-900">{metrics?.database?.avgQueryTime || 0}ms</div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-xs text-green-600 mb-1">Queries/sec</div>
            <div className="text-xl font-bold text-green-900">{metrics?.database?.queriesPerSec || 0}</div>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="text-xs text-purple-600 mb-1">Cache Hit Rate</div>
            <div className="text-xl font-bold text-purple-900">{metrics?.database?.cacheHitRate || 0}%</div>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg">
            <div className="text-xs text-orange-600 mb-1">Slow Queries</div>
            <div className="text-xl font-bold text-orange-900">{metrics?.database?.slowQueries || 0}</div>
          </div>
        </div>
      </div>

      {/* API Metrics */}
      <div className="p-4 bg-white border border-gray-200 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-4">API Performance</h4>
        <div className="grid grid-cols-5 gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-xs text-blue-600 mb-1">Requests/min</div>
            <div className="text-xl font-bold text-blue-900">{metrics?.api?.requestsPerMin || 0}</div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-xs text-green-600 mb-1">Success Rate</div>
            <div className="text-xl font-bold text-green-900">{metrics?.api?.successRate || 0}%</div>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="text-xs text-purple-600 mb-1">Avg Response</div>
            <div className="text-xl font-bold text-purple-900">{metrics?.api?.avgResponse || 0}ms</div>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg">
            <div className="text-xs text-orange-600 mb-1">4xx Errors</div>
            <div className="text-xl font-bold text-orange-900">{metrics?.api?.clientErrors || 0}</div>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <div className="text-xs text-red-600 mb-1">5xx Errors</div>
            <div className="text-xl font-bold text-red-900">{metrics?.api?.serverErrors || 0}</div>
          </div>
        </div>
      </div>

      {/* Health Summary */}
      <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-3">Health Summary</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-gray-600 mb-2">System Health</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full ${getHealthColor(metrics?.overallHealth || 0)}`}
                  style={{ width: `${metrics?.overallHealth || 0}%` }}
                />
              </div>
              <span className="font-semibold text-gray-900">{metrics?.overallHealth || 0}%</span>
            </div>
          </div>
          <div>
            <div className="text-gray-600 mb-2">Performance</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full ${getHealthColor(metrics?.performanceScore || 0)}`}
                  style={{ width: `${metrics?.performanceScore || 0}%` }}
                />
              </div>
              <span className="font-semibold text-gray-900">{metrics?.performanceScore || 0}%</span>
            </div>
          </div>
          <div>
            <div className="text-gray-600 mb-2">Stability</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full ${getHealthColor(metrics?.stabilityScore || 0)}`}
                  style={{ width: `${metrics?.stabilityScore || 0}%` }}
                />
              </div>
              <span className="font-semibold text-gray-900">{metrics?.stabilityScore || 0}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthMetrics;
