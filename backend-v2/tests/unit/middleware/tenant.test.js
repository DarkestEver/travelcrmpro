const { resolveTenant } = require('../../../src/middleware/tenant');
const Tenant = require('../../../src/models/Tenant');

jest.mock('../../../src/models/Tenant');
jest.mock('../../../src/lib/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));
jest.mock('../../../src/config', () => ({
  tenant: {
    identificationStrategy: 'subdomain',
    baseDomain: 'travelcrm.com',
  },
}));

describe('Tenant Middleware', () => {
  let req, res, next;

  const mockTenant = {
    _id: 'tenant123',
    name: 'Acme Travel',
    slug: 'acme',
    domain: 'acme.travelcrm.com',
    customDomain: null,
    status: 'active',
  };

  beforeEach(() => {
    req = {
      hostname: '',
      path: '',
      url: '',
      originalUrl: '',
      get: jest.fn((header) => {
        if (header === 'host') return req.hostname;
        if (header === 'X-Tenant-Slug') return null;
        if (header === 'X-Tenant-ID') return null;
        return null;
      }),
    };
    res = {};
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('Subdomain Strategy', () => {
    test('should resolve tenant from subdomain', async () => {
      Tenant.findOne.mockResolvedValueOnce(mockTenant); // For subdomain check
      req.hostname = 'acme.travelcrm.com';

      await resolveTenant(req, res, next);

      // Middleware tries custom domain first with empty result, then subdomain
      expect(req.tenant).toEqual(mockTenant);
      expect(next).toHaveBeenCalledWith();
    });

    test('should handle multi-part subdomain', async () => {
      // Skip 'api' subdomain, try custom domain (fail), then try path
      Tenant.findOne.mockResolvedValueOnce(null); // Custom domain fails
      Tenant.findOne.mockResolvedValueOnce(null); // Path strategy fails
      req.hostname = 'api.acme.travelcrm.com';
      req.path = '/dashboard';

      await resolveTenant(req, res, next);

      // Should call next with error since no tenant found
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('Error Handling', () => {
    test('should call next with error when tenant not found (required)', async () => {
      Tenant.findOne.mockResolvedValue(null); // All strategies fail
      req.hostname = 'unknown.travelcrm.com';
      req.path = '/dashboard';

      await resolveTenant(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Tenant not found. Please check your URL or contact support.');
      expect(error.code).toBe('TENANT_NOT_FOUND');
    });

    test('should call next with error on database error', async () => {
      const dbError = new Error('Database connection failed');
      Tenant.findOne.mockRejectedValue(dbError);
      req.hostname = 'acme.travelcrm.com';

      await resolveTenant(req, res, next);

      expect(next).toHaveBeenCalledWith(dbError);
    });
  });
});
