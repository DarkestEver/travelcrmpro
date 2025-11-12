import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export default function SharedQuote() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [password, setPassword] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [quote, setQuote] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [responding, setResponding] = useState(false);
  const [responseType, setResponseType] = useState(null); // 'accept' or 'reject'
  const [email, setEmail] = useState('');
  const [comments, setComments] = useState('');
  const [reason, setReason] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadQuote();
  }, [token]);

  const loadQuote = async (pwd = null) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${API_URL}/public/quotes/${token}`, {
        params: { password: pwd || password }
      });

      setQuote(response.data.data.quote);
      setTenant(response.data.data.tenant);
      setNeedsPassword(false);
    } catch (err) {
      if (err.response?.status === 401 && err.response?.data?.message?.includes('password')) {
        setNeedsPassword(true);
        setError('This quote requires a password to view.');
      } else {
        setError(err.response?.data?.message || 'Failed to load quote');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    loadQuote(password);
  };

  const handleAccept = async () => {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    try {
      setResponding(true);
      setError(null);

      await axios.post(`${API_URL}/public/quotes/${token}/accept`, {
        password: password || undefined,
        email: email.trim(),
        comments: comments.trim()
      });

      setSuccess(true);
      setResponseType('accepted');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept quote');
    } finally {
      setResponding(false);
    }
  };

  const handleReject = async () => {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    try {
      setResponding(true);
      setError(null);

      await axios.post(`${API_URL}/public/quotes/${token}/reject`, {
        password: password || undefined,
        email: email.trim(),
        reason: reason.trim()
      });

      setSuccess(true);
      setResponseType('rejected');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject quote');
    } finally {
      setResponding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quote...</p>
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
              This quote is password protected. Please enter the password to continue.
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
                View Quote
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className={`text-6xl mb-4 ${responseType === 'accepted' ? 'text-green-600' : 'text-gray-600'}`}>
            {responseType === 'accepted' ? '✓' : 'ℹ'}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {responseType === 'accepted' ? 'Quote Accepted!' : 'Response Recorded'}
          </h1>
          <p className="text-gray-600">
            {responseType === 'accepted' 
              ? 'Thank you for accepting this quote. We will contact you shortly to proceed with the booking.'
              : 'Thank you for your response. We have recorded your feedback.'}
          </p>
        </div>
      </div>
    );
  }

  if (error && !quote) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Quote</h1>
          <p className="text-gray-600">{error}</p>
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
              <p className="text-sm text-gray-600 mt-1">Travel Quote</p>
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

        {/* Quote Details */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200 bg-indigo-50">
            <h2 className="text-lg font-semibold text-indigo-900">Quote Details</h2>
          </div>
          
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Quote Number</p>
                <p className="font-semibold text-gray-900">{quote.quoteNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  quote.status === 'accepted' ? 'bg-green-100 text-green-800' :
                  quote.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  quote.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {quote.status?.toUpperCase() || 'N/A'}
                </span>
              </div>
            </div>

            {quote.customer && (
              <div>
                <p className="text-sm text-gray-600">Customer Name</p>
                <p className="font-semibold text-gray-900">{quote.customer.name || 'N/A'}</p>
              </div>
            )}

            {quote.itinerary && (
              <div>
                <p className="text-sm text-gray-600">Trip</p>
                <p className="font-semibold text-gray-900">{quote.itinerary.title || 'N/A'}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-gray-600">Valid Until</p>
              <p className="font-semibold text-gray-900">
                {quote.validUntil ? new Date(quote.validUntil).toLocaleDateString() : 'N/A'}
              </p>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-2">Pricing</p>
              <div className="bg-gray-50 rounded p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-900">Total Amount</span>
                  <span className="text-2xl font-bold text-indigo-600">
                    {quote.pricing?.total ? `$${quote.pricing.total.toFixed(2)}` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {quote.notes && (
              <div>
                <p className="text-sm text-gray-600">Additional Information</p>
                <p className="text-gray-900 whitespace-pre-wrap">{quote.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Response Form - Only show if quote is pending */}
        {quote.status === 'pending' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Your Response</h2>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Email *
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {responseType === 'accept' && (
                <div>
                  <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-1">
                    Comments (Optional)
                  </label>
                  <textarea
                    id="comments"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Any special requests or comments..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                  />
                </div>
              )}

              {responseType === 'reject' && (
                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                    Reason (Optional)
                  </label>
                  <textarea
                    id="reason"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Let us know why you're declining this quote..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
              )}

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="flex gap-4">
                {responseType === null ? (
                  <>
                    <button
                      onClick={() => setResponseType('accept')}
                      className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Accept Quote
                    </button>
                    <button
                      onClick={() => setResponseType('reject')}
                      className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Decline Quote
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setResponseType(null)}
                      className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      disabled={responding}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={responseType === 'accept' ? handleAccept : handleReject}
                      disabled={responding}
                      className={`flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        responseType === 'accept'
                          ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                          : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                      } ${responding ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {responding ? 'Submitting...' : `Confirm ${responseType === 'accept' ? 'Accept' : 'Decline'}`}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
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
