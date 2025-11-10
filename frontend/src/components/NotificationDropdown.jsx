/**
 * Notification Dropdown Component
 * Displays recent notifications in a dropdown panel
 */

import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import notificationAPI from '../services/notificationAPI';
import NotificationItem from './NotificationItem';
import toast from 'react-hot-toast';

const NotificationDropdown = ({ onClose, onRefresh }) => {
  // Fetch recent notifications (limit to 5 in dropdown)
  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'recent'],
    queryFn: () => notificationAPI.getNotifications({ limit: 5, page: 1 }),
  });

  const notifications = data?.data?.notifications || [];
  const hasUnread = notifications.some(n => !n.isRead);

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      onRefresh();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark notifications as read');
      console.error('Error marking as read:', error);
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[600px] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
        {hasUnread && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Notification List */}
      <div className="overflow-y-auto flex-1">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-500">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
                onRead={onRefresh}
                onClick={onClose}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <Link
            to="/agent/notifications"
            onClick={onClose}
            className="block text-center text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
