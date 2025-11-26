const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../lib/logger');

/**
 * PDF Generation Service
 * Uses Puppeteer to generate branded PDFs from HTML templates
 */

class PDFService {
  constructor() {
    this.browser = null;
    this.templateCache = new Map();
  }

  /**
   * Initialize browser instance (reusable for multiple PDFs)
   */
  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });
      logger.info('Puppeteer browser initialized');
    }
    return this.browser;
  }

  /**
   * Close browser instance
   */
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      logger.info('Puppeteer browser closed');
    }
  }

  /**
   * Load and compile Handlebars template
   * @param {String} templateName - Template filename (without extension)
   * @returns {Function} - Compiled template
   */
  async loadTemplate(templateName) {
    // Check cache
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName);
    }

    try {
      const templatePath = path.join(__dirname, '../templates/pdf', `${templateName}.hbs`);
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      const compiled = handlebars.compile(templateContent);
      
      // Cache compiled template
      this.templateCache.set(templateName, compiled);
      
      return compiled;
    } catch (error) {
      logger.error(`Failed to load template ${templateName}:`, error);
      throw new Error(`Template ${templateName} not found`);
    }
  }

  /**
   * Generate PDF from HTML
   * @param {String} html - HTML content
   * @param {Object} options - PDF options
   * @returns {Buffer} - PDF buffer
   */
  async generatePDFFromHTML(html, options = {}) {
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    try {
      // Set content
      await page.setContent(html, {
        waitUntil: 'networkidle0',
      });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: options.format || 'A4',
        margin: options.margin || {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
        printBackground: true,
        preferCSSPageSize: false,
        ...options,
      });

      return pdfBuffer;
    } finally {
      await page.close();
    }
  }

  /**
   * Generate Quote PDF
   * @param {Object} quote - Quote document
   * @param {Object} tenant - Tenant document
   * @returns {Buffer} - PDF buffer
   */
  async generateQuotePDF(quote, tenant) {
    try {
      const template = await this.loadTemplate('quote');

      // Prepare data for template
      const data = {
        tenant: {
          name: tenant.name,
          logo: tenant.branding?.logo,
          primaryColor: tenant.branding?.primaryColor || '#3b82f6',
          secondaryColor: tenant.branding?.secondaryColor || '#1e3a8a',
          address: tenant.contact?.address,
          phone: tenant.contact?.phone,
          email: tenant.contact?.email,
          website: tenant.contact?.website,
        },
        quote: {
          number: quote.quoteNumber,
          title: quote.title,
          destination: quote.destination,
          validFrom: this.formatDate(quote.validFrom),
          validUntil: this.formatDate(quote.validUntil),
          createdAt: this.formatDate(quote.createdAt),
          status: quote.status,
        },
        customer: {
          name: quote.customer.name,
          email: quote.customer.email,
          phone: quote.customer.phone,
        },
        travelDetails: {
          startDate: this.formatDate(quote.travelDates?.startDate),
          endDate: this.formatDate(quote.travelDates?.endDate),
          duration: quote.duration,
          adults: quote.travelers?.adults || 0,
          children: quote.travelers?.children || 0,
          infants: quote.travelers?.infants || 0,
          totalTravelers: (quote.travelers?.adults || 0) + 
                         (quote.travelers?.children || 0) + 
                         (quote.travelers?.infants || 0),
        },
        lineItems: quote.lineItems.map((item) => ({
          day: item.day,
          type: this.capitalizeFirst(item.itemType),
          description: item.description,
          quantity: item.quantity,
          unitPrice: this.formatCurrency(item.unitPrice, quote.pricing.currency),
          total: this.formatCurrency(item.total, quote.pricing.currency),
        })),
        pricing: {
          subtotal: this.formatCurrency(quote.pricing.subtotal, quote.pricing.currency),
          discounts: quote.pricing.discounts?.map((d) => ({
            name: d.name,
            type: d.type,
            value: d.type === 'percentage' ? `${d.value}%` : this.formatCurrency(d.value, quote.pricing.currency),
            amount: this.formatCurrency(d.amount, quote.pricing.currency),
          })) || [],
          discountTotal: this.formatCurrency(quote.pricing.discountTotal, quote.pricing.currency),
          taxes: quote.pricing.taxes?.map((t) => ({
            name: t.name,
            type: t.type,
            value: t.type === 'percentage' ? `${t.value}%` : this.formatCurrency(t.value, quote.pricing.currency),
            amount: this.formatCurrency(t.amount, quote.pricing.currency),
          })) || [],
          taxTotal: this.formatCurrency(quote.pricing.taxTotal, quote.pricing.currency),
          grandTotal: this.formatCurrency(quote.pricing.grandTotal, quote.pricing.currency),
          currency: quote.pricing.currency,
        },
        paymentSchedule: quote.paymentSchedule?.map((ps) => ({
          milestone: ps.milestone,
          dueDate: this.formatDate(ps.dueDate),
          percentage: ps.percentage ? `${ps.percentage}%` : '',
          amount: this.formatCurrency(ps.amount, quote.pricing.currency),
          status: this.capitalizeFirst(ps.status),
        })) || [],
        inclusions: quote.inclusions || [],
        exclusions: quote.exclusions || [],
        termsAndConditions: quote.termsAndConditions,
        cancellationPolicy: quote.cancellationPolicy,
      };

      // Generate HTML
      const html = template(data);

      // Generate PDF
      return await this.generatePDFFromHTML(html, {
        format: 'A4',
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm',
        },
      });
    } catch (error) {
      logger.error('Failed to generate quote PDF:', error);
      throw error;
    }
  }

  /**
   * Generate Itinerary PDF
   * @param {Object} itinerary - Itinerary document
   * @param {Object} tenant - Tenant document
   * @returns {Buffer} - PDF buffer
   */
  async generateItineraryPDF(itinerary, tenant) {
    try {
      const template = await this.loadTemplate('itinerary');

      // Prepare data for template
      const data = {
        tenant: {
          name: tenant.name,
          logo: tenant.branding?.logo,
          primaryColor: tenant.branding?.primaryColor || '#3b82f6',
          secondaryColor: tenant.branding?.secondaryColor || '#1e3a8a',
        },
        itinerary: {
          title: itinerary.title,
          destination: itinerary.destination,
          startDate: this.formatDate(itinerary.startDate),
          endDate: this.formatDate(itinerary.endDate),
          duration: itinerary.days?.length || 0,
        },
        days: itinerary.days?.map((day, index) => ({
          dayNumber: index + 1,
          date: this.formatDate(day.date),
          title: day.title,
          description: day.description,
          accommodation: day.accommodation ? {
            name: day.accommodation.name,
            type: this.capitalizeFirst(day.accommodation.type),
            checkIn: this.formatDate(day.accommodation.checkIn),
            checkOut: this.formatDate(day.accommodation.checkOut),
            roomType: day.accommodation.roomType,
          } : null,
          activities: day.activities?.map((activity) => ({
            title: activity.title,
            description: activity.description,
            startTime: activity.startTime,
            endTime: activity.endTime,
            location: activity.location?.name,
          })) || [],
          meals: day.meals?.map((meal) => ({
            type: this.capitalizeFirst(meal.type),
            restaurant: meal.restaurant,
            cuisine: meal.cuisine,
          })) || [],
          transport: day.transport ? {
            type: this.capitalizeFirst(day.transport.type),
            from: day.transport.from,
            to: day.transport.to,
            departureTime: this.formatTime(day.transport.departureTime),
            arrivalTime: this.formatTime(day.transport.arrivalTime),
          } : null,
        })) || [],
      };

      // Generate HTML
      const html = template(data);

      // Generate PDF
      return await this.generatePDFFromHTML(html, {
        format: 'A4',
        margin: {
          top: '15mm',
          right: '12mm',
          bottom: '15mm',
          left: '12mm',
        },
      });
    } catch (error) {
      logger.error('Failed to generate itinerary PDF:', error);
      throw error;
    }
  }

  /**
   * Utility: Format date
   * @param {Date} date - Date to format
   * @returns {String} - Formatted date
   */
  formatDate(date) {
    if (!date) return 'N/A';
    
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(date).toLocaleDateString('en-US', options);
  }

  /**
   * Utility: Format time
   * @param {Date} date - Date to format
   * @returns {String} - Formatted time
   */
  formatTime(date) {
    if (!date) return '';
    
    const options = { hour: '2-digit', minute: '2-digit' };
    return new Date(date).toLocaleTimeString('en-US', options);
  }

  /**
   * Utility: Format currency
   * @param {Number} amount - Amount to format
   * @param {String} currency - Currency code
   * @returns {String} - Formatted currency
   */
  formatCurrency(amount, currency = 'USD') {
    if (amount === undefined || amount === null) return '0.00';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Utility: Capitalize first letter
   * @param {String} str - String to capitalize
   * @returns {String} - Capitalized string
   */
  capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
  }
}

// Export singleton instance
module.exports = new PDFService();
