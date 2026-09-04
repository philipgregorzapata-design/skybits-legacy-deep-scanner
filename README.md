# Skybits Legacy Deep Scanner

Chrome Manifest V3 extension for deep, user-triggered discovery on a logged-in legacy Skybits portal.

## Features
- Scan the complete current page: DOM text/HTML, links, scripts, forms, performance resources, local/session storage with sensitive keys redacted, IndexedDB database names, and API endpoint hints found inside same-origin application scripts.
- Observe `/api/` Fetch/XHR traffic in the page's MAIN world and retain captured request/response metadata and response bodies in the current tab until scanned.
- Scan the complete asset/load inventory through the legacy Skybits API, including pagination, asset search records, and asset360 detail records.
- Open up to 50 discovered same-origin Skybits/asset/load/tracking/landmark pages in background tabs, verify that each is Skybits, scan them, and close the temporary tab.
- Export JSON and load CSV.

## Install
1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Choose **Load unpacked**.
4. Select this extension folder.
5. Open the logged-in legacy Skybits portal.
6. Click the extension and run **SCAN PAGE**, **SCAN ALL LOADS**, or **OPEN + SCAN SKYBITS TABS**.

## Scope
The scanner is user-triggered. It only calls the active Skybits origin for API inventory and only opens discovered pages on that same origin. It does not transmit scan results to a remote service. Sensitive-looking storage keys are redacted; password form values are redacted.

The extension is a discovery/audit tool for understanding the legacy portal before building automation. Respect the portal's access rules and normal request limits.
