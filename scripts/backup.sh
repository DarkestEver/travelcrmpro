#!/bin/bash

# ================================
# Travel CRM - MongoDB Backup Script
# ================================

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backups}"
MONGO_HOST="${MONGO_HOST:-localhost}"
MONGO_PORT="${MONGO_PORT:-27017}"
MONGO_DB="${MONGO_DB:-travel-crm}"
MONGO_USERNAME="${MONGO_USERNAME:-admin}"
MONGO_PASSWORD="${MONGO_PASSWORD}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

# Date format for backup files
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="backup_${MONGO_DB}_${DATE}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if mongodump is available
if ! command -v mongodump &> /dev/null; then
    error "mongodump command not found. Please install MongoDB Database Tools."
    exit 1
fi

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    log "Creating backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
fi

# Start backup
log "Starting MongoDB backup..."
log "Database: $MONGO_DB"
log "Host: $MONGO_HOST:$MONGO_PORT"
log "Backup location: $BACKUP_PATH"

# Perform backup
if [ -n "$MONGO_PASSWORD" ]; then
    # With authentication
    mongodump \
        --host="$MONGO_HOST" \
        --port="$MONGO_PORT" \
        --db="$MONGO_DB" \
        --username="$MONGO_USERNAME" \
        --password="$MONGO_PASSWORD" \
        --authenticationDatabase=admin \
        --out="$BACKUP_PATH" \
        --gzip
else
    # Without authentication (development)
    mongodump \
        --host="$MONGO_HOST" \
        --port="$MONGO_PORT" \
        --db="$MONGO_DB" \
        --out="$BACKUP_PATH" \
        --gzip
fi

# Check if backup was successful
if [ $? -eq 0 ]; then
    log "Backup completed successfully!"
    
    # Create compressed archive
    log "Creating compressed archive..."
    cd "$BACKUP_DIR"
    tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}"
    
    # Remove uncompressed backup
    rm -rf "${BACKUP_NAME}"
    
    # Get backup size
    BACKUP_SIZE=$(du -h "${BACKUP_NAME}.tar.gz" | cut -f1)
    log "Backup size: $BACKUP_SIZE"
    log "Backup file: ${BACKUP_NAME}.tar.gz"
else
    error "Backup failed!"
    exit 1
fi

# Cleanup old backups
log "Cleaning up old backups (keeping last $BACKUP_RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "backup_${MONGO_DB}_*.tar.gz" -type f -mtime +$BACKUP_RETENTION_DAYS -delete

REMAINING_BACKUPS=$(find "$BACKUP_DIR" -name "backup_${MONGO_DB}_*.tar.gz" -type f | wc -l)
log "Remaining backups: $REMAINING_BACKUPS"

# Send notification (optional - requires additional setup)
# curl -X POST https://your-notification-service.com/api/notify \
#     -H "Content-Type: application/json" \
#     -d "{\"message\": \"MongoDB backup completed successfully\", \"size\": \"$BACKUP_SIZE\"}"

log "Backup process completed!"
exit 0