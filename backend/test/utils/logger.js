/**
 * Logger Utility
 * Colored console output for test results
 */

const colors = require('colors');

class Logger {
  success(msg) {
    console.log(`✅ ${msg}`.green);
  }

  error(msg) {
    console.log(`❌ ${msg}`.red);
  }

  info(msg) {
    console.log(`ℹ️  ${msg}`.cyan);
  }

  warning(msg) {
    console.log(`⚠️  ${msg}`.yellow);
  }

  step(msg) {
    console.log(`\n📝 ${msg}`.yellow);
  }

  header(msg) {
    console.log(`\n${'='.repeat(60)}`.magenta);
    console.log(msg.magenta);
    console.log('='.repeat(60).magenta);
  }

  result(label, value) {
    console.log(`   • ${label}: ${value}`.white);
  }

  credential(label, value) {
    console.log(`   ${label}: ${value}`.white);
  }
}

module.exports = new Logger();
