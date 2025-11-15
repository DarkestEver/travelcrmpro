import React from 'react';

const StatusBadge = ({ status, type = 'default', size = 'md', className = '' }) => {
  const getStatusConfig = () => {
    switch (status?.toLowerCase()) {
      // Booking statuses
      case 'pending':
        return { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
      case 'confirmed':
        return { label: 'Confirmed', color: 'bg-green-100 text-green-800 border-green-200' };
      case 'cancelled':
        return { label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-200' };
      case 'completed':
        return { label: 'Completed', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      
      // Payment statuses
      case 'paid':
        return { label: 'Paid', color: 'bg-green-100 text-green-800 border-green-200' };
      case 'unpaid':
        return { label: 'Unpaid', color: 'bg-red-100 text-red-800 border-red-200' };
      case 'partial':
      case 'partially_paid':
        return { label: 'Partial', color: 'bg-orange-100 text-orange-800 border-orange-200' };
      case 'refunded':
        return { label: 'Refunded', color: 'bg-purple-100 text-purple-800 border-purple-200' };
      
      // Reconciliation statuses
      case 'matched':
        return { label: 'Matched', color: 'bg-green-100 text-green-800 border-green-200' };
      case 'unmatched':
        return { label: 'Unmatched', color: 'bg-red-100 text-red-800 border-red-200' };
      case 'reviewing':
        return { label: 'Reviewing', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
      case 'reconciled':
        return { label: 'Reconciled', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      
      // Inventory statuses
      case 'available':
      case 'in_stock':
        return { label: 'Available', color: 'bg-green-100 text-green-800 border-green-200' };
      case 'unavailable':
      case 'out_of_stock':
        return { label: 'Unavailable', color: 'bg-red-100 text-red-800 border-red-200' };
      case 'low_stock':
        return { label: 'Low Stock', color: 'bg-orange-100 text-orange-800 border-orange-200' };
      case 'on_request':
        return { label: 'On Request', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      
      // Sync statuses
      case 'synced':
      case 'success':
        return { label: 'Synced', color: 'bg-green-100 text-green-800 border-green-200' };
      case 'syncing':
      case 'processing':
        return { label: 'Syncing', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'failed':
      case 'error':
        return { label: 'Failed', color: 'bg-red-100 text-red-800 border-red-200' };
      case 'conflict':
        return { label: 'Conflict', color: 'bg-orange-100 text-orange-800 border-orange-200' };
      
      // Health statuses
      case 'healthy':
      case 'online':
      case 'up':
        return { label: 'Healthy', color: 'bg-green-100 text-green-800 border-green-200' };
      case 'degraded':
      case 'warning':
        return { label: 'Degraded', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
      case 'unhealthy':
      case 'offline':
      case 'down':
        return { label: 'Unhealthy', color: 'bg-red-100 text-red-800 border-red-200' };
      
      // Active/Inactive
      case 'active':
        return { label: 'Active', color: 'bg-green-100 text-green-800 border-green-200' };
      case 'inactive':
        return { label: 'Inactive', color: 'bg-gray-100 text-gray-800 border-gray-200' };
      
      // Draft/Published
      case 'draft':
        return { label: 'Draft', color: 'bg-gray-100 text-gray-800 border-gray-200' };
      case 'published':
        return { label: 'Published', color: 'bg-green-100 text-green-800 border-green-200' };
      case 'archived':
        return { label: 'Archived', color: 'bg-gray-100 text-gray-800 border-gray-200' };
      
      default:
        return { label: status || 'Unknown', color: 'bg-gray-100 text-gray-800 border-gray-200' };
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1'
  };

  const config = getStatusConfig();

  return (
    <span 
      className={`inline-flex items-center rounded-full border font-medium ${config.color} ${sizeClasses[size]} ${className}`}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;
