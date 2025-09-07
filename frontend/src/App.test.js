import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Mock the API service
jest.mock('./services/api', () => ({
  getResumeStats: jest.fn(),
  getResumeById: jest.fn(),
  isServerReachable: jest.fn(),
  uploadResume: jest.fn(),
  getAllResumes: jest.fn(),
  deleteResume: jest.fn()
}));

// Import mocked functions
import * as api from './services/api';

// Mock components to avoid complex integration testing
jest.mock('./components/ResumeUploader', () => {
  return function MockResumeUploader({ onUploadSuccess, onUploadStart }) {
    return (
      <div data-testid="resume-uploader">
        <h3>Resume Uploader Component</h3>
        <button 
          onClick={() => {
            onUploadStart && onUploadStart();
            onUploadSuccess && onUploadSuccess({
              id: 1,
              file_name: 'test-resume.pdf',
              name: 'John Doe',
              resume_rating: 8
            });
          }}
          data-testid="mock-upload-button"
        >
          Mock Upload
        </button>
      </div>
    );
  };
});

jest.mock('./components/PastResumesTable', () => {
  return function MockPastResumesTable({ onSelectResume, refreshTrigger }) {
    return (
      <div data-testid="past-resumes-table">
        <h3>Past Resumes Table Component</h3>
        <p>Refresh Trigger: {refreshTrigger}</p>
        <button 
          onClick={() => onSelectResume && onSelectResume(1)}
          data-testid="mock-select-resume"
        >
          Select Resume 1
        </button>
      </div>
    );
  };
});

jest.mock('./components/ResumeDetails', () => {
  return function MockResumeDetails({ resumeData, onClose, isModal }) {
    if (!resumeData) return null;
    return (
      <div data-testid="resume-details" data-modal={isModal}>
        <h3>Resume Details Component</h3>
        <p>Resume: {resumeData.file_name}</p>
        <p>Rating: {resumeData.resume_rating}</p>
        {onClose && (
          <button onClick={onClose} data-testid="close-modal">
            Close
          </button>
        )}
      </div>
    );
  };
});

jest.mock('./components/LoadingSpinner', () => {
  return function MockLoadingSpinner({ size, message, showMessage = true }) {
    return (
      <div data-testid="loading-spinner" data-size={size}>
        {showMessage && message && <span>{message}</span>}
        <span>Loading...</span>
      </div>
    );
  };
});

describe('App Component', () => {
  // Setup default mocks before each test
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default API responses
    api.isServerReachable.mockResolvedValue(true);
    api.getResumeStats.mockResolvedValue({
      data: {
        success: true,
        data: {
          total_resumes: 10,
          avg_rating: 7.5,
          high_rated_count: 4
        }
      }
    });
    api.getResumeById.mockResolvedValue({
      data: {
        success: true,
        data: {
          id: 1,
          file_name: 'test-resume.pdf',
          name: 'John Doe',
          resume_rating: 8,
          email: 'john@example.com'
        }
      }
    });
  });

  // Utility function to wait for async effects
  const waitForAsyncEffects = async () => {
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
  };

  describe('Initial Rendering', () => {
    test('renders main app structure', async () => {
      await act(async () => {
        render(<App />);
      });

      // Check header elements
      expect(screen.getByText(/Resume Analyzer/)).toBeInTheDocument();
      expect(screen.getByText(/AI-powered resume analysis/)).toBeInTheDocument();
      
      // Check navigation tabs
      expect(screen.getByText(/Upload Resume/)).toBeInTheDocument();
      expect(screen.getByText(/Resume History/)).toBeInTheDocument();
      
      // Check footer
      expect(screen.getByText(/© 2024 Resume Analyzer/)).toBeInTheDocument();
    });

    test('shows upload tab as default active tab', async () => {
      await act(async () => {
        render(<App />);
      });
      
      await waitForAsyncEffects();
      
      const uploadTab = screen.getByRole('button', { name: /Upload Resume/ });
      expect(uploadTab).toHaveClass('active');
    });

    test('displays server status indicator', async () => {
      await act(async () => {
        render(<App />);
      });
      
      await waitForAsyncEffects();
      
      // Should show online status when server is reachable
      expect(screen.getByText(/Server Status:/)).toBeInTheDocument();
      expect(screen.getByText(/Online/)).toBeInTheDocument();
    });
  });

  describe('Statistics Display', () => {
    test('loads and displays statistics', async () => {
      await act(async () => {
        render(<App />);
      });
      
      await waitForAsyncEffects();
      
      expect(screen.getByText('10')).toBeInTheDocument(); // total_resumes
      expect(screen.getByText('7.5')).toBeInTheDocument(); // avg_rating
      expect(screen.getByText('4')).toBeInTheDocument(); // high_rated_count
    });

    test('handles stats loading failure gracefully', async () => {
      api.getResumeStats.mockRejectedValue(new Error('Stats failed'));
      
      await act(async () => {
        render(<App />);
      });
      
      await waitForAsyncEffects();
      
      // App should still render without stats
      expect(screen.getByText(/Resume Analyzer/)).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    test('switches between upload and history tabs', async () => {
      await act(async () => {
        render(<App />);
      });
      
      await waitForAsyncEffects();
      
      const historyTab = screen.getByRole('button', { name: /Resume History/ });
      const uploadTab = screen.getByRole('button', { name: /Upload Resume/ });
      
      // Initially upload tab is active
      expect(uploadTab).toHaveClass('active');
      expect(historyTab).not.toHaveClass('active');
      
      // Click history tab
      fireEvent.click(historyTab);
      
      expect(historyTab).toHaveClass('active');
      expect(uploadTab).not.toHaveClass('active');
      
      // Check that history component is rendered
      expect(screen.getByTestId('past-resumes-table')).toBeInTheDocument();
    });

    test('shows appropriate content for each tab', async () => {
      await act(async () => {
        render(<App />);
      });
      
      await waitForAsyncEffects();
      
      // Upload tab should show uploader
      expect(screen.getByTestId('resume-uploader')).toBeInTheDocument();
      
      // Switch to history tab
      const historyTab = screen.getByRole('button', { name: /Resume History/ });
      fireEvent.click(historyTab);
      
      // History tab should show table
      expect(screen.getByTestId('past-resumes-table')).toBeInTheDocument();
    });
  });

  describe('Server Status Handling', () => {
    test('handles server offline status', async () => {
      api.isServerReachable.mockResolvedValue(false);
      
      await act(async () => {
        render(<App />);
      });
      
      await waitForAsyncEffects();
      
      expect(screen.getByText(/Server Offline/)).toBeInTheDocument();
      expect(screen.getByText(/backend server is not responding/)).toBeInTheDocument();
      expect(screen.getByText(/Offline/)).toBeInTheDocument();
    });

    test('retries server connection', async () => {
      api.isServerReachable.mockResolvedValueOnce(false);
      api.isServerReachable.mockResolvedValueOnce(true);
      
      await act(async () => {
        render(<App />);
      });
      
      await waitForAsyncEffects();
      
      // Should show offline initially
      expect(screen.getByText(/Server Offline/)).toBeInTheDocument();
      
      // Click retry button
      const retryButton = screen.getByText(/Check Connection/);
      await act(async () => {
        fireEvent.click(retryButton);
      });
      
      await waitForAsyncEffects();
      
      // Should now show online
      expect(screen.getByText(/Online/)).toBeInTheDocument();
    });
  });

  describe('Resume Upload Flow', () => {
    test('handles successful upload', async () => {
      await act(async () => {
        render(<App />);
      });
      
      await waitForAsyncEffects();
      
      const mockUploadButton = screen.getByTestId('mock-upload-button');
      
      await act(async () => {
        fireEvent.click(mockUploadButton);
      });
      
      // Should trigger stats reload and tab switch
      await waitFor(() => {
        expect(api.getResumeStats).toHaveBeenCalledTimes(2); // Initial + after upload
      });
    });

    test('updates refresh trigger after upload', async () => {
      await act(async () => {
        render(<App />);
      });
      
      await waitForAsyncEffects();
      
      // Switch to history tab first
      const historyTab = screen.getByRole('button', { name: /Resume History/ });
      fireEvent.click(historyTab);
      
      // Get initial refresh trigger value
      const initialTrigger = screen.getByText(/Refresh Trigger: 0/);
      expect(initialTrigger).toBeInTheDocument();
      
      // Switch back to upload tab and perform upload
      const uploadTab = screen.getByRole('button', { name: /Upload Resume/ });
      fireEvent.click(uploadTab);
      
      const mockUploadButton = screen.getByTestId('mock-upload-button');
      await act(async () => {
        fireEvent.click(mockUploadButton);
      });
      
      // Switch back to history tab
      fireEvent.click(historyTab);
      
      // Refresh trigger should be incremented
      expect(screen.getByText(/Refresh Trigger: 1/)).toBeInTheDocument();
    });
  });

  describe('Resume Details Modal', () => {
    test('opens modal when resume is selected', async () => {
      await act(async () => {
        render(<App />);
      });
      
      await waitForAsyncEffects();
      
      // Switch to history tab
      const historyTab = screen.getByRole('button', { name: /Resume History/ });
      fireEvent.click(historyTab);
      
      // Click select resume button
      const selectButton = screen.getByTestId('mock-select-resume');
      await act(async () => {
        fireEvent.click(selectButton);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('resume-details')).toBeInTheDocument();
      });
      
      // Check modal attributes
      const modal = screen.getByTestId('resume-details');
      expect(modal).toHaveAttribute('data-modal', 'true');
    });

    test('closes modal when close button is clicked', async () => {
      await act(async () => {
        render(<App />);
      });
      
      await waitForAsyncEffects();
      
      // Switch to history tab and open modal
      const historyTab = screen.getByRole('button', { name: /Resume History/ });
      fireEvent.click(historyTab);
      
      const selectButton = screen.getByTestId('mock-select-resume');
      await act(async () => {
        fireEvent.click(selectButton);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('resume-details')).toBeInTheDocument();
      });
      
      // Close modal
      const closeButton = screen.getByTestId('close-modal');
      fireEvent.click(closeButton);
      
      // Modal should be gone
      expect(screen.queryByTestId('resume-details')).not.toBeInTheDocument();
    });

    test('handles resume loading failure', async () => {
      api.getResumeById.mockRejectedValue(new Error('Failed to load resume'));
      
      await act(async () => {
        render(<App />);
      });
      
      await waitForAsyncEffects();
      
      // Switch to history tab
      const historyTab = screen.getByRole('button', { name: /Resume History/ });
      fireEvent.click(historyTab);
      
      // Try to select resume
      const selectButton = screen.getByTestId('mock-select-resume');
      await act(async () => {
        fireEvent.click(selectButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/Failed to load resume details/)).toBeInTheDocument();
      });
    });
  });

  describe('Welcome Screen', () => {
    test('shows welcome screen for first-time users', async () => {
      // Mock zero resumes
      api.getResumeStats.mockResolvedValue({
        data: {
          success: true,
          data: {
            total_resumes: 0,
            avg_rating: 0,
            high_rated_count: 0
          }
        }
      });
      
      await act(async () => {
        render(<App />);
      });
      
      await waitForAsyncEffects();
      
      expect(screen.getByText(/Welcome to Resume Analyzer!/)).toBeInTheDocument();
      expect(screen.getByText(/Get started by uploading your first resume/)).toBeInTheDocument();
      expect(screen.getByText(/AI-Powered Analysis/)).toBeInTheDocument();
    });

    test('hides welcome screen when user has resumes', async () => {
      // Default mock has 10 resumes
      await act(async () => {
        render(<App />);
      });
      
      await waitForAsyncEffects();
      
      expect(screen.queryByText(/Welcome to Resume Analyzer!/)).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('displays and clears errors when switching tabs', async () => {
      api.getResumeById.mockRejectedValue(new Error('Test error'));
      
      await act(async () => {
        render(<App />);
      });
      
      await waitForAsyncEffects();
      
      // Switch to history tab and cause an error
      const historyTab = screen.getByRole('button', { name: /Resume History/ });
      fireEvent.click(historyTab);
      
      const selectButton = screen.getByTestId('mock-select-resume');
      await act(async () => {
        fireEvent.click(selectButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/Test error/)).toBeInTheDocument();
      });
      
      // Switch tabs to clear error
      const uploadTab = screen.getByRole('button', { name: /Upload Resume/ });
      fireEvent.click(uploadTab);
      
      // Error should be cleared
      expect(screen.queryByText(/Test error/)).not.toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    test('shows loading spinner when loading resume details', async () => {
      // Make API call slow
      api.getResumeById.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          data: {
            success: true,
            data: { id: 1, file_name: 'test.pdf', resume_rating: 8 }
          }
        }), 100))
      );
      
      await act(async () => {
        render(<App />);
      });
      
      await waitForAsyncEffects();
      
      // Switch to history tab
      const historyTab = screen.getByRole('button', { name: /Resume History/ });
      fireEvent.click(historyTab);
      
      // Click select resume
      const selectButton = screen.getByTestId('mock-select-resume');
      await act(async () => {
        fireEvent.click(selectButton);
      });
      
      // Should show loading spinner
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText(/Loading resume details/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('tab navigation is keyboard accessible', async () => {
      await act(async () => {
        render(<App />);
      });
      
      await waitForAsyncEffects();
      
      const uploadTab = screen.getByRole('button', { name: /Upload Resume/ });
      const historyTab = screen.getByRole('button', { name: /Resume History/ });
      
      // Focus should work
      uploadTab.focus();
      expect(uploadTab).toHaveFocus();
      
      // Keyboard navigation should work
      fireEvent.keyDown(uploadTab, { key: 'Tab' });
      expect(historyTab).toHaveFocus();
    });

    test('modal has proper focus management', async () => {
      await act(async () => {
        render(<App />);
      });
      
      await waitForAsyncEffects();
      
      // Switch to history tab and open modal
      const historyTab = screen.getByRole('button', { name: /Resume History/ });
      fireEvent.click(historyTab);
      
      const selectButton = screen.getByTestId('mock-select-resume');
      await act(async () => {
        fireEvent.click(selectButton);
      });
      
      await waitFor(() => {
        const modal = screen.getByTestId('resume-details');
        expect(modal).toBeInTheDocument();
      });
    });
  });

  describe('Component Integration', () => {
    test('passes correct props to child components', async () => {
      await act(async () => {
        render(<App />);
      });
      
      await waitForAsyncEffects();
      
      // ResumeUploader should be rendered with callbacks
      const uploader = screen.getByTestId('resume-uploader');
      expect(uploader).toBeInTheDocument();
      
      // Switch to history tab
      const historyTab = screen.getByRole('button', { name: /Resume History/ });
      fireEvent.click(historyTab);
      
      // PastResumesTable should be rendered with refresh trigger
      const table = screen.getByTestId('past-resumes-table');
      expect(table).toBeInTheDocument();
      expect(screen.getByText(/Refresh Trigger: 0/)).toBeInTheDocument();
    });
  });
});