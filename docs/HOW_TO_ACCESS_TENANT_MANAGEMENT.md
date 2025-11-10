# 🔐 How to Access Tenant Management

## Quick Answer

**Tenant Management is accessible only to users with `super_admin` role.**

---

## 📋 Step-by-Step Access Guide

### Option 1: Login with Default Super Admin Account

Your system already has a super admin account created by the seed script:

**Login Credentials:**
```
Email: admin@travelcrm.com
Password: Admin@123
Role: super_admin
```

**Steps:**
1. Go to your login page: `http://localhost:5173/login`
2. Enter email: `admin@travelcrm.com`
3. Enter password: `Admin@123`
4. Click "Login"
5. You should see **"Tenant Management"** in the left sidebar
6. Click "Tenant Management" to access the tenant pages

---

### Option 2: Create a New Super Admin Account

If the default account doesn't exist or you want to create a new super admin:

#### Method A: Run the Seed Script

1. **Navigate to backend folder:**
   ```powershell
   cd C:\Users\dell\Desktop\Travel-crm\backend
   ```

2. **Run the seed script:**
   ```powershell
   node src/scripts/seed.js
   ```

   This will create:
   - Super Admin: `admin@travelcrm.com` / `Admin@123`
   - Operator: `operator@travelcrm.com` / `Operator@123`
   - Agent: `agent@travelcrm.com` / `Agent@123`
   - Supplier: `supplier@travelcrm.com` / `Supplier@123`

#### Method B: Create Super Admin Manually via MongoDB

1. **Connect to MongoDB:**
   ```powershell
   mongosh
   ```

2. **Switch to your database:**
   ```javascript
   use travel-crm
   ```

3. **Find your tenant ID:**
   ```javascript
   db.tenants.findOne({}, {_id: 1})
   // Copy the _id value
   ```

4. **Create super admin user:**
   ```javascript
   // Replace YOUR_TENANT_ID with actual tenant ID
   db.users.insertOne({
     tenantId: ObjectId("YOUR_TENANT_ID"),
     name: "Super Administrator",
     email: "superadmin@example.com",
     password: "$2a$10$YourHashedPasswordHere", // You'll need to hash this
     role: "super_admin",
     phone: "+1234567890",
     isActive: true,
     emailVerified: true,
     createdAt: new Date(),
     updatedAt: new Date()
   })
   ```

   **Note:** For the password, you'll need to hash it. You can use the registration endpoint or create a quick script.

#### Method C: Update Existing User Role to Super Admin

1. **Connect to MongoDB:**
   ```powershell
   mongosh
   use travel-crm
   ```

2. **Update your user role:**
   ```javascript
   // Find your user first
   db.users.findOne({ email: "your-email@example.com" })
   
   // Update role to super_admin
   db.users.updateOne(
     { email: "your-email@example.com" },
     { $set: { role: "super_admin" } }
   )
   ```

3. **Verify the update:**
   ```javascript
   db.users.findOne({ email: "your-email@example.com" }, { role: 1, name: 1, email: 1 })
   ```

4. **Logout and login again** to refresh your session with the new role.

---

## 🎯 Verification Checklist

After logging in as super_admin, verify you have access:

### ✅ Check Sidebar Menu
You should see these menu items (super_admin specific):
- [ ] Dashboard
- [ ] Agents
- [ ] Customers
- [ ] Suppliers
- [ ] Itineraries
- [ ] Quotes
- [ ] Bookings
- [ ] Analytics
- [ ] **Tenant Management** ⭐ (This is what you're looking for!)
- [ ] Audit Logs

### ✅ Access Tenant Management URLs
Navigate to these URLs directly:
- `http://localhost:5173/tenants` - Tenant list page
- `http://localhost:5173/tenants/create` - Create tenant page

### ✅ Check User Role Display
- Look at the top of the sidebar
- Under "Travel CRM" title
- Should show: **"SUPER_ADMIN"** or **"SUPER ADMIN"**

---

## 🚨 Troubleshooting

### Problem: "Tenant Management" not showing in sidebar

**Solution 1: Check your role**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Type: `localStorage.getItem('user')`
4. Check if `role` is `"super_admin"`

**Solution 2: Clear cache and re-login**
1. Logout completely
2. Clear browser cache (Ctrl + Shift + Delete)
3. Close browser
4. Reopen and login again

**Solution 3: Check the code**
1. Open: `frontend/src/components/Sidebar.jsx`
2. Look for the Tenant Management section:
   ```javascript
   {
     name: 'Tenant Management',
     path: '/tenants',
     icon: FiSettings,
     roles: ['super_admin'], // ← Must include super_admin
   }
   ```

### Problem: Getting 403 Forbidden errors

**Solution:** Your token doesn't have super_admin role
1. Logout
2. Login with the super admin account
3. Or update your user role in database (see Method C above)

### Problem: Tenant Management page shows blank/errors

**Solution 1: Check backend is running**
```powershell
netstat -ano | findstr :5000
```
Should show port 5000 is listening.

**Solution 2: Check API connection**
1. Open browser DevTools
2. Go to Network tab
3. Navigate to `/tenants`
4. Check if API call to `http://localhost:5000/api/v1/tenants` succeeds

**Solution 3: Check CORS settings**
- Backend should allow `http://localhost:5173`
- Check `backend/src/server.js` CORS configuration

---

## 📊 What You'll See

Once you access Tenant Management successfully:

### Tenant List Page
- Table showing all tenants
- Search and filter options
- "Create Tenant" button (top right)
- Each tenant shows:
  - Name and subdomain
  - Owner details
  - Subscription plan (Free/Basic/Professional/Enterprise)
  - Status badge (Active/Trial/Suspended/Inactive)
  - Actions: View, Stats

### Create Tenant Form
- Tenant Information section
- Owner Account section
- Subscription Plan selection
- Default Settings (currency, timezone, language)

### Tenant Detail Page
- View/Edit tenant information
- Owner details
- Subscription management
- Suspend/Activate actions
- Delete tenant option (danger zone)

---

## 💡 Quick Test

**1. Check if you're super_admin:**
```javascript
// In browser console (F12)
const user = JSON.parse(localStorage.getItem('user') || '{}');
console.log('Your role:', user.role);
console.log('Is super_admin?', user.role === 'super_admin');
```

**2. Test tenant API directly:**
```javascript
// In browser console
fetch('http://localhost:5000/api/v1/tenants', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(r => r.json())
.then(data => console.log('Tenants:', data))
.catch(err => console.error('Error:', err));
```

---

## 🎓 Summary

**To access Tenant Management:**

1. ✅ **Login with super_admin role**
   - Default: `admin@travelcrm.com` / `Admin@123`
   - Or create/update a user to have `super_admin` role

2. ✅ **Look for "Tenant Management" in sidebar**
   - Should appear between "Analytics" and "Audit Logs"

3. ✅ **Click to access:**
   - `/tenants` - List all tenants
   - `/tenants/create` - Create new tenant
   - `/tenants/:id` - View/edit specific tenant

**If you don't see it:**
- Check your user role is `super_admin`
- Clear cache and re-login
- Update user role in database if needed

---

## 📞 Need More Help?

If you still can't access Tenant Management:

1. **Check what role you currently have:**
   ```powershell
   # In MongoDB
   mongosh
   use travel-crm
   db.users.findOne({ email: "YOUR_EMAIL" }, { role: 1, name: 1, email: 1 })
   ```

2. **Check if seed script created the super admin:**
   ```powershell
   cd backend
   node src/scripts/seed.js
   ```

3. **Verify frontend files exist:**
   - `frontend/src/pages/tenants/TenantList.jsx`
   - `frontend/src/pages/tenants/CreateTenant.jsx`
   - `frontend/src/pages/tenants/TenantDetail.jsx`
   - `frontend/src/services/tenantAPI.js`

---

**Last Updated:** November 8, 2025  
**Your Role Required:** super_admin  
**Default Login:** admin@travelcrm.com / Admin@123
