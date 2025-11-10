#!/bin/bash

# Travel CRM Backup Verification Script
# Verifies backup integrity and completeness

BACKUP_DIR="/var/backups/travel-crm"
MONGO_URI="${MONGO_URI:-mongodb://localhost:27017}"
DB_NAME="${DB_NAME:-travel-crm}"

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

if [ -z "$1" ]; then
    error "Usage: $0 <backup-file.tar.gz>"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "${BACKUP_FILE}" ]; then
    BACKUP_FILE="${BACKUP_DIR}/${BACKUP_FILE}"
    if [ ! -f "${BACKUP_FILE}" ]; then
        error "Backup file not found"
        exit 1
    fi
fi

log "Verifying backup: ${BACKUP_FILE}"

# Check file integrity
log "Checking archive integrity..."
if tar -tzf "${BACKUP_FILE}" > /dev/null 2>&1; then
    log "✓ Archive integrity verified"
else
    error "✗ Archive is corrupted"
    exit 1
fi

# Extract and verify content
TEMP_DIR=$(mktemp -d)
tar -xzf "${BACKUP_FILE}" -C "${TEMP_DIR}"

# Check for required files
log "Checking backup contents..."
BACKUP_DIR_NAME=$(ls "${TEMP_DIR}")
RESTORE_PATH="${TEMP_DIR}/${BACKUP_DIR_NAME}/${DB_NAME}"

if [ -d "${RESTORE_PATH}" ]; then
    log "✓ Database backup directory found"
else
    error "✗ Database backup directory not found"
    rm -rf "${TEMP_DIR}"
    exit 1
fi

# Count collections
COLLECTIONS=$(find "${RESTORE_PATH}" -name "*.bson" | wc -l)
log "✓ Found ${COLLECTIONS} collections in backup"

# Check critical collections
CRITICAL_COLLECTIONS=("users" "customers" "suppliers" "bookings" "itineraries" "quotes")
MISSING_COLLECTIONS=()

for collection in "${CRITICAL_COLLECTIONS[@]}"; do
    if [ -f "${RESTORE_PATH}/${collection}.bson" ]; then
        SIZE=$(du -h "${RESTORE_PATH}/${collection}.bson" | cut -f1)
        log "✓ ${collection}.bson (${SIZE})"
    else
        MISSING_COLLECTIONS+=("$collection")
        error "✗ ${collection}.bson not found"
    fi
done

# Cleanup
rm -rf "${TEMP_DIR}"

# Summary
echo ""
log "=== Verification Summary ==="
log "Backup file: ${BACKUP_FILE}"
log "Total collections: ${COLLECTIONS}"
log "Missing critical collections: ${#MISSING_COLLECTIONS[@]}"

if [ ${#MISSING_COLLECTIONS[@]} -eq 0 ]; then
    log "✓ Backup verification passed"
    exit 0
else
    error "✗ Backup verification failed"
    error "Missing collections: ${MISSING_COLLECTIONS[*]}"
    exit 1
fi
