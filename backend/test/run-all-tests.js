/**
 * Master Test Runner
 * Runs all test suites in sequence and generates comprehensive report
 */

const fs = require('fs');
const path = require('path');

// Import all test suites
const AgencyAdminRegistrationTest = require('./01-agency-admin-registration.test');
const AuthenticationTest = require('./02-authentication.test');
const AgencyAdminWorkflowTest = require('./03-agency-admin-workflow.test');
const OperatorWorkflowTest = require('./04-operator-workflow.test');
const AgentRoleTest = require('./05-agent-role.test');
const CustomerRoleTest = require('./06-customer-role.test');
const E2EWorkflowTest = require('./07-e2e-workflow.test');

class MasterTestRunner {
  constructor() {
    this.results = [];
    this.testData = {};
    this.startTime = Date.now();
  }

  printHeader() {
    console.log('\n' + '='.repeat(80));
    console.log('  TRAVEL CRM - COMPREHENSIVE TEST SUITE');
    console.log('='.repeat(80));
    console.log(`  Started at: ${new Date().toISOString()}`);
    console.log('='.repeat(80) + '\n');
  }

  printFooter() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    console.log('\n' + '='.repeat(80));
    console.log('  TEST EXECUTION COMPLETED');
    console.log('='.repeat(80));
    console.log(`  Total Duration: ${duration}s`);
    console.log('='.repeat(80) + '\n');
  }

  async run() {
    this.printHeader();

    try {
      // Test 1: Agency Admin Registration
      console.log('\n📋 Running Test 1: Agency Admin Registration\n');
      const test1 = new AgencyAdminRegistrationTest();
      const result1 = await test1.run();
      this.results.push(result1);
      this.testData = { ...this.testData, ...result1.testData };
      
      // Wait for server to be ready after nodemon restart
      console.log('\nℹ Waiting for server to be ready...');
      const ApiClient = require('./helpers/api-client');
      const healthClient = new ApiClient();
      const serverReady = await healthClient.healthCheck(20, 3000);
      if (!serverReady) {
        console.log('⚠ Warning: Server health check failed, proceeding anyway...');
        await this.sleep(10000); // Extra wait if health check failed
      } else {
        console.log('✓ Server is ready');
        // Additional delay to ensure server is fully stable (critical for login)
        console.log('ℹ Waiting additional 10 seconds for full server stability...');
        await this.sleep(10000);
        console.log('');
      }

      // Test 2: Authentication
      console.log('\n📋 Running Test 2: Authentication Tests\n');
      const test2 = new AuthenticationTest(this.testData);
      const result2 = await test2.run();
      this.results.push(result2);
      this.testData.tokens = result2.tokens;
      // Merge updated testData (includes token in agencyAdmin)
      if (result2.testData) {
        this.testData = { ...this.testData, ...result2.testData };
      }

      await this.sleep(5000);

      // Test 3: Agency Admin Workflow
      console.log('\n📋 Running Test 3: Agency Admin Workflow\n');
      const test3 = new AgencyAdminWorkflowTest(this.testData);
      const result3 = await test3.run();
      this.results.push(result3);
      this.testData.createdEntities = result3.createdEntities;

      await this.sleep(5000);

      // Test 4: Operator Workflow
      console.log('\n📋 Running Test 4: Operator Workflow\n');
      const test4 = new OperatorWorkflowTest(this.testData);
      const result4 = await test4.run();
      this.results.push(result4);
      this.testData.operatorEntities = result4.operatorEntities;

      await this.sleep(5000);

      // Test 5: Agent Role
      console.log('\n📋 Running Test 5: Agent Role Tests\n');
      const test5 = new AgentRoleTest(this.testData);
      const result5 = await test5.run();
      this.results.push(result5);

      await this.sleep(5000);

      // Test 6: Customer Role
      console.log('\n📋 Running Test 6: Customer Role Tests\n');
      const test6 = new CustomerRoleTest(this.testData);
      const result6 = await test6.run();
      this.results.push(result6);

      await this.sleep(5000);

      // Test 7: E2E Workflow
      console.log('\n📋 Running Test 7: End-to-End Workflow\n');
      const test7 = new E2EWorkflowTest(this.testData);
      const result7 = await test7.run();
      this.results.push(result7);

      // Generate final report
      this.printFooter();
      this.generateFinalReport();

      return {
        success: this.results.every(r => r.success),
        results: this.results,
        testData: this.testData
      };

    } catch (error) {
      console.error('\n❌ Test execution failed:', error.message);
      console.error(error.stack);
      this.printFooter();
      throw error;
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateFinalReport() {
    console.log('\n' + '='.repeat(80));
    console.log('  FINAL TEST REPORT');
    console.log('='.repeat(80));

    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;

    this.results.forEach((result, index) => {
      const summary = result.summary;
      console.log(`\n  Test Suite ${index + 1}: ${summary.testSuite}`);
      console.log(`    Tests: ${summary.totalTests} | Passed: ${summary.passed} | Failed: ${summary.failed}`);
      console.log(`    Pass Rate: ${summary.passRate}% | Duration: ${summary.duration}`);

      totalTests += summary.totalTests;
      totalPassed += summary.passed;
      totalFailed += summary.failed;
    });

    console.log('\n' + '-'.repeat(80));
    console.log('  OVERALL SUMMARY');
    console.log('-'.repeat(80));
    console.log(`  Total Test Suites: ${this.results.length}`);
    console.log(`  Total Tests: ${totalTests}`);
    console.log(`  \x1b[32mTotal Passed: ${totalPassed}\x1b[0m`);
    console.log(`  \x1b[31mTotal Failed: ${totalFailed}\x1b[0m`);
    console.log(`  Overall Pass Rate: ${totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(2) : 0}%`);
    console.log('-'.repeat(80));

    // Save comprehensive report
    this.saveMasterReport({
      totalTests,
      totalPassed,
      totalFailed,
      passRate: totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(2) : 0,
      testSuites: this.results.length,
      duration: ((Date.now() - this.startTime) / 1000).toFixed(2) + 's'
    });

    // Print test data summary
    console.log('\n' + '='.repeat(80));
    console.log('  TEST DATA SUMMARY');
    console.log('='.repeat(80));
    console.log(`  Agency Admin: ${this.testData.agencyAdmin?.email || 'N/A'}`);
    console.log(`  Tenant ID: ${this.testData.agencyAdmin?.tenantId || 'N/A'}`);
    console.log(`  Operator: ${this.testData.operator?.email || 'N/A'}`);
    console.log(`  Agent: ${this.testData.createdEntities?.agent?.email || 'N/A'}`);
    console.log(`  Customer: ${this.testData.createdEntities?.customer?.email || 'N/A'}`);
    console.log(`  Entities Created:`);
    console.log(`    - Agents: 2`);
    console.log(`    - Customers: 2`);
    console.log(`    - Suppliers: 2`);
    console.log(`    - Itineraries: 2+`);
    console.log(`    - Quotes: 2`);
    console.log(`    - Bookings: 2`);
    console.log('='.repeat(80) + '\n');
  }

  saveMasterReport(overallSummary) {
    try {
      const reportDir = path.join(__dirname, 'reports');
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
      const filename = `MASTER_TEST_REPORT_${timestamp}.json`;
      const filepath = path.join(reportDir, filename);

      const report = {
        timestamp: new Date().toISOString(),
        overallSummary,
        testSuites: this.results.map(r => r.summary),
        testData: {
          agencyAdmin: {
            email: this.testData.agencyAdmin?.email,
            tenantId: this.testData.agencyAdmin?.tenantId
          },
          operator: {
            email: this.testData.operator?.email
          },
          createdEntities: {
            agent: this.testData.createdEntities?.agent?.email,
            customer: this.testData.createdEntities?.customer?.email
          }
        }
      };

      fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
      console.log(`\n\x1b[36mℹ Master report saved to: ${filepath}\x1b[0m`);

      // Also save a simple text report
      this.saveTextReport(filepath.replace('.json', '.txt'), overallSummary);

    } catch (error) {
      console.error(`Failed to save master report: ${error.message}`);
    }
  }

  saveTextReport(filepath, overallSummary) {
    try {
      let content = 'TRAVEL CRM - TEST EXECUTION REPORT\n';
      content += '='.repeat(80) + '\n\n';
      content += `Execution Date: ${new Date().toISOString()}\n`;
      content += `Total Duration: ${overallSummary.duration}\n\n`;
      content += 'OVERALL SUMMARY\n';
      content += '-'.repeat(80) + '\n';
      content += `Total Test Suites: ${overallSummary.testSuites}\n`;
      content += `Total Tests: ${overallSummary.totalTests}\n`;
      content += `Passed: ${overallSummary.totalPassed}\n`;
      content += `Failed: ${overallSummary.totalFailed}\n`;
      content += `Pass Rate: ${overallSummary.passRate}%\n\n`;

      content += 'TEST SUITES\n';
      content += '-'.repeat(80) + '\n';
      this.results.forEach((result, index) => {
        const summary = result.summary;
        content += `${index + 1}. ${summary.testSuite}\n`;
        content += `   Tests: ${summary.totalTests} | Passed: ${summary.passed} | Failed: ${summary.failed}\n`;
        content += `   Pass Rate: ${summary.passRate}% | Duration: ${summary.duration}\n\n`;
      });

      fs.writeFileSync(filepath, content);
      console.log(`\x1b[36mℹ Text report saved to: ${filepath}\x1b[0m\n`);

    } catch (error) {
      console.error(`Failed to save text report: ${error.message}`);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new MasterTestRunner();
  runner.run()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Master test execution failed:', error);
      process.exit(1);
    });
}

module.exports = MasterTestRunner;
