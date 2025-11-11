/**
 * Email Template Service
 * Generates emails from static templates instead of AI (cost optimization)
 */

const fs = require('fs').promises;
const path = require('path');
const Tenant = require('../models/Tenant');

class EmailTemplateService {
  constructor() {
    this.templatesPath = path.join(__dirname, '../../templates');
    this.templateCache = new Map();
    this.tenantConfigCache = new Map();
  }

  /**
   * Load tenant configuration for branding/signature
   */
  async loadTenantConfig(tenantId) {
    // Check cache first (cache for 5 minutes)
    const cacheKey = tenantId.toString();
    const cached = this.tenantConfigCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < 5 * 60 * 1000) {
      return cached.config;
    }

    // Load from database
    try {
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return this.getDefaultConfig();
      }

      const config = {
        companyName: tenant.businessName || tenant.name || 'Travel Manager Pro',
        agentName: tenant.settings?.email?.senderName || 'Travel Team',
        email: tenant.settings?.email?.senderEmail || tenant.email || 'app@travelmanagerpro.com',
        phone: tenant.settings?.contact?.phone || '+1 (800) 123-4567',
        website: tenant.settings?.contact?.website || 'www.travelmanagerpro.com',
        signature: tenant.settings?.email?.emailSignature || '',
        logoUrl: tenant.settings?.branding?.logoUrl || '',
        primaryColor: tenant.settings?.branding?.primaryColor || '#2563eb'
      };

      // Cache it
      this.tenantConfigCache.set(cacheKey, {
        config,
        timestamp: Date.now()
      });

      return config;
    } catch (error) {
      console.error('Error loading tenant config:', error.message);
      return this.getDefaultConfig();
    }
  }

  /**
   * Get default configuration (fallback)
   */
  getDefaultConfig() {
    return {
      companyName: 'Travel Manager Pro',
      agentName: 'Travel Team',
      email: 'app@travelmanagerpro.com',
      phone: '+1 (800) 123-4567',
      website: 'www.travelmanagerpro.com',
      signature: '',
      logoUrl: '',
      primaryColor: '#2563eb'
    };
  }

  /**
   * Load template from file (with caching)
   */
  async loadTemplate(templateName) {
    // Check cache first
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName);
    }

    // Load from file
    const templatePath = path.join(this.templatesPath, `${templateName}.html`);
    const template = await fs.readFile(templatePath, 'utf-8');
    
    // Cache it
    this.templateCache.set(templateName, template);
    
    return template;
  }

  /**
   * Generate "Missing Information" email using static template
   * COST: $0 (no AI used!)
   * 
   * @param {Object} params - Parameters object
   * @param {Object} params.email - EmailLog object
   * @param {Object} params.extractedData - Extracted customer data
   * @param {Array} params.missingFields - Array of missing field objects
   * @param {String} params.tenantId - Tenant identifier
   * @returns {String} Complete HTML email
   */
  async generateMissingInfoEmail({ email, extractedData, missingFields, tenantId }) {
    try {
      // Load main template and components
      const mainTemplate = await this.loadTemplate('email-missing-info-template');
      const fieldRowTemplate = await this.loadTemplate('email-missing-field-row');
      const destinationPreviewTemplate = await this.loadTemplate('email-destination-preview');

      // Extract data
      const customerName = extractedData?.customerInfo?.name || 
                          email.from?.name || 
                          'Valued Customer';
      
      const destination = extractedData?.destination || 'your dream destination';
      const missingFieldsArray = missingFields || [];

      // Generate missing fields rows
      let fieldRowsHtml = '';
      missingFieldsArray.forEach((field, index) => {
        fieldRowsHtml += fieldRowTemplate
          .replace('{{FIELD_NUMBER}}', index + 1)
          .replace('{{FIELD_LABEL}}', field.label || field.field)
          .replace('{{FIELD_QUESTION}}', field.question || `Please provide ${field.label}`);
      });

      // Generate destination preview (if destination known)
      let destinationPreviewHtml = '';
      if (destination && destination !== 'your dream destination') {
        const descriptions = {
          'Tokyo': 'Experience the perfect blend of ancient traditions and cutting-edge technology, from serene temples to vibrant streets of Shibuya.',
          'Paris': 'The City of Light awaits with iconic landmarks, world-class museums, charming cafés, and unforgettable romantic ambiance.',
          'Dubai': 'Luxury meets adventure in this futuristic city featuring stunning skyscrapers, pristine beaches, and world-renowned shopping.',
          'Bali': 'Discover tropical paradise with stunning beaches, lush rice terraces, ancient temples, and warm Balinese hospitality.',
          'London': 'Explore rich history, royal palaces, world-class theaters, and diverse neighborhoods in this cosmopolitan capital.',
          'New York': 'The city that never sleeps offers iconic landmarks, Broadway shows, diverse cuisine, and endless entertainment.',
          'Rome': 'Walk through history in the Eternal City, home to ancient ruins, Renaissance art, and authentic Italian cuisine.',
          'Barcelona': 'Enjoy stunning architecture by Gaudí, Mediterranean beaches, vibrant culture, and delicious tapas.',
          'Singapore': 'A modern marvel combining cultural diversity, futuristic gardens, world-class dining, and tropical island charm.',
          'Sydney': 'Experience the iconic Opera House, pristine beaches, vibrant harbor life, and laid-back Australian lifestyle.'
        };

        const description = descriptions[destination] || 
          `An amazing destination with unforgettable experiences, rich culture, and beautiful landscapes waiting to be explored.`;

        destinationPreviewHtml = destinationPreviewTemplate
          .replace(/{{DESTINATION}}/g, destination)
          .replace('{{DESTINATION_DESCRIPTION}}', description);
      }

      // Load tenant configuration from database
      const tenantConfig = await this.loadTenantConfig(tenantId);
      const companyName = tenantConfig.companyName;
      const companyEmail = tenantConfig.email;
      const companyPhone = tenantConfig.phone;
      const companyWebsite = tenantConfig.website;
      const agentName = tenantConfig.agentName;

      // Replace all placeholders
      let finalHtml = mainTemplate
        .replace(/{{COMPANY_NAME}}/g, companyName)
        .replace(/{{CUSTOMER_NAME}}/g, customerName)
        .replace(/{{DESTINATION}}/g, destination)
        .replace('{{MISSING_FIELDS_ROWS}}', fieldRowsHtml)
        .replace('{{DESTINATION_PREVIEW}}', destinationPreviewHtml)
        .replace('{{AGENT_NAME}}', agentName)
        .replace('{{COMPANY_EMAIL}}', companyEmail)
        .replace('{{COMPANY_PHONE}}', companyPhone)
        .replace('{{COMPANY_WEBSITE}}', companyWebsite);

      // Generate plain text version
      const plainText = this.generatePlainTextVersion(
        customerName,
        destination,
        missingFields,
        companyName,
        agentName
      );

      // Generate subject
      const subject = `Re: ${email.subject} - A few quick questions`;

      return {
        subject,
        body: finalHtml,
        plainText,
        cost: 0, // No AI cost!
        method: 'template',
        templateUsed: 'missing-info'
      };

    } catch (error) {
      console.error('Error generating template email:', error);
      
      // Fallback to simple text if template fails
      return this.generateSimpleFallback({ email, extractedData, missingFields });
    }
  }

  /**
   * Generate plain text version
   */
  generatePlainTextVersion(customerName, destination, missingFields, companyName, agentName) {
    let plainText = `Dear ${customerName},\n\n`;
    plainText += `Thank you for your interest in traveling to ${destination}! ✈️\n\n`;
    plainText += `We're excited to help you plan the perfect trip. To provide you with the best travel packages and accurate pricing, we need a few more details:\n\n`;
    plainText += `INFORMATION NEEDED:\n`;
    plainText += `${'='.repeat(50)}\n\n`;
    
    missingFields.forEach((field, index) => {
      plainText += `${index + 1}. ${field.label || field.field}\n`;
      plainText += `   ${field.question || `Please provide ${field.label}`}\n\n`;
    });
    
    plainText += `${'='.repeat(50)}\n\n`;
    plainText += `Simply reply to this email with the above information, and we'll get back to you within 24 hours with personalized recommendations! 🎉\n\n`;
    plainText += `WHY CHOOSE US?\n`;
    plainText += `✓ Best Price Guarantee\n`;
    plainText += `✓ 24/7 Customer Support\n`;
    plainText += `✓ Flexible Cancellation\n`;
    plainText += `✓ Trusted by 10,000+ Travelers\n\n`;
    plainText += `Best regards,\n`;
    plainText += `${agentName}\n`;
    plainText += `${companyName}\n`;
    
    return plainText;
  }

  /**
   * Simple fallback if template loading fails
   * @param {Object} params - Parameters object
   */
  generateSimpleFallback({ email, extractedData, missingFields }) {
    const customerName = extractedData?.customerInfo?.name || 
                        email.from?.name || 
                        'Valued Customer';
    
    const destination = extractedData?.destination || 'your dream destination';
    const missingFieldsArray = missingFields || [];

    let body = `<p>Dear ${customerName},</p>`;
    body += `<p>Thank you for your interest in traveling to <strong>${destination}</strong>!</p>`;
    body += `<p>To provide you with the best travel packages, we need a few more details:</p>`;
    body += `<ul>`;
    
    missingFieldsArray.forEach(field => {
      body += `<li><strong>${field.label}:</strong> ${field.question}</li>`;
    });
    
    body += `</ul>`;
    body += `<p>Please reply with the above information, and we'll get back to you within 24 hours!</p>`;
    body += `<p>Best regards,<br>Travel Team</p>`;

    const plainText = this.generatePlainTextVersion(
      customerName,
      destination,
      missingFieldsArray,
      'Travel Manager Pro',
      'Travel Team'
    );

    return {
      subject: `Re: ${email.subject} - Information needed`,
      body,
      plainText,
      cost: 0,
      method: 'fallback'
    };
  }

  /**
   * Generate "Send Itineraries" email for high-confidence matches (≥70%)
   * COST: $0 (no AI used!)
   * 
   * @param {Object} params - Parameters object
   * @param {Object} params.email - EmailLog object
   * @param {Object} params.extractedData - Extracted customer data
   * @param {Array} params.itineraries - Matched itineraries with scores
   * @param {String} params.tenantId - Tenant identifier
   * @returns {Object} Email response object
   */
  async generateItinerariesEmail({ email, extractedData, itineraries, tenantId }) {
    try {
      // Load templates
      const mainTemplate = await this.loadTemplate('email-send-itineraries-template');
      const cardTemplate = await this.loadTemplate('email-itinerary-card');
      const quotedTemplate = await this.loadTemplate('email-quoted-original');

      // Extract data
      const customerName = extractedData?.customerInfo?.name || 
                          email.from?.name || 
                          'Valued Customer';
      
      const destination = extractedData?.destination || 'your destination';
      const travelDates = extractedData?.travelDates?.flexible ? 
        `${extractedData.travelDates.startDate || 'Flexible'} (flexible)` :
        `${extractedData.travelDates.startDate || 'TBD'} to ${extractedData.travelDates.endDate || 'TBD'}`;
      
      const travelers = extractedData?.groupSize?.numberOfPeople || 
                       extractedData?.groupSize?.adults || 
                       'TBD';
      
      const budget = extractedData?.budget?.amount ? 
        `$${extractedData.budget.amount} ${extractedData.budget.currency || 'USD'}` :
        'To be discussed';

      // Build itinerary cards
      const cards = itineraries.slice(0, 3).map(item => {
        const itinerary = item.itinerary;
        const score = Math.round(item.score);
        
        // Build highlights list
        const highlights = itinerary.highlights || [];
        const highlightsList = highlights.map(h => `<li style="color: #555; padding: 4px 0;">${h}</li>`).join('');
        
        // Build activities list
        const activities = itinerary.activities || [];
        const activitiesList = activities.map(a => a.name || a).slice(0, 5).join(', ');
        
        // Format price
        const price = itinerary.estimatedCost?.totalCost || itinerary.cost || 0;
        const priceFormatted = `$${price.toLocaleString()}`;
        
        // Get accommodation
        const accommodation = itinerary.accommodationDetails?.map(acc => 
          `${acc.hotelName || acc.name || 'Standard'} (${acc.rating || 3}★)`
        ).join(', ') || 'Quality hotels included';
        
        // Get locations
        const locations = itinerary.destinations?.join(', ') || destination;
        
        // Availability
        const availability = itinerary.availability?.available ? 
          `Available ${itinerary.availability.startDate} - ${itinerary.availability.endDate}` :
          'Year-round availability';
        
        // Replace placeholders in card
        return cardTemplate
          .replace(/{{MATCH_SCORE}}/g, score)
          .replace(/{{ITINERARY_TITLE}}/g, itinerary.title || `${destination} Adventure`)
          .replace(/{{ITINERARY_DESCRIPTION}}/g, itinerary.description || itinerary.overview || 'Perfect itinerary for your trip')
          .replace(/{{DURATION}}/g, itinerary.duration?.days || extractedData?.duration?.days || '7')
          .replace(/{{PRICE}}/g, priceFormatted)
          .replace(/{{LOCATIONS}}/g, locations)
          .replace(/{{MIN_CAPACITY}}/g, itinerary.capacity?.min || 2)
          .replace(/{{MAX_CAPACITY}}/g, itinerary.capacity?.max || 10)
          .replace(/{{HIGHLIGHTS_LIST}}/g, highlightsList || '<li>Amazing experiences await!</li>')
          .replace(/{{ACTIVITIES}}/g, activitiesList || 'Various exciting activities')
          .replace(/{{ACCOMMODATION}}/g, accommodation)
          .replace(/{{AVAILABILITY}}/g, availability)
          .replace(/{{ITINERARY_ID}}/g, itinerary._id || itinerary.id || '')
          .replace(/{{COMPANY_EMAIL}}/g, '{{COMPANY_EMAIL}}') // Keep for main replacement
          .replace(/{{CUSTOMER_NAME}}/g, customerName);
      }).join('\n\n');

      // Build quoted original email
      const quotedOriginal = quotedTemplate
        .replace(/{{CUSTOMER_EMAIL}}/g, email.from?.email || email.from)
        .replace(/{{EMAIL_DATE}}/g, new Date(email.receivedAt || email.createdAt).toLocaleString())
        .replace(/{{EMAIL_SUBJECT}}/g, email.subject || 'Travel Inquiry')
        .replace(/{{EMAIL_BODY}}/g, (email.bodyPlain || email.bodyHtml || '').substring(0, 500));

      // Load tenant configuration
      const tenantConfig = await this.loadTenantConfig(tenantId);
      const companyName = tenantConfig.companyName;
      const companyEmail = tenantConfig.email;
      const companyPhone = tenantConfig.phone;
      const companyWebsite = tenantConfig.website;
      const currentYear = new Date().getFullYear();

      // Replace main template placeholders
      let emailBody = mainTemplate
        .replace(/{{CUSTOMER_NAME}}/g, customerName)
        .replace(/{{DESTINATION}}/g, destination)
        .replace(/{{TRAVEL_DATES}}/g, travelDates)
        .replace(/{{TRAVELERS}}/g, travelers)
        .replace(/{{BUDGET}}/g, budget)
        .replace(/{{MATCH_COUNT}}/g, itineraries.length)
        .replace(/{{ITINERARY_CARDS}}/g, cards)
        .replace(/{{QUOTED_ORIGINAL}}/g, quotedOriginal)
        .replace(/{{COMPANY_NAME}}/g, companyName)
        .replace(/{{COMPANY_EMAIL}}/g, companyEmail)
        .replace(/{{COMPANY_PHONE}}/g, companyPhone)
        .replace(/{{COMPANY_WEBSITE}}/g, companyWebsite)
        .replace(/{{CURRENT_YEAR}}/g, currentYear);

      return {
        subject: `Perfect itineraries for your ${destination} trip!`,
        body: emailBody,
        cost: 0,
        method: 'template',
        templateUsed: 'send-itineraries'
      };

    } catch (error) {
      console.error('Error generating itineraries template email:', error);
      throw error; // Let caller handle fallback
    }
  }

  /**
   * Generate "Send with Note" email for moderate matches (50-69%)
   * COST: $0 (no AI used!)
   * 
   * @param {Object} params - Parameters object
   * @param {Object} params.email - EmailLog object
   * @param {Object} params.extractedData - Extracted customer data
   * @param {Array} params.itineraries - Matched itineraries with scores
   * @param {String} params.note - Customization note/reason
   * @param {String} params.tenantId - Tenant identifier
   * @returns {Object} Email response object
   */
  async generateModerateMatchEmail({ email, extractedData, itineraries, note, tenantId }) {
    try {
      // Load templates
      const mainTemplate = await this.loadTemplate('email-send-with-note-template');
      const cardTemplate = await this.loadTemplate('email-itinerary-card');
      const quotedTemplate = await this.loadTemplate('email-quoted-original');

      // Extract data (same as generateItinerariesEmail)
      const customerName = extractedData?.customerInfo?.name || 
                          email.from?.name || 
                          'Valued Customer';
      
      const destination = extractedData?.destination || 'your destination';
      const travelDates = extractedData?.travelDates?.flexible ? 
        `${extractedData.travelDates.startDate || 'Flexible'} (flexible)` :
        `${extractedData.travelDates.startDate || 'TBD'} to ${extractedData.travelDates.endDate || 'TBD'}`;
      
      const travelers = extractedData?.groupSize?.numberOfPeople || 
                       extractedData?.groupSize?.adults || 
                       'TBD';
      
      const budget = extractedData?.budget?.amount ? 
        `$${extractedData.budget.amount} ${extractedData.budget.currency || 'USD'}` :
        'To be discussed';

      // Build itinerary cards (same logic as above)
      const cards = itineraries.slice(0, 3).map(item => {
        const itinerary = item.itinerary;
        const score = Math.round(item.score);
        
        const highlights = itinerary.highlights || [];
        const highlightsList = highlights.map(h => `<li style="color: #555; padding: 4px 0;">${h}</li>`).join('');
        
        const activities = itinerary.activities || [];
        const activitiesList = activities.map(a => a.name || a).slice(0, 5).join(', ');
        
        const price = itinerary.estimatedCost?.totalCost || itinerary.cost || 0;
        const priceFormatted = `$${price.toLocaleString()}`;
        
        const accommodation = itinerary.accommodationDetails?.map(acc => 
          `${acc.hotelName || acc.name || 'Standard'} (${acc.rating || 3}★)`
        ).join(', ') || 'Quality hotels included';
        
        const locations = itinerary.destinations?.join(', ') || destination;
        const availability = itinerary.availability?.available ? 
          `Available ${itinerary.availability.startDate} - ${itinerary.availability.endDate}` :
          'Year-round availability';
        
        return cardTemplate
          .replace(/{{MATCH_SCORE}}/g, score)
          .replace(/{{ITINERARY_TITLE}}/g, itinerary.title || `${destination} Adventure`)
          .replace(/{{ITINERARY_DESCRIPTION}}/g, itinerary.description || itinerary.overview || 'Perfect itinerary for your trip')
          .replace(/{{DURATION}}/g, itinerary.duration?.days || extractedData?.duration?.days || '7')
          .replace(/{{PRICE}}/g, priceFormatted)
          .replace(/{{LOCATIONS}}/g, locations)
          .replace(/{{MIN_CAPACITY}}/g, itinerary.capacity?.min || 2)
          .replace(/{{MAX_CAPACITY}}/g, itinerary.capacity?.max || 10)
          .replace(/{{HIGHLIGHTS_LIST}}/g, highlightsList || '<li>Amazing experiences await!</li>')
          .replace(/{{ACTIVITIES}}/g, activitiesList || 'Various exciting activities')
          .replace(/{{ACCOMMODATION}}/g, accommodation)
          .replace(/{{AVAILABILITY}}/g, availability)
          .replace(/{{ITINERARY_ID}}/g, itinerary._id || itinerary.id || '')
          .replace(/{{COMPANY_EMAIL}}/g, '{{COMPANY_EMAIL}}')
          .replace(/{{CUSTOMER_NAME}}/g, customerName);
      }).join('\n\n');

      // Build quoted original email
      const quotedOriginal = quotedTemplate
        .replace(/{{CUSTOMER_EMAIL}}/g, email.from?.email || email.from)
        .replace(/{{EMAIL_DATE}}/g, new Date(email.receivedAt || email.createdAt).toLocaleString())
        .replace(/{{EMAIL_SUBJECT}}/g, email.subject || 'Travel Inquiry')
        .replace(/{{EMAIL_BODY}}/g, (email.bodyPlain || email.bodyHtml || '').substring(0, 500));

      // Load tenant configuration
      const tenantConfig = await this.loadTenantConfig(tenantId);
      const companyName = tenantConfig.companyName;
      const companyEmail = tenantConfig.email;
      const companyPhone = tenantConfig.phone;
      const companyWebsite = tenantConfig.website;
      const currentYear = new Date().getFullYear();

      // Customization note
      const customizationNote = note || 
        'These itineraries match most of your requirements, but we can adjust them to better fit your preferences.';

      // Replace main template placeholders
      let emailBody = mainTemplate
        .replace(/{{CUSTOMER_NAME}}/g, customerName)
        .replace(/{{DESTINATION}}/g, destination)
        .replace(/{{TRAVEL_DATES}}/g, travelDates)
        .replace(/{{TRAVELERS}}/g, travelers)
        .replace(/{{BUDGET}}/g, budget)
        .replace(/{{MATCH_COUNT}}/g, itineraries.length)
        .replace(/{{CUSTOMIZATION_NOTE}}/g, customizationNote)
        .replace(/{{ITINERARY_CARDS}}/g, cards)
        .replace(/{{QUOTED_ORIGINAL}}/g, quotedOriginal)
        .replace(/{{COMPANY_NAME}}/g, companyName)
        .replace(/{{COMPANY_EMAIL}}/g, companyEmail)
        .replace(/{{COMPANY_PHONE}}/g, companyPhone)
        .replace(/{{COMPANY_WEBSITE}}/g, companyWebsite)
        .replace(/{{CURRENT_YEAR}}/g, currentYear);

      return {
        subject: `Great matches for your ${destination} trip - Customization available`,
        body: emailBody,
        cost: 0,
        method: 'template',
        templateUsed: 'send-with-note'
      };

    } catch (error) {
      console.error('Error generating moderate match template email:', error);
      throw error;
    }
  }

  /**
   * Generate "Custom Request" email for low matches (<50%)
   * COST: $0 (no AI used!)
   * 
   * @param {Object} params - Parameters object
   * @param {Object} params.email - EmailLog object
   * @param {Object} params.extractedData - Extracted customer data
   * @param {String} params.note - Reason why custom design is needed
   * @param {String} params.tenantId - Tenant identifier
   * @returns {Object} Email response object
   */
  async generateCustomRequestEmail({ email, extractedData, note, tenantId }) {
    try {
      // Load templates
      const mainTemplate = await this.loadTemplate('email-forward-supplier-template');
      const quotedTemplate = await this.loadTemplate('email-quoted-original');

      // Extract data
      const customerName = extractedData?.customerInfo?.name || 
                          email.from?.name || 
                          'Valued Customer';
      
      const destination = extractedData?.destination || 'your destination';
      const travelDates = extractedData?.travelDates?.flexible ? 
        `${extractedData.travelDates.startDate || 'Flexible'} (flexible)` :
        `${extractedData.travelDates.startDate || 'TBD'} to ${extractedData.travelDates.endDate || 'TBD'}`;
      
      const duration = extractedData?.duration?.days ? 
        `${extractedData.duration.days} days` :
        'To be determined';
      
      const travelers = extractedData?.groupSize?.numberOfPeople || 
                       extractedData?.groupSize?.adults || 
                       'TBD';
      
      const budget = extractedData?.budget?.amount ? 
        `$${extractedData.budget.amount} ${extractedData.budget.currency || 'USD'}` :
        'To be discussed';

      // Build additional requirements if any
      let additionalRequirements = '';
      if (extractedData?.activities && extractedData.activities.length > 0) {
        additionalRequirements += `<tr><td style="padding: 8px 0; color: #333;">
          <strong>🎯 Activities:</strong> <span style="color: #555;">${extractedData.activities.join(', ')}</span>
        </td></tr>`;
      }
      if (extractedData?.accommodationPreference) {
        additionalRequirements += `<tr><td style="padding: 8px 0; color: #333;">
          <strong>🏨 Accommodation:</strong> <span style="color: #555;">${extractedData.accommodationPreference}</span>
        </td></tr>`;
      }
      if (extractedData?.specialRequests) {
        additionalRequirements += `<tr><td style="padding: 8px 0; color: #333;">
          <strong>✨ Special Requests:</strong> <span style="color: #555;">${extractedData.specialRequests}</span>
        </td></tr>`;
      }

      // Build quoted original email
      const quotedOriginal = quotedTemplate
        .replace(/{{CUSTOMER_EMAIL}}/g, email.from?.email || email.from)
        .replace(/{{EMAIL_DATE}}/g, new Date(email.receivedAt || email.createdAt).toLocaleString())
        .replace(/{{EMAIL_SUBJECT}}/g, email.subject || 'Travel Inquiry')
        .replace(/{{EMAIL_BODY}}/g, (email.bodyPlain || email.bodyHtml || '').substring(0, 500));

      // Load tenant configuration
      const tenantConfig = await this.loadTenantConfig(tenantId);
      const companyName = tenantConfig.companyName;
      const companyEmail = tenantConfig.email;
      const companyPhone = tenantConfig.phone;
      const companyWebsite = tenantConfig.website;
      const currentYear = new Date().getFullYear();

      // Customization reason
      const customizationReason = note || 
        'Your requirements are unique and deserve a custom-designed itinerary tailored specifically to your preferences.';

      // Replace main template placeholders
      let emailBody = mainTemplate
        .replace(/{{CUSTOMER_NAME}}/g, customerName)
        .replace(/{{DESTINATION}}/g, destination)
        .replace(/{{TRAVEL_DATES}}/g, travelDates)
        .replace(/{{DURATION}}/g, duration)
        .replace(/{{TRAVELERS}}/g, travelers)
        .replace(/{{BUDGET}}/g, budget)
        .replace(/{{ADDITIONAL_REQUIREMENTS}}/g, additionalRequirements)
        .replace(/{{CUSTOMIZATION_REASON}}/g, customizationReason)
        .replace(/{{QUOTED_ORIGINAL}}/g, quotedOriginal)
        .replace(/{{COMPANY_NAME}}/g, companyName)
        .replace(/{{COMPANY_EMAIL}}/g, companyEmail)
        .replace(/{{COMPANY_PHONE}}/g, companyPhone)
        .replace(/{{COMPANY_WEBSITE}}/g, companyWebsite)
        .replace(/{{CURRENT_YEAR}}/g, currentYear);

      return {
        subject: `Creating your custom ${destination} itinerary - We're on it!`,
        body: emailBody,
        cost: 0,
        method: 'template',
        templateUsed: 'forward-supplier'
      };

    } catch (error) {
      console.error('Error generating custom request template email:', error);
      throw error;
    }
  }

  /**
   * Clear template cache (useful for development)
   */
  clearCache() {
    this.templateCache.clear();
  }
}

module.exports = new EmailTemplateService();
