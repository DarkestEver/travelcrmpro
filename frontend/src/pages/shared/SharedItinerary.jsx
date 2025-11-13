import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export default function SharedItinerary() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [password, setPassword] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [itinerary, setItinerary] = useState(null);
  const [tenant, setTenant] = useState(null);

  useEffect(() => {
    loadItinerary();
  }, [token]);

  const loadItinerary = async (pwd = null) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${API_URL}/public/itineraries/${token}`, {
        params: { password: pwd || password }
      });

      setItinerary(response.data.data.itinerary);
      setTenant(response.data.data.tenant);
      setNeedsPassword(false);
    } catch (err) {
      if (err.response?.status === 401 && err.response?.data?.message?.includes('password')) {
        setNeedsPassword(true);
        setError('This itinerary requires a password to view.');
      } else if (err.response?.status === 403 && err.response?.data?.message?.includes('already been used')) {
        // Handle single-use link already accessed
        setError('link_already_used');
      } else {
        setError(err.response?.data?.message || 'Failed to load itinerary');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    loadItinerary(password);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading itinerary...</p>
        </div>
      </div>
    );
  }

  if (needsPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Password Required
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              This itinerary is password protected. Please enter the password to continue.
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handlePasswordSubmit}>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                View Itinerary
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (error || !itinerary) {
    // Special UI for already-used single-use links
    if (error === 'link_already_used') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="text-yellow-600 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Already Used</h1>
            <p className="text-gray-600 mb-4">
              This share link was configured for single-use only and has already been accessed.
            </p>
            <p className="text-sm text-gray-500">
              Please contact the sender if you need access to this itinerary again.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Itinerary</h1>
          <p className="text-gray-600">{error || 'Itinerary not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with branding */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{tenant?.name || 'Travel Agency'}</h1>
              <p className="text-sm text-gray-600 mt-1">Travel Itinerary</p>
            </div>
            {tenant?.settings?.branding?.logo && (
              <img 
                src={tenant.settings.branding.logo} 
                alt={tenant.name} 
                className="h-16 object-contain"
              />
            )}
          </div>
        </div>

        {/* Itinerary Header */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="px-6 py-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{itinerary.title}</h2>
            {itinerary.description && (
              <p className="text-gray-600 mb-4">{itinerary.description}</p>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-indigo-50 rounded-lg p-4">
                <p className="text-sm text-indigo-600 font-medium">Start Date</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {formatDate(itinerary.startDate)}
                </p>
              </div>
              <div className="bg-indigo-50 rounded-lg p-4">
                <p className="text-sm text-indigo-600 font-medium">End Date</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {formatDate(itinerary.endDate)}
                </p>
              </div>
              <div className="bg-indigo-50 rounded-lg p-4">
                <p className="text-sm text-indigo-600 font-medium">Duration</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {itinerary.days?.length || 0} Days
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Day by Day Itinerary */}
        {itinerary.days && itinerary.days.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Day by Day Itinerary</h3>
            {itinerary.days.map((day, index) => (
              <div key={day._id || index} className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 bg-indigo-600">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-white">
                      Day {day.dayNumber || index + 1}: {day.title || 'Untitled'}
                    </h4>
                    {day.date && (
                      <span className="text-indigo-100 text-sm">
                        {formatDate(day.date)}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="px-6 py-4">
                  {day.description && (
                    <p className="text-gray-700 mb-4">{day.description}</p>
                  )}
                  
                  {day.activities && day.activities.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-gray-600">Activities:</p>
                      {day.activities.map((activity, actIndex) => (
                        <div key={actIndex} className="flex items-start space-x-3 pl-4">
                          <div className="flex-shrink-0 mt-1">
                            <div className="h-2 w-2 rounded-full bg-indigo-600"></div>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{activity.title}</p>
                            {activity.description && (
                              <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                            )}
                            {activity.time && (
                              <p className="text-sm text-indigo-600 mt-1">⏰ {activity.time}</p>
                            )}
                            {activity.location && (
                              <p className="text-sm text-gray-500 mt-1">📍 {activity.location}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {day.accommodation && (
                    <div className="mt-4 p-3 bg-gray-50 rounded">
                      <p className="text-sm font-medium text-gray-600">Accommodation:</p>
                      <p className="text-gray-900">{day.accommodation}</p>
                    </div>
                  )}

                  {day.meals && day.meals.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-600 mb-2">Meals Included:</p>
                      <div className="flex flex-wrap gap-2">
                        {day.meals.map((meal, mealIndex) => (
                          <span
                            key={mealIndex}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                          >
                            {meal}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pricing */}
        {itinerary.pricing && (
          <div className="bg-white shadow rounded-lg overflow-hidden mt-6">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Pricing</h3>
            </div>
            <div className="px-6 py-4">
              <div className="flex justify-between items-center">
                <span className="text-xl font-medium text-gray-900">Total Cost</span>
                <span className="text-3xl font-bold text-indigo-600">
                  ${itinerary.pricing.total?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Additional Information */}
        {itinerary.notes && (
          <div className="bg-white shadow rounded-lg overflow-hidden mt-6">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-gray-700 whitespace-pre-wrap">{itinerary.notes}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>For any queries, please contact {tenant?.name || 'us'}</p>
          {tenant?.settings?.contact?.email && (
            <p className="mt-1">Email: {tenant.settings.contact.email}</p>
          )}
          {tenant?.settings?.contact?.phone && (
            <p>Phone: {tenant.settings.contact.phone}</p>
          )}
        </div>
      </div>
    </div>
  );
}
