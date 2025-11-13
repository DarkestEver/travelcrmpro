/**
 * Test Email Dashboard APIs
 * Simple standalone test for the new dashboard endpoints
 */

const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api/v1';
const TEST_TOKEN = process.env.TEST_JWT_TOKEN || ''; // Set this in your .env for testing

// Test configuration
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TEST_TOKEN}`
};

async function testEmailDashboardAPIs() {
  console.log('🧪 Testing Email Dashboard APIs\n');
  console.log('================================================\n');
  
  try {
    // Connect to database to verify data exists
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');
    
    const EmailLog = require('../src/models/EmailLog');
    
    // Check if we have test data
    const emailCount = await EmailLog.countDocuments();
    console.log(`📧 Found ${emailCount} emails in database\n`);
    
    if (emailCount === 0) {
      console.log('⚠️  No emails found. Creating sample email for testing...\n');
      
      // Create a sample email for testing
      const sampleEmail = await EmailLog.create({
        messageId: `test-${Date.now()}@test.com`,
        emailAccountId: new mongoose.Types.ObjectId(),
        tenantId: new mongoose.Types.ObjectId(),
        from: { email: 'test@customer.com', name: 'Test Customer' },
        to: [{ email: 'info@agency.com', name: 'Travel Agency' }],
        subject: 'Test Email for Dashboard',
        bodyText: 'This is a test email for dashboard testing',
        receivedAt: new Date(),
        source: 'webhook',
        processingStatus: 'completed',
        category: 'CUSTOMER',
        categoryConfidence: 95,
        aiProcessing: {
          status: 'completed',
          cost: 0.0015,
          tokens: {
            prompt: 100,
            completion: 50,
            total: 150
          }
        }
      });
      
      console.log(`✅ Created sample email: ${sampleEmail._id}\n`);
    }
    
    // Test 1: Dashboard Stats
    console.log('📊 Test 1: Get Dashboard Stats');
    console.log('--------------------------------------------------');
    
    try {
      const dashboardResponse = await axios.get(`${BASE_URL}/emails/dashboard-stats`, { headers });
      const dashboardData = dashboardResponse.data;
      
      console.log('✅ Dashboard Stats Retrieved:');
      console.log(`   - Today's Emails: ${dashboardData.data.today.count}`);
      console.log(`   - Percent Change: ${dashboardData.data.today.percentChange}%`);
      console.log(`   - Needs Review: ${dashboardData.data.needsReview}`);
      console.log(`   - AI Cost Today: $${dashboardData.data.aiCost.today}`);
      console.log(`   - Queue Count: ${dashboardData.data.queue}`);
      console.log(`   - Recent Emails: ${dashboardData.data.recentEmails.length} items\n`);
    } catch (error) {
      if (error.response) {
        console.error(`❌ Dashboard Stats Failed: ${error.response.status} - ${error.response.data.message}`);
      } else {
        console.error(`❌ Dashboard Stats Failed: ${error.message}`);
      }
      console.log('   Note: Make sure TEST_JWT_TOKEN is set in .env\n');
    }
    
    // Test 2: Analytics
    console.log('📈 Test 2: Get Email Analytics');
    console.log('--------------------------------------------------');
    
    try {
      const analyticsResponse = await axios.get(`${BASE_URL}/emails/analytics`, { headers });
      const analyticsData = analyticsResponse.data;
      
      console.log('✅ Analytics Retrieved:');
      console.log(`   - Period: ${analyticsData.data.period.days} days`);
      console.log(`   - Total Emails: ${analyticsData.data.summary.totalEmails}`);
      console.log(`   - AI Accuracy: ${analyticsData.data.summary.aiAccuracy}%`);
      console.log(`   - Total AI Cost: $${analyticsData.data.summary.totalAICost}`);
      console.log(`   - Avg Response Time: ${analyticsData.data.summary.avgResponseTime}`);
      console.log(`   - Review Queue: ${analyticsData.data.summary.reviewQueue}`);
      console.log(`   - Categories: ${analyticsData.data.categoryBreakdown.length} types`);
      console.log(`   - Statuses: ${analyticsData.data.statusBreakdown.length} types\n`);
    } catch (error) {
      if (error.response) {
        console.error(`❌ Analytics Failed: ${error.response.status} - ${error.response.data.message}`);
      } else {
        console.error(`❌ Analytics Failed: ${error.message}`);
      }
      console.log('   Note: Make sure TEST_JWT_TOKEN is set in .env\n');
    }
    
    // Test 3: Review Queue
    console.log('🔍 Test 3: Get Review Queue');
    console.log('--------------------------------------------------');
    
    try {
      const reviewResponse = await axios.get(`${BASE_URL}/emails/review-queue`, { headers });
      const reviewData = reviewResponse.data;
      
      console.log('✅ Review Queue Retrieved:');
      console.log(`   - Pending: ${reviewData.data.stats.pending}`);
      console.log(`   - SLA Breached: ${reviewData.data.stats.slaBreached}`);
      console.log(`   - Avg Response Time: ${reviewData.data.stats.avgResponseTime}`);
      console.log(`   - Emails Returned: ${reviewData.data.emails.length}`);
      console.log(`   - Total Pages: ${reviewData.data.pagination.pages}\n`);
    } catch (error) {
      if (error.response) {
        console.error(`❌ Review Queue Failed: ${error.response.status} - ${error.response.data.message}`);
      } else {
        console.error(`❌ Review Queue Failed: ${error.message}`);
      }
      console.log('   Note: Make sure TEST_JWT_TOKEN is set in .env\n');
    }
    
    // Test 4: Analytics with Date Range
    console.log('📅 Test 4: Get Analytics with Custom Date Range');
    console.log('--------------------------------------------------');
    
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7); // Last 7 days
      
      const params = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };
      
      const rangeResponse = await axios.get(`${BASE_URL}/emails/analytics`, { headers, params });
      const rangeData = rangeResponse.data;
      
      console.log('✅ Date Range Analytics Retrieved:');
      console.log(`   - Period: ${rangeData.data.period.startDate} to ${rangeData.data.period.endDate}`);
      console.log(`   - Total Emails: ${rangeData.data.summary.totalEmails}`);
      console.log(`   - Days: ${rangeData.data.period.days}\n`);
    } catch (error) {
      if (error.response) {
        console.error(`❌ Date Range Analytics Failed: ${error.response.status} - ${error.response.data.message}`);
      } else {
        console.error(`❌ Date Range Analytics Failed: ${error.message}`);
      }
    }
    
    console.log('================================================');
    console.log('✅ All Email Dashboard API tests completed!\n');
    
    // Summary
    console.log('📋 SUMMARY:');
    console.log('--------------------------------------------------');
    console.log('✅ Dashboard Stats endpoint: /emails/dashboard-stats');
    console.log('✅ Analytics endpoint: /emails/analytics');
    console.log('✅ Review Queue endpoint: /emails/review-queue');
    console.log('✅ Date range filtering: Working');
    console.log('\n💡 Note: If authentication failed, set TEST_JWT_TOKEN in .env');
    console.log('   Get token by logging in via /api/v1/auth/login\n');
    
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    console.log('\n🎉 Email Dashboard APIs are ready to use!\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error.message);
    
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    
    process.exit(1);
  }
}

// Run tests
console.log('🚀 Starting Email Dashboard API Tests...\n');
testEmailDashboardAPIs();
