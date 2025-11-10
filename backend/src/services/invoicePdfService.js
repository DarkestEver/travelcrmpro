const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

/**
 * Generate Invoice PDF using Puppeteer
 * @param {Object} invoice - Invoice with populated fields
 * @param {Object} tenant - Tenant information
 * @param {Object} agent - Agent information
 * @returns {Promise<String>} - Path to generated PDF
 */
const generateInvoicePDF = async (invoice, tenant, agent) => {
  let browser;
  try {
    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, '../../uploads/invoices');
    await fs.mkdir(uploadsDir, { recursive: true });

    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    const html = generateInvoiceHTML(invoice, tenant, agent);
    
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfPath = path.join(uploadsDir, `invoice-${invoice.invoiceNumber}.pdf`);
    
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    });

    await browser.close();
    return pdfPath;

  } catch (error) {
    if (browser) await browser.close();
    throw error;
  }
};

/**
 * Generate HTML template for invoice
 */
function generateInvoiceHTML(invoice, tenant, agent) {
  const customer = invoice.customerId;
  const booking = invoice.bookingId;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; padding: 40px; }
        .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 3px solid #2563eb; padding-bottom: 20px; }
        .company-info h1 { color: #2563eb; font-size: 28px; margin-bottom: 10px; }
        .company-info p { margin: 5px 0; font-size: 14px; color: #666; }
        .invoice-title { text-align: right; }
        .invoice-title h2 { font-size: 32px; color: #2563eb; margin-bottom: 10px; }
        .invoice-title .status { 
          display: inline-block; 
          padding: 5px 15px; 
          border-radius: 20px; 
          font-size: 12px; 
          font-weight: bold;
          text-transform: uppercase;
        }
        .status.paid { background: #10b981; color: white; }
        .status.sent { background: #3b82f6; color: white; }
        .status.draft { background: #6b7280; color: white; }
        .status.overdue { background: #ef4444; color: white; }
        .status.partially_paid { background: #f59e0b; color: white; }
        
        .info-section { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .info-box { width: 48%; }
        .info-box h3 { font-size: 14px; color: #666; margin-bottom: 10px; text-transform: uppercase; }
        .info-box p { margin: 5px 0; font-size: 14px; }
        .info-label { font-weight: bold; color: #2563eb; }
        
        table { width: 100%; border-collapse: collapse; margin: 30px 0; }
        thead { background: #f3f4f6; }
        th { text-align: left; padding: 12px; font-size: 12px; text-transform: uppercase; color: #666; border-bottom: 2px solid #e5e7eb; }
        td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
        .item-description { color: #666; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        
        .totals { margin-top: 30px; float: right; width: 350px; }
        .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
        .totals-row.subtotal { border-top: 1px solid #e5e7eb; padding-top: 15px; }
        .totals-row.total { 
          border-top: 3px solid #2563eb; 
          padding-top: 15px; 
          margin-top: 10px; 
          font-size: 18px; 
          font-weight: bold; 
        }
        .totals-row.amount-due { 
          color: #ef4444; 
          font-size: 16px; 
          font-weight: bold; 
          margin-top: 10px;
        }
        .totals-label { font-weight: 600; }
        .totals-value { font-weight: bold; }
        
        .notes-section { clear: both; margin-top: 60px; padding-top: 30px; border-top: 2px solid #e5e7eb; }
        .notes-section h3 { font-size: 14px; color: #2563eb; margin-bottom: 10px; text-transform: uppercase; }
        .notes-section p { font-size: 13px; color: #666; line-height: 1.6; }
        
        .footer { margin-top: 60px; text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        .footer p { font-size: 12px; color: #999; }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div class="header">
        <div class="company-info">
          <h1>${tenant.company || tenant.name}</h1>
          <p>${tenant.email || ''}</p>
          <p>${tenant.phone || ''}</p>
        </div>
        <div class="invoice-title">
          <h2>INVOICE</h2>
          <span class="status ${invoice.status}">${invoice.status.replace('_', ' ')}</span>
        </div>
      </div>
      
      <!-- Info Section -->
      <div class="info-section">
        <div class="info-box">
          <h3>Invoice Details</h3>
          <p><span class="info-label">Invoice #:</span> ${invoice.invoiceNumber}</p>
          <p><span class="info-label">Invoice Date:</span> ${formatDate(invoice.invoiceDate)}</p>
          <p><span class="info-label">Due Date:</span> ${formatDate(invoice.dueDate)}</p>
          ${booking ? `<p><span class="info-label">Booking #:</span> ${booking.bookingNumber || ''}</p>` : ''}
        </div>
        <div class="info-box">
          <h3>Bill To</h3>
          <p style="font-weight: bold; font-size: 16px;">${customer.name || ''}</p>
          <p>${customer.email || ''}</p>
          <p>${customer.phone || ''}</p>
          ${customer.address ? `<p>${customer.address}</p>` : ''}
        </div>
      </div>
      
      <!-- Items Table -->
      <table>
        <thead>
          <tr>
            <th style="width: 50px;">#</th>
            <th>Description</th>
            <th class="text-center" style="width: 80px;">Qty</th>
            <th class="text-right" style="width: 100px;">Unit Price</th>
            <th class="text-right" style="width: 120px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map((item, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>
                <div style="font-weight: 500;">${item.description}</div>
              </td>
              <td class="text-center">${item.quantity}</td>
              <td class="text-right">$${item.unitPrice.toFixed(2)}</td>
              <td class="text-right" style="font-weight: 600;">$${item.amount.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <!-- Totals -->
      <div class="totals">
        <div class="totals-row subtotal">
          <span class="totals-label">Subtotal:</span>
          <span class="totals-value">$${invoice.subtotal.toFixed(2)}</span>
        </div>
        ${invoice.discount > 0 ? `
          <div class="totals-row">
            <span class="totals-label">Discount:</span>
            <span class="totals-value">-$${invoice.discount.toFixed(2)}</span>
          </div>
        ` : ''}
        ${invoice.tax > 0 ? `
          <div class="totals-row">
            <span class="totals-label">Tax:</span>
            <span class="totals-value">$${invoice.tax.toFixed(2)}</span>
          </div>
        ` : ''}
        <div class="totals-row total">
          <span class="totals-label">Total:</span>
          <span class="totals-value">$${invoice.total.toFixed(2)}</span>
        </div>
        ${invoice.amountPaid > 0 ? `
          <div class="totals-row">
            <span class="totals-label">Amount Paid:</span>
            <span class="totals-value">$${invoice.amountPaid.toFixed(2)}</span>
          </div>
          <div class="totals-row amount-due">
            <span class="totals-label">Amount Due:</span>
            <span class="totals-value">$${invoice.amountDue.toFixed(2)}</span>
          </div>
        ` : ''}
      </div>
      
      <!-- Notes & Terms -->
      ${invoice.notes || invoice.terms ? `
        <div class="notes-section">
          ${invoice.notes ? `
            <div style="margin-bottom: 20px;">
              <h3>Notes</h3>
              <p>${invoice.notes}</p>
            </div>
          ` : ''}
          ${invoice.terms ? `
            <div>
              <h3>Terms & Conditions</h3>
              <p>${invoice.terms}</p>
            </div>
          ` : ''}
        </div>
      ` : ''}
      
      <!-- Footer -->
      <div class="footer">
        <p>Thank you for your business!</p>
        <p style="margin-top: 5px;">Generated on ${formatDate(new Date())}</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Format date helper
 */
function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return d.toLocaleDateString('en-US', options);
}

module.exports = {
  generateInvoicePDF
};
