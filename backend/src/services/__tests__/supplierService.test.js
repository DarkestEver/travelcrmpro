const Supplier = require('../../models/Supplier');
const supplierService = require('../supplierService');

jest.mock('../../models/Supplier');

describe('SupplierService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSupplier', () => {
    it('should create a new supplier successfully', async () => {
      const supplierData = {
        name: 'Hotel Paradise',
        email: 'contact@hotelparadise.com',
        phone: '+1234567890',
        serviceType: 'hotel',
        tenantId: 'tenant123',
        createdBy: 'admin123'
      };

      const mockSupplier = {
        _id: 'supplier123',
        ...supplierData,
        status: 'pending',
        rating: 0,
        save: jest.fn().mockResolvedValue(true)
      };

      Supplier.mockImplementation(() => mockSupplier);
      Supplier.findOne.mockResolvedValue(null);

      const result = await supplierService.createSupplier(supplierData);

      expect(Supplier.findOne).toHaveBeenCalledWith({
        email: supplierData.email,
        tenantId: supplierData.tenantId
      });
      expect(mockSupplier.save).toHaveBeenCalled();
      expect(result.status).toBe('pending');
    });

    it('should throw error if supplier email already exists', async () => {
      Supplier.findOne.mockResolvedValue({ email: 'existing@supplier.com' });

      await expect(supplierService.createSupplier({
        email: 'existing@supplier.com',
        tenantId: 'tenant123'
      })).rejects.toThrow('Supplier with this email already exists');
    });
  });

  describe('approveSupplier', () => {
    it('should approve pending supplier', async () => {
      const supplierId = 'supplier123';

      const mockSupplier = {
        _id: supplierId,
        status: 'pending',
        save: jest.fn().mockResolvedValue(true)
      };

      Supplier.findById.mockResolvedValue(mockSupplier);

      const result = await supplierService.approveSupplier(supplierId);

      expect(mockSupplier.status).toBe('active');
      expect(mockSupplier.save).toHaveBeenCalled();
    });

    it('should throw error if supplier not found', async () => {
      Supplier.findById.mockResolvedValue(null);

      await expect(supplierService.approveSupplier('nonexistent'))
        .rejects.toThrow('Supplier not found');
    });
  });

  describe('suspendSupplier', () => {
    it('should suspend active supplier', async () => {
      const supplierId = 'supplier123';
      const reason = 'Quality issues';

      const mockSupplier = {
        _id: supplierId,
        status: 'active',
        suspensionReason: null,
        save: jest.fn().mockResolvedValue(true)
      };

      Supplier.findById.mockResolvedValue(mockSupplier);

      const result = await supplierService.suspendSupplier(supplierId, reason);

      expect(mockSupplier.status).toBe('suspended');
      expect(mockSupplier.suspensionReason).toBe(reason);
      expect(mockSupplier.save).toHaveBeenCalled();
    });
  });

  describe('rateSupplier', () => {
    it('should add rating to supplier', async () => {
      const supplierId = 'supplier123';
      const rating = 4;

      const mockSupplier = {
        _id: supplierId,
        ratings: [],
        rating: 0,
        ratingCount: 0,
        save: jest.fn().mockResolvedValue(true)
      };

      Supplier.findById.mockResolvedValue(mockSupplier);

      await supplierService.rateSupplier(supplierId, rating, 'agent123');

      expect(mockSupplier.ratings).toHaveLength(1);
      expect(mockSupplier.ratings[0].rating).toBe(4);
      expect(mockSupplier.save).toHaveBeenCalled();
    });

    it('should validate rating range', async () => {
      const mockSupplier = { _id: 'supplier123' };
      Supplier.findById.mockResolvedValue(mockSupplier);

      await expect(supplierService.rateSupplier('supplier123', 6, 'agent123'))
        .rejects.toThrow('Rating must be between 1 and 5');
    });
  });

  describe('getSuppliersByServiceType', () => {
    it('should return suppliers filtered by service type', async () => {
      const serviceType = 'hotel';
      const tenantId = 'tenant123';

      const mockSuppliers = [
        { _id: 's1', name: 'Hotel A', serviceType: 'hotel' },
        { _id: 's2', name: 'Hotel B', serviceType: 'hotel' }
      ];

      Supplier.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockSuppliers)
      });

      const result = await supplierService.getSuppliersByServiceType(serviceType, tenantId);

      expect(Supplier.find).toHaveBeenCalledWith({
        serviceType: serviceType,
        tenantId: tenantId,
        status: 'active'
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('updateCommissionRate', () => {
    it('should update supplier commission rate', async () => {
      const supplierId = 'supplier123';
      const newRate = 15;

      const mockSupplier = {
        _id: supplierId,
        commissionRate: 10,
        save: jest.fn().mockResolvedValue(true)
      };

      Supplier.findById.mockResolvedValue(mockSupplier);

      await supplierService.updateCommissionRate(supplierId, newRate);

      expect(mockSupplier.commissionRate).toBe(15);
      expect(mockSupplier.save).toHaveBeenCalled();
    });

    it('should validate commission rate range', async () => {
      const mockSupplier = { _id: 'supplier123' };
      Supplier.findById.mockResolvedValue(mockSupplier);

      await expect(supplierService.updateCommissionRate('supplier123', 150))
        .rejects.toThrow('Commission rate must be between 0 and 100');
    });
  });
});
