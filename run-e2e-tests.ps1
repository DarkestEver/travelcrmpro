# Quick Setup and Run E2E Tests
# This script sets up everything and runs the tests

Write-Host "`n╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Travel CRM - E2E Test Setup          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Check if e2e-tests directory exists
if (-not (Test-Path "e2e-tests")) {
    Write-Host "✗ e2e-tests directory not found" -ForegroundColor Red
    Write-Host "  Please run this script from the project root directory" -ForegroundColor Yellow
    exit 1
}

# Step 1: Install dependencies
Write-Host "📦 Step 1: Installing Playwright..." -ForegroundColor Yellow
cd e2e-tests

if (-not (Test-Path "node_modules")) {
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ npm install failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✓ Dependencies already installed" -ForegroundColor Green
}

# Step 2: Install browsers
Write-Host "`n🌐 Step 2: Installing Chrome browser..." -ForegroundColor Yellow
npx playwright install chromium --with-deps
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Browser installation had warnings, but continuing..." -ForegroundColor Yellow
} else {
    Write-Host "✓ Chrome browser installed" -ForegroundColor Green
}

# Step 3: Check if backend is running
Write-Host "`n🔍 Step 3: Checking if backend is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/v1/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✓ Backend is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Backend is not running" -ForegroundColor Red
    Write-Host "`n  Please start the backend in another terminal:" -ForegroundColor Yellow
    Write-Host "    cd backend" -ForegroundColor Cyan
    Write-Host "    npm run dev" -ForegroundColor Cyan
    Write-Host "`n  Then run this script again." -ForegroundColor Yellow
    exit 1
}

# Step 4: Check test credentials
Write-Host "`n👤 Step 4: Checking test credentials..." -ForegroundColor Yellow
Write-Host "  Default: super@admin.com / admin123" -ForegroundColor Cyan
Write-Host "  To change: Edit e2e-tests/tests/user-journey.spec.js lines 5-8" -ForegroundColor Cyan

# Step 5: Run tests
Write-Host "`n🚀 Step 5: Running E2E tests..." -ForegroundColor Yellow
Write-Host "  This will take 2-3 minutes..." -ForegroundColor Cyan
Write-Host "`n----------------------------------------`n" -ForegroundColor Gray

npm test

Write-Host "`n----------------------------------------`n" -ForegroundColor Gray

# Step 6: Show report
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ All tests completed!" -ForegroundColor Green
    Write-Host "`n📊 View detailed report:" -ForegroundColor Yellow
    Write-Host "    cd e2e-tests" -ForegroundColor Cyan
    Write-Host "    npm run report" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  Some tests failed" -ForegroundColor Yellow
    Write-Host "`n📊 View detailed report:" -ForegroundColor Yellow
    Write-Host "    cd e2e-tests" -ForegroundColor Cyan
    Write-Host "    npm run report" -ForegroundColor Cyan
}

Write-Host "`n✅ Setup complete!" -ForegroundColor Green
Write-Host "`n═══════════════════════════════════════`n" -ForegroundColor Cyan

cd..
