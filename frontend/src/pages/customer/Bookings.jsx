import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getBookings } from '../../services/customerBookingAPI';
import {
  CalendarIcon,
  MapPinIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export default function CustomerBookings() {
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    page: 1,
    limit: 10,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['customerBookings', filters],
    queryFn: () => getBookings(filters),
  });

  const bookings = data?.data?.bookings || [];
  const pagination = data?.data?.pagination || {};

  const statusOptions = [
    { value: '', label: 'All Bookings' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

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
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
        <p className="mt-2 text-gray-600">View and manage your travel bookings</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by booking number or destination..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-gray-500">Loading bookings...</div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No bookings found</h3>
          <p className="mt-2 text-gray-600">
            {filters.search || filters.status
              ? 'Try adjusting your filters'
              : "You don't have any bookings yet"}
          </p>
          <Link
            to="/customer/request-quote"
            className="mt-6 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Request a Quote
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking._id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Booking Number & Status */}
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {booking.bookingNumber}
                        </h3>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            booking.bookingStatus
                          )}`}
                        >
                          {booking.bookingStatus}
                        </span>
                      </div>

                      {/* Destination */}
                      <div className="flex items-center text-gray-700 mb-2">
                        <MapPinIcon className="h-5 w-5 mr-2" />
                        <span className="font-medium">
                          {booking.itineraryId?.destination || booking.destination || 'Destination TBD'}
                        </span>
                      </div>

                      {/* Travel Dates */}
                      <div className="flex items-center text-gray-600 text-sm">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        <span>
                          {booking.travelDates?.startDate
                            ? format(new Date(booking.travelDates.startDate), 'MMM dd, yyyy')
                            : 'Date TBD'}{' '}
                          -{' '}
                          {booking.travelDates?.endDate
                            ? format(new Date(booking.travelDates.endDate), 'MMM dd, yyyy')
                            : 'Date TBD'}
                        </span>
                      </div>

                      {/* Itinerary Title */}
                      {booking.itineraryId?.title && (
                        <p className="mt-2 text-sm text-gray-600">
                          {booking.itineraryId.title}
                        </p>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="ml-6">
                      <Link
                        to={`/customer/bookings/${booking._id}`}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-6 flex items-center justify-between bg-white rounded-lg shadow px-6 py-4">
              <div className="text-sm text-gray-700">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                  disabled={pagination.page === pagination.pages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
