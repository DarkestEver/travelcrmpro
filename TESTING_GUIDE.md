# Quick Testing Guide - Assignments & Expenses

## 🚀 Quick Start (5 Minutes)

### 1. Start Servers
```powershell
# Terminal 1 - Backend
cd C:\Users\dell\Desktop\Travel-crm\backend
npm run dev

# Terminal 2 - Frontend
cd C:\Users\dell\Desktop\Travel-crm\frontend
npm run dev
```

### 2. Open Browser
- Navigate to: `http://localhost:5174`
- Login with your credentials

---

## 📋 Test Quotes Page (3 Minutes)

1. **Navigate**: Click "Quotes" in sidebar
2. **Open Preview**: Click 👁️ (eye icon) on any quote
3. **Test Assignments Tab**:
   - Click "Assignments" tab
   - Click "+ Create Assignment" button
   - Fill form:
     - Assign To: Select a user
     - Title: "Review quote pricing"
     - Priority: High
     - Due Date: Tomorrow
     - Notes: "Check competitor pricing"
   - Click "Create Assignment"
   - ✅ Should see new assignment in list
   - Click "Start Working" → Status changes to "In Progress"
   - Click "Complete" → Status changes to "Completed"

4. **Test Expenses Tab**:
   - Click "Expenses" tab
   - Click "+ Add Expense" button
   - Fill form:
     - Category: Hotel
     - Amount: 5000
     - Currency: INR
     - Supplier Name: "Taj Hotels"
     - Invoice Number: "INV-001"
     - Description: "Booking deposit"
   - Click "Add Expense"
   - ✅ Should see expense in list with summary cards updating
   - Click "Mark as Paid" → Payment status changes
   - Click "Approve" (if admin/finance) → Status changes to Approved

5. **Close Modal**: Click "Close"

**Expected Result**: ✅ All operations work, data persists

---

## 📋 Test Bookings Page (3 Minutes)

1. **Navigate**: Click "Bookings" in sidebar
2. **Open Details**: Click 👁️ (eye icon) on any booking
3. **Test Assignments Tab**:
   - Click "Assignments" tab
   - Create assignment: "Confirm hotel reservation"
   - Priority: Medium
   - ✅ Verify assignment appears
   - Test status workflow (Pending → In Progress → Completed)

4. **Test Expenses Tab**:
   - Click "Expenses" tab
   - Add expense: Flight booking - $1200 USD
   - Category: Flight
   - ✅ Verify expense appears in list
   - Check summary cards show correct totals
   - Test filter by category (Flight, Hotel, etc.)
   - Test filter by payment status (Pending, Paid)

5. **Close Modal**: Click "Close"

**Expected Result**: ✅ Booking tasks and expenses tracked successfully

---

## 📋 Test Email Detail Page (3 Minutes)

1. **Navigate**: Click "Emails" in sidebar
2. **Open Email**: Click any customer email to open detail
3. **Navigate to Tasks**: Click "Tasks & Expenses" tab
4. **Test Assignments Section**:
   - Scroll to "Task Assignments" section
   - Click "+ Create Assignment"
   - Create: "Follow up on inquiry"
   - Assign to: Any team member
   - ✅ Verify assignment created
   - Test reassign feature
   - Test delete (if admin)

5. **Test Expenses Section**:
   - Scroll to "Expenses" section
   - Click "+ Add Expense"
   - Add: Research costs - ₹500 INR
   - Category: Other
   - ✅ Verify expense appears
   - Check filtering works
   - Verify summary shows correct total

6. **Switch Tabs**: 
   - Click "Overview" tab
   - Click "Tasks & Expenses" tab again
   - ✅ Verify data persists (React Query caching)

**Expected Result**: ✅ Email inquiry converted to actionable tasks and expense tracking

---

## 🎯 Complete Feature Test Matrix

### Assignment Features
| Feature | Quotes | Bookings | Emails |
|---------|--------|----------|--------|
| Create Assignment | ⬜ | ⬜ | ⬜ |
| Start Working (Status Change) | ⬜ | ⬜ | ⬜ |
| Complete Task | ⬜ | ⬜ | ⬜ |
| Reassign Task | ⬜ | ⬜ | ⬜ |
| Delete Assignment | ⬜ | ⬜ | ⬜ |
| Filter by Status | ⬜ | ⬜ | ⬜ |
| Overdue Indicator | ⬜ | ⬜ | ⬜ |
| Priority Badges | ⬜ | ⬜ | ⬜ |

### Expense Features
| Feature | Quotes | Bookings | Emails |
|---------|--------|----------|--------|
| Create Expense | ⬜ | ⬜ | ⬜ |
| Edit Expense | ⬜ | ⬜ | ⬜ |
| Delete Expense | ⬜ | ⬜ | ⬜ |
| Mark as Paid | ⬜ | ⬜ | ⬜ |
| Approve Expense | ⬜ | ⬜ | ⬜ |
| Reject Expense | ⬜ | ⬜ | ⬜ |
| Filter by Category | ⬜ | ⬜ | ⬜ |
| Filter by Payment Status | ⬜ | ⬜ | ⬜ |
| Summary Cards Update | ⬜ | ⬜ | ⬜ |
| Currency Formatting | ⬜ | ⬜ | ⬜ |

---

## 🐛 Common Issues & Solutions

### Issue: Components Don't Appear
**Symptoms**: Tab shows "No assignments found" even though you haven't created any
**Solution**: This is normal! Create first assignment/expense to see data
**Action**: Click "+ Create Assignment" or "+ Add Expense"

### Issue: API 404 Errors
**Symptoms**: Console shows "Failed to fetch" or 404 errors
**Solution**: Backend not running or routes not registered
**Action**: 
```bash
cd backend
npm run dev
# Check console for "Server running on port 5000"
```

### Issue: Permission Denied
**Symptoms**: "Mark as Paid" or "Approve" buttons don't work
**Solution**: User role doesn't have permission
**Action**: Login as admin or finance user to test approval features

### Issue: Data Doesn't Persist
**Symptoms**: Refresh page and assignments/expenses disappear
**Solution**: Database not saving data
**Action**: 
- Check backend console for errors
- Verify MongoDB connection
- Check browser Network tab for failed POST requests

### Issue: Modal Too Small
**Symptoms**: Content is cramped or cut off
**Solution**: Already fixed - modals now use `size="xl"`
**Action**: Clear browser cache and refresh

### Issue: Filters Not Working
**Symptoms**: Selecting filter doesn't change displayed items
**Solution**: Check React Query cache or state updates
**Action**: Open browser DevTools → React tab → Check component state

---

## ✅ Success Criteria

### Must Pass ✅
- [ ] Create assignment on all 3 pages
- [ ] Status workflow works (pending → in-progress → completed)
- [ ] Create expense on all 3 pages
- [ ] Summary cards calculate correctly
- [ ] Tab switching preserves data
- [ ] No console errors
- [ ] Mobile responsive (test on phone or narrow browser)

### Should Pass ✅
- [ ] Reassign tasks works
- [ ] Delete operations work (with confirmation)
- [ ] Filters work correctly
- [ ] Currency formatting shows correctly (₹, $, €)
- [ ] Overdue tasks show red warning
- [ ] Priority badges color-coded (red=high, yellow=medium, green=low)

### Nice to Have ✅
- [ ] Real-time updates (open two tabs, create in one, see in other)
- [ ] Optimistic updates (UI changes before server confirms)
- [ ] Toast notifications appear
- [ ] Loading states show (spinners/skeletons)
- [ ] Error states handle gracefully

---

## 📊 Performance Benchmarks

**Expected Load Times**:
- Initial page load: < 2 seconds
- Tab switch: < 200ms
- Create assignment: < 500ms
- Fetch assignments list: < 300ms
- Create expense: < 500ms
- Fetch expenses + summary: < 400ms

**Test Command** (Browser Console):
```javascript
// Measure tab switch time
console.time('tab-switch');
// Click tab
console.timeEnd('tab-switch');
// Should be < 200ms
```

---

## 🎓 Testing Tips

1. **Use Chrome DevTools**
   - Open DevTools (F12)
   - Network tab: Monitor API calls
   - Console tab: Check for errors
   - React DevTools: Inspect component state

2. **Test Different User Roles**
   - Login as operator: Can create, update
   - Login as finance: Can approve/reject expenses
   - Login as admin: Full access

3. **Test Edge Cases**
   - Create assignment with past due date (should show overdue)
   - Create expense with 0 amount (should validate)
   - Try to delete someone else's assignment (permissions)
   - Add expense without invoice (optional field)

4. **Test Data Validation**
   - Empty title → Should show error
   - Invalid amount → Should show error
   - Missing required fields → Should prevent submit
   - Due date in past → Should allow but show warning

5. **Test Mobile View**
   - Resize browser to 375px width
   - Check modal scrolls properly
   - Verify buttons are touch-friendly
   - Test form inputs on mobile

---

## 📝 Test Report Template

Copy this to track your testing:

```markdown
## Test Session Report

**Date**: November 14, 2025
**Tester**: [Your Name]
**Environment**: Development (localhost)

### Quotes Page
- [x] ✅ Create assignment: PASS
- [x] ✅ Status workflow: PASS
- [x] ✅ Create expense: PASS
- [x] ✅ Mark as paid: PASS
- [ ] ❌ Approve expense: FAIL - [describe issue]

### Bookings Page
- [ ] Create assignment: 
- [ ] Status workflow: 
- [ ] Create expense: 
- [ ] Filtering: 

### Email Detail Page
- [ ] Create assignment: 
- [ ] Create expense: 
- [ ] Tab switching: 

### Issues Found
1. [Issue description]
   - Page: Quotes
   - Steps to reproduce: 
   - Expected: 
   - Actual: 
   - Screenshot: 

### Overall Status
- Total Tests: 24
- Passed: 18
- Failed: 2
- Skipped: 4
- Pass Rate: 75%
```

---

## 🎉 When Testing is Complete

1. **Mark Todo as Complete**:
   ```
   [x] Test All Integrations
   ```

2. **Create Summary**:
   - List all bugs found
   - Document workarounds
   - Note performance issues
   - Suggest improvements

3. **Update Documentation**:
   - Add screenshots to guides
   - Update README with usage instructions
   - Create user training materials

4. **Deploy to Staging**:
   - Commit all changes
   - Push to staging branch
   - Run tests again in staging
   - Get user acceptance testing

5. **Production Deployment**:
   - Merge to main branch
   - Deploy to production
   - Monitor for errors
   - Collect user feedback

---

## 📞 Need Help?

**Backend Issues**: Check `backend/src/controllers/assignmentController.js`
**Frontend Issues**: Check `frontend/src/components/assignments/`
**API Issues**: Check `backend/src/routes/assignmentRoutes.js`
**Database Issues**: Check MongoDB connection in backend console

**Documentation**:
- Component Guide: `docs/UI_COMPONENTS_GUIDE.md`
- Integration Guide: `INTEGRATION_COMPLETE.md`
- Feature Summary: `docs/PENDING_ITEMS_COMPLETE.md`

---

**Happy Testing! 🚀**

Remember: "A bug found in testing is a bug not found by users!"

