# 🔐 Login Endpoints & Demo Credentials

**Travel CRM System**  
**Version:** 1.0.0  
**Date:** November 9, 2025  
**Environment:** Development & Production

---

## 📋 Table of Contents

1. [API Endpoints Overview](#api-endpoints-overview)
2. [Main Portal Authentication](#main-portal-authentication)
3. [Customer Portal Authentication](#customer-portal-authentication)
4. [Demo Credentials](#demo-credentials)
5. [API Request Examples](#api-request-examples)
6. [Frontend URLs](#frontend-urls)
7. [Postman Collection](#postman-collection)

---

## 🌐 API Endpoints Overview

### Base URLs

**Development:**
```
Backend API: http://localhost:5000/api/v1
Frontend:    http://localhost:5173
```

**Production:**
```
Backend API: https://api.yourdomain.com/api/v1
Frontend:    https://yourdomain.com
```

---

## 🔑 Main Portal Authentication

### Endpoints for: Super Admin, Operator, Agent, Supplier

**Base Path:** `/api/v1/auth`

### 1. Register (Public)
```
POST /api/v1/auth/register
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password@123",
  "role": "agent",
  "phone": "+1234567890",
  "tenantId": "tenant_id_here"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "agent",
      "status": "pending"
    },
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

---

### 2. Login (Public)
```
POST /api/v1/auth/login
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "Admin@123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "super_admin",
      "tenantId": "tenant_id",
      "status": "active"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 3. Get Current User (Protected)
```
GET /api/v1/auth/me
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "super_admin",
    "tenantId": "tenant_id",
    "status": "active",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

---

### 4. Refresh Token (Public)
```
POST /api/v1/auth/refresh
POST /api/v1/auth/refresh-token
Content-Type: application/json
```

**Request Body:**
```json
{
  "refreshToken": "your_refresh_token"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "new_access_token",
    "refreshToken": "new_refresh_token"
  }
}
```

---

### 5. Logout (Protected)
```
POST /api/v1/auth/logout
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### 6. Forgot Password (Public)
```
POST /api/v1/auth/forgot-password
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

---

### 7. Reset Password (Public)
```
POST /api/v1/auth/reset-password/:token
Content-Type: application/json
```

**Request Body:**
```json
{
  "password": "NewPassword@123"
}
```

---

### 8. Change Password (Protected)
```
POST /api/v1/auth/change-password
PUT /api/v1/auth/change-password
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "currentPassword": "OldPassword@123",
  "newPassword": "NewPassword@123"
}
```

---

## 👤 Customer Portal Authentication

### Endpoints for: Customers Only

**Base Path:** `/api/v1/customer/auth`

### 1. Customer Register (Public)
```
POST /api/v1/customer/auth/register
Content-Type: application/json
```

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "password": "Password@123",
  "agentId": "agent_id_optional",
  "tenantId": "tenant_id"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Customer registered successfully",
  "data": {
    "customer": {
      "_id": "customer_id",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@example.com",
      "status": "active"
    },
    "token": "jwt_token"
  }
}
```

---

### 2. Customer Login (Public)
```
POST /api/v1/customer/auth/login
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "customer@example.com",
  "password": "Customer@123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "customer": {
      "_id": "customer_id",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "customer@example.com",
      "phone": "+1234567890",
      "status": "active"
    },
    "token": "jwt_customer_token"
  }
}
```

---

### 3. Get Customer Profile (Protected)
```
GET /api/v1/customer/auth/me
Authorization: Bearer {customerToken}
```

---

### 4. Customer Logout (Protected)
```
POST /api/v1/customer/auth/logout
Authorization: Bearer {customerToken}
```

---

### 5. Customer Forgot Password (Public)
```
POST /api/v1/customer/auth/forgot-password
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "customer@example.com"
}
```

---

### 6. Customer Reset Password (Public)
```
POST /api/v1/customer/auth/reset-password/:token
Content-Type: application/json
```

**Request Body:**
```json
{
  "password": "NewPassword@123"
}
```

---

### 7. Customer Verify Email (Public)
```
GET /api/v1/customer/auth/verify-email/:token
```

---

## 🎭 Demo Credentials

### Development Environment Test Users

### 1️⃣ Super Admin
```
Email:    admin@travelcrm.com
Password: Admin@123
Role:     super_admin
Access:   Full system access
```

**Login Endpoint:** `POST /api/v1/auth/login`

**Frontend URL:** `http://localhost:5173/login`

**Features:**
- ✅ Dashboard
- ✅ Agents Management
- ✅ Customers Management
- ✅ Suppliers Management
- ✅ Itineraries
- ✅ Quotes
- ✅ Bookings
- ✅ Analytics
- ✅ Tenant Management
- ✅ Audit Logs
- ✅ Tenant Settings

---

### 2️⃣ Operator
```
Email:    operator@travelcrm.com
Password: Operator@123
Role:     operator
Access:   Operations management
```

**Login Endpoint:** `POST /api/v1/auth/login`

**Frontend URL:** `http://localhost:5173/login`

**Features:**
- ✅ Dashboard
- ✅ Agents Management
- ✅ Customers Management
- ✅ Suppliers Management
- ✅ Itineraries
- ✅ Itinerary Builder
- ✅ Quotes
- ✅ Bookings
- ✅ Analytics
- ✅ Tenant Settings

---

### 3️⃣ Agent
```
Email:    agent@travelcrm.com
Password: Agent@123
Role:     agent
Access:   Agent portal
```

**Login Endpoint:** `POST /api/v1/auth/login`

**Frontend URL:** `http://localhost:5173/login`

**Features:**
- ✅ Agent Dashboard
- ✅ My Customers
- ✅ Quote Requests
- ✅ Bookings
- ✅ Commissions
- ✅ Payments
- ✅ Invoices
- ✅ Reports
- ✅ Sub-Users
- ✅ Notifications

---

### 4️⃣ Supplier
```
Email:    supplier@hotel.com
Password: Supplier@123
Role:     supplier
Access:   Supplier portal
```

**Login Endpoint:** `POST /api/v1/auth/login`

**Frontend URL:** `http://localhost:5173/login`

**Features:**
- ✅ Supplier Dashboard
- ✅ Bookings
- ✅ Inventory
- ✅ Payments
- ✅ Profile

---

### 5️⃣ Finance Manager
```
Email:    finance@travelcrm.com
Password: Finance@123
Role:     finance
Access:   Finance portal
```

**Login Endpoint:** `POST /api/v1/auth/login`

**Frontend URL:** `http://localhost:5174/login`

**Features:**
- ✅ Finance Dashboard
- ✅ Payment Processing
- ✅ Invoice Management
- ✅ Tax Settings
- ✅ Payment Reconciliation
- ✅ Financial Reports
- ✅ Refund Management
- ✅ Disbursement Tracking

---

### 6️⃣ Customer
```
Email:    customer@email.com
Password: Customer@123
Role:     customer
Access:   Customer portal
```

**Login Endpoint:** `POST /api/v1/customer/auth/login`

**Frontend URL:** `http://localhost:5174/customer/login`

**Features:**
- ✅ Customer Dashboard
- ✅ My Bookings
- ✅ Booking Details
- ✅ Invoices
- ✅ Request Quote
- ✅ Profile
- ✅ Notifications

---

## 📝 API Request Examples

### Using cURL

#### 1. Main Portal Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@travelcrm.com",
    "password": "Admin@123"
  }'
```

#### 2. Customer Portal Login
```bash
curl -X POST http://localhost:5000/api/v1/customer/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@email.com",
    "password": "Customer@123"
  }'
```

#### 3. Get Current User (Protected)
```bash
curl -X GET http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### 4. Refresh Token
```bash
curl -X POST http://localhost:5000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

#### 5. Logout
```bash
curl -X POST http://localhost:5000/api/v1/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### Using JavaScript (Axios)

```javascript
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/v1';

// 1. Main Portal Login
const mainLogin = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password
    });
    
    // Store tokens
    localStorage.setItem('accessToken', response.data.data.accessToken);
    localStorage.setItem('refreshToken', response.data.data.refreshToken);
    
    return response.data;
  } catch (error) {
    console.error('Login failed:', error.response?.data);
    throw error;
  }
};

// 2. Customer Portal Login
const customerLogin = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/customer/auth/login`, {
      email,
      password
    });
    
    // Store customer token
    localStorage.setItem('customerToken', response.data.data.token);
    
    return response.data;
  } catch (error) {
    console.error('Customer login failed:', error.response?.data);
    throw error;
  }
};

// 3. Get Current User (with token)
const getCurrentUser = async () => {
  const token = localStorage.getItem('accessToken');
  
  try {
    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Get user failed:', error.response?.data);
    throw error;
  }
};

// 4. Logout
const logout = async () => {
  const token = localStorage.getItem('accessToken');
  
  try {
    await axios.post(`${API_URL}/auth/logout`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Clear tokens
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  } catch (error) {
    console.error('Logout failed:', error.response?.data);
    throw error;
  }
};
```

---

### Using Postman

**Environment Variables:**
```
base_url = http://localhost:5000/api/v1
access_token = (will be set automatically after login)
```

**Collection Structure:**

```
Travel CRM API
├── Auth
│   ├── Login (POST /auth/login)
│   ├── Register (POST /auth/register)
│   ├── Get Current User (GET /auth/me)
│   ├── Refresh Token (POST /auth/refresh)
│   ├── Logout (POST /auth/logout)
│   ├── Forgot Password (POST /auth/forgot-password)
│   ├── Reset Password (POST /auth/reset-password/:token)
│   └── Change Password (POST /auth/change-password)
│
└── Customer Auth
    ├── Customer Login (POST /customer/auth/login)
    ├── Customer Register (POST /customer/auth/register)
    ├── Get Customer Profile (GET /customer/auth/me)
    ├── Customer Logout (POST /customer/auth/logout)
    ├── Customer Forgot Password (POST /customer/auth/forgot-password)
    └── Customer Reset Password (POST /customer/auth/reset-password/:token)
```

---

## 🌐 Frontend URLs

### Development (localhost:5173)

#### Main Portal (Super Admin, Operator, Agent, Supplier)
```
Login:        http://localhost:5173/login
Register:     http://localhost:5173/register
Dashboard:    http://localhost:5173/dashboard (after login)
```

#### Customer Portal
```
Login:        http://localhost:5173/customer/login
Register:     http://localhost:5173/customer/register
Dashboard:    http://localhost:5173/customer/dashboard (after login)
```

---

### Production URLs

Replace `localhost:5173` with your production domain:

```
Main Login:     https://yourdomain.com/login
Customer Login: https://yourdomain.com/customer/login
```

---

## 📦 Postman Collection

### Import Instructions

1. **Download Collection:**
   - File: `backend/postman_collection.json`
   - Located in backend directory

2. **Import to Postman:**
   - Open Postman
   - Click "Import"
   - Select `postman_collection.json`
   - Click "Import"

3. **Set Environment:**
   ```
   Variable: base_url
   Value: http://localhost:5000/api/v1
   ```

4. **Test Login:**
   - Go to "Auth" → "Login"
   - Use demo credentials
   - Token will be saved automatically

---

## 🔒 Security Notes

### Token Management

**Access Token:**
- Expires in: 15 minutes
- Storage: localStorage
- Header: `Authorization: Bearer {token}`

**Refresh Token:**
- Expires in: 7 days
- Storage: localStorage (secure)
- Used to get new access token

### Best Practices

1. ✅ Always use HTTPS in production
2. ✅ Store tokens securely
3. ✅ Implement token refresh logic
4. ✅ Clear tokens on logout
5. ✅ Validate token expiration
6. ✅ Handle 401 unauthorized errors
7. ✅ Don't expose tokens in URLs
8. ✅ Use secure cookies for refresh tokens (optional)

---

## 🧪 Testing Authentication

### Test Workflow

1. **Register New User:**
```bash
POST /api/v1/auth/register
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "Test@123",
  "role": "agent"
}
```

2. **Login:**
```bash
POST /api/v1/auth/login
{
  "email": "test@example.com",
  "password": "Test@123"
}
```

3. **Get User Info:**
```bash
GET /api/v1/auth/me
Authorization: Bearer {token}
```

4. **Logout:**
```bash
POST /api/v1/auth/logout
Authorization: Bearer {token}
```

---

## ❓ Troubleshooting

### Common Errors

#### 1. 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized - Invalid token"
}
```
**Solution:** Login again to get a new token

---

#### 2. 403 Forbidden
```json
{
  "success": false,
  "message": "Forbidden - Insufficient permissions"
}
```
**Solution:** User role doesn't have access to this resource

---

#### 3. 400 Bad Request (Invalid Credentials)
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```
**Solution:** Check email/password spelling

---

#### 4. 409 Conflict (User Already Exists)
```json
{
  "success": false,
  "message": "User with this email already exists"
}
```
**Solution:** Use a different email or login instead

---

## 📊 Authentication Flow Diagram

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ 1. POST /auth/login
       │    {email, password}
       ▼
┌─────────────────┐
│  Auth API       │
│  - Validate     │
│  - Generate JWT │
└──────┬──────────┘
       │
       │ 2. Return tokens
       │    {accessToken, refreshToken}
       ▼
┌─────────────┐
│   Client    │
│ Store tokens│
└──────┬──────┘
       │
       │ 3. Request with token
       │    Authorization: Bearer {token}
       ▼
┌─────────────────┐
│  Protected API  │
│  - Verify token │
│  - Return data  │
└──────┬──────────┘
       │
       │ 4. Response
       ▼
┌─────────────┐
│   Client    │
└─────────────┘
```

---

## 📞 Support

### Need Help?

- 📖 Check API documentation: `/api/v1/docs` (Swagger)
- 🐛 Report issues via issue tracker
- 📧 Email: support@travelcrm.com
- 💬 Contact development team

---

## 🔄 Change Log

### Version 1.0.0 (November 9, 2025)
- ✅ Initial documentation
- ✅ All authentication endpoints documented
- ✅ Demo credentials added
- ✅ API examples included
- ✅ Postman collection reference added

---

**Document Version:** 1.0.0  
**Last Updated:** November 9, 2025  
**Status:** ✅ Complete & Ready for Use
