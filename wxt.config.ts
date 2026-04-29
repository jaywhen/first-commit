import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'GitHub First Commit Finder',
    description: 'Find the earliest commit in a GitHub repository quickly.',
    permissions: ['storage'],
    host_permissions: ['https://api.github.com/*', 'https://github.com/*']
  }
});
