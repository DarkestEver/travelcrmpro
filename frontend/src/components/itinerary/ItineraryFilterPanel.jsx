import { useState } from 'react';
import { FiFilter, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi';

const ItineraryFilterPanel = ({ filters, onFilterChange, onReset }) => {
  const [expandedSections, setExpandedSections] = useState({
    status: true,
    style: true,
    difficulty: false,
    dates: false,
    budget: false,
    destination: false,
    themes: false,
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleFilterChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const handleArrayToggle = (key, value) => {
    const current = filters[key] || [];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    onFilterChange({ ...filters, [key]: updated });
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    Array.isArray(value) ? value.length > 0 : value
  );

  const FilterSection = ({ title, sectionKey, children }) => (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-900">{title}</span>
        {expandedSections[sectionKey] ? (
          <FiChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <FiChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>
      {expandedSections[sectionKey] && (
        <div className="px-4 pb-4 space-y-2">
          {children}
        </div>
      )}
    </div>
  );

  const CheckboxOption = ({ label, checked, onChange }) => (
    <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FiFilter className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
          {hasActiveFilters && (
            <span className="px-2 py-0.5 text-xs bg-primary-100 text-primary-700 rounded-full">
              Active
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="text-sm text-primary-600 hover:text-primary-800 font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Filter Sections */}
      <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
        {/* Status */}
        <FilterSection title="Status" sectionKey="status">
          <CheckboxOption
            label="Draft"
            checked={(filters.status || []).includes('draft')}
            onChange={() => handleArrayToggle('status', 'draft')}
          />
          <CheckboxOption
            label="Published"
            checked={(filters.status || []).includes('published')}
            onChange={() => handleArrayToggle('status', 'published')}
          />
          <CheckboxOption
            label="Archived"
            checked={(filters.status || []).includes('archived')}
            onChange={() => handleArrayToggle('status', 'archived')}
          />
        </FilterSection>

        {/* Travel Style */}
        <FilterSection title="Travel Style" sectionKey="style">
          {['Adventure', 'Luxury', 'Budget', 'Family', 'Solo', 'Group', 'Honeymoon', 'Business'].map(style => (
            <CheckboxOption
              key={style}
              label={style}
              checked={(filters.travelStyle || []).includes(style)}
              onChange={() => handleArrayToggle('travelStyle', style)}
            />
          ))}
        </FilterSection>

        {/* Difficulty */}
        <FilterSection title="Difficulty" sectionKey="difficulty">
          <CheckboxOption
            label="Easy"
            checked={(filters.difficulty || []).includes('Easy')}
            onChange={() => handleArrayToggle('difficulty', 'Easy')}
          />
          <CheckboxOption
            label="Moderate"
            checked={(filters.difficulty || []).includes('Moderate')}
            onChange={() => handleArrayToggle('difficulty', 'Moderate')}
          />
          <CheckboxOption
            label="Challenging"
            checked={(filters.difficulty || []).includes('Challenging')}
            onChange={() => handleArrayToggle('difficulty', 'Challenging')}
          />
        </FilterSection>

        {/* Date Range */}
        <FilterSection title="Date Range" sectionKey="dates">
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Start Date From</label>
              <input
                type="date"
                value={filters.startDateFrom || ''}
                onChange={(e) => handleFilterChange('startDateFrom', e.target.value)}
                className="input text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Start Date To</label>
              <input
                type="date"
                value={filters.startDateTo || ''}
                onChange={(e) => handleFilterChange('startDateTo', e.target.value)}
                className="input text-sm"
              />
            </div>
          </div>
        </FilterSection>

        {/* Budget Range */}
        <FilterSection title="Budget Range" sectionKey="budget">
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Currency</label>
              <select
                value={filters.currency || 'USD'}
                onChange={(e) => handleFilterChange('currency', e.target.value)}
                className="input text-sm"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
                <option value="AUD">AUD</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Min Budget</label>
              <input
                type="number"
                value={filters.minBudget || ''}
                onChange={(e) => handleFilterChange('minBudget', e.target.value)}
                placeholder="0"
                min="0"
                className="input text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Max Budget</label>
              <input
                type="number"
                value={filters.maxBudget || ''}
                onChange={(e) => handleFilterChange('maxBudget', e.target.value)}
                placeholder="Unlimited"
                min="0"
                className="input text-sm"
              />
            </div>
          </div>
        </FilterSection>

        {/* Destination */}
        <FilterSection title="Destination" sectionKey="destination">
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Country</label>
              <input
                type="text"
                value={filters.country || ''}
                onChange={(e) => handleFilterChange('country', e.target.value)}
                placeholder="Enter country"
                className="input text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">City</label>
              <input
                type="text"
                value={filters.city || ''}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                placeholder="Enter city"
                className="input text-sm"
              />
            </div>
          </div>
        </FilterSection>

        {/* Themes */}
        <FilterSection title="Themes" sectionKey="themes">
          {['Cultural', 'Nature', 'Beach', 'Wildlife', 'Historical', 'Food & Wine', 'Photography', 'Wellness'].map(theme => (
            <CheckboxOption
              key={theme}
              label={theme}
              checked={(filters.themes || []).includes(theme)}
              onChange={() => handleArrayToggle('themes', theme)}
            />
          ))}
        </FilterSection>

        {/* Duration */}
        <FilterSection title="Duration (Days)" sectionKey="duration">
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Min Days</label>
              <input
                type="number"
                value={filters.minDays || ''}
                onChange={(e) => handleFilterChange('minDays', e.target.value)}
                placeholder="1"
                min="1"
                className="input text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Max Days</label>
              <input
                type="number"
                value={filters.maxDays || ''}
                onChange={(e) => handleFilterChange('maxDays', e.target.value)}
                placeholder="365"
                min="1"
                max="365"
                className="input text-sm"
              />
            </div>
          </div>
        </FilterSection>
      </div>
    </div>
  );
};

export default ItineraryFilterPanel;
