/**
 * Email Template Service
 * Generates emails from static templates instead of AI (cost optimization)
 */

const fs = require('fs').promises;
const path = require('path');

class EmailTemplateService {
  constructor() {
    this.templatesPath = path.join(__dirname, '../../templates');
    this.templateCache = new Map();
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

      // Company/Tenant configuration with fallbacks
      const tenantConfig = {}; // TODO: Load from database using tenantId
      const companyName = tenantConfig.companyName || 'Travel Manager Pro';
      const companyEmail = tenantConfig.email || email.to || 'travel@example.com';
      const companyPhone = tenantConfig.phone || '+1 (800) 123-4567';
      const companyWebsite = tenantConfig.website || 'www.travelmanagerpro.com';
      const agentName = tenantConfig.agentName || 'Travel Team';

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
   * Clear template cache (useful for development)
   */
  clearCache() {
    this.templateCache.clear();
  }
}

module.exports = new EmailTemplateService();
