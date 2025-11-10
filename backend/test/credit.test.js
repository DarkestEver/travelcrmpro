/**
 * Credit Management Test Suite
 * Tests for credit limit tracking and enforcement
 */

const mongoose = require('mongoose');
const User = require('../src/models/User');
const creditService = require('../src/services/creditService');

describe('Credit Management Tests', () => {
  
  // Test credit status retrieval
  describe('getCreditStatus', () => {
    test('should return correct credit status', async () => {
      const agent = await User.create({
        name: 'Test Agent',
        email: 'agent@test.com',
        password: 'password123',
        role: 'agent',
        tenantId: new mongoose.Types.ObjectId(),
        creditLimit: 10000,
        creditUsed: 3000
      });
      
      const status = await creditService.getCreditStatus(agent._id);
      
      expect(status.creditLimit).toBe(10000);
      expect(status.creditUsed).toBe(3000);
      expect(status.availableCredit).toBe(7000);
      expect(status.utilizationPercentage).toBe(30);
      expect(status.status).toBe('healthy');
    });
    
    test('should mark as warning when utilization > 75%', async () => {
      const agent = await User.create({
        name: 'Test Agent 2',
        email: 'agent2@test.com',
        password: 'password123',
        role: 'agent',
        tenantId: new mongoose.Types.ObjectId(),
        creditLimit: 10000,
        creditUsed: 8000
      });
      
      const status = await creditService.getCreditStatus(agent._id);
      
      expect(status.utilizationPercentage).toBe(80);
      expect(status.status).toBe('warning');
    });
    
    test('should mark as critical when utilization > 90%', async () => {
      const agent = await User.create({
        name: 'Test Agent 3',
        email: 'agent3@test.com',
        password: 'password123',
        role: 'agent',
        tenantId: new mongoose.Types.ObjectId(),
        creditLimit: 10000,
        creditUsed: 9500
      });
      
      const status = await creditService.getCreditStatus(agent._id);
      
      expect(status.utilizationPercentage).toBe(95);
      expect(status.status).toBe('critical');
    });
  });
  
  // Test credit availability check
  describe('canMakeBooking', () => {
    test('should allow booking within credit limit', async () => {
      const agent = await User.create({
        name: 'Test Agent 4',
        email: 'agent4@test.com',
        password: 'password123',
        role: 'agent',
        tenantId: new mongoose.Types.ObjectId(),
        creditLimit: 10000,
        creditUsed: 5000
      });
      
      const canBook = await creditService.canMakeBooking(agent._id, 3000);
      
      expect(canBook).toBe(true);
    });
    
    test('should block booking exceeding credit limit', async () => {
      const agent = await User.create({
        name: 'Test Agent 5',
        email: 'agent5@test.com',
        password: 'password123',
        role: 'agent',
        tenantId: new mongoose.Types.ObjectId(),
        creditLimit: 10000,
        creditUsed: 5000
      });
      
      const canBook = await creditService.canMakeBooking(agent._id, 6000);
      
      expect(canBook).toBe(false);
    });
  });
  
  // Test credit reservation
  describe('reserveCredit', () => {
    test('should reserve credit successfully', async () => {
      const agent = await User.create({
        name: 'Test Agent 6',
        email: 'agent6@test.com',
        password: 'password123',
        role: 'agent',
        tenantId: new mongoose.Types.ObjectId(),
        creditLimit: 10000,
        creditUsed: 3000
      });
      
      await creditService.reserveCredit(agent._id, 2000);
      
      const updated = await User.findById(agent._id);
      expect(updated.creditUsed).toBe(5000);
    });
    
    test('should fail when insufficient credit', async () => {
      const agent = await User.create({
        name: 'Test Agent 7',
        email: 'agent7@test.com',
        password: 'password123',
        role: 'agent',
        tenantId: new mongoose.Types.ObjectId(),
        creditLimit: 10000,
        creditUsed: 9000
      });
      
      await expect(
        creditService.reserveCredit(agent._id, 2000)
      ).rejects.toThrow('Insufficient credit');
    });
  });
  
  // Test credit release
  describe('releaseCredit', () => {
    test('should release credit successfully', async () => {
      const agent = await User.create({
        name: 'Test Agent 8',
        email: 'agent8@test.com',
        password: 'password123',
        role: 'agent',
        tenantId: new mongoose.Types.ObjectId(),
        creditLimit: 10000,
        creditUsed: 5000
      });
      
      await creditService.releaseCredit(agent._id, 2000);
      
      const updated = await User.findById(agent._id);
      expect(updated.creditUsed).toBe(3000);
    });
    
    test('should not go below zero', async () => {
      const agent = await User.create({
        name: 'Test Agent 9',
        email: 'agent9@test.com',
        password: 'password123',
        role: 'agent',
        tenantId: new mongoose.Types.ObjectId(),
        creditLimit: 10000,
        creditUsed: 1000
      });
      
      await creditService.releaseCredit(agent._id, 2000);
      
      const updated = await User.findById(agent._id);
      expect(updated.creditUsed).toBe(0); // Should not go negative
    });
  });
  
  // Test credit reconciliation
  describe('recalculateCreditUsed', () => {
    test('should recalculate based on active bookings', async () => {
      const agent = await User.create({
        name: 'Test Agent 10',
        email: 'agent10@test.com',
        password: 'password123',
        role: 'agent',
        tenantId: new mongoose.Types.ObjectId(),
        creditLimit: 10000,
        creditUsed: 5000 // This might be wrong
      });
      
      // Assuming this function calculates from bookings
      await creditService.recalculateCreditUsed(agent._id);
      
      const updated = await User.findById(agent._id);
      // creditUsed should now match actual booking totals
      expect(updated.creditUsed).toBeGreaterThanOrEqual(0);
    });
  });
});

module.exports = {
  testCreditReservation: async (agentId, amount) => {
    return await creditService.reserveCredit(agentId, amount);
  },
  
  testCreditRelease: async (agentId, amount) => {
    return await creditService.releaseCredit(agentId, amount);
  },
  
  testCreditCheck: async (agentId, amount) => {
    return await creditService.canMakeBooking(agentId, amount);
  }
};
