# Skybits Legacy Deep Scanner

Chrome extension for inspecting and scanning the Skybits Legacy portal.

## Purpose

This project is a diagnostic/research scanner. It captures Skybits page structure, same-origin API traffic, discovered asset/load records, and relevant detail responses so the legacy portal's available data can be understood before building automation on top of it.

## Scope

- Scan the current Skybits page
- Observe same-origin `/api/` Fetch/XHR responses
- Discover and scan asset/load records
- Open relevant Skybits detail pages in temporary tabs when possible
- Export scan results as JSON and load data as CSV

Do not hard-code credentials or API keys into the extension.
