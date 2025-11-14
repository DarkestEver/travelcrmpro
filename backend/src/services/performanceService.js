/**
 * Performance Monitoring Service
 * Phase 10: Track and analyze API performance metrics
 * 
 * Features:
 * - Response time tracking
 * - Slow query detection
 * - Memory usage monitoring
 * - Endpoint performance ranking
 * - Cache performance metrics
 */

const logger = require('../utils/logger');
const cacheService = require('./cacheService');

class PerformanceService {
  constructor() {
    this.metrics = {
      requests: {},
      slowQueries: [],
      errors: []
    };
    
    this.startTime = Date.now();
    this.maxSlowQueries = 100;
    this.slowQueryThreshold = 500; // 500ms
  }

  /**
   * Track request performance
   */
  trackRequest(route, duration, statusCode) {
    if (!this.metrics.requests[route]) {
      this.metrics.requests[route] = {
        count: 0,
        totalDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        durations: [],
        errors: 0,
        lastAccessed: null
      };
    }

    const metric = this.metrics.requests[route];
    metric.count++;
    metric.totalDuration += duration;
    metric.minDuration = Math.min(metric.minDuration, duration);
    metric.maxDuration = Math.max(metric.maxDuration, duration);
    metric.lastAccessed = new Date();

    // Keep last 100 durations for percentile calculation
    metric.durations.push(duration);
    if (metric.durations.length > 100) {
      metric.durations.shift();
    }

    if (statusCode >= 400) {
      metric.errors++;
    }

    // Track slow queries
    if (duration > this.slowQueryThreshold) {
      this.trackSlowQuery(route, duration);
    }
  }

  /**
   * Track slow query
   */
  trackSlowQuery(route, duration) {
    this.metrics.slowQueries.unshift({
      route,
      duration,
      timestamp: new Date()
    });

    // Keep only last N slow queries
    if (this.metrics.slowQueries.length > this.maxSlowQueries) {
      this.metrics.slowQueries.pop();
    }
  }

  /**
   * Track error
   */
  trackError(route, error, statusCode) {
    this.metrics.errors.unshift({
      route,
      error: error.message,
      statusCode,
      timestamp: new Date()
    });

    // Keep only last 100 errors
    if (this.metrics.errors.length > 100) {
      this.metrics.errors.pop();
    }
  }

  /**
   * Calculate percentile
   */
  calculatePercentile(values, percentile) {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Get metrics summary
   */
  getMetrics() {
    const summary = {};

    for (const [route, data] of Object.entries(this.metrics.requests)) {
      const avgDuration = data.count > 0 ? data.totalDuration / data.count : 0;
      const p95 = this.calculatePercentile(data.durations, 95);
      const p99 = this.calculatePercentile(data.durations, 99);

      summary[route] = {
        requestCount: data.count,
        avgResponseTime: Math.round(avgDuration),
        minResponseTime: data.minDuration === Infinity ? 0 : data.minDuration,
        maxResponseTime: data.maxDuration,
        p95ResponseTime: Math.round(p95),
        p99ResponseTime: Math.round(p99),
        errorCount: data.errors,
        errorRate: data.count > 0 ? ((data.errors / data.count) * 100).toFixed(2) : 0,
        lastAccessed: data.lastAccessed
      };
    }

    return summary;
  }

  /**
   * Get slowest endpoints
   */
  getSlowestEndpoints(limit = 10) {
    const metrics = this.getMetrics();
    
    return Object.entries(metrics)
      .sort(([, a], [, b]) => b.avgResponseTime - a.avgResponseTime)
      .slice(0, limit)
      .map(([route, data]) => ({ route, ...data }));
  }

  /**
   * Get most active endpoints
   */
  getMostActiveEndpoints(limit = 10) {
    const metrics = this.getMetrics();
    
    return Object.entries(metrics)
      .sort(([, a], [, b]) => b.requestCount - a.requestCount)
      .slice(0, limit)
      .map(([route, data]) => ({ route, ...data }));
  }

  /**
   * Get slow queries
   */
  getSlowQueries(limit = 50) {
    return this.metrics.slowQueries.slice(0, limit);
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit = 50) {
    return this.metrics.errors.slice(0, limit);
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return cacheService.getStats();
  }

  /**
   * Get memory usage
   */
  getMemoryUsage() {
    const usage = process.memoryUsage();
    
    return {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024), // MB
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      arrayBuffers: Math.round(usage.arrayBuffers / 1024 / 1024) // MB
    };
  }

  /**
   * Get system statistics
   */
  getSystemStats() {
    const uptime = Date.now() - this.startTime;
    const totalRequests = Object.values(this.metrics.requests)
      .reduce((sum, data) => sum + data.count, 0);
    const totalErrors = Object.values(this.metrics.requests)
      .reduce((sum, data) => sum + data.errors, 0);

    return {
      uptime: Math.round(uptime / 1000), // seconds
      uptimeFormatted: this.formatUptime(uptime),
      totalRequests,
      totalErrors,
      errorRate: totalRequests > 0 ? ((totalErrors / totalRequests) * 100).toFixed(2) : 0,
      requestsPerSecond: totalRequests > 0 ? (totalRequests / (uptime / 1000)).toFixed(2) : 0,
      memory: this.getMemoryUsage(),
      cache: this.getCacheStats()
    };
  }

  /**
   * Format uptime
   */
  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /**
   * Reset metrics
   */
  reset() {
    this.metrics = {
      requests: {},
      slowQueries: [],
      errors: []
    };
    this.startTime = Date.now();
    logger.info('Performance metrics reset');
  }

  /**
   * Get comprehensive performance report
   */
  getPerformanceReport() {
    return {
      system: this.getSystemStats(),
      slowestEndpoints: this.getSlowestEndpoints(10),
      mostActiveEndpoints: this.getMostActiveEndpoints(10),
      recentSlowQueries: this.getSlowQueries(20),
      recentErrors: this.getRecentErrors(20)
    };
  }
}

// Singleton instance
const performanceService = new PerformanceService();

module.exports = performanceService;
