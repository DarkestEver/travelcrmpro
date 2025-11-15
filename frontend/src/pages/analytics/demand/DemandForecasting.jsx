import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  SparklesIcon,
  CalendarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { LoadingSpinner } from '../../../components/shared/LoadingStates';
import DateRangePicker from '../../../components/shared/DateRangePicker';
import ForecastChart from './ForecastChart';
import HistoricalAnalysis from './HistoricalAnalysis';
import SeasonalPatterns from './SeasonalPatterns';
import PredictiveInsights from './PredictiveInsights';
import { 
  getForecasts, 
  generateNewForecast 
} from '../../../services/api/demandForecastingApi';

const DemandForecasting = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('forecast'); // forecast, historical, patterns, insights
  const [filters, setFilters] = useState({
    destination: 'all',
    serviceType: 'all',
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  // Fetch forecasts
  const { data: forecastData, isLoading } = useQuery({
    queryKey: ['forecasts', filters],
    queryFn: () => getForecasts(filters),
  });

  // Generate forecast mutation
  const generateMutation = useMutation({
    mutationFn: () => generateNewForecast(filters),
    onSuccess: () => {
      queryClient.invalidateQueries(['forecasts']);
      alert('New forecast generated successfully!');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to generate forecast');
    }
  });

  const handleGenerateForecast = () => {
    if (window.confirm('Generate a new forecast? This may take a few minutes.')) {
      generateMutation.mutate();
    }
  };

  // Calculate stats
  const stats = forecastData ? [
    {
      label: 'Predicted Demand',
      value: forecastData.totalPredicted || 0,
      change: forecastData.demandChange || 0,
      icon: ArrowTrendingUpIcon,
      color: 'blue'
    },
    {
      label: 'Forecast Accuracy',
      value: `${forecastData.accuracy || 0}%`,
      change: forecastData.accuracyChange || 0,
      icon: ChartBarIcon,
      color: 'green'
    },
    {
      label: 'Peak Days',
      value: forecastData.peakDays || 0,
      change: null,
      icon: CalendarIcon,
      color: 'purple'
    },
    {
      label: 'AI Confidence',
      value: `${forecastData.confidence || 0}%`,
      change: null,
      icon: SparklesIcon,
      color: 'orange'
    }
  ] : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Demand Forecasting</h1>
          <p className="text-gray-600 mt-1">
            AI-powered predictions for travel demand and booking patterns
          </p>
        </div>
        <button
          onClick={handleGenerateForecast}
          disabled={generateMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <ArrowPathIcon className={`w-4 h-4 ${generateMutation.isPending ? 'animate-spin' : ''}`} />
          {generateMutation.isPending ? 'Generating...' : 'Generate Forecast'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-600">{stat.label}</span>
              <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                {stat.change !== null && (
                  <p className={`text-sm mt-1 ${stat.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change >= 0 ? '+' : ''}{stat.change}% vs last period
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Destination
            </label>
            <select
              value={filters.destination}
              onChange={(e) => setFilters(prev => ({ ...prev, destination: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Destinations</option>
              <option value="paris">Paris, France</option>
              <option value="london">London, UK</option>
              <option value="tokyo">Tokyo, Japan</option>
              <option value="new-york">New York, USA</option>
              <option value="dubai">Dubai, UAE</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service Type
            </label>
            <select
              value={filters.serviceType}
              onChange={(e) => setFilters(prev => ({ ...prev, serviceType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Services</option>
              <option value="hotel">Hotels</option>
              <option value="tour">Tours</option>
              <option value="transport">Transport</option>
              <option value="activity">Activities</option>
              <option value="package">Packages</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Forecast Period
            </label>
            <DateRangePicker
              startDate={filters.startDate}
              endDate={filters.endDate}
              onRangeChange={(start, end) => {
                setFilters(prev => ({ ...prev, startDate: start, endDate: end }));
              }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('forecast')}
              className={`pb-4 pt-6 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'forecast'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Forecast Chart
            </button>
            <button
              onClick={() => setActiveTab('historical')}
              className={`pb-4 pt-6 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'historical'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Historical Analysis
            </button>
            <button
              onClick={() => setActiveTab('patterns')}
              className={`pb-4 pt-6 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'patterns'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Seasonal Patterns
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`pb-4 pt-6 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'insights'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              AI Insights
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'forecast' && (
            <ForecastChart data={forecastData} filters={filters} />
          )}
          {activeTab === 'historical' && (
            <HistoricalAnalysis data={forecastData} filters={filters} />
          )}
          {activeTab === 'patterns' && (
            <SeasonalPatterns data={forecastData} filters={filters} />
          )}
          {activeTab === 'insights' && (
            <PredictiveInsights data={forecastData} filters={filters} />
          )}
        </div>
      </div>

      {/* Last Updated */}
      {forecastData?.lastUpdated && (
        <div className="text-center text-sm text-gray-500">
          Last updated: {new Date(forecastData.lastUpdated).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default DemandForecasting;
