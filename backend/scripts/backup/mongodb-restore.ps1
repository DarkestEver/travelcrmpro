# Travel CRM MongoDB Restore Script (PowerShell)

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,
    [switch]$DropExisting,
    [string]$BackupDir = "C:\Backups\TravelCRM"
)

# MongoDB Configuration
$MongoUri = if ($env:MONGO_URI) { $env:MONGO_URI } else { "mongodb://localhost:27017" }
$DbName = if ($env:DB_NAME) { $env:DB_NAME } else { "travel-crm" }

# Logging functions
function Write-Log {
    param([string]$Message)
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message" -ForegroundColor Green
}

function Write-Error-Log {
    param([string]$Message)
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ERROR: $Message" -ForegroundColor Red
}

# Check if backup file exists
if (-not (Test-Path $BackupFile)) {
    $BackupFile = Join-Path $BackupDir $BackupFile
    if (-not (Test-Path $BackupFile)) {
        Write-Error-Log "Backup file not found: $BackupFile"
        Write-Host "`nAvailable backups:"
        Get-ChildItem -Path $BackupDir -Filter "*.zip" | Format-Table Name, Length, LastWriteTime
        exit 1
    }
}

Write-Log "Starting MongoDB restore from: $BackupFile"

# Extract backup
$TempDir = Join-Path $env:TEMP "travel-crm-restore-$(Get-Date -Format 'yyyyMMddHHmmss')"
New-Item -ItemType Directory -Path $TempDir -Force | Out-Null

Write-Log "Extracting backup to temporary directory..."
try {
    Expand-Archive -Path $BackupFile -DestinationPath $TempDir -Force
    Write-Log "Backup extracted successfully"
}
catch {
    Write-Error-Log "Failed to extract backup: $_"
    Remove-Item -Path $TempDir -Recurse -Force
    exit 1
}

# Find the restore path
$RestorePath = Get-ChildItem -Path $TempDir -Directory | Select-Object -First 1
$RestorePath = Join-Path $RestorePath.FullName $DbName

# Warning for production
if ($DropExisting) {
    Write-Host "`nWARNING: This will DROP the existing database!" -ForegroundColor Yellow
    $confirm = Read-Host "Are you sure you want to continue? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Log "Restore cancelled"
        Remove-Item -Path $TempDir -Recurse -Force
        exit 0
    }
    $DropFlag = "--drop"
}
else {
    $DropFlag = ""
}

# Perform restore
Write-Log "Restoring database: $DbName"
try {
    if ($DropFlag) {
        & mongorestore --uri="$MongoUri" --db="$DbName" --drop $RestorePath
    }
    else {
        & mongorestore --uri="$MongoUri" --db="$DbName" $RestorePath
    }
    Write-Log "Database restored successfully"
}
catch {
    Write-Error-Log "Restore failed: $_"
    Remove-Item -Path $TempDir -Recurse -Force
    exit 1
}

# Cleanup
Remove-Item -Path $TempDir -Recurse -Force
Write-Log "Temporary files cleaned up"

Write-Log "Restore completed successfully!"

exit 0
