import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HeartIcon, ServerIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { LoadingSpinner } from '../../../components/shared/LoadingStates';
import ServiceStatus from './ServiceStatus';
import HealthMetrics from './HealthMetrics';
import AlertPanel from './AlertPanel';
import UptimeMonitor from './UptimeMonitor';
import { getSystemHealth } from '../../../services/api/healthApi';

const SystemHealth = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: health, isLoading } = useQuery({
    queryKey: ['systemHealth'],
    queryFn: getSystemHealth,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: HeartIcon },
    { id: 'services', label: 'Services', icon: ServerIcon },
    { id: 'metrics', label: 'Metrics', icon: CheckCircleIcon },
    { id: 'alerts', label: 'Alerts', icon: ExclamationTriangleIcon },
    { id: 'uptime', label: 'Uptime', icon: CheckCircleIcon },
  ];

  const getHealthScoreColor = (score) => {
    if (score >= 90) return 'from-green-500 to-green-600';
    if (score >= 70) return 'from-yellow-500 to-yellow-600';
    if (score >= 50) return 'from-orange-500 to-orange-600';
    return 'from-red-500 to-red-600';
  };

  const getHealthStatus = (score) => {
    if (score >= 90) return { text: 'Healthy', color: 'text-green-600' };
    if (score >= 70) return { text: 'Degraded', color: 'text-yellow-600' };
    if (score >= 50) return { text: 'Warning', color: 'text-orange-600' };
    return { text: 'Critical', color: 'text-red-600' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const status = getHealthStatus(health?.overallScore || 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Health Monitoring</h1>
        <p className="text-gray-600 mt-1">
          Real-time monitoring of system health and service availability
        </p>
      </div>

      {/* Overall Health Score */}
      <div className={`p-6 bg-gradient-to-r ${getHealthScoreColor(health?.overallScore || 0)} rounded-lg text-white`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium opacity-90">System Health Score</div>
            <div className="flex items-center gap-3 mt-2">
              <div className="text-5xl font-bold">
                {health?.overallScore || 0}
                <span className="text-2xl font-normal">/100</span>
              </div>
              <div className="text-2xl font-semibold">{status.text}</div>
            </div>
            <div className="text-sm mt-2 opacity-75">
              Last checked: {new Date(health?.lastCheck || Date.now()).toLocaleString()}
            </div>
          </div>
          <div className="text-right">
            <HeartIcon className="w-16 h-16 opacity-75" />
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Services Status</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {health?.services?.healthy || 0}/{health?.services?.total || 0}
              </div>
            </div>
            <CheckCircleIcon className="w-8 h-8 text-green-500" />
          </div>
          <div className="mt-2 text-sm">
            <span className="text-green-600">{health?.services?.healthy || 0} healthy</span>
            {health?.services?.degraded > 0 && (
              <span className="text-yellow-600 ml-2">{health?.services?.degraded} degraded</span>
            )}
            {health?.services?.down > 0 && (
              <span className="text-red-600 ml-2">{health?.services?.down} down</span>
            )}
          </div>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Active Alerts</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {health?.alerts?.active || 0}
              </div>
            </div>
            <ExclamationTriangleIcon className={`w-8 h-8 ${health?.alerts?.active > 0 ? 'text-red-500' : 'text-gray-400'}`} />
          </div>
          <div className="mt-2 text-sm">
            {health?.alerts?.critical > 0 && (
              <span className="text-red-600">{health?.alerts?.critical} critical</span>
            )}
            {health?.alerts?.warning > 0 && (
              <span className="text-orange-600 ml-2">{health?.alerts?.warning} warnings</span>
            )}
          </div>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">System Uptime</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {health?.uptime?.current || '99.9'}%
              </div>
            </div>
            <HeartIcon className="w-8 h-8 text-blue-500" />
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {health?.uptime?.days || 0} days
          </div>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Response Time</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {health?.responseTime?.avg || 0}ms
              </div>
            </div>
            <ServerIcon className="w-8 h-8 text-purple-500" />
          </div>
          <div className="mt-2 text-sm">
            {health?.responseTime?.trend > 0 ? (
              <span className="text-red-600">↑ {health?.responseTime?.trend}%</span>
            ) : (
              <span className="text-green-600">↓ {Math.abs(health?.responseTime?.trend || 0)}%</span>
            )}
          </div>
        </div>
      </div>

      {/* Critical Alerts Banner */}
      {health?.alerts?.critical > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900">Critical Alerts Detected</h3>
              <p className="text-sm text-red-700 mt-1">
                {health.alerts.critical} critical alert{health.alerts.critical > 1 ? 's' : ''} require{health.alerts.critical === 1 ? 's' : ''} immediate attention
              </p>
              <button
                onClick={() => setActiveTab('alerts')}
                className="mt-2 text-sm font-medium text-red-600 hover:text-red-700"
              >
                View All Alerts →
              </button>
            </div>
          </div>
        </div>
      )}

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
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Overview</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Service Health</h4>
                  <div className="space-y-2">
                    {health?.services?.list?.slice(0, 5).map((service, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-900">{service.name}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          service.status === 'healthy' ? 'bg-green-100 text-green-600' :
                          service.status === 'degraded' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-red-100 text-red-600'
                        }`}>
                          {service.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Recent Incidents</h4>
                  <div className="space-y-2">
                    {health?.incidents?.recent?.slice(0, 5).map((incident, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm font-medium text-gray-900">{incident.title}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          {new Date(incident.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                    {!health?.incidents?.recent?.length && (
                      <div className="text-center py-6 text-gray-500">No recent incidents</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'services' && <ServiceStatus />}
        {activeTab === 'metrics' && <HealthMetrics />}
        {activeTab === 'alerts' && <AlertPanel />}
        {activeTab === 'uptime' && <UptimeMonitor />}
      </div>

      {/* Health Recommendations */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">Recommendations</h4>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>• Monitor critical services during peak hours</li>
            <li>• Set up automated health check notifications</li>
            <li>• Review and acknowledge pending alerts</li>
            <li>• Keep system dependencies up to date</li>
          </ul>
        </div>
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-semibold text-green-900 mb-2">Best Practices</h4>
          <ul className="space-y-1 text-sm text-green-800">
            <li>• Regular health checks every 10 seconds</li>
            <li>• Automated incident response protocols</li>
            <li>• Service redundancy and failover mechanisms</li>
            <li>• Comprehensive logging and monitoring</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SystemHealth;
