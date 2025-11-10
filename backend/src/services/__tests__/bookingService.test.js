const Booking = require('../../models/Booking');
const bookingService = require('../bookingService');

jest.mock('../../models/Booking');

describe('BookingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createBooking', () => {
    it('should create a new booking successfully', async () => {
      const bookingData = {
        bookingNumber: 'BK-2024-001',
        customerId: 'customer123',
        itineraryId: 'itinerary123',
        totalAmount: 5000,
        tenantId: 'tenant123',
        createdBy: 'agent123'
      };

      const mockBooking = {
        _id: 'booking123',
        ...bookingData,
        status: 'pending',
        paymentStatus: 'unpaid',
        save: jest.fn().mockResolvedValue(true)
      };

      Booking.mockImplementation(() => mockBooking);

      const result = await bookingService.createBooking(bookingData);

      expect(mockBooking.save).toHaveBeenCalled();
      expect(result.status).toBe('pending');
      expect(result.paymentStatus).toBe('unpaid');
    });

    it('should auto-generate booking number if not provided', async () => {
      const bookingData = {
        customerId: 'customer123',
        totalAmount: 5000,
        tenantId: 'tenant123'
      };

      Booking.countDocuments.mockResolvedValue(5);

      const mockBooking = {
        save: jest.fn().mockResolvedValue(true)
      };

      Booking.mockImplementation(() => mockBooking);

      const result = await bookingService.createBooking(bookingData);

      expect(mockBooking.bookingNumber).toMatch(/BK-\d{4}-\d{3}/);
    });
  });

  describe('confirmBooking', () => {
    it('should confirm a pending booking', async () => {
      const bookingId = 'booking123';

      const mockBooking = {
        _id: bookingId,
        status: 'pending',
        confirmedAt: null,
        save: jest.fn().mockResolvedValue(true)
      };

      Booking.findById.mockResolvedValue(mockBooking);

      const result = await bookingService.confirmBooking(bookingId);

      expect(mockBooking.status).toBe('confirmed');
      expect(mockBooking.confirmedAt).toBeDefined();
      expect(mockBooking.save).toHaveBeenCalled();
    });

    it('should throw error if booking already confirmed', async () => {
      const mockBooking = {
        status: 'confirmed'
      };

      Booking.findById.mockResolvedValue(mockBooking);

      await expect(bookingService.confirmBooking('booking123'))
        .rejects.toThrow('Booking is already confirmed');
    });
  });

  describe('cancelBooking', () => {
    it('should cancel a booking', async () => {
      const bookingId = 'booking123';
      const reason = 'Customer request';

      const mockBooking = {
        _id: bookingId,
        status: 'confirmed',
        cancellationReason: null,
        cancelledAt: null,
        save: jest.fn().mockResolvedValue(true)
      };

      Booking.findById.mockResolvedValue(mockBooking);

      const result = await bookingService.cancelBooking(bookingId, reason);

      expect(mockBooking.status).toBe('cancelled');
      expect(mockBooking.cancellationReason).toBe(reason);
      expect(mockBooking.cancelledAt).toBeDefined();
      expect(mockBooking.save).toHaveBeenCalled();
    });

    it('should throw error if booking already completed', async () => {
      const mockBooking = {
        status: 'completed'
      };

      Booking.findById.mockResolvedValue(mockBooking);

      await expect(bookingService.cancelBooking('booking123', 'reason'))
        .rejects.toThrow('Cannot cancel completed booking');
    });
  });

  describe('addPayment', () => {
    it('should add payment to booking', async () => {
      const bookingId = 'booking123';
      const paymentData = {
        amount: 2000,
        method: 'credit_card',
        transactionId: 'TXN123'
      };

      const mockBooking = {
        _id: bookingId,
        totalAmount: 5000,
        paidAmount: 0,
        payments: [],
        paymentStatus: 'unpaid',
        save: jest.fn().mockResolvedValue(true)
      };

      Booking.findById.mockResolvedValue(mockBooking);

      const result = await bookingService.addPayment(bookingId, paymentData);

      expect(mockBooking.payments).toHaveLength(1);
      expect(mockBooking.paidAmount).toBe(2000);
      expect(mockBooking.paymentStatus).toBe('partial');
      expect(mockBooking.save).toHaveBeenCalled();
    });

    it('should update payment status to paid when fully paid', async () => {
      const mockBooking = {
        totalAmount: 5000,
        paidAmount: 3000,
        payments: [],
        paymentStatus: 'partial',
        save: jest.fn().mockResolvedValue(true)
      };

      Booking.findById.mockResolvedValue(mockBooking);

      await bookingService.addPayment('booking123', {
        amount: 2000,
        method: 'bank_transfer'
      });

      expect(mockBooking.paidAmount).toBe(5000);
      expect(mockBooking.paymentStatus).toBe('paid');
    });
  });

  describe('getBookingsByDateRange', () => {
    it('should return bookings within date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const tenantId = 'tenant123';

      const mockBookings = [
        { _id: 'b1', bookingNumber: 'BK-001' },
        { _id: 'b2', bookingNumber: 'BK-002' }
      ];

      Booking.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockBookings)
        })
      });

      const result = await bookingService.getBookingsByDateRange(startDate, endDate, tenantId);

      expect(Booking.find).toHaveBeenCalledWith({
        tenantId: tenantId,
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('calculateBookingRevenue', () => {
    it('should calculate total revenue for bookings', async () => {
      const tenantId = 'tenant123';

      const mockBookings = [
        { totalAmount: 5000, paidAmount: 5000 },
        { totalAmount: 3000, paidAmount: 3000 },
        { totalAmount: 2000, paidAmount: 1000 }
      ];

      Booking.find.mockResolvedValue(mockBookings);

      const result = await bookingService.calculateBookingRevenue(tenantId);

      expect(result).toEqual({
        totalRevenue: 10000,
        expectedRevenue: 9000,
        pendingRevenue: 1000
      });
    });
  });

  describe('getBookingStats', () => {
    it('should return booking statistics', async () => {
      const tenantId = 'tenant123';

      Booking.countDocuments.mockImplementation((query) => {
        if (query.status === 'pending') return Promise.resolve(10);
        if (query.status === 'confirmed') return Promise.resolve(25);
        if (query.status === 'completed') return Promise.resolve(50);
        if (query.status === 'cancelled') return Promise.resolve(5);
        return Promise.resolve(90);
      });

      const result = await bookingService.getBookingStats(tenantId);

      expect(result).toEqual({
        total: 90,
        pending: 10,
        confirmed: 25,
        completed: 50,
        cancelled: 5
      });
    });
  });
});
