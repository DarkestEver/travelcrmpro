import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { useCustomerAuthStore } from './stores/customerAuthStore'

// Layouts
import AppLayout from './components/layouts/AppLayout'
import AuthLayout from './components/layouts/AuthLayout'
import AgentLayout from './layouts/AgentLayout'
import CustomerLayout from './layouts/CustomerLayout'
import SupplierLayout from './layouts/SupplierLayout'

// Role-Based Route Protection
import RoleBasedRoute, { SuperAdminRoute, AdminRoute } from './components/RoleBasedRoute'

// Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Dashboard from './pages/Dashboard'
import Agents from './pages/Agents'
import Customers from './pages/Customers'
import Suppliers from './pages/Suppliers'
import Itineraries from './pages/Itineraries'
import ItineraryBuilder from './pages/ItineraryBuilder'
import ItineraryPreview from './pages/ItineraryPreview'
import Quotes from './pages/Quotes'
import Bookings from './pages/Bookings'
import Profile from './pages/Profile'
import Analytics from './pages/Analytics'
import AuditLogs from './pages/AuditLogs'
import NotFound from './pages/NotFound'
import Unauthorized from './pages/Unauthorized'

// Public Shared Pages (no authentication required)
import SharedBooking from './pages/shared/SharedBooking'
import SharedQuote from './pages/shared/SharedQuote'
import SharedItinerary from './pages/shared/SharedItinerary'

// Agent Portal Pages
import AgentDashboard from './pages/agent/Dashboard'
import AgentCustomers from './pages/agent/Customers'
import AgentQuoteRequests from './pages/agent/QuoteRequests'
import RequestQuote from './pages/agent/RequestQuote'
import AgentBookings from './pages/agent/Bookings'
import AgentSubUsers from './pages/agent/SubUsers'
import AgentCommissions from './pages/agent/Commissions'
import AgentPayments from './pages/agent/Payments'
import AgentReports from './pages/agent/Reports'
import AgentInvoices from './pages/agent/Invoices'
import CreateInvoice from './pages/agent/CreateInvoice'
import Notifications from './pages/agent/Notifications'

// Customer Portal Pages
import CustomerLogin from './pages/customer/Login'
import CustomerRegister from './pages/customer/Register'
import CustomerDashboard from './pages/customer/Dashboard'
import CustomerBookings from './pages/customer/Bookings'
import BookingDetails from './pages/customer/BookingDetails'
import CustomerInvoices from './pages/customer/Invoices'
import CustomerRequestQuote from './pages/customer/RequestQuote'
import CustomerProfile from './pages/customer/Profile'

// Tenant Management Pages (Super Admin only)
import TenantList from './pages/tenants/TenantList'
import CreateTenant from './pages/tenants/CreateTenant'
import TenantDetail from './pages/tenants/TenantDetail'
import CustomerNotifications from './pages/customer/Notifications'

// Supplier Portal Pages
import SupplierDashboard from './pages/supplier/Dashboard'
import SupplierBookings from './pages/supplier/Bookings'
import SupplierInventory from './pages/supplier/Inventory'
import SupplierPayments from './pages/supplier/Payments'
import SupplierProfile from './pages/supplier/Profile'

// Finance Portal Pages
import FinanceLayout from './layouts/FinanceLayout'
import FinanceDashboard from './pages/finance/Dashboard'
import PendingApprovals from './pages/finance/PendingApprovals'
import Payments from './pages/finance/Payments'
import Invoices from './pages/finance/Invoices'
import Reconciliation from './pages/finance/Reconciliation'
import TaxSettings from './pages/finance/TaxSettings'
import Reports from './pages/finance/Reports'
import FinanceSettings from './pages/finance/Settings'

// Tenant Settings
import TenantSettings from './pages/TenantSettings'
import EmailAccounts from './pages/settings/EmailAccounts'
import AISettings from './pages/settings/AISettings'

// Email Automation
import EmailDashboard from './pages/emails/EmailDashboard'
import EmailDetail from './pages/emails/EmailDetail'
import ReviewQueue from './pages/emails/ReviewQueue'
import EmailAnalytics from './pages/emails/EmailAnalytics'
import ProcessingHistory from './pages/emails/ProcessingHistory'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, accessToken } = useAuthStore()

  if (!accessToken || !user) {
    return <Navigate to="/login" replace />
  }

  return children
}

// Smart Redirect based on role
const SmartRedirect = () => {
  const { user } = useAuthStore()
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  switch (user.role) {
    case 'agent':
      return <Navigate to="/agent/dashboard" replace />
    case 'customer':
      return <Navigate to="/customer/dashboard" replace />
    case 'supplier':
      return <Navigate to="/supplier/dashboard" replace />
    case 'finance':
      return <Navigate to="/finance/dashboard" replace />
    case 'super_admin':
    case 'operator':
    default:
      return <Navigate to="/dashboard" replace />
  }
}

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { accessToken, user } = useAuthStore()

  if (accessToken && user) {
    // Smart redirect based on role
    switch (user.role) {
      case 'agent':
        return <Navigate to="/agent/dashboard" replace />
      case 'customer':
        return <Navigate to="/customer/dashboard" replace />
      case 'supplier':
        return <Navigate to="/supplier/dashboard" replace />
      case 'finance':
        return <Navigate to="/finance/dashboard" replace />
      case 'super_admin':
      case 'operator':
      default:
        return <Navigate to="/dashboard" replace />
    }
  }

  return children
}

// Customer Protected Route Component
const CustomerProtectedRoute = ({ children }) => {
  const { isCustomerAuthenticated, getCustomerToken } = useCustomerAuthStore()

  if (!isCustomerAuthenticated() || !getCustomerToken()) {
    return <Navigate to="/customer/login" replace />
  }

  return children
}

// Customer Public Route Component
const CustomerPublicRoute = ({ children }) => {
  const { isCustomerAuthenticated } = useCustomerAuthStore()

  if (isCustomerAuthenticated()) {
    return <Navigate to="/customer/dashboard" replace />
  }

  return children
}

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <AuthLayout>
              <Login />
            </AuthLayout>
          </PublicRoute>
        }
      />

      <Route
        path="/register"
        element={
          <PublicRoute>
            <AuthLayout>
              <Register />
            </AuthLayout>
          </PublicRoute>
        }
      />

      {/* Public Shareable Links (no authentication required) */}
      <Route path="/share/booking/:token" element={<SharedBooking />} />
      <Route path="/share/quote/:token" element={<SharedQuote />} />
      <Route path="/share/itinerary/:token" element={<SharedItinerary />} />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<SmartRedirect />} />
        <Route path="dashboard" element={
          <RoleBasedRoute allowedRoles={['super_admin', 'operator']}>
            <Dashboard />
          </RoleBasedRoute>
        } />
        <Route path="agents" element={
          <RoleBasedRoute allowedRoles={['super_admin', 'operator']}>
            <Agents />
          </RoleBasedRoute>
        } />
        <Route path="customers" element={
          <RoleBasedRoute allowedRoles={['super_admin', 'operator', 'agent']}>
            <Customers />
          </RoleBasedRoute>
        } />
        <Route path="suppliers" element={
          <RoleBasedRoute allowedRoles={['super_admin', 'operator', 'agent']}>
            <Suppliers />
          </RoleBasedRoute>
        } />
        <Route path="itineraries" element={
          <RoleBasedRoute allowedRoles={['super_admin', 'operator', 'agent']}>
            <Itineraries />
          </RoleBasedRoute>
        } />
        <Route path="itineraries/:id/build" element={
          <RoleBasedRoute allowedRoles={['super_admin', 'operator', 'agent']}>
            <ItineraryBuilder />
          </RoleBasedRoute>
        } />
        <Route path="itinerary-preview/:id" element={
          <RoleBasedRoute allowedRoles={['super_admin', 'operator', 'agent']}>
            <ItineraryPreview />
          </RoleBasedRoute>
        } />
        <Route path="quotes" element={
          <RoleBasedRoute allowedRoles={['super_admin', 'operator', 'agent']}>
            <Quotes />
          </RoleBasedRoute>
        } />
        <Route path="bookings" element={
          <RoleBasedRoute allowedRoles={['super_admin', 'operator', 'agent']}>
            <Bookings />
          </RoleBasedRoute>
        } />
        <Route path="analytics" element={
          <RoleBasedRoute allowedRoles={['super_admin', 'operator']}>
            <Analytics />
          </RoleBasedRoute>
        } />
        <Route path="audit-logs" element={
          <RoleBasedRoute allowedRoles={['super_admin']}>
            <AuditLogs />
          </RoleBasedRoute>
        } />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={
          <RoleBasedRoute allowedRoles={['super_admin', 'operator']}>
            <TenantSettings />
          </RoleBasedRoute>
        } />
        <Route path="settings/email-accounts" element={
          <RoleBasedRoute allowedRoles={['super_admin', 'operator', 'admin']}>
            <EmailAccounts />
          </RoleBasedRoute>
        } />
        <Route path="settings/ai" element={
          <RoleBasedRoute allowedRoles={['super_admin', 'operator', 'admin']}>
            <AISettings />
          </RoleBasedRoute>
        } />

        {/* Email Automation Routes */}
        <Route path="emails" element={
          <RoleBasedRoute allowedRoles={['super_admin', 'operator', 'admin']}>
            <EmailDashboard />
          </RoleBasedRoute>
        } />
        <Route path="emails/:id" element={
          <RoleBasedRoute allowedRoles={['super_admin', 'operator', 'admin']}>
            <EmailDetail />
          </RoleBasedRoute>
        } />
        <Route path="emails/history" element={
          <RoleBasedRoute allowedRoles={['super_admin', 'operator', 'admin']}>
            <ProcessingHistory />
          </RoleBasedRoute>
        } />
        <Route path="emails/review-queue" element={
          <RoleBasedRoute allowedRoles={['super_admin', 'operator', 'admin']}>
            <ReviewQueue />
          </RoleBasedRoute>
        } />
        <Route path="emails/analytics" element={
          <RoleBasedRoute allowedRoles={['super_admin', 'operator', 'admin']}>
            <EmailAnalytics />
          </RoleBasedRoute>
        } />
        
        {/* Tenant Management Routes (Super Admin only) */}
        <Route path="tenants" element={
          <RoleBasedRoute allowedRoles={['super_admin']}>
            <TenantList />
          </RoleBasedRoute>
        } />
        <Route path="tenants/create" element={
          <RoleBasedRoute allowedRoles={['super_admin']}>
            <CreateTenant />
          </RoleBasedRoute>
        } />
        <Route path="tenants/:id" element={
          <RoleBasedRoute allowedRoles={['super_admin']}>
            <TenantDetail />
          </RoleBasedRoute>
        } />
      </Route>

      {/* Unauthorized Page */}
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Agent Portal Routes */}
      <Route
        path="/agent"
        element={
          <ProtectedRoute>
            <AgentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/agent/dashboard" replace />} />
        <Route path="dashboard" element={
          <RoleBasedRoute allowedRoles={['agent']}>
            <AgentDashboard />
          </RoleBasedRoute>
        } />
        <Route path="customers" element={
          <RoleBasedRoute allowedRoles={['agent']}>
            <AgentCustomers />
          </RoleBasedRoute>
        } />
        <Route path="quotes" element={
          <RoleBasedRoute allowedRoles={['agent']}>
            <AgentQuoteRequests />
          </RoleBasedRoute>
        } />
        <Route path="quotes/new" element={
          <RoleBasedRoute allowedRoles={['agent']}>
            <RequestQuote />
          </RoleBasedRoute>
        } />
        <Route path="bookings" element={
          <RoleBasedRoute allowedRoles={['agent']}>
            <AgentBookings />
          </RoleBasedRoute>
        } />
        <Route path="commissions" element={
          <RoleBasedRoute allowedRoles={['agent']}>
            <AgentCommissions />
          </RoleBasedRoute>
        } />
        <Route path="payments" element={
          <RoleBasedRoute allowedRoles={['agent']}>
            <AgentPayments />
          </RoleBasedRoute>
        } />
        <Route path="reports" element={
          <RoleBasedRoute allowedRoles={['agent']}>
            <AgentReports />
          </RoleBasedRoute>
        } />
        <Route path="invoices" element={
          <RoleBasedRoute allowedRoles={['agent']}>
            <AgentInvoices />
          </RoleBasedRoute>
        } />
        <Route path="invoices/new" element={
          <RoleBasedRoute allowedRoles={['agent']}>
            <CreateInvoice />
          </RoleBasedRoute>
        } />
        <Route path="notifications" element={
          <RoleBasedRoute allowedRoles={['agent']}>
            <Notifications />
          </RoleBasedRoute>
        } />
        <Route path="sub-users" element={
          <RoleBasedRoute allowedRoles={['agent']}>
            <AgentSubUsers />
          </RoleBasedRoute>
        } />
      </Route>

      {/* Supplier Portal Routes */}
      <Route
        path="/supplier"
        element={
          <ProtectedRoute>
            <SupplierLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/supplier/dashboard" replace />} />
        <Route path="dashboard" element={
          <RoleBasedRoute allowedRoles={['supplier']}>
            <SupplierDashboard />
          </RoleBasedRoute>
        } />
        <Route path="bookings" element={
          <RoleBasedRoute allowedRoles={['supplier']}>
            <SupplierBookings />
          </RoleBasedRoute>
        } />
        <Route path="inventory" element={
          <RoleBasedRoute allowedRoles={['supplier']}>
            <SupplierInventory />
          </RoleBasedRoute>
        } />
        <Route path="payments" element={
          <RoleBasedRoute allowedRoles={['supplier']}>
            <SupplierPayments />
          </RoleBasedRoute>
        } />
        <Route path="profile" element={
          <RoleBasedRoute allowedRoles={['supplier']}>
            <SupplierProfile />
          </RoleBasedRoute>
        } />
      </Route>

      {/* Finance Portal Routes */}
      <Route
        path="/finance"
        element={
          <ProtectedRoute>
            <FinanceLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/finance/dashboard" replace />} />
        <Route path="dashboard" element={
          <RoleBasedRoute allowedRoles={['finance', 'super_admin', 'operator']}>
            <FinanceDashboard />
          </RoleBasedRoute>
        } />
        <Route path="pending-approvals" element={
          <RoleBasedRoute allowedRoles={['finance', 'super_admin', 'operator']}>
            <PendingApprovals />
          </RoleBasedRoute>
        } />
        <Route path="payments" element={
          <RoleBasedRoute allowedRoles={['finance', 'super_admin', 'operator']}>
            <Payments />
          </RoleBasedRoute>
        } />
        <Route path="invoices" element={
          <RoleBasedRoute allowedRoles={['finance', 'super_admin', 'operator']}>
            <Invoices />
          </RoleBasedRoute>
        } />
        <Route path="reconciliation" element={
          <RoleBasedRoute allowedRoles={['finance', 'super_admin', 'operator']}>
            <Reconciliation />
          </RoleBasedRoute>
        } />
        <Route path="tax-settings" element={
          <RoleBasedRoute allowedRoles={['finance', 'super_admin', 'operator']}>
            <TaxSettings />
          </RoleBasedRoute>
        } />
        <Route path="reports" element={
          <RoleBasedRoute allowedRoles={['finance', 'super_admin', 'operator']}>
            <Reports />
          </RoleBasedRoute>
        } />
        <Route path="settings" element={
          <RoleBasedRoute allowedRoles={['finance', 'super_admin', 'operator']}>
            <FinanceSettings />
          </RoleBasedRoute>
        } />
      </Route>

      {/* Customer Portal Routes */}
      <Route path="/customer/login" element={
        <CustomerPublicRoute>
          <CustomerLogin />
        </CustomerPublicRoute>
      } />
      
      <Route path="/customer/register" element={
        <CustomerPublicRoute>
          <CustomerRegister />
        </CustomerPublicRoute>
      } />

      <Route
        path="/customer"
        element={
          <CustomerProtectedRoute>
            <CustomerLayout />
          </CustomerProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/customer/dashboard" replace />} />
        <Route path="dashboard" element={<CustomerDashboard />} />
        <Route path="bookings" element={<CustomerBookings />} />
        <Route path="bookings/:id" element={<BookingDetails />} />
        <Route path="invoices" element={<CustomerInvoices />} />
        <Route path="request-quote" element={<CustomerRequestQuote />} />
        <Route path="profile" element={<CustomerProfile />} />
        <Route path="notifications" element={<CustomerNotifications />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
