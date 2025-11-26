const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const { ValidationError } = require('../lib/errors');
const logger = require('../lib/logger');

// Upload directory
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
const AVATAR_DIR = path.join(UPLOAD_DIR, 'avatars');
const DOCUMENT_DIR = path.join(UPLOAD_DIR, 'documents');

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

// File size limits (in bytes)
const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Ensure upload directories exist
 */
const ensureUploadDirs = async () => {
  try {
    await fs.mkdir(AVATAR_DIR, { recursive: true });
    await fs.mkdir(DOCUMENT_DIR, { recursive: true });
    logger.info('Upload directories ensured', {
      avatarDir: AVATAR_DIR,
      documentDir: DOCUMENT_DIR,
    });
  } catch (error) {
    logger.error('Failed to create upload directories', { error: error.message });
    throw error;
  }
};

/**
 * Generate unique filename
 */
const generateFilename = (originalName) => {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  return `${timestamp}-${random}${ext}`;
};

/**
 * Multer storage for avatars
 */
const avatarStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureUploadDirs();
    cb(null, AVATAR_DIR);
  },
  filename: (req, file, cb) => {
    const filename = generateFilename(file.originalname);
    cb(null, filename);
  },
});

/**
 * Multer storage for documents
 */
const documentStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureUploadDirs();
    cb(null, DOCUMENT_DIR);
  },
  filename: (req, file, cb) => {
    const filename = generateFilename(file.originalname);
    cb(null, filename);
  },
});

/**
 * File filter for avatars
 */
const avatarFileFilter = (req, file, cb) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ValidationError(
        `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
        'INVALID_FILE_TYPE'
      ),
      false
    );
  }
};

/**
 * File filter for documents
 */
const documentFileFilter = (req, file, cb) => {
  const allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ValidationError(
        `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
        'INVALID_FILE_TYPE'
      ),
      false
    );
  }
};

/**
 * Avatar upload middleware
 */
const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: avatarFileFilter,
  limits: {
    fileSize: MAX_AVATAR_SIZE,
  },
}).single('avatar');

/**
 * Document upload middleware
 */
const uploadDocument = multer({
  storage: documentStorage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: MAX_DOCUMENT_SIZE,
  },
}).single('document');

/**
 * Multiple documents upload middleware
 */
const uploadDocuments = multer({
  storage: documentStorage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: MAX_DOCUMENT_SIZE,
  },
}).array('documents', 10); // Max 10 files

/**
 * Delete a file
 */
const deleteFile = async (filePath) => {
  try {
    const fullPath = path.join(__dirname, '../..', filePath);
    await fs.unlink(fullPath);
    logger.info('File deleted', { filePath });
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      logger.warn('File not found for deletion', { filePath });
      return false;
    }
    logger.error('Failed to delete file', { filePath, error: error.message });
    throw error;
  }
};

/**
 * Get file URL
 */
const getFileUrl = (filename, type = 'avatar') => {
  if (!filename) return null;
  
  // If it's already a full path, return as-is
  if (filename.startsWith('/uploads/')) {
    return filename;
  }
  
  // Otherwise, construct the path
  const folder = type === 'avatar' ? 'avatars' : 'documents';
  return `/uploads/${folder}/${filename}`;
};

/**
 * Validate file exists
 */
const fileExists = async (filePath) => {
  try {
    const fullPath = path.join(__dirname, '../..', filePath);
    await fs.access(fullPath);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get file info
 */
const getFileInfo = async (filePath) => {
  try {
    const fullPath = path.join(__dirname, '../..', filePath);
    const stats = await fs.stat(fullPath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      exists: true,
    };
  } catch (error) {
    return {
      exists: false,
    };
  }
};

module.exports = {
  uploadAvatar,
  uploadDocument,
  uploadDocuments,
  deleteFile,
  getFileUrl,
  fileExists,
  getFileInfo,
  ensureUploadDirs,
  UPLOAD_DIR,
  AVATAR_DIR,
  DOCUMENT_DIR,
};
