import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { expensesAPI } from '../../services/apiEndpoints';
import toast from 'react-hot-toast';
import { FiDollarSign, FiFileText, FiCalendar, FiTag, FiX } from 'react-icons/fi';

const EXPENSE_CATEGORIES = [
  { value: 'flights', label: 'Flights' },
  { value: 'hotels', label: 'Hotels' },
  { value: 'transport', label: 'Transport' },
  { value: 'activities', label: 'Activities' },
  { value: 'meals', label: 'Meals' },
  { value: 'guides', label: 'Guides' },
  { value: 'permits', label: 'Permits' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'visa', label: 'Visa' },
  { value: 'tips', label: 'Tips' },
  { value: 'miscellaneous', label: 'Miscellaneous' },
  { value: 'other', label: 'Other' },
];

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'AUD', 'CAD'];

export default function ExpenseForm({ entityType, entityId, onSuccess }) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: 'flights',
    description: '',
    amount: '',
    currency: 'INR',
    supplierName: '',
    supplierEmail: '',
    supplierPhone: '',
    dueDate: '',
    invoiceNumber: '',
    notes: '',
  });

  const queryClient = useQueryClient();

  // Create expense mutation
  const createExpenseMutation = useMutation({
    mutationFn: (data) => expensesAPI.create(data),
    onSuccess: () => {
      toast.success('Expense created successfully');
      queryClient.invalidateQueries(['expenses']);
      queryClient.invalidateQueries(['expenses', entityType, entityId]);
      setIsOpen(false);
      resetForm();
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create expense');
    },
  });

  const resetForm = () => {
    setFormData({
      category: 'flights',
      description: '',
      amount: '',
      currency: 'INR',
      supplierName: '',
      supplierEmail: '',
      supplierPhone: '',
      dueDate: '',
      invoiceNumber: '',
      notes: '',
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.amount || formData.amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    createExpenseMutation.mutate({
      entityType,
      entityId,
      ...formData,
      amount: parseFloat(formData.amount),
    });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <FiDollarSign className="mr-2 h-4 w-4" />
        Add Expense
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
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Add Expense
                  </h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <FiX className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <FiTag className="inline mr-2" />
                        Category
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      >
                        {EXPENSE_CATEGORIES.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Amount */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <FiDollarSign className="inline mr-2" />
                        Amount
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          name="amount"
                          value={formData.amount}
                          onChange={handleChange}
                          min="0"
                          step="0.01"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="0.00"
                          required
                        />
                        <select
                          name="currency"
                          value={formData.currency}
                          onChange={handleChange}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {CURRENCIES.map((curr) => (
                            <option key={curr} value={curr}>
                              {curr}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <FiFileText className="inline mr-2" />
                      Description
                    </label>
                    <input
                      type="text"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="E.g., Delhi to Paris flight tickets"
                      required
                    />
                  </div>

                  {/* Supplier Information */}
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Supplier Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Supplier Name
                        </label>
                        <input
                          type="text"
                          name="supplierName"
                          value={formData.supplierName}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="E.g., Air India"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Supplier Email
                        </label>
                        <input
                          type="email"
                          name="supplierEmail"
                          value={formData.supplierEmail}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="supplier@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Supplier Phone
                        </label>
                        <input
                          type="tel"
                          name="supplierPhone"
                          value={formData.supplierPhone}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="+91 1234567890"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <FiCalendar className="inline mr-2" />
                          Due Date
                        </label>
                        <input
                          type="date"
                          name="dueDate"
                          value={formData.dueDate}
                          onChange={handleChange}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Invoice Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Invoice Number (Optional)
                    </label>
                    <input
                      type="text"
                      name="invoiceNumber"
                      value={formData.invoiceNumber}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="INV-2025-001"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (Optional)
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Additional notes..."
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                      type="submit"
                      disabled={createExpenseMutation.isPending}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {createExpenseMutation.isPending ? 'Creating...' : 'Create Expense'}
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
