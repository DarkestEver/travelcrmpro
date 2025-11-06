const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const redis = require('../config/redis');

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
      },
      path: '/socket.io/',
    });

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;

        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        socket.userRole = decoded.role;

        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    // Connection handling
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    logger.info('WebSocket service initialized');
  }

  handleConnection(socket) {
    const userId = socket.userId;

    logger.info(`User ${userId} connected via WebSocket`);

    // Store connection
    this.connectedUsers.set(userId, socket.id);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Update user online status
    this.updateUserStatus(userId, 'online');

    // Handle typing indicators
    socket.on('typing:start', (data) => {
      this.handleTypingStart(socket, data);
    });

    socket.on('typing:stop', (data) => {
      this.handleTypingStop(socket, data);
    });

    // Handle messages
    socket.on('message:send', async (data) => {
      await this.handleMessage(socket, data);
    });

    // Handle notifications acknowledgment
    socket.on('notification:read', async (notificationId) => {
      await this.markNotificationRead(userId, notificationId);
    });

    // Handle presence
    socket.on('presence:update', (status) => {
      this.updateUserStatus(userId, status);
    });

    // Disconnection
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });
  }

  handleDisconnection(socket) {
    const userId = socket.userId;

    logger.info(`User ${userId} disconnected from WebSocket`);

    this.connectedUsers.delete(userId);
    this.updateUserStatus(userId, 'offline');
  }

  handleTypingStart(socket, data) {
    const { conversationId } = data;
    socket.to(`conversation:${conversationId}`).emit('typing:start', {
      userId: socket.userId,
      conversationId,
    });
  }

  handleTypingStop(socket, data) {
    const { conversationId } = data;
    socket.to(`conversation:${conversationId}`).emit('typing:stop', {
      userId: socket.userId,
      conversationId,
    });
  }

  async handleMessage(socket, data) {
    try {
      const { conversationId, recipientId, message } = data;

      // Broadcast to conversation participants
      this.io.to(`conversation:${conversationId}`).emit('message:new', {
        senderId: socket.userId,
        conversationId,
        message,
        timestamp: new Date().toISOString(),
      });

      // Send direct notification to recipient if online
      if (this.isUserOnline(recipientId)) {
        this.io.to(`user:${recipientId}`).emit('message:notification', {
          senderId: socket.userId,
          conversationId,
          preview: message.substring(0, 50),
        });
      }

      logger.info(`Message sent from ${socket.userId} to ${recipientId}`);
    } catch (error) {
      logger.error('Error handling message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  async markNotificationRead(userId, notificationId) {
    try {
      // Implementation depends on notification storage
      logger.info(`Notification ${notificationId} marked as read by ${userId}`);
    } catch (error) {
      logger.error('Error marking notification as read:', error);
    }
  }

  async updateUserStatus(userId, status) {
    try {
      await redis.set(
        `user:status:${userId}`,
        JSON.stringify({
          status,
          lastSeen: new Date().toISOString(),
        }),
        'EX',
        300 // 5 minutes expiry
      );

      // Broadcast status update
      this.io.emit('user:status', {
        userId,
        status,
      });
    } catch (error) {
      logger.error('Error updating user status:', error);
    }
  }

  // Public methods for sending real-time updates

  /**
   * Send notification to specific user
   */
  sendNotificationToUser(userId, notification) {
    if (this.isUserOnline(userId)) {
      this.io.to(`user:${userId}`).emit('notification:new', notification);
      logger.info(`Real-time notification sent to user ${userId}`);
    }
  }

  /**
   * Send booking update to relevant users
   */
  sendBookingUpdate(bookingId, update, userIds = []) {
    userIds.forEach(userId => {
      if (this.isUserOnline(userId)) {
        this.io.to(`user:${userId}`).emit('booking:update', {
          bookingId,
          update,
          timestamp: new Date().toISOString(),
        });
      }
    });

    logger.info(`Booking update sent for ${bookingId} to ${userIds.length} users`);
  }

  /**
   * Send quote update
   */
  sendQuoteUpdate(quoteId, update, userIds = []) {
    userIds.forEach(userId => {
      if (this.isUserOnline(userId)) {
        this.io.to(`user:${userId}`).emit('quote:update', {
          quoteId,
          update,
          timestamp: new Date().toISOString(),
        });
      }
    });

    logger.info(`Quote update sent for ${quoteId} to ${userIds.length} users`);
  }

  /**
   * Broadcast system announcement
   */
  broadcastAnnouncement(announcement) {
    this.io.emit('system:announcement', {
      ...announcement,
      timestamp: new Date().toISOString(),
    });

    logger.info('System announcement broadcasted');
  }

  /**
   * Send agent notification
   */
  sendAgentNotification(agentId, notification) {
    if (this.isUserOnline(agentId)) {
      this.io.to(`user:${agentId}`).emit('agent:notification', notification);
    }
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }

  /**
   * Get online users count
   */
  getOnlineUsersCount() {
    return this.connectedUsers.size;
  }

  /**
   * Get user socket ID
   */
  getUserSocketId(userId) {
    return this.connectedUsers.get(userId);
  }

  /**
   * Emit event to specific room
   */
  emitToRoom(room, event, data) {
    this.io.to(room).emit(event, data);
  }

  /**
   * Create and join a conversation room
   */
  joinConversation(userId, conversationId) {
    const socketId = this.getUserSocketId(userId);
    if (socketId) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.join(`conversation:${conversationId}`);
        logger.info(`User ${userId} joined conversation ${conversationId}`);
      }
    }
  }

  /**
   * Leave a conversation room
   */
  leaveConversation(userId, conversationId) {
    const socketId = this.getUserSocketId(userId);
    if (socketId) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.leave(`conversation:${conversationId}`);
        logger.info(`User ${userId} left conversation ${conversationId}`);
      }
    }
  }
}

// Singleton instance
let websocketServiceInstance = null;

const getWebSocketService = () => {
  if (!websocketServiceInstance) {
    websocketServiceInstance = new WebSocketService();
  }
  return websocketServiceInstance;
};

module.exports = getWebSocketService;
