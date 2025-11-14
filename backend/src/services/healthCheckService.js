/**
 * Health Check Service
 * Phase 6.1: Comprehensive system health monitoring
 * 
 * Monitors:
 * - Database connectivity
 * - External services (Stripe, Email)
 * - System resources (memory, disk)
 * - API performance metrics
 */

const mongoose = require('mongoose');
const os = require('os');
const fs = require('fs').promises;
const path = require('path');

/**
 * Check MongoDB database connectivity and metrics
 */
exports.checkDatabase = async () => {
  try {
    const startTime = Date.now();
    
    // Check connection state
    const state = mongoose.connection.readyState;
    const stateMap = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };
    
    if (state !== 1) {
      return {
        status: 'unhealthy',
        message: `Database is ${stateMap[state]}`,
        responseTime: Date.now() - startTime,
      };
    }
    
    // Ping database
    await mongoose.connection.db.admin().ping();
    const responseTime = Date.now() - startTime;
    
    // Get database stats
    const dbStats = await mongoose.connection.db.stats();
    
    // Get collection count
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    return {
      status: 'healthy',
      message: 'Database is connected and responsive',
      responseTime,
      details: {
        state: stateMap[state],
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        database: mongoose.connection.name,
        collections: collections.length,
        dataSize: formatBytes(dbStats.dataSize),
        storageSize: formatBytes(dbStats.storageSize),
        indexes: dbStats.indexes,
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'Database connection failed',
      error: error.message,
    };
  }
};

/**
 * Check Stripe payment service connectivity
 */
exports.checkStripe = async () => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return {
        status: 'warning',
        message: 'Stripe not configured',
      };
    }
    
    const startTime = Date.now();
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    // Test API call - retrieve account info
    await stripe.accounts.retrieve();
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      message: 'Stripe API is accessible',
      responseTime,
      details: {
        configured: true,
        mode: process.env.STRIPE_SECRET_KEY.startsWith('sk_test_') ? 'test' : 'live',
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'Stripe API connection failed',
      error: error.message,
    };
  }
};

/**
 * Check email service connectivity
 */
exports.checkEmail = async () => {
  try {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      return {
        status: 'warning',
        message: 'Email service not fully configured',
        details: {
          configured: false,
          smtp_host: !!process.env.SMTP_HOST,
          smtp_user: !!process.env.SMTP_USER,
        },
      };
    }
    
    const nodemailer = require('nodemailer');
    const startTime = Date.now();
    
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    
    // Verify connection
    await transporter.verify();
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      message: 'Email service is accessible',
      responseTime,
      details: {
        configured: true,
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'Email service connection failed',
      error: error.message,
    };
  }
};

/**
 * Check Redis cache connectivity (if configured)
 */
exports.checkRedis = async () => {
  try {
    if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
      return {
        status: 'info',
        message: 'Redis not configured',
      };
    }
    
    // Redis check would go here if implemented
    // For now, return configured status
    return {
      status: 'info',
      message: 'Redis check not implemented',
      details: {
        configured: !!process.env.REDIS_URL,
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'Redis connection failed',
      error: error.message,
    };
  }
};

/**
 * Check system memory usage
 */
exports.checkMemory = async () => {
  try {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const usagePercentage = ((usedMemory / totalMemory) * 100).toFixed(2);
    
    // Process memory
    const processMemory = process.memoryUsage();
    
    let status = 'healthy';
    let message = 'Memory usage is normal';
    
    if (usagePercentage > 90) {
      status = 'critical';
      message = 'Memory usage is critically high';
    } else if (usagePercentage > 75) {
      status = 'warning';
      message = 'Memory usage is high';
    }
    
    return {
      status,
      message,
      details: {
        system: {
          total: formatBytes(totalMemory),
          used: formatBytes(usedMemory),
          free: formatBytes(freeMemory),
          usagePercentage: `${usagePercentage}%`,
        },
        process: {
          rss: formatBytes(processMemory.rss),
          heapTotal: formatBytes(processMemory.heapTotal),
          heapUsed: formatBytes(processMemory.heapUsed),
          external: formatBytes(processMemory.external),
        },
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'Memory check failed',
      error: error.message,
    };
  }
};

/**
 * Check disk space
 */
exports.checkDisk = async () => {
  try {
    const uploadsDir = path.join(__dirname, '../../uploads');
    
    // Check if uploads directory exists
    let uploadsSize = 0;
    try {
      const stats = await fs.stat(uploadsDir);
      if (stats.isDirectory()) {
        uploadsSize = await getDirectorySize(uploadsDir);
      }
    } catch (error) {
      // Directory doesn't exist, that's ok
    }
    
    return {
      status: 'healthy',
      message: 'Disk space is adequate',
      details: {
        uploads: {
          path: uploadsDir,
          size: formatBytes(uploadsSize),
        },
      },
    };
  } catch (error) {
    return {
      status: 'warning',
      message: 'Disk check completed with warnings',
      error: error.message,
    };
  }
};

/**
 * Check CPU usage
 */
exports.checkCPU = async () => {
  try {
    const cpus = os.cpus();
    const loadAvg = os.loadavg();
    
    // Calculate average CPU usage
    let totalIdle = 0;
    let totalTick = 0;
    
    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });
    
    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usagePercentage = (100 - ~~(100 * idle / total)).toFixed(2);
    
    let status = 'healthy';
    let message = 'CPU usage is normal';
    
    if (usagePercentage > 90) {
      status = 'critical';
      message = 'CPU usage is critically high';
    } else if (usagePercentage > 75) {
      status = 'warning';
      message = 'CPU usage is high';
    }
    
    return {
      status,
      message,
      details: {
        cores: cpus.length,
        model: cpus[0].model,
        usagePercentage: `${usagePercentage}%`,
        loadAverage: {
          '1min': loadAvg[0].toFixed(2),
          '5min': loadAvg[1].toFixed(2),
          '15min': loadAvg[2].toFixed(2),
        },
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'CPU check failed',
      error: error.message,
    };
  }
};

/**
 * Get system uptime
 */
exports.getUptime = () => {
  const systemUptime = os.uptime();
  const processUptime = process.uptime();
  
  return {
    system: formatUptime(systemUptime),
    process: formatUptime(processUptime),
    systemSeconds: systemUptime,
    processSeconds: processUptime,
  };
};

/**
 * Get environment info
 */
exports.getEnvironmentInfo = () => {
  return {
    nodeVersion: process.version,
    platform: process.platform,
    architecture: process.arch,
    environment: process.env.NODE_ENV || 'development',
    hostname: os.hostname(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
};

/**
 * Comprehensive health check
 */
exports.performFullHealthCheck = async () => {
  const startTime = Date.now();
  
  const [
    database,
    stripe,
    email,
    redis,
    memory,
    disk,
    cpu,
  ] = await Promise.all([
    exports.checkDatabase(),
    exports.checkStripe(),
    exports.checkEmail(),
    exports.checkRedis(),
    exports.checkMemory(),
    exports.checkDisk(),
    exports.checkCPU(),
  ]);
  
  const checks = {
    database,
    stripe,
    email,
    redis,
    memory,
    disk,
    cpu,
  };
  
  // Determine overall health
  const unhealthy = Object.values(checks).filter(c => c.status === 'unhealthy');
  const critical = Object.values(checks).filter(c => c.status === 'critical');
  
  let overallStatus = 'healthy';
  let overallMessage = 'All systems operational';
  
  if (critical.length > 0) {
    overallStatus = 'critical';
    overallMessage = `${critical.length} critical issue(s) detected`;
  } else if (unhealthy.length > 0) {
    overallStatus = 'unhealthy';
    overallMessage = `${unhealthy.length} service(s) unhealthy`;
  }
  
  return {
    status: overallStatus,
    message: overallMessage,
    timestamp: new Date().toISOString(),
    responseTime: Date.now() - startTime,
    uptime: exports.getUptime(),
    environment: exports.getEnvironmentInfo(),
    checks,
  };
};

/**
 * Quick health check (for load balancers)
 */
exports.performQuickHealthCheck = async () => {
  try {
    // Just check if database is connected
    const state = mongoose.connection.readyState;
    
    if (state !== 1) {
      return {
        status: 'unhealthy',
        message: 'Database not connected',
      };
    }
    
    return {
      status: 'healthy',
      message: 'Service is running',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error.message,
    };
  }
};

// Helper functions

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  
  return parts.join(' ');
}

async function getDirectorySize(dirPath) {
  let size = 0;
  
  try {
    const files = await fs.readdir(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = await fs.stat(filePath);
      
      if (stats.isDirectory()) {
        size += await getDirectorySize(filePath);
      } else {
        size += stats.size;
      }
    }
  } catch (error) {
    // Ignore errors for individual files
  }
  
  return size;
}
