const mongoose = require('mongoose');
const { requireMainAgent, requireSubUserPermission } = require('../../src/middleware/subUserAuth');
const User = require('../../src/models/User');
const SubUser = require('../../src/models/SubUser');
const { AppError } = require('../../src/middleware/errorHandler');

describe('Sub-User Auth Middleware', () => {
  let tenantId;
  let mockReq;
  let mockRes;
  let nextFunction;

  beforeAll(() => {
    tenantId = new mongoose.Types.ObjectId();
  });

  beforeEach(() => {
    mockReq = {
      user: null,
      subUser: null,
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('requireMainAgent', () => {
    it('should allow main agent to proceed', () => {
      mockReq.user = {
        _id: new mongoose.Types.ObjectId(),
        role: 'agent',
        tenantId,
        isActive: true,
      };

      requireMainAgent(mockReq, mockRes, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('should block sub-user access', () => {
      mockReq.user = {
        _id: new mongoose.Types.ObjectId(),
        role: 'agent',
        tenantId,
        isActive: true,
      };
      mockReq.subUser = {
        _id: new mongoose.Types.ObjectId(),
        role: 'user',
      };

      expect(() => {
        requireMainAgent(mockReq, mockRes, nextFunction);
      }).toThrow('Only main agents can perform this action');
    });

    it('should block if user is not an agent', () => {
      mockReq.user = {
        _id: new mongoose.Types.ObjectId(),
        role: 'user',
        tenantId,
        isActive: true,
      };

      expect(() => {
        requireMainAgent(mockReq, mockRes, nextFunction);
      }).toThrow('Only main agents can perform this action');
    });
  });

  describe('requireSubUserPermission', () => {
    it('should allow access with correct permission', () => {
      mockReq.user = {
        _id: new mongoose.Types.ObjectId(),
        role: 'agent',
        tenantId,
        isActive: true,
      };
      mockReq.subUser = {
        _id: new mongoose.Types.ObjectId(),
        role: 'user',
        permissions: {
          customers: { view: true, edit: true },
        },
      };

      const middleware = requireSubUserPermission('customers', 'view');
      middleware(mockReq, mockRes, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should block access without permission', () => {
      mockReq.user = {
        _id: new mongoose.Types.ObjectId(),
        role: 'agent',
        tenantId,
        isActive: true,
      };
      mockReq.subUser = {
        _id: new mongoose.Types.ObjectId(),
        role: 'user',
        permissions: {
          customers: { view: true, edit: false },
        },
      };

      const middleware = requireSubUserPermission('customers', 'edit');

      expect(() => {
        middleware(mockReq, mockRes, nextFunction);
      }).toThrow('You do not have permission');
    });

    it('should allow main agent access regardless of permissions', () => {
      mockReq.user = {
        _id: new mongoose.Types.ObjectId(),
        role: 'agent',
        tenantId,
        isActive: true,
      };
      // No subUser means it's a main agent

      const middleware = requireSubUserPermission('customers', 'delete');
      middleware(mockReq, mockRes, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should allow admin sub-user full access', () => {
      mockReq.user = {
        _id: new mongoose.Types.ObjectId(),
        role: 'agent',
        tenantId,
        isActive: true,
      };
      mockReq.subUser = {
        _id: new mongoose.Types.ObjectId(),
        role: 'admin',
        permissions: {},
      };

      const middleware = requireSubUserPermission('bookings', 'delete');
      middleware(mockReq, mockRes, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should block if permission resource not defined', () => {
      mockReq.user = {
        _id: new mongoose.Types.ObjectId(),
        role: 'agent',
        tenantId,
        isActive: true,
      };
      mockReq.subUser = {
        _id: new mongoose.Types.ObjectId(),
        role: 'user',
        permissions: {},
      };

      const middleware = requireSubUserPermission('customers', 'view');

      expect(() => {
        middleware(mockReq, mockRes, nextFunction);
      }).toThrow('You do not have permission');
    });
  });
});
