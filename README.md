# Skybits Legacy Deep Scanner

Chrome Manifest V3 extension for automated discovery and deep inspection on a logged-in legacy Skybits portal.

## v1.2.0 — Automatic Persistent Recorder
- **AUTO RECORDING is ON by default.**
- Automatically records confirmed Skybits pages as you open/navigate to them.
- Automatically records same-page `/api/` Fetch/XHR request and response metadata plus response bodies captured by the page bridge.
- Stores discovery records persistently in the extension's own **IndexedDB** database, so the user does not need to manage a database.
- Keeps up to 10,000 discovery records locally and trims the oldest records when the limit is exceeded.
- Adds **EXPORT DISCOVERY DB** for a complete JSON research dump and **CLEAR DB** for local cleanup.
- The recorder can be paused with **AUTO RECORDING: ON/OFF**.

## Existing deep-scan features
- Scan the complete current page: DOM text/HTML, links, scripts, forms, performance resources, local/session storage with sensitive keys redacted, IndexedDB database names, and API endpoint hints found inside same-origin application scripts.
- Observe `/api/` Fetch/XHR traffic in the page's MAIN world.
- Scan the complete asset/load inventory through the legacy Skybits API, including pagination, asset search records, and asset360 detail records.
- Open up to 50 discovered same-origin Skybits/asset/load/tracking/landmark pages in background tabs, verify that each is Skybits, scan them, and close the temporary tab.
- Export ordinary scan JSON and load CSV.

## Install / update
1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. If the extension is already installed, click **Reload** after pulling the latest repository files.
4. For a fresh install, choose **Load unpacked** and select the extension folder.
5. Open the logged-in legacy Skybits portal.
6. Leave **AUTO RECORDING: ON** and use Skybits normally.

## Where the data goes
The scanner code is stored in GitHub. **Discovery data is not automatically uploaded to GitHub.** Recorded pages/API traffic stay in the extension's local IndexedDB database in Chrome until you explicitly export or clear it.

## Scope
The recorder only persists data locally. The page/API inventory functions use the active Skybits origin, and the page-opening scanner only opens discovered same-origin candidates. Sensitive-looking local/session storage keys and password form values are redacted. Respect the portal's access rules and normal request limits.
