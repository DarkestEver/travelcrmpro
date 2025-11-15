import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CurrencyDollarIcon, MagnifyingGlassIcon, CheckIcon } from '@heroicons/react/24/outline';
import { getSupportedCurrencies } from '../../services/api/currencyApi';
import { LoadingSpinner } from '../shared/LoadingStates';

const CurrencySelector = ({ 
  selectedCurrency, 
  onCurrencyChange, 
  className = '',
  showLabel = true,
  disabled = false,
  compact = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: currencies = [], isLoading } = useQuery({
    queryKey: ['supportedCurrencies'],
    queryFn: getSupportedCurrencies,
    staleTime: 1000 * 60 * 60 // 1 hour
  });

  const filteredCurrencies = currencies.filter(currency =>
    currency.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currency.symbol.includes(searchTerm)
  );

  const handleSelect = (currency) => {
    onCurrencyChange(currency);
    setIsOpen(false);
    setSearchTerm('');
  };

  const selected = currencies.find(c => c.code === selectedCurrency) || currencies[0];

  if (isLoading) {
    return <LoadingSpinner size="sm" />;
  }

  return (
    <div className={`relative ${className}`}>
      {showLabel && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Currency
        </label>
      )}

      {/* Selected Currency Display */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg
          bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${compact ? 'text-sm' : ''}
        `}
      >
        <div className="flex items-center space-x-2">
          {selected?.flag ? (
            <span className="text-2xl">{selected.flag}</span>
          ) : (
            <CurrencyDollarIcon className="w-5 h-5 text-gray-400" />
          )}
          <div className="text-left">
            <p className={`font-medium text-gray-900 ${compact ? 'text-sm' : ''}`}>
              {selected?.code || 'Select Currency'}
            </p>
            {!compact && selected && (
              <p className="text-xs text-gray-500">{selected.name}</p>
            )}
          </div>
        </div>
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search currencies..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>
          </div>

          {/* Currency List */}
          <div className="overflow-y-auto max-h-80">
            {filteredCurrencies.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No currencies found
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredCurrencies.map((currency) => (
                  <button
                    key={currency.code}
                    onClick={() => handleSelect(currency)}
                    className={`
                      w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors
                      ${selected?.code === currency.code ? 'bg-blue-50' : ''}
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      {currency.flag && (
                        <span className="text-2xl">{currency.flag}</span>
                      )}
                      <div className="text-left">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">{currency.code}</span>
                          <span className="text-gray-500">{currency.symbol}</span>
                        </div>
                        <p className="text-xs text-gray-600">{currency.name}</p>
                      </div>
                    </div>
                    {selected?.code === currency.code && (
                      <CheckIcon className="w-5 h-5 text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Popular Currencies Footer */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-600 mb-2">Popular:</p>
            <div className="flex flex-wrap gap-2">
              {['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD'].map((code) => {
                const currency = currencies.find(c => c.code === code);
                if (!currency) return null;
                
                return (
                  <button
                    key={code}
                    onClick={() => handleSelect(currency)}
                    className={`
                      px-3 py-1 text-xs font-medium rounded border
                      ${selected?.code === code
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                      }
                    `}
                  >
                    {code}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default CurrencySelector;
