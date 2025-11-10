/**
 * Test 4: Create Customers with Demo Data
 */

const apiClient = require('../utils/api-client');
const logger = require('../utils/logger');
const dataStore = require('../utils/test-data-store');

const customersData = [
  {
    firstName: 'Alice',
    lastName: 'Johnson',
    email: 'customer1@test.com',
    phone: '+91 98765 11111',
    passportNumber: 'P1234567',
    nationality: 'Indian',
    city: 'Mumbai'
  },
  {
    firstName: 'Bob',
    lastName: 'Smith',
    email: 'customer2@test.com',
    phone: '+91 98765 11112',
    passportNumber: 'P2345678',
    nationality: 'Indian',
    city: 'Delhi'
  },
  {
    firstName: 'Carol',
    lastName: 'Williams',
    email: 'customer3@test.com',
    phone: '+91 98765 11113',
    passportNumber: 'P3456789',
    nationality: 'Indian',
    city: 'Bangalore'
  },
  {
    firstName: 'David',
    lastName: 'Brown',
    email: 'customer4@test.com',
    phone: '+91 98765 11114',
    passportNumber: 'P4567890',
    nationality: 'Indian',
    city: 'Chennai'
  },
  {
    firstName: 'Emma',
    lastName: 'Davis',
    email: 'customer5@test.com',
    phone: '+91 98765 11115',
    passportNumber: 'P5678901',
    nationality: 'Indian',
    city: 'Hyderabad'
  }
];

async function createCustomer(customerData, token) {
  const result = await apiClient.post('/customers', {
    firstName: customerData.firstName,
    lastName: customerData.lastName,
    email: customerData.email,
    phone: customerData.phone,
    password: 'Customer@123',
    dateOfBirth: '1990-01-01',
    nationality: customerData.nationality,
    passportNumber: customerData.passportNumber,
    address: {
      street: '123 Main Street',
      city: customerData.city,
      state: 'State',
      country: 'India',
      zipCode: '400001'
    },
    preferences: {
      dietaryRequirements: 'None',
      specialNeeds: 'None'
    }
  }, token);

  if (!result.success) {
    logger.error(`Failed to create ${customerData.firstName}: ${result.error}`);
    return null;
  }

  const customerId = result.data.data.customer._id;
  logger.success(`Customer created: ${customerData.firstName} ${customerData.lastName}`);
  
  dataStore.addCustomer({
    id: customerId,
    firstName: customerData.firstName,
    lastName: customerData.lastName,
    email: customerData.email,
    passportNumber: customerData.passportNumber
  });
  
  return customerId;
}

async function runTest() {
  logger.step('TEST 4: Create Customers with Demo Data');
  
  const token = apiClient.getToken('operator');
  if (!token) {
    logger.error('No operator token found. Run Test 2 first.');
    const result = { success: false, error: 'No operator token' };
    dataStore.addTestResult('Test 4: Create Customers', result);
    return result;
  }
  
  let createdCount = 0;
  
  for (const customerData of customersData) {
    const customerId = await createCustomer(customerData, token);
    if (customerId) createdCount++;
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  logger.info(`Created ${createdCount}/${customersData.length} customers`);
  
  const result = { 
    success: createdCount === customersData.length,
    createdCount,
    totalExpected: customersData.length
  };
  
  dataStore.addTestResult('Test 4: Create Customers', result);
  return result;
}

module.exports = { runTest };
