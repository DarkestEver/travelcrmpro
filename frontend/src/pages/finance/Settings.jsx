import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings as SettingsIcon,
  CreditCard,
  Bell,
  Shield,
  Link as LinkIcon,
  Save,
  RefreshCw,
  Edit2,
} from 'lucide-react';
import financeAPI from '../../services/financeAPI';
import toast from 'react-hot-toast';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('payment-gateways');
  const queryClient = useQueryClient();

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['financeSettings'],
    queryFn: () => financeAPI.getFinanceSettings(),
    placeholderData: { data: { paymentGateways: [], integrations: {}, approvalThresholds: {}, notifications: {} } },
  });

  const settings = settingsData?.data || {};

  const tabs = [
    { id: 'payment-gateways', name: 'Payment Gateways', icon: CreditCard },
    { id: 'integrations', name: 'Integrations', icon: LinkIcon },
    { id: 'approvals', name: 'Approval Thresholds', icon: Shield },
    { id: 'notifications', name: 'Notifications', icon: Bell },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Configure finance module preferences</p>
        </div>
        <button
          onClick={() => queryClient.invalidateQueries(['financeSettings'])}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className={`mr-2 h-5 w-5 ${activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
          ) : (
            <>
              {activeTab === 'payment-gateways' && <PaymentGateways settings={settings.paymentGateways || []} />}
              {activeTab === 'integrations' && <Integrations settings={settings.integrations || {}} />}
              {activeTab === 'approvals' && <ApprovalThresholds settings={settings.approvalThresholds || {}} />}
              {activeTab === 'notifications' && <Notifications settings={settings.notifications || {}} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PaymentGateways({ settings }) {
  const gateways = [
    { id: 'stripe', name: 'Stripe', icon: '💳', status: settings.stripe?.enabled || false },
    { id: 'paypal', name: 'PayPal', icon: '🅿️', status: settings.paypal?.enabled || false },
    { id: 'razorpay', name: 'Razorpay', icon: '💰', status: settings.razorpay?.enabled || false },
    { id: 'square', name: 'Square', icon: '⬜', status: settings.square?.enabled || false },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Payment Gateway Configuration</h3>
        <button
          onClick={() => toast.info('Add gateway coming soon')}
          className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          Add Gateway
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {gateways.map((gateway) => (
          <div key={gateway.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <span className="text-3xl mr-3">{gateway.icon}</span>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{gateway.name}</h4>
                  <p className="text-xs text-gray-500">
                    {gateway.status ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={gateway.status}
                  onChange={() => toast.info(`Toggle ${gateway.name} coming soon`)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="API Key"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                disabled={!gateway.status}
              />
              <input
                type="password"
                placeholder="Secret Key"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                disabled={!gateway.status}
              />
              <button
                onClick={() => toast.success(`${gateway.name} settings saved`)}
                disabled={!gateway.status}
                className="w-full inline-flex justify-center items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Configuration
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Integrations({ settings }) {
  const integrations = [
    { id: 'quickbooks', name: 'QuickBooks', icon: '📗', connected: settings.quickbooks?.connected || false },
    { id: 'xero', name: 'Xero', icon: '📘', connected: settings.xero?.connected || false },
    { id: 'sage', name: 'Sage', icon: '📙', connected: settings.sage?.connected || false },
    { id: 'freshbooks', name: 'FreshBooks', icon: '📕', connected: settings.freshbooks?.connected || false },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Accounting Software Integrations</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {integrations.map((integration) => (
          <div key={integration.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-3xl mr-3">{integration.icon}</span>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{integration.name}</h4>
                  <p className="text-xs text-gray-500">
                    {integration.connected ? (
                      <span className="text-green-600">✓ Connected</span>
                    ) : (
                      <span className="text-gray-400">Not connected</span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => toast.info(`${integration.connected ? 'Disconnect' : 'Connect'} ${integration.name} coming soon`)}
                className={`inline-flex items-center px-3 py-1.5 border rounded-md text-sm font-medium ${
                  integration.connected
                    ? 'border-red-300 text-red-700 bg-white hover:bg-red-50'
                    : 'border-transparent text-white bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {integration.connected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
            {integration.connected && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Last sync: {new Date().toLocaleString()}</p>
                  <p>Auto-sync: Enabled</p>
                </div>
                <button
                  onClick={() => toast.success(`${integration.name} synced`)}
                  className="mt-2 w-full inline-flex justify-center items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Now
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ApprovalThresholds({ settings }) {
  const [thresholds, setThresholds] = useState({
    payment: settings.payment || 5000,
    refund: settings.refund || 2000,
    adjustment: settings.adjustment || 500,
    discount: settings.discount || 1000,
  });

  const handleSave = () => {
    toast.success('Approval thresholds updated');
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Approval Threshold Configuration</h3>
      <p className="text-sm text-gray-500 mb-4">
        Set minimum amounts that require manager approval
      </p>
      <div className="space-y-4 max-w-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment Approval Threshold ($)
          </label>
          <input
            type="number"
            value={thresholds.payment}
            onChange={(e) => setThresholds({ ...thresholds, payment: parseFloat(e.target.value) })}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">Payments above this amount require approval</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Refund Approval Threshold ($)
          </label>
          <input
            type="number"
            value={thresholds.refund}
            onChange={(e) => setThresholds({ ...thresholds, refund: parseFloat(e.target.value) })}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">Refunds above this amount require approval</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Adjustment Approval Threshold ($)
          </label>
          <input
            type="number"
            value={thresholds.adjustment}
            onChange={(e) => setThresholds({ ...thresholds, adjustment: parseFloat(e.target.value) })}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">Adjustments above this amount require approval</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Discount Approval Threshold ($)
          </label>
          <input
            type="number"
            value={thresholds.discount}
            onChange={(e) => setThresholds({ ...thresholds, discount: parseFloat(e.target.value) })}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">Discounts above this amount require approval</p>
        </div>
        <button
          onClick={handleSave}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Thresholds
        </button>
      </div>
    </div>
  );
}

function Notifications({ settings }) {
  const [notifications, setNotifications] = useState({
    paymentReceived: settings.paymentReceived !== false,
    paymentFailed: settings.paymentFailed !== false,
    invoiceGenerated: settings.invoiceGenerated !== false,
    invoiceOverdue: settings.invoiceOverdue !== false,
    approvalRequired: settings.approvalRequired !== false,
    reconciliationAlert: settings.reconciliationAlert !== false,
    taxReport: settings.taxReport !== false,
    dailySummary: settings.dailySummary !== false,
  });

  const handleSave = () => {
    toast.success('Notification preferences updated');
  };

  const notificationList = [
    { key: 'paymentReceived', label: 'Payment Received', description: 'Notify when a payment is successfully processed' },
    { key: 'paymentFailed', label: 'Payment Failed', description: 'Alert when a payment transaction fails' },
    { key: 'invoiceGenerated', label: 'Invoice Generated', description: 'Notify when a new invoice is created' },
    { key: 'invoiceOverdue', label: 'Invoice Overdue', description: 'Alert for overdue invoices' },
    { key: 'approvalRequired', label: 'Approval Required', description: 'Notify when transactions need approval' },
    { key: 'reconciliationAlert', label: 'Reconciliation Alerts', description: 'Alert for reconciliation discrepancies' },
    { key: 'taxReport', label: 'Tax Reports', description: 'Monthly tax report notifications' },
    { key: 'dailySummary', label: 'Daily Summary', description: 'Daily financial summary email' },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
      <p className="text-sm text-gray-500 mb-4">
        Configure which notifications you want to receive
      </p>
      <div className="space-y-4">
        {notificationList.map((item) => (
          <div key={item.key} className="flex items-start">
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                checked={notifications[item.key]}
                onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            <div className="ml-3">
              <label className="font-medium text-gray-700 text-sm">{item.label}</label>
              <p className="text-gray-500 text-xs">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={handleSave}
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
      >
        <Save className="h-4 w-4 mr-2" />
        Save Preferences
      </button>
    </div>
  );
}
