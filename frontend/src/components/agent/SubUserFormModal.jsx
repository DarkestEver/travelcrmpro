import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSubUser, updateSubUser } from '../../services/agentSubUserAPI';
import { XMarkIcon } from '@heroicons/react/24/outline';

const SubUserFormModal = ({ isOpen, onClose, subUser }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    phone: '',
    notes: '',
    permissions: {
      customers: { view: false, create: false, edit: false, delete: false },
      quotes: { view: false, create: false, respond: false },
      bookings: { view: false, create: false, edit: false },
      reports: { view: false },
    },
  });

  useEffect(() => {
    if (subUser) {
      setFormData({
        name: subUser.name || '',
        email: subUser.email || '',
        password: '',
        role: subUser.role || 'user',
        phone: subUser.phone || '',
        notes: subUser.notes || '',
        permissions: subUser.permissions || formData.permissions,
      });
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'user',
        phone: '',
        notes: '',
        permissions: {
          customers: { view: false, create: false, edit: false, delete: false },
          quotes: { view: false, create: false, respond: false },
          bookings: { view: false, create: false, edit: false },
          reports: { view: false },
        },
      });
    }
  }, [subUser]);

  const createMutation = useMutation({
    mutationFn: createSubUser,
    onSuccess: () => {
      queryClient.invalidateQueries(['agent-sub-users']);
      alert('Sub-user created successfully');
      onClose();
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to create sub-user');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateSubUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['agent-sub-users']);
      alert('Sub-user updated successfully');
      onClose();
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to update sub-user');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      alert('Name and email are required');
      return;
    }

    if (!subUser && !formData.password) {
      alert('Password is required for new sub-users');
      return;
    }

    if (subUser) {
      const updateData = { ...formData };
      if (!updateData.password) {
        delete updateData.password;
      }
      updateMutation.mutate({ id: subUser._id, data: updateData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handlePermissionChange = (module, action) => {
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [module]: {
          ...formData.permissions[module],
          [action]: !formData.permissions[module][action],
        },
      },
    });
  };

  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    setFormData({ ...formData, role: newRole });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">
                {subUser ? 'Edit Sub-User' : 'Add New Sub-User'}
              </h3>
              <button onClick={onClose} className="text-white hover:text-gray-200">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {!subUser && '*'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required={!subUser}
                  placeholder={subUser ? 'Leave blank to keep current password' : ''}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={formData.role}
                onChange={handleRoleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="user">User (Limited Permissions)</option>
                <option value="admin">Admin (Full Access)</option>
              </select>
            </div>

            {/* Permissions (only for 'user' role) */}
            {formData.role === 'user' && (
              <div className="border border-gray-300 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  Permissions
                </h4>
                <div className="space-y-3">
                  {Object.keys(formData.permissions).map((module) => (
                    <div key={module} className="space-y-2">
                      <h5 className="text-sm font-medium text-gray-700 capitalize">
                        {module}
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {Object.keys(formData.permissions[module]).map((action) => (
                          <label key={action} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={formData.permissions[module][action]}
                              onChange={() => handlePermissionChange(module, action)}
                              className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-600 capitalize">
                              {action}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Optional notes about this sub-user..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isLoading || updateMutation.isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {createMutation.isLoading || updateMutation.isLoading
                  ? 'Saving...'
                  : subUser
                  ? 'Update'
                  : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SubUserFormModal;
