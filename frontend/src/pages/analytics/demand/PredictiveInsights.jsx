import React from 'react';
import { 
  SparklesIcon, 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const PredictiveInsights = ({ data, filters }) => {
  if (!data || !data.insights) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No insights available</p>
        <p className="text-sm text-gray-400 mt-1">Generate a forecast to see AI-powered recommendations</p>
      </div>
    );
  }

  const { insights } = data;

  // Mock insights if not provided
  const recommendations = insights.recommendations || [
    {
      type: 'opportunity',
      priority: 'high',
      title: 'Increase Inventory for Summer Peak',
      description: 'Our AI predicts 45% higher demand in July-August. Consider increasing hotel inventory by 30% to capture this opportunity.',
      impact: '+$125K estimated revenue',
      action: 'Review inventory levels',
      deadline: '30 days'
    },
    {
      type: 'risk',
      priority: 'medium',
      title: 'Potential Overbooking Risk in June',
      description: 'Current booking pace suggests potential overbooking for June 15-22. Early warning allows for proactive management.',
      impact: 'Avoid customer dissatisfaction',
      action: 'Review allocations',
      deadline: '15 days'
    },
    {
      type: 'pricing',
      priority: 'high',
      title: 'Dynamic Pricing Opportunity',
      description: 'Demand elasticity analysis shows 12% price increase potential for weekend packages without affecting conversion.',
      impact: '+$45K monthly revenue',
      action: 'Adjust pricing strategy',
      deadline: '7 days'
    },
    {
      type: 'trend',
      priority: 'low',
      title: 'Emerging Destination Trend',
      description: 'Search data shows 65% increase in interest for sustainable travel experiences. Consider expanding eco-tourism offerings.',
      impact: 'Capture new market segment',
      action: 'Research sustainable options',
      deadline: '60 days'
    }
  ];

  const priceOptimization = insights.priceOptimization || [
    {
      service: 'Deluxe Hotel Rooms',
      currentPrice: 150,
      recommendedPrice: 175,
      expectedDemand: 95,
      potentialRevenue: '+$2,500/month'
    },
    {
      service: 'City Tour Package',
      currentPrice: 89,
      recommendedPrice: 85,
      expectedDemand: 120,
      potentialRevenue: '+$1,200/month'
    },
    {
      service: 'Airport Transfer',
      currentPrice: 45,
      recommendedPrice: 50,
      expectedDemand: 85,
      potentialRevenue: '+$850/month'
    }
  ];

  const inventoryRecommendations = insights.inventory || [
    {
      item: 'Standard Hotel Rooms',
      currentStock: 50,
      recommendedStock: 65,
      reason: 'High demand expected in next 30 days'
    },
    {
      item: 'Premium Tour Packages',
      currentStock: 30,
      recommendedStock: 25,
      reason: 'Lower than expected demand, reduce allocation'
    },
    {
      item: 'Group Activities',
      currentStock: 20,
      recommendedStock: 35,
      reason: 'Corporate travel surge predicted'
    }
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-orange-200 bg-orange-50';
      case 'low':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getPriorityBadgeColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-orange-100 text-orange-700';
      case 'low':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'opportunity':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'risk':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />;
      case 'pricing':
        return <ArrowTrendingUpIcon className="w-5 h-5 text-purple-600" />;
      case 'trend':
        return <LightBulbIcon className="w-5 h-5 text-blue-600" />;
      default:
        return <SparklesIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* AI Insights Header */}
      <div className="p-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-white">
        <div className="flex items-center gap-3 mb-2">
          <SparklesIcon className="w-6 h-6" />
          <h3 className="text-lg font-semibold">AI-Powered Insights & Recommendations</h3>
        </div>
        <p className="text-sm text-purple-100">
          Based on historical patterns, market trends, and predictive models
        </p>
      </div>

      {/* Key Recommendations */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actionable Recommendations</h3>
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className={`p-6 border rounded-lg ${getPriorityColor(rec.priority)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  {getTypeIcon(rec.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadgeColor(rec.priority)}`}>
                        {rec.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{rec.description}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-300">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Impact</p>
                  <p className="text-sm font-semibold text-gray-900">{rec.impact}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Recommended Action</p>
                  <p className="text-sm font-semibold text-gray-900">{rec.action}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Deadline</p>
                  <p className="text-sm font-semibold text-gray-900">{rec.deadline}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Price Optimization */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Optimization Suggestions</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Service</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Current Price</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Recommended</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Change</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Expected Demand</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Potential Revenue</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {priceOptimization.map((item, index) => {
                const priceDiff = item.recommendedPrice - item.currentPrice;
                const percentChange = ((priceDiff / item.currentPrice) * 100).toFixed(1);

                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.service}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                      {formatCurrency(item.currentPrice)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                      {formatCurrency(item.recommendedPrice)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                        priceDiff > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {priceDiff > 0 ? <ArrowTrendingUpIcon className="w-3 h-3" /> : <ArrowTrendingDownIcon className="w-3 h-3" />}
                        {priceDiff > 0 ? '+' : ''}{percentChange}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">{item.expectedDemand}%</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-green-600">
                      {item.potentialRevenue}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventory Recommendations */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Adjustments</h3>
        <div className="space-y-3">
          {inventoryRecommendations.map((item, index) => {
            const diff = item.recommendedStock - item.currentStock;
            const isIncrease = diff > 0;

            return (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{item.item}</h4>
                  <p className="text-sm text-gray-600 mt-1">{item.reason}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Current</p>
                    <p className="text-lg font-bold text-gray-900">{item.currentStock}</p>
                  </div>
                  <div className={`text-2xl ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                    {isIncrease ? '→' : '←'}
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Recommended</p>
                    <p className="text-lg font-bold text-gray-900">{item.recommendedStock}</p>
                  </div>
                  <div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      isIncrease ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {isIncrease ? '+' : ''}{diff}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confidence Score */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SparklesIcon className="w-5 h-5 text-purple-600" />
            <div>
              <p className="font-semibold text-purple-900">AI Model Confidence</p>
              <p className="text-sm text-purple-700">Based on 12 months of historical data and 50+ variables</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-purple-900">{data.confidence || 89}%</p>
            <p className="text-xs text-purple-600">Prediction Accuracy</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictiveInsights;
