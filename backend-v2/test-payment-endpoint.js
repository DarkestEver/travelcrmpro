const request = require('supertest');
const mongoose = require('mongoose');
const app = require('./src/app');
const Tenant = require('./src/models/Tenant');
const User = require('./src/models/User');
const tokenService = require('./src/services/tokenService');

async function test() {
  try {
    // Connect to test database
    const mongoUri = 'mongodb://localhost:27017/travel-crm-test';
    await mongoose.connect(mongoUri);
    
    console.log('Connected to database');
    
    // Clear and create test data
    await Tenant.deleteMany({});
    await User.deleteMany({});
    
    const tenant = await Tenant.create({
      name: 'Test Travel Agency',
      slug: 'test-agency',
      email: 'test@agency.com',
      subscription: {
        plan: 'professional',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      settings: {
        invoicePrefix: 'INV',
        invoiceStartNumber: 1,
      },
    });
    
    const user = await User.create({
      tenant: tenant._id,
      email: 'admin@agency.com',
      password: 'password123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'tenant_admin',
      isActive: true,
    });
    
    const token = tokenService.generateAccessToken({
      userId: user._id,
      tenantId: tenant._id,
      role: user.role,
    });
    
    console.log('Test data created');
    console.log('Token:', token.substring(0, 20) + '...');
    
    // Test various endpoints
    console.log('\n--- Testing payment endpoints ---');
    
    // Test 1: GET /payments (should get 200 or empty list)
    console.log('\n1. Testing GET /payments');
    const res1 = await request(app)
      .get('/payments')
      .set('Authorization', `Bearer ${token}`);
    console.log(`Status: ${res1.status}`);
    console.log('Body:', JSON.stringify(res1.body, null, 2));
    
    // Test 2: GET /payments/stats (should work)
    console.log('\n2. Testing GET /payments/stats');
    const res2 = await request(app)
      .get('/payments/stats')
      .set('Authorization', `Bearer ${token}`);
    console.log(`Status: ${res2.status}`);
    console.log('Body:', JSON.stringify(res2.body, null, 2));
    
    // Test 3: POST /payments/create-intent (should get 404 or validation error)
    console.log('\n3. Testing POST /payments/create-intent (no data)');
    const res3 = await request(app)
      .post('/payments/create-intent')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    console.log(`Status: ${res3.status}`);
    console.log('Body:', JSON.stringify(res3.body, null, 2));
    
    // Test 4: Check if route exists
    console.log('\n4. Testing POST /payments/create-intent with invoiceId');
    const res4 = await request(app)
      .post('/payments/create-intent')
      .set('Authorization', `Bearer ${token}`)
      .send({ invoiceId: '507f1f77bcf86cd799439011', amount: 100, currency: 'usd' });
    console.log(`Status: ${res4.status}`);
    console.log('Body:', JSON.stringify(res4.body, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

test();
