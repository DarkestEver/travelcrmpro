/**
 * Report Controller
 * Handles financial report generation and exports
 */

const asyncHandler = require('../middleware/asyncHandler');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const reportService = require('../services/reportService');

/**
 * @desc    Get revenue report
 * @route   GET /api/v1/reports/revenue
 * @access  Private (Agent/Admin)
 */
exports.getRevenueReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, groupBy, agentId, destinationId } = req.query;
  const { tenantId } = req.user;

  const report = await reportService.generateRevenueReport({
    tenantId,
    startDate: startDate ? new Date(startDate) : new Date(new Date().setDate(1)), // First day of month
    endDate: endDate ? new Date(endDate) : new Date(),
    groupBy: groupBy || 'day', // day, week, month, agent, destination
    agentId,
    destinationId
  });

  successResponse(res, 200, 'Revenue report generated', report);
});

/**
 * @desc    Get commission report
 * @route   GET /api/v1/reports/commission
 * @access  Private (Agent/Admin)
 */
exports.getCommissionReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, agentId, status } = req.query;
  const { tenantId } = req.user;

  const report = await reportService.generateCommissionReport({
    tenantId,
    startDate: startDate ? new Date(startDate) : new Date(new Date().setDate(1)),
    endDate: endDate ? new Date(endDate) : new Date(),
    agentId,
    status // pending, paid, cancelled
  });

  successResponse(res, 200, 'Commission report generated', report);
});

/**
 * @desc    Get tax report
 * @route   GET /api/v1/reports/tax
 * @access  Private (Admin)
 */
exports.getTaxReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, taxType, groupBy } = req.query;
  const { tenantId } = req.user;

  const report = await reportService.generateTaxReport({
    tenantId,
    startDate: startDate ? new Date(startDate) : new Date(new Date().setDate(1)),
    endDate: endDate ? new Date(endDate) : new Date(),
    taxType, // sales, service, all
    groupBy: groupBy || 'month'
  });

  successResponse(res, 200, 'Tax report generated', report);
});

/**
 * @desc    Get profit & loss report
 * @route   GET /api/v1/reports/profit-loss
 * @access  Private (Admin)
 */
exports.getProfitLossReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const { tenantId } = req.user;

  const report = await reportService.generateProfitLossReport({
    tenantId,
    startDate: startDate ? new Date(startDate) : new Date(new Date().setMonth(0, 1)), // Jan 1
    endDate: endDate ? new Date(endDate) : new Date()
  });

  successResponse(res, 200, 'Profit & Loss report generated', report);
});

/**
 * @desc    Get booking trends report
 * @route   GET /api/v1/reports/booking-trends
 * @access  Private (Agent/Admin)
 */
exports.getBookingTrendsReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, groupBy } = req.query;
  const { tenantId } = req.user;

  const report = await reportService.generateBookingTrendsReport({
    tenantId,
    startDate: startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 3)), // Last 3 months
    endDate: endDate ? new Date(endDate) : new Date(),
    groupBy: groupBy || 'week'
  });

  successResponse(res, 200, 'Booking trends report generated', report);
});

/**
 * @desc    Export report to CSV
 * @route   POST /api/v1/reports/export/csv
 * @access  Private (Agent/Admin)
 */
exports.exportReportCSV = asyncHandler(async (req, res) => {
  const { reportType, data, filename } = req.body;

  if (!reportType || !data) {
    return errorResponse(res, 400, 'Report type and data are required');
  }

  const csv = await reportService.exportToCSV(data, reportType);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=${filename || 'report'}.csv`);
  res.send(csv);
});

/**
 * @desc    Export report to PDF
 * @route   POST /api/v1/reports/export/pdf
 * @access  Private (Agent/Admin)
 */
exports.exportReportPDF = asyncHandler(async (req, res) => {
  const { reportType, data, title } = req.body;

  if (!reportType || !data) {
    return errorResponse(res, 400, 'Report type and data are required');
  }

  const pdfBuffer = await reportService.exportToPDF(data, reportType, title);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${title || 'report'}.pdf`);
  res.send(pdfBuffer);
});

/**
 * @desc    Get agent performance report
 * @route   GET /api/v1/reports/agent-performance
 * @access  Private (Admin)
 */
exports.getAgentPerformanceReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const { tenantId } = req.user;

  const report = await reportService.generateAgentPerformanceReport({
    tenantId,
    startDate: startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1)),
    endDate: endDate ? new Date(endDate) : new Date()
  });

  successResponse(res, 200, 'Agent performance report generated', report);
});

/**
 * @desc    Get customer analytics
 * @route   GET /api/v1/reports/customer-analytics
 * @access  Private (Admin)
 */
exports.getCustomerAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate, segment } = req.query;
  const { tenantId } = req.user;

  const report = await reportService.generateCustomerAnalytics({
    tenantId,
    startDate: startDate ? new Date(startDate) : new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
    endDate: endDate ? new Date(endDate) : new Date(),
    segment // new, returning, vip
  });

  successResponse(res, 200, 'Customer analytics generated', report);
});

/**
 * @desc    Get dashboard summary
 * @route   GET /api/v1/reports/dashboard-summary
 * @access  Private (Agent/Admin)
 */
exports.getDashboardSummary = asyncHandler(async (req, res) => {
  const { tenantId, role, _id: userId } = req.user;

  const summary = await reportService.generateDashboardSummary({
    tenantId,
    userId,
    role
  });

  successResponse(res, 200, 'Dashboard summary generated', summary);
});
