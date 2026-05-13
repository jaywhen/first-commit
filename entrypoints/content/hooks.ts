import { useEffect, useState } from 'react';
import {
  findCommitByOldestIndex,
  findFirstCommit,
  getCommitCount,
  getDefaultBranch,
  type RepoInfo
} from '../../src/lib/github';
import { getGithubToken } from '../../src/lib/storage';
import {
  DEFAULT_PREFS,
  GRID_PAGE_SIZE,
  PREFS_KEY,
  type CommitResult,
  type Mode,
  type UiPrefs
} from './types';
import { getErrorMessage } from './utils';

function readStoredPrefs(): UiPrefs {
  const raw = window.localStorage.getItem(PREFS_KEY);
  if (!raw) return DEFAULT_PREFS;

  try {
    const parsed = JSON.parse(raw) as Partial<UiPrefs>;
    return {
      showFirstCommit: parsed.showFirstCommit ?? true,
      showIndexGrid: parsed.showIndexGrid ?? true
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function getAvailableModes(prefs: UiPrefs): Mode[] {
  const modes: Mode[] = [];

  if (prefs.showFirstCommit) {
    modes.push('first');
  }

  if (prefs.showIndexGrid) {
    modes.push('index');
  }

  return modes;
}

export function useUiPrefs() {
  const [prefs, setPrefs] = useState<UiPrefs>(DEFAULT_PREFS);

  useEffect(() => {
    setPrefs(readStoredPrefs());
  }, []);

  useEffect(() => {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }, [prefs]);

  const setFeatureVisible = (key: keyof UiPrefs, visible: boolean) => {
    setPrefs((prev) => {
      if (!visible) {
        if (key === 'showFirstCommit' && !prev.showIndexGrid) {
          return { showFirstCommit: false, showIndexGrid: true };
        }

        if (key === 'showIndexGrid' && !prev.showFirstCommit) {
          return { showFirstCommit: true, showIndexGrid: false };
        }
      }

      return { ...prev, [key]: visible };
    });
  };

  return { prefs, setFeatureVisible };
}

export function useCommitFinder(repo: RepoInfo) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [branch, setBranch] = useState('');
  const [totalCommits, setTotalCommits] = useState(0);
  const [gridPage, setGridPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [result, setResult] = useState<CommitResult | null>(null);

  useEffect(() => {
    setPageInput(String(gridPage));
  }, [gridPage]);

  const ensureBranch = async (token: string): Promise<string> => {
    if (branch) return branch;

    const resolved = await getDefaultBranch(repo, { token });
    setBranch(resolved);
    return resolved;
  };

  const withActiveBranch = async <T,>(task: (context: { token: string; branch: string }) => Promise<T>): Promise<T> => {
    const token = await getGithubToken();
    const activeBranch = await ensureBranch(token);
    return task({ token, branch: activeBranch });
  };

  const runRequest = async (task: () => Promise<void>) => {
    setLoading(true);
    setError(null);

    try {
      await task();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  const findFirst = async () => {
    await runRequest(async () => {
      await withActiveBranch(async ({ token, branch: activeBranch }) => {
        const firstCommit = await findFirstCommit(repo, activeBranch, { token });
        setResult({ ...firstCommit, branch: activeBranch });
        window.open(firstCommit.url, '_blank', 'noopener,noreferrer');
      });
    });
  };

  const loadGridMeta = async () => {
    await runRequest(async () => {
      await withActiveBranch(async ({ token, branch: activeBranch }) => {
        const total = await getCommitCount(repo, activeBranch, { token });
        setTotalCommits(total);
        setGridPage(1);
        setPageInput('1');
      });
    });
  };

  const jumpByIndex = async (oldestIndex: number) => {
    await runRequest(async () => {
      await withActiveBranch(async ({ token, branch: activeBranch }) => {
        const { total, commit } = await findCommitByOldestIndex(repo, activeBranch, oldestIndex, { token });
        setTotalCommits(total);
        setResult({ ...commit, branch: activeBranch });
        window.open(commit.url, '_blank', 'noopener,noreferrer');
      });
    });
  };

  const copyResultSha = async () => {
    if (!result) return;

    await navigator.clipboard.writeText(result.sha);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

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

  return {
    loading,
    error,
    copied,
    branch,
    totalCommits,
    gridPage,
    pageInput,
    result,
    pageCount,
    startIndex,
    endIndex,
    setGridPage,
    setPageInput,
    findFirst,
    loadGridMeta,
    jumpByIndex,
    copyResultSha,
    jumpToPage
  };
}
