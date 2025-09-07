/**
 * Resume Analyzer - Test Setup Configuration
 * 
 * This file configures the testing environment for the Resume Analyzer application.
 * It sets up Jest matchers, mocks, global test utilities, and ensures consistent
 * testing behavior across all components.
 */

// Import testing-library jest-dom matchers
// This provides custom matchers like toBeInTheDocument(), toHaveClass(), etc.
import '@testing-library/jest-dom';

// Import additional testing utilities
import 'whatwg-fetch'; // Fetch polyfill for older environments

// Configure Jest environment
global.console = {
  ...console,
  // Suppress console.log in tests unless needed for debugging
  log: process.env.DEBUG_TESTS ? console.log : jest.fn(),
  // Keep important logging
  warn: console.warn,
  error: console.error,
  info: console.info,
  debug: process.env.DEBUG_TESTS ? console.debug : jest.fn(),
};

/**
 * Global Test Configuration
 */

// Set default test timeout (30 seconds for async operations like file uploads)
jest.setTimeout(30000);

// Mock environment variables for consistent testing
process.env.REACT_APP_API_URL = 'http://localhost:5000/api';
process.env.NODE_ENV = 'test';
process.env.REACT_APP_VERSION = '1.0.0-test';

/**
 * Browser API Mocks
 */

// Mock localStorage and sessionStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0
};

const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0
};

// Mock window.localStorage and window.sessionStorage
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// Mock window.location
delete window.location;
window.location = {
  href: 'http://localhost:3000/',
  origin: 'http://localhost:3000',
  protocol: 'http:',
  host: 'localhost:3000',
  hostname: 'localhost',
  port: '3000',
  pathname: '/',
  search: '',
  hash: '',
  reload: jest.fn(),
  replace: jest.fn(),
  assign: jest.fn()
};

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: jest.fn(),
  writable: true
});

// Mock window.scrollBy
Object.defineProperty(window, 'scrollBy', {
  value: jest.fn(),
  writable: true
});

// Mock window.matchMedia (for responsive design testing)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver (used by some loading components)
global.IntersectionObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  root: null,
  rootMargin: '',
  thresholds: []
}));

// Mock ResizeObserver (used by responsive components)
global.ResizeObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Mock File and FileList for file upload testing
global.File = jest.fn().mockImplementation((fileBits, fileName, options) => {
  const file = {
    name: fileName,
    size: fileBits.length || 0,
    type: options?.type || 'application/pdf',
    lastModified: Date.now(),
    arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
    slice: jest.fn(),
    stream: jest.fn(),
    text: jest.fn().mockResolvedValue('file content')
  };
  return file;
});

global.FileList = jest.fn();

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mocked-object-url');
global.URL.revokeObjectURL = jest.fn();

// Mock FileReader for PDF processing tests
global.FileReader = jest.fn().mockImplementation(() => ({
  readAsDataURL: jest.fn(),
  readAsText: jest.fn(),
  readAsArrayBuffer: jest.fn(),
  readAsBinaryString: jest.fn(),
  onload: null,
  onerror: null,
  onabort: null,
  result: null,
  error: null,
  EMPTY: 0,
  LOADING: 1,
  DONE: 2,
  readyState: 0
}));

/**
 * Network and Fetch Mocks
 */

// Global fetch mock setup
global.fetch = jest.fn();

// Default fetch mock implementation
global.fetch.mockImplementation(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers(),
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
  })
);

/**
 * Performance API Mocks (for reportWebVitals testing)
 */

// Mock Performance API
Object.defineProperty(window, 'performance', {
  writable: true,
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntries: jest.fn(() => []),
    getEntriesByName: jest.fn(() => []),
    getEntriesByType: jest.fn(() => []),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
    clearResourceTimings: jest.fn(),
    navigation: {
      type: 0,
      redirectCount: 0
    },
    timing: {
      navigationStart: Date.now() - 1000,
      loadEventEnd: Date.now()
    },
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000,
      jsHeapSizeLimit: 100000000
    }
  }
});

// Mock PerformanceObserver
global.PerformanceObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn(() => [])
}));

/**
 * Animation and Timer Mocks
 */

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = jest.fn((callback) => {
  return setTimeout(callback, 16); // ~60fps
});

global.cancelAnimationFrame = jest.fn((id) => {
  clearTimeout(id);
});

// Mock requestIdleCallback
global.requestIdleCallback = jest.fn((callback) => {
  return setTimeout(() => callback({ timeRemaining: () => 50 }), 1);
});

global.cancelIdleCallback = jest.fn(clearTimeout);

/**
 * Custom Test Utilities
 */

// Helper function to create mock PDF file for testing
global.createMockPDFFile = (name = 'test-resume.pdf', size = 1024) => {
  const file = new File(['mock pdf content'], name, {
    type: 'application/pdf',
    lastModified: Date.now()
  });
  // Override size property
  Object.defineProperty(file, 'size', {
    value: size,
    writable: false
  });
  return file;
};

// Helper function to create mock resume data
global.createMockResumeData = (overrides = {}) => ({
  id: 1,
  file_name: 'test-resume.pdf',
  uploaded_at: '2024-01-01T12:00:00Z',
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+1-555-123-4567',
  linkedin_url: 'https://linkedin.com/in/johndoe',
  portfolio_url: 'https://johndoe.dev',
  summary: 'Experienced software developer with 5 years of experience',
  work_experience: [
    {
      role: 'Software Developer',
      company: 'Tech Corp',
      duration: '2020 - Present',
      description: ['Developed web applications', 'Led team projects']
    }
  ],
  education: [
    {
      degree: 'Bachelor of Computer Science',
      institution: 'University of Technology',
      graduation_year: '2020'
    }
  ],
  technical_skills: ['JavaScript', 'React', 'Node.js', 'Python'],
  soft_skills: ['Communication', 'Leadership', 'Problem Solving'],
  projects: [
    {
      name: 'Resume Analyzer',
      description: 'AI-powered resume analysis tool',
      technologies: ['React', 'Node.js', 'PostgreSQL']
    }
  ],
  certifications: [
    {
      name: 'AWS Certified Developer',
      issuer: 'Amazon Web Services',
      year: '2023'
    }
  ],
  resume_rating: 8,
  improvement_areas: 'Consider adding more quantifiable achievements',
  upskill_suggestions: ['Machine Learning', 'Cloud Computing', 'DevOps'],
  ...overrides
});

// Helper function to wait for async operations in tests
global.waitFor = async (callback, timeout = 5000) => {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    try {
      await callback();
      return;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  throw new Error(`waitFor timeout after ${timeout}ms`);
};

// Helper to simulate user file selection
global.simulateFileSelection = (input, files) => {
  Object.defineProperty(input, 'files', {
    value: files,
    writable: false
  });
  
  const event = new Event('change', { bubbles: true });
  input.dispatchEvent(event);
};

// Helper to simulate drag and drop
global.simulateDragAndDrop = (element, files) => {
  const dataTransfer = {
    files: files,
    items: files.map(file => ({ kind: 'file', type: file.type, getAsFile: () => file })),
    types: ['Files']
  };
  
  const dragEnterEvent = new DragEvent('dragenter', { dataTransfer });
  const dragOverEvent = new DragEvent('dragover', { dataTransfer });
  const dropEvent = new DragEvent('drop', { dataTransfer });
  
  element.dispatchEvent(dragEnterEvent);
  element.dispatchEvent(dragOverEvent);
  element.dispatchEvent(dropEvent);
};

/**
 * Mock External Libraries
 */

// Mock web-vitals library (used in reportWebVitals)
jest.mock('web-vitals', () => ({
  getCLS: jest.fn((callback) => {
    callback({ name: 'CLS', value: 0.05, rating: 'good' });
  }),
  getFID: jest.fn((callback) => {
    callback({ name: 'FID', value: 50, rating: 'good' });
  }),
  getFCP: jest.fn((callback) => {
    callback({ name: 'FCP', value: 1500, rating: 'good' });
  }),
  getLCP: jest.fn((callback) => {
    callback({ name: 'LCP', value: 2000, rating: 'good' });
  }),
  getTTFB: jest.fn((callback) => {
    callback({ name: 'TTFB', value: 500, rating: 'good' });
  }),
  onINP: jest.fn((callback) => {
    callback({ name: 'INP', value: 150, rating: 'good' });
  })
}));

/**
 * Test Environment Setup
 */

// Setup before each test
beforeEach(() => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Reset fetch mock
  global.fetch.mockClear();
  
  // Reset localStorage and sessionStorage
  localStorageMock.clear.mockClear();
  sessionStorageMock.clear.mockClear();
  
  // Reset location
  window.location.pathname = '/';
  window.location.search = '';
  window.location.hash = '';
  
  // Reset console logs
  if (!process.env.DEBUG_TESTS) {
    console.log.mockClear?.();
    console.debug.mockClear?.();
  }
});

// Setup after each test
afterEach(() => {
  // Clean up any timers
  jest.clearAllTimers();
  
  // Clean up any DOM side effects
  document.body.innerHTML = '';
  document.head.innerHTML = '';
});

// Global test cleanup
afterAll(() => {
  // Final cleanup
  jest.restoreAllMocks();
});

/**
 * Custom Jest Matchers for Resume Analyzer
 */

// Add custom matcher for file validation
expect.extend({
  toBeValidPDFFile(received) {
    const pass = received && 
                 received.type === 'application/pdf' && 
                 received.name.endsWith('.pdf') &&
                 received.size > 0;
    
    if (pass) {
      return {
        message: () => `expected ${received.name} not to be a valid PDF file`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received?.name || 'file'} to be a valid PDF file`,
        pass: false,
      };
    }
  },
  
  toHaveValidResumeStructure(received) {
    const requiredFields = [
      'id', 'file_name', 'name', 'work_experience', 
      'education', 'technical_skills', 'resume_rating'
    ];
    
    const missingFields = requiredFields.filter(field => !(field in received));
    const pass = missingFields.length === 0;
    
    if (pass) {
      return {
        message: () => `expected resume data not to have valid structure`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected resume data to have valid structure. Missing fields: ${missingFields.join(', ')}`,
        pass: false,
      };
    }
  },
  
  toHaveValidRating(received) {
    const rating = received.resume_rating;
    const pass = typeof rating === 'number' && rating >= 1 && rating <= 10;
    
    if (pass) {
      return {
        message: () => `expected rating ${rating} not to be valid (1-10)`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected rating ${rating} to be valid (1-10)`,
        pass: false,
      };
    }
  }
});

/**
 * Development Debugging Helpers
 */

if (process.env.DEBUG_TESTS) {
  console.log('🧪 Test setup completed for Resume Analyzer');
  console.log('📋 Available test utilities:');
  console.log('  - createMockPDFFile()');
  console.log('  - createMockResumeData()');
  console.log('  - simulateFileSelection()');
  console.log('  - simulateDragAndDrop()');
  console.log('  - Custom matchers: toBeValidPDFFile, toHaveValidResumeStructure, toHaveValidRating');
}