/**
 * Health Check Controller
 * Phase 6.1: API endpoints for system health monitoring
 */

const healthCheckService = require('../services/healthCheckService');
const asyncHandler = require('../middleware/errorHandler').asyncHandler;

/**
 * @desc    Quick health check (for load balancers)
 * @route   GET /api/health
 * @access  Public
 */
exports.quickHealthCheck = asyncHandler(async (req, res) => {
  const result = await healthCheckService.performQuickHealthCheck();
  
  const statusCode = result.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(result);
});

/**
 * @desc    Comprehensive health check
 * @route   GET /api/health/detailed
 * @access  Private/Admin
 */
exports.detailedHealthCheck = asyncHandler(async (req, res) => {
  const result = await healthCheckService.performFullHealthCheck();
  
  const statusCode = result.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json({
    success: result.status === 'healthy',
    ...result,
  });
});

/**
 * @desc    Check database health
 * @route   GET /api/health/database
 * @access  Private/Admin
 */
exports.checkDatabase = asyncHandler(async (req, res) => {
  const result = await healthCheckService.checkDatabase();
  
  const statusCode = result.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json({
    success: result.status === 'healthy',
    ...result,
  });
});

/**
 * @desc    Check Stripe health
 * @route   GET /api/health/stripe
 * @access  Private/Admin
 */
exports.checkStripe = asyncHandler(async (req, res) => {
  const result = await healthCheckService.checkStripe();
  
  const statusCode = ['healthy', 'warning'].includes(result.status) ? 200 : 503;
  res.status(statusCode).json({
    success: result.status === 'healthy',
    ...result,
  });
});

/**
 * @desc    Check email service health
 * @route   GET /api/health/email
 * @access  Private/Admin
 */
exports.checkEmail = asyncHandler(async (req, res) => {
  const result = await healthCheckService.checkEmail();
  
  const statusCode = ['healthy', 'warning'].includes(result.status) ? 200 : 503;
  res.status(statusCode).json({
    success: result.status === 'healthy',
    ...result,
  });
});

/**
 * @desc    Check system resources
 * @route   GET /api/health/system
 * @access  Private/Admin
 */
exports.checkSystem = asyncHandler(async (req, res) => {
  const [memory, disk, cpu] = await Promise.all([
    healthCheckService.checkMemory(),
    healthCheckService.checkDisk(),
    healthCheckService.checkCPU(),
  ]);
  
  const checks = { memory, disk, cpu };
  const critical = Object.values(checks).filter(c => c.status === 'critical');
  const unhealthy = Object.values(checks).filter(c => c.status === 'unhealthy');
  
  let overallStatus = 'healthy';
  if (critical.length > 0) {
    overallStatus = 'critical';
  } else if (unhealthy.length > 0) {
    overallStatus = 'unhealthy';
  }
  
  const statusCode = overallStatus === 'healthy' ? 200 : 503;
  
  res.status(statusCode).json({
    success: overallStatus === 'healthy',
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks,
    uptime: healthCheckService.getUptime(),
    environment: healthCheckService.getEnvironmentInfo(),
  });
});

/**
 * @desc    Get uptime information
 * @route   GET /api/health/uptime
 * @access  Public
 */
exports.getUptime = asyncHandler(async (req, res) => {
  const uptime = healthCheckService.getUptime();
  const environment = healthCheckService.getEnvironmentInfo();
  
  res.json({
    success: true,
    uptime,
    environment,
    timestamp: new Date().toISOString(),
  });
});

/**
 * @desc    Get environment information
 * @route   GET /api/health/environment
 * @access  Private/Admin
 */
exports.getEnvironment = asyncHandler(async (req, res) => {
  const environment = healthCheckService.getEnvironmentInfo();
  
  res.json({
    success: true,
    ...environment,
    timestamp: new Date().toISOString(),
  });
});
