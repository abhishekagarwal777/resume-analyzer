const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import custom modules
const { globalErrorHandler } = require('./middleware/errorHandler');
const resumeRoutes = require('./routes/resumeRoutes');
const db = require('./db/index');

// Create Express app
const app = express();

// Server configuration
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Trust proxy for deployment environments
app.set('trust proxy', 1);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Define allowed origins
    const allowedOrigins = [
      'http://localhost:3000',     // React dev server
      'http://localhost:3001',     // Alternative React port
      'http://127.0.0.1:3000',     // Localhost alternative
      'http://127.0.0.1:3001',     // Localhost alternative
    ];
    
    // Add production origins if in production
    if (NODE_ENV === 'production') {
      allowedOrigins.push(
        'https://your-domain.com',           // Replace with your domain
        'https://www.your-domain.com',       // Replace with your domain
        'https://resume-analyzer.vercel.app' // Example deployment URL
      );
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`❌ CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24 hours
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  type: 'application/json'
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  type: 'application/x-www-form-urlencoded'
}));

// Security headers middleware
app.use((req, res, next) => {
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Add cache control for API responses
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }
  
  next();
});

// Request logging middleware (development only)
if (NODE_ENV === 'development') {
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl;
    const ip = req.ip || req.connection.remoteAddress;
    
    console.log(`📡 ${timestamp} - ${method} ${url} - IP: ${ip}`);
    
    // Log request body for POST requests (excluding file uploads)
    if (method === 'POST' && !req.is('multipart/form-data') && Object.keys(req.body || {}).length > 0) {
      console.log('📦 Request Body:', JSON.stringify(req.body, null, 2));
    }
    
    next();
  });
}

// Health check route
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    const dbHealth = await db.testConnection();
    
    // Get basic stats
    const stats = await db.getStats();
    
    res.status(200).json({
      success: true,
      message: 'Server is healthy!',
      timestamp: new Date().toISOString(),
      server: {
        status: 'running',
        environment: NODE_ENV,
        port: PORT,
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
        },
        node_version: process.version
      },
      database: {
        status: dbHealth ? 'connected' : 'disconnected',
        name: stats?.database_name || 'unknown',
        size: stats?.database_size || 'unknown',
        total_resumes: stats?.total_resumes || 0
      }
    });
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    res.status(503).json({
      success: false,
      message: 'Server is experiencing issues',
      timestamp: new Date().toISOString(),
      error: NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// API routes
app.use('/api/resumes', resumeRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Resume Analyzer API Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: 'GET /health',
      resumes: {
        upload: 'POST /api/resumes/upload',
        getAll: 'GET /api/resumes',
        getById: 'GET /api/resumes/:id',
        getStats: 'GET /api/resumes/stats',
        delete: 'DELETE /api/resumes/:id'
      }
    },
    documentation: 'https://github.com/your-username/resume-analyzer'
  });
});

// API info route
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Resume Analyzer API',
    version: '1.0.0',
    description: 'AI-powered resume analysis and feedback system',
    timestamp: new Date().toISOString(),
    features: [
      'PDF text extraction',
      'AI-powered content analysis',
      'Skills identification',
      'Resume rating and feedback',
      'Improvement suggestions',
      'Historical resume tracking'
    ],
    endpoints: {
      'POST /api/resumes/upload': 'Upload and analyze a resume',
      'GET /api/resumes': 'Get all analyzed resumes',
      'GET /api/resumes/:id': 'Get specific resume details',
      'GET /api/resumes/stats': 'Get resume statistics',
      'DELETE /api/resumes/:id': 'Delete a resume',
      'GET /health': 'Server health check'
    }
  });
});

// Serve static files in production
if (NODE_ENV === 'production') {
  // Serve static files from React build
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  // Handle React routing for production - specific route
  app.get('/resume-analyzer', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

// Simple 404 handler for API routes - NO WILDCARDS
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: `API route not found: ${req.method} ${req.path}`,
      timestamp: new Date().toISOString()
    });
  }
  next();
});

// Global error handling middleware (must be last)
app.use(globalErrorHandler);

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  console.log(`\n📡 Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Close database connections
    await db.closePool();
    console.log('✅ Database connections closed');
    
    // Close server
    server.close(() => {
      console.log('✅ HTTP server closed');
      console.log('👋 Graceful shutdown completed');
      process.exit(0);
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
      console.log('⚠️ Force closing server after 10 seconds...');
      process.exit(1);
    }, 10000);
    
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error.message);
    process.exit(1);
  }
};

// Handle process signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
  console.error('Error:', error.name, error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 UNHANDLED REJECTION! Shutting down...');
  console.error('Reason:', reason);
  console.error('Promise:', promise);
  
  server.close(() => {
    process.exit(1);
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log('\n🚀 ================================');
  console.log(`🎯 Resume Analyzer Server Started`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  console.log('🚀 ================================\n');
  
  // Log available endpoints
  console.log('📋 Available Endpoints:');
  console.log(`   GET  http://localhost:${PORT}/`);
  console.log(`   GET  http://localhost:${PORT}/health`);
  console.log(`   POST http://localhost:${PORT}/api/resumes/upload`);
  console.log(`   GET  http://localhost:${PORT}/api/resumes`);
  console.log(`   GET  http://localhost:${PORT}/api/resumes/:id`);
  console.log(`   GET  http://localhost:${PORT}/api/resumes/stats`);
  console.log(`   DEL  http://localhost:${PORT}/api/resumes/:id\n`);
});

// Export app for testing purposes
module.exports = app;