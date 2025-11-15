import { test, expect } from '@playwright/test';

// Test configuration
const TEST_USER = {
  email: process.env.TEST_EMAIL || 'admin@travelcrm.com',
  password: process.env.TEST_PASSWORD || 'Admin@123'
};

const API_BASE = process.env.API_URL || 'http://localhost:5000/api/v1';

test.describe('Travel CRM - Complete User Journey Testing', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
  });

  test('01 - Login as Super Admin', async ({ page }) => {
    console.log('\n🔐 Testing login...');
    
    // Fill login form
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForURL(/\/(dashboard|home)/, { timeout: 10000 });
    
    // Check if redirected to dashboard
    expect(page.url()).toMatch(/\/(dashboard|home)/);
    
    console.log('✅ Login successful');
  });

  test('02 - Check Navigation Menu', async ({ page }) => {
    console.log('\n📋 Testing navigation menu...');
    
    // Login first
    await login(page, TEST_USER);
    
    // Check if sidebar is visible
    const sidebar = page.locator('[data-testid="sidebar"], nav, aside').first();
    await expect(sidebar).toBeVisible({ timeout: 5000 });
    
    // Check for main menu items
    const menuItems = [
      'Dashboard',
      'Agents',
      'Customers',
      'Itineraries',
      'Quotes',
      'Bookings',
      'Finance',
      'Supplier Management',
      'Analytics'
    ];
    
    for (const item of menuItems) {
      const menuLink = page.locator(`text="${item}"`).first();
      if (await menuLink.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log(`  ✅ Found: ${item}`);
      } else {
        console.log(`  ⚠️  Missing: ${item}`);
      }
    }
    
    console.log('✅ Navigation menu checked');
  });

  test('03 - Navigate to Agents Page', async ({ page }) => {
    console.log('\n👥 Testing Agents page...');
    
    await login(page, TEST_USER);
    
    // Click on Agents menu item
    await page.click('text="Agents"');
    await page.waitForURL(/\/agents/, { timeout: 5000 });
    
    // Check for page elements
    await expect(page.locator('h1, h2').filter({ hasText: /Agent/i }).first()).toBeVisible();
    
    // Check for table or list
    const hasTable = await page.locator('table').isVisible({ timeout: 2000 }).catch(() => false);
    const hasList = await page.locator('[role="list"], .list, .grid').isVisible({ timeout: 2000 }).catch(() => false);
    
    if (hasTable || hasList) {
      console.log('  ✅ Data display found');
    } else {
      console.log('  ⚠️  No data display found');
    }
    
    console.log('✅ Agents page loaded');
  });

  test('04 - Navigate to Customers Page', async ({ page }) => {
    console.log('\n👤 Testing Customers page...');
    
    await login(page, TEST_USER);
    
    await page.click('text="Customers"');
    await page.waitForURL(/\/customers/, { timeout: 5000 });
    
    await expect(page.locator('h1, h2').filter({ hasText: /Customer/i }).first()).toBeVisible();
    
    console.log('✅ Customers page loaded');
  });

  test('05 - Navigate to Suppliers Page', async ({ page }) => {
    console.log('\n🚚 Testing Suppliers page...');
    
    await login(page, TEST_USER);
    
    // Look for Supplier Management menu
    const supplierManagement = page.locator('text="Supplier Management"');
    
    if (await supplierManagement.isVisible({ timeout: 2000 })) {
      // Click to expand submenu
      await supplierManagement.click();
      await page.waitForTimeout(500);
      
      // Click Suppliers submenu item
      await page.click('text="Suppliers"');
    } else {
      // Try direct Suppliers link
      await page.click('text="Suppliers"');
    }
    
    await page.waitForURL(/\/suppliers/, { timeout: 5000 });
    
    await expect(page.locator('h1, h2').filter({ hasText: /Supplier/i }).first()).toBeVisible();
    
    console.log('✅ Suppliers page loaded');
  });

  test('06 - Check Finance Menu', async ({ page }) => {
    console.log('\n💰 Testing Finance menu...');
    
    await login(page, TEST_USER);
    
    // Click Finance menu
    const financeMenu = page.locator('text="Finance"');
    await financeMenu.click();
    await page.waitForTimeout(500);
    
    // Check for submenu items
    const submenuItems = [
      'Overview',
      'Bank Reconciliation',
      'Multi-Currency'
    ];
    
    for (const item of submenuItems) {
      const submenuLink = page.locator(`text="${item}"`);
      if (await submenuLink.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log(`  ✅ Found: ${item}`);
      } else {
        console.log(`  ⚠️  Missing: ${item}`);
      }
    }
    
    console.log('✅ Finance menu checked');
  });

  test('07 - Test Finance Overview Page', async ({ page }) => {
    console.log('\n📊 Testing Finance Overview...');
    
    await login(page, TEST_USER);
    
    // Navigate to Finance -> Overview
    await page.click('text="Finance"');
    await page.waitForTimeout(500);
    await page.click('text="Overview"');
    
    await page.waitForURL(/\/analytics|\/finance/, { timeout: 5000 });
    
    // Check for page load
    const pageLoaded = await page.locator('body').isVisible();
    expect(pageLoaded).toBeTruthy();
    
    // Check for errors in console
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    
    if (errors.length > 0) {
      console.log(`  ⚠️  Console errors found: ${errors.length}`);
      errors.forEach(err => console.log(`     - ${err}`));
    } else {
      console.log('  ✅ No console errors');
    }
    
    console.log('✅ Finance Overview checked');
  });

  test('08 - Test Bank Reconciliation Page', async ({ page }) => {
    console.log('\n🏦 Testing Bank Reconciliation...');
    
    await login(page, TEST_USER);
    
    // Track API calls
    const failedRequests = [];
    page.on('response', response => {
      if (response.status() >= 400) {
        failedRequests.push({
          url: response.url(),
          status: response.status()
        });
      }
    });
    
    // Navigate to Bank Reconciliation
    await page.click('text="Finance"');
    await page.waitForTimeout(500);
    await page.click('text="Bank Reconciliation"');
    
    await page.waitForTimeout(3000);
    
    // Check URL
    expect(page.url()).toContain('/bank-reconciliation');
    
    // Report failed requests
    if (failedRequests.length > 0) {
      console.log(`  ⚠️  Failed API requests: ${failedRequests.length}`);
      failedRequests.forEach(req => {
        console.log(`     ${req.status} - ${req.url}`);
      });
    } else {
      console.log('  ✅ All API requests successful');
    }
    
    console.log('✅ Bank Reconciliation page tested');
  });

  test('09 - Test Supplier Inventory Page', async ({ page }) => {
    console.log('\n📦 Testing Supplier Inventory...');
    
    await login(page, TEST_USER);
    
    const failedRequests = [];
    page.on('response', response => {
      if (response.status() >= 400) {
        failedRequests.push({
          url: response.url(),
          status: response.status()
        });
      }
    });
    
    // Navigate to Supplier Management -> Inventory
    await page.click('text="Supplier Management"');
    await page.waitForTimeout(500);
    await page.click('text="Inventory"');
    
    await page.waitForTimeout(2000);
    
    expect(page.url()).toMatch(/\/inventory/);
    
    if (failedRequests.length > 0) {
      console.log(`  ⚠️  Failed API requests: ${failedRequests.length}`);
      failedRequests.forEach(req => {
        console.log(`     ${req.status} - ${req.url}`);
      });
    } else {
      console.log('  ✅ All API requests successful');
    }
    
    console.log('✅ Supplier Inventory tested');
  });

  test('10 - Test Rate Sheets Page', async ({ page }) => {
    console.log('\n📄 Testing Rate Sheets...');
    
    await login(page, TEST_USER);
    
    const failedRequests = [];
    page.on('response', response => {
      if (response.status() >= 400) {
        failedRequests.push({
          url: response.url(),
          status: response.status()
        });
      }
    });
    
    await page.click('text="Supplier Management"');
    await page.waitForTimeout(500);
    await page.click('text="Rate Sheets"');
    
    await page.waitForTimeout(3000);
    
    expect(page.url()).toMatch(/\/rate-sheet/);
    
    if (failedRequests.length > 0) {
      console.log(`  ⚠️  Failed API requests: ${failedRequests.length}`);
      failedRequests.forEach(req => {
        console.log(`     ${req.status} - ${req.url}`);
      });
    }
    
    console.log('✅ Rate Sheets tested');
  });

  test('11 - Check for Permission Denied Errors', async ({ page }) => {
    console.log('\n🔒 Testing permissions...');
    
    await login(page, TEST_USER);
    
    // Monitor for permission errors
    let permissionDenied = false;
    page.on('response', async response => {
      if (response.status() === 403) {
        permissionDenied = true;
        console.log(`  ❌ 403 Forbidden: ${response.url()}`);
      }
    });
    
    // Visit key pages
    const pagesToTest = [
      { name: 'Agents', selector: 'text="Agents"', url: '/agents' },
      { name: 'Customers', selector: 'text="Customers"', url: '/customers' },
      { name: 'Analytics', selector: 'text="Analytics"', url: '/analytics' }
    ];
    
    for (const pageTest of pagesToTest) {
      await page.click(pageTest.selector);
      await page.waitForTimeout(2000);
      
      if (page.url().includes('/unauthorized') || page.url().includes('/403')) {
        console.log(`  ❌ Permission denied for: ${pageTest.name}`);
      } else {
        console.log(`  ✅ Access granted to: ${pageTest.name}`);
      }
    }
    
    expect(permissionDenied).toBe(false);
    
    console.log('✅ Permission checks completed');
  });

  test('12 - Check for Console Errors Across Pages', async ({ page }) => {
    console.log('\n🐛 Checking for console errors...');
    
    await login(page, TEST_USER);
    
    const allErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        allErrors.push(msg.text());
      }
    });
    
    const pagesToCheck = [
      'Dashboard',
      'Agents',
      'Customers'
    ];
    
    for (const pageName of pagesToCheck) {
      await page.click(`text="${pageName}"`);
      await page.waitForTimeout(2000);
      console.log(`  Checked: ${pageName}`);
    }
    
    // Check Suppliers (under Supplier Management submenu)
    // Ensure submenu is open
    const isSupplierMenuVisible = await page.locator('[href="/suppliers"]').isVisible().catch(() => false);
    if (!isSupplierMenuVisible) {
      await page.click('text="Supplier Management"');
      await page.waitForTimeout(500);
    }
    await page.click('[href="/suppliers"]');
    await page.waitForTimeout(2000);
    console.log(`  Checked: Suppliers`);
    
    if (allErrors.length > 0) {
      console.log(`\n  ⚠️  Total console errors: ${allErrors.length}`);
      // Show unique errors
      const uniqueErrors = [...new Set(allErrors)];
      uniqueErrors.slice(0, 10).forEach(err => {
        console.log(`     - ${err.substring(0, 100)}`);
      });
    } else {
      console.log('  ✅ No console errors detected');
    }
    
    console.log('✅ Console error check completed');
  });

  test('13 - Check for Network 404 Errors', async ({ page }) => {
    console.log('\n🌐 Checking for 404 errors...');
    
    await login(page, TEST_USER);
    
    const notFoundRequests = [];
    page.on('response', response => {
      if (response.status() === 404) {
        notFoundRequests.push(response.url());
      }
    });
    
    // Navigate through main pages
    const pages = ['Agents', 'Customers', 'Itineraries'];
    
    for (const pageName of pages) {
      await page.click(`text="${pageName}"`);
      await page.waitForTimeout(2000);
    }
    
    // Check Suppliers (under Supplier Management)
    const isSupplierMenuVisible2 = await page.locator('[href="/suppliers"]').isVisible().catch(() => false);
    if (!isSupplierMenuVisible2) {
      await page.click('text="Supplier Management"');
      await page.waitForTimeout(500);
    }
    await page.click('[href="/suppliers"]');
    await page.waitForTimeout(2000);
    
    if (notFoundRequests.length > 0) {
      console.log(`\n  ❌ 404 errors found: ${notFoundRequests.length}`);
      notFoundRequests.forEach(url => {
        console.log(`     - ${url}`);
      });
    } else {
      console.log('  ✅ No 404 errors detected');
    }
    
    console.log('✅ 404 check completed');
  });

  test('14 - Test _id vs id Issues', async ({ page }) => {
    console.log('\n🆔 Checking for ID field issues...');
    
    await login(page, TEST_USER);
    
    const idErrors = [];
    page.on('pageerror', error => {
      const errorText = error.toString();
      if (errorText.includes('_id') || errorText.includes("Cannot read property 'id'")) {
        idErrors.push(errorText);
      }
    });
    
    // Navigate to pages that display data
    // Use Supplier Management > Suppliers instead of direct Suppliers link
    const isSupplierMenuVisible3 = await page.locator('[href="/suppliers"]').isVisible().catch(() => false);
    if (!isSupplierMenuVisible3) {
      await page.click('text="Supplier Management"');
      await page.waitForTimeout(500);
    }
    await page.click('[href="/suppliers"]');
    await page.waitForTimeout(3000);
    
    if (idErrors.length > 0) {
      console.log(`  ❌ ID-related errors: ${idErrors.length}`);
      idErrors.forEach(err => console.log(`     - ${err.substring(0, 100)}`));
    } else {
      console.log('  ✅ No ID-related errors');
    }
    
    console.log('✅ ID field check completed');
  });

});

// Helper function to login
async function login(page, credentials) {
  // Check if already logged in
  if (page.url().includes('/dashboard') || page.url().includes('/home')) {
    return;
  }
  
  await page.goto('/login');
  await page.fill('input[type="email"]', credentials.email);
  await page.fill('input[type="password"]', credentials.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|home)/, { timeout: 10000 });
}
