import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'

// Layouts
import AppLayout from './components/layouts/AppLayout'
import AuthLayout from './components/layouts/AuthLayout'

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

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, accessToken } = useAuthStore()

  if (!accessToken || !user) {
    return <Navigate to="/login" replace />
  }

  return children
}

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { accessToken } = useAuthStore()

  if (accessToken) {
    return <Navigate to="/dashboard" replace />
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

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="agents" element={<Agents />} />
        <Route path="customers" element={<Customers />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="itineraries" element={<Itineraries />} />
        <Route path="itineraries/:id/build" element={<ItineraryBuilder />} />
        <Route path="itinerary-preview/:id" element={<ItineraryPreview />} />
        <Route path="quotes" element={<Quotes />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
