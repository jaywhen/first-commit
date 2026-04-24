# GitHub First Commit Finder

A React + WXT browser extension that helps users quickly find the earliest commit on a GitHub repository's default branch.

## Features

- Works on GitHub repository pages (`owner/repo`)
- One-click "Find First Commit" from an in-page widget
- Index Grid mode: shows commit indexes from oldest to newest, click index to jump
- Shows earliest commit SHA, author, date, summary, and direct link
- Copy SHA button
- Optional GitHub token in popup settings to avoid API rate-limit issues
- In-memory cache (24h) to avoid repeated lookups in the same session
- Chromium compatible (Chrome / Edge)

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run zip
```

## Load in Chrome/Edge

1. Build the extension.
2. Open `chrome://extensions` or `edge://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select `.output/chrome-mv3/`.
