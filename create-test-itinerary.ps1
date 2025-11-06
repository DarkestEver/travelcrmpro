# PowerShell script to create test itinerary

Write-Host "🔐 Logging in..." -ForegroundColor Cyan

$loginBody = @{
    email = "admin@test.com"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "✅ Login successful" -ForegroundColor Green

    Write-Host "`n📝 Creating test itinerary..." -ForegroundColor Cyan

    $itineraryBody = @{
        title = "Test Bangkok Adventure"
        overview = "A 3-day adventure in Bangkok"
        destination = @{
            country = "Thailand"
            city = "Bangkok"
        }
        startDate = "2025-12-01"
        endDate = "2025-12-03"
        numberOfDays = 3
        numberOfNights = 2
        status = "draft"
    } | ConvertTo-Json

    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }

    $itineraryResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/itineraries" -Method POST -Body $itineraryBody -Headers $headers
    $itineraryId = $itineraryResponse.data._id

    Write-Host "✅ Itinerary created with ID: $itineraryId" -ForegroundColor Green
    Write-Host "`n🚀 OPEN THIS URL IN YOUR BROWSER:" -ForegroundColor Yellow
    Write-Host "http://localhost:5174/itineraries/$itineraryId/build" -ForegroundColor Cyan
    Write-Host "`nOr go to Itineraries page and click the 🏗️ Build button`n" -ForegroundColor White

} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
}
