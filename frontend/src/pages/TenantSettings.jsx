import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  FiSettings, 
  FiImage, 
  FiMail, 
  FiPhone, 
  FiMapPin,
  FiGlobe,
  FiSave,
  FiUpload,
  FiX,
  FiCheck,
  FiAlertCircle,
  FiBriefcase,
  FiCreditCard,
  FiClock,
  FiDollarSign,
  FiEye,
  FiEyeOff,
  FiServer,
  FiExternalLink
} from 'react-icons/fi';
import api from '../services/api';
import PageWrapper from '../components/PageWrapper';

const TenantSettings = () => {
  console.log('🎯 TenantSettings component loaded - VERSION 2');
  
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('branding');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  
  // State for showing/hiding sensitive keys
  const [showStripeSecret, setShowStripeSecret] = useState(false);
  const [showPaypalSecret, setShowPaypalSecret] = useState(false);
  const [showRazorpaySecret, setShowRazorpaySecret] = useState(false);

  // Fetch current tenant settings
  const { data: tenantData, isLoading, error } = useQuery({
    queryKey: ['tenant', 'current'],
    queryFn: async () => {
      console.log('📥 TenantSettings: Fetching tenant data from /tenants/current');
      const response = await api.get('/tenants/current');
      console.log('📥 TenantSettings: Response.data:', response.data);
      
      // The API interceptor unwraps the response to just the data payload
      // Backend returns: { success, message, data: { tenant } }
      // But interceptor extracts response.data.data and returns it
      // So we receive: { tenant: {...} }
      const tenant = response.data.tenant;
      console.log('📥 TenantSettings: Extracted tenant:', tenant);
      return tenant;
    }
  });

  console.log('🔍 TenantSettings: Query state:', { 
    hasTenantData: !!tenantData, 
    isLoading, 
    hasError: !!error,
    tenantData 
  });

  const [formData, setFormData] = useState({
    name: '',
    settings: {
      branding: {
        companyName: '',
        primaryColor: '#4F46E5',
        secondaryColor: '#06B6D4',
        logo: ''
      },
      contact: {
        email: '',
        phone: '',
        address: '',
        city: '',
        country: '',
        website: ''
      },
      business: {
        operatingHours: {
          monday: { open: '09:00', close: '18:00', closed: false },
          tuesday: { open: '09:00', close: '18:00', closed: false },
          wednesday: { open: '09:00', close: '18:00', closed: false },
          thursday: { open: '09:00', close: '18:00', closed: false },
          friday: { open: '09:00', close: '18:00', closed: false },
          saturday: { open: '10:00', close: '16:00', closed: false },
          sunday: { open: '10:00', close: '16:00', closed: true }
        },
        autoApproveBookings: false,
        requireDepositForBooking: true,
        depositPercentage: 20,
        cancellationPolicy: 'Free cancellation up to 24 hours before the booking date.',
        refundPolicy: 'Refunds will be processed within 7-10 business days.',
        termsAndConditions: '',
        minimumBookingNotice: 24,
        maximumBookingAdvance: 365
      },
      email: {
        senderName: '',
        senderEmail: '',
        replyToEmail: '',
        emailSignature: '',
        showLogoInEmail: true,
        emailFooterText: '',
        trackingIdPrefix: 'TRK',
        enableTrackingId: true,
        trackingIdSequence: 0
      },
      payment: {
        acceptedMethods: ['cash', 'card', 'bank_transfer'],
        defaultCurrency: 'USD',
        taxRate: 0,
        serviceFeePercentage: 0,
        lateFeePercentage: 5,
        stripeEnabled: false,
        stripePublicKey: '',
        stripeSecretKey: '',
        paypalEnabled: false,
        paypalClientId: '',
        paypalClientSecret: '',
        razorpayEnabled: false,
        razorpayKeyId: '',
        razorpayKeySecret: '',
        bankAccountDetails: {
          accountName: '',
          accountNumber: '',
          bankName: '',
          swiftCode: '',
          iban: ''
        }
      }
    },
    metadata: {
      timezone: 'UTC',
      currency: 'USD'
    }
  });

  // Update form when tenant data loads
  useEffect(() => {
    if (tenantData) {
      console.log('🔍 TenantSettings: Loaded tenant data:', {
        name: tenantData.name,
        hasSettings: !!tenantData.settings,
        settingsKeys: tenantData.settings ? Object.keys(tenantData.settings) : [],
        branding: tenantData.settings?.branding,
        email: tenantData.settings?.email,
        contact: tenantData.settings?.contact
      });

      const newFormData = {
        name: tenantData.name || '',
        settings: {
          branding: {
            companyName: tenantData.settings?.branding?.companyName || '',
            primaryColor: tenantData.settings?.branding?.primaryColor || '#4F46E5',
            secondaryColor: tenantData.settings?.branding?.secondaryColor || '#06B6D4',
            logo: tenantData.settings?.branding?.logo || ''
          },
          contact: {
            email: tenantData.settings?.contact?.email || '',
            phone: tenantData.settings?.contact?.phone || '',
            address: tenantData.settings?.contact?.address || '',
            city: tenantData.settings?.contact?.city || '',
            country: tenantData.settings?.contact?.country || '',
            website: tenantData.settings?.contact?.website || ''
          },
          business: {
            operatingHours: tenantData.settings?.business?.operatingHours || {
              monday: { open: '09:00', close: '18:00', closed: false },
              tuesday: { open: '09:00', close: '18:00', closed: false },
              wednesday: { open: '09:00', close: '18:00', closed: false },
              thursday: { open: '09:00', close: '18:00', closed: false },
              friday: { open: '09:00', close: '18:00', closed: false },
              saturday: { open: '10:00', close: '16:00', closed: false },
              sunday: { open: '10:00', close: '16:00', closed: true }
            },
            autoApproveBookings: tenantData.settings?.business?.autoApproveBookings || false,
            requireDepositForBooking: tenantData.settings?.business?.requireDepositForBooking ?? true,
            depositPercentage: tenantData.settings?.business?.depositPercentage || 20,
            cancellationPolicy: tenantData.settings?.business?.cancellationPolicy || 'Free cancellation up to 24 hours before the booking date.',
            refundPolicy: tenantData.settings?.business?.refundPolicy || 'Refunds will be processed within 7-10 business days.',
            termsAndConditions: tenantData.settings?.business?.termsAndConditions || '',
            minimumBookingNotice: tenantData.settings?.business?.minimumBookingNotice || 24,
            maximumBookingAdvance: tenantData.settings?.business?.maximumBookingAdvance || 365
          },
          email: {
            senderName: tenantData.settings?.email?.senderName || '',
            senderEmail: tenantData.settings?.email?.senderEmail || '',
            replyToEmail: tenantData.settings?.email?.replyToEmail || '',
            emailSignature: tenantData.settings?.email?.emailSignature || '',
            showLogoInEmail: tenantData.settings?.email?.showLogoInEmail ?? true,
            emailFooterText: tenantData.settings?.email?.emailFooterText || '',
            trackingIdPrefix: tenantData.settings?.email?.trackingIdPrefix || 'TRK',
            enableTrackingId: tenantData.settings?.email?.enableTrackingId ?? true,
            trackingIdSequence: tenantData.settings?.email?.trackingIdSequence || 0
          },
          payment: {
            acceptedMethods: tenantData.settings?.payment?.acceptedMethods || ['cash', 'card', 'bank_transfer'],
            defaultCurrency: tenantData.settings?.payment?.defaultCurrency || 'USD',
            taxRate: tenantData.settings?.payment?.taxRate || 0,
            serviceFeePercentage: tenantData.settings?.payment?.serviceFeePercentage || 0,
            lateFeePercentage: tenantData.settings?.payment?.lateFeePercentage || 5,
            stripeEnabled: tenantData.settings?.payment?.stripeEnabled || false,
            stripePublicKey: tenantData.settings?.payment?.stripePublicKey || '',
            stripeSecretKey: tenantData.settings?.payment?.stripeSecretKey || '',
            paypalEnabled: tenantData.settings?.payment?.paypalEnabled || false,
            paypalClientId: tenantData.settings?.payment?.paypalClientId || '',
            paypalClientSecret: tenantData.settings?.payment?.paypalClientSecret || '',
            razorpayEnabled: tenantData.settings?.payment?.razorpayEnabled || false,
            razorpayKeyId: tenantData.settings?.payment?.razorpayKeyId || '',
            razorpayKeySecret: tenantData.settings?.payment?.razorpayKeySecret || '',
            bankAccountDetails: tenantData.settings?.payment?.bankAccountDetails || {
              accountName: '',
              accountNumber: '',
              bankName: '',
              swiftCode: '',
              iban: ''
            }
          }
        },
        metadata: {
          timezone: tenantData.metadata?.timezone || 'UTC',
          currency: tenantData.metadata?.currency || 'USD'
        }
      };

      console.log('🔍 TenantSettings: Setting form data:', {
        name: newFormData.name,
        settingsKeys: Object.keys(newFormData.settings),
        branding: newFormData.settings.branding,
        email: newFormData.settings.email
      });

      setFormData(newFormData);

      if (tenantData.settings?.branding?.logo) {
        setLogoPreview(tenantData.settings.branding.logo);
      }
    }
  }, [tenantData]);

  // Update tenant mutation
  const updateTenantMutation = useMutation({
    mutationFn: async (data) => {
      console.log('📤 TenantSettings: Sending PATCH request to /tenants/settings');
      console.log('Data:', JSON.stringify(data, null, 2));
      // Use /tenants/settings endpoint instead of /tenants/:id
      const response = await api.patch(`/tenants/settings`, data);
      console.log('✅ TenantSettings: Received response:', response.data);
      return response.data;
    },
    onSuccess: (responseData) => {
      console.log('✅ TenantSettings: Update successful');
      toast.success('Tenant settings updated successfully');
      queryClient.invalidateQueries(['tenant']);
    },
    onError: (error) => {
      console.error('❌ TenantSettings: Settings update error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to update settings');
    }
  });

  // Handle logo file selection
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast.error('Logo file size must be less than 2MB');
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let updatedData = { ...formData };

    // If logo file selected, convert to base64 and include
    if (logoFile) {
      updatedData.settings.branding.logo = logoPreview;
    }

    console.log('🚀 TenantSettings: Submitting data:', {
      name: updatedData.name,
      settingsKeys: Object.keys(updatedData.settings),
      branding: updatedData.settings.branding,
      email: updatedData.settings.email,
      contact: updatedData.settings.contact
    });

    updateTenantMutation.mutate(updatedData);
  };

  // Handle input changes
  const handleChange = (path, value) => {
    setFormData(prev => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const tabs = [
    { id: 'branding', label: 'Branding', icon: FiImage },
    { id: 'contact', label: 'Contact Information', icon: FiMail },
    { id: 'business', label: 'Business Rules', icon: FiBriefcase },
    { id: 'email', label: 'Email Settings', icon: FiMail },
    { id: 'email-accounts', label: 'Email Accounts', icon: FiServer, isLink: true, path: '/settings/email-accounts' },
    { id: 'tracking', label: 'Email Tracking', icon: FiClock },
    { id: 'payment', label: 'Payment Settings', icon: FiCreditCard },
    { id: 'preferences', label: 'Preferences', icon: FiSettings },
    { id: 'subscription', label: 'Subscription', icon: FiGlobe }
  ];

  if (isLoading) {
    return <PageWrapper loading={true} />;
  }

  return (
    <PageWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tenant Settings</h1>
            <p className="text-gray-600 mt-1">Manage your organization's settings and branding</p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={updateTenantMutation.isPending}
            className="btn btn-primary flex items-center gap-2"
          >
            <FiSave className="w-4 h-4" />
            {updateTenantMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              
              // If it's a link tab (Email Accounts), render as Link
              if (tab.isLink) {
                return (
                  <Link
                    key={tab.id}
                    to={tab.path}
                    className="py-4 px-1 border-b-2 border-transparent font-medium text-sm flex items-center gap-2 text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    <FiExternalLink className="w-3 h-3" />
                  </Link>
                );
              }
              
              // Regular tab button
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                    ${activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <form onSubmit={handleSubmit}>
          {/* Branding Tab */}
          {activeTab === 'branding' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Brand Identity</h2>
                
                {/* Company Name */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.settings.branding.companyName}
                    onChange={(e) => handleChange('settings.branding.companyName', e.target.value)}
                    className="input"
                    placeholder="Your Company Name"
                  />
                </div>

                {/* Logo Upload */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Logo
                  </label>
                  <div className="flex items-start gap-4">
                    {/* Logo Preview */}
                    <div className="flex-shrink-0">
                      <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                        {logoPreview ? (
                          <img 
                            src={logoPreview} 
                            alt="Logo preview" 
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <FiImage className="w-12 h-12 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Upload Controls */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <label className="btn btn-secondary cursor-pointer">
                          <FiUpload className="w-4 h-4 mr-2" />
                          Upload Logo
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                            onChange={handleLogoChange}
                            className="hidden"
                          />
                        </label>
                        {logoPreview && (
                          <button
                            type="button"
                            onClick={() => {
                              setLogoFile(null);
                              setLogoPreview(null);
                              handleChange('settings.branding.logo', '');
                            }}
                            className="btn btn-ghost text-red-600 hover:bg-red-50"
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Recommended: PNG, JPG or SVG. Max file size: 2MB. Ideal dimensions: 200x200px
                      </p>
                    </div>
                  </div>
                </div>

                {/* Color Scheme */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primary Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.settings.branding.primaryColor}
                        onChange={(e) => handleChange('settings.branding.primaryColor', e.target.value)}
                        className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.settings.branding.primaryColor}
                        onChange={(e) => handleChange('settings.branding.primaryColor', e.target.value)}
                        className="input flex-1"
                        placeholder="#4F46E5"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Secondary Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.settings.branding.secondaryColor}
                        onChange={(e) => handleChange('settings.branding.secondaryColor', e.target.value)}
                        className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.settings.branding.secondaryColor}
                        onChange={(e) => handleChange('settings.branding.secondaryColor', e.target.value)}
                        className="input flex-1"
                        placeholder="#06B6D4"
                      />
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Preview</h3>
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                      style={{ backgroundColor: formData.settings.branding.primaryColor }}
                    >
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="max-w-full max-h-full" />
                      ) : (
                        formData.settings.branding.companyName?.charAt(0) || 'C'
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {formData.settings.branding.companyName || 'Your Company Name'}
                      </h4>
                      <div className="flex gap-2 mt-1">
                        <span 
                          className="px-3 py-1 rounded text-white text-xs font-medium"
                          style={{ backgroundColor: formData.settings.branding.primaryColor }}
                        >
                          Primary
                        </span>
                        <span 
                          className="px-3 py-1 rounded text-white text-xs font-medium"
                          style={{ backgroundColor: formData.settings.branding.secondaryColor }}
                        >
                          Secondary
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contact Information Tab */}
          {activeTab === 'contact' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FiMail className="inline w-4 h-4 mr-1" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.settings.contact.email}
                    onChange={(e) => handleChange('settings.contact.email', e.target.value)}
                    className="input"
                    placeholder="contact@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FiPhone className="inline w-4 h-4 mr-1" />
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.settings.contact.phone}
                    onChange={(e) => handleChange('settings.contact.phone', e.target.value)}
                    className="input"
                    placeholder="+1 234 567 8900"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FiGlobe className="inline w-4 h-4 mr-1" />
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.settings.contact.website}
                    onChange={(e) => handleChange('settings.contact.website', e.target.value)}
                    className="input"
                    placeholder="https://www.yourcompany.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FiMapPin className="inline w-4 h-4 mr-1" />
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.settings.contact.address}
                    onChange={(e) => handleChange('settings.contact.address', e.target.value)}
                    className="input"
                    placeholder="123 Main Street"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.settings.contact.city}
                    onChange={(e) => handleChange('settings.contact.city', e.target.value)}
                    className="input"
                    placeholder="New York"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    value={formData.settings.contact.country}
                    onChange={(e) => handleChange('settings.contact.country', e.target.value)}
                    className="input"
                    placeholder="United States"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Business Rules Tab */}
          {activeTab === 'business' && (
            <div className="space-y-6">
              {/* Operating Hours */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">
                  <FiClock className="inline w-5 h-5 mr-2" />
                  Operating Hours
                </h2>
                <div className="space-y-3">
                  {Object.entries(formData.settings.business.operatingHours).map(([day, hours]) => (
                    <div key={day} className="flex items-center gap-4">
                      <div className="w-28">
                        <span className="text-sm font-medium text-gray-700 capitalize">{day}</span>
                      </div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!hours.closed}
                          onChange={(e) => {
                            const path = `settings.business.operatingHours.${day}.closed`;
                            handleChange(path, !e.target.checked);
                          }}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-600">Open</span>
                      </label>
                      {!hours.closed && (
                        <>
                          <input
                            type="time"
                            value={hours.open}
                            onChange={(e) => handleChange(`settings.business.operatingHours.${day}.open`, e.target.value)}
                            className="input w-32"
                          />
                          <span className="text-gray-500">to</span>
                          <input
                            type="time"
                            value={hours.close}
                            onChange={(e) => handleChange(`settings.business.operatingHours.${day}.close`, e.target.value)}
                            className="input w-32"
                          />
                        </>
                      )}
                      {hours.closed && (
                        <span className="text-sm text-gray-400 italic">Closed</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Booking Rules */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Booking Rules</h2>
                <div className="space-y-4">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.settings.business.autoApproveBookings}
                      onChange={(e) => handleChange('settings.business.autoApproveBookings', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Auto-approve bookings</div>
                      <div className="text-sm text-gray-600">Automatically confirm bookings without manual approval</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.settings.business.requireDepositForBooking}
                      onChange={(e) => handleChange('settings.business.requireDepositForBooking', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Require deposit for booking</div>
                      <div className="text-sm text-gray-600">Customers must pay a deposit to confirm</div>
                    </div>
                  </label>

                  {formData.settings.business.requireDepositForBooking && (
                    <div className="ml-9">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Deposit Percentage
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={formData.settings.business.depositPercentage}
                          onChange={(e) => handleChange('settings.business.depositPercentage', parseInt(e.target.value))}
                          className="flex-1"
                        />
                        <span className="text-sm font-medium text-gray-900 w-12">
                          {formData.settings.business.depositPercentage}%
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Booking Notice (hours)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.settings.business.minimumBookingNotice}
                        onChange={(e) => handleChange('settings.business.minimumBookingNotice', parseInt(e.target.value))}
                        className="input"
                        placeholder="24"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Advance Booking (days)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.settings.business.maximumBookingAdvance}
                        onChange={(e) => handleChange('settings.business.maximumBookingAdvance', parseInt(e.target.value))}
                        className="input"
                        placeholder="365"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Policies */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Policies</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cancellation Policy
                    </label>
                    <textarea
                      value={formData.settings.business.cancellationPolicy}
                      onChange={(e) => handleChange('settings.business.cancellationPolicy', e.target.value)}
                      rows="3"
                      className="input"
                      placeholder="Describe your cancellation policy..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Refund Policy
                    </label>
                    <textarea
                      value={formData.settings.business.refundPolicy}
                      onChange={(e) => handleChange('settings.business.refundPolicy', e.target.value)}
                      rows="3"
                      className="input"
                      placeholder="Describe your refund policy..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Terms and Conditions
                    </label>
                    <textarea
                      value={formData.settings.business.termsAndConditions}
                      onChange={(e) => handleChange('settings.business.termsAndConditions', e.target.value)}
                      rows="5"
                      className="input"
                      placeholder="Enter your terms and conditions..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Email Settings Tab */}
          {activeTab === 'email' && (
            <div className="space-y-6">
              {/* Email Configuration */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Email Configuration</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sender Name
                    </label>
                    <input
                      type="text"
                      value={formData.settings.email.senderName}
                      onChange={(e) => handleChange('settings.email.senderName', e.target.value)}
                      className="input"
                      placeholder="Your Company Name"
                    />
                    <p className="text-xs text-gray-500 mt-1">Name shown in "From" field</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sender Email
                    </label>
                    <input
                      type="email"
                      value={formData.settings.email.senderEmail}
                      onChange={(e) => handleChange('settings.email.senderEmail', e.target.value)}
                      className="input"
                      placeholder="noreply@company.com"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email address shown in "From" field</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reply-To Email
                    </label>
                    <input
                      type="email"
                      value={formData.settings.email.replyToEmail}
                      onChange={(e) => handleChange('settings.email.replyToEmail', e.target.value)}
                      className="input"
                      placeholder="support@company.com"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email where replies will be sent</p>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.settings.email.showLogoInEmail}
                      onChange={(e) => handleChange('settings.email.showLogoInEmail', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Show company logo in emails</span>
                  </label>
                </div>
              </div>

              {/* Email Signature */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Email Signature</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Signature Text
                  </label>
                  <textarea
                    value={formData.settings.email.emailSignature}
                    onChange={(e) => handleChange('settings.email.emailSignature', e.target.value)}
                    rows="4"
                    className="input"
                    placeholder="Best regards,&#10;Your Team"
                  />
                  <p className="text-xs text-gray-500 mt-1">This will be appended to all outgoing emails</p>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Footer Text
                  </label>
                  <input
                    type="text"
                    value={formData.settings.email.emailFooterText}
                    onChange={(e) => handleChange('settings.email.emailFooterText', e.target.value)}
                    className="input"
                    placeholder="© 2024 Your Company. All rights reserved."
                  />
                </div>
              </div>

              {/* Email Templates Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FiAlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Email Templates</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Advanced email template customization will be available in the next update. 
                      For now, standard templates will be used with your branding and signature.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Settings Tab */}
          {activeTab === 'payment' && (
            <div className="space-y-6">
              {/* Payment Methods */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">
                  <FiCreditCard className="inline w-5 h-5 mr-2" />
                  Accepted Payment Methods
                </h2>
                <div className="space-y-3">
                  {['cash', 'card', 'bank_transfer', 'paypal', 'stripe', 'razorpay'].map((method) => (
                    <label key={method} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.settings.payment.acceptedMethods.includes(method)}
                        onChange={(e) => {
                          const methods = e.target.checked
                            ? [...formData.settings.payment.acceptedMethods, method]
                            : formData.settings.payment.acceptedMethods.filter(m => m !== method);
                          handleChange('settings.payment.acceptedMethods', methods);
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700 capitalize">
                        {method.replace('_', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Payment Configuration */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">
                  <FiDollarSign className="inline w-5 h-5 mr-2" />
                  Fees & Charges
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.settings.payment.taxRate}
                      onChange={(e) => handleChange('settings.payment.taxRate', parseFloat(e.target.value))}
                      className="input"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Fee (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.settings.payment.serviceFeePercentage}
                      onChange={(e) => handleChange('settings.payment.serviceFeePercentage', parseFloat(e.target.value))}
                      className="input"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Late Fee (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.settings.payment.lateFeePercentage}
                      onChange={(e) => handleChange('settings.payment.lateFeePercentage', parseFloat(e.target.value))}
                      className="input"
                      placeholder="5"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Gateway Integration */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Payment Gateway Integration</h2>
                <div className="space-y-6">
                  
                  {/* Stripe */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <label className="flex items-center gap-3 mb-4">
                      <input
                        type="checkbox"
                        checked={formData.settings.payment.stripeEnabled}
                        onChange={(e) => handleChange('settings.payment.stripeEnabled', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">Stripe</div>
                        <div className="text-sm text-gray-600">Accept credit cards via Stripe</div>
                      </div>
                    </label>
                    
                    {formData.settings.payment.stripeEnabled && (
                      <div className="ml-7 space-y-3 border-t border-gray-100 pt-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Stripe Public Key (Publishable Key)
                          </label>
                          <input
                            type="text"
                            value={formData.settings.payment.stripePublicKey}
                            onChange={(e) => handleChange('settings.payment.stripePublicKey', e.target.value)}
                            className="input"
                            placeholder="pk_live_..."
                          />
                          <p className="text-xs text-gray-500 mt-1">This is safe to expose in your client-side code</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Stripe Secret Key
                          </label>
                          <div className="relative">
                            <input
                              type={showStripeSecret ? "text" : "password"}
                              value={formData.settings.payment.stripeSecretKey}
                              onChange={(e) => handleChange('settings.payment.stripeSecretKey', e.target.value)}
                              className="input pr-10"
                              placeholder="sk_live_..."
                            />
                            <button
                              type="button"
                              onClick={() => setShowStripeSecret(!showStripeSecret)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                              {showStripeSecret ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                            </button>
                          </div>
                          <p className="text-xs text-red-500 mt-1">⚠️ Keep this secret! Never share or commit to version control</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PayPal */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <label className="flex items-center gap-3 mb-4">
                      <input
                        type="checkbox"
                        checked={formData.settings.payment.paypalEnabled}
                        onChange={(e) => handleChange('settings.payment.paypalEnabled', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">PayPal</div>
                        <div className="text-sm text-gray-600">Accept payments via PayPal</div>
                      </div>
                    </label>
                    
                    {formData.settings.payment.paypalEnabled && (
                      <div className="ml-7 space-y-3 border-t border-gray-100 pt-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            PayPal Client ID
                          </label>
                          <input
                            type="text"
                            value={formData.settings.payment.paypalClientId}
                            onChange={(e) => handleChange('settings.payment.paypalClientId', e.target.value)}
                            className="input"
                            placeholder="AbCdEfGhIjKlMnOp..."
                          />
                          <p className="text-xs text-gray-500 mt-1">Your PayPal REST API Client ID</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            PayPal Client Secret
                          </label>
                          <div className="relative">
                            <input
                              type={showPaypalSecret ? "text" : "password"}
                              value={formData.settings.payment.paypalClientSecret}
                              onChange={(e) => handleChange('settings.payment.paypalClientSecret', e.target.value)}
                              className="input pr-10"
                              placeholder="ENC..."
                            />
                            <button
                              type="button"
                              onClick={() => setShowPaypalSecret(!showPaypalSecret)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                              {showPaypalSecret ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                            </button>
                          </div>
                          <p className="text-xs text-red-500 mt-1">⚠️ Keep this secret! Never share or commit to version control</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Razorpay */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <label className="flex items-center gap-3 mb-4">
                      <input
                        type="checkbox"
                        checked={formData.settings.payment.razorpayEnabled}
                        onChange={(e) => handleChange('settings.payment.razorpayEnabled', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">Razorpay</div>
                        <div className="text-sm text-gray-600">Accept payments via Razorpay (India)</div>
                      </div>
                    </label>
                    
                    {formData.settings.payment.razorpayEnabled && (
                      <div className="ml-7 space-y-3 border-t border-gray-100 pt-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Razorpay Key ID
                          </label>
                          <input
                            type="text"
                            value={formData.settings.payment.razorpayKeyId}
                            onChange={(e) => handleChange('settings.payment.razorpayKeyId', e.target.value)}
                            className="input"
                            placeholder="rzp_live_..."
                          />
                          <p className="text-xs text-gray-500 mt-1">Your Razorpay Key ID</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Razorpay Key Secret
                          </label>
                          <div className="relative">
                            <input
                              type={showRazorpaySecret ? "text" : "password"}
                              value={formData.settings.payment.razorpayKeySecret}
                              onChange={(e) => handleChange('settings.payment.razorpayKeySecret', e.target.value)}
                              className="input pr-10"
                              placeholder="..."
                            />
                            <button
                              type="button"
                              onClick={() => setShowRazorpaySecret(!showRazorpaySecret)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                              {showRazorpaySecret ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                            </button>
                          </div>
                          <p className="text-xs text-red-500 mt-1">⚠️ Keep this secret! Never share or commit to version control</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info Box */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <FiAlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900">How to Get API Keys</h4>
                        <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                          <li><strong>Stripe:</strong> Visit <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="underline">dashboard.stripe.com/apikeys</a></li>
                          <li><strong>PayPal:</strong> Visit <a href="https://developer.paypal.com/dashboard/" target="_blank" rel="noopener noreferrer" className="underline">developer.paypal.com</a></li>
                          <li><strong>Razorpay:</strong> Visit <a href="https://dashboard.razorpay.com/app/keys" target="_blank" rel="noopener noreferrer" className="underline">dashboard.razorpay.com/app/keys</a></li>
                        </ul>
                        <p className="text-sm text-blue-700 mt-2">
                          ✅ All secret keys are encrypted before storage for security.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bank Account Details */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Bank Account Details</h2>
                <p className="text-sm text-gray-600 mb-4">
                  For bank transfer payments, provide your account details
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Name
                    </label>
                    <input
                      type="text"
                      value={formData.settings.payment.bankAccountDetails.accountName}
                      onChange={(e) => handleChange('settings.payment.bankAccountDetails.accountName', e.target.value)}
                      className="input"
                      placeholder="Your Company Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={formData.settings.payment.bankAccountDetails.accountNumber}
                      onChange={(e) => handleChange('settings.payment.bankAccountDetails.accountNumber', e.target.value)}
                      className="input"
                      placeholder="1234567890"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={formData.settings.payment.bankAccountDetails.bankName}
                      onChange={(e) => handleChange('settings.payment.bankAccountDetails.bankName', e.target.value)}
                      className="input"
                      placeholder="Bank of America"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SWIFT Code
                    </label>
                    <input
                      type="text"
                      value={formData.settings.payment.bankAccountDetails.swiftCode}
                      onChange={(e) => handleChange('settings.payment.bankAccountDetails.swiftCode', e.target.value)}
                      className="input"
                      placeholder="BOFAUS3N"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      IBAN (if applicable)
                    </label>
                    <input
                      type="text"
                      value={formData.settings.payment.bankAccountDetails.iban}
                      onChange={(e) => handleChange('settings.payment.bankAccountDetails.iban', e.target.value)}
                      className="input"
                      placeholder="GB29 NWBK 6016 1331 9268 19"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Email Tracking Tab */}
          {activeTab === 'tracking' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FiClock className="w-5 h-5" />
                  Email Tracking ID Configuration
                </h2>
                <p className="text-gray-600 mb-6">
                  Configure unique tracking IDs that are embedded in every outbound email. 
                  These IDs ensure reliable conversation threading even when email headers are missing.
                </p>

                {/* Enable/Disable Tracking */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.settings.email.enableTrackingId}
                      onChange={(e) => handleChange('settings.email.enableTrackingId', e.target.checked)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Enable Email Tracking IDs</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Automatically add tracking IDs to all outbound emails for better conversation threading.
                        Provides 98-99% threading success rate.
                      </div>
                    </div>
                  </label>
                </div>

                {/* Tracking ID Prefix */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tracking ID Prefix
                  </label>
                  <input
                    type="text"
                    value={formData.settings.email.trackingIdPrefix}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 10);
                      handleChange('settings.email.trackingIdPrefix', value);
                    }}
                    className="input max-w-xs"
                    placeholder="TRK"
                    maxLength={10}
                    disabled={!formData.settings.email.enableTrackingId}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    2-10 uppercase letters only. This prefix appears in every tracking ID.
                  </p>
                </div>

                {/* Preview Box */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                  <h3 className="text-sm font-semibold text-indigo-900 mb-3">Tracking ID Preview</h3>
                  
                  <div className="space-y-4">
                    {/* Format Explanation */}
                    <div>
                      <div className="text-sm text-indigo-700 mb-2">Format:</div>
                      <div className="font-mono text-lg font-bold text-indigo-900 mb-2">
                        [{formData.settings.email.trackingIdPrefix || 'TRK'}-ABC12-001234]
                      </div>
                      <div className="text-xs text-indigo-600 space-y-1">
                        <div className="flex items-start gap-2">
                          <span className="font-semibold min-w-[80px]">{formData.settings.email.trackingIdPrefix || 'TRK'}</span>
                          <span className="text-indigo-700">= Your customizable prefix</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-semibold min-w-[80px]">ABC12</span>
                          <span className="text-indigo-700">= Customer email hash (groups conversations)</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-semibold min-w-[80px]">001234</span>
                          <span className="text-indigo-700">= Auto-incrementing sequence number</span>
                        </div>
                      </div>
                    </div>

                    {/* Example in Email */}
                    <div>
                      <div className="text-sm text-indigo-700 mb-2">How it appears in emails:</div>
                      <div className="bg-white border border-indigo-200 rounded p-3 text-xs">
                        <div className="text-gray-700 mb-3">
                          Dear Customer,<br /><br />
                          Thank you for your inquiry about our tour packages...<br /><br />
                          Best regards,<br />
                          Travel Team
                        </div>
                        <div className="border-t border-gray-200 pt-3 text-gray-600">
                          <div className="font-semibold text-gray-900">
                            Reference Number: [{formData.settings.email.trackingIdPrefix || 'TRK'}-ABC12-001234]
                          </div>
                          <div className="text-xs mt-1">
                            Please include this reference number in your reply for faster assistance.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Current Sequence Info */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-700">Current Sequence Number</div>
                      <div className="text-xs text-gray-500 mt-1">
                        This number auto-increments with each email sent
                      </div>
                    </div>
                    <div className="text-2xl font-mono font-bold text-gray-900">
                      {String(formData.settings.email.trackingIdSequence || 0).padStart(6, '0')}
                    </div>
                  </div>
                </div>

                {/* Benefits Box */}
                <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <FiCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium text-green-900 mb-2">Benefits of Tracking IDs:</div>
                      <ul className="text-sm text-green-800 space-y-1">
                        <li>✅ 98-99% threading success rate (vs 75-85% without)</li>
                        <li>✅ Works even when email clients strip headers</li>
                        <li>✅ Customers can reference the number when calling or emailing</li>
                        <li>✅ Professional appearance like support ticket systems</li>
                        <li>✅ Groups all emails to/from the same customer</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Documentation Link */}
                <div className="mt-6 p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">Need Help?</div>
                      <div className="text-sm text-gray-600 mt-1">
                        View complete documentation about the tracking ID system
                      </div>
                    </div>
                    <a 
                      href="https://github.com/DarkestEver/travelcrmpro/blob/master/docs/EMAIL_TRACKING_ID_SYSTEM.md" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-secondary flex items-center gap-2"
                    >
                      View Docs
                      <FiExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Regional Preferences</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FiGlobe className="inline w-4 h-4 mr-1" />
                    Timezone
                  </label>
                  <select
                    value={formData.metadata.timezone}
                    onChange={(e) => handleChange('metadata.timezone', e.target.value)}
                    className="input"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time (US)</option>
                    <option value="America/Chicago">Central Time (US)</option>
                    <option value="America/Denver">Mountain Time (US)</option>
                    <option value="America/Los_Angeles">Pacific Time (US)</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Asia/Dubai">Dubai</option>
                    <option value="Asia/Singapore">Singapore</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    value={formData.metadata.currency}
                    onChange={(e) => handleChange('metadata.currency', e.target.value)}
                    className="input"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="AED">AED - UAE Dirham</option>
                    <option value="SGD">SGD - Singapore Dollar</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                    <option value="AUD">AUD - Australian Dollar</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Subscription Tab */}
          {activeTab === 'subscription' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Subscription Details</h2>
              
              {tenantData && (
                <div className="space-y-4">
                  {/* Current Plan */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">Current Plan</h3>
                      <p className="text-sm text-gray-600">
                        {tenantData.subscription.plan.charAt(0).toUpperCase() + tenantData.subscription.plan.slice(1)}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      tenantData.subscription.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : tenantData.subscription.status === 'trial'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {tenantData.subscription.status.charAt(0).toUpperCase() + tenantData.subscription.status.slice(1)}
                    </span>
                  </div>

                  {/* Usage Limits */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="text-sm text-gray-600">Users</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {tenantData.usage.users} / {tenantData.settings.features.maxUsers}
                      </div>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="text-sm text-gray-600">Agents</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {tenantData.usage.agents} / {tenantData.settings.features.maxAgents}
                      </div>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="text-sm text-gray-600">Customers</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {tenantData.usage.customers} / {tenantData.settings.features.maxCustomers}
                      </div>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="text-sm text-gray-600">Bookings</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {tenantData.usage.bookings} / {tenantData.settings.features.maxBookings}
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-3">Enabled Features</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(tenantData.settings.features).filter(([key]) => key.startsWith('enable')).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2 text-sm">
                          {value ? (
                            <FiCheck className="w-4 h-4 text-green-500" />
                          ) : (
                            <FiX className="w-4 h-4 text-gray-400" />
                          )}
                          <span className={value ? 'text-gray-900' : 'text-gray-400'}>
                            {key.replace('enable', '').replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Trial Warning */}
                  {tenantData.subscription.status === 'trial' && tenantData.subscription.trialEndsAt && (
                    <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <FiAlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-900">Trial Period</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          Your trial expires on {new Date(tenantData.subscription.trialEndsAt).toLocaleDateString()}.
                          Upgrade to continue using all features.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </PageWrapper>
  );
};

export default TenantSettings;
