# 🧪 API Testing Guide - Travel CRM Backend

## 📚 API Documentation

### Swagger UI (Interactive Documentation)
**URL**: http://localhost:5000/api-docs

The Swagger UI provides:
- ✅ Complete API endpoint documentation
- ✅ Interactive "Try it out" functionality
- ✅ Request/response schemas
- ✅ Authentication testing
- ✅ Example requests and responses

### Swagger JSON Spec
**URL**: http://localhost:5000/api-docs.json

---

## 🚀 Quick Start Testing

### 1. Access Swagger Documentation
```bash
# Make sure backend is running
cd backend
npm run dev

# Then open in browser:
http://localhost:5000/api-docs
```

### 2. Authenticate in Swagger
1. Click the "Authorize" button (🔒 icon)
2. Login first to get a token:
   - Use `/auth/login` endpoint
   - Email: `admin@travelcrm.com`
   - Password: `Admin@123`
3. Copy the `accessToken` from response
4. Paste in Authorization field as: `Bearer <your-token>`
5. Click "Authorize"
6. Now you can test all protected endpoints!

---

## 📋 API Endpoints Summary

### Authentication Endpoints (Public)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login user |
| POST | `/auth/refresh` | Refresh access token |
| GET | `/auth/verify-email/:token` | Verify email |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password/:token` | Reset password |

### Authentication Endpoints (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/logout` | Logout user |
| POST | `/auth/change-password` | Change password |
| GET | `/auth/me` | Get current user |
| PUT | `/auth/me` | Update profile |

### Agents API
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/agents` | Get all agents | ✅ |
| GET | `/agents/:id` | Get agent by ID | ✅ |
| POST | `/agents` | Create agent | ✅ Admin/Operator |
| PUT | `/agents/:id` | Update agent | ✅ Admin/Operator |
| DELETE | `/agents/:id` | Delete agent | ✅ Admin |
| PATCH | `/agents/:id/approve` | Approve agent | ✅ Admin/Operator |
| PATCH | `/agents/:id/suspend` | Suspend agent | ✅ Admin/Operator |
| PATCH | `/agents/:id/reactivate` | Reactivate agent | ✅ Admin/Operator |
| GET | `/agents/:id/stats` | Get agent statistics | ✅ |

### Customers API
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/customers` | Get all customers | ✅ |
| GET | `/customers/:id` | Get customer by ID | ✅ |
| POST | `/customers` | Create customer | ✅ |
| PUT | `/customers/:id` | Update customer | ✅ |
| DELETE | `/customers/:id` | Delete customer | ✅ Admin |
| POST | `/customers/:id/notes` | Add note to customer | ✅ |
| GET | `/customers/:id/stats` | Get customer stats | ✅ |
| POST | `/customers/bulk-import` | Bulk import customers | ✅ Admin/Operator |

### Suppliers API
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/suppliers` | Get all suppliers | ✅ |
| GET | `/suppliers/:id` | Get supplier by ID | ✅ |
| POST | `/suppliers` | Create supplier | ✅ |
| PUT | `/suppliers/:id` | Update supplier | ✅ |
| DELETE | `/suppliers/:id` | Delete supplier | ✅ Admin |
| PATCH | `/suppliers/:id/approve` | Approve supplier | ✅ Admin/Operator |
| PATCH | `/suppliers/:id/suspend` | Suspend supplier | ✅ Admin/Operator |
| PATCH | `/suppliers/:id/reactivate` | Reactivate supplier | ✅ Admin/Operator |
| PATCH | `/suppliers/:id/rating` | Update rating | ✅ |
| GET | `/suppliers/:id/stats` | Get supplier stats | ✅ |

### Itineraries API
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/itineraries` | Get all itineraries | ✅ |
| GET | `/itineraries/templates` | Get templates | ✅ |
| GET | `/itineraries/:id` | Get itinerary by ID | ✅ |
| POST | `/itineraries` | Create itinerary | ✅ |
| PUT | `/itineraries/:id` | Update itinerary | ✅ |
| DELETE | `/itineraries/:id` | Delete itinerary | ✅ |
| POST | `/itineraries/:id/duplicate` | Duplicate itinerary | ✅ |
| PATCH | `/itineraries/:id/archive` | Archive itinerary | ✅ |
| PATCH | `/itineraries/:id/publish-template` | Publish as template | ✅ Operator/Admin |
| GET | `/itineraries/:id/calculate-cost` | Calculate cost | ✅ |

### Quotes API
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/quotes` | Get all quotes | ✅ |
| GET | `/quotes/:id` | Get quote by ID | ✅ |
| POST | `/quotes` | Create quote | ✅ |
| PUT | `/quotes/:id` | Update quote | ✅ |
| DELETE | `/quotes/:id` | Delete quote | ✅ |
| POST | `/quotes/:id/send` | Send quote to customer | ✅ |
| PATCH | `/quotes/:id/accept` | Accept quote | ✅ |
| PATCH | `/quotes/:id/reject` | Reject quote | ✅ |
| GET | `/quotes/stats` | Get quote statistics | ✅ |

### Bookings API
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/bookings` | Get all bookings | ✅ |
| GET | `/bookings/:id` | Get booking by ID | ✅ |
| POST | `/bookings` | Create booking | ✅ |
| PUT | `/bookings/:id` | Update booking | ✅ |
| POST | `/bookings/:id/payment` | Add payment | ✅ |
| PATCH | `/bookings/:id/confirm` | Confirm booking | ✅ Operator/Admin |
| PATCH | `/bookings/:id/cancel` | Cancel booking | ✅ |
| PATCH | `/bookings/:id/complete` | Complete booking | ✅ |
| GET | `/bookings/stats` | Get booking statistics | ✅ |

### Analytics API
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/analytics/dashboard` | Dashboard stats | ✅ |
| GET | `/analytics/revenue` | Revenue report | ✅ Admin/Operator |
| GET | `/analytics/agent-performance` | Agent performance | ✅ Admin/Operator |
| GET | `/analytics/booking-trends` | Booking trends | ✅ Admin/Operator |
| GET | `/analytics/customer-insights` | Customer insights | ✅ Admin/Operator |

---

## 🧪 Testing Workflow

### Test Sequence 1: Authentication Flow
```bash
1. Register new user → POST /auth/register
2. Login → POST /auth/login → Save token
3. Get current user → GET /auth/me
4. Update profile → PUT /auth/me
5. Change password → POST /auth/change-password
6. Logout → POST /auth/logout
```

### Test Sequence 2: Customer Management
```bash
1. Login as Admin → POST /auth/login
2. Create customer → POST /customers
3. Get all customers → GET /customers
4. Get customer by ID → GET /customers/:id
5. Update customer → PUT /customers/:id
6. Add note → POST /customers/:id/notes
7. Get stats → GET /customers/:id/stats
8. Delete customer → DELETE /customers/:id
```

### Test Sequence 3: Booking Flow
```bash
1. Login as Agent → POST /auth/login
2. Create customer → POST /customers
3. Create itinerary → POST /itineraries
4. Create quote → POST /quotes
5. Send quote → POST /quotes/:id/send
6. Accept quote → PATCH /quotes/:id/accept
7. Create booking → POST /bookings
8. Add payment → POST /bookings/:id/payment
9. Confirm booking → PATCH /bookings/:id/confirm
10. Get booking stats → GET /bookings/stats
```

### Test Sequence 4: Analytics & Reports
```bash
1. Login as Admin → POST /auth/login
2. Dashboard analytics → GET /analytics/dashboard
3. Revenue report → GET /analytics/revenue
4. Agent performance → GET /analytics/agent-performance
5. Booking trends → GET /analytics/booking-trends
```

---

## 🔑 Demo Accounts for Testing

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@travelcrm.com | Admin@123 |
| **Operator** | operator@travelcrm.com | Operator@123 |
| **Agent** | agent@travelcrm.com | Agent@123 |

---

## 📊 Postman Collection

### Import Collection
1. Open Postman
2. Click "Import"
3. Select file: `backend/postman_collection.json`
4. Collection will be imported with all endpoints

### Environment Variables
Set these variables in Postman:
```
baseUrl: http://localhost:5000/api/v1
token: (will be auto-set after login)
```

### Auto-Authentication
The login requests automatically save the token to environment variables!

---

## 🧪 Manual Testing Examples

### 1. Test Login (cURL)
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@travelcrm.com",
    "password": "Admin@123"
  }'
```

### 2. Test Get Customers (cURL)
```bash
# First, get token from login response
TOKEN="your-token-here"

curl -X GET http://localhost:5000/api/v1/customers \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Test Create Customer (cURL)
```bash
curl -X POST http://localhost:5000/api/v1/customers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer",
    "email": "test@example.com",
    "phone": "+1234567890",
    "company": "Test Corp"
  }'
```

---

## ✅ Test Checklist

### Authentication Tests
- [ ] Register new user
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (should fail)
- [ ] Access protected route without token (should fail)
- [ ] Access protected route with token (should succeed)
- [ ] Refresh token
- [ ] Logout
- [ ] Change password

### CRUD Tests (for each entity)
- [ ] Create new record
- [ ] Get all records (with pagination)
- [ ] Get single record by ID
- [ ] Update record
- [ ] Delete record
- [ ] Search/filter records

### Authorization Tests
- [ ] Admin can access all endpoints
- [ ] Operator can access operator endpoints
- [ ] Agent can only access agent endpoints
- [ ] Agent cannot access admin endpoints

### Error Handling Tests
- [ ] Invalid input validation
- [ ] Missing required fields
- [ ] Invalid ID format
- [ ] Resource not found (404)
- [ ] Duplicate records (409)
- [ ] Unauthorized access (401)
- [ ] Forbidden access (403)

### Performance Tests
- [ ] Rate limiting (exceed 100 requests)
- [ ] Large payload handling
- [ ] Pagination with large datasets
- [ ] Multiple concurrent requests

---

## 🐛 Common Issues & Solutions

### Issue: 401 Unauthorized
**Solution**: 
- Make sure you're logged in
- Check token is correct
- Token might be expired (login again)

### Issue: 403 Forbidden
**Solution**:
- Check user role permissions
- Admin/Operator/Agent have different access levels

### Issue: 404 Not Found
**Solution**:
- Check endpoint URL is correct
- Verify record ID exists in database

### Issue: 500 Internal Server Error
**Solution**:
- Check backend console for error details
- Verify MongoDB is running
- Check data validation

---

## 📈 Expected Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

---

## 🎯 Next Steps

1. **Open Swagger UI**: http://localhost:5000/api-docs
2. **Test Authentication**: Login and get token
3. **Test CRUD Operations**: Create, Read, Update, Delete
4. **Test Business Logic**: Booking flow, payments, reports
5. **Import Postman Collection**: For automated testing
6. **Run Integration Tests**: See E2E_TESTING_PLAN.md

---

## 📚 Additional Resources

- **Swagger Docs**: http://localhost:5000/api-docs
- **Postman Collection**: `backend/postman_collection.json`
- **API Routes**: `backend/src/routes/`
- **Controllers**: `backend/src/controllers/`
- **Models**: `backend/src/models/`

Happy Testing! 🚀
