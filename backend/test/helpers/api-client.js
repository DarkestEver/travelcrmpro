/**
 * API Client Helper for Testing
 * Provides utilities for making API requests
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api/v1';

class ApiClient {
  constructor() {
    this.baseURL = BASE_URL;
    this.token = null;
    this.tenantId = null;
  }

  setToken(token) {
    this.token = token;
  }

  setTenant(tenantId) {
    this.tenantId = tenantId;
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (this.tenantId) {
      headers['X-Tenant-ID'] = this.tenantId;
    }

    return headers;
  }

  async request(method, endpoint, data = null, customHeaders = {}) {
    try {
      const config = {
        method,
        url: `${this.baseURL}${endpoint}`,
        headers: { ...this.getHeaders(), ...customHeaders },
        validateStatus: () => true // Don't throw on any status
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return {
        status: response.status,
        data: response.data,
        success: response.status >= 200 && response.status < 300
      };
    } catch (error) {
      return {
        status: error.response?.status || 500,
        data: error.response?.data || { error: error.message },
        success: false
      };
    }
  }

  async get(endpoint, customHeaders = {}) {
    return this.request('GET', endpoint, null, customHeaders);
  }

  async post(endpoint, data, customHeaders = {}) {
    return this.request('POST', endpoint, data, customHeaders);
  }

  async put(endpoint, data, customHeaders = {}) {
    return this.request('PUT', endpoint, data, customHeaders);
  }

  async delete(endpoint, customHeaders = {}) {
    return this.request('DELETE', endpoint, null, customHeaders);
  }

  async patch(endpoint, data, customHeaders = {}) {
    return this.request('PATCH', endpoint, data, customHeaders);
  }

  async healthCheck(maxRetries = 10, delayMs = 2000) {
    const axios = require('axios');
    for (let i = 0; i < maxRetries; i++) {
      try {
        // Try an actual API endpoint that should return 400 for invalid data
        const response = await axios.post(`${this.baseURL}/tenants`, {}, {
          timeout: 2000,
          validateStatus: () => true
        });
        if (response.status >= 200 && response.status < 600) {
          // Any response means server is up (even 400/500)
          return true;
        }
      } catch (error) {
        // Server not ready, wait and retry
      }
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    return false;
  }

  reset() {
    this.token = null;
    this.tenantId = null;
  }
}

module.exports = ApiClient;
