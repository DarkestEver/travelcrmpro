import { Link } from 'react-router-dom'
import { FiShield, FiHome, FiArrowLeft } from 'react-icons/fi'
import { useAuthStore } from '../stores/authStore'

/**
 * Unauthorized (403) Page
 * 
 * Displayed when a user tries to access a route they don't have permission for.
 * Provides a clear message and navigation options back to their appropriate dashboard.
 */
const Unauthorized = () => {
  const { user } = useAuthStore()

  // Determine user's appropriate dashboard
  const getDashboardPath = () => {
    if (!user) return '/login'
    
    switch (user.role) {
      case 'agent':
        return '/agent/dashboard'
      case 'customer':
        return '/customer/dashboard'
      case 'supplier':
        return '/supplier/dashboard'
      case 'super_admin':
      case 'operator':
      default:
        return '/dashboard'
    }
  }

  const dashboardPath = getDashboardPath()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
            <FiShield className="w-12 h-12 text-red-600" />
          </div>
        </div>

        {/* Error Code */}
        <h1 className="text-6xl font-bold text-gray-900 mb-4">403</h1>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Access Denied
        </h2>

        {/* Description */}
        <p className="text-gray-600 mb-8 leading-relaxed">
          You don't have permission to access this page. This area is restricted to users with specific roles.
        </p>

        {/* User Info */}
        {user && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Current Role:</span>{' '}
              <span className="capitalize">{user.role.replace('_', ' ')}</span>
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to={dashboardPath}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            <FiHome className="w-5 h-5" />
            Go to Dashboard
          </Link>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            <FiArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>

        {/* Help Text */}
        <p className="mt-8 text-sm text-gray-500">
          If you believe you should have access to this page, please contact your administrator.
        </p>
      </div>
    </div>
  )
}

export default Unauthorized
