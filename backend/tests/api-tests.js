/**
 * Travel CRM API Automated Test Suite
 * Tests all backend endpoints systematically
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000/api/v1';
let accessToken = null;
let testData = {
  customerId: null,
  agentId: null,
  supplierId: null,
  itineraryId: null,
  quoteId: null,
  bookingId: null
};

// Test statistics
const stats = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m'
};

// Helper function to make API requests
async function testAPI(method, endpoint, data = null, token = null, testName) {
  stats.total++;
  console.log(`\n${colors.yellow}Testing: ${testName}${colors.reset}`);
  console.log(`${colors.gray}  ${method} ${endpoint}${colors.reset}`);
  
  return new Promise((resolve) => {
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api/v1${endpoint}`,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }
    
    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const responseData = body ? JSON.parse(body) : null;
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`${colors.green}  ✓ SUCCESS${colors.reset}`);
            console.log(`${colors.gray}  Status: ${res.statusCode}${colors.reset}`);
            if (responseData) {
              console.log(`${colors.gray}  Response: ${JSON.stringify(responseData).substring(0, 200)}...${colors.reset}`);
            }
            stats.passed++;
            resolve(responseData);
          } else {
            stats.failed++;
            console.log(`${colors.red}  ✗ FAILED${colors.reset}`);
            console.log(`${colors.red}  Status: ${res.statusCode}${colors.reset}`);
            if (responseData) {
              console.log(`${colors.red}  Details: ${JSON.stringify(responseData)}${colors.reset}`);
            }
            resolve(null);
          }
        } catch (error) {
          stats.failed++;
          console.log(`${colors.red}  ✗ FAILED - Parse Error${colors.reset}`);
          console.log(`${colors.red}  Error: ${error.message}${colors.reset}`);
          resolve(null);
        }
      });
    });
    
    req.on('error', (error) => {
      stats.failed++;
      console.log(`${colors.red}  ✗ FAILED${colors.reset}`);
      console.log(`${colors.red}  Error: ${error.message}${colors.reset}`);
      resolve(null);
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

// Sleep helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function for PDF endpoints (doesn't parse JSON)
async function testPDFEndpoint(method, endpoint, data = null, token = null, testName) {
  stats.total++;
  console.log(`\n${colors.yellow}Testing: ${testName}${colors.reset}`);
  console.log(`${colors.gray}  ${method} ${endpoint}${colors.reset}`);
  
  return new Promise((resolve) => {
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api/v1${endpoint}`,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }
    
    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`${colors.green}  ✓ SUCCESS (PDF)${colors.reset}`);
          console.log(`${colors.gray}  Status: ${res.statusCode}${colors.reset}`);
          console.log(`${colors.gray}  Content-Type: ${res.headers['content-type']}${colors.reset}`);
          console.log(`${colors.gray}  Size: ${body.length} bytes${colors.reset}`);
          stats.passed++;
          resolve({ success: true, isPDF: true, size: body.length });
        } else {
          stats.failed++;
          console.log(`${colors.red}  ✗ FAILED${colors.reset}`);
          console.log(`${colors.red}  Status: ${res.statusCode}${colors.reset}`);
          try {
            const errorData = JSON.parse(body);
            console.log(`${colors.red}  Error: ${JSON.stringify(errorData)}${colors.reset}`);
          } catch (e) {
            console.log(`${colors.red}  Response: ${body.substring(0, 200)}${colors.reset}`);
          }
          resolve(null);
        }
      });
    });
    
    req.on('error', (error) => {
      stats.failed++;
      console.log(`${colors.red}  ✗ FAILED${colors.reset}`);
      console.log(`${colors.red}  Error: ${error.message}${colors.reset}`);
      resolve(null);
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

async function runTests() {
  console.log(`\n${colors.cyan}========================================${colors.reset}`);
  console.log(`${colors.cyan}TRAVEL CRM API AUTOMATED TEST SUITE${colors.reset}`);
  console.log(`${colors.cyan}========================================${colors.reset}\n`);
  
  try {
    // ===========================================
    // HEALTH CHECK
    // ===========================================
    console.log(`\n${colors.magenta}=== HEALTH CHECK ===${colors.reset}`);
    await testAPI('GET', '/health', null, null, 'Server Health Check');
    
    // ===========================================
    // AUTHENTICATION MODULE
    // ===========================================
    console.log(`\n${colors.magenta}=== AUTHENTICATION MODULE ===${colors.reset}`);
    
    // 1. Register new user
    const registerData = {
      name: `Test User ${Math.floor(Math.random() * 10000)}`,
      email: `testuser${Math.floor(Math.random() * 10000)}@example.com`,
      phone: '+1234567890',
      password: 'Test@12345',
      role: 'agent'
    };
    await testAPI('POST', '/auth/register', registerData, null, '1. Register New User');
    
    // 2. Login with admin account
    const loginData = {
      email: 'admin@travelcrm.com',
      password: 'Admin@123'
    };
    const loginResponse = await testAPI('POST', '/auth/login', loginData, null, '2. Login with Admin Account');
    
    if (loginResponse && loginResponse.data && loginResponse.data.accessToken) {
      accessToken = loginResponse.data.accessToken;
      console.log(`${colors.green}  ✓ Access Token obtained${colors.reset}`);
    } else {
      console.log(`${colors.red}  ✗ Failed to get access token. Stopping tests.${colors.reset}`);
      return;
    }
    
    // 3. Get current user profile
    await testAPI('GET', '/auth/me', null, accessToken, '3. Get Current User Profile');
    
    // 4. Update profile
    const updateProfileData = {
      phone: '+1987654321'
    };
    await testAPI('PUT', '/auth/me', updateProfileData, accessToken, '4. Update User Profile');
    
    // 5. Change password
    const changePasswordData = {
      currentPassword: 'Admin@123',
      newPassword: 'Admin@123' // Keep same for future logins
    };
    const changePasswordResponse = await testAPI('PUT', '/auth/change-password', changePasswordData, accessToken, '5. Change Password');
    
    // Update token after password change
    if (changePasswordResponse && changePasswordResponse.data && changePasswordResponse.data.accessToken) {
      accessToken = changePasswordResponse.data.accessToken;
    }
    
    // 6. Refresh token (test token refresh endpoint)
    let refreshToken = null;
    if (loginResponse && loginResponse.data && loginResponse.data.refreshToken) {
      refreshToken = loginResponse.data.refreshToken;
      const refreshResponse = await testAPI('POST', '/auth/refresh-token', { 
        refreshToken: refreshToken 
      }, null, '6. Refresh Access Token');
      
      if (refreshResponse && refreshResponse.data && refreshResponse.data.accessToken) {
        // Token refreshed successfully, but keep using current token
        console.log(`${colors.green}  ✓ Token refresh successful${colors.reset}`);
      }
    }
    
    // 7. Reset password (will fail without email service)
    const resetPasswordData = {
      token: 'dummy-reset-token',
      newPassword: 'NewPassword@123'
    };
    await testAPI('POST', '/auth/reset-password', resetPasswordData, null, '7. Reset Password (No Token)');
    
    // 8. Logout
    await testAPI('POST', '/auth/logout', {}, accessToken, '8. Logout');
    
    // Re-login after logout to continue other tests
    const reloginResponse = await testAPI('POST', '/auth/login', loginData, null, '9. Re-login After Logout');
    if (reloginResponse && reloginResponse.data && reloginResponse.data.accessToken) {
      accessToken = reloginResponse.data.accessToken;
      console.log(`${colors.green}  ✓ Re-logged in successfully${colors.reset}`);
    }
    
    // ===========================================
    // CUSTOMERS MODULE
    // ===========================================
    console.log(`\n${colors.magenta}=== CUSTOMERS MODULE ===${colors.reset}`);
    
    // 1. Create customer
    const customerData = {
      name: 'John Doe',
      email: `john.doe${Math.floor(Math.random() * 10000)}@example.com`,
      phone: '+1234567890',
      company: 'Acme Corp',
      address: '123 Main St, New York, NY 10001'
    };
    const customerResponse = await testAPI('POST', '/customers', customerData, accessToken, '1. Create Customer');
    if (customerResponse && customerResponse.data && customerResponse.data.customer) {
      testData.customerId = customerResponse.data.customer._id;
    }
    
    // 2. Get all customers (to find our seeded customers)
    const customersListResponse = await testAPI('GET', '/customers?page=1&limit=10', null, accessToken, '2. Get All Customers (Paginated)');
    // Get first customer from the list for quote/booking tests (could be seeded customer)
    if (!testData.customerId && customersListResponse && customersListResponse.data && customersListResponse.data.length > 0) {
      testData.customerId = customersListResponse.data[0]._id;
    }
    
    if (testData.customerId) {
      // 3. Get customer by ID
      await testAPI('GET', `/customers/${testData.customerId}`, null, accessToken, '3. Get Customer by ID');
      
      // 4. Update customer
      const updateCustomerData = {
        company: 'New Corp Ltd'
      };
      await testAPI('PUT', `/customers/${testData.customerId}`, updateCustomerData, accessToken, '4. Update Customer');
      
      // 5. Add customer note
      const noteData = {
        note: 'This is a test note for the customer'
      };
      await testAPI('POST', `/customers/${testData.customerId}/notes`, noteData, accessToken, '5. Add Customer Note');
      
      // 6. Get customer notes
      await testAPI('GET', `/customers/${testData.customerId}/notes`, null, accessToken, '6. Get Customer Notes');
      
      // 8. Get customer quotes
      await testAPI('GET', `/customers/${testData.customerId}/quotes`, null, accessToken, '8. Get Customer Quotes');
      
      // 9. Get customer bookings
      await testAPI('GET', `/customers/${testData.customerId}/bookings`, null, accessToken, '9. Get Customer Bookings');
      
      // 10. Delete customer (commented to preserve data)
      // await testAPI('DELETE', `/customers/${testData.customerId}`, null, accessToken, '10. Delete Customer');
    }
    
    // 7. Get customer stats
    await testAPI('GET', '/customers/stats', null, accessToken, '7. Get Customer Statistics');
    
    // ===========================================
    // AGENTS MODULE
    // ===========================================
    console.log(`\n${colors.magenta}=== AGENTS MODULE ===${colors.reset}`);
    
    // 1. Get all agents (to find our seeded agent)
    const agentsListResponse = await testAPI('GET', '/agents?page=1&limit=10', null, accessToken, '1. Get All Agents');
    // Store first agent ID for quote creation
    if (agentsListResponse && agentsListResponse.data && agentsListResponse.data.length > 0) {
      testData.agentId = agentsListResponse.data[0]._id;
    }
    
    // 2. Get agent statistics
    await testAPI('GET', '/agents/stats', null, accessToken, '2. Get Agent Statistics');
    
    if (testData.agentId) {
      // 3. Get agent by ID
      await testAPI('GET', `/agents/${testData.agentId}`, null, accessToken, '3. Get Agent by ID');
      
      // 4. Update agent
      const updateAgentData = {
        phone: '+1122334455',
        address: {
          street: '789 Agent Ave',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          zipCode: '10001'
        }
      };
      await testAPI('PUT', `/agents/${testData.agentId}`, updateAgentData, accessToken, '4. Update Agent');
      
      // 5. Get agent performance
      await testAPI('GET', `/agents/${testData.agentId}/performance`, null, accessToken, '5. Get Agent Performance');
      
      // 6. Update agent status
      await testAPI('PATCH', `/agents/${testData.agentId}/status`, {
        status: 'active',
        notes: 'Top performing agent'
      }, accessToken, '6. Update Agent Status');
      
      // 7. Get agent customers
      await testAPI('GET', `/agents/${testData.agentId}/customers`, null, accessToken, '7. Get Agent Customers');
    }
    
    // ===========================================
    // SUPPLIERS MODULE
    // ===========================================
    console.log(`\n${colors.magenta}=== SUPPLIERS MODULE ===${colors.reset}`);
    
    // 1. Create supplier
    const supplierData = {
      companyName: 'Travel Supplier Inc',
      email: `supplier${Math.floor(Math.random() * 10000)}@example.com`,
      phone: '+1234567890',
      type: 'hotel',
      country: 'USA',
      city: 'Las Vegas',
      serviceTypes: ['hotel', 'transport'],
      address: '456 Hotel St, Las Vegas, NV 89101'
    };
    const supplierResponse = await testAPI('POST', '/suppliers', supplierData, accessToken, '1. Create Supplier');
    if (supplierResponse && supplierResponse.data) {
      testData.supplierId = supplierResponse.data._id;
    }
    
    // 2. Get all suppliers
    await testAPI('GET', '/suppliers?page=1&limit=10', null, accessToken, '2. Get All Suppliers');
    
    if (testData.supplierId) {
      // 3. Get supplier by ID
      await testAPI('GET', `/suppliers/${testData.supplierId}`, null, accessToken, '3. Get Supplier by ID');
      
      // 4. Update supplier
      const updateSupplierData = {
        phone: '+1987654321',
        serviceTypes: ['hotel', 'transport', 'activities']
      };
      await testAPI('PUT', `/suppliers/${testData.supplierId}`, updateSupplierData, accessToken, '4. Update Supplier');
      
      // 5. Get supplier services (if implemented)
      await testAPI('GET', `/suppliers/${testData.supplierId}/services`, null, accessToken, '5. Get Supplier Services');
      
      // 6. Add supplier service
      const serviceData = {
        name: 'Deluxe Room Package',
        type: 'accommodation',
        description: 'Luxury room with breakfast and spa access',
        cost: { amount: 250, currency: 'USD' },
        availability: 'year-round'
      };
      await testAPI('POST', `/suppliers/${testData.supplierId}/services`, serviceData, accessToken, '6. Add Supplier Service');
      
      // 7. Update supplier status
      await testAPI('PATCH', `/suppliers/${testData.supplierId}/status`, {
        status: 'active',
        notes: 'Verified and approved supplier'
      }, accessToken, '7. Update Supplier Status');
      
      // 8. Delete supplier (commented to preserve data)
      // await testAPI('DELETE', `/suppliers/${testData.supplierId}`, null, accessToken, '8. Delete Supplier');
    }
    
    // 5. Get supplier stats
    await testAPI('GET', '/suppliers/stats', null, accessToken, '5. Get Supplier Statistics');
    
    // ===========================================
    // ITINERARIES MODULE
    // ===========================================
    console.log(`\n${colors.magenta}=== ITINERARIES MODULE ===${colors.reset}`);
    
    // 1. Get itinerary templates
    await testAPI('GET', '/itineraries/templates', null, accessToken, '1. Get Itinerary Templates');
    
    // 2. Create itinerary
    const itineraryData = {
      title: 'Romantic Paris Getaway',
      description: 'A perfect 6-day romantic tour of Paris including the Eiffel Tower, Louvre Museum, and Seine River cruise',
      destination: {
        country: 'France',
        city: 'Paris'
      },
      duration: {
        days: 6,
        nights: 5
      },
      days: [
        {
          dayNo: 1,
          title: 'Arrival in Paris',
          components: [
            {
              type: 'transfer',
              title: 'Airport Pickup',
              description: 'Private transfer from CDG Airport to hotel',
              cost: { amount: 80, currency: 'USD' }
            },
            {
              type: 'stay',
              title: 'Hotel Check-in',
              description: '4-star hotel in central Paris',
              cost: { amount: 200, currency: 'USD' }
            }
          ]
        }
      ],
      highlights: ['Eiffel Tower Visit', 'Louvre Museum', 'Seine River Cruise', 'Arc de Triomphe'],
      inclusions: ['5 nights accommodation', 'Daily breakfast', 'Airport transfers', 'Guided city tour'],
      exclusions: ['International flights', 'Travel insurance', 'Personal expenses'],
      estimatedCost: {
        baseCost: 2500,
        currency: 'USD'
      }
    };
    const itineraryResponse = await testAPI('POST', '/itineraries', itineraryData, accessToken, '2. Create Itinerary');
    if (itineraryResponse && itineraryResponse.data && itineraryResponse.data.itinerary) {
      testData.itineraryId = itineraryResponse.data.itinerary._id;
    }
    
    // 3. Get all itineraries
    await testAPI('GET', '/itineraries?page=1&limit=10', null, accessToken, '3. Get All Itineraries');
    
    if (testData.itineraryId) {
      // 4. Get itinerary by ID
      await testAPI('GET', `/itineraries/${testData.itineraryId}`, null, accessToken, '4. Get Itinerary by ID');
      
      // 5. Update itinerary
      const updateItineraryData = {
        duration: {
          days: 7,
          nights: 6
        },
        highlights: ['Eiffel Tower Visit', 'Louvre Museum', 'Seine River Cruise', 'Arc de Triomphe', 'Versailles Palace']
      };
      await testAPI('PUT', `/itineraries/${testData.itineraryId}`, updateItineraryData, accessToken, '5. Update Itinerary');
      
      // 6. Calculate itinerary cost
      await testAPI('GET', `/itineraries/${testData.itineraryId}/calculate-cost`, null, accessToken, '6. Calculate Itinerary Cost');
      
      // 7. Duplicate itinerary
      const duplicateResponse = await testAPI('POST', `/itineraries/${testData.itineraryId}/duplicate`, { title: 'Paris Getaway - Copy' }, accessToken, '7. Duplicate Itinerary');
      
      // 8. Archive itinerary (using the duplicate)
      // Note: We'll test on a copy to preserve the original for quotes/bookings
      if (testData.itineraryId) {
        await testAPI('PATCH', `/itineraries/${testData.itineraryId}/archive`, {}, accessToken, '8. Archive Itinerary');
      }
      
      // 9. Publish itinerary as template (admin only)
      if (duplicateResponse && duplicateResponse.data && duplicateResponse.data.itinerary) {
        const duplicateId = duplicateResponse.data.itinerary._id;
        await testAPI('PATCH', `/itineraries/${duplicateId}/publish-template`, {
          templateName: 'Paris Romantic Getaway Template',
          category: 'romantic',
          isPublic: true
        }, accessToken, '9. Publish Itinerary as Template');
      }
      
      // 10. Delete itinerary (using duplicate to preserve original)
      if (duplicateResponse && duplicateResponse.data && duplicateResponse.data.itinerary) {
        const duplicateId = duplicateResponse.data.itinerary._id;
        // Comment out to preserve test data
        // await testAPI('DELETE', `/itineraries/${duplicateId}`, null, accessToken, '10. Delete Itinerary');
      }
    }
    
    // ===========================================
    // QUOTES MODULE
    // ===========================================
    console.log(`\n${colors.magenta}=== QUOTES MODULE ===${colors.reset}`);
    
    // 1. Get quote statistics
    await testAPI('GET', '/quotes/stats', null, accessToken, '1. Get Quote Statistics');
    
    // 2. Get all quotes
    await testAPI('GET', '/quotes?page=1&limit=10', null, accessToken, '2. Get All Quotes');
    
    if (testData.customerId && testData.itineraryId && testData.agentId) {
      // 3. Create quote (using seeded agent data)
      const quoteData = {
        itineraryId: testData.itineraryId,
        customerId: testData.customerId,
        agentId: testData.agentId, // Use seeded agent
        pricing: {
          baseCost: 2500,
          markup: {
            percentage: 15,
            amount: 375
          },
          taxes: {
            amount: 215.75,
            breakdown: [
              { name: 'GST', rate: 5, amount: 143.75 },
              { name: 'Service Tax', rate: 2.5, amount: 72 }
            ]
          },
          totalPrice: 3090.75,
          currency: 'USD'
        },
        numberOfTravelers: {
          adults: 2,
          children: 0,
          infants: 0
        },
        travelDates: {
          startDate: new Date('2025-12-01'),
          endDate: new Date('2025-12-07'),
          flexible: false
        },
        validUntil: new Date('2025-11-30'),
        notes: 'Special honeymoon package with romantic dinners and champagne',
        terms: '50% advance payment required at booking. Final balance due 30 days before departure.'
      };
      
      const quoteResponse = await testAPI('POST', '/quotes', quoteData, accessToken, '3. Create Quote');
      if (quoteResponse && quoteResponse.data && quoteResponse.data.quote) {
        testData.quoteId = quoteResponse.data.quote._id;
      }
      
      if (testData.quoteId) {
        // 4. Get quote by ID
        await testAPI('GET', `/quotes/${testData.quoteId}`, null, accessToken, '4. Get Quote by ID');
        
        // 5. Update quote
        const updateQuoteData = {
          pricing: {
            baseCost: 2600,
            markup: {
              percentage: 15,
              amount: 390
            },
            taxes: {
              amount: 224.25,
              breakdown: [
                { name: 'GST', rate: 5, amount: 149.50 },
                { name: 'Service Tax', rate: 2.5, amount: 74.75 }
              ]
            },
            totalPrice: 3214.25,
            currency: 'USD'
          },
          notes: 'Updated: Added premium hotel upgrade'
        };
        await testAPI('PUT', `/quotes/${testData.quoteId}`, updateQuoteData, accessToken, '5. Update Quote');
        
        // 6. Send quote to customer
        await testAPI('POST', `/quotes/${testData.quoteId}/send`, { 
          emailSubject: 'Your Travel Quote is Ready!',
          emailBody: 'Dear customer, please find your customized travel quote attached.'
        }, accessToken, '6. Send Quote to Customer');
        
        // 7. Accept quote (simulating customer/agent acceptance)
        await testAPI('PATCH', `/quotes/${testData.quoteId}/accept`, {
          notes: 'Customer agreed to all terms and conditions'
        }, accessToken, '7. Accept Quote');
        
        // 8. Create another quote for reject test
        const rejectQuoteData = {
          itineraryId: testData.itineraryId,
          customerId: testData.customerId,
          agentId: testData.agentId,
          validity: {
            validFrom: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
          },
          pricing: {
            baseCost: 2500.00,
            currency: 'USD'
          }
        };
        const rejectQuoteResponse = await testAPI('POST', '/quotes', rejectQuoteData, accessToken, '8. Create Quote for Reject Test');
        
        // 9. Send this quote first (required for reject)
        if (rejectQuoteResponse && rejectQuoteResponse.data && rejectQuoteResponse.data.quote) {
          const rejectQuoteId = rejectQuoteResponse.data.quote._id;
          await testAPI('POST', `/quotes/${rejectQuoteId}/send`, { 
            emailSubject: 'Alternative Quote',
            emailBody: 'Alternative pricing option'
          }, accessToken, '9. Send Quote for Reject Test');
          
          // 10. Reject quote (simulating customer rejection)
          await testAPI('PATCH', `/quotes/${rejectQuoteId}/reject`, {
            reason: 'Customer found better pricing elsewhere',
            notes: 'Competitor offered 15% discount'
          }, accessToken, '10. Reject Quote');
          
          // 11. Delete rejected quote
          // await testAPI('DELETE', `/quotes/${rejectQuoteId}`, null, accessToken, '11. Delete Rejected Quote');
        }
      }
    }
    
    // ===========================================
    // BOOKINGS MODULE
    // ===========================================
    console.log(`\n${colors.magenta}=== BOOKINGS MODULE ===${colors.reset}`);
    
    // 1. Get booking statistics
    await testAPI('GET', '/bookings/stats', null, accessToken, '1. Get Booking Statistics');
    
    // 2. Get all bookings
    await testAPI('GET', '/bookings?page=1&limit=10', null, accessToken, '2. Get All Bookings');
    
    if (testData.quoteId && testData.customerId && testData.itineraryId) {
      // 3. Create booking from accepted quote
      const bookingData = {
        quoteId: testData.quoteId,
        travelers: [
          {
            name: 'John Doe',
            age: 32,
            passportNumber: 'P12345678',
            passportExpiry: new Date('2028-12-31'),
            nationality: 'USA',
            specialRequests: 'Vegetarian meals'
          },
          {
            name: 'Jane Doe',
            age: 30,
            passportNumber: 'P87654321',
            passportExpiry: new Date('2029-06-30'),
            nationality: 'USA',
            specialRequests: 'Window seat preference'
          }
        ],
        travelDates: {
          startDate: new Date('2025-12-01'),
          endDate: new Date('2025-12-07')
        },
        specialRequests: 'Honeymoon package - champagne and flowers in room on arrival'
      };
      
      const bookingResponse = await testAPI('POST', '/bookings', bookingData, accessToken, '3. Create Booking from Quote');
      if (bookingResponse && bookingResponse.data && bookingResponse.data.booking) {
        testData.bookingId = bookingResponse.data.booking._id;
      }
      
      if (testData.bookingId) {
        // 4. Get booking by ID
        await testAPI('GET', `/bookings/${testData.bookingId}`, null, accessToken, '4. Get Booking by ID');
        
        // 5. Add first payment (50% advance)
        const firstPaymentData = {
          amount: 1607.38, // 50% of 3214.25
          method: 'credit_card',
          transactionId: `TXN${Math.floor(Math.random() * 10000000)}`,
          status: 'completed',
          notes: '50% advance payment - credit card'
        };
        await testAPI('POST', `/bookings/${testData.bookingId}/payment`, firstPaymentData, accessToken, '5. Add Advance Payment (50%)');
        
        // 6. Confirm booking
        await testAPI('PATCH', `/bookings/${testData.bookingId}/confirm`, {
          confirmationNotes: 'All hotels, flights, and transfers confirmed with suppliers'
        }, accessToken, '6. Confirm Booking');
        
        // 7. Add second payment (remaining 50%)
        const secondPaymentData = {
          amount: 1606.87, // Remaining 50%
          method: 'bank_transfer',
          transactionId: `TXN${Math.floor(Math.random() * 10000000)}`,
          status: 'completed',
          notes: 'Final balance payment - bank transfer'
        };
        await testAPI('POST', `/bookings/${testData.bookingId}/payment`, secondPaymentData, accessToken, '7. Add Final Payment (50%)');
        
        // 8. Update booking
        const updateBookingData = {
          specialRequests: 'Updated: Also arrange airport pickup with welcome sign',
          travelers: [
            {
              name: 'John Doe',
              age: 32,
              passportNumber: 'P12345678',
              passportExpiry: new Date('2028-12-31'),
              nationality: 'USA',
              specialRequests: 'Vegetarian meals + gluten-free options'
            },
            {
              name: 'Jane Doe',
              age: 30,
              passportNumber: 'P87654321',
              passportExpiry: new Date('2029-06-30'),
              nationality: 'USA',
              specialRequests: 'Window seat preference'
            }
          ]
        };
        await testAPI('PUT', `/bookings/${testData.bookingId}`, updateBookingData, accessToken, '8. Update Booking Details');
        
        // 9. Complete booking (after travel)
        await testAPI('PATCH', `/bookings/${testData.bookingId}/complete`, {
          completionNotes: 'Customer successfully completed the trip. Positive feedback received.'
        }, accessToken, '9. Complete Booking');
      }
    }
    
    // ===========================================
    // NOTIFICATIONS MODULE
    // ===========================================
    console.log(`\n${colors.magenta}=== NOTIFICATIONS MODULE ===${colors.reset}`);
    
    // 1. Get unread notification count
    await testAPI('GET', '/notifications/unread-count', null, accessToken, '1. Get Unread Notification Count');
    
    // 2. Get all notifications
    const notificationsResponse = await testAPI('GET', '/notifications?page=1&limit=10', null, accessToken, '2. Get All Notifications');
    
    let notificationId = null;
    if (notificationsResponse && notificationsResponse.data && notificationsResponse.data.length > 0) {
      notificationId = notificationsResponse.data[0]._id;
      
      // 3. Mark notification as read
      await testAPI('PUT', `/notifications/${notificationId}/read`, {}, accessToken, '3. Mark Notification as Read');
    }
    
    // 4. Mark all notifications as read
    await testAPI('PUT', '/notifications/read-all', {}, accessToken, '4. Mark All Notifications as Read');
    
    // 5. Create test notification (if available)
    await testAPI('POST', '/notifications/test', {
      title: 'Test Notification',
      message: 'This is a test notification',
      type: 'info'
    }, accessToken, '5. Create Test Notification');
    
    // Get notifications again to check for the test notification
    const notifications2Response = await testAPI('GET', '/notifications?page=1&limit=10', null, accessToken, '6. Get All Notifications (After Test)');
    
    if (notifications2Response && notifications2Response.data && notifications2Response.data.length > 0) {
      const testNotifId = notifications2Response.data[0]._id;
      // 7. Delete notification
      await testAPI('DELETE', `/notifications/${testNotifId}`, null, accessToken, '7. Delete Notification');
    }
    
    // ===========================================
    // ADDITIONAL CUSTOMER TESTS
    // ===========================================
    console.log(`\n${colors.magenta}=== ADDITIONAL CUSTOMER TESTS ===${colors.reset}`);
    
    if (testData.customerId) {
      // NOTE: Customer quotes/bookings routes not yet implemented - skipping
      // 1. Get customer quotes
      // await testAPI('GET', `/customers/${testData.customerId}/quotes`, null, accessToken, '1. Get Customer Quotes');
      
      // 2. Get customer bookings
      // await testAPI('GET', `/customers/${testData.customerId}/bookings`, null, accessToken, '2. Get Customer Bookings');
      
      // Note: We won't test DELETE customer to preserve test data
      // 3. Delete customer (optional - commented out to preserve data)
      // await testAPI('DELETE', `/customers/${testData.customerId}`, null, accessToken, '3. Delete Customer');
    }
    
    // ===========================================
    // ADDITIONAL AGENT TESTS
    // ===========================================
    console.log(`\n${colors.magenta}=== ADDITIONAL AGENT TESTS ===${colors.reset}`);
    
    // 1. Create new agent profile (for testing)
    const newAgentData = {
      userId: testData.userId, // Using test user created during registration
      agencyName: 'New Travel Agency',
      licenseNumber: `LIC${Math.floor(Math.random() * 1000000)}`,
      contactPerson: 'Test Agent Manager',
      officeAddress: '456 Business Ave, New York, NY 10002',
      creditLimit: 15000,
      commissionRate: 12.5
    };
    const newAgentResponse = await testAPI('POST', '/agents', newAgentData, accessToken, '1. Create Agent Profile');
    
    let newAgentId = null;
    if (newAgentResponse && newAgentResponse.data && newAgentResponse.data.agent) {
      newAgentId = newAgentResponse.data.agent._id;
    }
    
    if (testData.agentId) {
      // 2. Get agent by ID
      await testAPI('GET', `/agents/${testData.agentId}`, null, accessToken, '2. Get Agent by ID');
      
      // 3. Update agent
      const updateAgentData = {
        agencyName: 'Updated Travel Agency Name',
        creditLimit: 20000,
        commissionRate: 15
      };
      await testAPI('PUT', `/agents/${testData.agentId}`, updateAgentData, accessToken, '3. Update Agent');
      
      // 4. Get agent performance - Route not yet implemented
      // await testAPI('GET', `/agents/${testData.agentId}/performance?startDate=2025-01-01&endDate=2025-12-31`, null, accessToken, '4. Get Agent Performance');
      
      // 5. Update agent status - Route not yet implemented
      // await testAPI('PATCH', `/agents/${testData.agentId}/status`, { 
      //   status: 'active',
      //   notes: 'Agent verified and approved'
      // }, accessToken, '5. Update Agent Status');
    }
    
    // ===========================================
    // ADDITIONAL SUPPLIER TESTS
    // ===========================================
    console.log(`\n${colors.magenta}=== ADDITIONAL SUPPLIER TESTS ===${colors.reset}`);
    
    if (testData.supplierId) {
      // 1. Get supplier by ID
      await testAPI('GET', `/suppliers/${testData.supplierId}`, null, accessToken, '1. Get Supplier by ID');
      
      // 2. Update supplier
      const updateSupplierData = {
        companyName: 'Updated Supplier Company',
        creditLimit: 25000,
        paymentTerms: 'Net 45 days'
      };
      await testAPI('PUT', `/suppliers/${testData.supplierId}`, updateSupplierData, accessToken, '2. Update Supplier');
      
      // 3. Get supplier services
      await testAPI('GET', `/suppliers/${testData.supplierId}/services`, null, accessToken, '3. Get Supplier Services');
      
      // 4. Add supplier service
      const serviceData = {
        serviceName: 'Premium Hotel Package',
        serviceType: 'accommodation',
        description: 'Luxury 5-star hotel with breakfast included',
        pricing: {
          basePrice: 200,
          currency: 'USD',
          unit: 'per night'
        },
        availability: true
      };
      await testAPI('POST', `/suppliers/${testData.supplierId}/services`, serviceData, accessToken, '4. Add Supplier Service');
      
      // 5. Update supplier status
      await testAPI('PATCH', `/suppliers/${testData.supplierId}/status`, { 
        status: 'active',
        notes: 'Supplier verified and contracts signed'
      }, accessToken, '5. Update Supplier Status');
    }
    
    // ===========================================
    // ADDITIONAL AUTH TESTS
    // ===========================================
    console.log(`\n${colors.magenta}=== ADDITIONAL AUTH TESTS ===${colors.reset}`);
    
    // NOTE: Refresh token route not yet implemented - skipping
    // 1. Refresh token (assuming the token is still valid)
    // const refreshResponse = await testAPI('POST', '/auth/refresh-token', {
    //   refreshToken: accessToken // In real scenario, use separate refresh token
    // }, accessToken, '1. Refresh Access Token');
    
    // 2. Forgot password
    await testAPI('POST', '/auth/forgot-password', {
      email: 'admin@travelcrm.com' // Use known admin email
    }, null, '2. Forgot Password Request');
    
    // Note: Reset password requires email token, so we'll simulate it
    // 3. Reset password (would need token from email in real scenario)
    // await testAPI('POST', '/auth/reset-password', { token: 'email-token', newPassword: 'NewPass123!' }, null, '3. Reset Password');
    
    // NOTE: Logout route not yet implemented - skipping
    // 4. Logout
    // await testAPI('POST', '/auth/logout', {}, accessToken, '3. Logout User');
    
    // ===========================================
    // ANALYTICS MODULE
    // ===========================================
    console.log(`\n${colors.magenta}=== ANALYTICS MODULE ===${colors.reset}`);
    
    // 1. Get dashboard stats
    await testAPI('GET', '/analytics/dashboard', null, accessToken, '1. Get Dashboard Analytics');
    
    // 2. Get revenue report
    await testAPI('GET', '/analytics/revenue?startDate=2025-01-01&endDate=2025-12-31', null, accessToken, '2. Get Revenue Report');
    
    // 3. Get agent performance
    await testAPI('GET', '/analytics/agent-performance', null, accessToken, '3. Get Agent Performance Analytics');
    
    // 4. Get booking trends
    await testAPI('GET', '/analytics/booking-trends?period=month', null, accessToken, '4. Get Booking Trends');
    
    // 5. Get forecast
    await testAPI('GET', '/analytics/forecast', null, accessToken, '5. Get Revenue Forecast');
    
    // ===========================================
    // ADDITIONAL CUSTOMER ENDPOINTS
    // ===========================================
    console.log(`\n${colors.magenta}=== ADDITIONAL CUSTOMER ENDPOINTS ===${colors.reset}`);
    
    if (testData.customerId) {
      // 1. Search customers
      await testAPI('GET', '/customers/search?query=John', null, accessToken, '1. Search Customers');
      
      // 2. Update customer preferences
      const preferencesData = {
        dietaryRestrictions: ['vegetarian', 'gluten-free'],
        interests: ['adventure', 'culture', 'food'],
        budgetRange: { min: 1000, max: 5000 }
      };
      await testAPI('PUT', `/customers/${testData.customerId}/preferences`, preferencesData, accessToken, '2. Update Customer Preferences');
      
      // 3. Get customer documents
      await testAPI('GET', `/customers/${testData.customerId}/documents`, null, accessToken, '3. Get Customer Documents');
      
      // 4. Get customer travel history
      await testAPI('GET', `/customers/${testData.customerId}/travel-history`, null, accessToken, '4. Get Customer Travel History');
    }
    
    // ===========================================
    // ADDITIONAL AGENT ENDPOINTS
    // ===========================================
    console.log(`\n${colors.magenta}=== ADDITIONAL AGENT ENDPOINTS ===${colors.reset}`);
    
    if (testData.agentId) {
      // 1. Get agent commission
      await testAPI('GET', `/agents/${testData.agentId}/commission`, null, accessToken, '1. Get Agent Commission');
      
      // 2. Update agent commission structure
      const commissionData = {
        baseCommission: 15,
        bonusThreshold: 50000,
        bonusPercentage: 5
      };
      await testAPI('PUT', `/agents/${testData.agentId}/commission`, commissionData, accessToken, '2. Update Agent Commission');
      
      // 3. Get agent bookings
      await testAPI('GET', `/agents/${testData.agentId}/bookings`, null, accessToken, '3. Get Agent Bookings');
      
      // 4. Get agent quotes
      await testAPI('GET', `/agents/${testData.agentId}/quotes`, null, accessToken, '4. Get Agent Quotes');
    }
    
    // ===========================================
    // ADDITIONAL SUPPLIER ENDPOINTS
    // ===========================================
    console.log(`\n${colors.magenta}=== ADDITIONAL SUPPLIER ENDPOINTS ===${colors.reset}`);
    
    if (testData.supplierId) {
      // 1. Get supplier bookings
      await testAPI('GET', `/suppliers/${testData.supplierId}/bookings`, null, accessToken, '1. Get Supplier Bookings');
      
      // 2. Get supplier ratings
      await testAPI('GET', `/suppliers/${testData.supplierId}/ratings`, null, accessToken, '2. Get Supplier Ratings');
      
      // 3. Update supplier markup
      const markupData = {
        percentage: 20,
        type: 'percentage'
      };
      await testAPI('PUT', `/suppliers/${testData.supplierId}/markup`, markupData, accessToken, '3. Update Supplier Markup');
    }
    
    // ===========================================
    // ADDITIONAL QUOTE ENDPOINTS
    // ===========================================
    console.log(`\n${colors.magenta}=== ADDITIONAL QUOTE ENDPOINTS ===${colors.reset}`);
    
    if (testData.quoteId) {
      // 1. Duplicate quote
      await testAPI('POST', `/quotes/${testData.quoteId}/duplicate`, {}, accessToken, '1. Duplicate Quote');
      
      // 2. Get quote revisions
      await testAPI('GET', `/quotes/${testData.quoteId}/revisions`, null, accessToken, '2. Get Quote Revisions');
      
      // 3. Export quote PDF (binary response)
      await testPDFEndpoint('GET', `/quotes/${testData.quoteId}/export`, null, accessToken, '3. Export Quote as PDF');
    }
    
    // ===========================================
    // ADDITIONAL BOOKING ENDPOINTS
    // ===========================================
    console.log(`\n${colors.magenta}=== ADDITIONAL BOOKING ENDPOINTS ===${colors.reset}`);
    
    if (testData.bookingId) {
      // 1. Generate booking voucher (binary response)
      await testPDFEndpoint('POST', `/bookings/${testData.bookingId}/generate-voucher`, {}, accessToken, '1. Generate Booking Voucher');
      
      // 2. Get booking documents
      await testAPI('GET', `/bookings/${testData.bookingId}/documents`, null, accessToken, '2. Get Booking Documents');
      
      // 3. Add booking note
      const noteData = {
        note: 'Customer requested early check-in',
        type: 'internal'
      };
      await testAPI('POST', `/bookings/${testData.bookingId}/notes`, noteData, accessToken, '3. Add Booking Note');
      
      // 4. Get booking timeline
      await testAPI('GET', `/bookings/${testData.bookingId}/timeline`, null, accessToken, '4. Get Booking Timeline');
    }
    
    // ===========================================
    // ADDITIONAL ITINERARY ENDPOINTS
    // ===========================================
    console.log(`\n${colors.magenta}=== ADDITIONAL ITINERARY ENDPOINTS ===${colors.reset}`);
    
    if (testData.itineraryId) {
      // 1. Get itinerary activities
      await testAPI('GET', `/itineraries/${testData.itineraryId}/activities`, null, accessToken, '1. Get Itinerary Activities');
      
      // 2. Get itinerary accommodations
      await testAPI('GET', `/itineraries/${testData.itineraryId}/accommodations`, null, accessToken, '2. Get Itinerary Accommodations');
      
      // 3. Get itinerary pricing breakdown
      await testAPI('GET', `/itineraries/${testData.itineraryId}/pricing`, null, accessToken, '3. Get Detailed Pricing Breakdown');
    }
    
    // ===========================================
    // SYSTEM & ADMIN ENDPOINTS
    // ===========================================
    console.log(`\n${colors.magenta}=== SYSTEM & ADMIN ENDPOINTS ===${colors.reset}`);
    
    // 1. Get system settings (correct path)
    await testAPI('GET', '/analytics/settings', null, accessToken, '1. Get System Settings');
    
    // 2. Get audit logs
    await testAPI('GET', '/audit-logs?page=1&limit=10', null, accessToken, '2. Get Audit Logs');
    
    // 3. Get user activity
    await testAPI('GET', '/analytics/user-activity', null, accessToken, '3. Get User Activity');
    
    // 4. Get system health (correct path)
    await testAPI('GET', '/analytics/system-health', null, accessToken, '4. Get System Health Details');
    
  } catch (error) {
    console.error(`${colors.red}\nUnexpected error: ${error.message}${colors.reset}`);
  } finally {
    // ===========================================
    // TEST SUMMARY
    // ===========================================
    console.log(`\n${colors.cyan}========================================${colors.reset}`);
    console.log(`${colors.cyan}TEST SUMMARY${colors.reset}`);
    console.log(`${colors.cyan}========================================${colors.reset}`);
    console.log(`${colors.green}✓ Passed: ${stats.passed}${colors.reset}`);
    console.log(`${colors.red}✗ Failed: ${stats.failed}${colors.reset}`);
    console.log(`${colors.yellow}○ Skipped: ${stats.skipped}${colors.reset}`);
    console.log(`${colors.cyan}━ Total: ${stats.total}${colors.reset}`);
    
    const successRate = ((stats.passed / stats.total) * 100).toFixed(2);
    console.log(`${colors.cyan}Success Rate: ${successRate}%${colors.reset}`);
    
    console.log(`\n${colors.cyan}Test Data Created:${colors.reset}`);
    console.log(`${colors.gray}  Customer ID: ${testData.customerId || 'N/A'}${colors.reset}`);
    console.log(`${colors.gray}  Supplier ID: ${testData.supplierId || 'N/A'}${colors.reset}`);
    console.log(`${colors.gray}  Itinerary ID: ${testData.itineraryId || 'N/A'}${colors.reset}`);
    console.log(`${colors.gray}  Quote ID: ${testData.quoteId || 'N/A'}${colors.reset}`);
    console.log(`${colors.gray}  Booking ID: ${testData.bookingId || 'N/A'}${colors.reset}`);
    
    console.log(`\n${colors.cyan}Swagger UI: http://localhost:5000/api-docs${colors.reset}`);
    console.log(`${colors.cyan}========================================${colors.reset}\n`);
    
    // Exit with appropriate code
    process.exit(stats.failed > 0 ? 1 : 0);
  }
}

// Run the tests
runTests();
