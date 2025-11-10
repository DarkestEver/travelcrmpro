import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from '../../services/customerNotificationAPI';
import {
  BellIcon,
  CheckIcon,
  TrashIcon,
  CalendarIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export default function CustomerNotifications() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    type: '',
    read: '',
    page: 1,
    limit: 20,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['customerNotifications', filters],
    queryFn: () => getNotifications(filters),
  });

  const markReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries(['customerNotifications']);
      queryClient.invalidateQueries(['customerNotificationCount']);
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries(['customerNotifications']);
      queryClient.invalidateQueries(['customerNotificationCount']);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries(['customerNotifications']);
    },
  });

  const notifications = data?.data?.notifications || [];
  const unreadCount = data?.data?.unreadCount || 0;
  const pagination = data?.data?.pagination || {};

  const typeOptions = [
    { value: '', label: 'All Types' },
    { value: 'booking', label: 'Bookings' },
    { value: 'invoice', label: 'Invoices' },
    { value: 'payment', label: 'Payments' },
    { value: 'quote', label: 'Quotes' },
    { value: 'general', label: 'General' },
  ];

  const getNotificationIcon = (type) => {
    const icons = {
      booking: CalendarIcon,
      invoice: DocumentTextIcon,
      payment: CurrencyDollarIcon,
      quote: ChatBubbleLeftIcon,
      general: InformationCircleIcon,
    };
    return icons[type] || BellIcon;
  };

  const getNotificationColor = (type, priority) => {
    if (priority === 'high') return 'bg-red-100 text-red-700';
    if (priority === 'medium') return 'bg-yellow-100 text-yellow-700';
    
    const colors = {
      booking: 'bg-blue-100 text-blue-700',
      invoice: 'bg-purple-100 text-purple-700',
      payment: 'bg-green-100 text-green-700',
      quote: 'bg-indigo-100 text-indigo-700',
      general: 'bg-gray-100 text-gray-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="mt-2 text-gray-600">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <CheckIcon className="h-5 w-5 mr-2" />
            Mark All Read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={filters.read}
            onChange={(e) => setFilters({ ...filters, read: e.target.value, page: 1 })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Notifications</option>
            <option value="false">Unread Only</option>
            <option value="true">Read Only</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-gray-500">Loading notifications...</div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No notifications</h3>
          <p className="mt-2 text-gray-600">
            {filters.type || filters.read ? 'Try adjusting your filters' : "You're all caught up!"}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {notifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              return (
                <div
                  key={notification._id}
                  className={`bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow ${
                    !notification.read ? 'border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start">
                    <div className={`flex-shrink-0 rounded-full p-2 ${getNotificationColor(notification.type, notification.priority)}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-gray-900">{notification.title}</h3>
                          <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                          <p className="mt-2 text-xs text-gray-500">
                            {format(new Date(notification.createdAt), 'MMM dd, yyyy - h:mm a')}
                          </p>
                        </div>
                        <div className="ml-4 flex space-x-2">
                          {!notification.read && (
                            <button
                              onClick={() => markReadMutation.mutate(notification._id)}
                              disabled={markReadMutation.isPending}
                              className="text-blue-600 hover:text-blue-700"
                              title="Mark as read"
                            >
                              <CheckIcon className="h-5 w-5" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteMutation.mutate(notification._id)}
                            disabled={deleteMutation.isPending}
                            className="text-red-600 hover:text-red-700"
                            title="Delete"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-6 flex items-center justify-between bg-white rounded-lg shadow px-6 py-4">
              <div className="text-sm text-gray-700">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                  disabled={pagination.page === pagination.pages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
