import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { login } from '../../services/customerAuthAPI';
import { useCustomerAuthStore } from '../../stores/customerAuthStore';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

export default function CustomerLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setCustomerAuth = useCustomerAuthStore((state) => state.setCustomerAuth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    tenantId: searchParams.get('tenant') || '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleDemoLogin = () => {
    setFormData({
      email: 'demo@customer.com',
      password: 'demo123',
      tenantId: '690ce93c464bf35e0adede29',
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.email || !formData.password) {
      setError('Please enter both email and password');
      return;
    }

    if (!formData.tenantId) {
      setError('Tenant ID is required');
      return;
    }

    setIsLoading(true);

    try {
      const response = await login(formData);
      
      if (response.success) {
        // Save auth data
        setCustomerAuth(response.data.customer, response.data.token);
        
        // Redirect to dashboard
        const redirectTo = searchParams.get('redirect') || '/customer/dashboard';
        navigate(redirectTo);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.message || 
        'Login failed. Please check your credentials and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Logo and Header */}
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">
            Travel Portal
          </h2>
          <p className="text-gray-600 mb-8">
            Welcome back! Please login to your account
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Demo Account Info */}
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  Try Our Demo Account
                </h3>
                <div className="text-xs text-blue-800 space-y-1">
                  <p><span className="font-medium">Email:</span> demo@customer.com</p>
                  <p><span className="font-medium">Password:</span> demo123</p>
                  <p><span className="font-medium">Tenant ID:</span> 690ce93c464bf35e0adede29</p>
                </div>
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  className="mt-3 text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors font-medium"
                >
                  Fill Demo Credentials
                </button>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
              />
            </div>

            {/* Tenant ID */}
            <div>
              <label htmlFor="tenantId" className="block text-sm font-medium text-gray-700 mb-2">
                Tenant ID
              </label>
              <input
                id="tenantId"
                name="tenantId"
                type="text"
                required
                value={formData.tenantId}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your tenant ID"
              />
            </div>

            {/* Forgot Password Link */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <Link
                to="/customer/forgot-password"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to={`/customer/register${formData.tenantId ? `?tenant=${formData.tenantId}` : ''}`}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Need help?{' '}
            <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
