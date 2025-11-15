import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import { getExchangeRates } from '../../services/api/currencyApi';
import { LoadingSpinner, CardSkeleton } from '../shared/LoadingStates';

const ExchangeRateDisplay = ({ 
  baseCurrency = 'USD', 
  targetCurrencies = ['EUR', 'GBP', 'JPY', 'AUD', 'CAD'],
  showTrend = true,
  compact = false,
  className = ''
}) => {
  const { data: rates, isLoading, error } = useQuery({
    queryKey: ['exchangeRates', baseCurrency],
    queryFn: () => getExchangeRates(baseCurrency),
    refetchInterval: 1000 * 60 * 5, // Refresh every 5 minutes
    staleTime: 1000 * 60 * 5
  });

  const formatRate = (rate) => {
    if (!rate) return '-';
    return rate.toFixed(4);
  };

  const getTrendIcon = (trend) => {
    if (!trend || trend === 0) return null;
    
    return trend > 0 ? (
      <ArrowTrendingUpIcon className="w-4 h-4 text-green-600" />
    ) : (
      <ArrowTrendingDownIcon className="w-4 h-4 text-red-600" />
    );
  };

  const getTrendColor = (trend) => {
    if (!trend || trend === 0) return 'text-gray-600';
    return trend > 0 ? 'text-green-600' : 'text-red-600';
  };

  if (isLoading) {
    return compact ? (
      <LoadingSpinner size="sm" />
    ) : (
      <CardSkeleton count={targetCurrencies.length} className={className} />
    );
  }

  if (error) {
    return (
      <div className={`text-center py-4 text-red-600 ${className}`}>
        <p className="text-sm">Failed to load exchange rates</p>
      </div>
    );
  }

  if (!rates) {
    return null;
  }

  if (compact) {
    return (
      <div className={`flex items-center space-x-4 text-sm ${className}`}>
        {targetCurrencies.map((currency) => {
          const rate = rates[currency];
          if (!rate) return null;

          return (
            <div key={currency} className="flex items-center space-x-1">
              <span className="text-gray-600">{currency}:</span>
              <span className="font-medium text-gray-900">{formatRate(rate)}</span>
              {showTrend && rates.trends?.[currency] && (
                <span className={`flex items-center ${getTrendColor(rates.trends[currency])}`}>
                  {getTrendIcon(rates.trends[currency])}
                  <span className="text-xs ml-0.5">
                    {Math.abs(rates.trends[currency]).toFixed(2)}%
                  </span>
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Exchange Rates</h3>
        <p className="text-sm text-gray-600 mt-1">
          Base: {baseCurrency} • Updated: {new Date().toLocaleTimeString()}
        </p>
      </div>

      {/* Rates Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {targetCurrencies.map((currency) => {
            const rate = rates[currency];
            if (!rate) return null;

            const trend = rates.trends?.[currency];

            return (
              <div
                key={currency}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-gray-900">{currency}</span>
                  {showTrend && trend !== undefined && (
                    <div className={`flex items-center space-x-1 ${getTrendColor(trend)}`}>
                      {getTrendIcon(trend)}
                      <span className="text-sm font-medium">
                        {trend > 0 ? '+' : ''}{trend.toFixed(2)}%
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-gray-900">{formatRate(rate)}</span>
                  <span className="text-sm text-gray-500">{currency}</span>
                </div>
                
                <p className="text-xs text-gray-600 mt-2">
                  1 {baseCurrency} = {formatRate(rate)} {currency}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <p className="text-xs text-gray-500 text-center">
          Exchange rates are indicative and may vary. Contact your bank for exact rates.
        </p>
      </div>
    </div>
  );
};

export default ExchangeRateDisplay;
