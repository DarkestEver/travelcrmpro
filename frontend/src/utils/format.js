/**
 * Format currency with symbol and locale
 * @param {Number} amount - The amount to format
 * @param {String} currency - Currency code (default: USD)
 * @returns {String} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

/**
 * Format date to readable string
 * @param {String|Date} dateString - The date to format
 * @returns {String} Formatted date string
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format date with time
 * @param {String|Date} dateString - The date to format
 * @returns {String} Formatted date and time string
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format number with thousands separator
 * @param {Number} num - The number to format
 * @returns {String} Formatted number string
 */
export const formatNumber = (num) => {
  return new Intl.NumberFormat('en-US').format(num || 0);
};

/**
 * Format percentage
 * @param {Number} value - The value to format as percentage
 * @param {Number} decimals - Number of decimal places (default: 2)
 * @returns {String} Formatted percentage string
 */
export const formatPercentage = (value, decimals = 2) => {
  return `${(value || 0).toFixed(decimals)}%`;
};

/**
 * Format relative time (e.g., "2 hours ago")
 * @param {String|Date} dateString - The date to format
 * @returns {String} Relative time string
 */
export const formatRelativeTime = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return formatDate(dateString);
};

/**
 * Truncate text with ellipsis
 * @param {String} text - The text to truncate
 * @param {Number} maxLength - Maximum length before truncation
 * @returns {String} Truncated text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

export default {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  formatPercentage,
  formatRelativeTime,
  truncateText,
};
