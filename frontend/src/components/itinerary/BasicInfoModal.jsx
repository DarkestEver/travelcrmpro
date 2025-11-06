import { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import Modal from '../Modal';
import LocationInput from '../LocationInput';

const BasicInfoModal = ({ isOpen, onClose, itinerary, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    overview: '',
    destination: {
      country: '',
      state: '',
      city: ''
    },
    duration: {
      days: 1,
      nights: 0
    },
    startDate: '',
    endDate: '',
    highlights: [],
    inclusions: [],
    exclusions: [],
    travelStyle: '',
    themes: [],
    difficulty: '',
    minGroupSize: 1,
    maxGroupSize: 10,
    tags: []
  });

  const [newHighlight, setNewHighlight] = useState('');
  const [newInclusion, setNewInclusion] = useState('');
  const [newExclusion, setNewExclusion] = useState('');
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (itinerary) {
      setFormData({
        title: itinerary.title || '',
        description: itinerary.description || '',
        overview: itinerary.overview || '',
        destination: {
          country: itinerary.destination?.country || '',
          state: itinerary.destination?.state || '',
          city: itinerary.destination?.city || ''
        },
        duration: {
          days: itinerary.duration?.days || itinerary.days?.length || 1,
          nights: itinerary.duration?.nights || Math.max(0, (itinerary.days?.length || 1) - 1)
        },
        startDate: itinerary.startDate ? new Date(itinerary.startDate).toISOString().split('T')[0] : '',
        endDate: itinerary.endDate ? new Date(itinerary.endDate).toISOString().split('T')[0] : '',
        highlights: itinerary.highlights || [],
        inclusions: itinerary.inclusions || [],
        exclusions: itinerary.exclusions || [],
        travelStyle: itinerary.travelStyle || '',
        themes: itinerary.themes || [],
        difficulty: itinerary.difficulty || '',
        minGroupSize: itinerary.minGroupSize || 1,
        maxGroupSize: itinerary.maxGroupSize || 10,
        tags: itinerary.tags || []
      });
    }
  }, [itinerary]);

  const handleLocationSelect = (location) => {
    setFormData({
      ...formData,
      destination: {
        country: location.country || '',
        state: location.state || location.administrative_area_level_1 || '',
        city: location.city || location.locality || ''
      }
    });
  };

  const handleAddHighlight = () => {
    if (newHighlight.trim()) {
      setFormData({
        ...formData,
        highlights: [...formData.highlights, newHighlight.trim()]
      });
      setNewHighlight('');
    }
  };

  const handleRemoveHighlight = (index) => {
    setFormData({
      ...formData,
      highlights: formData.highlights.filter((_, i) => i !== index)
    });
  };

  const handleAddInclusion = () => {
    if (newInclusion.trim()) {
      setFormData({
        ...formData,
        inclusions: [...formData.inclusions, newInclusion.trim()]
      });
      setNewInclusion('');
    }
  };

  const handleRemoveInclusion = (index) => {
    setFormData({
      ...formData,
      inclusions: formData.inclusions.filter((_, i) => i !== index)
    });
  };

  const handleAddExclusion = () => {
    if (newExclusion.trim()) {
      setFormData({
        ...formData,
        exclusions: [...formData.exclusions, newExclusion.trim()]
      });
      setNewExclusion('');
    }
  };

  const handleRemoveExclusion = (index) => {
    setFormData({
      ...formData,
      exclusions: formData.exclusions.filter((_, i) => i !== index)
    });
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (index) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((_, i) => i !== index)
    });
  };

  const handleThemeToggle = (theme) => {
    setFormData({
      ...formData,
      themes: formData.themes.includes(theme)
        ? formData.themes.filter(t => t !== theme)
        : [...formData.themes, theme]
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Remove empty enum fields to avoid validation errors
    const cleanedData = { ...formData };
    if (!cleanedData.travelStyle || cleanedData.travelStyle === '') {
      delete cleanedData.travelStyle;
    }
    if (!cleanedData.difficulty || cleanedData.difficulty === '') {
      delete cleanedData.difficulty;
    }
    
    onSave(cleanedData);
    onClose();
  };

  const themes = [
    'adventure', 'beach', 'city', 'cultural', 'family', 'honeymoon', 
    'luxury', 'nature', 'photography', 'pilgrimage', 'relaxation', 
    'road-trip', 'shopping', 'wellness', 'wildlife'
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" showCloseButton={false}>
      <div className="max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-white pb-4 border-b z-10">
          <h2 className="text-2xl font-bold text-gray-900">Edit Basic Information</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Details</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input"
                placeholder="E.g., 10 Days Incredible India Tour"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
                rows="3"
                placeholder="Brief description of the itinerary..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overview
              </label>
              <textarea
                value={formData.overview}
                onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
                className="input"
                rows="4"
                placeholder="Detailed overview of the trip..."
              />
            </div>
          </div>

          {/* Destination */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Destination</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Location
              </label>
              <LocationInput
                onLocationSelect={handleLocationSelect}
                placeholder="Search for destination..."
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.destination.country}
                  onChange={(e) => setFormData({
                    ...formData,
                    destination: { ...formData.destination, country: e.target.value }
                  })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State/Province
                </label>
                <input
                  type="text"
                  value={formData.destination.state}
                  onChange={(e) => setFormData({
                    ...formData,
                    destination: { ...formData.destination, state: e.target.value }
                  })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={formData.destination.city}
                  onChange={(e) => setFormData({
                    ...formData,
                    destination: { ...formData.destination, city: e.target.value }
                  })}
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Duration & Dates */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Duration & Dates</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Days
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.duration.days}
                  onChange={(e) => setFormData({
                    ...formData,
                    duration: { ...formData.duration, days: parseInt(e.target.value) || 1 }
                  })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nights
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.duration.nights}
                  onChange={(e) => setFormData({
                    ...formData,
                    duration: { ...formData.duration, nights: parseInt(e.target.value) || 0 }
                  })}
                  className="input"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Highlights */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Highlights</h3>
            
            <div className="flex space-x-2">
              <input
                type="text"
                value={newHighlight}
                onChange={(e) => setNewHighlight(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddHighlight())}
                className="input flex-1"
                placeholder="Add a highlight..."
              />
              <button type="button" onClick={handleAddHighlight} className="btn btn-secondary">
                Add
              </button>
            </div>

            {formData.highlights.length > 0 && (
              <ul className="space-y-2">
                {formData.highlights.map((highlight, index) => (
                  <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-gray-700">• {highlight}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveHighlight(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Inclusions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Inclusions</h3>
            
            <div className="flex space-x-2">
              <input
                type="text"
                value={newInclusion}
                onChange={(e) => setNewInclusion(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddInclusion())}
                className="input flex-1"
                placeholder="Add an inclusion..."
              />
              <button type="button" onClick={handleAddInclusion} className="btn btn-secondary">
                Add
              </button>
            </div>

            {formData.inclusions.length > 0 && (
              <ul className="space-y-2">
                {formData.inclusions.map((inclusion, index) => (
                  <li key={index} className="flex items-center justify-between bg-green-50 p-2 rounded">
                    <span className="text-gray-700">✓ {inclusion}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveInclusion(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Exclusions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Exclusions</h3>
            
            <div className="flex space-x-2">
              <input
                type="text"
                value={newExclusion}
                onChange={(e) => setNewExclusion(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddExclusion())}
                className="input flex-1"
                placeholder="Add an exclusion..."
              />
              <button type="button" onClick={handleAddExclusion} className="btn btn-secondary">
                Add
              </button>
            </div>

            {formData.exclusions.length > 0 && (
              <ul className="space-y-2">
                {formData.exclusions.map((exclusion, index) => (
                  <li key={index} className="flex items-center justify-between bg-red-50 p-2 rounded">
                    <span className="text-gray-700">✗ {exclusion}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveExclusion(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Travel Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Travel Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Travel Style
                </label>
                <select
                  value={formData.travelStyle}
                  onChange={(e) => setFormData({ ...formData, travelStyle: e.target.value })}
                  className="input"
                >
                  <option value="">Select...</option>
                  <option value="budget">Budget</option>
                  <option value="comfort">Comfort</option>
                  <option value="luxury">Luxury</option>
                  <option value="adventure">Adventure</option>
                  <option value="relaxation">Relaxation</option>
                  <option value="cultural">Cultural</option>
                  <option value="family">Family</option>
                  <option value="honeymoon">Honeymoon</option>
                  <option value="backpacking">Backpacking</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  className="input"
                >
                  <option value="">Select...</option>
                  <option value="easy">Easy</option>
                  <option value="moderate">Moderate</option>
                  <option value="challenging">Challenging</option>
                  <option value="difficult">Difficult</option>
                  <option value="extreme">Extreme</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Group Size
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.minGroupSize}
                  onChange={(e) => setFormData({ ...formData, minGroupSize: parseInt(e.target.value) || 1 })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Group Size
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxGroupSize}
                  onChange={(e) => setFormData({ ...formData, maxGroupSize: parseInt(e.target.value) || 1 })}
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Themes */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Themes</h3>
            
            <div className="flex flex-wrap gap-2">
              {themes.map((theme) => (
                <button
                  key={theme}
                  type="button"
                  onClick={() => handleThemeToggle(theme)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    formData.themes.includes(theme)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {theme}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Tags</h3>
            
            <div className="flex space-x-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="input flex-1"
                placeholder="Add a tag..."
              />
              <button type="button" onClick={handleAddTag} className="btn btn-secondary">
                Add
              </button>
            </div>

            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(index)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <FiX className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t sticky bottom-0 bg-white">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default BasicInfoModal;
