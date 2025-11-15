/**
 * Automated UI and API Testing Script
 * Tests all routes and API endpoints to identify issues
 * 
 * Usage: node test-ui-apis.js
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api/v1';
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';

// Test credentials - update these with your super admin credentials
const TEST_USER = {
  email: process.env.TEST_EMAIL || 'admin@travelcrm.com',
  password: process.env.TEST_PASSWORD || 'Admin@123'
};

let authToken = null;
let testResults = {
  passed: [],
  failed: [],
  warnings: [],
  timestamp: new Date().toISOString()
};

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
  testResults.passed.push(message);
}

function logError(message) {
  log(`✗ ${message}`, 'red');
  testResults.failed.push(message);
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
  testResults.warnings.push(message);
}

function logInfo(message) {
  log(`ℹ ${message}`, 'cyan');
}

// API endpoints to test
const API_ENDPOINTS = [
  // Public endpoints (no auth)
  { method: 'GET', path: '/health', auth: false, name: 'Health Check' },
  
  // Auth endpoints
  { method: 'POST', path: '/auth/login', auth: false, name: 'Login', data: TEST_USER },
  
  // Core resources
  { method: 'GET', path: '/tenants', auth: true, name: 'Tenants List' },
  { method: 'GET', path: '/agents', auth: true, name: 'Agents List' },
  { method: 'GET', path: '/customers', auth: true, name: 'Customers List' },
  { method: 'GET', path: '/suppliers', auth: true, name: 'Suppliers List' },
  { method: 'GET', path: '/itineraries', auth: true, name: 'Itineraries List' },
  { method: 'GET', path: '/quotes', auth: true, name: 'Quotes List' },
  { method: 'GET', path: '/bookings', auth: true, name: 'Bookings List' },
  
  // Finance
  { method: 'GET', path: '/finance', auth: true, name: 'Finance Overview' },
  { method: 'GET', path: '/bank-reconciliation', auth: true, name: 'Bank Reconciliation' },
  { method: 'GET', path: '/currency/rates', auth: true, name: 'Currency Rates' },
  
  // Supplier Management
  { method: 'GET', path: '/supplier-inventory', auth: true, name: 'Supplier Inventory' },
  { method: 'GET', path: '/rate-sheets', auth: true, name: 'Rate Sheets' },
  { method: 'GET', path: '/inventory-sync/status', auth: true, name: 'Inventory Sync Status' },
  
  // Analytics
  { method: 'GET', path: '/analytics', auth: true, name: 'Analytics Overview' },
  { method: 'GET', path: '/demand-forecasting', auth: true, name: 'Demand Forecasting' },
  
  // Admin
  { method: 'GET', path: '/performance/metrics', auth: true, name: 'Performance Metrics' },
  { method: 'GET', path: '/notifications', auth: true, name: 'Notifications' },
  { method: 'GET', path: '/audit-logs', auth: true, name: 'Audit Logs' },
];

// Frontend routes to check (these would require a browser automation tool)
const FRONTEND_ROUTES = [
  '/',
  '/dashboard',
  '/agents',
  '/customers',
  '/suppliers',
  '/itineraries',
  '/quotes',
  '/bookings',
  '/analytics',
  '/finance/bank-reconciliation',
  '/finance/multi-currency',
  '/supplier/inventory',
  '/supplier/rate-sheets',
  '/admin/sync',
  '/admin/performance',
  '/admin/health',
];

async function testAPIEndpoint(endpoint) {
  const url = `${API_BASE_URL}${endpoint.path}`;
  
  try {
    const config = {
      method: endpoint.method,
      url: url,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (endpoint.auth && authToken) {
      config.headers['Authorization'] = `Bearer ${authToken}`;
    }

    if (endpoint.data) {
      config.data = endpoint.data;
    }

    const response = await axios(config);
    
    if (response.status >= 200 && response.status < 300) {
      logSuccess(`${endpoint.name}: ${endpoint.method} ${endpoint.path} → ${response.status}`);
      return { success: true, status: response.status, data: response.data };
    } else {
      logWarning(`${endpoint.name}: ${endpoint.method} ${endpoint.path} → ${response.status}`);
      return { success: false, status: response.status, data: response.data };
    }
  } catch (error) {
    const status = error.response?.status || 'Network Error';
    const message = error.response?.data?.message || error.message;
    
    logError(`${endpoint.name}: ${endpoint.method} ${endpoint.path} → ${status} - ${message}`);
    return { 
      success: false, 
      status: status, 
      error: message,
      details: error.response?.data 
    };
  }
}

async function login() {
  logInfo('Attempting to login...');
  
  const loginEndpoint = API_ENDPOINTS.find(e => e.path === '/auth/login');
  const result = await testAPIEndpoint(loginEndpoint);
  
  if (result.success && result.data?.data?.accessToken) {
    authToken = result.data.data.accessToken;
    logSuccess(`Login successful. Token: ${authToken.substring(0, 20)}...`);
    return true;
  } else if (result.success && result.data?.accessToken) {
    authToken = result.data.accessToken;
    logSuccess(`Login successful. Token: ${authToken.substring(0, 20)}...`);
    return true;
  } else {
    logError('Login failed - Cannot test authenticated endpoints');
    return false;
  }
}

async function testAllAPIs() {
  log('\n========================================', 'cyan');
  log('Starting API Endpoint Tests', 'cyan');
  log('========================================\n', 'cyan');

  // Test health check first
  const healthEndpoint = API_ENDPOINTS.find(e => e.path === '/health');
  await testAPIEndpoint(healthEndpoint);

  // Attempt login
  const loginSuccess = await login();
  
  if (!loginSuccess) {
    logWarning('Continuing with remaining non-auth tests...\n');
  }

  // Test all other endpoints
  const otherEndpoints = API_ENDPOINTS.filter(
    e => e.path !== '/health' && e.path !== '/auth/login'
  );

  for (const endpoint of otherEndpoints) {
    await testAPIEndpoint(endpoint);
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

async function checkFrontendStructure() {
  log('\n========================================', 'cyan');
  log('Checking Frontend File Structure', 'cyan');
  log('========================================\n', 'cyan');

  const frontendDir = path.join(__dirname, 'frontend', 'src');
  
  const criticalFiles = [
    'App.jsx',
    'main.jsx',
    'components/Sidebar.jsx',
    'components/RoleBasedRoute.jsx',
    'services/api.js',
    'services/api/supplierApi.js',
    'services/api/inventoryApi.js',
    'services/api/rateSheetApi.js',
    'stores/authStore.js',
  ];

  for (const file of criticalFiles) {
    const filePath = path.join(frontendDir, file);
    if (fs.existsSync(filePath)) {
      logSuccess(`Found: ${file}`);
    } else {
      logError(`Missing: ${file}`);
    }
  }
}

async function analyzeAPIServiceFiles() {
  log('\n========================================', 'cyan');
  log('Analyzing API Service Files', 'cyan');
  log('========================================\n', 'cyan');

  const apiServicesDir = path.join(__dirname, 'frontend', 'src', 'services', 'api');
  
  if (!fs.existsSync(apiServicesDir)) {
    logError('API services directory not found');
    return;
  }

  const files = fs.readdirSync(apiServicesDir).filter(f => f.endsWith('.js'));
  
  logInfo(`Found ${files.length} API service files\n`);

  for (const file of files) {
    const filePath = path.join(apiServicesDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Check for common issues
    const issues = [];
    
    // Check if file exports functions
    if (!content.includes('export ')) {
      issues.push('No exports found');
    }
    
    // Check if default export exists
    if (!content.includes('export default')) {
      issues.push('No default export');
    }
    
    // Check for API base import
    if (!content.includes("from '../api'") && !content.includes('from "../api"')) {
      issues.push('Missing API base import');
    }
    
    // Count exported functions
    const exportMatches = content.match(/export (const|function)/g);
    const exportCount = exportMatches ? exportMatches.length : 0;
    
    if (issues.length > 0) {
      logWarning(`${file}: ${issues.join(', ')} (${exportCount} exports)`);
    } else {
      logSuccess(`${file}: OK (${exportCount} exports)`);
    }
  }
}

async function checkForCommonIssues() {
  log('\n========================================', 'cyan');
  log('Checking for Common Issues', 'cyan');
  log('========================================\n', 'cyan');

  const issues = [];

  // Check Sidebar for duplicate menus
  const sidebarPath = path.join(__dirname, 'frontend', 'src', 'components', 'Sidebar.jsx');
  if (fs.existsSync(sidebarPath)) {
    const sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
    
    // Check for "Suppliers" mentions
    const suppliersMatches = sidebarContent.match(/name: ['"]Suppliers['"]/g);
    if (suppliersMatches && suppliersMatches.length > 1) {
      logWarning(`Sidebar has ${suppliersMatches.length} "Suppliers" menu items (potential duplicate)`);
    } else {
      logSuccess('No duplicate "Suppliers" menu items found');
    }
    
    // Check for "Supplier Management"
    if (sidebarContent.includes('Supplier Management')) {
      logSuccess('Found "Supplier Management" parent menu');
    }
  }

  // Check RoleBasedRoute for super_admin support
  const rbacPath = path.join(__dirname, 'frontend', 'src', 'components', 'RoleBasedRoute.jsx');
  if (fs.existsSync(rbacPath)) {
    const rbacContent = fs.readFileSync(rbacPath, 'utf-8');
    
    if (rbacContent.includes('super_admin')) {
      logSuccess('RoleBasedRoute references super_admin role');
    } else {
      logWarning('RoleBasedRoute may not handle super_admin role');
    }
  }

  // Check for _id vs id handling in API base
  const apiBasePath = path.join(__dirname, 'frontend', 'src', 'services', 'api.js');
  if (fs.existsSync(apiBasePath)) {
    const apiBaseContent = fs.readFileSync(apiBasePath, 'utf-8');
    
    if (apiBaseContent.includes('_id') || apiBaseContent.includes('transform')) {
      logInfo('API base has _id transformation logic');
    } else {
      logWarning('No _id transformation detected in API base');
    }
  }
}

function generateReport() {
  log('\n========================================', 'magenta');
  log('Test Summary Report', 'magenta');
  log('========================================\n', 'magenta');

  log(`✓ Passed: ${testResults.passed.length}`, 'green');
  log(`✗ Failed: ${testResults.failed.length}`, 'red');
  log(`⚠ Warnings: ${testResults.warnings.length}`, 'yellow');

  // Save detailed report to file
  const reportPath = path.join(__dirname, 'test-results.json');
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  log(`\nDetailed report saved to: ${reportPath}`, 'cyan');

  // Generate markdown report
  let markdown = `# UI & API Test Results\n\n`;
  markdown += `**Date**: ${testResults.timestamp}\n\n`;
  markdown += `## Summary\n\n`;
  markdown += `- ✅ Passed: ${testResults.passed.length}\n`;
  markdown += `- ❌ Failed: ${testResults.failed.length}\n`;
  markdown += `- ⚠️ Warnings: ${testResults.warnings.length}\n\n`;

  if (testResults.failed.length > 0) {
    markdown += `## Failed Tests\n\n`;
    testResults.failed.forEach((item, i) => {
      markdown += `${i + 1}. ${item}\n`;
    });
    markdown += `\n`;
  }

  if (testResults.warnings.length > 0) {
    markdown += `## Warnings\n\n`;
    testResults.warnings.forEach((item, i) => {
      markdown += `${i + 1}. ${item}\n`;
    });
    markdown += `\n`;
  }

  if (testResults.passed.length > 0) {
    markdown += `## Passed Tests\n\n`;
    testResults.passed.forEach((item, i) => {
      markdown += `${i + 1}. ${item}\n`;
    });
  }

  const mdReportPath = path.join(__dirname, 'TEST_RESULTS.md');
  fs.writeFileSync(mdReportPath, markdown);
  log(`Markdown report saved to: ${mdReportPath}`, 'cyan');
  
  log('\n========================================', 'magenta');
  
  if (testResults.failed.length === 0 && testResults.warnings.length === 0) {
    log('🎉 All tests passed!', 'green');
  } else if (testResults.failed.length === 0) {
    log('✓ All tests passed with some warnings', 'yellow');
  } else {
    log('Some tests failed. Please review the report.', 'red');
  }
  
  log('========================================\n', 'magenta');
}

async function main() {
  log('\n╔════════════════════════════════════════╗', 'blue');
  log('║  Travel CRM - Automated Test Suite    ║', 'blue');
  log('╚════════════════════════════════════════╝\n', 'blue');

  try {
    // Check if backend is running
    try {
      await axios.get(`${API_BASE_URL}/health`);
      logSuccess('Backend is running');
    } catch (error) {
      logError('Backend is not running. Please start it with: cd backend && npm run dev');
      process.exit(1);
    }

    // Run all tests
    await checkFrontendStructure();
    await analyzeAPIServiceFiles();
    await checkForCommonIssues();
    await testAllAPIs();
    
    // Generate reports
    generateReport();
    
  } catch (error) {
    logError(`Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run tests
main();
