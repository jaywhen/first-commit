import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { getGithubToken, setGithubToken } from '../../src/lib/storage';

function Popup() {
  const [token, setToken] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    void getGithubToken().then(setToken);
  }, []);

  const onSave = async () => {
    await setGithubToken(token);
    setStatus('Saved');
    window.setTimeout(() => setStatus(''), 1200);
  };

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', minWidth: 320, padding: 12 }}>
      <h1 style={{ fontSize: 16, margin: '0 0 8px' }}>First Commit Finder</h1>
      <p style={{ fontSize: 12, margin: '0 0 8px', color: '#57606a' }}>
        Open a GitHub repository page, then click “Find First Commit”.
      </p>
      <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>GitHub Token (optional)</label>
      <input
        type="password"
        value={token}
        onChange={(event) => setToken(event.target.value)}
        placeholder="ghp_..."
        style={{ width: '100%', boxSizing: 'border-box', marginBottom: 8 }}
      />
      <button onClick={onSave} style={{ padding: '6px 10px', cursor: 'pointer' }}>
        Save Token
      </button>
      {status && <span style={{ marginLeft: 8, color: '#1a7f37', fontSize: 12 }}>{status}</span>}
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<Popup />);
