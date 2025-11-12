import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { FiCopy, FiCheck, FiShare2, FiLock, FiCalendar, FiEye } from 'react-icons/fi';
import Modal from './Modal';
import api from '../services/api';

const ShareModal = ({ isOpen, onClose, entity, entityType }) => {
  const [password, setPassword] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [existingTokens, setExistingTokens] = useState([]);
  const [showExisting, setShowExisting] = useState(false);

  // Generate share token mutation
  const generateMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/share/generate', data);
      return response;
    },
    onSuccess: (data) => {
      const url = data.data.shareUrl || 
        `${window.location.origin}/share/${entityType}/${data.data.token}`;
      setShareUrl(url);
      toast.success('Share link generated successfully!');
      loadExistingTokens();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to generate share link');
    },
  });

  // Load existing tokens
  const loadExistingTokens = async () => {
    try {
      // Capitalize first letter for backend (Booking, Quote, Itinerary)
      const capitalizedType = entityType.charAt(0).toUpperCase() + entityType.slice(1);
      const response = await api.get(`/share/${capitalizedType}/${entity._id}`);
      setExistingTokens(response.data.tokens || []);
    } catch (error) {
      console.error('Failed to load existing tokens:', error);
    }
  };

  // Deactivate token
  const deactivateMutation = useMutation({
    mutationFn: async (tokenId) => {
      const response = await api.delete(`/share/${tokenId}`);
      return response;
    },
    onSuccess: () => {
      toast.success('Share link deactivated');
      loadExistingTokens();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to deactivate link');
    },
  });

  const handleGenerate = () => {
    // Capitalize first letter for backend (Booking, Quote, Itinerary)
    const capitalizedType = entityType.charAt(0).toUpperCase() + entityType.slice(1);
    
    generateMutation.mutate({
      entityType: capitalizedType,
      entityId: entity._id,
      expiresInDays: parseInt(expiresInDays),
      password: usePassword ? password : undefined,
      allowedActions: entityType === 'quote' 
        ? ['view', 'accept', 'reject'] 
        : ['view', 'download'],
      requireEmail: entityType === 'quote',
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handleDeactivate = (tokenId) => {
    if (confirm('Are you sure you want to deactivate this share link?')) {
      deactivateMutation.mutate(tokenId);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Share ${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Entity Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Sharing: {entity?.title || entity?.bookingNumber || entity?.quoteNumber || 'Item'}
          </h3>
          <p className="text-xs text-gray-600">
            {entity?.customer?.name || 'No customer'}
          </p>
        </div>

        {!shareUrl ? (
          // Generate Form
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiCalendar className="inline mr-2" />
                Link Expiration
              </label>
              <select
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
                <option value="60">60 days</option>
                <option value="90">90 days</option>
              </select>
            </div>

            <div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={usePassword}
                  onChange={(e) => setUsePassword(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  <FiLock className="inline mr-2" />
                  Password protect this link
                </span>
              </label>
            </div>

            {usePassword && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Recipients will need this password to view the {entityType}
                </p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <FiEye className="inline mr-2" />
                {entityType === 'quote' 
                  ? 'Recipients can view and respond to this quote directly from the link.'
                  : `Recipients can view this ${entityType} without logging in.`}
              </p>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generateMutation.isPending || (usePassword && !password)}
              className="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiShare2 className="mr-2" />
              {generateMutation.isPending ? 'Generating...' : 'Generate Share Link'}
            </button>

            <button
              onClick={() => {
                setShowExisting(true);
                loadExistingTokens();
              }}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none"
            >
              View Existing Links
            </button>
          </div>
        ) : (
          // Success View
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <FiCheck className="text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-800">
                  Share link generated successfully!
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Share Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm"
                />
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
                >
                  {copied ? <FiCheck className="mr-2" /> : <FiCopy className="mr-2" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Expires in {expiresInDays} days • {usePassword ? 'Password protected' : 'No password'}
              </p>
            </div>

            {usePassword && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <FiLock className="inline mr-2" />
                  Don't forget to share the password: <strong>{password}</strong>
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShareUrl('');
                  setPassword('');
                  setUsePassword(false);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Generate Another
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Existing Tokens */}
        {showExisting && existingTokens.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Existing Share Links</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {existingTokens.map((token) => (
                <div
                  key={token._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-xs font-mono text-gray-600">
                        ...{token.token.slice(-8)}
                      </code>
                      {token.password && (
                        <FiLock className="text-yellow-600" size={12} />
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Created {formatDate(token.createdAt)} • 
                      Expires {formatDate(token.expiresAt)} • 
                      {token.viewCount} views
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeactivate(token._id)}
                    disabled={!token.isActive}
                    className={`px-3 py-1 text-xs rounded ${
                      token.isActive
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {token.isActive ? 'Deactivate' : 'Inactive'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ShareModal;
