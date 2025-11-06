# 🚀 One-Command Deployment Script
# This script deploys Travel CRM in production mode

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Travel CRM - Production Deployment   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker is not installed. Please install Docker first." -ForegroundColor Red
    exit 1
}

if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker Compose is not installed. Please install Docker Compose first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker and Docker Compose found" -ForegroundColor Green
Write-Host ""

# Check environment files
Write-Host "Checking environment configuration..." -ForegroundColor Yellow

if (-not (Test-Path "backend\.env")) {
    Write-Host "⚠️  backend\.env not found. Creating from example..." -ForegroundColor Yellow
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "⚠️  IMPORTANT: Edit backend\.env with production values!" -ForegroundColor Red
    $needsConfig = $true
}

if (-not (Test-Path "frontend\.env")) {
    Write-Host "⚠️  frontend\.env not found. Creating from example..." -ForegroundColor Yellow
    Copy-Item "frontend\.env.example" "frontend\.env"
    Write-Host "⚠️  IMPORTANT: Edit frontend\.env with production values!" -ForegroundColor Red
    $needsConfig = $true
}

if ($needsConfig) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  CONFIGURATION REQUIRED" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please configure the following files:" -ForegroundColor Yellow
    Write-Host "1. backend\.env - Set JWT secrets, SMTP credentials, etc." -ForegroundColor White
    Write-Host "2. frontend\.env - Set API URL" -ForegroundColor White
    Write-Host ""
    $continue = Read-Host "Continue with current configuration? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Host "Deployment cancelled. Please configure .env files and run again." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host "✅ Environment files present" -ForegroundColor Green
Write-Host ""

# Stop existing containers
Write-Host "Stopping existing containers..." -ForegroundColor Yellow
docker-compose down 2>&1 | Out-Null
Write-Host "✅ Containers stopped" -ForegroundColor Green
Write-Host ""

# Pull latest images
Write-Host "Pulling base images..." -ForegroundColor Yellow
docker-compose pull
Write-Host ""

# Build images
Write-Host "Building application images..." -ForegroundColor Yellow
docker-compose build --no-cache
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Images built successfully" -ForegroundColor Green
Write-Host ""

# Start services
Write-Host "Starting services..." -ForegroundColor Yellow
docker-compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start services" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Services started" -ForegroundColor Green
Write-Host ""

# Wait for services to be ready
Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check service health
Write-Host "Checking service health..." -ForegroundColor Yellow

$mongoReady = $false
$redisReady = $false
$backendReady = $false
$frontendReady = $false

for ($i = 1; $i -le 30; $i++) {
    # Check MongoDB
    if (-not $mongoReady) {
        $mongoStatus = docker-compose ps mongodb | Select-String "running"
        if ($mongoStatus) {
            $mongoReady = $true
            Write-Host "✅ MongoDB is ready" -ForegroundColor Green
        }
    }

    # Check Redis
    if (-not $redisReady) {
        $redisStatus = docker-compose ps redis | Select-String "running"
        if ($redisStatus) {
            $redisReady = $true
            Write-Host "✅ Redis is ready" -ForegroundColor Green
        }
    }

    # Check Backend
    if (-not $backendReady) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                $backendReady = $true
                Write-Host "✅ Backend API is ready" -ForegroundColor Green
            }
        } catch {}
    }

    # Check Frontend
    if (-not $frontendReady) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                $frontendReady = $true
                Write-Host "✅ Frontend is ready" -ForegroundColor Green
            }
        } catch {}
    }

    if ($mongoReady -and $redisReady -and $backendReady -and $frontendReady) {
        break
    }

    Start-Sleep -Seconds 2
}

Write-Host ""

# Run database seed
Write-Host "Seeding database..." -ForegroundColor Yellow
docker-compose exec -T backend npm run seed
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database seeded successfully" -ForegroundColor Green
} else {
    Write-Host "⚠️  Database seeding failed (may already be seeded)" -ForegroundColor Yellow
}
Write-Host ""

# Display deployment summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deployment Complete! 🎉" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 Frontend:      http://localhost:5173" -ForegroundColor White
Write-Host "🔌 Backend API:   http://localhost:3000" -ForegroundColor White
Write-Host "💚 Health Check:  http://localhost:3000/api/v1/health" -ForegroundColor White
Write-Host ""
Write-Host "Default Login Credentials:" -ForegroundColor Yellow
Write-Host "  Email:    admin@travelcrm.com" -ForegroundColor White
Write-Host "  Password: Admin@123" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  IMPORTANT: Change default passwords in production!" -ForegroundColor Red
Write-Host ""
Write-Host "Useful Commands:" -ForegroundColor Yellow
Write-Host "  View logs:    docker-compose logs -f" -ForegroundColor White
Write-Host "  Stop:         docker-compose down" -ForegroundColor White
Write-Host "  Restart:      docker-compose restart" -ForegroundColor White
Write-Host "  Status:       docker-compose ps" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Yellow
Write-Host "  Setup Guide:  SETUP.md" -ForegroundColor White
Write-Host "  Production:   PRODUCTION-READY.md" -ForegroundColor White
Write-Host "  Quick Ref:    QUICK-REFERENCE.md" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Happy coding! 🚀" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
