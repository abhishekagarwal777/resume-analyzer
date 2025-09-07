import React, { useCallback, useMemo, useRef, useState } from 'react';
import './ResumeUploader.css';

const prettyBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
};

const getFileBandFromScore = (score) => {
  if (score === undefined || score === null) return undefined;
  if (score >= 75) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
};

export const ResumeUploader = ({
  title = 'Upload Resume',
  subtitle = 'Drag and drop a file here, or click to select a PDF/DOC/DOCX.',
  accept = [
    '.pdf',
    '.doc',
    '.docx',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  maxSizeBytes = 10 * 1024 * 1024,
  onUpload,
  onCancel,
  onSuccessUploadAnother,
  uploadCta = 'Upload',
  cancelCta = 'Cancel',
  uploadAnotherCta = 'Upload another',
}) => {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(null);

  const acceptAttr = useMemo(() => accept.join(','), [accept]);

  const validateFile = (f) => {
    if (f.size > maxSizeBytes) {
      return `File is too large. Max allowed is ${prettyBytes(maxSizeBytes)}.`;
    }
    // Accept by extension or MIME
    const nameOk = accept.some(a => a.startsWith('.') && f.name.toLowerCase().endsWith(a.toLowerCase()));
    const typeOk = accept.some(a => !a.startsWith('.') && f.type === a);
    if (!nameOk && !typeOk) {
      return 'Unsupported file type. Please upload PDF, DOC, or DOCX.';
    }
    return null;
  };

  const onDropFiles = useCallback((files) => {
    setError(null);
    setSuccess(null);
    if (!files || files.length === 0) return;
    const f = files[0];
    const err = validateFile(f);
    setFile(f);
    if (err) {
      setError(err);
    }
  }, []);

  const onSelectFile = (e) => {
    onDropFiles(e.target.files);
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    onDropFiles(e.dataTransfer.files);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const removeFile = () => {
    setFile(null);
    setError(null);
    setSuccess(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const startUpload = async () => {
    if (!file || error) return;
    setUploading(true);
    setSuccess(null);
    try {
      let result;
      if (onUpload) {
        result = await onUpload(file);
      } else {
        // Fallback mock
        await new Promise(r => setTimeout(r, 1200));
        const score = Math.floor(50 + Math.random() * 50);
        result = {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type || (file.name.split('.').pop() ?? '').toLowerCase(),
          candidate: { name: 'Candidate', email: 'candidate@example.com' },
          rating: { score, band: getFileBandFromScore(score) },
        };
      }
      setSuccess(result);
    } catch (e) {
      setError(e?.message ?? 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const zoneClasses = [
    'upload-zone',
    dragOver ? 'drag-over' : '',
    file ? 'has-file' : '',
    error ? 'has-error invalid-file' : '',
    uploading ? 'uploading' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="uploader-container">
      <header className="uploader-header">
        <h2 className="uploader-title">
          <span role="img" aria-label="upload">📤</span>
          {title}
        </h2>
        <p className="uploader-subtitle">{subtitle}</p>
      </header>

      {error ? (
        <div className="error-message" role="alert">
          <span className="error-icon" aria-hidden>⚠️</span>
          <div className="error-text">{error}</div>
          <button
            className="error-close-button"
            title="Dismiss error"
            aria-label="Dismiss error"
            onClick={() => setError(null)}
          >
            ✖
          </button>
        </div>
      ) : null}

      <div
        className={zoneClasses}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        aria-label="Upload zone"
      >
        <input
          ref={inputRef}
          className="file-input"
          type="file"
          accept={acceptAttr}
          onChange={onSelectFile}
          aria-label="Choose file"
        />

        {!file ? (
          <div className="upload-prompt">
            <div className="upload-icon" aria-hidden>⭳</div>
            <div className="upload-text">
              <div className="primary-text">Drop file here or click to browse</div>
              <div className="secondary-text">Accepted: PDF, DOC, DOCX. Max size {prettyBytes(maxSizeBytes)}.</div>
            </div>
            <div className="upload-requirements">
              <div className="requirement"><span aria-hidden>✅</span> Clear, readable formatting</div>
              <div className="requirement"><span aria-hidden>✅</span> One file at a time</div>
            </div>
          </div>
        ) : (
          <div className={`file-selected ${uploading ? 'uploading' : ''}`}>
            <div className="file-icon" aria-hidden>📄</div>
            <div className="file-details">
              <div className="file-name" title={file.name}>{file.name}</div>
              <div className="file-size">{prettyBytes(file.size)}</div>
              <div className="file-type">{(file.type || file.name.split('.').pop() || '').toUpperCase()}</div>
            </div>
            <button
              className="remove-file-button"
              title="Remove file"
              aria-label="Remove file"
              onClick={removeFile}
              disabled={uploading}
            >
              ✖
            </button>
          </div>
        )}
      </div>

      {!success ? (
        <div className="upload-actions">
          <button
            className="upload-button"
            title={uploadCta}
            onClick={startUpload}
            disabled={!file || !!error || uploading}
          >
            {uploading ? 'Uploading…' : uploadCta}
          </button>
          <button
            className="cancel-button"
            title={cancelCta}
            onClick={onCancel}
            disabled={uploading}
          >
            {cancelCta}
          </button>
        </div>
      ) : null}

      {success ? (
        <>
          <div className="upload-success" role="status" aria-live="polite">
            <div className="success-icon" aria-hidden>✅</div>
            <h3 className="success-title">Upload successful</h3>
            <div className="success-details">
              <div className="success-file">
                <strong>File:</strong> {success.fileName} • {prettyBytes(success.fileSize)}
              </div>
              {success.rating?.score !== undefined ? (
                <div className="success-rating">
                  <strong>Rating:</strong> {success.rating.score}
                  <span className={`rating-badge ${success.rating.band ?? getFileBandFromScore(success.rating.score) ?? 'low'}`}>
                    {(success.rating.band ?? getFileBandFromScore(success.rating.score) ?? 'low').toUpperCase()}
                  </span>
                </div>
              ) : null}
              {success.candidate ? (
                <div className="success-candidate">
                  {success.candidate.name ? <div><strong>Name:</strong> {success.candidate.name}</div> : null}
                  {success.candidate.email ? <div><strong>Email:</strong> {success.candidate.email}</div> : null}
                  {success.candidate.phone ? <div><strong>Phone:</strong> {success.candidate.phone}</div> : null}
                </div>
              ) : null}
            </div>
            <div className="success-actions">
              <button
                className="upload-another-button"
                title={uploadAnotherCta}
                onClick={() => {
                  setFile(null);
                  setError(null);
                  setSuccess(null);
                  if (inputRef.current) inputRef.current.value = '';
                  onSuccessUploadAnother?.();
                }}
              >
                <span aria-hidden>🔁</span>
                {uploadAnotherCta}
              </button>
            </div>
          </div>

          <section className="upload-tips" style={{ marginTop: '1rem' }}>
            <h4 className="tips-title">
              <span aria-hidden>💡</span>
              Tips to improve parsing
            </h4>
            <ul className="tips-list">
              <li>Keep resume to 1–2 pages with clear section headings.</li>
              <li>Prefer PDF or DOCX; avoid images of text.</li>
              <li>Use consistent bullet styles and dates.</li>
            </ul>
          </section>
        </>
      ) : null}
    </div>
  );
};

export default ResumeUploader;
