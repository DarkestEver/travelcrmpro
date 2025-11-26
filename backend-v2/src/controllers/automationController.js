const AutomationRule = require('../models/AutomationRule');
const automationEngine = require('../services/automationEngine');
const { NotFoundError, BadRequestError } = require('../lib/errors');

/**
 * Get all automation rules
 * GET /automation/rules
 */
exports.getAllRules = async (req, res, next) => {
  try {
    const { ruleType, isActive, page = 1, limit = 20 } = req.query;

    const query = {
      tenant: req.user.tenant,
    };

    if (ruleType) query.ruleType = ruleType;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [rules, totalCount] = await Promise.all([
      AutomationRule.find(query)
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      AutomationRule.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        rules,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          pages: Math.ceil(totalCount / parseInt(limit)),
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get automation rule by ID
 * GET /automation/rules/:id
 */
exports.getRuleById = async (req, res, next) => {
  try {
    const rule = await AutomationRule.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    })
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!rule) {
      throw new NotFoundError('Automation rule not found');
    }

    res.json({
      success: true,
      data: rule,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create automation rule
 * POST /automation/rules
 */
exports.createRule = async (req, res, next) => {
  try {
    const ruleData = {
      ...req.body,
      tenant: req.user.tenant,
      createdBy: req.user._id,
    };

    const rule = await AutomationRule.create(ruleData);

    res.status(201).json({
      success: true,
      data: rule,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update automation rule
 * PATCH /automation/rules/:id
 */
exports.updateRule = async (req, res, next) => {
  try {
    const rule = await AutomationRule.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    });

    if (!rule) {
      throw new NotFoundError('Automation rule not found');
    }

    const updateData = {
      ...req.body,
      updatedBy: req.user._id,
    };

    Object.assign(rule, updateData);
    await rule.save();

    res.json({
      success: true,
      data: rule,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete automation rule
 * DELETE /automation/rules/:id
 */
exports.deleteRule = async (req, res, next) => {
  try {
    const rule = await AutomationRule.findOneAndDelete({
      _id: req.params.id,
      tenant: req.user.tenant,
    });

    if (!rule) {
      throw new NotFoundError('Automation rule not found');
    }

    res.json({
      success: true,
      message: 'Automation rule deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle automation rule active status
 * PATCH /automation/rules/:id/toggle
 */
exports.toggleRule = async (req, res, next) => {
  try {
    const rule = await AutomationRule.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    });

    if (!rule) {
      throw new NotFoundError('Automation rule not found');
    }

    rule.isActive = !rule.isActive;
    rule.updatedBy = req.user._id;
    await rule.save();

    res.json({
      success: true,
      data: {
        isActive: rule.isActive,
      },
      message: `Automation rule ${rule.isActive ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Test automation rule (dry run)
 * POST /automation/rules/:id/test
 */
exports.testRule = async (req, res, next) => {
  try {
    const rule = await AutomationRule.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    });

    if (!rule) {
      throw new NotFoundError('Automation rule not found');
    }

    const { testData } = req.body;

    if (!testData) {
      throw new BadRequestError('Test data is required');
    }

    // Check if rule should execute with test data
    const shouldExecute = rule.shouldExecute(testData);

    // If it should execute, simulate actions (don't actually execute)
    let simulatedResults = null;
    if (shouldExecute) {
      simulatedResults = rule.actions.map((action) => ({
        actionType: action.actionType,
        config: action.config,
        wouldExecute: true,
      }));
    }

    res.json({
      success: true,
      data: {
        ruleId: rule._id,
        ruleName: rule.name,
        shouldExecute,
        conditionsMatched: shouldExecute,
        simulatedResults,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get automation rule execution stats
 * GET /automation/rules/:id/stats
 */
exports.getRuleStats = async (req, res, next) => {
  try {
    const rule = await AutomationRule.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    });

    if (!rule) {
      throw new NotFoundError('Automation rule not found');
    }

    const successRate =
      rule.executionCount > 0 ? ((rule.successCount / rule.executionCount) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        ruleId: rule._id,
        ruleName: rule.name,
        executionCount: rule.executionCount,
        successCount: rule.successCount,
        failureCount: rule.failureCount,
        successRate: parseFloat(successRate),
        lastExecutedAt: rule.lastExecutedAt,
        isActive: rule.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};
