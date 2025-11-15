import React, { useState } from 'react';
import { DocumentArrowDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Modal from '../../../components/shared/Modal';

const RateComparison = ({ rateSheets, onClose }) => {
  const [selectedSheets, setSelectedSheets] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);

  const handleSheetSelection = (sheetId) => {
    setSelectedSheets(prev => {
      if (prev.includes(sheetId)) {
        return prev.filter(id => id !== sheetId);
      } else if (prev.length < 3) {
        return [...prev, sheetId];
      } else {
        return [...prev.slice(1), sheetId];
      }
    });
  };

  const handleCompare = () => {
    if (selectedSheets.length < 2) {
      alert('Please select at least 2 rate sheets to compare');
      return;
    }

    const sheets = selectedSheets.map(id => rateSheets.find(rs => rs.id === id));
    const comparison = generateComparison(sheets);
    setComparisonData(comparison);
  };

  const generateComparison = (sheets) => {
    // Collect all unique services across selected sheets
    const allServices = new Set();
    sheets.forEach(sheet => {
      sheet.items?.forEach(item => {
        allServices.add(item.service);
      });
    });

    // Create comparison matrix
    const matrix = Array.from(allServices).map(service => {
      const row = { service };
      sheets.forEach((sheet, index) => {
        const item = sheet.items?.find(i => i.service === service);
        row[`sheet${index}`] = item || null;
      });
      return row;
    });

    return {
      sheets,
      matrix
    };
  };

  const exportComparison = () => {
    if (!comparisonData) return;

    const { sheets, matrix } = comparisonData;

    // Create CSV content
    let csv = 'Service';
    sheets.forEach(sheet => {
      csv += `,${sheet.name} (${sheet.currency})`;
    });
    csv += '\n';

    matrix.forEach(row => {
      csv += row.service;
      sheets.forEach((_, index) => {
        const item = row[`sheet${index}`];
        csv += `,${item ? item.sellPrice : 'N/A'}`;
      });
      csv += '\n';
    });

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rate_comparison_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getBestPrice = (row, sheets) => {
    let minPrice = Infinity;
    let minIndex = -1;

    sheets.forEach((_, index) => {
      const item = row[`sheet${index}`];
      if (item && item.sellPrice < minPrice) {
        minPrice = item.sellPrice;
        minIndex = index;
      }
    });

    return minIndex;
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Compare Rate Sheets"
      size="full"
    >
      <div className="space-y-6">
        {/* Selection Panel */}
        {!comparisonData && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                Select 2-3 rate sheets to compare their prices side by side
              </p>
              <p className="text-xs text-blue-700 mt-1">
                {selectedSheets.length} of 3 selected
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {rateSheets.map(sheet => {
                const isSelected = selectedSheets.includes(sheet.id);
                const isDisabled = selectedSheets.length === 3 && !isSelected;

                return (
                  <div
                    key={sheet.id}
                    onClick={() => !isDisabled && handleSheetSelection(sheet.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : isDisabled
                        ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{sheet.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {sheet.supplier?.name || 'N/A'}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>{formatDate(sheet.validFrom)} - {formatDate(sheet.validTo)}</span>
                          <span>{sheet.itemCount || 0} items</span>
                          <span className="font-medium">{sheet.currency}</span>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="flex-shrink-0 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCompare}
                disabled={selectedSheets.length < 2}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Compare Selected
              </button>
            </div>
          </div>
        )}

        {/* Comparison Results */}
        {comparisonData && (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Comparison Results</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Comparing {comparisonData.sheets.length} rate sheets
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={exportComparison}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <DocumentArrowDownIcon className="w-4 h-4" />
                  Export CSV
                </button>
                <button
                  onClick={() => setComparisonData(null)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  <XMarkIcon className="w-4 h-4" />
                  New Comparison
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
              {comparisonData.sheets.map((sheet, index) => (
                <div key={sheet.id} className="p-4 bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-blue-500' : index === 1 ? 'bg-purple-500' : 'bg-orange-500'
                    }`}></span>
                    <span className="text-xs text-gray-500">v{sheet.version}</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">{sheet.name}</h4>
                  <p className="text-sm text-gray-600">{sheet.supplier?.name}</p>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Items:</span>
                      <span className="font-medium">{sheet.itemCount || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-medium">{formatCurrency(sheet.totalValue || 0, sheet.currency)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Comparison Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="sticky left-0 bg-gray-50 px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase z-10">
                        Service
                      </th>
                      {comparisonData.sheets.map((sheet, index) => (
                        <th key={sheet.id} className="px-6 py-3 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${
                              index === 0 ? 'bg-blue-500' : index === 1 ? 'bg-purple-500' : 'bg-orange-500'
                            }`}></span>
                            <span className="text-xs font-semibold text-gray-700 uppercase">
                              {sheet.name}
                            </span>
                            <span className="text-xs text-gray-500 normal-case">
                              ({sheet.currency})
                            </span>
                          </div>
                        </th>
                      ))}
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                        Best Price
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {comparisonData.matrix.map((row, rowIndex) => {
                      const bestPriceIndex = getBestPrice(row, comparisonData.sheets);

                      return (
                        <tr key={rowIndex} className="hover:bg-gray-50">
                          <td className="sticky left-0 bg-white px-6 py-4 font-medium text-gray-900 z-10">
                            {row.service}
                          </td>
                          {comparisonData.sheets.map((sheet, index) => {
                            const item = row[`sheet${index}`];
                            const isBestPrice = index === bestPriceIndex;

                            return (
                              <td
                                key={sheet.id}
                                className={`px-6 py-4 text-center ${
                                  isBestPrice ? 'bg-green-50' : ''
                                }`}
                              >
                                {item ? (
                                  <div className="space-y-1">
                                    <div className={`font-semibold ${
                                      isBestPrice ? 'text-green-700' : 'text-gray-900'
                                    }`}>
                                      {formatCurrency(item.sellPrice, sheet.currency)}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {item.unit}
                                    </div>
                                    {item.markup && (
                                      <div className="text-xs text-green-600">
                                        +{item.markupType === 'percentage' ? `${item.markup}%` : formatCurrency(item.markup)}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">N/A</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-6 py-4 text-center">
                            {bestPriceIndex >= 0 && (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
                                {comparisonData.sheets[bestPriceIndex].name.split(' ')[0]}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Legend */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Legend</h4>
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
                  <span>Best Price</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">N/A</span>
                  <span>Service not available in this rate sheet</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default RateComparison;
