import { useEffect, useState } from 'react';
import {
  FirstCommitSection,
  IndexGridSection,
  Launcher,
  ModeTabs,
  PanelHeader,
  ResultSection,
  SettingsPanel
} from './components';
import { getAvailableModes, useCommitFinder, useUiPrefs } from './hooks';
import { styles } from './styles';
import type { AppProps, Mode } from './types';

export function App({ repo }: AppProps) {
  const [panelOpen, setPanelOpen] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [mode, setMode] = useState<Mode>('first');
  const { prefs, setFeatureVisible } = useUiPrefs();
  const availableModes = getAvailableModes(prefs);
  const {
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
  } = useCommitFinder(repo);

  useEffect(() => {
    if (mode === 'first' && !prefs.showFirstCommit && prefs.showIndexGrid) {
      setMode('index');
    }

    if (mode === 'index' && !prefs.showIndexGrid && prefs.showFirstCommit) {
      setMode('first');
    }
  }, [mode, prefs]);

  return (
    <div style={styles.container}>
      {!panelOpen && <Launcher onOpen={() => setPanelOpen(true)} />}

      {panelOpen && (
        <div style={styles.panel}>
          <PanelHeader
            onToggleSettings={() => setShowSettings((prev) => !prev)}
            onMinimize={() => setPanelOpen(false)}
          />

          {showSettings && <SettingsPanel prefs={prefs} onToggleFeature={setFeatureVisible} />}

          {availableModes.length > 1 && (
            <ModeTabs
              prefs={prefs}
              mode={mode}
              onModeChange={setMode}
              onOpenIndexMode={() => {
                if (!totalCommits) {
                  void loadGridMeta();
                }
              }}
            />
          )}

          {prefs.showFirstCommit && mode === 'first' && (
            <FirstCommitSection
              loading={loading}
              onFindFirst={() => {
                void findFirst();
              }}
            />
          )}

          {prefs.showIndexGrid && mode === 'index' && (
            <IndexGridSection
              loading={loading}
              branch={branch}
              totalCommits={totalCommits}
              gridPage={gridPage}
              pageInput={pageInput}
              pageCount={pageCount}
              startIndex={startIndex}
              endIndex={endIndex}
              onPageInputChange={setPageInput}
              onJumpToPage={jumpToPage}
              onPrevPage={() => setGridPage((prev) => Math.max(1, prev - 1))}
              onNextPage={() => setGridPage((prev) => Math.min(pageCount, prev + 1))}
              onRefresh={() => {
                void loadGridMeta();
              }}
              onJumpByIndex={(index) => {
                void jumpByIndex(index);
              }}
            />
          )}

          <ResultSection
            error={error}
            result={result}
            copied={copied}
            onCopy={() => {
              void copyResultSha();
            }}
          />
        </div>
      )}
    </div>
  );
}
