import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import DataTable from '../../../components/shared/DataTable';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const HistoricalAnalysis = ({ data, filters }) => {
  const [viewMode, setViewMode] = useState('chart'); // chart or table

  if (!data || !data.historical) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No historical data available</p>
      </div>
    );
  }

  const { historical } = data;

  // Prepare year-over-year comparison chart
  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Current Year',
        data: historical.currentYear || Array(12).fill(0),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      },
      {
        label: 'Previous Year',
        data: historical.previousYear || Array(12).fill(0),
        backgroundColor: 'rgba(147, 51, 234, 0.8)',
        borderColor: 'rgb(147, 51, 234)',
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return context.dataset.label + ': ' + context.parsed.y + ' bookings';
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Bookings'
        }
      }
    }
  };

  // Calculate growth rates
  const growthRates = historical.currentYear?.map((current, index) => {
    const previous = historical.previousYear?.[index] || 0;
    if (previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  }) || [];

  // Table data
  const tableData = chartData.labels.map((month, index) => ({
    month,
    currentYear: historical.currentYear?.[index] || 0,
    previousYear: historical.previousYear?.[index] || 0,
    growth: growthRates[index],
    difference: (historical.currentYear?.[index] || 0) - (historical.previousYear?.[index] || 0)
  }));

  const columns = [
    {
      key: 'month',
      label: 'Month',
      render: (row) => <span className="font-medium">{row.month}</span>
    },
    {
      key: 'currentYear',
      label: 'Current Year',
      render: (row) => <span className="text-blue-600 font-semibold">{row.currentYear}</span>
    },
    {
      key: 'previousYear',
      label: 'Previous Year',
      render: (row) => <span className="text-purple-600">{row.previousYear}</span>
    },
    {
      key: 'difference',
      label: 'Difference',
      render: (row) => (
        <span className={row.difference >= 0 ? 'text-green-600' : 'text-red-600'}>
          {row.difference >= 0 ? '+' : ''}{row.difference}
        </span>
      )
    },
    {
      key: 'growth',
      label: 'Growth %',
      render: (row) => (
        <span className={parseFloat(row.growth) >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
          {row.growth >= 0 ? '+' : ''}{row.growth}%
        </span>
      )
    }
  ];

  const exportData = () => {
    let csv = 'Month,Current Year,Previous Year,Difference,Growth %\n';
    tableData.forEach(row => {
      csv += `${row.month},${row.currentYear},${row.previousYear},${row.difference},${row.growth}%\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historical_analysis_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Calculate summary stats
  const currentYearTotal = historical.currentYear?.reduce((sum, val) => sum + val, 0) || 0;
  const previousYearTotal = historical.previousYear?.reduce((sum, val) => sum + val, 0) || 0;
  const overallGrowth = previousYearTotal > 0 
    ? ((currentYearTotal - previousYearTotal) / previousYearTotal * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('chart')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              viewMode === 'chart'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Chart View
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              viewMode === 'table'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Table View
          </button>
        </div>

        <button
          onClick={exportData}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <DocumentArrowDownIcon className="w-4 h-4" />
          Export Data
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-600 font-medium">Current Year Total</p>
          <p className="text-2xl font-bold text-blue-900 mt-1">{currentYearTotal}</p>
        </div>

        <div className="p-4 bg-purple-50 rounded-lg">
          <p className="text-sm text-purple-600 font-medium">Previous Year Total</p>
          <p className="text-2xl font-bold text-purple-900 mt-1">{previousYearTotal}</p>
        </div>

        <div className={`p-4 rounded-lg ${parseFloat(overallGrowth) >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
          <p className={`text-sm font-medium ${parseFloat(overallGrowth) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            Year-over-Year Growth
          </p>
          <p className={`text-2xl font-bold mt-1 ${parseFloat(overallGrowth) >= 0 ? 'text-green-900' : 'text-red-900'}`}>
            {overallGrowth >= 0 ? '+' : ''}{overallGrowth}%
          </p>
        </div>
      </div>

      {/* Chart or Table */}
      {viewMode === 'chart' ? (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Year-over-Year Comparison</h3>
          <div className="h-96">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200">
          <DataTable
            columns={columns}
            data={tableData}
            searchable={false}
            sortable={true}
            pagination={false}
          />
        </div>
      )}

      {/* Key Insights */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-green-50 rounded-lg">
          <h4 className="font-semibold text-green-900 mb-2">Best Performing Month</h4>
          <p className="text-sm text-green-800">
            {chartData.labels[historical.currentYear?.indexOf(Math.max(...(historical.currentYear || [])))]} 
            {' '}with {Math.max(...(historical.currentYear || []))} bookings
          </p>
        </div>

        <div className="p-4 bg-orange-50 rounded-lg">
          <h4 className="font-semibold text-orange-900 mb-2">Highest Growth Month</h4>
          <p className="text-sm text-orange-800">
            {chartData.labels[growthRates.indexOf(Math.max(...growthRates.map(parseFloat)))]}
            {' '}with +{Math.max(...growthRates.map(parseFloat))}% growth
          </p>
        </div>
      </div>
    </div>
  );
};

export default HistoricalAnalysis;
