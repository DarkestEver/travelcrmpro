# Phase H: Customer Portal Implementation Plan

## 🎯 Overview
Build a complete customer-facing portal where customers can:
- View their bookings and itineraries
- Check invoices and payment history
- Request new quotes
- Manage their profile
- Receive notifications
- Download documents (vouchers, invoices)

---

## 📋 Features Breakdown

### 1. **Customer Authentication** 🔐
**What customers can do:**
- Register for an account
- Login with email/password
- Reset forgotten password
- Verify email address
- Stay logged in (remember me)

**Technical Implementation:**
- Separate auth flow from agent portal
- JWT token-based authentication
- Password reset via email link
- Email verification workflow
- Secure password requirements

---

### 2. **Customer Dashboard** 📊
**What customers see:**
- Welcome message with name
- Upcoming trips card (next 3 bookings)
- Recent bookings summary
- Outstanding invoices alert
- Quick action buttons
- Travel statistics (total trips, countries visited)

**UI Components:**
- Stat cards with icons
- Upcoming trips timeline
- Recent activity feed
- Quick action buttons (Request Quote, View Bookings)

---

### 3. **My Bookings** ✈️
**What customers can do:**
- View all bookings (upcoming, past, cancelled)
- Filter by status and date range
- Search by destination or booking number
- Click to view full booking details
- Download booking voucher
- View detailed itinerary with daily breakdown

**Booking Details Page:**
- Booking information card
- Travel dates and destination
- Traveler details
- Itinerary timeline (day-by-day)
- Hotel/flight information
- Payment status
- Agent contact info
- Download voucher button
- Cancel booking (if allowed)

---

### 4. **My Invoices & Payments** 💰
**What customers can do:**
- View all invoices (paid, pending, overdue)
- Filter by status and date
- Search by invoice number
- View invoice details
- Download invoice PDF
- See payment history
- Check outstanding balance

**Invoice Details:**
- Invoice number and date
- Line items breakdown
- Subtotal, tax, discount
- Total amount
- Amount paid
- Amount due
- Payment history timeline
- Pay Now button (for future payment gateway)

---

### 5. **Request Quote** 📝
**What customers can do:**
- Fill out quote request form
- Specify destination and dates
- Add number of travelers
- Set budget range
- Describe preferences
- Upload inspiration photos (optional)
- Submit request
- Track quote status

**Form Fields:**
- Destination (autocomplete)
- Travel dates (date picker)
- Number of travelers (adults/children)
- Budget range (slider)
- Trip type (leisure, business, honeymoon, etc.)
- Accommodation preference (budget, standard, luxury)
- Special requirements (textarea)
- Contact preference (email, phone, WhatsApp)

---

### 6. **My Profile** 👤
**What customers can do:**
- View/edit personal information
- Update contact details
- Manage emergency contacts
- Add/edit passport information
- Set travel preferences
- Change password
- Update notification preferences
- Upload profile photo

**Profile Sections:**
- Basic Information (name, email, phone)
- Address
- Emergency Contact
- Passport Details (for international travel)
- Travel Preferences (dietary, accessibility, seat preference)
- Communication Preferences

---

### 7. **Notifications & Messages** 🔔
**What customers receive:**
- Booking confirmations
- Payment receipts
- Quote status updates
- Upcoming trip reminders
- Special offers
- Agent messages

**Features:**
- Notification bell with unread count
- Notification dropdown
- Full notifications page
- Mark as read
- Filter by type

---

### 8. **Documents & Downloads** 📄
**What customers can download:**
- Booking vouchers (PDF)
- Invoices (PDF)
- Itinerary PDFs
- Travel insurance documents
- Visa documents (if applicable)

---

## 🎨 UI/UX Design Approach

### Color Scheme
- **Primary**: Blue (#3B82F6) - Trust, reliability
- **Success**: Green (#10B981) - Confirmed bookings
- **Warning**: Yellow (#F59E0B) - Pending items
- **Danger**: Red (#EF4444) - Overdue, cancelled
- **Neutral**: Gray - Text and backgrounds

### Layout Structure
```
┌─────────────────────────────────────────┐
│  Header (Logo, Nav, Profile, Logout)   │
├────────┬────────────────────────────────┤
│        │                                │
│ Side   │   Main Content Area            │
│ Nav    │   - Dashboard                  │
│        │   - Bookings                   │
│ Links: │   - Invoices                   │
│ - Home │   - Request Quote              │
│ - Book │   - Profile                    │
│ - Inv  │   - Help                       │
│ - Quot │                                │
│ - Prof │                                │
│        │                                │
└────────┴────────────────────────────────┘
```

### Mobile Responsive
- Collapsible sidebar (hamburger menu)
- Stack cards vertically
- Touch-friendly buttons
- Swipeable cards for bookings

---

## 🔧 Technical Architecture

### Frontend Structure
```
frontend/src/
├── pages/
│   └── customer/
│       ├── Login.jsx
│       ├── Register.jsx
│       ├── Dashboard.jsx
│       ├── Bookings.jsx
│       ├── BookingDetails.jsx
│       ├── Invoices.jsx
│       ├── InvoiceDetails.jsx
│       ├── RequestQuote.jsx
│       ├── Profile.jsx
│       └── Notifications.jsx
├── layouts/
│   └── CustomerLayout.jsx
├── services/
│   ├── customerAPI.js
│   ├── customerBookingAPI.js
│   └── customerInvoiceAPI.js
└── components/
    └── customer/
        ├── BookingCard.jsx
        ├── InvoiceCard.jsx
        ├── ItineraryTimeline.jsx
        └── UpcomingTrips.jsx
```

### Backend Structure
```
backend/src/
├── controllers/
│   └── customerPortal/
│       ├── customerAuthController.js
│       ├── customerDashboardController.js
│       ├── customerBookingController.js
│       ├── customerInvoiceController.js
│       └── customerProfileController.js
├── routes/
│   └── customerPortalRoutes.js
└── middleware/
    └── customerAuth.js
```

### API Endpoints
```
Customer Auth:
POST   /api/v1/customer/auth/register
POST   /api/v1/customer/auth/login
POST   /api/v1/customer/auth/logout
POST   /api/v1/customer/auth/forgot-password
POST   /api/v1/customer/auth/reset-password
GET    /api/v1/customer/auth/verify-email/:token

Customer Dashboard:
GET    /api/v1/customer/dashboard/summary
GET    /api/v1/customer/dashboard/upcoming-trips

Customer Bookings:
GET    /api/v1/customer/bookings
GET    /api/v1/customer/bookings/:id
GET    /api/v1/customer/bookings/:id/voucher
POST   /api/v1/customer/bookings/:id/cancel

Customer Invoices:
GET    /api/v1/customer/invoices
GET    /api/v1/customer/invoices/:id
GET    /api/v1/customer/invoices/:id/pdf
GET    /api/v1/customer/payments

Customer Quotes:
POST   /api/v1/customer/quotes/request
GET    /api/v1/customer/quotes
GET    /api/v1/customer/quotes/:id

Customer Profile:
GET    /api/v1/customer/profile
PUT    /api/v1/customer/profile
PUT    /api/v1/customer/profile/password
PUT    /api/v1/customer/profile/preferences
```

---

## 📦 Implementation Phases

### Phase H.1: Foundation (Core Setup)
- [ ] Customer authentication (register, login, password reset)
- [ ] Customer layout with navigation
- [ ] Dashboard overview page
- [ ] Route protection middleware

**Estimated Time:** 3-4 hours

---

### Phase H.2: Bookings Module
- [ ] List all bookings with filters
- [ ] Booking details page
- [ ] Itinerary timeline component
- [ ] Download voucher functionality

**Estimated Time:** 3-4 hours

---

### Phase H.3: Invoices Module
- [ ] List all invoices with filters
- [ ] Invoice details page
- [ ] Payment history
- [ ] Download invoice PDF

**Estimated Time:** 2-3 hours

---

### Phase H.4: Quote Request
- [ ] Quote request form
- [ ] Form validation
- [ ] Submit quote request
- [ ] View quote status

**Estimated Time:** 2-3 hours

---

### Phase H.5: Profile & Settings
- [ ] Profile view/edit form
- [ ] Change password
- [ ] Travel preferences
- [ ] Passport information

**Estimated Time:** 2-3 hours

---

### Phase H.6: Notifications
- [ ] Notification bell component
- [ ] Notification list
- [ ] Mark as read
- [ ] Notification preferences

**Estimated Time:** 2 hours

---

### Phase H.7: Polish & Testing
- [ ] Mobile responsive design
- [ ] Loading states
- [ ] Error handling
- [ ] Empty states
- [ ] E2E testing

**Estimated Time:** 2-3 hours

---

## 🎯 Key Features Priority

### Must Have (MVP)
1. ✅ Customer login/registration
2. ✅ View bookings list
3. ✅ View booking details
4. ✅ View invoices list
5. ✅ View invoice details
6. ✅ Request quote
7. ✅ Basic profile management

### Nice to Have
- Download documents (vouchers, invoices)
- Itinerary timeline visualization
- Notifications system
- Profile photo upload
- Travel preferences
- Booking cancellation

### Future Enhancements
- Live chat with agent
- Payment gateway integration
- Trip reviews and ratings
- Loyalty points system
- Travel blog/tips section
- Multi-currency support

---

## 🚀 Getting Started

Let's start with **Phase H.1: Foundation**

I'll build:
1. Customer authentication pages (Login, Register)
2. Customer layout with navigation
3. Customer dashboard
4. Backend API endpoints for customer auth

Ready to start? Just say "**Let's build it!**" and I'll begin! 🎉

---

## 📝 Notes

- All customer data must be filtered by tenantId for multi-tenancy
- Customers can only see their own data
- Use JWT tokens with shorter expiry (7 days)
- Email verification recommended for security
- Add rate limiting for login attempts
- Consider adding 2FA for enhanced security

