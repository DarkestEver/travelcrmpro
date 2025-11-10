/**
 * Customer Profile API Service
 */

import customerAPI from './customerAuthAPI';

/**
 * Get customer profile
 */
export const getProfile = async () => {
  const response = await customerAPI.get('/profile');
  return response.data;
};

/**
 * Update customer profile
 */
export const updateProfile = async (profileData) => {
  const response = await customerAPI.put('/profile', profileData);
  return response.data;
};

/**
 * Change password
 */
export const changePassword = async (currentPassword, newPassword) => {
  const response = await customerAPI.put('/profile/change-password', {
    currentPassword,
    newPassword,
  });
  return response.data;
};

/**
 * Update email
 */
export const updateEmail = async (email, password) => {
  const response = await customerAPI.put('/profile/update-email', {
    email,
    password,
  });
  return response.data;
};

/**
 * Upload document
 */
export const uploadDocument = async (documentData) => {
  const response = await customerAPI.post('/profile/documents', documentData);
  return response.data;
};

/**
 * Delete document
 */
export const deleteDocument = async (documentId) => {
  const response = await customerAPI.delete(`/profile/documents/${documentId}`);
  return response.data;
};
