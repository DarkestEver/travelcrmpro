#!/usr/bin/env node
/**
 * Database Restore Script
 * Run: node scripts/restore-database.js <backup-name>
 * Example: node scripts/restore-database.js backup-travelcrm-2025-11-14T10-30-00
 */

require('dotenv').config();
const backupService = require('../src/services/backupService');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function runRestore() {
  console.log('🔄 Database Restore Tool\n');
  console.log('================================================\n');

  try {
    // Get backup name from command line argument
    const backupName = process.argv[2];

    if (!backupName) {
      console.log('📋 Available Backups:\n');
      
      const backups = await backupService.listBackups();
      
      if (backups.length === 0) {
        console.log('   No backups found.\n');
        console.log('Usage: node scripts/restore-database.js <backup-name>\n');
        process.exit(1);
      }

      backups.forEach((backup, index) => {
        console.log(`   ${index + 1}. ${backup.name}`);
        console.log(`      Created: ${backup.created.toLocaleString()}`);
        console.log(`      Size: ${(backup.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`      Age: ${backup.age} days\n`);
      });

      console.log('Usage: node scripts/restore-database.js <backup-name>\n');
      console.log('Example:');
      console.log(`   node scripts/restore-database.js ${backups[0].name}\n`);
      
      process.exit(0);
    }

    // Verify backup exists
    const backups = await backupService.listBackups();
    const backup = backups.find(b => b.name === backupName);

    if (!backup) {
      console.error(`❌ Backup not found: ${backupName}\n`);
      console.log('Available backups:');
      backups.forEach(b => console.log(`   - ${b.name}`));
      console.log();
      process.exit(1);
    }

    // Display backup info
    console.log('📦 Backup Information:');
    console.log('--------------------------------------------------');
    console.log(`   Name: ${backup.name}`);
    console.log(`   Created: ${backup.created.toLocaleString()}`);
    console.log(`   Size: ${(backup.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Files: ${backup.files}`);
    console.log(`   Age: ${backup.age} days\n`);

    // Warning message
    console.log('⚠️  WARNING: This will OVERWRITE the current database!');
    console.log('   All current data will be replaced with the backup.\n');

    // Confirm restore
    const answer = await question('   Type "RESTORE" to continue, or anything else to cancel: ');

    if (answer.trim().toUpperCase() !== 'RESTORE') {
      console.log('\n❌ Restore cancelled.\n');
      rl.close();
      process.exit(0);
    }

    console.log('\n🔄 Starting restore...\n');

    const startTime = Date.now();

    // Perform restore
    const result = await backupService.restoreBackup(backupName);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n================================================');
    console.log('✅ RESTORE SUCCESSFUL\n');
    console.log('📋 Summary:');
    console.log('--------------------------------------------------');
    console.log(`   Backup: ${result.backupName}`);
    console.log(`   Duration: ${duration}s`);
    console.log(`   Completed: ${result.timestamp.toISOString()}\n`);
    console.log('================================================\n');

    rl.close();
    process.exit(0);

  } catch (error) {
    console.error('\n================================================');
    console.error('❌ RESTORE FAILED\n');
    console.error('Error:', error.message);
    console.error('\nPlease check:');
    console.error('  - MongoDB is running and accessible');
    console.error('  - mongorestore is installed (MongoDB Tools)');
    console.error('  - MONGODB_URI is set in .env');
    console.error('  - Backup directory exists and is readable\n');
    console.error('================================================\n');

    rl.close();
    process.exit(1);
  }
}

// Run restore
runRestore();
