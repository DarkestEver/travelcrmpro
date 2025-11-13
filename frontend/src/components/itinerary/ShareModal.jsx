import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import Modal from '../Modal';
import { FiCopy, FiCheck, FiX } from 'react-icons/fi';
import { itinerariesAPI } from '../../services/apiEndpoints';

const ShareModal = ({ isOpen, onClose, itineraryId }) => {
  const [shareLink, setShareLink] = useState(null);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    expiresInDays: 30,
    password: '',
    singleUse: false
  });

  const generateLinkMutation = useMutation({
    mutationFn: async (options) => {
      console.log('Generating share link with options:', options);
      const result = await itinerariesAPI.generateShareLink(itineraryId, options);
      console.log('Share link raw result:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('Share link response data:', data);
      console.log('Share link response type:', typeof data);
      console.log('Share link response keys:', data ? Object.keys(data) : 'no keys');
      
      // Handle case where data might be undefined or null
      if (!data) {
        toast.error('No data received from server. Please restart the backend server.');
        return;
      }
      
      // Construct URL from frontend to get correct domain
      const shareUrl = `${window.location.origin}/share/itinerary/${data.token}`;
      
      // Transform backend response to match expected format
      const linkData = {
        url: shareUrl,
        token: data.token,
        expiresAt: data.expiresAt,
        isPasswordProtected: data.hasPassword,
        viewCount: 0
      };
      setShareLink(linkData);
      toast.success('Share link generated successfully');
    },
    onError: (error) => {
      console.error('Share link error:', error);
      console.error('Error response:', error.response);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to generate share link';
      toast.error(errorMessage);
    }
  });

  const handleGenerate = () => {
    generateLinkMutation.mutate(formData);
  };

  const handleCopy = () => {
    if (shareLink?.url) {
      navigator.clipboard.writeText(shareLink.url);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Share Itinerary</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        {!shareLink ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Link Expiry (Days)
              </label>
              <select
                value={formData.expiresInDays}
                onChange={(e) => setFormData({ ...formData, expiresInDays: parseInt(e.target.value) })}
                className="input"
              >
                <option value="1">1 Day</option>
                <option value="7">7 Days</option>
                <option value="30">30 Days</option>
                <option value="90">90 Days</option>
                <option value="365">1 Year</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password Protection (Optional)
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input"
                placeholder="Leave empty for no password"
              />
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.singleUse}
                  onChange={(e) => setFormData({ ...formData, singleUse: e.target.checked })}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">
                  🔒 Single-use link (expires after first access)
                </span>
              </label>
              {formData.singleUse && (
                <p className="text-xs text-amber-600 mt-1 ml-6">
                  ⚠️ Warning: This link will become invalid after being accessed once
                </p>
              )}
            </div>

            <button
              onClick={handleGenerate}
              className="btn btn-primary w-full"
              disabled={generateLinkMutation.isLoading}
            >
              {generateLinkMutation.isLoading ? 'Generating...' : 'Generate Share Link'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800 mb-2">✓ Share link generated successfully!</p>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={shareLink.url}
                  readOnly
                  className="input flex-1"
                />
                <button
                  onClick={handleCopy}
                  className="btn btn-secondary flex items-center"
                >
                  {copied ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <p>• Link expires on: {new Date(shareLink.expiresAt).toLocaleDateString()}</p>
              {shareLink.isPasswordProtected && <p>• Password protected</p>}
              <p>• Views: {shareLink.viewCount || 0}</p>
            </div>

            <button
              onClick={() => {
                setShareLink(null);
                setFormData({ expiryDays: 30, password: '' });
              }}
              className="btn btn-secondary w-full"
            >
              Generate New Link
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ShareModal;
