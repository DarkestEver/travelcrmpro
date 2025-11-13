import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export default function SharedBooking() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [password, setPassword] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [booking, setBooking] = useState(null);
  const [tenant, setTenant] = useState(null);

  useEffect(() => {
    loadBooking();
  }, [token]);

  const loadBooking = async (pwd = null) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${API_URL}/public/bookings/${token}`, {
        params: { password: pwd || password }
      });

      setBooking(response.data.data.booking);
      setTenant(response.data.data.tenant);
      setNeedsPassword(false);
    } catch (err) {
      if (err.response?.status === 401 && err.response?.data?.message?.includes('password')) {
        setNeedsPassword(true);
        setError('This booking requires a password to view.');
      } else if (err.response?.status === 403 && err.response?.data?.message?.includes('already been used')) {
        // Handle single-use link already accessed
        setError('link_already_used');
      } else {
        setError(err.response?.data?.message || 'Failed to load booking');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    loadBooking(password);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading booking...</p>
        </div>
      </div>
    );
  }

  if (needsPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Password Required
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              This booking is password protected. Please enter the password to continue.
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handlePasswordSubmit}>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                View Booking
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    // Special handling for single-use link already accessed
    if (error === 'link_already_used') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="text-center max-w-md bg-white rounded-lg shadow-lg p-8">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Link Already Used
            </h1>
            <p className="text-gray-600 mb-4 leading-relaxed">
              This one-time access link has already been used and is no longer valid for security reasons.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Need access again?</strong><br />
                Please contact the sender to request a new link.
              </p>
            </div>
            <div className="text-xs text-gray-500">
              This security measure helps protect sensitive booking information.
            </div>
          </div>
        </div>
      );
    }

    // Default error handling
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Booking</h1>
          <p className="text-gray-600">{error || 'Booking not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with branding */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{tenant?.name || 'Travel Agency'}</h1>
              <p className="text-sm text-gray-600 mt-1">Booking Confirmation</p>
            </div>
            {tenant?.settings?.branding?.logo && (
              <img 
                src={tenant.settings.branding.logo} 
                alt={tenant.name} 
                className="h-16 object-contain"
              />
            )}
          </div>
        </div>

        {/* Booking Details */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-indigo-50">
            <h2 className="text-lg font-semibold text-indigo-900">Booking Details</h2>
          </div>
          
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Booking Reference</p>
                <p className="font-semibold text-gray-900">{booking.bookingNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {booking.status?.toUpperCase() || 'N/A'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Travel Date</p>
                <p className="font-semibold text-gray-900">
                  {booking.startDate ? new Date(booking.startDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Return Date</p>
                <p className="font-semibold text-gray-900">
                  {booking.endDate ? new Date(booking.endDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            {booking.customer && (
              <div>
                <p className="text-sm text-gray-600">Customer Name</p>
                <p className="font-semibold text-gray-900">{booking.customer.name || 'N/A'}</p>
              </div>
            )}

            {booking.itinerary && (
              <div>
                <p className="text-sm text-gray-600">Itinerary</p>
                <p className="font-semibold text-gray-900">{booking.itinerary.title || 'N/A'}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {booking.pricing?.totalAmount 
                    ? `$${booking.pricing.totalAmount.toFixed(2)}` 
                    : 'N/A'}
                </p>
              </div>
              {booking.pricing?.paidAmount > 0 && (
                <div>
                  <p className="text-sm text-gray-600">Paid Amount</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${booking.pricing.paidAmount.toFixed(2)}
                  </p>
                </div>
              )}
            </div>

            {booking.notes && (
              <div>
                <p className="text-sm text-gray-600">Notes</p>
                <p className="text-gray-900">{booking.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>For any queries, please contact {tenant?.name || 'us'}</p>
          {tenant?.settings?.contact?.email && (
            <p className="mt-1">Email: {tenant.settings.contact.email}</p>
          )}
          {tenant?.settings?.contact?.phone && (
            <p>Phone: {tenant.settings.contact.phone}</p>
          )}
        </div>
      </div>
    </div>
  );
}
