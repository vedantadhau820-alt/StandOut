# StandOut CSP — Report-Only Deployment Draft (Sprint 83)

## Status

**Report-only deployment configuration is prepared for Vercel in Sprint 90.** The candidate is sent as `Content-Security-Policy-Report-Only` by `vercel.json`; CSP enforcement is not enabled; this is not an enforcing `Content-Security-Policy`. A deployment must still be inspected on its actual origin before the policy can be considered validated.

## Current source inventory

- Inline `<script>` blocks: **0** across the four HTML pages.
- Inline HTML event-handler attributes: **0** across the four HTML pages.
- Embedded `<style>` blocks: **0** after extraction into same-origin CSS files.
- Inline `style` attributes: **0** across the four HTML pages after Sprint 85 externalization. Runtime JavaScript still mutates element styles through CSSOM; retain `style-src-attr 'unsafe-inline'` until those mutations are migrated and browser-verified.
- Third-party asset origins currently used by page resources: `cdnjs.cloudflare.com` (Font Awesome CSS/fonts), `fonts.googleapis.com` and `fonts.gstatic.com` (guide typography).
- Other external URLs in `index.html` are ordinary outbound navigation links, not page subresources; they do not need to be added to CSP source lists.
- User-created card artwork may use external HTTPS image URLs; `img-src https:` is retained in this initial draft until the feature's URL contract is narrowed.

## Candidate response header

Use only as a **Content-Security-Policy-Report-Only** response header. Sprint 90 adds this candidate to `vercel.json`; confirm the deployed asset inventory and observe violations before considering enforcement.

```text
Content-Security-Policy-Report-Only: default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; form-action 'self'; script-src 'self'; script-src-attr 'none'; style-src 'self' https://cdnjs.cloudflare.com https://fonts.googleapis.com; style-src-attr 'unsafe-inline'; font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; media-src 'self' blob:; connect-src 'self'; worker-src 'self'; manifest-src 'self'
```

### Why the policy is not stricter yet

- `style-src-attr 'unsafe-inline'` is retained for runtime JavaScript style mutations (for example progress widths, visibility toggles, and transitions). Static HTML style attributes are now zero; migrate and browser-test runtime style mutations before removing this directive.
- Font Awesome and Google Fonts are third-party dependencies. Self-host pinned assets before removing their origins from `style-src` and `font-src`.
- `img-src https:` is intentionally broad for user-configurable external card images. Narrow it only after reviewing all supported image URL sources and testing existing cards.
- No report collector is configured. Do not add a `report-uri`/`report-to` endpoint until an owned, privacy-reviewed endpoint exists.
- A policy delivered as a meta tag cannot enforce `frame-ancestors`; use an HTTP response header at deployment time.

## Rollout procedure

1. Deploy the Vercel configuration and confirm the production origin returns this header in **Report-Only** mode only.
2. Exercise startup, navigation, marketplace, custom cards, badges, season, timer/audio, welcome media, backup/restore, and offline reload on the deployed origin.
3. Inspect browser console CSP violation reports and Network failures; classify each by directive and source.
4. Fix app-owned violations. Decide whether to self-host third-party fonts/icons and whether external card images remain supported.
5. Repeat the complete workflow suite on desktop and mobile browsers.
6. Only then propose an enforcing policy. Keep a rollback path and verify service-worker update behavior.

## Hosting note

Sprint 90 adds a Vercel-specific response-header configuration. It is scoped to Vercel and should not be copied unchanged to another host. Confirm the actual response headers on the deployed Vercel origin.


## Sprint 85 update

All 22 active static `style` attributes in `index.html` were moved into external stylesheets. The two style attributes inside an HTML comment were already inactive and remain documentation only. The CSP draft deliberately retains `style-src-attr 'unsafe-inline'` because active JavaScript still writes presentation through element `.style` properties; removing it before browser verification could break progress bars, overlays, visibility toggles, and animations.


## Sprint 90 deployment status

The Vercel configuration now sends this candidate as `Content-Security-Policy-Report-Only`. This is intentionally non-blocking. The live deployment has not yet been inspected, so CSP observation and production certification remain pending.
