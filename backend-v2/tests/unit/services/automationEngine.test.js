const mongoose = require('mongoose');

// Mock dependencies before requiring the service
jest.mock('../../../src/services/emailService');
jest.mock('../../../src/lib/logger');

const automationEngine = require('../../../src/services/automationEngine');
const AutomationRule = require('../../../src/models/AutomationRule');
const emailService = require('../../../src/services/emailService');
const User = require('../../../src/models/User');
const Query = require('../../../src/models/Query');

describe('AutomationEngine', () => {
  let tenantId;
  let mockRule;
  let mockEventData;

  beforeEach(() => {
    tenantId = new mongoose.Types.ObjectId();
    
    mockEventData = {
      _id: new mongoose.Types.ObjectId(),
      status: 'pending',
      priority: 'high',
      customer: {
        email: 'customer@test.com',
        name: 'Test Customer',
      },
    };

    mockRule = {
      _id: new mongoose.Types.ObjectId(),
      tenant: tenantId,
      name: 'Test Rule',
      ruleType: 'follow_up',
      isActive: true,
      trigger: {
        event: 'query_created',
        conditions: [],
      },
      actions: [],
      shouldExecute: jest.fn().mockReturnValue(true),
      recordExecution: jest.fn().mockResolvedValue(true),
      toObject: jest.fn().mockReturnThis(),
    };

    jest.clearAllMocks();
  });

  describe('executeRules', () => {
    it('should find and execute matching automation rules', async () => {
      AutomationRule.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockRule]),
      });

      const result = await automationEngine.executeRules('query_created', mockEventData, tenantId);

      expect(AutomationRule.find).toHaveBeenCalledWith({
        tenant: tenantId,
        isActive: true,
        'trigger.event': 'query_created',
      });
      expect(mockRule.shouldExecute).toHaveBeenCalledWith(mockEventData);
      expect(result).toHaveLength(1);
      expect(result[0].success).toBe(true);
    });

    it('should not execute rules when conditions do not match', async () => {
      mockRule.shouldExecute.mockReturnValue(false);
      
      AutomationRule.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockRule]),
      });

      const result = await automationEngine.executeRules('query_created', mockEventData, tenantId);

      expect(mockRule.shouldExecute).toHaveBeenCalledWith(mockEventData);
      expect(mockRule.recordExecution).not.toHaveBeenCalled();
      expect(result).toHaveLength(0);
    });

    it('should handle multiple rules', async () => {
      const mockRule2 = { ...mockRule, _id: new mongoose.Types.ObjectId() };
      
      AutomationRule.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockRule, mockRule2]),
      });

      const result = await automationEngine.executeRules('query_created', mockEventData, tenantId);

      expect(result).toHaveLength(2);
      expect(mockRule.recordExecution).toHaveBeenCalledWith(true);
    });

    it('should record failure when rule execution fails', async () => {
      mockRule.actions = [{
        actionType: 'send_email',
        config: { emailTemplate: new mongoose.Types.ObjectId() },
      }];

      emailService.sendEmail.mockRejectedValue(new Error('Email failed'));
      
      AutomationRule.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockRule]),
      });

      const result = await automationEngine.executeRules('query_created', mockEventData, tenantId);

      expect(mockRule.recordExecution).toHaveBeenCalledWith(false);
      expect(result[0].success).toBe(false);
    });

    it('should return empty array when no rules found', async () => {
      AutomationRule.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      });

      const result = await automationEngine.executeRules('query_created', mockEventData, tenantId);

      expect(result).toHaveLength(0);
    });
  });

  describe('executeActions - send_email', () => {
    it('should send email action successfully', async () => {
      const emailTemplateId = new mongoose.Types.ObjectId();
      mockRule.actions = [{
        actionType: 'send_email',
        config: {
          emailTemplate: emailTemplateId,
          toField: 'customer.email',
        },
      }];

      emailService.sendEmail.mockResolvedValue({ success: true, messageId: '123' });

      AutomationRule.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockRule]),
      });

      const result = await automationEngine.executeRules('query_created', mockEventData, tenantId);

      expect(emailService.sendEmail).toHaveBeenCalled();
      expect(result[0].success).toBe(true);
    });

    it('should handle missing email template', async () => {
      mockRule.actions = [{
        actionType: 'send_email',
        config: {
          toField: 'customer.email',
        },
      }];

      AutomationRule.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockRule]),
      });

      const result = await automationEngine.executeRules('query_created', mockEventData, tenantId);

      expect(result[0].success).toBe(true);
    });
  });

  describe('executeActions - assign_query', () => {
    it('should assign query to specific user', async () => {
      const userId = new mongoose.Types.ObjectId();
      const queryId = new mongoose.Types.ObjectId();
      
      mockEventData._id = queryId;
      
      mockRule.actions = [{
        actionType: 'assign_query',
        config: {
          assignTo: userId,
          assignmentMethod: 'specific_user',
        },
      }];

      const mockQuery = {
        _id: queryId,
        assignedTo: userId,
        status: 'assigned',
      };

      Query.findByIdAndUpdate = jest.fn().mockResolvedValue(mockQuery);

      AutomationRule.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockRule]),
      });

      const result = await automationEngine.executeRules('query_created', mockEventData, tenantId);

      expect(Query.findByIdAndUpdate).toHaveBeenCalledWith(
        queryId,
        { assignedTo: userId, status: 'assigned' },
        { new: true }
      );
      expect(result[0].success).toBe(true);
    });

    it('should handle round_robin assignment', async () => {
      const queryId = new mongoose.Types.ObjectId();
      const agentId = new mongoose.Types.ObjectId();
      mockEventData._id = queryId;
      
      mockRule.actions = [{
        actionType: 'assign_query',
        config: {
          assignmentMethod: 'round_robin',
        },
      }];

      const mockAgents = [
        { _id: agentId, role: 'agent' },
      ];

      User.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockAgents),
      });

      const mockQuery = {
        _id: queryId,
        assignedTo: agentId,
        status: 'assigned',
      };

      Query.findByIdAndUpdate = jest.fn().mockResolvedValue(mockQuery);

      AutomationRule.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockRule]),
      });

      const result = await automationEngine.executeRules('query_created', mockEventData, tenantId);

      expect(User.find).toHaveBeenCalled();
      expect(Query.findByIdAndUpdate).toHaveBeenCalled();
      expect(result[0].success).toBe(true);
    });
  });

  describe('executeActions - update_status', () => {
    it('should update query status', async () => {
      const queryId = new mongoose.Types.ObjectId();
      mockEventData._id = queryId;
      mockEventData.queryNumber = 'Q-001'; // To identify as Query model
      
      mockRule.actions = [{
        actionType: 'update_status',
        config: {
          newStatus: 'in_progress',
        },
      }];

      Query.findByIdAndUpdate = jest.fn().mockResolvedValue({ status: 'in_progress' });

      AutomationRule.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockRule]),
      });

      const result = await automationEngine.executeRules('query_created', mockEventData, tenantId);

      expect(Query.findByIdAndUpdate).toHaveBeenCalledWith(queryId, {
        status: 'in_progress',
      });
      expect(result[0].success).toBe(true);
    });
  });

  describe('executeActions - escalate', () => {
    it('should escalate query', async () => {
      const queryId = new mongoose.Types.ObjectId();
      const escalateToId = new mongoose.Types.ObjectId();
      mockEventData._id = queryId;
      mockEventData.queryNumber = 'Q-001';
      
      mockRule.actions = [{
        actionType: 'escalate',
        config: {
          escalationLevel: 2,
          escalateTo: escalateToId,
        },
      }];

      const mockQuery = {
        _id: queryId,
        queryNumber: 'Q-001',
        escalationLevel: 1,
        updateOne: jest.fn().mockResolvedValue(true),
      };

      Query.findById.mockResolvedValue(mockQuery);

      AutomationRule.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockRule]),
      });

      const result = await automationEngine.executeRules('query_created', mockEventData, tenantId);

      expect(Query.findById).toHaveBeenCalledWith(queryId);
      expect(mockQuery.updateOne).toHaveBeenCalled();
      expect(result[0].success).toBe(true);
    });
  });

  describe('executeActions - update_field', () => {
    it('should update custom field', async () => {
      const queryId = new mongoose.Types.ObjectId();
      mockEventData._id = queryId;
      mockEventData.queryNumber = 'Q-001';
      
      mockRule.actions = [{
        actionType: 'update_field',
        config: {
          fieldName: 'priority',
          fieldValue: 'urgent',
        },
      }];

      Query.findByIdAndUpdate = jest.fn().mockResolvedValue({ priority: 'urgent' });

      AutomationRule.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockRule]),
      });

      const result = await automationEngine.executeRules('query_created', mockEventData, tenantId);

      expect(Query.findByIdAndUpdate).toHaveBeenCalledWith(queryId, {
        priority: 'urgent',
      });
      expect(result[0].success).toBe(true);
    });
  });

  describe('executeActions - notify_user', () => {
    it('should send user notification', async () => {
      const userId = new mongoose.Types.ObjectId();
      
      mockRule.actions = [{
        actionType: 'notify_user',
        config: {
          userId: userId,
          notificationMessage: 'New query assigned',
          notificationChannel: 'in_app',
        },
      }];

      AutomationRule.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockRule]),
      });

      const result = await automationEngine.executeRules('query_created', mockEventData, tenantId);

      expect(result[0].success).toBe(true);
    });
  });

  describe('executeActions - unknown action type', () => {
    it('should handle unknown action type gracefully', async () => {
      mockRule.actions = [{
        actionType: 'unknown_action',
        config: {},
      }];

      AutomationRule.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockRule]),
      });

      const result = await automationEngine.executeRules('query_created', mockEventData, tenantId);

      expect(result[0].success).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      AutomationRule.find.mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(
        automationEngine.executeRules('query_created', mockEventData, tenantId)
      ).rejects.toThrow('Database error');
    });

    it('should continue executing other actions if one fails', async () => {
      const queryId = new mongoose.Types.ObjectId();
      mockEventData._id = queryId;
      mockEventData.queryNumber = 'Q-001';

      mockRule.actions = [
        {
          actionType: 'send_email',
          config: { emailTemplate: new mongoose.Types.ObjectId() },
        },
        {
          actionType: 'update_status',
          config: { newStatus: 'in_progress' },
        },
      ];

      emailService.sendEmail.mockRejectedValue(new Error('Email failed'));
      Query.findByIdAndUpdate = jest.fn().mockResolvedValue({ status: 'in_progress' });

      AutomationRule.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockRule]),
      });

      const result = await automationEngine.executeRules('query_created', mockEventData, tenantId);

      expect(result[0].success).toBe(true);
      expect(result[0].result).toHaveLength(2);
      expect(result[0].result[0].error).toBeDefined();
      expect(result[0].result[1].result).toBeDefined();
    });
  });
});
