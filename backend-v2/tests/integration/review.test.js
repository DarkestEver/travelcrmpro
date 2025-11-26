const request = require('supertest');
const app = require('../../src/app');
const mongoose = require('mongoose');
const User = require('../../src/models/User');
const Tenant = require('../../src/models/Tenant');
const Booking = require('../../src/models/Booking');
const Supplier = require('../../src/models/Supplier');
const Review = require('../../src/models/Review');
const ReviewVote = require('../../src/models/ReviewVote');
const Query = require('../../src/models/Query');
const tokenService = require('../../src/services/tokenService');

describe('Reviews & Ratings System', () => {
  let tenant;
  let adminUser;
  let agentUser;
  let customerUser;
  let adminToken;
  let agentToken;
  let customerToken;
  let booking;
  let supplier;
  let query;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/travelcrm_test');
    
    // Clean up
    await Promise.all([
      User.deleteMany({}),
      Tenant.deleteMany({}),
      Booking.deleteMany({}),
      Supplier.deleteMany({}),
      Review.deleteMany({}),
      ReviewVote.deleteMany({}),
      Query.deleteMany({}),
    ]);

    // Create tenant
    tenant = await Tenant.create({
      name: 'Test Travel Agency',
      slug: 'test-travel',
      email: 'admin@testtravel.com',
      phone: '+1234567890',
      status: 'active',
      settings: {
        emailEnabled: true,
      },
    });

    // Create users
    adminUser = await User.create({
      tenant: tenant._id,
      email: 'admin@test.com',
      password: 'Password123!',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      status: 'active',
    });

    agentUser = await User.create({
      tenant: tenant._id,
      email: 'agent@test.com',
      password: 'Password123!',
      firstName: 'Agent',
      lastName: 'Smith',
      role: 'agent',
      status: 'active',
    });

    customerUser = await User.create({
      tenant: tenant._id,
      email: 'customer@test.com',
      password: 'Password123!',
      firstName: 'John',
      lastName: 'Customer',
      role: 'customer',
      status: 'active',
    });

    // Generate tokens
    adminToken = tokenService.generateAccessToken({
      userId: adminUser._id,
      tenantId: tenant._id,
      role: adminUser.role,
    });

    agentToken = tokenService.generateAccessToken({
      userId: agentUser._id,
      tenantId: tenant._id,
      role: agentUser.role,
    });

    customerToken = tokenService.generateAccessToken({
      userId: customerUser._id,
      tenantId: tenant._id,
      role: customerUser.role,
    });

    // Create supplier
    supplier = await Supplier.create({
      tenant: tenant._id,
      name: 'Test Hotel',
      type: 'accommodation',
      email: 'hotel@test.com',
      phone: '+1234567890',
      status: 'active',
      createdBy: adminUser._id,
    });

    // Create query first
    query = await Query.create({
      tenant: tenant._id,
      customer: customerUser._id,
      tripType: 'leisure',
      destination: 'Paris, France',
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-06-10'),
      adults: 2,
      children: 0,
      budget: 5000,
      tripDetails: {
        destination: 'Paris, France',
        flexibility: 'exact',
      },
      status: 'qualified',
      priority: 'medium',
      source: 'website',
      assignedTo: agentUser._id,
      createdBy: customerUser._id,
    });

    // Create completed booking
    booking = await Booking.create({
      tenant: tenant._id,
      customer: customerUser._id,
      query: query._id,
      bookingNumber: 'BK-2024-001',
      destination: 'Paris, France',
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-06-10'),
      travelers: {
        adults: 2,
        children: 0,
      },
      status: 'completed',
      totalAmount: 5000,
      paidAmount: 5000,
      agent: agentUser._id,
      createdBy: agentUser._id,
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /reviews/booking/:bookingId - Submit Booking Review', () => {
    it('should allow customer to submit booking review', async () => {
      const reviewData = {
        overallRating: 5,
        ratings: {
          accommodation: 5,
          transportation: 4,
          valueForMoney: 5,
        },
        title: 'Amazing trip to Paris!',
        reviewText: 'We had an absolutely wonderful time in Paris. The hotel was excellent, the itinerary was well-planned, and our agent was very helpful throughout the entire process.',
        pros: ['Great hotel location', 'Well-organized itinerary', 'Responsive agent'],
        cons: ['Transportation could be improved'],
        wouldRecommend: true,
        traveledWith: 'couple',
      };

      const response = await request(app)
        .post(`/reviews/booking/${booking._id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(reviewData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.overallRating).toBe(5);
      expect(response.body.data.title).toBe(reviewData.title);
      expect(response.body.data.status).toBe('pending');
      expect(response.body.data.isVerified).toBe(true);
    });

    it('should not allow duplicate review', async () => {
      const reviewData = {
        overallRating: 5,
        title: 'Another review',
        reviewText: 'This should not be allowed as I already reviewed this booking.',
      };

      const response = await request(app)
        .post(`/reviews/booking/${booking._id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(reviewData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate review text length', async () => {
      const response = await request(app)
        .post(`/reviews/booking/${booking._id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          overallRating: 5,
          title: 'Short review',
          reviewText: 'Too short',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /reviews/supplier/:supplierId - Submit Supplier Review', () => {
    it('should allow customer to submit supplier review', async () => {
      const response = await request(app)
        .post(`/reviews/supplier/${supplier._id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          overallRating: 4,
          title: 'Great hotel experience',
          reviewText: 'The hotel was clean, staff was friendly, and location was perfect.',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reviewType).toBe('supplier');
      expect(response.body.data.supplier).toBeDefined();
    });
  });

  describe('POST /reviews/agent/:agentId - Submit Agent Review', () => {
    it('should allow customer to submit agent review', async () => {
      const response = await request(app)
        .post(`/reviews/agent/${agentUser._id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          overallRating: 5,
          ratings: {
            responsiveness: 5,
            professionalism: 5,
            knowledge: 4,
          },
          title: 'Excellent service from Agent Smith',
          reviewText: 'Agent was very responsive and knowledgeable about Paris.',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reviewType).toBe('agent');
      expect(response.body.data.agent).toBeDefined();
    });
  });

  describe('GET /reviews - List All Reviews', () => {
    it('should return all reviews for admin', async () => {
      const response = await request(app)
        .get('/reviews')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reviews).toBeInstanceOf(Array);
      expect(response.body.data.reviews.length).toBeGreaterThan(0);
    });

    it('should filter by review type', async () => {
      const response = await request(app)
        .get('/reviews?reviewType=booking')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.reviews.every(r => r.reviewType === 'booking')).toBe(true);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/reviews?status=pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.reviews.every(r => r.status === 'pending')).toBe(true);
    });
  });

  describe('POST /reviews/:id/approve - Approve Review', () => {
    let pendingReview;

    beforeAll(async () => {
      const reviews = await Review.find({ status: 'pending' });
      pendingReview = reviews[0];
    });

    it('should allow admin to approve review', async () => {
      const response = await request(app)
        .post(`/reviews/${pendingReview._id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('approved');
      expect(response.body.data.publishedAt).toBeDefined();
    });

    it('should not allow customer to approve review', async () => {
      const reviews = await Review.find({ status: 'pending' });
      if (reviews.length > 0) {
        const response = await request(app)
          .post(`/reviews/${reviews[0]._id}/approve`)
          .set('Authorization', `Bearer ${customerToken}`);

        expect(response.status).toBe(403);
      }
    });
  });

  describe('POST /reviews/:id/reject - Reject Review', () => {
    let pendingReview;

    beforeAll(async () => {
      const reviews = await Review.find({ status: 'pending' });
      pendingReview = reviews[0];
    });

    it('should allow admin to reject review with reason', async () => {
      if (!pendingReview) {
        return; // Skip if no pending review
      }

      const response = await request(app)
        .post(`/reviews/${pendingReview._id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Contains inappropriate language or violates community guidelines.',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('rejected');
      expect(response.body.data.rejectionReason).toBeDefined();
    });
  });

  describe('POST /reviews/:id/feature - Feature Review', () => {
    let approvedReview;

    beforeAll(async () => {
      const reviews = await Review.find({ status: 'approved' });
      approvedReview = reviews[0];
    });

    it('should allow admin to feature review', async () => {
      const response = await request(app)
        .post(`/reviews/${approvedReview._id}/feature`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isFeatured).toBe(true);
      expect(response.body.data.featuredAt).toBeDefined();
    });

    it('should allow admin to unfeature review', async () => {
      const response = await request(app)
        .post(`/reviews/${approvedReview._id}/unfeature`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.isFeatured).toBe(false);
    });
  });

  describe('POST /reviews/:id/respond - Business Response', () => {
    let approvedReview;

    beforeAll(async () => {
      const reviews = await Review.find({ status: 'approved' });
      approvedReview = reviews[0];
    });

    it('should allow admin to respond to review', async () => {
      const response = await request(app)
        .post(`/reviews/${approvedReview._id}/respond`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          text: 'Thank you for your wonderful feedback! We are delighted you enjoyed your trip.',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.response).toBeDefined();
      expect(response.body.data.response.text).toContain('Thank you');
    });

    it('should validate response length', async () => {
      const response = await request(app)
        .post(`/reviews/${approvedReview._id}/respond`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          text: 'Too short',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /reviews/:id/vote/helpful - Vote on Review', () => {
    let approvedReview;

    beforeAll(async () => {
      const reviews = await Review.find({ status: 'approved' });
      approvedReview = reviews[0];
    });

    it('should allow customer to vote review as helpful', async () => {
      const response = await request(app)
        .post(`/reviews/${approvedReview._id}/vote/helpful`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.helpfulCount).toBeGreaterThan(0);
    });

    it('should not allow duplicate helpful vote', async () => {
      const response = await request(app)
        .post(`/reviews/${approvedReview._id}/vote/helpful`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(400);
    });

    it('should allow changing vote from helpful to unhelpful', async () => {
      const response = await request(app)
        .post(`/reviews/${approvedReview._id}/vote/unhelpful`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.unhelpfulCount).toBeGreaterThan(0);
    });
  });

  describe('GET /reviews/stats - Review Statistics', () => {
    it('should return comprehensive review statistics', async () => {
      const response = await request(app)
        .get('/reviews/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBeGreaterThan(0);
      expect(response.body.data.avgRating).toBeDefined();
      expect(response.body.data.byStatus).toBeDefined();
      expect(response.body.data.byRating).toBeDefined();
    });
  });

  describe('GET /public/reviews/featured - Featured Reviews', () => {
    it('should return featured reviews without authentication', async () => {
      const response = await request(app)
        .get('/public/reviews/featured');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('GET /public/reviews/suppliers/:supplierId - Public Supplier Reviews', () => {
    it('should return public supplier reviews', async () => {
      const response = await request(app)
        .get(`/public/reviews/suppliers/${supplier._id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reviews).toBeInstanceOf(Array);
      expect(response.body.data.avgRating).toBeDefined();
      expect(response.body.data.totalReviews).toBeDefined();
    });
  });

  describe('PATCH /reviews/:id - Update Review', () => {
    let pendingReview;

    beforeAll(async () => {
      // Create a new pending review for update test
      pendingReview = await Review.create({
        tenant: tenant._id,
        reviewType: 'booking',
        booking: booking._id,
        customer: customerUser._id,
        overallRating: 3,
        title: 'Original title',
        reviewText: 'This is the original review text that will be updated soon.',
        status: 'pending',
        createdBy: customerUser._id,
      });
    });

    it('should allow customer to update their pending review', async () => {
      const response = await request(app)
        .patch(`/reviews/${pendingReview._id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          overallRating: 4,
          title: 'Updated title',
          reviewText: 'This is the updated review text with more details about the experience.',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.overallRating).toBe(4);
      expect(response.body.data.title).toBe('Updated title');
    });
  });

  describe('DELETE /reviews/:id - Delete Review', () => {
    let pendingReview;

    beforeAll(async () => {
      pendingReview = await Review.create({
        tenant: tenant._id,
        reviewType: 'booking',
        booking: booking._id,
        customer: customerUser._id,
        overallRating: 3,
        title: 'Review to delete',
        reviewText: 'This review will be deleted by the customer before moderation.',
        status: 'pending',
        createdBy: customerUser._id,
      });
    });

    it('should allow customer to delete their pending review', async () => {
      const response = await request(app)
        .delete(`/reviews/${pendingReview._id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const deleted = await Review.findById(pendingReview._id);
      expect(deleted).toBeNull();
    });
  });
});
