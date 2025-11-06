import { useState } from 'react';
import Modal from '../Modal';
import { FiX } from 'react-icons/fi';

const ComponentModal = ({ isOpen, onClose, component, onSave, dayLocation }) => {
  const [formData, setFormData] = useState(component || { type: 'activity' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateNestedField = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold text-gray-900">
            {component?._id ? 'Edit' : 'Add'} {formData.type === 'stay' ? 'Hotel' : formData.type === 'transfer' ? 'Transfer' : formData.type === 'meal' ? 'Meal' : formData.type === 'activity' ? 'Activity' : 'Note'}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Basic Fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => updateField('title', e.target.value)}
              className="input"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time
              </label>
              <input
                type="time"
                value={formData.startTime || ''}
                onChange={(e) => updateField('startTime', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time
              </label>
              <input
                type="time"
                value={formData.endTime || ''}
                onChange={(e) => updateField('endTime', e.target.value)}
                className="input"
              />
            </div>
          </div>

          {/* Type-specific fields */}
          {formData.type === 'stay' && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium text-gray-900">Hotel Details</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hotel Name
                </label>
                <input
                  type="text"
                  value={formData.accommodation?.hotelName || ''}
                  onChange={(e) => updateNestedField('accommodation', 'hotelName', e.target.value)}
                  className="input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.accommodation?.category || ''}
                    onChange={(e) => updateNestedField('accommodation', 'category', e.target.value)}
                    className="input"
                  >
                    <option value="">Select...</option>
                    <option value="budget">Budget</option>
                    <option value="3-star">3 Star</option>
                    <option value="4-star">4 Star</option>
                    <option value="5-star">5 Star</option>
                    <option value="luxury">Luxury</option>
                    <option value="boutique">Boutique</option>
                    <option value="resort">Resort</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Star Rating
                  </label>
                  <select
                    value={formData.accommodation?.starRating || ''}
                    onChange={(e) => updateNestedField('accommodation', 'starRating', parseInt(e.target.value))}
                    className="input"
                  >
                    <option value="">Select...</option>
                    <option value="1">1 Star</option>
                    <option value="2">2 Star</option>
                    <option value="3">3 Star</option>
                    <option value="4">4 Star</option>
                    <option value="5">5 Star</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {formData.type === 'activity' && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium text-gray-900">Activity Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.activity?.category || ''}
                    onChange={(e) => updateNestedField('activity', 'category', e.target.value)}
                    className="input"
                  >
                    <option value="">Select...</option>
                    <option value="sightseeing">Sightseeing</option>
                    <option value="adventure">Adventure</option>
                    <option value="cultural">Cultural</option>
                    <option value="historical">Historical</option>
                    <option value="leisure">Leisure</option>
                    <option value="shopping">Shopping</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty
                  </label>
                  <select
                    value={formData.activity?.difficulty || ''}
                    onChange={(e) => updateNestedField('activity', 'difficulty', e.target.value)}
                    className="input"
                  >
                    <option value="">Select...</option>
                    <option value="easy">Easy</option>
                    <option value="moderate">Moderate</option>
                    <option value="challenging">Challenging</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Cost */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium text-gray-900">Cost</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  value={formData.cost?.amount || ''}
                  onChange={(e) => updateNestedField('cost', 'amount', parseFloat(e.target.value))}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  value={formData.cost?.currency || 'INR'}
                  onChange={(e) => updateNestedField('cost', 'currency', e.target.value)}
                  className="input"
                >
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {component?._id ? 'Update' : 'Add'} Component
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ComponentModal;
