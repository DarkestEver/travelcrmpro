const { requireAgent, checkCreditLimit, requireAgentLevel, attachAgentMetadata } = require('../../src/middleware/agentAuth');
const ErrorResponse = require('../../src/utils/errorResponse');

describe('Agent Authentication Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: null,
    };
    res = {};
    next = jest.fn();
  });

  describe('requireAgent', () => {
    test('should pass if user is an agent and active', async () => {
      req.user = {
        _id: 'agent123',
        role: 'agent',
        isActive: true,
      };

      await requireAgent(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(next).not.toHaveBeenCalledWith(expect.any(ErrorResponse));
    });

    test('should fail if user is not authenticated', async () => {
      req.user = null;

      await requireAgent(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ErrorResponse));
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(401);
      expect(error.message).toContain('Not authorized');
    });

    test('should fail if user is not an agent', async () => {
      req.user = {
        _id: 'operator123',
        role: 'operator',
        isActive: true,
      };

      await requireAgent(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ErrorResponse));
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(403);
      expect(error.message).toContain('not authorized');
    });

    test('should fail if agent account is inactive', async () => {
      req.user = {
        _id: 'agent123',
        role: 'agent',
        isActive: false,
      };

      await requireAgent(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ErrorResponse));
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(403);
      expect(error.message).toContain('inactive');
    });
  });

  describe('checkCreditLimit', () => {
    test('should pass if agent has sufficient credit', async () => {
      req.user = {
        _id: 'agent123',
        role: 'agent',
        creditLimit: 10000,
      };

      const middleware = checkCreditLimit(5000);
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(next).not.toHaveBeenCalledWith(expect.any(ErrorResponse));
    });

    test('should fail if agent has insufficient credit', async () => {
      req.user = {
        _id: 'agent123',
        role: 'agent',
        creditLimit: 3000,
      };

      const middleware = checkCreditLimit(5000);
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ErrorResponse));
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(403);
      expect(error.message).toContain('Insufficient credit');
    });

    test('should handle missing creditLimit field', async () => {
      req.user = {
        _id: 'agent123',
        role: 'agent',
      };

      const middleware = checkCreditLimit(5000);
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ErrorResponse));
    });
  });

  describe('requireAgentLevel', () => {
    test('should pass if agent has required level', async () => {
      req.user = {
        _id: 'agent123',
        role: 'agent',
        agentLevel: 'gold',
      };

      const middleware = requireAgentLevel(['silver', 'gold', 'platinum']);
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(next).not.toHaveBeenCalledWith(expect.any(ErrorResponse));
    });

    test('should fail if agent level is not allowed', async () => {
      req.user = {
        _id: 'agent123',
        role: 'agent',
        agentLevel: 'bronze',
      };

      const middleware = requireAgentLevel(['gold', 'platinum']);
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ErrorResponse));
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(403);
      expect(error.message).toContain('not authorized');
    });

    test('should handle missing agentLevel field', async () => {
      req.user = {
        _id: 'agent123',
        role: 'agent',
      };

      const middleware = requireAgentLevel(['gold', 'platinum']);
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ErrorResponse));
    });
  });

  describe('attachAgentMetadata', () => {
    test('should attach metadata for agent users', async () => {
      req.user = {
        _id: 'agent123',
        role: 'agent',
        agentCode: 'AG001',
        agentLevel: 'gold',
        tenantId: 'tenant123',
        commissionRate: 15,
      };

      await attachAgentMetadata(req, res, next);

      expect(req.agentMetadata).toBeDefined();
      expect(req.agentMetadata.agentId).toBe('agent123');
      expect(req.agentMetadata.agentCode).toBe('AG001');
      expect(req.agentMetadata.agentLevel).toBe('gold');
      expect(req.agentMetadata.commissionRate).toBe(15);
      expect(next).toHaveBeenCalledWith();
    });

    test('should not attach metadata for non-agent users', async () => {
      req.user = {
        _id: 'operator123',
        role: 'operator',
      };

      await attachAgentMetadata(req, res, next);

      expect(req.agentMetadata).toBeUndefined();
      expect(next).toHaveBeenCalledWith();
    });

    test('should use default commission rate if not provided', async () => {
      req.user = {
        _id: 'agent123',
        role: 'agent',
        agentCode: 'AG001',
        agentLevel: 'bronze',
        tenantId: 'tenant123',
      };

      await attachAgentMetadata(req, res, next);

      expect(req.agentMetadata.commissionRate).toBe(10);
    });
  });
});
