const request = require('supertest');
const app = require('./src/app');
const database = require('./src/lib/database');
const Tenant = require('./src/models/Tenant');
const User = require('./src/models/User');

(async () => {
  try {
    await database.connect();
    
    // Clean up
    await User.deleteMany({});
    await Tenant.deleteMany({});
    
    // Create tenant
    const tenant = await Tenant.create({
      name: 'Debug Travel Agency',
      slug: 'debug-travel-' + Date.now(),
      subdomain: 'debug-travel',
      email: 'admin@debugtravel.com',
      status: 'active', // Required for tenant middleware
      settings: {
        currency: 'INR',
        timezone: 'Asia/Kolkata',
      },
    });
    
    console.log('Created tenant:', tenant.slug);
    
    // Create customer
    const customer = await User.create({
      tenant: tenant._id,
      email: 'customer@test.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      phone: '9876543210',
      role: 'customer',
      isActive: true,
    });
    
    console.log('Created customer:', customer.email);
    
    // Try login
    const loginRes = await request(app)
      .post('/auth/login')
      .set('X-Tenant-Slug', tenant.slug)
      .send({
        email: 'customer@test.com',
        password: 'password123',
      });
    
    console.log('\n=== LOGIN RESPONSE ===');
    console.log('Status:', loginRes.status);
    console.log('Body:', JSON.stringify(loginRes.body, null, 2));
    
    const token = loginRes.body?.data?.accessToken || '';
    console.log('\n=== EXTRACTED TOKEN ===');
    console.log('Token:', token);
    console.log('Token length:', token.length);
    console.log('Token empty?', token === '');
    
    // Try using the token
    if (token) {
      console.log('\n=== TESTING TOKEN ===');
      const dashboardRes = await request(app)
        .get('/customer/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Tenant-Slug', tenant.slug);
      
      console.log('Dashboard status:', dashboardRes.status);
      console.log('Dashboard body:', JSON.stringify(dashboardRes.body, null, 2));
    }
    
    await database.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await database.disconnect();
    process.exit(1);
  }
})();
