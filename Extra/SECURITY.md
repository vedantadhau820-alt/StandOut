# StandOut Security Notes

## Security model

StandOut is a browser-only application. It has no trusted server and stores user data in browser-controlled LocalStorage, IndexedDB, and Cache Storage. Data in those stores can be inspected or modified by the device owner or by code executing in the same origin. Improvement Points, achievements, ownership records, and other client-side values must therefore be treated as editable, not tamper-proof.

## Security principles

- Treat all user-entered text, imported backup content, and browser-stored values as untrusted.
- Render plain text with `textContent`; do not interpolate user data into HTML strings.
- Validate imported data before changing application state.
- Do not store passwords, API keys, or other secrets in browser storage.
- Keep third-party scripts and dependencies to the minimum required.
- Preserve user data during security fixes and migrations.

## Sprint 47 — initial security baseline

### Fixed

- Mission creation no longer interpolates the mission name into an HTML template. It creates the static structure and assigns the name with `textContent`.
- Mission editing now assigns the updated name with `textContent` instead of `innerHTML`.

These changes prevent newly entered mission names from being interpreted as HTML or executable markup.

### Known risks requiring follow-up

| Priority | Area | Finding | Planned treatment |
|---|---|---|---|
| Critical | HTML-backed persistence | `missions`, `skills`, and `goals` are restored from LocalStorage using `innerHTML`. Stored HTML must be treated as untrusted. | Replace raw HTML hydration with validated/sanitized restoration while preserving existing records and interactions. |
| High | User-generated content | Audit remaining dynamic HTML templates in goals, custom cards, achievements, badges, and reports. | Use text nodes or context-appropriate escaping; validate URL-bearing attributes. |
| High | Inline JavaScript | Inline event handlers and an inline startup script prevent deployment of a strict CSP without further migration. | Migrate inline handlers/scripts to external modules, then introduce a restrictive CSP. |
| Medium | Third-party assets | Font Awesome and Google Fonts are loaded from external providers; availability and supply-chain exposure depend on those providers. | Consider self-hosting pinned assets or applying integrity controls where supported. |
| Medium | Browser storage | LocalStorage and IndexedDB can be edited by users and same-origin scripts. | Validate data at read boundaries; never treat local values as security-authoritative. |

## Important limitation

A client-only application cannot protect local data from its device owner or make locally stored rewards and balances tamper-proof. Security work can reduce injection, unsafe import, and accidental data-corruption risks, but cannot guarantee zero vulnerabilities or authoritative anti-cheat behavior without a trusted server.

## Security change policy

- Keep changes narrow and backward-compatible.
- Do not clear, rename, or silently rewrite existing storage keys.
- Do not add a CSP that breaks existing inline handlers; migrate those handlers first.
- Record unresolved risks rather than claiming they are fixed.


## Sprint 48 — safe restoration of browser-stored markup

### Fixed

- Mission, skill, and legacy goal HTML snapshots are parsed while detached and
  rebuilt using a restricted element and attribute allowlist before entering
  the live document.
- Scriptable elements, SVG/MathML, inline event attributes, style attributes,
  IDs, and URL-bearing attributes are discarded during restoration.
- Mission completion, skill deletion, and legacy goal actions are rebound with
  JavaScript event listeners after safe restoration.
- New mission and skill controls no longer depend on inline event attributes.
- Goal action handlers no longer interpolate stored goal IDs into inline
  JavaScript. Edit-goal form values are assigned through DOM properties, and
  goal priority classes are restricted to the supported values.

### Compatibility notes

- Existing LocalStorage keys and snapshot formats are unchanged.
- Existing text, feature classes, and supported data attributes are retained.
- Inline styles from old snapshots are intentionally discarded. Skill progress
  presentation is recalculated from saved XP during initialization.
- No LocalStorage or IndexedDB records are cleared or rewritten by this change.

### Remaining risks

- Other dynamic HTML templates outside this restoration path still need a
  context-by-context audit, particularly user-controlled text and attributes.
- Inline handlers remain elsewhere in the application, so a strict CSP is not
  yet safe to enable.
- Browser-local records remain editable by the device owner.


## Sprint 49 — dynamic DOM sink hardening

### Fixed

- Achievement popup titles and descriptions are inserted with `textContent`; stored or otherwise untrusted achievement text is no longer parsed as HTML.
- The minted-card reveal is assembled with DOM element creation and event listeners rather than an interpolated HTML template or inline click handler.
- Minted-card title, quote, and image alternative text are assigned as text properties. Image paths are accepted only for the app's supported relative image paths or HTTP(S) URLs with no markup/whitespace characters.
- The security audit now guards these two rendering paths against regression.

### Compatibility notes

- Existing achievement and card data formats are unchanged.
- No LocalStorage or IndexedDB data is cleared or rewritten.
- Existing visual class names and reveal interactions are retained.

### Remaining risks

- Other active dynamic HTML templates still require context-specific review, including custom-card catalogue rendering, badges, goals, and reports.
- This sprint does not migrate all inline handlers or enable a strict Content Security Policy.


## Sprint 50 — monthly resolution DOM safety

### Fixed

- The reviewed monthly-resolution message is now assembled with `createElement`, `textContent`, and `replaceChildren` rather than an `innerHTML` template.
- The review label and message retain their existing element types and CSS class, preserving the reviewed-state presentation.
- The security audit now checks this rendering path for regressions.

### Compatibility notes

- Monthly-resolution storage keys, values, and review behavior are unchanged.
- No LocalStorage or IndexedDB data is cleared, migrated, or rewritten.

### Remaining risks

- Other active dynamic HTML templates and inline handlers remain and require separate, context-specific migration before a strict Content Security Policy can be enforced.


## Sprint 51 — Achievement rendering

Achievement tile titles, descriptions, and unlock dates are rendered with `textContent`; icon nodes are created explicitly. The expand/collapse control is also assembled with DOM APIs. This prevents achievement metadata from being interpreted as markup. Existing achievement data and storage formats are unchanged.


## Sprint 52 — Navigation event handlers

Bottom navigation and the context-sensitive global Add button are wired through `addEventListener` in the navigation feature. Their inline `onclick` attributes and the runtime-generated inline handler have been removed. This is a targeted migration; other inline handlers remain and a strict Content Security Policy must not yet be enforced.

## Sprint 53 — dynamic modal event handling

- Mission, skill, edit-skill, edit-mission, and goal modal actions use delegated event handling rather than inline `onclick` attributes.
- Existing mission/skill names and linked-skill option labels are assigned through DOM properties (`value` and `textContent`) rather than interpolated into HTML templates.
- Existing storage formats and records remain unchanged.

## Sprint 54 — final security release review

### Release review result

The final source-level security and architecture audits pass, but the application is **not ready for a strict Content Security Policy** and this review does not certify the app as vulnerability-free.

The read-only `scripts/security-release-review.mjs` inventories the active script graph and reports inline event attributes, inline script blocks, `innerHTML` assignments, inline event-property assignments, and dynamic HTML APIs. Its counts are review leads, not vulnerability counts: each sink must be assessed in context, including whether its content is constant, escaped, or user-controlled.

### Remaining work / release limitations

- `index.html` still contains inline event-handler attributes and an inline startup script. Migrate these before enforcing a restrictive CSP.
- Active scripts still contain `innerHTML` assignments and inline event-property assignments. Prioritize user-controlled or imported values in custom cards, goals, badges, reports, reset UI, and marketplace rendering. Do not mass-replace sinks without reviewing their markup and event behavior.
- Third-party font/icon assets still need a dependency and supply-chain review; consider self-hosting pinned assets and integrity controls where appropriate.
- The release audit reports missing `welcome.mp4` and `Music/Complete.mp3` assets in the supplied project. These were not fabricated or silently replaced in this security phase.
- Browser interaction, backup/restore round-trip, and penetration testing remain manual release gates; source-level checks alone cannot establish runtime security.
- Local browser data remains editable by the device owner. Client-only balances, achievements, and card ownership are not tamper-proof.

### Final status

- Security, architecture, and release audit scripts pass at source level.
- No strict CSP was added because inline handlers/scripts remain.
- No LocalStorage or IndexedDB keys or formats were changed by this review.
- No user data was cleared or rewritten.
- Further work is recommended before describing the application as production-secure. Continue with a feature-by-feature migration and browser testing rather than treating Sprint 54 as proof that all security debt is resolved.

## Sprint 55 — goal rendering DOM safety

### Fixed

- Goal cards are now assembled with `createElement`, `append`, and `textContent` rather than interpolated HTML templates.
- Goal titles and formatted deadlines are assigned as text; priority classes are selected from the supported `Low`, `Medium`, and `High` values.
- Achieved-goal toggle labels and counts are built as DOM nodes.
- Achieve, edit, and remove actions are attached directly with event listeners and retain the existing goal ID values.
- The goal list is replaced atomically with `replaceChildren` after its new fragment is assembled.
- The security audit checks that the goal renderer does not regress to `innerHTML`.

### Compatibility notes

- Goal storage keys, record structure, and existing goal IDs are unchanged.
- Existing CSS classes, action labels, priority styling, deadline display, and achieved-goal expand/collapse behavior are retained.
- No LocalStorage or IndexedDB data is cleared, migrated, or rewritten.
- The service-worker cache was bumped to `standout-v2.48-goal-dom-security`.

### Remaining risks

- Other `innerHTML` assignments and inline handlers remain elsewhere and require context-specific review.
- A strict Content Security Policy is still not safe to enforce.
- Browser interaction and backup/restore round-trip tests remain manual release gates.


## Sprint 56 — custom-card rendering and artwork validation

### Fixed

- Custom-card manager rows are assembled with DOM APIs and `textContent`; the renderer no longer interpolates stored card fields into HTML. Its edit/remove actions use event listeners.
- Marketplace and owned-card views now use a shared DOM builder for regular cards, including custom cards. Titles, quotes, labels, costs, and dates are inserted as text rather than HTML.
- Card image sources are accepted only as bounded JPEG/PNG/WebP base64 data URLs or same-origin HTTP(S) assets. Scriptable URL schemes and remote origins are rejected.
- The custom-card image picker accepts only JPEG, PNG, WebP, and GIF source files up to 10 MB. The canvas pipeline rasterizes accepted uploads to JPEG before saving.
- Invalid or legacy artwork values are not executed or assigned as image sources; the card remains available with its text and artwork hidden until valid artwork is supplied.
- The security audit checks custom-card manager, marketplace, owned-card rendering, and artwork validation paths.

### Compatibility notes

- Existing custom-card IndexedDB records, IDs, and field names are unchanged.
- Existing user-uploaded canvas JPEG data URLs remain supported. Built-in same-origin card artwork paths remain supported.
- No LocalStorage or IndexedDB data is cleared, migrated, or rewritten.
- The service-worker cache was bumped to `standout-v2.49-custom-card-dom-security`.

### Remaining risks

- Season-owned card templates and other feature renderers still require context-specific review.
- Inline handlers and the inline startup script remain elsewhere; strict CSP is not yet safe to enable.
- Browser interaction and backup/restore round-trip tests remain manual release gates.


## Sprint 57 — mastery rendering and milestone input security

### Fixed

- Mastery cards and milestone rows are now constructed with DOM APIs. Mastery titles, descriptions, milestone labels, and evidence previews are assigned through `textContent` rather than HTML templates.
- The empty-state action, edit/create actions, milestone completion controls, and evidence actions use event listeners instead of inline handler attributes. Stored mastery and milestone IDs are captured as inert values in closures.
- Create/edit milestone input rows are built with DOM APIs. Existing milestone titles are assigned through `input.value`, not interpolated into HTML attributes.
- The security audit and release inventory now include regression guards for the Mastery rendering path.

### Compatibility notes

- The `standout_masteries` LocalStorage key and existing mastery/milestone record fields and IDs are unchanged.
- Existing Mastery CSS classes, progress presentation, stage labels, milestone completion behavior, evidence modal flow, and create/edit/remove workflows are retained.
- No LocalStorage or IndexedDB data is cleared, migrated, or rewritten.
- Service-worker cache bumped to `standout-v2.50-mastery-dom-security`.

### Remaining risks

- Other feature modules still contain HTML sinks and inline handlers requiring context-specific review. A strict Content Security Policy remains disabled.
- Browser interaction and backup/restore round-trip tests remain manual release gates.


## Sprint 58 — monthly insight rendering hardening

### Fixed

- Monthly insight cards are now constructed with DOM APIs and a document fragment rather than HTML-string interpolation. Insight titles and descriptions are assigned with `textContent`.
- Insight style classes are selected from the explicit `positive`, `neutral`, and `warning` allowlist; unexpected types fall back to `neutral`.
- The empty state is constructed with a DOM node and text content.
- Security and release-review scripts now enforce a regression guard for monthly insight rendering.

### Compatibility notes

- Monthly insight generation, wording, CSS class names, and report data calculations are unchanged.
- No LocalStorage or IndexedDB keys or formats were changed. No user data was cleared, migrated, or rewritten.
- Service-worker cache bumped to `standout-v2.51-monthly-insights-dom-security`.

### Remaining risks and release gates

- Other `innerHTML` assignments and inline handlers remain in the active application and require context-specific review. Strict CSP remains disabled.
- Third-party dependencies/assets still require review.
- Browser interaction and backup/restore round-trip tests remain manual release gates.


## Sprint 75 — externalize service-worker startup

### Fixed

- Moved service-worker registration out of the inline script block in `index.html` into `JS/core/service-worker-registration.js`.
- The external module registers on the window `load` event, uses the existing app-relative `./service-worker.js` path, and logs registration failures without preventing application startup.
- Added a focused Node regression suite for unsupported browsers, load-event timing, registration path, and rejected registration.
- Added architecture and security guards that prevent an inline script block from being reintroduced into the active `index.html`.
- Added the module to the service-worker app shell and bumped the cache version to `standout-v2.63-external-sw-registration`.

### Compatibility and data safety

- Existing service-worker scope and registration path are unchanged.
- No LocalStorage, IndexedDB, backup, card-catalogue, or user-data formats changed.
- No existing user data was cleared, migrated, or rewritten.

### Remaining CSP blockers

- Inline event-handler attributes remain in `index.html` (41 in the security release review inventory; the architecture assessment uses a slightly different parser and reports 39).
- Inline style attributes and the embedded style block also require review before a restrictive `style-src` policy.
- Active scripts still contain HTML sinks and inline event-property assignments that require source-by-source review.
- Third-party CDN dependencies need a self-hosting/version/integrity decision.
- No Content Security Policy was added. A strict policy would still break existing UI interactions and/or styling.

### Status

This sprint removes the sole inline startup script, not all inline JavaScript. The project is one step closer to CSP compatibility but is not CSP-ready or production-security certified.

## Sprint 76 — Static HTML event delegation

- Replaced all 38 active `onclick` attributes and the active music-volume `oninput` attribute in `index.html` with inert `data-action` metadata.
- Replaced the standalone guide's `history.back()` inline handler with the same external event-delegation module.
- Added `JS/core/event-delegation.js`, which delegates click/input events and dispatches only through an explicit frozen allow-list. It does not use `eval`, `Function`, or executable handler strings.
- Replaced the legacy global-Add fallback's runtime `setAttribute("onclick", ...)` with a single registered listener and inert `data-*` state.
- Added a regression suite that verifies zero active inline event attributes in both HTML pages, confirms every static action is mapped, tests click/input dispatch, rejects unknown actions, and checks app-shell coverage.
- Added the module to the service-worker app shell and advanced the cache version to `standout-v2.64-delegated-html-actions`.

### Current scope and remaining work

- Active inline event-handler attributes: **0** in `index.html` and `standout-guide.html`.
- Active inline script blocks: **0** in `index.html`.
- Programmatic `.onclick` property assignments remain in some feature modules; these are not HTML event-handler attributes but should be migrated to `addEventListener` in a later pass.
- Inactive `JS/app.js` still contains legacy HTML strings and is not loaded by the application; it remains untouched.
- Inline style attributes/style blocks, HTML rendering sinks, third-party asset review, browser verification, and CSP configuration remain open. No strict CSP was enabled.

## Sprint 79 — badge and goal rendering hardening

### Fixed

- Replaced monthly badge requirement HTML templates with DOM nodes. Requirement labels and numeric progress values are assigned through text and style properties, with progress width clamped to 0–100%.
- Replaced legacy monthly badge artwork templates with a DOM-based artwork builder.
- Replaced earned-badge empty state and collection cards with DOM construction. Stored title/month values use `textContent`; stored artwork is accepted only when it matches a local `badges/<filename>.(png|jpg|jpeg|webp)` path.
- Normalized the earned-badge read path to accept only an array of object records, avoiding malformed top-level storage values.
- Rebuilt the goal edit modal, goal-achievement video overlay, and overdue marker with DOM APIs. Goal title/deadline values are assigned through input properties.
- Added a dedicated badge/goal rendering regression suite and security-audit guards.
- Bumped the service-worker cache to `standout-v2.67-badge-goal-dom`.

### Compatibility and data safety

- Existing earned-badge storage key and record fields (`id`, `title`, `artwork`, `month`, `earnedAt`) are unchanged.
- Existing goal data keys, IDs, edit controls, video asset path, and overdue presentation are retained.
- No LocalStorage or IndexedDB records were cleared, migrated, or rewritten.

### Remaining risks and release gates

- The source-level security review still reports HTML sinks elsewhere in active modules; each must be reviewed by input provenance before removal or approval.
- Inline event-property inventory includes non-UI browser API callbacks and still requires contextual review.
- No Content Security Policy is enabled. Third-party asset review and style-policy preparation remain open.
- Real-browser workflow verification remains outstanding. This sprint's Node tests and static audits do not certify browser behavior or production readiness.

## Sprint 80 — remaining rendering sinks and persisted-record validation

- Replaced the owned Season card collection's HTML template with DOM construction. Card image URLs pass through the existing same-origin/raster-data URL validator; titles and quotes use `textContent`.
- Replaced the Momentum toast HTML template with `<strong>` and `<span>` nodes populated through `textContent`.
- Replaced achievement collection clearing and monthly-report selector clearing with `replaceChildren()`.
- Goal storage loading and the `window.goalsData` compatibility setter now discard null, primitive, and array entries before goal-property access. Existing valid goal objects and their fields are retained.
- Achievement synchronization now ignores malformed stored entries before looking up achievement IDs.
- Added a storage/rendering regression suite and source-level security assertions.
- Bumped the service-worker cache to `standout-v2.69-modal-dom`.

### Compatibility and data safety

- Existing LocalStorage keys and valid goal/achievement record fields are unchanged.
- Invalid non-record entries in `goalsData` and `achievements` are ignored; valid object records are preserved.
- No IndexedDB schema, backup format, card ownership format, or valid user records were migrated or intentionally cleared.

### Remaining risks and release gates

- Static review still finds HTML-string assignments in modal templates and Momentum's decorative core/panel templates; each needs further source/context review.
- The active event-property inventory still includes browser API callbacks; these are not all UI click handlers.
- CSP remains unconfigured; third-party assets and inline styles require review.
- Optional media assets `welcome.mp4` and `Music/Complete.mp3` remain absent from the archive.
- Real-browser workflow verification remains outstanding. Static tests do not certify production readiness.


### Sprint 81 — Modal DOM migration

- Replaced the six modal `innerHTML` templates in `JS/features/modals.js` with explicit DOM construction.
- Skill and mission values, XP labels, repeat selections, and linked-skill options are populated through `textContent`, `value`, and DOM properties.
- Preserved modal action delegation, edit-state references, hardcore restrictions, and countdown input IDs/IST minimum handling.
- Replaced mission completion's overdue-marker HTML clearing with `replaceChildren()`.
- Updated the service-worker cache to `standout-v2.69-modal-dom`.
- Two active `innerHTML` templates remain in Momentum rendering and require a separate structural migration.


## Sprint 83 — CSP preparation and embedded-style extraction

### Completed

- Extracted the embedded style blocks from `index.html`, `documentation.html`, and `standout-guide.html` into same-origin CSS files. Their links occupy the former style-block positions to preserve cascade order.
- Added the three extracted stylesheets to the service-worker app shell.
- Added a CSP readiness regression test covering all four HTML pages.
- Added `CSP-REPORT-ONLY-DRAFT.md` with a candidate response header, source inventory, known exceptions, and a staged rollout procedure.
- Advanced the service-worker cache to `standout-v2.71-csp-preparation`.

### CSP inventory after extraction

- Inline script blocks: 0 across the four HTML pages.
- Inline event-handler attributes: 0 across the four HTML pages.
- Embedded style blocks: 0 across the four HTML pages.
- Inline style attributes: 22 remained in `index.html`; the candidate policy therefore retained `style-src-attr 'unsafe-inline'` at that point.
- Third-party page resources: Font Awesome from `cdnjs.cloudflare.com`; guide fonts from `fonts.googleapis.com` and `fonts.gstatic.com`.
- External HTTPS image sources remain supported for user-configurable card artwork, so the candidate `img-src` remains broad pending a compatibility decision.

### Not enabled / remaining gates

- No CSP header or meta policy is installed. The hosting platform is not confirmed, and a report-only header must be configured at the actual deployment edge.
- The candidate policy must be observed on the deployed origin before enforcement. No reporting endpoint is configured.
- Inline style attributes, programmatic event-property assignments, third-party asset supply-chain review, and real-browser workflow verification remain open.
- `welcome.mp4` and `Music/Complete.mp3` remain missing optional assets per the release audit.

### Compatibility and data safety

- Extracted CSS preserves the original stylesheet position in each page's cascade.
- No LocalStorage, IndexedDB, backup, card ownership, or user-data formats were changed.
- No user records were cleared or migrated.

CSP preparation is not CSP enforcement and does not certify production readiness.


## Sprint 85 — Static inline style externalization

- Removed all 22 active static `style` attributes from `index.html` and moved their presentation rules into `CSS/index-embedded.css` and `CSS/timer.css`.
- Preserved dynamic visibility changes by retaining the existing element IDs and leaving runtime JavaScript style mutations unchanged.
- Updated the CSP readiness regression test to require zero active inline style attributes across all four HTML pages.
- Advanced the service-worker cache to `standout-v2.72-inline-style-externalization`.
- The candidate CSP still retains `style-src-attr 'unsafe-inline'` because runtime JavaScript writes styles through CSSOM. CSP remains disabled until those mutations and the third-party asset inventory are reviewed and browser-tested.
- No LocalStorage, IndexedDB, backup, card ownership, or user-data formats were changed.
