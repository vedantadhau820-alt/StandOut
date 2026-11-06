# StandOut Browser Verification

The project has fast Node-based regression tests, but those tests do not replace running the app in an actual browser. Use the browser smoke test before each release candidate.

## One-time setup (Windows PowerShell)

From the project root:

```powershell
npm.cmd install --no-save playwright
npx.cmd playwright install chromium
```

If PowerShell blocks npm scripts, run the commands from Command Prompt (`cmd.exe`) instead.

## Run browser smoke test

```powershell
node scripts/browser-smoke.mjs
```

The script starts a temporary local HTTP server, launches fresh desktop and mobile Chromium contexts, loads `index.html`, checks that the modular core becomes ready, waits for the welcome Ready button, dismisses the full-screen welcome intro through its normal UI, then exercises all five bottom-navigation controls. It also checks the welcome-media fallback, service-worker registration, local HTTP/runtime errors, and mobile horizontal-overflow telemetry. The test fixture marks the current Monthly Drop as already seen so the optional first-of-month route cannot divert the navigation smoke test. It does not connect to or modify a deployed site and does not reuse the user's normal browser profile.

The optional `welcome.mp4` and `Music/Complete.mp3` files are currently absent. The welcome video 404 is therefore reported as a warning; the Ready-button fallback is still expected to work. External CDN failures should be investigated separately from local application asset failures.

## Manual release checks still required

Use a disposable browser profile or test account. Do not test destructive flows against real user data.

- [ ] Create, complete, edit, and delete a mission; reload and verify persistence.
- [ ] Create/edit/delete a goal and a skill; verify navigation and persistence.
- [ ] Purchase a marketplace card using test points; reload and verify ownership.
- [ ] Create/edit/delete a custom card; verify it remains separate from built-in catalogue data.
- [ ] Claim a Season reward in a test state and verify it cannot be claimed twice.
- [ ] Export a backup, restore it into a disposable profile, and verify invalid backup rejection leaves existing data unchanged.
- [ ] Verify reset only after exporting a backup and confirming the disposable profile is in use.
- [ ] On the first day of a month, verify Monthly Drop opens once and the seen-state prevents repeated display.
- [ ] Verify welcome video readiness, media-error fallback, click-to-skip, and Escape behavior.
- [ ] Reload with the service worker active, then test offline startup and document any expected network-dependent features.
- [ ] Check desktop and mobile layouts, browser console, network panel, keyboard navigation, and focus visibility.

## Release blockers / acceptance criteria

A browser smoke test passing is necessary but not sufficient for production release. The release owner must also resolve or explicitly accept missing media, review third-party assets, plan CSP migration after inline handlers are removed, and complete the manual workflow checklist above.
