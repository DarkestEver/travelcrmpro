# Booking Adjustments - Quick Start Guide

## Access the System

1. **Login as Finance User**
   - URL: http://localhost:5174/login
   - Email: `finance@travelcrm.com`
   - Password: `Finance@123`

2. **Navigate to Finance Portal**
   - After login, you'll be redirected to Finance Dashboard
   - URL: http://localhost:5174/finance/dashboard

## Adding Charges to a Booking

### Scenario 1: Add Baggage Fee ($50)

1. **Find Booking**
   - Go to bookings list
   - Open booking details

2. **Add Adjustment**
   - Scroll to "Booking Adjustments" section
   - Click "Add Adjustment" button

3. **Fill Form**
   - Adjustment Type: **Extra Charge**
   - Category: **Baggage Fee**
   - Amount: **$50**
   - Tax automatically calculated: **$5** (10%)
   - Total shown: **$55**
   - Description: "Extra baggage 20kg"
   - Reason: "Customer exceeded baggage allowance"
   - Approval Threshold: **$500** (default)
   - Notify Customer: ✅ (checked)

4. **Submit**
   - Click "Add Adjustment"
   - Since $55 < $500 threshold:
     - ✅ Auto-approved
     - ✅ Status: Active
     - ✅ Customer notified
     - ✅ Ready for payment

5. **Result**
   - Adjustment appears in list
   - Booking total increased by $55
   - Customer receives email notification

### Scenario 2: Add Late Cancellation Penalty ($200)

1. **Add Adjustment**
   - Adjustment Type: **Penalty**
   - Category: **Late Cancellation**
   - Amount: **$200**
   - Tax: **$0** (penalties not taxable)
   - Total: **$200**
   - Description: "Cancellation within 48 hours of travel"
   - Reason: "Booking cancelled 36 hours before departure, within 48-hour policy window"
   - Notify Customer: ✅

2. **Submit**
   - Since $200 < $500 threshold:
     - Auto-approved
     - Customer charged $200
     - Agency retains penalty per policy

### Scenario 3: Add High-Value Charge ($750) - Requires Approval

1. **Add Adjustment**
   - Adjustment Type: **Extra Charge**
   - Category: **Change Fee**
   - Amount: **$750**
   - Tax: **$75** (10%)
   - Total: **$825**
   - Description: "Major itinerary change with new flights"
   - Reason: "Customer requested complete route change 2 weeks before travel"

2. **Submit**
   - Since $825 > $500 threshold:
     - ⏳ Status: Pending
     - ⏳ Requires Approval
     - ❌ Customer NOT notified yet
     - Appears in "Pending Approvals"

3. **Approve**
   - Go to **Finance > Pending Approvals**
   - Find the $825 adjustment
   - Click "Approve" button
   - Add notes (optional): "Verified with operations team. Change fee valid per airline policy."
   - Click "Approve"
   - ✅ Status: Active
   - ✅ Customer notified
   - ✅ Ready for payment

## Managing Pending Approvals

### View Pending Approvals

1. **Navigate**
   - Click **Finance > Pending Approvals** in sidebar

2. **Review List**
   - See all adjustments awaiting approval
   - Booking number and customer name shown
   - Adjustment type, amount, creator shown
   - Can see description and reason

### Approve Single Adjustment

1. **Find Adjustment** in pending list
2. **Click "Approve"** button
3. Adjustment becomes active
4. Customer notified

### Reject Adjustment

1. **Find Adjustment** in pending list
2. **Click "Reject"** button
3. **Enter rejection reason** (required)
   - Example: "Customer provided valid proof of pre-paid service. Charge not applicable."
4. **Submit**
5. Adjustment cancelled
6. Creator notified

### Bulk Approve

1. **Select Multiple** adjustments using checkboxes
2. **Click "Approve Selected (3)"** button at top
3. **Add notes** (optional): "Batch approval - all verified"
4. **Click "Approve All"**
5. All selected adjustments approved
6. Customers notified

## Recording Discounts

### Scenario: Loyalty Discount ($100)

1. **Add Adjustment**
   - Adjustment Type: **Discount**
   - Category: **Loyalty Discount**
   - Amount: **$100**
   - Tax: **$0** (discount is pre-tax)
   - Total: **$100**
   - Impact: **CREDIT** (customer receives)
   - Description: "Platinum member loyalty discount"
   - Reason: "Customer is platinum tier member, 5+ bookings this year"

2. **Submit**
   - Auto-approved (under threshold)
   - Booking total REDUCED by $100
   - Shows as green (credit) in list
   - Customer receives confirmation

## Recording Losses

### Scenario: Bad Debt Write-Off ($500)

1. **Add Adjustment**
   - Adjustment Type: **Loss**
   - Category: **Bad Debt**
   - Amount: **$500**
   - Tax: **$0** (loss not taxable)
   - Total: **$500**
   - Impact: **CREDIT** (agency absorbs)
   - Description: "Customer payment failed, unrecoverable"
   - Reason: "Multiple payment attempts failed. Customer unresponsive. Collection agency unable to recover."
   - Approval Threshold: **$100** (set lower for losses)

2. **Submit**
   - Since $500 > $100 threshold:
     - Requires approval
     - Appears in pending approvals

3. **Approve**
   - Manager reviews details
   - Verifies collection attempts documented
   - Approves write-off
   - Loss recorded in financial reports

## Recording Compensations

### Scenario: Service Failure Compensation ($75)

1. **Add Adjustment**
   - Adjustment Type: **Compensation**
   - Category: **Service Failure**
   - Amount: **$75**
   - Tax: **$0**
   - Total: **$75**
   - Impact: **CREDIT** (customer receives)
   - Description: "Compensation for hotel mix-up"
   - Reason: "Customer arrived at hotel with valid confirmation but hotel had no reservation. Customer had to find alternative accommodation."

2. **Submit**
   - Auto-approved
   - Customer receives $75 credit
   - Can be applied to future booking or refunded

## Reversing an Adjustment

### When to Reverse
- Applied to wrong booking
- Customer disputes successfully
- Amount incorrect
- Type/category wrong

### How to Reverse

1. **Find Adjustment** in booking adjustments list
2. **Click Reverse button** (↶ icon)
3. **Enter reason** (required):
   - "Applied to wrong booking - customer ID confusion"
   - "Customer provided proof of pre-payment"
   - "Incorrect amount calculated"
4. **Submit**
5. **System Creates**:
   - Offsetting adjustment (opposite impact)
   - Links to original
   - Marks original as "reversed"
   - Both adjustments shown in history

### Example
**Original**: +$50 baggage fee (debit)
**Reversal**: -$50 baggage reversal (credit)
**Net Effect**: $0 (cancels out)

## Understanding the Adjustments List

### Color Coding

**Adjustment Types**:
- 🔴 **Red** - Extra Charge, Loss (money out)
- ⚠️ **Orange** - Penalty (punitive charge)
- ✅ **Green** - Discount, Waiver, Compensation (money back)
- 🔵 **Blue** - Refund Adjustment
- ⚫ **Grey** - Correction, Reversal

**Status Colors**:
- ⚫ **Grey** - Draft
- ⚠️ **Orange** - Pending (awaiting action)
- ✅ **Green** - Active (approved, in effect)
- 🔵 **Blue** - Paid
- 🔴 **Red** - Cancelled, Reversed

### Financial Summary

At bottom of adjustments list:

```
Total Charges:   $1,275.00  (all debits)
Total Credits:   $  175.00  (all credits)
Net Adjustment:  $1,100.00  (charges - credits)
Outstanding:     $  850.00  (unpaid amount)
```

### Actions Available

- **View** (👁️) - See full details
- **Approve** (✓) - Approve pending adjustment
- **Reject** (✗) - Reject adjustment
- **Reverse** (↶) - Create reversal

## Reports & Analytics

### Financial Summary Report

1. **Navigate**: Finance > Reports (coming soon)
2. **Date Range**: Select period
3. **View**:
   - Total adjustments by type
   - Revenue impact
   - Approval statistics
   - Top categories

### Example Report:
```
Adjustments Summary - January 2024

Extra Charges:   45 adjustments   $2,250.00
Penalties:       12 adjustments   $2,400.00
Discounts:       30 adjustments  -$1,500.00
Losses:           5 adjustments  -$2,500.00
Compensations:    8 adjustments    -$800.00
                ─────────────────────────────
Net Revenue:                       -$150.00
```

## Best Practices

### 1. Always Document Thoroughly
- Clear description
- Detailed reason
- Attach supporting documents (receipts, emails, etc.)

### 2. Set Appropriate Thresholds
- Low-value items: Auto-approve (<$100)
- Medium-value: Standard approval (<$500)
- High-value: Manager approval (>$500)

### 3. Notify Customers Promptly
- Always check "Notify Customer" for charges
- Customer transparency builds trust
- Reduces disputes

### 4. Review Pending Approvals Daily
- Don't let approvals pile up
- Quick approval = faster payment
- Set up approval queue alerts

### 5. Use Correct Categories
- Helps with reporting
- Identifies trends
- Supports audits

### 6. Handle Disputes Quickly
- Review customer disputes same day
- Verify facts
- Approve reversal if customer is right
- Document resolution

### 7. Monthly Reconciliation
- Review all adjustments for month
- Verify revenue impact
- Check for patterns (frequent penalties = policy issue?)
- Generate summary report

## Common Use Cases

### Airport Fees
- Type: Extra Charge
- Category: Airport Fee
- Taxable: Yes
- When: Customer books flights with airport taxes

### Baggage Fees
- Type: Extra Charge
- Category: Baggage Fee
- Taxable: Yes
- When: Customer exceeds included baggage

### Late Cancellation
- Type: Penalty
- Category: Late Cancellation
- Taxable: No
- When: Customer cancels within policy window

### No-Show
- Type: Penalty
- Category: No Show
- Taxable: No
- When: Customer doesn't show up

### Early Bird Discount
- Type: Discount
- Category: Early Bird
- Taxable: No (pre-tax discount)
- When: Customer books X months in advance

### Service Failure
- Type: Compensation
- Category: Service Failure
- Taxable: No
- When: Something goes wrong on our end

### Bad Debt
- Type: Loss
- Category: Bad Debt
- Taxable: No
- When: Customer payment unrecoverable

## Troubleshooting

### Adjustment Not Appearing
- Check if requires approval
- Look in Pending Approvals
- Verify booking ID correct

### Customer Not Notified
- Check "Notify Customer" was checked
- If pending approval, notification sent after approval
- Check email service is running

### Can't Approve
- Verify you have finance role
- Check adjustment is in "pending" status
- Already approved adjustments can't be re-approved

### Wrong Amount
- Create reversal adjustment
- Create new adjustment with correct amount
- Document reason in both

### Applied to Wrong Booking
- Create reversal with reason "Wrong booking"
- Create new adjustment on correct booking

## Support

For questions or issues:
- Email: finance@travelcrm.com
- Documentation: See BOOKING_ADJUSTMENTS_COMPLETE.md
- API Reference: See API Endpoints section in docs

## Quick Reference

### Approval Thresholds
- < $100: Auto-approve (instant)
- $100-$500: Auto-approve (instant)
- > $500: Requires approval

### Tax Treatment
- Extra charges: Taxable (10%)
- Service fees: Taxable (10%)
- Penalties: Not taxable
- Discounts: Pre-tax (no tax)
- Losses: Not taxable
- Compensations: Not taxable

### Impact Types
- **Debit**: Customer pays (extra charges, penalties)
- **Credit**: Customer receives (discounts, compensations, refunds)

### Status Flow
```
Draft → Pending → Active → Paid
              ↓
          Cancelled
              ↓
          Reversed
```

---

**Ready to start?** Log in to the Finance Portal and begin managing booking adjustments! 🚀
