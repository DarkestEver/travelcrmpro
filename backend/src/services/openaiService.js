const OpenAI = require('openai');
const AIProcessingLog = require('../models/AIProcessingLog');

class OpenAIService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
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
   * Categorize email using AI
   */
  async categorizeEmail(email, tenantId) {
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
      const response = await this.client.chat.completions.create({
        model: this.models.categorization,
        messages: [
          { role: 'system', content: 'You are an expert email categorization system for a travel CRM. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content);
      const usage = response.usage;
      const cost = this.calculateCost('gpt-4-turbo-preview', usage);

      // Log the AI processing
      await AIProcessingLog.create({
        emailLogId: email._id,
        processingType: 'categorization',
        status: 'completed',
        model: this.models.categorization,
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
      
      await AIProcessingLog.create({
        emailLogId: email._id,
        processingType: 'categorization',
        status: 'failed',
        model: this.models.categorization,
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
    const startTime = Date.now();
    
    const prompt = `Extract structured travel inquiry data from this email:

Email:
From: ${email.from.email}
Subject: ${email.subject}
Body: ${email.bodyText}

Extract ALL available information and respond with ONLY valid JSON:
{
  "destination": "string (primary destination)",
  "additionalDestinations": ["array of other destinations"],
  "dates": {
    "flexible": boolean,
    "preferredStart": "YYYY-MM-DD or null",
    "preferredEnd": "YYYY-MM-DD or null",
    "duration": "number of days/nights or null"
  },
  "travelers": {
    "adults": number,
    "children": number,
    "childAges": [numbers],
    "infants": number
  },
  "budget": {
    "amount": number or null,
    "currency": "USD|EUR|GBP etc",
    "flexible": boolean,
    "perPerson": boolean
  },
  "packageType": "honeymoon|family|adventure|luxury|budget|group|solo|business|custom",
  "accommodation": {
    "rating": "3|4|5 star or null",
    "type": "hotel|resort|villa|apartment|etc",
    "preferences": ["array of preferences"]
  },
  "activities": ["array of requested activities"],
  "meals": "none|breakfast|halfboard|fullboard|allinclusive",
  "specialRequirements": ["array of special needs"],
  "customerInfo": {
    "name": "string or null",
    "email": "email",
    "phone": "string or null",
    "isReturning": boolean
  },
  "urgency": "low|normal|high|urgent",
  "confidence": 0-100,
  "missingInfo": ["array of missing required fields"]
}`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.models.extraction,
        messages: [
          { role: 'system', content: 'You are an expert at extracting structured travel inquiry data. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content);
      const usage = response.usage;
      const cost = this.calculateCost('gpt-4-turbo-preview', usage);

      await AIProcessingLog.create({
        emailLogId: email._id,
        processingType: 'extraction',
        status: 'completed',
        model: this.models.extraction,
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
        model: this.models.extraction,
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
  async extractSupplierPackage(email, tenantId) {
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
      const response = await this.client.chat.completions.create({
        model: this.models.extraction,
        messages: [
          { role: 'system', content: 'You are an expert at extracting travel package information from supplier emails. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content);
      const usage = response.usage;
      const cost = this.calculateCost('gpt-4-turbo-preview', usage);

      await AIProcessingLog.create({
        emailLogId: email._id,
        processingType: 'extraction',
        status: 'completed',
        model: this.models.extraction,
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
        model: this.models.extraction,
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
      const response = await this.client.chat.completions.create({
        model: this.models.response,
        messages: [
          { role: 'system', content: 'You are a professional travel consultant writing customer emails. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content);
      const usage = response.usage;
      const cost = this.calculateCost('gpt-4-turbo-preview', usage);

      await AIProcessingLog.create({
        emailLogId: email._id,
        processingType: 'response_generation',
        status: 'completed',
        model: this.models.response,
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
