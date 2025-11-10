/**
 * Quick Demo Data Generator
 * Directly inserts demo data into database for all features
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function generateDemoData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travelcrm');
    console.log('✅ Connected to MongoDB\n');

    // Get collections
    const Tenant = mongoose.model('Tenant', new mongoose.Schema({}, { strict: false }));
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const Customer = mongoose.model('Customer', new mongoose.Schema({}, { strict: false }));
    const Agent = mongoose.model('Agent', new mongoose.Schema({}, { strict: false }));
    const Supplier = mongoose.model('Supplier', new mongoose.Schema({}, { strict: false }));
    const Itinerary = mongoose.model('Itinerary', new mongoose.Schema({}, { strict: false }));
    const Quote = mongoose.model('Quote', new mongoose.Schema({}, { strict: false }));
    const Booking = mongoose.model('Booking', new mongoose.Schema({}, { strict: false }));

    // Find demo-agency tenant
    const tenant = await Tenant.findOne({ subdomain: 'demo-agency' });
    if (!tenant) {
      console.log('❌ Demo tenant not found. Run tests first.');
      process.exit(1);
    }
    
    const tenantId = tenant._id;
    console.log(`📍 Found tenant: ${tenant.name} (${tenantId})\n`);

    // Find operator
    const operator = await User.findOne({ tenantId, role: 'operator' });
    console.log(`👤 Found operator: ${operator.email}\n`);

    // === CREATE SUPPLIERS ===
    console.log('🏢 Creating Suppliers...');
    const supplierData = [
      { name: 'Grand Hotels Ltd', email: 'hotels@suppliers.com', serviceType: 'hotel', phone: '+91 98765 00001' },
      { name: 'Sky Airlines Co', email: 'flights@suppliers.com', serviceType: 'flight', phone: '+91 98765 00002' },
      { name: 'Adventure Tours Inc', email: 'tours@suppliers.com', serviceType: 'activity', phone: '+91 98765 00003' }
    ];

    const suppliers = [];
    for (const data of supplierData) {
      // Create user first
      const userExists = await User.findOne({ email: data.email, tenantId });
      let userId;
      
      if (!userExists) {
        const user = await User.create({
          tenantId,
          name: data.name,
          email: data.email,
          password: await bcrypt.hash('Supplier@123', 10),
          role: 'supplier',
          phone: data.phone,
          isActive: true
        });
        userId = user._id;
      } else {
        userId = userExists._id;
      }

      // Create supplier profile
      const existing = await Supplier.findOne({ userId });
      if (!existing) {
        const supplier = await Supplier.create({
          tenantId,
          userId,
          companyName: data.name,
          contactPerson: data.name,
          email: data.email,
          phone: data.phone,
          serviceType: data.serviceType,
          address: { country: 'India', city: 'Mumbai' },
          status: 'active',
          commissionRate: 10,
          rating: 4.5
        });
        suppliers.push(supplier);
        console.log(`  ✅ Created: ${data.name}`);
      }
    }

    // === CREATE AGENTS ===
    console.log('\n👥 Creating Agent Profiles...');
    const agentData = [
      { name: 'Sales Agent 1', email: 'agent1@demoagency.com', phone: '+91 98765 10001' },
      { name: 'Sales Agent 2', email: 'agent2@demoagency.com', phone: '+91 98765 10002' },
      { name: 'Sales Agent 3', email: 'agent3@demoagency.com', phone: '+91 98765 10003' }
    ];

    const agents = [];
    for (const data of agentData) {
      const userExists = await User.findOne({ email: data.email, tenantId });
      let userId;
      
      if (!userExists) {
        const user = await User.create({
          tenantId,
          name: data.name,
          email: data.email,
          password: await bcrypt.hash('Agent@123', 10),
          role: 'agent',
          phone: data.phone,
          isActive: true
        });
        userId = user._id;
      } else {
        userId = userExists._id;
      }

      const existing = await Agent.findOne({ userId });
      if (!existing) {
        const agent = await Agent.create({
          tenantId,
          userId,
          agencyName: data.name,
          contactPerson: data.name,
          email: data.email,
          phone: data.phone,
          address: { country: 'India', city: 'Mumbai' },
          status: 'approved',
          tier: 'gold',
          creditLimit: 100000
        });
        agents.push(agent);
        console.log(`  ✅ Created: ${data.name}`);
      }
    }

    // === CREATE/VERIFY ITINERARIES ===
    console.log('\n🗺️  Creating Itineraries...');
    const itineraryData = [
      { title: 'Paris Romance 7D/6N', destination: 'Paris', country: 'France', duration: 7, price: 150000 },
      { title: 'Bali Adventure 5D/4N', destination: 'Bali', country: 'Indonesia', duration: 5, price: 80000 },
      { title: 'Dubai Luxury 4D/3N', destination: 'Dubai', country: 'UAE', duration: 4, price: 95000 }
    ];

    const itineraries = [];
    for (const data of itineraryData) {
      const existing = await Itinerary.findOne({ title: data.title, tenantId });
      if (!existing) {
        const itinerary = await Itinerary.create({
          tenantId,
          title: data.title,
          description: `Amazing ${data.destination} package`,
          destination: { city: data.destination, country: data.country },
          duration: data.duration,
          price: data.price,
          type: 'package',
          status: 'active',
          inclusions: ['Hotel', 'Breakfast', 'Transfers'],
          exclusions: ['Flights', 'Insurance']
        });
        itineraries.push(itinerary);
        console.log(`  ✅ Created: ${data.title}`);
      } else {
        itineraries.push(existing);
        console.log(`  ℹ️  Exists: ${data.title}`);
      }
    }

    // === CREATE QUOTES ===
    console.log('\n💰 Creating Quotes...');
    const customers = await Customer.find({ tenantId }).limit(3);
    
    if (customers.length > 0 && itineraries.length > 0 && agents.length > 0) {
      for (let i = 0; i < Math.min(3, customers.length); i++) {
        const existing = await Quote.findOne({ 
          customerId: customers[i]._id,
          itineraryId: itineraries[i % itineraries.length]._id
        });
        
        if (!existing) {
          const quote = await Quote.create({
            tenantId,
            customerId: customers[i]._id,
            itineraryId: itineraries[i % itineraries.length]._id,
            agentId: agents[0]._id,
            quoteNumber: `Q${Date.now()}-${i + 1}`,
            pricing: {
              baseAmount: itineraries[i % itineraries.length].price,
              taxes: itineraries[i % itineraries.length].price * 0.18,
              totalAmount: itineraries[i % itineraries.length].price * 1.18
            },
            status: 'pending',
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          });
          console.log(`  ✅ Created quote for: ${customers[i].firstName} ${customers[i].lastName}`);
        }
      }
    }

    // === CREATE BOOKINGS ===
    console.log('\n📅 Creating Bookings...');
    const quotes = await Quote.find({ tenantId }).limit(2);
    
    for (const quote of quotes) {
      const existing = await Booking.findOne({ quoteId: quote._id });
      if (!existing) {
        const booking = await Booking.create({
          tenantId,
          customerId: quote.customerId,
          itineraryId: quote.itineraryId,
          agentId: quote.agentId,
          quoteId: quote._id,
          bookingNumber: `BK${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          status: 'confirmed',
          paymentStatus: 'partial',
          totalAmount: quote.pricing.totalAmount,
          paidAmount: quote.pricing.totalAmount * 0.3,
          travelDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
        });
        console.log(`  ✅ Created booking: ${booking.bookingNumber}`);
      }
    }

    // === SUMMARY ===
    console.log('\n📊 SUMMARY:');
    console.log(`  Suppliers: ${await Supplier.countDocuments({ tenantId })}`);
    console.log(`  Agents: ${await Agent.countDocuments({ tenantId })}`);
    console.log(`  Customers: ${await Customer.countDocuments({ tenantId })}`);
    console.log(`  Itineraries: ${await Itinerary.countDocuments({ tenantId })}`);
    console.log(`  Quotes: ${await Quote.countDocuments({ tenantId })}`);
    console.log(`  Bookings: ${await Booking.countDocuments({ tenantId })}`);

    console.log('\n✅ Demo data generation complete!');
    await mongoose.connection.close();

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

generateDemoData();
