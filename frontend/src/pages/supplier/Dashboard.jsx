import { useQuery } from '@tanstack/react-query';
import {
  CalendarIcon,
  BanknotesIcon,
  ClockIcon,
  CheckCircleIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';
import api from '../../services/api';

const SupplierDashboard = () => {
  // Fetch supplier dashboard stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['supplier-dashboard-stats'],
    queryFn: async () => {
      try {
        const response = await api.get('/suppliers/dashboard-stats');
        return response.data.data;
      } catch (error) {
        console.error('Failed to fetch supplier dashboard stats:', error.message);
        // Return default values instead of throwing
        return {
          pendingConfirmations: 0,
          confirmedBookings: 0,
          totalBookings: 0,
          totalRevenue: 0,
          activeServices: 0,
        };
      }
    },
    retry: 1, // Only retry once
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch recent bookings assigned to this supplier
  const { data: recentBookings } = useQuery({
    queryKey: ['supplier-recent-bookings'],
    queryFn: async () => {
      try {
        const response = await api.get('/suppliers/my-bookings?limit=5');
        return response.data.data;
      } catch (error) {
        console.error('Failed to fetch supplier bookings:', error.message);
        return []; // Return empty array instead of throwing
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  const statCards = [
    {
      title: 'Pending Confirmations',
      value: stats?.pendingConfirmations || 0,
      icon: ClockIcon,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Confirmed Bookings',
      value: stats?.confirmedBookings || 0,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Bookings',
      value: stats?.totalBookings || 0,
      icon: CalendarIcon,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Total Revenue',
      value: `$${(stats?.totalRevenue || 0).toLocaleString()}`,
      icon: BanknotesIcon,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Active Services',
      value: stats?.activeServices || 0,
      icon: CubeIcon,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Supplier Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your bookings, inventory, and track your earnings
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className={`flex-shrink-0 ${stat.bgColor} rounded-md p-3`}>
                  <stat.icon className={`h-6 w-6 ${stat.textColor}`} />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.title}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Bookings Section */}
      <div className="bg-white shadow rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Bookings
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Bookings assigned to you that need attention
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {recentBookings && recentBookings.length > 0 ? (
            recentBookings.map((booking) => (
              <div key={booking._id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-medium text-gray-900">
                        {booking.customerName || 'Customer'}
                      </h3>
                      {getStatusBadge(booking.status)}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {booking.destination || 'Destination not specified'}
                    </p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        {booking.travelDate ? new Date(booking.travelDate).toLocaleDateString() : 'Date TBD'}
                      </span>
                      <span className="flex items-center gap-1">
                        <BanknotesIcon className="h-4 w-4" />
                        ${booking.amount?.toLocaleString() || 0}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <a
                      href={`/supplier/bookings`}
                      className="text-sm font-medium text-primary-600 hover:text-primary-700"
                    >
                      View Details →
                    </a>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-12 text-center">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No bookings yet
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Bookings assigned to you will appear here
              </p>
            </div>
          )}
        </div>

        {recentBookings && recentBookings.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <a
              href="/supplier/bookings"
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              View all bookings →
            </a>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <a
              href="/supplier/bookings"
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors group"
            >
              <CalendarIcon className="h-8 w-8 text-gray-400 group-hover:text-primary-600" />
              <span className="mt-2 text-sm font-medium text-gray-900 group-hover:text-primary-700">
                View All Bookings
              </span>
            </a>
            <a
              href="/supplier/inventory"
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors group"
            >
              <CubeIcon className="h-8 w-8 text-gray-400 group-hover:text-primary-600" />
              <span className="mt-2 text-sm font-medium text-gray-900 group-hover:text-primary-700">
                Manage Inventory
              </span>
            </a>
            <a
              href="/supplier/payments"
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors group"
            >
              <BanknotesIcon className="h-8 w-8 text-gray-400 group-hover:text-primary-600" />
              <span className="mt-2 text-sm font-medium text-gray-900 group-hover:text-primary-700">
                View Payments
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierDashboard;
