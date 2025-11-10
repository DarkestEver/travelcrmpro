#!/bin/bash

# Travel CRM MongoDB Backup Script
# This script creates MongoDB backups with compression and retention policy

# Configuration
BACKUP_DIR="/var/backups/travel-crm"
RETENTION_DAYS=30
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="travel-crm_${TIMESTAMP}"

# MongoDB Configuration (load from .env)
MONGO_URI="${MONGO_URI:-mongodb://localhost:27017}"
DB_NAME="${DB_NAME:-travel-crm}"

# Cloud Storage Configuration
S3_BUCKET="${S3_BUCKET:-}"
AZURE_CONTAINER="${AZURE_CONTAINER:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

log "Starting MongoDB backup for database: ${DB_NAME}"

# Create backup
log "Creating backup: ${BACKUP_NAME}"
if mongodump --uri="${MONGO_URI}" --db="${DB_NAME}" --out="${BACKUP_DIR}/${BACKUP_NAME}" --quiet; then
    log "Backup created successfully"
else
    error "Backup failed"
    exit 1
fi

# Compress backup
log "Compressing backup..."
cd "${BACKUP_DIR}" || exit 1
if tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}"; then
    log "Backup compressed successfully"
    rm -rf "${BACKUP_NAME}"
else
    error "Compression failed"
    exit 1
fi

# Get backup size
BACKUP_SIZE=$(du -h "${BACKUP_NAME}.tar.gz" | cut -f1)
log "Backup size: ${BACKUP_SIZE}"

# Upload to S3 if configured
if [ -n "${S3_BUCKET}" ]; then
    log "Uploading backup to S3: ${S3_BUCKET}"
    if aws s3 cp "${BACKUP_NAME}.tar.gz" "s3://${S3_BUCKET}/backups/" --storage-class STANDARD_IA; then
        log "Backup uploaded to S3 successfully"
    else
        warn "Failed to upload backup to S3"
    fi
fi

# Upload to Azure Blob Storage if configured
if [ -n "${AZURE_CONTAINER}" ]; then
    log "Uploading backup to Azure: ${AZURE_CONTAINER}"
    if az storage blob upload --container-name "${AZURE_CONTAINER}" --file "${BACKUP_NAME}.tar.gz" --name "backups/${BACKUP_NAME}.tar.gz"; then
        log "Backup uploaded to Azure successfully"
    else
        warn "Failed to upload backup to Azure"
    fi
fi

# Remove old backups (retention policy)
log "Cleaning up old backups (retention: ${RETENTION_DAYS} days)"
find "${BACKUP_DIR}" -name "travel-crm_*.tar.gz" -type f -mtime +${RETENTION_DAYS} -delete
log "Old backups cleaned up"

# Remove old backups from S3
if [ -n "${S3_BUCKET}" ]; then
    log "Cleaning up old S3 backups"
    CUTOFF_DATE=$(date -d "${RETENTION_DAYS} days ago" +%Y-%m-%d)
    aws s3 ls "s3://${S3_BUCKET}/backups/" | while read -r line; do
        BACKUP_DATE=$(echo "$line" | awk '{print $1}')
        BACKUP_FILE=$(echo "$line" | awk '{print $4}')
        if [[ "${BACKUP_DATE}" < "${CUTOFF_DATE}" ]]; then
            aws s3 rm "s3://${S3_BUCKET}/backups/${BACKUP_FILE}"
            log "Deleted old S3 backup: ${BACKUP_FILE}"
        fi
    done
fi

# Verify backup integrity
log "Verifying backup integrity..."
if tar -tzf "${BACKUP_NAME}.tar.gz" > /dev/null; then
    log "Backup integrity verified"
else
    error "Backup integrity check failed"
    exit 1
fi

# Create backup report
REPORT_FILE="${BACKUP_DIR}/backup_report_${TIMESTAMP}.txt"
cat > "${REPORT_FILE}" << EOF
Travel CRM Backup Report
========================
Date: $(date)
Database: ${DB_NAME}
Backup Name: ${BACKUP_NAME}.tar.gz
Backup Size: ${BACKUP_SIZE}
Backup Location: ${BACKUP_DIR}
S3 Upload: ${S3_BUCKET:+Success}${S3_BUCKET:-N/A}
Azure Upload: ${AZURE_CONTAINER:+Success}${AZURE_CONTAINER:-N/A}
Status: SUCCESS
EOF

log "Backup completed successfully!"
log "Report saved to: ${REPORT_FILE}"

# Send notification (optional - requires mail command)
if command -v mail &> /dev/null; then
    echo "Backup completed successfully. Size: ${BACKUP_SIZE}" | mail -s "Travel CRM Backup Success" "${ADMIN_EMAIL}"
fi

exit 0
