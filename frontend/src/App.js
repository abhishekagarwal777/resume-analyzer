import React, { useState, useEffect } from 'react';
import './App.css';

// Import components
import ResumeUploader from './components/ResumeUploader';
import PastResumesTable from './components/PastResumesTable';
import ResumeDetails from './components/ResumeDetails';
import LoadingSpinner from './components/LoadingSpinner';

// Import API functions
import { getResumeStats, getResumeById, isServerReachable } from './services/api';

/**
 * Main Application Component
 * Manages the overall application state and navigation
 */
function App() {
  // State management
  const [activeTab, setActiveTab] = useState('upload');
  const [selectedResumeId, setSelectedResumeId] = useState(null);
  const [selectedResumeData, setSelectedResumeData] = useState(null);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [stats, setStats] = useState(null);
  const [serverStatus, setServerStatus] = useState('checking'); // checking, online, offline
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load initial data on component mount
  useEffect(() => {
    checkServerStatus();
    loadStats();
  }, []);

  /**
   * Check if the backend server is reachable
   */
  const checkServerStatus = async () => {
    try {
      const isReachable = await isServerReachable();
      setServerStatus(isReachable ? 'online' : 'offline');
      
      if (!isReachable) {
        setError('Unable to connect to the server. Please check if the backend is running.');
      } else {
        setError(null);
      }
    } catch (err) {
      console.error('❌ Server status check failed:', err);
      setServerStatus('offline');
      setError('Server connection failed. Please try again later.');
    }
  };

  /**
   * Load application statistics
   */
  const loadStats = async () => {
    try {
      const response = await getResumeStats();
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('❌ Failed to load stats:', err);
      // Don't set error for stats failure - it's not critical
    }
  };

  /**
   * Handle successful resume upload
   */
  const handleUploadSuccess = (resumeData) => {
    console.log('✅ Resume uploaded successfully:', resumeData);
    
    // Refresh stats
    loadStats();
    
    // Trigger refresh for the table
    setRefreshTrigger(prev => prev + 1);
    
    // Switch to history tab to show the uploaded resume
    setTimeout(() => {
      setActiveTab('history');
    }, 2000);
  };

  /**
   * Handle upload start
   */
  const handleUploadStart = () => {
    console.log('📤 Upload started');
    setError(null);
  };

  /**
   * Handle resume selection for detailed view
   */
  const handleSelectResume = async (resumeId) => {
    if (!resumeId) return;

    try {
      setLoading(true);
      setSelectedResumeId(resumeId);
      
      console.log(`📄 Loading resume details for ID: ${resumeId}`);
      
      const response = await getResumeById(resumeId);
      
      if (response.data.success) {
        setSelectedResumeData(response.data.data);
        setShowResumeModal(true);
      } else {
        throw new Error(response.data.message || 'Failed to load resume details');
      }
    } catch (err) {
      console.error('❌ Failed to load resume details:', err);
      setError(err.message || 'Failed to load resume details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Close resume details modal
   */
  const closeResumeModal = () => {
    setShowResumeModal(false);
    setSelectedResumeData(null);
    setSelectedResumeId(null);
  };

  /**
   * Handle tab change
   */
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError(null); // Clear any existing errors when switching tabs
  };

  /**
   * Retry server connection
   */
  const retryConnection = () => {
    setServerStatus('checking');
    setError(null);
    checkServerStatus();
    loadStats();
  };

  /**
   * Format stats for display
   */
  const formatStats = () => {
    if (!stats) return null;
    
    return {
      totalResumes: stats.total_resumes || 0,
      avgRating: stats.avg_rating ? parseFloat(stats.avg_rating).toFixed(1) : 'N/A',
      highRatedCount: stats.high_rated_count || 0
    };
  };

  const formattedStats = formatStats();

  return (
    <div className="App">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div>
            <h1 className="app-title">
              📄 Resume Analyzer
              {serverStatus === 'checking' && <LoadingSpinner size="small" showMessage={false} />}
              {serverStatus === 'offline' && <span style={{ color: '#dc3545' }}>⚠️</span>}
              {serverStatus === 'online' && <span style={{ color: '#28a745' }}>✅</span>}
            </h1>
            <p className="app-subtitle">
              AI-powered resume analysis and improvement suggestions
            </p>
          </div>
          
          {formattedStats && (
            <div className="header-stats">
              <div className="stat-item">
                <span>📊</span>
                <span className="stat-number">{formattedStats.totalResumes}</span>
                <span>Resumes Analyzed</span>
              </div>
              <div className="stat-item">
                <span>⭐</span>
                <span className="stat-number">{formattedStats.avgRating}</span>
                <span>Avg Rating</span>
              </div>
              <div className="stat-item">
                <span>🏆</span>
                <span className="stat-number">{formattedStats.highRatedCount}</span>
                <span>High Rated</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="app-nav">
        <div className="nav-content">
          <ul className="nav-tabs">
            <li className="nav-tab">
              <button
                className={`nav-button ${activeTab === 'upload' ? 'active' : ''}`}
                onClick={() => handleTabChange('upload')}
              >
                📤 Upload Resume
              </button>
            </li>
            <li className="nav-tab">
              <button
                className={`nav-button ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => handleTabChange('history')}
              >
                📋 Resume History
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* Main Content */}
      <main className="app-main">
        {/* Error Display */}
        {error && (
          <div className="app-error">
            <span className="error-icon">⚠️</span>
            <span className="error-message">{error}</span>
            {serverStatus === 'offline' && (
              <button className="error-retry" onClick={retryConnection}>
                🔄 Retry
              </button>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="app-loading">
            <LoadingSpinner 
              size="large" 
              message="Loading resume details..." 
              overlay={false}
            />
          </div>
        )}

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'upload' && (
            <>
              {serverStatus === 'online' ? (
                <ResumeUploader
                  onUploadSuccess={handleUploadSuccess}
                  onUploadStart={handleUploadStart}
                />
              ) : (
                <div className="welcome-screen">
                  <div className="welcome-icon">⚠️</div>
                  <h2 className="welcome-title">Server Offline</h2>
                  <p className="welcome-description">
                    The Resume Analyzer backend server is not responding. 
                    Please make sure the backend is running on port 5000.
                  </p>
                  <button 
                    className="error-retry" 
                    onClick={retryConnection}
                    style={{ 
                      background: '#007bff',
                      padding: '0.75rem 2rem',
                      fontSize: '1rem',
                      borderRadius: '8px',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    🔄 Check Connection
                  </button>
                </div>
              )}
            </>
          )}

          {activeTab === 'history' && (
            <>
              {serverStatus === 'online' ? (
                <PastResumesTable
                  onSelectResume={handleSelectResume}
                  refreshTrigger={refreshTrigger}
                />
              ) : (
                <div className="welcome-screen">
                  <div className="welcome-icon">📋</div>
                  <h2 className="welcome-title">Resume History Unavailable</h2>
                  <p className="welcome-description">
                    Cannot load resume history while the server is offline. 
                    Please check your connection and try again.
                  </p>
                  <button 
                    className="error-retry" 
                    onClick={retryConnection}
                    style={{ 
                      background: '#007bff',
                      padding: '0.75rem 2rem',
                      fontSize: '1rem',
                      borderRadius: '8px',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    🔄 Retry Connection
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Welcome Message for First-Time Users */}
        {activeTab === 'upload' && serverStatus === 'online' && formattedStats?.totalResumes === 0 && (
          <div className="welcome-screen" style={{ marginTop: '2rem' }}>
            <div className="welcome-icon">🎉</div>
            <h2 className="welcome-title">Welcome to Resume Analyzer!</h2>
            <p className="welcome-description">
              Get started by uploading your first resume for AI-powered analysis and improvement suggestions.
            </p>
            
            <div className="welcome-features">
              <div className="feature-card">
                <div className="feature-icon">🤖</div>
                <h3 className="feature-title">AI-Powered Analysis</h3>
                <p className="feature-description">
                  Advanced AI analyzes your resume content, structure, and formatting to provide detailed insights.
                </p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">⭐</div>
                <h3 className="feature-title">Resume Rating</h3>
                <p className="feature-description">
                  Get an objective rating (1-10) based on industry standards and best practices.
                </p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">💡</div>
                <h3 className="feature-title">Improvement Suggestions</h3>
                <p className="feature-description">
                  Receive specific, actionable recommendations to enhance your resume's effectiveness.
                </p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">🚀</div>
                <h3 className="feature-title">Skill Development</h3>
                <p className="feature-description">
                  Get personalized upskilling suggestions to boost your career prospects.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Resume Details Modal */}
      {showResumeModal && selectedResumeData && (
        <div className="modal-overlay" onClick={closeResumeModal}>
          <div onClick={(e) => e.stopPropagation()}>
            <ResumeDetails
              resumeData={selectedResumeData}
              onClose={closeResumeModal}
              isModal={true}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-links">
            <a href="#privacy" className="footer-link">Privacy Policy</a>
            <a href="#terms" className="footer-link">Terms of Service</a>
            <a href="#contact" className="footer-link">Contact Support</a>
            <a href="#about" className="footer-link">About</a>
          </div>
          <p className="footer-text">
            © 2024 Resume Analyzer. Built with React.js and powered by AI.
          </p>
          <p className="footer-text">
            Server Status: 
            <span style={{ 
              color: serverStatus === 'online' ? '#28a745' : serverStatus === 'offline' ? '#dc3545' : '#ffc107',
              fontWeight: '600',
              marginLeft: '0.5rem'
            }}>
              {serverStatus === 'online' ? '🟢 Online' : serverStatus === 'offline' ? '🔴 Offline' : '🟡 Checking...'}
            </span>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;