import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CpuChipIcon } from '@heroicons/react/24/outline';
import { LoadingSpinner } from '../../../components/shared/LoadingStates';
import { getResourceUsage } from '../../../services/api/performanceApi';

const ResourceUsage = () => {
  const { data: usage, isLoading } = useQuery({
    queryKey: ['resourceUsage'],
    queryFn: getResourceUsage,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-orange-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusColor = (percentage) => {
    if (percentage >= 90) return 'text-red-600 bg-red-100';
    if (percentage >= 70) return 'text-orange-600 bg-orange-100';
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
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
      <div className="flex items-center gap-3">
        <CpuChipIcon className="w-6 h-6 text-purple-600" />
        <div>
          <h2 className="text-lg font-semibold text-gray-900">System Resource Usage</h2>
          <p className="text-sm text-gray-600">Real-time monitoring of system resources</p>
        </div>
      </div>

      {/* CPU Usage */}
      <div className="p-6 bg-white border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">CPU Usage</h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(usage?.cpu?.usage || 0)}`}>
            {usage?.cpu?.usage || 0}%
          </span>
        </div>
        
        <div className="space-y-4">
          {/* Overall CPU Bar */}
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Overall</span>
              <span className="font-medium text-gray-900">{usage?.cpu?.usage || 0}%</span>
            </div>
            <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className={`h-full transition-all ${getUsageColor(usage?.cpu?.usage || 0)}`}
                style={{ width: `${usage?.cpu?.usage || 0}%` }}
              />
            </div>
          </div>

          {/* CPU Cores */}
          <div className="grid grid-cols-4 gap-3">
            {usage?.cpu?.cores?.map((core, idx) => (
              <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">Core {idx + 1}</div>
                <div className="text-lg font-bold text-gray-900">{core.usage}%</div>
                <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all ${getUsageColor(core.usage)}`}
                    style={{ width: `${core.usage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* CPU Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div>
              <div className="text-sm text-gray-600">Load Average (1m)</div>
              <div className="text-xl font-bold text-gray-900">{usage?.cpu?.loadAverage?.[0] || 0}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Load Average (5m)</div>
              <div className="text-xl font-bold text-gray-900">{usage?.cpu?.loadAverage?.[1] || 0}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Load Average (15m)</div>
              <div className="text-xl font-bold text-gray-900">{usage?.cpu?.loadAverage?.[2] || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Memory Usage */}
      <div className="p-6 bg-white border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Memory Usage</h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(usage?.memory?.usagePercent || 0)}`}>
            {usage?.memory?.usagePercent || 0}%
          </span>
        </div>

        <div className="space-y-4">
          {/* Memory Bar */}
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">
                {formatBytes(usage?.memory?.used || 0)} / {formatBytes(usage?.memory?.total || 0)}
              </span>
              <span className="font-medium text-gray-900">{usage?.memory?.usagePercent || 0}%</span>
            </div>
            <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className={`h-full transition-all ${getUsageColor(usage?.memory?.usagePercent || 0)}`}
                style={{ width: `${usage?.memory?.usagePercent || 0}%` }}
              />
            </div>
          </div>

          {/* Memory Breakdown */}
          <div className="grid grid-cols-4 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-xs text-blue-600 mb-1">Used</div>
              <div className="text-lg font-bold text-blue-900">{formatBytes(usage?.memory?.used || 0)}</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-xs text-green-600 mb-1">Free</div>
              <div className="text-lg font-bold text-green-900">{formatBytes(usage?.memory?.free || 0)}</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="text-xs text-purple-600 mb-1">Cached</div>
              <div className="text-lg font-bold text-purple-900">{formatBytes(usage?.memory?.cached || 0)}</div>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <div className="text-xs text-orange-600 mb-1">Swap Used</div>
              <div className="text-lg font-bold text-orange-900">{formatBytes(usage?.memory?.swapUsed || 0)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Disk Usage */}
      <div className="p-6 bg-white border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Disk Usage</h3>
        </div>

        <div className="space-y-4">
          {usage?.disk?.partitions?.map((partition, idx) => (
            <div key={idx} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-medium text-gray-900">{partition.mount}</div>
                  <div className="text-sm text-gray-600">{partition.device}</div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(partition.usagePercent || 0)}`}>
                  {partition.usagePercent || 0}%
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">
                  {formatBytes(partition.used || 0)} / {formatBytes(partition.total || 0)}
                </span>
                <span className="text-gray-600">Free: {formatBytes(partition.free || 0)}</span>
              </div>
              <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full transition-all ${getUsageColor(partition.usagePercent || 0)}`}
                  style={{ width: `${partition.usagePercent || 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Network I/O */}
      <div className="p-6 bg-white border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Network I/O</h3>
        
        <div className="grid grid-cols-2 gap-6">
          {/* Inbound */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Inbound</h4>
              <span className="text-sm text-gray-600">{usage?.network?.inbound?.rate || 0} Mbps</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Current</span>
                <span className="font-medium text-green-600">{formatBytes(usage?.network?.inbound?.current || 0)}/s</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Total</span>
                <span className="font-medium text-gray-900">{formatBytes(usage?.network?.inbound?.total || 0)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Packets</span>
                <span className="font-medium text-gray-900">{usage?.network?.inbound?.packets?.toLocaleString() || 0}</span>
              </div>
            </div>
          </div>

          {/* Outbound */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Outbound</h4>
              <span className="text-sm text-gray-600">{usage?.network?.outbound?.rate || 0} Mbps</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Current</span>
                <span className="font-medium text-blue-600">{formatBytes(usage?.network?.outbound?.current || 0)}/s</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Total</span>
                <span className="font-medium text-gray-900">{formatBytes(usage?.network?.outbound?.total || 0)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Packets</span>
                <span className="font-medium text-gray-900">{usage?.network?.outbound?.packets?.toLocaleString() || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Network Connections */}
        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{usage?.network?.connections?.active || 0}</div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{usage?.network?.connections?.established || 0}</div>
            <div className="text-sm text-gray-600">Established</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{usage?.network?.connections?.timeWait || 0}</div>
            <div className="text-sm text-gray-600">Time Wait</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{usage?.network?.connections?.closeWait || 0}</div>
            <div className="text-sm text-gray-600">Close Wait</div>
          </div>
        </div>
      </div>

      {/* Process Stats */}
      <div className="p-6 bg-white border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Process Statistics</h3>
        
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-600 mb-1">Total Processes</div>
            <div className="text-2xl font-bold text-blue-900">{usage?.processes?.total || 0}</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-sm text-green-600 mb-1">Running</div>
            <div className="text-2xl font-bold text-green-900">{usage?.processes?.running || 0}</div>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="text-sm text-yellow-600 mb-1">Sleeping</div>
            <div className="text-2xl font-bold text-yellow-900">{usage?.processes?.sleeping || 0}</div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-sm text-purple-600 mb-1">Zombie</div>
            <div className="text-2xl font-bold text-purple-900">{usage?.processes?.zombie || 0}</div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {usage?.alerts && usage.alerts.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-semibold text-red-900 mb-3">Resource Alerts</h4>
          <ul className="space-y-2">
            {usage.alerts.map((alert, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-red-800">
                <span className="text-red-600">⚠</span>
                <span>{alert}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ResourceUsage;
