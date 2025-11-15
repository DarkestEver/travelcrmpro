# Travel CRM Pro - User Manual
## Part 1: Getting Started Guide

**Version**: 2.1.0  
**Last Updated**: November 15, 2025  
**Document**: 1 of 14

---

## Table of Contents

1. [Introduction](#introduction)
2. [System Requirements](#system-requirements)
3. [Installation](#installation)
4. [Initial Setup](#initial-setup)
5. [System Architecture](#system-architecture)
6. [Accessing the System](#accessing-the-system)
7. [First Time Login](#first-time-login)
8. [Dashboard Overview](#dashboard-overview)

---

## 1. Introduction

### 1.1 What is Travel CRM Pro?

Travel CRM Pro is a comprehensive, multi-tenant B2B travel operations platform designed to streamline and automate travel business management. It provides end-to-end functionality for managing:

- **Customer Relationships**: Complete CRM with customer profiles, communication history
- **Bookings & Reservations**: Full booking lifecycle management
- **Quotes & Itineraries**: Interactive itinerary builder with drag-and-drop functionality
- **Financial Management**: Invoicing, payments, bank reconciliation, multi-currency
- **Supplier Management**: Inventory, rate sheets, automated sync
- **Agent Portal**: Dedicated workspace for travel agents
- **Customer Portal**: Self-service portal for end customers
- **Email Automation**: AI-powered email processing and management
- **Analytics & Forecasting**: Demand forecasting, performance analytics
- **System Monitoring**: Performance tracking, health monitoring, alerts

### 1.2 Key Features

✅ **Multi-Tenant Architecture**: Support multiple travel agencies/businesses  
✅ **Role-Based Access Control**: 6 user roles with granular permissions  
✅ **AI-Powered Email Processing**: Automatically process booking emails  
✅ **Real-Time Synchronization**: Live inventory sync with suppliers  
✅ **Multi-Currency Support**: Handle transactions in multiple currencies  
✅ **Mobile Responsive**: Works on desktop, tablet, and mobile devices  
✅ **Comprehensive Analytics**: Business intelligence and forecasting  
✅ **Automated Workflows**: Streamlined processes with minimal manual work  
✅ **Secure & Compliant**: Bank-level security with audit trails  

### 1.3 Who Should Use This Manual?

This manual is designed for:

- **System Administrators**: Setting up and managing the platform
- **Travel Agency Owners**: Understanding capabilities and business value
- **Operators/Staff**: Day-to-day operations and customer management
- **Finance Teams**: Managing payments, invoices, and reconciliation
- **Travel Agents**: Using the agent portal
- **Suppliers**: Managing inventory and bookings
- **Developers**: API integration and customization

---

## 2. System Requirements

### 2.1 Server Requirements

#### Minimum Requirements
- **CPU**: 2 cores / 2.5 GHz
- **RAM**: 4 GB
- **Storage**: 20 GB SSD
- **OS**: Ubuntu 20.04 LTS / Windows Server 2019 / macOS 10.15+

#### Recommended Requirements (Production)
- **CPU**: 4+ cores / 3.0 GHz
- **RAM**: 8+ GB
- **Storage**: 50+ GB SSD
- **OS**: Ubuntu 22.04 LTS
- **Network**: 100 Mbps+ connection

### 2.2 Software Requirements

#### Backend
- **Node.js**: v18.x or v20.x
- **MongoDB**: v6.0 or v7.0
- **Redis**: v7.0+ (for caching)
- **PM2**: v5.x (for process management)

#### Frontend
- **Node.js**: v18.x or v20.x
- **Modern Web Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### 2.3 Client Requirements

#### Desktop/Laptop
- **Processor**: Intel Core i3 or equivalent
- **RAM**: 4 GB minimum, 8 GB recommended
- **Display**: 1366x768 minimum, 1920x1080 recommended
- **Browser**: 
  - Chrome 90+ (Recommended)
  - Firefox 88+
  - Safari 14+
  - Edge 90+
- **Internet**: 5 Mbps minimum, 10+ Mbps recommended

#### Mobile/Tablet
- **iOS**: 13.0 or later (iPhone 6s and newer)
- **Android**: 8.0 or later
- **Browser**: Chrome Mobile, Safari Mobile, Firefox Mobile
- **Internet**: 4G/LTE or WiFi connection

### 2.4 Network Requirements

- **Firewall Ports**:
  - Backend API: Port 5000 (or custom)
  - Frontend Web: Port 5173 (development) / 80, 443 (production)
  - MongoDB: Port 27017 (internal only)
  - Redis: Port 6379 (internal only)
  
- **SSL Certificate**: Required for production (Let's Encrypt or commercial)

---

## 3. Installation

### 3.1 Prerequisites

Before installing, ensure you have:

1. ✅ Server with required specifications
2. ✅ Node.js and npm installed
3. ✅ MongoDB installed and running
4. ✅ Redis installed and running (optional but recommended)
5. ✅ Domain name configured (for production)
6. ✅ SSL certificate (for production)

### 3.2 Installation Steps

#### Step 1: Clone Repository

```bash
# Clone the repository
git clone https://github.com/DarkestEver/travelcrmpro.git

# Navigate to project directory
cd travelcrmpro
```

#### Step 2: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file with your configuration
nano .env
```

**Required Environment Variables:**

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=mongodb://localhost:27017/travelcrm
MONGODB_TEST_URI=mongodb://localhost:27017/travelcrm_test

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRE=7d

# Redis (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@yourcompany.com

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Stripe Payment (Optional)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# AI/OpenAI (Optional)
OPENAI_API_KEY=sk-...
```

#### Step 3: Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file
nano .env
```

**Frontend Environment Variables:**

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Travel CRM Pro

# Stripe Public Key (Optional)
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

#### Step 4: Database Initialization

```bash
# Go back to backend directory
cd ../backend

# Run database migrations/seeds
npm run seed

# Or start server (will auto-create collections)
npm start
```

#### Step 5: Start Services

**Development Mode:**

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**Production Mode:**

```bash
# Backend with PM2
cd backend
pm2 start ecosystem.config.js

# Frontend (build and serve)
cd frontend
npm run build
npm install -g serve
serve -s dist -l 3000
```

### 3.3 Docker Installation (Alternative)

```bash
# Using Docker Compose
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 3.4 Verification

After installation, verify everything is working:

1. **Backend Health Check**:
   ```bash
   curl http://localhost:5000/api/health
   # Expected: {"status": "ok"}
   ```

2. **Frontend Access**:
   - Open browser: `http://localhost:5173`
   - You should see the login page

3. **Database Connection**:
   ```bash
   mongosh
   use travelcrm
   db.users.countDocuments()
   # Should return 0 or more
   ```

---

## 4. Initial Setup

### 4.1 Create Super Admin Account

The first user registered will automatically become the Super Admin:

1. Go to `http://localhost:5173/register`
2. Fill in the registration form:
   - **Full Name**: Your name
   - **Email**: admin@yourcompany.com
   - **Password**: Strong password (min 8 characters)
   - **Company Name**: Your company name
3. Click "Register"
4. Check your email for verification (if enabled)
5. Login with your credentials

### 4.2 Tenant Configuration

After first login as Super Admin:

1. Navigate to **Settings** → **Tenant Settings**
2. Configure your organization:
   - Company Name
   - Logo (upload image)
   - Primary Color
   - Contact Information
   - Business Hours
   - Time Zone
   - Currency

### 4.3 Create User Accounts

Create accounts for your team:

1. Go to **Users** → **Add User**
2. Select user role:
   - **Operator**: Full access (staff members)
   - **Agent**: Travel agents
   - **Finance**: Finance team
   - **Supplier**: Supplier accounts
   - **Customer**: End customers
3. Fill in user details
4. Set permissions
5. Send invitation email

### 4.4 Email Configuration

Configure email accounts for automation:

1. Go to **Settings** → **Email Accounts**
2. Click **Add Email Account**
3. Enter IMAP/SMTP details:
   - Email address
   - IMAP host/port
   - SMTP host/port
   - Username/password
4. Test connection
5. Enable AI processing (optional)
6. Save configuration

### 4.5 Payment Gateway Setup

Configure Stripe for payments:

1. Go to **Settings** → **Payment Settings**
2. Enter Stripe API keys:
   - Public Key
   - Secret Key
   - Webhook Secret
3. Configure payment methods
4. Set currency
5. Test with Stripe test mode
6. Enable live mode when ready

### 4.6 Supplier Integration

Add suppliers to the system:

1. Go to **Suppliers** → **Add Supplier**
2. Enter supplier details:
   - Name
   - Contact information
   - API credentials (if available)
   - Commission rates
3. Configure inventory sync
4. Set up rate sheets
5. Test connection

---

## 5. System Architecture

### 5.1 Technology Stack

**Frontend:**
- React 18.x
- TanStack Query (React Query) v4
- React Router v6
- Tailwind CSS v3
- Chart.js v4
- React Icons

**Backend:**
- Node.js / Express.js
- MongoDB (Database)
- Redis (Caching)
- JWT (Authentication)
- Socket.io (Real-time)

**Infrastructure:**
- Docker (Containerization)
- PM2 (Process Management)
- Nginx (Reverse Proxy)
- Let's Encrypt (SSL)

### 5.2 System Components

```
┌─────────────────────────────────────────┐
│         Client Browser/Mobile           │
│  (React Frontend - Port 5173/3000)     │
└────────────────┬────────────────────────┘
                 │ HTTPS/WSS
                 ▼
┌─────────────────────────────────────────┐
│           Nginx/Load Balancer           │
│         (Reverse Proxy - Port 80/443)   │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│         Node.js Backend API             │
│        (Express - Port 5000)            │
│  ┌─────────────────────────────────┐   │
│  │ Authentication & Authorization  │   │
│  │ Business Logic & Controllers    │   │
│  │ Email Processing (AI)           │   │
│  │ Payment Processing              │   │
│  │ File Upload/Download            │   │
│  │ WebSocket Server                │   │
│  └─────────────────────────────────┘   │
└───┬──────────────┬────────────────┬─────┘
    │              │                │
    ▼              ▼                ▼
┌────────┐   ┌──────────┐    ┌──────────┐
│MongoDB │   │  Redis   │    │ External │
│Database│   │  Cache   │    │   APIs   │
│Port    │   │Port 6379 │    │(Stripe,  │
│27017   │   │          │    │ Email)   │
└────────┘   └──────────┘    └──────────┘
```

### 5.3 Database Schema

Key Collections:
- `users`: User accounts
- `tenants`: Tenant/company information
- `customers`: Customer records
- `agents`: Travel agent profiles
- `suppliers`: Supplier information
- `itineraries`: Travel itineraries
- `bookings`: Booking records
- `quotes`: Quote requests
- `invoices`: Invoice records
- `payments`: Payment transactions
- `emails`: Email records
- `auditlogs`: System audit trail

---

## 6. Accessing the System

### 6.1 URL Structure

**Development:**
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`

**Production:**
- Frontend: `https://yourcompany.com`
- Backend API: `https://api.yourcompany.com`

### 6.2 Login URLs by User Type

Each user type has a dedicated portal:

1. **Super Admin / Operator**:
   - URL: `https://yourcompany.com/login`
   - Access: Full system access

2. **Travel Agent**:
   - URL: `https://yourcompany.com/agent/login`
   - Access: Agent portal only

3. **Customer**:
   - URL: `https://yourcompany.com/customer/login`
   - Access: Customer portal only

4. **Supplier**:
   - URL: `https://yourcompany.com/supplier/login`
   - Access: Supplier portal only

5. **Finance**:
   - URL: `https://yourcompany.com/login`
   - Access: Finance module access

### 6.3 Browser Compatibility

✅ **Fully Supported:**
- Chrome 90+ (Best experience)
- Firefox 88+
- Safari 14+
- Edge 90+

⚠️ **Limited Support:**
- Internet Explorer: Not supported
- Opera: Should work but not tested

---

## 7. First Time Login

### 7.1 Login Process

1. **Navigate to Login Page**:
   - Go to `https://yourcompany.com/login`

2. **Enter Credentials**:
   - Email: Your registered email
   - Password: Your password

3. **Two-Factor Authentication** (if enabled):
   - Enter verification code from email/SMS

4. **Dashboard Redirect**:
   - You'll be redirected based on your role:
     - Super Admin → Admin Dashboard
     - Operator → Operations Dashboard
     - Agent → Agent Dashboard
     - Customer → Customer Dashboard
     - Supplier → Supplier Dashboard
     - Finance → Finance Dashboard

### 7.2 Forgot Password

If you forget your password:

1. Click **"Forgot Password?"** on login page
2. Enter your registered email
3. Check your email for reset link
4. Click the link (valid for 1 hour)
5. Enter new password
6. Confirm new password
7. Click **"Reset Password"**
8. Login with new credentials

### 7.3 Session Management

- **Session Duration**: 7 days (default)
- **Auto Logout**: After 30 minutes of inactivity
- **Remember Me**: Keeps you logged in for 30 days
- **Multiple Devices**: You can login from multiple devices
- **Force Logout**: Admin can force logout from all devices

---

## 8. Dashboard Overview

### 8.1 Dashboard Components

All dashboards include:

1. **Top Navigation Bar**:
   - Logo/Brand
   - Quick search
   - Notifications bell (with count)
   - User profile menu

2. **Sidebar Menu**:
   - Navigation links
   - Collapsible sections
   - Role-based menu items
   - Active page indicator

3. **Main Content Area**:
   - Page title and breadcrumbs
   - Action buttons
   - Data tables/cards
   - Charts and graphs

4. **Footer**:
   - Copyright information
   - Version number
   - Quick links

### 8.2 Dashboard by Role

#### Super Admin Dashboard
- Total tenants
- Total users
- System health
- Recent activity
- Audit logs summary
- Performance metrics

#### Operator Dashboard
- Total customers
- Total bookings
- Revenue today/month
- Pending quotes
- Recent bookings
- Quick actions

#### Agent Dashboard
- My customers
- My bookings
- Commission earned
- Pending quotes
- Recent activity
- Quick quote request

#### Customer Dashboard
- My bookings
- Upcoming trips
- Past trips
- Saved itineraries
- Invoices
- Request new quote

#### Supplier Dashboard
- Inventory status
- Recent bookings
- Pending payments
- Inventory alerts
- Performance stats

#### Finance Dashboard
- Revenue overview
- Pending payments
- Bank reconciliation status
- Outstanding invoices
- Payment methods
- Financial reports

### 8.3 Common Interface Elements

**Search Bar**:
- Global search across all modules
- Press `/` to focus
- Supports filters
- Shows recent searches

**Notifications**:
- Real-time updates
- Click bell icon to view
- Mark as read/unread
- Filter by type
- Clear all option

**User Menu** (Top right):
- Profile settings
- Change password
- Preferences
- Help & Support
- Logout

**Quick Actions**:
- Accessible from dashboard
- Create new record
- Upload file
- Generate report
- Common tasks

---

## 9. Next Steps

Now that you've completed the initial setup, proceed to the next sections:

📖 **Part 2**: [User Roles & Permissions Guide](USER_MANUAL_02_USER_ROLES.md)  
📖 **Part 3**: [Authentication & Account Management](USER_MANUAL_03_AUTHENTICATION.md)  
📖 **Part 4**: [Super Admin Guide](USER_MANUAL_04_SUPER_ADMIN.md)

---

## 10. Quick Reference

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `/` | Focus search bar |
| `Ctrl+K` / `⌘K` | Quick command |
| `Ctrl+N` / `⌘N` | Create new (context-dependent) |
| `Esc` | Close modal/dialog |
| `Alt+N` | Open notifications |
| `Alt+P` | Open profile menu |

### Support & Help

- **Documentation**: `https://yourcompany.com/docs`
- **Support Email**: `support@yourcompany.com`
- **Phone**: +1 (XXX) XXX-XXXX
- **Live Chat**: Available in-app (bottom right)

### System Status

Check real-time system status:
- **Status Page**: `https://status.yourcompany.com`
- **API Health**: `https://api.yourcompany.com/health`

---

**End of Part 1: Getting Started Guide**

*Continue to Part 2: User Roles & Permissions Guide →*
