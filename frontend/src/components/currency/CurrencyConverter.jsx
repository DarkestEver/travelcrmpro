import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowsRightLeftIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { getExchangeRates, convertCurrency } from '../../services/api/currencyApi';
import CurrencySelector from './CurrencySelector';
import { LoadingSpinner } from '../shared/LoadingStates';

const CurrencyConverter = ({ 
  initialFrom = 'USD', 
  initialTo = 'EUR',
  initialAmount = 100,
  onConversionComplete,
  className = ''
}) => {
  const [fromCurrency, setFromCurrency] = useState(initialFrom);
  const [toCurrency, setToCurrency] = useState(initialTo);
  const [amount, setAmount] = useState(initialAmount.toString());
  const [convertedAmount, setConvertedAmount] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch exchange rates
  const { data: rates, isLoading: loadingRates, refetch } = useQuery({
    queryKey: ['exchangeRates', fromCurrency],
    queryFn: () => getExchangeRates(fromCurrency),
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  // Convert currency mutation
  const convertMutation = useMutation({
    mutationFn: ({ amount, from, to }) => convertCurrency(amount, from, to),
    onSuccess: (data) => {
      setConvertedAmount(data.convertedAmount);
      setLastUpdated(new Date(data.timestamp));
      
      if (onConversionComplete) {
        onConversionComplete({
          from: fromCurrency,
          to: toCurrency,
          amount: parseFloat(amount),
          convertedAmount: data.convertedAmount,
          rate: data.rate
        });
      }
    }
  });

  // Auto-convert when values change
  useEffect(() => {
    if (amount && fromCurrency && toCurrency && parseFloat(amount) > 0) {
      const debounceTimer = setTimeout(() => {
        convertMutation.mutate({
          amount: parseFloat(amount),
          from: fromCurrency,
          to: toCurrency
        });
      }, 500);

      return () => clearTimeout(debounceTimer);
    }
  }, [amount, fromCurrency, toCurrency]);

  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const formatCurrency = (value, currency) => {
    if (!value) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const getExchangeRate = () => {
    if (!rates || !rates[toCurrency]) return null;
    return rates[toCurrency];
  };

  const rate = getExchangeRate();

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <ArrowsRightLeftIcon className="w-5 h-5 mr-2 text-blue-600" />
          Currency Converter
        </h3>
        <button
          onClick={() => refetch()}
          disabled={loadingRates}
          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Refresh rates"
        >
          <ArrowPathIcon className={`w-5 h-5 ${loadingRates ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Converter UI */}
      <div className="space-y-4">
        {/* From Currency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount
          </label>
          <div className="flex space-x-3">
            <input
              type="text"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.00"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-medium"
            />
            <div className="w-48">
              <CurrencySelector
                selectedCurrency={fromCurrency}
                onCurrencyChange={(currency) => setFromCurrency(currency.code)}
                showLabel={false}
              />
            </div>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSwapCurrencies}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title="Swap currencies"
          >
            <ArrowsRightLeftIcon className="w-5 h-5 text-gray-600 transform rotate-90" />
          </button>
        </div>

        {/* To Currency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Converted Amount
          </label>
          <div className="flex space-x-3">
            <div className="flex-1 px-4 py-3 border border-gray-200 rounded-lg bg-gray-50">
              {convertMutation.isPending ? (
                <LoadingSpinner size="sm" />
              ) : (
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(convertedAmount, toCurrency)}
                </span>
              )}
            </div>
            <div className="w-48">
              <CurrencySelector
                selectedCurrency={toCurrency}
                onCurrencyChange={(currency) => setToCurrency(currency.code)}
                showLabel={false}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Exchange Rate Info */}
      {rate && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700">
              1 {fromCurrency} = {rate.toFixed(4)} {toCurrency}
            </span>
            {lastUpdated && (
              <span className="text-gray-500 text-xs">
                Updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
          
          {amount && parseFloat(amount) > 0 && convertedAmount && (
            <div className="mt-2 text-xs text-gray-600">
              <p>
                {formatCurrency(parseFloat(amount), fromCurrency)} × {rate.toFixed(4)} = {formatCurrency(convertedAmount, toCurrency)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Quick Conversion Buttons */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-600 mb-2">Quick amounts:</p>
        <div className="flex flex-wrap gap-2">
          {[100, 500, 1000, 5000, 10000].map((value) => (
            <button
              key={value}
              onClick={() => setAmount(value.toString())}
              className="px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {value.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <p className="mt-4 text-xs text-gray-500 text-center">
        Exchange rates are updated regularly. Actual rates may vary slightly.
      </p>
    </div>
  );
};

export default CurrencyConverter;
