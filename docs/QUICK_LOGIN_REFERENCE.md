# 🎯 Quick Login Reference Card

**Travel CRM - Authentication Quick Reference**

---

## 🔑 Login Endpoints (Quick Copy)

### Main Portal (Super Admin, Operator, Agent, Supplier)
```
POST http://localhost:5000/api/v1/auth/login
```

### Customer Portal
```
POST http://localhost:5000/api/v1/customer/auth/login
```

---

## 👤 Demo Credentials

### 1. Super Admin
```json
{
  "email": "admin@travelcrm.com",
  "password": "Admin@123"
}
```
**Frontend:** http://localhost:5174/login

---

### 2. Operator
```json
{
  "email": "operator@travelcrm.com",
  "password": "Operator@123"
}
```
**Frontend:** http://localhost:5174/login

---

### 3. Agent
```json
{
  "email": "agent@travelcrm.com",
  "password": "Agent@123"
}
```
**Frontend:** http://localhost:5174/login

---

### 4. Supplier
```json
{
  "email": "supplier@travelcrm.com",
  "password": "Supplier@123"
}
```
**Frontend:** http://localhost:5174/login

---

### 5. Customer
```json
{
  "email": "customer@email.com",
  "password": "Customer@123"
}
```
**Frontend:** http://localhost:5174/customer/login

---

## 🚀 Quick Test Commands

### Login as Super Admin
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@travelcrm.com","password":"Admin@123"}'
```

### Login as Customer
```bash
curl -X POST http://localhost:5000/api/v1/customer/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@email.com","password":"Customer@123"}'
```

### Get Current User
```bash
curl -X GET http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📋 All Available Endpoints

### Main Portal Auth
- ✅ `POST /api/v1/auth/register` - Register new user
- ✅ `POST /api/v1/auth/login` - Login
- ✅ `GET /api/v1/auth/me` - Get current user
- ✅ `POST /api/v1/auth/refresh` - Refresh token
- ✅ `POST /api/v1/auth/logout` - Logout
- ✅ `POST /api/v1/auth/forgot-password` - Forgot password
- ✅ `POST /api/v1/auth/reset-password/:token` - Reset password
- ✅ `POST /api/v1/auth/change-password` - Change password

### Customer Portal Auth
- ✅ `POST /api/v1/customer/auth/register` - Customer register
- ✅ `POST /api/v1/customer/auth/login` - Customer login
- ✅ `GET /api/v1/customer/auth/me` - Get customer profile
- ✅ `POST /api/v1/customer/auth/logout` - Customer logout
- ✅ `POST /api/v1/customer/auth/forgot-password` - Forgot password
- ✅ `POST /api/v1/customer/auth/reset-password/:token` - Reset password
- ✅ `GET /api/v1/customer/auth/verify-email/:token` - Verify email

---

## 📖 Full Documentation

**See:** `/docs/LOGIN_ENDPOINTS_AND_CREDENTIALS.md`

For detailed information including:
- Complete API examples
- Request/response formats
- Token management
- Security notes
- Troubleshooting guide
- Postman collection

---

**Quick Tip:** Bookmark this page for fast reference! 🔖
