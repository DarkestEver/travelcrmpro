const express = require('express');
const router = express.Router();
const { uploadSingle, uploadMultiple, uploadFields } = require('../config/upload');
const uploadController = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');

// All upload routes require authentication
router.use(protect);

/**
 * @swagger
 * /upload/image:
 *   post:
 *     summary: Upload single image
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               type:
 *                 type: string
 *                 enum: [itinerary, accommodation, activity, meal, transportation]
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 */
router.post('/image', uploadSingle, uploadController.uploadImage);

/**
 * @swagger
 * /upload/images:
 *   post:
 *     summary: Upload multiple images
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               type:
 *                 type: string
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 */
router.post('/images', uploadMultiple, uploadController.uploadMultipleImages);

/**
 * @swagger
 * /upload/files:
 *   post:
 *     summary: Upload cover image, images, and documents
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               coverImage:
 *                 type: string
 *                 format: binary
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               documents:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Files uploaded successfully
 */
router.post('/files', uploadFields, uploadController.uploadFiles);

/**
 * @swagger
 * /upload/{filename}:
 *   delete:
 *     summary: Delete uploaded file
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File deleted successfully
 */
router.delete('/:filename', uploadController.deleteFile);

/**
 * @swagger
 * /upload/{type}/{filename}:
 *   get:
 *     summary: Get uploaded file
 *     tags: [Upload]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File retrieved successfully
 */
router.get('/:type/:filename', uploadController.getFile);

module.exports = router;
