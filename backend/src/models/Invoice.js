const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  unitPrice: {
    type: Number,
    required: true
  },
  amount: {
    type: Number,
    required: true
  }
});

const invoiceSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    index: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  invoiceDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  items: [invoiceItemSchema],
  subtotal: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  amountPaid: {
    type: Number,
    default: 0
  },
  amountDue: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled'],
    default: 'draft'
  },
  notes: {
    type: String
  },
  terms: {
    type: String
  },
  pdfUrl: {
    type: String
  },
  sentAt: {
    type: Date
  },
  paidAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes (invoiceNumber already indexed via unique: true and index: true in schema)
invoiceSchema.index({ tenantId: 1, agentId: 1, status: 1 });
invoiceSchema.index({ createdAt: -1 });

// Generate invoice number
invoiceSchema.statics.generateInvoiceNumber = async function(tenantId) {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  
  // Find the last invoice for this tenant in current month
  const lastInvoice = await this.findOne({
    tenantId,
    invoiceNumber: new RegExp(`^INV-${year}${month}`)
  }).sort({ invoiceNumber: -1 });

  let sequence = 1;
  if (lastInvoice) {
    const lastSequence = parseInt(lastInvoice.invoiceNumber.split('-')[2]);
    sequence = lastSequence + 1;
  }

  return `INV-${year}${month}-${String(sequence).padStart(4, '0')}`;
};

// Calculate totals
invoiceSchema.methods.calculateTotals = function() {
  this.subtotal = this.items.reduce((sum, item) => sum + item.amount, 0);
  this.total = this.subtotal + this.tax - this.discount;
  this.amountDue = this.total - this.amountPaid;
  return this;
};

// Mark as sent
invoiceSchema.methods.markAsSent = function() {
  this.status = 'sent';
  this.sentAt = new Date();
  return this.save();
};

// Record payment
invoiceSchema.methods.recordPayment = function(amount) {
  this.amountPaid += amount;
  this.amountDue = this.total - this.amountPaid;

  if (this.amountPaid >= this.total) {
    this.status = 'paid';
    this.paidAt = new Date();
  } else if (this.amountPaid > 0) {
    this.status = 'partially_paid';
  }

  return this.save();
};

// Mark as overdue
invoiceSchema.methods.markAsOverdue = function() {
  if (this.status !== 'paid' && this.status !== 'cancelled') {
    this.status = 'overdue';
    return this.save();
  }
  return this;
};

// Cancel invoice
invoiceSchema.methods.cancel = function() {
  this.status = 'cancelled';
  return this.save();
};

// Get agent invoices summary
invoiceSchema.statics.getAgentInvoicesSummary = async function(tenantId, agentId) {
  const result = await this.aggregate([
    {
      $match: {
        tenantId: new mongoose.Types.ObjectId(tenantId),
        agentId: new mongoose.Types.ObjectId(agentId)
      }
    },
    {
      $group: {
        _id: null,
        totalInvoices: { $sum: 1 },
        totalAmount: { $sum: '$total' },
        totalPaid: { $sum: '$amountPaid' },
        totalDue: { $sum: '$amountDue' },
        draftCount: {
          $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] }
        },
        sentCount: {
          $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] }
        },
        paidCount: {
          $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
        },
        overdueCount: {
          $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] }
        }
      }
    }
  ]);

  return result[0] || {
    totalInvoices: 0,
    totalAmount: 0,
    totalPaid: 0,
    totalDue: 0,
    draftCount: 0,
    sentCount: 0,
    paidCount: 0,
    overdueCount: 0
  };
};

// Get invoices by status
invoiceSchema.statics.getInvoicesByStatus = async function(tenantId, agentId, status) {
  return this.find({
    tenantId,
    agentId,
    status
  })
    .populate('customerId', 'name email')
    .populate('bookingId', 'bookingNumber destination')
    .sort({ createdAt: -1 });
};

// Check overdue invoices
invoiceSchema.statics.checkOverdueInvoices = async function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueInvoices = await this.find({
    dueDate: { $lt: today },
    status: { $in: ['sent', 'partially_paid'] }
  });

  for (const invoice of overdueInvoices) {
    await invoice.markAsOverdue();
  }

  return overdueInvoices.length;
};

// Pre-save hook to calculate totals
invoiceSchema.pre('save', function(next) {
  if (this.isModified('items') || this.isModified('tax') || this.isModified('discount')) {
    this.calculateTotals();
  }
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);
