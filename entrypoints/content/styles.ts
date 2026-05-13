import type { CSSProperties } from 'react';

const transition = 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)';
const controlButton: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 28,
  height: 28,
  border: '1px solid #d1d9e0',
  borderRadius: 6,
  background: '#fff',
  color: '#656d76',
  cursor: 'pointer',
  transition,
  padding: 0
};

export const styles: Record<string, CSSProperties> = {
  container: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: 9999,
    width: 400,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
    letterSpacing: '-0.01em'
  },
  launcher: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    border: '1px solid #1f6feb',
    background: '#1f6feb',
    color: '#fff',
    borderRadius: 999,
    padding: '10px 16px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(31,111,235,0.28), 0 1px 2px rgba(31,111,235,0.12)',
    transition
  },
  panel: {
    background: '#ffffff',
    color: '#1f2328',
    border: '1px solid #d1d9e0',
    borderRadius: 12,
    padding: 14,
    boxShadow: '0 8px 32px rgba(31,35,40,0.10), 0 1px 3px rgba(31,35,40,0.06)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    fontWeight: 700,
    color: '#1f2328'
  },
  headerActions: {
    display: 'flex',
    gap: 6
  },
  iconButton: controlButton,
  settingsBox: {
    border: '1px solid #e4e8ed',
    borderRadius: 8,
    padding: '10px 12px',
    marginBottom: 12,
    background: '#f6f8fa'
  },
  settingsTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: '#656d76',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: 8
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
    color: '#1f2328',
    cursor: 'pointer',
    padding: '3px 0'
  },
  tabList: {
    display: 'flex',
    gap: 4,
    marginBottom: 12,
    background: '#f6f8fa',
    borderRadius: 8,
    padding: 4
  },
  tab: {
    flex: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    border: 'none',
    background: 'transparent',
    color: '#656d76',
    borderRadius: 6,
    padding: '7px 0',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition
  },
  tabActive: {
    flex: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    border: '1px solid #d1d9e0',
    background: '#fff',
    color: '#1f2328',
    borderRadius: 6,
    padding: '7px 0',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(31,35,40,0.04)',
    transition
  },
  section: {
    marginBottom: 2
  },
  primaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    border: '1px solid #1f6feb',
    background: '#1f6feb',
    color: '#fff',
    borderRadius: 8,
    padding: '11px 12px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(31,111,235,0.18)',
    transition
  },
  gridHeader: {
    marginBottom: 10
  },
  gridTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#1f2328',
    marginBottom: 2
  },
  gridMeta: {
    fontSize: 11,
    color: '#8c959f',
    fontWeight: 500
  },
  pagerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10
  },
  pagerBtn: controlButton,
  pageInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flex: 1
  },
  pageInput: {
    border: '1px solid #d1d9e0',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    padding: '6px 8px',
    width: 56,
    textAlign: 'center',
    color: '#1f2328',
    outline: 'none',
    transition
  },
  pageOf: {
    fontSize: 12,
    color: '#8c959f',
    fontWeight: 500,
    whiteSpace: 'nowrap'
  },
  refreshBtn: controlButton,
  rangeInfo: {
    fontSize: 11,
    color: '#8c959f',
    marginBottom: 8,
    fontWeight: 500
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(10, minmax(0, 1fr))',
    gap: 5,
    maxHeight: 210,
    overflowY: 'auto',
    paddingRight: 2
  },
  gridButton: {
    border: '1px solid #e4e8ed',
    background: '#f6f8fa',
    borderRadius: 5,
    fontSize: 10,
    fontWeight: 600,
    color: '#57606a',
    padding: '5px 0',
    cursor: 'pointer',
    transition
  },
  resultBox: {
    marginTop: 12,
    borderTop: '1px solid #e4e8ed',
    paddingTop: 12
  },
  error: {
    color: '#cf222e',
    fontSize: 12,
    fontWeight: 500,
    background: '#ffebe9',
    borderRadius: 6,
    padding: '8px 10px',
    border: '1px solid #ffdcd7'
  },
  resultCard: {
    background: '#f6f8fa',
    borderRadius: 8,
    padding: '10px 12px',
    border: '1px solid #e4e8ed'
  },
  resultHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  resultLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: '#8c959f',
    textTransform: 'uppercase',
    letterSpacing: '0.04em'
  },
  resultLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 11,
    fontWeight: 600,
    color: '#0969da',
    textDecoration: 'none',
    transition
  },
  resultMessage: {
    fontSize: 13,
    fontWeight: 600,
    color: '#1f2328',
    lineHeight: 1.4,
    marginBottom: 6,
    wordBreak: 'break-word'
  },
  resultMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
    color: '#656d76',
    marginBottom: 10,
    flexWrap: 'wrap'
  },
  shaBadge: {
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    fontSize: 10,
    background: '#eaeef2',
    color: '#1f2328',
    borderRadius: 4,
    padding: '2px 5px',
    fontWeight: 600,
    letterSpacing: '0.02em'
  },
  copyBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    border: '1px solid #d1d9e0',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    background: '#fff',
    color: '#656d76',
    padding: '5px 10px',
    cursor: 'pointer',
    transition
  }
};

const styleTagId = 'github-first-commit-finder-styles';

export function ensureContentStyles(): void {
  if (typeof document === 'undefined' || document.getElementById(styleTagId)) {
    return;
  }

  const tag = document.createElement('style');
  tag.id = styleTagId;
  tag.textContent = `
    #github-first-commit-finder-root .fcf-btn-primary:hover {
      background: #0860ca !important;
      border-color: #0860ca !important;
      box-shadow: 0 4px 12px rgba(8,96,202,0.22) !important;
    }
    #github-first-commit-finder-root .fcf-btn-primary:active {
      transform: translateY(0.5px);
    }
    #github-first-commit-finder-root .fcf-icon-btn:hover {
      background: #f3f4f6 !important;
      color: #1f2328 !important;
      border-color: #c4cdd5 !important;
    }
    #github-first-commit-finder-root .fcf-tab:hover:not(.fcf-tab-active) {
      background: #eaeef2 !important;
      color: #1f2328 !important;
    }
    #github-first-commit-finder-root .fcf-grid-btn:hover {
      background: #ddf4ff !important;
      border-color: #54aeff !important;
      color: #0969da !important;
    }
    #github-first-commit-finder-root .fcf-grid-btn:active {
      transform: scale(0.96);
    }
    #github-first-commit-finder-root .fcf-copy-btn:hover {
      background: #f3f4f6 !important;
      border-color: #c4cdd5 !important;
      color: #1f2328 !important;
    }
    #github-first-commit-finder-root .fcf-link:hover {
      text-decoration: underline !important;
    }
    #github-first-commit-finder-root input:focus {
      border-color: #0969da !important;
      box-shadow: 0 0 0 3px rgba(9,105,218,0.15) !important;
    }
  `;
  document.head.appendChild(tag);
}
