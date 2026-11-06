# Sprint 84 — Browser Verification Record

## Scope

This sprint strengthens the repeatable browser smoke test to cover both desktop and narrow mobile viewports. It checks:

- Application startup and `StandOutCore.ready` in both viewports.
- Five bottom-navigation routes in both viewports.
- Welcome intro readiness/fallback and local HTTP errors.
- Service-worker registration state.
- Uncaught page errors and browser-console errors.
- Mobile viewport dimensions and horizontal-overflow telemetry.

The harness uses a fresh Playwright browser context and a temporary local HTTP server. It does not use a deployed site or the user's normal browser profile.

## Execution result in this build environment

**Not executed successfully.** The project environment has a Chromium binary, but the Playwright package is not installed. The attempted direct headless Chromium fallback did not return a DOM before the execution timeout, so it is not counted as a browser pass.

Do not interpret Node regression tests or static audits as proof that the application works in a real browser.

## Run on Windows

From the project root in Command Prompt or PowerShell:

```powershell
npm install --no-save playwright
npx playwright install chromium
node scripts/browser-smoke.mjs
```

Expected result: JSON output with `result: "PASSED"`, desktop and mobile navigation checks all active, and no uncaught page errors. Review warnings and the mobile `horizontalOverflow` telemetry; investigate any unexpected local asset failures.

## Automated checks executed for this sprint

- All Node regression suites: 19/19 passed.
- Architecture audit: passed.
- Security audit: passed, with CSP and third-party asset review warnings retained.
- Release audit: passed, with optional `welcome.mp4` and `Music/Complete.mp3` still missing.
- CSP readiness audit: passed (four HTML pages; zero inline scripts, inline event attributes, or embedded style blocks; 22 style attributes remain).

## Manual release workflow still required

Use a disposable browser profile and test data. Verify mission/goal/skill CRUD and persistence, marketplace purchase, custom-card lifecycle, Season reward claim-once behavior, backup export/import and invalid-restore rollback, reset, Monthly Drop first-day routing, welcome-media fallback, service-worker offline startup, keyboard/focus behavior, and desktop/mobile visual layout.

## Release status

**Not production-certified.** The browser harness has been expanded but not executed successfully in this environment. CSP is not enabled. Missing optional media, third-party asset review, remaining inline style attributes, and manual end-to-end workflow verification remain release considerations.
