/**
 * Integration Test Suite
 * Tests for complete workflows across multiple features
 */

const mongoose = require('mongoose');
const User = require('../src/models/User');
const Booking = require('../src/models/Booking');
const Commission = require('../src/models/Commission');
const Payment = require('../src/models/Payment');
const creditService = require('../src/services/creditService');
const commissionService = require('../src/services/commissionService');

describe('Integration Tests - Booking Workflow', () => {
  
  let tenant, agent, customer;
  
  beforeEach(async () => {
    // Setup test data
    tenant = await User.create({
      name: 'Test Tenant',
      email: 'tenant@test.com',
      password: 'password123',
      role: 'tenant',
      creditLimit: 50000,
      creditUsed: 0
    });
    
    agent = await User.create({
      name: 'Test Agent',
      email: 'agent@test.com',
      password: 'password123',
      role: 'agent',
      tenantId: tenant._id,
      creditLimit: 20000,
      creditUsed: 0
    });
    
    customer = await Customer.create({
      name: 'Test Customer',
      email: 'customer@test.com',
      phone: '1234567890',
      tenantId: tenant._id,
      createdBy: agent._id
    });
  });
  
  // Complete booking creation flow
  describe('Booking Creation Flow', () => {
    test('should reserve credit when booking is created', async () => {
      const bookingAmount = 5000;
      
      // Check credit before
      const creditBefore = await creditService.getCreditStatus(agent._id);
      expect(creditBefore.availableCredit).toBe(20000);
      
      // Create booking
      const booking = await Booking.create({
        tenantId: tenant._id,
        agentId: agent._id,
        customerId: customer._id,
        bookingNumber: 'BK-INT-001',
        destination: 'Test Destination',
        startDate: new Date(),
        endDate: new Date(),
        totalPrice: bookingAmount,
        status: 'confirmed'
      });
      
      // Reserve credit
      await creditService.reserveCredit(agent._id, bookingAmount);
      
      // Check credit after
      const creditAfter = await creditService.getCreditStatus(agent._id);
      expect(creditAfter.creditUsed).toBe(bookingAmount);
      expect(creditAfter.availableCredit).toBe(15000);
    });
    
    test('should block booking if credit limit exceeded', async () => {
      const bookingAmount = 25000; // Exceeds 20000 limit
      
      const canBook = await creditService.canMakeBooking(agent._id, bookingAmount);
      expect(canBook).toBe(false);
      
      // Attempt to reserve should fail
      await expect(
        creditService.reserveCredit(agent._id, bookingAmount)
      ).rejects.toThrow();
    });
  });
  
  // Complete booking completion flow
  describe('Booking Completion Flow', () => {
    test('should create commission and release credit when completed', async () => {
      const bookingAmount = 5000;
      
      // Create and reserve credit for booking
      const booking = await Booking.create({
        tenantId: tenant._id,
        agentId: agent._id,
        customerId: customer._id,
        bookingNumber: 'BK-INT-002',
        destination: 'Test Destination',
        startDate: new Date(),
        endDate: new Date(),
        totalPrice: bookingAmount,
        status: 'confirmed'
      });
      
      await creditService.reserveCredit(agent._id, bookingAmount);
      
      // Complete booking
      booking.status = 'completed';
      await booking.save();
      
      // Create commission
      const commission = await commissionService.createCommissionForBooking(booking);
      expect(commission).toBeDefined();
      expect(commission.bookingAmount).toBe(bookingAmount);
      expect(commission.status).toBe('pending');
      
      // Release credit
      await creditService.releaseCredit(agent._id, bookingAmount);
      
      // Verify credit released
      const creditStatus = await creditService.getCreditStatus(agent._id);
      expect(creditStatus.creditUsed).toBe(0);
    });
  });
  
  // Complete booking cancellation flow
  describe('Booking Cancellation Flow', () => {
    test('should cancel commission and release credit when cancelled', async () => {
      const bookingAmount = 5000;
      
      // Create booking with credit reserved
      const booking = await Booking.create({
        tenantId: tenant._id,
        agentId: agent._id,
        customerId: customer._id,
        bookingNumber: 'BK-INT-003',
        destination: 'Test Destination',
        startDate: new Date(),
        endDate: new Date(),
        totalPrice: bookingAmount,
        status: 'confirmed'
      });
      
      await creditService.reserveCredit(agent._id, bookingAmount);
      
      // Create commission (if it was completed before)
      const commission = await Commission.create({
        tenantId: tenant._id,
        agentId: agent._id,
        bookingId: booking._id,
        bookingAmount,
        commissionRate: 10,
        commissionAmount: 500,
        status: 'pending'
      });
      
      // Cancel booking
      booking.status = 'cancelled';
      await booking.save();
      
      // Cancel commission
      await commissionService.cancelCommission(commission._id);
      
      // Release credit
      await creditService.releaseCredit(agent._id, bookingAmount);
      
      // Verify
      const updatedCommission = await Commission.findById(commission._id);
      expect(updatedCommission.status).toBe('cancelled');
      
      const creditStatus = await creditService.getCreditStatus(agent._id);
      expect(creditStatus.creditUsed).toBe(0);
    });
  });
  
  // Multiple bookings workflow
  describe('Multiple Bookings Workflow', () => {
    test('should handle multiple concurrent bookings', async () => {
      const booking1Amount = 3000;
      const booking2Amount = 4000;
      const booking3Amount = 2000;
      
      // Create 3 bookings
      const booking1 = await Booking.create({
        tenantId: tenant._id,
        agentId: agent._id,
        customerId: customer._id,
        bookingNumber: 'BK-INT-004',
        destination: 'Destination 1',
        startDate: new Date(),
        endDate: new Date(),
        totalPrice: booking1Amount,
        status: 'confirmed'
      });
      
      const booking2 = await Booking.create({
        tenantId: tenant._id,
        agentId: agent._id,
        customerId: customer._id,
        bookingNumber: 'BK-INT-005',
        destination: 'Destination 2',
        startDate: new Date(),
        endDate: new Date(),
        totalPrice: booking2Amount,
        status: 'confirmed'
      });
      
      const booking3 = await Booking.create({
        tenantId: tenant._id,
        agentId: agent._id,
        customerId: customer._id,
        bookingNumber: 'BK-INT-006',
        destination: 'Destination 3',
        startDate: new Date(),
        endDate: new Date(),
        totalPrice: booking3Amount,
        status: 'confirmed'
      });
      
      // Reserve credit for all
      await creditService.reserveCredit(agent._id, booking1Amount);
      await creditService.reserveCredit(agent._id, booking2Amount);
      await creditService.reserveCredit(agent._id, booking3Amount);
      
      // Check total credit used
      const creditStatus = await creditService.getCreditStatus(agent._id);
      expect(creditStatus.creditUsed).toBe(9000);
      expect(creditStatus.availableCredit).toBe(11000);
      
      // Complete booking 1
      booking1.status = 'completed';
      await booking1.save();
      await commissionService.createCommissionForBooking(booking1);
      await creditService.releaseCredit(agent._id, booking1Amount);
      
      // Cancel booking 2
      booking2.status = 'cancelled';
      await booking2.save();
      await creditService.releaseCredit(agent._id, booking2Amount);
      
      // Final credit check (only booking3 should be using credit)
      const finalCreditStatus = await creditService.getCreditStatus(agent._id);
      expect(finalCreditStatus.creditUsed).toBe(booking3Amount);
    });
  });
  
  // Payment and commission workflow
  describe('Payment and Commission Workflow', () => {
    test('should track payment and update commission status', async () => {
      const bookingAmount = 5000;
      const commissionAmount = 500;
      
      // Create completed booking
      const booking = await Booking.create({
        tenantId: tenant._id,
        agentId: agent._id,
        customerId: customer._id,
        bookingNumber: 'BK-INT-007',
        destination: 'Test Destination',
        startDate: new Date(),
        endDate: new Date(),
        totalPrice: bookingAmount,
        status: 'completed'
      });
      
      // Create commission
      const commission = await Commission.create({
        tenantId: tenant._id,
        agentId: agent._id,
        bookingId: booking._id,
        bookingAmount,
        commissionRate: 10,
        commissionAmount,
        status: 'pending'
      });
      
      // Record booking payment
      const bookingPayment = await Payment.create({
        tenantId: tenant._id,
        agentId: agent._id,
        bookingId: booking._id,
        paymentType: 'booking_payment',
        direction: 'incoming',
        amount: bookingAmount,
        status: 'completed'
      });
      
      // Approve commission
      await commission.approve();
      
      // Create commission payout
      const commissionPayout = await Payment.create({
        tenantId: tenant._id,
        agentId: agent._id,
        commissionId: commission._id,
        paymentType: 'commission_payout',
        direction: 'outgoing',
        amount: commissionAmount,
        status: 'completed'
      });
      
      // Mark commission as paid
      await commission.markAsPaid();
      
      // Verify final states
      const finalCommission = await Commission.findById(commission._id);
      expect(finalCommission.status).toBe('paid');
      
      const payments = await Payment.find({ agentId: agent._id });
      expect(payments).toHaveLength(2);
      expect(payments[0].direction).toBe('incoming');
      expect(payments[1].direction).toBe('outgoing');
    });
  });
});

module.exports = {
  testCompleteBookingFlow: async (agentId, bookingAmount) => {
    // This can be called manually for testing
    const canBook = await creditService.canMakeBooking(agentId, bookingAmount);
    if (!canBook) {
      throw new Error('Insufficient credit for booking');
    }
    
    await creditService.reserveCredit(agentId, bookingAmount);
    return { success: true, creditReserved: bookingAmount };
  }
};
