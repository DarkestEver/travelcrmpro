# Travel CRM - Quick API Test Script
# Tests all API endpoints and reports issues

$API_BASE = "http://localhost:5000/api/v1"
$LOGIN_EMAIL = "admin@travelcrm.com"
$LOGIN_PASSWORD = "Admin@123"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Travel CRM - Quick API Test" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$passed = 0
$failed = 0
$warnings = 0
$issues = @()

function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Path,
        [string]$Name,
        [bool]$RequiresAuth = $true,
        [hashtable]$Body = $null
    )
    
    $url = "$API_BASE$Path"
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    if ($RequiresAuth -and $script:authToken) {
        $headers["Authorization"] = "Bearer $script:authToken"
    }
    
    try {
        $params = @{
            Uri = $url
            Method = $Method
            Headers = $headers
            ErrorAction = 'Stop'
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json)
        }
        
        $response = Invoke-RestMethod @params
        Write-Host "✓ $Name : $Method $Path" -ForegroundColor Green
        $script:passed++
        return $response
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errorMsg = $_.Exception.Message
        
        if ($statusCode -eq 404) {
            Write-Host "✗ $Name : $Method $Path → 404 Not Found" -ForegroundColor Red
            $script:issues += "$Name - API endpoint not found: $Path"
        }
        elseif ($statusCode -eq 403) {
            Write-Host "✗ $Name : $Method $Path → 403 Forbidden" -ForegroundColor Red
            $script:issues += "$Name - Permission denied"
        }
        elseif ($statusCode -eq 401) {
            Write-Host "⚠ $Name : $Method $Path → 401 Unauthorized" -ForegroundColor Yellow
            $script:warnings++
        }
        else {
            Write-Host "✗ $Name : $Method $Path → Error: $errorMsg" -ForegroundColor Red
        }
        
        $script:failed++
        return $null
    }
}

# Test 1: Health Check
Write-Host "`nTesting Public Endpoints..." -ForegroundColor Yellow
Test-Endpoint -Method "GET" -Path "/health" -Name "Health Check" -RequiresAuth $false

# Test 2: Login
Write-Host "`nAttempting Login..." -ForegroundColor Yellow
$loginBody = @{
    email = $LOGIN_EMAIL
    password = $LOGIN_PASSWORD
}

$loginResponse = Test-Endpoint -Method "POST" -Path "/auth/login" -Name "Login" -RequiresAuth $false -Body $loginBody

if ($loginResponse) {
    if ($loginResponse.data.accessToken) {
        $script:authToken = $loginResponse.data.accessToken
        Write-Host "[OK] Login successful. Token obtained." -ForegroundColor Green
        Write-Host "  User: $($loginResponse.data.user.email)" -ForegroundColor Cyan
        Write-Host "  Role: $($loginResponse.data.user.role)" -ForegroundColor Cyan
    }
    elseif ($loginResponse.accessToken) {
        $script:authToken = $loginResponse.accessToken
        Write-Host "[OK] Login successful. Token obtained." -ForegroundColor Green
    }
    else {
        Write-Host "[ERROR] Login response does not contain access token" -ForegroundColor Red
        Write-Host "`nPlease update LOGIN_EMAIL and LOGIN_PASSWORD in this script" -ForegroundColor Yellow
        exit 1
    }
}
else {
    Write-Host "[ERROR] Login failed. Cannot test authenticated endpoints." -ForegroundColor Red
    Write-Host "`nPlease check:" -ForegroundColor Yellow
    Write-Host "1. Backend is running (npm run dev in backend folder)" -ForegroundColor Yellow
    Write-Host "2. Login credentials are correct" -ForegroundColor Yellow
    exit 1
}

# Test 3: Core Resources
Write-Host "`nTesting Core Resources..." -ForegroundColor Yellow
Test-Endpoint -Method "GET" -Path "/tenants" -Name "Tenants"
Test-Endpoint -Method "GET" -Path "/agents" -Name "Agents"
Test-Endpoint -Method "GET" -Path "/customers" -Name "Customers"
Test-Endpoint -Method "GET" -Path "/suppliers" -Name "Suppliers"
Test-Endpoint -Method "GET" -Path "/itineraries" -Name "Itineraries"
Test-Endpoint -Method "GET" -Path "/quotes" -Name "Quotes"
Test-Endpoint -Method "GET" -Path "/bookings" -Name "Bookings"

# Test 4: Finance
Write-Host "`nTesting Finance Endpoints..." -ForegroundColor Yellow
Test-Endpoint -Method "GET" -Path "/finance" -Name "Finance Overview"
Test-Endpoint -Method "GET" -Path "/bank-reconciliation" -Name "Bank Reconciliation"
Test-Endpoint -Method "GET" -Path "/currency/rates" -Name "Currency Rates"

# Test 5: Supplier Management
Write-Host "`nTesting Supplier Management..." -ForegroundColor Yellow
Test-Endpoint -Method "GET" -Path "/supplier-inventory" -Name "Supplier Inventory"
Test-Endpoint -Method "GET" -Path "/rate-sheets" -Name "Rate Sheets"
Test-Endpoint -Method "GET" -Path "/inventory-sync/status" -Name "Inventory Sync Status"

# Test 6: Analytics
Write-Host "`nTesting Analytics..." -ForegroundColor Yellow
Test-Endpoint -Method "GET" -Path "/analytics" -Name "Analytics"
Test-Endpoint -Method "GET" -Path "/demand-forecasting" -Name "Demand Forecasting"

# Test 7: Admin
Write-Host "`nTesting Admin Endpoints..." -ForegroundColor Yellow
Test-Endpoint -Method "GET" -Path "/performance/metrics" -Name "Performance Metrics"
Test-Endpoint -Method "GET" -Path "/notifications" -Name "Notifications"
Test-Endpoint -Method "GET" -Path "/audit-logs" -Name "Audit Logs"

# Summary
Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "Test Summary" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "✓ Passed  : $passed" -ForegroundColor Green
Write-Host "✗ Failed  : $failed" -ForegroundColor Red
Write-Host "⚠ Warnings: $warnings" -ForegroundColor Yellow

if ($issues.Count -gt 0) {
    Write-Host "`nIssues Found:" -ForegroundColor Red
    $issues | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
}

Write-Host "`n========================================`n" -ForegroundColor Magenta

# Save results
$results = @{
    timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    passed = $passed
    failed = $failed
    warnings = $warnings
    issues = $issues
}

$results | ConvertTo-Json | Out-File "test-results-quick.json"
Write-Host "Results saved to: test-results-quick.json" -ForegroundColor Cyan
