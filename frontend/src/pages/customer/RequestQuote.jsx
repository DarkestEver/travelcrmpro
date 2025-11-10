import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { submitQuoteRequest } from '../../services/customerQuoteAPI';
import { MapPinIcon, CalendarIcon, UserGroupIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

export default function RequestQuote() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    numberOfTravelers: 1,
    budget: { min: 0, max: 10000, currency: 'USD' },
    accommodationType: '',
    transportationType: '',
    specialRequests: '',
    preferences: {
      dietaryRestrictions: [],
      interests: [],
    },
  });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: submitQuoteRequest,
    onSuccess: () => {
      navigate('/customer/dashboard', {
        state: { message: 'Quote request submitted successfully!' },
      });
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Failed to submit quote request');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.destination || !formData.startDate || !formData.numberOfTravelers) {
      setError('Please fill in all required fields');
      return;
    }

    mutation.mutate(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Request a Quote</h1>
        <p className="mt-2 text-gray-600">Tell us about your dream trip and we'll create a custom quote</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Destination */}
          <div>
            <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-2">
              <MapPinIcon className="h-5 w-5 inline mr-2" />
              Destination *
            </label>
            <input
              type="text"
              id="destination"
              name="destination"
              required
              value={formData.destination}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Paris, France"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarIcon className="h-5 w-5 inline mr-2" />
                Start Date *
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                required
                value={formData.startDate}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Number of Travelers */}
          <div>
            <label htmlFor="numberOfTravelers" className="block text-sm font-medium text-gray-700 mb-2">
              <UserGroupIcon className="h-5 w-5 inline mr-2" />
              Number of Travelers *
            </label>
            <input
              type="number"
              id="numberOfTravelers"
              name="numberOfTravelers"
              required
              min="1"
              value={formData.numberOfTravelers}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Budget Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CurrencyDollarIcon className="h-5 w-5 inline mr-2" />
              Budget Range
            </label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                placeholder="Min"
                value={formData.budget.min}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    budget: { ...formData.budget, min: Number(e.target.value) },
                  })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="number"
                placeholder="Max"
                value={formData.budget.max}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    budget: { ...formData.budget, max: Number(e.target.value) },
                  })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Accommodation Type */}
          <div>
            <label htmlFor="accommodationType" className="block text-sm font-medium text-gray-700 mb-2">
              Accommodation Preference
            </label>
            <select
              id="accommodationType"
              name="accommodationType"
              value={formData.accommodationType}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select preference</option>
              <option value="hotel">Hotel</option>
              <option value="resort">Resort</option>
              <option value="apartment">Apartment</option>
              <option value="villa">Villa</option>
              <option value="hostel">Hostel</option>
            </select>
          </div>

          {/* Special Requests */}
          <div>
            <label htmlFor="specialRequests" className="block text-sm font-medium text-gray-700 mb-2">
              Special Requests or Requirements
            </label>
            <textarea
              id="specialRequests"
              name="specialRequests"
              rows={4}
              value={formData.specialRequests}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Tell us about any special requirements, interests, or preferences..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/customer/dashboard')}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? 'Submitting...' : 'Submit Quote Request'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
