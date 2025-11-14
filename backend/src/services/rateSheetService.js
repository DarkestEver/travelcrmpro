/**
 * Rate Sheet Service
 * Phase 5.2: Business logic for rate sheet management
 */

const RateSheet = require('../models/RateSheet');
const Supplier = require('../models/Supplier');
const rateSheetParser = require('./rateSheetParser');
const fs = require('fs').promises;
const path = require('path');

/**
 * Create rate sheet from uploaded file
 */
exports.createRateSheetFromUpload = async (filePath, supplierData, uploadedBy, metadata = {}) => {
  // Parse and process upload
  const processResult = await rateSheetParser.processUpload(filePath, supplierData, uploadedBy);
  
  if (!processResult.success) {
    throw new Error(processResult.message || 'Failed to process upload');
  }
  
  // Create rate sheet
  const rateSheetData = {
    ...processResult.data,
    name: metadata.name || path.basename(filePath, path.extname(filePath)),
    description: metadata.description,
    status: metadata.requireApproval ? 'pending-approval' : 'draft',
    approvalRequired: metadata.requireApproval || false,
    notes: metadata.notes,
  };
  
  const rateSheet = new RateSheet(rateSheetData);
  await rateSheet.save();
  
  return {
    rateSheet,
    errors: processResult.errors,
    warnings: processResult.warnings,
    statistics: processResult.statistics,
  };
};

/**
 * Create rate sheet manually (no CSV)
 */
exports.createRateSheet = async (data, supplierId, uploadedBy) => {
  // Verify supplier exists
  const supplier = await Supplier.findById(supplierId);
  if (!supplier) {
    throw new Error('Supplier not found');
  }
  
  const rateSheetData = {
    ...data,
    supplier: supplierId,
    tenant: supplier.tenant,
    uploadedBy,
    status: data.approvalRequired ? 'pending-approval' : 'draft',
  };
  
  const rateSheet = new RateSheet(rateSheetData);
  await rateSheet.save();
  
  return rateSheet;
};

/**
 * Get rate sheets for supplier with filters
 */
exports.getSupplierRateSheets = async (supplierId, filters = {}) => {
  const query = { supplier: supplierId };
  
  if (filters.status) {
    query.status = filters.status;
  }
  
  if (filters.search) {
    query.$or = [
      { name: new RegExp(filters.search, 'i') },
      { description: new RegExp(filters.search, 'i') },
      { fileName: new RegExp(filters.search, 'i') },
    ];
  }
  
  // Date filtering
  if (filters.validOn) {
    const date = new Date(filters.validOn);
    query.effectiveDate = { $lte: date };
    query.expiryDate = { $gte: date };
  }
  
  const limit = parseInt(filters.limit) || 50;
  const skip = parseInt(filters.skip) || 0;
  
  const rateSheets = await RateSheet.find(query)
    .sort({ version: -1, createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('supplier', 'companyName country')
    .populate('uploadedBy', 'name email')
    .populate('approvedBy', 'name email');
  
  const total = await RateSheet.countDocuments(query);
  
  return {
    rateSheets,
    total,
    page: Math.floor(skip / limit) + 1,
    pages: Math.ceil(total / limit),
  };
};

/**
 * Get single rate sheet by ID
 */
exports.getRateSheetById = async (rateSheetId, supplierId) => {
  const rateSheet = await RateSheet.findOne({
    _id: rateSheetId,
    supplier: supplierId,
  })
    .populate('supplier', 'companyName country')
    .populate('uploadedBy', 'name email')
    .populate('approvedBy', 'name email')
    .populate('previousVersionId');
  
  if (!rateSheet) {
    throw new Error('Rate sheet not found');
  }
  
  return rateSheet;
};

/**
 * Update rate sheet
 */
exports.updateRateSheet = async (rateSheetId, supplierId, updates) => {
  const rateSheet = await RateSheet.findOne({
    _id: rateSheetId,
    supplier: supplierId,
  });
  
  if (!rateSheet) {
    throw new Error('Rate sheet not found');
  }
  
  // Don't allow updates to active rate sheets (create new version instead)
  if (rateSheet.status === 'active') {
    throw new Error('Cannot update active rate sheet. Create a new version instead.');
  }
  
  // Apply updates
  Object.keys(updates).forEach(key => {
    if (key !== '_id' && key !== 'supplier' && key !== 'tenant') {
      rateSheet[key] = updates[key];
    }
  });
  
  await rateSheet.save();
  return rateSheet;
};

/**
 * Delete rate sheet
 */
exports.deleteRateSheet = async (rateSheetId, supplierId) => {
  const rateSheet = await RateSheet.findOne({
    _id: rateSheetId,
    supplier: supplierId,
  });
  
  if (!rateSheet) {
    throw new Error('Rate sheet not found');
  }
  
  // Don't allow deletion of active rate sheets
  if (rateSheet.status === 'active') {
    throw new Error('Cannot delete active rate sheet. Archive it instead.');
  }
  
  // Delete associated file if exists
  if (rateSheet.filePath) {
    try {
      await fs.unlink(rateSheet.filePath);
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  }
  
  await rateSheet.remove();
  return { message: 'Rate sheet deleted successfully' };
};

/**
 * Activate rate sheet
 */
exports.activateRateSheet = async (rateSheetId, supplierId) => {
  const rateSheet = await RateSheet.findOne({
    _id: rateSheetId,
    supplier: supplierId,
  });
  
  if (!rateSheet) {
    throw new Error('Rate sheet not found');
  }
  
  await rateSheet.activate();
  return rateSheet;
};

/**
 * Archive rate sheet
 */
exports.archiveRateSheet = async (rateSheetId, supplierId) => {
  const rateSheet = await RateSheet.findOne({
    _id: rateSheetId,
    supplier: supplierId,
  });
  
  if (!rateSheet) {
    throw new Error('Rate sheet not found');
  }
  
  await rateSheet.archive();
  return rateSheet;
};

/**
 * Approve rate sheet
 */
exports.approveRateSheet = async (rateSheetId, userId) => {
  const rateSheet = await RateSheet.findById(rateSheetId);
  
  if (!rateSheet) {
    throw new Error('Rate sheet not found');
  }
  
  await rateSheet.approve(userId);
  return rateSheet;
};

/**
 * Reject rate sheet
 */
exports.rejectRateSheet = async (rateSheetId, userId, reason) => {
  const rateSheet = await RateSheet.findById(rateSheetId);
  
  if (!rateSheet) {
    throw new Error('Rate sheet not found');
  }
  
  await rateSheet.reject(userId, reason);
  return rateSheet;
};

/**
 * Create new version of rate sheet
 */
exports.createNewVersion = async (rateSheetId, supplierId, updates) => {
  const rateSheet = await RateSheet.findOne({
    _id: rateSheetId,
    supplier: supplierId,
  });
  
  if (!rateSheet) {
    throw new Error('Rate sheet not found');
  }
  
  const newVersion = await rateSheet.createNewVersion(updates);
  return newVersion;
};

/**
 * Get rate sheet history (all versions)
 */
exports.getRateSheetHistory = async (supplierId, name) => {
  const history = await RateSheet.find({
    supplier: supplierId,
    name,
  })
    .sort({ version: -1 })
    .populate('uploadedBy', 'name email')
    .populate('approvedBy', 'name email');
  
  return history;
};

/**
 * Compare two rate sheet versions
 */
exports.compareVersions = async (rateSheetId1, rateSheetId2) => {
  const [v1, v2] = await Promise.all([
    RateSheet.findById(rateSheetId1),
    RateSheet.findById(rateSheetId2),
  ]);
  
  if (!v1 || !v2) {
    throw new Error('One or both rate sheets not found');
  }
  
  // Compare basic metadata
  const differences = {
    metadata: {},
    ratesAdded: [],
    ratesRemoved: [],
    ratesModified: [],
  };
  
  // Metadata comparison
  ['effectiveDate', 'expiryDate', 'status'].forEach(field => {
    if (v1[field]?.toString() !== v2[field]?.toString()) {
      differences.metadata[field] = {
        old: v1[field],
        new: v2[field],
      };
    }
  });
  
  // Rate comparison by serviceCode
  const v1Codes = new Set(v1.rates.map(r => r.serviceCode));
  const v2Codes = new Set(v2.rates.map(r => r.serviceCode));
  
  // Find added rates
  v2.rates.forEach(rate => {
    if (!v1Codes.has(rate.serviceCode)) {
      differences.ratesAdded.push(rate);
    }
  });
  
  // Find removed rates
  v1.rates.forEach(rate => {
    if (!v2Codes.has(rate.serviceCode)) {
      differences.ratesRemoved.push(rate);
    }
  });
  
  // Find modified rates
  v2.rates.forEach(newRate => {
    const oldRate = v1.rates.find(r => r.serviceCode === newRate.serviceCode);
    if (oldRate) {
      const changes = {};
      ['basePrice', 'currency', 'validFrom', 'validTo', 'seasonName'].forEach(field => {
        if (oldRate[field]?.toString() !== newRate[field]?.toString()) {
          changes[field] = {
            old: oldRate[field],
            new: newRate[field],
          };
        }
      });
      
      if (Object.keys(changes).length > 0) {
        differences.ratesModified.push({
          serviceCode: newRate.serviceCode,
          serviceName: newRate.serviceName,
          changes,
        });
      }
    }
  });
  
  return differences;
};

/**
 * Get supplier statistics
 */
exports.getSupplierStats = async (supplierId) => {
  const [
    total,
    active,
    draft,
    expired,
    expiringSoon,
  ] = await Promise.all([
    RateSheet.countDocuments({ supplier: supplierId }),
    RateSheet.countDocuments({ supplier: supplierId, status: 'active' }),
    RateSheet.countDocuments({ supplier: supplierId, status: 'draft' }),
    RateSheet.countDocuments({ supplier: supplierId, status: 'expired' }),
    RateSheet.getExpiringSoon(null, 30).then(sheets => 
      sheets.filter(s => s.supplier.toString() === supplierId.toString()).length
    ),
  ]);
  
  return {
    total,
    active,
    draft,
    expired,
    expiringSoon,
  };
};

/**
 * Search rate sheets (public/operator access)
 */
exports.searchRateSheets = async (filters = {}) => {
  return RateSheet.search(filters);
};

/**
 * Get rate by service code
 */
exports.getRateByServiceCode = async (rateSheetId, serviceCode) => {
  const rateSheet = await RateSheet.findById(rateSheetId);
  
  if (!rateSheet) {
    throw new Error('Rate sheet not found');
  }
  
  return rateSheet.getRateByServiceCode(serviceCode);
};

/**
 * Get applicable rate for specific date
 */
exports.getApplicableRate = async (rateSheetId, serviceCode, date) => {
  const rateSheet = await RateSheet.findById(rateSheetId);
  
  if (!rateSheet) {
    throw new Error('Rate sheet not found');
  }
  
  return rateSheet.getApplicableRate(serviceCode, date);
};

/**
 * Generate CSV template
 */
exports.generateTemplate = () => {
  return rateSheetParser.generateTemplate();
};

/**
 * Get expiring rate sheets for tenant
 */
exports.getExpiringRateSheets = async (tenantId, days = 30) => {
  return RateSheet.getExpiringSoon(tenantId, days);
};
