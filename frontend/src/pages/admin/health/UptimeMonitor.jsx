import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { DataTable } from '../../../components/shared';
import { LoadingSpinner } from '../../../components/shared/LoadingStates';
import { getUptimeStats } from '../../../services/api/healthApi';

const UptimeMonitor = () => {
  const [timeRange, setTimeRange] = useState('30d');

  const { data: uptime, isLoading } = useQuery({
    queryKey: ['uptimeData', timeRange],
    queryFn: () => getUptimeStats(timeRange),
    refetchInterval: 60000, // Refresh every minute
  });

  const handleExportCSV = () => {
    if (!uptime?.incidents || uptime.incidents.length === 0) return;

    const headers = ['Date', 'Service', 'Duration', 'Impact', 'Status', 'Reason'];
    const rows = uptime.incidents.map(i => [
      new Date(i.start).toLocaleString(),
      i.service,
      `${i.duration} min`,
      i.impact,
      i.status,
      i.reason || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uptime-incidents-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getUptimeColor = (percentage) => {
    if (percentage >= 99.9) return 'text-green-600 bg-green-100';
    if (percentage >= 99) return 'text-yellow-600 bg-yellow-100';
    if (percentage >= 95) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getImpactColor = (impact) => {
    const colors = {
      critical: 'text-red-600 bg-red-100',
      major: 'text-orange-600 bg-orange-100',
      minor: 'text-yellow-600 bg-yellow-100',
      maintenance: 'text-blue-600 bg-blue-100'
    };
    return colors[impact] || colors.minor;
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const columns = [
    {
      key: 'start',
      label: 'Date & Time',
      render: (incident) => (
        <div className="text-sm">
          <div className="text-gray-900">{new Date(incident.start).toLocaleDateString()}</div>
          <div className="text-gray-500">{new Date(incident.start).toLocaleTimeString()}</div>
        </div>
      )
    },
    {
      key: 'service',
      label: 'Service',
      render: (incident) => (
        <div className="text-sm font-medium text-gray-900">
          {incident.service}
        </div>
      )
    },
    {
      key: 'duration',
      label: 'Duration',
      render: (incident) => (
        <div className="text-sm text-gray-900">
          {formatDuration(incident.duration)}
        </div>
      )
    },
    {
      key: 'impact',
      label: 'Impact',
      render: (incident) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getImpactColor(incident.impact)}`}>
          {incident.impact.toUpperCase()}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (incident) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          incident.status === 'resolved' ? 'bg-green-100 text-green-600' :
          incident.status === 'investigating' ? 'bg-yellow-100 text-yellow-600' :
          'bg-gray-100 text-gray-600'
        }`}>
          {incident.status}
        </span>
      )
    },
    {
      key: 'reason',
      label: 'Reason',
      render: (incident) => (
        <div className="text-sm text-gray-700 max-w-xs truncate" title={incident.reason}>
          {incident.reason || 'Unknown'}
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircleIcon className="w-6 h-6 text-green-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Uptime Monitoring</h2>
            <p className="text-sm text-gray-600">System availability and incident history</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="60d">Last 60 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          <button
            onClick={handleExportCSV}
            disabled={!uptime?.incidents || uptime.incidents.length === 0}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Uptime Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-6 bg-white border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-600 mb-2">Current Uptime</div>
          <div className={`text-3xl font-bold mb-1 ${uptime?.current >= 99.9 ? 'text-green-600' : 'text-orange-600'}`}>
            {uptime?.current || 0}%
          </div>
          <div className="text-xs text-gray-500">{timeRange}</div>
        </div>

        <div className="p-6 bg-white border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-600 mb-2">30-Day Average</div>
          <div className={`text-3xl font-bold mb-1 ${uptime?.average30d >= 99.9 ? 'text-green-600' : 'text-orange-600'}`}>
            {uptime?.average30d || 0}%
          </div>
          <div className="text-xs text-gray-500">Last 30 days</div>
        </div>

        <div className="p-6 bg-white border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-600 mb-2">Total Downtime</div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {formatDuration(uptime?.totalDowntime || 0)}
          </div>
          <div className="text-xs text-gray-500">{timeRange}</div>
        </div>

        <div className="p-6 bg-white border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-600 mb-2">Incidents</div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {uptime?.incidentCount || 0}
          </div>
          <div className="text-xs text-gray-500">{timeRange}</div>
        </div>
      </div>

      {/* Uptime by Period */}
      <div className="p-6 bg-white border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Uptime by Period</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Last 7 Days</div>
            <div className={`text-2xl font-bold ${uptime?.last7d >= 99.9 ? 'text-green-600' : 'text-orange-600'}`}>
              {uptime?.last7d || 0}%
            </div>
            <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full ${uptime?.last7d >= 99.9 ? 'bg-green-500' : 'bg-orange-500'}`}
                style={{ width: `${uptime?.last7d || 0}%` }}
              />
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Last 30 Days</div>
            <div className={`text-2xl font-bold ${uptime?.last30d >= 99.9 ? 'text-green-600' : 'text-orange-600'}`}>
              {uptime?.last30d || 0}%
            </div>
            <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full ${uptime?.last30d >= 99.9 ? 'bg-green-500' : 'bg-orange-500'}`}
                style={{ width: `${uptime?.last30d || 0}%` }}
              />
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Last 90 Days</div>
            <div className={`text-2xl font-bold ${uptime?.last90d >= 99.9 ? 'text-green-600' : 'text-orange-600'}`}>
              {uptime?.last90d || 0}%
            </div>
            <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full ${uptime?.last90d >= 99.9 ? 'bg-green-500' : 'bg-orange-500'}`}
                style={{ width: `${uptime?.last90d || 0}%` }}
              />
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Annual</div>
            <div className={`text-2xl font-bold ${uptime?.annual >= 99.9 ? 'text-green-600' : 'text-orange-600'}`}>
              {uptime?.annual || 0}%
            </div>
            <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full ${uptime?.annual >= 99.9 ? 'bg-green-500' : 'bg-orange-500'}`}
                style={{ width: `${uptime?.annual || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Visual Uptime Calendar */}
      <div className="p-6 bg-white border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Uptime Calendar (Last 90 Days)</h3>
        <div className="grid grid-cols-15 gap-1">
          {uptime?.calendar?.map((day, idx) => (
            <div
              key={idx}
              className={`h-8 rounded ${
                day.uptime >= 100 ? 'bg-green-500' :
                day.uptime >= 99.9 ? 'bg-green-400' :
                day.uptime >= 99 ? 'bg-yellow-400' :
                day.uptime >= 95 ? 'bg-orange-400' :
                'bg-red-500'
              }`}
              title={`${day.date}: ${day.uptime}% uptime`}
            />
          ))}
        </div>
        <div className="flex items-center justify-between mt-4 text-xs text-gray-600">
          <span>90 days ago</span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>100%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-400 rounded"></div>
              <span>99%+</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-orange-400 rounded"></div>
              <span>95%+</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>&lt;95%</span>
            </div>
          </div>
          <span>Today</span>
        </div>
      </div>

      {/* Incident History */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Incident History</h3>
        
        {uptime?.incidents && uptime.incidents.length > 0 ? (
          <DataTable columns={columns} data={uptime.incidents} />
        ) : (
          <div className="text-center py-12">
            <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-gray-500">No incidents recorded in this period</p>
            <p className="text-sm text-gray-400 mt-1">System has been running smoothly</p>
          </div>
        )}
      </div>

      {/* SLA Status */}
      <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-3">SLA Status</h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-600 mb-1">SLA Target</div>
            <div className="text-xl font-bold text-gray-900">99.9%</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Current Status</div>
            <div className={`text-xl font-bold ${uptime?.current >= 99.9 ? 'text-green-600' : 'text-red-600'}`}>
              {uptime?.current >= 99.9 ? '✓ Meeting SLA' : '✕ Below SLA'}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Allowed Downtime</div>
            <div className="text-xl font-bold text-gray-900">
              {timeRange === '30d' ? '43m/month' : '8.76h/year'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UptimeMonitor;
