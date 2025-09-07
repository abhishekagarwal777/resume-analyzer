import axios from 'axios';

/**
 * API Service for Resume Analyzer
 * Handles all HTTP requests to the backend API
 */

// Base API URL - change this for production deployment
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout for file uploads
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging and adding auth headers (if needed)
apiClient.interceptors.request.use(
  (config) => {
    // Log API requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      if (config.data && !(config.data instanceof FormData)) {
        console.log('📦 Request Data:', config.data);
      }
    }

    // Add timestamp to prevent caching
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      };
    }

    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and logging
apiClient.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`);
      console.log('📨 Response Data:', response.data);
    }
    return response;
  },
  (error) => {
    // Enhanced error logging
    console.error('❌ API Error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      data: error.response?.data
    });

    // Handle specific error cases
    if (error.response?.status === 413) {
      error.message = 'File too large. Please select a smaller file.';
    } else if (error.response?.status === 415) {
      error.message = 'Unsupported file type. Please upload a PDF file.';
    } else if (error.response?.status === 429) {
      error.message = 'Too many requests. Please wait a moment and try again.';
    } else if (error.response?.status >= 500) {
      error.message = 'Server error. Please try again later.';
    } else if (error.code === 'ECONNABORTED') {
      error.message = 'Request timeout. Please check your connection and try again.';
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      error.message = 'Network error. Please check your internet connection.';
    }

    return Promise.reject(error);
  }
);

/**
 * Generic error handler for API calls
 */
const handleApiError = (error, defaultMessage = 'An unexpected error occurred') => {
  if (error.response?.data?.message) {
    throw new Error(error.response.data.message);
  } else if (error.message) {
    throw new Error(error.message);
  } else {
    throw new Error(defaultMessage);
  }
};

/**
 * Resume API Functions
 */

/**
 * Upload a resume file for analysis
 * @param {File} file - PDF file to upload
 * @param {Function} onUploadProgress - Progress callback function
 * @returns {Promise<Object>} - API response with analyzed resume data
 */
export const uploadResume = async (file, onUploadProgress = null) => {
  try {
    // Validate file input
    if (!file) {
      throw new Error('No file provided for upload');
    }

    if (!(file instanceof File)) {
      throw new Error('Invalid file object provided');
    }

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('resume', file);

    console.log(`📤 Uploading resume: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

    // Make upload request with progress tracking
    const response = await apiClient.post('/resumes/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60 seconds for upload + processing
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onUploadProgress(percentCompleted);
        }
      },
    });

    console.log(`✅ Resume upload successful: ${response.data?.data?.id || 'Unknown ID'}`);
    return response;

  } catch (error) {
    console.error('❌ Resume upload failed:', error);
    handleApiError(error, 'Failed to upload resume. Please try again.');
  }
};

/**
 * Get all resumes (summary data for table view)
 * @param {Object} params - Query parameters for filtering/sorting
 * @returns {Promise<Object>} - API response with resumes list
 */
export const getAllResumes = async (params = {}) => {
  try {
    console.log('📥 Fetching all resumes...');
    
    const response = await apiClient.get('/resumes', {
      params: {
        ...params,
        _timestamp: Date.now() // Prevent caching
      }
    });

    console.log(`✅ Retrieved ${response.data?.data?.length || 0} resumes`);
    return response;

  } catch (error) {
    console.error('❌ Failed to fetch resumes:', error);
    handleApiError(error, 'Failed to load resumes. Please refresh the page.');
  }
};

/**
 * Get a specific resume by ID (detailed data for modal view)
 * @param {number|string} resumeId - Resume ID
 * @returns {Promise<Object>} - API response with detailed resume data
 */
export const getResumeById = async (resumeId) => {
  try {
    if (!resumeId) {
      throw new Error('Resume ID is required');
    }

    console.log(`📄 Fetching resume details for ID: ${resumeId}`);
    
    const response = await apiClient.get(`/resumes/${resumeId}`);

    console.log(`✅ Retrieved resume details: ${response.data?.data?.file_name || 'Unknown file'}`);
    return response;

  } catch (error) {
    console.error(`❌ Failed to fetch resume ${resumeId}:`, error);
    handleApiError(error, 'Failed to load resume details. Please try again.');
  }
};

/**
 * Delete a resume by ID
 * @param {number|string} resumeId - Resume ID to delete
 * @returns {Promise<Object>} - API response confirming deletion
 */
export const deleteResume = async (resumeId) => {
  try {
    if (!resumeId) {
      throw new Error('Resume ID is required for deletion');
    }

    console.log(`🗑️ Deleting resume ID: ${resumeId}`);
    
    const response = await apiClient.delete(`/resumes/${resumeId}`);

    console.log(`✅ Resume deleted successfully: ${resumeId}`);
    return response;

  } catch (error) {
    console.error(`❌ Failed to delete resume ${resumeId}:`, error);
    handleApiError(error, 'Failed to delete resume. Please try again.');
  }
};

/**
 * Get resume statistics
 * @returns {Promise<Object>} - API response with resume statistics
 */
export const getResumeStats = async () => {
  try {
    console.log('📊 Fetching resume statistics...');
    
    const response = await apiClient.get('/resumes/stats');

    console.log('✅ Retrieved resume statistics');
    return response;

  } catch (error) {
    console.error('❌ Failed to fetch resume statistics:', error);
    handleApiError(error, 'Failed to load statistics. Please try again.');
  }
};

/**
 * Health check - Test if the API server is running
 * @returns {Promise<Object>} - API response with server health status
 */
export const healthCheck = async () => {
  try {
    console.log('🩺 Checking API server health...');
    
    const response = await apiClient.get('/../../health', {
      timeout: 5000 // Shorter timeout for health check
    });

    console.log('✅ API server is healthy');
    return response;

  } catch (error) {
    console.error('❌ API health check failed:', error);
    handleApiError(error, 'Unable to connect to the server.');
  }
};

/**
 * Utility Functions
 */

/**
 * Check if the API server is reachable
 * @returns {Promise<boolean>} - True if server is reachable
 */
export const isServerReachable = async () => {
  try {
    await healthCheck();
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get API base URL for display purposes
 * @returns {string} - Current API base URL
 */
export const getApiBaseUrl = () => {
  return API_BASE_URL;
};

/**
 * Create a cancel token for cancelling requests
 * @returns {Object} - Axios cancel token
 */
export const createCancelToken = () => {
  return axios.CancelToken.source();
};

/**
 * Check if error is due to request cancellation
 * @param {Error} error - Error object to check
 * @returns {boolean} - True if error is cancellation
 */
export const isRequestCancelled = (error) => {
  return axios.isCancel(error);
};

/**
 * Retry mechanism for failed requests
 * @param {Function} apiCall - API function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Delay between retries in milliseconds
 * @returns {Promise} - Result of the API call
 */
export const retryApiCall = async (apiCall, maxRetries = 3, delay = 1000) => {
  let lastError;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      const result = await apiCall();
      if (i > 0) {
        console.log(`✅ API call succeeded on retry ${i}`);
      }
      return result;
    } catch (error) {
      lastError = error;
      
      if (i < maxRetries) {
        console.log(`⚠️ API call failed, retrying in ${delay}ms... (attempt ${i + 1}/${maxRetries + 1})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 1.5; // Exponential backoff
      }
    }
  }

  console.error(`❌ API call failed after ${maxRetries + 1} attempts`);
  throw lastError;
};

/**
 * Batch operations
 */

/**
 * Delete multiple resumes
 * @param {Array<number|string>} resumeIds - Array of resume IDs to delete
 * @param {Function} onProgress - Progress callback (optional)
 * @returns {Promise<Array>} - Array of deletion results
 */
export const deleteMultipleResumes = async (resumeIds, onProgress = null) => {
  try {
    if (!Array.isArray(resumeIds) || resumeIds.length === 0) {
      throw new Error('No resume IDs provided for deletion');
    }

    console.log(`🗑️ Deleting ${resumeIds.length} resumes...`);

    const results = [];
    const total = resumeIds.length;

    for (let i = 0; i < resumeIds.length; i++) {
      try {
        const result = await deleteResume(resumeIds[i]);
        results.push({ id: resumeIds[i], success: true, data: result.data });
        
        if (onProgress) {
          onProgress((i + 1) / total * 100, i + 1, total);
        }
      } catch (error) {
        results.push({ id: resumeIds[i], success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Bulk delete completed: ${successCount}/${total} successful`);

    return results;

  } catch (error) {
    console.error('❌ Bulk delete failed:', error);
    throw error;
  }
};

/**
 * Development and debugging utilities
 */

/**
 * Log current API configuration (development only)
 */
export const logApiConfig = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 API Configuration:', {
      baseURL: API_BASE_URL,
      timeout: apiClient.defaults.timeout,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Test all API endpoints (development only)
 */
export const testAllEndpoints = async () => {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('⚠️ testAllEndpoints is only available in development mode');
    return;
  }

  console.log('🧪 Testing all API endpoints...');

  try {
    // Test health check
    await healthCheck();
    console.log('✅ Health check: OK');

    // Test get all resumes
    await getAllResumes();
    console.log('✅ Get all resumes: OK');

    // Test get stats
    await getResumeStats();
    console.log('✅ Get stats: OK');

    console.log('🎉 All API endpoints are working correctly!');

  } catch (error) {
    console.error('❌ API endpoint test failed:', error);
  }
};

// Initialize API configuration logging in development
if (process.env.NODE_ENV === 'development') {
  logApiConfig();
}

// Export the axios instance for advanced usage
export { apiClient };

// Default export with all main functions
export default {
  uploadResume,
  getAllResumes,
  getResumeById,
  deleteResume,
  getResumeStats,
  healthCheck,
  isServerReachable,
  getApiBaseUrl,
  createCancelToken,
  isRequestCancelled,
  retryApiCall,
  deleteMultipleResumes,
  logApiConfig,
  testAllEndpoints
};