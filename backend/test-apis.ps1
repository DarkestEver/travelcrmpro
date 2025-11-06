# Travel CRM API Testing Script
# This script tests all backend APIs systematically

$baseUrl = "http://localhost:5000/api/v1"
$token = $null

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TRAVEL CRM API TESTING" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Function to make API requests
function Test-API {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null,
        [string]$Token = $null,
        [string]$TestName
    )
    
    Write-Host "Testing: $TestName" -ForegroundColor Yellow
    Write-Host "  $Method $Endpoint" -ForegroundColor Gray
    
    try {
        $headers = @{
            "Content-Type" = "application/json"
        }
        
        if ($Token) {
            $headers["Authorization"] = "Bearer $Token"
        }
        
        $params = @{
            Uri = "$baseUrl$Endpoint"
            Method = $Method
            Headers = $headers
            ErrorAction = "Stop"
        }
        
        if ($Body) {
            $params["Body"] = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-RestMethod @params
        Write-Host "  ✓ SUCCESS" -ForegroundColor Green
        Write-Host "  Response: $($response | ConvertTo-Json -Compress -Depth 2)" -ForegroundColor Gray
        Write-Host ""
        return $response
    }
    catch {
        Write-Host "  ✗ FAILED" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails) {
            Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
        Write-Host ""
        return $null
    }
}

# ===========================================
# HEALTH CHECK
# ===========================================
Write-Host "=== HEALTH CHECK ===" -ForegroundColor Magenta
Test-API -Method "GET" -Endpoint "/health" -TestName "Server Health Check"

# ===========================================
# AUTHENTICATION MODULE (10 endpoints)
# ===========================================
Write-Host "`n=== AUTHENTICATION MODULE ===" -ForegroundColor Magenta

# 1. Register new user
$registerData = @{
    name = "Test User $(Get-Random -Maximum 9999)"
    email = "testuser$(Get-Random -Maximum 9999)@example.com"
    phone = "+1234567890"
    password = "Test@12345"
    role = "agent"
}
$registerResponse = Test-API -Method "POST" -Endpoint "/auth/register" -Body $registerData -TestName "Register New User"

# 2. Login with admin account
$loginData = @{
    email = "admin@travelcrm.com"
    password = "Admin@123"
}
$loginResponse = Test-API -Method "POST" -Endpoint "/auth/login" -Body $loginData -TestName "Login with Admin Account"

if ($loginResponse -and $loginResponse.data -and $loginResponse.data.accessToken) {
    $token = $loginResponse.data.accessToken
    Write-Host "  ✓ Access Token obtained: $($token.Substring(0, 20))..." -ForegroundColor Green
} else {
    Write-Host "  ✗ Failed to get access token. Stopping tests." -ForegroundColor Red
    exit 1
}

# 3. Get current user profile
Test-API -Method "GET" -Endpoint "/auth/me" -Token $token -TestName "Get Current User Profile"

# 4. Update profile
$updateProfileData = @{
    phone = "+1987654321"
}
Test-API -Method "PUT" -Endpoint "/auth/me" -Body $updateProfileData -Token $token -TestName "Update User Profile"

# ===========================================
# CUSTOMERS MODULE (9 endpoints)
# ===========================================
Write-Host "`n=== CUSTOMERS MODULE ===" -ForegroundColor Magenta

# 1. Create customer
$customerData = @{
    name = "John Doe"
    email = "john.doe$(Get-Random -Maximum 9999)@example.com"
    phone = "+1234567890"
    company = "Acme Corp"
    address = "123 Main St, New York, NY 10001"
}
$customerResponse = Test-API -Method "POST" -Endpoint "/customers" -Body $customerData -Token $token -TestName "Create Customer"
$customerId = if ($customerResponse -and $customerResponse.data) { $customerResponse.data._id } else { $null }

# 2. Get all customers
Test-API -Method "GET" -Endpoint "/customers?page=1&limit=10" -Token $token -TestName "Get All Customers (Paginated)"

if ($customerId) {
    # 3. Get customer by ID
    Test-API -Method "GET" -Endpoint "/customers/$customerId" -Token $token -TestName "Get Customer by ID"
    
    # 4. Update customer
    $updateCustomerData = @{
        company = "New Corp Ltd"
    }
    Test-API -Method "PUT" -Endpoint "/customers/$customerId" -Body $updateCustomerData -Token $token -TestName "Update Customer"
    
    # 5. Add customer note
    $noteData = @{
        note = "This is a test note for the customer"
    }
    Test-API -Method "POST" -Endpoint "/customers/$customerId/notes" -Body $noteData -Token $token -TestName "Add Customer Note"
    
    # 6. Get customer notes
    Test-API -Method "GET" -Endpoint "/customers/$customerId/notes" -Token $token -TestName "Get Customer Notes"
}

# 7. Get customer stats
Test-API -Method "GET" -Endpoint "/customers/stats" -Token $token -TestName "Get Customer Statistics"

# ===========================================
# AGENTS MODULE (10 endpoints)
# ===========================================
Write-Host "`n=== AGENTS MODULE ===" -ForegroundColor Magenta

# Only admin can manage agents
# Login as admin if not already
if ($loginResponse.data.user.role -ne "admin") {
    Write-Host "  Skipping agent tests - requires admin role" -ForegroundColor Yellow
} else {
    # 1. Get all agents
    Test-API -Method "GET" -Endpoint "/agents?page=1&limit=10" -Token $token -TestName "Get All Agents"
    
    # 2. Get agent stats
    Test-API -Method "GET" -Endpoint "/agents/stats" -Token $token -TestName "Get Agent Statistics"
}

# ===========================================
# SUPPLIERS MODULE (10 endpoints)
# ===========================================
Write-Host "`n=== SUPPLIERS MODULE ===" -ForegroundColor Magenta

# 1. Create supplier
$supplierData = @{
    name = "Travel Supplier Inc"
    email = "supplier$(Get-Random -Maximum 9999)@example.com"
    phone = "+1234567890"
    type = "hotel"
    country = "USA"
}
$supplierResponse = Test-API -Method "POST" -Endpoint "/suppliers" -Body $supplierData -Token $token -TestName "Create Supplier"
$supplierId = if ($supplierResponse -and $supplierResponse.data) { $supplierResponse.data._id } else { $null }

# 2. Get all suppliers
Test-API -Method "GET" -Endpoint "/suppliers?page=1&limit=10" -Token $token -TestName "Get All Suppliers"

if ($supplierId) {
    # 3. Get supplier by ID
    Test-API -Method "GET" -Endpoint "/suppliers/$supplierId" -Token $token -TestName "Get Supplier by ID"
    
    # 4. Update supplier
    $updateSupplierData = @{
        phone = "+1987654321"
    }
    Test-API -Method "PUT" -Endpoint "/suppliers/$supplierId" -Body $updateSupplierData -Token $token -TestName "Update Supplier"
}

# ===========================================
# ITINERARIES MODULE (11 endpoints)
# ===========================================
Write-Host "`n=== ITINERARIES MODULE ===" -ForegroundColor Magenta

if ($customerId) {
    # 1. Create itinerary
    $itineraryData = @{
        customer = $customerId
        title = "Paris Tour Package"
        destination = "Paris, France"
        startDate = "2025-12-01"
        endDate = "2025-12-07"
        numberOfDays = 7
        numberOfNights = 6
        description = "Amazing 7-day tour of Paris including Eiffel Tower, Louvre, and more"
    }
    $itineraryResponse = Test-API -Method "POST" -Endpoint "/itineraries" -Body $itineraryData -Token $token -TestName "Create Itinerary"
    $itineraryId = if ($itineraryResponse -and $itineraryResponse.data) { $itineraryResponse.data._id } else { $null }
    
    # 2. Get all itineraries
    Test-API -Method "GET" -Endpoint "/itineraries?page=1&limit=10" -Token $token -TestName "Get All Itineraries"
    
    if ($itineraryId) {
        # 3. Get itinerary by ID
        Test-API -Method "GET" -Endpoint "/itineraries/$itineraryId" -Token $token -TestName "Get Itinerary by ID"
        
        # 4. Update itinerary
        $updateItineraryData = @{
            numberOfDays = 8
        }
        Test-API -Method "PUT" -Endpoint "/itineraries/$itineraryId" -Body $updateItineraryData -Token $token -TestName "Update Itinerary"
    }
}

# ===========================================
# QUOTES MODULE (9 endpoints)
# ===========================================
Write-Host "`n=== QUOTES MODULE ===" -ForegroundColor Magenta

if ($customerId -and $itineraryId) {
    # 1. Create quote
    $quoteData = @{
        customer = $customerId
        itinerary = $itineraryId
        amount = 5000
        validUntil = "2025-11-30"
        inclusions = @("Flights", "Hotels", "Tours", "Meals")
        exclusions = @("Travel insurance", "Personal expenses")
        terms = "50% advance payment required"
    }
    $quoteResponse = Test-API -Method "POST" -Endpoint "/quotes" -Body $quoteData -Token $token -TestName "Create Quote"
    $quoteId = if ($quoteResponse -and $quoteResponse.data) { $quoteResponse.data._id } else { $null }
    
    # 2. Get all quotes
    Test-API -Method "GET" -Endpoint "/quotes?page=1&limit=10" -Token $token -TestName "Get All Quotes"
    
    if ($quoteId) {
        # 3. Get quote by ID
        Test-API -Method "GET" -Endpoint "/quotes/$quoteId" -Token $token -TestName "Get Quote by ID"
        
        # 4. Get quote stats
        Test-API -Method "GET" -Endpoint "/quotes/stats" -Token $token -TestName "Get Quote Statistics"
    }
}

# ===========================================
# BOOKINGS MODULE (10 endpoints)
# ===========================================
Write-Host "`n=== BOOKINGS MODULE ===" -ForegroundColor Magenta

if ($customerId -and $itineraryId -and $quoteId) {
    # 1. Create booking
    $bookingData = @{
        customer = $customerId
        itinerary = $itineraryId
        quote = $quoteId
        travelDate = "2025-12-01"
        numberOfPeople = 2
        totalAmount = 5000
    }
    $bookingResponse = Test-API -Method "POST" -Endpoint "/bookings" -Body $bookingData -Token $token -TestName "Create Booking"
    $bookingId = if ($bookingResponse -and $bookingResponse.data) { $bookingResponse.data._id } else { $null }
    
    # 2. Get all bookings
    Test-API -Method "GET" -Endpoint "/bookings?page=1&limit=10" -Token $token -TestName "Get All Bookings"
    
    if ($bookingId) {
        # 3. Get booking by ID
        Test-API -Method "GET" -Endpoint "/bookings/$bookingId" -Token $token -TestName "Get Booking by ID"
        
        # 4. Get booking stats
        Test-API -Method "GET" -Endpoint "/bookings/stats" -Token $token -TestName "Get Booking Statistics"
    }
}

# ===========================================
# ANALYTICS MODULE (5 endpoints)
# ===========================================
Write-Host "`n=== ANALYTICS MODULE ===" -ForegroundColor Magenta

# 1. Get dashboard stats
Test-API -Method "GET" -Endpoint "/analytics/dashboard" -Token $token -TestName "Get Dashboard Analytics"

# 2. Get revenue report
Test-API -Method "GET" -Endpoint "/analytics/revenue?startDate=2025-01-01&endDate=2025-12-31" -Token $token -TestName "Get Revenue Report"

# 3. Get agent performance
Test-API -Method "GET" -Endpoint "/analytics/agent-performance" -Token $token -TestName "Get Agent Performance Analytics"

# 4. Get booking trends
Test-API -Method "GET" -Endpoint "/analytics/booking-trends?period=month" -Token $token -TestName "Get Booking Trends"

# ===========================================
# SUMMARY
# ===========================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "API TESTING COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nCheck the results above for any failures." -ForegroundColor Yellow
Write-Host "Swagger UI: http://localhost:5000/api-docs" -ForegroundColor Cyan
Write-Host ""
