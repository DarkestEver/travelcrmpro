import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ExclamationTriangleIcon, BellIcon } from '@heroicons/react/24/outline';
import { DataTable, Modal } from '../../../components/shared';
import { LoadingSpinner, ButtonLoader } from '../../../components/shared/LoadingStates';
import { getActiveAlerts, acknowledgeAlert, configureAlertThresholds } from '../../../services/api/healthApi';

const AlertPanel = () => {
  const queryClient = useQueryClient();
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showConfig, setShowConfig] = useState(false);
  const [thresholds, setThresholds] = useState({
    cpu: { warning: 70, critical: 90 },
    memory: { warning: 80, critical: 95 },
    disk: { warning: 85, critical: 95 },
    responseTime: { warning: 500, critical: 1000 },
    errorRate: { warning: 1, critical: 5 }
  });

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['systemAlerts'],
    queryFn: getActiveAlerts,
    refetchInterval: 10000,
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (alertId) => acknowledgeAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries(['systemAlerts']);
      queryClient.invalidateQueries(['systemHealth']);
      setSelectedAlert(null);
      alert('Alert acknowledged successfully!');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to acknowledge alert');
    }
  });

  const configMutation = useMutation({
    mutationFn: (config) => configureAlertThresholds(config),
    onSuccess: () => {
      setShowConfig(false);
      alert('Alert thresholds updated successfully!');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to update thresholds');
    }
  });

  const handleAcknowledge = (alertId) => {
    if (window.confirm('Acknowledge this alert?')) {
      acknowledgeMutation.mutate(alertId);
    }
  };

  const handleConfigSave = (e) => {
    e.preventDefault();
    configMutation.mutate(thresholds);
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'text-red-600 bg-red-100',
      warning: 'text-orange-600 bg-orange-100',
      info: 'text-blue-600 bg-blue-100'
    };
    return colors[severity] || colors.info;
  };

  const getSeverityIcon = (severity) => {
    const icons = {
      critical: '🔴',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[severity] || icons.info;
  };

  const columns = [
    {
      key: 'severity',
      label: 'Severity',
      render: (alert) => (
        <div className="flex items-center gap-2">
          <span className="text-xl">{getSeverityIcon(alert.severity)}</span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
            {alert.severity.toUpperCase()}
          </span>
        </div>
      )
    },
    {
      key: 'title',
      label: 'Alert',
      render: (alert) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">{alert.title}</div>
          <div className="text-gray-600 text-xs mt-1">{alert.category}</div>
        </div>
      )
    },
    {
      key: 'description',
      label: 'Description',
      render: (alert) => (
        <div className="text-sm text-gray-700 max-w-md">
          {alert.description}
        </div>
      )
    },
    {
      key: 'timestamp',
      label: 'Time',
      render: (alert) => (
        <div className="text-sm">
          <div className="text-gray-900">{new Date(alert.timestamp).toLocaleString()}</div>
          <div className="text-gray-500 text-xs">
            {Math.floor((Date.now() - new Date(alert.timestamp)) / 60000)} min ago
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (alert) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          alert.acknowledged ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-600'
        }`}>
          {alert.acknowledged ? 'Acknowledged' : 'Active'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (alert) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedAlert(alert)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Details
          </button>
          {!alert.acknowledged && (
            <button
              onClick={() => handleAcknowledge(alert._id)}
              disabled={acknowledgeMutation.isPending}
              className="text-green-600 hover:text-green-700 text-sm font-medium disabled:opacity-50"
            >
              Acknowledge
            </button>
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

  const activeAlerts = alerts.filter(a => !a.acknowledged);
  const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.acknowledged);
  const warningAlerts = alerts.filter(a => a.severity === 'warning' && !a.acknowledged);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ExclamationTriangleIcon className="w-6 h-6 text-orange-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">System Alerts</h2>
            <p className="text-sm text-gray-600">
              {activeAlerts.length} active alert{activeAlerts.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowConfig(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <BellIcon className="w-4 h-4" />
          Configure Thresholds
        </button>
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-2xl font-bold text-blue-900">
            {alerts.length}
          </div>
          <div className="text-sm text-blue-700">Total Alerts</div>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-2xl font-bold text-red-900">
            {criticalAlerts.length}
          </div>
          <div className="text-sm text-red-700">Critical</div>
        </div>
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="text-2xl font-bold text-orange-900">
            {warningAlerts.length}
          </div>
          <div className="text-sm text-orange-700">Warnings</div>
        </div>
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">
            {alerts.filter(a => a.acknowledged).length}
          </div>
          <div className="text-sm text-gray-700">Acknowledged</div>
        </div>
      </div>

      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🚨</span>
            <div className="flex-1">
              <h3 className="font-semibold text-red-900">Critical Alerts Require Immediate Attention</h3>
              <ul className="mt-2 space-y-1">
                {criticalAlerts.slice(0, 3).map((alert, idx) => (
                  <li key={idx} className="text-sm text-red-800">• {alert.title}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Alerts Table */}
      {alerts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="text-gray-500">No alerts at this time</p>
          <p className="text-sm text-gray-400 mt-1">System is operating normally</p>
        </div>
      ) : (
        <DataTable columns={columns} data={alerts} />
      )}

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <Modal isOpen={true} onClose={() => setSelectedAlert(null)} title="Alert Details">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{getSeverityIcon(selectedAlert.severity)}</span>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{selectedAlert.title}</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(selectedAlert.severity)}`}>
                  {selectedAlert.severity.toUpperCase()}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <div className="text-sm text-gray-900 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                {selectedAlert.description}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <div className="text-sm text-gray-900">{selectedAlert.category}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timestamp</label>
                <div className="text-sm text-gray-900">{new Date(selectedAlert.timestamp).toLocaleString()}</div>
              </div>
            </div>

            {selectedAlert.affectedService && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Affected Service</label>
                <div className="text-sm text-gray-900">{selectedAlert.affectedService}</div>
              </div>
            )}

            {selectedAlert.recommendation && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recommended Action</label>
                <div className="text-sm text-blue-700 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  💡 {selectedAlert.recommendation}
                </div>
              </div>
            )}

            {selectedAlert.metadata && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Information</label>
                <pre className="text-xs bg-gray-100 p-3 rounded-lg overflow-x-auto">
                  {JSON.stringify(selectedAlert.metadata, null, 2)}
                </pre>
              </div>
            )}

            {!selectedAlert.acknowledged && (
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleAcknowledge(selectedAlert._id)}
                  disabled={acknowledgeMutation.isPending}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {acknowledgeMutation.isPending ? <ButtonLoader /> : 'Acknowledge Alert'}
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Configuration Modal */}
      {showConfig && (
        <Modal isOpen={true} onClose={() => setShowConfig(false)} title="Configure Alert Thresholds">
          <form onSubmit={handleConfigSave} className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              ℹ️ Adjust thresholds to control when alerts are triggered. Lower values result in more alerts.
            </div>

            {Object.keys(thresholds).map((key) => (
              <div key={key} className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Warning Threshold</label>
                    <input
                      type="number"
                      value={thresholds[key].warning}
                      onChange={(e) => setThresholds(prev => ({
                        ...prev,
                        [key]: { ...prev[key], warning: parseInt(e.target.value) }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Critical Threshold</label>
                    <input
                      type="number"
                      value={thresholds[key].critical}
                      onChange={(e) => setThresholds(prev => ({
                        ...prev,
                        [key]: { ...prev[key], critical: parseInt(e.target.value) }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowConfig(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={configMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {configMutation.isPending ? <ButtonLoader /> : 'Save Configuration'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AlertPanel;
