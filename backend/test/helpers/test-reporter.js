/**
 * Test Reporter
 * Handles test result logging and reporting
 */

const fs = require('fs');
const path = require('path');

class TestReporter {
  constructor(testSuiteName) {
    this.testSuiteName = testSuiteName;
    this.results = [];
    this.startTime = Date.now();
  }

  logTest(testName, status, details = {}) {
    const result = {
      testName,
      status, // 'PASS', 'FAIL', 'SKIP'
      timestamp: new Date().toISOString(),
      duration: details.duration || 0,
      error: details.error || null,
      response: details.response || null,
      additionalInfo: details.info || null
    };

    this.results.push(result);

    // Console output
    const emoji = status === 'PASS' ? '✓' : status === 'FAIL' ? '✗' : '○';
    const color = status === 'PASS' ? '\x1b[32m' : status === 'FAIL' ? '\x1b[31m' : '\x1b[33m';
    console.log(`${color}${emoji} ${testName}\x1b[0m`);
    
    if (status === 'FAIL' && details.error) {
      console.log(`  Error: ${details.error}`);
    }
    
    if (details.info) {
      console.log(`  Info: ${details.info}`);
    }
  }

  logSection(sectionName) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`  ${sectionName}`);
    console.log(`${'='.repeat(60)}\n`);
  }

  logInfo(message) {
    console.log(`\x1b[36mℹ ${message}\x1b[0m`);
  }

  logSuccess(message) {
    console.log(`\x1b[32m✓ ${message}\x1b[0m`);
  }

  logError(message) {
    console.log(`\x1b[31m✗ ${message}\x1b[0m`);
  }

  logWarning(message) {
    console.log(`\x1b[33m⚠ ${message}\x1b[0m`);
  }

  getSummary() {
    const totalTests = this.results.length;
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;
    const duration = Date.now() - this.startTime;

    return {
      testSuite: this.testSuiteName,
      totalTests,
      passed,
      failed,
      skipped,
      passRate: totalTests > 0 ? ((passed / totalTests) * 100).toFixed(2) : 0,
      duration: `${(duration / 1000).toFixed(2)}s`,
      timestamp: new Date().toISOString()
    };
  }

  printSummary() {
    const summary = this.getSummary();
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`  TEST SUMMARY: ${summary.testSuite}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`  Total Tests: ${summary.totalTests}`);
    console.log(`  \x1b[32mPassed: ${summary.passed}\x1b[0m`);
    console.log(`  \x1b[31mFailed: ${summary.failed}\x1b[0m`);
    console.log(`  \x1b[33mSkipped: ${summary.skipped}\x1b[0m`);
    console.log(`  Pass Rate: ${summary.passRate}%`);
    console.log(`  Duration: ${summary.duration}`);
    console.log(`${'='.repeat(60)}\n`);
  }

  saveReport(outputDir = './test/reports') {
    try {
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const summary = this.getSummary();
      const report = {
        summary,
        results: this.results
      };

      const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
      const filename = `${this.testSuiteName.replace(/\s+/g, '_')}_${timestamp}.json`;
      const filepath = path.join(outputDir, filename);

      fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
      console.log(`\x1b[36mℹ Report saved to: ${filepath}\x1b[0m\n`);

      return filepath;
    } catch (error) {
      console.error(`Failed to save report: ${error.message}`);
      return null;
    }
  }

  getFailedTests() {
    return this.results.filter(r => r.status === 'FAIL');
  }
}

module.exports = TestReporter;
