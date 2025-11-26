const winston = require('winston');
const config = require('../config');

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
};

winston.addColors(colors);

// Format for JSON logs (production)
const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Format for simple console logs (development)
const simpleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => {
      const { timestamp, level, message, ...meta } = info;
      let metaStr = '';
      if (Object.keys(meta).length > 0) {
        metaStr = ` ${JSON.stringify(meta)}`;
      }
      return `${timestamp} [${level}]: ${message}${metaStr}`;
    }
  )
);

const transports = [
  new winston.transports.Console(),
];

// Add file transports in non-test environments
if (config.env !== 'test') {
  transports.push(
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  );
}

const logger = winston.createLogger({
  level: config.logging.level,
  levels,
  format: config.logging.format === 'json' ? jsonFormat : simpleFormat,
  transports,
  exceptionHandlers: config.env !== 'test' ? [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ] : [],
  rejectionHandlers: config.env !== 'test' ? [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  ] : [],
  silent: config.env === 'test', // Suppress logs in test environment
});

module.exports = logger;
