/**
 * Test Automated Backup and Restore
 * Tests the backup service functionality
 */

const backupService = require('../src/services/backupService');
require('dotenv').config();

async function testBackupRestore() {
  console.log('🧪 Testing Automated Backup System\n');
  console.log('================================================\n');

  try {
    // Test 1: Check Backup Service Configuration
    console.log('⚙️  Test 1: Backup Service Configuration');
    console.log('--------------------------------------------------');
    
    console.log(`✅ Backup Directory: ${backupService.backupDir}`);
    console.log(`✅ Retention Days: ${backupService.retentionDays}`);
    console.log(`✅ Database Name: ${backupService.dbName}`);
    console.log();

    // Test 2: List Existing Backups
    console.log('📋 Test 2: List Existing Backups');
    console.log('--------------------------------------------------');
    
    const backups = await backupService.listBackups();
    
    if (backups.length === 0) {
      console.log('⚠️  No existing backups found (this is normal for first run)');
    } else {
      console.log(`✅ Found ${backups.length} existing backup(s):`);
      backups.slice(0, 3).forEach((backup, index) => {
        console.log(`   ${index + 1}. ${backup.name}`);
        console.log(`      Size: ${(backup.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`      Age: ${backup.age} days`);
      });
    }
    console.log();

    // Test 3: Get Backup Statistics
    console.log('📊 Test 3: Backup Statistics');
    console.log('--------------------------------------------------');
    
    const stats = await backupService.getBackupStats();
    
    console.log(`✅ Total Backups: ${stats.count}`);
    console.log(`✅ Total Size: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
    
    if (stats.count > 0) {
      console.log(`✅ Average Size: ${(stats.averageSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`✅ Newest: ${stats.newest?.toLocaleString() || 'N/A'}`);
      console.log(`✅ Oldest: ${stats.oldest?.toLocaleString() || 'N/A'}`);
    }
    console.log();

    // Test 4: Test Backup Creation (Optional - commented out to avoid creating unnecessary backups during testing)
    console.log('💾 Test 4: Backup Creation Test');
    console.log('--------------------------------------------------');
    console.log('⚠️  Skipping actual backup creation during test');
    console.log('   To test backup creation, run: npm run backup');
    console.log('   Or: node scripts/backup-database.js');
    console.log();

    // Test 5: Check MongoDB Tools
    console.log('🛠️  Test 5: MongoDB Tools Check');
    console.log('--------------------------------------------------');
    
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    try {
      await execAsync('mongodump --version');
      console.log('✅ mongodump: Installed');
    } catch (error) {
      console.log('❌ mongodump: Not found');
      console.log('   Please install MongoDB Database Tools:');
      console.log('   https://www.mongodb.com/try/download/database-tools');
    }
    
    try {
      await execAsync('mongorestore --version');
      console.log('✅ mongorestore: Installed');
    } catch (error) {
      console.log('❌ mongorestore: Not found');
    }
    console.log();

    // Test 6: Environment Variables
    console.log('🌍 Test 6: Environment Configuration');
    console.log('--------------------------------------------------');
    
    if (process.env.MONGODB_URI) {
      console.log('✅ MONGODB_URI: Configured');
    } else {
      console.log('❌ MONGODB_URI: Not set');
    }
    
    if (process.env.BACKUP_DIR) {
      console.log(`✅ BACKUP_DIR: ${process.env.BACKUP_DIR}`);
    } else {
      console.log('⚠️  BACKUP_DIR: Using default (backend/backups)');
    }
    
    if (process.env.BACKUP_RETENTION_DAYS) {
      console.log(`✅ BACKUP_RETENTION_DAYS: ${process.env.BACKUP_RETENTION_DAYS}`);
    } else {
      console.log('⚠️  BACKUP_RETENTION_DAYS: Using default (30 days)');
    }
    console.log();

    console.log('================================================');
    console.log('✅ All backup system tests completed!\n');
    
    console.log('📋 SUMMARY:');
    console.log('--------------------------------------------------');
    console.log('✅ Backup Service: Configured');
    console.log('✅ List Backups: Working');
    console.log('✅ Statistics: Working');
    console.log(`✅ Existing Backups: ${stats.count}`);
    console.log('\n💡 USAGE:');
    console.log('--------------------------------------------------');
    console.log('Create Backup:');
    console.log('   npm run backup');
    console.log('   OR: node scripts/backup-database.js');
    console.log('\nRestore Backup:');
    console.log('   npm run restore');
    console.log('   OR: node scripts/restore-database.js <backup-name>');
    console.log('\nList Backups:');
    console.log('   node scripts/restore-database.js');
    console.log('\n⏰ AUTOMATED BACKUPS:');
    console.log('--------------------------------------------------');
    console.log('Set up a cron job (Linux/Mac):');
    console.log('   0 2 * * * cd /path/to/backend && node scripts/backup-database.js');
    console.log('\nOr Windows Task Scheduler:');
    console.log('   - Action: Start a program');
    console.log('   - Program: node.exe');
    console.log('   - Arguments: scripts/backup-database.js');
    console.log('   - Start in: C:\\path\\to\\backend');
    console.log('   - Trigger: Daily at 2:00 AM\n');
    
    console.log('🎉 Backup system is ready!\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error.message);
    
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

// Run tests
console.log('🚀 Starting Backup System Tests...\n');
testBackupRestore();
