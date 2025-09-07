import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

/**
 * Resume Analyzer - Application Entry Point
 * 
 * This is the main entry point for the Resume Analyzer React application.
 * It initializes the React app, sets up error handling, and configures
 * performance monitoring.
 */

// Development environment checks and warnings
if (process.env.NODE_ENV === 'development') {
  console.log('🚀 Resume Analyzer starting in development mode');
  console.log('📍 API Base URL:', process.env.REACT_APP_API_URL || 'http://localhost:5000/api');
  
  // Check for required environment variables
  if (!process.env.REACT_APP_API_URL) {
    console.warn('⚠️ REACT_APP_API_URL not set, using default: http://localhost:5000/api');
  }
}

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled Promise Rejection:', event.reason);
  
  // Prevent the default browser behavior (console error)
  event.preventDefault();
  
  // You could send this to an error reporting service in production
  if (process.env.NODE_ENV === 'production') {
    // Example: sendErrorToService(event.reason);
  }
});

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
  console.error('🚨 Uncaught Error:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
  
  // You could send this to an error reporting service in production
  if (process.env.NODE_ENV === 'production') {
    // Example: sendErrorToService(event.error);
  }
});

// Service Worker registration helper
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registered:', registration);
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 New service worker available. Please refresh to update.');
              // You could show a notification to the user here
            }
          });
        }
      });
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  }
};

// Performance monitoring setup
const setupPerformanceMonitoring = () => {
  // Report Core Web Vitals and other performance metrics
  reportWebVitals((metric) => {
    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Performance Metric:', metric);
    }
    
    // In production, you could send these to an analytics service
    if (process.env.NODE_ENV === 'production') {
      // Example: analytics.track('Web Vital', metric);
      
      // Send to Google Analytics 4 (example)
      if (typeof gtag !== 'undefined') {
        gtag('event', metric.name, {
          custom_parameter_1: metric.value,
          custom_parameter_2: metric.id,
          custom_parameter_3: metric.name
        });
      }
    }
  });
  
  // Log page load performance
  window.addEventListener('load', () => {
    const loadTime = performance.now();
    console.log(`⏱️ Page loaded in ${loadTime.toFixed(2)}ms`);
    
    // Navigation Timing API
    if (performance.getEntriesByType) {
      const navigationEntries = performance.getEntriesByType('navigation');
      if (navigationEntries.length > 0) {
        const navigation = navigationEntries[0];
        console.log('🚁 Navigation Timing:', {
          domContentLoaded: `${navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart}ms`,
          loadComplete: `${navigation.loadEventEnd - navigation.loadEventStart}ms`,
          totalTime: `${navigation.loadEventEnd - navigation.navigationStart}ms`
        });
      }
    }
  });
};

// App initialization function
const initializeApp = () => {
  // Get the root element
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error('🚨 Root element not found! Make sure there is a div with id="root" in your HTML.');
    return;
  }
  
  // Create React root
  const root = ReactDOM.createRoot(rootElement);
  
  // Error Boundary Component
  class ErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null, errorInfo: null };
    }
    
    static getDerivedStateFromError(error) {
      // Update state so the next render will show the fallback UI
      return { hasError: true };
    }
    
    componentDidCatch(error, errorInfo) {
      console.error('🚨 React Error Boundary caught an error:', error, errorInfo);
      
      this.setState({
        error: error,
        errorInfo: errorInfo
      });
      
      // You could send this to an error reporting service
      if (process.env.NODE_ENV === 'production') {
        // Example: sendErrorToService(error, errorInfo);
      }
    }
    
    handleRetry = () => {
      this.setState({ hasError: false, error: null, errorInfo: null });
    }
    
    render() {
      if (this.state.hasError) {
        // Fallback UI
        return (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '2rem',
            textAlign: 'center',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.95)',
              color: '#333',
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
              maxWidth: '500px',
              width: '100%'
            }}>
              <h1 style={{ marginBottom: '1rem', color: '#dc3545' }}>
                🚨 Oops! Something went wrong
              </h1>
              <p style={{ marginBottom: '1.5rem', color: '#666' }}>
                The Resume Analyzer encountered an unexpected error. This has been logged and we're working to fix it.
              </p>
              
              {process.env.NODE_ENV === 'development' && (
                <details style={{ 
                  marginBottom: '1.5rem', 
                  textAlign: 'left',
                  background: '#f8f9fa',
                  padding: '1rem',
                  borderRadius: '6px',
                  fontSize: '0.9rem'
                }}>
                  <summary style={{ cursor: 'pointer', fontWeight: '600', marginBottom: '0.5rem' }}>
                    Error Details (Development Only)
                  </summary>
                  <pre style={{ 
                    whiteSpace: 'pre-wrap', 
                    fontSize: '0.8rem',
                    color: '#dc3545',
                    margin: 0,
                    overflow: 'auto'
                  }}>
                    {this.state.error && this.state.error.toString()}
                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
              
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                  onClick={this.handleRetry}
                  style={{
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600'
                  }}
                >
                  🔄 Try Again
                </button>
                <button
                  onClick={() => window.location.reload()}
                  style={{
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600'
                  }}
                >
                  🔄 Refresh Page
                </button>
              </div>
            </div>
          </div>
        );
      }
      
      return this.props.children;
    }
  }
  
  // Render the app
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
  
  console.log('✅ Resume Analyzer initialized successfully');
};

// Feature detection and compatibility checks
const checkCompatibility = () => {
  const features = {
    promises: typeof Promise !== 'undefined',
    fetch: typeof fetch !== 'undefined',
    localStorage: typeof Storage !== 'undefined',
    flexbox: CSS.supports('display', 'flex'),
    grid: CSS.supports('display', 'grid'),
    customProperties: CSS.supports('--foo', 'red'),
  };
  
  const unsupportedFeatures = Object.entries(features)
    .filter(([feature, supported]) => !supported)
    .map(([feature]) => feature);
  
  if (unsupportedFeatures.length > 0) {
    console.warn('⚠️ Some modern features are not supported:', unsupportedFeatures);
    
    // Show compatibility warning for very old browsers
    if (!features.promises || !features.fetch) {
      const warning = document.createElement('div');
      warning.innerHTML = `
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: #dc3545;
          color: white;
          padding: 1rem;
          text-align: center;
          z-index: 10000;
          font-family: Arial, sans-serif;
        ">
          ⚠️ Your browser is not fully supported. Please update to the latest version for the best experience.
        </div>
      `;
      document.body.appendChild(warning);
    }
  } else {
    console.log('✅ All required browser features are supported');
  }
  
  return unsupportedFeatures.length === 0;
};

// Environment-specific setup
const setupEnvironment = () => {
  if (process.env.NODE_ENV === 'development') {
    // Development-specific setup
    console.log('🔧 Development mode setup');
    
    // Add helpful development tools to window
    window.__RESUME_ANALYZER_DEBUG__ = {
      version: process.env.REACT_APP_VERSION || '1.0.0',
      apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
      nodeEnv: process.env.NODE_ENV,
      buildTime: new Date().toISOString()
    };
    
  } else if (process.env.NODE_ENV === 'production') {
    // Production-specific setup
    console.log('🚀 Production mode setup');
    
    // Disable console logs in production (optional)
    if (process.env.REACT_APP_DISABLE_LOGS === 'true') {
      console.log = () => {};
      console.warn = () => {};
      console.error = () => {}; // Keep error logging for debugging
    }
    
    // Add production analytics or monitoring here
    // Example: initializeAnalytics();
  }
};

// Main initialization sequence
const main = async () => {
  try {
    // 1. Environment setup
    setupEnvironment();
    
    // 2. Compatibility checks
    const isCompatible = checkCompatibility();
    
    // 3. Performance monitoring
    setupPerformanceMonitoring();
    
    // 4. Service worker registration (production only)
    await registerServiceWorker();
    
    // 5. Initialize the React app
    if (isCompatible) {
      initializeApp();
    } else {
      console.error('❌ Browser compatibility issues detected. App may not function properly.');
      // Still try to initialize, but with warnings
      initializeApp();
    }
    
    // 6. Log successful initialization
    if (process.env.NODE_ENV === 'development') {
      console.log('🎉 Resume Analyzer fully loaded and ready!');
      console.log('📝 Available debug info:', window.__RESUME_ANALYZER_DEBUG__);
    }
    
  } catch (error) {
    console.error('💥 Failed to initialize Resume Analyzer:', error);
    
    // Show a basic error message if React fails to load
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 2rem;
          text-align: center;
          font-family: Arial, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        ">
          <div style="
            background: white;
            color: #333;
            padding: 2rem;
            border-radius: 12px;
            max-width: 400px;
          ">
            <h1 style="color: #dc3545; margin-bottom: 1rem;">
              ⚠️ Initialization Failed
            </h1>
            <p style="margin-bottom: 1.5rem;">
              Resume Analyzer failed to load. Please refresh the page or contact support.
            </p>
            <button 
              onclick="window.location.reload()"
              style="
                background: #007bff;
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 6px;
                cursor: pointer;
                font-size: 1rem;
              "
            >
              🔄 Refresh Page
            </button>
          </div>
        </div>
      `;
    }
  }
};

// Start the application
main();