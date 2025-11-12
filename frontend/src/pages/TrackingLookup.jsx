import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  FiSearch, 
  FiMail, 
  FiClock, 
  FiUser, 
  FiCheckCircle,
  FiAlertCircle,
  FiArrowRight,
  FiArrowLeft,
  FiInfo
} from 'react-icons/fi';
import api from '../services/api';

const TrackingLookup = () => {
  const { trackingId: urlTrackingId } = useParams();
  const [trackingId, setTrackingId] = useState(urlTrackingId || '');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch conversation by tracking ID
  const { 
    data: conversationData, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['tracking', trackingId],
    queryFn: async () => {
      if (!trackingId) return null;
      const response = await api.get(`/public/tracking/${trackingId}`);
      return response.data;
    },
    enabled: !!trackingId && trackingId.length >= 10
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setTrackingId(searchQuery.trim().toUpperCase());
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      sent: 'bg-green-100 text-green-800',
      delivered: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <FiMail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Track Your Conversation</h1>
              <p className="text-sm text-gray-600">Enter your reference number to view email history</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reference Number / Tracking ID
              </label>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                    placeholder="TRK-ABC12-001234"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-lg"
                    maxLength={20}
                  />
                  <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2"
                >
                  <FiSearch className="w-5 h-5" />
                  Search
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Format: PREFIX-HASH-SEQUENCE (e.g., TRK-ABC12-001234)
              </p>
            </div>
          </form>

          {/* Info Box */}
          <div className="mt-4 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FiInfo className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-indigo-800">
                <p className="font-medium mb-1">Where to find your reference number?</p>
                <p>Look for the reference number at the bottom of any email from us. It looks like <span className="font-mono bg-indigo-100 px-1 rounded">[TRK-ABC12-001234]</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
            <p className="mt-4 text-gray-600">Searching for your conversation...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <FiAlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-red-900">Conversation Not Found</h3>
                <p className="text-red-700 mt-1">
                  {error.response?.data?.message || 'Please check your reference number and try again.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {conversationData && !isLoading && (
          <div className="space-y-6">
            {/* Conversation Summary */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Conversation Summary</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(conversationData.conversation.status)}`}>
                  {conversationData.conversation.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Reference Number</div>
                  <div className="font-mono font-semibold text-gray-900">{conversationData.conversation.trackingId}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Total Emails</div>
                  <div className="text-2xl font-bold text-indigo-600">{conversationData.conversation.emailCount}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">First Contact</div>
                  <div className="text-sm font-medium text-gray-900">{formatDate(conversationData.conversation.firstEmailDate)}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Last Update</div>
                  <div className="text-sm font-medium text-gray-900">{formatDate(conversationData.conversation.lastEmailDate)}</div>
                </div>
              </div>

              {/* Participants */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {conversationData.conversation.participants.customer && (
                  <div className="flex items-center gap-3 bg-blue-50 rounded-lg p-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <FiUser className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-blue-600 font-medium">Customer</div>
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {conversationData.conversation.participants.customer.name}
                      </div>
                      <div className="text-xs text-gray-600 truncate">
                        {conversationData.conversation.participants.customer.email}
                      </div>
                    </div>
                  </div>
                )}
                {conversationData.conversation.participants.agent && (
                  <div className="flex items-center gap-3 bg-green-50 rounded-lg p-4">
                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <FiCheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-green-600 font-medium">Agent</div>
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {conversationData.conversation.participants.agent.name}
                      </div>
                      <div className="text-xs text-gray-600 truncate">
                        {conversationData.conversation.participants.agent.email}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Email Thread */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Email History</h2>
              
              <div className="space-y-4">
                {conversationData.emails.map((email, index) => (
                  <div 
                    key={email.trackingId || index}
                    className={`border rounded-lg p-4 ${
                      email.direction === 'outbound' 
                        ? 'bg-indigo-50 border-indigo-200 ml-8' 
                        : 'bg-white border-gray-200 mr-8'
                    }`}
                  >
                    {/* Email Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          email.direction === 'outbound' 
                            ? 'bg-indigo-600' 
                            : 'bg-gray-600'
                        }`}>
                          {email.direction === 'outbound' ? (
                            <FiArrowRight className="w-4 h-4 text-white" />
                          ) : (
                            <FiArrowLeft className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {email.from?.name || email.from?.email || 'Unknown'}
                          </div>
                          <div className="text-xs text-gray-500">
                            to {email.to?.name || email.to?.email || 'Unknown'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <FiClock className="w-3 h-3" />
                          {formatDate(email.createdAt)}
                        </div>
                        {email.trackingId && (
                          <div className="text-xs font-mono text-gray-400 mt-1">
                            {email.trackingId}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Email Subject */}
                    <div className="mb-2">
                      <div className="font-medium text-gray-900">{email.subject}</div>
                    </div>

                    {/* Email Preview */}
                    <div className="text-sm text-gray-700 bg-white bg-opacity-50 rounded p-3 whitespace-pre-wrap">
                      {email.bodyPreview}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Help Section */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-bold mb-2">Need More Help?</h3>
              <p className="text-indigo-100 mb-4">
                If you have questions about your conversation or need additional assistance, please contact our support team directly.
              </p>
              <button className="bg-white text-indigo-600 px-6 py-2 rounded-lg font-medium hover:bg-indigo-50 transition-colors">
                Contact Support
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackingLookup;
