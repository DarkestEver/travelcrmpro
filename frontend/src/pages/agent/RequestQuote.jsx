import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PaperAirplaneIcon, UserIcon } from '@heroicons/react/24/outline';
import { getMyCustomers } from '../../services/agentCustomerAPI';
import { submitQuoteRequest } from '../../services/agentQuoteRequestAPI';

export default function RequestQuote() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    customerId: '',
    destination: {
      country: '',
      city: '',
    },
    travelDates: {
      startDate: '',
      endDate: '',
      flexible: false,
    },
    travelers: {
      adults: 2,
      children: 0,
      infants: 0,
    },
    budget: {
      amount: '',
      currency: 'USD',
      flexibility: 'flexible',
    },
    preferences: {
      travelStyle: [],
      difficulty: 'moderate',
      themes: [],
      accommodation: 'comfortable',
    },
    inspirationNotes: '',
  });

  // Fetch customers for dropdown
  const { data: customersData } = useQuery({
    queryKey: ['myCustomers', 1, '', ''],
    queryFn: () => getMyCustomers({ page: 1, limit: 100 }),
  });

  const customers = customersData?.data?.customers || [];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleCheckboxGroup = (group, value) => {
    setFormData((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [group]: prev.preferences[group].includes(value)
          ? prev.preferences[group].filter((item) => item !== value)
          : [...prev.preferences[group], value],
      },
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.customerId) {
      newErrors.customerId = 'Please select a customer';
    }

    if (!formData.destination.country) {
      newErrors.destinationCountry = 'Destination country is required';
    }

    if (!formData.travelDates.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.travelDates.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.travelDates.startDate && formData.travelDates.endDate) {
      if (new Date(formData.travelDates.startDate) >= new Date(formData.travelDates.endDate)) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    if (!formData.travelers.adults || formData.travelers.adults < 1) {
      newErrors.adults = 'At least 1 adult required';
    }

    if (formData.budget.amount && isNaN(formData.budget.amount)) {
      newErrors.budget = 'Budget must be a number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const dataToSubmit = {
        ...formData,
        budget: {
          ...formData.budget,
          amount: formData.budget.amount ? parseFloat(formData.budget.amount) : undefined,
        },
        travelers: {
          adults: parseInt(formData.travelers.adults),
          children: parseInt(formData.travelers.children),
          infants: parseInt(formData.travelers.infants),
        },
      };

      await submitQuoteRequest(dataToSubmit);
      alert('Quote request submitted successfully! We will review and get back to you soon.');
      navigate('/agent/quotes');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit quote request');
    } finally {
      setLoading(false);
    }
  };

  const travelStyles = [
    { value: 'adventure', label: 'Adventure' },
    { value: 'relaxation', label: 'Relaxation' },
    { value: 'cultural', label: 'Cultural' },
    { value: 'luxury', label: 'Luxury' },
    { value: 'budget', label: 'Budget-Friendly' },
    { value: 'family', label: 'Family-Friendly' },
  ];

  const themes = [
    { value: 'wildlife', label: 'Wildlife & Safari' },
    { value: 'beach', label: 'Beach & Coast' },
    { value: 'mountains', label: 'Mountains & Hiking' },
    { value: 'food', label: 'Food & Culinary' },
    { value: 'history', label: 'History & Heritage' },
    { value: 'photography', label: 'Photography' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Request a Quote</h1>
        <p className="mt-1 text-sm text-gray-500">
          Submit a quote request for your customer and we'll create a customized itinerary
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Selection */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h2>
          <div>
            <label htmlFor="customerId" className="block text-sm font-medium text-gray-700">
              Select Customer <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 relative">
              <select
                id="customerId"
                name="customerId"
                value={formData.customerId}
                onChange={handleChange}
                className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                  errors.customerId ? 'border-red-300' : ''
                }`}
              >
                <option value="">-- Select a customer --</option>
                {customers.map((customer) => (
                  <option key={customer._id} value={customer._id}>
                    {customer.firstName} {customer.lastName} ({customer.email})
                  </option>
                ))}
              </select>
              {customers.length === 0 && (
                <p className="mt-2 text-sm text-gray-500">
                  <UserIcon className="inline h-4 w-4 mr-1" />
                  No customers found.{' '}
                  <a href="/agent/customers" className="text-indigo-600 hover:text-indigo-500">
                    Add a customer first
                  </a>
                </p>
              )}
            </div>
            {errors.customerId && (
              <p className="mt-1 text-sm text-red-600">{errors.customerId}</p>
            )}
          </div>
        </div>

        {/* Destination */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Destination</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="destination.country" className="block text-sm font-medium text-gray-700">
                Country <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="destination.country"
                name="destination.country"
                value={formData.destination.country}
                onChange={handleChange}
                placeholder="e.g., Peru, Japan, Iceland"
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                  errors.destinationCountry ? 'border-red-300' : ''
                }`}
              />
              {errors.destinationCountry && (
                <p className="mt-1 text-sm text-red-600">{errors.destinationCountry}</p>
              )}
            </div>

            <div>
              <label htmlFor="destination.city" className="block text-sm font-medium text-gray-700">
                City (Optional)
              </label>
              <input
                type="text"
                id="destination.city"
                name="destination.city"
                value={formData.destination.city}
                onChange={handleChange}
                placeholder="e.g., Cusco, Tokyo"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Travel Dates */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Travel Dates</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="travelDates.startDate" className="block text-sm font-medium text-gray-700">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="travelDates.startDate"
                name="travelDates.startDate"
                value={formData.travelDates.startDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                  errors.startDate ? 'border-red-300' : ''
                }`}
              />
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
              )}
            </div>

            <div>
              <label htmlFor="travelDates.endDate" className="block text-sm font-medium text-gray-700">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="travelDates.endDate"
                name="travelDates.endDate"
                value={formData.travelDates.endDate}
                onChange={handleChange}
                min={formData.travelDates.startDate || new Date().toISOString().split('T')[0]}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                  errors.endDate ? 'border-red-300' : ''
                }`}
              />
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="travelDates.flexible"
                checked={formData.travelDates.flexible}
                onChange={handleChange}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">Dates are flexible (±3 days)</span>
            </label>
          </div>
        </div>

        {/* Travelers */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Travelers</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="travelers.adults" className="block text-sm font-medium text-gray-700">
                Adults (18+) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="travelers.adults"
                name="travelers.adults"
                value={formData.travelers.adults}
                onChange={handleChange}
                min="1"
                max="20"
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                  errors.adults ? 'border-red-300' : ''
                }`}
              />
              {errors.adults && (
                <p className="mt-1 text-sm text-red-600">{errors.adults}</p>
              )}
            </div>

            <div>
              <label htmlFor="travelers.children" className="block text-sm font-medium text-gray-700">
                Children (2-17)
              </label>
              <input
                type="number"
                id="travelers.children"
                name="travelers.children"
                value={formData.travelers.children}
                onChange={handleChange}
                min="0"
                max="10"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="travelers.infants" className="block text-sm font-medium text-gray-700">
                Infants (0-1)
              </label>
              <input
                type="number"
                id="travelers.infants"
                name="travelers.infants"
                value={formData.travelers.infants}
                onChange={handleChange}
                min="0"
                max="5"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Budget */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Budget</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="budget.amount" className="block text-sm font-medium text-gray-700">
                Budget Amount
              </label>
              <input
                type="number"
                id="budget.amount"
                name="budget.amount"
                value={formData.budget.amount}
                onChange={handleChange}
                placeholder="5000"
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                  errors.budget ? 'border-red-300' : ''
                }`}
              />
              {errors.budget && (
                <p className="mt-1 text-sm text-red-600">{errors.budget}</p>
              )}
            </div>

            <div>
              <label htmlFor="budget.currency" className="block text-sm font-medium text-gray-700">
                Currency
              </label>
              <select
                id="budget.currency"
                name="budget.currency"
                value={formData.budget.currency}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
              </select>
            </div>

            <div>
              <label htmlFor="budget.flexibility" className="block text-sm font-medium text-gray-700">
                Flexibility
              </label>
              <select
                id="budget.flexibility"
                name="budget.flexibility"
                value={formData.budget.flexibility}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="strict">Strict - Cannot exceed</option>
                <option value="flexible">Flexible - Can go slightly over</option>
                <option value="very-flexible">Very Flexible - Show best options</option>
              </select>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Travel Preferences</h2>
          
          {/* Travel Style */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Travel Style</label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {travelStyles.map((style) => (
                <label key={style.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.preferences.travelStyle.includes(style.value)}
                    onChange={() => handleCheckboxGroup('travelStyle', style.value)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{style.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div className="mb-6">
            <label htmlFor="preferences.difficulty" className="block text-sm font-medium text-gray-700">
              Activity Difficulty
            </label>
            <select
              id="preferences.difficulty"
              name="preferences.difficulty"
              value={formData.preferences.difficulty}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="easy">Easy - Light walking</option>
              <option value="moderate">Moderate - Some hiking</option>
              <option value="challenging">Challenging - Strenuous activities</option>
            </select>
          </div>

          {/* Themes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Themes & Interests</label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {themes.map((theme) => (
                <label key={theme.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.preferences.themes.includes(theme.value)}
                    onChange={() => handleCheckboxGroup('themes', theme.value)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{theme.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Accommodation */}
          <div>
            <label htmlFor="preferences.accommodation" className="block text-sm font-medium text-gray-700">
              Accommodation Preference
            </label>
            <select
              id="preferences.accommodation"
              name="preferences.accommodation"
              value={formData.preferences.accommodation}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="budget">Budget - Hostels, basic hotels</option>
              <option value="comfortable">Comfortable - 3-star hotels</option>
              <option value="premium">Premium - 4-star hotels</option>
              <option value="luxury">Luxury - 5-star hotels, resorts</option>
            </select>
          </div>
        </div>

        {/* Inspiration Notes */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h2>
          <div>
            <label htmlFor="inspirationNotes" className="block text-sm font-medium text-gray-700">
              Tell us more about the trip
            </label>
            <textarea
              id="inspirationNotes"
              name="inspirationNotes"
              rows={4}
              value={formData.inspirationNotes}
              onChange={handleChange}
              placeholder="Share any specific interests, must-see places, dietary restrictions, or special requirements..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/agent/quotes')}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || customers.length === 0}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            <PaperAirplaneIcon className="h-5 w-5 mr-2" />
            {loading ? 'Submitting...' : 'Submit Quote Request'}
          </button>
        </div>
      </form>
    </div>
  );
}
