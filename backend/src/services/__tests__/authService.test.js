const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const authService = require('../authService');

// Mock dependencies
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../models/User');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should successfully register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'agent'
      };

      const hashedPassword = 'hashedPassword123';
      bcrypt.hash.mockResolvedValue(hashedPassword);

      const mockUser = {
        _id: 'userId123',
        ...userData,
        password: hashedPassword,
        save: jest.fn().mockResolvedValue(true)
      };

      User.mockImplementation(() => mockUser);
      User.findOne.mockResolvedValue(null);

      const result = await authService.registerUser(userData);

      expect(User.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
      expect(mockUser.save).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({
        _id: 'userId123',
        email: userData.email
      }));
    });

    it('should throw error if email already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123'
      };

      User.findOne.mockResolvedValue({ email: userData.email });

      await expect(authService.registerUser(userData))
        .rejects.toThrow('Email already registered');
    });
  });

  describe('authenticateUser', () => {
    it('should successfully authenticate valid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockUser = {
        _id: 'userId123',
        email: credentials.email,
        password: 'hashedPassword',
        role: 'agent',
        status: 'active'
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mockToken123');

      const result = await authService.authenticateUser(credentials);

      expect(User.findOne).toHaveBeenCalledWith({ email: credentials.email });
      expect(bcrypt.compare).toHaveBeenCalledWith(credentials.password, mockUser.password);
      expect(jwt.sign).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({
        token: 'mockToken123',
        user: expect.objectContaining({
          email: credentials.email
        })
      }));
    });

    it('should throw error for invalid password', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongPassword'
      };

      const mockUser = {
        email: credentials.email,
        password: 'hashedPassword'
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      bcrypt.compare.mockResolvedValue(false);

      await expect(authService.authenticateUser(credentials))
        .rejects.toThrow('Invalid credentials');
    });

    it('should throw error for non-existent user', async () => {
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      await expect(authService.authenticateUser({
        email: 'nonexistent@example.com',
        password: 'password'
      })).rejects.toThrow('User not found');
    });
  });

  describe('verifyToken', () => {
    it('should successfully verify valid token', () => {
      const token = 'validToken123';
      const decoded = {
        userId: 'userId123',
        email: 'test@example.com',
        role: 'agent'
      };

      jwt.verify.mockReturnValue(decoded);

      const result = authService.verifyToken(token);

      expect(jwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
      expect(result).toEqual(decoded);
    });

    it('should throw error for invalid token', () => {
      const token = 'invalidToken';
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => authService.verifyToken(token)).toThrow('Invalid token');
    });
  });

  describe('changePassword', () => {
    it('should successfully change password', async () => {
      const userId = 'userId123';
      const oldPassword = 'oldPassword123';
      const newPassword = 'newPassword456';

      const mockUser = {
        _id: userId,
        password: 'hashedOldPassword',
        save: jest.fn().mockResolvedValue(true)
      };

      User.findById.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      bcrypt.hash.mockResolvedValue('hashedNewPassword');

      await authService.changePassword(userId, oldPassword, newPassword);

      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(bcrypt.compare).toHaveBeenCalledWith(oldPassword, mockUser.password);
      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 10);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should throw error for incorrect old password', async () => {
      const userId = 'userId123';
      const mockUser = {
        password: 'hashedOldPassword'
      };

      User.findById.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      await expect(authService.changePassword(userId, 'wrongOld', 'newPassword'))
        .rejects.toThrow('Current password is incorrect');
    });
  });
});
