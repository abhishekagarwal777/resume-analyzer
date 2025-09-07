import React from 'react';
import './LoadingSpinner.css';

/* =======================
   Spinner
   ======================= */
export const Spinner = ({
  size = 'medium',
  tone = 'primary',
  inline = false,
  overlay = false,
  message,
  className = '',
}) => {
  const root = (
    <div
      className={`spinner spinner-${size} spinner-${tone} ${
        inline ? 'spinner-inline' : ''
      } ${className}`.trim()}
    >
      <div className="spinner-circle" />
      {inline && message ? (
        <span className="spinner-message-inline">{message}</span>
      ) : null}
    </div>
  );

  if (!overlay) return root;

  return (
    <div className="spinner-overlay">
      <div className="spinner-container">
        {root}
        {message && !inline ? (
          <div className="spinner-message">{message}</div>
        ) : null}
      </div>
    </div>
  );
};

/* =======================
   Dot Loader
   ======================= */
export const DotLoader = ({
  size = 'medium',
  tone = 'primary',
  message,
  className = '',
}) => {
  return (
    <div className={`dot-loader-container ${className}`.trim()}>
      <div className={`dot-loader dots-${size} dots-${tone}`}>
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
      </div>
      {message ? <p className="dot-loader-message">{message}</p> : null}
    </div>
  );
};

/* =======================
   Progress Loader
   ======================= */
export const ProgressLoader = ({
  message = 'Loading',
  percent = 0,
  indeterminate = false,
  tone = 'primary',
  showPercent = true,
  className = '',
}) => {
  const safe = Math.round(Math.max(0, Math.min(100, percent)));
  const widthStyle = indeterminate ? undefined : { width: `${safe}%` };
  const barClass = `progress-bar progress-${tone} ${
    indeterminate ? 'indeterminate' : ''
  }`.trim();

  return (
    <div className={`progress-loader-container ${className}`.trim()}>
      <div className="progress-loader-header">
        <span className="progress-message">{message}</span>
        {showPercent && !indeterminate ? (
          <span className="progress-percentage">{safe}%</span>
        ) : null}
      </div>
      <div className="progress-bar-container">
        <div className={barClass} style={widthStyle} />
      </div>
    </div>
  );
};

/* =======================
   Skeletons
   ======================= */
export const SkeletonLine = ({ width = '100%', height, className = '' }) => {
  const style = { width };
  if (height !== undefined)
    style.height = typeof height === 'number' ? `${height}px` : height;
  return <div className={`skeleton-line ${className}`.trim()} style={style} />;
};

export const SkeletonCard = ({ className = '' }) => (
  <div className={`skeleton-card ${className}`.trim()}>
    <div className="skeleton-avatar" />
    <div className="skeleton-content">
      <div className="skeleton-title" />
      <div className="skeleton-text" />
      <div className="skeleton-text-short" />
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 3, cols = 4, className = '' }) => {
  return (
    <div className={`skeleton-table ${className}`.trim()}>
      <div className="skeleton-table-header">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="skeleton-header-cell" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="skeleton-table-row">
          {Array.from({ length: cols }).map((__, c) => (
            <div key={c} className="skeleton-cell" />
          ))}
        </div>
      ))}
    </div>
  );
};

/* =======================
   File Upload Loader
   ======================= */
export const FileUploadLoader = ({
  icon = '⭳',
  title = 'Uploading file',
  filename,
  message,
  percent = 0,
  indeterminate = false,
  tone = 'primary',
  steps = [
    { label: 'Select', completed: true },
    { label: 'Upload', completed: false },
    { label: 'Process', completed: false },
  ],
  className = '',
}) => {
  const safe = Math.round(Math.max(0, Math.min(100, percent)));
  const widthStyle = indeterminate ? undefined : { width: `${safe}%` };
  const barClass = `upload-progress-bar progress-${tone} ${
    indeterminate ? 'indeterminate' : ''
  }`.trim();

  return (
    <div className={`file-upload-loader ${className}`.trim()}>
      <span className="upload-icon">{icon}</span>
      <div className="upload-title">{title}</div>
      {filename ? <div className="upload-filename">{filename}</div> : null}
      {message ? <div className="stage-message">{message}</div> : null}
      <div className="upload-progress">
        <div className={barClass} style={widthStyle} />
      </div>
      <div className="upload-steps">
        {steps.map((s, i) => (
          <span
            key={i}
            className={`step ${s.completed ? 'completed' : ''}`.trim()}
          >
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
};

/* =======================
   Example Showcase (optional)
   ======================= */
export const LoadersShowcase = () => {
  return (
    <div style={{ display: 'grid', gap: 24, padding: 24 }}>
      <h3>Spinner</h3>
      <Spinner inline size="small" tone="secondary" message="Saving..." />
      <Spinner overlay size="large" tone="primary" message="Loading data..." />

      <h3>Dots</h3>
      <DotLoader size="medium" tone="success" message="Fetching..." />

      <h3>Progress</h3>
      <ProgressLoader message="Uploading" percent={42} tone="warning" />
      <ProgressLoader message="Connecting" indeterminate tone="secondary" />

      <h3>Skeletons</h3>
      <SkeletonCard />
      <SkeletonTable rows={3} cols={4} />
      <SkeletonLine width="70%" />

      <h3>File Upload</h3>
      <FileUploadLoader
        filename="report.pdf"
        percent={70}
        tone="primary"
        steps={[
          { label: 'Select', completed: true },
          { label: 'Upload', completed: true },
          { label: 'Process' },
        ]}
      />
    </div>
  );
};

/* =======================
   Exports
   ======================= */
export default Spinner;
