import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import {
  getSalesReport,
  getBookingTrends,
  getCustomerInsights,
  getRevenueAnalytics,
  getPerformanceSummary
} from '../../services/agentReportAPI';
import { formatCurrency, formatDate } from '../../utils/format';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AgentReports = () => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Fetch all report data
  const { data: performance, isLoading: perfLoading } = useQuery({
    queryKey: ['performance-summary'],
    queryFn: getPerformanceSummary
  });

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['sales-report', dateRange],
    queryFn: () => getSalesReport(dateRange)
  });

  const { data: trendsData, isLoading: trendsLoading } = useQuery({
    queryKey: ['booking-trends', dateRange],
    queryFn: () => getBookingTrends(dateRange)
  });

  const { data: customerData, isLoading: customerLoading } = useQuery({
    queryKey: ['customer-insights'],
    queryFn: getCustomerInsights
  });

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['revenue-analytics', dateRange],
    queryFn: () => getRevenueAnalytics(dateRange)
  });

  const isLoading = perfLoading || salesLoading || trendsLoading || customerLoading || revenueLoading;

  // Performance comparison cards
  const performanceCards = performance?.last30Days && performance?.allTime ? [
    {
      title: 'Total Bookings',
      last30: performance.last30Days.bookings,
      allTime: performance.allTime.bookings,
      icon: ChartBarIcon,
      color: 'blue'
    },
    {
      title: 'Total Revenue',
      last30: formatCurrency(performance.last30Days.revenue),
      allTime: formatCurrency(performance.allTime.revenue),
      icon: CurrencyDollarIcon,
      color: 'green'
    },
    {
      title: 'Commission Earned',
      last30: formatCurrency(performance.last30Days.commissions),
      allTime: formatCurrency(performance.allTime.commissions),
      icon: ArrowTrendingUpIcon,
      color: 'purple'
    },
    {
      title: 'New Customers',
      last30: performance.last30Days.newCustomers,
      allTime: performance.allTime.customers,
      icon: UsersIcon,
      color: 'orange'
    }
  ] : [];

  // Chart configurations
  const bookingTrendsChart = trendsData?.bookingsTrend ? {
    labels: trendsData.bookingsTrend.map(item => `${item._id.month}/${item._id.year}`),
    datasets: [
      {
        label: 'Total Bookings',
        data: trendsData.bookingsTrend.map(item => item.total),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.4
      },
      {
        label: 'Completed',
        data: trendsData.bookingsTrend.map(item => item.completed),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        tension: 0.4
      },
      {
        label: 'Cancelled',
        data: trendsData.bookingsTrend.map(item => item.cancelled),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        tension: 0.4
      }
    ]
  } : null;

  const salesByMonthChart = salesData?.byMonth ? {
    labels: salesData.byMonth.map(item => `${item._id.month}/${item._id.year}`),
    datasets: [
      {
        label: 'Monthly Sales',
        data: salesData.byMonth.map(item => item.totalSales),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      }
    ]
  } : null;

  const salesByStatusChart = salesData?.byStatus ? {
    labels: salesData.byStatus.map(item => item._id),
    datasets: [
      {
        data: salesData.byStatus.map(item => item.totalSales),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(234, 179, 8, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(168, 85, 247, 0.8)'
        ],
        borderWidth: 1
      }
    ]
  } : null;

  const revenueByStatusChart = revenueData?.byPaymentStatus ? {
    labels: revenueData.byPaymentStatus.map(item => item._id),
    datasets: [
      {
        data: revenueData.byPaymentStatus.map(item => item.amount),
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(234, 179, 8, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderWidth: 1
      }
    ]
  } : null;

  const monthlyRevenueChart = revenueData?.monthlyRevenue ? {
    labels: revenueData.monthlyRevenue.map(item => `${item._id.month}/${item._id.year}`),
    datasets: [
      {
        label: 'Revenue',
        data: revenueData.monthlyRevenue.map(item => item.revenue),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Commission',
        data: revenueData.monthlyRevenue.map(item => item.commission),
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  } : null;

  const customerAcquisitionChart = customerData?.acquisitionTrend ? {
    labels: customerData.acquisitionTrend.map(item => `${item._id.month}/${item._id.year}`),
    datasets: [
      {
        label: 'New Customers',
        data: customerData.acquisitionTrend.map(item => item.count),
        borderColor: 'rgb(249, 115, 22)',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right'
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track your performance and gain insights into your business
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {performanceCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 bg-${card.color}-100 rounded-lg`}>
                  <Icon className={`h-6 w-6 text-${card.color}-600`} />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-500">{card.title}</h3>
              <div className="mt-2">
                <div className="text-2xl font-bold text-gray-900">{card.last30}</div>
                <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-sm text-gray-600">All time: <span className="font-semibold">{card.allTime}</span></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Booking Trends */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Booking Trends</h2>
            <p className="text-sm text-gray-500 mt-1">12-month booking performance</p>
          </div>
          {trendsData?.growthRate !== undefined && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Growth Rate:</span>
              <div className={`flex items-center ${trendsData.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trendsData.growthRate >= 0 ? (
                  <ArrowUpIcon className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4 mr-1" />
                )}
                <span className="font-semibold">{Math.abs(trendsData.growthRate).toFixed(1)}%</span>
              </div>
            </div>
          )}
        </div>
        <div className="h-80">
          {bookingTrendsChart && <Line data={bookingTrendsChart} options={chartOptions} />}
        </div>
      </div>

      {/* Sales Report */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Sales */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Sales</h2>
          {salesData?.summary && (
            <div className="mb-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(salesData.summary.totalSales)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg Booking Value</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(salesData.summary.avgBookingValue)}</p>
              </div>
            </div>
          )}
          <div className="h-64">
            {salesByMonthChart && <Bar data={salesByMonthChart} options={chartOptions} />}
          </div>
        </div>

        {/* Sales by Status */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales by Status</h2>
          <div className="h-64">
            {salesByStatusChart && <Pie data={salesByStatusChart} options={pieChartOptions} />}
          </div>
          {salesData?.byStatus && (
            <div className="mt-4 space-y-2">
              {salesData.byStatus.map((status, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-600 capitalize">{status._id}</span>
                  <span className="font-semibold">{formatCurrency(status.totalSales)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Revenue Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue & Commission */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue & Commission</h2>
          {revenueData && (
            <div className="mb-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(revenueData.totalRevenue || 0)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Commission Earned</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(revenueData.commissionEarned || 0)}</p>
              </div>
            </div>
          )}
          <div className="h-64">
            {monthlyRevenueChart && <Line data={monthlyRevenueChart} options={chartOptions} />}
          </div>
        </div>

        {/* Revenue by Payment Status */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Payment Status</h2>
          <div className="h-64">
            {revenueByStatusChart && <Pie data={revenueByStatusChart} options={pieChartOptions} />}
          </div>
          {revenueData?.byPaymentStatus && (
            <div className="mt-4 space-y-2">
              {revenueData.byPaymentStatus.map((status, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-600 capitalize">{status._id}</span>
                  <span className="font-semibold">{formatCurrency(status.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Customer Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Customers</h2>
          {customerData?.topCustomers && (
            <div className="space-y-3">
              {customerData.topCustomers.slice(0, 10).map((customer, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                      <p className="text-xs text-gray-500">{customer.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(customer.totalSpent)}</p>
                    <p className="text-xs text-gray-500">{customer.bookingCount} bookings</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Customer Acquisition */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Acquisition</h2>
          {customerData && (
            <div className="mb-4 grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-900">{customerData.totalCustomers || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">New (30d)</p>
                <p className="text-2xl font-bold text-orange-600">{customerData.newCustomers || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg Bookings</p>
                <p className="text-2xl font-bold text-blue-600">{(customerData.avgBookingsPerCustomer || 0).toFixed(1)}</p>
              </div>
            </div>
          )}
          <div className="h-48">
            {customerAcquisitionChart && <Line data={customerAcquisitionChart} options={chartOptions} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentReports;
