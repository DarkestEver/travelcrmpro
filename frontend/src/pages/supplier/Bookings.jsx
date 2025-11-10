import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarIcon,
  BanknotesIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../../services/api';

const SupplierBookings = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  // Fetch bookings assigned to this supplier
  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['supplier-bookings', page, search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });
      const response = await api.get(`/suppliers/my-bookings?${params}`);
      return response.data.data;
    },
  });

  // Update booking status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }) => {
      const response = await api.put(`/suppliers/bookings/${bookingId}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['supplier-bookings']);
      queryClient.invalidateQueries(['supplier-dashboard-stats']);
      toast.success('Booking status updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update booking status');
    },
  });

  const handleStatusUpdate = (bookingId, newStatus) => {
    if (window.confirm(`Are you sure you want to mark this booking as ${newStatus}?`)) {
      updateStatusMutation.mutate({ bookingId, status: newStatus });
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  const bookings = bookingsData?.bookings || [];
  const pagination = bookingsData?.pagination || {};

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage bookings assigned to you for fulfillment
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search bookings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-white shadow rounded-lg border border-gray-200">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : bookings.length > 0 ? (
          <>
            <div className="divide-y divide-gray-200">
              {bookings.map((booking) => (
                <div key={booking._id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Booking Header */}
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {booking.customerName || 'Customer'}
                        </h3>
                        {getStatusBadge(booking.status)}
                      </div>

                      {/* Booking Details */}
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Destination:</span>{' '}
                          {booking.destination || 'Not specified'}
                        </p>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            {booking.travelDate 
                              ? new Date(booking.travelDate).toLocaleDateString()
                              : 'Date TBD'
                            }
                          </span>
                          <span className="flex items-center gap-1">
                            <BanknotesIcon className="h-4 w-4" />
                            ${booking.amount?.toLocaleString() || 0}
                          </span>
                        </div>

                        {booking.services && booking.services.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-gray-700">Services:</p>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {booking.services.map((service, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded"
                                >
                                  {service.name || service.type}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {booking.notes && (
                          <p className="text-sm text-gray-500 mt-2">
                            <span className="font-medium">Notes:</span> {booking.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="ml-6 flex flex-col gap-2">
                      {booking.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(booking._id, 'confirmed')}
                            disabled={updateStatusMutation.isLoading}
                            className="inline-flex items-center gap-1 px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                            Confirm
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(booking._id, 'cancelled')}
                            disabled={updateStatusMutation.isLoading}
                            className="inline-flex items-center gap-1 px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                          >
                            <XCircleIcon className="h-4 w-4" />
                            Cancel
                          </button>
                        </>
                      )}
                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => handleStatusUpdate(booking._id, 'completed')}
                          disabled={updateStatusMutation.isLoading}
                          className="inline-flex items-center gap-1 px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                          Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === pagination.totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing page <span className="font-medium">{page}</span> of{' '}
                      <span className="font-medium">{pagination.totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setPage(page + 1)}
                        disabled={page === pagination.totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="px-6 py-12 text-center">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {search || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Bookings assigned to you will appear here'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierBookings;
