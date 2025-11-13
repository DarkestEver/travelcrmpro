# 🎨 UI Components - Assignment & Expense System

**Date:** November 14, 2025  
**Status:** ✅ COMPONENTS CREATED

---

## ✅ What Was Created

### Assignment Components:
1. **`AssignmentDropdown.jsx`** - Modal form to create assignments
2. **`AssignmentList.jsx`** - Display and manage assignments

### Expense Components:
3. **`ExpenseForm.jsx`** - Modal form to create expenses
4. **`ExpenseList.jsx`** - Display and manage expenses with approval workflow

---

## 📋 How to Integrate

### For Quotes Page:

#### 1. Import Components
```javascript
// In frontend/src/pages/Quotes.jsx or Quote Detail page
import AssignmentDropdown from '../components/assignments/AssignmentDropdown';
import AssignmentList from '../components/assignments/AssignmentList';
import ExpenseForm from '../components/expenses/ExpenseForm';
import ExpenseList from '../components/expenses/ExpenseList';
```

#### 2. Add to Quote Detail View
```javascript
// Inside your quote detail component
<div className="space-y-6">
  {/* Existing quote details */}
  
  {/* Assignments Section */}
  <div className="bg-white shadow rounded-lg p-6">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-medium">Assignments</h3>
      <AssignmentDropdown 
        entityType="Quote" 
        entityId={quote._id}
        onAssigned={() => console.log('Assignment created')}
      />
    </div>
    <AssignmentList entityType="Quote" entityId={quote._id} />
  </div>

  {/* Expenses Section */}
  <div className="bg-white shadow rounded-lg p-6">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-medium">Expenses</h3>
      <ExpenseForm 
        entityType="Quote" 
        entityId={quote._id}
        onSuccess={() => console.log('Expense created')}
      />
    </div>
    <ExpenseList entityType="Quote" entityId={quote._id} />
  </div>
</div>
```

### For Bookings Page:

```javascript
// Same pattern, just change entityType
<AssignmentDropdown entityType="Booking" entityId={booking._id} />
<AssignmentList entityType="Booking" entityId={booking._id} />
<ExpenseForm entityType="Booking" entityId={booking._id} />
<ExpenseList entityType="Booking" entityId={booking._id} />
```

### For Email Detail Page:

```javascript
// For emails, use EntityType="EmailLog"
<AssignmentDropdown entityType="EmailLog" entityId={email._id} />
<AssignmentList entityType="EmailLog" entityId={email._id} />
```

---

## 🎯 Component Features

### AssignmentDropdown
- ✅ Select user to assign
- ✅ Set priority (low, medium, high, urgent)
- ✅ Set due date
- ✅ Add notes
- ✅ Real-time user list from API
- ✅ Toast notifications

### AssignmentList
- ✅ Filter by status (assigned, in_progress, completed)
- ✅ Display assignee info
- ✅ Show priority and due date
- ✅ Status change buttons (Start → Complete)
- ✅ Overdue indicator
- ✅ Delete assignments
- ✅ Auto-refresh on changes

### ExpenseForm
- ✅ 12 expense categories
- ✅ Multi-currency support (INR, USD, EUR, etc.)
- ✅ Supplier information fields
- ✅ Invoice number tracking
- ✅ Due date
- ✅ Notes field
- ✅ Form validation

### ExpenseList
- ✅ Summary cards (Total, Paid, Pending)
- ✅ Filter by category
- ✅ Payment status tracking
- ✅ Approval workflow (Approve/Reject) - Admin only
- ✅ Mark as paid button
- ✅ Delete expenses (with restrictions)
- ✅ Currency formatting
- ✅ Auto-refresh on changes

---

## 🔐 Permissions

### Assignments:
- **Create:** super_admin, operator, agent
- **View:** All authenticated users can see assignments for their entities
- **Update Status:** Assigned user or admins
- **Delete:** super_admin, operator

### Expenses:
- **Create:** super_admin, operator, agent
- **View:** All authenticated users can see expenses
- **Mark as Paid:** super_admin, operator, agent
- **Approve/Reject:** super_admin, operator only
- **Delete:** super_admin, operator (cannot delete paid expenses)

---

## 📝 Example Integration - Complete Quote Detail Page

```javascript
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { quotesAPI } from '../services/apiEndpoints';
import AssignmentDropdown from '../components/assignments/AssignmentDropdown';
import AssignmentList from '../components/assignments/AssignmentList';
import ExpenseForm from '../components/expenses/ExpenseForm';
import ExpenseList from '../components/expenses/ExpenseList';

export default function QuoteDetail() {
  const { id } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ['quote', id],
    queryFn: () => quotesAPI.getOne(id),
  });

  const quote = data?.data?.quote;

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        {/* Quote Details */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">{quote.quoteNumber}</h2>
          {/* ... existing quote details ... */}
        </div>

        {/* Assignments */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Task Assignments</h3>
            <AssignmentDropdown entityType="Quote" entityId={id} />
          </div>
          <AssignmentList entityType="Quote" entityId={id} />
        </div>

        {/* Expenses */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Expenses</h3>
            <ExpenseForm entityType="Quote" entityId={id} />
          </div>
          <ExpenseList entityType="Quote" entityId={id} />
        </div>
      </div>
    </div>
  );
}
```

---

## 🧪 Testing

### Test Assignment Flow:
1. Go to any Quote/Booking detail page
2. Click "Assign Task" button
3. Select user, set priority, add notes
4. Click "Create Assignment"
5. Should see new assignment in list
6. Click "Start" → Status changes to "In Progress"
7. Click "Complete" → Status changes to "Completed"

### Test Expense Flow:
1. Go to any Quote/Booking detail page
2. Click "Add Expense" button
3. Fill in expense details (category, amount, supplier)
4. Click "Create Expense"
5. Should see new expense in list with "Pending" status
6. Click "Mark Paid" → Enter payment method → Status changes to "Paid"
7. (Admin only) Click "Approve" → Approval status changes to "Approved"

---

## 🎨 Styling

All components use:
- ✅ Tailwind CSS classes
- ✅ React Icons (fi icons)
- ✅ Consistent color scheme
- ✅ Responsive design
- ✅ Modal overlays for forms
- ✅ Toast notifications (react-hot-toast)

---

## 📦 Dependencies

Make sure these are installed:
```bash
npm install @tanstack/react-query react-hot-toast react-icons
```

---

## ✅ Next Steps

1. **Choose a page to integrate first** (recommended: Quotes page)
2. **Import the components**
3. **Add the JSX to your page layout**
4. **Test the functionality**
5. **Repeat for other pages** (Bookings, Emails)

---

## 🚀 Ready to Use!

All components are production-ready with:
- ✅ Error handling
- ✅ Loading states
- ✅ Validation
- ✅ Proper permissions
- ✅ Auto-refresh
- ✅ Responsive design

Just integrate them into your pages and they'll work immediately! 🎉
