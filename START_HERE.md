# Cloud Trust — complete project

Version 2.2.0

This package contains the combined working demo, all four product pillars, the in-product implementation guide, source files, tests, and supporting documentation.

## Start the demo

1. Extract this ZIP.
2. Open a terminal in the extracted `cloud-trust` folder.
3. With Python 3 installed, run:

```sh
python3 -m http.server 8080 --bind 127.0.0.1 --directory dist
```

On Windows, use this command if Python is available through the Python launcher:

```powershell
py -3 -m http.server 8080 --bind 127.0.0.1 --directory dist
```

4. Open **http://localhost:8080** in a modern browser.
5. Choose **Run guided demo** for the complete seven-step story. Choose **Implementation guide** for strategy, playbooks, tools, architecture, and the delivery plan.

Stop the server with Ctrl+C. The demo has no third-party runtime dependencies or build step. Serve the `dist` folder over HTTP; opening `index.html` directly is not supported for JavaScript modules.

## What is included

- `README.md`: product overview, demonstration scenarios, engineering handoff, and limitations.
- `dist/`: the complete runnable static application, including all source modules and styles.
- `dist/cloud-trust-implementation.md`: the complete implementation guide, tool examples, and official documentation links.
- `tests/`: 30 checks covering access, assurance, governance, exceptions, signal freshness, lifecycle, and package integrity.
- `scripts/export-guide.mjs`: rebuilds the downloadable guide after editing its content.
- `scripts/build-manifest.mjs`: rebuilds `FILE_MANIFEST.json` after changing any packaged file.
- `package.json`: project metadata and developer commands.
- `FILE_MANIFEST.json`: file inventory and SHA-256 checksums.

## Developer commands

With Node.js 22 or later:

```sh
npm test
npm run check
npm run export-guide
npm run manifest
```

No package installation is required. Edit `dist/implementation-data.mjs` for guide content, then regenerate the guide using `npm run export-guide`. Run `npm run manifest` after changing any packaged file so the checksums stay current.

## Hosting elsewhere

Publish the contents of `dist/` on any static HTTP host that serves `.mjs` files as JavaScript. Navigation uses URL hashes, so no application-route rewrite is required. This portable export is independent of the existing hosted demo.

## Demo scope

All people, resources, findings, approvals, sessions, and evidence records are synthetic. State lasts for the current page and resets on reload. No cloud accounts or external security tools are connected. Example integrations describe the proposed production implementation.
