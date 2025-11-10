/**
 * API Client Utility
 * Handles all HTTP requests with proper error handling
 */

const axios = require('axios');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api/v1';

class ApiClient {
  constructor() {
    this.tokens = {};
    this.baseURL = BASE_URL;
  }

  async request(method, endpoint, data = null, token = null) {
    try {
      const config = {
        method,
        url: `${this.baseURL}${endpoint}`,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return { 
        success: true, 
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || error.message,
        status: error.response?.status,
        details: error.response?.data
      };
    }
  }

  async get(endpoint, token = null) {
    return this.request('get', endpoint, null, token);
  }

  async post(endpoint, data, token = null) {
    return this.request('post', endpoint, data, token);
  }

  async patch(endpoint, data, token = null) {
    return this.request('patch', endpoint, data, token);
  }

  async delete(endpoint, token = null) {
    return this.request('delete', endpoint, null, token);
  }

  setToken(role, token) {
    this.tokens[role] = token;
  }

  getToken(role) {
    return this.tokens[role];
  }
}

module.exports = new ApiClient();
