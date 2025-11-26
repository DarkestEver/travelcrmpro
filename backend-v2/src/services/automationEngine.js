const AutomationRule = require('../models/AutomationRule');
const emailService = require('./emailService');
const User = require('../models/User');
const Query = require('../models/Query');
const logger = require('../lib/logger');

class AutomationEngine {
  /**
   * Execute automation rules for a given event
   * @param {String} eventName - Event that triggered automation
   * @param {Object} eventData - Data associated with the event
   * @param {ObjectId} tenantId - Tenant ID
   */
  async executeRules(eventName, eventData, tenantId) {
    try {
      // Find all active rules for this event and tenant
      const rules = await AutomationRule.find({
        tenant: tenantId,
        isActive: true,
        'trigger.event': eventName,
      });

      logger.info(`Found ${rules.length} automation rules for event ${eventName}`);

      // Execute each matching rule
      const results = [];
      for (const rule of rules) {
        try {
          const shouldExecute = rule.shouldExecute(eventData);

          if (shouldExecute) {
            logger.info(`Executing automation rule: ${rule.name}`);
            const result = await this.executeActions(rule, eventData);
            await rule.recordExecution(true);
            results.push({ rule: rule.name, success: true, result });
          }
        } catch (error) {
          logger.error(`Failed to execute automation rule ${rule.name}:`, error);
          await rule.recordExecution(false);
          results.push({ rule: rule.name, success: false, error: error.message });
        }
      }

      return results;
    } catch (error) {
      logger.error('Automation engine error:', error);
      throw error;
    }
  }

  /**
   * Execute all actions for a rule
   * @param {AutomationRule} rule - The automation rule
   * @param {Object} eventData - Event data for variable substitution
   */
  async executeActions(rule, eventData) {
    const actionResults = [];

    for (const action of rule.actions) {
      try {
        let result;

        switch (action.actionType) {
          case 'send_email':
            result = await this.sendEmail(action, eventData, rule.tenant);
            break;

          case 'assign_query':
            result = await this.assignQuery(action, eventData, rule.tenant);
            break;

          case 'update_status':
            result = await this.updateStatus(action, eventData);
            break;

          case 'escalate':
            result = await this.escalateQuery(action, eventData, rule.tenant);
            break;

          case 'update_field':
            result = await this.updateField(action, eventData);
            break;

          case 'notify_user':
            result = await this.notifyUser(action, eventData);
            break;

          default:
            logger.warn(`Unknown action type: ${action.actionType}`);
            result = { success: false, message: 'Unknown action type' };
        }

        actionResults.push({ action: action.actionType, result });
      } catch (error) {
        logger.error(`Action ${action.actionType} failed:`, error);
        actionResults.push({ action: action.actionType, error: error.message });
      }
    }

    return actionResults;
  }

  /**
   * Send email action
   */
  async sendEmail(action, eventData, tenantId) {
    const { config } = action;
    const toEmail = this.getFieldValue(eventData, config.toField);

    if (!toEmail) {
      throw new Error('Recipient email not found');
    }

    // Get email template if specified
    let emailContent;
    if (config.emailTemplate) {
      // TODO: Load template and substitute variables
      emailContent = await this.loadEmailTemplate(config.emailTemplate, eventData);
    }

    await emailService.sendEmail({
      to: toEmail,
      cc: config.ccEmails,
      bcc: config.bccEmails,
      subject: emailContent?.subject || 'Automated notification',
      html: emailContent?.html || 'Automated notification',
      tenant: tenantId,
    });

    return { success: true, to: toEmail };
  }

  /**
   * Assign query action
   */
  async assignQuery(action, eventData, tenantId) {
    const { config } = action;
    const queryId = eventData._id || eventData.id;

    if (!queryId) {
      throw new Error('Query ID not found in event data');
    }

    let assigneeId;

    if (config.assignmentMethod === 'specific_user') {
      assigneeId = config.assignTo;
    } else if (config.assignmentMethod === 'round_robin') {
      assigneeId = await this.getRoundRobinAgent(tenantId);
    } else if (config.assignmentMethod === 'workload') {
      assigneeId = await this.getLowestWorkloadAgent(tenantId);
    }

    if (!assigneeId) {
      throw new Error('No assignee found');
    }

    const query = await Query.findByIdAndUpdate(
      queryId,
      {
        assignedTo: assigneeId,
        status: 'assigned',
      },
      { new: true }
    );

    return { success: true, query: query._id, assignedTo: assigneeId };
  }

  /**
   * Update status action
   */
  async updateStatus(action, eventData) {
    const { config } = action;
    const documentId = eventData._id || eventData.id;

    // Determine model type from event data
    const Model = this.getModelFromEventData(eventData);

    await Model.findByIdAndUpdate(documentId, {
      status: config.newStatus,
    });

    return { success: true, newStatus: config.newStatus };
  }

  /**
   * Escalate query action
   */
  async escalateQuery(action, eventData, tenantId) {
    const { config } = action;
    const queryId = eventData._id || eventData.id;

    const query = await Query.findById(queryId);
    if (!query) {
      throw new Error('Query not found');
    }

    // Increment escalation level
    const newLevel = (query.escalationLevel || 0) + 1;

    await query.updateOne({
      escalationLevel: newLevel,
      escalatedTo: config.escalateTo,
      escalatedAt: new Date(),
    });

    // Send notification to escalation recipient
    if (config.escalateTo) {
      await this.notifyUser(
        {
          config: {
            notificationMessage: `Query ${query.queryNumber} has been escalated to level ${newLevel}`,
            userId: config.escalateTo,
          },
        },
        eventData
      );
    }

    return { success: true, escalationLevel: newLevel };
  }

  /**
   * Update field action
   */
  async updateField(action, eventData) {
    const { config } = action;
    const documentId = eventData._id || eventData.id;

    const Model = this.getModelFromEventData(eventData);

    await Model.findByIdAndUpdate(documentId, {
      [config.fieldName]: config.fieldValue,
    });

    return { success: true, field: config.fieldName, value: config.fieldValue };
  }

  /**
   * Notify user action
   */
  async notifyUser(action, eventData) {
    const { config } = action;

    // TODO: Implement notification system
    logger.info(`Notification: ${config.notificationMessage}`);

    return { success: true, message: config.notificationMessage };
  }

  /**
   * Helper: Get field value from nested object
   */
  getFieldValue(obj, fieldPath) {
    if (!fieldPath) return null;

    return fieldPath.split('.').reduce((current, key) => {
      return current?.[key];
    }, obj);
  }

  /**
   * Helper: Get model from event data
   */
  getModelFromEventData(eventData) {
    if (eventData.queryNumber) return Query;
    // Add more model mappings as needed
    throw new Error('Could not determine model type');
  }

  /**
   * Helper: Get round-robin agent
   */
  async getRoundRobinAgent(tenantId) {
    // TODO: Implement round-robin logic with AgentAvailability
    const agents = await User.find({
      tenant: tenantId,
      role: 'agent',
      isActive: true,
    }).sort('lastAssignedAt');

    return agents[0]?._id;
  }

  /**
   * Helper: Get agent with lowest workload
   */
  async getLowestWorkloadAgent(tenantId) {
    // TODO: Implement workload-based assignment with AgentAvailability
    const agents = await User.find({
      tenant: tenantId,
      role: 'agent',
      isActive: true,
    }).limit(1);

    return agents[0]?._id;
  }

  /**
   * Helper: Load email template
   */
  async loadEmailTemplate(templateId, eventData) {
    // TODO: Implement template loading and variable substitution
    return {
      subject: 'Automated Email',
      html: '<p>This is an automated email</p>',
    };
  }
}

module.exports = new AutomationEngine();
