// Mock Redis and nodemailer for testing
jest.mock('../../src/lib/redis', () => ({
  healthCheck: jest.fn().mockResolvedValue({ status: 'connected', healthy: true }),
  get: jest.fn().mockImplementation((key) => {
    if (key && key.startsWith('refresh_token:')) {
      return Promise.resolve(JSON.stringify({
        userId: 'mock-user-id',
        tenantId: 'mock-tenant-id',
        createdAt: new Date().toISOString(),
      }));
    }
    return Promise.resolve(null);
  }),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  exists: jest.fn().mockResolvedValue(0),
  setex: jest.fn().mockResolvedValue('OK'),
}));

jest.mock('nodemailer', () => ({
  createTransporter: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({
      messageId: 'test-message-id',
      accepted: ['test@example.com'],
    }),
  }),
}));

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const database = require('../../src/lib/database');
const User = require('../../src/models/User');
const Tenant = require('../../src/models/Tenant');
const Document = require('../../src/models/Document');
const Booking = require('../../src/models/Booking');

describe('Document Management API', () => {
  let tenant, tenantSlug, customer, customerToken, agent, agentToken, admin, adminToken;
  let otherCustomer, otherCustomerToken;

  beforeAll(async () => {
    await database.connect();
  });

  afterAll(async () => {
    await database.disconnect();
  });

  afterEach(async () => {
    await Document.deleteMany({});
    await Booking.deleteMany({});
    await User.deleteMany({});
    await Tenant.deleteMany({});
  });

  beforeEach(async () => {
    // Create tenant
    tenant = await Tenant.create({
      name: 'Test Travel Agency',
      slug: 'test-travel-docs-' + Date.now(),
      subdomain: 'test-travel-docs',
      email: 'admin@testtravel.com',
      status: 'active', // Required for tenant middleware to find it
      settings: {
        currency: 'INR',
        timezone: 'Asia/Kolkata',
      },
    });
    tenantSlug = tenant.slug;

    // Create customer user
    customer = await User.create({
      tenant: tenant._id,
      email: 'customer@test.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      phone: '9876543210',
      role: 'customer',
      isActive: true,
    });

    const customerLoginRes = await request(app)
      .post('/auth/login')
      .set('X-Tenant-Slug', tenantSlug)
      .send({ email: 'customer@test.com', password: 'password123' });
    customerToken = customerLoginRes.body?.data?.accessToken || '';

    // Create another customer
    otherCustomer = await User.create({
      tenant: tenant._id,
      email: 'other@test.com',
      password: 'password123',
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '9876543211',
      role: 'customer',
      isActive: true,
    });

    const otherLoginRes = await request(app)
      .post('/auth/login')
      .set('X-Tenant-Slug', tenantSlug)
      .send({ email: 'other@test.com', password: 'password123' });
    otherCustomerToken = otherLoginRes.body?.data?.accessToken || '';

    // Create agent user
    agent = await User.create({
      tenant: tenant._id,
      email: 'agent@test.com',
      password: 'password123',
      firstName: 'Agent',
      lastName: 'User',
      phone: '9876543212',
      role: 'agent',
      isActive: true,
    });

    const agentLoginRes = await request(app)
      .post('/auth/login')
      .set('X-Tenant-Slug', tenantSlug)
      .send({ email: 'agent@test.com', password: 'password123' });
    agentToken = agentLoginRes.body?.data?.accessToken || '';

    // Create admin user
    admin = await User.create({
      tenant: tenant._id,
      email: 'admin@test.com',
      password: 'password123',
      firstName: 'Admin',
      lastName: 'User',
      phone: '9876543213',
      role: 'tenant_admin',
      isActive: true,
    });

    const adminLoginRes = await request(app)
      .post('/auth/login')
      .set('X-Tenant-Slug', tenantSlug)
      .send({ email: 'admin@test.com', password: 'password123' });
    adminToken = adminLoginRes.body?.data?.accessToken || '';
  });

  describe('POST /documents/upload', () => {
    it('should upload a document', async () => {
      const res = await request(app)
        .post('/documents/upload')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          documentType: 'passport',
          documentNumber: 'A1234567',
          issueDate: '2020-01-01',
          expiryDate: '2030-01-01',
          issuedBy: 'Government of India',
          issuedCountry: 'India',
          fileName: 'passport.pdf',
          fileUrl: 'https://example.com/documents/passport.pdf',
          fileSize: 2048000,
          mimeType: 'application/pdf',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.documentType).toBe('passport');
      expect(res.body.data.documentNumber).toBe('A1234567');
      expect(res.body.data.verificationStatus).toBe('pending');
      expect(res.body.data.customer.toString()).toBe(customer._id.toString());
    });

    it('should validate document type', async () => {
      const res = await request(app)
        .post('/documents/upload')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          documentType: 'invalid_type',
          fileName: 'doc.pdf',
          fileUrl: 'https://example.com/doc.pdf',
        });

      expect(res.status).toBe(400);
    });

    it('should require file information', async () => {
      const res = await request(app)
        .post('/documents/upload')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          documentType: 'passport',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /documents/:id', () => {
    it('should get document by ID', async () => {
      const document = await Document.create({
        tenant: tenant._id,
        customer: customer._id,
        documentType: 'passport',
        fileName: 'passport.pdf',
        fileUrl: 'https://example.com/passport.pdf',
        uploadedBy: customer._id,
      });

      const res = await request(app)
        .get(`/documents/${document._id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data._id.toString()).toBe(document._id.toString());
    });

    it('should not allow access to other customers documents', async () => {
      const document = await Document.create({
        tenant: tenant._id,
        customer: otherCustomer._id,
        documentType: 'passport',
        fileName: 'passport.pdf',
        fileUrl: 'https://example.com/passport.pdf',
        uploadedBy: otherCustomer._id,
      });

      const res = await request(app)
        .get(`/documents/${document._id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(404);
    });

    it('should allow agent to view any document', async () => {
      const document = await Document.create({
        tenant: tenant._id,
        customer: customer._id,
        documentType: 'passport',
        fileName: 'passport.pdf',
        fileUrl: 'https://example.com/passport.pdf',
        uploadedBy: customer._id,
      });

      const res = await request(app)
        .get(`/documents/${document._id}`)
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('PATCH /documents/:id', () => {
    it('should update document details', async () => {
      const document = await Document.create({
        tenant: tenant._id,
        customer: customer._id,
        documentType: 'passport',
        fileName: 'passport.pdf',
        fileUrl: 'https://example.com/passport.pdf',
        uploadedBy: customer._id,
      });

      const res = await request(app)
        .patch(`/documents/${document._id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          documentNumber: 'B9876543',
          issuedCountry: 'India',
          notes: 'Updated passport details',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.documentNumber).toBe('B9876543');
      expect(res.body.data.notes).toBe('Updated passport details');
    });

    it('should not allow updating other customers documents', async () => {
      const document = await Document.create({
        tenant: tenant._id,
        customer: otherCustomer._id,
        documentType: 'passport',
        fileName: 'passport.pdf',
        fileUrl: 'https://example.com/passport.pdf',
        uploadedBy: otherCustomer._id,
      });

      const res = await request(app)
        .patch(`/documents/${document._id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ notes: 'Hacked!' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /documents/:id', () => {
    it('should delete pending document', async () => {
      const document = await Document.create({
        tenant: tenant._id,
        customer: customer._id,
        documentType: 'passport',
        fileName: 'passport.pdf',
        fileUrl: 'https://example.com/passport.pdf',
        verificationStatus: 'pending',
        uploadedBy: customer._id,
      });

      const res = await request(app)
        .delete(`/documents/${document._id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);

      const deleted = await Document.findById(document._id);
      expect(deleted).toBeNull();
    });

    it('should not allow deleting verified document', async () => {
      const document = await Document.create({
        tenant: tenant._id,
        customer: customer._id,
        documentType: 'passport',
        fileName: 'passport.pdf',
        fileUrl: 'https://example.com/passport.pdf',
        verificationStatus: 'verified',
        uploadedBy: customer._id,
      });

      const res = await request(app)
        .delete(`/documents/${document._id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Document Sharing', () => {
    it('should share document with agent', async () => {
      const document = await Document.create({
        tenant: tenant._id,
        customer: customer._id,
        documentType: 'passport',
        fileName: 'passport.pdf',
        fileUrl: 'https://example.com/passport.pdf',
        uploadedBy: customer._id,
      });

      const res = await request(app)
        .post(`/documents/${document._id}/share`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          userId: agent._id,
          permissions: 'view',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.sharedWith.length).toBe(1);
      expect(res.body.data.sharedWith[0].user.toString()).toBe(agent._id.toString());
      expect(res.body.data.sharedWith[0].permissions).toBe('view');
    });

    it('should revoke document share', async () => {
      const document = await Document.create({
        tenant: tenant._id,
        customer: customer._id,
        documentType: 'passport',
        fileName: 'passport.pdf',
        fileUrl: 'https://example.com/passport.pdf',
        uploadedBy: customer._id,
        sharedWith: [{
          user: agent._id,
          permissions: 'view',
        }],
      });

      const res = await request(app)
        .delete(`/documents/${document._id}/share/${agent._id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);

      const updated = await Document.findById(document._id);
      expect(updated.sharedWith.length).toBe(0);
    });
  });

  describe('Document Verification (Agent/Admin)', () => {
    it('should allow agent to verify document', async () => {
      const document = await Document.create({
        tenant: tenant._id,
        customer: customer._id,
        documentType: 'passport',
        fileName: 'passport.pdf',
        fileUrl: 'https://example.com/passport.pdf',
        verificationStatus: 'pending',
        uploadedBy: customer._id,
      });

      const res = await request(app)
        .post(`/documents/${document._id}/verify`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          notes: 'Document verified successfully',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.verificationStatus).toBe('verified');
      expect(res.body.data.verifiedBy.toString()).toBe(agent._id.toString());
      expect(res.body.data.verificationNotes).toBe('Document verified successfully');
      expect(res.body.data.verifiedAt).toBeDefined();
    });

    it('should allow agent to reject document', async () => {
      const document = await Document.create({
        tenant: tenant._id,
        customer: customer._id,
        documentType: 'visa',
        fileName: 'visa.pdf',
        fileUrl: 'https://example.com/visa.pdf',
        verificationStatus: 'pending',
        uploadedBy: customer._id,
      });

      const res = await request(app)
        .post(`/documents/${document._id}/reject`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          reason: 'Document is blurry and unreadable',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.verificationStatus).toBe('rejected');
      expect(res.body.data.rejectionReason).toBe('Document is blurry and unreadable');
    });

    it('should require rejection reason', async () => {
      const document = await Document.create({
        tenant: tenant._id,
        customer: customer._id,
        documentType: 'visa',
        fileName: 'visa.pdf',
        fileUrl: 'https://example.com/visa.pdf',
        verificationStatus: 'pending',
        uploadedBy: customer._id,
      });

      const res = await request(app)
        .post(`/documents/${document._id}/reject`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should not allow customer to verify document', async () => {
      const document = await Document.create({
        tenant: tenant._id,
        customer: customer._id,
        documentType: 'passport',
        fileName: 'passport.pdf',
        fileUrl: 'https://example.com/passport.pdf',
        verificationStatus: 'pending',
        uploadedBy: customer._id,
      });

      const res = await request(app)
        .post(`/documents/${document._id}/verify`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({});

      expect(res.status).toBe(403);
    });
  });

  describe('GET /documents/pending-verification', () => {
    it('should get pending verification documents', async () => {
      await Document.create({
        tenant: tenant._id,
        customer: customer._id,
        documentType: 'passport',
        fileName: 'passport.pdf',
        fileUrl: 'https://example.com/passport.pdf',
        verificationStatus: 'pending',
        uploadedBy: customer._id,
      });

      await Document.create({
        tenant: tenant._id,
        customer: customer._id,
        documentType: 'visa',
        fileName: 'visa.pdf',
        fileUrl: 'https://example.com/visa.pdf',
        verificationStatus: 'in_review',
        uploadedBy: customer._id,
      });

      const res = await request(app)
        .get('/documents/pending-verification')
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.documents.length).toBe(2);
      expect(res.body.data.documents.every(d => 
        ['pending', 'in_review'].includes(d.verificationStatus)
      )).toBe(true);
    });

    it('should filter by document type', async () => {
      await Document.create({
        tenant: tenant._id,
        customer: customer._id,
        documentType: 'passport',
        fileName: 'passport.pdf',
        fileUrl: 'https://example.com/passport.pdf',
        verificationStatus: 'pending',
        uploadedBy: customer._id,
      });

      const res = await request(app)
        .get('/documents/pending-verification?documentType=passport')
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.documents.every(d => d.documentType === 'passport')).toBe(true);
    });
  });

  describe('GET /documents/expiring', () => {
    it('should get expiring documents', async () => {
      await Document.create({
        tenant: tenant._id,
        customer: customer._id,
        documentType: 'passport',
        fileName: 'passport.pdf',
        fileUrl: 'https://example.com/passport.pdf',
        expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        uploadedBy: customer._id,
      });

      await Document.create({
        tenant: tenant._id,
        customer: customer._id,
        documentType: 'visa',
        fileName: 'visa.pdf',
        fileUrl: 'https://example.com/visa.pdf',
        expiryDate: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000), // 200 days
        uploadedBy: customer._id,
      });

      const res = await request(app)
        .get('/documents/expiring?days=90')
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.documents.length).toBe(1);
    });
  });

  describe('Document Model Methods', () => {
    it('should calculate days until expiry', async () => {
      const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      const document = await Document.create({
        tenant: tenant._id,
        customer: customer._id,
        documentType: 'passport',
        fileName: 'passport.pdf',
        fileUrl: 'https://example.com/passport.pdf',
        expiryDate,
        uploadedBy: customer._id,
      });

      const retrieved = await Document.findById(document._id);
      expect(retrieved.daysUntilExpiry).toBeGreaterThan(29);
      expect(retrieved.daysUntilExpiry).toBeLessThan(31);
    });

    it('should automatically mark expired documents', async () => {
      const document = await Document.create({
        tenant: tenant._id,
        customer: customer._id,
        documentType: 'passport',
        fileName: 'passport.pdf',
        fileUrl: 'https://example.com/passport.pdf',
        expiryDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Yesterday
        verificationStatus: 'verified',
        uploadedBy: customer._id,
      });

      const retrieved = await Document.findById(document._id);
      expect(retrieved.verificationStatus).toBe('expired');
    });

    it('should record expiry alerts', async () => {
      const document = await Document.create({
        tenant: tenant._id,
        customer: customer._id,
        documentType: 'passport',
        fileName: 'passport.pdf',
        fileUrl: 'https://example.com/passport.pdf',
        expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        uploadedBy: customer._id,
      });

      document.recordExpiryAlert(60);
      await document.save();

      const retrieved = await Document.findById(document._id);
      expect(retrieved.expiryAlerts.length).toBe(1);
      expect(retrieved.expiryAlerts[0].daysBeforeExpiry).toBe(60);
    });
  });

  describe('GET /documents', () => {
    it('should get all documents with filters (agent)', async () => {
      await Document.create({
        tenant: tenant._id,
        customer: customer._id,
        documentType: 'passport',
        fileName: 'passport.pdf',
        fileUrl: 'https://example.com/passport.pdf',
        verificationStatus: 'verified',
        uploadedBy: customer._id,
      });

      await Document.create({
        tenant: tenant._id,
        customer: otherCustomer._id,
        documentType: 'visa',
        fileName: 'visa.pdf',
        fileUrl: 'https://example.com/visa.pdf',
        verificationStatus: 'pending',
        uploadedBy: otherCustomer._id,
      });

      const res = await request(app)
        .get('/documents')
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.documents.length).toBe(2);
    });

    it('should filter by verification status', async () => {
      await Document.create({
        tenant: tenant._id,
        customer: customer._id,
        documentType: 'passport',
        fileName: 'passport.pdf',
        fileUrl: 'https://example.com/passport.pdf',
        verificationStatus: 'verified',
        uploadedBy: customer._id,
      });

      const res = await request(app)
        .get('/documents?verificationStatus=verified')
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.documents.every(d => d.verificationStatus === 'verified')).toBe(true);
    });

    it('should not allow customer to access all documents', async () => {
      const res = await request(app)
        .get('/documents')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Tenant Isolation', () => {
    it('should not show documents from other tenants', async () => {
      const otherTenant = await Tenant.create({
        name: 'Other Agency',
        slug: 'other-agency-' + Date.now(),
        subdomain: 'other-agency',
        email: 'admin@other.com',
        status: 'active', // Required for tenant middleware to find it
      });

      const otherTenantCustomer = await User.create({
        tenant: otherTenant._id,
        email: 'customer@other.com',
        password: 'password123',
        firstName: 'Other',
        lastName: 'Customer',
        phone: '1234567890',
        role: 'customer',
        isActive: true,
      });

      await Document.create({
        tenant: otherTenant._id,
        customer: otherTenantCustomer._id,
        documentType: 'passport',
        fileName: 'other-passport.pdf',
        fileUrl: 'https://example.com/other-passport.pdf',
        uploadedBy: otherTenantCustomer._id,
      });

      const res = await request(app)
        .get('/documents')
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.documents.every(d => 
        d.tenant.toString() === tenant._id.toString()
      )).toBe(true);
    });
  });
});
