const express = require('express');
const multer = require('multer');
const path = require('path');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const resumeController = require('../controllers/resumeController');

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.memoryStorage(); // Store files in memory as Buffer

// File filter function to only allow PDF files
const fileFilter = (req, file, cb) => {
  // Check if the file is a PDF
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    // Reject file with error
    const error = new AppError('Only PDF files are allowed!', 400);
    cb(error, false);
  }
};

// Multer upload configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
    files: 1, // Only allow 1 file at a time
    fields: 10, // Limit number of non-file fields
    fieldNameSize: 50, // Limit field name size
    fieldSize: 1024 * 100 // 100KB limit for field values
  }
});

// Middleware to validate file upload
const validateFileUpload = (req, res, next) => {
  // Check if file exists
  if (!req.file) {
    return next(new AppError('No file uploaded. Please select a PDF file.', 400));
  }

  // Additional file validation
  const allowedMimeTypes = ['application/pdf'];
  if (!allowedMimeTypes.includes(req.file.mimetype)) {
    return next(new AppError('Invalid file type. Only PDF files are allowed.', 400));
  }

  // Check file size (additional check)
  if (req.file.size > 5 * 1024 * 1024) {
    return next(new AppError('File too large. Maximum size is 5MB.', 400));
  }

  // Check if file has content
  if (req.file.size === 0) {
    return next(new AppError('Empty file uploaded. Please select a valid PDF file.', 400));
  }

  next();
};

// Middleware to validate resume ID parameter
const validateResumeId = (req, res, next) => {
  const { id } = req.params;
  
  if (!id) {
    return next(new AppError('Resume ID is required.', 400));
  }

  if (isNaN(parseInt(id)) || parseInt(id) <= 0) {
    return next(new AppError('Invalid resume ID. ID must be a positive number.', 400));
  }

  next();
};

// Middleware for request logging
const logRequest = (req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  
  // Log file info for upload requests
  if (req.file) {
    console.log(`File: ${req.file.originalname} (${req.file.size} bytes)`);
  }
  
  next();
};

// Routes

/**
 * @route   POST /api/resumes/upload
 * @desc    Upload and analyze a resume
 * @access  Public
 */
router.post('/upload', 
  logRequest,
  upload.single('resume'),
  validateFileUpload,
  catchAsync(resumeController.uploadResume)
);

/**
 * @route   GET /api/resumes
 * @desc    Get all resumes (summary view for table)
 * @access  Public
 */
router.get('/',
  logRequest,
  catchAsync(resumeController.getAllResumes)
);

/**
 * @route   GET /api/resumes/stats
 * @desc    Get resume statistics
 * @access  Public
 */
router.get('/stats',
  logRequest,
  catchAsync(resumeController.getResumeStats)
);

/**
 * @route   GET /api/resumes/:id
 * @desc    Get a specific resume by ID
 * @access  Public
 */
router.get('/:id',
  logRequest,
  validateResumeId,
  catchAsync(resumeController.getResumeById)
);

/**
 * @route   PUT /api/resumes/:id
 * @desc    Update a resume (future feature)
 * @access  Public
 */
router.put('/:id',
  logRequest,
  validateResumeId,
  (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Resume update feature coming soon!'
    });
  }
);

/**
 * @route   DELETE /api/resumes/:id
 * @desc    Delete a resume by ID
 * @access  Public
 */
router.delete('/:id',
  logRequest,
  validateResumeId,
  catchAsync(resumeController.deleteResume)
);

/**
 * @route   POST /api/resumes/bulk-upload
 * @desc    Upload multiple resumes (future feature)
 * @access  Public
 */
router.post('/bulk-upload',
  logRequest,
  (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Bulk upload feature coming soon!'
    });
  }
);

/**
 * @route   GET /api/resumes/search/:query
 * @desc    Search resumes by name, email, or skills (future feature)
 * @access  Public
 */
router.get('/search/:query',
  logRequest,
  (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Resume search feature coming soon!'
    });
  }
);

/**
 * @route   POST /api/resumes/:id/reanalyze
 * @desc    Reanalyze an existing resume (future feature)
 * @access  Public
 */
router.post('/:id/reanalyze',
  logRequest,
  validateResumeId,
  (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Resume reanalysis feature coming soon!'
    });
  }
);

/**
 * @route   GET /api/resumes/export/:format
 * @desc    Export resumes in different formats (CSV, JSON, etc.)
 * @access  Public
 */
router.get('/export/:format',
  logRequest,
  (req, res) => {
    const { format } = req.params;
    
    if (!['csv', 'json', 'xlsx'].includes(format.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid export format. Supported formats: csv, json, xlsx'
      });
    }
    
    res.status(501).json({
      success: false,
      message: `Export to ${format.toUpperCase()} feature coming soon!`
    });
  }
);

// Error handling middleware specifically for multer errors
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    let message;
    
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File too large. Maximum size is 5MB.';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files. Please upload one file at a time.';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected field name. Please use "resume" as the field name.';
        break;
      default:
        message = 'File upload error occurred.';
    }
    
    return res.status(400).json({
      success: false,
      message: message,
      timestamp: new Date().toISOString()
    });
  }
  
  next(err);
};

// Apply multer error handler to this router
router.use(handleMulterError);

// Health check route for this module
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Resume routes are healthy!',
    timestamp: new Date().toISOString(),
    routes: {
      upload: 'POST /upload',
      getAll: 'GET /',
      getById: 'GET /:id',
      getStats: 'GET /stats',
      delete: 'DELETE /:id'
    }
  });
});

module.exports = router;