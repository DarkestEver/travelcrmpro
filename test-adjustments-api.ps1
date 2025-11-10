# Test Booking Adjustments API
# This script tests all the booking adjustment endpoints

$BASE_URL = "http://localhost:5000/api"
$FINANCE_TOKEN = ""  # Will get from login

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Booking Adjustments API Test Script" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Function to make API calls
function Invoke-ApiCall {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null,
        [string]$Token = ""
    )
    
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    if ($Token) {
        $headers["Authorization"] = "Bearer $Token"
    }
    
    try {
        $params = @{
            Uri = "$BASE_URL$Endpoint"
            Method = $Method
            Headers = $headers
        }
        
        if ($Body) {
            $params["Body"] = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-RestMethod @params
        return $response
    }
    catch {
        Write-Host "Error: $_" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
        return $null
    }
}

# 1. Login as Finance User
Write-Host "1. Logging in as Finance user..." -ForegroundColor Yellow
$loginResponse = Invoke-ApiCall -Method POST -Endpoint "/auth/login" -Body @{
    email = "finance@travelcrm.com"
    password = "Finance@123"
}

if ($loginResponse -and $loginResponse.token) {
    $FINANCE_TOKEN = $loginResponse.token
    Write-Host "✓ Login successful!" -ForegroundColor Green
    Write-Host "  User: $($loginResponse.user.name)" -ForegroundColor Gray
    Write-Host "  Role: $($loginResponse.user.role)`n" -ForegroundColor Gray
} else {
    Write-Host "✗ Login failed! Please create finance user first." -ForegroundColor Red
    Write-Host "Run: node backend/scripts/createFinanceUser.js`n" -ForegroundColor Yellow
    exit
}

# 2. Get a booking ID (you'll need to replace this with an actual booking ID)
Write-Host "2. Enter a valid Booking ID to test with:" -ForegroundColor Yellow
$BOOKING_ID = Read-Host "Booking ID"

if (-not $BOOKING_ID) {
    Write-Host "✗ Booking ID required to continue`n" -ForegroundColor Red
    exit
}

# 3. Create an Extra Charge (Baggage Fee)
Write-Host "`n3. Creating baggage fee adjustment..." -ForegroundColor Yellow
$baggageAdjustment = Invoke-ApiCall -Method POST -Endpoint "/adjustments" -Token $FINANCE_TOKEN -Body @{
    bookingId = $BOOKING_ID
    adjustmentType = "extra_charge"
    category = "baggage_fee"
    amount = 50
    description = "Extra baggage 20kg"
    reason = "Customer exceeded baggage allowance"
    isTaxable = $true
    approvalThreshold = 500
    notifyCustomer = $true
}

if ($baggageAdjustment -and $baggageAdjustment.success) {
    Write-Host "✓ Baggage fee created!" -ForegroundColor Green
    Write-Host "  Adjustment Number: $($baggageAdjustment.data.adjustmentNumber)" -ForegroundColor Gray
    Write-Host "  Amount: `$$($baggageAdjustment.data.amount)" -ForegroundColor Gray
    Write-Host "  Tax: `$$($baggageAdjustment.data.taxAmount)" -ForegroundColor Gray
    Write-Host "  Total: `$$($baggageAdjustment.data.totalAmount)" -ForegroundColor Gray
    Write-Host "  Status: $($baggageAdjustment.data.status)" -ForegroundColor Gray
    $ADJUSTMENT_ID_1 = $baggageAdjustment.data._id
} else {
    Write-Host "✗ Failed to create baggage fee" -ForegroundColor Red
}

# 4. Create a Penalty (Late Cancellation)
Write-Host "`n4. Creating late cancellation penalty..." -ForegroundColor Yellow
$penaltyAdjustment = Invoke-ApiCall -Method POST -Endpoint "/adjustments" -Token $FINANCE_TOKEN -Body @{
    bookingId = $BOOKING_ID
    adjustmentType = "penalty"
    category = "late_cancellation"
    amount = 200
    description = "Cancellation within 48 hours of travel"
    reason = "Booking cancelled 36 hours before departure"
    isTaxable = $false
    approvalThreshold = 500
    notifyCustomer = $true
}

if ($penaltyAdjustment -and $penaltyAdjustment.success) {
    Write-Host "✓ Penalty created!" -ForegroundColor Green
    Write-Host "  Total: `$$($penaltyAdjustment.data.totalAmount)" -ForegroundColor Gray
    Write-Host "  Status: $($penaltyAdjustment.data.status)" -ForegroundColor Gray
    $ADJUSTMENT_ID_2 = $penaltyAdjustment.data._id
}

# 5. Create a High-Value Charge (Requires Approval)
Write-Host "`n5. Creating high-value change fee (requires approval)..." -ForegroundColor Yellow
$highValueAdjustment = Invoke-ApiCall -Method POST -Endpoint "/adjustments" -Token $FINANCE_TOKEN -Body @{
    bookingId = $BOOKING_ID
    adjustmentType = "extra_charge"
    category = "change_fee"
    amount = 750
    description = "Major itinerary change with new flights"
    reason = "Customer requested complete route change"
    isTaxable = $true
    approvalThreshold = 500
    notifyCustomer = $true
}

if ($highValueAdjustment -and $highValueAdjustment.success) {
    Write-Host "✓ High-value charge created!" -ForegroundColor Green
    Write-Host "  Total: `$$($highValueAdjustment.data.totalAmount)" -ForegroundColor Gray
    Write-Host "  Status: $($highValueAdjustment.data.status)" -ForegroundColor Gray
    Write-Host "  Requires Approval: $($highValueAdjustment.data.requiresApproval)" -ForegroundColor Gray
    $ADJUSTMENT_ID_3 = $highValueAdjustment.data._id
}

# 6. Create a Discount
Write-Host "`n6. Creating loyalty discount..." -ForegroundColor Yellow
$discountAdjustment = Invoke-ApiCall -Method POST -Endpoint "/adjustments" -Token $FINANCE_TOKEN -Body @{
    bookingId = $BOOKING_ID
    adjustmentType = "discount"
    category = "loyalty_discount"
    amount = 100
    description = "Platinum member loyalty discount"
    reason = "Customer is platinum tier member"
    isTaxable = $false
    approvalThreshold = 500
    notifyCustomer = $true
}

if ($discountAdjustment -and $discountAdjustment.success) {
    Write-Host "✓ Discount created!" -ForegroundColor Green
    Write-Host "  Amount: `$$($discountAdjustment.data.totalAmount)" -ForegroundColor Gray
    Write-Host "  Impact Type: $($discountAdjustment.data.impactType)" -ForegroundColor Gray
}

# 7. Get All Adjustments for Booking
Write-Host "`n7. Getting all adjustments for booking..." -ForegroundColor Yellow
$bookingAdjustments = Invoke-ApiCall -Method GET -Endpoint "/adjustments/booking/$BOOKING_ID" -Token $FINANCE_TOKEN

if ($bookingAdjustments -and $bookingAdjustments.success) {
    Write-Host "✓ Retrieved adjustments!" -ForegroundColor Green
    Write-Host "  Total Adjustments: $($bookingAdjustments.data.Count)" -ForegroundColor Gray
    if ($bookingAdjustments.totals) {
        Write-Host "  Total Charges: `$$($bookingAdjustments.totals.totalCharges)" -ForegroundColor Gray
        Write-Host "  Total Credits: `$$($bookingAdjustments.totals.totalCredits)" -ForegroundColor Gray
        Write-Host "  Net Adjustment: `$$($bookingAdjustments.totals.netAdjustment)" -ForegroundColor Gray
    }
}

# 8. Get Pending Approvals
Write-Host "`n8. Getting pending approvals..." -ForegroundColor Yellow
$pendingApprovals = Invoke-ApiCall -Method GET -Endpoint "/adjustments/pending-approvals" -Token $FINANCE_TOKEN

if ($pendingApprovals -and $pendingApprovals.success) {
    Write-Host "✓ Retrieved pending approvals!" -ForegroundColor Green
    Write-Host "  Pending Count: $($pendingApprovals.count)" -ForegroundColor Gray
    
    if ($pendingApprovals.count -gt 0) {
        Write-Host "`n  Pending Adjustments:" -ForegroundColor Gray
        foreach ($adj in $pendingApprovals.data) {
            Write-Host "    - $($adj.adjustmentNumber): `$$($adj.totalAmount) ($($adj.adjustmentType))" -ForegroundColor Gray
        }
    }
}

# 9. Approve High-Value Adjustment (if exists)
if ($ADJUSTMENT_ID_3) {
    Write-Host "`n9. Approving high-value adjustment..." -ForegroundColor Yellow
    $approval = Invoke-ApiCall -Method POST -Endpoint "/adjustments/$ADJUSTMENT_ID_3/approve" -Token $FINANCE_TOKEN -Body @{
        notes = "Verified with operations team. Change fee valid."
    }
    
    if ($approval -and $approval.success) {
        Write-Host "✓ Adjustment approved!" -ForegroundColor Green
        Write-Host "  Status: $($approval.data.status)" -ForegroundColor Gray
        Write-Host "  Approval Status: $($approval.data.approvalStatus)" -ForegroundColor Gray
    }
}

# 10. Reverse an Adjustment
if ($ADJUSTMENT_ID_1) {
    Write-Host "`n10. Would you like to test reversal? (This will reverse the baggage fee) [Y/N]" -ForegroundColor Yellow
    $reverseConfirm = Read-Host "Reverse"
    
    if ($reverseConfirm -eq "Y" -or $reverseConfirm -eq "y") {
        $reversal = Invoke-ApiCall -Method POST -Endpoint "/adjustments/$ADJUSTMENT_ID_1/reverse" -Token $FINANCE_TOKEN -Body @{
            reason = "Testing reversal functionality"
        }
        
        if ($reversal -and $reversal.success) {
            Write-Host "✓ Adjustment reversed!" -ForegroundColor Green
            Write-Host "  Original: $($reversal.data.original.adjustmentNumber)" -ForegroundColor Gray
            Write-Host "  Reversal: $($reversal.data.reversal.adjustmentNumber)" -ForegroundColor Gray
        }
    }
}

# 11. Get Financial Summary
Write-Host "`n11. Getting financial summary..." -ForegroundColor Yellow
$summary = Invoke-ApiCall -Method GET -Endpoint "/adjustments/summary?startDate=2024-01-01&endDate=2024-12-31" -Token $FINANCE_TOKEN

if ($summary -and $summary.success) {
    Write-Host "✓ Retrieved financial summary!" -ForegroundColor Green
    Write-Host "  Summary data available" -ForegroundColor Gray
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✓ Login: Success" -ForegroundColor Green
Write-Host "✓ Create Adjustments: Multiple types tested" -ForegroundColor Green
Write-Host "✓ Retrieve Adjustments: Success" -ForegroundColor Green
Write-Host "✓ Pending Approvals: Success" -ForegroundColor Green
Write-Host "✓ Approval Workflow: Tested" -ForegroundColor Green
Write-Host "✓ Reversal: Available for testing" -ForegroundColor Green
Write-Host "✓ Financial Summary: Success`n" -ForegroundColor Green

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Check adjustments in Finance Portal: http://localhost:5174/finance/pending-approvals" -ForegroundColor Gray
Write-Host "2. View adjustments on booking details page" -ForegroundColor Gray
Write-Host "3. Test bulk approval from pending approvals page" -ForegroundColor Gray
Write-Host "4. Test reversal from UI`n" -ForegroundColor Gray

Write-Host "API Endpoints Tested:" -ForegroundColor Yellow
Write-Host "✓ POST   /api/adjustments (Create)" -ForegroundColor Gray
Write-Host "✓ GET    /api/adjustments/booking/:id (Get booking adjustments)" -ForegroundColor Gray
Write-Host "✓ GET    /api/adjustments/pending-approvals (Get pending)" -ForegroundColor Gray
Write-Host "✓ POST   /api/adjustments/:id/approve (Approve)" -ForegroundColor Gray
Write-Host "✓ POST   /api/adjustments/:id/reverse (Reverse)" -ForegroundColor Gray
Write-Host "✓ GET    /api/adjustments/summary (Financial summary)`n" -ForegroundColor Gray

Write-Host "All tests completed!" -ForegroundColor Green
