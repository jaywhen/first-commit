import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  findCommitByOldestIndex,
  findFirstCommit,
  getCommitCount,
  getDefaultBranch,
  parseRepoFromUrl,
  type CommitInfo
} from '../src/lib/github';
import { getGithubToken } from '../src/lib/storage';

const GRID_PAGE_SIZE = 100;
const PREFS_KEY = 'first-commit-finder:prefs';

type Mode = 'first' | 'index';

type UiPrefs = {
  showFirstCommit: boolean;
  showIndexGrid: boolean;
};

const DEFAULT_PREFS: UiPrefs = {
  showFirstCommit: true,
  showIndexGrid: true
};

function formatDate(iso: string): string {
  if (!iso) return 'Unknown date';
  return new Date(iso).toLocaleString();
}

/* ---------- Inline SVG Icons ---------- */
const IconSettings = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
);

const IconMinimize = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
);

const IconGitCommit = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><line x1="1.05" y1="12" x2="7" y2="12"/><line x1="17.01" y1="12" x2="22.96" y2="12"/></svg>
);

const IconGrid = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
);

const IconRefresh = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
);

const IconChevronLeft = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
);

const IconChevronRight = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
);

const IconCopy = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
);

const IconCheck = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);

const IconExternal = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
);

const IconSparkles = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
);

/* ---------- Spinner ---------- */
const Spinner = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ animation: 'fcf-spin 1s linear infinite' } as React.CSSProperties}>
    <style>{`@keyframes fcf-spin{to{transform:rotate(360deg)}}`}</style>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="31.4 31.4" transform="rotate(-90 12 12)">
      <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" />
    </circle>
  </svg>
);

function App() {
  const repo = useMemo(() => parseRepoFromUrl(new URL(window.location.href)), []);
  const [panelOpen, setPanelOpen] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [prefs, setPrefs] = useState<UiPrefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<Mode>('first');
  const [branch, setBranch] = useState<string>('');
  const [totalCommits, setTotalCommits] = useState<number>(0);
  const [gridPage, setGridPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [result, setResult] = useState<(CommitInfo & { branch: string }) | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Partial<UiPrefs>;
      setPrefs({
        showFirstCommit: parsed.showFirstCommit ?? true,
        showIndexGrid: parsed.showIndexGrid ?? true
      });
    } catch {
      setPrefs(DEFAULT_PREFS);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }, [prefs]);

  useEffect(() => {
    setPageInput(String(gridPage));
  }, [gridPage]);

  useEffect(() => {
    if (mode === 'first' && !prefs.showFirstCommit && prefs.showIndexGrid) {
      setMode('index');
    }
    if (mode === 'index' && !prefs.showIndexGrid && prefs.showFirstCommit) {
      setMode('first');
    }
  }, [mode, prefs]);

  if (!repo) return null;

  const ensureBranch = async (token: string): Promise<string> => {
    if (branch) return branch;
    const resolved = await getDefaultBranch(repo, { token });
    setBranch(resolved);
    return resolved;
  };

  const onFindFirst = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getGithubToken();
      const activeBranch = await ensureBranch(token);
      const firstCommit = await findFirstCommit(repo, activeBranch, { token });
      setResult({ ...firstCommit, branch: activeBranch });
      window.open(firstCommit.url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const loadGridMeta = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getGithubToken();
      const activeBranch = await ensureBranch(token);
      const total = await getCommitCount(repo, activeBranch, { token });
      setTotalCommits(total);
      setGridPage(1);
      setPageInput('1');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const onJumpByIndex = async (oldestIndex: number) => {
    setLoading(true);
    setError(null);
    try {
      const token = await getGithubToken();
      const activeBranch = await ensureBranch(token);
      const { total, commit } = await findCommitByOldestIndex(repo, activeBranch, oldestIndex, { token });
      setTotalCommits(total);
      setResult({ ...commit, branch: activeBranch });
      window.open(commit.url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const onCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.sha);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  const availableModes: Mode[] = [];
  if (prefs.showFirstCommit) availableModes.push('first');
  if (prefs.showIndexGrid) availableModes.push('index');

  const pageCount = Math.max(1, Math.ceil(totalCommits / GRID_PAGE_SIZE));
  const startIndex = (gridPage - 1) * GRID_PAGE_SIZE + 1;
  const endIndex = Math.min(totalCommits, gridPage * GRID_PAGE_SIZE);

  const jumpToPage = () => {
    const parsed = Number.parseInt(pageInput.trim(), 10);
    if (!Number.isFinite(parsed) || Number.isNaN(parsed)) {
      setError('Please enter a valid page number.');
      return;
    }
    if (parsed < 1 || parsed > pageCount) {
      setError(`Page must be between 1 and ${pageCount}.`);
      return;
    }
    setError(null);
    setGridPage(parsed);
  };

  return (
    <div style={styles.container}>
      {!panelOpen && (
        <button style={styles.launcher} onClick={() => setPanelOpen(true)} title="Open Commit Finder">
          <IconSparkles size={16} />
          <span>Commit Finder</span>
        </button>
      )}

      {panelOpen && (
        <div style={styles.panel}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerTitle}>
              <IconGitCommit size={16} />
              <span>Commit Finder</span>
            </div>
            <div style={styles.headerActions}>
              <button
                className="fcf-icon-btn"
                style={styles.iconButton}
                title="Settings"
                onClick={() => setShowSettings((prev) => !prev)}
                aria-label="Settings"
              >
                <IconSettings size={14} />
              </button>
              <button
                className="fcf-icon-btn"
                style={styles.iconButton}
                title="Minimize"
                onClick={() => setPanelOpen(false)}
                aria-label="Minimize"
              >
                <IconMinimize size={14} />
              </button>
            </div>
          </div>

          {/* Settings */}
          {showSettings && (
            <div style={styles.settingsBox}>
              <div style={styles.settingsTitle}>Feature Visibility</div>
              <label style={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={prefs.showFirstCommit}
                  onChange={(event) =>
                    setPrefs((prev) => {
                      const next = event.target.checked;
                      if (!next && !prev.showIndexGrid) return prev;
                      return { ...prev, showFirstCommit: next };
                    })
                  }
                />
                <span>Show First Commit</span>
              </label>
              <label style={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={prefs.showIndexGrid}
                  onChange={(event) =>
                    setPrefs((prev) => {
                      const next = event.target.checked;
                      if (!next && !prev.showFirstCommit) return prev;
                      return { ...prev, showIndexGrid: next };
                    })
                  }
                />
                <span>Show Index Grid</span>
              </label>
            </div>
          )}

          {/* Mode Tabs */}
          {availableModes.length > 1 && (
            <div role="tablist" aria-label="Modes" style={styles.tabList}>
              {prefs.showFirstCommit && (
                <button
                  role="tab"
                  aria-selected={mode === 'first'}
                  className="fcf-tab"
                  style={mode === 'first' ? styles.tabActive : styles.tab}
                  onClick={() => setMode('first')}
                >
                  <IconGitCommit size={13} />
                  First Commit
                </button>
              )}
              {prefs.showIndexGrid && (
                <button
                  role="tab"
                  aria-selected={mode === 'index'}
                  className="fcf-tab"
                  style={mode === 'index' ? styles.tabActive : styles.tab}
                  onClick={() => {
                    setMode('index');
                    if (!totalCommits) void loadGridMeta();
                  }}
                >
                  <IconGrid size={13} />
                  Index Grid
                </button>
              )}
            </div>
          )}

          {/* First Commit Mode */}
          {prefs.showFirstCommit && mode === 'first' && (
            <div style={styles.section}>
              <button
                style={loading ? { ...styles.primaryButton, opacity: 0.75, cursor: 'not-allowed' } : styles.primaryButton}
                onClick={onFindFirst}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner size={14} />
                    Opening…
                  </>
                ) : (
                  <>
                    <IconGitCommit size={15} />
                    Go to First Commit
                  </>
                )}
              </button>
            </div>
          )}

          {/* Index Grid Mode */}
          {prefs.showIndexGrid && mode === 'index' && (
            <div style={styles.section}>
              <div style={styles.gridHeader}>
                <div style={styles.gridTitle}>Oldest → Newest Commit Index</div>
                <div style={styles.gridMeta}>
                  {totalCommits > 0 ? `${totalCommits.toLocaleString()} commits` : '— commits'}
                  {branch ? ` · ${branch}` : ''}
                </div>
              </div>

              {/* Pagination Controls */}
              <div style={styles.pagerRow}>
                <button
                  className="fcf-icon-btn"
                  style={gridPage <= 1 ? { ...styles.pagerBtn, opacity: 0.45, cursor: 'not-allowed' } : styles.pagerBtn}
                  disabled={loading || gridPage <= 1}
                  onClick={() => setGridPage((prev) => Math.max(1, prev - 1))}
                  title="Previous 100"
                >
                  <IconChevronLeft size={14} />
                </button>
                <div style={styles.pageInfo}>
                  <input
                    type="text"
                    value={pageInput}
                    inputMode="numeric"
                    placeholder="1"
                    onChange={(event) => setPageInput(event.target.value)}
                    onKeyDown={(event) => { if (event.key === 'Enter') jumpToPage(); }}
                    style={styles.pageInput}
                  />
                  <span style={styles.pageOf}>/ {pageCount.toLocaleString()}</span>
                </div>
                <button
                  className="fcf-icon-btn"
                  style={gridPage >= pageCount ? { ...styles.pagerBtn, opacity: 0.45, cursor: 'not-allowed' } : styles.pagerBtn}
                  disabled={loading || gridPage >= pageCount}
                  onClick={() => setGridPage((prev) => Math.min(pageCount, prev + 1))}
                  title="Next 100"
                >
                  <IconChevronRight size={14} />
                </button>
                <button
                  className="fcf-icon-btn"
                  style={loading ? { ...styles.refreshBtn, opacity: 0.65 } : styles.refreshBtn}
                  disabled={loading}
                  onClick={() => void loadGridMeta()}
                  title="Load / Refresh"
                >
                  <IconRefresh size={13} />
                </button>
              </div>

              {totalCommits > 0 && (
                <div style={styles.rangeInfo}>
                  Showing <strong>{startIndex.toLocaleString()}–{endIndex.toLocaleString()}</strong>
                </div>
              )}

              {/* Grid */}
              <div style={styles.grid}>
                {Array.from({ length: Math.max(0, endIndex - startIndex + 1) }, (_, i) => {
                  const idx = startIndex + i;
                  return (
                    <button
                      key={idx}
                      className="fcf-grid-btn"
                      style={styles.gridButton}
                      disabled={loading}
                      onClick={() => onJumpByIndex(idx)}
                      title={`Commit #${idx}`}
                    >
                      {idx.toLocaleString()}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Result / Error */}
          {(error || result) && (
            <div style={styles.resultBox}>
              {error && <div style={styles.error}>{error}</div>}
              {result && (
                <div style={styles.resultCard}>
                  <div style={styles.resultHeader}>
                    <span style={styles.resultLabel}>Selected commit</span>
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noreferrer"
                      className="fcf-link"
                      style={styles.resultLink}
                      title="Open commit in new tab"
                    >
                      <IconExternal size={12} />
                      Open
                    </a>
                  </div>
                  <div style={styles.resultMessage}>{result.message}</div>
                  <div style={styles.resultMeta}>
                    <code style={styles.shaBadge}>{result.sha.slice(0, 7)}</code>
                    <span>·</span>
                    <span>{result.author}</span>
                    <span>·</span>
                    <span>{formatDate(result.date)}</span>
                  </div>
                  <button type="button" onClick={onCopy} className="fcf-copy-btn" style={styles.copyBtn}>
                    {copied ? <IconCheck size={13} /> : <IconCopy size={13} />}
                    {copied ? 'Copied SHA' : 'Copy SHA'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Styles ---------- */
const transition = 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)';

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: 9999,
    width: 400,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
    letterSpacing: '-0.01em'
  },

  /* Launcher */
  launcher: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    border: '1px solid #1f6feb',
    background: '#1f6feb',
    color: '#fff',
    borderRadius: 999,
    padding: '10px 16px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(31,111,235,0.28), 0 1px 2px rgba(31,111,235,0.12)',
    transition
  },

  /* Panel */
  panel: {
    background: '#ffffff',
    color: '#1f2328',
    border: '1px solid #d1d9e0',
    borderRadius: 12,
    padding: 14,
    boxShadow: '0 8px 32px rgba(31,35,40,0.10), 0 1px 3px rgba(31,35,40,0.06)'
  },

  /* Header */
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    fontWeight: 700,
    color: '#1f2328'
  },
  headerActions: {
    display: 'flex',
    gap: 6
  },
  iconButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    border: '1px solid #d1d9e0',
    borderRadius: 6,
    background: '#fff',
    color: '#656d76',
    cursor: 'pointer',
    transition,
    padding: 0
  },

  /* Settings */
  settingsBox: {
    border: '1px solid #e4e8ed',
    borderRadius: 8,
    padding: '10px 12px',
    marginBottom: 12,
    background: '#f6f8fa'
  },
  settingsTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: '#656d76',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: 8
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
    color: '#1f2328',
    cursor: 'pointer',
    padding: '3px 0'
  },

  /* Tabs */
  tabList: {
    display: 'flex',
    gap: 4,
    marginBottom: 12,
    background: '#f6f8fa',
    borderRadius: 8,
    padding: 4
  },
  tab: {
    flex: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    border: 'none',
    background: 'transparent',
    color: '#656d76',
    borderRadius: 6,
    padding: '7px 0',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition
  },
  tabActive: {
    flex: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    border: '1px solid #d1d9e0',
    background: '#fff',
    color: '#1f2328',
    borderRadius: 6,
    padding: '7px 0',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(31,35,40,0.04)',
    transition
  },

  /* Sections */
  section: {
    marginBottom: 2
  },

  /* Primary Button */
  primaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    border: '1px solid #1f6feb',
    background: '#1f6feb',
    color: '#fff',
    borderRadius: 8,
    padding: '11px 12px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(31,111,235,0.18)',
    transition
  },

  /* Grid Header */
  gridHeader: {
    marginBottom: 10
  },
  gridTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#1f2328',
    marginBottom: 2
  },
  gridMeta: {
    fontSize: 11,
    color: '#8c959f',
    fontWeight: 500
  },

  /* Pager */
  pagerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10
  },
  pagerBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    border: '1px solid #d1d9e0',
    borderRadius: 6,
    background: '#fff',
    color: '#656d76',
    cursor: 'pointer',
    transition,
    padding: 0
  },
  pageInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flex: 1
  },
  pageInput: {
    border: '1px solid #d1d9e0',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    padding: '6px 8px',
    width: 56,
    textAlign: 'center',
    color: '#1f2328',
    outline: 'none',
    transition
  },
  pageOf: {
    fontSize: 12,
    color: '#8c959f',
    fontWeight: 500,
    whiteSpace: 'nowrap'
  },
  refreshBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    border: '1px solid #d1d9e0',
    borderRadius: 6,
    background: '#fff',
    color: '#656d76',
    cursor: 'pointer',
    transition,
    padding: 0
  },
  rangeInfo: {
    fontSize: 11,
    color: '#8c959f',
    marginBottom: 8,
    fontWeight: 500
  },

  /* Grid */
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(10, minmax(0, 1fr))',
    gap: 5,
    maxHeight: 210,
    overflowY: 'auto',
    paddingRight: 2
  },
  gridButton: {
    border: '1px solid #e4e8ed',
    background: '#f6f8fa',
    borderRadius: 5,
    fontSize: 10,
    fontWeight: 600,
    color: '#57606a',
    padding: '5px 0',
    cursor: 'pointer',
    transition
  },

  /* Result */
  resultBox: {
    marginTop: 12,
    borderTop: '1px solid #e4e8ed',
    paddingTop: 12
  },
  error: {
    color: '#cf222e',
    fontSize: 12,
    fontWeight: 500,
    background: '#ffebe9',
    borderRadius: 6,
    padding: '8px 10px',
    border: '1px solid #ffdcd7'
  },
  resultCard: {
    background: '#f6f8fa',
    borderRadius: 8,
    padding: '10px 12px',
    border: '1px solid #e4e8ed'
  },
  resultHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  resultLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: '#8c959f',
    textTransform: 'uppercase',
    letterSpacing: '0.04em'
  },
  resultLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 11,
    fontWeight: 600,
    color: '#0969da',
    textDecoration: 'none',
    transition
  },
  resultMessage: {
    fontSize: 13,
    fontWeight: 600,
    color: '#1f2328',
    lineHeight: 1.4,
    marginBottom: 6,
    wordBreak: 'break-word'
  },
  resultMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
    color: '#656d76',
    marginBottom: 10,
    flexWrap: 'wrap'
  },
  shaBadge: {
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    fontSize: 10,
    background: '#eaeef2',
    color: '#1f2328',
    borderRadius: 4,
    padding: '2px 5px',
    fontWeight: 600,
    letterSpacing: '0.02em'
  },
  copyBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    border: '1px solid #d1d9e0',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    background: '#fff',
    color: '#656d76',
    padding: '5px 10px',
    cursor: 'pointer',
    transition
  }
};

/* Hover / active / focus states via injected stylesheet */
const styleTagId = 'github-first-commit-finder-styles';
if (typeof document !== 'undefined' && !document.getElementById(styleTagId)) {
  const tag = document.createElement('style');
  tag.id = styleTagId;
  tag.textContent = `
    #github-first-commit-finder-root .fcf-btn-primary:hover {
      background: #0860ca !important;
      border-color: #0860ca !important;
      box-shadow: 0 4px 12px rgba(8,96,202,0.22) !important;
    }
    #github-first-commit-finder-root .fcf-btn-primary:active {
      transform: translateY(0.5px);
    }
    #github-first-commit-finder-root .fcf-icon-btn:hover {
      background: #f3f4f6 !important;
      color: #1f2328 !important;
      border-color: #c4cdd5 !important;
    }
    #github-first-commit-finder-root .fcf-tab:hover:not(.fcf-tab-active) {
      background: #eaeef2 !important;
      color: #1f2328 !important;
    }
    #github-first-commit-finder-root .fcf-grid-btn:hover {
      background: #ddf4ff !important;
      border-color: #54aeff !important;
      color: #0969da !important;
    }
    #github-first-commit-finder-root .fcf-grid-btn:active {
      transform: scale(0.96);
    }
    #github-first-commit-finder-root .fcf-copy-btn:hover {
      background: #f3f4f6 !important;
      border-color: #c4cdd5 !important;
      color: #1f2328 !important;
    }
    #github-first-commit-finder-root .fcf-link:hover {
      text-decoration: underline !important;
    }
    #github-first-commit-finder-root input:focus {
      border-color: #0969da !important;
      box-shadow: 0 0 0 3px rgba(9,105,218,0.15) !important;
    }
  `;
  document.head.appendChild(tag);
}

export default defineContentScript({
  matches: ['*://github.com/*'],
  main() {
    const repo = parseRepoFromUrl(new URL(window.location.href));
    if (!repo) return;

    const mount = document.createElement('div');
    mount.id = 'github-first-commit-finder-root';
    document.body.appendChild(mount);

    createRoot(mount).render(<App />);
  }
});
