const mongoose = require('mongoose');
const Review = require('../models/Review');
const ReviewVote = require('../models/ReviewVote');
const Booking = require('../models/Booking');
const Supplier = require('../models/Supplier');
const User = require('../models/User');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../lib/errors');

/**
 * Submit booking review
 * POST /reviews/booking/:bookingId
 */
exports.submitBookingReview = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const {
      overallRating,
      ratings,
      title,
      reviewText,
      photos,
      pros,
      cons,
      highlights,
      wouldRecommend,
      tripDate,
      tripDuration,
      traveledWith,
    } = req.body;

    // Verify booking exists and belongs to customer
    const booking = await Booking.findOne({
      _id: bookingId,
      tenant: req.user.tenant,
    });

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // Check if booking is completed
    if (booking.status !== 'completed') {
      throw new BadRequestError('Can only review completed bookings');
    }

    // Check for existing review
    const existingReview = await Review.findOne({
      booking: bookingId,
      customer: req.user._id,
      tenant: req.user.tenant,
    });

    if (existingReview) {
      throw new BadRequestError('You have already reviewed this booking');
    }

    const review = await Review.create({
      tenant: req.user.tenant,
      reviewType: 'booking',
      booking: bookingId,
      customer: req.user._id,
      overallRating,
      ratings,
      title,
      reviewText,
      photos,
      pros,
      cons,
      highlights,
      wouldRecommend,
      tripDate,
      tripDuration,
      traveledWith,
      createdBy: req.user._id,
      isVerified: true, // Auto-verify since from confirmed booking
      verifiedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      data: review,
      message: 'Review submitted successfully. It will be published after moderation.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit supplier review
 * POST /reviews/supplier/:supplierId
 */
exports.submitSupplierReview = async (req, res, next) => {
  try {
    const { supplierId } = req.params;
    const { overallRating, title, reviewText } = req.body;

    const supplier = await Supplier.findOne({
      _id: supplierId,
      tenant: req.user.tenant,
    });

    if (!supplier) {
      throw new NotFoundError('Supplier not found');
    }

    // Check for existing review
    const existingReview = await Review.findOne({
      supplier: supplierId,
      customer: req.user._id,
      tenant: req.user.tenant,
    });

    if (existingReview) {
      throw new BadRequestError('You have already reviewed this supplier');
    }

    const review = await Review.create({
      tenant: req.user.tenant,
      reviewType: 'supplier',
      supplier: supplierId,
      customer: req.user._id,
      overallRating,
      title,
      reviewText,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: review,
      message: 'Supplier review submitted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit agent review
 * POST /reviews/agent/:agentId
 */
exports.submitAgentReview = async (req, res, next) => {
  try {
    const { agentId } = req.params;
    const { overallRating, ratings, title, reviewText } = req.body;

    const agent = await User.findOne({
      _id: agentId,
      tenant: req.user.tenant,
      role: 'agent',
    });

    if (!agent) {
      throw new NotFoundError('Agent not found');
    }

    // Check for existing review
    const existingReview = await Review.findOne({
      agent: agentId,
      customer: req.user._id,
      tenant: req.user.tenant,
    });

    if (existingReview) {
      throw new BadRequestError('You have already reviewed this agent');
    }

    const review = await Review.create({
      tenant: req.user.tenant,
      reviewType: 'agent',
      agent: agentId,
      customer: req.user._id,
      overallRating,
      ratings: {
        responsiveness: ratings?.responsiveness,
        professionalism: ratings?.professionalism,
        knowledge: ratings?.knowledge,
      },
      title,
      reviewText,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: review,
      message: 'Agent review submitted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all reviews
 * GET /reviews
 */
exports.getAllReviews = async (req, res, next) => {
  try {
    const { reviewType, status, isFeatured, page = 1, limit = 20, sortBy = '-createdAt' } = req.query;

    const query = {
      tenant: req.user.tenant,
    };

    if (reviewType) query.reviewType = reviewType;
    if (status) query.status = status;
    if (isFeatured !== undefined) query.isFeatured = isFeatured === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, totalCount] = await Promise.all([
      Review.find(query)
        .populate('customer', 'firstName lastName email')
        .populate('booking', 'bookingNumber destination')
        .populate('supplier', 'name')
        .populate('agent', 'firstName lastName')
        .populate('moderatedBy', 'firstName lastName')
        .sort(sortBy)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Review.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        reviews,
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
 * Get review by ID
 * GET /reviews/:id
 */
exports.getReviewById = async (req, res, next) => {
  try {
    const review = await Review.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    })
      .populate('customer', 'firstName lastName email')
      .populate('booking', 'bookingNumber destination')
      .populate('supplier', 'name')
      .populate('agent', 'firstName lastName')
      .populate('moderatedBy', 'firstName lastName');

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    res.json({
      success: true,
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update review (before moderation)
 * PATCH /reviews/:id
 */
exports.updateReview = async (req, res, next) => {
  try {
    const review = await Review.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
      customer: req.user._id,
    });

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    if (review.status !== 'pending') {
      throw new BadRequestError('Cannot edit review after moderation');
    }

    const allowedFields = ['overallRating', 'ratings', 'title', 'reviewText', 'photos', 'pros', 'cons', 'highlights', 'wouldRecommend'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        review[field] = req.body[field];
      }
    });

    review.updatedBy = req.user._id;
    await review.save();

    res.json({
      success: true,
      data: review,
      message: 'Review updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete review (only if pending)
 * DELETE /reviews/:id
 */
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
      customer: req.user._id,
    });

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    if (review.status !== 'pending') {
      throw new BadRequestError('Cannot delete review after moderation');
    }

    await review.deleteOne();

    res.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve review (Admin/Manager)
 * POST /reviews/:id/approve
 */
exports.approveReview = async (req, res, next) => {
  try {
    const review = await Review.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    });

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    review.approve(req.user._id);
    await review.save();

    res.json({
      success: true,
      data: review,
      message: 'Review approved and published',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject review (Admin/Manager)
 * POST /reviews/:id/reject
 */
exports.rejectReview = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const review = await Review.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    });

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    review.reject(req.user._id, reason);
    await review.save();

    res.json({
      success: true,
      data: review,
      message: 'Review rejected',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Flag review (Admin/Manager)
 * POST /reviews/:id/flag
 */
exports.flagReview = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const review = await Review.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    });

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    review.flag(req.user._id, reason);
    await review.save();

    res.json({
      success: true,
      data: review,
      message: 'Review flagged for manual review',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Feature review (Admin/Manager)
 * POST /reviews/:id/feature
 */
exports.featureReview = async (req, res, next) => {
  try {
    const review = await Review.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    });

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    review.feature();
    await review.save();

    res.json({
      success: true,
      data: review,
      message: 'Review featured',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Unfeature review (Admin/Manager)
 * POST /reviews/:id/unfeature
 */
exports.unfeatureReview = async (req, res, next) => {
  try {
    const review = await Review.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    });

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    review.unfeature();
    await review.save();

    res.json({
      success: true,
      data: review,
      message: 'Review unfeatured',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add business response
 * POST /reviews/:id/respond
 */
exports.respondToReview = async (req, res, next) => {
  try {
    const { text } = req.body;

    const review = await Review.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    });

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    review.addResponse(req.user._id, text);
    await review.save();

    res.json({
      success: true,
      data: review,
      message: 'Response added successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update response
 * PATCH /reviews/:id/response
 */
exports.updateResponse = async (req, res, next) => {
  try {
    const { text } = req.body;

    const review = await Review.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    });

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    if (!review.response) {
      throw new BadRequestError('No response exists to update');
    }

    review.response.text = text;
    review.response.respondedAt = new Date();
    await review.save();

    res.json({
      success: true,
      data: review,
      message: 'Response updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete response
 * DELETE /reviews/:id/response
 */
exports.deleteResponse = async (req, res, next) => {
  try {
    const review = await Review.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    });

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    review.response = undefined;
    await review.save();

    res.json({
      success: true,
      message: 'Response deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Vote helpful
 * POST /reviews/:id/vote/helpful
 */
exports.voteHelpful = async (req, res, next) => {
  try {
    const review = await Review.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    });

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    // Check for existing vote
    const existingVote = await ReviewVote.findOne({
      review: req.params.id,
      user: req.user._id,
    });

    if (existingVote) {
      if (existingVote.voteType === 'helpful') {
        throw new BadRequestError('You have already voted this review as helpful');
      }
      // Change vote from unhelpful to helpful
      review.unhelpfulCount = Math.max(0, review.unhelpfulCount - 1);
      review.helpfulCount += 1;
      existingVote.voteType = 'helpful';
      await existingVote.save();
    } else {
      // New vote
      review.helpfulCount += 1;
      await ReviewVote.create({
        review: req.params.id,
        user: req.user._id,
        voteType: 'helpful',
      });
    }

    await review.save();

    res.json({
      success: true,
      data: {
        helpfulCount: review.helpfulCount,
        unhelpfulCount: review.unhelpfulCount,
      },
      message: 'Vote recorded',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Vote unhelpful
 * POST /reviews/:id/vote/unhelpful
 */
exports.voteUnhelpful = async (req, res, next) => {
  try {
    const review = await Review.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    });

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    // Check for existing vote
    const existingVote = await ReviewVote.findOne({
      review: req.params.id,
      user: req.user._id,
    });

    if (existingVote) {
      if (existingVote.voteType === 'unhelpful') {
        throw new BadRequestError('You have already voted this review as unhelpful');
      }
      // Change vote from helpful to unhelpful
      review.helpfulCount = Math.max(0, review.helpfulCount - 1);
      review.unhelpfulCount += 1;
      existingVote.voteType = 'unhelpful';
      await existingVote.save();
    } else {
      // New vote
      review.unhelpfulCount += 1;
      await ReviewVote.create({
        review: req.params.id,
        user: req.user._id,
        voteType: 'unhelpful',
      });
    }

    await review.save();

    res.json({
      success: true,
      data: {
        helpfulCount: review.helpfulCount,
        unhelpfulCount: review.unhelpfulCount,
      },
      message: 'Vote recorded',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get review statistics
 * GET /reviews/stats
 */
exports.getReviewStats = async (req, res, next) => {
  try {
    const stats = await Review.aggregate([
      {
        $match: { tenant: req.user.tenant },
      },
      {
        $facet: {
          byStatus: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
              },
            },
          ],
          byRating: [
            {
              $group: {
                _id: '$overallRating',
                count: { $sum: 1 },
              },
            },
          ],
          overall: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                avgRating: { $avg: '$overallRating' },
                withResponse: {
                  $sum: {
                    $cond: [{ $ifNull: ['$response.text', false] }, 1, 0],
                  },
                },
              },
            },
          ],
        },
      },
    ]);

    const result = stats[0];
    const overall = result.overall[0] || { total: 0, avgRating: 0, withResponse: 0 };

    const byStatus = {};
    result.byStatus.forEach(item => {
      byStatus[item._id] = item.count;
    });

    const byRating = {};
    result.byRating.forEach(item => {
      byRating[item._id] = item.count;
    });

    res.json({
      success: true,
      data: {
        total: overall.total,
        avgRating: Math.round(overall.avgRating * 10) / 10,
        responseRate: overall.total > 0 ? Math.round((overall.withResponse / overall.total) * 100) : 0,
        byStatus,
        byRating,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get public reviews for booking
 * GET /public/reviews/bookings/:bookingId
 */
exports.getPublicBookingReviews = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { page = 1, limit = 10, sortBy = '-publishedAt' } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, totalCount] = await Promise.all([
      Review.find({
        booking: bookingId,
        status: 'approved',
        isPublic: true,
      })
        .populate('customer', 'firstName lastName')
        .select('-tenant -moderatedBy -rejectionReason')
        .sort(sortBy)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Review.countDocuments({
        booking: bookingId,
        status: 'approved',
        isPublic: true,
      }),
    ]);

    res.json({
      success: true,
      data: {
        reviews,
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
 * Get public reviews for supplier
 * GET /public/reviews/suppliers/:supplierId
 */
exports.getPublicSupplierReviews = async (req, res, next) => {
  try {
    const { supplierId } = req.params;
    const { page = 1, limit = 10, sortBy = '-publishedAt' } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, totalCount, avgRating] = await Promise.all([
      Review.find({
        supplier: supplierId,
        status: 'approved',
        isPublic: true,
      })
        .populate('customer', 'firstName lastName')
        .select('-tenant -moderatedBy -rejectionReason')
        .sort(sortBy)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Review.countDocuments({
        supplier: supplierId,
        status: 'approved',
        isPublic: true,
      }),
      Review.aggregate([
        {
          $match: {
            supplier: mongoose.Types.ObjectId(supplierId),
            status: 'approved',
          },
        },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$overallRating' },
          },
        },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        reviews,
        avgRating: avgRating[0]?.avgRating || 0,
        totalReviews: totalCount,
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
 * Get public reviews for agent
 * GET /public/reviews/agents/:agentId
 */
exports.getPublicAgentReviews = async (req, res, next) => {
  try {
    const { agentId } = req.params;
    const { page = 1, limit = 10, sortBy = '-publishedAt' } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, totalCount, stats] = await Promise.all([
      Review.find({
        agent: agentId,
        status: 'approved',
        isPublic: true,
      })
        .populate('customer', 'firstName lastName')
        .select('-tenant -moderatedBy -rejectionReason')
        .sort(sortBy)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Review.countDocuments({
        agent: agentId,
        status: 'approved',
        isPublic: true,
      }),
      Review.aggregate([
        {
          $match: {
            agent: mongoose.Types.ObjectId(agentId),
            status: 'approved',
          },
        },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$overallRating' },
            avgResponsiveness: { $avg: '$ratings.responsiveness' },
            avgProfessionalism: { $avg: '$ratings.professionalism' },
            avgKnowledge: { $avg: '$ratings.knowledge' },
          },
        },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        reviews,
        avgRating: stats[0]?.avgRating || 0,
        ratings: {
          responsiveness: stats[0]?.avgResponsiveness || 0,
          professionalism: stats[0]?.avgProfessionalism || 0,
          knowledge: stats[0]?.avgKnowledge || 0,
        },
        totalReviews: totalCount,
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
 * Get featured reviews
 * GET /public/reviews/featured
 */
exports.getFeaturedReviews = async (req, res, next) => {
  try {
    const { limit = 5 } = req.query;

    const reviews = await Review.find({
      status: 'approved',
      isPublic: true,
      isFeatured: true,
    })
      .populate('customer', 'firstName lastName')
      .populate('booking', 'destination')
      .select('-tenant -moderatedBy -rejectionReason')
      .sort('-featuredAt')
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
