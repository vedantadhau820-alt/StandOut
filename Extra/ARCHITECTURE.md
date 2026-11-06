# StandOut Architecture

## Current migration strategy

StandOut is being refactored as a **feature-oriented modular monolith** using native browser ES modules and vanilla JavaScript. The migration is incremental: existing classic scripts, global functions, inline HTML handlers, storage keys, IndexedDB databases, and UI markup remain compatible while individual features are extracted.

The inactive `JS/app.js` is not part of the migration source of truth. The active application is currently loaded from the feature and `app-part` scripts referenced by `index.html`.

## Current source layout

```text
JS/
  core/
    bootstrap.js   # ES-module entry point and compatibility API registration
    storage.js     # LocalStorage, IndexedDB, and Cache API adapters
    events.js      # Namespaced feature event bus
    dom.js         # Small DOM query and listener helpers
  features/
    countdowns/
      countdowns.js # Countdown creation, persistence, rendering and live timers
    notifications/
      notifications.js # Notification persistence, badge, drawer, smart popup
    sound/
      sound.js         # Event tones, custom tones, previews, account controls
    background/
      background.js   # Custom background image storage and appearance controls
    daily-challenge/
      daily-challenge.js # Daily challenge selection, progress, rewards and animation
    momentum/
      momentum.js      # Momentum levels, streaks, proof and history
    mastery/
      mastery.js       # Mastery plans, milestones, evidence and progress
    achievements/
      achievements.js # Achievement definitions, unlocks, progress and popups
    badges/
      badges.js       # Monthly badge requirements, awards and collection
    missions/
      history.js       # Mission occurrence history and monthly aggregate metrics
      progression.js   # Shared daily point cap and achievement milestone thresholds
    cards/
      catalogue.js    # Central read API and non-destructive catalogue diagnostics
      custom-cards.js # Custom-card IndexedDB and editor/manager integration
      marketplace.js  # Card purchasing, marketplace and owned collection
  app-part1.js     # Legacy shared runtime, backup, cards, timer music
  app-part2.js     # Legacy reports, navigation, mission lifecycle
  app-part3.js     # Legacy skills, compatibility bridges, persistence, custom cards
  ...              # Existing feature scripts (unchanged during foundation pass)
```

## Script loading contract

`index.html` loads the remaining legacy classic scripts in their original order. It then loads `JS/core/bootstrap.js` as a module; extracted features are loaded through that module graph. Module scripts are deferred by the browser, so this preserves the current classic-script initialization order and gives inline handlers access to the same legacy global functions.

Newly extracted feature modules should import the required APIs from `JS/core/` and should not add new globals unless an explicit legacy bridge is required. Existing legacy globals will be removed only when all callers have migrated and compatibility tests cover the change.

## Compatibility API

After bootstrap, new modules and browser-console diagnostics can access `window.StandOutCore`:

- `StandOutCore.storage.local.get(key)` / `set(key, value)` / `remove(key)` — raw LocalStorage string operations.
- `StandOutCore.storage.local.getJSON(key, fallback)` / `setJSON(key, value)` — explicit JSON helpers; use only for keys already defined as JSON.
- `StandOutCore.storage.local.keys()` / `entries()` — enumerate current LocalStorage keys and raw values.
- `StandOutCore.storage.indexedDB.open(name, version?, onUpgrade?)` — promise-based database open helper.
- `StandOutCore.storage.indexedDB.request(db, store, mode, operation)` — execute a request in a transaction.
- `StandOutCore.storage.cache.open/match/put/delete(...)` — Cache API helpers.
- `StandOutCore.events.on(name, handler)` — subscribe and receive an unsubscribe function.
- `StandOutCore.events.once(name, handler)` / `emit(name, detail)` — one-time subscription and event dispatch.
- `StandOutCore.dom.byId/one/all/on(...)` — small DOM helpers.

The underlying ES modules also export `storage`, `events`, and `dom` for direct imports.

## Persistence invariants

1. Do not rename or delete existing LocalStorage keys during feature extraction.
2. Do not reinterpret HTML-backed `missions`, `skills`, or `goals` values as JSON.
3. Do not change IndexedDB database names, versions, object-store names, or key paths in the compatibility phase.
4. Do not change Cache API cache names or delete caches as part of a refactor.
5. Preserve the version-4 complete backup format and existing restore flow until export/import round-trip tests are available.
6. A future structured-data migration must be additive, versioned, reversible, and retain a legacy reader until migration is verified.

## Migration ledger

### Sprint 1 — compatibility foundation

- [x] Add a storage adapter without changing persisted values.
- [x] Add a namespaced event bus for future feature-to-feature communication.
- [x] Add minimal DOM helpers for new modules.
- [x] Add a module bootstrap after the existing classic scripts.
- [x] Document loading order, API contracts, and persistence invariants.
- [ ] Verify startup and critical workflows in a real browser.
- [ ] Capture and test a current in-app backup before storage ownership changes.

### Explicitly not changed

- No existing feature logic or UI behavior was rewritten.
- No LocalStorage, IndexedDB, or Cache API data was migrated or deleted.
- No asset paths, static assets, service-worker cache lists, or manifest entries were changed.
- The legacy `app-part1.js`, `app-part2.js`, and `app-part3.js` remain in place.

### Sprint 2 — first feature extraction: Notifications

- [x] Extract notification persistence and UI behavior into `JS/features/notifications/notifications.js`.
- [x] Preserve the existing `appNotifications` and `lastNotifCount` LocalStorage contracts.
- [x] Preserve legacy global function names (`pushNotification`, `clearAllNotifications`, `updateNotificationBadge`, `renderNotifications`, `showSmartNotification`, and `saveNotifications`).
- [x] Add a narrow `window.appNotifications` bridge so backup/restore code continues to use the existing classic-script binding.
- [x] Update the service-worker app shell to cache active `app-part` scripts and the new ES module dependency graph while retaining the existing cache namespace.
- [x] Run isolated smoke tests for notification creation, persistence, unread count, read state, clearing, rendering, and restore assignment compatibility.
- [ ] Verify full-page startup and offline startup in a real browser.

**Compatibility note:** The notification renderer now writes notification text through `textContent` instead of interpolating stored values into `innerHTML`. This preserves ordinary display while preventing stored notification text from being interpreted as markup. The service-worker cache name was deliberately not changed; the existing namespace is reused to avoid unnecessary cache cleanup.


### Sprint 3 — Sound & Tone extraction

- [x] Move the existing 785-line sound implementation into `JS/features/sound/sound.js` without rewriting its feature logic.
- [x] Preserve the `standout_sound_settings` LocalStorage key and its existing JSON shape.
- [x] Preserve IndexedDB database `standout-sounds`, version `1`, object store `custom-tones`, and existing record keys/shape.
- [x] Preserve the public legacy functions and `soundSettings` / `DEFAULT_SOUND_SETTINGS` access used by classic scripts and backup/restore.
- [x] Expose a module API as `StandOutCore.sound` for future feature modules.
- [x] Replace the classic `JS/sound.js` script reference with the module loaded through the core bootstrap.
- [x] Update the service-worker app-shell entry to the new module path without changing the cache namespace or audio asset paths.
- [x] Run syntax checks for all active classic scripts and ES modules.
- [x] Run isolated smoke tests for public API availability, settings persistence, default tone playback, stop behavior, and DOM-ready initialization.
- [ ] Verify custom tone upload/playback, Account UI controls, cross-feature audio arbitration, and offline startup in a real browser.

**Compatibility note:** The sound implementation body was moved without functional edits. A compatibility bridge exposes the function names used by the existing classic scripts. The sound module is available to future modules through `StandOutCore.sound`; its settings object remains mutable to preserve the existing reset/restore behavior.


### Sprint 4 — Background Management extraction

- [x] Move the existing background implementation into `JS/features/background/background.js` without changing its persistence or UI logic.
- [x] Preserve IndexedDB database `AppBackgroundDB`, version `1`, object store `background`, and the `current` record key.
- [x] Preserve the `standout_background_appearance` LocalStorage key and `{ opacity, overlay, blur }` JSON shape.
- [x] Preserve existing background DOM IDs, CSS custom properties, file input behavior, and remove-button behavior.
- [x] Preserve the legacy `loadCustomBackground()` function used by the existing application scripts.
- [x] Expose a module API as `StandOutCore.background`.
- [x] Update `index.html` and the service-worker app-shell path to the new module location.
- [x] Keep existing service-worker cache namespace and all static asset references unchanged.
- [ ] Verify image upload, reload persistence, remove/reset, appearance sliders, and offline startup in a real browser.

**Compatibility note:** The implementation was moved without changing its IndexedDB schema or appearance settings format. A small `window` bridge preserves the legacy function names; new feature code should import `background` or use `StandOutCore.background`.


## Feature modules

- `JS/features/daily-challenge/daily-challenge.js`: daily challenge selection, progress, rewards, and animation.


### Sprint 5 — Daily Challenge extraction

- [x] Move the existing Daily Challenge feature closure into `JS/features/daily-challenge/daily-challenge.js`.
- [x] Preserve deterministic daily challenge selection and the India/IST date behavior.
- [x] Preserve `standout_daily_challenge` state key and its existing `{ date, challenge, completed }` shape.
- [x] Preserve mission-history event format and the `missionHistory` in-memory synchronization.
- [x] Preserve reward side effects: Improvement Points, achievements, marketplace, Momentum, season XP, and `saveData()`.
- [x] Preserve confirmation, audio cue, XP-orb animation, reduced-motion handling, and existing DOM/CSS hooks.
- [x] Preserve `window.refreshDailyChallenge` and expose `window.DailyChallenge` plus `StandOutCore.dailyChallenge`.
- [x] Update the service-worker app-shell path and remove the old classic script entry.
- [x] Keep existing challenge text, reward values, and behavior unchanged.
- [ ] Verify completion, date rollover, reward integrations, and offline startup in a real browser.

**Compatibility note:** The Daily Challenge implementation remains in its existing IIFE-style private scope. The new module export exposes its supported methods without leaking internal state. Existing cross-feature calls continue to use their prior global contracts.


### Sprint 6 — Momentum extraction

- [x] Move the existing Momentum IIFE into `JS/features/momentum/momentum.js` as a native ES module.
- [x] Preserve `standout_momentum_state` and `standout_momentum_history` keys and their existing JSON shapes.
- [x] Preserve the full state normalization/default behavior, levels, energy rules, shield milestones, and missed-day calculations.
- [x] Preserve IST date resolution through `window.getTodayKey` with the existing Asia/Kolkata fallback.
- [x] Preserve mission-completion detection, the 150 ms completion check, and the `window.__momentumMissionListener` duplicate-listener guard.
- [x] Preserve the `window.resetData` wrapper behavior and reset semantics.
- [x] Preserve the `window.Momentum` public API and `window.MomentumTest` developer shortcuts.
- [x] Expose the same Momentum API as `StandOutCore.momentum`.
- [x] Update the HTML module loading graph and service-worker app-shell path.
- [x] Keep all Momentum UI markup generation, CSS class names, toast behavior, and interaction logic unchanged.
- [ ] Verify mission proof, date rollover, missed-day decay, shield use, reset, monthly history, and offline startup in a real browser.

**Compatibility note:** The original Momentum implementation was moved with its IIFE/private state model intact. The exported module value is the same public object assigned to `window.Momentum`; existing classic scripts and inline consumers continue using that legacy global contract. The developer test API remains available as `window.MomentumTest`.


### Sprint 7 — Mastery extraction

- [x] Move the existing Mastery implementation into `JS/features/mastery/mastery.js` as a native ES module.
- [x] Preserve the `standout_masteries` LocalStorage key and existing JSON record structure.
- [x] Preserve mastery and milestone identifiers, timestamps, completion flags, and evidence fields.
- [x] Preserve the two-active-masteries limit and existing modal workflows.
- [x] Preserve existing global function bridges used by inline HTML handlers and other classic scripts.
- [x] Expose the feature API through `StandOutCore.mastery`.
- [x] Update `index.html` and the service-worker app-shell path.
- [x] Keep rendering markup, CSS class names, evidence counter behavior, and progress-stage thresholds unchanged.
- [x] Run syntax and isolated feature smoke tests.
- [ ] Verify full create/edit/delete/evidence workflows and existing saved masteries in a real browser.

**Compatibility note:** The original top-level functions and variables are now module-scoped. Every function previously assigned to `window` remains explicitly exposed for existing inline handlers and cross-feature calls. No persisted data migration was performed.


### Sprint 8 — Achievements and Badges extraction

- [x] Extract achievement definitions, synchronization, rendering, unlocking, and popup behavior into `JS/features/achievements/achievements.js`.
- [x] Preserve the `achievements` definitions and `achievementsData` state contracts used by backup/restore and mission progress UI.
- [x] Add getter/setter compatibility for global `achievementsData`, plus the existing `achievements` read contract.
- [x] Preserve `syncAchievements`, `renderAchievements`, `unlockAchievement`, and `showAchievementPopup` global function access.
- [x] Extract monthly badge definitions, progress calculations, award logic, and collection UI into `JS/features/badges/badges.js`.
- [x] Preserve the `earnedBadges` LocalStorage key and existing earned badge record shape.
- [x] Preserve monthly badge requirements, current-month calculation, page navigation, artwork rendering, and legacy global function access.
- [x] Update the bootstrap, HTML script loading, and service-worker app-shell paths.
- [x] Run syntax, module wiring, compatibility, persistence, and feature smoke tests.
- [ ] Verify existing achievements and earned badges, monthly progress, unlock popups, and backup/restore in a real browser.

**Compatibility note:** Achievement data is still synchronized against the same definitions and saved under the same `achievements` key. `window.achievementsData` is now an accessor bridge so the existing backup/restore assignment updates the module-owned state. The badge file contained two declarations of `renderMonthlyBadgeArtwork`; the later declaration was the effective classic-script implementation. The superseded earlier renderer is retained under a private legacy name because ES modules reject duplicate declarations.

### Sprint 9 — Custom Cards feature extraction

- [x] Move custom-card IndexedDB persistence, marketplace synchronization, grade controls, manager rendering, and creator/editor entry points into `JS/features/cards/custom-cards.js`.
- [x] Preserve IndexedDB database `standout-custom-cards`, version `1`, object store `cards`, key path `id`, and the existing custom-card record format.
- [x] Preserve all existing legacy `window` function bridges used by the custom-card creator, editor, manager, delete flow, backup/restore, and marketplace.
- [x] Keep the marketplace catalogue as the existing mutable `window.cardCatalog` contract so custom cards can continue to be appended and removed at runtime.
- [x] Expose a narrow `StandOutCore.customCards` module API for future feature code.
- [x] Replace the classic script entry with the module import through the core bootstrap and update the service-worker app shell path.
- [x] Preserve the existing DOM-ready initialization behavior and all current markup/CSS hooks.
- [x] Run syntax checks and static compatibility checks for the extracted module and all active application scripts.
- [ ] Verify custom-card creation, image persistence, editing, deletion, owned-card protection, marketplace refresh, and backup/restore in a real browser.

**Compatibility note:** This sprint changes module ownership, not the custom-card storage model. Existing custom cards remain in the same IndexedDB database and object store. The custom-card module explicitly calls the legacy marketplace renderers through `window` because module-scoped declarations are not automatically published as browser globals. The original classic script file has been removed from the active source tree; its functionality now lives under the feature directory.


### Sprint 10 — Cards Marketplace and Collection extraction

- [x] Move marketplace rendering, owned-card collection rendering, card purchasing, expiry checks, date formatting, grade ranking, filter controls, card tabs, and marketplace navigation into `JS/features/cards/marketplace.js`.
- [x] Preserve the `ownedCards` LocalStorage key and existing per-card ownership record shape, including `mintedAt`.
- [x] Preserve Improvement Point deduction, purchase confirmation, expired limited-card protection, mint animation, and existing DOM/CSS hooks.
- [x] Preserve normal-card and season-card collection separation and existing seasonal artwork rendering.
- [x] Add explicit compatibility accessors for legacy `ownedCards`, `completedMissions`, marketplace filter, and marketplace visibility state.
- [x] Publish legacy global entry points for other classic scripts and expose `StandOutCore.cards`.
- [x] Update the service-worker app-shell path.
- [ ] Verify marketplace filters, purchases, points deduction, collection rendering, season rewards, backup/restore, and offline startup in a real browser.

**Compatibility note:** The marketplace module owns the rendering and purchase functions, while the original classic scripts retain ownership of mission and runtime state. Explicit `window` accessors bridge those values without rewriting the existing mission, season, or backup/restore systems. The custom-card module continues to update the same mutable `window.cardCatalog` catalogue.

### Sprint 11 — Card catalogue access and Season integration

- [x] Add `JS/features/cards/catalogue.js` as the centralized read API for built-in, custom, and seasonal cards.
- [x] Add non-destructive catalogue diagnostics for duplicate IDs, missing required fields, invalid costs, unknown grades, and incomplete Season metadata.
- [x] Route marketplace card reads and card lookup through the catalogue API.
- [x] Route Season reward lookup through the catalogue API with the legacy array lookup as a compatibility fallback.
- [x] Register `StandOutCore.cardCatalogue` and add the module to the service-worker app shell.
- [ ] Verify built-in/custom/Season card flows in a real browser and test backup/restore round trips.

**Historical compatibility note (superseded in Sprint 72):** At this stage, the catalogue data file remained a classic script. Sprint 72 later moved its data into an ES-module dependency of the bootstrap while retaining the mutable `window.cardCatalog` compatibility surface.


### Sprint 12 — Mission history and metrics extraction

- [x] Extract mission occurrence recording and monthly aggregate metrics into `JS/features/missions/history.js`.
- [x] Preserve the `missionHistory` LocalStorage key, daily record structure, event fields, occurrence-key de-duplication, first-write-wins behavior, and timestamp format.
- [x] Add an explicit `window.missionHistory` getter/setter bridge so existing backup/restore assignments and report scripts continue to share the same object.
- [x] Preserve the `recordMissionPerformance` and `calculateMonthMetrics` global entry points for existing classic-script callers.
- [x] Register `StandOutCore.missionHistory` and update the service-worker app shell.
- [ ] Verify completed/missed mission events, recurring occurrence dates, monthly summaries, backup/restore, and offline startup in a real browser.

**Compatibility note:** This is a deliberately narrow first step in the mission domain. Mission creation, editing, deletion, completion, recurring reset, Hardcore penalties, and rewards remain in the legacy lifecycle script because they share state and DOM behavior with multiple other features.


### Sprint 13 — Mission management extraction

- [x] Extract mission creation, editing, and deletion workflows into `JS/features/missions/management.js`.
- [x] Register the feature as `StandOutCore.missionManagement`.
- [x] Preserve `addMission`, `updateMission`, and `deleteMission` global entry points for inline handlers and existing modal actions.
- [x] Preserve mission DOM structure, data attributes, validation, repeat-key initialization, Hardcore deletion confirmation, and save/close behavior.
- [x] Keep deadline monitoring, completion/reward processing, recurring resets, and mission-history persistence in their existing owners.
- [x] Add the new module to the service-worker app shell.
- [ ] Verify create/edit/delete workflows, Hardcore restrictions, recurring schedules, and saved mission restoration in a real browser.

**Compatibility note:** The management module deliberately delegates to the existing global services (`openModal`, `closeModal`, `saveData`, `customAlert`, `customConfirm`, `getRepeatKey`, and `isPastDateTime`). This avoids duplicating application-wide behavior while the remaining mission lifecycle is migrated.


### Sprint 14 — Mission Completion Engine
- Extracted mission completion and reward orchestration into `JS/features/missions/completion.js`.
- Exposed `StandOutCore.missionCompletion` and retained the classic `completeMission()` entry point.
- Added explicit window accessors for `dailyImprovementCount` and `completedMissionCount` so the ES module updates the same legacy runtime state and backup/restore continues to work.
- Preserved the existing daily cap, overdue behavior, Improvement Point accounting, skill XP, Season XP, achievement checks, recurrence behavior, and save flow.


### Sprint 15 — Mission scheduler and deadline engine

- [x] Extract recurring occurrence keys, recurring mission refresh/reset, and deadline shifting into `JS/features/missions/scheduler.js`.
- [x] Extract due-soon warnings, overdue notifications, normal missed-mission deductions, and Hardcore failure penalties into the scheduler module.
- [x] Preserve existing repeat-key formats, 30-second deadline polling cadence, two-hour warning window, one-time notification/penalty flags, and month-end deadline shifting behavior.
- [x] Preserve the existing `missions` HTML LocalStorage persistence format and all mission `data-*` attributes.
- [x] Keep classic global wrappers for `getRepeatKey`, `refreshRecurringMissions`, `resetRecurringMission`, `shiftRecurringDeadline`, and `checkMissedDeadlines`.
- [x] Register `StandOutCore.missionScheduler` and add the module to the service-worker app shell.
- [ ] Verify daily/weekly/monthly rollover, deadline warnings, normal penalties, Hardcore penalties, reload persistence, and offline startup in a real browser.

**Compatibility note:** Mission markup and occurrence state remain stored in the existing `missions` LocalStorage HTML. The scheduler uses explicit `window` bridges for Improvement Points, notifications, marketplace refresh, mission history, and save operations. The existing local-calendar repeat-key and deadline calculations are retained; this sprint does not change their timezone semantics.


### Sprint 16 — Goals feature extraction

- [x] Extract goal persistence, creation, editing, removal, rendering, achievement, reward, and deadline enforcement into `JS/features/goals/goals.js`.
- [x] Preserve the `goalsData` and `dailyGoalCompletions` LocalStorage keys and their existing object/array shapes.
- [x] Preserve commitment durations (Low 3 days, Medium 7 days, High 25 days), rewards (3/7/15 points), priority restrictions, daily per-priority achievement limits, and overdue penalties.
- [x] Preserve goal achievement video, notifications, countdown display, achieved-goal collection UI, and one-second timer refresh cadence.
- [x] Add an explicit `window.goalsData` getter/setter for backup/restore and cross-feature compatibility.
- [x] Keep classic global wrappers for existing inline handlers and other classic scripts.
- [x] Register `StandOutCore.goals` and add the module to the service-worker app shell.
- [ ] Verify goal CRUD, achievement/reward, daily completion limits, commitment locks, overdue penalties, achieved-goal deletion, backup/restore, and offline startup in a real browser.

**Compatibility note:** The existing goal record structure and LocalStorage formats are unchanged. The feature uses explicit browser-global accessors for shared goal state and existing application services. The achieved-goal long-press/delete-confirmation helpers remain in `app-part3.js` as UI interaction handlers and call the goal module through the compatibility bridge.


### Sprint 17 — Countdowns

- [x] Extract countdown creation, removal, persistence, rendering, and one-second live timer updates into `JS/features/countdowns/countdowns.js`.
- [x] Preserve the existing `countdowns` LocalStorage key and `{ title, date, startTime, warned? }` record shape.
- [x] Preserve IST interpretation of `datetime-local` targets, future-date validation, one-hour warning notification, progress-bar behavior, and “Time's up!” display.
- [x] Keep the `countdowns` global state bridge and legacy function names for backup/restore and existing callers.
- [x] Register the feature in the modular bootstrap and service-worker app shell.
- [x] Build countdown cards with DOM APIs and `textContent`, preventing countdown titles from being interpreted as HTML.
- [ ] Verify countdown creation, removal, timer expiry, notification, and backup/restore in a real browser.

### Sprint 17 — compatibility notes

- No storage key or saved countdown record fields were renamed. Existing countdown data remains readable without migration.
- The countdown timer uses its own `window.countdownTimerInterval` handle so it cannot overwrite the unrelated focus timer interval.
- The follow-up compatibility fix uses an IST wall-clock minimum for the `datetime-local` field and explicit Add/Cancel listeners in the modal.


### Sprint 18 — Skills feature extraction

- [x] Extract skill creation, editing, deletion, XP progression, and saved-skill hydration into `JS/features/skills.js`.
- [x] Preserve the HTML-backed `skills` LocalStorage value and existing skill markup/data attributes.
- [x] Preserve mission-to-skill links when a skill is renamed or deleted.
- [x] Preserve `addSkill`, `updateSkill`, `deleteSkillDirect`, `deleteSkill`, `increaseSkillXP`, and `checkSkillLevelUp` global entry points.
- [x] Register `StandOutCore.skills` and add the module to the service-worker app shell.
- [x] Build newly added skill markup with DOM APIs and `textContent` so user-entered skill names are not interpreted as HTML.
- [ ] Verify skill CRUD, XP rollover/level-up, mission linking, reload persistence, backup/restore, and offline startup in a real browser.

### Sprint 18 — compatibility notes

- The existing `skills` key remains an HTML fragment; this sprint does not introduce a JSON schema or migrate user data.
- The existing `saveData()` function remains the persistence owner for the shared missions/skills/goals HTML snapshots. The skill module calls that function through the global compatibility API.
- Skill click-to-edit behavior and the existing modal IDs/CSS hooks remain unchanged.


### Sprint 18.1 — Countdown and skill interaction regression fixes

- [x] Generate the countdown date picker's minimum value in IST wall-clock format instead of slicing a UTC ISO string.
- [x] Wire countdown Add and Cancel buttons with explicit listeners and explicit global modal bridges.
- [x] Validate required countdown fields and compare the target instant against the current time before saving.
- [x] Give the countdown interval its own handle and clear it during application reset.
- [x] Prevent skill-card edit handling from firing when the user clicks a button inside the card, including Remove.
- [ ] Verify countdown date selection, Add/Cancel, persistence, skill removal, and normal skill editing in a real browser.

**Compatibility note:** Existing countdown storage records and skill markup remain unchanged. This is a corrective patch; it does not start the next feature extraction.


### Sprint 19 — Navigation feature extraction

- [x] Extract page switching and context-sensitive global Add button behavior into `JS/features/navigation.js`.
- [x] Register `StandOutCore.navigation` in the modular bootstrap and add the module to the service-worker app shell.
- [x] Preserve the `showPage(pageId)` and `updatePlusBtn(pageId)` global entry points for inline handlers and legacy callers.
- [x] Preserve active-section and active-navigation-button classes, marketplace state, account achievement refresh, and Add button modal mappings.
- [ ] Verify all bottom-navigation destinations, active states, Add button visibility/actions, account achievement refresh, and offline startup in a real browser.

**Compatibility note:** Existing page IDs, navigation button IDs, modal names, and global function names are unchanged. The navigation feature uses `window.isMarketplaceOpen` and `window.renderAchievements` as explicit compatibility APIs.


### Sprint 20 — Focus timer extraction

- [x] Extract full-screen timer navigation, timer settings, countdown interval management, and display updates into `JS/features/timer.js`.
- [x] Preserve the existing timer screen/modal markup and classic global entry points (`applyTimerSettings`, `closeTimerSettingModal`, and `startStaticTimer`).
- [x] Preserve `window.timerInterval` so the existing application reset flow can stop the timer.
- [x] Expose the existing classic music audio element through `window.music` for the timer's close-screen behavior.
- [x] Register `StandOutCore.timer` and add the module to the service-worker app shell.
- [x] Validate timer values before starting; reject invalid ranges and zero-duration timers.
- [ ] Verify fullscreen open/close, settings apply/cancel, timer tick/expiry, audio stopping, reset behavior, and offline startup in a real browser.

**Compatibility note:** The music player and its playlist/preset selection remain in the legacy script. This extraction owns only the focus timer screen and timer-setting interactions; no timer persistence or UI redesign was introduced.


### Sprint 20.1 — Focus timer close/reset correction

- [x] Stop and clear the active focus-timer interval when the fullscreen timer is closed.
- [x] Reset the visible hour, minute, and second fields to `00:00:00` on close.
- [x] Expose the display-reset operation through `StandOutCore.timer` for explicit lifecycle control.
- [x] Bump the service-worker cache version so clients fetch the corrected timer module.
- [ ] Verify close/reset/reopen behavior and timer expiry in a real browser.

**Compatibility note:** Closing the focus timer now resets its display to zero as requested. The independent countdown feature is not changed. Timer settings are still applied only when the user starts a new focus timer.


### Sprint 21 — Modal and dialog feature extraction

- [x] Extract Add/Edit modal construction and close behavior into `JS/features/modals.js`.
- [x] Extract alert and confirmation dialog behavior into the same feature module.
- [x] Preserve all existing modal IDs, generated form markup, inline handler names, and dialog behavior.
- [x] Preserve the reset flow's `reloadAfterAlert` state through an explicit `window` bridge.
- [x] Keep classic global wrappers for `openModal`, `closeModal`, `customAlert`, `closeAlert`, `customConfirm`, `confirmYes`, and `confirmNo`.
- [x] Register `StandOutCore.modals` and add the module to the service-worker app shell.
- [ ] Verify all Add/Edit modal types, alerts, confirmations, reset flow, and offline startup in a real browser.

**Compatibility note:** Existing modal HTML templates, IDs, form field IDs, and inline handlers are unchanged. The feature remains a presentation/controller layer; mission, skill, goal, and countdown data operations continue to be owned by their respective feature modules.


### Sprint 22 — Music player feature extraction

- [x] Extract preset playback, local folder playlists, audio lifecycle, and preset cache operations into `JS/features/music.js`.
- [x] Preserve the existing `music` audio element through `window.music` for inline volume controls and the focus timer.
- [x] Preserve `musicMode` through a synchronized `window.musicMode` accessor.
- [x] Preserve classic global entry points for music selection, folder picker, playlist playback, preset UI, cache loading, and stopping music.
- [x] Move folder selection and timer music button event binding into the feature initializer.
- [x] Register `StandOutCore.music` and add the module to the service-worker app shell.
- [x] Keep the existing Cache Storage name, preset file list, playlist selection behavior, volume setting, and audio coordination with `stopAllAppAudio`.
- [ ] Verify preset selection, local folder playback, next-track behavior, volume control, timer music modal, audio coordination, cache fallback, and offline startup in a real browser.

**Compatibility note:** Existing music modal markup, inline handlers, audio element access, and the `mission-app-music-v1` Cache Storage namespace are unchanged. The sound-effects feature remains separate and continues to coordinate audio through `stopAllAppAudio()`.


## Sprint 22.1 — Music extraction regression correction

- Added explicit `window.showPage`, `window.updatePlusBtn`, and `window.completeMission` compatibility bridges.
- Added a navigation fallback for the short period before the modular navigation API is available.
- Removed the unrelated marketplace render from the start of mission completion; a marketplace rendering failure must not block completing a task.
- Made optional audio, history, skill XP, achievement, popup, and persistence integrations defensive so secondary feature errors do not prevent the primary mission state transition.
- Made the mission counter update null-safe.
- Bumped the service-worker cache version to `standout-v2.13-music-regression-fix`.

## Sprint 22.2 — Bootstrap compatibility fix

- Removed duplicate `window` property definitions from the music ES module. Legacy classic-script wrappers already own those public function names; redefining them caused `Cannot redefine property: cacheAllMusic` and aborted the complete module bootstrap.
- Exposed only the shared audio element as `window.music` for Focus Timer integration.
- Bumped the service-worker cache version to `standout-v2.14-bootstrap-property-fix`.
- This restores bootstrap registration of navigation, timer, notifications, mission completion, modals, and monthly mission-history metrics.


## Sprint 23 — Monthly Report feature extraction

- Extracted monthly report calculations, month selection, activity calendar, consistency chart, mission performance, momentum history/chart, goals progress, daily challenge summary, insights, and narrative summary into `JS/features/monthly-report.js`.
- Registered `StandOutCore.monthlyReport` and added the module to the service-worker app shell.
- Preserved the legacy `renderMonthlyReport`, `renderMonthlySummary`, and `renderMonthlyMomentum` entry points used by reset/restore flows.
- Accessed existing mission history, goal data, and Momentum through their existing global compatibility surfaces; no storage keys or record formats changed.
- Made standalone summary and momentum refreshes default to the current month when legacy callers provide no arguments.
- Kept the existing report HTML, CSS, element IDs, and visual rendering unchanged.
- Bumped the service-worker cache version to `standout-v2.15-monthly-report-module`.
- [ ] Verify month selector navigation, report metrics, activity calendar, charts, insights, goals progress, daily challenge section, reset/restore refresh, and offline startup in a real browser.


## Sprint 24 — Achieved Goal interaction consolidation

- Moved achieved-goal long-press detection, confirmation, and deletion from the legacy `JS/app-part3.js` script into `JS/features/goals/goals.js`.
- Kept the existing 800 ms long-press threshold, pointer-up/cancel/leave handling, confirmation wording, and achieved-only deletion guard.
- Kept deletion on the existing `goalsData` storage path and reused the Goals feature's `saveGoals()` and `renderGoals()` operations.
- Exposed the achieved-goal interaction methods through `StandOutCore.goals`; no storage keys, goal record fields, markup, or styling changed.
- Bumped the service-worker cache version to `standout-v2.16-achieved-goal-module`.
- [ ] Verify long-press confirmation, cancel-before-threshold behavior, achieved-goal deletion, and protection of active goals in a real browser.


## Sprint 25 — Achievement interaction and progress consolidation

- Moved mission milestone unlock checks, daily-cap/next-achievement progress indicators, and the motivation popup lifecycle into `JS/features/achievements/achievements.js`.
- Preserved legacy global entry points (`checkMissionAchievements`, `updateMissionProgressCounters`, `showPopup`, and `closePopup`) as compatibility wrappers.
- Kept milestone values and live progress inputs supplied by the existing classic-script state; no duplicate milestone definitions or storage changes were introduced.
- Preserved the existing progress labels, calculation rules, quote pool, popup animation timings, and audio behavior.
- Bumped the service-worker cache version to `standout-v2.17-achievements-consolidation`.
- [ ] Verify milestone unlocks, progress counters, daily cap display, motivation popup, popup sound coordination, and offline startup in a real browser.


## Sprint 26 — Card mint reveal consolidation

- Moved the full card mint reveal overlay and close lifecycle from the legacy `JS/app-part3.js` script into `JS/features/cards/marketplace.js`.
- Exposed `showMintedCard` and `closeMintedCard` through `StandOutCore.cards` and preserved both legacy global names for inline handlers and the Season feature.
- Preserved the existing overlay markup, CSS class names, animation timing, outside-click behavior, and mint sound call.
- Kept marketplace and season minting call sites unchanged.
- No card data, ownership records, storage keys, or visual styles were changed.
- Bumped the service-worker cache version to `standout-v2.18-card-mint-reveal-module`.
- [ ] Verify marketplace minting, season reward minting, reveal animation, close button, outside-click close, sound, and offline startup in a real browser.


## Sprint 27 — Custom Card Creator consolidation

- Moved custom-card modal open/close, artwork file selection and image compression, card creation/edit persistence, form reset, and grade-based cost range behavior into `JS/features/cards/custom-cards.js`.
- Preserved legacy global entry points for existing inline HTML handlers and Custom Card Manager integrations.
- Consolidated custom artwork state on the `window.customCardImageData` compatibility property.
- Preserved the IndexedDB database/store, card record shape, validation messages, 1000 px image dimension limit, JPEG compression quality (0.82), cost ranges, and marketplace/manager refresh flow.
- Bumped the service-worker cache version to `standout-v2.19-custom-card-creator-module`.
- [ ] Verify image selection/compression, create/edit validation, card save/update, modal close/reset, manager refresh, and reload persistence in a real browser.


## Sprint 28 — Hidden cheat controls consolidation

- Moved the five-second reset-button hold gesture, cheat modal lifecycle, code validation, point grant, and day-skip action into `JS/features/cheats.js`.
- Registered the feature as `StandOutCore.cheats` and initialized its reset-button listeners from modular bootstrap.
- Preserved the existing `Thala` code, 9999-point grant, daily counter reset, day-skip storage keys, notification messages, vibration feedback, and legacy global function names.
- Kept the legacy app as owner of its lexical counters; the feature receives explicit getter/setter callbacks rather than duplicating application state.
- Made reset-button binding null-safe and idempotent; added touch-cancel and blur cancellation to avoid a stale hold timer.
- Bumped the service-worker cache version to `standout-v2.20-cheat-controls-module` and added the module to the app shell.
- [ ] Verify five-second hold/cancel behavior, invalid and valid cheat codes, point counter update, day skip, touch and mouse interaction, and offline startup in a real browser.


## Sprint 29 — Local data persistence consolidation

- Extracted `saveData()` and `loadData()` from the legacy `JS/app-part3.js` script into `JS/features/data/persistence.js`.
- Registered the module as `StandOutCore.dataPersistence` and retained `window.saveData` / `window.loadData` compatibility entry points.
- Preserved the existing localStorage keys (`completedMissionCount`, `missionHistory`, `completedMissions`, `missions`, `skills`, and `goals`) and HTML snapshot persistence format.
- Preserved mission state-attribute restoration, mission edit click binding, Skills initialization, Goals remove-button binding, and mission counter refresh.
- Kept feature dependencies behind existing global compatibility functions; no storage migration or record-format changes were introduced.
- Added the module to the service-worker app shell and bumped the cache version to `standout-v2.21-data-persistence-module`.
- [ ] Verify save/load, mission flag restoration, skill XP, goal interactions, malformed mission-history fallback, and reload persistence in a real browser.


## Sprint 30 — Reset and data-management extraction

- Extracted the complete factory-reset workflow from `JS/app-part3.js` into `JS/features/data/reset.js` and registered it as `StandOutCore.dataManagement`.
- Split resettable interface cleanup into `JS/features/data/reset-ui.js`, keeping DOM clearing and feature-view refreshes separate from reset orchestration.
- Preserved the legacy `resetData` entry point used by the Account confirmation dialog.
- Routed reset state through existing compatibility surfaces (`window.ownedCards`, `window.missionHistory`, and `window.soundSettings`) instead of assigning to inaccessible ES-module lexical variables.
- Preserved the full `localStorage.clear()` factory-reset behavior, Season reset, built-in card catalogue retention, background cleanup, timer cleanup, monthly report cleanup, notification reset, and existing completion/failure alerts.
- Added both modules to the service-worker app shell and bumped the cache version to `standout-v2.22-data-management-module`.
- [ ] Verify the Account reset confirmation, audio shutdown, Season reset, custom card removal, background reset, all list/counter resets, monthly report reset, and reload behavior in a real browser.


## Sprint 31 — IST date and daily-cycle extraction

- Extracted India Standard Time date utilities (`getISTDate`, `getTodayKey`) and daily improvement-counter reset logic into `JS/features/data/daily-cycle.js`.
- Registered the feature as `StandOutCore.dailyCycle` and moved its load-time and 60-second reset scheduling into an idempotent feature initializer.
- Preserved the `Asia/Kolkata` timezone, `en-CA` date-key format, `dailyImprovementCount` and `lastImprovementDate` storage keys, reset conditions, and mission-progress counter refresh.
- Retained classic-script compatibility wrappers for `getISTDate`, `getTodayKey`, and `enforceDailyReset`.
- Added a `window.lastImprovementDate` getter/setter bridge so extracted module state stays synchronized with legacy backup/restore code.
- Added the feature to the service-worker app shell and bumped the cache version to `standout-v2.23-daily-cycle-module`.
- [ ] Verify IST date rollover around midnight, daily improvement reset, backup/restore of the last improvement date, mission progress refresh, and offline startup in a real browser.


## Sprint 31.1 — Runtime path and Daily Challenge hotfix

- Fixed the Daily Challenge date lookup so it validates the legacy `getTodayKey()` result and falls back to a direct `Asia/Kolkata` date formatter if the modular bridge is not ready yet. This prevents an undefined date from reaching the deterministic challenge-index calculation.
- Removed the duplicate origin-root service-worker registration from `JS/app-part1.js`; `index.html` remains the single registration point and uses a document-relative script URL.
- Made service-worker app-shell, welcome-video, background-asset, and offline-index paths resolve against the worker registration scope. This supports serving the app from either the domain root or a project subfolder such as `/Stand-Out-main/`.
- No user data, storage keys, or feature behavior was intentionally changed.
- Bumped the service-worker cache version to `standout-v2.23.1-daily-cycle-hotfix`.
- [ ] Verify startup from both a root Live Server workspace and a nested project-folder URL; verify Daily Challenge renders, service-worker assets resolve under the registration scope, and optional missing media remain non-fatal.


## Sprint 32 — Improvement Points economy extraction

- Extracted the shared `addImprovementPoints(amount)` operation into `JS/features/economy/points.js` and registered it as `StandOutCore.points`.
- Preserved the `completedMissions` balance, its existing LocalStorage key, non-positive amount behavior, mission counter update, and marketplace refresh.
- Kept `window.addImprovementPoints(amount)` as a compatibility wrapper for Season rewards and existing callers.
- The module uses the existing `window.completedMissions`, `window.currentMarketplaceFilter`, and `window.renderMarketplace` compatibility surfaces; no parallel balance state was introduced.
- Added the feature to the service-worker app shell and bumped the cache version to `standout-v2.24-points-economy-module`.
- [ ] Verify Season point grants, positive/zero/negative amounts, counter refresh, marketplace refresh, and reload persistence in a real browser.


### Sprint 33 — Mission Progression Rules

- [x] Centralize the daily Improvement Points earning cap and mission achievement thresholds in `JS/features/missions/progression.js`.
- [x] Register the shared configuration as `StandOutCore.progression`.
- [x] Make mission completion import the shared daily cap instead of maintaining a duplicate constant.
- [x] Route achievement milestone checks and progress indicators through the shared configuration.
- [x] Preserve the existing threshold sequence: 1; every 5 through 250; every 10 from 260 through 500; every 20 from 520 through 2000.
- [x] Preserve the daily cap at 10 and all existing UI/storage behavior.
- [x] Add the new module to the service-worker app shell and update its cache version.
- [x] Run syntax, progression-sequence, integration smoke, and diff checks.

**Compatibility note:** This sprint centralizes configuration only. It does not change mission reward behavior, achievement definitions, LocalStorage keys, or saved data.


### Sprint 34 — Complete Backup & Restore refactor (corrected)

- Removed the obsolete `getAppSnapshot()` / `restoreAppSnapshot()` compact-snapshot workflow and the previous `saveProgressToFile()` / `loadProgressFromFile()` monolithic implementations from both active `app-part1.js` and the inactive legacy `app.js` archive.
- Replaced the Account actions with `downloadStandOutBackup()` and `restoreStandOutBackup()`, backed by `JS/features/data/backup.js` and `JS/features/data/restore.js`.
- Registered the new features as `StandOutCore.backup` and `StandOutCore.restore`; removed the old backup/restore globals from the active runtime.
- Backup format v5 captures all LocalStorage entries, supported runtime state, the runtime card catalogue, custom cards from IndexedDB, and the custom background image from its IndexedDB store. Custom audio remains explicitly excluded.
- Restore validates the file before changing data, supports the prior `STANDOUT_COMPLETE` v4 backup shape, restores the original `standout_daily_challenge` key, and replaces custom-card/background IndexedDB data when those payloads are present.
- Restore snapshots current LocalStorage and affected IndexedDB state and attempts rollback if applying the backup fails.
- Removed the unused hidden compact-snapshot file input and obsolete `snapshot.js` module.
- Added an atomic `replaceAll` operation to the Custom Cards feature for restore.
- Updated the service-worker app shell and cache version to `standout-v2.27-backup-restore-modules`.
- [ ] Verify backup download, v5 restore, legacy v4 restore, custom cards/background restoration, LocalStorage/runtime state, cancel behavior, and reload after successful restore in a real browser.

**Compatibility note:** The new restore still replaces all LocalStorage for the current origin, matching the previous restore behavior. Back up important data before testing. Custom audio is not included.


### Sprint 35 — Notification state ownership

- Moved initialization and ownership of the `appNotifications` runtime array into `JS/features/notifications/notifications.js`.
- Preserved the global `window.appNotifications` getter/setter compatibility surface used by backup, restore, reset, and other features.
- Preserved the `appNotifications` LocalStorage key and notification record shape (`title`, `msg`, `time`).
- Added safe handling for malformed stored notification JSON so a damaged value falls back to an empty notification list instead of preventing feature initialization.
- Removed the unused `dailyGoalReminder()` function from `app-part1.js`; repository-wide search confirmed no active HTML or JavaScript caller.
- No notification rendering, unread-count, drawer, persistence, or user-facing behavior was intentionally changed.
- Bumped the service-worker cache version to `standout-v2.28-notification-state-module`.
- [x] Run syntax, malformed-storage, state ownership, push/save, clear, and compatibility smoke checks.
- [ ] Verify notification load/save, unread badge, drawer open/close, clear-all, backup/restore, and reload persistence in a real browser.


### Sprint 36 — Goals state ownership

- Moved initialization and runtime ownership of `goalsData` from `JS/app-part3.js` into `JS/features/goals/goals.js`.
- Preserved the `window.goalsData` getter/setter compatibility interface for backup/restore, monthly reports, badges, and existing integrations.
- Preserved the `goalsData` LocalStorage key, array record format, and existing goal CRUD/achievement behavior.
- Added safe fallback for malformed or non-array stored goal data.
- Updated the Badges feature to read `window.goalsData` explicitly rather than relying on the removed classic-script lexical binding.
- Exposed state accessors on `goalsFeature` for future module consumers.
- Updated the service-worker cache version to `standout-v2.29-goals-state-module`.
- [ ] Verify goal creation, editing, deletion, achievement, badge/monthly report counts, backup/restore, reset, and persistence in a real browser.


### Sprint 37 — Countdown state ownership

- Moved initialization and runtime ownership of the countdown array into `JS/features/countdowns/countdowns.js`.
- Preserved `window.countdowns` as a compatibility getter/setter for backup, restore, reset, and existing classic-script integrations.
- Preserved the `countdowns` LocalStorage key and existing countdown record shape.
- Added a safe fallback for malformed or non-array stored countdown data.
- Removed the duplicate legacy countdown state declaration from `JS/app-part3.js`; retained the existing countdown function wrappers.
- Bumped the service-worker cache version to `standout-v2.30-countdown-state-module`.
- [ ] Verify countdown creation, removal, persistence, restore, reset, and live timer updates in a real browser.


### Sprint 38 — Marketplace view state ownership

- Moved ownership of `currentMarketplaceFilter` and `isMarketplaceOpen` from `JS/app-part1.js` into `JS/features/cards/marketplace.js`.
- Preserved `window.currentMarketplaceFilter` and `window.isMarketplaceOpen` as enumerable getter/setter compatibility accessors for navigation, cards, goals, points, and other existing feature integrations.
- Exposed `getCurrentFilter()`, `setCurrentFilter()`, `isOpen()`, and `setOpen()` on `cardsFeature` for module consumers.
- Preserved the default filter (`ALL`), fallback behavior for empty filter values, and boolean coercion for marketplace-open state.
- Removed the duplicate classic-script declarations and accessor definitions from `app-part1.js`; no marketplace rendering, sorting, purchase, navigation, or persistence behavior was changed.
- Bumped the service-worker cache version to `standout-v2.31-marketplace-state-module`.
- [ ] Verify filter selection, marketplace open/close navigation, collection tab switching, card purchases, points refresh, and navigation interactions in a real browser.


### Sprint 39 — Mission History state ownership

- Moved initialization and runtime ownership of `missionHistory` from `JS/app-part1.js` into `JS/features/missions/history.js`.
- Preserved `window.missionHistory` as a getter/setter compatibility interface for persistence, backup/restore, reset, monthly reports, badges, and classic-script integrations.
- Added safe handling for malformed or non-object stored mission-history JSON.
- Updated Daily Challenge to write through `window.missionHistory` rather than the removed classic-script lexical variable.
- Exposed `getMissionHistory()` and `setMissionHistory()` on `StandOutCore.missionHistory`.
- Preserved the `missionHistory` LocalStorage key and existing event/date record format.
- Updated the service-worker cache version to `standout-v2.32-mission-history-state-module`.
- [ ] Verify mission completion/missed history, Daily Challenge history, monthly reports, badges, backup/restore, reset, and reload persistence in a real browser.


### Sprint 40 — Owned-card state ownership

- Moved initialization and runtime ownership of the `ownedCards` object from `JS/app-part1.js` into `JS/features/cards/marketplace.js`, alongside the marketplace and collection workflows that consume it.
- Preserved `window.ownedCards` as an enumerable getter/setter compatibility surface for Season rewards, custom-card workflows, backup/restore, reset, and classic-script integrations.
- Added safe validation for malformed, non-object, and array-shaped stored values; invalid state falls back to an empty object without changing the existing storage key.
- Exposed `getOwnedCards()` and `setOwnedCards()` through `StandOutCore.cards`.
- Removed the legacy duplicate state declaration and accessor from `app-part1.js`. No card purchase, ownership record, mint timestamp, or rendering behavior was intentionally changed.
- Bumped the service-worker cache version to `standout-v2.33-owned-card-state-module`.
- [ ] Verify collection rendering, card purchase, Season rewards, custom-card ownership, backup/restore, reset, and reload persistence in a real browser.


### Sprint 41 — Daily-cycle state ownership

- Moved initialization and runtime ownership of `dailyImprovementCount` and `lastImprovementDate` from `JS/app-part1.js` into `JS/features/data/daily-cycle.js`, alongside the IST date and daily-reset logic.
- Preserved enumerable `window.dailyImprovementCount` and `window.lastImprovementDate` getter/setter compatibility interfaces for mission completion, achievements, cheats, backup/restore, and classic-script integrations.
- Preserved both LocalStorage keys, the numeric counter semantics, the IST date-key format, and the existing daily-reset schedule. A missing stored date now initializes from the existing IST date-key helper.
- Updated the remaining classic-script achievement and cheat bridges to use the compatibility properties instead of removed global lexical bindings.
- Exposed daily-counter and date accessors through `StandOutCore.dailyCycle` for future module consumers.
- Bumped the service-worker cache version to `standout-v2.34-daily-cycle-state-module`.
- [ ] Verify daily point limits, midnight IST reset, achievement counters, skip-day cheat, backup/restore, and persistence after reload in a real browser.


### Sprint 42 — Improvement Points balance ownership

- Moved initialization and runtime ownership of the `completedMissions` Improvement Points balance from `JS/app-part1.js` into `JS/features/economy/points.js`.
- Preserved the existing `window.completedMissions` compatibility property, numeric coercion behavior, `completedMissions` LocalStorage key, and point balance semantics.
- Exposed `getBalance()` and `setBalance()` through `StandOutCore.points` for future module consumers.
- Updated Daily Challenge and the classic cheat bridge to access the balance explicitly through `window.completedMissions`.
- Updated the early classic-script counter paint to read the existing LocalStorage value directly, avoiding a dependency on the module accessor before the bootstrap has executed.
- Kept all reward, spending, penalty, persistence, counter-rendering, and marketplace-refresh behavior unchanged.
- Bumped the service-worker cache version to `standout-v2.35-points-balance-state-module`.
- [ ] Verify mission rewards, Daily Challenge reward, goal rewards/penalties, card purchases, cheat controls, backup/restore, and reload persistence in a real browser.

**Compatibility note:** The balance remains a single shared currency value, not a completed-mission count. The separate `completedMissionCount` metric is owned by the Mission Completion feature as of Sprint 44.


### Sprint 43 — Card purchase transaction fix

- Removed the duplicate Improvement Points deduction from the marketplace purchase confirmation callback; card costs are now applied once through `StandOutCore.points.spend()`.
- Added a reusable `spend()` / `spendImprovementPoints()` economy operation that validates the amount and available balance, persists the new balance before updating in-memory state, and returns a success/failure result.
- Kept zero-cost purchases valid while rejecting negative or non-finite spend amounts.
- Reloads and validates the latest saved card collection before charging, preserves existing collection entries (including Season rewards), and rechecks expiry, ownership, and available points after the confirmation dialog.
- Prevents a repeated confirmation callback from charging for a card already minted.
- If the balance write fails after the collection write, attempts to restore the previous collection and leaves the in-memory balance unchanged. UI refresh failures are logged without misreporting a successfully persisted spend as failed.
- Bumped the service-worker cache version to `standout-v2.36-card-purchase-transaction-fix`.
- [ ] Verify one purchase deducts exactly the listed cost, collection persists after reload, repeated confirmation does not deduct again, insufficient funds are rejected, and existing Season/custom-card entries remain intact in a real browser.


### Sprint 44 — Completed mission count state ownership

- Moved initialization and runtime ownership of `completedMissionCount` from `JS/app-part1.js` into `JS/features/missions/completion.js`.
- Preserved the existing `completedMissionCount` LocalStorage key, integer coercion/fallback behavior, and legacy `window.completedMissionCount` getter/setter interface. The accessor retains its previous non-enumerable descriptor behavior.
- Exposed `getCompletedMissionCount()` and `setCompletedMissionCount()` through `StandOutCore.missionCompletion`.
- Updated achievement/progress compatibility bridges in `app-part3.js` to read the explicit window property rather than relying on a removed classic-script lexical binding.
- Kept mission reward counting, save/restore, achievement thresholds, and backup payload formats unchanged.
- Bumped the service-worker cache version to `standout-v2.37-completed-mission-count-state-module`.
- [ ] Verify mission completion counts, achievement milestones, progress counters, persistence after reload, backup/restore, and reset behavior in a real browser.


### Sprint 45 — Integration and compatibility audit guardrails

- Added a dependency-free Node.js architecture audit at `scripts/architecture-audit.mjs`.
- The audit recursively resolves the modular bootstrap import graph and verifies every imported module is included in the service-worker app shell.
- The audit checks that the active HTML loads the legacy compatibility scripts before the modular bootstrap, does not load the inactive monolithic `JS/app.js`, and registers the service worker exactly once using the app-relative path.
- Normalized the mission-management module path in the service-worker app-shell list for consistent path declarations.
- Bumped the service-worker cache version to `standout-v2.38-architecture-audit-guardrails`.
- The audit is run with `node scripts/architecture-audit.mjs`; it is read-only and safe to run during development.
- [ ] Verify online startup, offline reload, module updates, and existing app workflows in a real browser.


### Sprint 46 — Release readiness and subfolder PWA audit

- [x] Correct PWA `start_url` and `scope` to be relative to the manifest location, supporting project-subfolder deployment.
- [x] Correct the manifest icon MIME type and declared dimensions to match the shipped 1254×1254 JPEG; remove the widget declaration because its referenced `widget.html` is not present.
- [x] Make the welcome-video HTML and JavaScript paths app-relative rather than domain-root-relative.
- [x] Add `scripts/release-audit.mjs` to check active HTML asset references and PWA manifest paths/icons.
- [x] Keep known missing optional media visible as warnings rather than pretending those files exist: `welcome.mp4` and `Music/Complete.mp3`.
- [x] Bump the service-worker cache version.
- [ ] Verify installability, update activation, offline navigation, media fallback, backup/restore, and core workflows in a real browser on both root and project-subfolder deployment paths.

**Release note:** Static audits pass, but the repository does not contain `welcome.mp4` or `Music/Complete.mp3`. Those media references remain optional/missing and must be restored or intentionally removed before a fully polished release. Real-browser validation is still outstanding; this sprint does not certify production readiness.


### Sprint 47 — Security foundation

- [x] Render newly created and edited mission names through `textContent` instead of interpolating user-entered text into HTML.
- [x] Add `SECURITY.md` with the client-only threat model, known risks, and security change policy.
- [x] Add a dependency-free source audit for unsafe dynamic execution APIs and the mission text-rendering invariant.
- [x] Record remaining high-priority work: HTML-backed snapshot restoration, remaining dynamic HTML sinks, inline JavaScript/CSP migration, and third-party asset review.
- [ ] Sanitize or replace legacy HTML snapshot restoration without losing existing mission/skill/goal data or interactions.


## Sprint 59 — Architecture assessment and migration plan

This sprint is assessment-only. It adds `scripts/architecture-assessment.mjs`, a read-only inventory of the active HTML script list, the modular bootstrap import graph, active legacy classic scripts, approximate line counts, `window` assignments, and inline HTML event-handler attributes. It does not change runtime behavior, persistence, or the service-worker cache.

### Verified current structure

- `index.html` loads 7 external JavaScript files: 6 classic scripts followed by the modular bootstrap.
- The active ES-module dependency graph contains 36 files and is loaded from `JS/core/bootstrap.js`.
- The active classic-script layer contains approximately 3,217 lines across `welcome.js`, `cards.js`, `app-part1.js`, `app-part2.js`, `app-part3.js`, and `season.js`.
- `JS/season.js` is the largest active classic script at approximately 2,134 lines and is a stronger extraction candidate than the inactive monolithic archive.
- `JS/app.js` is approximately 9,132 lines but is commented out in `index.html` and is not part of the active startup path. Do not split or re-enable it as part of the migration; treat it as a historical archive until a separate comparison proves otherwise.
- `index.html` still contains 39 inline event-handler attributes. They are a remaining CSP and UI-coupling constraint.
- The 36-file module graph and service-worker app-shell coverage continue to pass the architecture audit.

### Architectural risks and decisions

1. **Legacy global boundary:** `app-part2.js`, `app-part3.js`, and `season.js` publish multiple `window` assignments. Existing modules and classic scripts depend on some of these compatibility surfaces. Do not remove a bridge based on a text search alone; map callers and preserve backup/restore/reset behavior.
2. **Season feature concentration:** `season.js` combines season state, progression/rewards, UI rendering, and card grants. It is the recommended first feature for a staged extraction, but only after a function-level dependency map and browser regression plan exist.
3. **Mixed startup model:** classic scripts execute before the deferred module bootstrap. This order is intentional and currently audited. Do not reorder scripts or move initialization without explicit startup tests.
4. **Shared state:** storage keys and global compatibility properties are cross-feature contracts. Keep the existing keys and record formats; move ownership one state domain at a time.
5. **Inactive archive:** `JS/app.js` is not an active maintenance target. Avoid duplicating fixes there unless it is deliberately reactivated (not recommended).

### Recommended migration order

- First: map and extract `season.js` into focused season modules (state/catalogue, progression/rewards, UI) while retaining a thin compatibility facade for existing callers.
- Second: migrate remaining responsibilities from `app-part1.js`, `app-part2.js`, and `app-part3.js` into their owning feature modules; remove a legacy declaration only after all consumers use the module API or an intentional bridge.
- Third: migrate `welcome.js` and `cards.js` only where clear ownership boundaries exist.
- Fourth: replace inline HTML handlers with event listeners before considering strict CSP. The startup service-worker registration script was externalized in Sprint 75; 41 inline event attributes remain in the current HTML audit inventory.
- At each step: preserve LocalStorage/IndexedDB/Cache API contracts, backup schema, UI IDs/classes, and script startup order; run the architecture, security, and release audits; require manual browser verification before accepting behavior changes.

### Sprint 59 validation

- [x] Add a read-only architecture assessment script.
- [x] Confirm the active bootstrap graph resolves to 36 files.
- [x] Confirm `JS/app.js` is inactive and not loaded.
- [x] Inventory active legacy scripts and identify `season.js` as the largest active extraction candidate.
- [x] Record inline handler and legacy global coupling as remaining constraints.
- [ ] Complete a function-level dependency map for Season before extraction.
- [ ] Verify startup, season rewards, card grants, backup/restore, reset, and offline behavior in a real browser.


## Sprint 60 — Season dependency mapping

- Added `SEASON-DEPENDENCY-MAP.md` with the current Season public API, active XP callers, reset integration, card/economy/achievement/badge/notification dependencies, DOM contracts, storage keys and record shapes, and a staged extraction sequence.
- Identified Monthly Resolution as a separate feature currently co-located after the Season IIFE in `JS/season.js`; it has its own `monthlyResolutionData` key, DOM controls, initialization listener, and three `window` compatibility entry points.
- Recorded the active Season 03 configuration exactly as present in source, including the mismatch between the configured Improvement Point amounts and the reward title strings. No source behavior was silently corrected.
- Confirmed that the active Season callers are Mission Completion (10 XP), Achievements (25 XP), Daily Challenge (25 XP), and the full reset flow. Similar calls in `JS/app.js` are historical only because that file is not loaded.
- **No JavaScript, HTML, CSS, service-worker cache, or persistence code changed.** This is a documentation-only sprint; no browser behavior is claimed as tested.


## Sprint 61 — Season core extraction

- [x] Extract the Season 03 configuration into `JS/features/season/season-core.js`.
- [x] Extract the default Season state factory and level calculation as pure exported functions.
- [x] Keep `JS/season.js` as the compatibility/runtime layer and preserve `window.StandOutSeason` with the same method names and `SEASON` property.
- [x] Preserve `standoutSeasonState`, its default record shape, configured reward values/titles, dates, and level cap.
- [x] Convert the Season runtime entry to a deferred ES module so it can import the pure core. Preserve the three explicit Monthly Resolution window entry points.
- [x] Add the new core module to the service-worker app shell and advance the cache namespace.
- [x] Update the architecture assessment to distinguish module entry points from classic scripts.
- [x] Run source-level syntax, architecture, security, release, and diff checks plus pure-function boundary tests.
- [ ] Verify Season initialization, Monthly Resolution controls, XP awards, rewards, reset, reload, and offline startup in a real browser.

**Compatibility note:** This is the first code extraction only. `JS/season.js` still owns storage I/O, reward progression/claiming, DOM rendering, timers, and cross-feature integrations. `window.StandOutSeason` remains the existing public bridge. Monthly Resolution remains physically in `JS/season.js` but its three public functions are explicitly assigned to `window` because the file is now an ES module. No storage migration or reward rebalance was performed. Browser testing was not performed in this sprint.


### Sprint 62 — Season persistence boundary

- [x] Extracted Season LocalStorage reads, writes, and reset behavior into `JS/features/season/season-state.js`.
- [x] Kept the existing `standoutSeasonState` key, default record shape, season-ID mismatch fallback, merge behavior, rewards-object fallback, and warning messages.
- [x] Kept the `window.StandOutSeason` public API and all existing callers unchanged.
- [x] Added the state module to the service-worker app shell and advanced the cache to `standout-v2.53-season-state-persistence`.
- [x] Added dependency-injected storage support to make persistence behavior testable without changing browser defaults.

**Compatibility note:** This extraction does not migrate or rewrite stored user data. The reset path still removes only `standoutSeasonState`, then writes a fresh state using the same default structure. Reward progression, reward claims, UI, timers, and Monthly Resolution remain in their existing locations.


### Sprint 63 — Season progression and reward eligibility

- [x] Extracted XP input validation, level transition calculation, total-XP calculation, and crossed-level reporting into `JS/features/season/season-progression.js`.
- [x] Extracted the pure determination of newly eligible rewards, excluding rewards already marked unlocked.
- [x] Extracted Season progress-bar calculation into the same pure module.
- [x] Kept timestamps, reward-state mutation, logging, notifications, persistence, and rendering in `JS/season.js`.
- [x] Preserved the XP award gate for season start/completion and existing `window.StandOutSeason` API.
- [x] Added dependency-free tests for invalid XP, level transitions, multi-level jumps, reward eligibility, existing unlocks, progress percentages, and a custom season configuration.
- [x] Added the progression module to the service-worker app shell and advanced the cache to `standout-v2.54-season-progression-extraction`.
- [ ] Verify XP awards, reward unlock notifications, progress display, and persistence in a real browser.

**Compatibility note:** The extracted module is pure and does not write storage or trigger UI/notifications. The runtime still timestamps and records each newly unlocked reward, triggers existing achievement/notification integrations, saves state, and renders the Season UI. No reward values, XP thresholds, or persistence formats were changed. Browser testing was not performed in this sprint.


### Sprint 65 — Monthly Resolution feature extraction

- [x] Moved Monthly Resolution implementation into `JS/features/monthly-resolution/monthly-resolution.js`.
- [x] Kept `monthlyResolutionData`, its month-keyed record structure, date-window rules, messages, selectors, and rendering behavior unchanged.
- [x] Preserved the three public compatibility entry points: `window.renderMonthlyResolution`, `window.saveMonthlyResolution`, and `window.answerMonthlyResolution`.
- [x] Added explicit initialization after the Season runtime IIFE so the original DOMContentLoaded listener registration order remains Season first, Monthly Resolution second.
- [x] Added the module to the service-worker app shell and advanced the cache namespace to `standout-v2.56-monthly-resolution-extraction`.
- [x] Updated the security audit to inspect the new feature-owned module rather than its former location.
- [x] Added a focused initialization/compatibility smoke test.
- [ ] Verify first-five-day editing, locked-period display, last-day review, persistence across reload, and offline startup in a real browser.

**Compatibility note:** No storage migration or data rewrite was performed. Monthly Resolution still uses the `monthlyResolutionData` LocalStorage key and the same `YYYY-MM` records. Its public window functions and DOM IDs/classes are unchanged. Browser testing was not performed.


## Sprint 66 — App-part dependency mapping

- Added `APP-PART-DEPENDENCY-MAP.md` with the active loading contract, responsibilities of each app-part file, global compatibility surface, module owners, important DOM hooks, shared state, initialization timing, duplicate deadline-check observation, and staged extraction order.
- Verified the active script order from `index.html`: `welcome.js`, `cards.js`, `app-part1.js`, `app-part2.js`, `app-part3.js`, `season.js` module, then `core/bootstrap.js` module.
- Confirmed `JS/app.js` remains commented out and inactive; it is not treated as a live dependency source.
- Mapped app-part1 to app-shell/update UI, date-cycle bridges, Monthly Report toggle, music bridges, and a deadline-check load listener.
- Mapped app-part2 to navigation/dialog/timer bridges, mission completion, points, and recurring-mission scheduler bridges.
- Mapped app-part3 to achievement/skill/goal/countdown/data/reset/cheat/card bridges plus the main load-time initialization sequence and immediate goal-card setup.
- Recorded global names, storage/shared-state touchpoints, DOM selectors, classic-script global semantics, and timing constraints that must survive ES-module conversion.
- Identified a duplicate `checkMissedDeadlines()` invocation path across app-part1 and app-part3. No call was removed because scheduler idempotence and behavior require runtime verification.
- **Documentation-only sprint:** no JavaScript, HTML, CSS, service-worker cache, LocalStorage, or IndexedDB behavior changed.
- Static architecture, security, release, and diff checks passed. Known CSP/third-party warnings and missing optional media assets remain. No browser testing was performed.


## Sprint 67 — App-shell UI extraction

- [x] Extracted service-worker update indicator rendering and animation into `JS/features/app-shell.js`.
- [x] Extracted the Monthly Report icon toggle into the app-shell module while preserving `#monthlyReportIcon`, `#monthlyReport`, `#missions`, the active-class behavior, `renderMonthlyReport()`, and `updatePlusBtn()` calls.
- [x] Preserved `window.showUpdatingIndicator`, `window.hideUpdatingIndicator`, and `window.showUpdateReadyIndicator` as explicit compatibility entry points.
- [x] Kept date-cycle helpers, music bridges, and the deadline-check load listener in classic `JS/app-part1.js`. The obsolete catalogue fallback was removed in Sprint 72.
- [x] Loaded the app-shell module after `JS/core/bootstrap.js` so the modular navigation and notification bridges are initialized before the extracted UI integration runs.
- [x] Added `JS/features/app-shell.js` to the service-worker app shell and advanced the cache namespace to `standout-v2.57-app-shell-extraction`.
- [x] Expanded architecture/security assessment to include all active module entry points, not only the core bootstrap graph.
- [x] Added focused app-shell tests for indicator creation/removal/animation, update-ready notification, Monthly Report open/close, and navigation bridge calls.
- [ ] Verify update indicator behavior, Monthly Report navigation, PWA update lifecycle, and offline startup in a real browser.

**Compatibility note:** The Monthly Report toggle still activates the report section, calls the existing report renderer, and updates the global Add-button context exactly as before. The update indicator global names remain available. No persistence format or user data changed. Static checks and focused Node tests passed; browser testing was not performed.

## Sprint 69 — App-part3 compatibility bridge extraction

- Added `JS/features/app-part3-compatibility.js` and registered its explicit global bridge API after `StandOutCore` is available in `JS/core/bootstrap.js`.
- Migrated the app-part3 compatibility surface for achievement progress and popups, skills, goals, countdowns, data persistence/reset, date validation, cheat controls, minted-card UI, custom-card UI, and the custom-card image-data accessor.
- Preserved the legacy global names and function argument signatures, including `shiftRecurringDeadline`, `increaseSkillXP`, `checkMissionAchievements`, `updateMissionProgressCounters`, goal/countdown APIs, `saveData`, `loadData`, `resetData`, cheat APIs, and card APIs.
- Preserved the `load` event refresh for mission progress counters and the custom-card image-data property's configurable/enumerable getter-setter semantics.
- Reduced `JS/app-part3.js` to its existing load-time startup orchestration and immediate goal-card reveal/binding. The load sequence remains in its original order; its calls now resolve through explicit `window` compatibility names.
- Added `scripts/app-part3-compatibility-tests.mjs` covering 49 global names, delegated calls, load listener registration, utility behavior, and custom-card image-data accessor behavior.
- Added the compatibility module to the service-worker `APP_SHELL` and advanced the cache to `standout-v2.59-app-part3-compatibility-extraction`.
- Validation: app-part3 compatibility tests, legacy compatibility tests, app-shell tests, Season progression/UI tests, Monthly Resolution tests, full syntax sweep, architecture audit, security audit, security regression review (8/8 guards), release audit, architecture assessment, and `git diff --check` passed.
- The architecture audit now reports 45 active module files; the active classic-script inventory is approximately 669 lines. `JS/app.js` remains inactive and untouched.
- No LocalStorage/IndexedDB keys, record formats, user data, feature UI, or reward mechanics were changed.
- Known limitations remain: no real-browser testing was performed; no CSP is configured; third-party asset review remains; `welcome.mp4` and `Music/Complete.mp3` are missing optional assets reported by the release audit.


## Sprint 71 — Welcome and Monthly Drop extraction

- Replaced the active classic `JS/welcome.js` entry point with the ES module `JS/features/welcome-intro.js`.
- Extracted Monthly Drop date eligibility, seen-state lookup, and navigation into `JS/features/monthly-drop.js`.
- Preserved the `standOutMonthlyDropSeen` LocalStorage key, local-calendar `YYYY-MM` key format, first-day-only gate, `drop-info.html` destination, and logging behavior.
- Preserved Welcome DOM IDs, video URL, volume, readiness/error handling, Ready-button behavior, video click/ended handling, Escape-to-skip behavior, and intro exit timing.
- Loaded the Welcome module after the modular startup coordinator; it remains independent of the feature API and only binds to existing DOM.
- Added both modules to the service-worker app shell and advanced the cache version.
- Added Monthly Drop unit tests and Welcome module wiring smoke tests.
- Removed the superseded active classic Welcome script; no card catalogue records or card ownership behavior changed.
- At the Sprint 71 checkpoint, the card catalogue remained the synchronous mutable `window.cardCatalog` data contract. Sprint 72 completed its compatibility-safe module conversion.
- No LocalStorage/IndexedDB keys or record formats changed.

## Sprint 71 — Welcome and card-catalogue ownership review

- Extracted the Welcome intro into `JS/features/welcome-intro.js` and Monthly Drop eligibility/navigation into `JS/features/monthly-drop.js`.
- Preserved the Monthly Drop LocalStorage key `standOutMonthlyDropSeen`, local-calendar month key, first-day gate, and `drop-info.html` navigation.
- Preserved Welcome DOM IDs, video source, volume setting, readiness/error handling, button behavior, video click/ended handling, Escape handling, and exit timing.
- Added both modules to the service-worker app shell and loaded the Welcome module after the modular startup coordinator.
- Added `CARD-CATALOGUE-OWNERSHIP.md` documenting the existing synchronous mutable catalogue contract and active consumers.
- Converted the built-in catalogue to `JS/features/cards/catalogue-data.js`; the facade and legacy feature flows continue to resolve the live mutable/reassignable `window.cardCatalog`.
- Added focused Monthly Drop and Welcome wiring tests. No card records, card IDs, prices, expiry values, images, or storage contracts were changed.


## Sprint 72 — Built-in card catalogue module conversion

- [x] Moved the exact built-in catalogue records into `JS/features/cards/catalogue-data.js`.
- [x] Publish the canonical array as `window.cardCatalog` during module dependency evaluation.
- [x] Make the catalogue facade import the data module and continue resolving the live global on every read.
- [x] Removed the active classic `JS/cards.js` script and its obsolete `app-part1.js` empty-array fallback.
- [x] Replaced the old card data path in the service-worker app shell and advanced the cache version.
- [x] Added regression coverage for the 43-record catalogue checksum, global publication, reassignment semantics, and startup architecture.
- [x] Preserved all storage formats and card business logic.

**Ordering contract:** `JS/core/bootstrap.js` imports `features/cards/catalogue.js`, which imports `catalogue-data.js`. The ES-module loader evaluates the data dependency before the bootstrap body; the legacy classic scripts no longer create a competing empty catalogue.

## Sprint 76 — Static HTML event delegation

- Replaced 38 active click-handler attributes and one input-handler attribute in `index.html` with inert action metadata. The music-volume control now uses delegated `input` handling.
- Replaced the guide page's inline history navigation handler with a delegated action.
- Added `JS/core/event-delegation.js` after the modular bootstrap sequence. It uses an explicit immutable action allow-list and document-level click/input listeners; no string evaluation is used.
- Removed the fallback dynamic inline `onclick` assignment from the global Add compatibility bridge. The fallback now registers one listener and reads an inert `data-*` value.
- Added `scripts/event-delegation-tests.mjs` and architecture/security regression guards. The tests check all 40 migrated action metadata entries, both active HTML pages, dispatch behavior, unknown-action rejection, and cache coverage.
- Added the module to `service-worker.js` APP_SHELL and advanced the cache to `standout-v2.64-delegated-html-actions`.
- Static assessment now reports zero inline HTML event-handler attributes in the active index page.
- No LocalStorage/IndexedDB keys, backup formats, card records, or user-data formats changed.
- Remaining work includes programmatic `.onclick` property assignments, inline styles, HTML sink review, third-party asset review, real-browser verification, and a carefully staged CSP. Production readiness is not certified.
