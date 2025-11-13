import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Send,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Edit,
  Trash2,
  Download,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const QuotesTab = ({ email, onRefresh }) => {
  const [showCreateQuoteModal, setShowCreateQuoteModal] = useState(false);
  const [selectedItinerary, setSelectedItinerary] = useState(null); // Single itinerary only
  const [includePdf, setIncludePdf] = useState(false);
  const [customPricing, setCustomPricing] = useState({
    baseCost: 0,
    markupPercentage: 15
  });
  const [creating, setCreating] = useState(false);
  const [selectedQuotesToSend, setSelectedQuotesToSend] = useState([]);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sending, setSending] = useState(false);

  const quotes = email.quotesGenerated || [];

  // Check if a match was selected from the "Add to Quote" button
  useEffect(() => {
    if (window.selectedMatchForQuote) {
      const match = window.selectedMatchForQuote;
      setSelectedItinerary(match);
      setCustomPricing({
        baseCost: match.price || 0,
        markupPercentage: 15
      });
      setShowCreateQuoteModal(true);
      // Clear the global variable
      window.selectedMatchForQuote = null;
    }
  }, []);

  const handleCreateQuote = (match = null) => {
    // If specific match provided, use it; otherwise use first match
    const itinerary = match || email.matchingResults?.[0];
    
    if (itinerary) {
      setSelectedItinerary(itinerary);
      setCustomPricing({
        baseCost: itinerary.price || 0,
        markupPercentage: 15
      });
    }
    setShowCreateQuoteModal(true);
  };

  const handleSubmitQuote = async () => {
    if (!selectedItinerary) {
      toast.error('Please select an itinerary');
      return;
    }

    try {
      setCreating(true);
      
      const markup = {
        percentage: customPricing.markupPercentage,
        amount: customPricing.baseCost * (customPricing.markupPercentage / 100)
      };

      await api.post('/quotes/from-email', {
        emailId: email._id,
        matchedItineraryIds: [selectedItinerary.packageId], // Single itinerary per quote
        includePdfAttachment: includePdf,
        customPricing: {
          baseCost: customPricing.baseCost,
          markup
        }
      });

      toast.success('Quote created! Create more quotes for other packages or send all together.');
      setShowCreateQuoteModal(false);
      
      // Reset form for next quote
      setSelectedItinerary(null);
      setIncludePdf(false);
      
      onRefresh(); // Refresh email data
    } catch (error) {
      console.error('Failed to create quote:', error);
      toast.error(error.message || 'Failed to create quote');
    } finally {
      setCreating(false);
    }
  };

  const handleSendMultipleQuotes = () => {
    if (quotes.length === 0) {
      toast.error('No quotes available to send');
      return;
    }
    
    // Pre-select draft quotes
    const draftQuotes = quotes.filter(q => q.status === 'draft').map(q => q.quoteId);
    setSelectedQuotesToSend(draftQuotes);
    setShowSendModal(true);
  };

  const handleSendQuotes = async () => {
    if (selectedQuotesToSend.length === 0) {
      toast.error('Please select at least one quote to send');
      return;
    }

    try {
      setSending(true);
      
      // Call API to send multiple quotes in one email
      await api.post('/quotes/send-multiple', {
        quoteIds: selectedQuotesToSend,
        emailId: email._id,
        message: 'Thank you for your inquiry! We have prepared the following package options for you.'
      });

      toast.success(`Successfully sent ${selectedQuotesToSend.length} quote(s) to customer!`);
      setShowSendModal(false);
      setSelectedQuotesToSend([]);
      onRefresh();
    } catch (error) {
      console.error('Failed to send quotes:', error);
      toast.error(error.message || 'Failed to send quotes');
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-700', icon: Edit },
      sent: { color: 'bg-blue-100 text-blue-700', icon: Send },
      viewed: { color: 'bg-purple-100 text-purple-700', icon: Eye },
      accepted: { color: 'bg-green-100 text-green-700', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-700', icon: XCircle },
      expired: { color: 'bg-gray-100 text-gray-500', icon: Clock }
    };

    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header with Create Quote Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Quotes</h3>
          <p className="text-sm text-gray-600">
            {quotes.length} {quotes.length === 1 ? 'quote' : 'quotes'} generated from this email
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCreateQuote}
            disabled={!email.matchingResults || email.matchingResults.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Create Quote
          </button>
          {quotes.length > 0 && (
            <button
              onClick={handleSendMultipleQuotes}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Send className="w-4 h-4" />
              Send Quotes ({quotes.filter(q => q.status === 'draft').length})
            </button>
          )}
        </div>
      </div>

      {/* No Matches Warning */}
      {(!email.matchingResults || email.matchingResults.length === 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-yellow-900">No Package Matches</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Please match packages first before creating a quote. Click "Re-match Packages" above.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quotes List */}
      {quotes.length === 0 ? (
        <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Quotes Yet</h3>
          <p className="text-gray-600 mb-4">
            Create a quote from the matched packages to send to the customer
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {quotes.map((quote, idx) => (
            <div key={idx} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-semibold text-gray-900">{quote.quoteNumber}</h4>
                    {getStatusBadge(quote.status)}
                    {quote.includePdfAttachment && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        PDF Attached
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    Created {new Date(quote.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-indigo-600">
                    {quote.currency} {quote.totalPrice?.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Included Itineraries */}
              {quote.includedItineraries && quote.includedItineraries.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Included Packages:</p>
                  <div className="space-y-1">
                    {quote.includedItineraries.map((it, itIdx) => (
                      <div key={itIdx} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        {it.title}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                {quote.sentAt && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Send className="w-4 h-4" />
                    Sent on {new Date(quote.sentAt).toLocaleString()}
                  </div>
                )}
                {quote.viewedAt && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Eye className="w-4 h-4" />
                    Viewed on {new Date(quote.viewedAt).toLocaleString()}
                  </div>
                )}
                {quote.respondedAt && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4" />
                    Responded on {new Date(quote.respondedAt).toLocaleString()}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => window.open(`/quotes/${quote.quoteId}`, '_blank')}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>
                <button
                  onClick={() => window.open(`/quotes/${quote.quoteId}/edit`, '_blank')}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                {quote.pdfUrl && (
                  <button
                    onClick={() => window.open(quote.pdfUrl, '_blank')}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Quote Modal */}
      {showCreateQuoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Create Quote</h3>
            <p className="text-sm text-gray-600 mb-4">
              Creating a quote for the selected package. Adjust pricing and options below.
            </p>

            {/* Display Selected Itinerary */}
            {selectedItinerary && (
              <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <p className="text-sm font-medium text-indigo-900 mb-2">Selected Package:</p>
                <p className="font-semibold text-gray-900">{selectedItinerary.itineraryTitle}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <span>📍 {selectedItinerary.destination}</span>
                  <span>📅 {selectedItinerary.duration} days</span>
                  <span className="font-semibold text-indigo-600">
                    {selectedItinerary.currency} {selectedItinerary.price?.toLocaleString()}
                  </span>
                  <span className="ml-auto bg-green-100 text-green-800 px-2 py-1 rounded">
                    Match: {selectedItinerary.score}/100
                  </span>
                </div>
              </div>
            )}

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Cost
                </label>
                <input
                  type="number"
                  value={customPricing.baseCost}
                  onChange={(e) => setCustomPricing({ ...customPricing, baseCost: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Markup %
                </label>
                <input
                  type="number"
                  value={customPricing.markupPercentage}
                  onChange={(e) => setCustomPricing({ ...customPricing, markupPercentage: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Total Price */}
            <div className="bg-indigo-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium text-gray-900">Total Quote Price</span>
                <span className="text-2xl font-bold text-indigo-600">
                  {email.extractedData?.budget?.currency || 'USD'}{' '}
                  {(customPricing.baseCost * (1 + customPricing.markupPercentage / 100)).toLocaleString()}
                </span>
              </div>
            </div>

            {/* PDF Attachment Option */}
            <div className="mb-6">
              <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePdf}
                  onChange={(e) => setIncludePdf(e.target.checked)}
                  className="w-5 h-5"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Include Itinerary PDF</p>
                  <p className="text-sm text-gray-600">
                    Attach a detailed PDF of the itinerary when sending the quote
                  </p>
                </div>
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCreateQuoteModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitQuote}
                disabled={creating || !selectedItinerary}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                {creating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Create Quote
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Multiple Quotes Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Send Multiple Quotes</h3>
            <p className="text-sm text-gray-600 mb-4">
              Select which quotes to include in the email to the customer.
            </p>

            {/* Quote Selection */}
            <div className="mb-6 space-y-3">
              {quotes.map((quote) => (
                <label
                  key={quote.quoteId}
                  className={`flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer ${
                    selectedQuotesToSend.includes(quote.quoteId) 
                      ? 'border-indigo-600 bg-indigo-50' 
                      : 'border-gray-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedQuotesToSend.includes(quote.quoteId)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedQuotesToSend([...selectedQuotesToSend, quote.quoteId]);
                      } else {
                        setSelectedQuotesToSend(selectedQuotesToSend.filter(id => id !== quote.quoteId));
                      }
                    }}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">Quote #{quote.quoteNumber}</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        quote.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                        quote.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {quote.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {quote.includedItineraries?.map(it => it.title).join(', ')}
                    </p>
                    <p className="text-sm font-semibold text-indigo-600 mt-1">
                      {quote.currency} {quote.totalPrice?.toLocaleString()}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            {/* Summary */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium text-indigo-900">
                📧 Sending {selectedQuotesToSend.length} quote{selectedQuotesToSend.length !== 1 ? 's' : ''} to: {email.from.email}
              </p>
              <p className="text-xs text-indigo-700 mt-1">
                All selected quotes will be combined in a single email with detailed package information.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowSendModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSendQuotes}
                disabled={sending || selectedQuotesToSend.length === 0}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send {selectedQuotesToSend.length} Quote{selectedQuotesToSend.length !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotesTab;
