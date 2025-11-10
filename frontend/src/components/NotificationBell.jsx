/**
 * Notification Bell Icon Component
 * Displays notification icon with unread count badge
 */

import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BellIcon } from '@heroicons/react/24/outline';
import { BellIcon as BellIconSolid } from '@heroicons/react/24/solid';
import notificationAPI from '../services/notificationAPI';
import NotificationDropdown from './NotificationDropdown';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch unread count with auto-refresh every 30 seconds
  const { data: unreadData, refetch } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationAPI.getUnreadCount,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const unreadCount = unreadData?.data?.unreadCount || 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Refresh notifications when opening
      refetch();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <BellIconSolid className="h-6 w-6 text-primary-600" />
        ) : (
          <BellIcon className="h-6 w-6 text-gray-600" />
        )}
        
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full min-w-[20px]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <NotificationDropdown
          onClose={() => setIsOpen(false)}
          onRefresh={refetch}
        />
      )}
    </div>
  );
};

export default NotificationBell;
