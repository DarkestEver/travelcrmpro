/**
 * Customer Dashboard API Service
 */

import customerAPI from './customerAuthAPI';

/**
 * Get dashboard summary
 */
export const getDashboardSummary = async () => {
  const response = await customerAPI.get('/dashboard/summary');
  return response.data;
};

/**
 * Get upcoming trips
 */
export const getUpcomingTrips = async () => {
  const response = await customerAPI.get('/dashboard/upcoming-trips');
  return response.data;
};

/**
 * Get recent activity
 */
export const getRecentActivity = async () => {
  const response = await customerAPI.get('/dashboard/recent-activity');
  return response.data;
};
