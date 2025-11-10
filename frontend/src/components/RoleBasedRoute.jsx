import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

/**
 * RoleBasedRoute Component
 * 
 * Protects routes based on user role authorization.
 * Redirects unauthorized users to appropriate dashboard or 403 page.
 * 
 * @param {ReactNode} children - Component to render if authorized
 * @param {string[]} allowedRoles - Array of roles that can access this route
 * @param {boolean} showForbidden - If true, show 403 page instead of redirect
 * 
 * @example
 * <RoleBasedRoute allowedRoles={['super_admin', 'operator']}>
 *   <Analytics />
 * </RoleBasedRoute>
 */
const RoleBasedRoute = ({ 
  children, 
  allowedRoles = [], 
  showForbidden = false 
}) => {
  const { user, accessToken } = useAuthStore()

  // Check if user is authenticated
  if (!accessToken || !user) {
    return <Navigate to="/login" replace />
  }

  // If no roles specified, allow all authenticated users
  if (allowedRoles.length === 0) {
    return children
  }

  // Check if user's role is in allowed roles
  const isAuthorized = allowedRoles.includes(user.role)

  if (!isAuthorized) {
    // Show 403 page if specified
    if (showForbidden) {
      return <Navigate to="/unauthorized" replace />
    }

    // Otherwise redirect to user's appropriate dashboard
    const redirectPath = getRoleDashboard(user.role)
    return <Navigate to={redirectPath} replace />
  }

  return children
}

/**
 * Get the appropriate dashboard path for a user role
 * @param {string} role - User role
 * @returns {string} Dashboard path
 */
const getRoleDashboard = (role) => {
  switch (role) {
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

/**
 * Higher-order function to create role-specific route guards
 * 
 * @example
 * const AdminRoute = requireRoles(['super_admin', 'operator'])
 * <AdminRoute><Analytics /></AdminRoute>
 */
export const requireRoles = (allowedRoles) => {
  return ({ children }) => (
    <RoleBasedRoute allowedRoles={allowedRoles}>
      {children}
    </RoleBasedRoute>
  )
}

// Pre-defined role guards for common use cases
export const SuperAdminRoute = requireRoles(['super_admin'])
export const AdminRoute = requireRoles(['super_admin', 'operator'])
export const AgentRoute = requireRoles(['agent'])
export const SupplierRoute = requireRoles(['supplier'])
export const CustomerRoute = requireRoles(['customer'])

export default RoleBasedRoute
