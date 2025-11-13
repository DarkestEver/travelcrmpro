import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  MessageSquare,
  ArrowUp,
  Filter,
  Search,
  Eye,
  UserPlus,
  Send,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Mail
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import reviewQueueAPI from '../../services/reviewQueueAPI';
import emailAPI from '../../services/emailAPI';

const ReviewQueue = () => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'pending',
    priority: '',
    assignedToMe: false
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Decision modal state
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decision, setDecision] = useState({
    action: 'approve_ai',
    categoryOverride: '',
    notes: ''
  });

  // Comment modal state
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetchQueue();
    fetchStats();
  }, [filters, pagination.page]);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const response = await reviewQueueAPI.getQueue({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });
      
      setQueue(response.data || []);
      
      // Safely handle pagination
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch queue:', error);
      toast.error('Failed to load review queue');
      setQueue([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await reviewQueueAPI.getStats();
      setStats(response.data || {
        total: 0,
        pending: 0,
        inReview: 0,
        completed: 0,
        rejected: 0,
        escalated: 0,
        urgent: 0,
        slaBreached: 0,
        avgTimeInQueue: 0
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      // Set default stats on error
      setStats({
        total: 0,
        pending: 0,
        inReview: 0,
        completed: 0,
        rejected: 0,
        escalated: 0,
        urgent: 0,
        slaBreached: 0,
        avgTimeInQueue: 0
      });
    }
  };

  const handleViewDetail = async (item) => {
    try {
      const response = await reviewQueueAPI.getReviewItem(item._id);
      setSelectedItem(response.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Failed to fetch item details:', error);
      toast.error('Failed to load details');
    }
  };

  const handleAssignToMe = async (itemId) => {
    try {
      await reviewQueueAPI.assignReview(itemId);
      toast.success('Assigned to you');
      fetchQueue();
      fetchStats();
    } catch (error) {
      console.error('Failed to assign:', error);
      toast.error('Failed to assign review');
    }
  };

  const handleCompleteReview = async () => {
    if (!selectedItem) return;

    try {
      await reviewQueueAPI.completeReview(
        selectedItem._id,
        {
          action: decision.action,
          categoryOverride: decision.categoryOverride || null,
          customResponse: decision.customResponse || null
        },
        decision.notes
      );
      toast.success('Review completed successfully');
      setShowDecisionModal(false);
      setShowDetailModal(false);
      setSelectedItem(null);
      fetchQueue();
      fetchStats();
    } catch (error) {
      console.error('Failed to complete review:', error);
      toast.error('Failed to complete review');
    }
  };

  const handleEscalate = async () => {
    if (!selectedItem) return;

    const reason = prompt('Reason for escalation:');
    if (!reason) return;

    try {
      await reviewQueueAPI.escalateReview(selectedItem._id, reason);
      toast.success('Review escalated');
      setShowDetailModal(false);
      setSelectedItem(null);
      fetchQueue();
      fetchStats();
    } catch (error) {
      console.error('Failed to escalate:', error);
      toast.error('Failed to escalate review');
    }
  };

  const handleAddComment = async () => {
    if (!selectedItem || !comment.trim()) return;

    try {
      await reviewQueueAPI.addComment(selectedItem._id, comment);
      toast.success('Comment added');
      setComment('');
      setShowCommentModal(false);
      
      // Refresh item details
      const response = await reviewQueueAPI.getReviewItem(selectedItem._id);
      setSelectedItem(response.data);
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800 border-red-300',
      high: 'bg-orange-100 text-orange-800 border-orange-300',
      normal: 'bg-blue-100 text-blue-800 border-blue-300',
      low: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return colors[priority] || colors.normal;
  };

  const getPriorityIcon = (priority) => {
    if (priority === 'urgent') return <AlertTriangle className="w-4 h-4" />;
    if (priority === 'high') return <TrendingUp className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  const getReasonLabel = (reason) => {
    const labels = {
      LOW_CONFIDENCE: 'Low Confidence',
      CONFLICTING_CATEGORIES: 'Conflicting Categories',
      SENSITIVE_CONTENT: 'Sensitive Content',
      HIGH_VALUE: 'High Value Customer',
      MANUAL_FLAG: 'Manual Flag',
      EXTRACTION_FAILED: 'Extraction Failed',
      AMBIGUOUS_REQUEST: 'Ambiguous Request',
      POLICY_VIOLATION: 'Policy Violation',
      NEW_CUSTOMER: 'New Customer',
      ESCALATION: 'Escalated',
      OTHER: 'Other'
    };
    return labels[reason] || reason;
  };

  return (
    <div className="p-6 pb-12 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Manual Review Queue</h1>
        <p className="text-gray-600">Review and approve AI processing decisions</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending || 0}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">SLA Breached</p>
                <p className="text-2xl font-bold text-red-600">{stats.breached || 0}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Review</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inReview || 0}</p>
              </div>
              <User className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.avgResponseTime ? `${Math.round(stats.avgResponseTime / 60)}m` : '-'}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_review">In Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="escalated">Escalated</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filters.priority}
            onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>

          {/* Assigned to Me */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.assignedToMe}
              onChange={(e) => setFilters(prev => ({ ...prev, assignedToMe: e.target.checked }))}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Assigned to Me</span>
          </label>

          {/* Quick Links */}
          <div className="ml-auto flex gap-2">
            <button
              onClick={async () => {
                const response = await reviewQueueAPI.getMyQueue();
                setQueue(response.data);
              }}
              className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              My Queue
            </button>
            <button
              onClick={async () => {
                const response = await reviewQueueAPI.getBreachedSLA();
                setQueue(response.data);
              }}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              SLA Breached
            </button>
          </div>
        </div>
      </div>

      {/* Queue Items */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Clock className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : queue.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <p className="text-gray-600">No items in review queue</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {queue.map((item) => (
              <div
                key={item._id}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  item.slaBreached ? 'bg-red-50' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2">
                      {getPriorityIcon(item.priority)}
                      <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(item.priority)}`}>
                        {item.priority.toUpperCase()}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                        {getReasonLabel(item.reason)}
                      </span>
                      {item.customerValue && (
                        <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                          {item.customerValue.toUpperCase()}
                        </span>
                      )}
                      {item.slaBreached && (
                        <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          SLA Breached
                        </span>
                      )}
                    </div>

                    {/* Email Info */}
                    <div className="mb-2">
                      <p className="font-medium text-gray-900 truncate">
                        {item.emailLogId?.subject || 'No subject'}
                      </p>
                      <p className="text-sm text-gray-600">
                        From: {item.emailLogId?.from?.email || 'Unknown'}
                      </p>
                    </div>

                    {/* AI Suggestion */}
                    {item.aiSuggestion && (
                      <div className="mb-2 p-2 bg-blue-50 rounded text-sm">
                        <p className="font-medium text-blue-900">AI Suggestion:</p>
                        <p className="text-blue-800">
                          Category: {item.aiSuggestion.category} ({item.aiSuggestion.confidence}% confidence)
                        </p>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.queuedAt).toLocaleString()}
                      </span>
                      {item.assignedTo && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {item.assignedTo.firstName} {item.assignedTo.lastName}
                        </span>
                      )}
                      {item.comments?.length > 0 && (
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {item.comments.length} comments
                        </span>
                      )}
                      {item.dueBy && (
                        <span className={`flex items-center gap-1 ${
                          new Date(item.dueBy) < new Date() ? 'text-red-600 font-medium' : ''
                        }`}>
                          <AlertCircle className="w-3 h-3" />
                          Due: {new Date(item.dueBy).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewDetail(item)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    {!item.assignedTo && item.status === 'pending' && (
                      <button
                        onClick={() => handleAssignToMe(item._id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="Assign to Me"
                      >
                        <UserPlus className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-700">
              Page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Review Item Details</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 space-y-6">
              {/* Email Content */}
              <div>
                <h3 className="font-semibold text-lg mb-2">Email Content</h3>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="font-medium mb-1">{selectedItem.emailLogId?.subject}</p>
                  <p className="text-sm text-gray-600 mb-2">
                    From: {selectedItem.emailLogId?.from?.email}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">
                    {selectedItem.emailLogId?.bodyText?.substring(0, 500)}...
                  </p>
                </div>
              </div>

              {/* AI Suggestion */}
              {selectedItem.aiSuggestion && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">AI Suggestion</h3>
                  <div className="bg-blue-50 p-4 rounded space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Category</p>
                        <p className="font-medium">{selectedItem.aiSuggestion.category}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Confidence</p>
                        <p className="font-medium">{selectedItem.aiSuggestion.confidence}%</p>
                      </div>
                    </div>
                    {selectedItem.aiSuggestion.extractedData && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Extracted Data</p>
                        <pre className="text-xs bg-white p-2 rounded overflow-auto">
                          {JSON.stringify(selectedItem.aiSuggestion.extractedData, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Comments */}
              {selectedItem.comments && selectedItem.comments.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Comments</h3>
                  <div className="space-y-2">
                    {selectedItem.comments.map((comment, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="w-4 h-4 text-gray-600" />
                          <span className="text-sm font-medium">
                            {comment.userId?.firstName} {comment.userId?.lastName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm">{comment.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer - Actions */}
            {selectedItem.status === 'pending' || selectedItem.status === 'in_review' ? (
              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
                <button
                  onClick={() => setShowDecisionModal(true)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <CheckCircle className="w-5 h-5 inline mr-2" />
                  Complete Review
                </button>
                <button
                  onClick={() => setShowCommentModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <MessageSquare className="w-5 h-5 inline mr-2" />
                  Add Comment
                </button>
                <button
                  onClick={handleEscalate}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  <ArrowUp className="w-5 h-5 inline mr-2" />
                  Escalate
                </button>
              </div>
            ) : (
              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
                <p className="text-center text-gray-600">
                  This review has been {selectedItem.status}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Decision Modal */}
      {showDecisionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold">Complete Review</h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Decision</label>
                <select
                  value={decision.action}
                  onChange={(e) => setDecision(prev => ({ ...prev, action: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="approve_ai">Approve AI Decision</option>
                  <option value="reject_ai">Reject AI Decision</option>
                  <option value="manual_response">Manual Response</option>
                  <option value="forward">Forward to Team</option>
                  <option value="ignore">Ignore</option>
                </select>
              </div>

              {decision.action === 'reject_ai' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Override Category
                  </label>
                  <select
                    value={decision.categoryOverride}
                    onChange={(e) => setDecision(prev => ({ ...prev, categoryOverride: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select category...</option>
                    <option value="CUSTOMER">Customer</option>
                    <option value="SUPPLIER">Supplier</option>
                    <option value="AGENT">Agent</option>
                    <option value="FINANCE">Finance</option>
                    <option value="SPAM">Spam</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={decision.notes}
                  onChange={(e) => setDecision(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Add review notes..."
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowDecisionModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteReview}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comment Modal */}
      {showCommentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold">Add Comment</h3>
            </div>
            <div className="px-6 py-4">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Write your comment..."
              />
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => { setShowCommentModal(false); setComment(''); }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddComment}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Comment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewQueue;
