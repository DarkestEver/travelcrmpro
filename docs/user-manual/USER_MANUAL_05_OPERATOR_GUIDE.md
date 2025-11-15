# Travel CRM Pro - User Manual
## Part 5: Operator/Admin Guide

**Version**: 2.1.0  
**Last Updated**: November 15, 2025  
**Document**: 5 of 14

---

## Table of Contents

1. [Operator Dashboard](#dashboard)
2. [Customer Management](#customers)
3. [Agent Management](#agents)
4. [Supplier Management](#suppliers)
5. [Itinerary Builder](#itinerary)
6. [Quote Management](#quotes)
7. [Booking Management](#bookings)
8. [Invoice & Payment Processing](#invoices)
9. [Email Dashboard](#email)
10. [Reports & Analytics](#reports)

---

## 1. Operator Dashboard {#dashboard}

### 1.1 Dashboard Overview

The Operator Dashboard is your command center:

**Today's Snapshot**:
- 📋 **Pending Quotes**: Require your attention
- ✈️ **Active Bookings**: Today's departures/arrivals
- 💰 **Revenue Today**: Real-time revenue
- 📧 **Unread Emails**: Inbox count
- 🔔 **Notifications**: Urgent items
- 📊 **Conversion Rate**: Quote to booking

**Key Widgets**:
1. **Recent Activity**: Latest actions
2. **Pending Tasks**: Your to-do list
3. **Revenue Chart**: Last 30 days
4. **Booking Pipeline**: Status funnel
5. **Top Agents**: Performance rankings
6. **Email Queue**: Needs review
7. **Quick Actions**: Common tasks
8. **Calendar**: Upcoming departures

### 1.2 Quick Actions

From dashboard:
- ➕ Create Itinerary
- 💼 Add Customer
- 📝 Generate Quote
- ✈️ New Booking
- 📧 Check Emails
- 📊 View Reports
- 👥 Manage Agents
- 🏨 Supplier Inventory

---

## 2. Customer Management {#customers}

### 2.1 Customer List

**Accessing Customers**:
1. Navigate to **Customers** from main menu
2. View all customers in list format
3. Search by:
   - Name
   - Email
   - Phone
   - Customer ID
4. Filter by:
   - Status (Active/Inactive)
   - Customer Type (Individual/Corporate)
   - Assigned Agent
   - Created Date
   - Lifetime Value
5. Sort by various columns

**Customer Card View**:
Each customer shows:
- Name and photo
- Contact information
- Assigned agent
- Total bookings
- Total revenue
- Last activity
- Quick action buttons

### 2.2 Adding a Customer

**Create New Customer**:
1. Click **"Add Customer"** button
2. Fill in **Basic Information**:
   - **Title**: Mr/Mrs/Ms/Dr
   - **First Name**: Required
   - **Last Name**: Required
   - **Email**: Required (validated)
   - **Phone**: With country code
   - **Date of Birth**: Optional
3. **Contact Details**:
   - **Address Line 1**: Street address
   - **Address Line 2**: Apt/Suite
   - **City**
   - **State/Province**
   - **Postal Code**
   - **Country**: Dropdown
4. **Additional Information**:
   - **Customer Type**: Individual/Corporate
   - **Company Name**: If corporate
   - **Tax ID**: For invoicing
   - **Passport Number**: Optional
   - **Nationality**
5. **Assignment**:
   - **Assigned Agent**: Select from dropdown
   - **Customer Source**: Web/Referral/Agent/Other
6. **Preferences**:
   - **Preferred Language**
   - **Preferred Currency**
   - **Communication Preference**: Email/SMS/Phone
   - **Newsletter**: Subscribe yes/no
7. Click **"Create Customer"**
8. Customer account created
9. Welcome email sent (optional)

**Bulk Import**:
1. Click **"Import Customers"**
2. Download CSV template
3. Fill in customer data
4. Upload CSV file
5. Review validation errors
6. Confirm import
7. Customers created with auto-assigned agents

### 2.3 Customer Details

**Customer Profile Tabs**:

**1. Overview Tab**:
- Basic information
- Contact details
- Assigned agent
- Customer since date
- Lifetime statistics:
  - Total bookings
  - Total revenue
  - Average booking value
  - Last booking date

**2. Bookings Tab**:
- List of all bookings (upcoming & past)
- Booking status
- Travel dates
- Destination
- Total amount
- Quick actions: View/Edit/Cancel

**3. Quotes Tab**:
- All quotes (pending/approved/expired)
- Quote date
- Destinations
- Status
- Actions: View/Convert/Email

**4. Invoices Tab**:
- All invoices
- Invoice number
- Date
- Amount
- Status (Paid/Unpaid/Overdue)
- Download PDF

**5. Payments Tab**:
- Payment history
- Date
- Amount
- Method
- Status
- Receipt download

**6. Documents Tab**:
- Uploaded documents
- Passports
- Visas
- Travel insurance
- Vouchers
- Upload new documents

**7. Communication Tab**:
- Email history
- SMS sent
- Phone calls logged
- Notes and comments
- Internal communication

**8. Activity Tab**:
- Complete activity log
- Login history
- Quote requests
- Booking changes
- Payment activity

### 2.4 Customer Actions

**Edit Customer**:
1. Open customer profile
2. Click **"Edit"** button
3. Modify any field
4. Click **"Save Changes"**
5. Change logged in audit trail

**Assign to Different Agent**:
1. Open customer profile
2. Go to **Overview** tab
3. Click **"Change Agent"**
4. Select new agent from dropdown
5. Add reason for change
6. Notify both agents (optional)
7. Click **"Reassign"**
8. Customer reassigned

**Merge Duplicate Customers**:
1. Select duplicate customers (checkboxes)
2. Click **"Merge Customers"**
3. Choose primary record (data to keep)
4. Review fields to merge
5. Select which data to retain
6. Click **"Merge"**
7. Duplicate removed, data combined

**Deactivate Customer**:
1. Open customer profile
2. Go to **Settings** (gear icon)
3. Click **"Deactivate Account"**
4. Select reason
5. Add notes
6. Confirm deactivation
7. Customer cannot login
8. Data retained

---

## 3. Agent Management {#agents}

### 3.1 Agent List

**View All Agents**:
1. Navigate to **Agents**
2. See agent list with metrics:
   - Name and photo
   - Email and phone
   - Customer count
   - Active bookings
   - Revenue (MTD)
   - Commission earned
   - Status (Active/Inactive)
3. Search and filter options
4. Performance sorting

### 3.2 Adding an Agent

**Create New Agent**:
1. Click **"Add Agent"** button
2. **Personal Information**:
   - Full name
   - Email (becomes login)
   - Phone number
   - Profile photo (optional)
3. **Company Details**:
   - Company/Agency name
   - Business registration number
   - Tax ID
   - Office address
4. **Commission Structure**:
   - **Commission Type**: 
     - Flat Rate: Fixed % on all bookings
     - Tiered: Different % by volume
     - Custom: Per product type
   - **Rate**: Percentage (e.g., 10%)
   - **Payment Terms**: Weekly/Monthly
5. **Access Settings**:
   - Portal access: Yes/No
   - Can create sub-users: Yes/No
   - Customer limit: Unlimited or set number
   - Module access: Select allowed modules
6. **Banking Details** (for commission payouts):
   - Bank name
   - Account number
   - Routing number
   - SWIFT code (if international)
7. Set initial password or send invitation
8. Click **"Create Agent"**
9. Invitation email sent

### 3.3 Agent Performance

**Performance Metrics**:
- **Revenue Generated**: Total booking value
- **Conversion Rate**: Quotes to bookings
- **Average Booking Value**
- **Customer Satisfaction**: Rating
- **Commission Earned**
- **Active Customers**: Number assigned
- **Response Time**: Average quote turnaround

**View Agent Dashboard**:
1. Click on agent name
2. See comprehensive overview:
   - Monthly revenue chart
   - Booking pipeline
   - Customer list
   - Commission summary
   - Recent activity
3. Export agent report

### 3.4 Commission Management

**Commission Tracking**:
1. Navigate to **Agents** → **Commissions**
2. View commission dashboard:
   - Pending commissions
   - Paid commissions
   - Monthly totals by agent
3. Filter by date range and agent

**Process Commission Payment**:
1. Select agent
2. Review **Pending Commissions**:
   - Booking reference
   - Customer name
   - Booking amount
   - Commission rate
   - Commission amount
   - Date earned
3. Select commissions to pay (checkboxes)
4. Click **"Process Payment"**
5. Choose payment method:
   - Bank transfer
   - Check
   - PayPal
   - Stripe
6. Add reference number
7. Confirm payment
8. Status updated to "Paid"
9. Agent notified
10. Commission invoice generated

---

## 4. Supplier Management {#suppliers}

### 4.1 Supplier Directory

**View Suppliers**:
1. Navigate to **Suppliers**
2. See supplier cards showing:
   - Company name and logo
   - Supplier type (Hotel/Transport/Activity/etc.)
   - Rating
   - Active inventory items
   - Contact person
   - Quick actions
3. Filter by:
   - Type
   - Location
   - Rating
   - Active/Inactive

### 4.2 Adding a Supplier

**Create New Supplier**:
1. Click **"Add Supplier"**
2. **Company Information**:
   - Company name
   - Supplier type: Hotel/Car Rental/Tours/Transport/Activity/Other
   - Company logo
   - Website
3. **Contact Information**:
   - Primary contact name
   - Email
   - Phone
   - Address
4. **Contract Details**:
   - Contract start date
   - Contract end date
   - Commission percentage
   - Payment terms
   - Credit limit
5. **Banking Details**:
   - Bank name
   - Account details
   - Tax ID
6. **Portal Access** (optional):
   - Create supplier portal account
   - Username and password
   - Access level
7. Click **"Create Supplier"**

### 4.3 Supplier Inventory

**View Supplier Inventory**:
1. Open supplier profile
2. Click **"Inventory"** tab
3. See all items:
   - Hotels/rooms
   - Vehicle types
   - Tour packages
   - Activities
   - Transfer services
4. For each item see:
   - Name/description
   - Availability
   - Base price
   - Current rate
   - Seasonal pricing
   - Status (Active/Inactive)

**Add Inventory Item**:
1. In supplier profile, click **"Add Inventory"**
2. Select item type (Hotel/Car/Tour/etc.)
3. Fill in details based on type:

**For Hotel**:
- Hotel name
- Star rating
- Location (city, address)
- Room types
- Capacity
- Amenities
- Photos
- Base rate per night
- Meal plans available
- Cancellation policy

**For Transport**:
- Vehicle type (Bus/Van/Car/etc.)
- Capacity (seats)
- Features (AC, WiFi, etc.)
- Rate per km or per day
- Availability calendar

**For Tour/Activity**:
- Activity name
- Description
- Duration
- Group size (min/max)
- Included items
- Pricing per person
- Available days
- Meeting point

4. Set **Availability Calendar**
5. Add **Rate Sheet** (seasonal pricing)
6. Upload photos
7. Click **"Save Inventory"**

### 4.4 Supplier Payments

**Track Supplier Payables**:
1. Navigate to **Suppliers** → **Payments**
2. View payables dashboard:
   - Outstanding payables by supplier
   - Due this week
   - Overdue amounts
3. Filter by supplier, date, status

**Make Supplier Payment**:
1. Select supplier
2. Review **Outstanding Invoices**
3. Select invoices to pay
4. Total amount calculated
5. Click **"Make Payment"**
6. Enter payment details:
   - Payment method
   - Reference number
   - Payment date
7. Confirm payment
8. Invoices marked as "Paid"
9. Payment receipt generated
10. Supplier notified

---

## 5. Itinerary Builder {#itinerary}

### 5.1 Creating an Itinerary

The Itinerary Builder is the heart of Travel CRM Pro:

**Start New Itinerary**:
1. Click **"Create Itinerary"** from dashboard
2. **Basic Information**:
   - Itinerary title (e.g., "Paris Summer 2025")
   - Customer: Select or create new
   - Travel dates: Start and end
   - Number of travelers: Adults/children
   - Budget range (optional)
3. **Destinations**:
   - Add primary destination
   - Add multiple destinations if multi-city
   - Set nights in each location
4. Click **"Start Building"**

### 5.2 Adding Itinerary Components

**Day-by-Day Builder**:

**Add Accommodation**:
1. Select day in timeline
2. Click **"Add Accommodation"**
3. Search for hotel:
   - By supplier
   - By location
   - By name
4. Select hotel from results
5. Choose room type
6. Select meal plan
7. Set check-in/check-out dates
8. Enter rates:
   - Supplier cost
   - Markup %
   - Selling price
9. Add special requests
10. Click **"Add to Itinerary"**

**Add Transport**:
1. Select day
2. Click **"Add Transport"**
3. Select transport type:
   - Flight
   - Train
   - Bus
   - Car rental
   - Private transfer
4. Fill in details:
   - Departure point
   - Arrival point
   - Departure time
   - Arrival time
   - Carrier name
   - Flight/train number
5. Enter costs
6. Upload tickets/vouchers (optional)
7. Click **"Add to Itinerary"**

**Add Activity/Tour**:
1. Select day
2. Click **"Add Activity"**
3. Search supplier inventory or create custom
4. Enter details:
   - Activity name
   - Time
   - Duration
   - Meeting point
   - Included items
   - Exclusions
5. Set pricing
6. Add description for customer
7. Click **"Add to Itinerary"**

**Add Meal**:
1. Select day
2. Click **"Add Meal"**
3. Enter:
   - Restaurant name
   - Meal type (Breakfast/Lunch/Dinner)
   - Time
   - Cuisine type
   - Cost (if prepaid)
4. Add notes

**Add Notes**:
1. Select day
2. Click **"Add Note"**
3. Enter free-text information:
   - Travel tips
   - Important information
   - Emergency contacts
   - Packing suggestions
4. Format with rich text editor

### 5.3 Itinerary Pricing

**Cost Breakdown**:
Automatic calculation shows:
- **Supplier Costs**: Total from all suppliers
- **Markup**: Your margin
- **Base Price**: Cost + Markup
- **Taxes**: Applicable taxes
- **Fees**: Service fees
- **Total Price**: Customer pays

**Edit Pricing**:
1. Click **"Pricing"** tab
2. Adjust markup percentage
3. Add/remove fees
4. Apply discounts
5. Set payment schedule
6. Pricing auto-updates

### 5.4 Itinerary Templates

**Save as Template**:
1. After creating great itinerary
2. Click **"Save as Template"**
3. Enter template name
4. Select category (Beach/Adventure/Culture/etc.)
5. Mark items as customizable
6. Click **"Save Template"**

**Use Template**:
1. Click **"Create from Template"**
2. Browse template gallery
3. Select template
4. Customize for customer:
   - Change dates
   - Modify hotels
   - Add/remove activities
   - Adjust pricing
5. Create itinerary

---

## 6. Quote Management {#quotes}

### 6.1 Generate Quote

**Create Quote from Itinerary**:
1. Complete itinerary building
2. Click **"Generate Quote"** button
3. Review **Quote Preview**:
   - Header with your branding
   - Customer details
   - Travel dates
   - Day-by-day itinerary
   - Inclusions
   - Exclusions
   - Terms & conditions
   - Pricing breakdown
   - Payment schedule
4. **Customize Quote**:
   - Edit introductory text
   - Modify inclusions/exclusions
   - Add special offers
   - Adjust terms
5. **Quote Settings**:
   - Valid until date (e.g., 7 days)
   - Require customer approval
   - Allow customer to pay deposit online
6. Click **"Save Quote"**

### 6.2 Send Quote

**Email Quote to Customer**:
1. After saving quote
2. Click **"Send Quote"** button
3. **Email Compose Screen**:
   - To: Customer email (pre-filled)
   - CC: Additional recipients
   - Subject: Customizable
   - Body: Quote email template (editable)
4. **Attachments**:
   - Quote PDF (auto-attached)
   - Additional documents (optional)
5. **Tracking**:
   - Email read notification
   - Quote view tracking
   - Link expiry
6. Click **"Send Email"**
7. Quote sent, status updated to "Sent"

**Share Quote Link**:
Alternative to email:
1. Click **"Get Share Link"**
2. Copy unique quote URL
3. Share via:
   - WhatsApp
   - SMS
   - Social media
4. Customer views without login

### 6.3 Quote Follow-up

**Quote Status Tracking**:
- **Draft**: Being created
- **Sent**: Emailed to customer
- **Viewed**: Customer opened
- **Approved**: Customer accepted
- **Rejected**: Customer declined
- **Expired**: Past valid date
- **Converted**: Became booking

**Follow-up Actions**:
1. Navigate to **Quotes** → **Pending**
2. See quotes awaiting response
3. For each quote:
   - Days since sent
   - Last viewed
   - Suggested action
4. **Follow-up Options**:
   - Send reminder email
   - Call customer
   - Modify quote
   - Extend validity
   - Mark as won/lost

**Send Reminder**:
1. Select quote
2. Click **"Send Reminder"**
3. Email template auto-populates
4. Edit if needed
5. Send

### 6.4 Quote Revisions

**Create Quote Revision**:
1. Open original quote
2. Click **"Create Revision"**
3. Modify:
   - Itinerary items
   - Pricing
   - Dates
   - Terms
4. Save as Version 2
5. Send updated quote
6. Version history maintained

**Compare Versions**:
1. Open quote
2. Click **"Version History"**
3. See all versions
4. Click **"Compare"**
5. Side-by-side comparison shows changes

---

## 7. Booking Management {#bookings}

### 7.1 Create Booking

**Convert Quote to Booking**:
1. Open approved quote
2. Click **"Convert to Booking"**
3. **Confirmation Screen**:
   - Review all details
   - Verify pricing
   - Check availability
4. **Booking Settings**:
   - Booking reference (auto-generated)
   - Payment schedule
   - Deposit amount
   - Payment methods accepted
5. **Supplier Confirmations**:
   - System sends requests to suppliers
   - Await confirmations
   - Manual confirmation if needed
6. Click **"Create Booking"**
7. Booking created with status "Pending Confirmation"

**Direct Booking** (without quote):
1. Click **"New Booking"**
2. Select customer
3. Build itinerary (quick builder)
4. Set pricing
5. Create booking immediately

### 7.2 Booking Details

**Booking Overview**:
- **Booking Reference**: Unique ID
- **Status**: Confirmed/Pending/Cancelled
- **Customer**: Name and contact
- **Travel Dates**: Start - End
- **Travelers**: Number and names
- **Total Amount**: Grand total
- **Amount Paid**: Payments received
- **Balance Due**: Outstanding
- **Agent**: If assigned

**Booking Tabs**:

**1. Itinerary Tab**:
- Complete day-by-day plan
- All components (hotels, flights, activities)
- Voucher download buttons
- Supplier confirmation status

**2. Travelers Tab**:
- List all travelers
- Full names
- Passport details
- Date of birth
- Special requests
- Meal preferences
- Add/edit traveler info

**3. Payments Tab**:
- Payment schedule
- Payments received
- Balance due
- Payment history
- Refund history
- Record new payment

**4. Documents Tab**:
- All booking documents
- Vouchers
- Tickets
- Confirmations
- Insurance
- Visa documents
- Upload new documents

**5. Communication Tab**:
- Email history
- SMS sent
- Notes
- Send message to customer

**6. Modifications Tab**:
- Change log
- Who made changes
- What was changed
- When

### 7.3 Booking Actions

**Confirm Booking**:
1. After supplier confirmations received
2. Open booking
3. Verify all confirmations
4. Click **"Confirm Booking"**
5. Status updated to "Confirmed"
6. Confirmation email sent to customer
7. Vouchers generated

**Modify Booking**:
1. Open booking
2. Click **"Modify"**
3. Make changes:
   - Change dates
   - Upgrade hotel
   - Add activities
   - Remove services
4. Recalculate pricing
5. Check additional costs
6. Contact suppliers for changes
7. Update booking
8. Send amendment to customer

**Cancel Booking**:
1. Open booking
2. Click **"Cancel"** (in Danger Zone)
3. Select cancellation reason:
   - Customer request
   - Payment failure
   - Force majeure
   - Other
4. Review cancellation policies:
   - Each supplier's policy
   - Refund amounts
   - Penalties
5. Calculate refund:
   - Paid amount
   - Minus cancellation fees
   - Refund amount
6. Enter cancellation notes
7. Confirm cancellation
8. Process refund (if applicable)
9. Notify customer
10. Notify suppliers

### 7.4 Booking Calendar

**Calendar View**:
1. Navigate to **Bookings** → **Calendar**
2. See bookings in calendar format
3. Color-coded by status:
   - Green: Confirmed
   - Yellow: Pending
   - Blue: Completed
   - Red: Cancelled
4. Filter by:
   - Agent
   - Destination
   - Status
5. Click booking to view details

---

## 8. Invoice & Payment Processing {#invoices}

### 8.1 Generate Invoice

**Create Invoice from Booking**:
1. Open confirmed booking
2. Go to **Payments** tab
3. Click **"Generate Invoice"**
4. Invoice auto-populated with:
   - Customer details
   - Booking reference
   - Line items (all services)
   - Subtotal
   - Taxes
   - Total amount
5. **Customize Invoice**:
   - Add/edit line items
   - Adjust quantities
   - Apply discounts
   - Modify tax rates
6. **Payment Terms**:
   - Due date
   - Payment instructions
   - Bank details
7. Preview invoice
8. Click **"Save Invoice"**
9. Invoice number generated (INV-001)

**Send Invoice**:
1. After generating invoice
2. Click **"Send Invoice"**
3. Email compose with invoice PDF
4. Edit email if needed
5. Click **"Send"**
6. Invoice sent, status "Sent"

### 8.2 Record Payment

**Manual Payment Entry**:
1. Open booking or invoice
2. Click **"Record Payment"**
3. Enter payment details:
   - **Amount**: Amount received
   - **Date**: Payment date
   - **Method**: 
     - Cash
     - Bank Transfer
     - Credit Card
     - Debit Card
     - Check
     - PayPal
     - Other
   - **Reference**: Transaction ID/Check number
   - **Notes**: Additional info
4. Upload receipt (optional)
5. Click **"Save Payment"**
6. Payment recorded
7. Invoice updated
8. If fully paid, status "Paid"
9. Receipt emailed to customer

**Online Payment**:
1. Customer clicks "Pay Now" in quote/invoice
2. Redirected to payment gateway (Stripe)
3. Enters card details
4. Processes payment
5. Automatic recording in system
6. Customer receives receipt
7. You receive notification

### 8.3 Payment Schedule

**Create Payment Plan**:
1. During booking creation
2. Click **"Payment Schedule"**
3. Set schedule:
   - **Deposit**: Amount and due date
   - **Installment 1**: Amount and due date
   - **Installment 2**: Amount and due date
   - **Final Payment**: Balance, due before travel
4. Each payment becomes separate invoice
5. Automatic reminders sent before due dates
6. Track each payment separately

**Example Schedule**:
- Deposit (20%): Due at booking - $1,000
- Second Payment (40%): 60 days before travel - $2,000
- Final Payment (40%): 30 days before travel - $2,000
- Total: $5,000

### 8.4 Refund Processing

**Issue Refund**:
1. Navigate to booking/invoice
2. Click **"Issue Refund"**
3. Select payment to refund
4. Enter refund details:
   - **Amount**: Full or partial
   - **Reason**: Cancellation/Modification/Error
   - **Method**: Same as original or different
   - **Notes**
5. Review refund calculation:
   - Original payment
   - Cancellation fees
   - Net refund
6. Confirm refund
7. Process through payment gateway (if online)
8. Record refund
9. Update invoice
10. Send refund confirmation

---

## 9. Email Dashboard {#email}

### 9.1 Email Inbox

**Access Email Dashboard**:
1. Navigate to **Emails** from menu
2. See email management interface:
   - **Unread**: New emails
   - **Pending Review**: AI processed, needs review
   - **Processed**: Completed
   - **Archived**: Old emails
3. Folder view (like Gmail)

### 9.2 Email Processing

**Process Incoming Email**:
1. Open email from inbox
2. **AI Analysis** shows:
   - Email category (Booking Request/Quote Request/General)
   - Extracted information:
     - Customer name
     - Email
     - Phone
     - Travel dates
     - Destination
     - Number of travelers
     - Budget
     - Special requests
   - Confidence score
3. **Review AI Extraction**:
   - Verify accuracy
   - Edit any errors
   - Add missing info
4. **Take Action**:
   - **Create Customer**: If new
   - **Create Quote Request**: Generate quote
   - **Reply**: Send response
   - **Create Booking**: If direct booking
   - **Forward to Agent**: Assign to agent
5. Email marked as "Processed"

### 9.3 Email Templates

**Use Email Templates**:
1. When replying to email
2. Click **"Templates"** dropdown
3. Select template:
   - Welcome email
   - Quote follow-up
   - Booking confirmation
   - Payment reminder
   - Thank you email
   - Custom templates
4. Template inserts into compose
5. Personalize with customer details
6. Send

**Create Template**:
1. Go to **Settings** → **Email Templates**
2. Click **"New Template"**
3. Enter:
   - Template name
   - Subject line (can use variables)
   - Body (rich text editor)
   - Use variables: `{{customer_name}}`, `{{booking_ref}}`, etc.
4. Save template
5. Available in compose dropdown

---

## 10. Reports & Analytics {#reports}

### 10.1 Standard Reports

**Access Reports**:
1. Navigate to **Reports** from menu
2. Select report type:
   - Sales Report
   - Revenue Report
   - Booking Report
   - Agent Performance
   - Customer Report
   - Supplier Report
   - Financial Summary

**Generate Sales Report**:
1. Click **"Sales Report"**
2. Set parameters:
   - Date range
   - Group by (Day/Week/Month)
   - Filter by agent
   - Filter by destination
3. Click **"Generate"**
4. View report:
   - Total bookings
   - Total revenue
   - Average booking value
   - Conversion rate
   - Charts and graphs
5. Export options:
   - PDF
   - Excel
   - CSV

### 10.2 Custom Reports

**Create Custom Report**:
1. Click **"Custom Report"**
2. Select data source: Bookings/Customers/Invoices/etc.
3. Choose fields to include
4. Add filters
5. Set grouping
6. Apply sorting
7. Generate report
8. Save for future use

---

## Quick Reference

| Task | Navigation |
|------|------------|
| Add Customer | Customers → Add Customer |
| Create Itinerary | Dashboard → Create Itinerary |
| Generate Quote | Itinerary → Generate Quote |
| Create Booking | Quote → Convert to Booking |
| Record Payment | Booking → Record Payment |
| Process Email | Emails → Unread |
| View Reports | Reports → Select Type |

---

**End of Part 5: Operator/Admin Guide**

*← [Part 4: Super Admin](USER_MANUAL_04_SUPER_ADMIN.md) | [Part 6: Finance Module](USER_MANUAL_06_FINANCE_MODULE.md) →*
