const Customer = require('../../models/Customer');
const customerService = require('../customerService');

jest.mock('../../models/Customer');

describe('CustomerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCustomer', () => {
    it('should create a new customer successfully', async () => {
      const customerData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        country: 'USA',
        tenantId: 'tenant123',
        createdBy: 'agent123'
      };

      const mockCustomer = {
        _id: 'customer123',
        ...customerData,
        status: 'active',
        save: jest.fn().mockResolvedValue(true)
      };

      Customer.mockImplementation(() => mockCustomer);
      Customer.findOne.mockResolvedValue(null);

      const result = await customerService.createCustomer(customerData);

      expect(Customer.findOne).toHaveBeenCalledWith({
        email: customerData.email,
        tenantId: customerData.tenantId
      });
      expect(mockCustomer.save).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({
        email: customerData.email,
        name: customerData.name
      }));
    });

    it('should throw error if customer email already exists for tenant', async () => {
      const customerData = {
        email: 'existing@example.com',
        tenantId: 'tenant123'
      };

      Customer.findOne.mockResolvedValue({ email: customerData.email });

      await expect(customerService.createCustomer(customerData))
        .rejects.toThrow('Customer with this email already exists');
    });

    it('should validate required fields', async () => {
      const invalidData = {
        email: 'test@example.com'
        // missing name, phone, tenantId
      };

      await expect(customerService.createCustomer(invalidData))
        .rejects.toThrow();
    });
  });

  describe('getCustomersByAgent', () => {
    it('should return customers for specific agent', async () => {
      const agentId = 'agent123';
      const tenantId = 'tenant123';

      const mockCustomers = [
        { _id: 'c1', name: 'Customer 1', createdBy: agentId },
        { _id: 'c2', name: 'Customer 2', createdBy: agentId }
      ];

      Customer.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockCustomers)
      });

      const result = await customerService.getCustomersByAgent(agentId, tenantId);

      expect(Customer.find).toHaveBeenCalledWith({
        createdBy: agentId,
        tenantId: tenantId
      });
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Customer 1');
    });

    it('should return empty array if no customers found', async () => {
      Customer.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([])
      });

      const result = await customerService.getCustomersByAgent('agent123', 'tenant123');
      expect(result).toEqual([]);
    });
  });

  describe('updateCustomer', () => {
    it('should update customer successfully', async () => {
      const customerId = 'customer123';
      const updateData = {
        name: 'Updated Name',
        phone: '+9876543210'
      };

      const mockUpdatedCustomer = {
        _id: customerId,
        ...updateData,
        email: 'test@example.com'
      };

      Customer.findByIdAndUpdate.mockResolvedValue(mockUpdatedCustomer);

      const result = await customerService.updateCustomer(customerId, updateData);

      expect(Customer.findByIdAndUpdate).toHaveBeenCalledWith(
        customerId,
        updateData,
        { new: true, runValidators: true }
      );
      expect(result.name).toBe('Updated Name');
    });

    it('should throw error if customer not found', async () => {
      Customer.findByIdAndUpdate.mockResolvedValue(null);

      await expect(customerService.updateCustomer('nonexistent', {}))
        .rejects.toThrow('Customer not found');
    });
  });

  describe('deleteCustomer', () => {
    it('should soft delete customer (set status to inactive)', async () => {
      const customerId = 'customer123';

      const mockCustomer = {
        _id: customerId,
        status: 'inactive'
      };

      Customer.findByIdAndUpdate.mockResolvedValue(mockCustomer);

      const result = await customerService.deleteCustomer(customerId);

      expect(Customer.findByIdAndUpdate).toHaveBeenCalledWith(
        customerId,
        { status: 'inactive' },
        { new: true }
      );
      expect(result.status).toBe('inactive');
    });
  });

  describe('searchCustomers', () => {
    it('should search customers by name or email', async () => {
      const searchTerm = 'john';
      const tenantId = 'tenant123';

      const mockCustomers = [
        { name: 'John Doe', email: 'john@example.com' },
        { name: 'Johnny Test', email: 'johnny@example.com' }
      ];

      Customer.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockCustomers)
      });

      const result = await customerService.searchCustomers(searchTerm, tenantId);

      expect(Customer.find).toHaveBeenCalledWith({
        tenantId: tenantId,
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { email: { $regex: searchTerm, $options: 'i' } }
        ]
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('getCustomerStats', () => {
    it('should return customer statistics', async () => {
      const tenantId = 'tenant123';

      Customer.countDocuments.mockImplementation((query) => {
        if (query.status === 'active') return Promise.resolve(50);
        if (query.status === 'inactive') return Promise.resolve(10);
        return Promise.resolve(60);
      });

      const result = await customerService.getCustomerStats(tenantId);

      expect(result).toEqual({
        total: 60,
        active: 50,
        inactive: 10
      });
    });
  });
});
