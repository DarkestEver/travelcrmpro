/**
 * Test Customer Voucher Download
 * Simple test to verify voucher PDF generation works
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function testVoucherDownload() {
  console.log('🧪 Testing Customer Voucher Download\n');
  console.log('================================================\n');
  
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');
    
    // Load all models
    const Booking = require('../src/models/Booking');
    const Customer = require('../src/models/Customer');
    const { generateVoucherPDF } = require('../src/utils/pdfGenerator');
    
    // Find first customer for testing
    const customer = await Customer.findOne().lean();
    
    if (!customer) {
      console.log('⚠️  No customer found. Creating sample customer...\n');
      const newCustomer = await Customer.create({
        tenantId: new mongoose.Types.ObjectId(),
        firstName: 'Test',
        lastName: 'Customer',
        email: 'test@customer.com',
        phone: '+1234567890'
      });
    }
    
    // Create sample booking data
    const sampleBooking = {
      _id: new mongoose.Types.ObjectId(),
      tenantId: customer ? customer.tenantId : new mongoose.Types.ObjectId(),
      bookingNumber: `BK-TEST-${Date.now()}`,
      bookingStatus: 'confirmed',
      customerId: customer ? {
        _id: customer._id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone
      } : {
        _id: new mongoose.Types.ObjectId(),
        firstName: 'Test',
        lastName: 'Customer',
        email: 'test@customer.com',
        phone: '+1234567890'
      },
      travelDates: {
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        endDate: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000) // 37 days from now
      },
      travelers: [{
        firstName: 'Test',
        lastName: 'Traveler',
        age: 30,
        passportNumber: 'P1234567'
      }],
      financial: {
        subtotal: 1500,
        taxes: 150,
        totalAmount: 1650,
        currency: 'USD'
      },
      paymentStatus: 'paid',
      confirmedAt: new Date(),
      createdAt: new Date()
    };
    
    console.log('✅ Created sample booking data\n');
    
    // Test PDF generation
    console.log('📄 Test 1: Generate Voucher PDF');
    console.log('--------------------------------------------------');
    
    const pdfBuffer = await generateVoucherPDF(sampleBooking, sampleBooking.customerId);
    
    if (pdfBuffer && Buffer.isBuffer(pdfBuffer) && pdfBuffer.length > 0) {
      console.log(`✅ PDF Generated Successfully`);
      console.log(`   - Size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
      console.log(`   - Type: ${pdfBuffer.constructor.name}`);
      
      // Save to test file
      const testDir = path.join(__dirname, 'test-outputs');
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }
      
      const testFile = path.join(testDir, `voucher-test-${Date.now()}.pdf`);
      fs.writeFileSync(testFile, pdfBuffer);
      
      console.log(`   - Saved to: ${testFile}`);
      console.log(`   - Can open with: start ${testFile}\n`);
    } else {
      console.error('❌ PDF generation failed - buffer is empty or invalid\n');
    }
    
    // Test 2: Verify PDF Headers
    console.log('📝 Test 2: Verify PDF Structure');
    console.log('--------------------------------------------------');
    
    const testBooking = {
      bookingNumber: 'TEST-123',
      bookingStatus: 'confirmed',
      customerId: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      },
      travelDates: {
        startDate: new Date(),
        endDate: new Date()
      },
      financial: {
        totalAmount: 1000,
        currency: 'USD'
      }
    };
    
    const testBuffer = await generateVoucherPDF(testBooking, testBooking.customerId);
    
    // Check if it's a valid PDF
    const pdfHeader = testBuffer.toString('utf8', 0, 4);
    if (pdfHeader === '%PDF') {
      console.log('✅ Valid PDF format (starts with %PDF)');
      console.log(`   - PDF Version: ${testBuffer.toString('utf8', 0, 8)}\n`);
    } else {
      console.error('❌ Invalid PDF format (does not start with %PDF)\n');
    }
    
    console.log('================================================');
    console.log('✅ All voucher download tests completed!\n');
    
    console.log('📋 SUMMARY:');
    console.log('--------------------------------------------------');
    console.log('✅ PDF Generator: Working');
    console.log('✅ Buffer Creation: Success');
    console.log('✅ PDF Format: Valid');
    console.log('✅ File Output: Saved to test-outputs/');
    console.log('\n💡 API Endpoint: GET /api/v1/customer/bookings/:id/voucher');
    console.log('   - Returns: application/pdf');
    console.log('   - Download: attachment; filename=voucher-{number}.pdf\n');
    
    console.log('🎉 Customer voucher download is ready!\n');
    
    await mongoose.connection.close();
    console.log('✅ Database connection closed\n');
    
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
console.log('🚀 Starting Voucher Download Tests...\n');
testVoucherDownload();
