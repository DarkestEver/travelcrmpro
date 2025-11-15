# Travel CRM Pro - User Manual
## Part 6: Finance Module Guide

**Version**: 2.1.0  
**Last Updated**: November 15, 2025  
**Document**: 6 of 14

---

## Table of Contents

1. [Finance Dashboard](#dashboard)
2. [Bank Reconciliation](#reconciliation)
3. [Multi-Currency Management](#currency)
4. [Payment Processing](#payments)
5. [Invoice Management](#invoices)
6. [Tax Configuration](#tax)
7. [Financial Reports](#reports)

---

## 1. Finance Dashboard {#dashboard}

### 1.1 Dashboard Overview

**Key Financial Metrics**:
- 💰 **Total Revenue** (MTD, YTD)
- 💳 **Payments Received** (Today, This Week)
- 📄 **Outstanding Invoices** (Count & Amount)
- 🏦 **Bank Balance** (All Accounts)
- 📊 **Profit Margin** (%)
- 💸 **Accounts Payable** (Supplier payments due)
- 📈 **Revenue Trend** (Chart)
- 🔄 **Reconciliation Status**

**Quick Actions**:
- Record Payment
- Generate Invoice
- Reconcile Bank Statement
- Process Supplier Payment
- View Reports
- Exchange Rate Update

---

## 2. Bank Reconciliation {#reconciliation}

### 2.1 Understanding Bank Reconciliation

Bank reconciliation matches your system records with actual bank statements to ensure accuracy.

**Why Reconcile**:
- ✅ Detect errors and discrepancies
- ✅ Identify fraudulent transactions
- ✅ Ensure accurate financial reports
- ✅ Track outstanding checks/deposits
- ✅ Maintain audit trail

**Frequency**: Recommended daily or weekly

### 2.2 Upload Bank Statement

**Steps to Upload**:
1. Navigate to **Finance** → **Bank Reconciliation**
2. Click **"New Reconciliation"**
3. Select **Bank Account** from dropdown
4. Choose **Statement Period**:
   - Start date
   - End date
5. Enter **Opening Balance** (from statement)
6. Enter **Closing Balance** (from statement)
7. **Upload Statement**:
   - Click **"Upload File"**
   - Supported formats: CSV, PDF, Excel, OFX, QFX
   - Select file from computer
   - Click **"Upload"**
8. System processes file
9. Transactions extracted

**CSV Format Requirements**:
```csv
Date,Description,Debit,Credit,Balance
2025-01-15,Payment from John Doe,,5000.00,15000.00
2025-01-16,Supplier ABC,2000.00,,13000.00
```

### 2.3 Matching Transactions

**Auto-Matching**:
System automatically matches:
- Exact amount matches
- Same date (±3 days)
- Similar description
- Confidence score shown

**Manual Matching**:
1. View **Unmatched Transactions** panel
2. Two columns:
   - **Bank Statement**: From uploaded file
   - **System Records**: From your bookings/payments
3. For each unmatched transaction:
   - **Drag and drop** to match
   - OR click **"Find Match"**
   - System suggests matches
   - Select correct match
   - Click **"Match"**

**Match Types**:
- ✅ **One-to-One**: Single bank = Single system record
- ✅ **One-to-Many**: Single bank = Multiple system (e.g., bulk payment)
- ✅ **Many-to-One**: Multiple bank = Single system (e.g., payment plan)

### 2.4 Handling Discrepancies

**Discrepancy Types**:

**1. Missing in System**:
Bank statement shows transaction, but not in your system.

**Action**:
- Click **"Create Entry"**
- Enter transaction details
- Assign category
- Save

**2. Missing in Bank**:
System shows transaction, but not in bank statement.

**Action**:
- Verify transaction date (might be in next statement)
- Mark as **"In Transit"**
- Check if payment bounced
- Contact bank if error

**3. Amount Mismatch**:
Same transaction, different amounts.

**Action**:
- Review transaction details
- Check for bank fees
- Verify foreign exchange
- Adjust if needed
- Document reason

### 2.5 Complete Reconciliation

**Finalize**:
1. After matching all transactions
2. Review **Reconciliation Summary**:
   - Opening balance
   - + Deposits
   - - Withdrawals
   - = Calculated closing balance
   - vs Actual closing balance
   - **Difference**: Should be $0.00
3. If difference = $0:
   - Click **"Complete Reconciliation"**
   - Reconciliation locked
   - Report generated
   - Mark as reconciled
4. If difference ≠ $0:
   - Review unmatched items
   - Find missing transactions
   - Resolve discrepancies
   - Recalculate

**Reconciliation Report**:
- Statement period
- Opening/closing balances
- Total deposits
- Total withdrawals
- Matched transactions count
- Unmatched items
- Discrepancy notes
- Download PDF

---

## 3. Multi-Currency Management {#currency}

### 3.1 Currency Setup

**Add Currency**:
1. Go to **Finance** → **Currencies**
2. Click **"Add Currency"**
3. Select currency from list (USD, EUR, GBP, etc.)
4. Set as **Base Currency** (if primary)
5. **Exchange Rate Source**:
   - Manual entry
   - Auto-update (API)
6. Click **"Add"**

**Supported Currencies**:
- 180+ currencies worldwide
- Crypto currencies (optional)
- Custom currencies

### 3.2 Exchange Rate Management

**Manual Exchange Rate**:
1. Go to **Currencies** → Select currency
2. Click **"Update Rate"**
3. Enter exchange rate (e.g., 1 USD = 0.92 EUR)
4. Effective date
5. Click **"Save"**
6. Rate applied to new transactions

**Auto-Update Rates**:
1. Enable **"Auto-Update"** for currency
2. Select API source:
   - XE.com
   - Open Exchange Rates
   - Fixer.io
   - European Central Bank
3. Set update frequency:
   - Real-time
   - Hourly
   - Daily
4. Rates automatically updated

**Historical Rates**:
- System maintains rate history
- View past rates
- See rate at transaction date
- Compare rates over time

### 3.3 Multi-Currency Transactions

**Create Multi-Currency Invoice**:
1. Generate invoice normally
2. Select **Currency** dropdown
3. Choose customer's currency
4. Amounts auto-convert
5. Shows both currencies:
   - Original (e.g., USD 5,000)
   - Converted (e.g., EUR 4,600)
6. Exchange rate displayed
7. Send invoice

**Process Multi-Currency Payment**:
1. Record payment
2. Select payment currency
3. If different from invoice:
   - Enter exchange rate (or use current)
   - System calculates equivalent
   - Exchange gain/loss recorded
4. Save payment

**Exchange Gain/Loss**:
- Automatic calculation
- Recorded in journal
- Appears in financial reports
- Tax implications noted

### 3.4 Currency Reports

**Available Reports**:
- Revenue by currency
- Exchange gain/loss report
- Currency exposure report
- Conversion trends
- Multi-currency P&L

---

## 4. Payment Processing {#payments}

### 4.1 Payment Methods

**Supported Methods**:

**1. Credit/Debit Card**:
- Visa, Mastercard, Amex
- Online processing via Stripe
- PCI compliant
- 3D Secure authentication
- Fee: ~2.9% + $0.30

**2. Bank Transfer**:
- ACH (US)
- SEPA (Europe)
- Wire transfer
- Manual reconciliation
- No processing fees

**3. PayPal**:
- PayPal account required
- Instant payment
- Buyer protection
- Fee: ~2.9% + $0.30

**4. Cash**:
- Walk-in payments
- Manual receipt
- Reconcile with bank deposit

**5. Check**:
- Physical check
- Record check number
- Clear time: 2-5 days
- Bank verification needed

### 4.2 Online Payment Gateway

**Stripe Integration**:

**Setup**:
1. Go to **Settings** → **Payment Gateways**
2. Select **Stripe**
3. Enter API keys:
   - Publishable key
   - Secret key
4. Configure:
   - Accept credit cards
   - Accept Apple Pay
   - Accept Google Pay
   - Save cards for future use
5. Test mode available
6. Click **"Save"**

**Customer Experience**:
1. Customer receives invoice/quote
2. Clicks **"Pay Now"** button
3. Redirected to secure payment page
4. Enters card details
5. 3D Secure verification (if required)
6. Payment processed
7. Confirmation shown
8. Receipt emailed
9. System auto-updates

**Payment Tracking**:
- Real-time notifications
- Payment status dashboard
- Failed payment alerts
- Automatic retries
- Refund processing

### 4.3 Payment Plans

**Create Payment Plan**:
1. During invoice generation
2. Enable **"Payment Plan"**
3. **Plan Options**:
   - Fixed installments (e.g., 3 payments)
   - Percentage-based (20% deposit, 80% later)
   - Custom schedule
4. Set due dates for each payment
5. Generate separate invoices
6. **Auto-Reminders**:
   - 7 days before due
   - 1 day before due
   - On due date
   - 3 days overdue

**Track Payment Plan**:
- Dashboard shows all plans
- Status of each installment
- Upcoming payments
- Overdue payments
- Send manual reminders
- Adjust schedule if needed

### 4.4 Failed Payments

**Handle Failed Payment**:
1. Notification received
2. View failure reason:
   - Insufficient funds
   - Invalid card
   - Card declined
   - Expired card
   - Technical error
3. **Actions**:
   - Retry payment automatically
   - Contact customer
   - Request alternate payment method
   - Update card details
   - Suspend booking (if needed)

---

## 5. Invoice Management {#invoices}

### 5.1 Invoice Types

**1. Booking Invoice**:
- Created from confirmed booking
- Includes all services
- Auto-numbered
- Customer-facing

**2. Proforma Invoice**:
- Before booking confirmation
- Quote with invoice format
- Not final
- Can be modified

**3. Credit Note**:
- Reverse an invoice
- For cancellations
- Partial refunds
- Corrections

**4. Supplier Invoice**:
- What you owe suppliers
- Track payables
- Payment due dates

### 5.2 Invoice Customization

**Customize Invoice Template**:
1. Go to **Settings** → **Invoice Settings**
2. **Company Branding**:
   - Upload logo
   - Company name
   - Address
   - Tax ID
   - Contact info
3. **Invoice Format**:
   - Number format (INV-0001)
   - Date format
   - Currency position
   - Terms & conditions
4. **Colors & Styling**:
   - Primary color
   - Font style
   - Layout
5. **Payment Instructions**:
   - Bank details
   - Payment methods
   - Due date terms
6. Preview and save

### 5.3 Invoice Actions

**Void Invoice**:
1. Open invoice
2. Click **"Void"** (in Actions menu)
3. Enter reason
4. Confirm void
5. Invoice marked void
6. Cannot be paid
7. Appears in reports as voided

**Duplicate Invoice**:
1. Open invoice
2. Click **"Duplicate"**
3. Creates copy with new number
4. Edit as needed
5. Save

**Email Invoice**:
1. Open invoice
2. Click **"Send"**
3. Email compose opens
4. Customer email pre-filled
5. Invoice PDF attached
6. Edit email body
7. Click **"Send"**
8. Status updated to "Sent"
9. Track email opens

**Download Invoice**:
- PDF format
- Print-ready
- Customer copy
- Archive copy

### 5.4 Invoice Reminders

**Automated Reminders**:
1. Go to **Settings** → **Invoice Reminders**
2. Configure reminder schedule:
   - **Reminder 1**: 7 days before due
   - **Reminder 2**: On due date
   - **Reminder 3**: 3 days overdue
   - **Reminder 4**: 7 days overdue
   - **Final Notice**: 14 days overdue
3. Customize email templates
4. Enable/disable specific reminders
5. Save settings
6. Runs automatically

**Manual Reminder**:
1. Open overdue invoice
2. Click **"Send Reminder"**
3. Select reminder template
4. Edit if needed
5. Send immediately

---

## 6. Tax Configuration {#tax}

### 6.1 Tax Setup

**Add Tax Rate**:
1. Navigate to **Finance** → **Tax Settings**
2. Click **"Add Tax"**
3. Enter tax details:
   - **Tax Name**: (e.g., "VAT", "GST", "Sales Tax")
   - **Tax Rate**: Percentage (e.g., 10%)
   - **Tax Number**: Your tax registration #
   - **Applies To**: Services/Products/Both
4. **Tax Rules**:
   - Apply to all customers: Yes/No
   - Exempt customers: Select
   - Geographic rules: Domestic/International
5. Click **"Save"**

**Multiple Tax Rates**:
- Different rates for different regions
- Reduced rate (e.g., tourism tax)
- Zero-rated items
- Exempt items

### 6.2 Tax Calculation

**Automatic Tax Calculation**:
1. During invoice generation
2. System checks:
   - Customer location
   - Service type
   - Tax rules
3. Applies correct tax rate
4. Shows tax breakdown:
   - Subtotal: $1,000
   - Tax (10%): $100
   - Total: $1,100

**Tax Inclusive vs Exclusive**:
- **Tax Exclusive** (default): Tax added to price
  - Price: $100 + Tax $10 = Total $110
- **Tax Inclusive**: Tax included in price
  - Total: $110 (includes $10 tax)
- Set per tax or globally

### 6.3 Tax Reports

**Generate Tax Report**:
1. Navigate to **Reports** → **Tax Report**
2. Select period:
   - Monthly
   - Quarterly
   - Annual
3. Choose tax type (VAT/GST/Sales Tax)
4. Click **"Generate"**
5. Report shows:
   - Total sales
   - Taxable amount
   - Tax collected
   - Tax-exempt sales
   - Net tax payable
6. Export for tax filing:
   - PDF
   - Excel
   - CSV

**Tax by Service Type**:
- Hotels: $X tax
- Transport: $Y tax
- Activities: $Z tax
- Total tax collected

---

## 7. Financial Reports {#reports}

### 7.1 Revenue Reports

**Monthly Revenue Report**:
1. Go to **Reports** → **Revenue Report**
2. Select month
3. View breakdown:
   - Total bookings
   - Total revenue
   - Revenue by service type:
     - Hotels: 40%
     - Flights: 30%
     - Activities: 20%
     - Other: 10%
   - Revenue by agent
   - Revenue by destination
4. **Visual Charts**:
   - Bar chart (revenue by month)
   - Pie chart (revenue mix)
   - Line graph (trend)
5. Export report

### 7.2 Profit & Loss Statement

**Generate P&L**:
1. Navigate to **Reports** → **P&L Statement**
2. Select period (month/quarter/year)
3. Report structure:

```
REVENUE
Booking Revenue         $100,000
Service Fees              $5,000
Other Income              $1,000
-------------------------
Total Revenue          $106,000

COST OF GOODS SOLD
Supplier Costs          $70,000
-------------------------
Gross Profit            $36,000
Gross Margin            34%

OPERATING EXPENSES
Salaries                $10,000
Marketing                $3,000
Software                 $1,000
Office Rent              $2,000
Utilities                  $500
Other Expenses           $1,500
-------------------------
Total Expenses          $18,000

EBITDA                  $18,000
Tax (10%)               ($1,800)
-------------------------
NET PROFIT              $16,200
Net Margin              15.3%
```

4. Compare periods
5. Export to Excel

### 7.3 Accounts Receivable

**AR Aging Report**:
1. Go to **Reports** → **Accounts Receivable**
2. Shows outstanding invoices:
   - **Current** (0-30 days): $10,000
   - **31-60 days**: $5,000
   - **61-90 days**: $2,000
   - **90+ days** (Overdue): $1,000
3. By customer listing
4. Identifies collection priorities
5. Track payment patterns

**AR Summary Dashboard**:
- Total outstanding: $18,000
- Average days to pay: 25 days
- Largest outstanding: $5,000
- Collection rate: 95%

### 7.4 Accounts Payable

**AP Report**:
1. Navigate to **Reports** → **Accounts Payable**
2. Shows what you owe:
   - Supplier name
   - Invoice date
   - Amount
   - Due date
   - Days until due
3. Sort by:
   - Due date
   - Supplier
   - Amount
4. Filter upcoming payments
5. Plan cash flow

### 7.5 Cash Flow Report

**Monthly Cash Flow**:
1. Go to **Reports** → **Cash Flow**
2. Select period
3. Report shows:

```
OPENING BALANCE         $20,000

CASH IN
Customer Payments       $50,000
Deposits Received       $10,000
Other Income             $1,000
-------------------------
Total Cash In           $61,000

CASH OUT
Supplier Payments      ($30,000)
Salaries              ($10,000)
Operating Expenses     ($5,000)
Taxes                  ($2,000)
-------------------------
Total Cash Out        ($47,000)

NET CASH FLOW           $14,000
CLOSING BALANCE         $34,000
```

4. Forecast future cash flow
5. Identify cash gaps
6. Plan financing needs

### 7.6 Commission Reports

**Agent Commission Report**:
1. Navigate to **Reports** → **Commission Report**
2. Select agent and period
3. Report shows:
   - Bookings made
   - Booking value
   - Commission rate
   - Commission earned
   - Commission paid
   - Commission due
4. **Commission Details**:
   - Per booking breakdown
   - Payment history
   - Outstanding balance
5. Export for payment processing

---

## Quick Reference

### Common Finance Tasks

| Task | Navigation |
|------|------------|
| Bank Reconciliation | Finance → Bank Reconciliation |
| Record Payment | Bookings → Payment Tab |
| Generate Invoice | Bookings → Generate Invoice |
| Update Exchange Rate | Finance → Currencies |
| Tax Report | Reports → Tax Report |
| P&L Statement | Reports → P&L |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+P` | Record payment |
| `Ctrl+Shift+I` | Generate invoice |
| `Ctrl+Shift+R` | View reports |

---

**End of Part 6: Finance Module Guide**

*← [Part 5: Operator Guide](USER_MANUAL_05_OPERATOR_GUIDE.md) | [Part 7: Supplier Management](USER_MANUAL_07_SUPPLIER_MANAGEMENT.md) →*
