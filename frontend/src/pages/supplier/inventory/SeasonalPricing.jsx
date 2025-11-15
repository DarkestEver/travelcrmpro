import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PlusIcon, 
  TrashIcon, 
  PencilIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import Modal from '../../../components/shared/Modal';
import { 
  getSeasonalPricing, 
  createSeasonalPricing, 
  updateSeasonalPricing, 
  deleteSeasonalPricing 
} from '../../../services/api/inventoryApi';
import { LoadingSpinner, ButtonLoader } from '../../../components/shared/LoadingStates';

const SeasonalPricing = ({ item, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    adjustmentType: 'percentage', // percentage or fixed
    adjustmentValue: 0,
    priority: 1,
    conditions: {
      minDays: null,
      maxDays: null,
      daysOfWeek: []
    }
  });
  const [errors, setErrors] = useState({});

  // Fetch pricing rules
  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['seasonalPricing', item?.id],
    queryFn: () => getSeasonalPricing(item.id),
    enabled: !!item
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data) => createSeasonalPricing(item.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['seasonalPricing', item?.id]);
      alert('Pricing rule created successfully!');
      resetForm();
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to create pricing rule');
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ ruleId, data }) => updateSeasonalPricing(item.id, ruleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['seasonalPricing', item?.id]);
      alert('Pricing rule updated successfully!');
      resetForm();
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to update pricing rule');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (ruleId) => deleteSeasonalPricing(item.id, ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries(['seasonalPricing', item?.id]);
      alert('Pricing rule deleted successfully!');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to delete pricing rule');
    }
  });

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Rule name is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    if (formData.adjustmentValue === 0) {
      newErrors.adjustmentValue = 'Adjustment value cannot be zero';
    }

    if (formData.adjustmentType === 'percentage' && Math.abs(formData.adjustmentValue) > 100) {
      newErrors.adjustmentValue = 'Percentage must be between -100 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (editingRule) {
      updateMutation.mutate({ ruleId: editingRule.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      startDate: new Date(rule.startDate).toISOString().split('T')[0],
      endDate: new Date(rule.endDate).toISOString().split('T')[0],
      adjustmentType: rule.adjustmentType,
      adjustmentValue: rule.adjustmentValue,
      priority: rule.priority,
      conditions: rule.conditions || {
        minDays: null,
        maxDays: null,
        daysOfWeek: []
      }
    });
    setShowForm(true);
  };

  const handleDelete = (ruleId) => {
    if (window.confirm('Are you sure you want to delete this pricing rule?')) {
      deleteMutation.mutate(ruleId);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      startDate: '',
      endDate: '',
      adjustmentType: 'percentage',
      adjustmentValue: 0,
      priority: 1,
      conditions: {
        minDays: null,
        maxDays: null,
        daysOfWeek: []
      }
    });
    setEditingRule(null);
    setShowForm(false);
    setErrors({});
  };

  const calculateAdjustedPrice = (rule) => {
    const basePrice = item.price || 0;
    if (rule.adjustmentType === 'percentage') {
      return basePrice + (basePrice * rule.adjustmentValue / 100);
    } else {
      return basePrice + rule.adjustmentValue;
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: item?.currency || 'USD'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Modal isOpen={true} onClose={onClose} title="Seasonal Pricing" size="xl">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Seasonal Pricing - ${item?.name}`}
      size="xl"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">
              Base Price: <span className="font-semibold text-gray-900">{formatCurrency(item?.price || 0)}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Create pricing rules for different seasons, holidays, or booking conditions
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="w-4 h-4" />
            Add Rule
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
            <h3 className="font-semibold text-blue-900">
              {editingRule ? 'Edit Pricing Rule' : 'New Pricing Rule'}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rule Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Summer Peak Season"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.startDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.endDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adjustment Type
                </label>
                <select
                  value={formData.adjustmentType}
                  onChange={(e) => setFormData(prev => ({ ...prev, adjustmentType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adjustment Value <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.adjustmentValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, adjustmentValue: parseFloat(e.target.value) || 0 }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.adjustmentValue ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={formData.adjustmentType === 'percentage' ? '+20 or -10' : '+50 or -25'}
                />
                {errors.adjustmentValue && <p className="mt-1 text-sm text-red-600">{errors.adjustmentValue}</p>}
                <p className="mt-1 text-xs text-gray-500">
                  Use positive for increase, negative for discount
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority (1-10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Higher priority rules are applied first
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-blue-200">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {(createMutation.isPending || updateMutation.isPending) ? (
                  <ButtonLoader />
                ) : (
                  editingRule ? 'Update Rule' : 'Create Rule'
                )}
              </button>
            </div>
          </form>
        )}

        {/* Rules List */}
        <div className="space-y-3">
          {rules.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No pricing rules defined yet</p>
              <p className="text-sm text-gray-400 mt-1">Create your first rule to get started</p>
            </div>
          ) : (
            rules
              .sort((a, b) => b.priority - a.priority)
              .map((rule) => {
                const adjustedPrice = calculateAdjustedPrice(rule);
                const priceDiff = adjustedPrice - item.price;
                const isIncrease = priceDiff > 0;

                return (
                  <div
                    key={rule.id}
                    className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-gray-900">{rule.name}</h4>
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                            Priority: {rule.priority}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                          <span>
                            {formatDate(rule.startDate)} - {formatDate(rule.endDate)}
                          </span>
                          <span className="h-1 w-1 bg-gray-300 rounded-full"></span>
                          <span>
                            {rule.adjustmentType === 'percentage' 
                              ? `${rule.adjustmentValue > 0 ? '+' : ''}${rule.adjustmentValue}%`
                              : `${rule.adjustmentValue > 0 ? '+' : ''}${formatCurrency(rule.adjustmentValue)}`
                            }
                          </span>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-sm text-gray-500">Adjusted Price:</span>
                          <span className="text-lg font-semibold text-gray-900">
                            {formatCurrency(adjustedPrice)}
                          </span>
                          <span className={`flex items-center gap-1 text-sm font-medium ${
                            isIncrease ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {isIncrease ? (
                              <ArrowUpIcon className="w-4 h-4" />
                            ) : (
                              <ArrowDownIcon className="w-4 h-4" />
                            )}
                            {formatCurrency(Math.abs(priceDiff))}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(rule)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(rule.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete"
                          disabled={deleteMutation.isPending}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SeasonalPricing;
