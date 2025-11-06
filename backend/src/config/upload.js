const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDirs = [
  'uploads/itineraries',
  'uploads/accommodations',
  'uploads/activities',
  'uploads/meals',
  'uploads/transportation',
  'uploads/temp'
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const type = req.body.type || 'temp';
    let folder = 'uploads/temp';
    
    switch(type) {
      case 'itinerary':
        folder = 'uploads/itineraries';
        break;
      case 'accommodation':
      case 'stay':
        folder = 'uploads/accommodations';
        break;
      case 'activity':
        folder = 'uploads/activities';
        break;
      case 'meal':
        folder = 'uploads/meals';
        break;
      case 'transportation':
      case 'transfer':
        folder = 'uploads/transportation';
        break;
    }
    
    cb(null, folder);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = /jpeg|jpg|png|gif|webp|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WEBP) and PDF documents are allowed!'));
  }
};

// Configure upload
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: fileFilter,
});

// Upload configurations for different scenarios
module.exports = {
  uploadSingle: upload.single('image'),
  uploadMultiple: upload.array('images', 10), // Max 10 images
  uploadFields: upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'images', maxCount: 10 },
    { name: 'documents', maxCount: 5 }
  ]),
  storage,
  fileFilter,
};
