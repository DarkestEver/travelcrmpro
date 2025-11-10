import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useTenantBranding } from '../../contexts/TenantBrandingContext'
import { authAPI } from '../../services/apiEndpoints'
import toast from 'react-hot-toast'
import { FiMail, FiLock } from 'react-icons/fi'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const { logo, companyName, primaryColor } = useTenantBranding()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await authAPI.login(formData)
      const { user, accessToken, refreshToken } = response.data

      setAuth(user, accessToken, refreshToken)
      toast.success('Login successful!')
      
      // Smart redirect based on user role
      switch (user.role) {
        case 'agent':
          navigate('/agent/dashboard')
          break
        case 'supplier':
          navigate('/supplier/dashboard')
          break
        case 'customer':
          navigate('/customer/dashboard')
          break
        case 'finance':
          navigate('/finance/dashboard')
          break
        case 'super_admin':
        case 'operator':
        default:
          navigate('/dashboard')
          break
      }
    } catch (error) {
      console.error('Login error:', error)
      // Error toast is handled by axios interceptor
    } finally {
      setLoading(false)
    }
  }

  // Quick login buttons for demo
  const quickLogin = (email, password) => {
    setFormData({ email, password })
  }

  return (
    <div className="bg-white rounded-lg shadow-xl p-8">
      {/* Tenant Logo */}
      <div className="flex justify-center mb-6">
        {logo ? (
          <img 
            src={logo} 
            alt={companyName} 
            className="h-16 w-auto object-contain"
          />
        ) : (
          <div 
            className="h-16 w-16 rounded-lg flex items-center justify-center text-white font-bold text-2xl"
            style={{ backgroundColor: primaryColor }}
          >
            {companyName?.charAt(0) || 'T'}
          </div>
        )}
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
        Welcome Back
      </h2>
      <p className="text-gray-600 text-center mb-6">
        Sign in to {companyName}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <div className="relative">
            <FiMail className="absolute left-3 top-3 text-gray-400" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input pl-10"
              placeholder="your@email.com"
              required
            />
          </div>
        </div>

        <div>
          <label className="label">Password</label>
          <div className="relative">
            <FiLock className="absolute left-3 top-3 text-gray-400" />
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input pl-10"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full btn text-white font-medium py-3 rounded-lg transition-colors"
          disabled={loading}
          style={{ backgroundColor: primaryColor }}
          onMouseOver={(e) => e.target.style.opacity = '0.9'}
          onMouseOut={(e) => e.target.style.opacity = '1'}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Signing in...
            </span>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-600">
        <p className="mb-2">Quick login for demo:</p>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => quickLogin('admin@travelcrm.com', 'Admin@123')}
            className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
          >
            Admin
          </button>
          <button
            onClick={() => quickLogin('operator@travelcrm.com', 'Operator@123')}
            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            Operator
          </button>
          <button
            onClick={() => quickLogin('agent@travelcrm.com', 'Agent@123')}
            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
          >
            Agent
          </button>
          <button
            onClick={() => quickLogin('supplier@travelcrm.com', 'Supplier@123')}
            className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
          >
            Supplier
          </button>
        </div>
      </div>

      <div className="mt-6 text-center">
        <a href="#" className="text-sm hover:underline" style={{ color: primaryColor }}>
          Forgot password?
        </a>
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="hover:underline font-medium" style={{ color: primaryColor }}>
            Sign up here
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login
