import { createRoot } from 'react-dom/client';
import { parseRepoFromUrl } from '../src/lib/github';
import { App } from './content/App';
import { ensureContentStyles } from './content/styles';

export default defineContentScript({
  matches: ['*://github.com/*'],
  main() {
    const repo = parseRepoFromUrl(new URL(window.location.href));
    if (!repo) return;

    ensureContentStyles();

    const mount = document.createElement('div');
    mount.id = 'github-first-commit-finder-root';
    document.body.appendChild(mount);

    createRoot(mount).render(<App repo={repo} />);
  }
});
