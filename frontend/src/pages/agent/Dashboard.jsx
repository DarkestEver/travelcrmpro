import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  UsersIcon,
  DocumentTextIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  PlusIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import KPICard from '../../components/agent/KPICard';
import CreditUsageCard from '../../components/agent/CreditUsageCard';
import { agentPortalAPI } from '../../services/agentPortalAPI';

const AgentDashboard = () => {
  // Fetch dashboard stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['agentStats'],
    queryFn: agentPortalAPI.getStats,
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to load stats');
    },
  });

  // Fetch recent activity
  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ['agentActivity'],
    queryFn: () => agentPortalAPI.getActivity({ limit: 10 }),
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to load activity');
    },
  });

  const stats = statsData?.data?.stats || {};
  const activities = activityData?.data?.activities || [];

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: stats.revenue?.currency || 'USD',
    }).format(amount || 0);
  };

  // Get icon for activity type
  const getActivityIcon = (type) => {
    switch (type) {
      case 'customer':
        return UsersIcon;
      case 'quote':
        return DocumentTextIcon;
      case 'booking':
        return CalendarIcon;
      default:
        return ClockIcon;
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's what's happening with your business.
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex gap-3">
          <Link
            to="/agent/customers"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
          >
            <UsersIcon className="h-5 w-5 mr-2" />
            Add Customer
          </Link>
          <Link
            to="/agent/quotes/new"
            className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Request Quote
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Customers"
          value={stats.customers?.total || 0}
          icon={UsersIcon}
          change={stats.customers?.change ? `${stats.customers.change}%` : undefined}
          trend={stats.customers?.change > 0 ? 'up' : 'down'}
          color="indigo"
        />

        <KPICard
          title="Pending Quotes"
          value={stats.quotes?.pending || 0}
          icon={DocumentTextIcon}
          color="blue"
        />

        <KPICard
          title="Confirmed Bookings"
          value={stats.bookings?.confirmed || 0}
          icon={CalendarIcon}
          color="green"
        />

        <KPICard
          title="Total Revenue"
          value={formatCurrency(stats.revenue?.total)}
          icon={CurrencyDollarIcon}
          color="purple"
        />
      </div>

      {/* Agent info and Credit Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent Info Card */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">Agent Information</h3>
          <div className="space-y-4">
            <div>
              <p className="text-indigo-100 text-sm">Agent Level</p>
              <p className="text-2xl font-bold capitalize mt-1">
                {stats.agent?.level || 'Bronze'}
              </p>
            </div>
            <div>
              <p className="text-indigo-100 text-sm">Commission Rate</p>
              <p className="text-2xl font-bold mt-1">
                {stats.agent?.commissionRate || 10}%
              </p>
            </div>
          </div>
        </div>

        {/* Credit Usage Card */}
        <CreditUsageCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-6">
            {activityLoading ? (
              <div className="text-center py-8 text-gray-500">Loading activity...</div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No recent activity</div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity, index) => {
                  const Icon = getActivityIcon(activity.type);
                  return (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <Icon className="h-5 w-5 text-gray-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-500">{activity.description}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTimestamp(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Quote Statistics</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {stats.quotes?.byStatus && Object.entries(stats.quotes.byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      status === 'pending' ? 'bg-yellow-500' :
                      status === 'reviewing' ? 'bg-blue-500' :
                      status === 'quoted' ? 'bg-purple-500' :
                      status === 'accepted' ? 'bg-green-500' :
                      status === 'rejected' ? 'bg-red-500' : 'bg-gray-500'
                    }`}></div>
                    <span className="text-sm text-gray-700 capitalize">{status}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{count}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Total Quotes</span>
                <span className="text-lg font-bold text-gray-900">
                  {stats.quotes?.total || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;
