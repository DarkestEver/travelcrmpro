import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  FiAward,
  FiTrendingUp,
  FiDollarSign,
  FiUsers,
  FiTarget,
  FiDownload
} from 'react-icons/fi';
import { reportsAPI } from '../../services/apiEndpoints';

const AgentPerformance = () => {
  const [dateRange, setDateRange] = useState('month');
  const [sortBy, setSortBy] = useState('revenue');

  // Fetch agent performance data
  const { data: performanceData, isLoading } = useQuery({
    queryKey: ['agent-performance', dateRange, sortBy],
    queryFn: () => reportsAPI.getAgentPerformance({ 
      range: dateRange,
      sortBy 
    }),
  });

  const handleExport = () => {
    alert('Excel export will be implemented in Item #17');
  };

  const topMetrics = [
    {
      title: 'Top Performer',
      value: performanceData?.data?.topPerformer?.name || 'N/A',
      subtitle: `$${(performanceData?.data?.topPerformer?.revenue || 0).toLocaleString()} revenue`,
      icon: FiAward,
      color: 'bg-yellow-500',
    },
    {
      title: 'Total Sales',
      value: `$${(performanceData?.data?.totalSales || 0).toLocaleString()}`,
      subtitle: 'All agents combined',
      icon: FiDollarSign,
      color: 'bg-green-500',
    },
    {
      title: 'Active Agents',
      value: performanceData?.data?.activeAgents || 0,
      subtitle: 'Currently working',
      icon: FiUsers,
      color: 'bg-blue-500',
    },
    {
      title: 'Avg. Conversion Rate',
      value: `${performanceData?.data?.avgConversionRate || 0}%`,
      subtitle: 'Quote to booking',
      icon: FiTarget,
      color: 'bg-purple-500',
    },
  ];

  const agents = performanceData?.data?.agents || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agent Performance</h1>
          <p className="text-gray-600 mt-1">Track and compare agent sales performance</p>
        </div>
        <button
          onClick={handleExport}
          className="btn btn-primary flex items-center gap-2"
        >
          <FiDownload className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="label">Time Period</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="input"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>

          <div>
            <label className="label">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input"
            >
              <option value="revenue">Revenue</option>
              <option value="bookings">Bookings</option>
              <option value="conversionRate">Conversion Rate</option>
              <option value="avgBookingValue">Avg. Booking Value</option>
            </select>
          </div>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {topMetrics.map((metric, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{metric.title}</p>
                <p className="text-2xl font-bold text-gray-800">{metric.value}</p>
                <p className="text-xs text-gray-500 mt-1">{metric.subtitle}</p>
              </div>
              <div className={`${metric.color} p-3 rounded-lg`}>
                <metric.icon className="text-2xl text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Agent Rankings */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Agent Rankings
        </h3>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bookings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg. Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conversion
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {agents.map((agent, index) => (
                  <tr key={agent.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {index < 3 ? (
                          <FiAward className={`w-5 h-5 ${
                            index === 0 ? 'text-yellow-500' :
                            index === 1 ? 'text-gray-400' : 'text-orange-400'
                          }`} />
                        ) : (
                          <span className="text-sm font-medium text-gray-700">
                            {index + 1}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                          {agent.name?.charAt(0) || 'A'}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {agent.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {agent.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">
                        ${agent.revenue?.toLocaleString() || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {agent.bookings || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${agent.avgBookingValue?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        agent.conversionRate >= 70 ? 'bg-green-100 text-green-800' :
                        agent.conversionRate >= 50 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {agent.conversionRate || 0}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className={`h-2 rounded-full ${
                              agent.performance >= 80 ? 'bg-green-500' :
                              agent.performance >= 60 ? 'bg-blue-500' :
                              agent.performance >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${agent.performance || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-700">
                          {agent.performance || 0}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Performance Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Top 5 Agents by Revenue
          </h3>
          <div className="space-y-4">
            {agents.slice(0, 5).map((agent, index) => (
              <div key={agent.id}>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      {index + 1}. {agent.name}
                    </span>
                  </div>
                  <span className="text-sm font-bold">
                    ${agent.revenue?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ 
                      width: `${(agent.revenue / (agents[0]?.revenue || 1)) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Performance Distribution
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium">Excellent (80%+)</span>
                </div>
              </div>
              <span className="text-lg font-bold text-green-600">
                {agents.filter(a => a.performance >= 80).length}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm font-medium">Good (60-79%)</span>
                </div>
              </div>
              <span className="text-lg font-bold text-blue-600">
                {agents.filter(a => a.performance >= 60 && a.performance < 80).length}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-sm font-medium">Average (40-59%)</span>
                </div>
              </div>
              <span className="text-lg font-bold text-yellow-600">
                {agents.filter(a => a.performance >= 40 && a.performance < 60).length}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm font-medium">Needs Improvement (&lt;40%)</span>
                </div>
              </div>
              <span className="text-lg font-bold text-red-600">
                {agents.filter(a => a.performance < 40).length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentPerformance;