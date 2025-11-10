import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

const AISettings = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    openaiApiKey: '',
    model: 'gpt-4-turbo',
    maxTokens: 2000,
    temperature: 0.7,
    enableAI: true
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tenants/settings');
      if (response.success && response.data.aiSettings) {
        setSettings({
          ...settings,
          ...response.data.aiSettings
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load AI settings'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAI = async (enabled) => {
    console.log('🔵 Toggle clicked! New value:', enabled);
    
    // Update local state immediately for UI responsiveness
    setSettings({ ...settings, enableAI: enabled });
    
    // Auto-save to backend
    try {
      const response = await api.patch('/tenants/settings', {
        aiSettings: {
          enableAI: enabled
        }
      });

      if (response.success) {
        setMessage({
          type: 'success',
          text: enabled ? '✅ AI Email Processing Enabled' : '⚠️ AI Email Processing Disabled'
        });
        
        // Clear message after 3 seconds
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('Failed to toggle AI:', error);
      // Revert on error
      setSettings({ ...settings, enableAI: !enabled });
      setMessage({
        type: 'error',
        text: 'Failed to update AI status'
      });
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });

      const response = await api.patch('/tenants/settings', {
        aiSettings: settings
      });

      if (response.success) {
        setMessage({
          type: 'success',
          text: 'AI settings saved successfully!'
        });
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to save AI settings'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setMessage({ type: 'info', text: 'Testing OpenAI connection...' });
      
      // Simple test to verify API key works
      const response = await api.post('/tenants/test-openai', {
        apiKey: settings.openaiApiKey,
        model: settings.model
      });

      if (response.success) {
        setMessage({
          type: 'success',
          text: '✅ OpenAI connection successful!'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: '❌ OpenAI connection failed. Please check your API key.'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
            <span className="mr-2">🤖</span>
            AI Configuration
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Configure OpenAI settings for automated email processing
          </p>
        </div>

        {/* Alert Messages */}
        {message.text && (
          <div className={`mx-6 mt-4 p-4 rounded-md ${
            message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
            message.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
            'bg-blue-50 border border-blue-200 text-blue-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Form */}
        <div className="px-6 py-6 space-y-6">
          {/* Enable AI Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Enable AI Email Processing
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Turn on/off automated email processing with AI
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableAI}
                onChange={(e) => handleToggleAI(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* OpenAI API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              OpenAI API Key *
            </label>
            <input
              type="password"
              value={settings.openaiApiKey}
              onChange={(e) => setSettings({ ...settings, openaiApiKey: e.target.value })}
              placeholder="sk-..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!settings.enableAI}
            />
            <p className="text-xs text-gray-500 mt-1">
              Get your API key from{' '}
              <a 
                href="https://platform.openai.com/api-keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                OpenAI Platform
              </a>
            </p>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model
            </label>
            <select
              value={settings.model}
              onChange={(e) => setSettings({ ...settings, model: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!settings.enableAI}
            >
              <option value="gpt-4-turbo">GPT-4 Turbo (Recommended)</option>
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Faster, Cheaper)</option>
              <option value="gpt-3.5-turbo-16k">GPT-3.5 Turbo 16K</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              GPT-4 Turbo offers the best accuracy for email processing
            </p>
          </div>

          {/* Max Tokens */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Tokens
              <span className="ml-2 text-sm font-normal text-gray-500">
                (Current: {settings.maxTokens})
              </span>
            </label>
            <input
              type="range"
              min="500"
              max="4000"
              step="100"
              value={settings.maxTokens}
              onChange={(e) => setSettings({ ...settings, maxTokens: parseInt(e.target.value) })}
              className="w-full"
              disabled={!settings.enableAI}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>500 (Minimal)</span>
              <span>2000 (Balanced)</span>
              <span>4000 (Maximum)</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Maximum response length. Higher values cost more but allow more detailed analysis.
            </p>
          </div>

          {/* Temperature */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Temperature
              <span className="ml-2 text-sm font-normal text-gray-500">
                (Current: {settings.temperature})
              </span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.temperature}
              onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
              className="w-full"
              disabled={!settings.enableAI}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0 (Focused)</span>
              <span>0.5 (Balanced)</span>
              <span>1 (Creative)</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Controls randomness. Lower = more focused and deterministic. Recommended: 0.7
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 How AI Email Processing Works</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Automatically categorizes incoming emails (Customer, Supplier, Agent, Finance)</li>
              <li>• Extracts travel requirements and generates quote data</li>
              <li>• Detects duplicates and identifies priority emails</li>
              <li>• Creates draft quotes ready for review</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={saving || !settings.enableAI}
              className={`flex-1 px-6 py-3 rounded-md font-medium transition-colors ${
                saving || !settings.enableAI
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {saving ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                '💾 Save AI Settings'
              )}
            </button>

            <button
              onClick={handleTestConnection}
              disabled={!settings.openaiApiKey || !settings.enableAI}
              className={`px-6 py-3 rounded-md font-medium transition-colors ${
                !settings.openaiApiKey || !settings.enableAI
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              🧪 Test Connection
            </button>
          </div>
        </div>
      </div>

      {/* Cost Information */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-yellow-900 mb-2">💰 Pricing Information</h4>
        <div className="text-xs text-yellow-800 space-y-1">
          <p><strong>GPT-4 Turbo:</strong> $0.01/1K input tokens, $0.03/1K output tokens</p>
          <p><strong>GPT-4:</strong> $0.03/1K input tokens, $0.06/1K output tokens</p>
          <p><strong>GPT-3.5 Turbo:</strong> $0.0005/1K input tokens, $0.0015/1K output tokens</p>
          <p className="mt-2 text-yellow-900">
            <strong>Estimated cost per email:</strong> $0.02 - $0.10 depending on model and email length
          </p>
        </div>
      </div>
    </div>
  );
};

export default AISettings;
