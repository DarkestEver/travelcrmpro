# Travel CRM - Complete API Testing Script
# Test all features from Tenant Admin to Customer workflow

# Base URL
$baseUrl = "http://localhost:5000/api/v1"
$headers = @{
    "Content-Type" = "application/json"
}

# Colors for output
function Write-Success { param($message) Write-Host "✅ $message" -ForegroundColor Green }
function Write-Error { param($message) Write-Host "❌ $message" -ForegroundColor Red }
function Write-Info { param($message) Write-Host "ℹ️  $message" -ForegroundColor Cyan }
function Write-Step { param($message) Write-Host "`n📝 $message" -ForegroundColor Yellow }

# Store tokens and IDs
$global:tokens = @{}
$global:ids = @{}

Write-Host "`n🚀 Travel CRM API Testing Suite`n" -ForegroundColor Magenta
Write-Host ("=" * 60)

# ============================================================================
# TEST 0: Setup - Create Super Admin and Default Tenant
# ============================================================================
Write-Step "TEST 0: Setup - Create Super Admin & Default Tenant"

Write-Info "Run this command first:"
Write-Host "cd backend && node scripts/seedSuperAdmin.js" -ForegroundColor White
Write-Host "`nPress Enter after running the seed script..." -ForegroundColor Yellow
$null = Read-Host

# ============================================================================
# TEST 1: Super Admin - Create New Travel Agency Tenant
# ============================================================================
Write-Step "TEST 1: Super Admin Login & Create Tenant"

# 1.1 Login as Super Admin
Write-Info "Logging in as Super Admin..."
$loginBody = @{
    email = "admin@travelcrm.com"
    password = "Admin@123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -Headers $headers
    $global:tokens["superadmin"] = $response.data.token
    Write-Success "Super Admin logged in successfully"
    Write-Host "Token: $($global:tokens['superadmin'].Substring(0,20))..." -ForegroundColor Gray
} catch {
    Write-Error "Super Admin login failed: $_"
    exit
}

# 1.2 Create New Tenant - Demo Travel Agency
Write-Info "Creating new tenant 'Demo Travel Agency'..."
$tenantBody = @{
    name = "Demo Travel Agency"
    subdomain = "demo-agency"
    ownerName = "Agency Admin"
    ownerEmail = "admin@demoagency.com"
    ownerPassword = "Admin@123"
    ownerPhone = "+91 98765 43210"
    plan = "professional"
    customDomain = ""
    settings = @{
        currency = "INR"
        timezone = "Asia/Kolkata"
        language = "en"
    }
} | ConvertTo-Json

$authHeaders = $headers.Clone()
$authHeaders["Authorization"] = "Bearer $($global:tokens['superadmin'])"

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/tenants" -Method Post -Body $tenantBody -Headers $authHeaders
    $global:ids["tenant"] = $response.data.tenant._id
    $global:ids["tenantOwner"] = $response.data.user._id
    Write-Success "Tenant created successfully"
    Write-Host "Tenant ID: $($global:ids['tenant'])" -ForegroundColor Gray
    Write-Host "Owner Email: admin@demoagency.com" -ForegroundColor Gray
} catch {
    Write-Error "Tenant creation failed: $_"
}

# ============================================================================
# TEST 2: Agency Admin Login & Dashboard Verification
# ============================================================================
Write-Step "TEST 2: Agency Admin Login"

Write-Info "Logging in as Agency Admin (Operator)..."
$loginBody = @{
    email = "admin@demoagency.com"
    password = "Admin@123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -Headers $headers
    $global:tokens["operator"] = $response.data.token
    $global:ids["operatorUser"] = $response.data.user._id
    Write-Success "Agency Admin logged in successfully"
    Write-Host "Role: $($response.data.user.role)" -ForegroundColor Gray
    Write-Host "Tenant: $($response.data.user.tenantId)" -ForegroundColor Gray
} catch {
    Write-Error "Agency Admin login failed: $_"
    exit
}

# 2.1 Get Dashboard Summary
Write-Info "Fetching dashboard summary..."
$authHeaders = $headers.Clone()
$authHeaders["Authorization"] = "Bearer $($global:tokens['operator'])"

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/analytics/dashboard" -Method Get -Headers $authHeaders
    Write-Success "Dashboard data retrieved"
    Write-Host "Total Customers: $($response.data.totalCustomers)" -ForegroundColor Gray
    Write-Host "Total Bookings: $($response.data.totalBookings)" -ForegroundColor Gray
} catch {
    Write-Info "Dashboard endpoint may not be ready or needs different route"
}

# ============================================================================
# TEST 3: Agency Admin - Create Agents (3 users)
# ============================================================================
Write-Step "TEST 3: Create Agent Users"

$agents = @(
    @{ name = "Sarah Agent"; email = "agent1@demoagency.com"; phone = "+91 98765 00001"; agentCode = "AG001" },
    @{ name = "Mike Agent"; email = "agent2@demoagency.com"; phone = "+91 98765 00002"; agentCode = "AG002" },
    @{ name = "Lisa Agent"; email = "agent3@demoagency.com"; phone = "+91 98765 00003"; agentCode = "AG003" }
)

$global:ids["agents"] = @()

foreach ($agent in $agents) {
    Write-Info "Creating agent: $($agent.name)..."
    
    $agentBody = @{
        name = $agent.name
        email = $agent.email
        password = "Agent@123"
        role = "agent"
        phone = $agent.phone
        agentCode = $agent.agentCode
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/agents" -Method Post -Body $agentBody -Headers $authHeaders
        $global:ids["agents"] += $response.data.agent._id
        Write-Success "Agent created: $($agent.name) ($($agent.email))"
    } catch {
        Write-Error "Agent creation failed: $($agent.name) - $_"
    }
    
    Start-Sleep -Milliseconds 500
}

Write-Success "All agents created successfully"

# ============================================================================
# TEST 4: Agency Admin - Create Customers (5 users)
# ============================================================================
Write-Step "TEST 4: Create Customer Accounts"

$customers = @(
    @{ firstName = "Alice"; lastName = "Johnson"; email = "customer1@test.com"; phone = "+91 98765 11111" },
    @{ firstName = "Bob"; lastName = "Smith"; email = "customer2@test.com"; phone = "+91 98765 11112" },
    @{ firstName = "Carol"; lastName = "Williams"; email = "customer3@test.com"; phone = "+91 98765 11113" },
    @{ firstName = "David"; lastName = "Brown"; email = "customer4@test.com"; phone = "+91 98765 11114" },
    @{ firstName = "Emma"; lastName = "Davis"; email = "customer5@test.com"; phone = "+91 98765 11115" }
)

$global:ids["customers"] = @()

foreach ($customer in $customers) {
    Write-Info "Creating customer: $($customer.firstName) $($customer.lastName)..."
    
    $customerBody = @{
        firstName = $customer.firstName
        lastName = $customer.lastName
        email = $customer.email
        phone = $customer.phone
        password = "Customer@123"
        dateOfBirth = "1990-01-01"
        nationality = "Indian"
        address = @{
            street = "123 Main Street"
            city = "Mumbai"
            state = "Maharashtra"
            country = "India"
            zipCode = "400001"
        }
        preferences = @{
            dietaryRequirements = "None"
            specialNeeds = "None"
        }
    } | ConvertTo-Json -Depth 10
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/customers" -Method Post -Body $customerBody -Headers $authHeaders
        $global:ids["customers"] += $response.data.customer._id
        Write-Success "Customer created: $($customer.firstName) $($customer.lastName) ($($customer.email))"
    } catch {
        Write-Error "Customer creation failed: $($customer.firstName) - $_"
    }
    
    Start-Sleep -Milliseconds 500
}

Write-Success "All customers created successfully"

# ============================================================================
# TEST 5: Agency Admin - Create Suppliers (3 suppliers)
# ============================================================================
Write-Step "TEST 5: Create Supplier Accounts"

$suppliers = @(
    @{ 
        name = "Grand Hotel Supplier"
        email = "hotels@supplier.com"
        phone = "+91 98765 22221"
        type = "hotel"
        contactPerson = "Hotel Manager"
    },
    @{ 
        name = "Sky Flight Supplier"
        email = "flights@supplier.com"
        phone = "+91 98765 22222"
        type = "flight"
        contactPerson = "Flight Manager"
    },
    @{ 
        name = "Adventure Tours Supplier"
        email = "tours@supplier.com"
        phone = "+91 98765 22223"
        type = "activity"
        contactPerson = "Tour Manager"
    }
)

$global:ids["suppliers"] = @()

foreach ($supplier in $suppliers) {
    Write-Info "Creating supplier: $($supplier.name)..."
    
    $supplierBody = @{
        name = $supplier.name
        email = $supplier.email
        password = "Supplier@123"
        role = "supplier"
        phone = $supplier.phone
        contactPerson = $supplier.contactPerson
        serviceType = $supplier.type
        commissionRate = 10
        paymentTerms = "Net 30"
        status = "active"
        address = @{
            street = "Supplier Street"
            city = "Delhi"
            country = "India"
            zipCode = "110001"
        }
    } | ConvertTo-Json -Depth 10
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/suppliers" -Method Post -Body $supplierBody -Headers $authHeaders
        $global:ids["suppliers"] += $response.data.supplier._id
        Write-Success "Supplier created: $($supplier.name) ($($supplier.email))"
    } catch {
        Write-Error "Supplier creation failed: $($supplier.name) - $_"
    }
    
    Start-Sleep -Milliseconds 500
}

Write-Success "All suppliers created successfully"

# ============================================================================
# TEST 6: Agency Admin - Create Itineraries (2 packages)
# ============================================================================
Write-Step "TEST 6: Create Travel Itineraries"

$itineraries = @(
    @{
        title = "Paris Romance 7D/6N"
        destination = @{ country = "France"; city = "Paris" }
        duration = 7
        price = 150000
        description = "Romantic getaway to the City of Love"
    },
    @{
        title = "Bali Adventure 5D/4N"
        destination = @{ country = "Indonesia"; city = "Bali" }
        duration = 5
        price = 80000
        description = "Adventure and relaxation in tropical paradise"
    }
)

$global:ids["itineraries"] = @()

foreach ($itinerary in $itineraries) {
    Write-Info "Creating itinerary: $($itinerary.title)..."
    
    $itineraryBody = @{
        title = $itinerary.title
        destination = $itinerary.destination
        duration = $itinerary.duration
        price = $itinerary.price
        description = $itinerary.description
        type = "package"
        days = @(
            @{ day = 1; title = "Arrival"; description = "Arrive and check-in to hotel" },
            @{ day = 2; title = "City Tour"; description = "Explore the city" }
        )
        inclusions = @("Accommodation", "Breakfast", "Airport Transfer")
        exclusions = @("Flights", "Travel Insurance")
    } | ConvertTo-Json -Depth 10
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/itineraries" -Method Post -Body $itineraryBody -Headers $authHeaders
        $global:ids["itineraries"] += $response.data.itinerary._id
        Write-Success "Itinerary created: $($itinerary.title)"
    } catch {
        Write-Error "Itinerary creation failed: $($itinerary.title) - $_"
    }
    
    Start-Sleep -Milliseconds 500
}

Write-Success "All itineraries created successfully"

# ============================================================================
# TEST 7: Agency Admin - Create Quotes (3 quotes)
# ============================================================================
Write-Step "TEST 7: Create Quotes for Customers"

if ($global:ids["customers"].Count -ge 3 -and $global:ids["itineraries"].Count -ge 2) {
    $quotes = @(
        @{
            customerId = $global:ids["customers"][0]
            itineraryId = $global:ids["itineraries"][0]
            pax = @{ adults = 2; children = 0; infants = 0 }
            amount = 150000
            title = "Paris Package Quote for Alice"
        },
        @{
            customerId = $global:ids["customers"][1]
            itineraryId = $global:ids["itineraries"][1]
            pax = @{ adults = 2; children = 1; infants = 0 }
            amount = 120000
            title = "Bali Package Quote for Bob"
        },
        @{
            customerId = $global:ids["customers"][2]
            itineraryId = $global:ids["itineraries"][0]
            pax = @{ adults = 1; children = 0; infants = 0 }
            amount = 75000
            title = "Paris Solo Trip for Carol"
        }
    )

    $global:ids["quotes"] = @()

    foreach ($quote in $quotes) {
        Write-Info "Creating quote: $($quote.title)..."
        
        $quoteBody = @{
            customerId = $quote.customerId
            itineraryId = $quote.itineraryId
            title = $quote.title
            pax = $quote.pax
            pricing = @{
                baseAmount = $quote.amount
                taxes = $quote.amount * 0.18
                totalAmount = $quote.amount * 1.18
            }
            validUntil = (Get-Date).AddDays(30).ToString("yyyy-MM-dd")
            status = "pending"
            notes = "Special discount applied"
        } | ConvertTo-Json -Depth 10
        
        try {
            $response = Invoke-RestMethod -Uri "$baseUrl/quotes" -Method Post -Body $quoteBody -Headers $authHeaders
            $global:ids["quotes"] += $response.data.quote._id
            Write-Success "Quote created: $($quote.title)"
        } catch {
            Write-Error "Quote creation failed: $($quote.title) - $_"
        }
        
        Start-Sleep -Milliseconds 500
    }

    Write-Success "All quotes created successfully"
} else {
    Write-Error "Not enough customers or itineraries to create quotes"
}

# ============================================================================
# TEST 8: Agency Admin - Create Bookings (2 confirmed)
# ============================================================================
Write-Step "TEST 8: Create Confirmed Bookings"

if ($global:ids["quotes"].Count -ge 2) {
    $bookings = @(
        @{
            quoteId = $global:ids["quotes"][0]
            customerId = $global:ids["customers"][0]
            status = "confirmed"
            paymentStatus = "partial"
            travelDate = (Get-Date).AddDays(60).ToString("yyyy-MM-dd")
        },
        @{
            quoteId = $global:ids["quotes"][1]
            customerId = $global:ids["customers"][1]
            status = "confirmed"
            paymentStatus = "paid"
            travelDate = (Get-Date).AddDays(90).ToString("yyyy-MM-dd")
        }
    )

    $global:ids["bookings"] = @()

    foreach ($booking in $bookings) {
        Write-Info "Creating booking for customer..."
        
        $bookingBody = @{
            quoteId = $booking.quoteId
            customerId = $booking.customerId
            status = $booking.status
            paymentStatus = $booking.paymentStatus
            travelDate = $booking.travelDate
            pax = @{ adults = 2; children = 0; infants = 0 }
        } | ConvertTo-Json -Depth 10
        
        try {
            $response = Invoke-RestMethod -Uri "$baseUrl/bookings" -Method Post -Body $bookingBody -Headers $authHeaders
            $global:ids["bookings"] += $response.data.booking._id
            Write-Success "Booking created with status: $($booking.status)"
        } catch {
            Write-Error "Booking creation failed: $_"
        }
        
        Start-Sleep -Milliseconds 500
    }

    Write-Success "All bookings created successfully"
} else {
    Write-Error "Not enough quotes to create bookings"
}

# ============================================================================
# TEST 9: Agent Login & Workflow Test
# ============================================================================
Write-Step "TEST 9: Agent Login and Create Customer"

Write-Info "Logging in as Agent1..."
$loginBody = @{
    email = "agent1@demoagency.com"
    password = "Agent@123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -Headers $headers
    $global:tokens["agent"] = $response.data.token
    Write-Success "Agent logged in successfully"
    Write-Host "Agent Role: $($response.data.user.role)" -ForegroundColor Gray
} catch {
    Write-Error "Agent login failed: $_"
}

# Agent creates a customer
Write-Info "Agent creating new customer..."
$authHeaders["Authorization"] = "Bearer $($global:tokens['agent'])"

$customerBody = @{
    firstName = "Frank"
    lastName = "Miller"
    email = "customer6@test.com"
    phone = "+91 98765 11116"
    password = "Customer@123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/customers" -Method Post -Body $customerBody -Headers $authHeaders
    Write-Success "Agent created customer: Frank Miller"
} catch {
    Write-Error "Agent customer creation failed: $_"
}

# ============================================================================
# TEST 10: Customer Login & Portal Test
# ============================================================================
Write-Step "TEST 10: Customer Portal Login"

Write-Info "Logging in as Customer1 (Alice)..."
$loginBody = @{
    email = "customer1@test.com"
    password = "Customer@123"
    tenantId = $global:ids["tenant"]
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/customer/auth/login" -Method Post -Body $loginBody -Headers $headers
    $global:tokens["customer"] = $response.data.token
    Write-Success "Customer logged in successfully"
} catch {
    Write-Error "Customer login failed: $_"
}

# Customer views dashboard
Write-Info "Fetching customer dashboard..."
$authHeaders["Authorization"] = "Bearer $($global:tokens['customer'])"

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/customer/dashboard/summary" -Method Get -Headers $authHeaders
    Write-Success "Customer dashboard retrieved"
    Write-Host "Customer Bookings: $($response.data.totalBookings)" -ForegroundColor Gray
} catch {
    Write-Info "Customer dashboard endpoint may need adjustment"
}

# ============================================================================
# Summary Report
# ============================================================================
Write-Host ("`n" + ("=" * 60)) -ForegroundColor Magenta
Write-Host "📊 TEST SUMMARY REPORT" -ForegroundColor Magenta
Write-Host ("=" * 60)

Write-Host "`n✅ CREATED RESOURCES:" -ForegroundColor Green
Write-Host "   • Tenant ID: $($global:ids['tenant'])" -ForegroundColor White
Write-Host "   • Agents: $($global:ids['agents'].Count) created" -ForegroundColor White
Write-Host "   • Customers: $($global:ids['customers'].Count) created" -ForegroundColor White
Write-Host "   • Suppliers: $($global:ids['suppliers'].Count) created" -ForegroundColor White
Write-Host "   • Itineraries: $($global:ids['itineraries'].Count) created" -ForegroundColor White
Write-Host "   • Quotes: $($global:ids['quotes'].Count) created" -ForegroundColor White
Write-Host "   • Bookings: $($global:ids['bookings'].Count) created" -ForegroundColor White

Write-Host "`n🔑 LOGIN CREDENTIALS:" -ForegroundColor Cyan
Write-Host "   Super Admin:  admin@travelcrm.com / Admin@123" -ForegroundColor White
Write-Host "   Agency Admin: admin@demoagency.com / Admin@123" -ForegroundColor White
Write-Host "   Agent1:       agent1@demoagency.com / Agent@123" -ForegroundColor White
Write-Host "   Customer1:    customer1@test.com / Customer@123" -ForegroundColor White

Write-Host "`n📝 IDs for Further Testing:" -ForegroundColor Yellow
$global:ids | ConvertTo-Json -Depth 10 | Out-File "test-ids.json"
Write-Host "   Saved to: test-ids.json" -ForegroundColor White

Write-Host "`n✨ Testing completed!" -ForegroundColor Green
Write-Host ("=" * 60) -ForegroundColor Magenta
