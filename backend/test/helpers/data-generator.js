/**
 * Test Data Generator
 * Generates realistic test data for various entities
 */

class DataGenerator {
  static randomString(length = 8) {
    return Math.random().toString(36).substring(2, length + 2);
  }

  static randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static randomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  static generateFirstName() {
    const names = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'James', 'Mary'];
    return this.randomElement(names);
  }

  static generateLastName() {
    const names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Wilson', 'Moore'];
    return this.randomElement(names);
  }

  static generateCompanyName() {
    const prefixes = ['Global', 'Premium', 'Elite', 'Royal', 'Grand'];
    const suffixes = ['Travel', 'Tours', 'Adventures', 'Journeys', 'Vacations'];
    return `${this.randomElement(prefixes)} ${this.randomElement(suffixes)} Agency`;
  }

  static generatePhone() {
    return `+1-555-${this.randomNumber(100, 999)}-${this.randomNumber(1000, 9999)}`;
  }

  static generateCity() {
    const cities = ['Paris', 'Tokyo', 'New York', 'London', 'Dubai', 'Singapore', 'Rome', 'Barcelona', 'Sydney', 'Bangkok'];
    return this.randomElement(cities);
  }

  static generateCountry() {
    const countries = ['USA', 'UK', 'France', 'Japan', 'Australia', 'Canada', 'Germany', 'Italy', 'Spain', 'Thailand'];
    return this.randomElement(countries);
  }
  static generateAgencyAdmin(customData = {}) {
    const firstName = customData.firstName || this.generateFirstName();
    const lastName = customData.lastName || this.generateLastName();
    return {
      name: customData.name || customData.ownerName || `${firstName} ${lastName}`,
      subdomain: customData.subdomain || `test${Date.now()}`,
      ownerName: customData.ownerName || `${firstName} ${lastName}`,
      ownerEmail: customData.ownerEmail || customData.email || `admin.${Date.now()}@test-agency.com`,
      ownerPassword: customData.ownerPassword || customData.password || 'Test@123456',
      ownerPhone: customData.ownerPhone || customData.phone || this.generatePhone(),
      plan: customData.plan || 'free'
    };
  }

  static generateOperator(customData = {}) {
    const firstName = customData.firstName || this.generateFirstName();
    const lastName = customData.lastName || this.generateLastName();
    return {
      name: customData.name || `${firstName} ${lastName}`,
      email: customData.email || `operator.${Date.now()}@test.com`,
      password: customData.password || 'Test@123456',
      phone: customData.phone || this.generatePhone(),
      role: 'operator'
    };
  }

  static generateAgent(customData = {}) {
    const firstName = customData.firstName || this.generateFirstName();
    const lastName = customData.lastName || this.generateLastName();
    return {
      name: customData.name || `${firstName} ${lastName}`,
      email: customData.email || `agent.${Date.now()}@test.com`,
      password: customData.password || 'Test@123456',
      phone: customData.phone || this.generatePhone(),
      role: 'agent',
      commissionRate: customData.commissionRate || 10
    };
  }

  static generateCustomer(customData = {}) {
    const firstName = customData.firstName || this.generateFirstName();
    const lastName = customData.lastName || this.generateLastName();
    return {
      name: customData.name || `${firstName} ${lastName}`,
      email: customData.email || `customer.${Date.now()}@test.com`,
      password: customData.password || 'Test@123456',
      phone: customData.phone || this.generatePhone(),
      role: 'customer',
      passportNumber: customData.passportNumber || `P${this.randomString(8).toUpperCase()}`,
      dateOfBirth: customData.dateOfBirth || '1990-01-01',
      nationality: customData.nationality || 'US'
    };
  }

  static generateSupplier(customData = {}) {
    const types = ['Hotel', 'Airline', 'Transport', 'Activity', 'Restaurant'];
    return {
      name: customData.name || `${this.generateCompanyName()} Suppliers`,
      type: customData.type || this.randomElement(types),
      contactPerson: customData.contactPerson || `${this.generateFirstName()} ${this.generateLastName()}`,
      email: customData.email || `supplier.${Date.now()}@test.com`,
      phone: customData.phone || this.generatePhone(),
      address: customData.address || `${this.randomNumber(100, 9999)} Main Street`,
      city: customData.city || this.generateCity(),
      country: customData.country || this.generateCountry(),
      paymentTerms: customData.paymentTerms || 'Net 30',
      notes: customData.notes || 'Test supplier created for testing purposes'
    };
  }

  static generateItinerary(customerId, customData = {}) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 30);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    const city = this.generateCity();
    const country = this.generateCountry();

    return {
      title: customData.title || `${city} Adventure Tour`,
      customerId: customerId,
      startDate: customData.startDate || startDate.toISOString(),
      endDate: customData.endDate || endDate.toISOString(),
      // Main destination (required)
      destination: customData.destination || {
        country: country,
        city: city
      },
      // Destinations array (same structure)
      destinations: customData.destinations || [{
        country: country,
        city: city,
        duration: 7
      }],
      duration: {
        days: 7,
        nights: 6
      },
      numberOfTravelers: customData.numberOfTravelers || this.randomNumber(1, 4),
      totalCost: customData.totalCost || this.randomNumber(5000, 20000),
      status: customData.status || 'draft',
      notes: customData.notes || 'Test itinerary created for testing purposes'
    };
  }

  static generateItineraryDay(itineraryId, dayNumber) {
    const activities = ['City Tour', 'Museum Visit', 'Beach Time', 'Adventure Activity', 'Shopping', 'Local Cuisine'];
    return {
      itinerary: itineraryId,
      day: dayNumber,
      title: `Day ${dayNumber} - ${this.generateCity()}`,
      description: `Exciting activities planned for day ${dayNumber}`,
      activities: [
        {
          time: '09:00',
          title: this.randomElement(activities),
          description: 'Amazing experience awaits',
          location: `${this.randomNumber(100, 999)} Tourist Street`
        }
      ]
    };
  }

  static generateQuote(customerId, customData = {}) {
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 15);

    return {
      customerId: customerId,
      itineraryId: customData.itineraryId,
      agentId: customData.agentId,
      numberOfTravelers: customData.numberOfTravelers || 2,
      travelDates: customData.travelDates || {
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000)
      },
      pricing: customData.pricing || {
        baseCost: 5000,
        totalPrice: 5000
      },
      validUntil: customData.validUntil || validUntil.toISOString(),
      status: customData.status || 'draft',
      notes: customData.notes || 'Test quote for validation',
      terms: customData.terms || 'Standard terms and conditions'
    };
  }

  static generateBooking(customerId, itineraryId, customData = {}) {
    const bookingDate = new Date();
    const travelDate = new Date();
    travelDate.setDate(travelDate.getDate() + 30);

    return {
      customerId: customerId,
      itineraryId: itineraryId,
      quoteId: customData.quoteId,
      agentId: customData.agentId,
      travelDates: customData.travelDates || {
        startDate: travelDate,
        endDate: new Date(travelDate.getTime() + 7 * 24 * 60 * 60 * 1000)
      },
      numberOfTravelers: customData.numberOfTravelers || 2,
      financial: customData.financial || {
        totalAmount: 3500,
        paidAmount: 1000,
        pendingAmount: 2500,
        currency: 'USD'
      },
      status: customData.status || 'pending',
      notes: customData.notes || 'Test booking for validation'
    };
  }
}

module.exports = DataGenerator;
