import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ForecastChart = ({ data, filters }) => {
  if (!data || !data.timeSeries) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No forecast data available</p>
        <p className="text-sm text-gray-400 mt-1">Generate a forecast to see predictions</p>
      </div>
    );
  }

  const { timeSeries } = data;

  // Prepare chart data
  const labels = timeSeries.map(item => {
    const date = new Date(item.date);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Actual Bookings',
        data: timeSeries.map(item => item.actual),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 5
      },
      {
        label: 'Predicted Demand',
        data: timeSeries.map(item => item.predicted),
        borderColor: 'rgb(147, 51, 234)',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        borderDash: [5, 5],
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 5
      },
      {
        label: 'Upper Bound (95% confidence)',
        data: timeSeries.map(item => item.upperBound),
        borderColor: 'rgba(147, 51, 234, 0.3)',
        backgroundColor: 'transparent',
        borderDash: [2, 2],
        tension: 0.4,
        pointRadius: 0
      },
      {
        label: 'Lower Bound (95% confidence)',
        data: timeSeries.map(item => item.lowerBound),
        borderColor: 'rgba(147, 51, 234, 0.3)',
        backgroundColor: 'transparent',
        borderDash: [2, 2],
        tension: 0.4,
        pointRadius: 0,
        fill: '-1'
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(0) + ' bookings';
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Bookings',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        grid: {
          display: false
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  return (
    <div className="space-y-6">
      {/* Chart */}
      <div className="h-96">
        <Line data={chartData} options={options} />
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-600 font-medium">Avg Daily Actual</p>
          <p className="text-2xl font-bold text-blue-900 mt-1">
            {(timeSeries.reduce((sum, item) => sum + (item.actual || 0), 0) / timeSeries.length).toFixed(0)}
          </p>
        </div>

        <div className="p-4 bg-purple-50 rounded-lg">
          <p className="text-sm text-purple-600 font-medium">Avg Daily Predicted</p>
          <p className="text-2xl font-bold text-purple-900 mt-1">
            {(timeSeries.reduce((sum, item) => sum + (item.predicted || 0), 0) / timeSeries.length).toFixed(0)}
          </p>
        </div>

        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-green-600 font-medium">Peak Day</p>
          <p className="text-2xl font-bold text-green-900 mt-1">
            {Math.max(...timeSeries.map(item => item.predicted || 0))}
          </p>
        </div>

        <div className="p-4 bg-orange-50 rounded-lg">
          <p className="text-sm text-orange-600 font-medium">Low Day</p>
          <p className="text-2xl font-bold text-orange-900 mt-1">
            {Math.min(...timeSeries.map(item => item.predicted || 0).filter(v => v > 0))}
          </p>
        </div>
      </div>

      {/* Legend Explanation */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-2">Understanding the Forecast</h4>
        <div className="space-y-2 text-sm text-gray-600">
          <p><span className="font-medium text-blue-600">Actual Bookings:</span> Historical booking data from your system</p>
          <p><span className="font-medium text-purple-600">Predicted Demand:</span> AI-powered forecast based on historical patterns, seasonality, and trends</p>
          <p><span className="font-medium text-gray-500">Confidence Bounds:</span> The shaded area shows the 95% confidence interval for predictions</p>
        </div>
      </div>
    </div>
  );
};

export default ForecastChart;
