import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiDollarSign, FiTrendingUp, FiRefreshCw, FiPlus, FiEdit2 } from 'react-icons/fi'
import currencyApi from '../../../services/api/currencyApi'

const MultiCurrency = () => {
  const queryClient = useQueryClient()
  const [selectedCurrency, setSelectedCurrency] = useState(null)
  const [showRateModal, setShowRateModal] = useState(false)
  const [rateForm, setRateForm] = useState({
    fromCurrency: '',
    toCurrency: '',
    rate: '',
    effectiveDate: new Date().toISOString().split('T')[0],
  })

  // Fetch supported currencies
  const { data: currencies, isLoading: loadingCurrencies } = useQuery({
    queryKey: ['currencies'],
    queryFn: currencyApi.getCurrencies,
  })

  // Fetch exchange rates
  const { data: exchangeRates, isLoading: loadingRates } = useQuery({
    queryKey: ['exchange-rates'],
    queryFn: currencyApi.getExchangeRates,
  })

  // Fetch base currency
  const { data: baseCurrency } = useQuery({
    queryKey: ['base-currency'],
    queryFn: currencyApi.getBaseCurrency,
  })

  // Update exchange rate mutation
  const updateRateMutation = useMutation({
    mutationFn: currencyApi.updateExchangeRate,
    onSuccess: () => {
      queryClient.invalidateQueries(['exchange-rates'])
      setShowRateModal(false)
      setRateForm({
        fromCurrency: '',
        toCurrency: '',
        rate: '',
        effectiveDate: new Date().toISOString().split('T')[0],
      })
    },
  })

  // Set base currency mutation
  const setBaseCurrencyMutation = useMutation({
    mutationFn: currencyApi.setBaseCurrency,
    onSuccess: () => {
      queryClient.invalidateQueries(['base-currency'])
      queryClient.invalidateQueries(['exchange-rates'])
    },
  })

  const handleUpdateRate = (e) => {
    e.preventDefault()
    updateRateMutation.mutate(rateForm)
  }

  const handleEditRate = (rate) => {
    setRateForm({
      fromCurrency: rate.fromCurrency,
      toCurrency: rate.toCurrency,
      rate: rate.rate.toString(),
      effectiveDate: rate.effectiveDate?.split('T')[0] || new Date().toISOString().split('T')[0],
    })
    setShowRateModal(true)
  }

  const handleSetBaseCurrency = (currencyCode) => {
    if (window.confirm(`Set ${currencyCode} as base currency? This will affect all calculations.`)) {
      setBaseCurrencyMutation.mutate({ currencyCode })
    }
  }

  if (loadingCurrencies || loadingRates) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Multi-Currency Management</h1>
          <p className="text-gray-600 mt-1">Manage exchange rates and currency conversions</p>
        </div>
        <button
          onClick={() => setShowRateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <FiPlus className="w-4 h-4" />
          Update Rate
        </button>
      </div>

      {/* Base Currency Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <FiDollarSign className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Base Currency</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-3xl font-bold text-blue-600">
            {baseCurrency?.code || 'USD'}
          </div>
          <div className="text-gray-600">
            {baseCurrency?.name || 'US Dollar'}
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          All exchange rates are calculated relative to this currency
        </p>
      </div>

      {/* Supported Currencies Grid */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Supported Currencies</h2>
          <p className="text-sm text-gray-600 mt-1">
            {currencies?.length || 0} currencies available
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {currencies?.map((currency) => (
              <div
                key={currency.code}
                className={`p-4 border rounded-lg cursor-pointer transition ${
                  currency.code === baseCurrency?.code
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => setSelectedCurrency(currency)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold">{currency.code}</span>
                  {currency.code === baseCurrency?.code && (
                    <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                      Base
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600">{currency.name}</div>
                <div className="text-xs text-gray-500 mt-1">{currency.symbol}</div>
                {currency.code !== baseCurrency?.code && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSetBaseCurrency(currency.code)
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 mt-2"
                  >
                    Set as base
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Exchange Rates Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Exchange Rates</h2>
            <p className="text-sm text-gray-600 mt-1">
              Current rates relative to {baseCurrency?.code || 'USD'}
            </p>
          </div>
          <button
            onClick={() => queryClient.invalidateQueries(['exchange-rates'])}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <FiRefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Currency Pair
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {exchangeRates?.map((rate) => (
                <tr key={`${rate.fromCurrency}-${rate.toCurrency}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{rate.fromCurrency}</span>
                      <FiTrendingUp className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{rate.toCurrency}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-lg font-semibold text-gray-900">
                      {rate.rate.toFixed(4)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {rate.updatedAt ? new Date(rate.updatedAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      rate.source === 'manual' 
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {rate.source || 'auto'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleEditRate(rate)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Update Rate Modal */}
      {showRateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Update Exchange Rate</h3>
            <form onSubmit={handleUpdateRate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Currency
                </label>
                <select
                  value={rateForm.fromCurrency}
                  onChange={(e) => setRateForm({ ...rateForm, fromCurrency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select currency</option>
                  {currencies?.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Currency
                </label>
                <select
                  value={rateForm.toCurrency}
                  onChange={(e) => setRateForm({ ...rateForm, toCurrency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select currency</option>
                  {currencies?.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exchange Rate
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={rateForm.rate}
                  onChange={(e) => setRateForm({ ...rateForm, rate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.0000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Effective Date
                </label>
                <input
                  type="date"
                  value={rateForm.effectiveDate}
                  onChange={(e) => setRateForm({ ...rateForm, effectiveDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowRateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateRateMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {updateRateMutation.isPending ? 'Updating...' : 'Update Rate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default MultiCurrency
