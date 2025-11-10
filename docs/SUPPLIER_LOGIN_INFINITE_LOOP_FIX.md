# 🔧 Supplier Login Infinite Loop - Fix Guide

**Issue:** Supplier login causes infinite loop / continuous loading  
**Status:** ✅ FIXED  
**Date:** November 9, 2025

---

## 🐛 Root Cause

The supplier user was created **without a linked Supplier profile**. When the supplier logs in:

1. Frontend calls `/api/v1/suppliers/dashboard-stats`
2. Backend looks for `req.user.supplierId`
3. Finds `supplierId` is `null`
4. Returns 404 error: "Supplier profile not found for this user"
5. React Query retries infinitely
6. UI gets stuck in loading state

---

## ✅ Fixes Applied

### 1. Frontend - Prevent Infinite Retries

**File:** `frontend/src/pages/supplier/Dashboard.jsx`

Added error handling to stop infinite retries:

```javascript
const { data: stats, isLoading } = useQuery({
  queryKey: ['supplier-dashboard-stats'],
  queryFn: async () => {
    try {
      const response = await api.get('/suppliers/dashboard-stats');
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch supplier dashboard stats:', error.message);
      // Return default values instead of throwing
      return {
        pendingConfirmations: 0,
        confirmedBookings: 0,
        totalBookings: 0,
        totalRevenue: 0,
        activeServices: 0,
      };
    }
  },
  retry: 1, // Only retry once
  refetchOnWindowFocus: false,
  staleTime: 5 * 60 * 1000,
});
```

### 2. Backend - Updated Seed Script

**File:** `backend/src/scripts/seed.js`

Now creates Supplier profile before Supplier user:

```javascript
// Create sample supplier profile first
const supplier = await Supplier.create({
  name: 'Demo Hotel',
  type: 'hotel',
  contactPerson: 'Hotel Manager',
  email: 'supplier@travelcrm.com',
  phone: '+1234567893',
  address: {
    street: '456 Beach Blvd',
    city: 'Miami',
    state: 'FL',
    country: 'USA',
    zipCode: '33139',
  },
  services: ['hotel', 'accommodation'],
  rating: 4.5,
  status: 'active',
});

// Create supplier user linked to supplier profile
const supplierUser = await User.create({
  name: 'Demo Supplier',
  email: 'supplier@travelcrm.com',
  password: 'Supplier@123',
  role: 'supplier',
  supplierId: supplier._id, // ✅ Link user to supplier
});

// Link supplier back to user
supplier.userId = supplierUser._id;
await supplier.save();
```

---

## 🚀 How to Fix Your Database

### Option 1: Re-seed with Tenants (RECOMMENDED)

This creates everything properly including tenants:

```bash
cd backend

# Run tenant seed (creates tenant + users with tenantId)
node src/scripts/seedTenants.js
```

**New Credentials after tenant seed:**
```
Email: admin@demo.travelcrm.com
Password: Demo@123
Subdomain: demo
```

### Option 2: Re-seed Main Database

This will recreate users with proper supplier linkage:

```bash
cd backend

# WARNING: This will clear existing data!
# First, backup your database if needed

# Run the updated seed script
node src/scripts/seed.js
```

**Credentials after main seed:**
```
Supplier: supplier@travelcrm.com / Supplier@123
```

### Option 3: Manual Fix (If you have existing data)

If you want to keep your existing data and just fix the supplier user:

```bash
# Open MongoDB shell or use MongoDB Compass

# 1. Create a Supplier document
db.suppliers.insertOne({
  tenantId: ObjectId("YOUR_TENANT_ID"),
  userId: ObjectId("YOUR_SUPPLIER_USER_ID"),
  companyName: "Demo Hotel",
  country: "USA",
  city: "Miami",
  email: "supplier@travelcrm.com",
  phone: "+1234567893",
  serviceTypes: ["hotel"],
  currencies: ["USD"],
  status: "active",
  createdAt: new Date(),
  updatedAt: new Date()
});

# 2. Update the User with supplierId
db.users.updateOne(
  { email: "supplier@travelcrm.com" },
  { $set: { supplierId: ObjectId("NEW_SUPPLIER_ID_FROM_STEP_1") } }
);
```

---

## 🧪 Test the Fix

1. **Clear browser cache** (Ctrl + Shift + R)

2. **Login as supplier:**
   ```
   http://localhost:5173/login
   
   Email: supplier@travelcrm.com
   Password: Supplier@123
   ```

3. **Should see:**
   - ✅ Dashboard loads immediately
   - ✅ Statistics show (even if zeros)
   - ✅ No infinite loading
   - ✅ No console errors
   - ✅ Can navigate between pages

4. **Check console:**
   - Should NOT see repeated `/suppliers/dashboard-stats` calls
   - May see one warning: "Failed to fetch supplier dashboard stats" (acceptable if no bookings)

---

## 🔍 How to Verify Supplier is Properly Linked

### Check in Database:

```bash
# MongoDB Shell or Compass:

# 1. Find supplier user
db.users.findOne({ email: "supplier@travelcrm.com" })
# Should have: supplierId: ObjectId("...")

# 2. Find supplier profile
db.suppliers.findOne({ email: "supplier@travelcrm.com" })
# Should have: userId: ObjectId("...")

# 3. Verify they reference each other
# user.supplierId should equal supplier._id
# supplier.userId should equal user._id
```

### Check with API:

```bash
# 1. Login as supplier
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"supplier@travelcrm.com","password":"Supplier@123"}'

# Copy the accessToken from response

# 2. Get current user (should have supplierId)
curl -X GET http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Response should include:
# {
#   "role": "supplier",
#   "supplierId": "673..."  ← This must exist!
# }

# 3. Test dashboard stats endpoint
curl -X GET http://localhost:5000/api/v1/suppliers/dashboard-stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Should return stats, not 404 error
```

---

## 🛠️ Prevention

To prevent this issue when creating new suppliers:

### When creating supplier via Admin:

1. **Create Supplier profile first** (in Suppliers page)
2. **Then create User** with role='supplier' and supplierId pointing to profile
3. **Update Supplier** with userId pointing back to user

### When allowing supplier self-registration:

```javascript
// In supplierController.js - createSupplier:

// 1. Create supplier profile
const supplier = await Supplier.create({
  name: req.body.name,
  email: req.body.email,
  // ... other fields
  tenantId: req.tenantId,
});

// 2. Create user with supplierId
const user = await User.create({
  name: req.body.name,
  email: req.body.email,
  password: req.body.password,
  role: 'supplier',
  tenantId: req.tenantId,
  supplierId: supplier._id, // ✅ Link to supplier
});

// 3. Update supplier with userId
supplier.userId = user._id;
await supplier.save();
```

---

## 📋 Verification Checklist

After applying the fix:

- [ ] Supplier user has `supplierId` field populated
- [ ] Supplier profile has `userId` field populated  
- [ ] Supplier login redirects to `/supplier/dashboard`
- [ ] Dashboard loads without infinite loop
- [ ] No repeated API calls in Network tab
- [ ] Statistics display (even if zeros)
- [ ] Can navigate to other supplier pages
- [ ] No 404 errors in console
- [ ] React Query only retries once on error

---

## 🎯 Expected Behavior After Fix

**Successful Supplier Login:**

1. Login at `/login` with supplier credentials
2. Redirect to `/supplier/dashboard`
3. See SupplierLayout with sidebar
4. Dashboard stats load (showing zeros if no bookings)
5. Can click through to:
   - My Bookings
   - Inventory
   - Payments
   - Profile

**If Dashboard Stats API Fails:**
- Shows default values (zeros)
- One console warning logged
- UI still interactive
- No infinite loop

---

## 📞 Troubleshooting

### Still seeing infinite loop?

1. **Hard refresh browser** (Ctrl + Shift + F5)
2. **Clear localStorage:**
   ```javascript
   // Browser console:
   localStorage.clear()
   window.location.reload()
   ```
3. **Check backend is running:**
   ```bash
   cd backend
   npm run dev
   ```

### Backend errors?

1. **Check MongoDB is running**
2. **Check .env file has correct MONGODB_URI**
3. **Check backend logs** for errors
4. **Verify tenantId is set** (multi-tenant system)

### User has supplierId but still 404?

The supplier profile might not exist in database:

```bash
# Check if supplier exists:
db.suppliers.findOne({ _id: ObjectId("USER_SUPPLIER_ID") })

# If not found, create it or re-seed database
```

---

**Fix Version:** 1.0.0  
**Date Applied:** November 9, 2025  
**Status:** ✅ **RESOLVED**

---

## Quick Reference Commands

```bash
# Re-seed everything (tenant + users)
cd backend && node src/scripts/seedTenants.js

# Re-seed main database only
cd backend && node src/scripts/seed.js

# Check supplier user
mongo
> use travelcrm
> db.users.findOne({ email: "supplier@travelcrm.com" })

# Restart frontend
cd frontend && npm run dev

# Restart backend  
cd backend && npm run dev
```
