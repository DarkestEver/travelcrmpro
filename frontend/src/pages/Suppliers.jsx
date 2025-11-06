import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiCheckCircle, 
  FiXCircle,
  FiRefreshCw,
  FiStar
} from 'react-icons/fi';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { suppliersAPI } from '../services/apiEndpoints';

const Suppliers = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [actionType, setActionType] = useState('');

  // Fetch suppliers
  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', page, search],
    queryFn: () => suppliersAPI.getAll({ page, limit: 10, search }),
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: (supplierData) =>
      selectedSupplier
        ? suppliersAPI.update(selectedSupplier._id, supplierData)
        : suppliersAPI.create(supplierData),
    onSuccess: () => {
      queryClient.invalidateQueries(['suppliers']);
      toast.success(`Supplier ${selectedSupplier ? 'updated' : 'created'} successfully`);
      setShowModal(false);
      setSelectedSupplier(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to save supplier');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => suppliersAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['suppliers']);
      toast.success('Supplier deleted successfully');
      setShowConfirm(false);
      setSelectedSupplier(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete supplier');
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: ({ id, data }) => suppliersAPI.approve(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['suppliers']);
      toast.success('Supplier approved successfully');
      setShowModal(false);
      setSelectedSupplier(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to approve supplier');
    },
  });

  // Suspend mutation
  const suspendMutation = useMutation({
    mutationFn: (id) => suppliersAPI.suspend(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['suppliers']);
      toast.success('Supplier suspended successfully');
      setShowConfirm(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to suspend supplier');
    },
  });

  // Reactivate mutation
  const reactivateMutation = useMutation({
    mutationFn: (id) => suppliersAPI.reactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['suppliers']);
      toast.success('Supplier reactivated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to reactivate supplier');
    },
  });

  const handleAction = (supplier, action) => {
    setSelectedSupplier(supplier);
    setActionType(action);

    if (action === 'delete' || action === 'suspend') {
      setShowConfirm(true);
    } else if (action === 'edit' || action === 'approve') {
      setShowModal(true);
    } else if (action === 'reactivate') {
      reactivateMutation.mutate(supplier._id);
    }
  };

  const handleConfirm = () => {
    if (actionType === 'delete') {
      deleteMutation.mutate(selectedSupplier._id);
    } else if (actionType === 'suspend') {
      suspendMutation.mutate(selectedSupplier._id);
    }
  };

  const columns = [
    {
      header: 'Company',
      accessor: 'companyName',
      render: (value, row) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-xs text-gray-500">{row.contactPerson}</div>
        </div>
      ),
    },
    {
      header: 'Contact',
      accessor: 'email',
      render: (value, row) => (
        <div className="text-sm">
          <div>{value}</div>
          <div className="text-gray-500">{row.phone}</div>
        </div>
      ),
    },
    {
      header: 'Service Type',
      accessor: 'serviceType',
      render: (value) => (
        <span className="badge badge-info capitalize">
          {value}
        </span>
      ),
    },
    {
      header: 'Rating',
      accessor: 'rating',
      render: (value, row) => {
        const rating = typeof value === 'object' ? value?.average : value;
        const count = typeof value === 'object' ? value?.count : 0;
        return (
          <div className="flex items-center gap-1">
            <FiStar className="w-4 h-4 text-yellow-500 fill-current" />
            <span>{rating || 0}/5</span>
            {count > 0 && <span className="text-xs text-gray-500">({count})</span>}
          </div>
        );
      },
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (value) => (
        <span className={`badge ${
          value === 'active' ? 'badge-success' :
          value === 'pending' ? 'badge-warning' :
          value === 'suspended' ? 'badge-danger' : 'badge-secondary'
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
            onClick={() => handleAction(row, 'edit')}
            className="text-blue-600 hover:text-blue-800"
            title="Edit"
          >
            <FiEdit className="w-4 h-4" />
          </button>

          {row.status === 'pending' && (
            <button
              onClick={() => handleAction(row, 'approve')}
              className="text-green-600 hover:text-green-800"
              title="Approve"
            >
              <FiCheckCircle className="w-4 h-4" />
            </button>
          )}

          {row.status === 'active' && (
            <button
              onClick={() => handleAction(row, 'suspend')}
              className="text-yellow-600 hover:text-yellow-800"
              title="Suspend"
            >
              <FiXCircle className="w-4 h-4" />
            </button>
          )}

          {row.status === 'suspended' && (
            <button
              onClick={() => handleAction(row, 'reactivate')}
              className="text-blue-600 hover:text-blue-800"
              title="Reactivate"
            >
              <FiRefreshCw className="w-4 h-4" />
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-gray-600 mt-1">Manage travel suppliers and service providers</p>
        </div>
        <button
          onClick={() => {
            setSelectedSupplier(null);
            setActionType('create');
            setShowModal(true);
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <FiPlus className="w-4 h-4" />
          Add Supplier
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
        searchPlaceholder="Search suppliers..."
        showSearch={true}
      />

      {/* Create/Edit/Approve Modal */}
      {showModal && (
        <SupplierFormModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedSupplier(null);
          }}
          supplier={selectedSupplier}
          actionType={actionType}
          onSubmit={(data) => {
            if (actionType === 'approve') {
              approveMutation.mutate({ id: selectedSupplier._id, data });
            } else {
              saveMutation.mutate(data);
            }
          }}
          isLoading={saveMutation.isPending || approveMutation.isPending}
        />
      )}

      {/* Delete/Suspend Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
        title={`${actionType === 'delete' ? 'Delete' : 'Suspend'} Supplier`}
        message={`Are you sure you want to ${actionType} ${selectedSupplier?.companyName}?`}
        type={actionType === 'delete' ? 'danger' : 'warning'}
      />
    </div>
  );
};

// Supplier Form Modal Component
const SupplierFormModal = ({ isOpen, onClose, supplier, actionType, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    country: '',
    serviceType: 'hotel',
    rating: 0,
    commissionRate: 0,
    paymentTerms: 'immediate',
  });

  useEffect(() => {
    if (supplier) {
      // Handle rating - it might be an object {average, count} or a number
      const ratingValue = typeof supplier.rating === 'object' 
        ? supplier.rating?.average || 0 
        : supplier.rating || 0;
      
      setFormData({
        companyName: supplier.companyName || '',
        contactPerson: supplier.contactPerson || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        country: supplier.country || '',
        serviceType: supplier.serviceType || 'hotel',
        rating: ratingValue,
        commissionRate: supplier.commissionRate || 0,
        paymentTerms: supplier.paymentTerms || 'immediate',
      });
    }
  }, [supplier]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        actionType === 'approve' ? 'Approve Supplier' :
        supplier ? 'Edit Supplier' : 'Create New Supplier'
      }
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Company Name *</label>
          <input
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            required
            className="input"
            disabled={actionType === 'approve'}
            placeholder="ABC Travel Services"
          />
        </div>

        <div>
          <label className="label">Contact Person *</label>
          <input
            type="text"
            name="contactPerson"
            value={formData.contactPerson}
            onChange={handleChange}
            required
            className="input"
            disabled={actionType === 'approve'}
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="label">Email *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="input"
            disabled={actionType === 'approve'}
            placeholder="contact@supplier.com"
          />
        </div>

        <div>
          <label className="label">Phone *</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            className="input"
            disabled={actionType === 'approve'}
            placeholder="+1 234 567 8900"
          />
        </div>

        <div>
          <label className="label">Country *</label>
          <input
            type="text"
            name="country"
            value={formData.country}
            onChange={handleChange}
            required
            className="input"
            disabled={actionType === 'approve'}
            placeholder="United States"
          />
        </div>

        <div>
          <label className="label">Service Type *</label>
          <select
            name="serviceType"
            value={formData.serviceType}
            onChange={handleChange}
            required
            className="input"
            disabled={actionType === 'approve'}
          >
            <option value="hotel">Hotel</option>
            <option value="transport">Transport</option>
            <option value="activities">Activities</option>
            <option value="guide">Guide</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="label">Rating (0-5)</label>
          <input
            type="number"
            name="rating"
            value={formData.rating}
            onChange={handleChange}
            min="0"
            max="5"
            step="0.1"
            className="input"
          />
        </div>

        <div>
          <label className="label">Commission Rate (%) *</label>
          <input
            type="number"
            name="commissionRate"
            value={formData.commissionRate}
            onChange={handleChange}
            required
            min="0"
            max="100"
            step="0.1"
            className="input"
          />
        </div>

        <div>
          <label className="label">Payment Terms *</label>
          <select
            name="paymentTerms"
            value={formData.paymentTerms}
            onChange={handleChange}
            required
            className="input"
          >
            <option value="immediate">Immediate</option>
            <option value="7days">7 Days</option>
            <option value="15days">15 Days</option>
            <option value="30days">30 Days</option>
          </select>
        </div>

        <div className="flex gap-3 justify-end pt-4">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? 'Saving...' : actionType === 'approve' ? 'Approve' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default Suppliers
