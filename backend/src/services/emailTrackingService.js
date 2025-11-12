/**
 * Email Tracking Service
 * 
 * Generates and manages email tracking IDs for reliable conversation threading.
 * Tracking IDs are embedded in email body and parsed from replies.
 * 
 * Format: [PREFIX-XXXXX-NNNNNN]
 * Example: [TRK-ABC12-001234]
 * 
 * This provides a fallback when email headers (In-Reply-To, References) are missing or malformed.
 */

const { Tenant } = require('../models');
const crypto = require('crypto');

class EmailTrackingService {
  /**
   * Generate a unique tracking ID for an email
   * 
   * @param {string} tenantId - Tenant ID
   * @param {string} customerEmail - Customer email address (optional, for customer-specific IDs)
   * @returns {Promise<string>} Tracking ID like "TRK-ABC12-001234"
   */
  static async generateTrackingId(tenantId, customerEmail = null) {
    try {
      // Get tenant settings
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Check if tracking is enabled
      if (!tenant.settings?.email?.enableTrackingId) {
        return null;
      }

      // Get prefix (default: TRK)
      const prefix = tenant.settings?.email?.trackingIdPrefix || 'TRK';

      // Generate customer-specific hash (5 chars)
      // This helps group conversations by customer
      let customerHash = 'GENRL'; // Default for non-customer emails
      if (customerEmail) {
        const hash = crypto.createHash('md5').update(customerEmail).digest('hex');
        customerHash = hash.substring(0, 5).toUpperCase();
      }

      // Increment sequence number
      const sequence = await this.getNextSequenceNumber(tenantId);

      // Format: PREFIX-HASH5-SEQUENCE6
      // Example: TRK-ABC12-001234
      const trackingId = `${prefix}-${customerHash}-${sequence.toString().padStart(6, '0')}`;

      return trackingId;

    } catch (error) {
      console.error('Error generating tracking ID:', error);
      // Return fallback tracking ID
      return `TRK-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    }
  }

  /**
   * Get next sequence number for tenant
   * Uses atomic increment to avoid duplicates
   */
  static async getNextSequenceNumber(tenantId) {
    try {
      const result = await Tenant.findByIdAndUpdate(
        tenantId,
        { $inc: { 'settings.email.trackingIdSequence': 1 } },
        { new: true, upsert: false }
      );

      return result?.settings?.email?.trackingIdSequence || 1;
    } catch (error) {
      console.error('Error getting sequence number:', error);
      return Date.now() % 1000000; // Fallback to timestamp-based
    }
  }

  /**
   * Extract tracking ID from email body
   * Supports multiple formats and variations
   * 
   * @param {string} emailBody - Email body text (HTML or plain text)
   * @returns {string|null} Extracted tracking ID or null
   */
  static extractTrackingId(emailBody) {
    if (!emailBody) return null;

    // Remove HTML tags for easier parsing
    const plainText = emailBody.replace(/<[^>]*>/g, ' ');

    // Pattern 1: [PREFIX-XXXXX-NNNNNN] (most common)
    const pattern1 = /\[([A-Z]{2,10})-([A-Z0-9]{5})-(\d{6})\]/i;
    const match1 = plainText.match(pattern1);
    if (match1) {
      return match1[0].replace(/[\[\]]/g, ''); // Return without brackets
    }

    // Pattern 2: REF: PREFIX-XXXXX-NNNNNN (some email clients)
    const pattern2 = /REF:\s*([A-Z]{2,10})-([A-Z0-9]{5})-(\d{6})/i;
    const match2 = plainText.match(pattern2);
    if (match2) {
      return `${match2[1]}-${match2[2]}-${match2[3]}`;
    }

    // Pattern 3: Tracking ID: PREFIX-XXXXX-NNNNNN (human-readable format)
    const pattern3 = /Tracking\s+ID:\s*([A-Z]{2,10})-([A-Z0-9]{5})-(\d{6})/i;
    const match3 = plainText.match(pattern3);
    if (match3) {
      return `${match3[1]}-${match3[2]}-${match3[3]}`;
    }

    // Pattern 4: Reference Number: PREFIX-XXXXX-NNNNNN
    const pattern4 = /Reference\s+Number:\s*([A-Z]{2,10})-([A-Z0-9]{5})-(\d{6})/i;
    const match4 = plainText.match(pattern4);
    if (match4) {
      return `${match4[1]}-${match4[2]}-${match4[3]}`;
    }

    return null;
  }

  /**
   * Inject tracking ID into email body
   * Adds it as a visible footer element and hidden metadata
   * 
   * @param {string} emailBody - Original email HTML body
   * @param {string} trackingId - Tracking ID to inject
   * @returns {string} Email body with tracking ID injected
   */
  static injectTrackingId(emailBody, trackingId) {
    if (!trackingId || !emailBody) return emailBody;

    // Create tracking footer HTML
    const trackingFooter = `
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af;">
        <p style="margin: 0;">
          <strong>Reference Number:</strong> [${trackingId}]
        </p>
        <p style="margin: 5px 0 0 0; font-size: 10px;">
          Please include this reference number in your reply for faster assistance.
        </p>
      </div>
      
      <!-- Hidden tracking metadata for email clients that strip visible content -->
      <div style="display:none; font-size:0; line-height:0; max-height:0; overflow:hidden;">
        TRACKING_ID:[${trackingId}]
      </div>
    `;

    // Try to inject before </body> tag
    if (emailBody.includes('</body>')) {
      return emailBody.replace('</body>', `${trackingFooter}</body>`);
    }

    // If no </body> tag, append to end
    return emailBody + trackingFooter;
  }

  /**
   * Inject tracking ID into plain text email
   * 
   * @param {string} emailText - Original plain text email
   * @param {string} trackingId - Tracking ID to inject
   * @returns {string} Email text with tracking ID injected
   */
  static injectTrackingIdPlainText(emailText, trackingId) {
    if (!trackingId || !emailText) return emailText;

    const trackingFooter = `\n\n---\nReference Number: [${trackingId}]\nPlease include this reference number in your reply for faster assistance.`;

    return emailText + trackingFooter;
  }

  /**
   * Validate tracking ID format
   * 
   * @param {string} trackingId - Tracking ID to validate
   * @returns {boolean} True if valid format
   */
  static isValidTrackingId(trackingId) {
    if (!trackingId) return false;

    // Pattern: PREFIX-XXXXX-NNNNNN
    const pattern = /^[A-Z]{2,10}-[A-Z0-9]{5}-\d{6}$/;
    return pattern.test(trackingId);
  }

  /**
   * Parse tracking ID to extract components
   * 
   * @param {string} trackingId - Tracking ID like "TRK-ABC12-001234"
   * @returns {object} { prefix, customerHash, sequence }
   */
  static parseTrackingId(trackingId) {
    if (!trackingId) return null;

    const parts = trackingId.split('-');
    if (parts.length !== 3) return null;

    return {
      prefix: parts[0],
      customerHash: parts[1],
      sequence: parseInt(parts[2], 10)
    };
  }

  /**
   * Find email by tracking ID
   * 
   * @param {string} trackingId - Tracking ID to search
   * @param {string} tenantId - Tenant ID for filtering
   * @returns {Promise<object>} Email document or null
   */
  static async findEmailByTrackingId(trackingId, tenantId) {
    if (!trackingId) return null;

    const EmailLog = require('../models/EmailLog');

    try {
      const email = await EmailLog.findOne({
        trackingId: trackingId,
        tenantId: tenantId
      });

      return email;
    } catch (error) {
      console.error('Error finding email by tracking ID:', error);
      return null;
    }
  }

  /**
   * Extract tracking ID from email and find parent
   * This is used as a fallback when headers don't provide threading info
   * 
   * @param {object} parsedEmail - Parsed email object with bodyText/bodyHtml
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<object>} Parent email or null
   */
  static async findParentByTrackingId(parsedEmail, tenantId) {
    try {
      // Try to extract tracking ID from body
      const bodyText = parsedEmail.bodyText || parsedEmail.text || '';
      const bodyHtml = parsedEmail.bodyHtml || parsedEmail.html || '';
      
      // Try both HTML and text
      let trackingId = this.extractTrackingId(bodyHtml);
      if (!trackingId) {
        trackingId = this.extractTrackingId(bodyText);
      }

      if (!trackingId) {
        console.log('   No tracking ID found in email body');
        return null;
      }

      console.log(`   Found tracking ID in body: ${trackingId}`);

      // Validate format
      if (!this.isValidTrackingId(trackingId)) {
        console.log(`   Invalid tracking ID format: ${trackingId}`);
        return null;
      }

      // Find parent email
      const parentEmail = await this.findEmailByTrackingId(trackingId, tenantId);

      if (parentEmail) {
        console.log(`   ✅ Found parent by tracking ID: ${parentEmail._id}`);
        return parentEmail;
      } else {
        console.log(`   ⚠️  No parent found for tracking ID: ${trackingId}`);
        return null;
      }

    } catch (error) {
      console.error('Error finding parent by tracking ID:', error);
      return null;
    }
  }
}

module.exports = EmailTrackingService;
