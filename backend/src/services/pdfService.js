const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');

class PDFService {
  constructor() {
    this.browser = null;
    this.outputDir = path.join(__dirname, '../../uploads/pdfs');
  }

  async initialize() {
    try {
      // Ensure output directory exists
      await fs.mkdir(this.outputDir, { recursive: true });

      // Initialize browser for PDF generation
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
        ],
      });

      logger.info('PDF Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize PDF Service:', error);
      throw error;
    }
  }

  async generateQuotePDF(quote) {
    try {
      const page = await this.browser.newPage();

      const html = this.generateQuoteHTML(quote);

      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfPath = path.join(
        this.outputDir,
        `quote-${quote.quoteNumber}.pdf`
      );

      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
      });

      await page.close();

      logger.info(`Quote PDF generated: ${quote.quoteNumber}`);

      return pdfPath;
    } catch (error) {
      logger.error('Error generating quote PDF:', error);
      throw error;
    }
  }

  generateQuoteHTML(quote) {
    const {
      quoteNumber,
      customer,
      agent,
      itinerary,
      pricing,
      validUntil,
      notes,
      termsAndConditions,
    } = quote;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #333;
            line-height: 1.6;
          }
          .container {
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #3b82f6;
            font-size: 32px;
            margin-bottom: 10px;
          }
          .header p {
            color: #666;
            font-size: 14px;
          }
          .quote-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
          }
          .info-block {
            flex: 1;
          }
          .info-block h3 {
            color: #3b82f6;
            font-size: 14px;
            margin-bottom: 10px;
            text-transform: uppercase;
          }
          .info-block p {
            font-size: 13px;
            margin-bottom: 5px;
          }
          .itinerary-section {
            margin-bottom: 30px;
          }
          .itinerary-section h2 {
            color: #1e40af;
            font-size: 20px;
            margin-bottom: 15px;
            border-left: 4px solid #3b82f6;
            padding-left: 15px;
          }
          .day-item {
            background: #f8fafc;
            padding: 15px;
            margin-bottom: 15px;
            border-radius: 8px;
            border-left: 3px solid #3b82f6;
          }
          .day-item h4 {
            color: #1e40af;
            margin-bottom: 8px;
            font-size: 16px;
          }
          .day-item p {
            font-size: 13px;
            color: #555;
          }
          .day-item ul {
            margin-left: 20px;
            margin-top: 8px;
          }
          .day-item li {
            font-size: 13px;
            margin-bottom: 4px;
          }
          .pricing-section {
            background: #f0f9ff;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          .pricing-section h2 {
            color: #1e40af;
            font-size: 20px;
            margin-bottom: 15px;
          }
          .pricing-table {
            width: 100%;
            border-collapse: collapse;
          }
          .pricing-table td {
            padding: 10px;
            border-bottom: 1px solid #cbd5e1;
            font-size: 14px;
          }
          .pricing-table td:first-child {
            color: #666;
          }
          .pricing-table td:last-child {
            text-align: right;
            font-weight: 600;
          }
          .pricing-table .total-row {
            background: #dbeafe;
            font-weight: bold;
            font-size: 16px;
            color: #1e40af;
          }
          .notes-section {
            margin-bottom: 20px;
          }
          .notes-section h3 {
            color: #1e40af;
            font-size: 16px;
            margin-bottom: 10px;
          }
          .notes-section p {
            font-size: 13px;
            color: #555;
            line-height: 1.8;
          }
          .terms-section {
            background: #fef3c7;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #f59e0b;
          }
          .terms-section h3 {
            color: #92400e;
            font-size: 14px;
            margin-bottom: 10px;
          }
          .terms-section p {
            font-size: 12px;
            color: #78350f;
            line-height: 1.6;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            color: #666;
            font-size: 12px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
          }
          .valid-until {
            background: #fef2f2;
            color: #991b1b;
            padding: 10px;
            border-radius: 6px;
            text-align: center;
            margin-bottom: 20px;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Travel CRM</h1>
            <p>Professional Travel Solutions</p>
          </div>

          <div class="quote-info">
            <div class="info-block">
              <h3>Quote Details</h3>
              <p><strong>Quote #:</strong> ${quoteNumber}</p>
              <p><strong>Date:</strong> ${new Date(quote.createdAt).toLocaleDateString()}</p>
              <p><strong>Valid Until:</strong> ${new Date(validUntil).toLocaleDateString()}</p>
            </div>
            <div class="info-block">
              <h3>Customer Details</h3>
              <p><strong>${customer.name}</strong></p>
              <p>${customer.email}</p>
              <p>${customer.phone || 'N/A'}</p>
            </div>
            <div class="info-block">
              <h3>Agent Details</h3>
              <p><strong>${agent.user?.name || 'Travel Agent'}</strong></p>
              <p>${agent.agencyName || ''}</p>
              <p>${agent.contactEmail}</p>
            </div>
          </div>

          ${validUntil && new Date(validUntil) > new Date() ? `
            <div class="valid-until">
              This quote is valid until ${new Date(validUntil).toLocaleDateString()}
            </div>
          ` : ''}

          <div class="itinerary-section">
            <h2>${itinerary.title}</h2>
            <p style="margin-bottom: 20px; color: #666;">${itinerary.description || ''}</p>
            
            ${itinerary.days.map((day, index) => `
              <div class="day-item">
                <h4>Day ${day.dayNumber}: ${day.title}</h4>
                <p>${day.description}</p>
                ${day.activities && day.activities.length > 0 ? `
                  <ul>
                    ${day.activities.map(activity => `<li>${activity}</li>`).join('')}
                  </ul>
                ` : ''}
              </div>
            `).join('')}
          </div>

          <div class="pricing-section">
            <h2>Pricing Breakdown</h2>
            <table class="pricing-table">
              <tr>
                <td>Base Price</td>
                <td>$${pricing.basePrice.toLocaleString()}</td>
              </tr>
              ${pricing.discount > 0 ? `
                <tr>
                  <td>Discount (${pricing.discountPercentage}%)</td>
                  <td>-$${pricing.discount.toLocaleString()}</td>
                </tr>
              ` : ''}
              ${pricing.taxes > 0 ? `
                <tr>
                  <td>Taxes & Fees</td>
                  <td>$${pricing.taxes.toLocaleString()}</td>
                </tr>
              ` : ''}
              <tr class="total-row">
                <td>Total Price</td>
                <td>$${pricing.totalPrice.toLocaleString()}</td>
              </tr>
            </table>
          </div>

          ${notes ? `
            <div class="notes-section">
              <h3>Additional Notes</h3>
              <p>${notes}</p>
            </div>
          ` : ''}

          ${termsAndConditions ? `
            <div class="terms-section">
              <h3>Terms & Conditions</h3>
              <p>${termsAndConditions}</p>
            </div>
          ` : ''}

          <div class="footer">
            <p>Thank you for choosing Travel CRM</p>
            <p>For any queries, please contact your agent or our support team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async generateBookingVoucherPDF(booking) {
    try {
      const page = await this.browser.newPage();

      const html = this.generateBookingVoucherHTML(booking);

      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfPath = path.join(
        this.outputDir,
        `booking-${booking.bookingNumber}.pdf`
      );

      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
      });

      await page.close();

      logger.info(`Booking voucher generated: ${booking.bookingNumber}`);

      return pdfPath;
    } catch (error) {
      logger.error('Error generating booking voucher:', error);
      throw error;
    }
  }

  generateBookingVoucherHTML(booking) {
    const {
      bookingNumber,
      customer,
      agent,
      itinerary,
      travelers,
      financial,
      bookingDate,
      travelDates,
      status,
    } = booking;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #333;
            line-height: 1.6;
          }
          .container {
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
          }
          .header h1 {
            font-size: 36px;
            margin-bottom: 10px;
          }
          .header p {
            font-size: 16px;
            opacity: 0.9;
          }
          .voucher-badge {
            background: #10b981;
            color: white;
            padding: 8px 20px;
            border-radius: 20px;
            display: inline-block;
            margin-top: 10px;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 14px;
          }
          .booking-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
          }
          .info-card {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
          }
          .info-card h3 {
            color: #3b82f6;
            font-size: 14px;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .info-card p {
            font-size: 13px;
            margin-bottom: 6px;
          }
          .info-card strong {
            color: #1e40af;
          }
          .section {
            margin-bottom: 30px;
          }
          .section h2 {
            color: #1e40af;
            font-size: 20px;
            margin-bottom: 15px;
            border-left: 4px solid #3b82f6;
            padding-left: 15px;
          }
          .travelers-list {
            background: #f0f9ff;
            padding: 20px;
            border-radius: 8px;
          }
          .traveler-item {
            padding: 15px;
            background: white;
            margin-bottom: 10px;
            border-radius: 6px;
            border: 1px solid #cbd5e1;
          }
          .traveler-item h4 {
            color: #1e40af;
            margin-bottom: 8px;
          }
          .traveler-item p {
            font-size: 13px;
            color: #555;
          }
          .financial-summary {
            background: #ecfdf5;
            padding: 20px;
            border-radius: 8px;
            border: 2px solid #10b981;
          }
          .financial-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #d1fae5;
            font-size: 14px;
          }
          .financial-row:last-child {
            border-bottom: none;
            font-size: 18px;
            font-weight: bold;
            color: #065f46;
            margin-top: 10px;
            padding-top: 15px;
            border-top: 2px solid #10b981;
          }
          .important-notice {
            background: #fef3c7;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #f59e0b;
            margin-bottom: 20px;
          }
          .important-notice h3 {
            color: #92400e;
            font-size: 16px;
            margin-bottom: 10px;
          }
          .important-notice ul {
            margin-left: 20px;
          }
          .important-notice li {
            font-size: 13px;
            color: #78350f;
            margin-bottom: 6px;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            color: #666;
            font-size: 12px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
          }
          .qr-placeholder {
            width: 120px;
            height: 120px;
            background: #f1f5f9;
            border: 2px dashed #94a3b8;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 20px auto;
            border-radius: 8px;
            color: #64748b;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎫 Travel Booking Voucher</h1>
            <p>Your journey begins here</p>
            <div class="voucher-badge">${status}</div>
          </div>

          <div class="booking-info">
            <div class="info-card">
              <h3>Booking Details</h3>
              <p><strong>Booking #:</strong> ${bookingNumber}</p>
              <p><strong>Booking Date:</strong> ${new Date(bookingDate).toLocaleDateString()}</p>
              <p><strong>Status:</strong> ${status}</p>
            </div>
            <div class="info-card">
              <h3>Travel Dates</h3>
              <p><strong>Start:</strong> ${new Date(travelDates.startDate).toLocaleDateString()}</p>
              <p><strong>End:</strong> ${new Date(travelDates.endDate).toLocaleDateString()}</p>
              <p><strong>Duration:</strong> ${Math.ceil((new Date(travelDates.endDate) - new Date(travelDates.startDate)) / (1000 * 60 * 60 * 24))} days</p>
            </div>
            <div class="info-card">
              <h3>Customer Details</h3>
              <p><strong>${customer.name}</strong></p>
              <p>${customer.email}</p>
              <p>${customer.phone || 'N/A'}</p>
            </div>
            <div class="info-card">
              <h3>Agent Details</h3>
              <p><strong>${agent.user?.name || 'Travel Agent'}</strong></p>
              <p>${agent.agencyName || ''}</p>
              <p>${agent.contactEmail}</p>
              <p>${agent.contactPhone}</p>
            </div>
          </div>

          <div class="section">
            <h2>Itinerary: ${itinerary.title}</h2>
            <p style="color: #666; margin-bottom: 20px;">${itinerary.description || ''}</p>
          </div>

          <div class="section">
            <h2>Travelers</h2>
            <div class="travelers-list">
              ${travelers.map((traveler, index) => `
                <div class="traveler-item">
                  <h4>Traveler ${index + 1}</h4>
                  <p><strong>Name:</strong> ${traveler.firstName} ${traveler.lastName}</p>
                  <p><strong>Date of Birth:</strong> ${new Date(traveler.dateOfBirth).toLocaleDateString()}</p>
                  <p><strong>Passport:</strong> ${traveler.passportNumber} (Exp: ${new Date(traveler.passportExpiry).toLocaleDateString()})</p>
                  <p><strong>Nationality:</strong> ${traveler.nationality}</p>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="section">
            <h2>Financial Summary</h2>
            <div class="financial-summary">
              <div class="financial-row">
                <span>Total Amount</span>
                <span>$${financial.totalAmount.toLocaleString()}</span>
              </div>
              <div class="financial-row">
                <span>Amount Paid</span>
                <span style="color: #10b981;">$${financial.paidAmount.toLocaleString()}</span>
              </div>
              <div class="financial-row">
                <span>Pending Amount</span>
                <span style="color: #f59e0b;">$${financial.pendingAmount.toLocaleString()}</span>
              </div>
              <div class="financial-row">
                <span>Balance Due</span>
                <span>$${financial.pendingAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div class="important-notice">
            <h3>⚠️ Important Information</h3>
            <ul>
              <li>Please carry this voucher (printed or digital) during your travel</li>
              <li>Ensure all passport and visa documents are valid for travel dates</li>
              <li>Arrive at meeting points at least 15 minutes before scheduled time</li>
              <li>Contact your agent immediately for any changes or cancellations</li>
              <li>Travel insurance is highly recommended for international trips</li>
              <li>Check baggage allowances with respective service providers</li>
            </ul>
          </div>

          <div class="qr-placeholder">
            QR Code<br/>Placeholder
          </div>

          <div class="footer">
            <p><strong>Travel CRM - Professional Travel Solutions</strong></p>
            <p>For support, contact your agent or our 24/7 helpline</p>
            <p>This is a computer-generated voucher and does not require a signature</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async generateInvoicePDF(booking) {
    try {
      const page = await this.browser.newPage();

      const html = this.generateInvoiceHTML(booking);

      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfPath = path.join(
        this.outputDir,
        `invoice-${booking.bookingNumber}.pdf`
      );

      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
      });

      await page.close();

      logger.info(`Invoice generated: ${booking.bookingNumber}`);

      return pdfPath;
    } catch (error) {
      logger.error('Error generating invoice:', error);
      throw error;
    }
  }

  generateInvoiceHTML(booking) {
    const { bookingNumber, customer, agent, financial, payments } = booking;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; }
          .container { padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .header h1 { color: #1e40af; font-size: 32px; }
          .invoice-details { text-align: right; }
          .invoice-details h2 { color: #ef4444; font-size: 24px; }
          .party-details { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .party-box { flex: 1; background: #f8fafc; padding: 20px; margin: 0 10px; border-radius: 8px; }
          .party-box h3 { color: #3b82f6; margin-bottom: 10px; }
          .payments-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .payments-table th { background: #1e40af; color: white; padding: 12px; text-align: left; }
          .payments-table td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
          .totals { background: #f0f9ff; padding: 20px; border-radius: 8px; }
          .total-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 16px; }
          .grand-total { font-size: 20px; font-weight: bold; color: #1e40af; border-top: 2px solid #3b82f6; margin-top: 10px; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div>
              <h1>Travel CRM</h1>
              <p>Professional Travel Solutions</p>
            </div>
            <div class="invoice-details">
              <h2>INVOICE</h2>
              <p><strong>#${bookingNumber}</strong></p>
              <p>${new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div class="party-details">
            <div class="party-box">
              <h3>Bill To:</h3>
              <p><strong>${customer.name}</strong></p>
              <p>${customer.email}</p>
              <p>${customer.phone || ''}</p>
            </div>
            <div class="party-box">
              <h3>From:</h3>
              <p><strong>${agent.agencyName}</strong></p>
              <p>${agent.contactEmail}</p>
              <p>${agent.contactPhone}</p>
            </div>
          </div>

          <h3 style="margin-bottom: 15px; color: #1e40af;">Payment History</h3>
          <table class="payments-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Method</th>
                <th>Reference</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${payments && payments.length > 0 ? payments.map(payment => `
                <tr>
                  <td>${new Date(payment.paymentDate).toLocaleDateString()}</td>
                  <td>${payment.method}</td>
                  <td>${payment.referenceNumber || 'N/A'}</td>
                  <td>$${payment.amount.toLocaleString()}</td>
                </tr>
              `).join('') : '<tr><td colspan="4">No payments recorded</td></tr>'}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span>Total Amount:</span>
              <span>$${financial.totalAmount.toLocaleString()}</span>
            </div>
            <div class="total-row">
              <span>Amount Paid:</span>
              <span style="color: #10b981;">$${financial.paidAmount.toLocaleString()}</span>
            </div>
            <div class="total-row">
              <span>Pending Amount:</span>
              <span style="color: #ef4444;">$${financial.pendingAmount.toLocaleString()}</span>
            </div>
            <div class="total-row grand-total">
              <span>Balance Due:</span>
              <span>$${financial.pendingAmount.toLocaleString()}</span>
            </div>
          </div>

          <div style="margin-top: 40px; text-align: center; color: #666; font-size: 12px;">
            <p>Thank you for your business!</p>
            <p>For queries, contact: ${agent.contactEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      logger.info('PDF Service browser closed');
    }
  }
}

// Singleton instance
let pdfServiceInstance = null;

const getPDFService = async () => {
  if (!pdfServiceInstance) {
    pdfServiceInstance = new PDFService();
    await pdfServiceInstance.initialize();
  }
  return pdfServiceInstance;
};

module.exports = getPDFService;
