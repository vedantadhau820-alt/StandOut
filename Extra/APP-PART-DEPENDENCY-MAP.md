# App-Part Dependency Map

## Sprint 66 scope

This document maps the three active classic-script compatibility files before extraction. It is based on `index.html`, the three source files, `JS/core/bootstrap.js`, active feature modules, and the current static audit scripts.

**Documentation-only sprint:** no runtime code, HTML, CSS, persistence, or service-worker cache was changed.

## 1. Active loading contract

`index.html` currently loads the active application scripts in this order:

1. `JS/app-part1.js` — classic compatibility layer
2. `JS/app-part2.js` — classic compatibility layer
3. `JS/app-part3.js` — classic compatibility layer
4. `JS/season.js` — ES module entry point
5. `JS/core/bootstrap.js` — ES module entry point
6. `JS/features/app-shell.js` — ES module entry point
7. `JS/features/startup.js` — ES module entry point
8. `JS/features/welcome-intro.js` — ES module entry point

`JS/features/cards/catalogue-data.js` is not a standalone HTML script. It is imported by `JS/features/cards/catalogue.js`, which is imported by `JS/core/bootstrap.js`. The module dependency graph publishes the built-in mutable `window.cardCatalog` before the bootstrap body executes. The old classic `JS/cards.js` script and the `app-part1.js` empty-array fallback were removed in Sprint 72.

An inline startup script appears before the external scripts. Classic scripts execute in document order; module entry points are deferred and execute in document order after parsing. The bootstrap must remain after the legacy compatibility scripts. The Welcome module must remain after the startup coordinator.

`JS/app.js` is commented out in `index.html`. It is an inactive historical archive, not a valid source of active caller dependencies for this migration.

## 2. Responsibilities by file

### `JS/app-part1.js` — app shell, date and music bridges

| Lines | Responsibility | Current owner / dependency |
|---|---|---|
| 5–17 | IST date, today-key, and daily-reset compatibility functions | `StandOutCore.dailyCycle`; active daily-cycle, mission, goal, momentum, Season and report code consume date helpers |
| 31–40 | Music compatibility bridges | `StandOutCore.music`; some names are called by inline HTML handlers and feature modules |
| 54–56 | Window-load deadline check | `StandOutCore.missionScheduler.checkMissedDeadlines()` |
| 1–61 | Compatibility comments and retained classic-script shims | No card-catalogue data or fallback initialization remains here |

**Coupling:** the Monthly Report toggle calls `updatePlusBtn`, declared in app-part2. The load listener calls `checkMissedDeadlines`, also bridged by app-part2. Music bridge names remain part of the legacy global surface. Date helpers are compatibility wrappers around the daily-cycle module.

**Timing:** `monthlyReportIcon` is captured once at classic-script evaluation. Extraction must preserve the fact that markup is already present when this script executes and preserve listener attachment timing.

### `JS/app-part2.js` — navigation, dialogs, mission and scheduler bridges

| Lines | Responsibility | Current owner / dependency |
|---|---|---|
| 1 | Initial mission counter display | `localStorage.completedMissions`; `#missionCounter` |
| 7–37 | `showPage` / `updatePlusBtn` bridges and fallbacks | `StandOutCore.navigation`; fallback changes sections, bottom-nav buttons, marketplace state, and Add-button inline handler |
| 42–44 | Timer bridges | `StandOutCore.timer` |
| 57–71 | Modal, alert and confirmation bridges | `StandOutCore.modals`; active callers include HTML and multiple feature modules |
| 84–92 | Mission completion bridge | `StandOutCore.missionCompletion`; global `completeMission` |
| 95–97 | Improvement Point bridge | `StandOutCore.points.add()` |
| 105–124 | Recurring mission key, refresh, reset and deadline-check bridges | `StandOutCore.missionScheduler`; used by app-part1/app-part3 orchestration and mission features |

**Coupling:** this is the highest-risk compatibility boundary. `customAlert`, `customConfirm`, and `closeModal` have active callers across multiple feature modules. Keep exact global names and signatures until every consumer is migrated and verified.

**Fallback debt:** `updatePlusBtn()` uses `setAttribute("onclick", ...)` if modular navigation is unavailable. This is a known CSP/security debt. Do not redesign it as part of bridge extraction; first prove the modular navigation API is always initialized before fallback use.

### `JS/app-part3.js` — feature bridges and startup orchestration

| Lines | Responsibility | Current owner / dependency |
|---|---|---|
| 1–2 | Scheduler and skill-XP bridges | `StandOutCore.missionScheduler`, `StandOutCore.skills` |
| 12–47 | Mission achievement counters and motivation popup bridges | `StandOutCore.achievements`, `StandOutCore.progression` |
| 53–58 | Skill bridges | `StandOutCore.skills` |
| 70–93 | Goal API bridges and `escapeHTML` helper | `StandOutCore.goals`; `escapeHTML` is also consumed by active feature modules |
| 105–109 | Countdown bridges | `StandOutCore.countdowns` |
| 120–147 | Data persistence and full reset bridges | `StandOutCore.dataPersistence`, `StandOutCore.dataManagement` |
| 151–154 | Date-time helper | `isPastDateTime`; active mission and goal code use this compatibility helper |
| 160–200 | Main `window.load` initialization sequence | Daily reset/challenge, marketplace, recurring missions, deadlines, achievements, countdowns, goals, monthly report, music cache and navigation |
| 202–208 | Initial goal-card reveal and remove-button binding | `#goal-list .goal`, `.remove-btn` |
| 213–238 | Cheat bridges and callback adapters | `StandOutCore.cheats`, shared window state, modal and notification bridges |
| 245–254 | Minted-card reveal bridges | `StandOutCore.cards`; Season and marketplace code call the global API |
| 260–271 | Custom-card creator bridges and image-data accessor | `StandOutCore.customCards`; preserves `window.customCardImageData` |

**Coupling:** app-part3 is not just wrappers. It owns the main load-time orchestration sequence and callback adapters for cheat operations. Those side effects must be treated separately from pure bridges.

**Timing:** the initial `#goal-list .goal` query and reveal binding execute immediately at classic-script evaluation, not inside the `load` handler. Preserve this timing unless browser testing proves an equivalent replacement.

## 3. Compatibility surface inventory

The following names are exposed through classic-script function declarations or explicit `window` assignments and may be used by inline HTML, other classic scripts, or active modules. Top-level function declarations in classic scripts are browser-global; converting them to ES modules removes that implicit global behavior unless explicit bridges are retained.

- **App shell / dates:** `showUpdatingIndicator`, `hideUpdatingIndicator`, `showUpdateReadyIndicator`, `getISTDate`, `getTodayKey`, `enforceDailyReset`.
- **Music:** `cacheAllMusic`, `getCachedMusicURL`, `stopAllMusic`, `openFolderPicker`, `resumeMusicOnUserGesture`, `playCurrentTrack`, `setSelectedMusic`, `showPresetUI`, `hidePresetUI`, `closeMusicModal`.
- **Navigation / timer:** `showPage`, `updatePlusBtn`, `closeTimerSettingModal`, `applyTimerSettings`, `startStaticTimer`.
- **Dialogs:** `openModal`, `closeModal`, `customAlert`, `closeAlert`, `customConfirm`, `confirmYes`, `confirmNo`.
- **Mission / scheduler / points:** `completeMission`, `addImprovementPoints`, `getRepeatKey`, `refreshRecurringMissions`, `resetRecurringMission`, `checkMissedDeadlines`, `shiftRecurringDeadline`.
- **Achievements / skills:** `increaseSkillXP`, `checkMissionAchievements`, `updateMissionProgressCounters`, `showPopup`, `closePopup`, `addSkill`, `deleteSkillDirect`, `updateSkill`, `checkSkillLevelUp`, `deleteSkill`, `initializeSkills`.
- **Goals / countdowns:** `getGoalNow`, `saveGoals`, `getGoalReward`, `getGoalCommitmentDays`, `addGoal`, `openEditGoal`, `updateGoal`, `getGoalCompletionDate`, `getDailyGoalCompletions`, `renderGoals`, `markGoalAchieved`, `playGoalAchievementVideo`, `updateGoalTimers`, `removeGoal`, `escapeHTML`, `saveCountdowns`, `addCountdown`, `removeCountdown`, `renderCountdowns`, `updateTimers`, `isPastDateTime`.
- **Persistence / reset / cheats:** `saveData`, `loadData`, `resetData`, `startResetHold`, `cancelResetHold`, `openCheatModal`, `closeCheatModal`, `confirmCheat`, `skipDayCheat`.
- **Cards:** `showMintedCard`, `closeMintedCard`, `openCustomCardModal`, `closeCustomCardModal`, `createCustomCard`, `resetCustomCardForm`, `updateCustomCardCostRange`, and the `customCardImageData` getter/setter.

Do not remove a bridge based only on a text search. Inline HTML, dynamically constructed handler strings, reset/restore paths, and feature modules may consume the contract.

## 4. Shared state and DOM contracts

### Shared state

- `completedMissions` is read directly from LocalStorage by app-part2 to initialize `#missionCounter`.
- Mission/daily-cycle values are accessed through `window` compatibility state by scheduler, completion, reset and cheat adapters.
- `window.cardCatalog` is a mutable shared array initialized by `JS/features/cards/catalogue-data.js` through the bootstrap dependency graph; custom-card creation and marketplace rendering rely on its live reassignment semantics.
- `window.customCardImageData` is an accessor over `window.__standOutCustomCardImageData`; preserve getter/setter behavior and string normalization.
- `ownedCards`, goals, countdowns, achievements, points and other persistent stores are owned by feature modules. App-parts should remain bridges, not acquire persistence ownership.

### Important DOM hooks

- Update banner: `#sw-updating`
- Monthly Report navigation: `#monthlyReportIcon`, `#monthlyReport`, `#missions`
- Mission counter: `#missionCounter`
- Main navigation: `section`, `.bottom-nav > button`, `#nav-{pageId}`, `#globalAddBtn`
- Initial goals: `#goal-list .goal`, `.remove-btn`

These selectors are runtime contracts. Renaming them is outside this extraction plan.

## 5. Recommended extraction sequence

Do not extract all three files as one unit. Their responsibilities belong to existing feature modules, and their current order supports legacy global visibility.

1. **Sprint 67 — app-part1 residual shell helpers:** move update-indicator behavior and the Monthly Report toggle into a small app-shell/navigation integration module. Keep date and music global bridge names temporarily. Preserve the load-time scheduler check and verify it is not duplicated.
2. **Sprint 68 — app-part2 navigation/dialog/mission bridges:** replace wrappers with explicit compatibility exports or a facade. Keep exact names/signatures and fallback behavior. Do not change navigation/modal internals.
3. **Sprint 69 — app-part3 feature bridge groups:** migrate skills/goals/countdowns/data/cheats/cards bridges to explicit exports or a compatibility facade. Keep `escapeHTML`, `isPastDateTime`, and `customCardImageData` contracts until active consumers are moved.
4. **Sprint 70 — startup orchestration separation:** move the `window.load` sequence and immediate goal-card initialization into a dedicated startup coordinator only after verifying the full module graph is ready before `load`. Preserve once-only behavior.
5. **Final review:** verify inline HTML names, cross-feature calls, startup order, reset/backup/restore and PWA offline loading. Remove bridges only when active callers are gone and browser tests cover the replacement.

This is an estimate of four focused migration sprints plus a final integration pass. Adjust boundaries if dependency testing reveals hidden consumers.

## 6. Risks and guardrails

- Do not use inactive `JS/app.js` as a live dependency source; it contains historical duplicate implementations.
- Do not change script order casually. Classic declarations currently exist before deferred module entry points and inline handlers.
- Do not remove globals based only on `rg`; account for HTML handlers, dynamic handler strings, reset/restore and feature-module calls.
- `checkMissedDeadlines()` is invoked from app-part1's `load` listener and again in app-part3's main `load` sequence. No call was removed: verify scheduler idempotence and intended behavior first.
- Protect top-level evaluation behavior: app-part2 reads `#missionCounter` immediately; app-part3 binds existing goal cards immediately; app-part1 captures the Monthly Report icon immediately.
- Preserve all storage contracts. This mapping found no reason to change persistence ownership or saved record formats.
- Security work remains separate. Existing inline handlers and the `onclick` fallback mean bridge extraction does not complete CSP readiness.

## 7. Sprint 66 validation snapshot

- Architecture audit: passed; 42 active module files resolve and are in the service-worker app shell.
- Security audit: passed; warnings remain for absent CSP and third-party assets.
- Security release review: completed; 8/8 regression guards. Inline handlers and `innerHTML`/event-property inventories remain for future review.
- Release audit: passed with known missing optional media warnings for `welcome.mp4` and `Music/Complete.mp3`.
- Architecture assessment: completed; 7 active external scripts, 36-file bootstrap graph, 5 active legacy classic scripts, 2 module entry points, approximately 1,083 active legacy classic-script lines.
- `git diff --check`: passed.
- No browser testing was performed.
