@echo off
REM ================================
REM Travel CRM - MongoDB Backup Script (Windows)
REM ================================

setlocal enabledelayedexpansion

REM Configuration
set BACKUP_DIR=C:\backups\travel-crm
set MONGO_HOST=localhost
set MONGO_PORT=27017
set MONGO_DB=travel-crm
set MONGO_USERNAME=admin
set MONGO_PASSWORD=your_password
set BACKUP_RETENTION_DAYS=30

REM Date format for backup files
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "DATE=%dt:~0,8%_%dt:~8,6%"
set "BACKUP_NAME=backup_%MONGO_DB%_%DATE%"
set "BACKUP_PATH=%BACKUP_DIR%\%BACKUP_NAME%"

echo [%TIME%] Starting MongoDB backup...
echo Database: %MONGO_DB%
echo Host: %MONGO_HOST%:%MONGO_PORT%
echo Backup location: %BACKUP_PATH%

REM Check if backup directory exists
if not exist "%BACKUP_DIR%" (
    echo Creating backup directory: %BACKUP_DIR%
    mkdir "%BACKUP_DIR%"
)

REM Perform backup
mongodump --host=%MONGO_HOST% --port=%MONGO_PORT% --db=%MONGO_DB% --username=%MONGO_USERNAME% --password=%MONGO_PASSWORD% --authenticationDatabase=admin --out="%BACKUP_PATH%" --gzip

if %ERRORLEVEL% == 0 (
    echo [%TIME%] Backup completed successfully!
    
    REM Create compressed archive using 7zip or tar (if available)
    if exist "C:\Program Files\7-Zip\7z.exe" (
        echo Creating compressed archive...
        "C:\Program Files\7-Zip\7z.exe" a -tzip "%BACKUP_PATH%.zip" "%BACKUP_PATH%\*"
        rmdir /s /q "%BACKUP_PATH%"
        echo Backup file: %BACKUP_NAME%.zip
    ) else (
        echo 7-Zip not found. Backup saved without compression.
    )
    
    REM Cleanup old backups
    echo Cleaning up old backups...
    forfiles /P "%BACKUP_DIR%" /M backup_%MONGO_DB%_*.* /D -%BACKUP_RETENTION_DAYS% /C "cmd /c del @path" 2>nul
    
    echo Backup process completed!
) else (
    echo [ERROR] Backup failed!
    exit /b 1
)

endlocal