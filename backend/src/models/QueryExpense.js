const mongoose = require('mongoose');

/**
 * Query Expense Model
 * Tracks expenses associated with queries/bookings
 */
const queryExpenseSchema = new mongoose.Schema({
  // Multi-tenancy
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  
  // Associated entity (quote or booking)
  entityType: {
    type: String,
    required: true,
    enum: ['Quote', 'Booking', 'QuoteRequest'],
    index: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'entityType',
    index: true
  },
  
  // Expense details
  expenseNumber: {
    type: String,
    unique: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'flights',
      'hotels',
      'transport',
      'activities',
      'meals',
      'guides',
      'permits',
      'insurance',
      'visa',
      'tips',
      'miscellaneous',
      'other'
    ],
    index: true
  },
  subcategory: String,
  
  description: {
    type: String,
    required: true
  },
  
  // Financial details
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  exchangeRate: Number,
  amountInBaseCurrency: Number,
  
  // Supplier information
  supplier: {
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier'
    },
    name: String,
    contact: String,
    email: String,
    phone: String
  },
  
  // Payment information
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'partially_paid', 'overdue', 'refunded'],
    default: 'pending',
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit_card', 'bank_transfer', 'check', 'other']
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  pendingAmount: Number,
  paidAt: Date,
  
  // Invoice/Receipt
  invoiceNumber: String,
  invoiceDate: Date,
  invoiceUrl: String,
  receiptUrl: String,
  
  // Date information
  expenseDate: {
    type: Date,
    required: true,
    index: true
  },
  dueDate: Date,
  
  // Approval workflow
  approvalStatus: {
    type: String,
    enum: ['pending_approval', 'approved', 'rejected', 'not_required'],
    default: 'not_required',
    index: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  rejectionReason: String,
  
  // Tracking
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Additional info
  notes: String,
  internalNotes: String,
  tags: [String],
  
  // Attachments
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: Date,
    size: Number,
    type: String
  }],
  
  // Commission tracking
  commissionApplicable: {
    type: Boolean,
    default: false
  },
  commissionRate: Number,
  commissionAmount: Number,
  
  // Markup tracking
  markup: {
    percentage: Number,
    amount: Number
  },
  sellingPrice: Number,
  
  // Cost allocation
  allocatedTo: {
    type: String,
    enum: ['customer', 'agent', 'company', 'split']
  },
  allocationNotes: String
}, {
  timestamps: true
});

// Indexes
queryExpenseSchema.index({ tenantId: 1, entityType: 1, entityId: 1 });
queryExpenseSchema.index({ tenantId: 1, category: 1 });
queryExpenseSchema.index({ tenantId: 1, paymentStatus: 1 });
queryExpenseSchema.index({ tenantId: 1, expenseDate: 1 });
queryExpenseSchema.index({ tenantId: 1, approvalStatus: 1 });
queryExpenseSchema.index({ 'supplier.supplierId': 1 });

// Pre-save middleware
queryExpenseSchema.pre('save', async function(next) {
  // Generate expense number if new
  if (this.isNew && !this.expenseNumber) {
    const count = await mongoose.model('QueryExpense').countDocuments({ tenantId: this.tenantId });
    const year = new Date().getFullYear();
    this.expenseNumber = `EXP${year}-${String(count + 1).padStart(6, '0')}`;
  }
  
  // Calculate pending amount
  this.pendingAmount = this.amount - (this.paidAmount || 0);
  
  // Calculate amount in base currency if exchange rate provided
  if (this.exchangeRate && this.currency !== 'USD') {
    this.amountInBaseCurrency = this.amount * this.exchangeRate;
  } else {
    this.amountInBaseCurrency = this.amount;
  }
  
  // Calculate selling price if markup exists
  if (this.markup) {
    if (this.markup.percentage) {
      this.sellingPrice = this.amount * (1 + this.markup.percentage / 100);
      this.markup.amount = this.amount * (this.markup.percentage / 100);
    } else if (this.markup.amount) {
      this.sellingPrice = this.amount + this.markup.amount;
    }
  }
  
  // Calculate commission if applicable
  if (this.commissionApplicable && this.commissionRate) {
    this.commissionAmount = this.amount * (this.commissionRate / 100);
  }
  
  next();
});

// Methods
queryExpenseSchema.methods.markAsPaid = async function(amount, paymentMethod, paidBy) {
  this.paidAmount = (this.paidAmount || 0) + amount;
  this.paymentMethod = paymentMethod;
  this.paymentStatus = this.paidAmount >= this.amount ? 'paid' : 'partially_paid';
  if (this.paymentStatus === 'paid') {
    this.paidAt = new Date();
  }
  return this.save();
};

queryExpenseSchema.methods.approve = async function(userId, notes) {
  this.approvalStatus = 'approved';
  this.approvedBy = userId;
  this.approvedAt = new Date();
  if (notes) {
    this.notes = (this.notes ? this.notes + '\n' : '') + notes;
  }
  return this.save();
};

queryExpenseSchema.methods.reject = async function(userId, reason) {
  this.approvalStatus = 'rejected';
  this.approvedBy = userId;
  this.approvedAt = new Date();
  this.rejectionReason = reason;
  return this.save();
};

// Statics
queryExpenseSchema.statics.getExpensesForEntity = function(entityType, entityId, tenantId) {
  return this.find({ entityType, entityId, tenantId })
    .populate('recordedBy', 'firstName lastName')
    .populate('approvedBy', 'firstName lastName')
    .populate('supplier.supplierId', 'name contact')
    .sort({ expenseDate: -1 });
};

queryExpenseSchema.statics.getTotalExpenses = async function(entityType, entityId, tenantId) {
  const result = await this.aggregate([
    { $match: { entityType, entityId, tenantId } },
    { $group: {
      _id: null,
      totalAmount: { $sum: '$amount' },
      totalPaid: { $sum: '$paidAmount' },
      totalPending: { $sum: '$pendingAmount' }
    }}
  ]);
  return result[0] || { totalAmount: 0, totalPaid: 0, totalPending: 0 };
};

queryExpenseSchema.statics.getExpensesByCategory = async function(entityType, entityId, tenantId) {
  return this.aggregate([
    { $match: { entityType, entityId, tenantId } },
    { $group: {
      _id: '$category',
      total: { $sum: '$amount' },
      count: { $sum: 1 }
    }},
    { $sort: { total: -1 } }
  ]);
};

const QueryExpense = mongoose.model('QueryExpense', queryExpenseSchema);

module.exports = QueryExpense;
