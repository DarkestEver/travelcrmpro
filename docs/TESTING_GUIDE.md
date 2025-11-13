# 🧪 Testing Guide - All Features

## ✅ Feature Testing Status

### 1. Share Links 404 Fix - READY TO TEST ✨

**What Was Fixed:**
- Changed URL construction from `/shared/` to `/share/`
- Updated both ShareModal components

**Test Steps:**
1. **Refresh your browser** (Ctrl+F5 or Cmd+Shift+R)
2. Go to any Quote, Booking, or Itinerary
3. Click "Share" button
4. Generate a share link
5. Copy the generated URL
6. Verify URL format: `http://localhost:5174/share/quote/[token]`
7. Open link in new incognito window
8. **Result:** Should display the shared content (no more 404!)

**Test Single-Use Links:**
1. Generate share link with "Single-use" enabled
2. Open link → Should work
3. Refresh page → Should show "Link Already Used" error

---

### 2. Quote → Booking Conversion - READY TO TEST ✨

**Test Steps:**
1. Go to Quotes page
2. Find a quote with status = "accepted"
3. Click "Convert to Booking" button
4. **Result:** Booking should be created successfully

---

### 3. Assignments API - READY TO TEST ✨

**Backend Endpoints Available:**
```
POST   /api/v1/assignments
GET    /api/v1/assignments/my-assignments
GET    /api/v1/assignments/entity/:type/:id
GET    /api/v1/assignments/:id
PATCH  /api/v1/assignments/:id
PATCH  /api/v1/assignments/:id/status
PATCH  /api/v1/assignments/:id/reassign
DELETE /api/v1/assignments/:id
```

**Test with Browser Console:**
```javascript
// Open browser console (F12)

// 1. Create assignment
const response = await fetch('http://localhost:5000/api/v1/assignments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  },
  body: JSON.stringify({
    entityType: 'Quote',
    entityId: '673c2f94e97dcc6dc6d44e18', // Replace with real ID
    assignedTo: '67358bd9be8c3698e4e57c04', // Replace with real user ID
    priority: 'high',
    notes: 'Test assignment from API'
  })
});

const assignment = await response.json();
console.log('✅ Assignment created:', assignment);

// 2. Get my assignments
const myResponse = await fetch('http://localhost:5000/api/v1/assignments/my-assignments', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
});

const myAssignments = await myResponse.json();
console.log('✅ My assignments:', myAssignments);
```

---

### 4. Expenses API - READY TO TEST ✨

**Backend Endpoints Available:**
```
POST   /api/v1/expenses
GET    /api/v1/expenses
GET    /api/v1/expenses/summary
GET    /api/v1/expenses/:type/:id
GET    /api/v1/expenses/:id
PATCH  /api/v1/expenses/:id
POST   /api/v1/expenses/:id/mark-paid
POST   /api/v1/expenses/:id/approve
POST   /api/v1/expenses/:id/reject
DELETE /api/v1/expenses/:id
```

**Test with Browser Console:**
```javascript
// Open browser console (F12)

// 1. Create expense
const response = await fetch('http://localhost:5000/api/v1/expenses', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  },
  body: JSON.stringify({
    entityType: 'Quote',
    entityId: '673c2f94e97dcc6dc6d44e18', // Replace with real ID
    category: 'flights',
    description: 'Delhi to Paris flights',
    amount: 50000,
    currency: 'INR',
    supplierName: 'Air India'
  })
});

const expense = await response.json();
console.log('✅ Expense created:', expense);

// 2. Get expenses for quote
const entityResponse = await fetch('http://localhost:5000/api/v1/expenses/Quote/673c2f94e97dcc6dc6d44e18', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
});

const expenses = await entityResponse.json();
console.log('✅ Expenses:', expenses);

// 3. Get summary
const summaryResponse = await fetch('http://localhost:5000/api/v1/expenses/summary', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
});

const summary = await summaryResponse.json();
console.log('✅ Summary:', summary);
```

---

## 🎯 Quick Test Checklist

### Immediate Tests (UI):
- [ ] Refresh browser and test share links (should work now!)
- [ ] Test single-use magic links
- [ ] Test quote-to-booking conversion

### API Tests (Browser Console):
- [ ] Create an assignment
- [ ] Get my assignments
- [ ] Create an expense
- [ ] Get expenses for a quote
- [ ] Get expense summary

### Expected Results:
✅ All share links work (no 404)  
✅ Single-use links expire after first access  
✅ Quote converts to booking successfully  
✅ Assignment API creates and retrieves data  
✅ Expense API creates and retrieves data

---

## 🐛 Troubleshooting

### If Share Links Still Show 404:
1. **Hard refresh browser:** Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
2. **Clear browser cache**
3. **Check URL format:** Should be `/share/quote/...` not `/shared/quote/...`
4. **Restart frontend:** Stop and restart the frontend dev server

### If Backend Returns 500 Error:
1. Check backend logs in terminal
2. Verify you're logged in (valid access token)
3. Replace placeholder IDs with real IDs from your database

### If Backend Not Running:
```bash
cd backend
npm run dev
```

**Backend should show:**
```
📚 Swagger documentation available at http://localhost:5000/api-docs
```

---

## ✅ Success Indicators

**You'll know everything is working when:**

1. ✅ Share link opens without 404 error
2. ✅ Single-use link shows "already used" on second access
3. ✅ Quote converts to booking with success toast
4. ✅ Assignment API returns `{ success: true, data: {...} }`
5. ✅ Expense API returns `{ success: true, data: {...} }`

---

## 📝 Notes

- **Backend:** Already running on port 5000
- **Frontend:** Running on port 5174
- **Models:** QueryAssignment and QueryExpense ready in database
- **Routes:** All endpoints registered and active
- **Authentication:** All API calls require valid JWT token

**Everything is ready to test! 🎉**
