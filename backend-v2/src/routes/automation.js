const express = require('express');
const router = express.Router();
const automationController = require('../controllers/automationController');
const campaignController = require('../controllers/campaignController');
const { validate, validateQuery } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');
const { USER_ROLES } = require('../config/constants');
const {
  createAutomationRuleSchema,
  updateAutomationRuleSchema,
  testAutomationRuleSchema,
  getAutomationRulesSchema,
  createCampaignSchema,
  updateCampaignSchema,
  getCampaignsSchema,
} = require('../validation/automationSchemas');

// Apply authentication to all automation routes
router.use(authenticate);

// Automation rules require admin/operator role
const adminOnly = checkRole(USER_ROLES.TENANT_ADMIN, USER_ROLES.OPERATOR);

/**
 * Automation Rules
 */
router.get(
  '/rules',
  adminOnly,
  validateQuery(getAutomationRulesSchema),
  automationController.getAllRules
);

router.get('/rules/:id', adminOnly, automationController.getRuleById);

router.post(
  '/rules',
  adminOnly,
  validate(createAutomationRuleSchema),
  automationController.createRule
);

router.patch(
  '/rules/:id',
  adminOnly,
  validate(updateAutomationRuleSchema),
  automationController.updateRule
);

router.delete('/rules/:id', adminOnly, automationController.deleteRule);

router.patch('/rules/:id/toggle', adminOnly, automationController.toggleRule);

router.post(
  '/rules/:id/test',
  adminOnly,
  validate(testAutomationRuleSchema),
  automationController.testRule
);

router.get('/rules/:id/stats', adminOnly, automationController.getRuleStats);

/**
 * Campaigns
 */
router.get(
  '/campaigns',
  adminOnly,
  validateQuery(getCampaignsSchema),
  campaignController.getAllCampaigns
);

router.get('/campaigns/:id', adminOnly, campaignController.getCampaignById);

router.post(
  '/campaigns',
  adminOnly,
  validate(createCampaignSchema),
  campaignController.createCampaign
);

router.patch(
  '/campaigns/:id',
  adminOnly,
  validate(updateCampaignSchema),
  campaignController.updateCampaign
);

router.delete('/campaigns/:id', adminOnly, campaignController.deleteCampaign);

router.post('/campaigns/:id/start', adminOnly, campaignController.startCampaign);

router.post('/campaigns/:id/pause', adminOnly, campaignController.pauseCampaign);

router.post('/campaigns/:id/resume', adminOnly, campaignController.resumeCampaign);

router.post('/campaigns/:id/cancel', adminOnly, campaignController.cancelCampaign);

router.get('/campaigns/:id/analytics', adminOnly, campaignController.getCampaignAnalytics);

module.exports = router;
