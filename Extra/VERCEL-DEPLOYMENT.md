# StandOut — Vercel Deployment Guide (Sprint 90)

## Deployment model

StandOut is currently a static client-side PWA. This repository has no package manifest, build command, server API, or required server-side environment variables. Deploy the project as a static site; do not select a framework build preset or invent a build step.

## Deploy with the Vercel dashboard

1. Put the contents of `Stand-Out-main` at the root of a Git repository (so `index.html`, `vercel.json`, `manifest.json`, and `service-worker.js` are at repository root).
2. Push the repository to GitHub, GitLab, or Bitbucket.
3. In Vercel, choose **Add New → Project** and import that repository.
4. If the project files are inside a subfolder, set **Root Directory** to that folder. Otherwise use `./`.
5. Select **Other** as the Framework Preset. Leave Build Command and Install Command empty. Set Output Directory to `.` if Vercel requires an explicit output directory.
6. Deploy. No environment variables are required by the current static app.

## Configuration included

`vercel.json` adds baseline security headers, the existing candidate CSP as **Content-Security-Policy-Report-Only** (not enforcing), and revalidation-oriented cache headers for `service-worker.js` and `manifest.json`.

The CSP is deliberately report-only. It may report violations caused by runtime style mutations, Font Awesome, Google Fonts, user-supplied card artwork, or other runtime behavior. Report-only does not block those resources. Do not change it to `Content-Security-Policy` until violations have been reviewed and the full deployed workflow has been re-tested.

## Post-deploy verification

Use the actual Vercel deployment URL, not only localhost:

1. Open DevTools → Network. Reload and confirm `index.html`, CSS, JavaScript, `manifest.json`, and `service-worker.js` return successfully.
2. Inspect the `service-worker.js` response headers and confirm the configured cache policy is present. In Application → Service Workers, confirm an active registration whose scope matches the deployed origin.
3. In DevTools → Network, inspect response headers for the baseline security headers and `Content-Security-Policy-Report-Only`.
4. Inspect Console for CSP violation reports. Record directive, blocked URI, and affected workflow. Since this is report-only, violations should not block the app.
5. Repeat desktop and mobile navigation, mission CRUD, goal updates, marketplace/card ownership persistence, backup/restore, Season and Monthly Drop checks when eligible, and offline reload.
6. Test a fresh browser profile once online before testing offline. Offline reload is expected only after the app shell has been cached successfully.
7. Test the Vercel deployment's service-worker update by deploying a harmless new version, reopening the app, and confirming the new worker activates without stale-shell breakage.

## Important limitations / release status

- A passing localhost browser test does not prove the Vercel deployment is correct. Vercel response headers, origin scope, asset paths, and service-worker caching must be checked on the deployed URL.
- CSP violations are not automatically collected by this configuration. It does not add a report collector or transmit reports to a third party; inspect the browser console during the report-only observation period.
- HSTS is intentionally not configured here. Add it only after confirming the production domain and all relevant subdomains are HTTPS-only.
- No redirect or SPA rewrite is configured because the current app uses explicit HTML entry points (`index.html`, `documentation.html`, `standout-guide.html`, and `drop-info.html`).
- Do not deploy from a parent directory that leaves `index.html` nested below Vercel's configured root.

## Rollback

If the deployed app has a regression, revert to the previous Vercel deployment. If a header causes a problem, revert `vercel.json` and redeploy. The CSP is report-only, so it should not itself block application functionality.
