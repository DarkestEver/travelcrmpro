import { useState, useEffect } from 'react';
import { Plus, Check, X, RotateCcw, Loader } from 'lucide-react';
import { adjustmentAPI } from '../../services/adjustmentAPI';
import AddAdjustmentDialog from './AddAdjustmentDialog';
import toast from 'react-hot-toast';

export default function BookingAdjustmentsList({ bookingId, canManage = false }) {
  const [adjustments, setAdjustments] = useState([]);
  const [totals, setTotals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  useEffect(() => {
    if (bookingId) {
      fetchAdjustments();
    }
  }, [bookingId]);

  const fetchAdjustments = async () => {
    try {
      setLoading(true);
      const response = await adjustmentAPI.getBookingAdjustments(bookingId);
      setAdjustments(response.data || []);
      setTotals(response.totals || null);
    } catch (err) {
      console.error('Fetch adjustments error:', err);
      toast.error('Error loading adjustments');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await adjustmentAPI.approveAdjustment(id, '');
      toast.success('Adjustment approved');
      fetchAdjustments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error approving adjustment');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    
    try {
      await adjustmentAPI.rejectAdjustment(id, reason);
      toast.success('Adjustment rejected');
      fetchAdjustments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error rejecting adjustment');
    }
  };

  const handleReverse = async (id) => {
    const reason = prompt('Enter reversal reason:');
    if (!reason) return;
    
    try {
      await adjustmentAPI.reverseAdjustment(id, reason);
      toast.success('Adjustment reversed');
      fetchAdjustments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error reversing adjustment');
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
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Booking Adjustments</h3>
        {canManage && (
          <button
            onClick={() => setAddDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Adjustment
          </button>
        )}
      </div>

      {adjustments.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500">No adjustments found for this booking</p>
        </div>
      ) : (
        <>
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  {canManage && <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {adjustments.map((adj) => (
                  <tr key={adj._id}>
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
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {adj.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                      <span className={adj.impactType === 'debit' ? 'text-red-600' : 'text-green-600'}>
                        {adj.impactType === 'debit' ? '+' : '-'}${adj.totalAmount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        adj.status === 'active' ? 'bg-green-100 text-green-800' :
                        adj.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {adj.status}
                      </span>
                    </td>
                    {canManage && (
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center gap-2">
                          {adj.approvalStatus === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(adj._id)}
                                className="text-green-600 hover:text-green-800"
                                title="Approve"
                              >
                                <Check className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleReject(adj._id)}
                                className="text-red-600 hover:text-red-800"
                                title="Reject"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </>
                          )}
                          {['active', 'paid'].includes(adj.status) && adj.status !== 'reversed' && (
                            <button
                              onClick={() => handleReverse(adj._id)}
                              className="text-yellow-600 hover:text-yellow-800"
                              title="Reverse"
                            >
                              <RotateCcw className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totals && (
            <div className="mt-4 grid grid-cols-4 gap-4">
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-xs text-gray-600">Total Charges</p>
                <p className="text-lg font-semibold text-red-600">${totals.totalCharges?.toFixed(2) || '0.00'}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-xs text-gray-600">Total Credits</p>
                <p className="text-lg font-semibold text-green-600">${totals.totalCredits?.toFixed(2) || '0.00'}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-xs text-gray-600">Net Adjustment</p>
                <p className={`text-lg font-semibold ${totals.netAdjustment >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ${totals.netAdjustment?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-600">Outstanding</p>
                <p className="text-lg font-semibold text-gray-900">${totals.outstanding?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          )}
        </>
      )}

      <AddAdjustmentDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        bookingId={bookingId}
        onSuccess={fetchAdjustments}
      />
    </div>
  );
}
