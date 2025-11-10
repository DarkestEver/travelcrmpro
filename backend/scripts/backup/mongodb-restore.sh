#!/bin/bash

# Travel CRM MongoDB Restore Script

# Configuration
BACKUP_DIR="/var/backups/travel-crm"
MONGO_URI="${MONGO_URI:-mongodb://localhost:27017}"
DB_NAME="${DB_NAME:-travel-crm}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

# Check if backup file is provided
if [ -z "$1" ]; then
    error "Usage: $0 <backup-file.tar.gz> [--drop-existing]"
    echo "Available backups:"
    ls -lh "${BACKUP_DIR}"/*.tar.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"
DROP_EXISTING="${2:-}"

# Check if backup file exists
if [ ! -f "${BACKUP_FILE}" ]; then
    # Try looking in backup directory
    BACKUP_FILE="${BACKUP_DIR}/${BACKUP_FILE}"
    if [ ! -f "${BACKUP_FILE}" ]; then
        error "Backup file not found: ${BACKUP_FILE}"
        exit 1
    fi
fi

log "Starting MongoDB restore from: ${BACKUP_FILE}"

# Extract backup
TEMP_DIR=$(mktemp -d)
log "Extracting backup to temporary directory..."
if tar -xzf "${BACKUP_FILE}" -C "${TEMP_DIR}"; then
    log "Backup extracted successfully"
else
    error "Failed to extract backup"
    rm -rf "${TEMP_DIR}"
    exit 1
fi

# Find the backup directory
BACKUP_DIR_NAME=$(ls "${TEMP_DIR}")
RESTORE_PATH="${TEMP_DIR}/${BACKUP_DIR_NAME}/${DB_NAME}"

# Warning for production
if [ "${DROP_EXISTING}" == "--drop-existing" ]; then
    log "${YELLOW}WARNING: This will DROP the existing database!${NC}"
    read -p "Are you sure you want to continue? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        log "Restore cancelled"
        rm -rf "${TEMP_DIR}"
        exit 0
    fi
    DROP_FLAG="--drop"
else
    DROP_FLAG=""
fi

# Perform restore
log "Restoring database: ${DB_NAME}"
if mongorestore --uri="${MONGO_URI}" --db="${DB_NAME}" ${DROP_FLAG} "${RESTORE_PATH}"; then
    log "Database restored successfully"
else
    error "Restore failed"
    rm -rf "${TEMP_DIR}"
    exit 1
fi

# Cleanup
rm -rf "${TEMP_DIR}"
log "Temporary files cleaned up"

# Verify restore
log "Verifying restore..."
COLLECTION_COUNT=$(mongo "${MONGO_URI}/${DB_NAME}" --quiet --eval "db.getCollectionNames().length")
log "Found ${COLLECTION_COUNT} collections in restored database"

log "Restore completed successfully!"

exit 0
