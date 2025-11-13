import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { assignmentsAPI } from '../../services/apiEndpoints';
import { agentsAPI } from '../../services/apiEndpoints';
import toast from 'react-hot-toast';
import { FiUser, FiClock, FiAlertCircle, FiPlus, FiX } from 'react-icons/fi';

export default function AssignmentDropdown({ entityType, entityId, onAssigned }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  const queryClient = useQueryClient();

  // Fetch agents/users for assignment
  const { data: agentsData, isLoading: agentsLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: () => agentsAPI.getAll({ status: 'active' }),
  });

  const agents = agentsData?.data?.agents || [];

  // Create assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: (data) => assignmentsAPI.create(data),
    onSuccess: () => {
      toast.success('Assignment created successfully');
      queryClient.invalidateQueries(['assignments']);
      queryClient.invalidateQueries(['assignments', entityType, entityId]);
      setIsOpen(false);
      resetForm();
      if (onAssigned) onAssigned();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create assignment');
    },
  });

  const resetForm = () => {
    setSelectedUser('');
    setPriority('medium');
    setDueDate('');
    setNotes('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedUser) {
      toast.error('Please select a user to assign');
      return;
    }

    createAssignmentMutation.mutate({
      entityType,
      entityId,
      assignedTo: selectedUser,
      assignedRole: 'agent', // You can make this dynamic if needed
      priority,
      dueDate: dueDate || undefined,
      notes,
    });
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-gray-600 bg-gray-100',
      medium: 'text-blue-600 bg-blue-100',
      high: 'text-orange-600 bg-orange-100',
      urgent: 'text-red-600 bg-red-100',
    };
    return colors[priority] || colors.medium;
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <FiPlus className="mr-2 h-4 w-4" />
        Assign Task
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={() => setIsOpen(false)}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Assign Task
                  </h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <FiX className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* User Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <FiUser className="inline mr-2" />
                      Assign To
                    </label>
                    <select
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    >
                      <option value="">Select user...</option>
                      {agentsLoading ? (
                        <option disabled>Loading users...</option>
                      ) : (
                        agents.map((agent) => (
                          <option key={agent._id} value={agent._id}>
                            {agent.name} ({agent.email})
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <FiAlertCircle className="inline mr-2" />
                      Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                    <div className="mt-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(priority)}`}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* Due Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <FiClock className="inline mr-2" />
                      Due Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Add any additional details..."
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                      type="submit"
                      disabled={createAssignmentMutation.isPending}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {createAssignmentMutation.isPending ? 'Creating...' : 'Create Assignment'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
