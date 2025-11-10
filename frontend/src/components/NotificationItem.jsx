/**
 * Notification Item Component
 * Individual notification card with icon, message, and actions
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import notificationAPI from '../services/notificationAPI';
import { formatDistanceToNow } from 'date-fns';
import {
  DocumentTextIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const NotificationItem = ({ notification, onRead, onClick }) => {
  const queryClient = useQueryClient();

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: notificationAPI.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      if (onRead) onRead();
    },
  });

  const handleClick = () => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification._id);
    }
    if (onClick) onClick();
  };

  // Get icon based on notification type
  const getIcon = () => {
    switch (notification.type) {
      case 'invoice':
        return <DocumentTextIcon className="h-6 w-6" />;
      case 'payment':
        return <CurrencyDollarIcon className="h-6 w-6" />;
      case 'booking':
        return <CalendarIcon className="h-6 w-6" />;
      case 'commission':
        return <BanknotesIcon className="h-6 w-6" />;
      case 'credit_alert':
        return <ExclamationTriangleIcon className="h-6 w-6" />;
      case 'system':
        return <InformationCircleIcon className="h-6 w-6" />;
      default:
        return <CheckCircleIcon className="h-6 w-6" />;
    }
  };

  // Get color based on notification type
  const getColorClass = () => {
    switch (notification.type) {
      case 'invoice':
        return 'bg-blue-100 text-blue-600';
      case 'payment':
        return 'bg-green-100 text-green-600';
      case 'booking':
        return 'bg-purple-100 text-purple-600';
      case 'commission':
        return 'bg-yellow-100 text-yellow-600';
      case 'credit_alert':
        return 'bg-red-100 text-red-600';
      case 'system':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-primary-100 text-primary-600';
    }
  };

  // Get link URL based on notification type and metadata
  const getLink = () => {
    if (notification.link) return notification.link;
    
    switch (notification.type) {
      case 'invoice':
        return notification.metadata?.invoiceId 
          ? `/agent/invoices/${notification.metadata.invoiceId}` 
          : '/agent/invoices';
      case 'payment':
        return notification.metadata?.paymentId 
          ? `/agent/payments/${notification.metadata.paymentId}` 
          : '/agent/payments';
      case 'booking':
        return notification.metadata?.bookingId 
          ? `/agent/bookings/${notification.metadata.bookingId}` 
          : '/agent/bookings';
      case 'commission':
        return '/agent/commissions';
      case 'credit_alert':
        return '/agent/dashboard';
      default:
        return null;
    }
  };

  const link = getLink();
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });

  const content = (
    <div
      className={`px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${
        !notification.isRead ? 'bg-primary-50' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 rounded-full p-2 ${getColorClass()}`}>
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${!notification.isRead ? 'font-semibold' : 'font-medium'} text-gray-900`}>
            {notification.title}
          </p>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {notification.message}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-xs text-gray-500">{timeAgo}</p>
            {!notification.isRead && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800">
                New
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return link ? (
    <Link to={link} className="block">
      {content}
    </Link>
  ) : (
    content
  );
};

export default NotificationItem;
