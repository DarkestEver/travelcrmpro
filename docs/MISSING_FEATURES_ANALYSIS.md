# 🔍 Travel CRM - Missing Features Analysis & Implementation Plan

**Date:** November 13, 2025
**Status:** Comprehensive Gap Analysis

---

## 📋 Executive Summary

Based on thorough codebase analysis, here are the **CRITICAL MISSING FEATURES** that need implementation:

### ✅ Already Implemented
- Authentication & Authorization (JWT, RBAC)
- Email Processing & AI Automation
- Itinerary Management
- Quote Creation
- Booking Creation
- Customer Portal
- Agent Dashboard
- Supplier Management
- Payment Tracking
- Shareable Links (needs enhancement)

### ❌ Missing Critical Features
1. **Magic Link Single-Use Expiration**
2. **Quote → Booking Conversion Workflow**
3. **Query Assignment System**
4. **Expense Tracking for Queries**
5. **SSO/OAuth Integration**
6. **Multi-Currency Support**
7. **Commission Tracking**
8. **Document Management**
9. **Advanced Reporting**
10. **Webhook System**

---

## 🎯 REQUIREMENT 1: Magic Link Expiration After One Click

### Current State
✅ **Already Exists:**
- ShareToken model with basic expiration
- Token validation service
- View count tracking

❌ **Missing:**
- Single-use enforcement
- Auto-deactivation after first access
- User feedback for expired links

### Implementation Plan

#### Backend Changes

**File:** `backend/src/models/ShareToken.js`
```javascript
// Add new field
singleUse: {
  type: Boolean,
  default: false // Set to true for magic links
},
firstAccessedAt: {
  type: Date
},
accessCount: {
  type: Number,
  default: 0
}
```

**File:** `backend/src/services/shareService.js`
```javascript
async validateToken(token, password = null) {
  const shareToken = await ShareToken.findOne({ token })
    .select('+password');

  if (!shareToken) {
    throw new AppError('Share link not found', 404);
  }

  // Check if single-use link already accessed
  if (shareToken.singleUse && shareToken.accessCount > 0) {
    throw new AppError('This link has already been used and is no longer valid', 403);
  }

  if (!shareToken.isValid()) {
    throw new AppError('Share link has expired or is no longer active', 403);
  }

  // Check password if required
  if (shareToken.password) {
    if (!password) {
      throw new AppError('This share link requires a password', 401);
    }
    const isPasswordValid = await bcrypt.compare(password, shareToken.password);
    if (!isPasswordValid) {
      throw new AppError('Incorrect password', 401);
    }
  }

  // Record access
  shareToken.accessCount += 1;
  shareToken.lastViewedAt = new Date();
  if (!shareToken.firstAccessedAt) {
    shareToken.firstAccessedAt = new Date();
  }

  // Deactivate if single-use
  if (shareToken.singleUse) {
    shareToken.isActive = false;
  }

  await shareToken.save();

  return shareToken;
}
```

#### Frontend Changes

**File:** `frontend/src/pages/shared/SharedBase.jsx` (new)
```jsx
// Show appropriate error message
if (error?.message?.includes('already been used')) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-lg">
        <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Link Already Used
        </h1>
        <p className="text-gray-600 mb-4">
          This one-time access link has already been used and is no longer valid.
        </p>
        <p className="text-sm text-gray-500">
          Please request a new link from the sender if you need access again.
        </p>
      </div>
    </div>
  );
}
```

**API Integration:**
- Update `shareAPI.getShared()` to handle single-use errors
- Add toast notification for expired links
- Show "Request New Link" button

**Estimated Time:** 4-6 hours

---

## 🎯 REQUIREMENT 2: Quote to Booking Conversion System

### Current State
✅ **Partially Exists:**
- Quote model with status field
- Booking model with quoteId reference
- Basic booking creation API

❌ **Missing:**
- Automatic quote → booking workflow
- Quote acceptance tracking
- Payment status integration
- Booking confirmation email flow
- Voucher generation
- Status transitions

### Implementation Plan

#### 1. Quote Acceptance Flow

**File:** `backend/src/routes/quoteRoutes.js`
```javascript
// Add new route
router.post('/:id/accept', protect, quoteController.acceptQuote);
router.post('/:id/convert-to-booking', protect, quoteController.convertToBooking);
```

**File:** `backend/src/controllers/quoteController.js`
```javascript
// @desc    Accept quote (customer action)
// @route   POST /api/v1/quotes/:id/accept
// @access  Private (Customer)
exports.acceptQuote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { acceptanceNotes, paymentMethod } = req.body;

  const quote = await Quote.findById(id)
    .populate('customerId')
    .populate('agentId')
    .populate('itineraryId');

  if (!quote) {
    throw new AppError('Quote not found', 404);
  }

  // Check if customer owns this quote
  if (quote.customerId._id.toString() !== req.user.customerId?.toString()) {
    throw new AppError('Not authorized to accept this quote', 403);
  }

  // Check if quote is still valid
  if (quote.validUntil < new Date()) {
    throw new AppError('Quote has expired', 400);
  }

  // Update quote status
  quote.status = 'accepted';
  quote.acceptedAt = new Date();
  quote.acceptanceNotes = acceptanceNotes;
  await quote.save();

  // Send notification to agent
  await notificationService.createNotification({
    userId: quote.agentId._id,
    tenantId: quote.tenantId,
    type: 'quote_accepted',
    priority: 'high',
    title: 'Quote Accepted!',
    message: `Customer ${quote.customerId.name} accepted quote ${quote.quoteNumber}`,
    metadata: { quoteId: quote._id }
  });

  successResponse(res, 200, 'Quote accepted successfully', { quote });
});

// @desc    Convert accepted quote to booking
// @route   POST /api/v1/quotes/:id/convert-to-booking
// @access  Private (Agent/Operator)
exports.convertToBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { specialRequests, paymentPlan } = req.body;

  const quote = await Quote.findById(id)
    .populate('customerId')
    .populate('agentId')
    .populate('itineraryId');

  if (!quote) {
    throw new AppError('Quote not found', 404);
  }

  if (quote.status !== 'accepted') {
    throw new AppError('Only accepted quotes can be converted to bookings', 400);
  }

  // Check if booking already exists
  const existingBooking = await Booking.findOne({ quoteId: quote._id });
  if (existingBooking) {
    throw new AppError('Booking already exists for this quote', 400);
  }

  // Create booking
  const booking = await Booking.create({
    tenantId: quote.tenantId,
    bookingNumber: `BK${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    quoteId: quote._id,
    customerId: quote.customerId._id,
    agentId: quote.agentId._id,
    itineraryId: quote.itineraryId._id,
    
    destination: quote.destination,
    travelDates: quote.travelDates,
    numberOfTravelers: quote.numberOfTravelers,
    
    // Financial details from quote
    financial: {
      subtotal: quote.pricing.basePrice,
      taxes: quote.pricing.taxes,
      discount: quote.pricing.discount,
      totalAmount: quote.pricing.totalPrice,
      currency: quote.pricing.currency,
      paymentStatus: 'pending',
      paymentRecords: []
    },
    
    bookingStatus: 'pending',
    paymentStatus: 'pending',
    
    specialRequests,
    paymentPlan: paymentPlan || 'full', // full, deposit, installment
    
    metadata: {
      convertedFromQuote: true,
      quoteNumber: quote.quoteNumber
    }
  });

  // Update quote
  quote.bookingId = booking._id;
  quote.status = 'converted';
  await quote.save();

  // Send booking confirmation email
  await emailService.sendBookingConfirmationEmail({
    to: quote.customerId.email,
    customerName: quote.customerId.name,
    booking: {
      bookingNumber: booking.bookingNumber,
      destination: booking.destination,
      startDate: booking.travelDates.startDate,
      endDate: booking.travelDates.endDate,
      totalAmount: booking.financial.totalAmount,
      status: booking.bookingStatus
    }
  });

  // Create notifications
  await notificationService.createNotification({
    userId: quote.customerId._id,
    tenantId: quote.tenantId,
    type: 'booking_created',
    priority: 'high',
    title: 'Booking Created!',
    message: `Your booking ${booking.bookingNumber} has been created`,
    metadata: { bookingId: booking._id }
  });

  successResponse(res, 201, 'Quote converted to booking successfully', { 
    quote, 
    booking 
  });
});
```

#### 2. Payment Tracking Integration

**File:** `backend/src/models/Booking.js` (update)
```javascript
// Add payment tracking
paymentRecords: [{
  amount: Number,
  currency: String,
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'bank_transfer', 'cash', 'stripe', 'paypal']
  },
  transactionId: String,
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded']
  },
  paidAt: Date,
  receiptUrl: String,
  notes: String,
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}],

// Payment plan
paymentPlan: {
  type: String,
  enum: ['full', 'deposit', 'installment'],
  default: 'full'
},
depositAmount: Number,
installments: [{
  amount: Number,
  dueDate: Date,
  status: String,
  paidAt: Date,
  transactionId: String
}]
```

#### 3. Booking Status Workflow

**States:**
1. `pending` - Awaiting payment
2. `confirmed` - Payment received, confirmed with suppliers
3. `in_progress` - Travel ongoing
4. `completed` - Trip finished
5. `cancelled` - Booking cancelled
6. `refunded` - Money refunded

**File:** `backend/src/controllers/bookingController.js`
```javascript
// Add status transition methods
exports.confirmBooking = async (req, res) => { ... };
exports.cancelBooking = async (req, res) => { ... };
exports.completeBooking = async (req, res) => { ... };
```

#### 4. Voucher Generation

**File:** `backend/src/services/voucherService.js` (new)
```javascript
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

class VoucherService {
  async generateVoucher(bookingId) {
    const booking = await Booking.findById(bookingId)
      .populate('customerId')
      .populate('agentId')
      .populate('itineraryId');

    // Generate QR code
    const qrCode = await QRCode.toDataURL(booking.bookingNumber);

    // Create PDF
    const doc = new PDFDocument();
    // ... PDF generation logic
    
    return pdfBuffer;
  }
}
```

**Estimated Time:** 20-24 hours

---

## 🎯 REQUIREMENT 3: Query Assignment System

### Current State
❌ **Completely Missing:**
- No assignment model
- No assignment tracking
- No role-based visibility
- No assignment notifications

### Implementation Plan

#### 1. Create Assignment Model

**File:** `backend/src/models/QueryAssignment.js` (new)
```javascript
const mongoose = require('mongoose');

const queryAssignmentSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  
  // What is being assigned
  entityType: {
    type: String,
    required: true,
    enum: ['Email', 'Quote', 'Booking', 'QuoteRequest'],
    index: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'entityType',
    index: true
  },
  
  // Who is assigned
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  assignedRole: {
    type: String,
    enum: ['agent', 'supplier', 'customer', 'operator'],
    required: true
  },
  
  // Assignment details
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  
  // Status
  status: {
    type: String,
    enum: ['assigned', 'in_progress', 'completed', 'reassigned', 'cancelled'],
    default: 'assigned',
    index: true
  },
  
  // Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },
  
  // Due date
  dueDate: Date,
  
  // Notes
  notes: String,
  internalNotes: String, // Only visible to agents/operators
  
  // Response tracking
  respondedAt: Date,
  responseNotes: String,
  
  // Completion
  completedAt: Date,
  completionNotes: String
  
}, {
  timestamps: true
});

// Indexes
queryAssignmentSchema.index({ entityType: 1, entityId: 1 });
queryAssignmentSchema.index({ assignedTo: 1, status: 1 });
queryAssignmentSchema.index({ tenantId: 1, assignedAt: -1 });

// Virtual for entity
queryAssignmentSchema.virtual('entity', {
  refPath: 'entityType',
  localField: 'entityId',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.model('QueryAssignment', queryAssignmentSchema);
```

#### 2. Assignment Controller

**File:** `backend/src/controllers/assignmentController.js` (new)
```javascript
const QueryAssignment = require('../models/QueryAssignment');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { successResponse, paginatedResponse } = require('../utils/response');
const notificationService = require('../services/advancedNotificationService');

// @desc    Create assignment
// @route   POST /api/v1/assignments
// @access  Private (Agent, Operator)
exports.createAssignment = asyncHandler(async (req, res) => {
  const {
    entityType,
    entityId,
    assignedTo,
    assignedRole,
    priority,
    dueDate,
    notes,
    internalNotes
  } = req.body;

  const assignment = await QueryAssignment.create({
    tenantId: req.tenantId,
    entityType,
    entityId,
    assignedTo,
    assignedRole,
    assignedBy: req.user._id,
    priority,
    dueDate,
    notes,
    internalNotes
  });

  // Send notification
  await notificationService.createNotification({
    userId: assignedTo,
    tenantId: req.tenantId,
    type: 'assignment_created',
    priority: priority,
    title: 'New Assignment',
    message: `You have been assigned a new ${entityType.toLowerCase()}`,
    metadata: {
      assignmentId: assignment._id,
      entityType,
      entityId
    },
    actionUrl: `/assignments/${assignment._id}`
  });

  successResponse(res, 201, 'Assignment created successfully', { assignment });
});

// @desc    Get my assignments
// @route   GET /api/v1/assignments/my
// @access  Private
exports.getMyAssignments = asyncHandler(async (req, res) => {
  const { status, priority, entityType } = req.query;
  
  const query = {
    tenantId: req.tenantId,
    assignedTo: req.user._id
  };
  
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (entityType) query.entityType = entityType;

  const assignments = await QueryAssignment.find(query)
    .populate('assignedBy', 'name email')
    .populate('assignedTo', 'name email role')
    .populate('entityId')
    .sort({ priority: -1, assignedAt: -1 });

  successResponse(res, 200, 'Assignments fetched successfully', { 
    assignments,
    count: assignments.length 
  });
});

// @desc    Update assignment status
// @route   PATCH /api/v1/assignments/:id/status
// @access  Private
exports.updateAssignmentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, responseNotes, completionNotes } = req.body;

  const assignment = await QueryAssignment.findById(id);

  if (!assignment) {
    throw new AppError('Assignment not found', 404);
  }

  // Check permission
  if (assignment.assignedTo.toString() !== req.user._id.toString() &&
      !['operator', 'super_admin'].includes(req.user.role)) {
    throw new AppError('Not authorized to update this assignment', 403);
  }

  assignment.status = status;
  
  if (status === 'in_progress' && !assignment.respondedAt) {
    assignment.respondedAt = new Date();
  }
  
  if (status === 'completed') {
    assignment.completedAt = new Date();
    assignment.completionNotes = completionNotes;
  }
  
  if (responseNotes) {
    assignment.responseNotes = responseNotes;
  }

  await assignment.save();

  // Notify assignedBy user
  await notificationService.createNotification({
    userId: assignment.assignedBy,
    tenantId: req.tenantId,
    type: 'assignment_updated',
    priority: 'medium',
    title: 'Assignment Updated',
    message: `Assignment status changed to ${status}`,
    metadata: { assignmentId: assignment._id }
  });

  successResponse(res, 200, 'Assignment updated successfully', { assignment });
});

// @desc    Reassign to another user
// @route   POST /api/v1/assignments/:id/reassign
// @access  Private (Agent, Operator)
exports.reassignAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { assignedTo, notes } = req.body;

  const assignment = await QueryAssignment.findById(id);

  if (!assignment) {
    throw new AppError('Assignment not found', 404);
  }

  const oldAssignee = assignment.assignedTo;

  assignment.assignedTo = assignedTo;
  assignment.status = 'reassigned';
  assignment.notes = notes;
  await assignment.save();

  // Notify new assignee
  await notificationService.createNotification({
    userId: assignedTo,
    tenantId: req.tenantId,
    type: 'assignment_created',
    priority: assignment.priority,
    title: 'Assignment Reassigned to You',
    message: `You have been assigned a ${assignment.entityType.toLowerCase()}`,
    metadata: { assignmentId: assignment._id }
  });

  successResponse(res, 200, 'Assignment reassigned successfully', { assignment });
});
```

#### 3. Frontend Components

**File:** `frontend/src/components/AssignmentPanel.jsx` (new)
```jsx
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlusIcon, UsersIcon } from '@heroicons/react/24/outline';
import api from '../services/api';

export default function AssignmentPanel({ entityType, entityId }) {
  const queryClient = useQueryClient();
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Fetch current assignments
  const { data: assignments } = useQuery({
    queryKey: ['assignments', entityType, entityId],
    queryFn: async () => {
      const res = await api.get(`/assignments`, {
        params: { entityType, entityId }
      });
      return res.data.data;
    }
  });

  // Assign mutation
  const assignMutation = useMutation({
    mutationFn: (data) => api.post('/assignments', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['assignments']);
      setShowAssignModal(false);
    }
  });

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Assignments</h3>
        <button
          onClick={() => setShowAssignModal(true)}
          className="btn btn-sm btn-primary"
        >
          <UserPlusIcon className="w-4 h-4 mr-2" />
          Assign
        </button>
      </div>

      {/* Assignment list */}
      <div className="space-y-2">
        {assignments?.map((assignment) => (
          <div key={assignment._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div>
              <div className="font-medium">{assignment.assignedTo.name}</div>
              <div className="text-sm text-gray-500">{assignment.assignedRole}</div>
            </div>
            <span className={`badge badge-${assignment.status === 'completed' ? 'success' : 'warning'}`}>
              {assignment.status}
            </span>
          </div>
        ))}
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <AssignModal
          entityType={entityType}
          entityId={entityId}
          onClose={() => setShowAssignModal(false)}
          onSubmit={(data) => assignMutation.mutate(data)}
        />
      )}
    </div>
  );
}
```

#### 4. Permission Middleware

**File:** `backend/src/middleware/assignmentAccess.js` (new)
```javascript
// Check if user can access entity based on assignment
exports.checkAssignmentAccess = asyncHandler(async (req, res, next) => {
  const { entityType, entityId } = req.params;

  // Super admin and operators can access everything
  if (['super_admin', 'operator'].includes(req.user.role)) {
    return next();
  }

  // Check if user has assignment
  const assignment = await QueryAssignment.findOne({
    entityType,
    entityId,
    assignedTo: req.user._id,
    status: { $nin: ['cancelled'] }
  });

  if (!assignment) {
    throw new AppError('You do not have access to this resource', 403);
  }

  req.assignment = assignment;
  next();
});
```

**Estimated Time:** 16-20 hours

---

## 🎯 REQUIREMENT 4: Expense Tracking for Queries

### Current State
❌ **Completely Missing:**
- No expense model
- No expense tracking
- No budget vs actual comparison
- No expense reporting

### Implementation Plan

#### 1. Create Expense Model

**File:** `backend/src/models/QueryExpense.js` (new)
```javascript
const mongoose = require('mongoose');

const queryExpenseSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  
  // Link to query/booking/quote
  entityType: {
    type: String,
    required: true,
    enum: ['Email', 'Quote', 'Booking', 'QuoteRequest'],
    index: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'entityType',
    index: true
  },
  
  // Expense details
  category: {
    type: String,
    required: true,
    enum: [
      'accommodation',
      'flights',
      'transfers',
      'meals',
      'activities',
      'visa',
      'insurance',
      'guide_fees',
      'entrance_fees',
      'tips',
      'other'
    ],
    index: true
  },
  
  subcategory: String, // e.g., "Hotel - 5 star", "Domestic Flight"
  
  description: {
    type: String,
    required: true
  },
  
  // Financial
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    default: 'USD'
  },
  
  // Supplier info
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  supplierName: String,
  supplierInvoiceNumber: String,
  
  // Date
  expenseDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  // Payment
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'cancelled'],
    default: 'pending',
    index: true
  },
  paidAt: Date,
  paymentMethod: String,
  
  // Documentation
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: Date
  }],
  
  notes: String,
  internalNotes: String,
  
  // Cost type
  costType: {
    type: String,
    enum: ['actual', 'estimated', 'quoted'],
    default: 'actual'
  },
  
  // Approval
  requiresApproval: {
    type: Boolean,
    default: false
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  
  // Created by
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
  
}, {
  timestamps: true
});

// Indexes
queryExpenseSchema.index({ entityType: 1, entityId: 1 });
queryExpenseSchema.index({ tenantId: 1, category: 1 });
queryExpenseSchema.index({ tenantId: 1, expenseDate: -1 });
queryExpenseSchema.index({ paymentStatus: 1, expenseDate: -1 });

// Virtual for entity
queryExpenseSchema.virtual('entity', {
  refPath: 'entityType',
  localField: 'entityId',
  foreignField: '_id',
  justOne: true
});

// Static method to calculate totals
queryExpenseSchema.statics.calculateTotals = async function(entityType, entityId) {
  const result = await this.aggregate([
    {
      $match: { entityType, entityId: mongoose.Types.ObjectId(entityId) }
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  return result;
};

module.exports = mongoose.model('QueryExpense', queryExpenseSchema);
```

#### 2. Expense Controller

**File:** `backend/src/controllers/expenseController.js` (new)
```javascript
const QueryExpense = require('../models/QueryExpense');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { successResponse, paginatedResponse } = require('../utils/response');

// @desc    Add expense
// @route   POST /api/v1/expenses
// @access  Private
exports.addExpense = asyncHandler(async (req, res) => {
  const expenseData = {
    ...req.body,
    tenantId: req.tenantId,
    createdBy: req.user._id
  };

  const expense = await QueryExpense.create(expenseData);

  successResponse(res, 201, 'Expense added successfully', { expense });
});

// @desc    Get expenses for entity
// @route   GET /api/v1/expenses
// @access  Private
exports.getExpenses = asyncHandler(async (req, res) => {
  const { entityType, entityId, category, paymentStatus } = req.query;

  const query = { tenantId: req.tenantId };
  
  if (entityType) query.entityType = entityType;
  if (entityId) query.entityId = entityId;
  if (category) query.category = category;
  if (paymentStatus) query.paymentStatus = paymentStatus;

  const expenses = await QueryExpense.find(query)
    .populate('createdBy', 'name email')
    .populate('supplierId', 'companyName')
    .sort({ expenseDate: -1 });

  // Calculate totals
  const totals = await QueryExpense.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$currency',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  successResponse(res, 200, 'Expenses fetched successfully', { 
    expenses,
    totals 
  });
});

// @desc    Get expense summary
// @route   GET /api/v1/expenses/:entityType/:entityId/summary
// @access  Private
exports.getExpenseSummary = asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.params;

  const categoryBreakdown = await QueryExpense.calculateTotals(entityType, entityId);

  const totals = await QueryExpense.aggregate([
    {
      $match: {
        entityType,
        entityId: mongoose.Types.ObjectId(entityId)
      }
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        paidAmount: {
          $sum: {
            $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$amount', 0]
          }
        },
        pendingAmount: {
          $sum: {
            $cond: [{ $eq: ['$paymentStatus', 'pending'] }, '$amount', 0]
          }
        },
        expenseCount: { $sum: 1 }
      }
    }
  ]);

  successResponse(res, 200, 'Expense summary fetched successfully', {
    summary: totals[0] || {},
    categoryBreakdown
  });
});

// @desc    Update expense
// @route   PUT /api/v1/expenses/:id
// @access  Private
exports.updateExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const expense = await QueryExpense.findById(id);

  if (!expense) {
    throw new AppError('Expense not found', 404);
  }

  // Check permission
  if (expense.createdBy.toString() !== req.user._id.toString() &&
      !['operator', 'super_admin'].includes(req.user.role)) {
    throw new AppError('Not authorized to update this expense', 403);
  }

  Object.assign(expense, req.body);
  await expense.save();

  successResponse(res, 200, 'Expense updated successfully', { expense });
});

// @desc    Delete expense
// @route   DELETE /api/v1/expenses/:id
// @access  Private
exports.deleteExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const expense = await QueryExpense.findById(id);

  if (!expense) {
    throw new AppError('Expense not found', 404);
  }

  // Check permission
  if (expense.createdBy.toString() !== req.user._id.toString() &&
      !['operator', 'super_admin'].includes(req.user.role)) {
    throw new AppError('Not authorized to delete this expense', 403);
  }

  await expense.remove();

  successResponse(res, 200, 'Expense deleted successfully');
});
```

#### 3. Frontend Component

**File:** `frontend/src/components/ExpenseTracker.jsx` (new)
```jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tantml:react-query';
import {
  PlusIcon,
  CurrencyDollarIcon,
  DocumentIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';

export default function ExpenseTracker({ entityType, entityId }) {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);

  // Fetch expenses
  const { data: expensesData } = useQuery({
    queryKey: ['expenses', entityType, entityId],
    queryFn: async () => {
      const res = await api.get('/expenses', {
        params: { entityType, entityId }
      });
      return res.data.data;
    }
  });

  // Fetch summary
  const { data: summary } = useQuery({
    queryKey: ['expense-summary', entityType, entityId],
    queryFn: async () => {
      const res = await api.get(`/expenses/${entityType}/${entityId}/summary`);
      return res.data.data;
    }
  });

  const expenses = expensesData?.expenses || [];
  const totals = expensesData?.totals || [];

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header with totals */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Expenses</h3>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn btn-sm btn-primary"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Expense
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Total Expenses</div>
            <div className="text-2xl font-bold text-blue-600">
              ${summary?.summary?.totalAmount?.toFixed(2) || '0.00'}
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Paid</div>
            <div className="text-2xl font-bold text-green-600">
              ${summary?.summary?.paidAmount?.toFixed(2) || '0.00'}
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Pending</div>
            <div className="text-2xl font-bold text-yellow-600">
              ${summary?.summary?.pendingAmount?.toFixed(2) || '0.00'}
            </div>
          </div>
        </div>
      </div>

      {/* Expense list */}
      <div className="divide-y">
        {expenses.map((expense) => (
          <div key={expense._id} className="p-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium">{expense.description}</div>
                <div className="text-sm text-gray-500">
                  {expense.category} • {new Date(expense.expenseDate).toLocaleDateString()}
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">
                  {expense.currency} {expense.amount.toFixed(2)}
                </div>
                <span className={`badge badge-${
                  expense.paymentStatus === 'paid' ? 'success' : 'warning'
                }`}>
                  {expense.paymentStatus}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Category breakdown */}
      <div className="p-6 border-t bg-gray-50">
        <h4 className="font-medium mb-3">Category Breakdown</h4>
        <div className="space-y-2">
          {summary?.categoryBreakdown?.map((cat) => (
            <div key={cat._id} className="flex items-center justify-between">
              <span className="text-sm capitalize">{cat._id}</span>
              <span className="font-medium">${cat.total.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Estimated Time:** 12-16 hours

---

## 🎯 REQUIREMENT 5: Comprehensive Gap Analysis

### Missing Critical Features

#### 1. **SSO/OAuth Integration** ⚠️ Priority: HIGH
- Google OAuth
- Microsoft Azure AD
- LinkedIn
- Custom SAML

#### 2. **Multi-Currency Support** ⚠️ Priority: HIGH
- Real-time exchange rates
- Currency conversion
- Multi-currency reporting
- Currency preferences per tenant

#### 3. **Commission Tracking** ⚠️ Priority: MEDIUM
- Agent commission calculation
- Supplier commission rules
- Commission payments
- Commission reports

#### 4. **Document Management** ⚠️ Priority: MEDIUM
- Document upload/storage
- Document versioning
- Document templates
- E-signature integration

#### 5. **Advanced Reporting** ⚠️ Priority: MEDIUM
- Custom report builder
- Scheduled reports
- Export to Excel/PDF
- Dashboard widgets

#### 6. **Webhook System** ⚠️ Priority: LOW
- Webhook configuration
- Event triggers
- Webhook logs
- Retry mechanism

#### 7. **Audit Trail** ⚠️ Priority: HIGH
- Comprehensive logging
- User activity tracking
- Data change history
- Compliance reports

#### 8. **Notification System Enhancement** ⚠️ Priority: MEDIUM
- Email notifications
- SMS notifications
- Push notifications
- Notification preferences

#### 9. **Mobile App API** ⚠️ Priority: LOW
- Mobile-optimized endpoints
- Offline sync
- Push notification support
- Mobile-specific features

#### 10. **Advanced Search** ⚠️ Priority: MEDIUM
- Elasticsearch integration
- Full-text search
- Faceted search
- Search analytics

---

## 📊 Implementation Priority Matrix

### Phase 1: Immediate (1-2 weeks)
1. ✅ Magic Link Single-Use (4-6 hours)
2. ✅ Query Assignment System (16-20 hours)
3. ✅ Expense Tracking (12-16 hours)

### Phase 2: Short-term (2-4 weeks)
4. Quote → Booking Conversion (20-24 hours)
5. Multi-Currency Support (24-32 hours)
6. Audit Trail Enhancement (16-20 hours)

### Phase 3: Medium-term (1-2 months)
7. Commission Tracking (32-40 hours)
8. Document Management (40-48 hours)
9. Advanced Reporting (48-56 hours)
10. SSO Integration (24-32 hours)

### Phase 4: Long-term (2-3 months)
11. Notification System Enhancement (20-24 hours)
12. Webhook System (24-32 hours)
13. Advanced Search (32-40 hours)
14. Mobile App API (40-60 hours)

---

## 🔧 Technical Debt & Improvements

### Code Quality
- Add comprehensive unit tests
- Add integration tests
- Add E2E tests
- Improve error handling
- Add API documentation (Swagger)

### Performance
- Add database indexes
- Implement caching strategy
- Optimize query performance
- Add CDN for static assets
- Implement lazy loading

### Security
- Add rate limiting
- Implement IP whitelisting
- Add 2FA/MFA
- Security headers
- Regular security audits

### DevOps
- CI/CD pipeline
- Automated testing
- Database backups
- Monitoring & logging
- Performance monitoring

---

## 📝 Next Steps

1. **Prioritize features** based on business needs
2. **Create detailed specs** for each feature
3. **Assign development resources**
4. **Set up project tracking** (Jira/Trello)
5. **Begin Phase 1 implementation**

---

## 🎯 Summary

**Total Implementation Time:**
- Phase 1: 32-42 hours
- Phase 2: 60-76 hours
- Phase 3: 144-176 hours
- Phase 4: 116-148 hours

**Grand Total: 352-442 hours (44-55 working days for 1 developer)**

For faster delivery, consider:
- Multiple developers working in parallel
- Focus on Phase 1 & 2 first
- Iterative releases
- Agile sprints

---

**Document Version:** 1.0
**Last Updated:** November 13, 2025
