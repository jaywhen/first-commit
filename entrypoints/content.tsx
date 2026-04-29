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
    window.setTimeout(() => setCopied(false), 1000);
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

  const indexButtons = [];
  for (let i = startIndex; i <= endIndex; i += 1) {
    indexButtons.push(
      <button key={i} style={styles.gridButton} disabled={loading} onClick={() => onJumpByIndex(i)}>
        {i}
      </button>
    );
  }

  return (
    <div style={styles.container}>
      {!panelOpen && (
        <button style={styles.launcher} onClick={() => setPanelOpen(true)}>
          Commit Finder
        </button>
      )}

      {panelOpen && (
        <div style={styles.panel}>
          <div style={styles.header}>
            <strong>Commit Finder</strong>
            <div style={styles.headerActions}>
              <button style={styles.iconButton} onClick={() => setShowSettings((prev) => !prev)}>
                ⚙
              </button>
              <button style={styles.iconButton} onClick={() => setPanelOpen(false)}>
                Hide
              </button>
            </div>
          </div>

          {showSettings && (
            <div style={styles.settingsBox}>
              <div style={styles.title}>Feature visibility</div>
              <label style={styles.checkboxLabel}>
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
                Show "First Commit"
              </label>
              <label style={styles.checkboxLabel}>
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
                Show "Index Grid"
              </label>
            </div>
          )}

          {availableModes.length > 1 && (
            <div role="tablist" aria-label="Modes" style={styles.modeSwitch}>
              {prefs.showFirstCommit && (
                <label style={mode === 'first' ? styles.activeRadioCard : styles.radioCard}>
                  <input
                    type="radio"
                    name="commit-finder-mode"
                    checked={mode === 'first'}
                    onChange={() => setMode('first')}
                    disabled={loading}
                    style={styles.radioInput}
                  />
                  First Commit
                </label>
              )}
              {prefs.showIndexGrid && (
                <label style={mode === 'index' ? styles.activeRadioCard : styles.radioCard}>
                  <input
                    type="radio"
                    name="commit-finder-mode"
                    checked={mode === 'index'}
                    onChange={() => {
                      setMode('index');
                      if (!totalCommits) {
                        void loadGridMeta();
                      }
                    }}
                    disabled={loading}
                    style={styles.radioInput}
                  />
                  Index Grid
                </label>
              )}
            </div>
          )}

          {prefs.showFirstCommit && mode === 'first' && (
            <button style={styles.primaryButton} onClick={onFindFirst} disabled={loading}>
              {loading ? 'Opening...' : 'Go to First Commit'}
            </button>
          )}

          {prefs.showIndexGrid && mode === 'index' && (
            <>
              <div style={styles.title}>Oldest → Newest Commit Index</div>
              <div style={styles.meta}>Total: {totalCommits || '-'} {branch ? `· Branch: ${branch}` : ''}</div>
              <div style={styles.actionsRow}>
                <button
                  style={styles.secondaryButton}
                  disabled={loading || gridPage <= 1}
                  onClick={() => setGridPage((prev) => Math.max(1, prev - 1))}
                >
                  Prev 100
                </button>
                <button
                  style={styles.secondaryButton}
                  disabled={loading || gridPage >= pageCount}
                  onClick={() => setGridPage((prev) => Math.min(pageCount, prev + 1))}
                >
                  Next 100
                </button>
                <button style={styles.secondaryButton} disabled={loading} onClick={() => void loadGridMeta()}>
                  Load / Refresh
                </button>
              </div>
              <div style={styles.actionsRow}>
                <input
                  type="text"
                  value={pageInput}
                  inputMode="numeric"
                  placeholder={`1-${pageCount}`}
                  onChange={(event) => setPageInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') jumpToPage();
                  }}
                  style={styles.pageInput}
                />
                <button style={styles.secondaryButton} disabled={loading} onClick={jumpToPage}>
                  Go to Page
                </button>
              </div>
              {totalCommits > 0 && <div style={styles.meta}>Showing {startIndex}-{endIndex}</div>}
              <div style={styles.grid}>{indexButtons}</div>
            </>
          )}

          {(error || result) && (
            <div style={styles.resultBox}>
              {error && <div style={styles.error}>{error}</div>}
              {result && (
                <>
                  <div style={styles.title}>Selected commit</div>
                  <div style={styles.message}>{result.message}</div>
                  <div style={styles.meta}>
                    {result.sha.slice(0, 7)} · {result.author} · {formatDate(result.date)}
                  </div>
                  <div style={styles.actionsRow}>
                    <a href={result.url} target="_blank" rel="noreferrer" style={styles.linkButton}>
                      Open Commit
                    </a>
                    <button type="button" onClick={onCopy} style={styles.secondaryButton}>
                      {copied ? 'Copied!' : 'Copy SHA'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    bottom: '16px',
    right: '16px',
    zIndex: 9999,
    width: 420,
    fontFamily: 'Inter, system-ui, sans-serif'
  },
  launcher: {
    border: '1px solid #1f6feb',
    background: '#1f6feb',
    color: 'white',
    borderRadius: 999,
    padding: '8px 14px',
    fontSize: 13,
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
  },
  panel: {
    background: 'white',
    color: '#24292f',
    border: '1px solid #d0d7de',
    borderRadius: 12,
    padding: 12,
    boxShadow: '0 6px 20px rgba(0,0,0,0.18)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  headerActions: {
    display: 'flex',
    gap: 6
  },
  iconButton: {
    border: '1px solid #d0d7de',
    borderRadius: 6,
    background: 'white',
    fontSize: 12,
    padding: '4px 8px',
    cursor: 'pointer'
  },
  settingsBox: {
    border: '1px solid #d8dee4',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
    background: '#f6f8fa'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
    marginTop: 6
  },
  modeSwitch: {
    display: 'flex',
    gap: 8,
    marginBottom: 8
  },
  radioCard: {
    border: '1px solid #d0d7de',
    background: 'white',
    color: '#24292f',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 13,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6
  },
  activeRadioCard: {
    border: '1px solid #1f6feb',
    background: '#eaf2ff',
    color: '#1f6feb',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 13,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6
  },
  radioInput: { margin: 0 },
  primaryButton: {
    border: '1px solid #1f6feb',
    background: '#1f6feb',
    color: 'white',
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: 14,
    cursor: 'pointer',
    width: '100%'
  },
  title: { fontWeight: 600, marginBottom: 6 },
  message: { fontSize: 14, marginBottom: 6 },
  meta: { fontSize: 12, color: '#57606a', marginBottom: 8 },
  actionsRow: { display: 'flex', gap: 8, marginBottom: 8 },
  linkButton: {
    background: '#0969da',
    color: 'white',
    borderRadius: 6,
    fontSize: 12,
    textDecoration: 'none',
    padding: '6px 8px'
  },
  secondaryButton: {
    border: '1px solid #d0d7de',
    borderRadius: 6,
    fontSize: 12,
    background: 'white',
    padding: '6px 8px',
    cursor: 'pointer'
  },
  pageInput: {
    border: '1px solid #d0d7de',
    borderRadius: 6,
    fontSize: 12,
    padding: '6px 8px',
    width: 90
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(10, minmax(0, 1fr))',
    gap: 6,
    maxHeight: 220,
    overflowY: 'auto'
  },
  gridButton: {
    border: '1px solid #d0d7de',
    background: '#f6f8fa',
    borderRadius: 6,
    fontSize: 11,
    padding: '5px 0',
    cursor: 'pointer'
  },
  resultBox: {
    marginTop: 8,
    borderTop: '1px solid #d8dee4',
    paddingTop: 8
  },
  error: { color: '#cf222e', fontSize: 13 }
};

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
