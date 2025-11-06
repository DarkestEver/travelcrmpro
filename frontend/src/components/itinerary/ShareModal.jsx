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
    expiryDays: 30,
    password: ''
  });

  const generateLinkMutation = useMutation({
    mutationFn: (options) => itinerariesAPI.generateShareLink(itineraryId, options),
    onSuccess: (data) => {
      // Transform backend response to match expected format
      const linkData = {
        url: data.shareUrl,
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
      toast.error(error.response?.data?.message || 'Failed to generate share link');
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
                value={formData.expiryDays}
                onChange={(e) => setFormData({ ...formData, expiryDays: parseInt(e.target.value) })}
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
