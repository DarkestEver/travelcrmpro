# Phase 14: Reviews & Ratings System

**Status:** ❌ Not Started  
**Priority:** P2 (Medium - Trust Building)  
**Estimated Time:** 3-4 days  
**Dependencies:** Phase 5 (Bookings), Phase 12 (Customer Portal)

## Overview

Post-trip review system for customers, supplier ratings, agent performance ratings, review moderation, and featured testimonials for marketing.

## Database Models

### Review Schema (NEW - To Implement)

```javascript
// src/models/Review.js
const reviewSchema = new mongoose.Schema({
  tenant: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },

  // Review Type
  reviewType: {
    type: String,
    required: true,
    enum: ['booking', 'supplier', 'agent'],
    index: true,
  },

  // Subject of review
  booking: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
  },

  supplier: {
    type: Schema.Types.ObjectId,
    ref: 'Supplier',
  },

  agent: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },

  // Reviewer
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // Rating (1-5 stars)
  rating: {
    overall: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    // Booking-specific ratings
    valueForMoney: {
      type: Number,
      min: 1,
      max: 5,
    },

    accommodation: {
      type: Number,
      min: 1,
      max: 5,
    },

    transportation: {
      type: Number,
      min: 1,
      max: 5,
    },

    activities: {
      type: Number,
      min: 1,
      max: 5,
    },

    // Agent-specific ratings
    responsiveness: {
      type: Number,
      min: 1,
      max: 5,
    },

    professionalism: {
      type: Number,
      min: 1,
      max: 5,
    },

    knowledge: {
      type: Number,
      min: 1,
      max: 5,
    },
  },

  // Review content
  title: {
    type: String,
    maxlength: 200,
  },

  comment: {
    type: String,
    required: true,
    maxlength: 2000,
  },

  // Photos uploaded by customer
  photos: [{
    url: String,
    caption: String,
  }],

  // Pros and cons
  pros: [String],
  cons: [String],

  // Moderation
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'pending',
    index: true,
  },

  moderatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },

  moderatedAt: Date,

  rejectionReason: String,

  // Featured
  isFeatured: {
    type: Boolean,
    default: false,
    index: true,
  },

  featuredAt: Date,

  // Helpfulness votes
  helpfulCount: {
    type: Number,
    default: 0,
  },

  unhelpfulCount: {
    type: Number,
    default: 0,
  },

  // Response from business
  response: {
    text: String,
    respondedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    respondedAt: Date,
  },

  // Verification
  isVerified: {
    type: Boolean,
    default: false,
  },

  verifiedAt: Date,

  // Metadata
  travelDate: Date, // Date of the trip
  tripDuration: Number, // Days
}, {
  timestamps: true,
});

// Indexes
reviewSchema.index({ tenant: 1, status: 1, isFeatured: 1 });
reviewSchema.index({ tenant: 1, reviewType: 1, status: 1 });
reviewSchema.index({ booking: 1 });
reviewSchema.index({ supplier: 1 });
reviewSchema.index({ agent: 1 });
reviewSchema.index({ 'rating.overall': -1 });

// Prevent duplicate reviews
reviewSchema.index({ booking: 1, customer: 1 }, { unique: true, sparse: true });
reviewSchema.index({ supplier: 1, customer: 1 }, { unique: true, sparse: true });

// Virtual: Average rating
reviewSchema.virtual('averageRating').get(function() {
  const ratings = Object.values(this.rating).filter(r => typeof r === 'number');
  return ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
});

// Method: Auto-verify review (if booking confirmed)
reviewSchema.methods.verifyReview = async function() {
  if (this.booking) {
    const booking = await mongoose.model('Booking').findById(this.booking);
    if (booking && booking.status === 'completed') {
      this.isVerified = true;
      this.verifiedAt = new Date();
    }
  }
};
```

### ReviewVote Schema (NEW - To Implement)

```javascript
// src/models/ReviewVote.js
const reviewVoteSchema = new mongoose.Schema({
  review: {
    type: Schema.Types.ObjectId,
    ref: 'Review',
    required: true,
    index: true,
  },

  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  voteType: {
    type: String,
    enum: ['helpful', 'unhelpful'],
    required: true,
  },
}, {
  timestamps: true,
});

// Prevent duplicate votes
reviewVoteSchema.index({ review: 1, user: 1 }, { unique: true });
```

## API Endpoints

```javascript
// ========== Customer Review Submission ==========

// Submit booking review
POST /reviews/booking/:bookingId
Body: {
  rating: { overall, valueForMoney, accommodation, transportation, activities },
  title,
  comment,
  photos: [{ url, caption }],
  pros: [],
  cons: []
}

// Submit supplier review
POST /reviews/supplier/:supplierId
Body: { rating: { overall }, title, comment }

// Submit agent review
POST /reviews/agent/:agentId
Body: {
  rating: { overall, responsiveness, professionalism, knowledge },
  title,
  comment
}

// ========== Review Management ==========

// List reviews
GET /reviews
Query params: reviewType, status, isFeatured, page, limit, sortBy

// Get review
GET /reviews/:id

// Update review (customer can edit before moderation)
PATCH /reviews/:id
Body: { rating, title, comment }

// Delete review (only if pending)
DELETE /reviews/:id

// ========== Moderation (Admin/Manager only) ==========

// Approve review
POST /reviews/:id/approve

// Reject review
POST /reviews/:id/reject
Body: { reason }

// Flag review (for manual review)
POST /reviews/:id/flag
Body: { reason }

// Feature review (for marketing)
POST /reviews/:id/feature

// Unfeature review
POST /reviews/:id/unfeature

// ========== Business Response ==========

// Respond to review
POST /reviews/:id/respond
Body: { text }

// Update response
PATCH /reviews/:id/response
Body: { text }

// Delete response
DELETE /reviews/:id/response

// ========== Helpfulness Voting ==========

// Vote review helpful
POST /reviews/:id/vote/helpful

// Vote review unhelpful
POST /reviews/:id/vote/unhelpful

// ========== Public Reviews ==========

// Get public reviews for booking
GET /public/reviews/bookings/:bookingId

// Get public reviews for supplier
GET /public/reviews/suppliers/:supplierId
Query params: page, limit, sortBy (recent, highest, lowest)

// Get public reviews for agent
GET /public/reviews/agents/:agentId

// Get featured reviews (for website)
GET /public/reviews/featured
Query params: limit

// ========== Statistics ==========

// Get review statistics
GET /reviews/stats
Returns: {
  total,
  byStatus: { pending, approved, rejected },
  byRating: { 5: count, 4: count, etc. },
  avgRating,
  responseRate
}

// Supplier rating summary
GET /suppliers/:id/rating-summary
Returns: {
  avgRating,
  totalReviews,
  distribution: { 5: count, 4: count, etc. },
  recentReviews: []
}

// Agent rating summary
GET /agents/:id/rating-summary
Returns: {
  avgRating,
  totalReviews,
  distribution: { 5: count, 4: count, etc. },
  strengths: ['responsiveness', 'professionalism'],
  areasForImprovement: []
}
```

## Implementation Steps

### Step 1: Create Models (0.5 day)
- [ ] Create Review model
- [ ] Create ReviewVote model
- [ ] Add review summary to Supplier model
- [ ] Add review summary to User (Agent) model
- [ ] Add indexes

### Step 2: Review Submission (1 day)
- [ ] Create reviewController.js
- [ ] Implement booking review submission
- [ ] Implement supplier review submission
- [ ] Implement agent review submission
- [ ] Validate customer has completed booking
- [ ] Prevent duplicate reviews
- [ ] Upload review photos to S3

### Step 3: Moderation Workflow (0.5 day)
- [ ] Implement approve endpoint
- [ ] Implement reject endpoint
- [ ] Implement flag endpoint
- [ ] Send notifications to customers (approved/rejected)
- [ ] Auto-approve reviews > 3 stars (optional)
- [ ] Auto-flag reviews with bad words

### Step 4: Business Response (0.25 day)
- [ ] Implement response submission
- [ ] Limit response to admins/managers
- [ ] Send notification to customer
- [ ] Allow response editing

### Step 5: Helpfulness Voting (0.25 day)
- [ ] Implement vote helpful/unhelpful
- [ ] Update review helpfulCount
- [ ] Prevent duplicate votes
- [ ] Sort reviews by helpfulness

### Step 6: Public Review Display (0.5 day)
- [ ] Public review endpoints (no auth)
- [ ] Filter by approved reviews only
- [ ] Sort by recent/highest/lowest
- [ ] Implement pagination
- [ ] Featured reviews endpoint

### Step 7: Statistics & Analytics (0.5 day)
- [ ] Calculate average ratings
- [ ] Rating distribution
- [ ] Response rate calculation
- [ ] Agent performance metrics from reviews
- [ ] Supplier quality scores

### Step 8: Validation & Routes (0.25 day)
- [ ] Create validation schemas
- [ ] Create routes
- [ ] Apply RBAC (customers submit, admins moderate)
- [ ] Mount routes

### Step 9: Testing (0.5 day)
- [ ] Test review submission
- [ ] Test duplicate prevention
- [ ] Test moderation workflow
- [ ] Test business response
- [ ] Test voting system
- [ ] Test public endpoints
- [ ] Test statistics

## Features

### 1. Review Collection
- Send review request email 3 days after trip completion
- Simple review form with star ratings
- Optional photo upload
- Pros and cons selection

### 2. Moderation
- All reviews pending by default
- Admin/manager approval required
- Auto-flag reviews with profanity
- Rejection with reason
- Email notification to customers

### 3. Display
- Show verified reviews (from confirmed bookings)
- Sort by recent, highest, lowest, most helpful
- Display business responses
- Show reviewer name and trip date
- Featured reviews on homepage

### 4. Analytics
- Average rating per supplier
- Average rating per agent
- Review trends over time
- Response rate tracking
- Customer satisfaction score (CSAT)

## Testing Strategy

### Unit Tests
- [ ] Test review model validation
- [ ] Test average rating calculation
- [ ] Test duplicate prevention
- [ ] Test vote counting

### Integration Tests
- [ ] Test complete review submission flow
- [ ] Test moderation workflow
- [ ] Test business response
- [ ] Test public review display

## Acceptance Criteria

- [ ] Customers can submit reviews after trip completion
- [ ] Duplicate reviews prevented
- [ ] Reviews require admin approval
- [ ] Business can respond to reviews
- [ ] Helpfulness voting works
- [ ] Public reviews display correctly
- [ ] Featured reviews selectable
- [ ] Average ratings calculated correctly
- [ ] All tests passing (>75% coverage)

## Environment Variables

```env
REVIEW_PHOTO_MAX_SIZE=5242880
REVIEW_PHOTO_MAX_COUNT=5
REVIEW_AUTO_APPROVE_THRESHOLD=3
REVIEW_REQUEST_DELAY_DAYS=3
```

## Notes

- Reviews build trust and social proof
- Encourage customers to leave reviews (incentives?)
- Monitor review quality and fake reviews
- Use reviews to improve service quality
- Display reviews on public website for SEO
- Integrate with Google Reviews API (future)
