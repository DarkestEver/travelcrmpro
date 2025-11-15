import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  FiTrendingUp,
  FiCalendar,
  FiMapPin,
  FiDownload,
  FiBarChart2
} from 'react-icons/fi';
import { reportsAPI } from '../../services/apiEndpoints';

const BookingTrends = () => {
  const [dateRange, setDateRange] = useState('year');
  const [viewType, setViewType] = useState('monthly');

  // Fetch booking trends data
  const { data: trendsData, isLoading } = useQuery({
    queryKey: ['booking-trends', dateRange, viewType],
    queryFn: () => reportsAPI.getBookingTrends({ 
      range: dateRange,
      viewType 
    }),
  });

  const handleExport = () => {
    alert('Excel export will be implemented in Item #17');
  };

  const keyMetrics = [
    {
      title: 'Trending Destination',
      value: trendsData?.data?.trendingDestination || 'N/A',
      subtitle: `${trendsData?.data?.trendingBookings || 0} bookings`,
      icon: FiMapPin,
      color: 'bg-blue-500',
    },
    {
      title: 'Peak Season',
      value: trendsData?.data?.peakSeason || 'N/A',
      subtitle: 'Highest bookings',
      icon: FiCalendar,
      color: 'bg-green-500',
    },
    {
      title: 'Growth Trend',
      value: `${trendsData?.data?.growthTrend || 0}%`,
      subtitle: 'Year over year',
      icon: FiTrendingUp,
      color: 'bg-purple-500',
    },
    {
      title: 'Forecast Next Month',
      value: trendsData?.data?.forecast || 0,
      subtitle: 'Expected bookings',
      icon: FiBarChart2,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Booking Trends</h1>
          <p className="text-gray-600 mt-1">Analyze booking patterns and forecasts</p>
        </div>
        <button
          onClick={handleExport}
          className="btn btn-primary flex items-center gap-2"
        >
          <FiDownload className="w-4 h-4" />
          Export Analysis
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
              <option value="quarter">Last Quarter</option>
              <option value="6months">Last 6 Months</option>
              <option value="year">Last Year</option>
              <option value="2years">Last 2 Years</option>
            </select>
          </div>

          <div>
            <label className="label">View By</label>
            <select
              value={viewType}
              onChange={(e) => setViewType(e.target.value)}
              className="input"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {keyMetrics.map((metric, index) => (
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

      {/* Booking Trends Chart */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Booking Volume Over Time
        </h3>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="h-64">
            <TrendLineChart data={trendsData?.data?.chartData || []} />
          </div>
        )}
      </div>

      {/* Destination Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Popular Destinations
          </h3>
          <div className="space-y-3">
            {(trendsData?.data?.popularDestinations || []).map((dest, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      {index + 1}. {dest.name}
                    </span>
                    {dest.trending && (
                      <FiTrendingUp className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold">{dest.bookings}</span>
                    <span className="text-xs text-gray-500 ml-1">bookings</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${dest.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Seasonal Patterns
          </h3>
          <div className="space-y-4">
            {(trendsData?.data?.seasonalData || []).map((season, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <FiCalendar className="text-blue-500" />
                    <span className="font-medium">{season.season}</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-800">
                    {season.bookings}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{season.months}</span>
                  <span className={season.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {season.change >= 0 ? '+' : ''}{season.change}% vs last year
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Booking Days Analysis
          </h3>
          <div className="space-y-2">
            {(trendsData?.data?.dayOfWeekData || []).map((day, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{day.day}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: `${day.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-8 text-right">
                    {day.bookings}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Lead Time Analysis
          </h3>
          <div className="space-y-3">
            {(trendsData?.data?.leadTimeData || []).map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-sm font-medium">{item.range}</span>
                <div className="text-right">
                  <div className="text-lg font-bold">{item.bookings}</div>
                  <div className="text-xs text-gray-500">{item.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Forecasting (Next 3 Months)
          </h3>
          <div className="space-y-3">
            {(trendsData?.data?.forecastData || []).map((month, index) => (
              <div key={index} className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{month.month}</span>
                  <span className="text-lg font-bold text-blue-600">
                    {month.predicted}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Confidence: {month.confidence}%</span>
                  <span className="flex items-center gap-1">
                    <FiTrendingUp className="w-3 h-3" />
                    {month.trend}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insights Panel */}
      <div className="card bg-gradient-to-r from-blue-50 to-purple-50">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Key Insights & Recommendations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(trendsData?.data?.insights || []).map((insight, index) => (
            <div key={index} className="flex gap-3 p-4 bg-white rounded-lg shadow-sm">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <FiTrendingUp className="text-blue-600" />
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">{insight.title}</h4>
                <p className="text-sm text-gray-600">{insight.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Simple Trend Line Chart Component
const TrendLineChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue;

  return (
    <div className="relative h-full px-4">
      <svg className="w-full h-full">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((y) => (
          <line
            key={y}
            x1="0"
            y1={`${y}%`}
            x2="100%"
            y2={`${y}%`}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}

        {/* Trend line */}
        <polyline
          points={data.map((point, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = 100 - ((point.value - minValue) / range) * 90;
            return `${x}%,${y}%`;
          }).join(' ')}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="3"
        />

        {/* Data points */}
        {data.map((point, index) => {
          const x = (index / (data.length - 1)) * 100;
          const y = 100 - ((point.value - minValue) / range) * 90;
          return (
            <g key={index}>
              <circle
                cx={`${x}%`}
                cy={`${y}%`}
                r="4"
                fill="#3b82f6"
                className="cursor-pointer hover:r-6"
              />
            </g>
          );
        })}
      </svg>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2 text-xs text-gray-600">
        {data.map((point, index) => (
          <span key={index} className="truncate">
            {point.label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default BookingTrends;
