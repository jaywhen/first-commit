import React, { useMemo, useState } from 'react';
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

type Mode = 'first' | 'index';

function formatDate(iso: string): string {
  if (!iso) return 'Unknown date';
  return new Date(iso).toLocaleString();
}

function App() {
  const repo = useMemo(() => parseRepoFromUrl(new URL(window.location.href)), []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<Mode>('first');
  const [branch, setBranch] = useState<string>('');
  const [totalCommits, setTotalCommits] = useState<number>(0);
  const [gridPage, setGridPage] = useState(1);
  const [result, setResult] = useState<(CommitInfo & { branch: string }) | null>(null);

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

  const pageCount = Math.max(1, Math.ceil(totalCommits / GRID_PAGE_SIZE));
  const startIndex = (gridPage - 1) * GRID_PAGE_SIZE + 1;
  const endIndex = Math.min(totalCommits, gridPage * GRID_PAGE_SIZE);

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
      <div style={styles.modeSwitch}>
        <button
          style={mode === 'first' ? styles.activeTab : styles.tab}
          onClick={() => setMode('first')}
          disabled={loading}
        >
          First Commit
        </button>
        <button
          style={mode === 'index' ? styles.activeTab : styles.tab}
          onClick={() => {
            setMode('index');
            if (!totalCommits) {
              void loadGridMeta();
            }
          }}
          disabled={loading}
        >
          Index Grid
        </button>
      </div>

      {mode === 'first' ? (
        <button style={styles.primaryButton} onClick={onFindFirst} disabled={loading}>
          {loading ? 'Searching...' : 'Find First Commit'}
        </button>
      ) : (
        <div style={styles.panel}>
          <div style={styles.title}>Commit Index (Oldest → Newest)</div>
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
              Refresh
            </button>
          </div>
          {totalCommits > 0 && <div style={styles.meta}>Showing {startIndex}-{endIndex}</div>}
          <div style={styles.grid}>{indexButtons}</div>
        </div>
      )}

      {(error || result) && (
        <div style={styles.panel}>
          {error && <div style={styles.error}>{error}</div>}
          {result && (
            <>
              <div style={styles.title}>Selected commit on {result.branch}</div>
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
  modeSwitch: {
    display: 'flex',
    gap: 8,
    marginBottom: 8
  },
  tab: {
    border: '1px solid #d0d7de',
    background: 'white',
    color: '#24292f',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 13,
    cursor: 'pointer'
  },
  activeTab: {
    border: '1px solid #1f6feb',
    background: '#1f6feb',
    color: 'white',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 13,
    cursor: 'pointer'
  },
  primaryButton: {
    border: '1px solid #1f6feb',
    background: '#1f6feb',
    color: 'white',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 14,
    cursor: 'pointer'
  },
  panel: {
    marginTop: 8,
    background: 'white',
    color: '#24292f',
    border: '1px solid #d0d7de',
    borderRadius: 10,
    padding: 12,
    boxShadow: '0 6px 20px rgba(0,0,0,0.18)'
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
