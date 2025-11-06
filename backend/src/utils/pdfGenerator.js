const PDFDocument = require('pdfkit');
const { Readable } = require('stream');

/**
 * Generate Quote PDF
 */
const generateQuotePDF = async (quote, customer) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks = [];

      // Collect PDF chunks
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('TRAVEL QUOTE', { align: 'center' });
      doc.moveDown();
      
      // Quote Details
      doc.fontSize(12).text(`Quote Number: ${quote.quoteNumber}`, { bold: true });
      doc.text(`Date: ${new Date(quote.createdAt).toLocaleDateString()}`);
      doc.text(`Valid Until: ${new Date(quote.validUntil).toLocaleDateString()}`);
      doc.text(`Status: ${quote.status.toUpperCase()}`);
      doc.moveDown();

      // Customer Details
      doc.fontSize(14).text('Customer Information:', { underline: true });
      doc.fontSize(11);
      doc.text(`Name: ${customer.name}`);
      doc.text(`Email: ${customer.email}`);
      doc.text(`Phone: ${customer.phone || 'N/A'}`);
      doc.moveDown();

      // Itinerary Details
      if (quote.itineraryId) {
        doc.fontSize(14).text('Itinerary:', { underline: true });
        doc.fontSize(11);
        doc.text(`Title: ${quote.itineraryId.title || 'N/A'}`);
        doc.text(`Destination: ${quote.itineraryId.destination?.city || 'N/A'}, ${quote.itineraryId.destination?.country || 'N/A'}`);
        doc.text(`Duration: ${quote.itineraryId.duration?.days || 0} days, ${quote.itineraryId.duration?.nights || 0} nights`);
        doc.moveDown();
      }

      // Travel Details
      doc.fontSize(14).text('Travel Details:', { underline: true });
      doc.fontSize(11);
      doc.text(`Number of Travelers: ${quote.numberOfTravelers.adults} Adults, ${quote.numberOfTravelers.children || 0} Children, ${quote.numberOfTravelers.infants || 0} Infants`);
      if (quote.travelDates?.startDate) {
        doc.text(`Travel Dates: ${new Date(quote.travelDates.startDate).toLocaleDateString()} - ${new Date(quote.travelDates.endDate).toLocaleDateString()}`);
      }
      doc.moveDown();

      // Pricing Breakdown
      doc.fontSize(14).text('Pricing:', { underline: true });
      doc.fontSize(11);
      doc.text(`Base Cost: $${quote.pricing.baseCost?.toFixed(2) || '0.00'}`);
      
      if (quote.pricing.markup?.amount) {
        doc.text(`Markup (${quote.pricing.markup.percentage}%): $${quote.pricing.markup.amount.toFixed(2)}`);
      }
      
      if (quote.pricing.taxes?.amount) {
        doc.text(`Taxes: $${quote.pricing.taxes.amount.toFixed(2)}`);
      }
      
      doc.moveDown();
      doc.fontSize(16).text(`Total Price: $${quote.pricing.totalPrice.toFixed(2)}`, { bold: true });
      doc.moveDown();

      // Special Requests
      if (quote.specialRequests) {
        doc.fontSize(14).text('Special Requests:', { underline: true });
        doc.fontSize(11).text(quote.specialRequests);
        doc.moveDown();
      }

      // Terms & Conditions
      doc.fontSize(10);
      doc.moveDown();
      doc.text('Terms & Conditions:', { underline: true });
      doc.fontSize(9);
      doc.text('1. This quote is valid for the period specified above.');
      doc.text('2. Prices are subject to change based on availability.');
      doc.text('3. Full payment is required to confirm the booking.');
      doc.text('4. Cancellation charges may apply as per our policy.');

      // Footer
      doc.moveDown(2);
      doc.fontSize(8).text('Thank you for choosing our services!', { align: 'center' });
      doc.text('For questions, contact us at support@travelcrm.com', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate Booking PDF
 */
const generateBookingPDF = async (booking, customer) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('BOOKING CONFIRMATION', { align: 'center' });
      doc.moveDown();

      // Booking Details
      doc.fontSize(12).text(`Booking Number: ${booking.bookingNumber}`, { bold: true });
      doc.text(`Date: ${new Date(booking.createdAt).toLocaleDateString()}`);
      doc.text(`Status: ${booking.bookingStatus.toUpperCase()}`);
      doc.text(`Payment Status: ${booking.paymentStatus.toUpperCase()}`);
      doc.moveDown();

      // Customer Details
      doc.fontSize(14).text('Customer Information:', { underline: true });
      doc.fontSize(11);
      doc.text(`Name: ${customer.name}`);
      doc.text(`Email: ${customer.email}`);
      doc.text(`Phone: ${customer.phone || 'N/A'}`);
      doc.moveDown();

      // Travel Details
      doc.fontSize(14).text('Travel Information:', { underline: true });
      doc.fontSize(11);
      if (booking.itineraryId) {
        doc.text(`Destination: ${booking.itineraryId.destination?.city || 'N/A'}, ${booking.itineraryId.destination?.country || 'N/A'}`);
        doc.text(`Title: ${booking.itineraryId.title || 'N/A'}`);
      }
      doc.text(`Travel Dates: ${new Date(booking.travelDates.startDate).toLocaleDateString()} - ${new Date(booking.travelDates.endDate).toLocaleDateString()}`);
      doc.moveDown();

      // Travelers
      if (booking.travelers && booking.travelers.length > 0) {
        doc.fontSize(14).text('Travelers:', { underline: true });
        doc.fontSize(11);
        booking.travelers.forEach((traveler, index) => {
          doc.text(`${index + 1}. ${traveler.name} (Age: ${traveler.age || 'N/A'})`);
          if (traveler.passportNumber) {
            doc.text(`   Passport: ${traveler.passportNumber}`);
          }
        });
        doc.moveDown();
      }

      // Financial Details
      doc.fontSize(14).text('Payment Information:', { underline: true });
      doc.fontSize(11);
      doc.text(`Total Amount: $${booking.financial.totalAmount.toFixed(2)}`);
      doc.text(`Paid Amount: $${booking.financial.paidAmount.toFixed(2)}`);
      doc.text(`Pending Amount: $${booking.financial.pendingAmount.toFixed(2)}`);
      doc.moveDown();

      // Payment Records
      if (booking.paymentRecords && booking.paymentRecords.length > 0) {
        doc.fontSize(12).text('Payment History:', { underline: true });
        doc.fontSize(10);
        booking.paymentRecords.forEach((payment, index) => {
          doc.text(`${index + 1}. $${payment.amount.toFixed(2)} - ${payment.method} - ${new Date(payment.paidAt).toLocaleDateString()}`);
        });
        doc.moveDown();
      }

      // Special Requests
      if (booking.specialRequests) {
        doc.fontSize(14).text('Special Requests:', { underline: true });
        doc.fontSize(11).text(booking.specialRequests);
        doc.moveDown();
      }

      // Important Information
      doc.fontSize(10);
      doc.moveDown();
      doc.text('Important Information:', { underline: true });
      doc.fontSize(9);
      doc.text('• Please carry this confirmation along with valid identification.');
      doc.text('• Check-in time and requirements may vary by service provider.');
      doc.text('• Contact us immediately for any changes or cancellations.');

      // Footer
      doc.moveDown(2);
      doc.fontSize(8).text('Safe travels! Thank you for choosing our services.', { align: 'center' });
      doc.text('For support, contact us at support@travelcrm.com', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate Booking Voucher
 */
const generateVoucherPDF = async (booking, customer) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header with border
      doc.rect(40, 40, doc.page.width - 80, doc.page.height - 80).stroke();
      
      doc.fontSize(24).text('TRAVEL VOUCHER', { align: 'center' });
      doc.moveDown();

      // Voucher Number
      doc.fontSize(14).text(`Voucher #: ${booking.bookingNumber}`, { align: 'center', bold: true });
      doc.moveDown(2);

      // Passenger Details
      doc.fontSize(16).text('Passenger Information', { underline: true });
      doc.fontSize(12);
      doc.text(`Name: ${customer.name}`);
      doc.text(`Contact: ${customer.phone || customer.email}`);
      doc.moveDown();

      // Travel Details
      doc.fontSize(16).text('Travel Details', { underline: true });
      doc.fontSize(12);
      if (booking.itineraryId) {
        doc.text(`Destination: ${booking.itineraryId.destination?.city}, ${booking.itineraryId.destination?.country}`);
      }
      doc.text(`Travel Period: ${new Date(booking.travelDates.startDate).toLocaleDateString()} to ${new Date(booking.travelDates.endDate).toLocaleDateString()}`);
      doc.moveDown();

      // Booking Status
      doc.fontSize(16).text('Booking Status', { underline: true });
      doc.fontSize(12);
      doc.text(`Status: ${booking.bookingStatus.toUpperCase()}`);
      doc.text(`Confirmed On: ${new Date(booking.createdAt).toLocaleDateString()}`);
      doc.moveDown();

      // QR Code placeholder (you can add actual QR code generation)
      doc.fontSize(10).text('[QR Code Placeholder]', { align: 'center' });
      doc.moveDown(2);

      // Important Notes
      doc.fontSize(10);
      doc.text('IMPORTANT NOTES:', { bold: true, underline: true });
      doc.fontSize(9);
      doc.text('• This voucher must be presented at check-in');
      doc.text('• Valid identification is required');
      doc.text('• Subject to terms and conditions');

      // Footer
      doc.moveDown(3);
      doc.fontSize(8).text('This is a computer-generated voucher. No signature required.', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateQuotePDF,
  generateBookingPDF,
  generateVoucherPDF
};
