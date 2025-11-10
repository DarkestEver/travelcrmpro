import { useState, useEffect } from 'react';
import { Check, X, Loader } from 'lucide-react';
import { adjustmentAPI } from '../../services/adjustmentAPI';
import toast from 'react-hot-toast';

export default function PendingApprovalsPage() {
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const response = await adjustmentAPI.getPendingApprovals();
      setAdjustments(response.data || []);
    } catch (err) {
      console.error('Fetch pending approvals error:', err);
      toast.error('Error loading pending approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(adjustments.map(adj => adj._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkApprove = async () => {
    try {
      await adjustmentAPI.bulkApprove(selectedIds, 'Bulk approval');
      toast.success(`Approved ${selectedIds.length} adjustments`);
      setSelectedIds([]);
      fetchPendingApprovals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error bulk approving');
    }
  };

  const handleApprove = async (id) => {
    try {
      await adjustmentAPI.approveAdjustment(id, '');
      toast.success('Adjustment approved');
      fetchPendingApprovals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error approving');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    
    try {
      await adjustmentAPI.rejectAdjustment(id, reason);
      toast.success('Adjustment rejected');
      fetchPendingApprovals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error rejecting');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
        {selectedIds.length > 0 && (
          <button
            onClick={handleBulkApprove}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-green-600 rounded-md hover:bg-green-700"
          >
            <Check className="w-4 h-4" />
            Approve Selected ({selectedIds.length})
          </button>
        )}
      </div>

      {adjustments.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500">No pending approvals at this time</p>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === adjustments.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {adjustments.map((adj) => (
                <tr key={adj._id} className={selectedIds.includes(adj._id) ? 'bg-blue-50' : ''}>
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(adj._id)}
                      onChange={() => handleSelectOne(adj._id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="font-medium text-gray-900">
                      {adj.bookingId?.bookingNumber || 'N/A'}
                    </div>
                    <div className="text-gray-500">
                      {adj.bookingId?.customerName || ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(adj.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      adj.adjustmentType === 'extra_charge' ? 'bg-red-100 text-red-800' :
                      adj.adjustmentType === 'penalty' ? 'bg-yellow-100 text-yellow-800' :
                      adj.adjustmentType === 'discount' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {adj.adjustmentType.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="text-gray-900">{adj.description}</div>
                    <div className="text-gray-500 text-xs">{adj.reason}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                    <span className={adj.impactType === 'debit' ? 'text-red-600' : 'text-green-600'}>
                      {adj.impactType === 'debit' ? '+' : '-'}${adj.totalAmount.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleApprove(adj._id)}
                        className="px-3 py-1 text-xs text-white bg-green-600 rounded hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(adj._id)}
                        className="px-3 py-1 text-xs text-red-600 border border-red-600 rounded hover:bg-red-50"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
