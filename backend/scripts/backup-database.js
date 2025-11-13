#!/usr/bin/env node
/**
 * Database Backup Script
 * Run manually or via cron job: node scripts/backup-database.js
 */

require('dotenv').config();
const backupService = require('../src/services/backupService');

async function runBackup() {
  console.log('🚀 Starting Database Backup\n');
  console.log('================================================\n');

  const startTime = Date.now();

  try {
    // Create backup
    const result = await backupService.createBackup();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n================================================');
    console.log('✅ BACKUP SUCCESSFUL\n');
    console.log('📋 Summary:');
    console.log('--------------------------------------------------');
    console.log(`   Backup Name: ${result.backupName}`);
    console.log(`   Location: ${result.backupPath}`);
    console.log(`   Size: ${(result.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Files: ${result.files}`);
    console.log(`   Duration: ${duration}s`);
    console.log(`   Timestamp: ${result.timestamp.toISOString()}\n`);

    // Get statistics
    const stats = await backupService.getBackupStats();
    
    console.log('📊 Backup Statistics:');
    console.log('--------------------------------------------------');
    console.log(`   Total Backups: ${stats.count}`);
    console.log(`   Total Size: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Average Size: ${(stats.averageSize / 1024 / 1024).toFixed(2)} MB`);
    
    if (stats.oldest) {
      const age = Math.floor((Date.now() - stats.oldest.getTime()) / (1000 * 60 * 60 * 24));
      console.log(`   Oldest Backup: ${age} days ago`);
    }
    
    console.log('\n================================================\n');

    process.exit(0);

  } catch (error) {
    console.error('\n================================================');
    console.error('❌ BACKUP FAILED\n');
    console.error('Error:', error.message);
    console.error('\nPlease check:');
    console.error('  - MongoDB is running and accessible');
    console.error('  - mongodump is installed (MongoDB Tools)');
    console.error('  - MONGODB_URI is set in .env');
    console.error('  - Backup directory is writable\n');
    console.error('================================================\n');

    process.exit(1);
  }
}

// Run backup
runBackup();
