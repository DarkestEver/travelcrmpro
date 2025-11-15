const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  importBankStatement,
  autoMatchTransactions,
  manualMatch,
  unmatch,
  getTransactions,
  getUnmatched,
  getReconciliationReport,
  getImportBatches,
  deleteTransaction,
  deleteImportBatch,
  getMatchingSuggestions
} = require('../controllers/bankReconciliationController');
const { protect, restrictTo } = require('../middleware/auth');

// Configure multer for file upload (store in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept CSV and OFX files
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/x-ofx', 'application/octet-stream'];
    const allowedExtensions = ['.csv', '.ofx', '.qfx'];
    
    const hasValidType = allowedTypes.includes(file.mimetype);
    const hasValidExtension = allowedExtensions.some(ext => 
      file.originalname.toLowerCase().endsWith(ext)
    );
    
    if (hasValidType || hasValidExtension) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload CSV or OFX file.'));
    }
  }
});

// All routes require authentication and super_admin/operator/admin/accountant role
router.use(protect);
router.use(restrictTo('super_admin', 'operator', 'admin', 'accountant'));

// Import and matching
router.post('/import', upload.single('bankStatement'), importBankStatement);
router.post('/auto-match', autoMatchTransactions);
router.post('/manual-match', manualMatch);
router.post('/unmatch/:id', unmatch);

// Queries
router.get('/transactions', getTransactions);
router.get('/unmatched', getUnmatched);
router.get('/report', getReconciliationReport);
router.get('/batches', getImportBatches);
router.get('/suggestions/:id', getMatchingSuggestions);

// Deletion
router.delete('/transactions/:id', deleteTransaction);
router.delete('/batches/:batchId', deleteImportBatch);

module.exports = router;
