import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  MapPin,
  Users,
  Clock,
  Tag,
  Edit,
  Share2,
  Download,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const ItineraryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchItinerary();
  }, [id]);

  const fetchItinerary = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/itineraries/${id}`);
      setItinerary(response.data);
    } catch (error) {
      console.error('Failed to fetch itinerary:', error);
      setError(error.message || 'Failed to load itinerary');
      toast.error('Failed to load itinerary');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    // Default to 'draft' if status is undefined or invalid
    const validStatus = status || 'draft';
    
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: Edit },
      published: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      archived: { color: 'bg-red-100 text-red-800', icon: AlertCircle }
    };

    const config = statusConfig[validStatus] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-4 h-4" />
        {validStatus.charAt(0).toUpperCase() + validStatus.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !itinerary) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Itinerary</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => navigate('/itineraries')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Back to Itineraries
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{itinerary.title}</h1>
            <div className="flex items-center gap-3">
              {getStatusBadge(itinerary.status)}
              {itinerary.travelStyle && (
                <span className="text-sm text-gray-600 capitalize">
                  {itinerary.travelStyle} Travel
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/itineraries/${id}/build`)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => navigate(`/itinerary-preview/${id}`)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Preview
            </button>
          </div>
        </div>
      </div>

      {/* Key Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Destination</p>
              <p className="text-lg font-semibold text-gray-900">
                {itinerary.destination?.city || itinerary.destination?.country || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Duration</p>
              <p className="text-lg font-semibold text-gray-900">
                {itinerary.duration?.days || 0} Days / {itinerary.duration?.nights || 0} Nights
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Base Cost</p>
              <p className="text-lg font-semibold text-gray-900">
                {itinerary.estimatedCost?.currency || 'USD'} {itinerary.estimatedCost?.baseCost?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Suitable For</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">
                {itinerary.suitableFor?.[0] || 'Everyone'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Section */}
      {itinerary.overview && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Overview</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{itinerary.overview}</p>
        </div>
      )}

      {/* Themes */}
      {itinerary.themes && itinerary.themes.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Themes
          </h2>
          <div className="flex flex-wrap gap-2">
            {itinerary.themes.map((theme, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Inclusions & Exclusions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {itinerary.inclusions && itinerary.inclusions.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Inclusions
            </h2>
            <ul className="space-y-2">
              {itinerary.inclusions.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {itinerary.exclusions && itinerary.exclusions.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Exclusions
            </h2>
            <ul className="space-y-2">
              {itinerary.exclusions.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-gray-700">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Days Schedule */}
      {itinerary.days && itinerary.days.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Day-by-Day Itinerary
          </h2>
          <div className="space-y-6">
            {itinerary.days.map((day, idx) => (
              <div key={idx} className="border-l-4 border-indigo-600 pl-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Day {day.dayNumber}: {day.title}
                </h3>
                {day.description && (
                  <p className="text-gray-700 mb-3">{day.description}</p>
                )}
                {day.activities && day.activities.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">Activities:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {day.activities.map((activity, aidx) => (
                        <li key={aidx}>{activity}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {day.accommodation && (
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>Accommodation:</strong> {day.accommodation}
                  </p>
                )}
                {day.meals && day.meals.length > 0 && (
                  <p className="text-sm text-gray-600">
                    <strong>Meals:</strong> {day.meals.join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cost Breakdown */}
      {itinerary.estimatedCost?.breakdown && (
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Cost Breakdown</h2>
          <div className="space-y-3">
            {Object.entries(itinerary.estimatedCost.breakdown).map(([key, value]) => (
              value > 0 && (
                <div key={key} className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-700 capitalize">{key}</span>
                  <span className="font-semibold text-gray-900">
                    {itinerary.estimatedCost.currency} {value.toLocaleString()}
                  </span>
                </div>
              )
            ))}
            <div className="flex justify-between items-center py-3 pt-4 border-t-2 border-gray-300">
              <span className="text-lg font-bold text-gray-900">Total Cost</span>
              <span className="text-2xl font-bold text-indigo-600">
                {itinerary.estimatedCost.currency} {(itinerary.estimatedCost.totalCost || itinerary.estimatedCost.baseCost)?.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItineraryDetail;
