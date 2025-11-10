import React, { useState, useEffect } from 'react';
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
  Plane
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import emailAPI from '../../services/emailAPI';

const EmailDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('content');

  useEffect(() => {
    fetchEmail();
  }, [id]);

  const fetchEmail = async () => {
    try {
      setLoading(true);
      const response = await emailAPI.getEmailById(id);
      setEmail(response.data);
    } catch (error) {
      console.error('Failed to fetch email:', error);
      toast.error('Failed to load email');
    } finally {
      setLoading(false);
    }
  };

  const handleCategorize = async () => {
    try {
      setProcessing(true);
      const response = await emailAPI.categorizeEmail(id);
      toast.success(`Categorized as ${response.data.category}`);
      fetchEmail();
    } catch (error) {
      console.error('Failed to categorize:', error);
      toast.error('Failed to categorize email');
    } finally {
      setProcessing(false);
    }
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
      toast.success(`Found ${response.data.length} matching packages`);
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
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-gray-600">Email not found</p>
          <button
            onClick={() => navigate('/emails')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Emails
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
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
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex gap-4">
          {['content', 'extracted', 'matches', 'response', 'technical'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 border-b-2 font-medium transition-colors ${
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
                <div>
                  <h3 className="text-lg font-semibold mb-4">Customer Inquiry Details</h3>
                  
                  {/* Destination */}
                  <div className="mb-4">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                      <MapPin className="w-4 h-4" />
                      Destination
                    </label>
                    <p className="text-gray-900">{email.extractedData.destination || 'Not specified'}</p>
                    {email.extractedData.additionalDestinations?.length > 0 && (
                      <p className="text-sm text-gray-600 mt-1">
                        Also interested in: {email.extractedData.additionalDestinations.join(', ')}
                      </p>
                    )}
                  </div>

                  {/* Dates */}
                  {email.extractedData.dates && (
                    <div className="mb-4">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                        <Calendar className="w-4 h-4" />
                        Travel Dates
                      </label>
                      <div className="text-gray-900">
                        {email.extractedData.dates.preferredStart && email.extractedData.dates.preferredEnd ? (
                          <p>{email.extractedData.dates.preferredStart} to {email.extractedData.dates.preferredEnd}</p>
                        ) : email.extractedData.dates.duration ? (
                          <p>{email.extractedData.dates.duration} days</p>
                        ) : (
                          <p>Flexible</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Travelers */}
                  {email.extractedData.travelers && (
                    <div className="mb-4">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                        <Users className="w-4 h-4" />
                        Travelers
                      </label>
                      <div className="text-gray-900">
                        <p>
                          {email.extractedData.travelers.adults || 0} Adults
                          {email.extractedData.travelers.children > 0 && `, ${email.extractedData.travelers.children} Children`}
                          {email.extractedData.travelers.infants > 0 && `, ${email.extractedData.travelers.infants} Infants`}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Budget */}
                  {email.extractedData.budget && (
                    <div className="mb-4">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                        <DollarSign className="w-4 h-4" />
                        Budget
                      </label>
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
                    </div>
                  )}

                  {/* Package Type */}
                  {email.extractedData.packageType && (
                    <div className="mb-4">
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Package Type</label>
                      <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                        {email.extractedData.packageType}
                      </span>
                    </div>
                  )}

                  {/* Activities */}
                  {email.extractedData.activities?.length > 0 && (
                    <div className="mb-4">
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Activities</label>
                      <div className="flex flex-wrap gap-2">
                        {email.extractedData.activities.map((activity, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                            {activity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing Info */}
                  {email.extractedData.missingInfo?.length > 0 && (
                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        Missing Information
                      </h4>
                      <ul className="list-disc list-inside text-sm text-yellow-700">
                        {email.extractedData.missingInfo.map((info, idx) => (
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
                <h3 className="text-lg font-semibold">Matching Packages ({email.matchingResults.length})</h3>
                {email.matchingResults.map((match, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">Match #{idx + 1}</h4>
                        <p className="text-sm text-gray-600">Package ID: {match.packageId}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">{match.score}/100</p>
                        <p className="text-xs text-gray-500">Match Score</p>
                      </div>
                    </div>

                    {match.matchReasons?.length > 0 && (
                      <div className="mb-2">
                        <p className="text-sm font-medium text-gray-700 mb-1">Why it matches:</p>
                        <ul className="list-disc list-inside text-sm text-green-600">
                          {match.matchReasons.map((reason, ridx) => (
                            <li key={ridx}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {match.gaps?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Gaps:</p>
                        <ul className="list-disc list-inside text-sm text-orange-600">
                          {match.gaps.map((gap, gidx) => (
                            <li key={gidx}>{gap}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'response' && (
          <div>
            {!email.generatedResponse ? (
              <div className="text-center py-12">
                <Send className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No response generated yet</p>
                {email.extractedData && (
                  <button
                    onClick={handleGenerateResponse}
                    disabled={processing}
                    className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  >
                    Generate Response Now
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Subject</label>
                  <p className="text-gray-900 font-medium">{email.generatedResponse.subject}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Body (Plain Text)</label>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="whitespace-pre-wrap">{email.generatedResponse.plainText}</p>
                  </div>
                </div>

                {email.generatedResponse.body && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Body (HTML)</label>
                    <div 
                      className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                      dangerouslySetInnerHTML={{ __html: email.generatedResponse.body }}
                    />
                  </div>
                )}
              </div>
            )}
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
    </div>
  );
};

export default EmailDetail;
