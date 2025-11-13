import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Calendar,
  User,
  Tag,
  TrendingUp,
  Package,
  FileText,
  Send,
  Check,
  X,
  AlertCircle,
  DollarSign,
  Clock,
  MapPin,
  Users,
  Plane,
  Reply,
  Edit2,
  Save,
  ChevronDown,
  ChevronUp,
  Paperclip
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import emailAPI from '../../services/emailAPI';
import QuotesTab from '../../components/emails/QuotesTab';
import HTMLEditor from '../../components/emails/HTMLEditor';
import CustomizePackageModal from '../../components/modals/CustomizePackageModal';
import RecategorizeModal from '../../components/emails/RecategorizeModal';

const EmailDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  
  // Reply modal state
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyData, setReplyData] = useState({
    subject: '',
    body: '',
    plainText: '',
    cc: [],
    bcc: [],
    attachments: []
  });
  const [sendingReply, setSendingReply] = useState(false);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [ccInput, setCcInput] = useState('');
  const [bccInput, setBccInput] = useState('');
  const [attachmentFiles, setAttachmentFiles] = useState([]);
  const editorRef = useRef(null);
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [saving, setSaving] = useState(false);
  const [addingToQuote, setAddingToQuote] = useState(null); // Track which package is being added
  
  // Customize package modal state
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [packageToCustomize, setPackageToCustomize] = useState(null);
  
  // Re-categorize modal state
  const [showRecategorizeModal, setShowRecategorizeModal] = useState(false);

  useEffect(() => {
    fetchEmail();
  }, [id]);

  // Debug: Log replyData changes
  useEffect(() => {
    console.log('🔄 replyData state changed:', {
      cc: replyData.cc,
      bcc: replyData.bcc,
      ccLength: replyData.cc?.length,
      bccLength: replyData.bcc?.length
    });
  }, [replyData.cc, replyData.bcc]);

  const fetchEmail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await emailAPI.getEmailById(id);
      console.log('📧 Email API Response:', data);
      
      // The response is already unwrapped by api.js interceptor
      // So data = { success: true, data: {...} }
      if (data.success && data.data) {
        setEmail(data.data);
      } else if (data._id) {
        // Sometimes it might return the email object directly
        setEmail(data);
      } else {
        console.error('❌ Email not found or no data:', data);
        setError(data.message || 'Email not found');
        // Don't auto-redirect, let user see the error and choose to go back
      }
    } catch (error) {
      console.error('❌ Failed to fetch email:', error);
      console.error('Error response:', error.response);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to load email';
      setError(errorMsg);
      toast.error(errorMsg);
      // Don't auto-redirect, let user see the error
    } finally {
      setLoading(false);
    }
  };

  const handleCategorize = async () => {
    // Open re-categorize modal
    setShowRecategorizeModal(true);
  };

  const handleExtract = async () => {
    try {
      setProcessing(true);
      const type = email.category === 'CUSTOMER' ? 'customer' : 'supplier';
      const response = await emailAPI.extractData(id, type);
      toast.success('Data extracted successfully');
      fetchEmail();
    } catch (error) {
      console.error('Failed to extract data:', error);
      toast.error('Failed to extract data');
    } finally {
      setProcessing(false);
    }
  };

  const handleMatch = async () => {
    try {
      setProcessing(true);
      const response = await emailAPI.matchPackages(id);
      
      // Response is { success: true, data: [...matches...] }
      const matches = response.data || response || [];
      const matchCount = Array.isArray(matches) ? matches.length : (matches.length || 0);
      
      toast.success(`Found ${matchCount} matching packages`);
      fetchEmail();
    } catch (error) {
      console.error('Failed to match packages:', error);
      toast.error('Failed to match packages');
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerateResponse = async () => {
    try {
      setProcessing(true);
      const templateType = email.matchingResults?.length > 0 ? 'PACKAGE_FOUND' : 'PACKAGE_NOT_FOUND';
      const response = await emailAPI.generateResponse(id, templateType);
      toast.success('Response generated successfully');
      fetchEmail();
    } catch (error) {
      console.error('Failed to generate response:', error);
      toast.error('Failed to generate response');
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenReplyModal = () => {
    // Create the original email section with proper formatting
    const originalEmailHtml = `
      <div style="margin-top: 40px; padding-top: 20px; border-top: 2px dashed #999;">
        <p style="color: #666; font-size: 11px; margin-bottom: 15px; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">
          <strong>From:</strong> ${email.from?.name || email.from?.email}<br/>
          <strong>Date:</strong> ${new Date(email.receivedAt).toLocaleString()}<br/>
          <strong>Subject:</strong> ${email.subject}
        </p>
        <div style="color: #333;">
          ${email.bodyHtml || email.bodyText || ''}
        </div>
      </div>
    `;

    // If there's a generated response, use it at the top with blank lines below
    // Otherwise, just put blank lines at the top for user to start typing
    let replyBody;
    if (email.generatedResponse?.body) {
      // Blank lines at top for typing + AI generated response + spacing + original email at bottom
      replyBody = '<p><br/></p><p><br/></p><p><br/></p><p><br/></p><p><br/></p>' + email.generatedResponse.body + '<p><br/></p><p><br/></p><p><br/></p>' + originalEmailHtml;
    } else {
      // Just blank space at top + original email at bottom
      replyBody = '<p><br/></p><p><br/></p><p><br/></p><p><br/></p><p><br/></p>' + originalEmailHtml;
    }
    
    setReplyData({
      subject: `Re: ${email.subject}`,
      body: replyBody,
      plainText: email.generatedResponse?.plainText || '',
      cc: [],
      bcc: [],
      attachments: []
    });
    setShowCcBcc(false);
    setCcInput('');
    setBccInput('');
    setAttachmentFiles([]);
    setShowReplyModal(true);
    
    console.log('🔓 Reply modal opened with initial data:', {
      subject: `Re: ${email.subject}`,
      cc: [],
      bcc: [],
      attachments: []
    });
  };

  const handleAddCC = () => {
    console.log('🔵 handleAddCC called, ccInput:', ccInput);
    if (ccInput.trim()) {
      // Split by comma, semicolon, or colon
      const emails = ccInput
        .split(/[,;:]/)
        .map(e => e.trim())
        .filter(e => e && e.includes('@'));
      console.log('🔵 Parsed emails:', emails);
      console.log('🔵 Current replyData.cc:', replyData.cc);
      const newCC = [...replyData.cc, ...emails];
      console.log('🔵 New CC array:', newCC);
      setReplyData({
        ...replyData,
        cc: newCC
      });
      setCcInput('');
    } else {
      console.log('🔴 ccInput is empty or whitespace');
    }
  };

  const handleAddBCC = () => {
    console.log('🔵 handleAddBCC called, bccInput:', bccInput);
    if (bccInput.trim()) {
      // Split by comma, semicolon, or colon
      const emails = bccInput
        .split(/[,;:]/)
        .map(e => e.trim())
        .filter(e => e && e.includes('@'));
      console.log('🔵 Parsed emails:', emails);
      console.log('🔵 Current replyData.bcc:', replyData.bcc);
      const newBCC = [...replyData.bcc, ...emails];
      console.log('🔵 New BCC array:', newBCC);
      setReplyData({
        ...replyData,
        bcc: newBCC
      });
      setBccInput('');
    } else {
      console.log('🔴 bccInput is empty or whitespace');
    }
  };

  const handleRemoveCC = (index) => {
    setReplyData({
      ...replyData,
      cc: replyData.cc.filter((_, i) => i !== index)
    });
  };

  const handleRemoveBCC = (index) => {
    setReplyData({
      ...replyData,
      bcc: replyData.bcc.filter((_, i) => i !== index)
    });
  };

  const handleAttachmentChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachmentFiles([...attachmentFiles, ...files]);
  };

  const handleRemoveAttachment = (index) => {
    setAttachmentFiles(attachmentFiles.filter((_, i) => i !== index));
  };

  const handleSendReply = async () => {
    if (!replyData.subject || !replyData.body) {
      toast.error('Please fill in subject and body');
      return;
    }

    try {
      setSendingReply(true);
      
      console.log('📤 Frontend - Sending reply with data:', {
        subject: replyData.subject,
        cc: replyData.cc,
        bcc: replyData.bcc,
        hasAttachments: attachmentFiles.length > 0
      });
      
      // Create FormData if there are attachments
      let dataToSend;
      if (attachmentFiles.length > 0) {
        const formData = new FormData();
        formData.append('subject', replyData.subject);
        formData.append('body', replyData.body);
        formData.append('plainText', replyData.plainText || replyData.body.replace(/<[^>]*>/g, ''));
        formData.append('cc', JSON.stringify(replyData.cc));
        formData.append('bcc', JSON.stringify(replyData.bcc));
        
        console.log('📦 FormData CC/BCC:', {
          cc: JSON.stringify(replyData.cc),
          bcc: JSON.stringify(replyData.bcc)
        });
        
        // Add attachments
        attachmentFiles.forEach((file) => {
          formData.append('attachments', file);
        });
        
        dataToSend = formData;
      } else {
        console.log('📨 JSON payload:', replyData);
        dataToSend = replyData;
      }
      
      await emailAPI.replyToEmail(id, dataToSend);
      toast.success('Reply sent successfully!');
      setShowReplyModal(false);
      setAttachmentFiles([]); // Clear attachments
      fetchEmail(); // Refresh to show manuallyReplied flag
    } catch (error) {
      console.error('Failed to send reply:', error);
      toast.error(error.response?.data?.message || 'Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  // Edit mode handlers
  const handleStartEdit = () => {
    setEditedData({ ...email.extractedData });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedData({});
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    try {
      setSaving(true);
      await emailAPI.updateExtractedData(id, editedData);
      toast.success('Extracted data updated successfully');
      setIsEditing(false);
      fetchEmail();
    } catch (error) {
      console.error('Failed to update extracted data:', error);
      toast.error(error.response?.data?.message || 'Failed to update data');
    } finally {
      setSaving(false);
    }
  };

  const handleEditChange = (field, value) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedChange = (parent, field, value) => {
    setEditedData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  const handleAddToQuote = async (match) => {
    // Open customize modal first
    setPackageToCustomize(match);
    setShowCustomizeModal(true);
  };
  
  const handleSaveCustomizedPackage = (customizedPackage) => {
    // Close modal
    setShowCustomizeModal(false);
    
    // Switch to quotes tab and pass the customized package
    setActiveTab('quotes');
    window.selectedMatchForQuote = customizedPackage;
    toast.success('Package customized! Complete the quote and click "Create Quote".');
  };

  // Calculate missing information dynamically
  const getMissingInfo = () => {
    const data = isEditing ? editedData : email.extractedData;
    const missing = [];

    if (!data.destination) {
      missing.push('destination');
    }
    if (!data.dates || (!data.dates.preferredStart && !data.dates.duration)) {
      missing.push('travel dates');
    }
    if (!data.travelers || (data.travelers.adults === 0 && !data.travelers.children && !data.travelers.infants)) {
      missing.push('travelers');
    }
    if (!data.budget || !data.budget.amount) {
      missing.push('budget');
    }

    return missing;
  };

  const getCategoryColor = (category) => {
    const colors = {
      CUSTOMER: 'bg-blue-100 text-blue-800',
      SUPPLIER: 'bg-green-100 text-green-800',
      AGENT: 'bg-purple-100 text-purple-800',
      FINANCE: 'bg-yellow-100 text-yellow-800',
      SPAM: 'bg-red-100 text-red-800',
      OTHER: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.OTHER;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading email...</p>
        </div>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Email Not Found</h2>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          <p className="text-gray-600 mb-4">
            This email may have been deleted, or you don't have permission to view it.
          </p>
          <button
            onClick={() => navigate('/emails')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Emails
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
            onClick={() => navigate('/emails')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Emails
          </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{email.subject}</h1>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {email.from.name || email.from.email}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(email.receivedAt).toLocaleString()}
              </span>
              {email.trackingId && (
                <span className="flex items-center gap-1 bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-mono text-xs">
                  <Clock className="w-3 h-3" />
                  {email.trackingId}
                </span>
              )}
              {email.category && (
                <span className={`px-2 py-1 rounded-full text-xs ${getCategoryColor(email.category)}`}>
                  {email.category}
                </span>
              )}
              {email.categoryConfidence && (
                <span className="text-xs text-gray-500">
                  {email.categoryConfidence}% confidence
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleCategorize}
              disabled={processing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Tag className="w-4 h-4" />
              {email.category ? 'Re-categorize' : 'Categorize'}
            </button>

            {email.category && !email.extractedData && (
              <button
                onClick={handleExtract}
                disabled={processing}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Extract Data
              </button>
            )}

            {email.extractedData && email.category === 'CUSTOMER' && !email.matchingResults?.length && (
              <button
                onClick={handleMatch}
                disabled={processing}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Package className="w-4 h-4" />
                Match Packages
              </button>
            )}

            {email.extractedData && !email.responseGenerated && (
              <button
                onClick={handleGenerateResponse}
                disabled={processing}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Generate Response
              </button>
            )}

            {/* Reply Button - Always available for CUSTOMER emails */}
            {email.category === 'CUSTOMER' && (
              <button
                onClick={handleOpenReplyModal}
                disabled={processing}
                className={`px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                  email.manuallyReplied 
                    ? 'bg-gray-600 text-white' 
                    : 'bg-indigo-600 text-white'
                }`}
                title={email.manuallyReplied ? 'Already replied manually' : 'Send manual reply'}
              >
                <Reply className="w-4 h-4" />
                {email.manuallyReplied ? 'Reply Again' : 'Reply'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex gap-4">
          {['content', 'extracted', 'matches', 'quotes', 'conversation', 'technical'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 border-b-2 font-medium transition-colors capitalize ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow p-6">
        {activeTab === 'content' && (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Email Content</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="whitespace-pre-wrap">{email.bodyText}</p>
              </div>
            </div>

            {email.attachments?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Attachments</h3>
                <div className="space-y-2">
                  {email.attachments.map((att, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <FileText className="w-5 h-5 text-gray-600" />
                      <span className="flex-1">{att.filename}</span>
                      <span className="text-sm text-gray-500">{(att.size / 1024).toFixed(2)} KB</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'extracted' && (
          <div>
            {!email.extractedData ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No extracted data yet</p>
                <button
                  onClick={handleExtract}
                  disabled={!email.category || processing}
                  className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Extract Now
                </button>
              </div>
            ) : email.category === 'CUSTOMER' ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Customer Inquiry Details</h3>
                  {!isEditing ? (
                    <button
                      onClick={handleStartEdit}
                      className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancelEdit}
                        disabled={saving}
                        className="flex items-center gap-2 px-3 py-1 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        disabled={saving}
                        className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  )}
                </div>
                
                <div>
                  {/* Destination */}
                  <div className="mb-4">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                      <MapPin className="w-4 h-4" />
                      Destination
                    </label>
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editedData.destination || ''}
                          onChange={(e) => handleEditChange('destination', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter primary destination"
                        />
                        <input
                          type="text"
                          value={editedData.additionalDestinations?.join(', ') || ''}
                          onChange={(e) => handleEditChange('additionalDestinations', e.target.value.split(',').map(d => d.trim()).filter(d => d))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Additional destinations (comma-separated)"
                        />
                        <p className="text-xs text-gray-500">Additional destinations help find multi-city packages</p>
                      </div>
                    ) : (
                      <>
                        <p className="text-gray-900">{email.extractedData.destination || 'Not specified'}</p>
                        {email.extractedData.additionalDestinations?.length > 0 && (
                          <p className="text-sm text-gray-600 mt-1">
                            Also interested in: {email.extractedData.additionalDestinations.join(', ')}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {/* Dates */}
                  {email.extractedData.dates && (
                    <div className="mb-4">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                        <Calendar className="w-4 h-4" />
                        Travel Dates
                      </label>
                      {isEditing ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-gray-600">Start Date</label>
                              <input
                                type="date"
                                value={editedData.dates?.preferredStart || ''}
                                onChange={(e) => handleNestedChange('dates', 'preferredStart', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">End Date</label>
                              <input
                                type="date"
                                value={editedData.dates?.preferredEnd || ''}
                                onChange={(e) => handleNestedChange('dates', 'preferredEnd', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">Or Duration (days)</label>
                            <input
                              type="number"
                              min="1"
                              value={editedData.dates?.duration || ''}
                              onChange={(e) => handleNestedChange('dates', 'duration', parseInt(e.target.value) || '')}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="Number of days"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-900">
                          {email.extractedData.dates.preferredStart && email.extractedData.dates.preferredEnd ? (
                            <p>{email.extractedData.dates.preferredStart} to {email.extractedData.dates.preferredEnd}</p>
                          ) : email.extractedData.dates.duration ? (
                            <p>{email.extractedData.dates.duration} days</p>
                          ) : (
                            <p>Flexible</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Travelers */}
                  {email.extractedData.travelers && (
                    <div className="mb-4">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                        <Users className="w-4 h-4" />
                        Travelers
                      </label>
                      {isEditing ? (
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-xs text-gray-600">Adults</label>
                            <input
                              type="number"
                              min="0"
                              value={editedData.travelers?.adults || 0}
                              onChange={(e) => handleNestedChange('travelers', 'adults', parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">Children</label>
                            <input
                              type="number"
                              min="0"
                              value={editedData.travelers?.children || 0}
                              onChange={(e) => handleNestedChange('travelers', 'children', parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">Infants</label>
                            <input
                              type="number"
                              min="0"
                              value={editedData.travelers?.infants || 0}
                              onChange={(e) => handleNestedChange('travelers', 'infants', parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-900">
                          <p>
                            {email.extractedData.travelers.adults || 0} Adults
                            {email.extractedData.travelers.children > 0 && `, ${email.extractedData.travelers.children} Children`}
                            {email.extractedData.travelers.infants > 0 && `, ${email.extractedData.travelers.infants} Infants`}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Budget */}
                  {email.extractedData.budget && (
                    <div className="mb-4">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                        <DollarSign className="w-4 h-4" />
                        Budget
                      </label>
                      {isEditing ? (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-gray-600">Amount</label>
                            <input
                              type="number"
                              min="0"
                              value={editedData.budget?.amount || ''}
                              onChange={(e) => handleNestedChange('budget', 'amount', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">Currency</label>
                            <select
                              value={editedData.budget?.currency || 'USD'}
                              onChange={(e) => handleNestedChange('budget', 'currency', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="USD">USD</option>
                              <option value="EUR">EUR</option>
                              <option value="GBP">GBP</option>
                              <option value="INR">INR</option>
                              <option value="AUD">AUD</option>
                            </select>
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-900">
                          {email.extractedData.budget.amount ? (
                            <p>
                              {email.extractedData.budget.currency} {email.extractedData.budget.amount.toLocaleString()}
                              {email.extractedData.budget.perPerson && ' per person'}
                              {email.extractedData.budget.flexible && ' (Flexible)'}
                            </p>
                          ) : (
                            <p>Not specified</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Package Type */}
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Package Type</label>
                    {isEditing ? (
                      <select
                        value={editedData.packageType || ''}
                        onChange={(e) => handleEditChange('packageType', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select package type</option>
                        <option value="Honeymoon">Honeymoon</option>
                        <option value="Family">Family</option>
                        <option value="Adventure">Adventure</option>
                        <option value="Luxury">Luxury</option>
                        <option value="Budget">Budget</option>
                        <option value="Group">Group</option>
                        <option value="Solo">Solo</option>
                        <option value="Business">Business</option>
                        <option value="Pilgrimage">Pilgrimage</option>
                        <option value="Beach">Beach</option>
                        <option value="Cultural">Cultural</option>
                        <option value="Wildlife">Wildlife</option>
                      </select>
                    ) : (
                      <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                        {email.extractedData.packageType || 'Not specified'}
                      </span>
                    )}
                  </div>

                  {/* Activities */}
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Activities</label>
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editedData.activities?.join(', ') || ''}
                          onChange={(e) => handleEditChange('activities', e.target.value.split(',').map(a => a.trim()).filter(a => a))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter activities separated by commas (e.g., Sightseeing, Shopping, Beach)"
                        />
                        <p className="text-xs text-gray-500">Separate multiple activities with commas</p>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {email.extractedData.activities?.length > 0 ? (
                          email.extractedData.activities.map((activity, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                              {activity}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500 text-sm">No activities specified</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Missing Info */}
                  {getMissingInfo().length > 0 && (
                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        Missing Information
                      </h4>
                      <ul className="list-disc list-inside text-sm text-yellow-700">
                        {getMissingInfo().map((info, idx) => (
                          <li key={idx}>{info}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-semibold mb-4">Supplier Package Data</h3>
                <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
                  {JSON.stringify(email.extractedData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {activeTab === 'matches' && (
          <div>
            {!email.matchingResults || email.matchingResults.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No matching packages yet</p>
                {email.extractedData && email.category === 'CUSTOMER' && (
                  <button
                    onClick={handleMatch}
                    disabled={processing}
                    className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Find Matches Now
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Matching Packages ({email.matchingResults.length})</h3>
                  <button
                    onClick={handleMatch}
                    disabled={processing}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {processing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Re-matching...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4" />
                        Re-match Packages
                      </>
                    )}
                  </button>
                </div>
                {email.matchingResults.map((match, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-medium text-gray-500">#{idx + 1}</span>
                          <h4 className="text-xl font-bold text-gray-900">
                            {match.itineraryTitle || 'Untitled Package'}
                          </h4>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700">{match.destination || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700">{match.duration} days</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700 font-semibold">
                              {match.currency} {match.price?.toLocaleString() || 'N/A'}
                            </span>
                          </div>
                          {match.travelStyle && (
                            <div className="flex items-center gap-2 text-sm">
                              <Tag className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-700 capitalize">{match.travelStyle}</span>
                            </div>
                          )}
                        </div>

                        {match.themes && match.themes.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {match.themes.map((theme, tidx) => (
                              <span key={tidx} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                                {theme}
                              </span>
                            ))}
                          </div>
                        )}

                        {match.overview && (
                          <p className="text-sm text-gray-600 mt-3 line-clamp-2">{match.overview}</p>
                        )}
                      </div>

                      <div className="text-right ml-4">
                        <p className="text-3xl font-bold text-green-600">{match.score}</p>
                        <p className="text-xs text-gray-500 mt-1">Match Score</p>
                        <div className="w-20 h-2 bg-gray-200 rounded-full mt-2">
                          <div 
                            className="h-full bg-green-600 rounded-full" 
                            style={{ width: `${match.score}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {match.matchReasons?.length > 0 && (
                      <div className="mb-3 p-3 bg-green-50 rounded-lg">
                        <p className="text-sm font-medium text-green-800 mb-2 flex items-center gap-2">
                          <Check className="w-4 h-4" />
                          Why it matches:
                        </p>
                        <ul className="space-y-1">
                          {match.matchReasons.map((reason, ridx) => (
                            <li key={ridx} className="text-sm text-green-700 flex items-start gap-2">
                              <span className="text-green-500 mt-0.5">•</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {match.gaps?.length > 0 && (
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <p className="text-sm font-medium text-orange-800 mb-2 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Considerations:
                        </p>
                        <ul className="space-y-1">
                          {match.gaps.map((gap, gidx) => (
                            <li key={gidx} className="text-sm text-orange-700 flex items-start gap-2">
                              <span className="text-orange-500 mt-0.5">•</span>
                              <span>{gap}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => navigate(`/itineraries/${match.packageId}`)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
                      >
                        <Package className="w-4 h-4" />
                        View Details
                      </button>
                      <button
                        onClick={() => handleAddToQuote(match)}
                        disabled={addingToQuote === match.packageId}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {addingToQuote === match.packageId ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <FileText className="w-4 h-4" />
                            Add to Quote
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quotes Tab */}
        {activeTab === 'quotes' && (
          <QuotesTab email={email} onRefresh={fetchEmail} />
        )}

        {activeTab === 'conversation' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Email Conversation & Quote History</h3>
            
            {(() => {
              // Build conversation timeline dynamically
              const timeline = [];
              
              // 1. Add customer email (always first)
              timeline.push({
                type: 'customer_email',
                timestamp: new Date(email.receivedAt),
                data: email
              });
              
              // 2. Add AI generated response (if exists)
              if (email.generatedResponse) {
                timeline.push({
                  type: 'ai_response',
                  timestamp: email.generatedResponse.createdAt 
                    ? new Date(email.generatedResponse.createdAt)
                    : new Date(email.processedAt || email.receivedAt),
                  data: email.generatedResponse
                });
              }
              
              // 3. Add all sent quotes
              if (email.quotesGenerated && email.quotesGenerated.length > 0) {
                email.quotesGenerated
                  .filter(q => q.status === 'sent' || q.sentAt)
                  .forEach(quote => {
                    timeline.push({
                      type: 'quote_sent',
                      timestamp: new Date(quote.sentAt || quote.createdAt),
                      data: quote
                    });
                  });
              }
              
              // 4. Add reply emails (threaded conversation)
              if (email.replies && email.replies.length > 0) {
                email.replies.forEach(reply => {
                  // Determine if this is from customer or agent/system
                  const isCustomerReply = reply.from.email === email.from.email;
                  
                  timeline.push({
                    type: isCustomerReply ? 'customer_reply' : 'agent_reply',
                    timestamp: new Date(reply.receivedAt),
                    data: reply
                  });
                });
              }
              
              // 5. Sort by timestamp (REVERSE chronological order - latest first)
              timeline.sort((a, b) => b.timestamp - a.timestamp);
              
              // 5. Render timeline
              return (
                <div className="space-y-4">
                  {timeline.map((item, index) => {
                    // Customer Email
                    if (item.type === 'customer_email') {
                      return (
                        <div key={`customer-${index}`} className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold flex-shrink-0">
                              {email.from.name?.charAt(0) || 'C'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4 mb-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-900">{email.from.name || 'Customer'}</p>
                                  <p className="text-sm text-gray-600">{email.from.email}</p>
                                </div>
                                <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
                                  {item.timestamp.toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-gray-800 mb-2">{email.subject}</p>
                              <div className="text-sm text-gray-700 whitespace-pre-wrap">
                                {email.bodyText || email.plainText || email.htmlContent?.replace(/<[^>]*>/g, '') || 'No content'}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    // AI Generated Response
                    if (item.type === 'ai_response') {
                      return (
                        <div key={`ai-${index}`} className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-lg">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center flex-shrink-0">
                              <Send className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4 mb-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-900">AI Generated Response</p>
                                  <p className="text-sm text-gray-600">Ready to send</p>
                                </div>
                                <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
                                  {item.timestamp.toLocaleString()}
                                </span>
                              </div>
                              
                              <div className="bg-white p-3 rounded-lg border border-indigo-200 space-y-2">
                                <div>
                                  <label className="text-xs font-medium text-gray-700">Subject:</label>
                                  <p className="text-sm text-gray-900 font-medium">{item.data.subject}</p>
                                </div>
                                
                                <div>
                                  <label className="text-xs font-medium text-gray-700">Body:</label>
                                  <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
                                    {item.data.plainText}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    // Quote Sent
                    if (item.type === 'quote_sent') {
                      const quote = item.data;
                      return (
                        <div key={`quote-${quote.quoteId || index}`} className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0">
                              <Send className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4 mb-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-900">Quote Sent: {quote.quoteNumber}</p>
                                  <p className="text-sm text-gray-600">
                                    To: {email.from.email}
                                    {quote.includedItineraries?.length > 0 && 
                                      ` • ${quote.includedItineraries.map(it => it.title).join(', ')}`
                                    }
                                  </p>
                                </div>
                                <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
                                  {item.timestamp.toLocaleString()}
                                </span>
                              </div>
                              
                              <div className="bg-white p-3 rounded-lg border border-green-200">
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <span className="text-gray-600">Total Price:</span>
                                    <span className="font-semibold text-gray-900 ml-2">
                                      {quote.currency} {quote.totalPrice?.toLocaleString()}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Status:</span>
                                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                                      quote.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                                      quote.status === 'viewed' ? 'bg-purple-100 text-purple-700' :
                                      quote.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                      quote.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                      'bg-gray-100 text-gray-700'
                                    }`}>
                                      {quote.status}
                                    </span>
                                  </div>
                                </div>
                                
                                {quote.viewedAt && (
                                  <p className="text-xs text-gray-600 mt-2">
                                    👁️ Viewed at: {new Date(quote.viewedAt).toLocaleString()}
                                  </p>
                                )}
                                
                                {quote.respondedAt && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    💬 Responded at: {new Date(quote.respondedAt).toLocaleString()}
                                    {quote.response && ` - ${quote.response}`}
                                  </p>
                                )}
                                
                                {quote.pdfUrl && (
                                  <a 
                                    href={quote.pdfUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:text-blue-700 mt-2 inline-flex items-center gap-1"
                                  >
                                    <FileText className="w-4 h-4" />
                                    Download PDF
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    // Customer Reply Email (Threaded)
                    if (item.type === 'customer_reply') {
                      const reply = item.data;
                      return (
                        <div key={`reply-${reply.emailId || index}`} className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg ml-6">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold flex-shrink-0">
                              {reply.from?.name?.charAt(0) || 'C'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4 mb-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-gray-900">{reply.from?.name || 'Customer'}</p>
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                      Reply
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600">{reply.from?.email}</p>
                                </div>
                                <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
                                  {item.timestamp.toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-gray-800 mb-2">{reply.subject}</p>
                              <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
                                {reply.snippet || 'No preview available'}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    // Agent/System Reply (Outbound)
                    if (item.type === 'agent_reply') {
                      const reply = item.data;
                      return (
                        <div key={`agent-reply-${reply.emailId || index}`} className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg ml-6">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0">
                              <Send className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4 mb-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-gray-900">{reply.from?.name || 'Support Team'}</p>
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                      Sent
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600">{reply.from?.email}</p>
                                </div>
                                <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
                                  {item.timestamp.toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-gray-800 mb-2">{reply.subject}</p>
                              <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
                                {reply.snippet || 'No preview available'}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    return null;
                  })}
                  
                  {/* Empty State */}
                  {timeline.length === 1 && (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <Send className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">No responses or quotes sent yet</p>
                      <p className="text-sm text-gray-500">
                        Create quotes from the Quotes tab or generate a response
                      </p>
                      {email.extractedData && (
                        <button
                          onClick={handleGenerateResponse}
                          disabled={processing}
                          className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                        >
                          Generate AI Response
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {activeTab === 'technical' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Processing Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Status</label>
                  <p className="font-medium">{email.processingStatus}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Received</label>
                  <p className="font-medium">{new Date(email.receivedAt).toLocaleString()}</p>
                </div>
                {email.processedAt && (
                  <div>
                    <label className="text-sm text-gray-600">Processed</label>
                    <p className="font-medium">{new Date(email.processedAt).toLocaleString()}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm text-gray-600">Message ID</label>
                  <p className="font-mono text-xs">{email.messageId}</p>
                </div>
                {email.trackingId && (
                  <div>
                    <label className="text-sm text-gray-600">Tracking ID</label>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm font-semibold text-indigo-600">{email.trackingId}</p>
                      <a
                        href={`/tracking/${email.trackingId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                      >
                        Public View
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">AI Metrics</h3>
              <div className="grid grid-cols-2 gap-4">
                {email.openaiCost && (
                  <div>
                    <label className="text-sm text-gray-600">OpenAI Cost</label>
                    <p className="font-medium">${email.openaiCost.toFixed(4)}</p>
                  </div>
                )}
                {email.tokensUsed && (
                  <div>
                    <label className="text-sm text-gray-600">Tokens Used</label>
                    <p className="font-medium">{email.tokensUsed.toLocaleString()}</p>
                  </div>
                )}
                {email.sentiment && (
                  <div>
                    <label className="text-sm text-gray-600">Sentiment</label>
                    <p className="font-medium capitalize">{email.sentiment}</p>
                  </div>
                )}
                {email.language && (
                  <div>
                    <label className="text-sm text-gray-600">Language</label>
                    <p className="font-medium">{email.language}</p>
                  </div>
                )}
              </div>
            </div>

            {email.tags?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {email.tags.map((tag, idx) => (
                    <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {showReplyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full h-full overflow-y-auto">{/* Full page modal */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Reply to {email.from.email}</h2>
                <button
                  onClick={() => setShowReplyModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Show AI-generated response as suggestion */}
              {email.generatedResponse && !email.manuallyReplied && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900 mb-1">AI-Generated Response Available</h4>
                      <p className="text-sm text-blue-700 mb-2">
                        An AI response has been generated. You can use it as-is or modify it below.
                      </p>
                      <button
                        onClick={() => {
                          setReplyData({
                            subject: email.generatedResponse.subject || `Re: ${email.subject}`,
                            body: email.generatedResponse.body || '',
                            plainText: email.generatedResponse.plainText || '',
                            cc: replyData.cc,
                            bcc: replyData.bcc
                          });
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Use AI Response
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* To Field (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To
                </label>
                <div className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                  {email.from.email}
                </div>
              </div>

              {/* CC/BCC Toggle Button */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowCcBcc(!showCcBcc)}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                >
                  {showCcBcc ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {showCcBcc ? 'Hide' : 'Add'} CC/BCC
                </button>
                {/* Debug button */}
                <button
                  type="button"
                  onClick={() => {
                    console.log('🐛 Debug State:', {
                      replyData,
                      cc: replyData.cc,
                      bcc: replyData.bcc,
                      ccLength: replyData.cc?.length,
                      bccLength: replyData.bcc?.length
                    });
                  }}
                  className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                >
                  Debug
                </button>
              </div>

              {/* CC and BCC Fields */}
              {showCcBcc && (
                <div className="space-y-3 pl-4 border-l-2 border-indigo-200">
                  {/* CC Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CC (Carbon Copy)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={ccInput}
                        onChange={(e) => setCcInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCC();
                          }
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Separate multiple emails with comma, semicolon, or colon"
                      />
                      <button
                        onClick={handleAddCC}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                        Add
                      </button>
                    </div>
                    {replyData.cc.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {replyData.cc.map((email, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm"
                          >
                            {email}
                            <button
                              onClick={() => handleRemoveCC(index)}
                              className="hover:text-indigo-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* BCC Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      BCC (Blind Carbon Copy)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={bccInput}
                        onChange={(e) => setBccInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddBCC();
                          }
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Separate multiple emails with comma, semicolon, or colon"
                      />
                      <button
                        onClick={handleAddBCC}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                        Add
                      </button>
                    </div>
                    {replyData.bcc.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {replyData.bcc.map((email, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                          >
                            {email}
                            <button
                              onClick={() => handleRemoveBCC(index)}
                              className="hover:text-gray-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Attachments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Paperclip className="w-4 h-4 inline mr-1" />
                  Attachments
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 cursor-pointer">
                    <div className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 text-center">
                      <input
                        type="file"
                        multiple
                        onChange={handleAttachmentChange}
                        className="hidden"
                      />
                      <span className="text-sm text-gray-600">
                        Click to select files or drag and drop
                      </span>
                    </div>
                  </label>
                </div>
                {attachmentFiles.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {attachmentFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <Paperclip className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveAttachment(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={replyData.subject}
                  onChange={(e) => setReplyData({ ...replyData, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Re: ..."
                />
              </div>

              {/* HTML Editor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message Body
                </label>
                <HTMLEditor
                  value={replyData.body}
                  onChange={(html) => {
                    setReplyData({ ...replyData, body: html });
                  }}
                  placeholder="Type your message here..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  Use the toolbar above to format your message
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowReplyModal(false)}
                disabled={sendingReply}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSendReply}
                disabled={sendingReply || !replyData.subject || !replyData.body}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {sendingReply ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Reply
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Customize Package Modal */}
      <CustomizePackageModal
        isOpen={showCustomizeModal}
        onClose={() => setShowCustomizeModal(false)}
        onSave={handleSaveCustomizedPackage}
        packageData={packageToCustomize}
        title="Customize Package for Quote"
      />

      {/* Re-categorize Modal */}
      <RecategorizeModal
        isOpen={showRecategorizeModal}
        onClose={() => setShowRecategorizeModal(false)}
        email={email}
        onSuccess={fetchEmail}
      />
    </div>
  );
};

export default EmailDetail;

