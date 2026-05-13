import {
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconCopy,
  IconExternal,
  IconGitCommit,
  IconGrid,
  IconMinimize,
  IconRefresh,
  IconSettings,
  IconSparkles,
  Spinner
} from './icons';
import { styles } from './styles';
import type { CommitResult, Mode, UiPrefs } from './types';
import { formatDate } from './utils';

type LauncherProps = {
  onOpen: () => void;
};

type PanelHeaderProps = {
  onToggleSettings: () => void;
  onMinimize: () => void;
};

type SettingsPanelProps = {
  prefs: UiPrefs;
  onToggleFeature: (key: keyof UiPrefs, visible: boolean) => void;
};

type ModeTabsProps = {
  prefs: UiPrefs;
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  onOpenIndexMode: () => void;
};

type FirstCommitSectionProps = {
  loading: boolean;
  onFindFirst: () => void;
};

type IndexGridSectionProps = {
  loading: boolean;
  branch: string;
  totalCommits: number;
  gridPage: number;
  pageInput: string;
  pageCount: number;
  startIndex: number;
  endIndex: number;
  onPageInputChange: (value: string) => void;
  onJumpToPage: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onRefresh: () => void;
  onJumpByIndex: (index: number) => void;
};

type ResultSectionProps = {
  error: string | null;
  result: CommitResult | null;
  copied: boolean;
  onCopy: () => void;
};

export function Launcher({ onOpen }: LauncherProps) {
  return (
    <button type="button" style={styles.launcher} onClick={onOpen} title="Open Commit Finder">
      <IconSparkles size={16} />
      <span>Commit Finder</span>
    </button>
  );
}

export function PanelHeader({ onToggleSettings, onMinimize }: PanelHeaderProps) {
  return (
    <div style={styles.header}>
      <div style={styles.headerTitle}>
        <IconGitCommit size={16} />
        <span>Commit Finder</span>
      </div>
      <div style={styles.headerActions}>
        <button
          type="button"
          className="fcf-icon-btn"
          style={styles.iconButton}
          title="Settings"
          onClick={onToggleSettings}
          aria-label="Settings"
        >
          <IconSettings size={14} />
        </button>
        <button
          type="button"
          className="fcf-icon-btn"
          style={styles.iconButton}
          title="Minimize"
          onClick={onMinimize}
          aria-label="Minimize"
        >
          <IconMinimize size={14} />
        </button>
      </div>
    </div>
  );
}

export function SettingsPanel({ prefs, onToggleFeature }: SettingsPanelProps) {
  return (
    <div style={styles.settingsBox}>
      <div style={styles.settingsTitle}>Feature Visibility</div>
      <label style={styles.checkboxRow}>
        <input
          type="checkbox"
          checked={prefs.showFirstCommit}
          onChange={(event) => onToggleFeature('showFirstCommit', event.target.checked)}
        />
        <span>Show First Commit</span>
      </label>
      <label style={styles.checkboxRow}>
        <input
          type="checkbox"
          checked={prefs.showIndexGrid}
          onChange={(event) => onToggleFeature('showIndexGrid', event.target.checked)}
        />
        <span>Show Index Grid</span>
      </label>
    </div>
  );
}

export function ModeTabs({ prefs, mode, onModeChange, onOpenIndexMode }: ModeTabsProps) {
  return (
    <div role="tablist" aria-label="Modes" style={styles.tabList}>
      {prefs.showFirstCommit && (
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'first'}
          className="fcf-tab"
          style={mode === 'first' ? styles.tabActive : styles.tab}
          onClick={() => onModeChange('first')}
        >
          <IconGitCommit size={13} />
          First Commit
        </button>
      )}
      {prefs.showIndexGrid && (
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'index'}
          className="fcf-tab"
          style={mode === 'index' ? styles.tabActive : styles.tab}
          onClick={() => {
            onModeChange('index');
            onOpenIndexMode();
          }}
        >
          <IconGrid size={13} />
          Index Grid
        </button>
      )}
    </div>
  );
}

export function FirstCommitSection({ loading, onFindFirst }: FirstCommitSectionProps) {
  return (
    <div style={styles.section}>
      <button
        type="button"
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
  );
}

export function IndexGridSection({
  loading,
  branch,
  totalCommits,
  gridPage,
  pageInput,
  pageCount,
  startIndex,
  endIndex,
  onPageInputChange,
  onJumpToPage,
  onPrevPage,
  onNextPage,
  onRefresh,
  onJumpByIndex
}: IndexGridSectionProps) {
  return (
    <div style={styles.section}>
      <div style={styles.gridHeader}>
        <div style={styles.gridTitle}>Oldest → Newest Commit Index</div>
        <div style={styles.gridMeta}>
          {totalCommits > 0 ? `${totalCommits.toLocaleString()} commits` : '— commits'}
          {branch ? ` · ${branch}` : ''}
        </div>
      </div>

      <div style={styles.pagerRow}>
        <button
          type="button"
          className="fcf-icon-btn"
          style={gridPage <= 1 ? { ...styles.pagerBtn, opacity: 0.45, cursor: 'not-allowed' } : styles.pagerBtn}
          disabled={loading || gridPage <= 1}
          onClick={onPrevPage}
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
            onChange={(event) => onPageInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                onJumpToPage();
              }
            }}
            style={styles.pageInput}
          />
          <span style={styles.pageOf}>/ {pageCount.toLocaleString()}</span>
        </div>
        <button
          type="button"
          className="fcf-icon-btn"
          style={gridPage >= pageCount ? { ...styles.pagerBtn, opacity: 0.45, cursor: 'not-allowed' } : styles.pagerBtn}
          disabled={loading || gridPage >= pageCount}
          onClick={onNextPage}
          title="Next 100"
        >
          <IconChevronRight size={14} />
        </button>
        <button
          type="button"
          className="fcf-icon-btn"
          style={loading ? { ...styles.refreshBtn, opacity: 0.65 } : styles.refreshBtn}
          disabled={loading}
          onClick={onRefresh}
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

      <div style={styles.grid}>
        {Array.from({ length: Math.max(0, endIndex - startIndex + 1) }, (_, indexOffset) => {
          const commitIndex = startIndex + indexOffset;

          return (
            <button
              key={commitIndex}
              type="button"
              className="fcf-grid-btn"
              style={styles.gridButton}
              disabled={loading}
              onClick={() => onJumpByIndex(commitIndex)}
              title={`Commit #${commitIndex}`}
            >
              {commitIndex.toLocaleString()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ResultSection({ error, result, copied, onCopy }: ResultSectionProps) {
  if (!error && !result) {
    return null;
  }

  return (
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
  );
}
