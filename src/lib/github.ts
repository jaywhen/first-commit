export interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

export interface RepoInfo {
  owner: string;
  repo: string;
}

interface RequestOptions {
  token?: string;
}

const API_BASE = 'https://api.github.com';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface CacheEntry {
  expiresAt: number;
  result: CommitInfo;
}

const memoryCache = new Map<string, CacheEntry>();

function cacheKey(repo: RepoInfo, branch: string): string {
  return `${repo.owner}/${repo.repo}:${branch}`;
}

function parseLastPage(linkHeader: string | null): number | null {
  if (!linkHeader) return null;
  const lastMatch = linkHeader.match(/&page=(\d+)>;\s*rel="last"/);
  if (!lastMatch) return null;
  return Number(lastMatch[1]);
}

async function fetchJson<T>(url: string, options: RequestOptions = {}): Promise<{ data: T; headers: Headers }> {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github+json'
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
    if (response.status === 403 && rateLimitRemaining === '0') {
      throw new Error('GitHub API rate limit exceeded. Please add a token in extension popup settings.');
    }

    if (response.status === 404) {
      throw new Error('Repository or branch not found.');
    }

    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as T;
  return { data, headers: response.headers };
}

export function parseRepoFromUrl(url: URL): RepoInfo | null {
  const parts = url.pathname.split('/').filter(Boolean);
  if (parts.length < 2) return null;

  const [owner, repo] = parts;
  const reserved = new Set([
    'features',
    'topics',
    'collections',
    'trending',
    'marketplace',
    'settings',
    'orgs',
    'users',
    'notifications',
    'new',
    'login',
    'explore'
  ]);

  if (reserved.has(owner)) return null;
  if (repo.endsWith('.atom')) return null;

  return { owner, repo };
}

export async function getDefaultBranch(repo: RepoInfo, options: RequestOptions = {}): Promise<string> {
  const { data } = await fetchJson<{ default_branch: string }>(
    `${API_BASE}/repos/${repo.owner}/${repo.repo}`,
    options
  );
  return data.default_branch;
}

export async function findFirstCommit(repo: RepoInfo, branch: string, options: RequestOptions = {}): Promise<CommitInfo> {
  const key = cacheKey(repo, branch);
  const now = Date.now();
  const cached = memoryCache.get(key);

  if (cached && cached.expiresAt > now) {
    return cached.result;
  }

  const baseCommitsUrl = `${API_BASE}/repos/${repo.owner}/${repo.repo}/commits?sha=${encodeURIComponent(branch)}&per_page=1`;
  const latest = await fetchJson<any[]>(baseCommitsUrl, options);

  if (latest.data.length === 0) {
    throw new Error('No commits found on this branch.');
  }

  const lastPage = parseLastPage(latest.headers.get('link'));
  const targetUrl = lastPage ? `${baseCommitsUrl}&page=${lastPage}` : baseCommitsUrl;
  const oldest = await fetchJson<any[]>(targetUrl, options);
  const commit = oldest.data[0];

  const result: CommitInfo = {
    sha: commit.sha,
    message: commit.commit?.message?.split('\n')[0] ?? '(no message)',
    author: commit.commit?.author?.name ?? 'Unknown',
    date: commit.commit?.author?.date ?? '',
    url: commit.html_url
  };

  memoryCache.set(key, {
    expiresAt: now + CACHE_TTL_MS,
    result
  });

  return result;
}
