const Query = require('../models/Query');
const AutomationRule = require('../models/AutomationRule');
const automationEngine = require('../services/automationEngine');
const logger = require('../lib/logger');

/**
 * SLA Escalation Job
 * Runs every hour to check for SLA breaches and escalate queries
 * 
 * Escalation Levels:
 * - Level 1: 60 minutes (1 hour) - Agent's manager
 * - Level 2: 120 minutes (2 hours) - Department head
 * - Level 3: 240 minutes (4 hours) - Operations manager
 * - Level 4: 480 minutes (8 hours) - Tenant admin
 */
async function slaEscalationJob(tenantId) {
  try {
    logger.info(`[SLA Escalation] Starting job for tenant ${tenantId}`);

    const now = new Date();
    
    // Get escalation thresholds from environment or use defaults
    const escalationLevels = [
      { level: 1, minutes: parseInt(process.env.SLA_ESCALATION_LEVEL1_MINUTES) || 60 },
      { level: 2, minutes: parseInt(process.env.SLA_ESCALATION_LEVEL2_MINUTES) || 120 },
      { level: 3, minutes: parseInt(process.env.SLA_ESCALATION_LEVEL3_MINUTES) || 240 },
      { level: 4, minutes: parseInt(process.env.SLA_ESCALATION_LEVEL4_MINUTES) || 480 },
    ];

    let totalEscalated = 0;

    // Check each escalation level
    for (const { level, minutes } of escalationLevels) {
      const thresholdTime = new Date(now - minutes * 60 * 1000);

      // Find queries that have breached this SLA level
      const queriesToEscalate = await Query.find({
        tenant: tenantId,
        status: { $in: ['pending', 'assigned', 'in_progress'] },
        sla: {
          $elemMatch: {
            deadline: { $lte: now },
            breached: false,
          },
        },
        $or: [
          { escalationLevel: { $exists: false } },
          { escalationLevel: { $lt: level } },
        ],
        createdAt: { $lte: thresholdTime },
      });

      logger.info(`[SLA Escalation] Found ${queriesToEscalate.length} queries for level ${level}`);

      // Escalate each query
      for (const query of queriesToEscalate) {
        try {
          // Mark SLA as breached
          query.sla.forEach((s) => {
            if (s.deadline <= now && !s.breached) {
              s.breached = true;
              s.breachedAt = now;
            }
          });

          // Update escalation level
          query.escalationLevel = level;
          query.escalatedAt = now;

          await query.save();

          // Trigger automation rules for escalation
          await automationEngine.executeRules(
            'sla_breached',
            {
              ...query.toObject(),
              escalationLevel: level,
            },
            tenantId
          );

          totalEscalated++;
          logger.info(`[SLA Escalation] Escalated query ${query.queryNumber} to level ${level}`);
        } catch (error) {
          logger.error(`[SLA Escalation] Failed to escalate query ${query.queryNumber}:`, error);
        }
      }
    }

    logger.info(`[SLA Escalation] Completed. Total escalated: ${totalEscalated}`);

    return {
      success: true,
      totalEscalated,
      timestamp: new Date(),
    };
  } catch (error) {
    logger.error('[SLA Escalation] Job failed:', error);
    throw error;
  }
}

module.exports = slaEscalationJob;
