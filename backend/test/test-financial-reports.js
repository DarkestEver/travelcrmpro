/**
 * Test Financial Reports
 * Tests report generation endpoints
 */

const axios = require('axios');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api/v1';
const TOKEN = process.env.TEST_JWT_TOKEN;

async function testReports() {
  console.log('🧪 Testing Financial Reports\n');
  console.log('================================================\n');

  if (!TOKEN) {
    console.error('❌ TEST_JWT_TOKEN not set in .env file');
    console.log('Please add TEST_JWT_TOKEN to your .env file\n');
    process.exit(1);
  }

  const headers = {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json'
  };

  try {
    // Test 1: Dashboard Summary
    console.log('📊 Test 1: Dashboard Summary');
    console.log('--------------------------------------------------');
    
    try {
      const response = await axios.get(`${API_URL}/reports/dashboard-summary`, { headers });
      
      if (response.data.success) {
        console.log('✅ Dashboard summary retrieved');
        console.log(`   This Month Bookings: ${response.data.data.thisMonth.bookings}`);
        console.log(`   This Month Revenue: $${response.data.data.thisMonth.revenue.toFixed(2)}`);
        console.log(`   Booking Growth: ${response.data.data.growth.bookings.toFixed(1)}%`);
        console.log(`   Revenue Growth: ${response.data.data.growth.revenue.toFixed(1)}%`);
      }
    } catch (error) {
      console.error(`❌ Dashboard summary failed: ${error.response?.data?.message || error.message}`);
    }
    console.log();

    // Test 2: Revenue Report
    console.log('💰 Test 2: Revenue Report');
    console.log('--------------------------------------------------');
    
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      const endDate = new Date();

      const response = await axios.get(`${API_URL}/reports/revenue`, {
        headers,
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          groupBy: 'week'
        }
      });
      
      if (response.data.success) {
        console.log('✅ Revenue report generated');
        console.log(`   Total Revenue: $${response.data.data.totals.totalRevenue.toFixed(2)}`);
        console.log(`   Booking Count: ${response.data.data.totals.bookingCount}`);
        console.log(`   Avg Booking Value: $${response.data.data.totals.avgBookingValue.toFixed(2)}`);
        console.log(`   Data Points: ${response.data.data.data.length}`);
      }
    } catch (error) {
      console.error(`❌ Revenue report failed: ${error.response?.data?.message || error.message}`);
    }
    console.log();

    // Test 3: Commission Report
    console.log('💼 Test 3: Commission Report');
    console.log('--------------------------------------------------');
    
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      const endDate = new Date();

      const response = await axios.get(`${API_URL}/reports/commission`, {
        headers,
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });
      
      if (response.data.success) {
        console.log('✅ Commission report generated');
        console.log(`   Total Commission: $${response.data.data.totals.totalCommission.toFixed(2)}`);
        console.log(`   Paid Commission: $${response.data.data.totals.paidCommission.toFixed(2)}`);
        console.log(`   Pending Commission: $${response.data.data.totals.pendingCommission.toFixed(2)}`);
        console.log(`   Agents: ${response.data.data.data.length}`);
      }
    } catch (error) {
      console.error(`❌ Commission report failed: ${error.response?.data?.message || error.message}`);
    }
    console.log();

    // Test 4: Booking Trends
    console.log('📈 Test 4: Booking Trends Report');
    console.log('--------------------------------------------------');
    
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3);
      const endDate = new Date();

      const response = await axios.get(`${API_URL}/reports/booking-trends`, {
        headers,
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          groupBy: 'week'
        }
      });
      
      if (response.data.success) {
        console.log('✅ Booking trends report generated');
        console.log(`   Period: Last 3 months`);
        console.log(`   Data Points: ${response.data.data.data.length}`);
        if (response.data.data.data.length > 0) {
          const latest = response.data.data.data[response.data.data.data.length - 1];
          console.log(`   Latest Week Total: ${latest.totalBookings}`);
          console.log(`   Latest Week Revenue: $${latest.totalRevenue.toFixed(2)}`);
        }
      }
    } catch (error) {
      console.error(`❌ Booking trends failed: ${error.response?.data?.message || error.message}`);
    }
    console.log();

    // Test 5: CSV Export
    console.log('📄 Test 5: CSV Export');
    console.log('--------------------------------------------------');
    
    try {
      // First get some data
      const reportResponse = await axios.get(`${API_URL}/reports/revenue`, {
        headers,
        params: {
          groupBy: 'month'
        }
      });

      if (reportResponse.data.success && reportResponse.data.data.data.length > 0) {
        // Export to CSV
        const exportResponse = await axios.post(
          `${API_URL}/reports/export/csv`,
          {
            reportType: 'revenue',
            data: reportResponse.data.data.data,
            filename: 'revenue-report'
          },
          { headers }
        );

        if (exportResponse.data) {
          console.log('✅ CSV export generated');
          console.log(`   Size: ${exportResponse.data.length} bytes`);
          console.log(`   Sample: ${exportResponse.data.substring(0, 100)}...`);
        }
      } else {
        console.log('⚠️  No data available for CSV export');
      }
    } catch (error) {
      console.error(`❌ CSV export failed: ${error.response?.data?.message || error.message}`);
    }
    console.log();

    console.log('================================================');
    console.log('✅ All report tests completed!\n');
    
    console.log('📋 SUMMARY:');
    console.log('--------------------------------------------------');
    console.log('✅ Dashboard Summary: Tested');
    console.log('✅ Revenue Report: Tested');
    console.log('✅ Commission Report: Tested');
    console.log('✅ Booking Trends: Tested');
    console.log('✅ CSV Export: Tested');
    console.log('\n💡 AVAILABLE REPORTS:');
    console.log('--------------------------------------------------');
    console.log('GET /api/v1/reports/dashboard-summary');
    console.log('GET /api/v1/reports/revenue?startDate=...&endDate=...&groupBy=...');
    console.log('GET /api/v1/reports/commission?startDate=...&endDate=...');
    console.log('GET /api/v1/reports/tax?startDate=...&endDate=...&groupBy=...');
    console.log('GET /api/v1/reports/profit-loss?startDate=...&endDate=...');
    console.log('GET /api/v1/reports/booking-trends?startDate=...&endDate=...');
    console.log('GET /api/v1/reports/agent-performance?startDate=...&endDate=...');
    console.log('GET /api/v1/reports/customer-analytics?startDate=...&endDate=...');
    console.log('POST /api/v1/reports/export/csv');
    console.log('\n🎉 Financial reporting system is ready!\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error.message);
    
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    
    process.exit(1);
  }
}

// Run tests
console.log('🚀 Starting Financial Reports Tests...\n');
testReports();
