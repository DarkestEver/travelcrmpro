import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ServerIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { DataTable, StatusBadge } from '../../../components/shared';
import { LoadingSpinner, ButtonLoader } from '../../../components/shared/LoadingStates';
import { getServiceStatus, restartService } from '../../../services/api/healthApi';

const ServiceStatus = () => {
  const queryClient = useQueryClient();

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['serviceStatus'],
    queryFn: getServiceStatus,
    refetchInterval: 10000,
  });

  const restartMutation = useMutation({
    mutationFn: (serviceId) => restartService(serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries(['serviceStatus']);
      queryClient.invalidateQueries(['systemHealth']);
      alert('Service restart initiated successfully!');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to restart service');
    }
  });

  const handleRestart = (serviceId, serviceName) => {
    if (window.confirm(`Restart ${serviceName}? This may cause temporary service disruption.`)) {
      restartMutation.mutate(serviceId);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      healthy: 'text-green-600 bg-green-100',
      degraded: 'text-yellow-600 bg-yellow-100',
      down: 'text-red-600 bg-red-100',
      unknown: 'text-gray-600 bg-gray-100'
    };
    return colors[status] || colors.unknown;
  };

  const getStatusIcon = (status) => {
    const icons = {
      healthy: '✓',
      degraded: '⚠',
      down: '✕',
      unknown: '?'
    };
    return icons[status] || icons.unknown;
  };

  const columns = [
    {
      key: 'name',
      label: 'Service',
      render: (service) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">{service.name}</div>
          <div className="text-gray-500">{service.description}</div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (service) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
          {getStatusIcon(service.status)} {service.status.toUpperCase()}
        </span>
      )
    },
    {
      key: 'responseTime',
      label: 'Response Time',
      render: (service) => (
        <div className="text-sm">
          <div className="text-gray-900">{service.responseTime || 0}ms</div>
          <div className={`text-xs ${service.responseTimeTrend > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {service.responseTimeTrend > 0 ? '↑' : '↓'} {Math.abs(service.responseTimeTrend || 0)}%
          </div>
        </div>
      )
    },
    {
      key: 'uptime',
      label: 'Uptime',
      render: (service) => (
        <div className="text-sm text-gray-900">
          {service.uptime || 0}%
        </div>
      )
    },
    {
      key: 'lastCheck',
      label: 'Last Check',
      render: (service) => (
        <div className="text-sm text-gray-900">
          {new Date(service.lastCheck).toLocaleString()}
        </div>
      )
    },
    {
      key: 'version',
      label: 'Version',
      render: (service) => (
        <div className="text-sm text-gray-900">
          {service.version || 'N/A'}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (service) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleRestart(service._id, service.name)}
            disabled={restartMutation.isPending || service.status === 'down'}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50"
          >
            Restart
          </button>
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

  const healthyServices = services.filter(s => s.status === 'healthy').length;
  const degradedServices = services.filter(s => s.status === 'degraded').length;
  const downServices = services.filter(s => s.status === 'down').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ServerIcon className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Service Status</h2>
            <p className="text-sm text-gray-600">
              {services.length} services monitored
            </p>
          </div>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-2xl font-bold text-blue-900">
            {services.length}
          </div>
          <div className="text-sm text-blue-700">Total Services</div>
        </div>
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-2xl font-bold text-green-900">
            {healthyServices}
          </div>
          <div className="text-sm text-green-700">Healthy</div>
        </div>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-2xl font-bold text-yellow-900">
            {degradedServices}
          </div>
          <div className="text-sm text-yellow-700">Degraded</div>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-2xl font-bold text-red-900">
            {downServices}
          </div>
          <div className="text-sm text-red-700">Down</div>
        </div>
      </div>

      {/* Services Table */}
      {services.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <ServerIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No services configured</p>
        </div>
      ) : (
        <DataTable columns={columns} data={services} />
      )}

      {/* Service Categories */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-3">Core Services</h4>
          <ul className="space-y-2">
            {services.filter(s => s.category === 'core').map((service, idx) => (
              <li key={idx} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{service.name}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                  {getStatusIcon(service.status)}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-3">Database Services</h4>
          <ul className="space-y-2">
            {services.filter(s => s.category === 'database').map((service, idx) => (
              <li key={idx} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{service.name}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                  {getStatusIcon(service.status)}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-3">External Services</h4>
          <ul className="space-y-2">
            {services.filter(s => s.category === 'external').map((service, idx) => (
              <li key={idx} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{service.name}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                  {getStatusIcon(service.status)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Service Health Tips */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">Service Management Tips</h4>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>• Services are automatically monitored every 10 seconds</li>
          <li>• Restart degraded services to restore optimal performance</li>
          <li>• Contact support if a service remains down after restart</li>
          <li>• Review service logs for detailed error information</li>
        </ul>
      </div>
    </div>
  );
};

export default ServiceStatus;
