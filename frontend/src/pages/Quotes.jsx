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
  FiRepeat,
  FiShare2
} from 'react-icons/fi';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import ShareModal from '../components/ShareModal';
import { quotesAPI } from '../services/apiEndpoints';

const Quotes = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [actionType, setActionType] = useState('');

  // Fetch quotes
  const { data, isLoading } = useQuery({
    queryKey: ['quotes', page, search],
    queryFn: () => quotesAPI.getAll({ page, limit: 10, search }),
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: (quoteData) =>
      selectedQuote
        ? quotesAPI.update(selectedQuote._id, quoteData)
        : quotesAPI.create(quoteData),
    onSuccess: () => {
      queryClient.invalidateQueries(['quotes']);
      toast.success(`Quote ${selectedQuote ? 'updated' : 'created'} successfully`);
      setShowModal(false);
      setSelectedQuote(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to save quote');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => quotesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['quotes']);
      toast.success('Quote deleted successfully');
      setShowConfirm(false);
      setSelectedQuote(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete quote');
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (id) => quotesAPI.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['quotes']);
      toast.success('Quote approved successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to approve quote');
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: (id) => quotesAPI.reject(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['quotes']);
      toast.success('Quote rejected successfully');
      setShowConfirm(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to reject quote');
    },
  });

  // Convert to booking mutation
  const convertMutation = useMutation({
    mutationFn: (id) => quotesAPI.convert(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['quotes']);
      toast.success('Quote converted to booking successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to convert quote');
    },
  });

  const handleAction = (quote, action) => {
    setSelectedQuote(quote);
    setActionType(action);

    if (action === 'delete' || action === 'reject') {
      setShowConfirm(true);
    } else if (action === 'edit') {
      setShowModal(true);
    } else if (action === 'preview') {
      setShowPreview(true);
    } else if (action === 'share') {
      setShowShareModal(true);
    } else if (action === 'approve') {
      approveMutation.mutate(quote._id);
    } else if (action === 'convert') {
      convertMutation.mutate(quote._id);
    }
  };

  const handleConfirm = () => {
    if (actionType === 'delete') {
      deleteMutation.mutate(selectedQuote._id);
    } else if (actionType === 'reject') {
      rejectMutation.mutate(selectedQuote._id);
    }
  };

  const columns = [
    {
      header: 'Quote ID',
      accessor: 'quoteNumber',
      render: (value) => (
        <span className="font-mono text-sm font-medium">{value}</span>
      ),
    },
    {
      header: 'Customer',
      accessor: 'customer',
      render: (value) => value?.name || 'N/A',
    },
    {
      header: 'Destination',
      accessor: 'destination',
    },
    {
      header: 'Amount',
      accessor: 'totalAmount',
      render: (value, row) => (
        <div>
          <div className="font-medium">${value?.toFixed(2)}</div>
          {row.discount > 0 && (
            <div className="text-xs text-green-600">
              -{row.discount}% discount
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (value) => (
        <span className={`badge ${
          value === 'approved' ? 'badge-success' :
          value === 'pending' ? 'badge-warning' :
          value === 'rejected' ? 'badge-danger' :
          value === 'converted' ? 'badge-info' : 'badge-secondary'
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
            onClick={() => handleAction(row, 'preview')}
            className="text-green-600 hover:text-green-800"
            title="Preview"
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
            <>
              <button
                onClick={() => handleAction(row, 'approve')}
                className="text-green-600 hover:text-green-800"
                title="Approve"
              >
                <FiCheckCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleAction(row, 'reject')}
                className="text-red-600 hover:text-red-800"
                title="Reject"
              >
                <FiXCircle className="w-4 h-4" />
              </button>
            </>
          )}

          {row.status === 'approved' && (
            <button
              onClick={() => handleAction(row, 'convert')}
              className="text-purple-600 hover:text-purple-800"
              title="Convert to Booking"
            >
              <FiRepeat className="w-4 h-4" />
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
    <div className="h-screen overflow-y-auto">
      <div className="space-y-6 p-6 pb-24">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quotes</h1>
            <p className="text-gray-600 mt-1">Create and manage travel quotes</p>
          </div>
        <button
          onClick={() => {
            setSelectedQuote(null);
            setShowModal(true);
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <FiPlus className="w-4 h-4" />
          Create Quote
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
        searchPlaceholder="Search quotes..."
        showSearch={true}
      />

      {/* Create/Edit Modal */}
      {showModal && (
        <QuoteFormModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedQuote(null);
          }}
          quote={selectedQuote}
          onSubmit={saveMutation.mutate}
          isLoading={saveMutation.isPending}
        />
      )}

      {/* Preview Modal */}
      {showPreview && (
        <QuotePreviewModal
          isOpen={showPreview}
          onClose={() => {
            setShowPreview(false);
            setSelectedQuote(null);
          }}
          quote={selectedQuote}
        />
      )}

      {/* Delete/Reject Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
        title={`${actionType === 'delete' ? 'Delete' : 'Reject'} Quote`}
        message={`Are you sure you want to ${actionType} quote ${selectedQuote?.quoteNumber}?`}
        type="danger"
      />

      {/* Share Modal */}
      {showShareModal && selectedQuote && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setSelectedQuote(null);
          }}
          entity={selectedQuote}
          entityType="quote"
        />
      )}
      </div>
    </div>
  );
};

// Quote Form Modal Component
const QuoteFormModal = ({ isOpen, onClose, quote, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    destination: quote?.destination || '',
    numberOfTravelers: quote?.numberOfTravelers || 1,
    startDate: quote?.startDate?.split('T')[0] || '',
    endDate: quote?.endDate?.split('T')[0] || '',
    items: quote?.items || [
      { type: 'flight', description: '', amount: 0 }
    ],
    discount: quote?.discount || 0,
    notes: quote?.notes || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { type: 'other', description: '', amount: 0 }]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const updateItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const calculateTotal = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    const discountAmount = (subtotal * parseFloat(formData.discount || 0)) / 100;
    return subtotal - discountAmount;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={quote ? 'Edit Quote' : 'Create New Quote'}
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
              placeholder="Bali, Indonesia"
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

        {/* Items/Line Items */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-gray-900">Pricing Breakdown</h3>
            <button
              type="button"
              onClick={addItem}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <FiPlus className="w-3 h-3" />
              Add Item
            </button>
          </div>

          <div className="space-y-2">
            {formData.items.map((item, index) => (
              <div key={index} className="flex gap-2 bg-gray-50 p-2 rounded">
                <select
                  value={item.type}
                  onChange={(e) => updateItem(index, 'type', e.target.value)}
                  className="input input-sm w-32"
                >
                  <option value="flight">Flight</option>
                  <option value="hotel">Hotel</option>
                  <option value="transport">Transport</option>
                  <option value="activities">Activities</option>
                  <option value="meals">Meals</option>
                  <option value="other">Other</option>
                </select>
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                  placeholder="Description"
                  className="input input-sm flex-1"
                />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={item.amount}
                    onChange={(e) => updateItem(index, 'amount', e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="input input-sm w-32 pl-7"
                  />
                </div>
                {formData.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Total Calculation */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span className="font-medium">
                ${formData.items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span>Discount:</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="discount"
                  value={formData.discount}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="0.1"
                  className="input input-sm w-20 text-right"
                />
                <span>%</span>
              </div>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>${calculateTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="input"
            placeholder="Additional notes or terms..."
          />
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Quote'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Quote Preview Modal Component
const QuotePreviewModal = ({ isOpen, onClose, quote }) => {
  const subtotal = quote?.items?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
  const discountAmount = (subtotal * (quote?.discount || 0)) / 100;
  const total = subtotal - discountAmount;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Quote ${quote?.quoteNumber}`}
      size="md"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-500">Customer</label>
            <div className="font-medium">{quote?.customer?.name}</div>
          </div>
          <div>
            <label className="text-sm text-gray-500">Destination</label>
            <div className="font-medium">{quote?.destination}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-500">Travelers</label>
            <div className="font-medium">{quote?.numberOfTravelers} person(s)</div>
          </div>
          <div>
            <label className="text-sm text-gray-500">Duration</label>
            <div className="font-medium">
              {quote?.startDate?.split('T')[0]} to {quote?.endDate?.split('T')[0]}
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-medium text-gray-900 mb-3">Pricing Breakdown</h3>
          <div className="space-y-2">
            {quote?.items?.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <div>
                  <span className="badge badge-info text-xs mr-2">{item.type}</span>
                  <span>{item.description}</span>
                </div>
                <span className="font-medium">${item.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            {quote?.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount ({quote.discount}%):</span>
                <span className="font-medium">-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {quote?.notes && (
          <div className="border-t pt-4">
            <label className="text-sm text-gray-500">Notes</label>
            <p className="text-gray-700 mt-1">{quote.notes}</p>
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

export default Quotes;
