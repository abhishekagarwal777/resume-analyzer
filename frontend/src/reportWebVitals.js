/**
 * Resume Analyzer - Web Vitals Performance Monitoring
 * 
 * Enhanced web vitals reporting with detailed performance metrics,
 * analytics integration, and Resume Analyzer specific monitoring.
 */

/**
 * Performance thresholds for Resume Analyzer
 * Based on Google's Core Web Vitals guidelines
 */
const PERFORMANCE_THRESHOLDS = {
  // Core Web Vitals
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint (ms)
  FID: { good: 100, poor: 300 },   // First Input Delay (ms)
  CLS: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift (ratio)
  
  // Additional Metrics
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint (ms)
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte (ms)
  INP: { good: 200, poor: 500 },   // Interaction to Next Paint (ms)
};

/**
 * Get performance rating based on metric value
 * @param {string} name - Metric name
 * @param {number} value - Metric value
 * @returns {string} - Performance rating: 'good', 'needs-improvement', 'poor'
 */
const getPerformanceRating = (name, value) => {
  const threshold = PERFORMANCE_THRESHOLDS[name];
  if (!threshold) return 'unknown';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
};

/**
 * Get user-friendly description of the metric
 * @param {string} name - Metric name
 * @returns {string} - Human-readable description
 */
const getMetricDescription = (name) => {
  const descriptions = {
    LCP: 'Largest Contentful Paint - Time until the largest content element is rendered',
    FID: 'First Input Delay - Time from first user interaction to browser response',
    CLS: 'Cumulative Layout Shift - Amount of unexpected layout shift during page load',
    FCP: 'First Contentful Paint - Time until the first content is painted',
    TTFB: 'Time to First Byte - Time from navigation to first byte received',
    INP: 'Interaction to Next Paint - Responsiveness of page to user interactions'
  };
  return descriptions[name] || `${name} - Performance metric`;
};

/**
 * Enhanced metric processor with Resume Analyzer context
 * @param {Object} metric - Web vital metric object
 * @param {Function} onPerfEntry - Original callback function
 */
const processMetric = (metric, onPerfEntry) => {
  // Enhance metric with additional context
  const enhancedMetric = {
    ...metric,
    // Performance rating
    rating: getPerformanceRating(metric.name, metric.value),
    
    // Human-readable description
    description: getMetricDescription(metric.name),
    
    // Timestamp and session info
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
    
    // Page context
    url: window.location.href,
    pathname: window.location.pathname,
    referrer: document.referrer,
    
    // User agent info
    userAgent: navigator.userAgent,
    connection: getConnectionInfo(),
    
    // App-specific context
    appVersion: process.env.REACT_APP_VERSION || '1.0.0',
    buildTime: process.env.REACT_APP_BUILD_TIME,
    
    // Performance context
    isSlowConnection: isSlowConnection(),
    deviceMemory: getDeviceMemory(),
    hardwareConcurrency: navigator.hardwareConcurrency,
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    logMetricToDevelopmentConsole(enhancedMetric);
  }

  // Send to analytics in production
  if (process.env.NODE_ENV === 'production') {
    sendToAnalytics(enhancedMetric);
  }

  // Call original callback
  if (onPerfEntry && typeof onPerfEntry === 'function') {
    onPerfEntry(enhancedMetric);
  }

  // Store locally for debugging
  storeMetricLocally(enhancedMetric);
};

/**
 * Get or create session ID for tracking
 * @returns {string} - Session identifier
 */
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('resumeAnalyzer_sessionId');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('resumeAnalyzer_sessionId', sessionId);
  }
  return sessionId;
};

/**
 * Get connection information
 * @returns {Object} - Connection details
 */
const getConnectionInfo = () => {
  if ('connection' in navigator) {
    const conn = navigator.connection;
    return {
      effectiveType: conn.effectiveType,
      downlink: conn.downlink,
      rtt: conn.rtt,
      saveData: conn.saveData
    };
  }
  return { effectiveType: 'unknown' };
};

/**
 * Check if user is on a slow connection
 * @returns {boolean} - True if connection is slow
 */
const isSlowConnection = () => {
  if ('connection' in navigator) {
    const conn = navigator.connection;
    return conn.effectiveType === 'slow-2g' || 
           conn.effectiveType === '2g' || 
           conn.saveData === true;
  }
  return false;
};

/**
 * Get device memory information
 * @returns {number} - Device memory in GB
 */
const getDeviceMemory = () => {
  if ('deviceMemory' in navigator) {
    return navigator.deviceMemory;
  }
  return null;
};

/**
 * Log metric to development console with formatting
 * @param {Object} metric - Enhanced metric object
 */
const logMetricToDevelopmentConsole = (metric) => {
  const emoji = {
    good: '🟢',
    'needs-improvement': '🟡',
    poor: '🔴',
    unknown: '⚪'
  }[metric.rating];

  const color = {
    good: 'color: #28a745; font-weight: bold;',
    'needs-improvement': 'color: #ffc107; font-weight: bold;',
    poor: 'color: #dc3545; font-weight: bold;',
    unknown: 'color: #6c757d;'
  }[metric.rating];

  console.groupCollapsed(
    `${emoji} %c${metric.name}: ${metric.value}${metric.name === 'CLS' ? '' : 'ms'} (${metric.rating})`,
    color
  );
  
  console.log('📊 Metric Details:', {
    value: metric.value,
    rating: metric.rating,
    description: metric.description,
    id: metric.id,
    delta: metric.delta
  });
  
  console.log('🌐 Page Context:', {
    url: metric.url,
    pathname: metric.pathname,
    referrer: metric.referrer
  });
  
  if (metric.connection.effectiveType !== 'unknown') {
    console.log('📶 Connection:', metric.connection);
  }
  
  if (metric.entries && metric.entries.length > 0) {
    console.log('📝 Performance Entries:', metric.entries);
  }
  
  console.groupEnd();
};

/**
 * Send metrics to analytics services
 * @param {Object} metric - Enhanced metric object
 */
const sendToAnalytics = (metric) => {
  // Google Analytics 4
  if (typeof gtag !== 'undefined') {
    gtag('event', 'web_vital', {
      metric_name: metric.name,
      metric_value: Math.round(metric.value),
      metric_rating: metric.rating,
      metric_id: metric.id,
      custom_map: {
        metric_rating: 'rating',
        metric_id: 'id'
      }
    });
  }

  // Google Tag Manager
  if (typeof dataLayer !== 'undefined') {
    dataLayer.push({
      event: 'web_vital',
      metric_name: metric.name,
      metric_value: Math.round(metric.value),
      metric_rating: metric.rating,
      metric_id: metric.id
    });
  }

  // Custom analytics endpoint (example)
  if (process.env.REACT_APP_ANALYTICS_ENDPOINT) {
    fetch(process.env.REACT_APP_ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'web_vital',
        data: metric
      })
    }).catch(error => {
      console.warn('📊 Failed to send metric to analytics:', error);
    });
  }
};

/**
 * Store metric locally for debugging
 * @param {Object} metric - Enhanced metric object
 */
const storeMetricLocally = (metric) => {
  try {
    const storageKey = 'resumeAnalyzer_webVitals';
    const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    // Keep only last 50 metrics
    const updatedMetrics = [...stored, metric].slice(-50);
    
    localStorage.setItem(storageKey, JSON.stringify(updatedMetrics));
  } catch (error) {
    console.warn('📊 Failed to store metric locally:', error);
  }
};

/**
 * Get stored metrics for debugging
 * @returns {Array} - Array of stored metrics
 */
const getStoredMetrics = () => {
  try {
    return JSON.parse(localStorage.getItem('resumeAnalyzer_webVitals') || '[]');
  } catch (error) {
    console.warn('📊 Failed to retrieve stored metrics:', error);
    return [];
  }
};

/**
 * Clear stored metrics
 */
const clearStoredMetrics = () => {
  try {
    localStorage.removeItem('resumeAnalyzer_webVitals');
    console.log('📊 Stored metrics cleared');
  } catch (error) {
    console.warn('📊 Failed to clear stored metrics:', error);
  }
};

/**
 * Get performance summary
 * @returns {Object} - Performance summary object
 */
const getPerformanceSummary = () => {
  const metrics = getStoredMetrics();
  const summary = {
    totalMetrics: metrics.length,
    byType: {},
    byRating: { good: 0, 'needs-improvement': 0, poor: 0, unknown: 0 },
    averages: {},
    lastUpdated: null
  };

  metrics.forEach(metric => {
    // Count by type
    summary.byType[metric.name] = (summary.byType[metric.name] || 0) + 1;
    
    // Count by rating
    summary.byRating[metric.rating] = (summary.byRating[metric.rating] || 0) + 1;
    
    // Calculate averages
    if (!summary.averages[metric.name]) {
      summary.averages[metric.name] = { total: 0, count: 0 };
    }
    summary.averages[metric.name].total += metric.value;
    summary.averages[metric.name].count += 1;
    
    // Track last updated
    if (!summary.lastUpdated || new Date(metric.timestamp) > new Date(summary.lastUpdated)) {
      summary.lastUpdated = metric.timestamp;
    }
  });

  // Calculate final averages
  Object.keys(summary.averages).forEach(metricName => {
    const avg = summary.averages[metricName];
    summary.averages[metricName] = Math.round(avg.total / avg.count);
  });

  return summary;
};

/**
 * Main reportWebVitals function with enhancements
 * @param {Function} onPerfEntry - Callback function for performance entries
 */
const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    // Dynamic import of web-vitals with enhanced processing
    import('web-vitals').then(({ 
      getCLS, 
      getFID, 
      getFCP, 
      getLCP, 
      getTTFB,
      onINP // New metric for interaction responsiveness
    }) => {
      // Core Web Vitals
      getCLS((metric) => processMetric(metric, onPerfEntry));
      getFID((metric) => processMetric(metric, onPerfEntry));
      getLCP((metric) => processMetric(metric, onPerfEntry));
      
      // Additional Metrics
      getFCP((metric) => processMetric(metric, onPerfEntry));
      getTTFB((metric) => processMetric(metric, onPerfEntry));
      
      // New INP metric (if available)
      if (onINP) {
        onINP((metric) => processMetric(metric, onPerfEntry));
      }
      
      // Log initialization
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Web Vitals monitoring initialized for Resume Analyzer');
      }
    }).catch(error => {
      console.warn('📊 Failed to load web-vitals library:', error);
    });
  }

  // Setup additional performance monitoring
  setupAdditionalMonitoring();
};

/**
 * Setup additional performance monitoring beyond Web Vitals
 */
const setupAdditionalMonitoring = () => {
  // Monitor long tasks
  if ('PerformanceObserver' in window) {
    try {
      // Long Task Observer
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Tasks longer than 50ms
            if (process.env.NODE_ENV === 'development') {
              console.warn(`⚠️ Long Task detected: ${entry.duration}ms`, entry);
            }
          }
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });

      // Largest Contentful Paint Observer
      const lcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (process.env.NODE_ENV === 'development') {
            console.log('🎯 LCP Element:', entry.element, `Size: ${entry.size}px`);
          }
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    } catch (error) {
      console.warn('📊 Failed to setup additional performance monitoring:', error);
    }
  }

  // Monitor memory usage (if available)
  if ('memory' in performance) {
    const logMemoryUsage = () => {
      const memory = performance.memory;
      if (process.env.NODE_ENV === 'development') {
        console.log('🧠 Memory Usage:', {
          used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`,
          total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB`,
          limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB`
        });
      }
    };

    // Log memory usage every 30 seconds in development
    if (process.env.NODE_ENV === 'development') {
      setInterval(logMemoryUsage, 30000);
    }
  }
};

// Expose debugging functions to window in development
if (process.env.NODE_ENV === 'development') {
  window.__RESUME_ANALYZER_PERFORMANCE__ = {
    getStoredMetrics,
    clearStoredMetrics,
    getPerformanceSummary,
    PERFORMANCE_THRESHOLDS
  };
}

export default reportWebVitals;

// Named exports for additional functionality
export {
  getStoredMetrics,
  clearStoredMetrics,
  getPerformanceSummary,
  PERFORMANCE_THRESHOLDS,
  getPerformanceRating,
  getMetricDescription
};