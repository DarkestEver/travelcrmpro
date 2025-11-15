import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Modal from '../../../components/shared/Modal';
import { createInventory, updateInventory } from '../../../services/api/inventoryApi';
import { ButtonLoader } from '../../../components/shared/LoadingStates';

const InventoryForm = ({ item, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    category: 'hotel',
    supplierId: '',
    quantity: 0,
    minQuantity: 0,
    maxQuantity: null,
    price: 0,
    discountPrice: null,
    currency: 'USD',
    unit: 'per night',
    status: 'available',
    location: '',
    images: [],
    amenities: [],
    inclusions: [],
    exclusions: [],
    cancellationPolicy: '',
    validFrom: '',
    validTo: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        sku: item.sku || '',
        description: item.description || '',
        category: item.category || 'hotel',
        supplierId: item.supplierId || '',
        quantity: item.quantity || 0,
        minQuantity: item.minQuantity || 0,
        maxQuantity: item.maxQuantity || null,
        price: item.price || 0,
        discountPrice: item.discountPrice || null,
        currency: item.currency || 'USD',
        unit: item.unit || 'per night',
        status: item.status || 'available',
        location: item.location || '',
        images: item.images || [],
        amenities: item.amenities || [],
        inclusions: item.inclusions || [],
        exclusions: item.exclusions || [],
        cancellationPolicy: item.cancellationPolicy || '',
        validFrom: item.validFrom ? new Date(item.validFrom).toISOString().split('T')[0] : '',
        validTo: item.validTo ? new Date(item.validTo).toISOString().split('T')[0] : ''
      });
    }
  }, [item]);

  const saveMutation = useMutation({
    mutationFn: (data) => item ? updateInventory(item.id, data) : createInventory(data),
    onSuccess: () => {
      alert(`Inventory item ${item ? 'updated' : 'created'} successfully!`);
      onSuccess();
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to save inventory item');
    }
  });

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Item name is required';
    }

    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU is required';
    }

    if (formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (formData.discountPrice && formData.discountPrice >= formData.price) {
      newErrors.discountPrice = 'Discount price must be less than regular price';
    }

    if (formData.quantity < 0) {
      newErrors.quantity = 'Quantity cannot be negative';
    }

    if (formData.validFrom && formData.validTo && new Date(formData.validFrom) > new Date(formData.validTo)) {
      newErrors.validTo = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    saveMutation.mutate(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleArrayChange = (field, value) => {
    const items = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData(prev => ({ ...prev, [field]: items }));
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={item ? 'Edit Inventory Item' : 'Add New Inventory Item'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., Deluxe Hotel Room"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => handleChange('sku', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.sku ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., HTL-DLX-001"
              />
              {errors.sku && <p className="mt-1 text-sm text-red-600">{errors.sku}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Detailed description of the item..."
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="hotel">Hotel</option>
                <option value="tour">Tour</option>
                <option value="transport">Transport</option>
                <option value="activity">Activity</option>
                <option value="package">Package</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
                <option value="on_request">On Request</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="City, Country"
              />
            </div>
          </div>
        </div>

        {/* Inventory Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Inventory Details</h3>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Available Quantity
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.quantity ? 'border-red-300' : 'border-gray-300'
                }`}
                min="0"
              />
              {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Quantity Alert
              </label>
              <input
                type="number"
                value={formData.minQuantity}
                onChange={(e) => handleChange('minQuantity', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Capacity
              </label>
              <input
                type="number"
                value={formData.maxQuantity || ''}
                onChange={(e) => handleChange('maxQuantity', parseInt(e.target.value) || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="0"
                placeholder="Unlimited"
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Pricing</h3>
          
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.price ? 'border-red-300' : 'border-gray-300'
                }`}
                min="0"
              />
              {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount Price
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.discountPrice || ''}
                onChange={(e) => handleChange('discountPrice', parseFloat(e.target.value) || null)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.discountPrice ? 'border-red-300' : 'border-gray-300'
                }`}
                min="0"
              />
              {errors.discountPrice && <p className="mt-1 text-sm text-red-600">{errors.discountPrice}</p>}
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
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="JPY">JPY</option>
                <option value="AUD">AUD</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <select
                value={formData.unit}
                onChange={(e) => handleChange('unit', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="per night">Per Night</option>
                <option value="per person">Per Person</option>
                <option value="per day">Per Day</option>
                <option value="per trip">Per Trip</option>
                <option value="per package">Per Package</option>
              </select>
            </div>
          </div>
        </div>

        {/* Validity Period */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Validity Period</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valid From
              </label>
              <input
                type="date"
                value={formData.validFrom}
                onChange={(e) => handleChange('validFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valid To
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
          </div>
        </div>

        {/* Additional Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Additional Details</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amenities (comma-separated)
            </label>
            <input
              type="text"
              value={formData.amenities.join(', ')}
              onChange={(e) => handleArrayChange('amenities', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="WiFi, Pool, Breakfast, Parking"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Inclusions (comma-separated)
            </label>
            <input
              type="text"
              value={formData.inclusions.join(', ')}
              onChange={(e) => handleArrayChange('inclusions', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Breakfast, Airport Transfer, Guide"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cancellation Policy
            </label>
            <textarea
              value={formData.cancellationPolicy}
              onChange={(e) => handleChange('cancellationPolicy', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Free cancellation up to 24 hours before..."
            />
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            disabled={saveMutation.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saveMutation.isPending ? <ButtonLoader /> : (item ? 'Update Item' : 'Create Item')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default InventoryForm;
