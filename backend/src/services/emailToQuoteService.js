const EmailLog = require('../models/EmailLog');
const Quote = require('../models/Quote');
const Itinerary = require('../models/Itinerary');
const User = require('../models/User');
const Agent = require('../models/Agent');
const Customer = require('../models/Customer');
const openaiService = require('./openaiService');
const emailService = require('./emailService');
const notificationService = require('./notificationService');

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
   * Check if email is a reply to existing conversation
   * Returns linked quote if found
   */
  async checkEmailThread(email, tenantId) {
    try {
      // Check if this is a reply (has inReplyTo or references header)
      if (email.inReplyTo || (email.references && email.references.length > 0)) {
        // Try to find original email by messageId
        const messageIds = [
          email.inReplyTo,
          ...(email.references || [])
        ].filter(Boolean);

        const originalEmail = await EmailLog.findOne({
          messageId: { $in: messageIds },
          tenantId
        });

        if (originalEmail?.linkedQuote) {
          console.log(`📧 Email is reply to thread - linked to quote: ${originalEmail.linkedQuote}`);
          return {
            isReply: true,
            originalEmail,
            linkedQuote: originalEmail.linkedQuote
          };
        }
      }

      return { isReply: false };
    } catch (error) {
      console.error('❌ Error checking email thread:', error);
      return { isReply: false };
    }
  }

  /**
   * Check for duplicate quotes from same customer
   * Prevents creating duplicate quotes for same inquiry
   */
  async checkDuplicateQuote(customerEmail, extractedData, tenantId) {
    try {
      const destination = extractedData.destination;
      const startDate = extractedData.dates?.startDate;

      if (!destination || !startDate) {
        return { isDuplicate: false };
      }

      // Look for quotes from same customer with same destination and similar dates (within 7 days)
      const dateThreshold = new Date(startDate);
      dateThreshold.setDate(dateThreshold.getDate() - 7);
      const dateFuture = new Date(startDate);
      dateFuture.setDate(dateFuture.getDate() + 7);

      const existingQuote = await Quote.findOne({
        tenantId,
        customerEmail: customerEmail.toLowerCase(),
        destination: new RegExp(destination, 'i'),
        startDate: {
          $gte: dateThreshold,
          $lte: dateFuture
        },
        createdAt: {
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Within last 30 days
        },
        status: {
          $nin: ['cancelled', 'expired']
        }
      }).sort({ createdAt: -1 });

      if (existingQuote) {
        console.log(`⚠️  Duplicate quote detected: ${existingQuote.quoteNumber}`);
        return {
          isDuplicate: true,
          existingQuote
        };
      }

      return { isDuplicate: false };
    } catch (error) {
      console.error('❌ Error checking duplicate quote:', error);
      return { isDuplicate: false };
    }
  }

  /**
   * Create or update customer record in CRM
   */
  async createOrUpdateCustomer(extractedData, email, tenantId, agentId) {
    try {
      const customerEmail = email.from.email.toLowerCase();
      
      // Check if customer exists
      let customer = await Customer.findOne({
        email: customerEmail,
        tenantId
      });

      if (customer) {
        // Update existing customer
        customer.lastContactDate = new Date();
        customer.inquiryCount = (customer.inquiryCount || 0) + 1;
        
        // Update phone if provided and not already set
        if (extractedData.customerInfo?.phone && !customer.phone) {
          customer.phone = extractedData.customerInfo.phone;
        }

        // Add destination to tags if not exists
        if (extractedData.destination && !customer.tags.includes(extractedData.destination)) {
          customer.tags.push(extractedData.destination);
        }

        // Add note about new inquiry
        customer.notes.push({
          note: `New inquiry: ${extractedData.destination || 'Travel package'}`,
          createdBy: agentId || null,
          createdAt: new Date()
        });

        await customer.save();
        console.log(`✅ Updated existing customer: ${customer.email}`);
      } else {
        // Create new customer
        customer = await Customer.create({
          tenantId,
          agentId: agentId || null,
          name: extractedData.customerInfo?.name || email.from.name || 'Unknown',
          email: customerEmail,
          phone: extractedData.customerInfo?.phone || 'Not provided',
          source: 'email_inquiry',
          status: 'active',
          tags: extractedData.destination ? [extractedData.destination] : [],
          notes: [{
            note: `First inquiry: ${extractedData.destination || 'Travel package'}`,
            createdBy: agentId || null,
            createdAt: new Date()
          }],
          inquiryCount: 1,
          lastContactDate: new Date()
        });
        console.log(`✅ Created new customer: ${customer.email}`);
      }

      return customer;
    } catch (error) {
      console.error('❌ Error creating/updating customer:', error);
      // Don't fail the whole process if customer creation fails
      return null;
    }
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

      // Create or update customer record
      const customer = await this.createOrUpdateCustomer(extractedData, email, tenantId, agent?._id);

      // Calculate quote number
      const lastQuote = await Quote.findOne({ tenantId })
        .sort({ createdAt: -1 })
        .select('quoteNumber');
      
      const quoteNumber = this.generateQuoteNumber(lastQuote?.quoteNumber);

      // Calculate SLA deadline
      const slaDeadline = this.calculateSLADeadline(extractedData.budget?.amount, extractedData.urgency);

      // Create quote
      const quote = await Quote.create({
        quoteNumber,
        tenantId,
        agentId: agent?._id || null,
        customerId: customer?._id || null,
        
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
        
        // SLA tracking
        sla: {
          responseDeadline: slaDeadline,
          reminderSent: false,
          breached: false
        },
        
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

      // Send operator notification
      await this.sendOperatorNotification(quote, validation, tenantId);

      return {
        success: true,
        quote,
        validation,
        customer
      };
    } catch (error) {
      console.error('❌ Error creating quote from email:', error);
      throw error;
    }
  }

  /**
   * Calculate SLA response deadline based on quote value and urgency
   */
  calculateSLADeadline(budgetAmount, urgency) {
    const now = new Date();
    let hours = 48; // Default 48 hours

    // High-value quotes get priority (24 hours)
    if (budgetAmount && budgetAmount > 5000) {
      hours = 24;
    }

    // Urgent requests get expedited (8 hours)
    if (urgency === 'urgent' || urgency === 'high') {
      hours = 8;
    }

    return new Date(now.getTime() + hours * 60 * 60 * 1000);
  }

  /**
   * Send notification to operators about new quote
   */
  async sendOperatorNotification(quote, validation, tenantId) {
    try {
      // Determine priority
      const priority = quote.estimatedBudget > 5000 ? 'high' : 'normal';

      // Create in-app notification
      await notificationService.createNotification({
        type: 'new_quote_from_email',
        title: '📧 New Quote from Email',
        message: `Quote ${quote.quoteNumber} created from email inquiry - ${quote.destination}`,
        priority,
        tenantId,
        recipients: {
          roles: ['operator', 'super_admin'],
          specificUsers: quote.agentId ? [quote.agentId] : []
        },
        data: {
          quoteId: quote._id,
          emailId: quote.emailId,
          destination: quote.destination,
          budget: quote.estimatedBudget,
          completeness: validation.completeness,
          customerEmail: quote.customerEmail
        }
      });

      console.log(`✅ Operator notification sent for quote ${quote.quoteNumber}`);
    } catch (error) {
      console.error('❌ Error sending operator notification:', error);
      // Don't fail the process if notification fails
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
      const totalPax = (adults || 0) + (children || 0);

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

      // Availability check if dates provided
      if (startDate && endDate) {
        query.$or = [
          // No availability tracking (assume available)
          { availability: { $exists: false } },
          { availability: { $size: 0 } },
          // Has availability and has spots
          {
            availability: {
              $elemMatch: {
                startDate: { $lte: new Date(startDate) },
                endDate: { $gte: new Date(endDate) },
                spotsAvailable: { $gte: totalPax }
              }
            }
          }
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

    // Accommodation level match (5 points)
    if (itinerary.accommodationLevel && quoteData.hotelType) {
      if (itinerary.accommodationLevel === quoteData.hotelType) {
        score += 5;
        reasons.push(`✓ ${quoteData.hotelType} accommodation`);
      }
    }

    // Budget validation (10 points)
    if (quoteData.estimatedBudget && itinerary.basePrice) {
      const budgetRatio = itinerary.basePrice / quoteData.estimatedBudget;
      
      if (budgetRatio <= 1.0) {
        score += 10;
        reasons.push('✓ Within budget');
      } else if (budgetRatio <= 1.2) {
        score += 5;
        reasons.push('~ Slightly over budget (+20%)');
      } else {
        score -= 10;
        reasons.push(`✗ Significantly over budget (${Math.round((budgetRatio - 1) * 100)}% more)`);
      }
    }

    return {
      total: Math.max(0, Math.min(score, 100)), // Keep between 0-100
      reasons,
      breakdown: {
        destination: 30,
        duration: 20,
        packageType: 15,
        capacity: 15,
        activities: 10,
        accommodation: 5,
        budget: 10
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

      // Check if email is a reply to existing thread
      console.log('🔗 Checking if email is part of existing thread...');
      const threadCheck = await this.checkEmailThread(email, tenantId);
      
      if (threadCheck.isReply && threadCheck.linkedQuote) {
        console.log(`📧 Email is reply to existing quote: ${threadCheck.linkedQuote}`);
        
        // Link this email to existing quote
        email.linkedQuote = threadCheck.linkedQuote;
        email.processingStatus = 'linked_to_existing_quote';
        await email.save();
        
        // Get the existing quote
        const existingQuote = await Quote.findById(threadCheck.linkedQuote);
        if (existingQuote) {
          existingQuote.notes.push({
            text: `Customer follow-up email received: ${email.subject}`,
            createdBy: 'system',
            createdAt: new Date()
          });
          await existingQuote.save();
          
          // Notify operator about follow-up
          await notificationService.createNotification({
            type: 'customer_followup',
            title: '💬 Customer Follow-up',
            message: `Customer replied to quote ${existingQuote.quoteNumber}`,
            priority: 'high',
            tenantId,
            recipients: {
              roles: ['operator', 'super_admin'],
              specificUsers: existingQuote.agentId ? [existingQuote.agentId] : []
            },
            data: {
              quoteId: existingQuote._id,
              emailId: email._id
            }
          });
        }
        
        return {
          success: true,
          isFollowUp: true,
          message: 'Email linked to existing quote - operator notified',
          email,
          existingQuote
        };
      }

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

      // Step 3: Extract data with AI (with fallback)
      console.log('📝 Step 3: Extracting quote data with AI...');
      let extractedData;
      let aiFailed = false;
      
      try {
        extractedData = await openaiService.extractCustomerInquiry(email, tenantId);
        email.extractedData = extractedData;
        await email.save();
        console.log('✅ Step 3: Data extracted successfully');
      } catch (aiError) {
        console.error('❌ AI extraction failed:', aiError.message);
        aiFailed = true;
        
        // Fallback: Create minimal data structure
        extractedData = {
          customerInfo: {
            email: email.from.email,
            name: email.from.name
          },
          confidence: 0,
          missingInfo: ['Manual review required - AI extraction failed', 'All fields need manual entry']
        };
        
        email.extractedData = extractedData;
        email.aiExtractionFailed = true;
        await email.save();
        console.log('⚠️  Step 3: Using fallback - minimal data created');
      }

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

      // Check for duplicate quotes before creating
      console.log('🔍 Checking for duplicate quotes...');
      const duplicateCheck = await this.checkDuplicateQuote(
        email.from.email.toLowerCase(),
        extractedData,
        tenantId
      );

      if (duplicateCheck.isDuplicate) {
        console.log(`⚠️  Duplicate quote detected: ${duplicateCheck.existingQuote.quoteNumber}`);
        
        // Link email to existing quote
        email.linkedQuote = duplicateCheck.existingQuote._id;
        email.processingStatus = 'duplicate_detected';
        await email.save();
        
        // Add note to existing quote
        duplicateCheck.existingQuote.notes.push({
          text: `Duplicate inquiry received via email: ${email.subject}`,
          createdBy: 'system',
          createdAt: new Date()
        });
        await duplicateCheck.existingQuote.save();
        
        // Notify operator
        await notificationService.createNotification({
          type: 'duplicate_quote',
          title: '⚠️ Duplicate Quote Detected',
          message: `Customer ${email.from.email} sent similar inquiry - linked to ${duplicateCheck.existingQuote.quoteNumber}`,
          priority: 'normal',
          tenantId,
          recipients: {
            roles: ['operator', 'super_admin']
          },
          data: {
            quoteId: duplicateCheck.existingQuote._id,
            emailId: email._id
          }
        });
        
        return {
          success: true,
          isDuplicate: true,
          message: 'Duplicate quote detected - linked to existing quote',
          email,
          existingQuote: duplicateCheck.existingQuote
        };
      }

      // Step 5: Create quote
      console.log('💼 Step 5: Creating quote record...');
      const quoteResult = await this.createQuoteFromEmail(emailId, extractedData, tenantId);
      console.log(`✅ Step 5: Quote ${quoteResult.quote.quoteNumber} created`);

      // If AI failed, mark quote for manual review
      if (aiFailed) {
        quoteResult.quote.status = 'manual_review_required';
        quoteResult.quote.notes.push({
          text: 'AI extraction failed - requires manual data entry',
          createdBy: 'system',
          createdAt: new Date()
        });
        await quoteResult.quote.save();
        
        // Send urgent notification
        await notificationService.createNotification({
          type: 'manual_review_required',
          title: '🚨 Manual Review Required',
          message: `Quote ${quoteResult.quote.quoteNumber} - AI extraction failed`,
          priority: 'urgent',
          tenantId,
          recipients: {
            roles: ['operator', 'super_admin']
          },
          data: {
            quoteId: quoteResult.quote._id,
            emailId: email._id
          }
        });
      }

      // Step 6: Search itineraries
      console.log('🔍 Step 6: Searching for matching itineraries...');
      const itinerarySearch = await this.searchMatchingItineraries(quoteResult.quote, tenantId);
      console.log(`✅ Step 6: ${itinerarySearch.message}`);

      if (itinerarySearch.found) {
        console.log(`   📋 Found ${itinerarySearch.matches.length} matching itineraries`);
        itinerarySearch.matches.forEach((match, idx) => {
          console.log(`   ${idx + 1}. ${match.itinerary.title} - Score: ${match.score.total}/100`);
        });

        quoteResult.quote.status = 'itineraries_found';
        quoteResult.quote.matchedItineraries = itinerarySearch.matches.map(m => m.itinerary._id);
        await quoteResult.quote.save();

        // Send acknowledgment email to customer
        await this.sendCustomerAcknowledgment(quoteResult.quote, email, true);
      } else {
        console.log('   📧 No itineraries found - preparing supplier request');
        await this.requestItineraryFromSuppliers(quoteResult.quote, tenantId);
        
        // Send acknowledgment email to customer
        await this.sendCustomerAcknowledgment(quoteResult.quote, email, false);
      }

      // If data incomplete, request missing information
      if (!validation.isValid && validation.missing.length > 0) {
        console.log('📧 Requesting missing information from customer...');
        await this.requestMissingInformation(quoteResult.quote, validation);
      }

      console.log('✅ Email to quote workflow completed!\n');

      return {
        success: true,
        email,
        extractedData,
        validation,
        quote: quoteResult.quote,
        customer: quoteResult.customer,
        itinerarySearch,
        aiFailed
      };
    } catch (error) {
      console.error('❌ Error in email-to-quote workflow:', error);
      throw error;
    }
  }

  /**
   * Send acknowledgment email to customer
   */
  async sendCustomerAcknowledgment(quote, email, itinerariesFound) {
    try {
      const subject = `Received: ${quote.destination} Travel Inquiry - ${quote.quoteNumber}`;
      
      const body = `
Dear ${quote.customerName},

Thank you for your inquiry about ${quote.destination}!

We have received your request and our travel experts are working on creating the perfect itinerary for you.

📋 Your Reference Number: ${quote.quoteNumber}

${itinerariesFound ? 
  `✅ Good news! We found ${quote.matchedItineraries.length} matching packages for your requirements. We'll send detailed options shortly.` :
  `We're reaching out to our preferred partners to create a customized itinerary that perfectly matches your requirements.`
}

📅 Travel Dates: ${quote.startDate ? new Date(quote.startDate).toLocaleDateString('en-GB') : 'TBD'} - ${quote.endDate ? new Date(quote.endDate).toLocaleDateString('en-GB') : 'TBD'}
👥 Travelers: ${quote.adults} adults${quote.children ? `, ${quote.children} children` : ''}
💰 Budget: ${quote.estimatedBudget ? `${quote.currency} ${quote.estimatedBudget}` : 'To be discussed'}

⏱️ Expected Response Time: 24-48 hours

In the meantime, if you have any questions or would like to add more details, feel free to reply to this email.

Best regards,
The Travel Team

---
This is an automated acknowledgment. A travel consultant will contact you soon with detailed options.
`;

      await emailService.sendEmail({
        to: quote.customerEmail,
        subject,
        text: body,
        html: body.replace(/\n/g, '<br>')
      });

      console.log(`✅ Acknowledgment email sent to ${quote.customerEmail}`);
    } catch (error) {
      console.error('❌ Error sending acknowledgment email:', error);
      // Don't fail the workflow if email fails
    }
  }

  /**
   * Request missing information from customer
   */
  async requestMissingInformation(quote, validation) {
    try {
      const missingFields = validation.missing.map(m => m.split(' - ')[0]);
      
      const subject = `Re: ${quote.destination} - Need a Few More Details`;
      
      let questionsList = '';
      if (missingFields.includes('startDate') || missingFields.includes('endDate')) {
        questionsList += '• What are your preferred travel dates?\n';
      }
      if (missingFields.includes('adults')) {
        questionsList += '• How many adults will be traveling?\n';
      }
      if (missingFields.includes('destination')) {
        questionsList += '• Which destination are you interested in?\n';
      }
      if (validation.warnings.some(w => w.includes('mealPlan'))) {
        questionsList += '• What meal plan would you prefer? (Breakfast only, Half Board, Full Board, All Inclusive)\n';
      }
      if (validation.warnings.some(w => w.includes('hotelType'))) {
        questionsList += '• What type of accommodation? (Budget, Standard, Premium, Luxury)\n';
      }
      
      const body = `
Dear ${quote.customerName},

Thank you for your interest in traveling to ${quote.destination || 'your chosen destination'}!

To provide you with the best quote and options, we need a few more details:

${questionsList}

Please reply to this email with the information above, and we'll send you detailed options within 24 hours.

Your Reference Number: ${quote.quoteNumber}

Best regards,
The Travel Team
`;

      await emailService.sendEmail({
        to: quote.customerEmail,
        subject,
        text: body,
        html: body.replace(/\n/g, '<br>')
      });

      quote.status = 'awaiting_customer_info';
      quote.notes.push({
        text: 'Requested missing information from customer',
        createdBy: 'system',
        createdAt: new Date()
      });
      await quote.save();

      console.log(`✅ Missing info request sent to ${quote.customerEmail}`);
    } catch (error) {
      console.error('❌ Error requesting missing information:', error);
      // Don't fail the workflow
    }
  }
}

module.exports = new EmailToQuoteService();
