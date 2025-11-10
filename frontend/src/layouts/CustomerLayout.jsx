import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCustomerAuthStore } from '../stores/customerAuthStore';
import { useTenantBranding } from '../contexts/TenantBrandingContext';
import { getUnreadCount } from '../services/customerNotificationAPI';
import {
  HomeIcon,
  CalendarIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';

export default function CustomerLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { customerUser, clearCustomerAuth } = useCustomerAuthStore();
  const { logo, companyName, primaryColor, isLoading } = useTenantBranding();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch unread notification count
  const { data: notificationData } = useQuery({
    queryKey: ['customerNotificationCount'],
    queryFn: getUnreadCount,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const unreadCount = notificationData?.data?.unreadCount || 0;

  const navigation = [
    { name: 'Dashboard', href: '/customer/dashboard', icon: HomeIcon },
    { name: 'My Bookings', href: '/customer/bookings', icon: CalendarIcon },
    { name: 'Invoices', href: '/customer/invoices', icon: DocumentTextIcon },
    { name: 'Request Quote', href: '/customer/request-quote', icon: ChatBubbleLeftRightIcon },
    { name: 'My Profile', href: '/customer/profile', icon: UserCircleIcon },
  ];

  const handleLogout = () => {
    clearCustomerAuth();
    navigate('/customer/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}>
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-gray-900/80 transition-opacity ${
            sidebarOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 flex w-72 flex-col bg-white transform transition-transform ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              {logo ? (
                <img 
                  src={logo} 
                  alt={companyName} 
                  className="h-8 w-8 object-contain"
                />
              ) : (
                <div 
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  {companyName?.charAt(0) || 'T'}
                </div>
              )}
              <span className="text-lg font-bold text-gray-900">
                {!isLoading ? companyName : 'Loading...'}
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'text-white'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  style={{
                    backgroundColor: isActive ? primaryColor : 'transparent'
                  }}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-1 min-h-0 bg-white border-r border-gray-200">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-gray-200 gap-3">
            {logo ? (
              <img 
                src={logo} 
                alt={companyName} 
                className="h-8 w-8 object-contain"
              />
            ) : (
              <div 
                className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: primaryColor }}
              >
                {companyName?.charAt(0) || 'T'}
              </div>
            )}
            <span className="text-lg font-bold text-gray-900">
              {!isLoading ? companyName : 'Loading...'}
            </span>
          </div>

          {/* User info */}
          <div className="px-4 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div 
                  className="h-10 w-10 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  <span className="font-semibold text-sm">
                    {customerUser?.firstName?.charAt(0)}
                    {customerUser?.lastName?.charAt(0)}
                  </span>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {customerUser?.firstName} {customerUser?.lastName}
                </p>
                <p className="text-xs text-gray-500">{customerUser?.email}</p>
              </div>
              <Link
                to="/customer/notifications"
                className="relative ml-2 p-2 text-gray-600 hover:text-gray-900"
              >
                <BellIcon className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'text-white'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  style={{
                    backgroundColor: isActive ? primaryColor : 'transparent'
                  }}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="px-4 py-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm lg:hidden">
          <button
            type="button"
            className="text-gray-700"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <span className="text-lg font-semibold text-gray-900">Travel Portal</span>
          <div className="flex-1"></div>
          <Link
            to="/customer/notifications"
            className="relative p-2 text-gray-600 hover:text-gray-900"
          >
            <BellIcon className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        </div>

        {/* Page content */}
        <main className="py-6 px-4 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
