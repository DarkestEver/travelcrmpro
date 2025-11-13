import React, { useState, useEffect } from 'react';
import { X, Save, Package, DollarSign, Calendar, MapPin, Users, Edit2 } from 'lucide-react';

export default function CustomizePackageModal({ isOpen, onClose, onSave, packageData, title = "Customize Package" }) {
  const [formData, setFormData] = useState({
    title: '',
    destination: '',
    duration: 0,
    price: 0,
    baseCost: 0,
    markup: 15,
    inclusions: [],
    exclusions: [],
    newInclusion: '',
    newExclusion: '',
    notes: '',
    travelers: 2
  });

  useEffect(() => {
    if (packageData) {
      setFormData({
        title: packageData.itineraryTitle || packageData.title || '',
        destination: packageData.destination || '',
        duration: packageData.duration || 0,
        price: packageData.price || 0,
        baseCost: packageData.price || 0,
        markup: 15,
        inclusions: packageData.inclusions || [],
        exclusions: packageData.exclusions || [],
        newInclusion: '',
        newExclusion: '',
        notes: '',
        travelers: packageData.travelers || 2
      });
    }
  }, [packageData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value) || 0;
    setFormData(prev => {
      const updated = { ...prev, [name]: numValue };
      
      // Auto-calculate final price if baseCost or markup changes
      if (name === 'baseCost' || name === 'markup') {
        updated.price = updated.baseCost + (updated.baseCost * updated.markup / 100);
      }
      
      return updated;
    });
  };

  const handleAddInclusion = () => {
    if (formData.newInclusion.trim()) {
      setFormData(prev => ({
        ...prev,
        inclusions: [...prev.inclusions, prev.newInclusion.trim()],
        newInclusion: ''
      }));
    }
  };

  const handleRemoveInclusion = (index) => {
    setFormData(prev => ({
      ...prev,
      inclusions: prev.inclusions.filter((_, i) => i !== index)
    }));
  };

  const handleAddExclusion = () => {
    if (formData.newExclusion.trim()) {
      setFormData(prev => ({
        ...prev,
        exclusions: [...prev.exclusions, prev.newExclusion.trim()],
        newExclusion: ''
      }));
    }
  };

  const handleRemoveExclusion = (index) => {
    setFormData(prev => ({
      ...prev,
      exclusions: prev.exclusions.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Build customized package data
    const customizedPackage = {
      ...packageData,
      title: formData.title,
      itineraryTitle: formData.title,
      destination: formData.destination,
      duration: formData.duration,
      price: formData.price,
      baseCost: formData.baseCost,
      markup: formData.markup,
      inclusions: formData.inclusions,
      exclusions: formData.exclusions,
      notes: formData.notes,
      travelers: formData.travelers,
      customized: true
    };
    
    onSave(customizedPackage);
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  const finalPrice = formData.baseCost + (formData.baseCost * formData.markup / 100);
  const markupAmount = formData.baseCost * formData.markup / 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Edit2 className="text-blue-600" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-600">Modify package details and pricing</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Package Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Package Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Romantic Paris Getaway"
            />
          </div>

          {/* Destination & Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline w-4 h-4 mr-1" />
                Destination <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Paris, France"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                Duration (Days) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleNumberChange}
                required
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="7"
              />
            </div>
          </div>

          {/* Travelers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="inline w-4 h-4 mr-1" />
              Number of Travelers
            </label>
            <input
              type="number"
              name="travelers"
              value={formData.travelers}
              onChange={handleNumberChange}
              min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Pricing Section */}
          <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              Pricing
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Cost (USD) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="baseCost"
                  value={formData.baseCost}
                  onChange={handleNumberChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="2000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Markup (%)
                </label>
                <input
                  type="number"
                  name="markup"
                  value={formData.markup}
                  onChange={handleNumberChange}
                  min="0"
                  max="100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="15"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Markup Amount: ${markupAmount.toFixed(2)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Final Price (USD)
                </label>
                <div className="w-full px-4 py-2 border border-green-300 bg-green-50 rounded-lg font-semibold text-green-700">
                  ${finalPrice.toFixed(2)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Auto-calculated
                </p>
              </div>
            </div>
          </div>

          {/* Inclusions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Inclusions
            </label>
            <div className="space-y-2">
              {formData.inclusions.map((inclusion, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded">
                  <span className="flex-1 text-sm text-gray-700">✓ {inclusion}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveInclusion(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.newInclusion}
                  onChange={(e) => setFormData(prev => ({ ...prev, newInclusion: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddInclusion())}
                  placeholder="Add new inclusion..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddInclusion}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Exclusions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exclusions
            </label>
            <div className="space-y-2">
              {formData.exclusions.map((exclusion, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded">
                  <span className="flex-1 text-sm text-gray-700">✗ {exclusion}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveExclusion(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.newExclusion}
                  onChange={(e) => setFormData(prev => ({ ...prev, newExclusion: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddExclusion())}
                  placeholder="Add new exclusion..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddExclusion}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Internal Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Add any internal notes or special instructions..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            <Package className="inline w-4 h-4 mr-1" />
            Review your changes before saving
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Save size={18} />
              Save & Use Package
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
