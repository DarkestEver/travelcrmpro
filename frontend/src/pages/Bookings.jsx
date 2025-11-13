import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiEye,
  FiCheckCircle,
  FiXCircle,
  FiDollarSign,
  FiUsers,
  FiFileText,
  FiClock,
  FiShare2
} from 'react-icons/fi';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import ShareModal from '../components/ShareModal';
import AssignmentDropdown from '../components/assignments/AssignmentDropdown';
import AssignmentList from '../components/assignments/AssignmentList';
import ExpenseForm from '../components/expenses/ExpenseForm';
import ExpenseList from '../components/expenses/ExpenseList';
import { bookingsAPI } from '../services/apiEndpoints';

const Bookings = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [actionType, setActionType] = useState('');

  // Fetch bookings
  const { data, isLoading } = useQuery({
    queryKey: ['bookings', page, search],
    queryFn: () => bookingsAPI.getAll({ page, limit: 10, search }),
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: (bookingData) =>
      selectedBooking
        ? bookingsAPI.update(selectedBooking._id, bookingData)
        : bookingsAPI.create(bookingData),
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      toast.success(`Booking ${selectedBooking ? 'updated' : 'created'} successfully`);
      setShowModal(false);
      setSelectedBooking(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to save booking');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => bookingsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      toast.success('Booking deleted successfully');
      setShowConfirm(false);
      setSelectedBooking(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete booking');
    },
  });

  // Confirm mutation
  const confirmMutation = useMutation({
    mutationFn: (id) => bookingsAPI.confirm(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      toast.success('Booking confirmed successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to confirm booking');
    },
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: (id) => bookingsAPI.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      toast.success('Booking cancelled successfully');
      setShowConfirm(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to cancel booking');
    },
  });

  // Complete mutation
  const completeMutation = useMutation({
    mutationFn: (id) => bookingsAPI.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      toast.success('Booking completed successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to complete booking');
    },
  });

  const handleAction = (booking, action) => {
    setSelectedBooking(booking);
    setActionType(action);

    if (action === 'delete' || action === 'cancel') {
      setShowConfirm(true);
    } else if (action === 'edit') {
      setShowModal(true);
    } else if (action === 'view') {
      setShowDetails(true);
    } else if (action === 'share') {
      setShowShareModal(true);
    } else if (action === 'confirm') {
      confirmMutation.mutate(booking._id);
    } else if (action === 'complete') {
      completeMutation.mutate(booking._id);
    }
  };

  const handleConfirm = () => {
    if (actionType === 'delete') {
      deleteMutation.mutate(selectedBooking._id);
    } else if (actionType === 'cancel') {
      cancelMutation.mutate(selectedBooking._id);
    }
  };

  const columns = [
    {
      header: 'Booking ID',
      accessor: 'bookingNumber',
      render: (value) => (
        <span className="font-mono text-sm font-medium">{value}</span>
      ),
    },
    {
      header: 'Customer',
      accessor: 'customer',
      render: (value, row) => (
        <div>
          <div className="font-medium">{value?.name}</div>
          <div className="text-xs text-gray-500">{row.numberOfTravelers} traveler(s)</div>
        </div>
      ),
    },
    {
      header: 'Destination',
      accessor: 'destination',
      render: (value, row) => (
        <div>
          <div>{value}</div>
          <div className="text-xs text-gray-500">
            {row.startDate?.split('T')[0]} - {row.endDate?.split('T')[0]}
          </div>
        </div>
      ),
    },
    {
      header: 'Payment',
      accessor: 'totalAmount',
      render: (value, row) => (
        <div>
          <div className="font-medium">${value?.toFixed(2)}</div>
          <div className="text-xs">
            <span className={`${
              row.paymentStatus === 'paid' ? 'text-green-600' :
              row.paymentStatus === 'partial' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {row.paymentStatus}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (value) => (
        <span className={`badge ${
          value === 'confirmed' ? 'badge-success' :
          value === 'pending' ? 'badge-warning' :
          value === 'cancelled' ? 'badge-danger' :
          value === 'completed' ? 'badge-info' : 'badge-secondary'
        }`}>
          {value}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: '_id',
      render: (value, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleAction(row, 'view')}
            className="text-green-600 hover:text-green-800"
            title="View Details"
          >
            <FiEye className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleAction(row, 'edit')}
            className="text-blue-600 hover:text-blue-800"
            title="Edit"
          >
            <FiEdit className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleAction(row, 'share')}
            className="text-indigo-600 hover:text-indigo-800"
            title="Share"
          >
            <FiShare2 className="w-4 h-4" />
          </button>

          {row.status === 'pending' && (
            <button
              onClick={() => handleAction(row, 'confirm')}
              className="text-green-600 hover:text-green-800"
              title="Confirm"
            >
              <FiCheckCircle className="w-4 h-4" />
            </button>
          )}

          {row.status === 'confirmed' && (
            <button
              onClick={() => handleAction(row, 'complete')}
              className="text-blue-600 hover:text-blue-800"
              title="Complete"
            >
              <FiCheckCircle className="w-4 h-4" />
            </button>
          )}

          {(row.status === 'pending' || row.status === 'confirmed') && (
            <button
              onClick={() => handleAction(row, 'cancel')}
              className="text-yellow-600 hover:text-yellow-800"
              title="Cancel"
            >
              <FiXCircle className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => handleAction(row, 'delete')}
            className="text-red-600 hover:text-red-800"
            title="Delete"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="overflow-y-auto">
      <div className="space-y-6 p-6 pb-24">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
            <p className="text-gray-600 mt-1">Manage travel bookings and reservations</p>
          </div>
        <button
          onClick={() => {
            setSelectedBooking(null);
            setShowModal(true);
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <FiPlus className="w-4 h-4" />
          Create Booking
        </button>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={data?.data || []}
        pagination={data?.pagination}
        onPageChange={setPage}
        onSearch={setSearch}
        loading={isLoading}
        searchPlaceholder="Search bookings..."
        showSearch={true}
      />

      {/* Create/Edit Modal */}
      {showModal && (
        <BookingFormModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedBooking(null);
          }}
          booking={selectedBooking}
          onSubmit={saveMutation.mutate}
          isLoading={saveMutation.isPending}
        />
      )}

      {/* Details Modal */}
      {showDetails && (
        <BookingDetailsModal
          isOpen={showDetails}
          onClose={() => {
            setShowDetails(false);
            setSelectedBooking(null);
          }}
          booking={selectedBooking}
        />
      )}

      {/* Delete/Cancel Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
        title={`${actionType === 'delete' ? 'Delete' : 'Cancel'} Booking`}
        message={`Are you sure you want to ${actionType} booking ${selectedBooking?.bookingNumber}?`}
        type="danger"
      />

      {/* Share Modal */}
      {showShareModal && selectedBooking && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setSelectedBooking(null);
          }}
          entity={selectedBooking}
          entityType="booking"
        />
      )}
      </div>
    </div>
  );
};

// Booking Form Modal Component
const BookingFormModal = ({ isOpen, onClose, booking, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    destination: booking?.destination || '',
    numberOfTravelers: booking?.numberOfTravelers || 1,
    startDate: booking?.startDate?.split('T')[0] || '',
    endDate: booking?.endDate?.split('T')[0] || '',
    totalAmount: booking?.totalAmount || 0,
    paidAmount: booking?.paidAmount || 0,
    paymentStatus: booking?.paymentStatus || 'pending',
    travelers: booking?.travelers || [
      { name: '', email: '', phone: '', passportNumber: '' }
    ],
    notes: booking?.notes || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addTraveler = () => {
    setFormData(prev => ({
      ...prev,
      travelers: [...prev.travelers, { name: '', email: '', phone: '', passportNumber: '' }]
    }));
  };

  const removeTraveler = (index) => {
    if (formData.travelers.length > 1) {
      setFormData(prev => ({
        ...prev,
        travelers: prev.travelers.filter((_, i) => i !== index)
      }));
    }
  };

  const updateTraveler = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      travelers: prev.travelers.map((traveler, i) => 
        i === index ? { ...traveler, [field]: value } : traveler
      )
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={booking ? 'Edit Booking' : 'Create New Booking'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Destination *</label>
            <input
              type="text"
              name="destination"
              value={formData.destination}
              onChange={handleChange}
              required
              className="input"
              placeholder="Maldives"
            />
          </div>

          <div>
            <label className="label">Number of Travelers *</label>
            <input
              type="number"
              name="numberOfTravelers"
              value={formData.numberOfTravelers}
              onChange={handleChange}
              required
              min="1"
              className="input"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Start Date *</label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
              className="input"
            />
          </div>

          <div>
            <label className="label">End Date *</label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              required
              className="input"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Total Amount *</label>
            <input
              type="number"
              name="totalAmount"
              value={formData.totalAmount}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="input"
            />
          </div>

          <div>
            <label className="label">Paid Amount</label>
            <input
              type="number"
              name="paidAmount"
              value={formData.paidAmount}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="input"
            />
          </div>

          <div>
            <label className="label">Payment Status</label>
            <select
              name="paymentStatus"
              value={formData.paymentStatus}
              onChange={handleChange}
              className="input"
            >
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>

        {/* Travelers */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-gray-900">Traveler Details</h3>
            <button
              type="button"
              onClick={addTraveler}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <FiPlus className="w-3 h-3" />
              Add Traveler
            </button>
          </div>

          {formData.travelers.map((traveler, index) => (
            <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-gray-800">Traveler {index + 1}</h4>
                {formData.travelers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTraveler(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={traveler.name}
                  onChange={(e) => updateTraveler(index, 'name', e.target.value)}
                  placeholder="Full Name *"
                  required
                  className="input input-sm"
                />
                <input
                  type="email"
                  value={traveler.email}
                  onChange={(e) => updateTraveler(index, 'email', e.target.value)}
                  placeholder="Email *"
                  required
                  className="input input-sm"
                />
                <input
                  type="tel"
                  value={traveler.phone}
                  onChange={(e) => updateTraveler(index, 'phone', e.target.value)}
                  placeholder="Phone"
                  className="input input-sm"
                />
                <input
                  type="text"
                  value={traveler.passportNumber}
                  onChange={(e) => updateTraveler(index, 'passportNumber', e.target.value)}
                  placeholder="Passport Number"
                  className="input input-sm"
                />
              </div>
            </div>
          ))}
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="input"
            placeholder="Additional booking notes..."
          />
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Booking'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Booking Details Modal Component
const BookingDetailsModal = ({ isOpen, onClose, booking }) => {
  const [activeTab, setActiveTab] = useState('details');
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Booking ${booking?.bookingNumber}`}
      size="xl"
    >
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-4">
          {['details', 'assignments', 'expenses'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 border-b-2 font-medium transition-colors capitalize ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      <div className="space-y-6 max-h-[70vh] overflow-y-auto">
        {/* Details Tab */}
        {activeTab === 'details' && (
          <>
            {/* Overview */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Customer</label>
                <div className="font-medium">{booking?.customer?.name}</div>
                <div className="text-sm text-gray-600">{booking?.customer?.email}</div>
              </div>
              <div>
                <label className="text-sm text-gray-500">Agent</label>
                <div className="font-medium">{booking?.agent?.name || 'N/A'}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-500">Destination</label>
                <div className="font-medium">{booking?.destination}</div>
              </div>
              <div>
                <label className="text-sm text-gray-500">Travelers</label>
                <div className="font-medium">{booking?.numberOfTravelers} person(s)</div>
              </div>
              <div>
                <label className="text-sm text-gray-500">Duration</label>
                <div className="font-medium">
                  {booking?.startDate?.split('T')[0]} to {booking?.endDate?.split('T')[0]}
                </div>
              </div>
            </div>

            {/* Payment Timeline */}
            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <FiDollarSign className="w-5 h-5" />
                Payment Details
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span className="font-bold">${booking?.totalAmount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Paid Amount:</span>
                  <span className="font-medium text-green-600">${booking?.paidAmount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span>Balance:</span>
                  <span className="font-bold text-red-600">
                    ${((booking?.totalAmount || 0) - (booking?.paidAmount || 0)).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Status:</span>
                  <span className={`badge ${
                    booking?.paymentStatus === 'paid' ? 'badge-success' :
                    booking?.paymentStatus === 'partial' ? 'badge-warning' : 'badge-danger'
                  }`}>
                    {booking?.paymentStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Travelers */}
            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <FiUsers className="w-5 h-5" />
                Travelers
              </h3>
              <div className="space-y-3">
                {booking?.travelers?.map((traveler, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium">{traveler.name}</div>
                    <div className="text-sm text-gray-600 grid grid-cols-2 gap-2 mt-1">
                      <div>Email: {traveler.email}</div>
                      <div>Phone: {traveler.phone || 'N/A'}</div>
                      {traveler.passportNumber && (
                        <div>Passport: {traveler.passportNumber}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline/History */}
            {booking?.statusHistory && booking.statusHistory.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <FiClock className="w-5 h-5" />
                  Status History
                </h3>
                <div className="space-y-2">
                  {booking.statusHistory.map((history, index) => (
                    <div key={index} className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <div className="flex-1">
                        <span className="font-medium">{history.status}</span>
                        {history.notes && <span className="text-gray-600"> - {history.notes}</span>}
                      </div>
                      <span className="text-gray-500">
                        {new Date(history.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {booking?.notes && (
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <FiFileText className="w-5 h-5" />
                  Notes
                </h3>
                <p className="text-gray-700">{booking.notes}</p>
              </div>
            )}
          </>
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && booking && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Task Assignments</h3>
              <AssignmentDropdown
                entityType="Booking"
                entityId={booking._id}
              />
            </div>
            <AssignmentList
              entityType="Booking"
              entityId={booking._id}
            />
          </div>
        )}

        {/* Expenses Tab */}
        {activeTab === 'expenses' && booking && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Expenses</h3>
              <ExpenseForm
                entityType="Booking"
                entityId={booking._id}
              />
            </div>
            <ExpenseList
              entityType="Booking"
              entityId={booking._id}
            />
          </div>
        )}

        <div className="flex justify-end pt-4 border-t">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default Bookings;
