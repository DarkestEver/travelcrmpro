import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  FiPlus, 
  FiEdit, 
  FiTrash2,
  FiMail,
  FiPhone,
  FiUser
} from 'react-icons/fi';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { customersAPI } from '../services/apiEndpoints';

const Customers = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Fetch customers
  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, search],
    queryFn: () => customersAPI.getAll({ page, limit: 10, search }),
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: (customerData) =>
      selectedCustomer
        ? customersAPI.update(selectedCustomer._id, customerData)
        : customersAPI.create(customerData),
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      toast.success(`Customer ${selectedCustomer ? 'updated' : 'created'} successfully`);
      setShowModal(false);
      setSelectedCustomer(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to save customer');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => customersAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      toast.success('Customer deleted successfully');
      setShowConfirm(false);
      setSelectedCustomer(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete customer');
    },
  });

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setShowModal(true);
  };

  const handleDelete = (customer) => {
    setSelectedCustomer(customer);
    setShowConfirm(true);
  };

  const columns = [
    {
      header: 'Name',
      accessor: 'name',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
            <FiUser className="w-4 h-4" />
          </div>
          <div>
            <div className="font-medium">{value}</div>
            <div className="text-xs text-gray-500">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Contact',
      accessor: 'phone',
      render: (value, row) => (
        <div className="text-sm">
          <div className="flex items-center gap-1">
            <FiPhone className="w-3 h-3" />
            {value || 'N/A'}
          </div>
          <div className="flex items-center gap-1 text-gray-500">
            <FiMail className="w-3 h-3" />
            {row.email}
          </div>
        </div>
      ),
    },
    {
      header: 'Country',
      accessor: 'country',
      render: (value) => value || 'N/A',
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (value) => (
        <span className={`badge ${
          value === 'active' ? 'badge-success' : 'badge-secondary'
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
            onClick={() => handleEdit(row)}
            className="text-blue-600 hover:text-blue-800"
            title="Edit"
          >
            <FiEdit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row)}
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
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">Manage your customers and their information</p>
        </div>
        <button
          onClick={() => {
            setSelectedCustomer(null);
            setShowModal(true);
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <FiPlus className="w-4 h-4" />
          Add Customer
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
        searchPlaceholder="Search customers..."
        showSearch={true}
      />

      {/* Create/Edit Modal */}
      {showModal && (
        <CustomerFormModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedCustomer(null);
          }}
          customer={selectedCustomer}
          onSubmit={(data) => saveMutation.mutate(data)}
          isLoading={saveMutation.isPending}
        />
      )}

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => deleteMutation.mutate(selectedCustomer._id)}
        title="Delete Customer"
        message={`Are you sure you want to delete ${selectedCustomer?.name}? This action cannot be undone.`}
        type="danger"
      />
    </div>
  );
};

// Customer Form Modal Component
const CustomerFormModal = ({ isOpen, onClose, customer, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    country: '',
    preferences: '',
    status: 'active',
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        country: customer.country || '',
        preferences: customer.preferences || '',
        status: customer.status || 'active',
      });
    }
  }, [customer]);

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
      title={customer ? 'Edit Customer' : 'Create New Customer'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="input"
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
            placeholder="john@example.com"
          />
        </div>

        <div>
          <label className="label">Phone</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="input"
            placeholder="+1 234 567 8900"
          />
        </div>

        <div>
          <label className="label">Country</label>
          <input
            type="text"
            name="country"
            value={formData.country}
            onChange={handleChange}
            className="input"
            placeholder="United States"
          />
        </div>

        <div>
          <label className="label">Address</label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows={3}
            className="input"
            placeholder="Enter full address"
          />
        </div>

        <div>
          <label className="label">Preferences</label>
          <textarea
            name="preferences"
            value={formData.preferences}
            onChange={handleChange}
            rows={2}
            className="input"
            placeholder="Travel preferences, dietary requirements, etc."
          />
        </div>

        <div>
          <label className="label">Status *</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
            className="input"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="flex gap-3 justify-end pt-4">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default Customers
