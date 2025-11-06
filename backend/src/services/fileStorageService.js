const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const logger = require('../utils/logger');

class FileStorageService {
  constructor() {
    this.uploadsDir = path.join(__dirname, '../../uploads');
    this.initializeDirectories();
  }

  async initializeDirectories() {
    const dirs = [
      'uploads/images',
      'uploads/documents',
      'uploads/pdfs',
      'uploads/avatars',
      'uploads/temp',
    ];

    for (const dir of dirs) {
      try {
        await fs.mkdir(path.join(__dirname, '../../', dir), { recursive: true });
      } catch (error) {
        logger.error(`Error creating directory ${dir}:`, error);
      }
    }
  }

  /**
   * Configure multer storage
   */
  getMulterConfig(type = 'general') {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = path.join(this.uploadsDir, this.getUploadPath(type));
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
      },
    });

    const fileFilter = (req, file, cb) => {
      if (this.isValidFileType(file, type)) {
        cb(null, true);
      } else {
        cb(new Error(`Invalid file type for ${type}. File: ${file.originalname}`));
      }
    };

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: this.getMaxFileSize(type),
      },
    });
  }

  getUploadPath(type) {
    const paths = {
      avatar: 'avatars',
      document: 'documents',
      pdf: 'pdfs',
      image: 'images',
      general: 'temp',
    };

    return paths[type] || 'temp';
  }

  isValidFileType(file, type) {
    const mimeTypes = {
      avatar: ['image/jpeg', 'image/png', 'image/jpg'],
      image: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
      document: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ],
      pdf: ['application/pdf'],
      general: [
        'image/jpeg',
        'image/png',
        'image/jpg',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
    };

    const allowedTypes = mimeTypes[type] || mimeTypes.general;
    return allowedTypes.includes(file.mimetype);
  }

  getMaxFileSize(type) {
    const sizes = {
      avatar: 2 * 1024 * 1024, // 2MB
      image: 5 * 1024 * 1024, // 5MB
      document: 10 * 1024 * 1024, // 10MB
      pdf: 10 * 1024 * 1024, // 10MB
      general: 5 * 1024 * 1024, // 5MB
    };

    return sizes[type] || sizes.general;
  }

  /**
   * Process and optimize image
   */
  async processImage(filePath, options = {}) {
    try {
      const {
        width = 800,
        height = null,
        quality = 80,
        format = 'jpeg',
        fit = 'inside',
      } = options;

      const outputPath = filePath.replace(
        path.extname(filePath),
        `-optimized.${format}`
      );

      await sharp(filePath)
        .resize(width, height, { fit })
        .toFormat(format, { quality })
        .toFile(outputPath);

      // Delete original if optimization successful
      await fs.unlink(filePath);

      logger.info(`Image processed: ${outputPath}`);

      return outputPath;
    } catch (error) {
      logger.error('Error processing image:', error);
      throw error;
    }
  }

  /**
   * Create thumbnail
   */
  async createThumbnail(filePath, size = 150) {
    try {
      const ext = path.extname(filePath);
      const thumbnailPath = filePath.replace(ext, `-thumb${ext}`);

      await sharp(filePath)
        .resize(size, size, { fit: 'cover' })
        .toFormat('jpeg', { quality: 70 })
        .toFile(thumbnailPath);

      logger.info(`Thumbnail created: ${thumbnailPath}`);

      return thumbnailPath;
    } catch (error) {
      logger.error('Error creating thumbnail:', error);
      throw error;
    }
  }

  /**
   * Delete file
   */
  async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
      logger.info(`File deleted: ${filePath}`);
      return true;
    } catch (error) {
      logger.error('Error deleting file:', error);
      return false;
    }
  }

  /**
   * Get file info
   */
  async getFileInfo(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        extension: path.extname(filePath),
        filename: path.basename(filePath),
      };
    } catch (error) {
      logger.error('Error getting file info:', error);
      throw error;
    }
  }

  /**
   * Move file
   */
  async moveFile(sourcePath, destinationPath) {
    try {
      await fs.rename(sourcePath, destinationPath);
      logger.info(`File moved from ${sourcePath} to ${destinationPath}`);
      return destinationPath;
    } catch (error) {
      logger.error('Error moving file:', error);
      throw error;
    }
  }

  /**
   * Clean up old temporary files
   */
  async cleanupTempFiles(maxAge = 24 * 60 * 60 * 1000) {
    try {
      const tempDir = path.join(this.uploadsDir, 'temp');
      const files = await fs.readdir(tempDir);

      let deletedCount = 0;
      const now = Date.now();

      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);

        if (now - stats.mtimeMs > maxAge) {
          await this.deleteFile(filePath);
          deletedCount++;
        }
      }

      logger.info(`Cleaned up ${deletedCount} temporary files`);

      return deletedCount;
    } catch (error) {
      logger.error('Error cleaning up temp files:', error);
      return 0;
    }
  }

  /**
   * Generate secure file URL
   */
  generateFileUrl(filePath, baseUrl = process.env.BACKEND_URL) {
    const relativePath = filePath.replace(this.uploadsDir, '');
    return `${baseUrl}/uploads${relativePath.replace(/\\/g, '/')}`;
  }

  /**
   * Validate file exists
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

// Singleton instance
const fileStorageService = new FileStorageService();

module.exports = fileStorageService;
