import { useState } from 'react';
import {
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  MapPinIcon,
  CalendarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { acceptQuote, rejectQuote, getQuoteRequestById } from '../../services/agentQuoteRequestAPI';
import { useQuery } from '@tanstack/react-query';

export default function QuoteDetailModal({ quote, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Fetch full quote details with itinerary
  const { data, isLoading } = useQuery({
    queryKey: ['quoteRequestDetail', quote._id],
    queryFn: () => getQuoteRequestById(quote._id),
    enabled: !!quote._id,
  });

  const quoteDetails = data?.data?.quoteRequest || quote;
  const itinerary = quoteDetails.quoteItineraryId;

  // Handle accept
  const handleAccept = async () => {
    if (!window.confirm('Are you sure you want to accept this quote?')) {
      return;
    }

    setLoading(true);
    try {
      await acceptQuote(quote._id);
      alert('Quote accepted successfully!');
      onSuccess();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept quote');
    } finally {
      setLoading(false);
    }
  };

  // Handle reject
  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setLoading(true);
    try {
      await rejectQuote(quote._id, rejectReason);
      alert('Quote rejected');
      onSuccess();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject quote');
    } finally {
      setLoading(false);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewing: 'bg-blue-100 text-blue-800',
      quoted: 'bg-green-100 text-green-800',
      accepted: 'bg-indigo-100 text-indigo-800',
      rejected: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        {/* Modal */}
        <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Quote Request Details</h3>
              <p className="text-sm text-gray-500">Reference: #{quote._id.slice(-8).toUpperCase()}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-2 text-sm text-gray-500">Loading details...</p>
            </div>
          ) : (
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
                    quoteDetails.status
                  )}`}
                >
                  {quoteDetails.status.charAt(0).toUpperCase() + quoteDetails.status.slice(1)}
                </span>
                <span className="text-sm text-gray-500">
                  Submitted {new Date(quoteDetails.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Customer Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Customer Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span>
                    <span className="ml-2 font-medium">
                      {quoteDetails.customerId?.firstName} {quoteDetails.customerId?.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <span className="ml-2 font-medium">{quoteDetails.customerId?.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Phone:</span>
                    <span className="ml-2 font-medium">{quoteDetails.customerId?.phone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Location:</span>
                    <span className="ml-2 font-medium">
                      {quoteDetails.customerId?.city && quoteDetails.customerId?.country
                        ? `${quoteDetails.customerId.city}, ${quoteDetails.customerId.country}`
                        : quoteDetails.customerId?.country || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Trip Details */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Trip Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start">
                    <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Destination</p>
                      <p className="text-sm text-gray-900">
                        {quoteDetails.destination?.city
                          ? `${quoteDetails.destination.city}, ${quoteDetails.destination.country}`
                          : quoteDetails.destination?.country}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Travel Dates</p>
                      <p className="text-sm text-gray-900">
                        {new Date(quoteDetails.travelDates.startDate).toLocaleDateString()} -{' '}
                        {new Date(quoteDetails.travelDates.endDate).toLocaleDateString()}
                      </p>
                      {quoteDetails.travelDates.flexible && (
                        <p className="text-xs text-gray-500">Flexible (±3 days)</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start">
                    <UserGroupIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Travelers</p>
                      <p className="text-sm text-gray-900">
                        {quoteDetails.travelers.adults} Adults
                        {quoteDetails.travelers.children > 0 && `, ${quoteDetails.travelers.children} Children`}
                        {quoteDetails.travelers.infants > 0 && `, ${quoteDetails.travelers.infants} Infants`}
                      </p>
                    </div>
                  </div>

                  {quoteDetails.budget?.amount && (
                    <div className="flex items-start">
                      <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Budget</p>
                        <p className="text-sm text-gray-900">
                          {quoteDetails.budget.currency} {quoteDetails.budget.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">{quoteDetails.budget.flexibility}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Preferences */}
              {quoteDetails.preferences && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Travel Preferences</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {quoteDetails.preferences.travelStyle && quoteDetails.preferences.travelStyle.length > 0 && (
                      <div>
                        <p className="font-medium text-gray-700">Travel Style:</p>
                        <p className="text-gray-900 capitalize">
                          {quoteDetails.preferences.travelStyle.join(', ')}
                        </p>
                      </div>
                    )}
                    {quoteDetails.preferences.difficulty && (
                      <div>
                        <p className="font-medium text-gray-700">Difficulty:</p>
                        <p className="text-gray-900 capitalize">{quoteDetails.preferences.difficulty}</p>
                      </div>
                    )}
                    {quoteDetails.preferences.themes && quoteDetails.preferences.themes.length > 0 && (
                      <div>
                        <p className="font-medium text-gray-700">Themes:</p>
                        <p className="text-gray-900 capitalize">
                          {quoteDetails.preferences.themes.join(', ')}
                        </p>
                      </div>
                    )}
                    {quoteDetails.preferences.accommodation && (
                      <div>
                        <p className="font-medium text-gray-700">Accommodation:</p>
                        <p className="text-gray-900 capitalize">{quoteDetails.preferences.accommodation}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Notes */}
              {quoteDetails.inspirationNotes && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Additional Notes</h4>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded p-3">
                    {quoteDetails.inspirationNotes}
                  </p>
                </div>
              )}

              {/* Quoted Itinerary (if status is quoted) */}
              {quoteDetails.status === 'quoted' && itinerary && (
                <div className="border-t pt-6">
                  <h4 className="font-medium text-gray-900 mb-3">Quoted Itinerary</h4>
                  <div className="bg-indigo-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h5 className="font-medium text-gray-900">{itinerary.title}</h5>
                        {itinerary.description && (
                          <p className="text-sm text-gray-600 mt-1">{itinerary.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-indigo-600">
                          ${itinerary.totalPrice?.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">Total Price</p>
                      </div>
                    </div>
                    {quoteDetails.quoteValidUntil && (
                      <p className="text-xs text-gray-600 mt-2">
                        Valid until: {new Date(quoteDetails.quoteValidUntil).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Reject Reason Input */}
              {showRejectReason && (
                <div className="border-t pt-4">
                  <label htmlFor="rejectReason" className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Rejection <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="rejectReason"
                    rows={3}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Please provide a reason for rejecting this quote..."
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="border-t px-6 py-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Close
            </button>

            {quoteDetails.status === 'quoted' && !showRejectReason && (
              <>
                <button
                  type="button"
                  onClick={() => setShowRejectReason(true)}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 disabled:opacity-50"
                >
                  <XCircleIcon className="h-5 w-5 mr-2" />
                  Reject
                </button>
                <button
                  type="button"
                  onClick={handleAccept}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  {loading ? 'Accepting...' : 'Accept Quote'}
                </button>
              </>
            )}

            {showRejectReason && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectReason(false);
                    setRejectReason('');
                  }}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={loading || !rejectReason.trim()}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  <XCircleIcon className="h-5 w-5 mr-2" />
                  {loading ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
