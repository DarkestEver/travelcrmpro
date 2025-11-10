import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  FileText,
  PieChart,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import financeAPI from '../../services/financeAPI';
import toast from 'react-hot-toast';

export default function Reports() {
  const [reportType, setReportType] = useState('revenue');
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });
  const [groupBy, setGroupBy] = useState('day');

  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['reports', reportType, dateRange, groupBy],
    queryFn: () => financeAPI.getReport({ reportType, ...dateRange, groupBy }),
    placeholderData: { data: { summary: {}, details: [], chart: [] } },
  });

  const summary = reportData?.data?.summary || {};
  const details = reportData?.data?.details || [];
  const chartData = reportData?.data?.chart || [];

  const reportTypes = [
    { value: 'revenue', label: 'Revenue Report', icon: DollarSign },
    { value: 'expenses', label: 'Expenses Report', icon: TrendingUp },
    { value: 'profit-loss', label: 'Profit & Loss', icon: BarChart3 },
    { value: 'tax', label: 'Tax Report', icon: FileText },
    { value: 'payments', label: 'Payment Analysis', icon: DollarSign },
    { value: 'bookings', label: 'Booking Revenue', icon: PieChart },
  ];

  const handleExport = async (format) => {
    try {
      const blob = await financeAPI.exportReport({ reportType, ...dateRange, format });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-report-${dateRange.from}-to-${dateRange.to}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const getSummaryCards = () => {
    switch (reportType) {
      case 'revenue':
        return [
          { label: 'Total Revenue', value: `$${(summary.totalRevenue || 0).toLocaleString()}`, color: 'bg-green-500' },
          { label: 'Bookings', value: summary.bookingCount || 0, color: 'bg-blue-500' },
          { label: 'Avg. Revenue', value: `$${(summary.avgRevenue || 0).toLocaleString()}`, color: 'bg-purple-500' },
          { label: 'Growth', value: `${summary.growth || 0}%`, color: summary.growth >= 0 ? 'bg-green-500' : 'bg-red-500' },
        ];
      case 'expenses':
        return [
          { label: 'Total Expenses', value: `$${(summary.totalExpenses || 0).toLocaleString()}`, color: 'bg-red-500' },
          { label: 'Supplier Costs', value: `$${(summary.supplierCosts || 0).toLocaleString()}`, color: 'bg-orange-500' },
          { label: 'Operational', value: `$${(summary.operational || 0).toLocaleString()}`, color: 'bg-yellow-500' },
          { label: 'Other', value: `$${(summary.other || 0).toLocaleString()}`, color: 'bg-gray-500' },
        ];
      case 'profit-loss':
        return [
          { label: 'Revenue', value: `$${(summary.revenue || 0).toLocaleString()}`, color: 'bg-green-500' },
          { label: 'Expenses', value: `$${(summary.expenses || 0).toLocaleString()}`, color: 'bg-red-500' },
          { label: 'Gross Profit', value: `$${(summary.grossProfit || 0).toLocaleString()}`, color: 'bg-blue-500' },
          { label: 'Net Profit', value: `$${(summary.netProfit || 0).toLocaleString()}`, color: summary.netProfit >= 0 ? 'bg-green-500' : 'bg-red-500' },
        ];
      case 'tax':
        return [
          { label: 'Tax Collected', value: `$${(summary.taxCollected || 0).toLocaleString()}`, color: 'bg-blue-500' },
          { label: 'Tax Payable', value: `$${(summary.taxPayable || 0).toLocaleString()}`, color: 'bg-yellow-500' },
          { label: 'Tax Paid', value: `$${(summary.taxPaid || 0).toLocaleString()}`, color: 'bg-green-500' },
          { label: 'Balance', value: `$${(summary.balance || 0).toLocaleString()}`, color: 'bg-purple-500' },
        ];
      default:
        return [];
    }
  };

  const summaryCards = getSummaryCards();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Generate and analyze financial reports</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => refetch()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('csv')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              CSV
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* Report Configuration */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Report Configuration</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              {reportTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Group By</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
              <option value="quarter">Quarterly</option>
              <option value="year">Yearly</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summaryCards.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card, index) => (
            <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 ${card.color} rounded-md p-3`}>
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">{card.label}</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{card.value}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chart Visualization */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Trend Analysis</h3>
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
            <p className="mt-1 text-sm text-gray-500">No data for the selected period.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-500 mb-4">
              Chart visualization would appear here (integrate with a charting library like Chart.js or Recharts)
            </div>
            {/* Simple bar representation */}
            <div className="space-y-2">
              {chartData.slice(0, 10).map((item, index) => {
                const maxValue = Math.max(...chartData.map(d => d.value || 0));
                const percentage = maxValue > 0 ? ((item.value || 0) / maxValue) * 100 : 0;
                return (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{item.label || item.date}</span>
                      <span className="font-medium text-gray-900">${(item.value || 0).toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Detailed Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Detailed Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
          ) : details.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No details available</h3>
              <p className="mt-1 text-sm text-gray-500">No detailed data for the selected period.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {details.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.description || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.category || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${(item.amount || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.status || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
