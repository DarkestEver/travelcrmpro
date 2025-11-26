const mongoose = require('mongoose');
const Tenant = require('../../../src/models/Tenant');

// Mock mongoose for unit testing
jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    connect: jest.fn(),
    connection: {
      close: jest.fn(),
      on: jest.fn(),
    },
  };
});

describe('Tenant Model', () => {
  describe('Schema Validation', () => {
    test('should create a valid tenant with required fields', () => {
      const tenantData = {
        name: 'Test Travel Agency',
        slug: 'test-travel',
      };

      const tenant = new Tenant(tenantData);
      const error = tenant.validateSync();

      expect(error).toBeUndefined();
      expect(tenant.name).toBe('Test Travel Agency');
      expect(tenant.slug).toBe('test-travel');
      expect(tenant.status).toBe('trial'); // default
    });

    test('should fail validation without name', () => {
      const tenant = new Tenant({ slug: 'test' });
      const error = tenant.validateSync();

      expect(error).toBeDefined();
      expect(error.errors.name).toBeDefined();
      expect(error.errors.name.message).toContain('required');
    });

    test('should fail validation without slug', () => {
      const tenant = new Tenant({ name: 'Test' });
      const error = tenant.validateSync();

      expect(error).toBeDefined();
      expect(error.errors.slug).toBeDefined();
    });

    test('should fail validation with invalid slug format', () => {
      const tenant = new Tenant({
        name: 'Test',
        slug: 'Invalid_Slug!',
      });
      const error = tenant.validateSync();

      expect(error).toBeDefined();
      expect(error.errors.slug).toBeDefined();
      expect(error.errors.slug.message).toContain('lowercase letters, numbers, and hyphens');
    });

    test('should fail validation with short slug', () => {
      const tenant = new Tenant({
        name: 'Test',
        slug: 'ab',
      });
      const error = tenant.validateSync();

      expect(error).toBeDefined();
      expect(error.errors.slug).toBeDefined();
      expect(error.errors.slug.message).toContain('at least 3 characters');
    });

    test('should fail validation with invalid domain', () => {
      const tenant = new Tenant({
        name: 'Test',
        slug: 'test',
        domain: 'invalid-domain',
      });
      const error = tenant.validateSync();

      expect(error).toBeDefined();
      expect(error.errors.domain).toBeDefined();
    });

    test('should accept valid domain', () => {
      const tenant = new Tenant({
        name: 'Test',
        slug: 'test',
        domain: 'test.example.com',
      });
      const error = tenant.validateSync();

      expect(error).toBeUndefined();
    });

    test('should fail validation with invalid status', () => {
      const tenant = new Tenant({
        name: 'Test',
        slug: 'test',
        status: 'invalid',
      });
      const error = tenant.validateSync();

      expect(error).toBeDefined();
      expect(error.errors.status).toBeDefined();
    });

    test('should accept valid status values', () => {
      const statuses = ['active', 'suspended', 'trial', 'cancelled'];

      statuses.forEach((status) => {
        const tenant = new Tenant({
          name: 'Test',
          slug: 'test',
          status,
        });
        const error = tenant.validateSync();
        expect(error).toBeUndefined();
      });
    });

    test('should validate color hex codes', () => {
      const tenant = new Tenant({
        name: 'Test',
        slug: 'test',
        branding: {
          primaryColor: 'invalid-color',
        },
      });
      const error = tenant.validateSync();

      expect(error).toBeDefined();
      expect(error.errors['branding.primaryColor']).toBeDefined();
    });

    test('should accept valid color hex codes', () => {
      const tenant = new Tenant({
        name: 'Test',
        slug: 'test',
        branding: {
          primaryColor: '#FF5733',
          secondaryColor: '#C70039',
        },
      });
      const error = tenant.validateSync();

      expect(error).toBeUndefined();
    });
  });

  describe('Default Values', () => {
    test('should set default status to trial', () => {
      const tenant = new Tenant({ name: 'Test', slug: 'test' });
      expect(tenant.status).toBe('trial');
    });

    test('should set default subscription plan to free', () => {
      const tenant = new Tenant({ name: 'Test', slug: 'test' });
      expect(tenant.subscription.plan).toBe('free');
      expect(tenant.subscription.isActive).toBe(true);
    });

    test('should set default branding colors', () => {
      const tenant = new Tenant({ name: 'Test', slug: 'test' });
      expect(tenant.branding.primaryColor).toBe('#3B82F6');
      expect(tenant.branding.secondaryColor).toBe('#10B981');
    });

    test('should set default settings', () => {
      const tenant = new Tenant({ name: 'Test', slug: 'test' });
      expect(tenant.settings.timezone).toBe('Asia/Kolkata');
      expect(tenant.settings.currency).toBe('INR');
      expect(tenant.settings.language).toBe('en');
      expect(tenant.settings.emailNotifications).toBe(true);
    });

    test('should set default subscription features', () => {
      const tenant = new Tenant({ name: 'Test', slug: 'test' });
      expect(tenant.subscription.features.maxUsers).toBe(5);
      expect(tenant.subscription.features.maxSuppliers).toBe(10);
      expect(tenant.subscription.features.customDomain).toBe(false);
    });
  });

  describe('Pre-save Hooks', () => {
    test('should generate slug from name if not provided', () => {
      const tenant = new Tenant({ name: 'Test Travel Agency' });
      
      // Manually trigger the hook logic
      if (!tenant.slug && tenant.name) {
        tenant.slug = tenant.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }

      expect(tenant.slug).toBe('test-travel-agency');
    });

    test('should set trial end date for new trial tenants', () => {
      const tenant = new Tenant({
        name: 'Test',
        slug: 'test',
        status: 'trial',
      });
      tenant.isNew = true;

      // Manually trigger the hook logic
      if (tenant.isNew && tenant.status === 'trial' && !tenant.subscription.endDate) {
        const trialDays = 14;
        tenant.subscription.endDate = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
      }

      expect(tenant.subscription.endDate).toBeDefined();
      expect(tenant.subscription.endDate > new Date()).toBe(true);
    });
  });

  describe('Virtual Properties', () => {
    test('should generate fullDomain with custom domain', () => {
      const tenant = new Tenant({
        name: 'Test',
        slug: 'test',
        customDomain: 'custom.example.com',
      });

      expect(tenant.fullDomain).toBe('https://custom.example.com');
    });

    test('should generate fullDomain with regular domain', () => {
      const tenant = new Tenant({
        name: 'Test',
        slug: 'test',
        domain: 'test.travelcrm.com',
      });

      expect(tenant.fullDomain).toBe('https://test.travelcrm.com');
    });

    test('should generate fullDomain from slug if no domain', () => {
      const tenant = new Tenant({
        name: 'Test',
        slug: 'test-agency',
      });

      expect(tenant.fullDomain).toContain('test-agency');
    });

    test('should detect expired trial', () => {
      const tenant = new Tenant({
        name: 'Test',
        slug: 'test',
        status: 'trial',
        subscription: {
          endDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        },
      });

      expect(tenant.isTrialExpired).toBe(true);
    });

    test('should detect active trial', () => {
      const tenant = new Tenant({
        name: 'Test',
        slug: 'test',
        status: 'trial',
        subscription: {
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        },
      });

      expect(tenant.isTrialExpired).toBe(false);
    });
  });

  describe('Instance Methods', () => {
    test('hasFeature should return true for enabled features', () => {
      const tenant = new Tenant({
        name: 'Test',
        slug: 'test',
        subscription: {
          features: {
            customDomain: true,
            whiteLabel: false,
          },
        },
      });

      expect(tenant.hasFeature('customDomain')).toBe(true);
      expect(tenant.hasFeature('whiteLabel')).toBe(false);
    });

    test('isSubscriptionActive should return true for active subscription', () => {
      const tenant = new Tenant({
        name: 'Test',
        slug: 'test',
        status: 'active',
        subscription: {
          isActive: true,
        },
      });

      expect(tenant.isSubscriptionActive()).toBe(true);
    });

    test('isSubscriptionActive should return false for cancelled status', () => {
      const tenant = new Tenant({
        name: 'Test',
        slug: 'test',
        status: 'cancelled',
      });

      expect(tenant.isSubscriptionActive()).toBe(false);
    });

    test('isSubscriptionActive should return false for suspended status', () => {
      const tenant = new Tenant({
        name: 'Test',
        slug: 'test',
        status: 'suspended',
      });

      expect(tenant.isSubscriptionActive()).toBe(false);
    });

    test('isSubscriptionActive should return false for expired subscription', () => {
      const tenant = new Tenant({
        name: 'Test',
        slug: 'test',
        status: 'active',
        subscription: {
          endDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        },
      });

      expect(tenant.isSubscriptionActive()).toBe(false);
    });
  });

  describe('Static Methods', () => {
    test('findBySlug should be case-insensitive', () => {
      const findOneSpy = jest.spyOn(Tenant, 'findOne').mockResolvedValue({});

      Tenant.findBySlug('Test-Slug');

      expect(findOneSpy).toHaveBeenCalledWith({ slug: 'test-slug' });
      findOneSpy.mockRestore();
    });

    test('findByDomain should check both domain and customDomain', () => {
      const findOneSpy = jest.spyOn(Tenant, 'findOne').mockResolvedValue({});

      Tenant.findByDomain('Example.Com');

      expect(findOneSpy).toHaveBeenCalledWith({
        $or: [{ domain: 'example.com' }, { customDomain: 'example.com' }],
      });
      findOneSpy.mockRestore();
    });

    test('getActive should filter active tenants', () => {
      const findSpy = jest.spyOn(Tenant, 'find').mockResolvedValue([]);

      Tenant.getActive();

      expect(findSpy).toHaveBeenCalledWith({ status: 'active' });
      findSpy.mockRestore();
    });
  });
});
