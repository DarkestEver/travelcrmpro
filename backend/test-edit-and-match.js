const mongoose = require('mongoose');
const EmailLog = require('./src/models/EmailLog');
const Itinerary = require('./src/models/Itinerary');

async function testEditAndMatch() {
  try {
    await mongoose.connect('mongodb://localhost:27017/travel-crm');
    console.log('✅ Connected to MongoDB\n');

    // Find a customer email
    const email = await EmailLog.findOne({ 
      category: 'CUSTOMER' 
    }).sort({ receivedAt: -1 });

    if (!email) {
      console.log('❌ No customer emails found');
      process.exit(1);
    }

    console.log('📧 Original Email Data:');
    console.log('Subject:', email.subject);
    console.log('From:', email.from.email);
    console.log('\n📊 Original Extracted Data:');
    console.log('Destination:', email.extractedData?.destination || 'N/A');
    console.log('Travelers:', email.extractedData?.travelers?.adults || 0, 'adults');
    console.log('Budget:', email.extractedData?.budget?.amount || 'N/A');
    console.log('Package Type:', email.extractedData?.packageType || 'N/A');

    // Edit the email with good data that should match our test itineraries
    console.log('\n✏️  Editing extracted data for better matching...\n');
    
    email.extractedData = {
      ...email.extractedData,
      destination: 'Paris',
      additionalDestinations: ['Switzerland'],
      dates: {
        preferredStart: '2025-06-01',
        preferredEnd: '2025-06-10',
        duration: 10
      },
      travelers: {
        adults: 2,
        children: 0,
        infants: 0
      },
      budget: {
        amount: 4500,
        currency: 'USD',
        perPerson: false,
        flexible: true
      },
      packageType: 'Honeymoon',
      activities: ['Sightseeing', 'Shopping', 'Cultural tours', 'Fine dining'],
      manuallyEdited: true,
      editedAt: new Date()
    };

    await email.save();

    console.log('✅ Email Updated with:');
    console.log('Destination: Paris + Switzerland');
    console.log('Dates: June 1-10, 2025 (10 days)');
    console.log('Travelers: 2 Adults (Couple)');
    console.log('Budget: $4,500 USD');
    console.log('Package Type: Honeymoon');
    console.log('Activities: Sightseeing, Shopping, Cultural tours, Fine dining');

    // Now find matching itineraries
    console.log('\n🔍 Searching for matching itineraries...\n');

    const itineraries = await Itinerary.find({
      status: 'published',
      tenantId: email.tenantId
    });

    console.log(`Found ${itineraries.length} published itineraries in tenant\n`);

    // Simple matching logic
    const matches = [];
    
    for (const itinerary of itineraries) {
      let score = 0;
      const reasons = [];
      const gaps = [];

      // Destination match (40 points)
      const destCountry = itinerary.destination?.country;
      const destCity = itinerary.destination?.city;
      const destinations = [destCountry, destCity, ...(itinerary.destinations || [])].filter(Boolean);
      
      const emailDests = [
        email.extractedData.destination,
        ...(email.extractedData.additionalDestinations || [])
      ];

      const destMatch = destinations.some(dest => 
        emailDests.some(ed => 
          (typeof dest === 'string' && dest.toLowerCase().includes(ed.toLowerCase())) || 
          (typeof dest === 'string' && ed.toLowerCase().includes(dest.toLowerCase()))
        )
      );

      if (destMatch) {
        score += 40;
        reasons.push(`Destination matches: ${destCity || destCountry || 'Unknown'}`);
      } else {
        gaps.push(`Different destination: ${destCity || destCountry || 'Unknown'}`);
      }

      // Duration match (20 points)
      const itDuration = itinerary.duration?.days || itinerary.duration;
      if (itDuration === email.extractedData.dates?.duration) {
        score += 20;
        reasons.push(`Perfect duration match: ${itDuration} days`);
      } else if (Math.abs(itDuration - (email.extractedData.dates?.duration || 0)) <= 2) {
        score += 10;
        reasons.push(`Close duration: ${itDuration} days`);
      } else {
        gaps.push(`Duration mismatch: ${itDuration} days vs ${email.extractedData.dates?.duration} days`);
      }

      // Budget match (20 points)
      const itPrice = itinerary.estimatedCost?.baseCost || itinerary.estimatedCost?.totalCost;
      if (email.extractedData.budget?.amount && itPrice) {
        const budgetDiff = Math.abs(itPrice - email.extractedData.budget.amount);
        const budgetPercentDiff = budgetDiff / email.extractedData.budget.amount;
        
        if (budgetPercentDiff <= 0.1) {
          score += 20;
          reasons.push(`Budget perfect match: $${itPrice}`);
        } else if (budgetPercentDiff <= 0.3) {
          score += 10;
          reasons.push(`Budget close: $${itPrice}`);
        } else {
          gaps.push(`Budget mismatch: $${itPrice} vs $${email.extractedData.budget.amount}`);
        }
      } else if (itPrice) {
        // Just show the price
        reasons.push(`Package price: $${itPrice}`);
      }

      // Travel Style match (10 points)
      if (email.extractedData.packageType && itinerary.travelStyle) {
        const styleMatch = itinerary.travelStyle.toLowerCase() === email.extractedData.packageType.toLowerCase() ||
                          email.extractedData.packageType.toLowerCase().includes(itinerary.travelStyle.toLowerCase());
        if (styleMatch) {
          score += 10;
          reasons.push(`Travel style matches: ${itinerary.travelStyle}`);
        }
      }

      // Theme match (10 points)
      if (email.extractedData.packageType && itinerary.themes && itinerary.themes.length > 0) {
        const themeMatch = itinerary.themes.some(theme => 
          theme.toLowerCase().includes(email.extractedData.packageType.toLowerCase()) ||
          email.extractedData.packageType.toLowerCase().includes(theme.toLowerCase())
        );
        if (themeMatch) {
          score += 10;
          reasons.push(`Theme matches: ${itinerary.themes.join(', ')}`);
        }
      }

      if (score > 0) {
        matches.push({
          itinerary,
          score,
          reasons,
          gaps
        });
      }
    }

    // Sort by score
    matches.sort((a, b) => b.score - a.score);

    console.log(`✅ Found ${matches.length} matches!\n`);
    console.log('=' .repeat(80));

    matches.forEach((match, idx) => {
      console.log(`\n🎯 Match #${idx + 1}: ${match.itinerary.title}`);
      console.log(`Score: ${match.score}/100`);
      console.log(`Duration: ${match.itinerary.duration?.days || match.itinerary.duration} days`);
      console.log(`Price: $${match.itinerary.estimatedCost?.baseCost || match.itinerary.estimatedCost?.totalCost || 'N/A'} USD`);
      console.log(`Destination: ${match.itinerary.destination?.city || match.itinerary.destination?.country || 'N/A'}`);
      console.log(`Travel Style: ${match.itinerary.travelStyle || 'N/A'}`);
      console.log(`Themes: ${match.itinerary.themes?.join(', ') || 'N/A'}`);
      
      console.log('\n✓ Match Reasons:');
      match.reasons.forEach(reason => console.log(`  • ${reason}`));
      
      if (match.gaps.length > 0) {
        console.log('\n⚠ Gaps:');
        match.gaps.forEach(gap => console.log(`  • ${gap}`));
      }
      console.log('-'.repeat(80));
    });

    // Update email with matching results
    email.matchingResults = matches.map(m => ({
      packageId: m.itinerary._id,
      itineraryTitle: m.itinerary.title,
      destination: m.itinerary.destination?.city || m.itinerary.destination?.country,
      duration: m.itinerary.duration?.days || m.itinerary.duration,
      price: m.itinerary.estimatedCost?.baseCost || m.itinerary.estimatedCost?.totalCost,
      currency: m.itinerary.estimatedCost?.currency || 'USD',
      travelStyle: m.itinerary.travelStyle,
      themes: m.itinerary.themes,
      overview: m.itinerary.overview,
      score: m.score,
      matchReasons: m.reasons,
      gaps: m.gaps
    }));

    await email.save();
    console.log(`\n✅ Saved ${matches.length} matching results to email!\n`);

    console.log('🎉 Test Complete! You can now view this email in the UI:');
    console.log(`   Email ID: ${email._id}`);
    console.log(`   URL: http://localhost:5174/emails/${email._id}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

testEditAndMatch();
