const fs = require('fs').promises;
const path = require('path');

/**
 * Upload single image
 * @route POST /api/v1/upload/image
 * @access Private
 */
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file',
      });
    }

    // Generate URL for the uploaded file
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${path.relative('uploads', req.file.path).replace(/\\/g, '/')}`;

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        path: req.file.path,
        url: fileUrl,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading image',
      error: error.message,
    });
  }
};

/**
 * Upload multiple images
 * @route POST /api/v1/upload/images
 * @access Private
 */
exports.uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one image file',
      });
    }

    // Generate URLs for all uploaded files
    const filesData = req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      path: file.path,
      url: `${req.protocol}://${req.get('host')}/uploads/${path.relative('uploads', file.path).replace(/\\/g, '/')}`,
      size: file.size,
      mimetype: file.mimetype,
    }));

    res.status(200).json({
      success: true,
      message: `${filesData.length} image(s) uploaded successfully`,
      data: filesData,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading images',
      error: error.message,
    });
  }
};

/**
 * Upload images and documents
 * @route POST /api/v1/upload/files
 * @access Private
 */
exports.uploadFiles = async (req, res) => {
  try {
    if (!req.files) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded',
      });
    }

    const result = {};

    // Process cover image
    if (req.files.coverImage && req.files.coverImage[0]) {
      const file = req.files.coverImage[0];
      result.coverImage = {
        filename: file.filename,
        url: `${req.protocol}://${req.get('host')}/uploads/${path.relative('uploads', file.path).replace(/\\/g, '/')}`,
      };
    }

    // Process multiple images
    if (req.files.images) {
      result.images = req.files.images.map(file => ({
        filename: file.filename,
        url: `${req.protocol}://${req.get('host')}/uploads/${path.relative('uploads', file.path).replace(/\\/g, '/')}`,
      }));
    }

    // Process documents
    if (req.files.documents) {
      result.documents = req.files.documents.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        url: `${req.protocol}://${req.get('host')}/uploads/${path.relative('uploads', file.path).replace(/\\/g, '/')}`,
      }));
    }

    res.status(200).json({
      success: true,
      message: 'Files uploaded successfully',
      data: result,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading files',
      error: error.message,
    });
  }
};

/**
 * Delete uploaded file
 * @route DELETE /api/v1/upload/:filename
 * @access Private
 */
exports.deleteFile = async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Search in all upload directories
    const uploadDirs = [
      'uploads/itineraries',
      'uploads/accommodations',
      'uploads/activities',
      'uploads/meals',
      'uploads/transportation',
      'uploads/temp'
    ];

    let fileDeleted = false;
    
    for (const dir of uploadDirs) {
      const filePath = path.join(dir, filename);
      try {
        await fs.access(filePath);
        await fs.unlink(filePath);
        fileDeleted = true;
        break;
      } catch (err) {
        // File not in this directory, continue searching
        continue;
      }
    }

    if (!fileDeleted) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting file',
      error: error.message,
    });
  }
};

/**
 * Get uploaded file
 * @route GET /api/v1/upload/:type/:filename
 * @access Public
 */
exports.getFile = async (req, res) => {
  try {
    const { type, filename } = req.params;
    
    const typeMap = {
      'itinerary': 'itineraries',
      'accommodation': 'accommodations',
      'activity': 'activities',
      'meal': 'meals',
      'transportation': 'transportation',
      'temp': 'temp'
    };

    const dir = typeMap[type] || type;
    const filePath = path.join('uploads', dir, filename);

    // Check if file exists
    await fs.access(filePath);

    // Send file
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    res.status(404).json({
      success: false,
      message: 'File not found',
    });
  }
};
