#!/bin/bash

# ================================
# Travel CRM - MongoDB Restore Script
# ================================

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backups}"
MONGO_HOST="${MONGO_HOST:-localhost}"
MONGO_PORT="${MONGO_PORT:-27017}"
MONGO_DB="${MONGO_DB:-travel-crm}"
MONGO_USERNAME="${MONGO_USERNAME:-admin}"
MONGO_PASSWORD="${MONGO_PASSWORD}"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0;no Color'

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

# Check if mongorestore is available
if ! command -v mongorestore &> /dev/null; then
    error "mongorestore command not found. Please install MongoDB Database Tools."
    exit 1
fi

# List available backups if no argument provided
if [ $# -eq 0 ]; then
    log "Available backups:"
    ls -lht "$BACKUP_DIR"/backup_*.tar.gz | head -10
    echo ""
    echo "Usage: $0 <backup_file>"
    echo "Example: $0 backup_travel-crm_20240101_120000.tar.gz"
    exit 0
fi

BACKUP_FILE="$1"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

# Check if backup file exists
if [ ! -f "$BACKUP_PATH" ]; then
    error "Backup file not found: $BACKUP_PATH"
    exit 1
fi

# Extract backup
log "Extracting backup file..."
EXTRACT_DIR="${BACKUP_DIR}/restore_temp"
mkdir -p "$EXTRACT_DIR"
tar -xzf "$BACKUP_PATH" -C "$EXTRACT_DIR"

# Find the backup directory
BACKUP_NAME=$(basename "$BACKUP_FILE" .tar.gz)
RESTORE_PATH="${EXTRACT_DIR}/${BACKUP_NAME}/${MONGO_DB}"

if [ ! -d "$RESTORE_PATH" ]; then
    error "Backup directory not found: $RESTORE_PATH"
    rm -rf "$EXTRACT_DIR"
    exit 1
fi

# Confirm restore
warn "This will restore the database from: $BACKUP_FILE"
warn "Target database: $MONGO_DB on $MONGO_HOST:$MONGO_PORT"
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    log "Restore cancelled."
    rm -rf "$EXTRACT_DIR"
    exit 0
fi

# Perform restore
log "Starting MongoDB restore..."

if [ -n "$MONGO_PASSWORD" ]; then
    # With authentication
    mongorestore \
        --host="$MONGO_HOST" \
        --port="$MONGO_PORT" \
        --db="$MONGO_DB" \
        --username="$MONGO_USERNAME" \
        --password="$MONGO_PASSWORD" \
        --authenticationDatabase=admin \
        --drop \
        --gzip \
        "$RESTORE_PATH"
else
    # Without authentication (development)
    mongorestore \
        --host="$MONGO_HOST" \
        --port="$MONGO_PORT" \
        --db="$MONGO_DB" \
        --drop \
        --gzip \
        "$RESTORE_PATH"
fi

# Check if restore was successful
if [ $? -eq 0 ]; then
    log "Restore completed successfully!"
else
    error "Restore failed!"
    rm -rf "$EXTRACT_DIR"
    exit 1
fi

# Cleanup
log "Cleaning up temporary files..."
rm -rf "$EXTRACT_DIR"

log "Restore process completed!"
exit 0