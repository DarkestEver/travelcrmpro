import { useState } from 'react';
import { X, DollarSign, AlertCircle, Bell } from 'lucide-react';
import { adjustmentAPI } from '../../services/adjustmentAPI';
import toast from 'react-hot-toast';

const ADJUSTMENT_TYPES = [
  { value: 'extra_charge', label: 'Extra Charge' },
  { value: 'penalty', label: 'Penalty' },
  { value: 'discount', label: 'Discount' },
  { value: 'loss', label: 'Loss' },
  { value: 'compensation', label: 'Compensation' },
];

const CATEGORIES = {
  extra_charge: [
    { value: 'baggage_fee', label: 'Baggage Fee' },
    { value: 'service_charge', label: 'Service Charge' },
    { value: 'change_fee', label: 'Change Fee' },
  ],
  penalty: [
    { value: 'late_cancellation', label: 'Late Cancellation' },
    { value: 'no_show', label: 'No Show' },
  ],
  discount: [
    { value: 'loyalty_discount', label: 'Loyalty Discount' },
    { value: 'promotional', label: 'Promotional Discount' },
  ],
  loss: [
    { value: 'bad_debt', label: 'Bad Debt' },
    { value: 'write_off', label: 'Write Off' },
  ],
  compensation: [
    { value: 'service_failure', label: 'Service Failure' },
    { value: 'delay_compensation', label: 'Delay Compensation' },
  ],
};

const DEFAULT_TAX_RATE = 10;

export default function AddAdjustmentDialog({ open, onClose, bookingId, onSuccess }) {
  const [formData, setFormData] = useState({
    adjustmentType: 'extra_charge',
    category: '',
    amount: '',
    description: '',
    reason: '',
    isTaxable: true,
    notifyCustomer: true,
    approvalThreshold: 500,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      if (!formData.category || !formData.amount || !formData.description || !formData.reason) {
        toast.error('Please fill all required fields');
        return;
      }

      const getImpactType = () => {
        return ['discount', 'compensation'].includes(formData.adjustmentType) ? 'credit' : 'debit';
      };

      const adjustmentData = {
        bookingId,
        adjustmentType: formData.adjustmentType,
        category: formData.category,
        amount: parseFloat(formData.amount),
        impactType: getImpactType(),
        description: formData.description,
        reason: formData.reason,
        isTaxable: formData.isTaxable,
        taxRate: formData.isTaxable ? DEFAULT_TAX_RATE : 0,
        approvalThreshold: parseFloat(formData.approvalThreshold),
        notifyCustomer: formData.notifyCustomer,
      };

      await adjustmentAPI.createAdjustment(adjustmentData);
      
      toast.success('Adjustment created successfully');
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Create adjustment error:', err);
      toast.error(err.response?.data?.message || 'Error creating adjustment');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const taxAmount = (parseFloat(formData.amount) || 0) * (formData.isTaxable ? DEFAULT_TAX_RATE / 100 : 0);
  const totalAmount = (parseFloat(formData.amount) || 0) + taxAmount;
  const categories = CATEGORIES[formData.adjustmentType] || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>

        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">Add Adjustment to Booking</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Adjustment Type *</label>
                <select
                  value={formData.adjustmentType}
                  onChange={(e) => setFormData(prev => ({ ...prev, adjustmentType: e.target.value, category: '' }))}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  {ADJUSTMENT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="bg-gray-50 p-3 rounded-md">
                <label className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={formData.isTaxable}
                    onChange={(e) => setFormData(prev => ({ ...prev, isTaxable: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm">Taxable</span>
                </label>
                {formData.isTaxable && (
                  <p className="text-xs text-gray-600">Tax ({DEFAULT_TAX_RATE}%): ${taxAmount.toFixed(2)}</p>
                )}
                <p className="text-sm font-semibold mt-1">Total: ${totalAmount.toFixed(2)}</p>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Reason *</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.notifyCustomer}
                    onChange={(e) => setFormData(prev => ({ ...prev, notifyCustomer: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm">Notify Customer</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm text-gray-700 border rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Add Adjustment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
