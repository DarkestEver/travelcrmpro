/**
 * Tenant List Page
 * Displays all tenants with filtering and management options (Super Admin only)
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { getAllTenants, TENANT_STATUS, SUBSCRIPTION_PLANS } from '../../services/tenantAPI';

const TenantList = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    plan: '',
    search: '',
  });
  const limit = 20;

  // Fetch tenants
  const { data, isLoading, error } = useQuery({
    queryKey: ['tenants', page, filters],
    queryFn: () => getAllTenants({ page, limit, ...filters }),
  });

  const tenants = data?.data?.tenants || [];
  const pagination = data?.data?.pagination || {};

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setPage(1); // Reset to first page
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircleIcon, label: 'Active' },
      suspended: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircleIcon, label: 'Suspended' },
      inactive: { bg: 'bg-gray-100', text: 'text-gray-800', icon: XCircleIcon, label: 'Inactive' },
      trial: { bg: 'bg-blue-100', text: 'text-blue-800', icon: ClockIcon, label: 'Trial' },
    };
    const badge = badges[status] || badges.inactive;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="w-4 h-4 mr-1" />
        {badge.label}
      </span>
    );
  };

  const getPlanBadge = (plan) => {
    const colors = {
      free: 'bg-gray-100 text-gray-800',
      basic: 'bg-blue-100 text-blue-800',
      professional: 'bg-purple-100 text-purple-800',
      enterprise: 'bg-yellow-100 text-yellow-800',
    };
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${colors[plan] || colors.free}`}>
        {plan?.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tenant Management</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage all tenants, subscriptions, and configurations
            </p>
          </div>
          <Link
            to="/tenants/create"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Create Tenant
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, subdomain, or email"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Status</option>
              <option value={TENANT_STATUS.ACTIVE}>Active</option>
              <option value={TENANT_STATUS.TRIAL}>Trial</option>
              <option value={TENANT_STATUS.SUSPENDED}>Suspended</option>
              <option value={TENANT_STATUS.INACTIVE}>Inactive</option>
            </select>
          </div>

          {/* Plan Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
            <select
              value={filters.plan}
              onChange={(e) => handleFilterChange('plan', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Plans</option>
              <option value={SUBSCRIPTION_PLANS.FREE}>Free</option>
              <option value={SUBSCRIPTION_PLANS.BASIC}>Basic</option>
              <option value={SUBSCRIPTION_PLANS.PROFESSIONAL}>Professional</option>
              <option value={SUBSCRIPTION_PLANS.ENTERPRISE}>Enterprise</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tenant List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading tenants...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading tenants: {error.message}</p>
        </div>
      ) : tenants.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tenants found</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new tenant.</p>
          <div className="mt-6">
            <Link
              to="/tenants/create"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Tenant
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tenant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tenants.map((tenant) => (
                  <tr key={tenant._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <BuildingOfficeIcon className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                          <div className="text-sm text-gray-500">{tenant.subdomain}.travelcrm.com</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{tenant.ownerId?.name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{tenant.ownerId?.email || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPlanBadge(tenant.subscription?.plan)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(tenant.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/tenants/${tenant._id}`}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        View
                      </Link>
                      <Link
                        to={`/tenants/${tenant._id}/stats`}
                        className="text-green-600 hover:text-green-900"
                      >
                        Stats
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(page * limit, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span> results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= pagination.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TenantList;
