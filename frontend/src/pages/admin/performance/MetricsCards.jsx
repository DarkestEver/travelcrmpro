import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import { LoadingSpinner } from '../../../components/shared/LoadingStates';
import { getDetailedMetrics } from '../../../services/api/performanceApi';

const MetricsCards = () => {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['detailedMetrics'],
    queryFn: getDetailedMetrics,
    refetchInterval: 5000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const metricCards = [
    {
      category: 'API Performance',
      metrics: [
        {
          label: 'Average Response Time',
          value: `${metrics?.api?.avgResponseTime || 0}ms`,
          trend: metrics?.api?.responseTimeTrend || 0,
          target: '< 200ms',
          status: (metrics?.api?.avgResponseTime || 0) < 200 ? 'good' : 'warning'
        },
        {
          label: 'P95 Response Time',
          value: `${metrics?.api?.p95ResponseTime || 0}ms`,
          trend: metrics?.api?.p95Trend || 0,
          target: '< 500ms',
          status: (metrics?.api?.p95ResponseTime || 0) < 500 ? 'good' : 'warning'
        },
        {
          label: 'P99 Response Time',
          value: `${metrics?.api?.p99ResponseTime || 0}ms`,
          trend: metrics?.api?.p99Trend || 0,
          target: '< 1000ms',
          status: (metrics?.api?.p99ResponseTime || 0) < 1000 ? 'good' : 'critical'
        },
        {
          label: 'Throughput',
          value: `${metrics?.api?.throughput || 0} req/s`,
          trend: metrics?.api?.throughputTrend || 0,
          target: '> 100 req/s',
          status: (metrics?.api?.throughput || 0) > 100 ? 'good' : 'info'
        }
      ]
    },
    {
      category: 'Database Performance',
      metrics: [
        {
          label: 'Query Execution Time',
          value: `${metrics?.database?.avgQueryTime || 0}ms`,
          trend: metrics?.database?.queryTimeTrend || 0,
          target: '< 100ms',
          status: (metrics?.database?.avgQueryTime || 0) < 100 ? 'good' : 'warning'
        },
        {
          label: 'Active Connections',
          value: metrics?.database?.activeConnections || 0,
          trend: metrics?.database?.connectionsTrend || 0,
          target: '< 50',
          status: (metrics?.database?.activeConnections || 0) < 50 ? 'good' : 'warning'
        },
        {
          label: 'Slow Queries',
          value: metrics?.database?.slowQueries || 0,
          trend: metrics?.database?.slowQueriesTrend || 0,
          target: '0',
          status: (metrics?.database?.slowQueries || 0) === 0 ? 'good' : 'critical'
        },
        {
          label: 'Connection Pool Usage',
          value: `${metrics?.database?.poolUsage || 0}%`,
          trend: metrics?.database?.poolUsageTrend || 0,
          target: '< 80%',
          status: (metrics?.database?.poolUsage || 0) < 80 ? 'good' : 'warning'
        }
      ]
    },
    {
      category: 'Cache Performance',
      metrics: [
        {
          label: 'Hit Rate',
          value: `${metrics?.cache?.hitRate || 0}%`,
          trend: metrics?.cache?.hitRateTrend || 0,
          target: '> 80%',
          status: (metrics?.cache?.hitRate || 0) > 80 ? 'good' : 'warning'
        },
        {
          label: 'Memory Usage',
          value: `${metrics?.cache?.memoryUsage || 0}MB`,
          trend: metrics?.cache?.memoryTrend || 0,
          target: '< 512MB',
          status: (metrics?.cache?.memoryUsage || 0) < 512 ? 'good' : 'warning'
        },
        {
          label: 'Evictions',
          value: metrics?.cache?.evictions || 0,
          trend: metrics?.cache?.evictionsTrend || 0,
          target: '< 100/hr',
          status: (metrics?.cache?.evictions || 0) < 100 ? 'good' : 'warning'
        },
        {
          label: 'Keys Stored',
          value: metrics?.cache?.totalKeys || 0,
          trend: metrics?.cache?.keysTrend || 0,
          target: 'Monitor',
          status: 'info'
        }
      ]
    },
    {
      category: 'System Resources',
      metrics: [
        {
          label: 'CPU Usage',
          value: `${metrics?.system?.cpuUsage || 0}%`,
          trend: metrics?.system?.cpuTrend || 0,
          target: '< 70%',
          status: (metrics?.system?.cpuUsage || 0) < 70 ? 'good' : 'warning'
        },
        {
          label: 'Memory Usage',
          value: `${metrics?.system?.memoryUsage || 0}%`,
          trend: metrics?.system?.memoryTrend || 0,
          target: '< 80%',
          status: (metrics?.system?.memoryUsage || 0) < 80 ? 'good' : 'warning'
        },
        {
          label: 'Disk Usage',
          value: `${metrics?.system?.diskUsage || 0}%`,
          trend: metrics?.system?.diskTrend || 0,
          target: '< 85%',
          status: (metrics?.system?.diskUsage || 0) < 85 ? 'good' : 'critical'
        },
        {
          label: 'Network I/O',
          value: `${metrics?.system?.networkIO || 0} Mbps`,
          trend: metrics?.system?.networkTrend || 0,
          target: 'Monitor',
          status: 'info'
        }
      ]
    }
  ];

  const getStatusColor = (status) => {
    const colors = {
      good: 'text-green-600 bg-green-100',
      warning: 'text-orange-600 bg-orange-100',
      critical: 'text-red-600 bg-red-100',
      info: 'text-blue-600 bg-blue-100'
    };
    return colors[status] || colors.info;
  };

  const getStatusIcon = (status) => {
    const icons = {
      good: '✓',
      warning: '⚠',
      critical: '✕',
      info: 'ℹ'
    };
    return icons[status] || icons.info;
  };

  return (
    <div className="space-y-6">
      {metricCards.map((category, idx) => (
        <div key={idx} className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">{category.category}</h3>
          <div className="grid grid-cols-2 gap-4">
            {category.metrics.map((metric, midx) => (
              <div key={midx} className="p-4 bg-gray-50 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-1">{metric.label}</div>
                    <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                    
                    {/* Trend */}
                    <div className="flex items-center gap-2 mt-2">
                      {metric.trend !== 0 && (
                        <div className={`flex items-center gap-1 text-sm ${
                          metric.trend > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {metric.trend > 0 ? (
                            <ArrowTrendingUpIcon className="w-4 h-4" />
                          ) : (
                            <ArrowTrendingDownIcon className="w-4 h-4" />
                          )}
                          <span>{Math.abs(metric.trend)}%</span>
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        Target: {metric.target}
                      </div>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(metric.status)}`}>
                    {getStatusIcon(metric.status)}
                  </div>
                </div>

                {/* Sparkline (Simplified) */}
                <div className="mt-3 h-8 flex items-end gap-1">
                  {Array.from({ length: 10 }).map((_, i) => {
                    const height = Math.random() * 100;
                    return (
                      <div
                        key={i}
                        className="flex-1 bg-blue-500 rounded-t opacity-50 hover:opacity-100 transition-opacity"
                        style={{ height: `${height}%` }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Summary Stats */}
      <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-3">Performance Summary</h4>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Healthy Metrics</div>
            <div className="text-xl font-bold text-green-600">
              {metricCards.reduce((acc, cat) => 
                acc + cat.metrics.filter(m => m.status === 'good').length, 0
              )}
            </div>
          </div>
          <div>
            <div className="text-gray-600">Warnings</div>
            <div className="text-xl font-bold text-orange-600">
              {metricCards.reduce((acc, cat) => 
                acc + cat.metrics.filter(m => m.status === 'warning').length, 0
              )}
            </div>
          </div>
          <div>
            <div className="text-gray-600">Critical</div>
            <div className="text-xl font-bold text-red-600">
              {metricCards.reduce((acc, cat) => 
                acc + cat.metrics.filter(m => m.status === 'critical').length, 0
              )}
            </div>
          </div>
          <div>
            <div className="text-gray-600">Total Metrics</div>
            <div className="text-xl font-bold text-gray-900">
              {metricCards.reduce((acc, cat) => acc + cat.metrics.length, 0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsCards;
