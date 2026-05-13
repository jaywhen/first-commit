import type { CommitInfo, RepoInfo } from '../../src/lib/github';

export const GRID_PAGE_SIZE = 100;
export const PREFS_KEY = 'first-commit-finder:prefs';

export type Mode = 'first' | 'index';

export type UiPrefs = {
  showFirstCommit: boolean;
  showIndexGrid: boolean;
};

export type CommitResult = CommitInfo & {
  branch: string;
};

export type AppProps = {
  repo: RepoInfo;
};

export const DEFAULT_PREFS: UiPrefs = {
  showFirstCommit: true,
  showIndexGrid: true
};
