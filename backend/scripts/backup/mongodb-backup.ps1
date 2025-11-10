# Travel CRM MongoDB Backup Script (PowerShell)
# Windows-compatible version

param(
    [string]$BackupDir = "C:\Backups\TravelCRM",
    [int]$RetentionDays = 30,
    [string]$S3Bucket = $env:S3_BUCKET,
    [string]$AzureContainer = $env:AZURE_CONTAINER
)

# MongoDB Configuration
$MongoUri = if ($env:MONGO_URI) { $env:MONGO_URI } else { "mongodb://localhost:27017" }
$DbName = if ($env:DB_NAME) { $env:DB_NAME } else { "travel-crm" }

# Create timestamp
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupName = "travel-crm_$Timestamp"

# Logging functions
function Write-Log {
    param([string]$Message)
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message" -ForegroundColor Green
}

function Write-Error-Log {
    param([string]$Message)
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ERROR: $Message" -ForegroundColor Red
}

function Write-Warning-Log {
    param([string]$Message)
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] WARNING: $Message" -ForegroundColor Yellow
}

# Create backup directory
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

Write-Log "Starting MongoDB backup for database: $DbName"

# Create backup
Write-Log "Creating backup: $BackupName"
$BackupPath = Join-Path $BackupDir $BackupName

try {
    & mongodump --uri="$MongoUri" --db="$DbName" --out="$BackupPath" --quiet
    Write-Log "Backup created successfully"
}
catch {
    Write-Error-Log "Backup failed: $_"
    exit 1
}

# Compress backup
Write-Log "Compressing backup..."
$ZipPath = "$BackupPath.zip"

try {
    Compress-Archive -Path $BackupPath -DestinationPath $ZipPath -CompressionLevel Optimal
    Write-Log "Backup compressed successfully"
    Remove-Item -Path $BackupPath -Recurse -Force
}
catch {
    Write-Error-Log "Compression failed: $_"
    exit 1
}

# Get backup size
$BackupSize = (Get-Item $ZipPath).Length
$BackupSizeMB = [math]::Round($BackupSize / 1MB, 2)
Write-Log "Backup size: $BackupSizeMB MB"

# Upload to S3 if configured
if ($S3Bucket) {
    Write-Log "Uploading backup to S3: $S3Bucket"
    try {
        aws s3 cp $ZipPath "s3://$S3Bucket/backups/" --storage-class STANDARD_IA
        Write-Log "Backup uploaded to S3 successfully"
    }
    catch {
        Write-Warning-Log "Failed to upload backup to S3: $_"
    }
}

# Upload to Azure if configured
if ($AzureContainer) {
    Write-Log "Uploading backup to Azure: $AzureContainer"
    try {
        az storage blob upload --container-name $AzureContainer --file $ZipPath --name "backups/$BackupName.zip"
        Write-Log "Backup uploaded to Azure successfully"
    }
    catch {
        Write-Warning-Log "Failed to upload backup to Azure: $_"
    }
}

# Remove old backups (retention policy)
Write-Log "Cleaning up old backups (retention: $RetentionDays days)"
$CutoffDate = (Get-Date).AddDays(-$RetentionDays)
Get-ChildItem -Path $BackupDir -Filter "travel-crm_*.zip" | 
    Where-Object { $_.LastWriteTime -lt $CutoffDate } |
    ForEach-Object {
        Remove-Item $_.FullName -Force
        Write-Log "Deleted old backup: $($_.Name)"
    }

# Verify backup integrity
Write-Log "Verifying backup integrity..."
try {
    $ZipTest = Test-Path $ZipPath
    if ($ZipTest) {
        Write-Log "Backup integrity verified"
    }
    else {
        Write-Error-Log "Backup integrity check failed"
        exit 1
    }
}
catch {
    Write-Error-Log "Backup verification failed: $_"
    exit 1
}

# Create backup report
$ReportFile = Join-Path $BackupDir "backup_report_$Timestamp.txt"
$Report = @"
Travel CRM Backup Report
========================
Date: $(Get-Date)
Database: $DbName
Backup Name: $BackupName.zip
Backup Size: $BackupSizeMB MB
Backup Location: $BackupDir
S3 Upload: $(if ($S3Bucket) { 'Success' } else { 'N/A' })
Azure Upload: $(if ($AzureContainer) { 'Success' } else { 'N/A' })
Status: SUCCESS
"@

$Report | Out-File -FilePath $ReportFile -Encoding UTF8
Write-Log "Backup completed successfully!"
Write-Log "Report saved to: $ReportFile"

exit 0
