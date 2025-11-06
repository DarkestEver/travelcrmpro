# Travel CRM - Backup & Restore Guide

## Overview

This guide explains how to backup and restore the Travel CRM MongoDB database.

## Backup Scripts

### Linux/Mac: backup.sh

**Location:** `scripts/backup.sh`

**Features:**
- Automated MongoDB backup using mongodump
- Gzip compression
- Automatic cleanup of old backups
- Configurable retention period
- Error handling and logging

**Usage:**

```bash
# Make script executable
chmod +x scripts/backup.sh

# Run backup manually
./scripts/backup.sh

# Configure environment variables
export MONGO_HOST=localhost
export MONGO_PORT=27017
export MONGO_DB=travel-crm
export MONGO_USERNAME=admin
export MONGO_PASSWORD=your_password
export BACKUP_DIR=/backups
export BACKUP_RETENTION_DAYS=30

# Run with custom settings
./scripts/backup.sh
```

**Schedule with Cron:**

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/Travel-crm/scripts/backup.sh >> /var/log/mongodb-backup.log 2>&1

# Weekly backup on Sunday at 3 AM
0 3 * * 0 /path/to/Travel-crm/scripts/backup.sh >> /var/log/mongodb-backup.log 2>&1
```

### Windows: backup.bat

**Location:** `scripts/backup.bat`

**Usage:**

```batch
# Edit backup.bat and configure variables
# Run backup
backup.bat

# Schedule with Task Scheduler
# 1. Open Task Scheduler
# 2. Create Basic Task
# 3. Set trigger (e.g., Daily at 2 AM)
# 4. Action: Start a program
# 5. Program: C:\path\to\Travel-crm\scripts\backup.bat
```

## Restore Scripts

### Linux/Mac: restore.sh

**Location:** `scripts/restore.sh`

**Usage:**

```bash
# Make script executable
chmod +x scripts/restore.sh

# List available backups
./scripts/restore.sh

# Restore from specific backup
./scripts/restore.sh backup_travel-crm_20240101_120000.tar.gz

# Confirm restoration
# Type 'yes' when prompted
```

## Docker Backup

### Manual Backup

```bash
# Backup with docker-compose
docker-compose -f docker-compose.prod.yml run --rm backup

# Or directly
docker exec travel-crm-mongodb-prod mongodump \
  --username=admin \
  --password=your_password \
  --authenticationDatabase=admin \
  --db=travel-crm \
  --out=/backups/manual_backup \
  --gzip
```

### Automated Backup with Cron

```bash
# Add to crontab
0 2 * * * docker-compose -f /path/to/docker-compose.prod.yml run --rm backup
```

## Backup Files

### File Naming Convention

```
backup_<database>_<YYYYMMDD>_<HHMMSS>.tar.gz
```

Examples:
- `backup_travel-crm_20240315_020000.tar.gz`
- `backup_travel-crm_20240316_020000.tar.gz`

### Backup Contents

Each backup contains:
- All collections in the database
- Indexes
- Collection metadata
- Documents (in BSON format, gzipped)

## Storage Recommendations

### Local Storage

```
/backups/
├── backup_travel-crm_20240315_020000.tar.gz
├── backup_travel-crm_20240316_020000.tar.gz
├── backup_travel-crm_20240317_020000.tar.gz
└── ...
```

**Size Estimates:**
- Small database (<1000 bookings): 5-50 MB
- Medium database (1000-10000 bookings): 50-500 MB
- Large database (>10000 bookings): 500 MB - 5 GB

### Cloud Storage

**Upload to AWS S3:**

```bash
# Install AWS CLI
aws configure

# Upload backup
aws s3 cp /backups/backup_travel-crm_*.tar.gz s3://your-bucket/backups/

# Automated upload (add to backup script)
aws s3 sync /backups s3://your-bucket/backups/ --exclude "*" --include "backup_travel-crm_*.tar.gz"
```

**Upload to Google Cloud Storage:**

```bash
# Install gcloud CLI
gcloud auth login

# Upload backup
gsutil cp /backups/backup_travel-crm_*.tar.gz gs://your-bucket/backups/

# Automated upload
gsutil -m rsync -r /backups gs://your-bucket/backups/
```

## Restoration Process

### 1. Prepare for Restoration

```bash
# Stop the application
docker-compose down

# Or stop backend service
pm2 stop travel-crm-backend
```

### 2. Restore Database

```bash
# Using restore script
./scripts/restore.sh backup_travel-crm_20240315_020000.tar.gz

# Or manually with mongorestore
tar -xzf backup_travel-crm_20240315_020000.tar.gz
mongorestore \
  --host=localhost \
  --port=27017 \
  --username=admin \
  --password=your_password \
  --authenticationDatabase=admin \
  --db=travel-crm \
  --drop \
  --gzip \
  ./backup_travel-crm_20240315_020000/travel-crm
```

### 3. Verify Restoration

```bash
# Connect to MongoDB
mongosh -u admin -p your_password --authenticationDatabase admin

# Check collections
use travel-crm
show collections
db.bookings.countDocuments()
db.customers.countDocuments()

# Exit
exit
```

### 4. Restart Application

```bash
# Restart with docker-compose
docker-compose up -d

# Or with PM2
pm2 start travel-crm-backend
```

## Backup Best Practices

### 1. Backup Frequency

- **Development:** Daily backups
- **Staging:** Daily backups with 14-day retention
- **Production:** 
  - Daily backups with 30-day retention
  - Weekly backups with 3-month retention
  - Monthly backups with 1-year retention

### 2. Backup Testing

```bash
# Test backup monthly
# 1. Restore to test database
mongorestore --db=travel-crm-test --drop backup.tar.gz

# 2. Verify data integrity
mongosh travel-crm-test
db.bookings.countDocuments()
db.runCommand({dbStats: 1})

# 3. Clean up test database
db.dropDatabase()
```

### 3. Monitoring

```bash
# Check backup logs
tail -f /var/log/mongodb-backup.log

# Verify recent backups
ls -lht /backups | head -10

# Check backup sizes
du -h /backups/*.tar.gz
```

### 4. Security

```bash
# Encrypt backups (optional)
gpg --symmetric --cipher-algo AES256 backup.tar.gz

# Decrypt when needed
gpg --decrypt backup.tar.gz.gpg > backup.tar.gz

# Set proper permissions
chmod 600 /backups/*.tar.gz
chown mongodb:mongodb /backups/*.tar.gz
```

## Disaster Recovery

### Scenario 1: Database Corruption

```bash
# 1. Stop application
docker-compose down

# 2. Restore from most recent backup
./scripts/restore.sh backup_travel-crm_latest.tar.gz

# 3. Verify and restart
docker-compose up -d
```

### Scenario 2: Accidental Data Deletion

```bash
# 1. Restore to temporary database
mongorestore --db=travel-crm-temp backup.tar.gz

# 2. Export specific collection
mongoexport --db=travel-crm-temp --collection=bookings --out=bookings.json

# 3. Import to production
mongoimport --db=travel-crm --collection=bookings --file=bookings.json

# 4. Clean up
mongo travel-crm-temp --eval "db.dropDatabase()"
```

### Scenario 3: Complete Server Failure

```bash
# 1. Provision new server
# 2. Install MongoDB and application
# 3. Download backup from cloud storage
aws s3 cp s3://your-bucket/backups/backup_latest.tar.gz /backups/

# 4. Restore database
./scripts/restore.sh backup_latest.tar.gz

# 5. Deploy application
docker-compose up -d
```

## Troubleshooting

### Common Issues

**Issue: mongodump not found**
```bash
# Install MongoDB Database Tools
# Ubuntu/Debian
wget https://fastdl.mongodb.org/tools/db/mongodb-database-tools-ubuntu2004-x86_64-100.9.3.tgz
tar -xzf mongodb-database-tools-*.tgz
sudo cp mongodb-database-tools-*/bin/* /usr/local/bin/

# MacOS
brew install mongodb-database-tools
```

**Issue: Authentication failed**
```bash
# Verify credentials
mongosh -u admin -p your_password --authenticationDatabase admin

# Check user permissions
use admin
db.getUser("admin")
```

**Issue: Backup directory full**
```bash
# Check disk space
df -h /backups

# Clean old backups manually
find /backups -name "backup_*.tar.gz" -mtime +30 -delete

# Move to cloud storage
aws s3 sync /backups s3://your-bucket/backups/
rm /backups/backup_*.tar.gz
```

## Support

For additional help:
- MongoDB Documentation: https://docs.mongodb.com/manual/tutorial/backup-and-restore-tools/
- AWS S3 CLI: https://aws.amazon.com/cli/
- Google Cloud Storage: https://cloud.google.com/storage/docs/gsutil