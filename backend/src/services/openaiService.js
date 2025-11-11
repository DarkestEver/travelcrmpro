const OpenAI = require('openai');
const AIProcessingLog = require('../models/AIProcessingLog');
const Tenant = require('../models/Tenant');

class OpenAIService {
  constructor() {
    // Global OpenAI client (fallback)
    this.globalEnabled = false;
    
    if (process.env.OPENAI_API_KEY) {
      try {
        this.globalClient = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });
        this.globalEnabled = true;
        console.log('✅ Global OpenAI service initialized');
      } catch (error) {
        console.error('❌ Failed to initialize global OpenAI:', error.message);
      }
    } else {
      console.warn('⚠️  Global OPENAI_API_KEY not configured');
      console.warn('   Tenants can configure their own API keys in settings');
    }
    
    // Tenant-specific clients cache
    this.tenantClients = new Map();
    
    this.models = {
      categorization: 'gpt-4-turbo-preview',
      extraction: 'gpt-4-turbo-preview',
      response: 'gpt-4-turbo-preview',
      sentiment: 'gpt-3.5-turbo'
    };
    
    // Pricing per 1K tokens (as of Nov 2024)
    this.pricing = {
      'gpt-4-turbo-preview': { input: 0.01, output: 0.03 },
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 }
    };
  }

  /**
   * Get OpenAI client for tenant (tenant-specific or global fallback)
   */
  async getClientForTenant(tenantId) {
    // Check cache first
    if (this.tenantClients.has(tenantId)) {
      return this.tenantClients.get(tenantId);
    }

    // Try to get tenant-specific API key
    const tenant = await Tenant.findById(tenantId);
    if (tenant && tenant.settings?.aiSettings?.enabled && tenant.settings?.aiSettings?.openaiApiKey) {
      try {
        const aiSettings = tenant.getDecryptedAISettings();
        if (aiSettings.openaiApiKey) {
          const client = new OpenAI({
            apiKey: aiSettings.openaiApiKey
          });
          
          // Cache the client
          this.tenantClients.set(tenantId, {
            client,
            settings: aiSettings,
            source: 'tenant'
          });
          
          console.log(`✅ Using tenant-specific OpenAI key for tenant ${tenantId}`);
          return { client, settings: aiSettings, source: 'tenant' };
        }
      } catch (error) {
        console.error(`Failed to initialize tenant OpenAI for ${tenantId}:`, error.message);
      }
    }

    // Fallback to global client
    if (this.globalEnabled) {
      console.log(`✅ Using global OpenAI key for tenant ${tenantId}`);
      return {
        client: this.globalClient,
        settings: { enabled: true },
        source: 'global'
      };
    }

    // No OpenAI available
    return null;
  }

  /**
   * Check if OpenAI is available for tenant
   */
  async isEnabledForTenant(tenantId) {
    const clientInfo = await this.getClientForTenant(tenantId);
    return clientInfo !== null;
  }

  /**
   * Categorize email using AI
   */
  async categorizeEmail(email, tenantId) {
    const clientInfo = await this.getClientForTenant(tenantId);
    
    if (!clientInfo) {
      return {
        category: 'OTHER',
        confidence: 0,
        reasoning: 'OpenAI not configured - manual categorization required',
        subcategory: 'uncategorized',
        urgency: 'normal',
        sentiment: 'neutral',
        cost: 0,
        tokens: { prompt: 0, completion: 0, total: 0 }
      };
    }

    const startTime = Date.now();
    
    const prompt = `Analyze this email and categorize it into ONE of these categories:

SUPPLIER - Package updates, pricing, availability, hotel/activity confirmations
CUSTOMER - Booking inquiries, travel requests, questions, complaints
AGENT - Commission queries, booking status, internal questions
FINANCE - Payment confirmations, invoices, refund requests
SPAM - Marketing, unrelated content, spam
OTHER - Cannot determine or doesn't fit above

Email Details:
From: ${email.from.email}
Subject: ${email.subject}
Body: ${email.bodyText.substring(0, 2000)}

Respond with ONLY valid JSON:
{
  "category": "SUPPLIER|CUSTOMER|AGENT|FINANCE|SPAM|OTHER",
  "confidence": 0-100,
  "reasoning": "brief explanation",
  "subcategory": "more specific classification",
  "urgency": "low|normal|high|urgent",
  "sentiment": "positive|neutral|negative"
}`;

    try {
      const model = clientInfo.settings?.models?.categorization || 'gpt-4-turbo-preview';
      const response = await clientInfo.client.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: 'You are an expert email categorization system for a travel CRM. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content);
      const usage = response.usage;
      const cost = this.calculateCost(model, usage);

      // Log the AI processing
      await AIProcessingLog.create({
        emailLogId: email._id,
        processingType: 'categorization',
        status: 'completed',
        model: model,
        prompt,
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
        request: { email: email._id },
        response: response.choices[0].message,
        result,
        confidence: result.confidence,
        startedAt: new Date(startTime),
        completedAt: new Date(),
        estimatedCost: cost,
        tenantId
      });

      return {
        category: result.category,
        confidence: result.confidence,
        reasoning: result.reasoning,
        subcategory: result.subcategory,
        urgency: result.urgency,
        sentiment: result.sentiment,
        cost,
        tokens: usage.total_tokens
      };
    } catch (error) {
      console.error('OpenAI categorization error:', error);
      
      const model = clientInfo.settings?.models?.categorization || 'gpt-4-turbo-preview';
      await AIProcessingLog.create({
        emailLogId: email._id,
        processingType: 'categorization',
        status: 'failed',
        model: model,
        prompt,
        error: error.message,
        errorCode: error.code,
        startedAt: new Date(startTime),
        completedAt: new Date(),
        tenantId
      });
      
      throw error;
    }
  }

  /**
   * Extract structured data from customer inquiry
   */
  async extractCustomerInquiry(email, tenantId) {
    const clientInfo = await this.getClientForTenant(tenantId);
    
    if (!clientInfo) {
      return {
        destination: null,
        dates: { flexible: true },
        travelers: { adults: 0, children: 0 },
        budget: { amount: null, currency: 'USD', flexible: true },
        confidence: 0,
        missingInfo: ['OpenAI not configured - manual extraction required'],
        cost: 0,
        tokens: { prompt: 0, completion: 0, total: 0 }
      };
    }

    const startTime = Date.now();
    
    const prompt = `Extract structured travel inquiry data from this email:

Email:
From: ${email.from.email}
Subject: ${email.subject}
Body: ${email.bodyText}

CRITICAL INSTRUCTIONS:
1. MANDATORY FIELDS - These MUST be extracted if present in the email:
   - destination: The city/country they want to visit (e.g., "Paris", "France", "Paris, France")
   - dates.startDate: Specific departure date in YYYY-MM-DD format (e.g., "December 20" → "2025-12-20")
   - dates.endDate: Specific return date in YYYY-MM-DD format (e.g., "December 27" → "2025-12-27")
   - travelers.adults: Number of adults (extract from "family of 4", "2 adults", etc.)
   - travelers.children: Number of children (extract from "family of 4 with 2 kids", "2 children", etc.)
   - budget.amount: Total budget amount as a number (e.g., "$8,000" → 8000, "8000 USD" → 8000)

2. DATE PARSING RULES:
   - Convert relative dates: "December 20-27, 2025" → startDate: "2025-12-20", endDate: "2025-12-27"
   - If only month is given: dates.flexible = true
   - Calculate duration from dates if not explicitly mentioned
   - Use year 2025 if not specified and month is upcoming

3. TRAVELER COUNT RULES:
   - "family of 4" typically means 2 adults + 2 children
   - "couple" = 2 adults, 0 children
   - "we are 2" or "2 people" = 2 adults, 0 children
   - Extract exact numbers when specified: "2 adults and 2 children"

4. BUDGET RULES:
   - Extract total amount: "$8,000 total" → amount: 8000, perPerson: false
   - Extract per person: "$2,000 per person" → amount: 2000, perPerson: true
   - Detect currency from symbols: $ = USD, € = EUR, £ = GBP, ₹ = INR

5. SIGNATURE EXTRACTION:
   Pay special attention to the email signature (after "Thanks", "Best regards", "Sincerely") to extract:
   - Full name (e.g., "John Doe")
   - Email address
   - Phone number(s) in ANY format: +1-555-1234, (555) 123-4567, 555.123.4567
   - Company name
   - Address

Extract ALL available information and respond with ONLY valid JSON:
{
  "destination": "string (REQUIRED - primary destination city/country)",
  "additionalDestinations": ["array of other destinations if multi-city"],
  "dates": {
    "flexible": boolean,
    "startDate": "YYYY-MM-DD (REQUIRED - e.g., '2025-12-20')",
    "endDate": "YYYY-MM-DD (REQUIRED - e.g., '2025-12-27')",
    "duration": number (calculated from start to end date)
  },
  "travelers": {
    "adults": number (REQUIRED - minimum 1),
    "children": number (REQUIRED - default 0 if not mentioned),
    "childAges": [array of numbers],
    "infants": number
  },
  "budget": {
    "amount": number (REQUIRED - total budget as number, e.g., 8000),
    "currency": "USD|EUR|GBP|INR",
    "flexible": boolean,
    "perPerson": boolean (true if per person, false if total)
  },
  "budget": {
    "amount": number (REQUIRED - total budget as number, e.g., 8000),
    "currency": "USD|EUR|GBP|INR",
    "flexible": boolean,
    "perPerson": boolean (true if per person, false if total)
  },
  "packageType": "honeymoon|family|adventure|luxury|budget|group|solo|business|custom",
  "accommodation": {
    "hotelType": "budget|standard|premium|luxury",
    "starRating": "3|4|5 star or null",
    "roomCategory": "standard|deluxe|suite|villa or null",
    "numberOfRooms": number or null,
    "roomType": "single|double|twin|triple|family or null",
    "preferences": ["array of preferences like 'near Eiffel Tower', 'sea view', 'city center', etc"]
  },
  "mealPlan": "room_only|breakfast|half_board|full_board|all_inclusive or null",
  "activities": ["array of requested activities like 'sightseeing tours', 'museum visits', etc"],
  "specialRequirements": ["array of special needs"],
  "customerInfo": {
    "name": "string (REQUIRED - extract from signature like 'John Doe')",
    "email": "string (REQUIRED - from 'From' field or signature like 'john@example.com')",
    "alternateEmail": "string or null",
    "phone": "string or null (extract ANY format: '+1-555-1234', '(555) 123-4567', '555.123.4567')",
    "mobile": "string or null",
    "workPhone": "string or null",
    "company": "string or null",
    "jobTitle": "string or null",
    "address": {
      "street": "string or null",
      "city": "string or null",
      "state": "string or null",
      "country": "string or null",
      "zipCode": "string or null"
    },
    "website": "string or null",
    "socialMedia": {
      "linkedin": "string or null",
      "twitter": "string or null",
      "facebook": "string or null"
    },
    "isReturning": boolean
  },
  "urgency": "low|normal|high|urgent",
  "confidence": 0-100,
  "missingInfo": ["array of CRITICAL missing MANDATORY fields ONLY if truly missing. Do NOT include fields that were successfully extracted. Only include: 'destination', 'startDate', 'endDate', 'adults count', 'budget amount' if they are genuinely missing from the email."]
}`;

    try {
      const model = clientInfo.settings?.models?.extraction || 'gpt-4-turbo-preview';
      const response = await clientInfo.client.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: 'You are an expert at extracting structured travel inquiry data. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content);
      const usage = response.usage;
      const cost = this.calculateCost(model, usage);

      await AIProcessingLog.create({
        emailLogId: email._id,
        processingType: 'extraction',
        status: 'completed',
        model: model,
        prompt,
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
        response: response.choices[0].message,
        result,
        confidence: result.confidence,
        startedAt: new Date(startTime),
        completedAt: new Date(),
        estimatedCost: cost,
        tenantId
      });

      return result;
    } catch (error) {
      console.error('OpenAI extraction error:', error);
      
      await AIProcessingLog.create({
        emailLogId: email._id,
        processingType: 'extraction',
        status: 'failed',
        model: model,
        prompt,
        error: error.message,
        tenantId
      });
      
      throw error;
    }
  }

  /**
   * Extract supplier package information
   */
  /**
   * Extract structured supplier package data
   */
  async extractSupplierPackage(email, tenantId) {
    const clientInfo = await this.getClientForTenant(tenantId);
    
    if (!clientInfo) {
      return {
        packages: [],
        confidence: 0,
        supplierInfo: { name: null, contact: email.from.email },
        cost: 0,
        tokens: { prompt: 0, completion: 0, total: 0 }
      };
    }

    const startTime = Date.now();
    
    const prompt = `Extract travel package details from this supplier email:

Email:
From: ${email.from.email}
Subject: ${email.subject}
Body: ${email.bodyText}

Extract ALL package information and respond with ONLY valid JSON:
{
  "packages": [{
    "packageName": "string",
    "destination": "string",
    "destinationCode": "3-letter code or null",
    "country": "string",
    "validFrom": "YYYY-MM-DD or null",
    "validUntil": "YYYY-MM-DD or null",
    "pricePerPerson": number,
    "currency": "USD|EUR|GBP etc",
    "childPrice": number or null,
    "duration": { "nights": number, "days": number },
    "packageType": "honeymoon|family|adventure|luxury|budget|group",
    "inclusions": ["flights", "hotels", "meals", "activities", "transfers"],
    "hotels": [{
      "name": "string",
      "rating": number,
      "roomType": "string",
      "nights": number
    }],
    "activities": ["array of activities"],
    "highlights": ["array of highlights"],
    "minPax": number,
    "maxPax": number,
    "availableSlots": number or null
  }],
  "confidence": 0-100,
  "supplierInfo": {
    "name": "string",
    "contact": "string or null"
  }
}`;

    try {
      const model = clientInfo.settings?.models?.extraction || 'gpt-4-turbo-preview';
      const response = await clientInfo.client.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: 'You are an expert at extracting travel package information from supplier emails. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content);
      const usage = response.usage;
      const cost = this.calculateCost(model, usage);

      await AIProcessingLog.create({
        emailLogId: email._id,
        processingType: 'extraction',
        status: 'completed',
        model: model,
        prompt,
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
        response: response.choices[0].message,
        result,
        confidence: result.confidence,
        startedAt: new Date(startTime),
        completedAt: new Date(),
        estimatedCost: cost,
        tenantId
      });

      return result;
    } catch (error) {
      console.error('OpenAI package extraction error:', error);
      
      await AIProcessingLog.create({
        emailLogId: email._id,
        processingType: 'extraction',
        status: 'failed',
        model: model,
        prompt,
        error: error.message,
        tenantId
      });
      
      throw error;
    }
  }

  /**
   * Extract contact information from signature images using GPT-4 Vision
   * @param {Object} email - Email object with attachments
   * @param {String} tenantId - Tenant ID
   * @returns {Object} Extracted contact information
   */
  async extractContactFromSignatureImages(email, tenantId) {
    const clientInfo = await this.getClientForTenant(tenantId);
    
    if (!clientInfo) {
      return {
        success: false,
        extractedContacts: [],
        error: 'OpenAI not configured',
        cost: 0,
        tokens: { prompt: 0, completion: 0, total: 0 }
      };
    }

    // Filter attachments that are images
    const imageAttachments = (email.attachments || []).filter(att => {
      const contentType = att.contentType?.toLowerCase() || '';
      return contentType.includes('image/') || 
             contentType.includes('png') || 
             contentType.includes('jpg') || 
             contentType.includes('jpeg') || 
             contentType.includes('gif');
    });

    if (imageAttachments.length === 0) {
      return {
        success: true,
        extractedContacts: [],
        message: 'No image attachments found',
        cost: 0,
        tokens: { prompt: 0, completion: 0, total: 0 }
      };
    }

    const startTime = Date.now();
    const extractedContacts = [];
    let totalCost = 0;
    let totalTokens = { prompt: 0, completion: 0, total: 0 };

    try {
      // Use GPT-4 Vision model
      const model = 'gpt-4-vision-preview';

      for (const attachment of imageAttachments.slice(0, 3)) { // Process max 3 images to control costs
        try {
          // If attachment has a URL (from S3/storage), use it directly
          // Otherwise, we'd need to convert the buffer to base64
          if (!attachment.url) {
            console.log(`Skipping attachment ${attachment.filename} - no URL available`);
            continue;
          }

          const visionPrompt = `You are an expert at extracting contact information from business cards, email signatures, and other contact images.

Analyze this image and extract ALL visible contact information.

Respond with ONLY valid JSON in this exact format:
{
  "name": "string (full name) or null",
  "firstName": "string or null",
  "lastName": "string or null",
  "jobTitle": "string (position/title) or null",
  "company": "string (company/organization name) or null",
  "email": "string (primary email) or null",
  "phone": "string (primary phone with any format) or null",
  "mobile": "string (mobile phone) or null",
  "workPhone": "string (office phone) or null",
  "fax": "string (fax number) or null",
  "website": "string (company website URL) or null",
  "address": {
    "street": "string or null",
    "city": "string or null",
    "state": "string or null",
    "country": "string or null",
    "zipCode": "string or null",
    "full": "string (complete address) or null"
  },
  "socialMedia": {
    "linkedin": "string (LinkedIn profile URL) or null",
    "twitter": "string (Twitter handle or URL) or null",
    "facebook": "string (Facebook URL) or null",
    "instagram": "string (Instagram handle or URL) or null"
  },
  "confidence": 0-100,
  "imageType": "business_card|email_signature|logo|other",
  "notes": "string (any additional relevant information)"
}

If no contact information is visible in the image, return all fields as null with confidence 0.`;

          const response = await clientInfo.client.chat.completions.create({
            model: model,
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: visionPrompt
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: attachment.url,
                      detail: 'high' // Use high detail for better OCR
                    }
                  }
                ]
              }
            ],
            temperature: 0.2,
            max_tokens: 1000
          });

          const result = JSON.parse(response.choices[0].message.content);
          const usage = response.usage;
          const cost = this.calculateCost(model, usage);

          totalCost += cost;
          totalTokens.prompt += usage.prompt_tokens;
          totalTokens.completion += usage.completion_tokens;
          totalTokens.total += usage.total_tokens;

          // Add source info
          result.source = {
            filename: attachment.filename,
            contentType: attachment.contentType,
            attachmentId: attachment._id
          };

          extractedContacts.push(result);

          // Log the extraction
          await AIProcessingLog.create({
            emailLogId: email._id,
            processingType: 'vision_extraction',
            status: 'completed',
            model: model,
            prompt: visionPrompt,
            promptTokens: usage.prompt_tokens,
            completionTokens: usage.completion_tokens,
            totalTokens: usage.total_tokens,
            response: response.choices[0].message,
            result,
            confidence: result.confidence,
            startedAt: new Date(startTime),
            completedAt: new Date(),
            estimatedCost: cost,
            tenantId
          });

        } catch (imageError) {
          console.error(`Error processing image ${attachment.filename}:`, imageError.message);
          // Continue with next image
        }
      }

      return {
        success: true,
        extractedContacts,
        processedImages: extractedContacts.length,
        totalImages: imageAttachments.length,
        cost: totalCost,
        tokens: totalTokens
      };

    } catch (error) {
      console.error('OpenAI vision extraction error:', error);
      
      await AIProcessingLog.create({
        emailLogId: email._id,
        processingType: 'vision_extraction',
        status: 'failed',
        model: 'gpt-4-vision-preview',
        error: error.message,
        tenantId
      });
      
      return {
        success: false,
        extractedContacts: [],
        error: error.message,
        cost: totalCost,
        tokens: totalTokens
      };
    }
  }

  /**
   * Generate response email with itinerary matching workflow support
   */
  async generateResponse(email, context, templateType, tenantId) {
    const clientInfo = await this.getClientForTenant(tenantId);
    
    if (!clientInfo) {
      return {
        subject: 'Re: ' + email.subject,
        body: 'Thank you for your email. We will review your request and get back to you shortly.',
        plainText: 'Thank you for your email. We will review your request and get back to you shortly.',
        cost: 0,
        tokens: { prompt: 0, completion: 0, total: 0 }
      };
    }

    const startTime = Date.now();
    
    // Extract customer info for personalization
    const customerName = context.extractedData?.customerInfo?.name || 
                        email.from?.name || 
                        'Valued Customer';
    
    let prompt = '';
    
    // Handle itinerary matching workflow responses
    if (templateType === 'ASK_CUSTOMER') {
      const missingFieldsList = context.missingFields
        .map(field => `- ${field.label}`)
        .join('\n');
      
      prompt = `Generate a friendly, professional email asking for missing information.

Customer Name: ${customerName}
Customer Email: ${email.bodyText}

Missing Required Information:
${missingFieldsList}

Customer Info Available:
${JSON.stringify(context.extractedData?.customerInfo || {}, null, 2)}

Instructions:
- Greet customer by name warmly
- Thank them for their interest
- Acknowledge what information they've already provided
- Politely ask for the missing information with specific questions
- Explain why this information helps us serve them better
- Keep tone helpful and enthusiastic
- Make it easy to respond (clear questions)
- 150-200 words

Respond with ONLY valid JSON:
{
  "subject": "Re: ${email.subject} - A few quick questions",
  "body": "HTML email body with personalized greeting",
  "plainText": "Plain text version"
}`;
    } else if (templateType === 'SEND_ITINERARIES') {
      const itinerariesInfo = context.itineraries.map((match, index) => {
        const itin = match.itinerary;
        return `
Itinerary ${index + 1}: ${itin.title} (${match.score}% match)
- Destination: ${itin.destination?.city || itin.destination?.country}
- Duration: ${itin.duration?.days} days / ${itin.duration?.nights} nights
- Estimated Cost: ${itin.estimatedCost?.currency} ${itin.estimatedCost?.totalCost}
- Highlights: ${itin.highlights?.slice(0, 3).join(', ')}
- Match Score: ${match.score}%`;
      }).join('\n\n');

      prompt = `Generate an exciting, personalized email presenting matching itineraries.

Customer Name: ${customerName}
Customer Request: ${email.bodyText}

Customer Requirements:
${JSON.stringify(context.extractedData, null, 2)}

Matching Itineraries Found:
${itinerariesInfo}

Instructions:
- Greet customer by name warmly
- Express excitement about their travel plans
- Present the top matching itineraries (max 3)
- For each itinerary: highlight key features, what makes it special
- Mention how it matches their requirements
- Include pricing and what's included
- Create urgency (limited availability, seasonal pricing)
- Include clear call-to-action (book now, request details, schedule call)
- Professional yet warm and enthusiastic tone
- 300-400 words

Respond with ONLY valid JSON:
{
  "subject": "Perfect Itineraries for Your ${context.extractedData?.destination || 'Dream'} Trip! ✈️",
  "body": "HTML email body with exciting presentation",
  "plainText": "Plain text version"
}`;
    } else if (templateType === 'SEND_ITINERARIES_WITH_NOTE') {
      const itinerariesInfo = context.itineraries.map((match, index) => {
        const itin = match.itinerary;
        return `
Itinerary ${index + 1}: ${itin.title} (${match.score}% match)
- Destination: ${itin.destination?.city || itin.destination?.country}
- Duration: ${itin.duration?.days} days / ${itin.duration?.nights} nights
- Estimated Cost: ${itin.estimatedCost?.currency} ${itin.estimatedCost?.totalCost}`;
      }).join('\n\n');

      prompt = `Generate a professional email presenting itineraries that partially match requirements.

Customer Name: ${customerName}
Customer Request: ${email.bodyText}

Customer Requirements:
${JSON.stringify(context.extractedData, null, 2)}

Available Itineraries (partial match):
${itinerariesInfo}

Note: ${context.note}

Instructions:
- Greet customer warmly
- Present the available itineraries honestly
- Mention these are close matches we can customize
- Emphasize flexibility and personalization
- Offer to adjust itineraries to better match their needs
- Ask about their priorities (what's most important to them)
- Maintain positive, solution-oriented tone
- 250-300 words

Respond with ONLY valid JSON:
{
  "subject": "Great Options for Your ${context.extractedData?.destination || 'Trip'} (+ Customization Available)",
  "body": "HTML email body",
  "plainText": "Plain text version"
}`;
    } else if (templateType === 'FORWARD_TO_SUPPLIER') {
      prompt = `Generate a professional email acknowledging custom itinerary request.

Customer Name: ${customerName}
Customer Request: ${email.bodyText}

Customer Requirements:
${JSON.stringify(context.extractedData, null, 2)}

Note: ${context.note || 'No matching pre-made itineraries found'}

Instructions:
- Greet customer warmly by name
- Thank them for their detailed requirements
- Acknowledge this is a unique/custom request
- Explain we're creating a personalized itinerary for them
- Promise timeline (e.g., "within 24-48 hours")
- Mention we're working with our best suppliers/partners
- Ask if they have any additional preferences
- Reassure them about quality and attention to detail
- Professional, confident, reassuring tone
- 200-250 words

Respond with ONLY valid JSON:
{
  "subject": "Creating Your Custom ${context.extractedData?.destination || 'Travel'} Experience ✨",
  "body": "HTML email body",
  "plainText": "Plain text version"
}`;
    } else if (templateType === 'PACKAGE_FOUND') {
      prompt = `Generate a professional, friendly response email for this customer inquiry.
      
Customer Email:
${email.bodyText}

Package Found:
${JSON.stringify(context.matchedPackages, null, 2)}

Instructions:
- Thank the customer for their inquiry
- Present the package(s) that match their requirements
- Highlight key features
- Include pricing and what's included
- Invite them to book or ask questions
- Professional but warm tone
- Keep it concise (200-300 words)

Respond with ONLY valid JSON:
{
  "subject": "Re: ${email.subject}",
  "body": "HTML email body",
  "plainText": "Plain text version"
}`;
    } else if (templateType === 'PACKAGE_NOT_FOUND') {
      prompt = `Generate a professional response for a travel inquiry where we don't have matching packages yet.

Customer Email:
${email.bodyText}

Customer Requirements:
${JSON.stringify(context.extractedData, null, 2)}

Instructions:
- Thank them for inquiry
- Acknowledge their requirements
- Explain we're checking with suppliers
- Promise to get back within 24-48 hours
- Ask if they want to discuss alternatives
- Professional, reassuring tone

Respond with ONLY valid JSON:
{
  "subject": "Re: ${email.subject}",
  "body": "HTML email body",
  "plainText": "Plain text version"
}`;
    }

    try {
      const model = clientInfo.settings?.models?.response || 'gpt-4-turbo-preview';
      const response = await clientInfo.client.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: 'You are a professional travel consultant writing customer emails. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content);
      const usage = response.usage;
      const cost = this.calculateCost(model, usage);

      await AIProcessingLog.create({
        emailLogId: email._id,
        processingType: 'response_generation',
        status: 'completed',
        model: model,
        prompt,
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
        response: response.choices[0].message,
        result,
        startedAt: new Date(startTime),
        completedAt: new Date(),
        estimatedCost: cost,
        tenantId
      });

      return result;
    } catch (error) {
      console.error('OpenAI response generation error:', error);
      throw error;
    }
  }

  /**
   * Calculate cost based on token usage
   */
  calculateCost(model, usage) {
    const pricing = this.pricing[model];
    if (!pricing) return 0;
    
    const inputCost = (usage.prompt_tokens / 1000) * pricing.input;
    const outputCost = (usage.completion_tokens / 1000) * pricing.output;
    
    return inputCost + outputCost;
  }

  /**
   * Get total cost for tenant
   */
  async getTotalCost(tenantId, startDate, endDate) {
    const logs = await AIProcessingLog.find({
      tenantId,
      status: 'completed',
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    });

    return logs.reduce((total, log) => total + (log.estimatedCost || 0), 0);
  }
}

module.exports = new OpenAIService();
