const Quote = require('../models/Quote');
const notificationService = require('./notificationService');

class SLACheckService {
  /**
   * Check for SLA breaches and send alerts
   * Should be run by cron job every hour
   */
  async checkSLABreaches() {
    try {
      console.log('🔍 Checking for SLA breaches...');

      // Find quotes that have passed their SLA deadline
      const overdueQuotes = await Quote.find({
        status: { 
          $in: [
            'pending_operator_review', 
            'awaiting_supplier_response',
            'incomplete_data',
            'manual_review_required'
          ] 
        },
        'sla.responseDeadline': { $lt: new Date() },
        'sla.breached': false
      }).populate('agentId', 'name email');

      if (overdueQuotes.length === 0) {
        console.log('✅ No SLA breaches found');
        return {
          success: true,
          breachCount: 0
        };
      }

      console.log(`⚠️  Found ${overdueQuotes.length} SLA breaches`);

      // Mark as breached and send notifications
      for (const quote of overdueQuotes) {
        quote.sla.breached = true;
        await quote.save();

        // Calculate how overdue it is
        const hoursOverdue = Math.floor(
          (Date.now() - quote.sla.responseDeadline.getTime()) / (1000 * 60 * 60)
        );

        // Create urgent notification
        await notificationService.createNotification({
          type: 'sla_breach',
          title: '🚨 Quote Response Overdue!',
          message: `Quote ${quote.quoteNumber} is ${hoursOverdue}h overdue - ${quote.destination}`,
          priority: 'urgent',
          tenantId: quote.tenantId,
          recipients: {
            roles: ['super_admin', 'manager'],
            specificUsers: quote.agentId ? [quote.agentId._id] : []
          },
          data: {
            quoteId: quote._id,
            quoteNumber: quote.quoteNumber,
            destination: quote.destination,
            customerEmail: quote.customerEmail,
            hoursOverdue,
            slaDeadline: quote.sla.responseDeadline
          }
        });

        // Add note to quote
        quote.notes.push({
          text: `SLA breach: ${hoursOverdue} hours overdue`,
          createdBy: 'system',
          createdAt: new Date()
        });
        await quote.save();

        console.log(`   ⚠️  ${quote.quoteNumber}: ${hoursOverdue}h overdue`);
      }

      console.log(`✅ Processed ${overdueQuotes.length} SLA breaches`);

      return {
        success: true,
        breachCount: overdueQuotes.length,
        breaches: overdueQuotes.map(q => ({
          quoteNumber: q.quoteNumber,
          destination: q.destination,
          customerEmail: q.customerEmail,
          deadline: q.sla.responseDeadline
        }))
      };
    } catch (error) {
      console.error('❌ Error checking SLA breaches:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send SLA reminder before deadline (4 hours before)
   * Should be run by cron job every hour
   */
  async sendSLAReminders() {
    try {
      console.log('⏰ Checking for upcoming SLA deadlines...');

      // Find quotes approaching deadline (next 4 hours)
      const fourHoursFromNow = new Date(Date.now() + 4 * 60 * 60 * 1000);
      const now = new Date();

      const upcomingQuotes = await Quote.find({
        status: { 
          $in: [
            'pending_operator_review', 
            'awaiting_supplier_response',
            'incomplete_data',
            'manual_review_required'
          ] 
        },
        'sla.responseDeadline': {
          $gte: now,
          $lte: fourHoursFromNow
        },
        'sla.reminderSent': false
      }).populate('agentId', 'name email');

      if (upcomingQuotes.length === 0) {
        console.log('✅ No upcoming SLA deadlines');
        return {
          success: true,
          reminderCount: 0
        };
      }

      console.log(`⏰ Found ${upcomingQuotes.length} upcoming deadlines`);

      // Send reminders
      for (const quote of upcomingQuotes) {
        quote.sla.reminderSent = true;
        await quote.save();

        // Calculate hours remaining
        const hoursRemaining = Math.floor(
          (quote.sla.responseDeadline.getTime() - Date.now()) / (1000 * 60 * 60)
        );

        // Create notification
        await notificationService.createNotification({
          type: 'sla_reminder',
          title: '⏰ Quote Deadline Approaching',
          message: `Quote ${quote.quoteNumber} due in ${hoursRemaining}h - ${quote.destination}`,
          priority: 'high',
          tenantId: quote.tenantId,
          recipients: {
            roles: ['operator', 'super_admin'],
            specificUsers: quote.agentId ? [quote.agentId._id] : []
          },
          data: {
            quoteId: quote._id,
            quoteNumber: quote.quoteNumber,
            destination: quote.destination,
            customerEmail: quote.customerEmail,
            hoursRemaining,
            slaDeadline: quote.sla.responseDeadline
          }
        });

        console.log(`   ⏰ ${quote.quoteNumber}: ${hoursRemaining}h remaining`);
      }

      console.log(`✅ Sent ${upcomingQuotes.length} SLA reminders`);

      return {
        success: true,
        reminderCount: upcomingQuotes.length,
        reminders: upcomingQuotes.map(q => ({
          quoteNumber: q.quoteNumber,
          destination: q.destination,
          deadline: q.sla.responseDeadline
        }))
      };
    } catch (error) {
      console.error('❌ Error sending SLA reminders:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Run both SLA checks (breaches and reminders)
   */
  async runSLACheck() {
    console.log('\n📊 Running SLA check...');
    
    const results = {
      timestamp: new Date(),
      breaches: await this.checkSLABreaches(),
      reminders: await this.sendSLAReminders()
    };

    console.log('✅ SLA check completed\n');
    
    return results;
  }
}

module.exports = new SLACheckService();
