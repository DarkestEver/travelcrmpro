import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChartBarIcon, ClockIcon, CpuChipIcon, ServerIcon } from '@heroicons/react/24/outline';
import { LoadingSpinner } from '../../../components/shared/LoadingStates';
import MetricsCards from './MetricsCards';
import SlowQueryLog from './SlowQueryLog';
import CacheStats from './CacheStats';
import APIResponseTimes from './APIResponseTimes';
import ResourceUsage from './ResourceUsage';
import { getPerformanceMetrics } from '../../../services/api/performanceApi';

const PerformanceDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['performanceMetrics'],
    queryFn: getPerformanceMetrics,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    { id: 'queries', label: 'Slow Queries', icon: ClockIcon },
    { id: 'cache', label: 'Cache', icon: ServerIcon },
    { id: 'api', label: 'API Response Times', icon: ClockIcon },
    { id: 'resources', label: 'Resources', icon: CpuChipIcon },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Performance Monitoring</h1>
        <p className="text-gray-600 mt-1">
          Real-time performance metrics and system optimization insights
        </p>
      </div>

      {/* Overall Health Score */}
      <div className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium opacity-90">Overall Performance Score</div>
            <div className="text-4xl font-bold mt-2">
              {metrics?.overallScore || 0}
              <span className="text-2xl font-normal">/100</span>
            </div>
            <div className="text-sm mt-2 opacity-75">
              {metrics?.overallScore >= 90 ? 'Excellent' :
               metrics?.overallScore >= 70 ? 'Good' :
               metrics?.overallScore >= 50 ? 'Fair' : 'Needs Attention'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium opacity-90">Last Updated</div>
            <div className="text-lg mt-1">
              {new Date(metrics?.lastUpdated || Date.now()).toLocaleTimeString()}
            </div>
            <div className="text-xs mt-1 opacity-75">Auto-refreshing every 5s</div>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Avg Response Time</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {metrics?.avgResponseTime || 0}ms
              </div>
            </div>
            <ClockIcon className="w-8 h-8 text-blue-500" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            {metrics?.responseTimeTrend > 0 ? (
              <span className="text-red-600">↑ {Math.abs(metrics?.responseTimeTrend || 0)}%</span>
            ) : (
              <span className="text-green-600">↓ {Math.abs(metrics?.responseTimeTrend || 0)}%</span>
            )}
            <span className="text-gray-500 ml-1">vs last hour</span>
          </div>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Requests/min</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {metrics?.requestsPerMinute || 0}
              </div>
            </div>
            <ChartBarIcon className="w-8 h-8 text-green-500" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-gray-500">Peak: {metrics?.peakRequestsPerMinute || 0}/min</span>
          </div>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Cache Hit Rate</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {metrics?.cacheHitRate || 0}%
              </div>
            </div>
            <ServerIcon className="w-8 h-8 text-purple-500" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            {metrics?.cacheHitRate >= 80 ? (
              <span className="text-green-600">✓ Optimal</span>
            ) : (
              <span className="text-orange-600">⚠ Below target</span>
            )}
          </div>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Error Rate</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {metrics?.errorRate || 0}%
              </div>
            </div>
            <CpuChipIcon className="w-8 h-8 text-red-500" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            {metrics?.errorRate < 1 ? (
              <span className="text-green-600">✓ Healthy</span>
            ) : (
              <span className="text-red-600">⚠ High</span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {activeTab === 'overview' && <MetricsCards />}
        {activeTab === 'queries' && <SlowQueryLog />}
        {activeTab === 'cache' && <CacheStats />}
        {activeTab === 'api' && <APIResponseTimes />}
        {activeTab === 'resources' && <ResourceUsage />}
      </div>

      {/* Performance Alerts */}
      {metrics?.alerts && metrics.alerts.length > 0 && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <h3 className="text-lg font-semibold text-orange-900 mb-3">Performance Alerts</h3>
          <div className="space-y-2">
            {metrics.alerts.map((alert, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg">
                <span className="text-orange-600 text-xl">⚠</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{alert.title}</div>
                  <div className="text-sm text-gray-600 mt-1">{alert.description}</div>
                  {alert.recommendation && (
                    <div className="text-sm text-blue-600 mt-1">
                      💡 {alert.recommendation}
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Recommendations */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">Quick Wins</h4>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>• Enable compression for API responses</li>
            <li>• Increase cache TTL for static data</li>
            <li>• Add database indexes for slow queries</li>
            <li>• Optimize image sizes and formats</li>
          </ul>
        </div>
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-semibold text-green-900 mb-2">Performance Tips</h4>
          <ul className="space-y-1 text-sm text-green-800">
            <li>• Monitor during peak hours (9 AM - 5 PM)</li>
            <li>• Review slow queries weekly</li>
            <li>• Keep cache hit rate above 80%</li>
            <li>• Set up alerts for response time spikes</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
