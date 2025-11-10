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

Extract ALL available information and respond with ONLY valid JSON:
{
  "destination": "string (primary destination city/country)",
  "additionalDestinations": ["array of other destinations if multi-city"],
  "dates": {
    "flexible": boolean,
    "startDate": "YYYY-MM-DD or null (journey start date)",
    "endDate": "YYYY-MM-DD or null (journey end date)",
    "duration": "number of days/nights or null"
  },
  "travelers": {
    "adults": number,
    "children": number,
    "childAges": [numbers array - ages of each child],
    "infants": number
  },
  "budget": {
    "amount": number or null,
    "currency": "INR|USD|EUR|GBP etc",
    "flexible": boolean,
    "perPerson": boolean
  },
  "packageType": "honeymoon|family|adventure|luxury|budget|group|solo|business|custom",
  "accommodation": {
    "hotelType": "budget|standard|premium|luxury",
    "starRating": "3|4|5 star or null",
    "roomCategory": "standard|deluxe|suite|villa or null",
    "numberOfRooms": number or null,
    "roomType": "single|double|twin|triple|family or null",
    "preferences": ["array of preferences like sea-view, poolside, etc"]
  },
  "mealPlan": "room_only|breakfast|half_board|full_board|all_inclusive or null",
  "activities": ["array of requested activities/experiences"],
  "specialRequirements": ["array of special needs like wheelchair, dietary"],
  "customerInfo": {
    "name": "string or null",
    "email": "email from 'from' field",
    "phone": "string or null",
    "company": "string or null",
    "isReturning": boolean
  },
  "urgency": "low|normal|high|urgent",
  "confidence": 0-100,
  "missingInfo": ["array of CRITICAL missing fields for quote: startDate, endDate, destination, adults count, mealPlan, hotelType, roomCategory"]
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
   * Generate response email
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
    
    let prompt = '';
    
    if (templateType === 'PACKAGE_FOUND') {
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
