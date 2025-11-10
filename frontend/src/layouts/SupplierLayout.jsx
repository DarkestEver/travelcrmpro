import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  HomeIcon,
  CalendarIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  CubeIcon,
  BanknotesIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { authAPI } from '../services/apiEndpoints';
import { useAuthStore } from '../stores/authStore';
import { useTenantBranding } from '../contexts/TenantBrandingContext';

const SupplierLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const { user: authUser } = useAuthStore();
  const { logo, companyName, primaryColor, isLoading } = useTenantBranding();

  // Get current user info - with fallback to authStore
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: authAPI.getMe,
    retry: 1,
    staleTime: 5 * 60 * 1000,
    initialData: authUser, // Use auth store user as fallback
    onError: (error) => {
      console.error('Failed to fetch user in SupplierLayout:', error);
      // If unauthorized, logout and redirect
      if (error.response?.status === 401) {
        logout();
        navigate('/login');
      }
    }
  });

  const navigation = [
    { name: 'Dashboard', href: '/supplier/dashboard', icon: HomeIcon },
    { name: 'My Bookings', href: '/supplier/bookings', icon: CalendarIcon },
    { name: 'Inventory', href: '/supplier/inventory', icon: CubeIcon },
    { name: 'Payments', href: '/supplier/payments', icon: BanknotesIcon },
    { name: 'Profile', href: '/supplier/profile', icon: UserCircleIcon },
  ];

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      logout();
      toast.success('Logged out successfully');
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar header with tenant branding */}
        <div className="flex items-center justify-between h-16 px-4 border-b">
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
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                {!isLoading ? companyName : 'Loading...'}
              </h1>
              <p className="text-xs text-gray-500">Supplier Portal</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Supplier profile section */}
        <div className="p-4 border-b">
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <span className="font-semibold">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.role?.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                }`
              }
              style={({ isActive }) => ({
                backgroundColor: isActive ? primaryColor : 'transparent'
              })}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Logout button */}
        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white shadow-sm">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>

            <div className="flex-1">
              <p className="text-sm text-gray-600 hidden sm:block">
                Welcome back, <span className="font-medium">{user?.name}</span>
              </p>
              <p className="text-xs text-gray-500 hidden sm:block">
                {!isLoading && companyName}
              </p>
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-4">
              {/* User info */}
              <div className="hidden md:flex items-center space-x-2">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SupplierLayout;
