/**
 * Notifications Page
 * Full page view of all notifications with filtering and pagination
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import notificationAPI from '../../services/notificationAPI';
import NotificationItem from '../../components/NotificationItem';
import toast from 'react-hot-toast';
import {
  FunnelIcon,
  CheckIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

const Notifications = () => {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('all'); // all, unread, invoice, payment, booking, etc.
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'list', page, filter],
    queryFn: () => {
      const params = { page, limit: 20 };
      if (filter === 'unread') {
        params.unreadOnly = true;
      } else if (filter !== 'all') {
        params.type = filter;
      }
      return notificationAPI.getNotifications(params);
    },
  });

  // Fetch summary
  const { data: summaryData } = useQuery({
    queryKey: ['notifications', 'summary'],
    queryFn: notificationAPI.getSummary,
  });

  const notifications = data?.data?.notifications || [];
  const pagination = data?.data?.pagination || {};
  const summary = summaryData?.data || {};

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: notificationAPI.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      toast.success('All notifications marked as read');
    },
    onError: () => {
      toast.error('Failed to mark notifications as read');
    },
  });

  const filterOptions = [
    { value: 'all', label: 'All', count: summary.total || 0 },
    { value: 'unread', label: 'Unread', count: summary.unread || 0 },
    { value: 'invoice', label: 'Invoices', count: summary.byType?.invoice || 0 },
    { value: 'payment', label: 'Payments', count: summary.byType?.payment || 0 },
    { value: 'booking', label: 'Bookings', count: summary.byType?.booking || 0 },
    { value: 'commission', label: 'Commissions', count: summary.byType?.commission || 0 },
    { value: 'credit_alert', label: 'Credit Alerts', count: summary.byType?.credit_alert || 0 },
  ];

  const handleMarkAllAsRead = () => {
    if (window.confirm('Mark all notifications as read?')) {
      markAllAsReadMutation.mutate();
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries(['notifications']);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-600 mt-1">
            Stay updated with your latest activities
          </p>
        </div>
        <div className="flex items-center gap-3">
          {summary.unread > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <CheckIcon className="h-4 w-4" />
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <FunnelIcon className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter by:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setFilter(option.value);
                setPage(1);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === option.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
              {option.count > 0 && (
                <span
                  className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold ${
                    filter === option.value
                      ? 'bg-white text-primary-600'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {option.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-4">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <svg
              className="mx-auto h-16 w-16 text-gray-400"
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
            <h3 className="mt-4 text-lg font-medium text-gray-900">No notifications</h3>
            <p className="mt-2 text-sm text-gray-500">
              {filter === 'unread'
                ? "You're all caught up! No unread notifications."
                : `No ${filter === 'all' ? '' : filter + ' '}notifications to display.`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
                onRead={handleRefresh}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === pagination.totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(page - 1) * pagination.limit + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(page * pagination.limit, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span> notifications
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                {[...Array(pagination.totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  if (
                    pageNum === 1 ||
                    pageNum === pagination.totalPages ||
                    (pageNum >= page - 1 && pageNum <= page + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === pageNum
                            ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (pageNum === page - 2 || pageNum === page + 2) {
                    return (
                      <span
                        key={pageNum}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                      >
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === pagination.totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
