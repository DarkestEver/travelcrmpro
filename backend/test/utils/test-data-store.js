/**
 * Test Data Store
 * Stores all created IDs and test data
 */

const fs = require('fs');
const path = require('path');

class TestDataStore {
  constructor() {
    this.data = {
      tenants: [],
      users: {},
      customers: [],
      suppliers: [],
      itineraries: [],
      quotes: [],
      bookings: [],
      invoices: [],
      payments: [],
      agents: [],
      testResults: []
    };
  }

  addTenant(tenantData) {
    this.data.tenants.push(tenantData);
  }

  addUser(role, userData) {
    if (!this.data.users[role]) {
      this.data.users[role] = [];
    }
    this.data.users[role].push(userData);
  }

  addCustomer(customerData) {
    this.data.customers.push(customerData);
  }

  addSupplier(supplierData) {
    this.data.suppliers.push(supplierData);
  }

  addItinerary(itineraryData) {
    this.data.itineraries.push(itineraryData);
  }

  addQuote(quoteData) {
    this.data.quotes.push(quoteData);
  }

  addBooking(bookingData) {
    this.data.bookings.push(bookingData);
  }

  addTestResult(testName, result) {
    this.data.testResults.push({
      test: testName,
      status: result.success ? 'PASS' : 'FAIL',
      error: result.error || null,
      timestamp: new Date().toISOString()
    });
  }

  getTenant(index = 0) {
    return this.data.tenants[index];
  }

  getCustomer(index = 0) {
    return this.data.customers[index];
  }

  getItinerary(index = 0) {
    return this.data.itineraries[index];
  }

  getQuote(index = 0) {
    return this.data.quotes[index];
  }

  save(filename = 'test-data.json') {
    const filePath = path.join(__dirname, '..', filename);
    fs.writeFileSync(filePath, JSON.stringify(this.data, null, 2));
    return filePath;
  }

  getSummary() {
    return {
      totalTenants: this.data.tenants.length,
      totalCustomers: this.data.customers.length,
      totalSuppliers: this.data.suppliers.length,
      totalItineraries: this.data.itineraries.length,
      totalQuotes: this.data.quotes.length,
      totalBookings: this.data.bookings.length,
      testsPassed: this.data.testResults.filter(t => t.status === 'PASS').length,
      testsFailed: this.data.testResults.filter(t => t.status === 'FAIL').length
    };
  }
}

module.exports = new TestDataStore();
