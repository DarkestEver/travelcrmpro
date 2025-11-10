# Customer Portal Testing Guide

## Quick Start

### 1. Prerequisites
- Backend server running on `http://localhost:5000`
- Frontend server running on `http://localhost:5174`
- MongoDB running
- At least one tenant exists in database

### 2. Customer Registration

**URL:** `http://localhost:5174/customer/register?tenant=YOUR_TENANT_ID`

**Test Data:**
```json
{
  "firstName": "Sarah",
  "lastName": "Johnson",
  "email": "sarah@example.com",
  "phone": "+1234567890",
  "password": "password123",
  "tenantId": "YOUR_TENANT_ID"
}
```

**Expected Result:**
- ✅ Account created successfully
- ✅ Welcome email sent (if email service configured)
- ✅ Auto-login and redirect to dashboard
- ✅ Token saved in localStorage
- ✅ User info saved in localStorage

### 3. Customer Login

**URL:** `http://localhost:5174/customer/login?tenant=YOUR_TENANT_ID`

**Test Credentials:**
- Email: `sarah@example.com`
- Password: `password123`
- Tenant ID: `YOUR_TENANT_ID`

**Expected Result:**
- ✅ Login successful
- ✅ Redirect to `/customer/dashboard`
- ✅ Token stored in localStorage as `customerToken`
- ✅ User data stored in localStorage as `customerUser`

### 4. Customer Dashboard

**URL:** `http://localhost:5174/customer/dashboard`

**Expected Features:**
- ✅ Welcome header with user name
- ✅ 4 stat cards:
  - Total Bookings
  - Upcoming Trips  
  - Pending Invoices
  - Outstanding Balance
- ✅ Upcoming trips section (if customer has bookings)
- ✅ Recent activity feed
- ✅ Quick actions sidebar
- ✅ Responsive design (test on mobile)

### 5. Navigation

**Test the sidebar navigation:**
- ✅ Dashboard (active state highlight)
- ✅ My Bookings (placeholder - will be built in Phase H.4)
- ✅ Invoices (placeholder - will be built in Phase H.5)
- ✅ Request Quote (placeholder - will be built in Phase H.6)
- ✅ My Profile (placeholder - will be built in Phase H.7)
- ✅ Logout button (clears auth and redirects to login)

### 6. Mobile Responsiveness

**Test on mobile viewport:**
- ✅ Hamburger menu icon appears
- ✅ Sidebar slides in from left
- ✅ Backdrop appears when sidebar open
- ✅ Clicking backdrop closes sidebar
- ✅ Stats cards stack vertically
- ✅ Dashboard layout adjusts for mobile

## API Endpoint Testing

### Registration
```bash
curl -X POST http://localhost:5000/api/v1/customer/auth/register \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: YOUR_TENANT_ID" \
  -d '{
    "firstName": "Sarah",
    "lastName": "Johnson",
    "email": "sarah@example.com",
    "phone": "+1234567890",
    "password": "password123",
    "tenantId": "YOUR_TENANT_ID"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/v1/customer/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: YOUR_TENANT_ID" \
  -d '{
    "email": "sarah@example.com",
    "password": "password123",
    "tenantId": "YOUR_TENANT_ID"
  }'
```

### Dashboard Summary (Protected)
```bash
curl -X GET http://localhost:5000/api/v1/customer/dashboard/summary \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Tenant-ID: YOUR_TENANT_ID"
```

### Upcoming Trips (Protected)
```bash
curl -X GET http://localhost:5000/api/v1/customer/dashboard/upcoming-trips \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Tenant-ID: YOUR_TENANT_ID"
```

### Recent Activity (Protected)
```bash
curl -X GET http://localhost:5000/api/v1/customer/dashboard/recent-activity \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Tenant-ID: YOUR_TENANT_ID"
```

## Common Issues & Solutions

### Issue: "Tenant ID is required"
**Solution:** Make sure to include `?tenant=YOUR_TENANT_ID` in the URL or provide it in the form

### Issue: "Invalid credentials"
**Solution:** 
- Verify email and password are correct
- Check that customer has `portalAccess: true`
- Ensure customer `status` is `active`

### Issue: "Token expired"
**Solution:** Login again to get a new token (tokens expire after 7 days)

### Issue: Dashboard shows no data
**Solution:** This is expected if the customer has no bookings/invoices yet. Empty states are shown with call-to-action buttons.

### Issue: 401 Unauthorized on protected routes
**Solution:**
- Check that token is present in Authorization header
- Verify token hasn't expired
- Ensure customer still exists and is active

## Testing Checklist

### Authentication Flow
- [ ] Can register new customer
- [ ] Registration validates all fields
- [ ] Registration shows error for duplicate email
- [ ] Can login with valid credentials
- [ ] Login shows error for invalid credentials
- [ ] Login requires tenant ID
- [ ] Token is stored after login
- [ ] Logout clears token and redirects

### Dashboard Display
- [ ] Dashboard loads without errors
- [ ] Stats cards show correct data
- [ ] Stats cards link to appropriate pages
- [ ] Upcoming trips display correctly
- [ ] Recent activity feed works
- [ ] Empty states show when no data
- [ ] Quick actions buttons work

### Navigation
- [ ] Sidebar navigation works
- [ ] Active route is highlighted
- [ ] Mobile menu opens and closes
- [ ] Logout button works
- [ ] Protected routes redirect if not authenticated
- [ ] Public routes redirect if authenticated

### Security
- [ ] Password is hashed in database
- [ ] Token required for protected routes
- [ ] Token expires after 7 days
- [ ] Customer role verified
- [ ] Portal access checked
- [ ] Account status validated
- [ ] Tenant ID filtered on all queries

## Next Steps

After Phase H.1 is tested and working:
1. **Phase H.4:** Build bookings list and details pages
2. **Phase H.5:** Build invoices list and payment pages
3. **Phase H.6:** Build quote request form
4. **Phase H.7:** Build profile management page
5. **Phase H.8:** Integrate notification system for customers

## Support

If you encounter any issues:
1. Check browser console for errors
2. Check backend server logs
3. Verify MongoDB connection
4. Ensure all environment variables are set
5. Clear localStorage and try again

Happy Testing! 🎉
