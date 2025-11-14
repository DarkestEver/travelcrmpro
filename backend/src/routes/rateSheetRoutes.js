/**
 * Rate Sheet Routes
 * Phase 5.2: Routes for rate sheet management with file upload support
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {
  uploadRateSheet,
  createRateSheet,
  getMyRateSheets,
  getRateSheetById,
  updateRateSheet,
  deleteRateSheet,
  activateRateSheet,
  archiveRateSheet,
  approveRateSheet,
  rejectRateSheet,
  createNewVersion,
  getRateSheetHistory,
  compareVersions,
  getRateSheetStats,
  searchRateSheets,
  getRateByServiceCode,
  getApplicableRate,
  getTemplate,
  getExpiringRateSheets,
} = require('../controllers/rateSheetController');

const { protect, restrictTo, loadSupplier } = require('../middleware/auth');

// Configure multer for file uploads
const uploadDir = path.join(__dirname, '../../uploads/rate-sheets');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename: supplier-id_timestamp_original-name
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, '-').toLowerCase();
    cb(null, `${req.supplier._id}_${uniqueSuffix}_${name}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  // Accept only CSV files
  const allowedTypes = ['.csv', '.CSV'];
  const ext = path.extname(file.originalname);
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

// Supplier routes (require supplier authentication)
router.use(protect);
router.use(loadSupplier);

// Public template download (before supplier-specific routes)
router.get('/template', getTemplate);

// Upload route (with multer middleware)
router.post('/upload', upload.single('file'), uploadRateSheet);

// CRUD routes
router.route('/')
  .get(getMyRateSheets)
  .post(createRateSheet);

router.get('/stats', getRateSheetStats);
router.get('/expiring', getExpiringRateSheets);
router.get('/search', searchRateSheets);

// History and comparison
router.get('/history/:name', getRateSheetHistory);
router.get('/compare/:id1/:id2', compareVersions);

// Individual rate sheet operations
router.route('/:id')
  .get(getRateSheetById)
  .put(updateRateSheet)
  .delete(deleteRateSheet);

// Status management
router.patch('/:id/activate', activateRateSheet);
router.patch('/:id/archive', archiveRateSheet);

// Version management
router.post('/:id/new-version', createNewVersion);

// Rate queries
router.get('/:id/rates/:serviceCode', getRateByServiceCode);
router.get('/:id/rates/:serviceCode/applicable', getApplicableRate);

// Admin routes (approval workflow)
router.post('/:id/approve', restrictTo('admin', 'operator'), approveRateSheet);
router.post('/:id/reject', restrictTo('admin', 'operator'), rejectRateSheet);

module.exports = router;
