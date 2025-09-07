/**
 * Global Error Handler Middleware
 * Handles all errors in the application and returns appropriate responses
 */

/**
 * Custom Error Class for Application-specific errors
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle Cast Errors (Invalid ObjectId, etc.)
 * @param {Error} err - The error object
 * @returns {AppError} - Formatted error
 */
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

/**
 * Handle Duplicate Field Errors
 * @param {Error} err - The error object
 * @returns {AppError} - Formatted error
 */
const handleDuplicateFieldsDB = (err) => {
  // Extract the duplicate field from error message
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  
  const message = `Duplicate field value: "${value}" for field "${field}". Please use another value.`;
  return new AppError(message, 400);
};

/**
 * Handle PostgreSQL specific errors
 * @param {Error} err - The error object
 * @returns {AppError} - Formatted error
 */
const handlePostgreSQLError = (err) => {
  switch (err.code) {
    case '23505': // Unique violation
      const match = err.detail?.match(/Key \((.+)\)=\((.+)\)/);
      const field = match ? match[1] : 'field';
      const value = match ? match[2] : 'value';
      return new AppError(`Duplicate ${field}: ${value} already exists.`, 400);
      
    case '23502': // Not null violation
      const column = err.column || 'required field';
      return new AppError(`Missing required field: ${column}`, 400);
      
    case '23514': // Check constraint violation
      return new AppError('Data validation failed. Please check your input.', 400);
      
    case '42P01': // Undefined table
      return new AppError('Database table not found. Please contact support.', 500);
      
    case '42703': // Undefined column
      return new AppError('Invalid data structure. Please contact support.', 500);
      
    case '28P01': // Invalid password
      return new AppError('Database authentication failed.', 500);
      
    case '3D000': // Invalid database name
      return new AppError('Database not found.', 500);
      
    case '53300': // Too many connections
      return new AppError('Service temporarily unavailable. Please try again later.', 503);
      
    default:
      return new AppError('Database operation failed.', 500);
  }
};

/**
 * Handle validation errors
 * @param {Error} err - The error object
 * @returns {AppError} - Formatted error
 */
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

/**
 * Handle JWT errors
 * @param {Error} err - The error object
 * @returns {AppError} - Formatted error
 */
const handleJWTError = () => {
  return new AppError('Invalid token. Please log in again.', 401);
};

/**
 * Handle JWT expired errors
 * @param {Error} err - The error object
 * @returns {AppError} - Formatted error
 */
const handleJWTExpiredError = () => {
  return new AppError('Your token has expired. Please log in again.', 401);
};

/**
 * Handle Multer errors (File upload errors)
 * @param {Error} err - The error object
 * @returns {AppError} - Formatted error
 */
const handleMulterError = (err) => {
  switch (err.code) {
    case 'LIMIT_FILE_SIZE':
      return new AppError('File too large. Maximum size is 5MB.', 400);
    case 'LIMIT_FILE_COUNT':
      return new AppError('Too many files. Please upload one file at a time.', 400);
    case 'LIMIT_UNEXPECTED_FILE':
      return new AppError('Unexpected field name. Please use "resume" as field name.', 400);
    case 'LIMIT_PART_COUNT':
      return new AppError('Too many parts in the request.', 400);
    case 'LIMIT_FIELD_KEY':
      return new AppError('Field name too long.', 400);
    case 'LIMIT_FIELD_VALUE':
      return new AppError('Field value too long.', 400);
    case 'LIMIT_FIELD_COUNT':
      return new AppError('Too many fields in the request.', 400);
    default:
      return new AppError('File upload failed.', 400);
  }
};

/**
 * Handle PDF parsing errors
 * @param {Error} err - The error object
 * @returns {AppError} - Formatted error
 */
const handlePDFError = (err) => {
  if (err.message.includes('PDF parsing failed') || err.message.includes('Invalid PDF')) {
    return new AppError('Unable to process PDF file. Please ensure it\'s a valid, non-encrypted PDF.', 400);
  }
  if (err.message.includes('password')) {
    return new AppError('PDF is password protected. Please upload an unprotected PDF.', 400);
  }
  return new AppError('PDF processing failed. Please try with a different file.', 400);
};

/**
 * Handle AI/LLM service errors
 * @param {Error} err - The error object
 * @returns {AppError} - Formatted error
 */
const handleAIServiceError = (err) => {
  if (err.message.includes('API key')) {
    return new AppError('AI service configuration error. Please contact support.', 500);
  }
  if (err.message.includes('quota') || err.message.includes('limit')) {
    return new AppError('AI service temporarily unavailable due to usage limits. Please try again later.', 503);
  }
  if (err.message.includes('timeout')) {
    return new AppError('AI analysis is taking longer than expected. Please try again.', 408);
  }
  return new AppError('AI analysis service is temporarily unavailable. Please try again later.', 503);
};

/**
 * Send error response in development mode
 * @param {Error} err - The error object
 * @param {Object} res - Express response object
 */
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    error: err,
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });
};

/**
 * Send error response in production mode
 * @param {Error} err - The error object
 * @param {Object} res - Express response object
 */
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      timestamp: new Date().toISOString()
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥:', err);
    
    res.status(500).json({
      success: false,
      message: 'Something went wrong! Please try again later.',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Log error details for monitoring
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 */
const logError = (err, req) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    error: {
      name: err.name,
      message: err.message,
      statusCode: err.statusCode,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  };
  
  // In production, you might want to send this to a logging service
  console.error('🚨 Error Log:', JSON.stringify(errorLog, null, 2));
};

/**
 * Main error handling middleware
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const globalErrorHandler = (err, req, res, next) => {
  // Set default error properties
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log the error
  logError(err, req);

  let error = { ...err };
  error.message = err.message;

  // Handle specific error types
  if (err.name === 'CastError') error = handleCastErrorDB(error);
  if (err.code === 11000) error = handleDuplicateFieldsDB(error);
  if (err.name === 'ValidationError') error = handleValidationError(error);
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
  
  // Handle PostgreSQL errors
  if (err.code && typeof err.code === 'string' && err.code.match(/^[0-9A-Z]{5}$/)) {
    error = handlePostgreSQLError(error);
  }
  
  // Handle Multer errors
  if (err.code && err.code.startsWith('LIMIT_')) {
    error = handleMulterError(error);
  }
  
  // Handle PDF errors
  if (err.message && (err.message.includes('PDF') || err.message.includes('pdf'))) {
    error = handlePDFError(error);
  }
  
  // Handle AI service errors
  if (err.message && (err.message.includes('AI analysis') || err.message.includes('Gemini') || err.message.includes('API key'))) {
    error = handleAIServiceError(error);
  }

  // Send appropriate error response
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

/**
 * Handle 404 errors for undefined routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const notFoundHandler = (req, res, next) => {
  const err = new AppError(`Can't find ${req.originalUrl} on this server!`, 404);
  next(err);
};

/**
 * Async error wrapper to catch errors in async functions
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Wrapped function
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = {
  AppError,
  globalErrorHandler,
  notFoundHandler,
  catchAsync
};