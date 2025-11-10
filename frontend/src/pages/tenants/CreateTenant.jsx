/**
 * Create Tenant Page
 * Form to create a new tenant with owner account (Super Admin only)
 */

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { createTenant, SUBSCRIPTION_PLANS } from '../../services/tenantAPI';

const CreateTenant = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    customDomain: '',
    ownerName: '',
    ownerEmail: '',
    ownerPassword: '',
    ownerPhone: '',
    plan: SUBSCRIPTION_PLANS.FREE,
    settings: {
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      language: 'en',
    },
  });
  const [errors, setErrors] = useState({});

  const createMutation = useMutation({
    mutationFn: createTenant,
    onSuccess: (data) => {
      alert('Tenant created successfully!');
      navigate(`/tenants/${data.data.tenant._id}`);
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to create tenant');
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('settings.')) {
      const settingKey = name.split('.')[1];
      setFormData({
        ...formData,
        settings: { ...formData.settings, [settingKey]: value },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    // Clear error for this field
    setErrors({ ...errors, [name]: '' });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Tenant name is required';
    if (!formData.subdomain.trim()) newErrors.subdomain = 'Subdomain is required';
    if (!/^[a-z0-9-]+$/.test(formData.subdomain)) {
      newErrors.subdomain = 'Subdomain can only contain lowercase letters, numbers, and hyphens';
    }
    if (!formData.ownerName.trim()) newErrors.ownerName = 'Owner name is required';
    if (!formData.ownerEmail.trim()) newErrors.ownerEmail = 'Owner email is required';
    if (!/^\S+@\S+\.\S+$/.test(formData.ownerEmail)) {
      newErrors.ownerEmail = 'Invalid email format';
    }
    if (!formData.ownerPassword) newErrors.ownerPassword = 'Password is required';
    if (formData.ownerPassword.length < 6) {
      newErrors.ownerPassword = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      createMutation.mutate(formData);
    }
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
        <div className="flex items-center">
          <div className="flex-shrink-0 h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center">
            <BuildingOfficeIcon className="h-6 w-6 text-indigo-600" />
          </div>
          <div className="ml-4">
            <h1 className="text-2xl font-bold text-gray-900">Create New Tenant</h1>
            <p className="mt-1 text-sm text-gray-600">
              Set up a new tenant with owner account and subscription
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        {/* Tenant Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tenant Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tenant Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Tenant Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Acme Travel Agency"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Subdomain */}
            <div>
              <label htmlFor="subdomain" className="block text-sm font-medium text-gray-700 mb-2">
                Subdomain <span className="text-red-500">*</span>
              </label>
              <div className="flex">
                <input
                  type="text"
                  id="subdomain"
                  name="subdomain"
                  value={formData.subdomain}
                  onChange={handleChange}
                  className={`flex-1 px-4 py-2 border rounded-l-md focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.subdomain ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="acme-travel"
                />
                <span className="inline-flex items-center px-3 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 text-sm">
                  .travelcrm.com
                </span>
              </div>
              {errors.subdomain && <p className="mt-1 text-sm text-red-600">{errors.subdomain}</p>}
              <p className="mt-1 text-xs text-gray-500">Lowercase letters, numbers, and hyphens only</p>
            </div>

            {/* Custom Domain (Optional) */}
            <div className="md:col-span-2">
              <label htmlFor="customDomain" className="block text-sm font-medium text-gray-700 mb-2">
                Custom Domain (Optional)
              </label>
              <input
                type="text"
                id="customDomain"
                name="customDomain"
                value={formData.customDomain}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="travel.acme.com"
              />
              <p className="mt-1 text-xs text-gray-500">You'll need to configure DNS records</p>
            </div>
          </div>
        </div>

        {/* Owner Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Owner Account</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Owner Name */}
            <div>
              <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="ownerName"
                name="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.ownerName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="John Doe"
              />
              {errors.ownerName && <p className="mt-1 text-sm text-red-600">{errors.ownerName}</p>}
            </div>

            {/* Owner Email */}
            <div>
              <label htmlFor="ownerEmail" className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="ownerEmail"
                name="ownerEmail"
                value={formData.ownerEmail}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.ownerEmail ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="john@acme.com"
              />
              {errors.ownerEmail && <p className="mt-1 text-sm text-red-600">{errors.ownerEmail}</p>}
            </div>

            {/* Owner Phone */}
            <div>
              <label htmlFor="ownerPhone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                id="ownerPhone"
                name="ownerPhone"
                value={formData.ownerPhone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="+91 98765 43210"
              />
            </div>

            {/* Owner Password */}
            <div>
              <label htmlFor="ownerPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="ownerPassword"
                name="ownerPassword"
                value={formData.ownerPassword}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.ownerPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="••••••••"
              />
              {errors.ownerPassword && <p className="mt-1 text-sm text-red-600">{errors.ownerPassword}</p>}
              <p className="mt-1 text-xs text-gray-500">Minimum 6 characters</p>
            </div>
          </div>
        </div>

        {/* Subscription Plan */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscription Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Object.entries(SUBSCRIPTION_PLANS).map(([key, value]) => (
              <label
                key={value}
                className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer ${
                  formData.plan === value
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  type="radio"
                  name="plan"
                  value={value}
                  checked={formData.plan === value}
                  onChange={handleChange}
                  className="sr-only"
                />
                <span className="text-sm font-semibold text-gray-900 uppercase">{key}</span>
                <span className="mt-1 text-xs text-gray-500">
                  {value === 'free' && 'Basic features'}
                  {value === 'basic' && '₹999/month'}
                  {value === 'professional' && '₹2,999/month'}
                  {value === 'enterprise' && 'Custom pricing'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Default Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Currency */}
            <div>
              <label htmlFor="settings.currency" className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select
                id="settings.currency"
                name="settings.currency"
                value={formData.settings.currency}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>

            {/* Timezone */}
            <div>
              <label htmlFor="settings.timezone" className="block text-sm font-medium text-gray-700 mb-2">
                Timezone
              </label>
              <select
                id="settings.timezone"
                name="settings.timezone"
                value={formData.settings.timezone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST)</option>
              </select>
            </div>

            {/* Language */}
            <div>
              <label htmlFor="settings.language" className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                id="settings.language"
                name="settings.language"
                value={formData.settings.language}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="es">Spanish</option>
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/tenants')}
            className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Tenant'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTenant;
