import { useQuery } from '@tanstack/react-query';
import { getBookingById, downloadVoucher } from '../../services/agentBookingAPI';
import {
  XMarkIcon,
  UserIcon,
  MapPinIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  DocumentArrowDownIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-green-100 text-green-800 border-green-200',
  completed: 'bg-blue-100 text-blue-800 border-blue-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

const paymentStatusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  partial: 'bg-orange-100 text-orange-800',
  paid: 'bg-green-100 text-green-800',
  refunded: 'bg-gray-100 text-gray-800',
};

const BookingDetailModal = ({ isOpen, onClose, bookingId }) => {
  const { data: booking, isLoading, error } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => getBookingById(bookingId),
    enabled: isOpen && !!bookingId,
  });

  const handleDownloadVoucher = async () => {
    try {
      const voucherData = await downloadVoucher(bookingId);
      // In a real implementation, you would trigger a PDF download here
      console.log('Voucher data:', voucherData);
      alert('Voucher download will be implemented in production. Check console for data.');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to download voucher');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">
                Booking Details
              </h3>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 p-4 rounded-md">
                <p className="text-red-800">
                  Error loading booking: {error.message}
                </p>
              </div>
            ) : booking ? (
              <div className="space-y-6">
                {/* Booking Reference and Status */}
                <div className="flex items-center justify-between pb-4 border-b">
                  <div>
                    <p className="text-sm text-gray-500">Booking Reference</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {booking.bookingNumber || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 mb-2">Status</p>
                    <span
                      className={`px-4 py-2 inline-flex text-sm font-semibold rounded-full border-2 ${
                        statusColors[booking.bookingStatus] ||
                        'bg-gray-100 text-gray-800 border-gray-200'
                      }`}
                    >
                      {booking.bookingStatus?.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <UserIcon className="h-5 w-5 mr-2 text-blue-600" />
                    Customer Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="text-base font-medium text-gray-900">
                        {booking.customerId?.firstName}{' '}
                        {booking.customerId?.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-base text-gray-900">
                        {booking.customerId?.email || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="text-base text-gray-900">
                        {booking.customerId?.phone || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Passport Number</p>
                      <p className="text-base text-gray-900">
                        {booking.customerId?.passportNumber || 'N/A'}
                      </p>
                    </div>
                    {booking.customerId?.address && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="text-base text-gray-900">
                          {booking.customerId.address},{' '}
                          {booking.customerId.city},{' '}
                          {booking.customerId.country}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Trip Details */}
                {booking.itineraryId && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <MapPinIcon className="h-5 w-5 mr-2 text-blue-600" />
                      Trip Details
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Destination</p>
                        <p className="text-lg font-medium text-gray-900">
                          {booking.itineraryId.destination}
                        </p>
                      </div>
                      {booking.itineraryId.title && (
                        <div>
                          <p className="text-sm text-gray-500">Package Title</p>
                          <p className="text-base text-gray-900">
                            {booking.itineraryId.title}
                          </p>
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            Start Date
                          </p>
                          <p className="text-base font-medium text-gray-900">
                            {formatDate(booking.travelDates?.startDate || booking.itineraryId.startDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            End Date
                          </p>
                          <p className="text-base font-medium text-gray-900">
                            {formatDate(booking.travelDates?.endDate || booking.itineraryId.endDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            Duration
                          </p>
                          <p className="text-base font-medium text-gray-900">
                            {booking.itineraryId.duration || 'N/A'} days
                          </p>
                        </div>
                      </div>
                      {booking.itineraryId.description && (
                        <div>
                          <p className="text-sm text-gray-500">Description</p>
                          <p className="text-base text-gray-700">
                            {booking.itineraryId.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Payment Information */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <CurrencyDollarIcon className="h-5 w-5 mr-2 text-green-600" />
                    Payment Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Total Amount</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(
                          booking.financial?.totalAmount || 0,
                          booking.financial?.currency || 'USD'
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Payment Status</p>
                      <span
                        className={`mt-1 px-3 py-1 inline-flex text-sm font-semibold rounded-full ${
                          paymentStatusColors[booking.paymentStatus] ||
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {booking.paymentStatus?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Paid Amount</p>
                      <p className="text-lg font-medium text-green-600">
                        {formatCurrency(
                          booking.financial?.paidAmount || 0,
                          booking.financial?.currency || 'USD'
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Balance Due</p>
                      <p className="text-lg font-medium text-orange-600">
                        {formatCurrency(
                          (booking.financial?.totalAmount || 0) - (booking.financial?.paidAmount || 0),
                          booking.financial?.currency || 'USD'
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Booking Timeline */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Booking Timeline
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Booking Created:</span>
                      <span className="font-medium text-gray-900">
                        {formatDate(booking.createdAt)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Last Updated:</span>
                      <span className="font-medium text-gray-900">
                        {formatDate(booking.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Additional Notes */}
                {booking.notes && (
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      Notes
                    </h4>
                    <p className="text-sm text-gray-700">{booking.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-gray-500">No booking data available</p>
            )}
          </div>

          {/* Footer */}
          {booking && booking.bookingStatus === 'confirmed' && (
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={handleDownloadVoucher}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                Download Voucher
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          )}
          {booking && booking.bookingStatus !== 'confirmed' && (
            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingDetailModal;
