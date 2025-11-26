const Campaign = require('../models/Campaign');
const { NotFoundError, BadRequestError } = require('../lib/errors');

/**
 * Get all campaigns
 * GET /automation/campaigns
 */
exports.getAllCampaigns = async (req, res, next) => {
  try {
    const { campaignType, status, page = 1, limit = 20 } = req.query;

    const query = {
      tenant: req.user.tenant,
    };

    if (campaignType) query.campaignType = campaignType;
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [campaigns, totalCount] = await Promise.all([
      Campaign.find(query)
        .populate('createdBy', 'firstName lastName email')
        .populate('content.emailTemplate')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Campaign.countDocuments(query),
    ]);

    // Add metrics to each campaign
    const campaignsWithMetrics = campaigns.map((campaign) => {
      const metrics = Campaign.prototype.getMetrics.call({ stats: campaign.stats });
      return {
        ...campaign,
        metrics,
      };
    });

    res.json({
      success: true,
      data: {
        campaigns: campaignsWithMetrics,
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
 * Get campaign by ID
 * GET /automation/campaigns/:id
 */
exports.getCampaignById = async (req, res, next) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    })
      .populate('createdBy', 'firstName lastName email')
      .populate('content.emailTemplate');

    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    const metrics = campaign.getMetrics();

    res.json({
      success: true,
      data: {
        ...campaign.toObject(),
        metrics,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create campaign
 * POST /automation/campaigns
 */
exports.createCampaign = async (req, res, next) => {
  try {
    const campaignData = {
      ...req.body,
      tenant: req.user.tenant,
      createdBy: req.user._id,
    };

    const campaign = await Campaign.create(campaignData);

    res.status(201).json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update campaign
 * PATCH /automation/campaigns/:id
 */
exports.updateCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    });

    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    // Prevent editing running campaigns
    if (campaign.status === 'running') {
      throw new BadRequestError('Cannot edit a running campaign. Pause it first.');
    }

    const updateData = {
      ...req.body,
      updatedBy: req.user._id,
    };

    Object.assign(campaign, updateData);
    await campaign.save();

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete campaign
 * DELETE /automation/campaigns/:id
 */
exports.deleteCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    });

    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    // Only allow deletion of draft or completed campaigns
    if (!['draft', 'completed', 'cancelled'].includes(campaign.status)) {
      throw new BadRequestError('Can only delete draft, completed, or cancelled campaigns');
    }

    await campaign.deleteOne();

    res.json({
      success: true,
      message: 'Campaign deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Start campaign
 * POST /automation/campaigns/:id/start
 */
exports.startCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    });

    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
      throw new BadRequestError('Can only start draft or scheduled campaigns');
    }

    campaign.status = 'running';
    campaign.updatedBy = req.user._id;
    await campaign.save();

    // TODO: Queue campaign execution job

    res.json({
      success: true,
      data: campaign,
      message: 'Campaign started successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Pause campaign
 * POST /automation/campaigns/:id/pause
 */
exports.pauseCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    });

    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    if (campaign.status !== 'running') {
      throw new BadRequestError('Can only pause running campaigns');
    }

    campaign.status = 'paused';
    campaign.updatedBy = req.user._id;
    await campaign.save();

    res.json({
      success: true,
      data: campaign,
      message: 'Campaign paused successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resume campaign
 * POST /automation/campaigns/:id/resume
 */
exports.resumeCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    });

    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    if (campaign.status !== 'paused') {
      throw new BadRequestError('Can only resume paused campaigns');
    }

    campaign.status = 'running';
    campaign.updatedBy = req.user._id;
    await campaign.save();

    res.json({
      success: true,
      data: campaign,
      message: 'Campaign resumed successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel campaign
 * POST /automation/campaigns/:id/cancel
 */
exports.cancelCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    });

    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    if (['completed', 'cancelled'].includes(campaign.status)) {
      throw new BadRequestError('Campaign is already completed or cancelled');
    }

    campaign.status = 'cancelled';
    campaign.updatedBy = req.user._id;
    await campaign.save();

    res.json({
      success: true,
      data: campaign,
      message: 'Campaign cancelled successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get campaign analytics
 * GET /automation/campaigns/:id/analytics
 */
exports.getCampaignAnalytics = async (req, res, next) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    });

    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    const metrics = campaign.getMetrics();

    res.json({
      success: true,
      data: {
        campaignId: campaign._id,
        campaignName: campaign.name,
        campaignType: campaign.campaignType,
        status: campaign.status,
        stats: campaign.stats,
        metrics,
        lastRunAt: campaign.lastRunAt,
        nextRunAt: campaign.nextRunAt,
      },
    });
  } catch (error) {
    next(error);
  }
};
