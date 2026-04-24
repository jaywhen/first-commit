import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { findFirstCommit, getDefaultBranch, parseRepoFromUrl, type CommitInfo } from '../src/lib/github';
import { getGithubToken } from '../src/lib/storage';

function formatDate(iso: string): string {
  if (!iso) return 'Unknown date';
  return new Date(iso).toLocaleString();
}

function App() {
  const repo = useMemo(() => parseRepoFromUrl(new URL(window.location.href)), []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<(CommitInfo & { branch: string }) | null>(null);

  if (!repo) return null;

  const onFind = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getGithubToken();
      const branch = await getDefaultBranch(repo, { token });
      const firstCommit = await findFirstCommit(repo, branch, { token });
      setResult({ ...firstCommit, branch });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
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

  return (
    <div style={styles.container}>
      <button style={styles.button} onClick={onFind} disabled={loading}>
        {loading ? 'Searching...' : 'Find First Commit'}
      </button>
      {(error || result) && (
        <div style={styles.panel}>
          {error && <div style={styles.error}>{error}</div>}
          {result && (
            <>
              <div style={styles.title}>Earliest commit on {result.branch}</div>
              <div style={styles.message}>{result.message}</div>
              <div style={styles.meta}>
                {result.sha.slice(0, 7)} · {result.author} · {formatDate(result.date)}
              </div>
              <div style={styles.actions}>
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
    fontFamily: 'Inter, system-ui, sans-serif'
  },
  button: {
    border: '1px solid #d0d7de',
    background: '#2f81f7',
    color: 'white',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 14,
    cursor: 'pointer',
    boxShadow: '0 3px 10px rgba(0,0,0,0.15)'
  },
  panel: {
    marginTop: 8,
    maxWidth: 380,
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
  actions: { display: 'flex', gap: 8 },
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
