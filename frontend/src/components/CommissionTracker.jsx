import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, FileText, Edit2, Save, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import DataTable from './DataTable';
import { agentsAPI } from '../services/apiEndpoints';

/**
 * Commission Tracker Component
 * Displays and manages agent commission structure and earnings
 */
const CommissionTracker = ({ agentId, editable = false }) => {
  const [commission, setCommission] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedRates, setEditedRates] = useState({});

  useEffect(() => {
    if (agentId) {
      loadCommissionData();
    }
  }, [agentId]);

  const loadCommissionData = async () => {
    try {
      setLoading(true);
      const [commissionRes, bookingsRes, quotesRes] = await Promise.all([
        agentsAPI.getCommission(agentId),
        agentsAPI.getBookings(agentId, { limit: 10 }),
        agentsAPI.getQuotes(agentId, { limit: 10 })
      ]);

      setCommission(commissionRes.data);
      setBookings(bookingsRes.data.bookings || bookingsRes.data);
      setQuotes(quotesRes.data.quotes || quotesRes.data);
      setEditedRates(commissionRes.data.rates || {});
    } catch (error) {
      console.error('Error loading commission data:', error);
      toast.error('Failed to load commission data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (editing) {
      setEditedRates(commission.rates || {});
    }
    setEditing(!editing);
  };

  const handleRateChange = (type, value) => {
    setEditedRates(prev => ({
      ...prev,
      [type]: parseFloat(value) || 0
    }));
  };

  const handleSave = async () => {
    try {
      await agentsAPI.updateCommission(agentId, { rates: editedRates });
      toast.success('Commission rates updated successfully');
      setEditing(false);
      loadCommissionData();
    } catch (error) {
      console.error('Error updating commission:', error);
      toast.error('Failed to update commission rates');
    }
  };

  const calculateEarnings = () => {
    if (!bookings.length) return 0;
    return bookings.reduce((total, booking) => {
      const rate = commission?.rates?.[booking.type] || 0;
      return total + (booking.totalAmount * rate / 100);
    }, 0);
  };

  const calculateConversionRate = () => {
    if (!quotes.length) return 0;
    const converted = quotes.filter(q => q.status === 'converted').length;
    return ((converted / quotes.length) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!commission) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No commission data available</p>
      </div>
    );
  }

  const totalEarnings = calculateEarnings();
  const conversionRate = calculateConversionRate();

  const commissionTypes = [
    { key: 'flight', label: 'Flight Bookings', icon: '✈️' },
    { key: 'hotel', label: 'Hotel Bookings', icon: '🏨' },
    { key: 'package', label: 'Tour Packages', icon: '📦' },
    { key: 'visa', label: 'Visa Services', icon: '📋' },
    { key: 'insurance', label: 'Travel Insurance', icon: '🛡️' },
    { key: 'other', label: 'Other Services', icon: '🎯' }
  ];

  const bookingColumns = [
    {
      key: 'bookingNumber',
      label: 'Booking #',
      render: (booking) => (
        <span className="font-mono text-sm">{booking.bookingNumber}</span>
      )
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (booking) => booking.customer?.name || 'N/A'
    },
    {
      key: 'type',
      label: 'Type',
      render: (booking) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs capitalize">
          {booking.type}
        </span>
      )
    },
    {
      key: 'totalAmount',
      label: 'Amount',
      render: (booking) => `$${booking.totalAmount?.toLocaleString() || 0}`
    },
    {
      key: 'commission',
      label: 'Commission',
      render: (booking) => {
        const rate = commission.rates?.[booking.type] || 0;
        const amount = (booking.totalAmount * rate / 100);
        return (
          <div>
            <div className="font-medium">${amount.toFixed(2)}</div>
            <div className="text-xs text-gray-500">{rate}%</div>
          </div>
        );
      }
    },
    {
      key: 'status',
      label: 'Status',
      render: (booking) => {
        const colors = {
          confirmed: 'bg-green-100 text-green-800',
          pending: 'bg-yellow-100 text-yellow-800',
          cancelled: 'bg-red-100 text-red-800'
        };
        return (
          <span className={`px-2 py-1 rounded text-xs ${colors[booking.status] || 'bg-gray-100 text-gray-800'}`}>
            {booking.status}
          </span>
        );
      }
    }
  ];

  const quoteColumns = [
    {
      key: 'quoteNumber',
      label: 'Quote #',
      render: (quote) => (
        <span className="font-mono text-sm">{quote.quoteNumber}</span>
      )
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (quote) => quote.customer?.name || 'N/A'
    },
    {
      key: 'totalAmount',
      label: 'Amount',
      render: (quote) => `$${quote.totalAmount?.toLocaleString() || 0}`
    },
    {
      key: 'status',
      label: 'Status',
      render: (quote) => {
        const colors = {
          draft: 'bg-gray-100 text-gray-800',
          sent: 'bg-blue-100 text-blue-800',
          accepted: 'bg-green-100 text-green-800',
          rejected: 'bg-red-100 text-red-800',
          converted: 'bg-purple-100 text-purple-800'
        };
        return (
          <span className={`px-2 py-1 rounded text-xs ${colors[quote.status] || 'bg-gray-100 text-gray-800'}`}>
            {quote.status}
          </span>
        );
      }
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (quote) => new Date(quote.createdAt).toLocaleDateString()
    }
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1">
            ${totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-blue-100 text-sm">Total Earnings (Recent)</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1">{conversionRate}%</div>
          <div className="text-green-100 text-sm">Quote Conversion Rate</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-8 h-8 opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1">{bookings.length}</div>
          <div className="text-purple-100 text-sm">Recent Bookings</div>
        </div>
      </div>

      {/* Commission Rates */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Commission Rates</h3>
          {editable && (
            <div className="flex gap-2">
              {editing ? (
                <>
                  <button
                    onClick={handleEditToggle}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                </>
              ) : (
                <button
                  onClick={handleEditToggle}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {commissionTypes.map(type => (
            <div key={type.key} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{type.icon}</span>
                  <div className="text-sm font-medium text-gray-700">{type.label}</div>
                </div>
              </div>
              {editing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={editedRates[type.key] || 0}
                    onChange={(e) => handleRateChange(type.key, e.target.value)}
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-right"
                  />
                  <span className="text-lg font-semibold text-gray-900">%</span>
                </div>
              ) : (
                <div className="text-2xl font-bold text-blue-600">
                  {commission.rates?.[type.key] || 0}%
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
        </div>
        <DataTable
          columns={bookingColumns}
          data={bookings}
          emptyMessage="No bookings found"
        />
      </div>

      {/* Recent Quotes */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Quotes</h3>
        </div>
        <DataTable
          columns={quoteColumns}
          data={quotes}
          emptyMessage="No quotes found"
        />
      </div>
    </div>
  );
};

export default CommissionTracker;
