const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const dbConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  maxUses: 7500, // Close a connection after it has been used 7500 times
};

// Create connection pool
const pool = new Pool(dbConfig);

// Handle pool errors
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client:', err);
  process.exit(-1);
});

// Handle pool connect
pool.on('connect', (client) => {
  console.log('New client connected to database');
});

// Handle pool remove
pool.on('remove', (client) => {
  console.log('Client removed from pool');
});

/**
 * Test database connection
 * @returns {Promise<boolean>} - Returns true if connection is successful
 */
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    
    console.log('✅ Database connection successful');
    console.log('📅 Current database time:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

/**
 * Initialize database tables if they don't exist
 * @returns {Promise<boolean>} - Returns true if initialization is successful
 */
const initializeDatabase = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS resumes (
      id SERIAL PRIMARY KEY,
      file_name VARCHAR(255) NOT NULL,
      uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      name VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(50),
      linkedin_url VARCHAR(255),
      portfolio_url VARCHAR(255),
      summary TEXT,
      work_experience JSONB,
      education JSONB,
      technical_skills JSONB,
      soft_skills JSONB,
      projects JSONB,
      certifications JSONB,
      resume_rating INTEGER CHECK (resume_rating >= 1 AND resume_rating <= 10),
      improvement_areas TEXT,
      upskill_suggestions JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createIndexesQuery = `
    CREATE INDEX IF NOT EXISTS idx_resumes_uploaded_at ON resumes(uploaded_at DESC);
    CREATE INDEX IF NOT EXISTS idx_resumes_rating ON resumes(resume_rating);
    CREATE INDEX IF NOT EXISTS idx_resumes_email ON resumes(email);
    CREATE INDEX IF NOT EXISTS idx_resumes_name ON resumes(name);
  `;

  const createUpdateTriggerQuery = `
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ language 'plpgsql';

    DROP TRIGGER IF EXISTS update_resumes_updated_at ON resumes;
    
    CREATE TRIGGER update_resumes_updated_at 
      BEFORE UPDATE ON resumes 
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();
  `;

  try {
    const client = await pool.connect();
    
    // Create tables
    await client.query(createTableQuery);
    console.log('✅ Resumes table created/verified');
    
    // Create indexes for better performance
    await client.query(createIndexesQuery);
    console.log('✅ Database indexes created/verified');
    
    // Create update trigger for updated_at field
    await client.query(createUpdateTriggerQuery);
    console.log('✅ Update triggers created/verified');
    
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    return false;
  }
};

/**
 * Execute a query with connection handling
 * @param {string} text - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} - Query result
 */
const query = async (text, params) => {
  const start = Date.now();
  const client = await pool.connect();
  
  try {
    const result = await client.query(text, params);
    const duration = Date.now() - start;
    
    // Log slow queries (over 100ms)
    if (duration > 100) {
      console.log('⚠️ Slow query executed:', {
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        duration: `${duration}ms`,
        rows: result.rowCount
      });
    }
    
    return result;
  } finally {
    client.release();
  }
};

/**
 * Execute a transaction
 * @param {Function} callback - Function to execute within transaction
 * @returns {Promise<*>} - Transaction result
 */
const transaction = async (callback) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get database statistics
 * @returns {Promise<Object>} - Database statistics
 */
const getStats = async () => {
  try {
    const result = await query(`
      SELECT 
        pg_size_pretty(pg_database_size(current_database())) as database_size,
        (SELECT count(*) FROM resumes) as total_resumes,
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
        current_database() as database_name,
        version() as postgres_version
    `);
    
    return result.rows[0];
  } catch (error) {
    console.error('Error getting database stats:', error);
    return null;
  }
};

/**
 * Clean up old test data (optional utility function)
 * @param {number} days - Delete records older than this many days
 * @returns {Promise<number>} - Number of deleted records
 */
const cleanupOldRecords = async (days = 30) => {
  try {
    const result = await query(`
      DELETE FROM resumes 
      WHERE uploaded_at < NOW() - INTERVAL '${days} days'
      AND file_name ILIKE '%test%'
    `);
    
    console.log(`🧹 Cleaned up ${result.rowCount} old test records`);
    return result.rowCount;
  } catch (error) {
    console.error('Error cleaning up old records:', error);
    return 0;
  }
};

/**
 * Graceful shutdown function
 */
const closePool = async () => {
  try {
    await pool.end();
    console.log('🔌 Database pool has been closed');
  } catch (error) {
    console.error('Error closing database pool:', error);
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  console.log('📡 Received SIGINT, closing database connections...');
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('📡 Received SIGTERM, closing database connections...');
  await closePool();
  process.exit(0);
});

// Auto-initialize database on startup
(async () => {
  const isConnected = await testConnection();
  if (isConnected) {
    await initializeDatabase();
    
    // Log database stats on startup
    const stats = await getStats();
    if (stats) {
      console.log('📊 Database Stats:', {
        database: stats.database_name,
        size: stats.database_size,
        resumes: stats.total_resumes,
        connections: stats.active_connections
      });
    }
  } else {
    console.error('🚨 Failed to establish database connection. Please check your configuration.');
  }
})();

// Export the pool and utility functions
module.exports = {
  query,
  transaction,
  testConnection,
  initializeDatabase,
  getStats,
  cleanupOldRecords,
  closePool,
  pool // Export pool directly for advanced use cases
};