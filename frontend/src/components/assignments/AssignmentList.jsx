import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assignmentsAPI } from '../../services/apiEndpoints';
import toast from 'react-hot-toast';
import { FiUser, FiClock, FiAlertCircle, FiCheckCircle, FiRefreshCw, FiTrash2 } from 'react-icons/fi';
import { useState } from 'react';

export default function AssignmentList({ entityType, entityId }) {
  const [selectedStatus, setSelectedStatus] = useState('all');
  const queryClient = useQueryClient();

  // Fetch assignments for this entity
  const { data, isLoading, error } = useQuery({
    queryKey: ['assignments', entityType, entityId],
    queryFn: () => assignmentsAPI.getForEntity(entityType, entityId),
    enabled: !!entityType && !!entityId,
  });

  const assignments = data?.data?.assignments || [];

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }) => assignmentsAPI.updateStatus(id, status, notes),
    onSuccess: () => {
      toast.success('Assignment status updated');
      queryClient.invalidateQueries(['assignments']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  // Delete assignment mutation
  const deleteAssignmentMutation = useMutation({
    mutationFn: (id) => assignmentsAPI.delete(id),
    onSuccess: () => {
      toast.success('Assignment deleted');
      queryClient.invalidateQueries(['assignments']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete assignment');
    },
  });

  const handleStatusChange = (assignment, newStatus) => {
    const notes = newStatus === 'completed' ? 'Task completed' : undefined;
    updateStatusMutation.mutate({
      id: assignment._id,
      status: newStatus,
      notes,
    });
  };

  const handleDelete = (assignmentId) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      deleteAssignmentMutation.mutate(assignmentId);
    }
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

  const getStatusColor = (status) => {
    const colors = {
      assigned: 'text-blue-600 bg-blue-100',
      in_progress: 'text-yellow-600 bg-yellow-100',
      completed: 'text-green-600 bg-green-100',
      cancelled: 'text-gray-600 bg-gray-100',
    };
    return colors[status] || colors.assigned;
  };

  const formatDate = (date) => {
    if (!date) return 'No due date';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  // Filter assignments
  const filteredAssignments = assignments.filter((assignment) => {
    if (selectedStatus === 'all') return true;
    return assignment.status === selectedStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        Failed to load assignments
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FiUser className="mx-auto h-12 w-12 text-gray-400 mb-2" />
        <p>No assignments yet</p>
        <p className="text-sm">Assign tasks to team members to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium text-gray-700">Filter:</label>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Assignments</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <span className="text-sm text-gray-500">
          ({filteredAssignments.length} {filteredAssignments.length === 1 ? 'assignment' : 'assignments'})
        </span>
      </div>

      {/* Assignment Cards */}
      <div className="space-y-3">
        {filteredAssignments.map((assignment) => (
          <div
            key={assignment._id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Header */}
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(assignment.priority)}`}>
                    {assignment.priority}
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(assignment.status)}`}>
                    {assignment.status.replace('_', ' ')}
                  </span>
                  {assignment.dueDate && isOverdue(assignment.dueDate) && assignment.status !== 'completed' && (
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full text-red-600 bg-red-100">
                      Overdue
                    </span>
                  )}
                </div>

                {/* Assigned To */}
                <div className="flex items-center text-sm text-gray-700 mb-2">
                  <FiUser className="mr-2 h-4 w-4 text-gray-400" />
                  <span className="font-medium">{assignment.assignedTo?.name || 'Unknown User'}</span>
                  <span className="text-gray-500 ml-1">({assignment.assignedTo?.email})</span>
                </div>

                {/* Due Date */}
                {assignment.dueDate && (
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <FiClock className="mr-2 h-4 w-4 text-gray-400" />
                    <span>Due: {formatDate(assignment.dueDate)}</span>
                  </div>
                )}

                {/* Notes */}
                {assignment.notes && (
                  <div className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                    {assignment.notes}
                  </div>
                )}

                {/* Assigned By & Date */}
                <div className="text-xs text-gray-500 mt-2">
                  Assigned by {assignment.assignedBy?.name} on{' '}
                  {new Date(assignment.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* Actions */}
              <div className="ml-4 flex flex-col space-y-2">
                {assignment.status !== 'completed' && (
                  <>
                    {assignment.status === 'assigned' && (
                      <button
                        onClick={() => handleStatusChange(assignment, 'in_progress')}
                        disabled={updateStatusMutation.isPending}
                        className="inline-flex items-center px-3 py-1 text-xs font-medium rounded text-yellow-700 bg-yellow-100 hover:bg-yellow-200 disabled:opacity-50"
                        title="Start working"
                      >
                        <FiRefreshCw className="mr-1 h-3 w-3" />
                        Start
                      </button>
                    )}
                    {assignment.status === 'in_progress' && (
                      <button
                        onClick={() => handleStatusChange(assignment, 'completed')}
                        disabled={updateStatusMutation.isPending}
                        className="inline-flex items-center px-3 py-1 text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 disabled:opacity-50"
                        title="Mark as completed"
                      >
                        <FiCheckCircle className="mr-1 h-3 w-3" />
                        Complete
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={() => handleDelete(assignment._id)}
                  disabled={deleteAssignmentMutation.isPending}
                  className="inline-flex items-center px-3 py-1 text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 disabled:opacity-50"
                  title="Delete assignment"
                >
                  <FiTrash2 className="mr-1 h-3 w-3" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
