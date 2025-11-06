import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  FiUser, 
  FiLock, 
  FiSettings,
  FiClock,
  FiSave
} from 'react-icons/fi';
import { authAPI } from '../services/apiEndpoints';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('personal');

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: FiUser },
    { id: 'security', label: 'Security', icon: FiLock },
    { id: 'preferences', label: 'Preferences', icon: FiSettings },
    { id: 'activity', label: 'Activity Log', icon: FiClock },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
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

        <div className="p-6">
          {activeTab === 'personal' && <PersonalInfoTab />}
          {activeTab === 'security' && <SecurityTab />}
          {activeTab === 'preferences' && <PreferencesTab />}
          {activeTab === 'activity' && <ActivityLogTab />}
        </div>
      </div>
    </div>
  );
};

// Personal Info Tab
const PersonalInfoTab = () => {
  const [formData, setFormData] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1 234 567 8900',
    role: 'Admin',
    department: 'Operations',
    location: 'New York, USA',
  });

  const updateMutation = useMutation({
    mutationFn: (data) => authAPI.updateProfile(data),
    onSuccess: () => {
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="label">Full Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="input"
          />
        </div>

        <div>
          <label className="label">Email Address *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="input"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="label">Phone Number</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="input"
          />
        </div>

        <div>
          <label className="label">Role</label>
          <input
            type="text"
            name="role"
            value={formData.role}
            disabled
            className="input bg-gray-100"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="label">Department</label>
          <input
            type="text"
            name="department"
            value={formData.department}
            onChange={handleChange}
            className="input"
          />
        </div>

        <div>
          <label className="label">Location</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="input"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button 
          type="submit" 
          className="btn btn-primary flex items-center gap-2"
          disabled={updateMutation.isPending}
        >
          <FiSave className="w-4 h-4" />
          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

// Security Tab
const SecurityTab = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const changePasswordMutation = useMutation({
    mutationFn: (data) => authAPI.changePassword(data),
    onSuccess: () => {
      toast.success('Password changed successfully');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to change password');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleTwoFactor = () => {
    setTwoFactorEnabled(!twoFactorEnabled);
    toast.success(`Two-factor authentication ${!twoFactorEnabled ? 'enabled' : 'disabled'}`);
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Change Password */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Current Password *</label>
            <input
              type="password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              required
              className="input"
            />
          </div>

          <div>
            <label className="label">New Password *</label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              required
              minLength={8}
              className="input"
            />
            <p className="text-xs text-gray-500 mt-1">
              Must be at least 8 characters long
            </p>
          </div>

          <div>
            <label className="label">Confirm New Password *</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength={8}
              className="input"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Two-Factor Authentication */}
      <div className="border-t pt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Two-Factor Authentication</h3>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium">Two-Factor Authentication</p>
            <p className="text-sm text-gray-600">
              Add an extra layer of security to your account
            </p>
          </div>
          <button
            onClick={toggleTwoFactor}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              twoFactorEnabled ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="border-t pt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Active Sessions</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Chrome on Windows</p>
              <p className="text-sm text-gray-600">Current session • New York, USA</p>
            </div>
            <span className="badge badge-success">Active</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Safari on iPhone</p>
              <p className="text-sm text-gray-600">2 hours ago • New York, USA</p>
            </div>
            <button className="text-red-600 hover:text-red-800 text-sm font-medium">
              Revoke
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Preferences Tab
const PreferencesTab = () => {
  const [preferences, setPreferences] = useState({
    language: 'en',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD',
    emailNotifications: true,
    pushNotifications: false,
    weeklyReports: true,
  });

  const saveMutation = useMutation({
    mutationFn: (data) => authAPI.updatePreferences(data),
    onSuccess: () => {
      toast.success('Preferences saved successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to save preferences');
    },
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPreferences(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(preferences);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      {/* Regional Settings */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Regional Settings</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="label">Language</label>
            <select
              name="language"
              value={preferences.language}
              onChange={handleChange}
              className="input"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>

          <div>
            <label className="label">Timezone</label>
            <select
              name="timezone"
              value={preferences.timezone}
              onChange={handleChange}
              className="input"
            >
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
            </select>
          </div>

          <div>
            <label className="label">Date Format</label>
            <select
              name="dateFormat"
              value={preferences.dateFormat}
              onChange={handleChange}
              className="input"
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>

          <div>
            <label className="label">Currency</label>
            <select
              name="currency"
              value={preferences.currency}
              onChange={handleChange}
              className="input"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="JPY">JPY (¥)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="border-t pt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-gray-600">Receive email updates about your account</p>
            </div>
            <input
              type="checkbox"
              name="emailNotifications"
              checked={preferences.emailNotifications}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 rounded"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Push Notifications</p>
              <p className="text-sm text-gray-600">Receive push notifications in your browser</p>
            </div>
            <input
              type="checkbox"
              name="pushNotifications"
              checked={preferences.pushNotifications}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 rounded"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Weekly Reports</p>
              <p className="text-sm text-gray-600">Receive weekly summary reports</p>
            </div>
            <input
              type="checkbox"
              name="weeklyReports"
              checked={preferences.weeklyReports}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 rounded"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button 
          type="submit" 
          className="btn btn-primary flex items-center gap-2"
          disabled={saveMutation.isPending}
        >
          <FiSave className="w-4 h-4" />
          {saveMutation.isPending ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </form>
  );
};

// Activity Log Tab
const ActivityLogTab = () => {
  const activities = [
    {
      id: 1,
      action: 'Login',
      description: 'Logged in from Chrome on Windows',
      timestamp: '2024-01-15 10:30 AM',
      ip: '192.168.1.1',
    },
    {
      id: 2,
      action: 'Profile Updated',
      description: 'Updated phone number',
      timestamp: '2024-01-14 3:15 PM',
      ip: '192.168.1.1',
    },
    {
      id: 3,
      action: 'Password Changed',
      description: 'Password was changed successfully',
      timestamp: '2024-01-10 9:00 AM',
      ip: '192.168.1.5',
    },
    {
      id: 4,
      action: 'Login',
      description: 'Logged in from Safari on iPhone',
      timestamp: '2024-01-09 8:45 AM',
      ip: '192.168.1.10',
    },
    {
      id: 5,
      action: 'Settings Changed',
      description: 'Updated notification preferences',
      timestamp: '2024-01-08 2:30 PM',
      ip: '192.168.1.1',
    },
  ];

  return (
    <div className="max-w-3xl">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {activities.map((activity) => (
          <div key={activity.id} className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <p className="font-medium">{activity.action}</p>
                </div>
                <p className="text-sm text-gray-600 ml-5 mt-1">
                  {activity.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-500 ml-5 mt-2">
                  <span className="flex items-center gap-1">
                    <FiClock className="w-3 h-3" />
                    {activity.timestamp}
                  </span>
                  <span>IP: {activity.ip}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-center">
        <button className="btn-secondary">
          Load More Activity
        </button>
      </div>
    </div>
  );
};

export default Profile;
