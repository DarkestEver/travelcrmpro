import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Mail, Plus, Trash2, TestTube, CheckCircle, XCircle, 
  Clock, AlertCircle, Star, X, Edit
} from 'lucide-react';
import toast from 'react-hot-toast';
import emailAccountsAPI from '../../services/emailAccountsAPI';

// Provider Presets
const PROVIDER_PRESETS = {
  gmail: {
    name: 'Gmail',
    imap: { host: 'imap.gmail.com', port: 993, secure: true },
    smtp: { host: 'smtp.gmail.com', port: 587, secure: false }
  },
  outlook: {
    name: 'Outlook/Hotmail',
    imap: { host: 'outlook.office365.com', port: 993, secure: true },
    smtp: { host: 'smtp.office365.com', port: 587, secure: false }
  },
  zoho: {
    name: 'Zoho Mail',
    imap: { host: 'imap.zoho.com', port: 993, secure: true },
    smtp: { host: 'smtp.zoho.com', port: 587, secure: false }
  },
  smtp: {
    name: 'Custom SMTP/IMAP',
    imap: { host: '', port: 993, secure: true },
    smtp: { host: '', port: 587, secure: false }
  }
};

export default function EmailAccounts() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, name }
  const [testingIMAP, setTestingIMAP] = useState(null);
  const [testingSMTP, setTestingSMTP] = useState(null);
  
  // Fetch email accounts
  const { data: accounts, isLoading, error, refetch } = useQuery({
    queryKey: ['emailAccounts'],
    queryFn: emailAccountsAPI.getAll,
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache
  });
  
  // Debug logging
  React.useEffect(() => {
    if (accounts) {
      console.log('Email Accounts Data:', accounts);
      // Handle both response formats: direct array or {success, count, data}
      const accountsList = Array.isArray(accounts) ? accounts : accounts?.data;
      console.log('Accounts Array:', accountsList);
    }
    if (error) {
      console.error('Email Accounts Error:', error);
    }
  }, [accounts, error]);
  
  // Normalize accounts data - handle both array and object response
  const accountsList = React.useMemo(() => {
    if (!accounts) return [];
    // If accounts is already an array, use it directly
    if (Array.isArray(accounts)) return accounts;
    // If accounts is an object with data property, use that
    if (accounts.data && Array.isArray(accounts.data)) return accounts.data;
    // Fallback to empty array
    return [];
  }, [accounts]);
  
  const accountsCount = React.useMemo(() => {
    if (Array.isArray(accounts)) return accounts.length;
    return accounts?.count || accountsList.length;
  }, [accounts, accountsList]);
  
  // Add account mutation
  const addMutation = useMutation({
    mutationFn: emailAccountsAPI.create,
    onSuccess: (data) => {
      console.log('Account created successfully:', data);
      queryClient.invalidateQueries(['emailAccounts']);
      setShowAddForm(false);
      toast.success('Email account added successfully!');
    },
    onError: (error) => {
      console.error('Error creating account:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to add account');
    }
  });
  
  // Edit account mutation
  const editMutation = useMutation({
    mutationFn: ({ id, data }) => emailAccountsAPI.update(id, data),
    onSuccess: (data) => {
      console.log('Account updated successfully:', data);
      queryClient.invalidateQueries(['emailAccounts']);
      setEditingAccount(null);
      toast.success('Email account updated successfully!');
    },
    onError: (error) => {
      console.error('Error updating account:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to update account');
    }
  });
  
  // Delete account mutation
  const deleteMutation = useMutation({
    mutationFn: emailAccountsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['emailAccounts']);
      toast.success('Email account deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to delete account');
    }
  });
  
  // Test IMAP mutation
  const testIMAPMutation = useMutation({
    mutationFn: emailAccountsAPI.testIMAP,
    onSuccess: (response) => {
      setTestingIMAP(null);
      queryClient.invalidateQueries(['emailAccounts']);
      console.log('🔍 IMAP Raw Response:', response);
      console.log('🔍 IMAP Response Type:', typeof response);
      console.log('🔍 IMAP Response Keys:', Object.keys(response || {}));
      
      // The response from API is already unwrapped by axios
      if (response && response.success) {
        toast.success(
          `IMAP Connection Successful!\nHost: ${response.details?.host}\nPort: ${response.details?.port}`,
          { duration: 4000 }
        );
      } else {
        toast.error(response?.error || response?.message || 'IMAP connection failed');
      }
    },
    onError: (error) => {
      setTestingIMAP(null);
      console.error('❌ IMAP test error:', error);
      toast.error(error.response?.data?.message || error.message || 'IMAP test failed');
    }
  });
  
  // Test SMTP mutation
  const testSMTPMutation = useMutation({
    mutationFn: emailAccountsAPI.testSMTP,
    onSuccess: (response) => {
      setTestingSMTP(null);
      queryClient.invalidateQueries(['emailAccounts']);
      console.log('🔍 SMTP Raw Response:', response);
      console.log('🔍 SMTP Response Type:', typeof response);
      console.log('🔍 SMTP Response Keys:', Object.keys(response || {}));
      
      // The response from API is already unwrapped by axios
      if (response && response.success) {
        toast.success(
          `SMTP Connection Successful!\nHost: ${response.details?.host}\nPort: ${response.details?.port}`,
          { duration: 4000 }
        );
      } else {
        toast.error(response?.error || response?.message || 'SMTP connection failed');
      }
    },
    onError: (error) => {
      setTestingSMTP(null);
      console.error('❌ SMTP test error:', error);
      toast.error(error.response?.data?.message || error.message || 'SMTP test failed');
    }
  });
  
  const handleTestIMAP = (accountId) => {
    console.log('🔵 handleTestIMAP called with accountId:', accountId);
    setTestingIMAP(accountId);
    testIMAPMutation.mutate(accountId);
  };
  
  const handleTestSMTP = (accountId) => {
    console.log('🟢 handleTestSMTP called with accountId:', accountId);
    setTestingSMTP(accountId);
    testSMTPMutation.mutate(accountId);
  };
  
  const handleSetPrimary = async (accountId) => {
    try {
      await emailAccountsAPI.setPrimary(accountId);
      queryClient.invalidateQueries(['emailAccounts']);
      toast.success('Primary email account updated!');
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to set primary account');
    }
  };
  
  if (isLoading) {
    console.log('⏳ Loading email accounts...');
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading email accounts...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    console.error('❌ Error loading accounts:', error);
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold mb-2">Error Loading Email Accounts</h3>
          <p className="text-red-600">{error.response?.data?.message || error.message}</p>
          <button
            onClick={() => queryClient.invalidateQueries(['emailAccounts'])}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  console.log('🎨 Rendering accounts. Data:', {
    accounts,
    isArray: Array.isArray(accounts),
    accountsList,
    accountsListLength: accountsList.length,
    count: accountsCount,
    firstAccount: accountsList[0]?.accountName
  });
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-3 bg-gray-100 rounded text-xs flex justify-between items-center">
          <div>
            <strong>Debug:</strong> Total accounts: {accountsCount} | 
            Data length: {accountsList.length} | 
            Type: {Array.isArray(accounts) ? 'Array' : 'Object'}
          </div>
          <button
            onClick={() => refetch()}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            🔄 Force Refresh
          </button>
        </div>
      )}
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Accounts</h1>
          <p className="text-gray-600 mt-1">
            Manage multiple email accounts for sending and receiving emails
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Email Account
        </button>
      </div>
      
      {/* Add Form Modal */}
      {showAddForm && (
        <AddEmailAccountForm
          onClose={() => setShowAddForm(false)}
          onSubmit={(data) => addMutation.mutate(data)}
          isSubmitting={addMutation.isPending}
        />
      )}
      
      {/* Edit Form Modal */}
      {editingAccount && (
        <EditEmailAccountForm
          account={editingAccount}
          onClose={() => setEditingAccount(null)}
          onSubmit={(data) => editMutation.mutate({ id: editingAccount._id, data })}
          isSubmitting={editMutation.isPending}
        />
      )}
      
      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="text-red-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete Email Account</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete <strong>"{deleteConfirm.name}"</strong>? 
              All associated data and settings will be permanently removed.
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={deleteMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteMutation.mutate(deleteConfirm.id);
                  setDeleteConfirm(null);
                }}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Email Accounts List */}
      <div className="space-y-4">
        {(() => {
          console.log('🔍 Checking accounts for rendering:', {
            accountsExists: !!accounts,
            accountsListLength: accountsList.length,
            condition: accountsList.length > 0,
            firstAccount: accountsList[0]?.accountName
          });
          
          if (accountsList.length > 0) {
            console.log('✅ Rendering', accountsList.length, 'accounts');
            return accountsList.map((account) => {
              console.log('  → Rendering account:', {
                id: account._id,
                name: account.accountName,
                email: account.email,
                imapPort: account.imap?.port,
                smtpPort: account.smtp?.port
              });
              return (
                <EmailAccountCard
                  key={account._id}
                  account={account}
                  onTestIMAP={() => handleTestIMAP(account._id)}
                  onTestSMTP={() => handleTestSMTP(account._id)}
                  onSetPrimary={() => handleSetPrimary(account._id)}
                  onEdit={() => setEditingAccount(account)}
                  onDelete={() => setDeleteConfirm({ id: account._id, name: account.accountName })}
                  testingIMAP={testingIMAP === account._id}
                  testingSMTP={testingSMTP === account._id}
                />
              );
            });
          } else {
            console.log('❌ Showing empty state. accountsList.length:', accountsList.length);
            return (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Mail size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Email Accounts
                </h3>
                <p className="text-gray-600 mb-4">
                  Add your first email account to start sending and receiving emails
                </p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Email Account
                </button>
              </div>
            );
          }
        })()}
      </div>
    </div>
  );
}

// Email Account Card Component
function EmailAccountCard({ 
  account, 
  onTestIMAP, 
  onTestSMTP, 
  onSetPrimary,
  onEdit,
  onDelete,
  testingIMAP,
  testingSMTP
}) {
  const getStatusBadge = (status) => {
    const styles = {
      success: { icon: CheckCircle, color: 'text-green-600 bg-green-100', text: 'Connected' },
      failed: { icon: XCircle, color: 'text-red-600 bg-red-100', text: 'Failed' },
      pending: { icon: Clock, color: 'text-yellow-600 bg-yellow-100', text: 'Testing' },
      not_tested: { icon: AlertCircle, color: 'text-gray-600 bg-gray-100', text: 'Not Tested' }
    };
    
    const style = styles[status] || styles.not_tested;
    const Icon = style.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${style.color}`}>
        <Icon size={14} />
        {style.text}
      </span>
    );
  };
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Mail className="text-blue-600" size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-semibold text-gray-900">
                {account.accountName}
              </h3>
              {account.isPrimary && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                  <Star size={12} fill="currentColor" />
                  Primary
                </span>
              )}
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                {PROVIDER_PRESETS[account.provider]?.name || account.provider.toUpperCase()}
              </span>
            </div>
            <p className="text-gray-600 mt-1">{account.email}</p>
            <p className="text-sm text-gray-500 mt-1">
              Purpose: <span className="font-medium">{account.purpose}</span> • 
              Received: <span className="font-medium">{account.stats?.emailsReceived || 0}</span> • 
              Sent: <span className="font-medium">{account.stats?.emailsSent || 0}</span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Account"
          >
            <Edit size={18} />
          </button>
          {!account.isPrimary && (
            <button
              onClick={onSetPrimary}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Set as Primary"
            >
              <Star size={18} />
            </button>
          )}
          <button
            onClick={onDelete}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={account.isPrimary ? "Cannot delete primary account" : "Delete"}
            disabled={account.isPrimary}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
      
      {/* Connection Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* IMAP Status */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">IMAP (Receive)</h4>
            {getStatusBadge(account.imap?.lastTestStatus || 'not_tested')}
          </div>
          <p className="text-sm text-gray-600 mb-2">
            {account.imap?.host}:{account.imap?.port}
          </p>
          {account.imap?.lastTestError && (
            <p className="text-xs text-red-600 mb-2 p-2 bg-red-50 rounded">
              {account.imap.lastTestError}
            </p>
          )}
          <button
            onClick={onTestIMAP}
            disabled={testingIMAP || !account.imap?.enabled}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <TestTube size={16} />
            {testingIMAP ? 'Testing...' : 'Test IMAP'}
          </button>
        </div>
        
        {/* SMTP Status */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">SMTP (Send)</h4>
            {getStatusBadge(account.smtp?.lastTestStatus || 'not_tested')}
          </div>
          <p className="text-sm text-gray-600 mb-2">
            {account.smtp?.host}:{account.smtp?.port}
          </p>
          {account.smtp?.lastTestError && (
            <p className="text-xs text-red-600 mb-2 p-2 bg-red-50 rounded">
              {account.smtp.lastTestError}
            </p>
          )}
          <button
            onClick={onTestSMTP}
            disabled={testingSMTP || !account.smtp?.enabled}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <TestTube size={16} />
            {testingSMTP ? 'Testing...' : 'Test SMTP'}
          </button>
        </div>
      </div>
      
      {/* Last Tested Info */}
      {(account.imap?.lastTestedAt || account.smtp?.lastTestedAt) && (
        <div className="mt-4 text-xs text-gray-500 text-right">
          Last tested: {new Date(account.imap?.lastTestedAt || account.smtp?.lastTestedAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}

// Add Email Account Form Component
function AddEmailAccountForm({ onClose, onSubmit, isSubmitting }) {
  const [formData, setFormData] = useState({
    accountName: '',
    email: '',
    provider: 'gmail',
    purpose: 'general',
    isPrimary: false,
    imap: {
      enabled: true,
      host: 'imap.gmail.com',
      port: 993,
      secure: true,
      username: '',
      password: '',
      pollingInterval: 300 // Default 5 minutes (300 seconds)
    },
    smtp: {
      enabled: true,
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      username: '',
      password: '',
      fromName: ''
    }
  });
  
  const handleProviderChange = (provider) => {
    const preset = PROVIDER_PRESETS[provider];
    setFormData({
      ...formData,
      provider,
      imap: {
        ...formData.imap,
        host: preset.imap.host,
        port: preset.imap.port,
        secure: preset.imap.secure
      },
      smtp: {
        ...formData.smtp,
        host: preset.smtp.host,
        port: preset.smtp.port,
        secure: preset.smtp.secure
      }
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Set username from email if not set
    const submitData = {
      ...formData,
      imap: {
        ...formData.imap,
        username: formData.imap.username || formData.email
      },
      smtp: {
        ...formData.smtp,
        username: formData.smtp.username || formData.email
      }
    };
    
    onSubmit(submitData);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-xl font-bold">Add Email Account</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Name *
            </label>
            <input
              type="text"
              required
              value={formData.accountName}
              onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
              placeholder="e.g., Support Gmail"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="support@company.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Provider *
            </label>
            <select
              value={formData.provider}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Object.entries(PROVIDER_PRESETS).map(([key, preset]) => (
                <option key={key} value={key}>{preset.name}</option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purpose
              </label>
              <select
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="general">General</option>
                <option value="support">Support</option>
                <option value="sales">Sales</option>
                <option value="finance">Finance</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isPrimary}
                  onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Set as Primary</span>
              </label>
            </div>
          </div>
          
          {/* IMAP Settings */}
          <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
            <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Mail size={18} className="text-blue-600" />
              IMAP Settings (Receive Emails)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Host *</label>
                <input
                  type="text"
                  required
                  value={formData.imap.host}
                  onChange={(e) => setFormData({
                    ...formData,
                    imap: { ...formData.imap, host: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Port *</label>
                <input
                  type="number"
                  required
                  value={formData.imap.port}
                  onChange={(e) => setFormData({
                    ...formData,
                    imap: { ...formData.imap, port: parseInt(e.target.value) }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                <input
                  type="password"
                  required
                  value={formData.imap.password}
                  onChange={(e) => setFormData({
                    ...formData,
                    imap: { ...formData.imap, password: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Email password or app-specific password"
                />
                <p className="text-xs text-gray-500 mt-1">
                  For Gmail, use App Password. For Outlook, use account password.
                </p>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Polling Interval (seconds) *
                </label>
                <input
                  type="number"
                  required
                  min="60"
                  max="3600"
                  value={formData.imap.pollingInterval || 300}
                  onChange={(e) => setFormData({
                    ...formData,
                    imap: { ...formData.imap, pollingInterval: parseInt(e.target.value) }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  How often to check for new emails (300 seconds = 5 minutes). Minimum: 60 seconds.
                </p>
              </div>
            </div>
          </div>
          
          {/* SMTP Settings */}
          <div className="border border-gray-200 rounded-lg p-4 bg-green-50">
            <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Mail size={18} className="text-green-600" />
              SMTP Settings (Send Emails)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Host *</label>
                <input
                  type="text"
                  required
                  value={formData.smtp.host}
                  onChange={(e) => setFormData({
                    ...formData,
                    smtp: { ...formData.smtp, host: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Port *</label>
                <input
                  type="number"
                  required
                  value={formData.smtp.port}
                  onChange={(e) => setFormData({
                    ...formData,
                    smtp: { ...formData.smtp, port: parseInt(e.target.value) }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                <input
                  type="password"
                  required
                  value={formData.smtp.password}
                  onChange={(e) => setFormData({
                    ...formData,
                    smtp: { ...formData.smtp, password: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Email password or app-specific password"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">From Name (Optional)</label>
                <input
                  type="text"
                  value={formData.smtp.fromName}
                  onChange={(e) => setFormData({
                    ...formData,
                    smtp: { ...formData.smtp, fromName: e.target.value }
                  })}
                  placeholder="Company Support Team"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
          </div>
          
          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Adding...' : 'Add Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Email Account Form Component
function EditEmailAccountForm({ account, onClose, onSubmit, isSubmitting }) {
  const [formData, setFormData] = useState({
    accountName: account.accountName || '',
    purpose: account.purpose || 'general',
    isPrimary: account.isPrimary || false,
    imap: {
      enabled: account.imap?.enabled !== false,
      host: account.imap?.host || '',
      port: account.imap?.port || 993,
      secure: account.imap?.secure !== false,
      username: account.imap?.username || account.email || '',
      password: '', // Don't prefill password for security
      pollingInterval: account.imap?.pollingInterval || 300
    },
    smtp: {
      enabled: account.smtp?.enabled !== false,
      host: account.smtp?.host || '',
      port: account.smtp?.port || 587,
      secure: account.smtp?.secure || false,
      username: account.smtp?.username || account.email || '',
      password: '', // Don't prefill password for security
      fromName: account.smtp?.fromName || ''
    }
  });
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Only include password if it was changed (not empty)
    const submitData = {
      accountName: formData.accountName,
      purpose: formData.purpose,
      isPrimary: formData.isPrimary,
      imap: {
        ...formData.imap,
        username: formData.imap.username || account.email
      },
      smtp: {
        ...formData.smtp,
        username: formData.smtp.username || account.email
      }
    };
    
    // Only include passwords if they were provided
    if (!formData.imap.password) {
      delete submitData.imap.password;
    }
    if (!formData.smtp.password) {
      delete submitData.smtp.password;
    }
    
    onSubmit(submitData);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
          <div>
            <h2 className="text-xl font-bold">Edit Email Account</h2>
            <p className="text-sm text-gray-600 mt-1">{account.email}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Name *
            </label>
            <input
              type="text"
              required
              value={formData.accountName}
              onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
              placeholder="e.g., Support Gmail"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purpose
              </label>
              <select
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="general">General</option>
                <option value="support">Support</option>
                <option value="sales">Sales</option>
                <option value="finance">Finance</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isPrimary}
                  onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Set as Primary</span>
              </label>
            </div>
          </div>
          
          {/* IMAP Settings */}
          <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
            <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Mail size={18} className="text-blue-600" />
              IMAP Settings (Receive Emails)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Host *</label>
                <input
                  type="text"
                  required
                  value={formData.imap.host}
                  onChange={(e) => setFormData({
                    ...formData,
                    imap: { ...formData.imap, host: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Port *</label>
                <input
                  type="number"
                  required
                  value={formData.imap.port}
                  onChange={(e) => setFormData({
                    ...formData,
                    imap: { ...formData.imap, port: parseInt(e.target.value) }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.imap.secure}
                    onChange={(e) => setFormData({
                      ...formData,
                      imap: { ...formData.imap, secure: e.target.checked }
                    })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Use SSL/TLS</span>
                </label>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password {formData.imap.password ? '*' : '(leave empty to keep current)'}
                </label>
                <input
                  type="password"
                  value={formData.imap.password}
                  onChange={(e) => setFormData({
                    ...formData,
                    imap: { ...formData.imap, password: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Leave empty to keep current password"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Polling Interval (seconds) *
                </label>
                <input
                  type="number"
                  required
                  min="60"
                  max="3600"
                  value={formData.imap.pollingInterval || 300}
                  onChange={(e) => setFormData({
                    ...formData,
                    imap: { ...formData.imap, pollingInterval: parseInt(e.target.value) }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  How often to check for new emails (300 seconds = 5 minutes). Minimum: 60 seconds.
                </p>
              </div>
            </div>
          </div>
          
          {/* SMTP Settings */}
          <div className="border border-gray-200 rounded-lg p-4 bg-green-50">
            <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Mail size={18} className="text-green-600" />
              SMTP Settings (Send Emails)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Host *</label>
                <input
                  type="text"
                  required
                  value={formData.smtp.host}
                  onChange={(e) => setFormData({
                    ...formData,
                    smtp: { ...formData.smtp, host: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Port *</label>
                <input
                  type="number"
                  required
                  value={formData.smtp.port}
                  onChange={(e) => setFormData({
                    ...formData,
                    smtp: { ...formData.smtp, port: parseInt(e.target.value) }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div className="col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.smtp.secure}
                    onChange={(e) => setFormData({
                      ...formData,
                      smtp: { ...formData.smtp, secure: e.target.checked }
                    })}
                    className="w-4 h-4 text-green-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Use SSL/TLS</span>
                </label>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password {formData.smtp.password ? '*' : '(leave empty to keep current)'}
                </label>
                <input
                  type="password"
                  value={formData.smtp.password}
                  onChange={(e) => setFormData({
                    ...formData,
                    smtp: { ...formData.smtp, password: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Leave empty to keep current password"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">From Name (Optional)</label>
                <input
                  type="text"
                  value={formData.smtp.fromName}
                  onChange={(e) => setFormData({
                    ...formData,
                    smtp: { ...formData.smtp, fromName: e.target.value }
                  })}
                  placeholder="Company Support Team"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
          </div>
          
          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
