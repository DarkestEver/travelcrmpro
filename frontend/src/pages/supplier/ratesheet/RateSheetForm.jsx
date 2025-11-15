import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import Modal from '../../../components/shared/Modal';
import { createRateSheet, updateRateSheet } from '../../../services/api/rateSheetApi';
import { ButtonLoader } from '../../../components/shared/LoadingStates';
import RateLineItems from './RateLineItems';

const RateSheetForm = ({ rateSheet, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    supplierId: '',
    description: '',
    currency: 'USD',
    validFrom: '',
    validTo: '',
    terms: '',
    notes: '',
    status: 'draft',
    items: []
  });
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('basic'); // basic, items, terms

  useEffect(() => {
    if (rateSheet) {
      setFormData({
        name: rateSheet.name || '',
        supplierId: rateSheet.supplierId || '',
        description: rateSheet.description || '',
        currency: rateSheet.currency || 'USD',
        validFrom: rateSheet.validFrom ? new Date(rateSheet.validFrom).toISOString().split('T')[0] : '',
        validTo: rateSheet.validTo ? new Date(rateSheet.validTo).toISOString().split('T')[0] : '',
        terms: rateSheet.terms || '',
        notes: rateSheet.notes || '',
        status: rateSheet.status || 'draft',
        items: rateSheet.items || []
      });
    }
  }, [rateSheet]);

  const saveMutation = useMutation({
    mutationFn: (data) => rateSheet ? updateRateSheet(rateSheet.id, data) : createRateSheet(data),
    onSuccess: () => {
      alert(`Rate sheet ${rateSheet ? 'updated' : 'created'} successfully!`);
      onSuccess();
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to save rate sheet');
    }
  });

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Rate sheet name is required';
    }

    if (!formData.supplierId) {
      newErrors.supplierId = 'Supplier is required';
    }

    if (!formData.validFrom) {
      newErrors.validFrom = 'Start date is required';
    }

    if (!formData.validTo) {
      newErrors.validTo = 'End date is required';
    }

    if (formData.validFrom && formData.validTo && new Date(formData.validFrom) >= new Date(formData.validTo)) {
      newErrors.validTo = 'End date must be after start date';
    }

    if (formData.items.length === 0) {
      newErrors.items = 'At least one rate item is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (status) => {
    if (!validateForm()) {
      return;
    }

    const submitData = {
      ...formData,
      status: status || formData.status
    };

    saveMutation.mutate(submitData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleItemsChange = (items) => {
    setFormData(prev => ({ ...prev, items }));
    if (errors.items) {
      setErrors(prev => ({ ...prev, items: '' }));
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={rateSheet ? 'Edit Rate Sheet' : 'Create New Rate Sheet'}
      size="full"
    >
      <div className="space-y-6">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('basic')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'basic'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Basic Information
            </button>
            <button
              onClick={() => setActiveTab('items')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'items'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Rate Items ({formData.items.length})
            </button>
            <button
              onClick={() => setActiveTab('terms')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'terms'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Terms & Notes
            </button>
          </div>
        </div>

        {/* Basic Information Tab */}
        {activeTab === 'basic' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rate Sheet Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Summer 2024 Hotel Rates"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier <span className="text-red-600">*</span>
                </label>
                <select
                  value={formData.supplierId}
                  onChange={(e) => handleChange('supplierId', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.supplierId ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Supplier</option>
                  <option value="SUP001">Grand Hotels International</option>
                  <option value="SUP002">City Tours Ltd</option>
                  <option value="SUP003">Transport Services Co</option>
                  <option value="SUP004">Adventure Activities Inc</option>
                </select>
                {errors.supplierId && <p className="mt-1 text-sm text-red-600">{errors.supplierId}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="JPY">JPY - Japanese Yen</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valid From <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => handleChange('validFrom', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.validFrom ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.validFrom && <p className="mt-1 text-sm text-red-600">{errors.validFrom}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valid To <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  value={formData.validTo}
                  onChange={(e) => handleChange('validTo', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.validTo ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.validTo && <p className="mt-1 text-sm text-red-600">{errors.validTo}</p>}
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of this rate sheet..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Rate Items Tab */}
        {activeTab === 'items' && (
          <div>
            <RateLineItems
              items={formData.items}
              currency={formData.currency}
              onChange={handleItemsChange}
            />
            {errors.items && (
              <p className="mt-2 text-sm text-red-600">{errors.items}</p>
            )}
          </div>
        )}

        {/* Terms & Notes Tab */}
        {activeTab === 'terms' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Terms & Conditions
              </label>
              <textarea
                value={formData.terms}
                onChange={(e) => handleChange('terms', e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Payment terms, cancellation policy, and other conditions..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Internal Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Internal notes for your team (not visible to clients)..."
              />
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            disabled={saveMutation.isPending}
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleSubmit('draft')}
              disabled={saveMutation.isPending}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              {saveMutation.isPending ? <ButtonLoader /> : 'Save as Draft'}
            </button>
            <button
              type="button"
              onClick={() => handleSubmit('published')}
              disabled={saveMutation.isPending}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saveMutation.isPending ? <ButtonLoader /> : 'Save & Publish'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default RateSheetForm;
