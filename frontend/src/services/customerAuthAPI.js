/**
 * Customer Authentication API Service
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

// Create axios instance for customer portal
const customerAPI = axios.create({
  baseURL: `${API_BASE_URL}/customer`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
customerAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('customerToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add tenantId from localStorage
    const tenantId = localStorage.getItem('tenantId');
    if (tenantId) {
      config.headers['X-Tenant-ID'] = tenantId;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
customerAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - redirect to login
      localStorage.removeItem('customerToken');
      localStorage.removeItem('customerUser');
      window.location.href = '/customer/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Register new customer
 */
export const register = async (data) => {
  const response = await customerAPI.post('/auth/register', data);
  return response.data;
};

/**
 * Login customer
 */
export const login = async (credentials) => {
  const response = await customerAPI.post('/auth/login', credentials);
  return response.data;
};

/**
 * Get current customer profile
 */
export const getProfile = async () => {
  const response = await customerAPI.get('/auth/me');
  return response.data;
};

/**
 * Logout customer
 */
export const logout = async () => {
  const response = await customerAPI.post('/auth/logout');
  return response.data;
};

/**
 * Request password reset
 */
export const forgotPassword = async (email, tenantId) => {
  const response = await customerAPI.post('/auth/forgot-password', { email, tenantId });
  return response.data;
};

/**
 * Reset password with token
 */
export const resetPassword = async (token, password) => {
  const response = await customerAPI.post(`/auth/reset-password/${token}`, { password });
  return response.data;
};

/**
 * Verify email with token
 */
export const verifyEmail = async (token) => {
  const response = await customerAPI.get(`/auth/verify-email/${token}`);
  return response.data;
};

export default customerAPI;
