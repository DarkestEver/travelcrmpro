import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useTenantBranding } from '../contexts/TenantBrandingContext'
import { authAPI } from '../services/apiEndpoints'
import { FiUser, FiLogOut } from 'react-icons/fi'
import NotificationBell from './NotificationBell'
import toast from 'react-hot-toast'

const Header = () => {
  const { user, logout } = useAuthStore()
  const { companyName, primaryColor } = useTenantBranding()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Always clear local auth state and redirect
      logout();
      toast.success('Logged out successfully');
      navigate('/login', { replace: true });
    }
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-800">
            Welcome back, {user?.name}!
          </h2>
          <p className="text-sm text-gray-500">{companyName}</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications */}
          <NotificationBell />

          {/* Profile dropdown */}
          <div className="flex items-center gap-3">
            <Link
              to="/profile"
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium"
                style={{ backgroundColor: primaryColor }}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-700">
                {user?.name}
              </span>
            </Link>

            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
              title="Logout"
            >
              <FiLogOut className="text-xl" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
