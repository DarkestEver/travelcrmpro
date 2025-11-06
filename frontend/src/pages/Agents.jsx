import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiCheckCircle, 
  FiXCircle,
  FiEye,
  FiRefreshCw
} from 'react-icons/fi';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { agentsAPI } from '../services/apiEndpoints';

const Agents = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [actionType, setActionType] = useState('');

  // Fetch agents
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['agents', page, search],
    queryFn: () => agentsAPI.getAll({ page, limit: 10, search }),
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: (agentData) =>
      selectedAgent
        ? agentsAPI.update(selectedAgent._id, agentData)
        : agentsAPI.create(agentData),
    onSuccess: () => {
      queryClient.invalidateQueries(['agents']);
      toast.success(`Agent ${selectedAgent ? 'updated' : 'created'} successfully`);
      setShowModal(false);
      setSelectedAgent(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to save agent');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => agentsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['agents']);
      toast.success('Agent deleted successfully');
      setShowConfirm(false);
      setSelectedAgent(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete agent');
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: ({ id, data }) => agentsAPI.approve(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['agents']);
      toast.success('Agent approved successfully');
      setShowModal(false);
      setSelectedAgent(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to approve agent');
    },
  });

  // Suspend mutation
  const suspendMutation = useMutation({
    mutationFn: (id) => agentsAPI.suspend(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['agents']);
      toast.success('Agent suspended successfully');
      setShowConfirm(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to suspend agent');
    },
  });

  // Reactivate mutation
  const reactivateMutation = useMutation({
    mutationFn: (id) => agentsAPI.reactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['agents']);
      toast.success('Agent reactivated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to reactivate agent');
    },
  });

  const handleAction = (agent, action) => {
    setSelectedAgent(agent);
    setActionType(action);

    if (action === 'delete' || action === 'suspend') {
      setShowConfirm(true);
    } else if (action === 'edit' || action === 'approve') {
      setShowModal(true);
    } else if (action === 'reactivate') {
      reactivateMutation.mutate(agent._id);
    }
  };

  const handleConfirm = () => {
    if (actionType === 'delete') {
      deleteMutation.mutate(selectedAgent._id);
    } else if (actionType === 'suspend') {
      suspendMutation.mutate(selectedAgent._id);
    }
  };

  const columns = [
    {
      header: 'Agency Name',
      accessor: 'agencyName',
      render: (value, row) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-xs text-gray-500">{row.user?.name}</div>
        </div>
      ),
    },
    {
      header: 'Contact',
      accessor: 'contactEmail',
      render: (value, row) => (
        <div className="text-sm">
          <div>{value}</div>
          <div className="text-gray-500">{row.contactPhone}</div>
        </div>
      ),
    },
    {
      header: 'Tier',
      accessor: 'tier',
      render: (value) => (
        <span className={`badge ${
          value === 'platinum' ? 'badge-info' :
          value === 'gold' ? 'badge-warning' :
          value === 'silver' ? 'badge-secondary' : 'badge-success'
        }`}>
          {value}
        </span>
      ),
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
      header: 'Credit Limit',
      accessor: 'creditLimit',
      render: (value) => `$${value?.toLocaleString() || 0}`,
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
          <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
          <p className="text-gray-600 mt-1">Manage travel agents and agencies</p>
        </div>
        <button
          onClick={() => {
            setSelectedAgent(null);
            setActionType('create');
            setShowModal(true);
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <FiPlus className="w-4 h-4" />
          Add Agent
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
        searchPlaceholder="Search agents..."
        showSearch={true}
      />

      {/* Create/Edit/Approve Modal */}
      {showModal && (
        <AgentFormModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedAgent(null);
          }}
          agent={selectedAgent}
          actionType={actionType}
          onSubmit={(data) => {
            if (actionType === 'approve') {
              approveMutation.mutate({ id: selectedAgent._id, data });
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
        title={`${actionType === 'delete' ? 'Delete' : 'Suspend'} Agent`}
        message={`Are you sure you want to ${actionType} ${selectedAgent?.agencyName}?`}
        type={actionType === 'delete' ? 'danger' : 'warning'}
      />
    </div>
  );
};

// Agent Form Modal Component
const AgentFormModal = ({ isOpen, onClose, agent, actionType, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    agencyName: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    creditLimit: 0,
    tier: 'bronze',
  });

  useEffect(() => {
    if (agent) {
      setFormData({
        agencyName: agent.agencyName || '',
        contactEmail: agent.contactEmail || '',
        contactPhone: agent.contactPhone || '',
        address: agent.address || '',
        creditLimit: agent.creditLimit || 0,
        tier: agent.tier || 'bronze',
      });
    }
  }, [agent]);

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
        actionType === 'approve' ? 'Approve Agent' :
        agent ? 'Edit Agent' : 'Create New Agent'
      }
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Agency Name *</label>
          <input
            type="text"
            name="agencyName"
            value={formData.agencyName}
            onChange={handleChange}
            required
            className="input"
            disabled={actionType === 'approve'}
          />
        </div>

        <div>
          <label className="label">Contact Email *</label>
          <input
            type="email"
            name="contactEmail"
            value={formData.contactEmail}
            onChange={handleChange}
            required
            className="input"
            disabled={actionType === 'approve'}
          />
        </div>

        <div>
          <label className="label">Contact Phone *</label>
          <input
            type="tel"
            name="contactPhone"
            value={formData.contactPhone}
            onChange={handleChange}
            required
            className="input"
            disabled={actionType === 'approve'}
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
            disabled={actionType === 'approve'}
          />
        </div>

        <div>
          <label className="label">Credit Limit *</label>
          <input
            type="number"
            name="creditLimit"
            value={formData.creditLimit}
            onChange={handleChange}
            required
            min="0"
            className="input"
          />
        </div>

        <div>
          <label className="label">Tier *</label>
          <select
            name="tier"
            value={formData.tier}
            onChange={handleChange}
            required
            className="input"
          >
            <option value="bronze">Bronze</option>
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
            <option value="platinum">Platinum</option>
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

export default Agents;
