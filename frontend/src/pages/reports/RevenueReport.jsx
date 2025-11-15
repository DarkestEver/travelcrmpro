import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  FiDownload, 
  FiCalendar,
  FiTrendingUp,
  FiDollarSign,
  FiBarChart2
} from 'react-icons/fi';
import { reportsAPI } from '../../services/apiEndpoints';

const RevenueReport = () => {
  const [dateRange, setDateRange] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch revenue data
  const { data: revenueData, isLoading } = useQuery({
    queryKey: ['revenue-report', dateRange, startDate, endDate],
    queryFn: () => reportsAPI.getRevenue({ 
      range: dateRange,
      startDate,
      endDate 
    }),
  });

  const handleExport = () => {
    // TODO: Implement Excel export
    alert('Excel export will be implemented in Item #17');
  };

  const stats = [
    {
      title: 'Total Revenue',
      value: `$${(revenueData?.data?.totalRevenue || 0).toLocaleString()}`,
      change: '+12.5%',
      icon: FiDollarSign,
      color: 'bg-green-500',
    },
    {
      title: 'Average Booking Value',
      value: `$${(revenueData?.data?.averageBookingValue || 0).toLocaleString()}`,
      change: '+8.2%',
      icon: FiBarChart2,
      color: 'bg-blue-500',
    },
    {
      title: 'Total Bookings',
      value: revenueData?.data?.totalBookings || 0,
      change: '+15.3%',
      icon: FiCalendar,
      color: 'bg-purple-500',
    },
    {
      title: 'Growth Rate',
      value: `${revenueData?.data?.growthRate || 0}%`,
      change: '+2.1%',
      icon: FiTrendingUp,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Revenue Report</h1>
          <p className="text-gray-600 mt-1">Track your revenue and financial performance</p>
        </div>
        <button
          onClick={handleExport}
          className="btn btn-primary flex items-center gap-2"
        >
          <FiDownload className="w-4 h-4" />
          Export to Excel
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="label">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="input"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {dateRange === 'custom' && (
            <>
              <div>
                <label className="label">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input"
                />
              </div>
            </>
          )}

          <button className="btn btn-primary">
            Apply Filters
          </button>
        </div>
      </div>

      {/* Stats Cards */}
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
                  <span className="text-xs text-gray-500 ml-1">vs last period</span>
                </div>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="text-2xl text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Revenue Over Time
        </h3>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="h-64">
            <SimpleBarChart data={revenueData?.data?.chartData || []} />
          </div>
        )}
      </div>

      {/* Revenue by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Revenue by Service Type
          </h3>
          <div className="space-y-3">
            {(revenueData?.data?.byServiceType || []).map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    index === 0 ? 'bg-blue-500' :
                    index === 1 ? 'bg-green-500' :
                    index === 2 ? 'bg-yellow-500' : 'bg-purple-500'
                  }`}></div>
                  <span className="text-gray-700 capitalize">{item.type}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold">${item.revenue.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{item.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Top Destinations by Revenue
          </h3>
          <div className="space-y-3">
            {(revenueData?.data?.topDestinations || []).map((item, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">{item.destination}</span>
                  <span className="text-sm font-bold">${item.revenue.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Breakdown Table */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Monthly Breakdown
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Month
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bookings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg. Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Growth
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(revenueData?.data?.monthlyData || []).map((row, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {row.month}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {row.bookings}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    ${row.revenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${row.avgValue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`${row.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {row.growth >= 0 ? '+' : ''}{row.growth}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Simple Bar Chart Component (CSS-based)
const SimpleBarChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="flex items-end justify-between h-full gap-2 px-4">
      {data.map((item, index) => (
        <div key={index} className="flex flex-col items-center flex-1">
          <div className="w-full flex flex-col justify-end h-48">
            <div
              className="bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer relative group"
              style={{ height: `${(item.value / maxValue) * 100}%` }}
            >
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                ${item.value.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-600 mt-2 truncate w-full text-center">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RevenueReport;
