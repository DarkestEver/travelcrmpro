/**
 * Test 5: Create Suppliers with Demo Data
 */

const apiClient = require('../utils/api-client');
const logger = require('../utils/logger');
const dataStore = require('../utils/test-data-store');

const suppliersData = [
  { 
    name: 'Grand Hotel Supplier', 
    companyName: 'Grand Hotels & Resorts Pvt Ltd',
    email: 'hotels.supplier@demoagency.com', 
    serviceType: 'hotel',
    contactPerson: 'Raj Kumar',
    address: '123 MG Road',
    city: 'Bangalore',
    state: 'Karnataka',
    country: 'India',
    pincode: '560001',
    gst: '29ABCDE1234F1Z5'
  },
  { 
    name: 'Sky Flight Supplier', 
    companyName: 'Sky Flight Services Pvt Ltd',
    email: 'flights.supplier@demoagency.com', 
    serviceType: 'flight',
    contactPerson: 'Priya Sharma',
    address: '456 Airport Road',
    city: 'Delhi',
    state: 'Delhi',
    country: 'India',
    pincode: '110001',
    gst: '07XYZAB5678G2H3'
  },
  { 
    name: 'Adventure Tours Supplier', 
    companyName: 'Adventure Tours & Activities Pvt Ltd',
    email: 'tours.supplier@demoagency.com', 
    serviceType: 'activity',
    contactPerson: 'Amit Patel',
    address: '789 Beach Road',
    city: 'Panaji',
    state: 'Goa',
    country: 'India',
    pincode: '403001',
    gst: '30PQRST9012K4L5'
  }
];

async function createSupplier(supplierData, token, tenantId) {
  // First create a user account for the supplier using users endpoint (with tenantId)
  const userResult = await apiClient.post('/users', {
    name: supplierData.contactPerson,
    email: supplierData.email,
    password: 'Supplier@123',
    role: 'supplier',
    tenantId: tenantId,
    phone: '+91 98765 22220'
  }, token);

  if (!userResult.success) {
    logger.error(`Failed to create user for ${supplierData.name}: ${userResult.error}`);
    return null;
  }

  const userId = userResult.data.data?.user?._id || userResult.data.data?._id;
  
  // Now create the supplier profile
  const result = await apiClient.post('/suppliers', {
    userId: userId,
    companyName: supplierData.companyName,
    email: supplierData.email,
    serviceTypes: [supplierData.serviceType],
    phone: '+91 98765 22220',
    contactPersons: [
      {
        name: supplierData.contactPerson,
        phone: '+91 98765 22220',
        email: supplierData.email
      }
    ],
    address: supplierData.address,
    city: supplierData.city,
    state: supplierData.state,
    country: supplierData.country,
    paymentTerms: '30 days',
    currencies: ['INR'],
    status: 'active'
  }, token);

  if (!result.success) {
    logger.error(`Failed to create ${supplierData.name}: ${result.error}`);
    return null;
  }

  const supplierId = result.data.data?.supplier?._id || result.data.data?._id;
  logger.success(`Supplier created: ${supplierData.name}`);
  
  dataStore.addSupplier({
    id: supplierId,
    name: supplierData.name,
    email: supplierData.email,
    serviceType: supplierData.serviceType
  });
  
  return supplierId;
}

async function runTest() {
  logger.step('TEST 5: Create Suppliers with Demo Data');
  
  const token = apiClient.getToken('operator');
  if (!token) {
    logger.error('No operator token found. Run Test 2 first.');
    const result = { success: false, error: 'No operator token' };
    dataStore.addTestResult('Test 5: Create Suppliers', result);
    return result;
  }
  
  // Get tenantId from the first tenant
  const tenant = dataStore.getTenant(0);
  if (!tenant || !tenant.id) {
    logger.error('No tenant found. Run Test 1 first.');
    const result = { success: false, error: 'No tenant found' };
    dataStore.addTestResult('Test 5: Create Suppliers', result);
    return result;
  }
  
  let createdCount = 0;
  
  for (const supplierData of suppliersData) {
    const supplierId = await createSupplier(supplierData, token, tenant.id);
    if (supplierId) createdCount++;
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  logger.info(`Created ${createdCount}/${suppliersData.length} suppliers`);
  
  const result = { 
    success: createdCount === suppliersData.length,
    createdCount,
    totalExpected: suppliersData.length
  };
  
  dataStore.addTestResult('Test 5: Create Suppliers', result);
  return result;
}

module.exports = { runTest };
