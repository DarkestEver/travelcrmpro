const Document = require('../models/Document');
const { NotFoundError, ValidationError, ForbiddenError } = require('../lib/errors');

/**
 * Document Controller
 * Document management and verification
 */

/**
 * Upload document (simplified - actual file upload handled by middleware)
 * POST /customer/documents/upload
 */
exports.uploadDocument = async (req, res, next) => {
  try {
    const { documentType, documentNumber, issueDate, expiryDate, issuedBy, issuedCountry, bookingId, notes } = req.body;

    // In production, file would be uploaded via multer middleware
    // For now, we'll accept file info in body
    const { fileUrl, fileName, fileSize, mimeType } = req.body;

    if (!fileUrl || !fileName) {
      throw new ValidationError('File upload failed - fileUrl and fileName required');
    }

    const document = new Document({
      tenant: req.user.tenant,
      customer: req.user._id,
      booking: bookingId,
      documentType,
      fileName,
      fileUrl,
      fileSize,
      mimeType,
      documentNumber,
      issueDate,
      expiryDate,
      issuedBy,
      issuedCountry,
      notes,
      uploadedBy: req.user._id,
    });

    await document.save();

    res.status(201).json({
      success: true,
      data: document,
      message: 'Document uploaded successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get document details
 * GET /customer/documents/:id
 */
exports.getDocumentById = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
      customer: req.user._id,
    })
      .populate('booking', 'bookingNumber destination')
      .populate('verifiedBy', 'firstName lastName');

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    res.json({
      success: true,
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update document details
 * PATCH /customer/documents/:id
 */
exports.updateDocument = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
      customer: req.user._id,
    });

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    // Only allow updating certain fields
    const allowedFields = ['documentNumber', 'issueDate', 'expiryDate', 'issuedBy', 'issuedCountry', 'notes'];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        document[field] = req.body[field];
      }
    });

    document.updatedBy = req.user._id;
    await document.save();

    res.json({
      success: true,
      data: document,
      message: 'Document updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete document
 * DELETE /customer/documents/:id
 */
exports.deleteDocument = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
      customer: req.user._id,
    });

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    // Don't allow deletion of verified documents
    if (document.verificationStatus === 'verified') {
      throw new ForbiddenError('Cannot delete verified document');
    }

    await document.deleteOne();

    res.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get documents by type
 * GET /customer/documents/type/:documentType
 */
exports.getDocumentsByType = async (req, res, next) => {
  try {
    const documents = await Document.find({
      tenant: req.user.tenant,
      customer: req.user._id,
      documentType: req.params.documentType,
    })
      .populate('booking', 'bookingNumber')
      .sort('-createdAt');

    res.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Share document with user
 * POST /customer/documents/:id/share
 */
exports.shareDocument = async (req, res, next) => {
  try {
    const { userId, permissions = 'view', expiresAt } = req.body;

    const document = await Document.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
      customer: req.user._id,
    });

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    document.shareWith(userId, permissions, expiresAt);
    await document.save();

    res.json({
      success: true,
      data: document,
      message: 'Document shared successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Revoke document share
 * DELETE /customer/documents/:id/share/:userId
 */
exports.revokeDocumentShare = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
      customer: req.user._id,
    });

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    document.revokeShare(req.params.userId);
    await document.save();

    res.json({
      success: true,
      message: 'Document share revoked successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get pending verification documents (Agent/Admin)
 * GET /documents/pending-verification
 */
exports.getPendingVerification = async (req, res, next) => {
  try {
    const { documentType, customer, page = 1, limit = 20 } = req.query;

    const query = {
      tenant: req.user.tenant,
      verificationStatus: { $in: ['pending', 'in_review'] },
    };

    if (documentType) query.documentType = documentType;
    if (customer) query.customer = customer;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [documents, totalCount] = await Promise.all([
      Document.find(query)
        .populate('customer', 'firstName lastName email phone')
        .populate('booking', 'bookingNumber')
        .populate('uploadedBy', 'firstName lastName')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Document.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        documents,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          pages: Math.ceil(totalCount / parseInt(limit)),
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify document (Agent/Admin)
 * POST /documents/:id/verify
 */
exports.verifyDocument = async (req, res, next) => {
  try {
    const { notes } = req.body;

    const document = await Document.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    });

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    document.verify(req.user._id, notes);
    await document.save();

    res.json({
      success: true,
      data: document,
      message: 'Document verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject document (Agent/Admin)
 * POST /documents/:id/reject
 */
exports.rejectDocument = async (req, res, next) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      throw new ValidationError('Rejection reason is required');
    }

    const document = await Document.findOne({
      _id: req.params.id,
      tenant: req.user.tenant,
    });

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    document.reject(req.user._id, reason);
    await document.save();

    res.json({
      success: true,
      data: document,
      message: 'Document rejected',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get shared documents (Agent view)
 * GET /documents/shared-with-me
 */
exports.getSharedDocuments = async (req, res, next) => {
  try {
    const documents = await Document.find({
      tenant: req.user.tenant,
      'sharedWith.user': req.user._id,
    })
      .populate('customer', 'firstName lastName email')
      .populate('booking', 'bookingNumber')
      .sort('-updatedAt');

    res.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all documents (Agent/Admin with filters)
 * GET /documents
 */
exports.getAllDocuments = async (req, res, next) => {
  try {
    const { documentType, verificationStatus, customer, bookingId, page = 1, limit = 20 } = req.query;

    const query = { tenant: req.user.tenant };

    if (documentType) query.documentType = documentType;
    if (verificationStatus) query.verificationStatus = verificationStatus;
    if (customer) query.customer = customer;
    if (bookingId) query.booking = bookingId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [documents, totalCount] = await Promise.all([
      Document.find(query)
        .populate('customer', 'firstName lastName email')
        .populate('booking', 'bookingNumber destination')
        .populate('verifiedBy', 'firstName lastName')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Document.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        documents,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          pages: Math.ceil(totalCount / parseInt(limit)),
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get expiring documents (Agent/Admin)
 * GET /documents/expiring
 */
exports.getExpiringDocuments = async (req, res, next) => {
  try {
    const { days = 90 } = req.query;

    const documents = await Document.getExpiringDocuments(req.user.tenant, parseInt(days));

    res.json({
      success: true,
      data: {
        documents,
        count: documents.length,
      },
    });
  } catch (error) {
    next(error);
  }
};
