import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FiBell, 
  FiCheck, 
  FiCheckCircle,
  FiX, 
  FiTrash2,
  FiCalendar,
  FiFileText,
  FiDollarSign,
  FiUser,
  FiAlertCircle,
  FiInfo
} from 'react-icons/fi';
import { notificationsAPI } from '../services/apiEndpoints';
import toast from 'react-hot-toast';

const Notifications = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsAPI.getAll(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const notifications = notificationsData?.data || [];
  const unreadCount = notifications.filter(n => !n.read).length;

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id) => notificationsAPI.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsAPI.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      toast.success('All notifications marked as read');
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => notificationsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      toast.success('Notification deleted');
    },
  });

  // Clear all notifications mutation
  const clearAllMutation = useMutation({
    mutationFn: () => notificationsAPI.clearAll(),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      toast.success('All notifications cleared');
    },
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type) => {
    const icons = {
      booking: FiCalendar,
      quote: FiFileText,
      payment: FiDollarSign,
      customer: FiUser,
      agent: FiUser,
      success: FiCheckCircle,
      warning: FiAlertCircle,
      info: FiInfo,
    };
    return icons[type] || FiInfo;
  };

  const getNotificationColor = (type) => {
    const colors = {
      booking: 'bg-green-100 text-green-600',
      quote: 'bg-yellow-100 text-yellow-600',
      payment: 'bg-blue-100 text-blue-600',
      customer: 'bg-purple-100 text-purple-600',
      agent: 'bg-indigo-100 text-indigo-600',
      success: 'bg-green-100 text-green-600',
      warning: 'bg-orange-100 text-orange-600',
      info: 'bg-blue-100 text-blue-600',
    };
    return colors[type] || 'bg-gray-100 text-gray-600';
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / 60000);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification._id);
    }
    if (notification.url) {
      window.location.href = notification.url;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <FiBell className="w-5 h-5" />
        
        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-500">{unreadCount} unread</p>
              )}
            </div>
            <div className="flex gap-2">
              {notifications.length > 0 && (
                <>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllAsReadMutation.mutate()}
                      disabled={markAllAsReadMutation.isPending}
                      className="text-sm text-blue-500 hover:text-blue-600 font-medium disabled:opacity-50"
                      title="Mark all as read"
                    >
                      <FiCheck className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (window.confirm('Clear all notifications?')) {
                        clearAllMutation.mutate();
                      }
                    }}
                    disabled={clearAllMutation.isPending}
                    className="text-sm text-red-500 hover:text-red-600 font-medium disabled:opacity-50"
                    title="Clear all"
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-500 mt-2 text-sm">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FiBell className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p className="font-medium">No notifications</p>
                <p className="text-sm mt-1">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type);
                  const colorClass = getNotificationColor(notification.type);

                  return (
                    <div
                      key={notification._id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${colorClass} flex items-center justify-center`}>
                          <Icon className="w-5 h-5" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className={`text-sm ${!notification.read ? 'font-semibold' : 'font-medium'} text-gray-900`}>
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              {formatTimestamp(notification.createdAt)}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotificationMutation.mutate(notification._id);
                              }}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                              title="Delete"
                            >
                              <FiX className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 text-center">
              <a
                href="/notifications"
                className="text-sm text-blue-500 hover:text-blue-600 font-medium"
              >
                View all notifications
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;
