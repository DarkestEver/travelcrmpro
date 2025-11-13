import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expensesAPI } from '../../services/apiEndpoints';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';
import {
  FiDollarSign,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiAlertCircle,
  FiTrash2,
  FiEdit,
} from 'react-icons/fi';
import { useState } from 'react';

export default function ExpenseList({ entityType, entityId }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = ['super_admin', 'operator'].includes(user?.role);

  // Fetch expenses for this entity
  const { data, isLoading, error } = useQuery({
    queryKey: ['expenses', entityType, entityId],
    queryFn: () => expensesAPI.getForEntity(entityType, entityId),
    enabled: !!entityType && !!entityId,
  });

  const expenses = data?.data?.expenses || [];
  const totals = data?.data?.totals || {};
  const categoryBreakdown = data?.data?.categoryBreakdown || [];

  // Mark as paid mutation
  const markAsPaidMutation = useMutation({
    mutationFn: ({ id, amount, paymentMethod }) =>
      expensesAPI.markAsPaid(id, amount, paymentMethod, null, 'Payment completed'),
    onSuccess: () => {
      toast.success('Expense marked as paid');
      queryClient.invalidateQueries(['expenses']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to mark as paid');
    },
  });

  // Approve expense mutation
  const approveMutation = useMutation({
    mutationFn: ({ id, notes }) => expensesAPI.approve(id, notes),
    onSuccess: () => {
      toast.success('Expense approved');
      queryClient.invalidateQueries(['expenses']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to approve expense');
    },
  });

  // Reject expense mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => expensesAPI.reject(id, reason),
    onSuccess: () => {
      toast.success('Expense rejected');
      queryClient.invalidateQueries(['expenses']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to reject expense');
    },
  });

  // Delete expense mutation
  const deleteExpenseMutation = useMutation({
    mutationFn: (id) => expensesAPI.delete(id),
    onSuccess: () => {
      toast.success('Expense deleted');
      queryClient.invalidateQueries(['expenses']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete expense');
    },
  });

  const handleMarkAsPaid = (expense) => {
    const paymentMethod = prompt('Payment Method (e.g., bank_transfer, cash, card):');
    if (paymentMethod) {
      markAsPaidMutation.mutate({
        id: expense._id,
        amount: expense.amount,
        paymentMethod,
      });
    }
  };

  const handleApprove = (expense) => {
    const notes = prompt('Approval notes (optional):');
    approveMutation.mutate({
      id: expense._id,
      notes: notes || 'Approved',
    });
  };

  const handleReject = (expense) => {
    const reason = prompt('Rejection reason (required):');
    if (reason) {
      rejectMutation.mutate({
        id: expense._id,
        reason,
      });
    }
  };

  const handleDelete = (expenseId) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      deleteExpenseMutation.mutate(expenseId);
    }
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: 'text-yellow-600 bg-yellow-100',
      paid: 'text-green-600 bg-green-100',
      partially_paid: 'text-blue-600 bg-blue-100',
      overdue: 'text-red-600 bg-red-100',
      refunded: 'text-gray-600 bg-gray-100',
    };
    return colors[status] || colors.pending;
  };

  const getApprovalStatusColor = (status) => {
    const colors = {
      pending_approval: 'text-yellow-600 bg-yellow-100',
      approved: 'text-green-600 bg-green-100',
      rejected: 'text-red-600 bg-red-100',
      not_required: 'text-gray-600 bg-gray-100',
    };
    return colors[status] || colors.pending_approval;
  };

  const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Filter expenses
  const filteredExpenses = expenses.filter((expense) => {
    if (selectedCategory === 'all') return true;
    return expense.category === selectedCategory;
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
        Failed to load expenses
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {totals && totals.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Total Expenses</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(totals[0]?.totalAmount || 0)}
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm text-green-600 mb-1">Paid</div>
            <div className="text-2xl font-bold text-green-700">
              {formatCurrency(totals[0]?.totalPaid || 0)}
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-sm text-yellow-600 mb-1">Pending</div>
            <div className="text-2xl font-bold text-yellow-700">
              {formatCurrency(totals[0]?.totalPending || 0)}
            </div>
          </div>
        </div>
      )}

      {expenses.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FiDollarSign className="mx-auto h-12 w-12 text-gray-400 mb-2" />
          <p>No expenses yet</p>
          <p className="text-sm">Add expenses to track costs for this {entityType.toLowerCase()}</p>
        </div>
      ) : (
        <>
          {/* Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Categories</option>
              <option value="flights">Flights</option>
              <option value="hotels">Hotels</option>
              <option value="transport">Transport</option>
              <option value="activities">Activities</option>
              <option value="meals">Meals</option>
              <option value="guides">Guides</option>
              <option value="permits">Permits</option>
              <option value="insurance">Insurance</option>
              <option value="visa">Visa</option>
              <option value="tips">Tips</option>
              <option value="miscellaneous">Miscellaneous</option>
              <option value="other">Other</option>
            </select>
            <span className="text-sm text-gray-500">
              ({filteredExpenses.length} {filteredExpenses.length === 1 ? 'expense' : 'expenses'})
            </span>
          </div>

          {/* Expense Cards */}
          <div className="space-y-3">
            {filteredExpenses.map((expense) => (
              <div
                key={expense._id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {expense.category}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(expense.paymentStatus)}`}>
                        {expense.paymentStatus.replace('_', ' ')}
                      </span>
                      {expense.approvalStatus && expense.approvalStatus !== 'not_required' && (
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getApprovalStatusColor(expense.approvalStatus)}`}>
                          {expense.approvalStatus.replace('_', ' ')}
                        </span>
                      )}
                    </div>

                    {/* Description & Amount */}
                    <div className="mb-2">
                      <div className="text-lg font-semibold text-gray-900">
                        {formatCurrency(expense.amount, expense.currency)}
                      </div>
                      <div className="text-sm text-gray-600">{expense.description}</div>
                    </div>

                    {/* Supplier */}
                    {expense.supplierName && (
                      <div className="text-sm text-gray-600 mb-1">
                        Supplier: <span className="font-medium">{expense.supplierName}</span>
                      </div>
                    )}

                    {/* Due Date */}
                    {expense.dueDate && (
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <FiClock className="mr-2 h-4 w-4 text-gray-400" />
                        Due: {formatDate(expense.dueDate)}
                      </div>
                    )}

                    {/* Expense Number */}
                    <div className="text-xs text-gray-500 mt-2">
                      {expense.expenseNumber} • Added {formatDate(expense.createdAt)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="ml-4 flex flex-col space-y-2">
                    {expense.paymentStatus === 'pending' && (
                      <button
                        onClick={() => handleMarkAsPaid(expense)}
                        disabled={markAsPaidMutation.isPending}
                        className="inline-flex items-center px-3 py-1 text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 disabled:opacity-50"
                        title="Mark as paid"
                      >
                        <FiCheckCircle className="mr-1 h-3 w-3" />
                        Mark Paid
                      </button>
                    )}

                    {isAdmin && expense.approvalStatus === 'pending_approval' && (
                      <>
                        <button
                          onClick={() => handleApprove(expense)}
                          disabled={approveMutation.isPending}
                          className="inline-flex items-center px-3 py-1 text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 disabled:opacity-50"
                          title="Approve expense"
                        >
                          <FiCheckCircle className="mr-1 h-3 w-3" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(expense)}
                          disabled={rejectMutation.isPending}
                          className="inline-flex items-center px-3 py-1 text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 disabled:opacity-50"
                          title="Reject expense"
                        >
                          <FiXCircle className="mr-1 h-3 w-3" />
                          Reject
                        </button>
                      </>
                    )}

                    {(isAdmin || expense.paymentStatus !== 'paid') && (
                      <button
                        onClick={() => handleDelete(expense._id)}
                        disabled={deleteExpenseMutation.isPending}
                        className="inline-flex items-center px-3 py-1 text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 disabled:opacity-50"
                        title="Delete expense"
                      >
                        <FiTrash2 className="mr-1 h-3 w-3" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
