import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBookingById, requestCancellation } from '../../services/customerBookingAPI';
import {
  CalendarIcon,
  MapPinIcon,
  UserIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export default function BookingDetails() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['customerBooking', id],
    queryFn: () => getBookingById(id),
  });

  const cancelMutation = useMutation({
    mutationFn: () => requestCancellation(id, cancelReason),
    onSuccess: () => {
      queryClient.invalidateQueries(['customerBooking', id]);
      setShowCancelModal(false);
      setCancelReason('');
    },
  });

  const booking = data?.data?.booking;

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-gray-500">Loading booking details...</div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900">Booking not found</h3>
          <Link to="/customer/bookings" className="mt-4 inline-flex text-blue-600 hover:text-blue-500">
            ← Back to Bookings
          </Link>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back Button */}
      <Link
        to="/customer/bookings"
        className="inline-flex items-center text-blue-600 hover:text-blue-500 mb-6"
      >
        <ArrowLeftIcon className="h-5 w-5 mr-2" />
        Back to Bookings
      </Link>

      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{booking.bookingNumber}</h1>
            <p className="mt-2 text-gray-600">
              {booking.itinerary?.title || booking.itineraryId?.title || 'Travel Booking'}
            </p>
          </div>
          <span
            className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(
              booking.bookingStatus
            )}`}
          >
            {booking.bookingStatus}
          </span>
        </div>

        {/* Actions */}
        <div className="mt-6 flex space-x-3">
          {booking.bookingStatus === 'confirmed' && (
            <Link
              to={`/customer/bookings/${id}/voucher`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              Download Voucher
            </Link>
          )}
          {(booking.bookingStatus === 'pending' || booking.bookingStatus === 'confirmed') &&
            !booking.cancellationRequest?.requested && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="inline-flex items-center px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
              >
                <XCircleIcon className="h-5 w-5 mr-2" />
                Request Cancellation
              </button>
            )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Travel Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Travel Details</h2>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <MapPinIcon className="h-5 w-5 text-gray-400 mt-1 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Destination</p>
                  <p className="font-medium text-gray-900">
                    {booking.itinerary?.destination || booking.itineraryId?.destination || 'TBD'}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <CalendarIcon className="h-5 w-5 text-gray-400 mt-1 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Travel Dates</p>
                  <p className="font-medium text-gray-900">
                    {booking.travelDates?.startDate
                      ? format(new Date(booking.travelDates.startDate), 'MMMM dd, yyyy')
                      : 'TBD'}{' '}
                    -{' '}
                    {booking.travelDates?.endDate
                      ? format(new Date(booking.travelDates.endDate), 'MMMM dd, yyyy')
                      : 'TBD'}
                  </p>
                  {booking.itinerary?.duration && (
                    <p className="text-sm text-gray-600 mt-1">
                      Duration: {booking.itinerary.duration} days
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start">
                <UserIcon className="h-5 w-5 text-gray-400 mt-1 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Travelers</p>
                  <p className="font-medium text-gray-900">
                    {booking.numberOfTravelers || 1} {booking.numberOfTravelers === 1 ? 'Traveler' : 'Travelers'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Itinerary Timeline */}
          {booking.itinerary?.days && booking.itinerary.days.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Itinerary</h2>
              
              <div className="space-y-6">
                {booking.itinerary.days.map((day, index) => (
                  <div key={index} className="relative pl-8 pb-6 border-l-2 border-gray-200 last:border-l-0 last:pb-0">
                    <div className="absolute left-0 top-0 -translate-x-1/2 bg-blue-600 rounded-full w-4 h-4"></div>
                    <div className="mb-2">
                      <span className="text-sm font-medium text-blue-600">Day {day.dayNumber}</span>
                      <h3 className="text-lg font-semibold text-gray-900">{day.title}</h3>
                    </div>
                    {day.description && (
                      <p className="text-sm text-gray-600 mb-3">{day.description}</p>
                    )}
                    {day.activities && day.activities.length > 0 && (
                      <div className="space-y-2">
                        {day.activities.map((activity, actIndex) => (
                          <div key={actIndex} className="bg-gray-50 rounded p-3">
                            <p className="text-sm font-medium text-gray-900">{activity.name}</p>
                            {activity.time && (
                              <p className="text-xs text-gray-600 mt-1">Time: {activity.time}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Agent Information */}
          {booking.agentId && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Agent</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Agency</p>
                  <p className="font-medium text-gray-900">{booking.agentId.agencyName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Contact Person</p>
                  <p className="font-medium text-gray-900">{booking.agentId.contactPerson}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <a href={`mailto:${booking.agentId.email}`} className="text-blue-600 hover:text-blue-500">
                    {booking.agentId.email}
                  </a>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <a href={`tel:${booking.agentId.phone}`} className="text-blue-600 hover:text-blue-500">
                    {booking.agentId.phone}
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Booking Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Information</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Booking Date</p>
                <p className="font-medium text-gray-900">
                  {format(new Date(booking.createdAt), 'MMMM dd, yyyy')}
                </p>
              </div>
              {booking.totalAmount && (
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="font-medium text-gray-900">${booking.totalAmount.toFixed(2)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Cancellation</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for cancellation. Your agent will review your request.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter cancellation reason..."
            />
            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {cancelMutation.isPending ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
