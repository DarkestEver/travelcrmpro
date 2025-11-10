/**
 * Tenant Detail Page
 * View and edit tenant details, manage subscription, suspend/activate (Super Admin only)
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  BuildingOfficeIcon,
  PencilIcon,
  TrashIcon,
  XCircleIcon,
  CheckCircleIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import {
  getTenant,
  updateTenant,
  updateTenantSubscription,
  suspendTenant,
  activateTenant,
  deleteTenant,
  SUBSCRIPTION_PLANS,
} from '../../services/tenantAPI';

const TenantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [subscriptionData, setSubscriptionData] = useState({});

  // Fetch tenant
  const { data, isLoading, error } = useQuery({
    queryKey: ['tenant', id],
    queryFn: () => getTenant(id),
    onSuccess: (data) => {
      const tenant = data.data.tenant;
      setFormData({
        name: tenant.name,
        subdomain: tenant.subdomain,
        customDomain: tenant.customDomain || '',
        settings: tenant.settings || {},
      });
      setSubscriptionData(tenant.subscription || {});
    },
  });

  const tenant = data?.data?.tenant;

  // Update tenant mutation
  const updateMutation = useMutation({
    mutationFn: (updates) => updateTenant(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries(['tenant', id]);
      setIsEditing(false);
      alert('Tenant updated successfully');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to update tenant');
    },
  });

  // Update subscription mutation
  const updateSubMutation = useMutation({
    mutationFn: (subscription) => updateTenantSubscription(id, subscription),
    onSuccess: () => {
      queryClient.invalidateQueries(['tenant', id]);
      alert('Subscription updated successfully');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to update subscription');
    },
  });

  // Suspend tenant mutation
  const suspendMutation = useMutation({
    mutationFn: (reason) => suspendTenant(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['tenant', id]);
      alert('Tenant suspended successfully');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to suspend tenant');
    },
  });

  // Activate tenant mutation
  const activateMutation = useMutation({
    mutationFn: () => activateTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['tenant', id]);
      alert('Tenant activated successfully');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to activate tenant');
    },
  });

  // Delete tenant mutation
  const deleteMutation = useMutation({
    mutationFn: () => deleteTenant(id),
    onSuccess: () => {
      alert('Tenant deleted successfully');
      navigate('/tenants');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to delete tenant');
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleSuspend = () => {
    const reason = prompt('Enter reason for suspension:');
    if (reason) {
      suspendMutation.mutate(reason);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) {
      deleteMutation.mutate();
    }
  };

  const handleSubscriptionUpdate = () => {
    updateSubMutation.mutate(subscriptionData);
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-gray-600">Loading tenant details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading tenant: {error.message}</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const badges = {
      active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
      suspended: { bg: 'bg-red-100', text: 'text-red-800', label: 'Suspended' },
      inactive: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inactive' },
      trial: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Trial' },
    };
    const badge = badges[status] || badges.inactive;
    return (
      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/tenants')}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1" />
          Back to Tenants
        </button>
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-16 w-16 bg-indigo-100 rounded-lg flex items-center justify-center">
              <BuildingOfficeIcon className="h-8 w-8 text-indigo-600" />
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-900">{tenant.name}</h1>
              <p className="mt-1 text-sm text-gray-600">{tenant.subdomain}.travelcrm.com</p>
              <div className="mt-2">{getStatusBadge(tenant.status)}</div>
            </div>
          </div>
          <div className="flex space-x-3">
            <Link
              to={`/tenants/${id}/stats`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <ChartBarIcon className="w-5 h-5 mr-2" />
              Statistics
            </Link>
            {tenant.status === 'suspended' ? (
              <button
                onClick={() => activateMutation.mutate()}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                <CheckCircleIcon className="w-5 h-5 mr-2" />
                Activate
              </button>
            ) : (
              <button
                onClick={handleSuspend}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                <XCircleIcon className="w-5 h-5 mr-2" />
                Suspend
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tenant Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Tenant Information</h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <PencilIcon className="w-4 h-4 mr-1" />
                  Edit
                </button>
              ) : (
                <div className="space-x-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="px-3 py-1 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    {updateMutation.isPending ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                ) : (
                  <p className="text-gray-900">{tenant.name}</p>
                )}
              </div>

              {/* Subdomain */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subdomain</label>
                <p className="text-gray-900">{tenant.subdomain}.travelcrm.com</p>
                <p className="text-xs text-gray-500 mt-1">Subdomain cannot be changed</p>
              </div>

              {/* Custom Domain */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custom Domain</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.customDomain}
                    onChange={(e) => setFormData({ ...formData, customDomain: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="travel.yourdomain.com"
                  />
                ) : (
                  <p className="text-gray-900">{tenant.customDomain || 'Not configured'}</p>
                )}
              </div>

              {/* Created Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                <p className="text-gray-900">{new Date(tenant.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Owner Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Owner Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Name:</span>
                <span className="text-sm text-gray-900">{tenant.ownerId?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Email:</span>
                <span className="text-sm text-gray-900">{tenant.ownerId?.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Phone:</span>
                <span className="text-sm text-gray-900">{tenant.ownerId?.phone || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white shadow rounded-lg p-6 border-2 border-red-200">
            <h2 className="text-lg font-semibold text-red-900 mb-4">Danger Zone</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-900">Delete Tenant</p>
                  <p className="text-sm text-gray-500">Permanently delete this tenant and all associated data</p>
                </div>
                <button
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                >
                  <TrashIcon className="w-5 h-5 mr-2" />
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Subscription */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscription</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Plan</label>
                <select
                  value={subscriptionData.plan}
                  onChange={(e) => setSubscriptionData({ ...subscriptionData, plan: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {Object.entries(SUBSCRIPTION_PLANS).map(([key, value]) => (
                    <option key={value} value={value}>
                      {key.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={subscriptionData.status}
                  onChange={(e) => setSubscriptionData({ ...subscriptionData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="trial">Trial</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <button
                onClick={handleSubscriptionUpdate}
                disabled={updateSubMutation.isPending}
                className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                {updateSubMutation.isPending ? 'Updating...' : 'Update Subscription'}
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Users:</span>
                <span className="text-sm font-semibold text-gray-900">-</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Customers:</span>
                <span className="text-sm font-semibold text-gray-900">-</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Bookings:</span>
                <span className="text-sm font-semibold text-gray-900">-</span>
              </div>
              <Link
                to={`/tenants/${id}/stats`}
                className="block w-full text-center mt-4 px-4 py-2 border border-indigo-300 rounded-md text-sm font-medium text-indigo-700 hover:bg-indigo-50"
              >
                View Full Statistics
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantDetail;
