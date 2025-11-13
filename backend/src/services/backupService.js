/**
 * Database Backup Service
 * Handles automated MongoDB backups with compression and retention
 */

const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const execAsync = promisify(exec);

class BackupService {
  constructor() {
    this.backupDir = process.env.BACKUP_DIR || path.join(__dirname, '../../../backups');
    this.retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS) || 30;
    this.mongoUri = process.env.MONGODB_URI;
    this.dbName = this.extractDbName(this.mongoUri);
  }

  /**
   * Extract database name from MongoDB URI
   */
  extractDbName(uri) {
    if (!uri) {
      console.warn('⚠️  MONGODB_URI not set, using default database name');
      return 'travelcrm';
    }
    const match = uri.match(/\/([^/?]+)(\?|$)/);
    return match ? match[1] : 'travelcrm';
  }

  /**
   * Create backup directory if it doesn't exist
   */
  async ensureBackupDirectory() {
    try {
      await fs.access(this.backupDir);
    } catch {
      await fs.mkdir(this.backupDir, { recursive: true });
    }
  }

  /**
   * Generate backup filename with timestamp
   */
  generateBackupFilename() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `backup-${this.dbName}-${timestamp}`;
  }

  /**
   * Create a database backup using mongodump
   */
  async createBackup() {
    try {
      await this.ensureBackupDirectory();

      const backupName = this.generateBackupFilename();
      const backupPath = path.join(this.backupDir, backupName);

      console.log(`📦 Starting backup: ${backupName}`);
      console.log(`   Database: ${this.dbName}`);
      console.log(`   Location: ${backupPath}`);

      // Build mongodump command
      const command = `mongodump --uri="${this.mongoUri}" --out="${backupPath}" --gzip`;

      // Execute backup
      const { stdout, stderr } = await execAsync(command);

      if (stderr && !stderr.includes('done dumping')) {
        console.error('⚠️  Backup warnings:', stderr);
      }

      // Get backup size
      const stats = await this.getDirectorySize(backupPath);
      
      console.log(`✅ Backup completed successfully`);
      console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   Files: ${stats.files}`);

      // Clean old backups
      await this.cleanOldBackups();

      return {
        success: true,
        backupName,
        backupPath,
        size: stats.size,
        files: stats.files,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('❌ Backup failed:', error.message);
      throw new Error(`Backup failed: ${error.message}`);
    }
  }

  /**
   * Get size of directory recursively
   */
  async getDirectorySize(dirPath) {
    let totalSize = 0;
    let fileCount = 0;

    async function calculateSize(currentPath) {
      const items = await fs.readdir(currentPath, { withFileTypes: true });

      for (const item of items) {
        const itemPath = path.join(currentPath, item.name);

        if (item.isDirectory()) {
          await calculateSize(itemPath);
        } else {
          const stats = await fs.stat(itemPath);
          totalSize += stats.size;
          fileCount++;
        }
      }
    }

    await calculateSize(dirPath);

    return { size: totalSize, files: fileCount };
  }

  /**
   * List all available backups
   */
  async listBackups() {
    try {
      await this.ensureBackupDirectory();

      const items = await fs.readdir(this.backupDir, { withFileTypes: true });
      const backups = [];

      for (const item of items) {
        if (item.isDirectory() && item.name.startsWith('backup-')) {
          const backupPath = path.join(this.backupDir, item.name);
          const stats = await this.getDirectorySize(backupPath);
          const stat = await fs.stat(backupPath);

          backups.push({
            name: item.name,
            path: backupPath,
            size: stats.size,
            files: stats.files,
            created: stat.birthtime,
            age: Math.floor((Date.now() - stat.birthtime.getTime()) / (1000 * 60 * 60 * 24))
          });
        }
      }

      // Sort by creation date (newest first)
      backups.sort((a, b) => b.created - a.created);

      return backups;

    } catch (error) {
      console.error('❌ Failed to list backups:', error.message);
      throw error;
    }
  }

  /**
   * Clean up old backups based on retention policy
   */
  async cleanOldBackups() {
    try {
      const backups = await this.listBackups();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

      let deletedCount = 0;
      let reclaimedSpace = 0;

      for (const backup of backups) {
        if (backup.created < cutoffDate) {
          console.log(`🗑️  Deleting old backup: ${backup.name} (${backup.age} days old)`);
          
          await this.deleteDirectory(backup.path);
          deletedCount++;
          reclaimedSpace += backup.size;
        }
      }

      if (deletedCount > 0) {
        console.log(`✅ Cleaned up ${deletedCount} old backups`);
        console.log(`   Reclaimed: ${(reclaimedSpace / 1024 / 1024).toFixed(2)} MB`);
      }

      return { deletedCount, reclaimedSpace };

    } catch (error) {
      console.error('⚠️  Failed to clean old backups:', error.message);
      // Don't throw - cleanup failure shouldn't stop the backup process
    }
  }

  /**
   * Delete directory recursively
   */
  async deleteDirectory(dirPath) {
    await fs.rm(dirPath, { recursive: true, force: true });
  }

  /**
   * Restore database from backup
   */
  async restoreBackup(backupName) {
    try {
      const backupPath = path.join(this.backupDir, backupName);

      // Check if backup exists
      try {
        await fs.access(backupPath);
      } catch {
        throw new Error(`Backup not found: ${backupName}`);
      }

      console.log(`📥 Starting restore: ${backupName}`);
      console.log(`   Database: ${this.dbName}`);
      console.log(`   Source: ${backupPath}`);

      // Build mongorestore command
      const dbPath = path.join(backupPath, this.dbName);
      const command = `mongorestore --uri="${this.mongoUri}" --gzip --drop "${dbPath}"`;

      // Execute restore
      const { stdout, stderr } = await execAsync(command);

      if (stderr && !stderr.includes('done')) {
        console.error('⚠️  Restore warnings:', stderr);
      }

      console.log(`✅ Restore completed successfully`);

      return {
        success: true,
        backupName,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('❌ Restore failed:', error.message);
      throw new Error(`Restore failed: ${error.message}`);
    }
  }

  /**
   * Get backup statistics
   */
  async getBackupStats() {
    try {
      const backups = await this.listBackups();

      const totalSize = backups.reduce((sum, b) => sum + b.size, 0);
      const totalFiles = backups.reduce((sum, b) => sum + b.files, 0);

      return {
        count: backups.length,
        totalSize,
        totalFiles,
        oldest: backups.length > 0 ? backups[backups.length - 1].created : null,
        newest: backups.length > 0 ? backups[0].created : null,
        averageSize: backups.length > 0 ? totalSize / backups.length : 0,
        backups: backups.slice(0, 10) // Return only 10 most recent
      };

    } catch (error) {
      console.error('❌ Failed to get backup stats:', error.message);
      throw error;
    }
  }
}

module.exports = new BackupService();
