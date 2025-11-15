import React from 'react';
import { FireIcon, CloudIcon } from '@heroicons/react/24/outline';

const SeasonalPatterns = ({ data, filters }) => {
  if (!data || !data.seasonalPatterns) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No seasonal pattern data available</p>
      </div>
    );
  }

  const { seasonalPatterns } = data;

  // Heatmap data: 12 months x 7 days of week
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Generate heatmap matrix (mock data if not provided)
  const heatmapData = seasonalPatterns.heatmap || months.map((month, monthIndex) =>
    days.map((day, dayIndex) => {
      // Mock seasonal pattern: higher in summer months (Jun-Aug), weekends
      const isWeekend = dayIndex === 0 || dayIndex === 6;
      const isSummer = monthIndex >= 5 && monthIndex <= 7;
      const base = 50;
      const seasonalBoost = isSummer ? 30 : 0;
      const weekendBoost = isWeekend ? 20 : 0;
      const randomVariation = Math.random() * 20 - 10;
      return Math.max(0, base + seasonalBoost + weekendBoost + randomVariation);
    })
  );

  // Get color based on value intensity
  const getHeatColor = (value) => {
    if (value >= 80) return 'bg-red-600';
    if (value >= 70) return 'bg-orange-500';
    if (value >= 60) return 'bg-yellow-500';
    if (value >= 50) return 'bg-green-500';
    if (value >= 40) return 'bg-blue-500';
    return 'bg-gray-300';
  };

  // Identify peak and off-peak periods
  const peakMonths = seasonalPatterns.peakMonths || ['June', 'July', 'August'];
  const offPeakMonths = seasonalPatterns.offPeakMonths || ['January', 'February', 'November'];

  // Pattern strength indicators
  const patterns = [
    {
      name: 'Summer Peak',
      strength: seasonalPatterns.summerStrength || 85,
      months: 'Jun - Aug',
      trend: 'High demand, premium pricing'
    },
    {
      name: 'Holiday Season',
      strength: seasonalPatterns.holidayStrength || 75,
      months: 'Dec - Jan',
      trend: 'Increased bookings, early reservations'
    },
    {
      name: 'Spring Break',
      strength: seasonalPatterns.springStrength || 70,
      months: 'Mar - Apr',
      trend: 'Family travel surge'
    },
    {
      name: 'Off Season',
      strength: seasonalPatterns.offSeasonStrength || 40,
      months: 'Sep - Nov',
      trend: 'Lower demand, promotional opportunities'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Heatmap */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Demand Heatmap (Month × Day of Week)</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-xs font-semibold text-gray-700 text-left sticky left-0 bg-white">Month</th>
                {days.map((day, index) => (
                  <th key={index} className="p-2 text-xs font-semibold text-gray-700 text-center">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {months.map((month, monthIndex) => (
                <tr key={monthIndex}>
                  <td className="p-2 text-sm font-medium text-gray-900 sticky left-0 bg-white">
                    {month}
                  </td>
                  {heatmapData[monthIndex].map((value, dayIndex) => (
                    <td key={dayIndex} className="p-1">
                      <div
                        className={`w-full h-12 rounded flex items-center justify-center ${getHeatColor(value)} text-white text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity`}
                        title={`${month} ${days[dayIndex]}: ${value.toFixed(0)} bookings`}
                      >
                        {value.toFixed(0)}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-8">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Low</span>
            <div className="flex gap-1">
              <div className="w-6 h-6 bg-gray-300 rounded"></div>
              <div className="w-6 h-6 bg-blue-500 rounded"></div>
              <div className="w-6 h-6 bg-green-500 rounded"></div>
              <div className="w-6 h-6 bg-yellow-500 rounded"></div>
              <div className="w-6 h-6 bg-orange-500 rounded"></div>
              <div className="w-6 h-6 bg-red-600 rounded"></div>
            </div>
            <span className="text-sm text-gray-600">High</span>
          </div>
        </div>
      </div>

      {/* Pattern Strength Indicators */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Seasonal Pattern Strength</h3>
        
        <div className="space-y-4">
          {patterns.map((pattern, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {pattern.strength >= 70 ? '🔥' : '❄️'}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{pattern.name}</h4>
                    <p className="text-sm text-gray-600">{pattern.months} • {pattern.trend}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-lg font-bold ${
                    pattern.strength >= 70 ? 'text-red-600' : 
                    pattern.strength >= 50 ? 'text-orange-600' : 'text-blue-600'
                  }`}>
                    {pattern.strength}%
                  </span>
                  <p className="text-xs text-gray-500">Strength</p>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    pattern.strength >= 70 ? 'bg-red-600' :
                    pattern.strength >= 50 ? 'bg-orange-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${pattern.strength}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Peak vs Off-Peak Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-3 mb-4">
            <FireIcon className="w-6 h-6 text-red-600" />
            <h4 className="font-semibold text-red-900">Peak Season</h4>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-red-800 font-medium">High Demand Months:</p>
            <div className="flex flex-wrap gap-2">
              {peakMonths.map((month, index) => (
                <span key={index} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                  {month}
                </span>
              ))}
            </div>
            <p className="text-xs text-red-700 mt-3">
              ⚡ Recommendation: Increase prices 15-30%, ensure inventory availability, prepare for high volume
            </p>
          </div>
        </div>

        <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3 mb-4">
            <CloudIcon className="w-6 h-6 text-blue-600" />
            <h4 className="font-semibold text-blue-900">Off-Peak Season</h4>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-blue-800 font-medium">Low Demand Months:</p>
            <div className="flex flex-wrap gap-2">
              {offPeakMonths.map((month, index) => (
                <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {month}
                </span>
              ))}
            </div>
            <p className="text-xs text-blue-700 mt-3">
              💡 Recommendation: Run promotions, offer discounts 10-20%, focus on niche markets
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeasonalPatterns;
