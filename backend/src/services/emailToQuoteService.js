const EmailLog = require('../models/EmailLog');
const Quote = require('../models/Quote');
const Itinerary = require('../models/Itinerary');
const User = require('../models/User');
const Agent = require('../models/Agent');
const openaiService = require('./openaiService');
const emailService = require('./email');

class EmailToQuoteService {
  /**
   * Step 4: Validate that all required quote fields are present
   */
  validateQuoteData(extractedData) {
    const required = {
      startDate: extractedData.dates?.startDate,
      endDate: extractedData.dates?.endDate,
      destination: extractedData.destination,
      adults: extractedData.travelers?.adults,
      mealPlan: extractedData.mealPlan,
      hotelType: extractedData.accommodation?.hotelType,
      roomCategory: extractedData.accommodation?.roomCategory
    };

    const missing = [];
    const warnings = [];

    // Critical fields for quote
    if (!required.startDate) missing.push('startDate - Journey start date');
    if (!required.endDate) missing.push('endDate - Journey end date');
    if (!required.destination) missing.push('destination - Travel destination');
    if (!required.adults || required.adults === 0) missing.push('adults - Number of adult travelers');

    // Important but not blocking
    if (!required.mealPlan) warnings.push('mealPlan - Meal preference not specified');
    if (!required.hotelType) warnings.push('hotelType - Hotel category not specified');
    if (!required.roomCategory) warnings.push('roomCategory - Room type not specified');

    // Children ages validation
    const children = extractedData.travelers?.children || 0;
    const childAges = extractedData.travelers?.childAges || [];
    if (children > 0 && childAges.length !== children) {
      warnings.push(`childAges - ${children} children but only ${childAges.length} ages provided`);
    }

    return {
      isValid: missing.length === 0,
      isComplete: missing.length === 0 && warnings.length === 0,
      missing,
      warnings,
      completeness: this.calculateCompleteness(extractedData)
    };
  }

  /**
   * Calculate data completeness percentage
   */
  calculateCompleteness(data) {
    const fields = [
      data.destination,
      data.dates?.startDate,
      data.dates?.endDate,
      data.travelers?.adults,
      data.mealPlan,
      data.accommodation?.hotelType,
      data.accommodation?.roomCategory,
      data.budget?.amount,
      data.packageType,
      data.customerInfo?.name,
      data.customerInfo?.phone
    ];

    const filled = fields.filter(f => f !== null && f !== undefined && f !== 0).length;
    return Math.round((filled / fields.length) * 100);
  }

  /**
   * Step 5: Create quote from email data and save to DB
   */
  async createQuoteFromEmail(emailId, extractedData, tenantId) {
    try {
      // Get the email
      const email = await EmailLog.findById(emailId);
      if (!email) {
        throw new Error('Email not found');
      }

      // Validate data
      const validation = this.validateQuoteData(extractedData);

      // Find agent from email sender
      let agent = null;
      const senderEmail = email.from.email.toLowerCase();
      
      // Try to find user/agent by email
      const user = await User.findOne({ 
        email: senderEmail,
        tenantId,
        role: { $in: ['agent', 'customer'] }
      });

      if (user && user.role === 'agent') {
        agent = await Agent.findOne({ userId: user._id });
      }

      // Calculate quote number
      const lastQuote = await Quote.findOne({ tenantId })
        .sort({ createdAt: -1 })
        .select('quoteNumber');
      
      const quoteNumber = this.generateQuoteNumber(lastQuote?.quoteNumber);

      // Create quote
      const quote = await Quote.create({
        quoteNumber,
        tenantId,
        agentId: agent?._id || null,
        
        // Customer info
        customerName: extractedData.customerInfo?.name || email.from.name || 'Unknown',
        customerEmail: senderEmail,
        customerPhone: extractedData.customerInfo?.phone || null,
        
        // Travel details
        destination: extractedData.destination,
        additionalDestinations: extractedData.additionalDestinations || [],
        startDate: extractedData.dates?.startDate ? new Date(extractedData.dates.startDate) : null,
        endDate: extractedData.dates?.endDate ? new Date(extractedData.dates.endDate) : null,
        duration: extractedData.dates?.duration || null,
        
        // Travelers
        adults: extractedData.travelers?.adults || 0,
        children: extractedData.travelers?.children || 0,
        childAges: extractedData.travelers?.childAges || [],
        infants: extractedData.travelers?.infants || 0,
        
        // Accommodation
        hotelType: extractedData.accommodation?.hotelType || null,
        starRating: extractedData.accommodation?.starRating || null,
        roomCategory: extractedData.accommodation?.roomCategory || null,
        numberOfRooms: extractedData.accommodation?.numberOfRooms || null,
        roomType: extractedData.accommodation?.roomType || null,
        
        // Package details
        packageType: extractedData.packageType || 'custom',
        mealPlan: extractedData.mealPlan || null,
        activities: extractedData.activities || [],
        specialRequirements: extractedData.specialRequirements || [],
        
        // Budget
        estimatedBudget: extractedData.budget?.amount || null,
        currency: extractedData.budget?.currency || 'INR',
        budgetFlexible: extractedData.budget?.flexible !== false,
        
        // Status
        status: validation.isValid ? 'pending_operator_review' : 'incomplete_data',
        
        // Metadata
        source: 'email',
        emailId: email._id,
        extractionConfidence: extractedData.confidence || 0,
        dataCompleteness: validation.completeness,
        missingFields: validation.missing,
        warningFields: validation.warnings,
        
        // Notes
        notes: [
          {
            text: `Auto-created from email: ${email.subject}`,
            createdBy: 'system',
            createdAt: new Date()
          }
        ]
      });

      // Update email with quote link
      email.linkedQuote = quote._id;
      email.processingStatus = 'converted_to_quote';
      await email.save();

      console.log(`✅ Quote ${quoteNumber} created from email ${emailId}`);

      return {
        success: true,
        quote,
        validation
      };
    } catch (error) {
      console.error('❌ Error creating quote from email:', error);
      throw error;
    }
  }

  /**
   * Generate quote number (Q2025-000001 format)
   */
  generateQuoteNumber(lastQuoteNumber) {
    const year = new Date().getFullYear();
    
    if (!lastQuoteNumber) {
      return `Q${year}-000001`;
    }

    // Extract number from last quote
    const match = lastQuoteNumber.match(/Q(\d{4})-(\d{6})/);
    if (!match) {
      return `Q${year}-000001`;
    }

    const lastYear = parseInt(match[1]);
    const lastNumber = parseInt(match[2]);

    // Reset counter for new year
    if (lastYear < year) {
      return `Q${year}-000001`;
    }

    // Increment
    const nextNumber = (lastNumber + 1).toString().padStart(6, '0');
    return `Q${year}-${nextNumber}`;
  }

  /**
   * Step 6: Search for matching itineraries
   */
  async searchMatchingItineraries(quoteData, tenantId) {
    try {
      const { destination, startDate, endDate, adults, children } = quoteData;

      // Build search query
      const query = {
        tenantId,
        status: 'active'
      };

      // Destination match (flexible - contains or equals)
      if (destination) {
        query.$or = [
          { destination: new RegExp(destination, 'i') },
          { destinations: new RegExp(destination, 'i') }
        ];
      }

      // Find all potential matches
      const itineraries = await Itinerary.find(query)
        .limit(50)
        .lean();

      if (itineraries.length === 0) {
        return {
          found: false,
          matches: [],
          message: 'No itineraries found for this destination'
        };
      }

      // Score each itinerary
      const scoredItineraries = itineraries.map(itinerary => {
        const score = this.calculateItineraryMatch(itinerary, quoteData);
        return {
          itinerary,
          score,
          matchReasons: score.reasons
        };
      });

      // Sort by score
      scoredItineraries.sort((a, b) => b.score.total - a.score.total);

      // Return top matches (score > 60)
      const goodMatches = scoredItineraries.filter(s => s.score.total >= 60);

      return {
        found: goodMatches.length > 0,
        matches: goodMatches.slice(0, 5), // Top 5 matches
        allResults: scoredItineraries.length,
        message: goodMatches.length > 0 
          ? `Found ${goodMatches.length} matching itineraries`
          : 'No good matches found. Consider creating new itinerary or contacting suppliers.'
      };
    } catch (error) {
      console.error('❌ Error searching itineraries:', error);
      throw error;
    }
  }

  /**
   * Calculate itinerary match score (0-100)
   */
  calculateItineraryMatch(itinerary, quoteData) {
    let score = 0;
    const reasons = [];

    // Destination match (30 points)
    if (itinerary.destination && quoteData.destination) {
      const destMatch = itinerary.destination.toLowerCase().includes(quoteData.destination.toLowerCase()) ||
                       quoteData.destination.toLowerCase().includes(itinerary.destination.toLowerCase());
      if (destMatch) {
        score += 30;
        reasons.push('✓ Destination matches');
      }
    }

    // Duration match (20 points)
    if (itinerary.days && quoteData.duration) {
      const daysDiff = Math.abs(itinerary.days - quoteData.duration);
      if (daysDiff === 0) {
        score += 20;
        reasons.push('✓ Exact duration match');
      } else if (daysDiff <= 2) {
        score += 15;
        reasons.push('✓ Similar duration (±2 days)');
      } else if (daysDiff <= 4) {
        score += 10;
        reasons.push('~ Close duration match');
      }
    }

    // Package type match (15 points)
    if (itinerary.packageType && quoteData.packageType) {
      if (itinerary.packageType === quoteData.packageType) {
        score += 15;
        reasons.push(`✓ ${quoteData.packageType} package`);
      }
    }

    // Traveler capacity (15 points)
    const totalPax = (quoteData.adults || 0) + (quoteData.children || 0);
    if (itinerary.maxPax >= totalPax) {
      score += 15;
      reasons.push(`✓ Accommodates ${totalPax} travelers`);
    } else {
      reasons.push(`✗ Can only accommodate ${itinerary.maxPax} (need ${totalPax})`);
    }

    // Activities match (10 points)
    if (quoteData.activities && quoteData.activities.length > 0 && itinerary.activities) {
      const matchingActivities = quoteData.activities.filter(reqActivity => 
        itinerary.activities.some(itinActivity => 
          itinActivity.toLowerCase().includes(reqActivity.toLowerCase())
        )
      );
      if (matchingActivities.length > 0) {
        score += Math.min(10, matchingActivities.length * 3);
        reasons.push(`✓ Includes ${matchingActivities.length} requested activities`);
      }
    }

    // Accommodation level match (10 points)
    if (itinerary.accommodationLevel && quoteData.hotelType) {
      if (itinerary.accommodationLevel === quoteData.hotelType) {
        score += 10;
        reasons.push(`✓ ${quoteData.hotelType} accommodation`);
      }
    }

    return {
      total: Math.min(score, 100),
      reasons,
      breakdown: {
        destination: Math.min(score, 30),
        duration: Math.min(score - 30, 20),
        packageType: Math.min(score - 50, 15),
        capacity: Math.min(score - 65, 15),
        activities: Math.min(score - 80, 10),
        accommodation: Math.min(score - 90, 10)
      }
    };
  }

  /**
   * Send email to suppliers requesting itinerary
   */
  async requestItineraryFromSuppliers(quote, tenantId) {
    try {
      // Get supplier contacts for this destination
      // For now, we'll use a template
      
      const emailSubject = `Itinerary Request: ${quote.destination} - ${quote.adults + quote.children} PAX`;
      
      const emailBody = this.generateSupplierRequestTemplate(quote);

      // TODO: Get actual supplier emails from database
      // For now, log the request
      console.log('📧 Supplier Request Email:');
      console.log('Subject:', emailSubject);
      console.log('Body:', emailBody);

      // Mark quote as waiting for supplier response
      quote.status = 'awaiting_supplier_response';
      quote.notes.push({
        text: 'Itinerary request sent to suppliers',
        createdBy: 'system',
        createdAt: new Date()
      });
      await quote.save();

      return {
        success: true,
        message: 'Supplier request email prepared',
        emailSubject,
        emailBody
      };
    } catch (error) {
      console.error('❌ Error requesting itinerary from suppliers:', error);
      throw error;
    }
  }

  /**
   * Generate supplier request email template
   */
  generateSupplierRequestTemplate(quote) {
    const startDate = quote.startDate ? new Date(quote.startDate).toLocaleDateString('en-GB') : 'TBD';
    const endDate = quote.endDate ? new Date(quote.endDate).toLocaleDateString('en-GB') : 'TBD';
    
    return `Dear Partner,

We have received an inquiry for the following travel requirement:

TRAVEL DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Destination:        ${quote.destination}
${quote.additionalDestinations && quote.additionalDestinations.length > 0 ? 
  `Additional Stops:  ${quote.additionalDestinations.join(', ')}\n` : ''}
Travel Dates:       ${startDate} to ${endDate}
Duration:           ${quote.duration || 'TBD'} days/nights

TRAVELERS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Adults:             ${quote.adults}
${quote.children > 0 ? `Children:           ${quote.children} (Ages: ${quote.childAges.join(', ')})\n` : ''}
${quote.infants > 0 ? `Infants:            ${quote.infants}\n` : ''}
Total PAX:          ${quote.adults + quote.children + quote.infants}

ACCOMMODATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Hotel Type:         ${quote.hotelType || 'Standard'}
${quote.starRating ? `Star Rating:        ${quote.starRating}\n` : ''}
Room Category:      ${quote.roomCategory || 'Standard'}
${quote.numberOfRooms ? `Number of Rooms:    ${quote.numberOfRooms}\n` : ''}
Room Type:          ${quote.roomType || 'Double'}
Meal Plan:          ${quote.mealPlan || 'Breakfast'}

PACKAGE DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Package Type:       ${quote.packageType || 'Custom'}
${quote.activities && quote.activities.length > 0 ? 
  `Activities:         ${quote.activities.join(', ')}\n` : ''}
${quote.specialRequirements && quote.specialRequirements.length > 0 ?
  `Special Needs:      ${quote.specialRequirements.join(', ')}\n` : ''}

BUDGET:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Estimated Budget:   ${quote.estimatedBudget ? `${quote.currency} ${quote.estimatedBudget}` : 'TBD'}
${quote.budgetFlexible ? '(Flexible)\n' : '(Fixed)\n'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please provide:
1. Available itinerary options
2. Detailed day-by-day plan
3. Inclusions and exclusions
4. Pricing breakdown
5. Payment terms
6. Cancellation policy

Quote Reference: ${quote.quoteNumber}
Response Required By: ${new Date(Date.now() + 48 * 60 * 60 * 1000).toLocaleDateString('en-GB')}

Best regards,
Travel Manager Pro Team
`;
  }

  /**
   * Main workflow: Process email to quote
   */
  async processEmailToQuote(emailId, tenantId) {
    try {
      console.log(`\n🔄 Processing email ${emailId} to quote...`);

      // Get email
      const email = await EmailLog.findById(emailId);
      if (!email) {
        throw new Error('Email not found');
      }

      // Step 1: Already done (email exists in system)
      console.log('✅ Step 1: Email retrieved from database');

      // Step 2: Categorize if not already done
      if (!email.category) {
        console.log('🎯 Step 2: Categorizing email...');
        const categoryResult = await openaiService.categorizeEmail(email, tenantId);
        email.category = categoryResult.category;
        email.categoryConfidence = categoryResult.confidence;
        await email.save();
        console.log(`✅ Step 2: Categorized as ${categoryResult.category} (${categoryResult.confidence}% confidence)`);
      } else {
        console.log(`✅ Step 2: Already categorized as ${email.category}`);
      }

      // Only process CUSTOMER emails
      if (email.category !== 'CUSTOMER') {
        return {
          success: false,
          message: `Email is ${email.category} type, not a customer inquiry`,
          email
        };
      }

      // Step 3: Extract data
      console.log('📝 Step 3: Extracting quote data with AI...');
      const extractedData = await openaiService.extractCustomerInquiry(email, tenantId);
      
      email.extractedData = extractedData;
      await email.save();
      console.log('✅ Step 3: Data extracted successfully');

      // Step 4: Validate data
      console.log('✔️  Step 4: Validating quote data...');
      const validation = this.validateQuoteData(extractedData);
      console.log(`✅ Step 4: Validation complete - ${validation.isComplete ? 'Complete' : 'Incomplete'}`);
      
      if (validation.missing.length > 0) {
        console.log('⚠️  Missing required fields:', validation.missing);
      }
      if (validation.warnings.length > 0) {
        console.log('⚠️  Warnings:', validation.warnings);
      }

      // Step 5: Create quote
      console.log('💼 Step 5: Creating quote record...');
      const quoteResult = await this.createQuoteFromEmail(emailId, extractedData, tenantId);
      console.log(`✅ Step 5: Quote ${quoteResult.quote.quoteNumber} created`);

      // Step 6: Search itineraries
      console.log('🔍 Step 6: Searching for matching itineraries...');
      const itinerarySearch = await this.searchMatchingItineraries(quoteResult.quote, tenantId);
      console.log(`✅ Step 6: ${itinerarySearch.message}`);

      if (itinerarySearch.found) {
        console.log(`   📋 Found ${itinerarySearch.matches.length} matching itineraries`);
        itinerarySearch.matches.forEach((match, idx) => {
          console.log(`   ${idx + 1}. ${match.itinerary.title} - Score: ${match.score.total}/100`);
        });

        // TODO: Generate and send PDF with itineraries
        quoteResult.quote.status = 'itineraries_found';
        quoteResult.quote.matchedItineraries = itinerarySearch.matches.map(m => m.itinerary._id);
      } else {
        console.log('   📧 No itineraries found - preparing supplier request');
        await this.requestItineraryFromSuppliers(quoteResult.quote, tenantId);
      }

      await quoteResult.quote.save();

      console.log('✅ Email to quote workflow completed!\n');

      return {
        success: true,
        email,
        extractedData,
        validation,
        quote: quoteResult.quote,
        itinerarySearch
      };
    } catch (error) {
      console.error('❌ Error in email-to-quote workflow:', error);
      throw error;
    }
  }
}

module.exports = new EmailToQuoteService();
