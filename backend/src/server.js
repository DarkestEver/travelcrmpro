const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { connectDB, connectRedis } = require('./config/database');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const setupSwagger = require('./config/swagger');
const { initCronJobs } = require('./jobs');
// const getWebSocketService = require('./services/websocketService'); // Temporarily disabled
const getPDFService = require('./services/pdfService');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Connect to databases
connectDB();
// connectRedis(); // Temporarily disabled

// Initialize WebSocket service
// const websocketService = getWebSocketService(); // Temporarily disabled
// websocketService.initialize(server); // Temporarily disabled

// Initialize PDF service
getPDFService().catch(err => {
  logger.error('Failed to initialize PDF service:', err);
});

// Initialize cron jobs
initCronJobs();

// Security middleware
app.use(helmet());

// CORS configuration - Allow multiple origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://localhost:4173', // Vite preview
  process.env.FRONTEND_URL,
].filter(Boolean); // Remove undefined values

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, Postman, curl)
      if (!origin) return callback(null, true);
      
      // Allow any localhost origin in development
      if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
        return callback(null, true);
      }
      
      // Check against allowed origins
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.http(message.trim()),
    },
  }));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

app.use('/api', limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts, please try again later.',
});

app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);
app.use('/api/v1/auth/forgot-password', authLimiter);

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Setup Swagger documentation
setupSwagger(app);

// API routes
app.use('/api/v1', routes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Travel CRM API',
    version: '1.0.0',
    documentation: '/api/v1/health',
  });
});

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  logger.info(`WebSocket server ready on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

module.exports = app;
