/**
 * Tenant API Service
 * Handles all tenant management API calls (Super Admin only)
 */

import api from './api';

/**
 * Get all tenants with pagination and filters
 * @param {Object} params - Query parameters { page, limit, status, plan }
 * @returns {Promise<Object>} - List of tenants with pagination
 */
export const getAllTenants = async (params = {}) => {
  const response = await api.get('/tenants', { params });
  return response.data;
};

/**
 * Get single tenant by ID
 * @param {string} id - Tenant ID
 * @returns {Promise<Object>} - Tenant details
 */
export const getTenant = async (id) => {
  const response = await api.get(`/tenants/${id}`);
  return response.data;
};

/**
 * Get current tenant (from context)
 * @returns {Promise<Object>} - Current tenant details
 */
export const getCurrentTenant = async () => {
  const response = await api.get('/tenants/current');
  return response.data;
};

/**
 * Create new tenant
 * @param {Object} data - Tenant creation data
 * @param {string} data.name - Tenant name
 * @param {string} data.subdomain - Subdomain (unique)
 * @param {string} data.ownerName - Owner's full name
 * @param {string} data.ownerEmail - Owner's email
 * @param {string} data.ownerPassword - Owner's password
 * @param {string} data.ownerPhone - Owner's phone number
 * @param {string} [data.plan] - Subscription plan (free, basic, professional, enterprise)
 * @param {string} [data.customDomain] - Custom domain
 * @param {Object} [data.settings] - Tenant settings
 * @param {Object} [data.metadata] - Additional metadata
 * @returns {Promise<Object>} - Created tenant
 */
export const createTenant = async (data) => {
  const response = await api.post('/tenants', data);
  return response.data;
};

/**
 * Update tenant details
 * @param {string} id - Tenant ID
 * @param {Object} data - Fields to update
 * @returns {Promise<Object>} - Updated tenant
 */
export const updateTenant = async (id, data) => {
  const response = await api.patch(`/tenants/${id}`, data);
  return response.data;
};

/**
 * Update tenant subscription
 * @param {string} id - Tenant ID
 * @param {Object} subscription - Subscription details
 * @param {string} subscription.plan - Plan name
 * @param {string} subscription.status - Subscription status
 * @param {Date} [subscription.startDate] - Start date
 * @param {Date} [subscription.endDate] - End date
 * @returns {Promise<Object>} - Updated tenant
 */
export const updateTenantSubscription = async (id, subscription) => {
  const response = await api.patch(`/tenants/${id}/subscription`, subscription);
  return response.data;
};

/**
 * Suspend tenant
 * @param {string} id - Tenant ID
 * @param {string} reason - Suspension reason
 * @returns {Promise<Object>} - Updated tenant
 */
export const suspendTenant = async (id, reason) => {
  const response = await api.patch(`/tenants/${id}/suspend`, { reason });
  return response.data;
};

/**
 * Activate/Reactivate tenant
 * @param {string} id - Tenant ID
 * @returns {Promise<Object>} - Updated tenant
 */
export const activateTenant = async (id) => {
  const response = await api.patch(`/tenants/${id}/activate`);
  return response.data;
};

/**
 * Delete tenant (soft delete)
 * @param {string} id - Tenant ID
 * @returns {Promise<Object>} - Success message
 */
export const deleteTenant = async (id) => {
  const response = await api.delete(`/tenants/${id}`);
  return response.data;
};

/**
 * Get tenant statistics
 * @param {string} id - Tenant ID
 * @returns {Promise<Object>} - Tenant stats (users, customers, bookings, revenue, etc.)
 */
export const getTenantStats = async (id) => {
  const response = await api.get(`/tenants/${id}/stats`);
  return response.data;
};

/**
 * Tenant status options
 */
export const TENANT_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  INACTIVE: 'inactive',
  TRIAL: 'trial',
};

/**
 * Subscription plans
 */
export const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  BASIC: 'basic',
  PROFESSIONAL: 'professional',
  ENTERPRISE: 'enterprise',
};

/**
 * Plan features and limits
 */
export const PLAN_FEATURES = {
  free: {
    name: 'Free',
    price: '₹0',
    users: 1,
    customers: 10,
    bookings: 20,
    storage: '100 MB',
    features: ['Basic CRM', 'Email Support', 'Mobile App Access'],
  },
  basic: {
    name: 'Basic',
    price: '₹999/month',
    users: 3,
    customers: 100,
    bookings: 200,
    storage: '1 GB',
    features: ['All Free Features', 'Customer Portal', 'WhatsApp Integration', 'Priority Support'],
  },
  professional: {
    name: 'Professional',
    price: '₹2,999/month',
    users: 10,
    customers: 500,
    bookings: 1000,
    storage: '10 GB',
    features: ['All Basic Features', 'Payment Gateway', 'Advanced Analytics', 'API Access', 'Custom Branding'],
  },
  enterprise: {
    name: 'Enterprise',
    price: 'Custom',
    users: 'Unlimited',
    customers: 'Unlimited',
    bookings: 'Unlimited',
    storage: 'Unlimited',
    features: ['All Professional Features', 'Dedicated Support', 'Custom Integrations', 'SLA Guarantee', 'White Label'],
  },
};
