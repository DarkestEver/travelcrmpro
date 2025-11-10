const mongoose = require('mongoose');

const taxSettingsSchema = new mongoose.Schema({
  // Multi-tenancy
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },
  
  // Global Tax Configuration
  globalTaxRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
    required: true,
  },
  
  // Tax Details
  taxName: {
    type: String,
    default: 'Tax',
    trim: true,
  },
  
  taxType: {
    type: String,
    enum: ['GST', 'VAT', 'Sales Tax', 'Service Tax', 'None'],
    default: 'GST',
  },
  
  taxIdentificationNumber: {
    type: String,
    trim: true,
  },
  
  // Tax Breakdown (for countries with multi-tier taxes)
  taxBreakdown: [{
    name: {
      type: String,
      required: true,
      trim: true,
    },
    rate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    type: {
      type: String,
      enum: ['Central', 'State', 'Local', 'Other'],
      default: 'Other',
    },
  }],
  
  // Service-specific tax rates (override global)
  serviceTaxRates: {
    accommodation: {
      rate: Number,
      enabled: { type: Boolean, default: false },
    },
    transport: {
      rate: Number,
      enabled: { type: Boolean, default: false },
    },
    activities: {
      rate: Number,
      enabled: { type: Boolean, default: false },
    },
    meals: {
      rate: Number,
      enabled: { type: Boolean, default: false },
    },
    other: {
      rate: Number,
      enabled: { type: Boolean, default: false },
    },
  },
  
  // Tax Exemptions
  exemptions: [{
    category: {
      type: String,
      enum: ['Government', 'Diplomatic', 'Non-Profit', 'Student', 'Senior Citizen', 'Other'],
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    description: String,
  }],
  
  // Tax Calculation Rules
  taxCalculationMethod: {
    type: String,
    enum: ['inclusive', 'exclusive'],
    default: 'exclusive',
    // exclusive: Tax added on top of price (most common)
    // inclusive: Tax already included in price
  },
  
  roundingMethod: {
    type: String,
    enum: ['round', 'floor', 'ceil'],
    default: 'round',
  },
  
  roundingDecimal: {
    type: Number,
    default: 2,
    min: 0,
    max: 4,
  },
  
  // Payment Gateway Tax Handling
  chargeGatewayFees: {
    type: Boolean,
    default: true,
  },
  
  gatewayFeePercentage: {
    type: Number,
    default: 2.5,
    min: 0,
    max: 10,
  },
  
  // Tax Filing Configuration
  taxFilingFrequency: {
    type: String,
    enum: ['Monthly', 'Quarterly', 'Annually'],
    default: 'Quarterly',
  },
  
  nextFilingDate: {
    type: Date,
  },
  
  // Currency
  currency: {
    type: String,
    default: 'USD',
    trim: true,
  },
  
  currencySymbol: {
    type: String,
    default: '$',
  },
  
  // Additional Settings
  showTaxBreakdownToCustomer: {
    type: Boolean,
    default: true,
  },
  
  autoGenerateInvoices: {
    type: Boolean,
    default: true,
  },
  
  invoicePrefix: {
    type: String,
    default: 'INV',
    trim: true,
  },
  
  invoiceNumbering: {
    type: String,
    enum: ['sequential', 'date-based', 'random'],
    default: 'sequential',
  },
  
  lastInvoiceNumber: {
    type: Number,
    default: 0,
  },
  
  // Audit Fields
  isActive: {
    type: Boolean,
    default: true,
  },
  
  effectiveFrom: {
    type: Date,
    default: Date.now,
  },
  
  notes: {
    type: String,
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Indexes
taxSettingsSchema.index({ tenantId: 1, isActive: 1 });

// Static method to get active tax settings for a tenant
taxSettingsSchema.statics.getActiveTaxSettings = async function(tenantId) {
  return await this.findOne({ 
    tenantId, 
    isActive: true 
  }).sort({ effectiveFrom: -1 });
};

// Method to calculate tax for an amount
taxSettingsSchema.methods.calculateTax = function(amount, serviceType = null) {
  let taxRate = this.globalTaxRate;
  
  // Check if service-specific tax rate should be used
  if (serviceType && this.serviceTaxRates[serviceType]?.enabled) {
    taxRate = this.serviceTaxRates[serviceType].rate;
  }
  
  let taxAmount = (amount * taxRate) / 100;
  
  // Apply rounding
  const multiplier = Math.pow(10, this.roundingDecimal);
  if (this.roundingMethod === 'floor') {
    taxAmount = Math.floor(taxAmount * multiplier) / multiplier;
  } else if (this.roundingMethod === 'ceil') {
    taxAmount = Math.ceil(taxAmount * multiplier) / multiplier;
  } else {
    taxAmount = Math.round(taxAmount * multiplier) / multiplier;
  }
  
  return {
    taxRate,
    taxAmount,
    totalAmount: amount + taxAmount,
    breakdown: this.taxBreakdown.map(tax => ({
      name: tax.name,
      rate: tax.rate,
      amount: Math.round((amount * tax.rate / 100) * multiplier) / multiplier,
    })),
  };
};

// Method to generate next invoice number
taxSettingsSchema.methods.generateInvoiceNumber = async function() {
  this.lastInvoiceNumber += 1;
  await this.save();
  
  const invoiceNum = this.lastInvoiceNumber.toString().padStart(6, '0');
  
  if (this.invoiceNumbering === 'date-based') {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${this.invoicePrefix}-${year}${month}-${invoiceNum}`;
  } else if (this.invoiceNumbering === 'random') {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${this.invoicePrefix}-${random}-${invoiceNum}`;
  } else {
    return `${this.invoicePrefix}-${invoiceNum}`;
  }
};

const TaxSettings = mongoose.model('TaxSettings', taxSettingsSchema);

module.exports = TaxSettings;
