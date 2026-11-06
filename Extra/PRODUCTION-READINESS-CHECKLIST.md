# Production Readiness Checklist

1. Run `node scripts/release-gate.mjs --output=release-gate.json` on Windows.
2. Install Playwright and Chromium using `BROWSER-TESTING.md`.
3. Run `node scripts/browser-smoke.mjs`; retain the complete output and fix reproducible failures.
4. Complete manual workflows on desktop and mobile using disposable data:
   - Startup and navigation.
   - Mission/task creation, completion, editing and deletion.
   - Marketplace purchase and persistence.
   - Custom-card create/edit/delete.
   - Season reward eligibility and claim.
   - Backup export, valid import and invalid-import rollback.
   - Reset behavior.
   - Welcome-media fallback and Monthly Drop routing.
   - Service-worker update, offline reload and recovery.
5. Run CSP Report-Only on the actual staging origin. Collect and classify violations before enabling enforcing CSP.
6. Review third-party scripts, stylesheets, fonts, media and remote requests.
7. Fix verified defects, rerun release gate and document GO/NO-GO.
