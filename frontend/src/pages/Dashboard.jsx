import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import { bookingsAPI, quotesAPI } from '../services/apiEndpoints'
import { 
  FiUsers, 
  FiFileText, 
  FiCalendar, 
  FiDollarSign,
  FiTrendingUp,
  FiClock
} from 'react-icons/fi'

const Dashboard = () => {
  const { user } = useAuthStore()

  // Fetch statistics
  const { data: bookingStats } = useQuery({
    queryKey: ['booking-stats'],
    queryFn: () => bookingsAPI.getStats(),
  })

  const { data: quoteStats } = useQuery({
    queryKey: ['quote-stats'],
    queryFn: () => quotesAPI.getStats(),
  })

  const stats = [
    {
      title: 'Total Bookings',
      value: bookingStats?.data?.stats?.total || 0,
      icon: FiCalendar,
      color: 'bg-blue-500',
      change: '+12.5%',
    },
    {
      title: 'Total Revenue',
      value: `$${(bookingStats?.data?.stats?.totalRevenue || 0).toLocaleString()}`,
      icon: FiDollarSign,
      color: 'bg-green-500',
      change: '+8.2%',
    },
    {
      title: 'Active Quotes',
      value: quoteStats?.data?.stats?.byStatus?.sent || 0,
      icon: FiFileText,
      color: 'bg-yellow-500',
      change: '+5.1%',
    },
    {
      title: 'Pending Payments',
      value: `$${(bookingStats?.data?.stats?.pendingPayments || 0).toLocaleString()}`,
      icon: FiClock,
      color: 'bg-red-500',
      change: '-3.2%',
    },
  ]

  const recentBookings = bookingStats?.data?.stats?.byStatus || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Overview of your travel business
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                <div className="flex items-center mt-2">
                  <FiTrendingUp className={`text-sm ${stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`} />
                  <span className={`text-xs ml-1 ${stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                    {stat.change}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">vs last month</span>
                </div>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="text-2xl text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Status */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Booking Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Pending</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{
                      width: `${(recentBookings.pending / bookingStats?.data?.stats?.total * 100) || 0}%`,
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{recentBookings.pending || 0}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Confirmed</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${(recentBookings.confirmed / bookingStats?.data?.stats?.total * 100) || 0}%`,
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{recentBookings.confirmed || 0}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Completed</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: `${(recentBookings.completed / bookingStats?.data?.stats?.total * 100) || 0}%`,
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{recentBookings.completed || 0}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Cancelled</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{
                      width: `${(recentBookings.cancelled / bookingStats?.data?.stats?.total * 100) || 0}%`,
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{recentBookings.cancelled || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quote Conversion */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Quote Performance
          </h3>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Conversion Rate</p>
              <p className="text-4xl font-bold text-primary-600">
                {quoteStats?.data?.stats?.conversionRate || 0}%
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {quoteStats?.data?.stats?.byStatus?.accepted || 0}
                </p>
                <p className="text-xs text-gray-600">Accepted</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">
                  {quoteStats?.data?.stats?.byStatus?.rejected || 0}
                </p>
                <p className="text-xs text-gray-600">Rejected</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a href="/customers" className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center">
            <FiUsers className="text-3xl text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">Add Customer</p>
          </a>
          <a href="/itineraries" className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center">
            <FiFileText className="text-3xl text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">Create Itinerary</p>
          </a>
          <a href="/quotes" className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center">
            <FiFileText className="text-3xl text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">Generate Quote</p>
          </a>
          <a href="/bookings" className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center">
            <FiCalendar className="text-3xl text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">New Booking</p>
          </a>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
