import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  FileText, 
  Activity,
  Server,
  Settings as SettingsIcon,
  Calendar
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import PageWrapper from '../components/PageWrapper';
import { analyticsAPI } from '../services/apiEndpoints';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

/**
 * Analytics Dashboard Page
 * Displays comprehensive analytics and system metrics
 */
const Analytics = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboard, setDashboard] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [agentPerformance, setAgentPerformance] = useState(null);
  const [bookingTrends, setBookingTrends] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [userActivity, setUserActivity] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadAnalytics();
  }, [dateRange, activeTab]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      switch (activeTab) {
        case 'overview':
          const [dashData, healthData] = await Promise.all([
            analyticsAPI.getDashboard(dateRange),
            analyticsAPI.getSystemHealth()
          ]);
          setDashboard(dashData.data);
          setSystemHealth(healthData.data);
          break;
          
        case 'revenue':
          const revData = await analyticsAPI.getRevenue(dateRange);
          setRevenue(revData.data);
          break;
          
        case 'agents':
          const agentData = await analyticsAPI.getAgentPerformance(dateRange);
          setAgentPerformance(agentData.data);
          break;
          
        case 'bookings':
          const bookingData = await analyticsAPI.getBookingTrends(dateRange);
          setBookingTrends(bookingData.data);
          break;
          
        case 'forecast':
          const forecastData = await analyticsAPI.getForecast(dateRange);
          setForecast(forecastData.data);
          break;
          
        case 'activity':
          const activityData = await analyticsAPI.getUserActivity(dateRange);
          setUserActivity(activityData.data);
          break;
          
        case 'settings':
          const settingsData = await analyticsAPI.getSettings();
          setSettings(settingsData.data);
          break;
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'revenue', label: 'Revenue', icon: DollarSign },
    { id: 'agents', label: 'Agent Performance', icon: Users },
    { id: 'bookings', label: 'Booking Trends', icon: FileText },
    { id: 'forecast', label: 'Forecast', icon: TrendingUp },
    { id: 'activity', label: 'User Activity', icon: Activity },
    { id: 'settings', label: 'Settings', icon: SettingsIcon }
  ];

  return (
    <PageWrapper loading={loading} error={error} onRetry={loadAnalytics}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">Comprehensive insights and performance metrics</p>
          </div>
          
          {/* Date Range Picker */}
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && dashboard && (
            <OverviewTab dashboard={dashboard} systemHealth={systemHealth} />
          )}
          {activeTab === 'revenue' && revenue && (
            <RevenueTab revenue={revenue} />
          )}
          {activeTab === 'agents' && agentPerformance && (
            <AgentPerformanceTab agents={agentPerformance} />
          )}
          {activeTab === 'bookings' && bookingTrends && (
            <BookingTrendsTab trends={bookingTrends} />
          )}
          {activeTab === 'forecast' && forecast && (
            <ForecastTab forecast={forecast} />
          )}
          {activeTab === 'activity' && userActivity && (
            <UserActivityTab activity={userActivity} />
          )}
          {activeTab === 'settings' && settings && (
            <SettingsTab settings={settings} />
          )}
        </>
      )}
      </div>
    </PageWrapper>
  );
};

// Overview Tab
const OverviewTab = ({ dashboard, systemHealth }) => {
  const stats = [
    { label: 'Total Revenue', value: `$${dashboard.totalRevenue?.toLocaleString() || 0}`, change: '+12.5%', color: 'blue' },
    { label: 'Total Bookings', value: dashboard.totalBookings || 0, change: '+8.2%', color: 'green' },
    { label: 'Active Customers', value: dashboard.activeCustomers || 0, change: '+5.1%', color: 'purple' },
    { label: 'Conversion Rate', value: `${dashboard.conversionRate || 0}%`, change: '+2.3%', color: 'orange' }
  ];

  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500'
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 ${colors[stat.color]} rounded-lg flex items-center justify-center`}>
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-green-600 text-sm font-medium">{stat.change}</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
            <div className="text-sm text-gray-600">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* System Health */}
      {systemHealth && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Server className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  systemHealth.status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {systemHealth.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Uptime</span>
                <span className="font-medium">{systemHealth.uptime || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">API Version</span>
                <span className="font-medium">{systemHealth.version || '1.0.0'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Performance</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Response Time</span>
                <span className="font-medium">{systemHealth.responseTime || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Memory Usage</span>
                <span className="font-medium">{systemHealth.memoryUsage || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">CPU Usage</span>
                <span className="font-medium">{systemHealth.cpuUsage || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Database</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Connection</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  systemHealth.database?.connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {systemHealth.database?.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Collections</span>
                <span className="font-medium">{systemHealth.database?.collections || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Records</span>
                <span className="font-medium">{systemHealth.database?.totalRecords || 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Revenue Tab (Placeholder - can be enhanced with charts)
const RevenueTab = ({ revenue }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <h3 className="text-lg font-semibold mb-4">Revenue Analytics</h3>
    <p className="text-gray-600">Revenue data visualization will be displayed here</p>
    <pre className="mt-4 p-4 bg-gray-50 rounded text-xs overflow-auto">
      {JSON.stringify(revenue, null, 2)}
    </pre>
  </div>
);

// Agent Performance Tab
const AgentPerformanceTab = ({ agents }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <h3 className="text-lg font-semibold mb-4">Agent Performance</h3>
    <p className="text-gray-600">Agent performance metrics will be displayed here</p>
    <pre className="mt-4 p-4 bg-gray-50 rounded text-xs overflow-auto">
      {JSON.stringify(agents, null, 2)}
    </pre>
  </div>
);

// Booking Trends Tab
const BookingTrendsTab = ({ trends }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <h3 className="text-lg font-semibold mb-4">Booking Trends</h3>
    <p className="text-gray-600">Booking trends visualization will be displayed here</p>
    <pre className="mt-4 p-4 bg-gray-50 rounded text-xs overflow-auto">
      {JSON.stringify(trends, null, 2)}
    </pre>
  </div>
);

// Forecast Tab
const ForecastTab = ({ forecast }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <h3 className="text-lg font-semibold mb-4">Revenue Forecast</h3>
    <p className="text-gray-600">Forecast data will be displayed here</p>
    <pre className="mt-4 p-4 bg-gray-50 rounded text-xs overflow-auto">
      {JSON.stringify(forecast, null, 2)}
    </pre>
  </div>
);

// User Activity Tab
const UserActivityTab = ({ activity }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <h3 className="text-lg font-semibold mb-4">User Activity</h3>
    <p className="text-gray-600">User activity metrics will be displayed here</p>
    <pre className="mt-4 p-4 bg-gray-50 rounded text-xs overflow-auto">
      {JSON.stringify(activity, null, 2)}
    </pre>
  </div>
);

// Settings Tab
const SettingsTab = ({ settings }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <h3 className="text-lg font-semibold mb-4">Analytics Settings</h3>
    <p className="text-gray-600">Analytics configuration and settings</p>
    <pre className="mt-4 p-4 bg-gray-50 rounded text-xs overflow-auto">
      {JSON.stringify(settings, null, 2)}
    </pre>
  </div>
);

export default Analytics;
