import React, { useMemo, useState } from 'react';
import './PastResumesTable.css';

type Rating = 'high' | 'medium' | 'low';

export interface ResumeRow {
  id: string;
  fileName: string;
  fileIcon?: React.ReactNode; // e.g., 📄
  name: string | null;
  email: string | null;
  rating: Rating | null;
  uploadedAt: string; // ISO date string
}

interface PastResumesProps {
  data: ResumeRow[];
  totalCount?: number;
  initialPageSize?: number;
  onRefresh?: () => void;
  onView?: (row: ResumeRow) => void;
  onDelete?: (row: ResumeRow) => Promise<void> | void;
  loading?: boolean;
  error?: string | null;
}

type SortKey = 'fileName' | 'name' | 'email' | 'rating' | 'uploadedAt';
type SortDir = 'asc' | 'desc' | null;

export const PastResumes: React.FC<PastResumesProps> = ({
  data,
  totalCount,
  initialPageSize = 10,
  onRefresh,
  onView,
  onDelete,
  loading = false,
  error = null,
}) => {
  const [query, setQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<'all' | Rating>('all');
  const [sortKey, setSortKey] = useState<SortKey>('uploadedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [confirm, setConfirm] = useState({ open: false, row: null, working: false, error: undefined });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.filter(r => {
      const matchesQ =
        !q ||
        r.fileName.toLowerCase().includes(q) ||
        (r.name?.toLowerCase().includes(q) ?? false) ||
        (r.email?.toLowerCase().includes(q) ?? false);
      const matchesFilter = ratingFilter === 'all' || r.rating === ratingFilter;
      return matchesQ && matchesFilter;
    });
  }, [data, query, ratingFilter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (!sortDir) return arr;
    arr.sort((a, b) => {
      let av: any = a[sortKey];
      let bv: any = b[sortKey];
      if (sortKey === 'uploadedAt') {
        av = new Date(a.uploadedAt).getTime();
        bv = new Date(b.uploadedAt).getTime();
      } else if (sortKey === 'rating') {
        const order: Record<Rating, number> = { high: 3, medium: 2, low: 1 };
        av = a.rating ? order[a.rating] : 0;
        bv = b.rating ? order[b.rating] : 0;
      } else {
        av = (av ?? '').toString().toLowerCase();
        bv = (bv ?? '').toString().toLowerCase();
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const total = totalCount ?? sorted.length;
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageClamped = Math.min(page, totalPages);
  const pageItems = useMemo(() => {
    const start = (pageClamped - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, pageClamped, pageSize]);

  const setSort = (key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir('asc');
    } else {
      setSortDir(prev => (prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc'));
    }
  };

  const openDelete = (row: ResumeRow) => setConfirm({ open: true, row, working: false });
  const closeDelete = () => setConfirm({ open: false, row: null, working: false });

  const confirmDelete = async () => {
    if (!confirm.row) return;
    try {
      setConfirm(c => ({ ...c, working: true, error: undefined }));
      await onDelete?.(confirm.row);
      setConfirm({ open: false, row: null, working: false });
    } catch (e) {
      setConfirm(c => ({ ...c, working: false, error: e?.message ?? 'Failed to delete' }));
    }
  };

  return (
    <div className="past-resumes-container">
      <div className="table-header">
        <div className="header-left">
          <h2 className="table-title">
            <span role="img" aria-label="files">📂</span>
            Past Resumes
          </h2>
          <span className="resume-count">{total} total</span>
        </div>
        <div className="header-right">
          <button className="refresh-button" onClick={onRefresh} disabled={loading}>
            <span role="img" aria-label="refresh">🔄</span>
            Refresh
          </button>
        </div>
      </div>

      <div className="table-controls">
        <div className="search-box">
          <span className="search-icon" aria-hidden>🔍</span>
          <input
            className="search-input"
            placeholder="Search by file, name, or email"
            value={query}
            onChange={e => { setPage(1); setQuery(e.target.value); }}
          />
        </div>

        <div className="filter-box">
          <select
            className="filter-select"
            value={ratingFilter}
            onChange={e => { setPage(1); setRatingFilter(e.target.value); }}
          >
            <option value="all">All ratings</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="filter-box">
          <select
            className="filter-select"
            value={pageSize}
            onChange={e => { setPage(1); setPageSize(Number(e.target.value)); }}
          >
            <option value={5}>5 / page</option>
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>
        </div>
      </div>

      {error ? (
        <div className="error-state">
          <span className="error-icon" role="img" aria-label="error">⚠️</span>
          <h3>Failed to load</h3>
          <p>{error}</p>
          <button className="retry-button" onClick={onRefresh} disabled={loading}>
            <span role="img" aria-label="retry">↻</span>
            Try again
          </button>
        </div>
      ) : !loading && sorted.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon" role="img" aria-label="empty">📭</span>
          <h3>No resumes yet</h3>
          <p>Add or upload resumes, then manage them here.</p>
          <button className="retry-button" onClick={onRefresh} disabled={loading}>
            <span role="img" aria-label="refresh">🔄</span>
            Refresh list
          </button>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="resumes-table">
              <thead>
                <tr>
                  <th className={`sortable ${sortKey === 'fileName' ? 'active' : ''}`} onClick={() => setSort('fileName')}>
                    File {sortKey === 'fileName' ? (sortDir === 'asc' ? '▲' : sortDir === 'desc' ? '▼' : '') : ''}
                  </th>
                  <th className={`sortable ${sortKey === 'name' ? 'active' : ''}`} onClick={() => setSort('name')}>
                    Name {sortKey === 'name' ? (sortDir === 'asc' ? '▲' : sortDir === 'desc' ? '▼' : '') : ''}
                  </th>
                  <th className={`sortable ${sortKey === 'email' ? 'active' : ''}`} onClick={() => setSort('email')}>
                    Email {sortKey === 'email' ? (sortDir === 'asc' ? '▲' : sortDir === 'desc' ? '▼' : '') : ''}
                  </th>
                  <th className={`sortable ${sortKey === 'rating' ? 'active' : ''}`} onClick={() => setSort('rating')}>
                    Rating {sortKey === 'rating' ? (sortDir === 'asc' ? '▲' : sortDir === 'desc' ? '▼' : '') : ''}
                  </th>
                  <th className={`sortable ${sortKey === 'uploadedAt' ? 'active' : ''}`} onClick={() => setSort('uploadedAt')}>
                    Uploaded {sortKey === 'uploadedAt' ? (sortDir === 'asc' ? '▲' : sortDir === 'desc' ? '▼' : '') : ''}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(loading ? Array.from({ length: pageSize }).map((_, i) => ({ id: `s-${i}` })) : pageItems).map((row: any) => {
                  if (loading) {
                    return (
                      <tr key={row.id} className="resume-row">
                        <td className="file-name-cell" data-label="File">
                          <div className="file-info">
                            <span className="file-icon">📄</span>
                            <span className="file-name no-data">Loading…</span>
                          </div>
                        </td>
                        <td className="name-cell"><span className="no-data">—</span></td>
                        <td className="email-cell"><span className="no-data">—</span></td>
                        <td className="rating-cell"><span className="no-data">—</span></td>
                        <td className="date-cell"><span className="no-data">—</span></td>
                        <td className="actions-cell">
                          <div className="action-buttons">
                            <button className="view-button" disabled>View</button>
                            <button className="delete-button" disabled>✖</button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  const r = row;
                  const ratingClass =
                    r.rating === 'high' ? 'rating-badge rating-high' :
                    r.rating === 'medium' ? 'rating-badge rating-medium' :
                    r.rating === 'low' ? 'rating-badge rating-low' :
                    'no-data';

                  return (
                    <tr key={r.id} className="resume-row">
                      <td className="file-name-cell" data-label="File">
                        <div className="file-info">
                          <span className="file-icon" aria-hidden>{r.fileIcon ?? '📄'}</span>
                          <span className="file-name" title={r.fileName}>{r.fileName}</span>
                        </div>
                      </td>
                      <td className="name-cell" data-label="Name">
                        {r.name ?? <span className="no-data">Unknown</span>}
                      </td>
                      <td className="email-cell" data-label="Email">
                        {r.email ?? <span className="no-data">Unknown</span>}
                      </td>
                      <td className="rating-cell" data-label="Rating">
                        {r.rating ? <span className={ratingClass}>{r.rating}</span> : <span className="no-data">—</span>}
                      </td>
                      <td className="date-cell" data-label="Uploaded">
                        {new Date(r.uploadedAt).toLocaleString()}
                      </td>
                      <td className="actions-cell" data-label="Actions">
                        <div className="action-buttons">
                          <button className="view-button" onClick={() => onView?.(r)}>View</button>
                          <button className="delete-button" onClick={() => openDelete(r)} aria-label="Delete">✖</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pagination-container">
            <div className="pagination-info">
              Showing {(pageClamped - 1) * pageSize + 1}-
              {Math.min(pageClamped * pageSize, sorted.length)} of {sorted.length}
            </div>
            <div className="pagination-controls">
              <button className="page-button" onClick={() => setPage(1)} disabled={pageClamped === 1}>« First</button>
              <button className="page-button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={pageClamped === 1}>‹ Prev</button>
              {Array.from({ length: totalPages }).slice(0, 7).map((_, i) => {
                const n = i + 1;
                return (
                  <button key={n} className={`page-button ${pageClamped === n ? 'active' : ''}`} onClick={() => setPage(n)}>
                    {n}
                  </button>
                );
              })}
              <button className="page-button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={pageClamped === totalPages}>Next ›</button>
              <button className="page-button" onClick={() => setPage(totalPages)} disabled={pageClamped === totalPages}>Last »</button>
            </div>
          </div>
        </>
      )}

      {confirm.open && confirm.row ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="delete-modal">
            <div className="modal-header">
              <h3>
                <span role="img" aria-label="warning">🗑️</span>
                Confirm deletion
              </h3>
            </div>
            <div className="modal-body">
              <p>Delete the following file? This action cannot be undone.</p>
              <div className="file-to-delete">{confirm.row.fileName}</div>
              {confirm.error ? <div className="warning-text">{confirm.error}</div> : null}
            </div>
            <div className="modal-actions">
              <button className="cancel-button" onClick={closeDelete} disabled={confirm.working}>Cancel</button>
              <button className="confirm-delete-button" onClick={confirmDelete} disabled={confirm.working}>
                {confirm.working ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default PastResumes;
