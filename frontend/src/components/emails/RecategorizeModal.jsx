import React, { useState, useEffect } from 'react';
import { X, Search, Tag, Link2, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import emailAPI from '../../services/emailAPI';

const CATEGORIES = [
  { value: 'CUSTOMER', label: 'Customer', icon: '👤', description: 'Customer inquiries and bookings' },
  { value: 'SUPPLIER', label: 'Supplier', icon: '🏨', description: 'Supplier packages and confirmations' },
  { value: 'AGENT', label: 'Agent', icon: '🤝', description: 'Agent communications' },
  { value: 'FINANCE', label: 'Finance', icon: '💰', description: 'Payment and financial matters' },
  { value: 'OTHER', label: 'Other', icon: '📄', description: 'General correspondence' }
];

export default function RecategorizeModal({ isOpen, onClose, email, onSuccess }) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [linkToDuplicate, setLinkToDuplicate] = useState(false);

  useEffect(() => {
    if (email) {
      setSelectedCategory(email.category || 'OTHER');
    }
  }, [email]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchExistingQueries();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchExistingQueries = async () => {
    try {
      setSearching(true);
      const response = await emailAPI.searchQueries(searchQuery);
      if (response.success) {
        setSearchResults(response.data || []);
      }
    } catch (error) {
      console.error('Failed to search queries:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSave = async () => {
    if (!selectedCategory) {
      toast.error('Please select a category');
      return;
    }

    try {
      setSaving(true);

      const updateData = {
        category: selectedCategory
      };

      // If linking to existing query
      if (linkToDuplicate && selectedQuery) {
        updateData.parentQueryId = selectedQuery._id;
        updateData.isDuplicate = true;
      }

      const response = await emailAPI.recategorize(email._id, updateData);

      if (response.success) {
        toast.success(
          linkToDuplicate && selectedQuery
            ? 'Email re-categorized and linked to existing query!'
            : 'Email re-categorized successfully!'
        );
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Failed to recategorize:', error);
      toast.error(error.response?.data?.message || 'Failed to recategorize email');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setSelectedCategory(email?.category || 'OTHER');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedQuery(null);
    setLinkToDuplicate(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Tag className="text-blue-600" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Re-categorize Email</h2>
              <p className="text-sm text-gray-600">Change category and link to existing queries</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Current Email Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Current Email</h3>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">From:</span> {typeof email?.from === 'object' ? (email?.from?.name ? `${email.from.name} <${email.from.email}>` : email?.from?.email) : email?.from}</p>
              <p><span className="font-medium">Subject:</span> {email?.subject}</p>
              <p><span className="font-medium">Current Category:</span> 
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                  {email?.category || 'Not Set'}
                </span>
              </p>
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select New Category <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedCategory === cat.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{cat.icon}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900">{cat.label}</h4>
                      <p className="text-xs text-gray-600 mt-1">{cat.description}</p>
                    </div>
                    {selectedCategory === cat.value && (
                      <CheckCircle className="ml-auto text-blue-600" size={20} />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Link to Existing Query */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                id="linkToDuplicate"
                checked={linkToDuplicate}
                onChange={(e) => setLinkToDuplicate(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="linkToDuplicate" className="text-sm font-medium text-gray-700">
                Link to existing query (for duplicates)
              </label>
            </div>

            {linkToDuplicate && (
              <div className="space-y-3">
                {/* Search Box */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by customer name, email, or subject..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Search Results */}
                {searching && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="text-sm text-gray-600 mt-2">Searching...</p>
                  </div>
                )}

                {!searching && searchResults.length > 0 && (
                  <div className="border border-gray-200 rounded-lg divide-y max-h-64 overflow-y-auto">
                    {searchResults.map((query) => (
                      <button
                        key={query._id}
                        onClick={() => setSelectedQuery(query)}
                        className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                          selectedQuery?._id === query._id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">{query.subject}</h4>
                            <div className="space-y-1 text-sm text-gray-600">
                              <p>From: {typeof query.from === 'object' ? (query.from?.name ? `${query.from.name} <${query.from.email}>` : query.from?.email) : query.from}</p>
                              <p>Date: {new Date(query.receivedAt).toLocaleDateString()}</p>
                              {query.extractedData?.destination && (
                                <p>Destination: {query.extractedData.destination}</p>
                              )}
                            </div>
                          </div>
                          {selectedQuery?._id === query._id && (
                            <CheckCircle className="text-blue-600 flex-shrink-0" size={20} />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <AlertCircle className="mx-auto text-gray-400 mb-2" size={32} />
                    <p className="text-gray-600">No matching queries found</p>
                  </div>
                )}

                {/* Selected Query Info */}
                {selectedQuery && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Link2 className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Will be linked to:</h4>
                        <p className="text-sm text-gray-700">{selectedQuery.subject}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          This email will be marked as duplicate and conversation will be merged
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={18} />
              <div className="text-sm text-gray-700">
                <p className="font-medium mb-1">Note:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Re-categorizing will update the email's category</li>
                  <li>Linking to existing query will merge conversations</li>
                  <li>The original query will show this as a follow-up</li>
                  <li>This action can be undone from the email detail page</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !selectedCategory || (linkToDuplicate && !selectedQuery)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Saving...
              </>
            ) : (
              <>
                <Tag size={18} />
                {linkToDuplicate && selectedQuery ? 'Re-categorize & Link' : 'Re-categorize'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
