# Season Feature Dependency Map

**Sprint:** 60 — dependency mapping only  
**Status:** source-level assessment; no runtime extraction performed

## 1. Scope and loading

- Active entry point: `index.html` loads `JS/season.js` as a classic script before `JS/core/bootstrap.js`.
- `JS/season.js` is an IIFE containing the Season feature, followed by a separate top-level Monthly Resolution feature in the same file.
- Season initialization runs immediately when the DOM is ready (or registers one `DOMContentLoaded` callback while the document is loading).
- A one-second interval calls `updateSeasonCountdown()`.
- Season DOM uses the existing `data-season-*` attributes and IDs in `index.html`; `CSS/season.css` owns Season card/progress styling.
- Monthly Resolution is not part of Season progression. It shares the file only; it has its own storage key, DOM, global entry points, and initialization.

## 2. Season public compatibility API

`window.StandOutSeason` is the only public object created by the Season IIFE. Its current methods/properties are:

| API | Responsibility |
|---|---|
| `addXP(amount, source)` | Validate and add Season XP, update level, unlock crossed rewards, persist, rerender |
| `getState()` | Return the loaded Season state |
| `getReward(level)` | Return reward configuration for a level |
| `getRewardState(level)` | Return saved unlock/claim state for a level |
| `claimReward(level)` | Grant an unlocked reward and persist its claimed state |
| `getProgress()` | Return XP/level progress data for UI or callers |
| `getTimeRemaining()` | Return remaining Season time components |
| `renderSeason()` | Repaint Season UI and run expiry check |
| `resetSeason()` | Reset only `standoutSeasonState` and rerender |
| `checkSeasonExpiry()` | Mark the Season complete when its configured end time passes |
| `calculateLevel(xp)` | Convert XP to the capped Season level |
| `SEASON` | Exposes the active Season configuration object |

Do not rename/remove these members during extraction without first migrating every consumer or retaining a compatibility facade.

## 3. Runtime callers

### XP awards

| Caller | Current award | Trigger |
|---|---:|---|
| `JS/features/missions/completion.js` | 10 XP, source `Mission` | Mission completion |
| `JS/features/achievements/achievements.js` | 25 XP, source `Achievement` | Achievement unlock |
| `JS/features/daily-challenge/daily-challenge.js` | 25 XP, source `Daily Challenge` | Daily Challenge completion |

Each caller checks that `window.StandOutSeason.addXP` exists before invoking it. Keep this optional compatibility behavior until callers are migrated deliberately.

### Reset

- `JS/features/data/reset.js` calls `window.StandOutSeason.resetSeason()` as part of the full application reset flow.
- The reset module clears LocalStorage before invoking the Season reset API. Season reset then writes a fresh `standoutSeasonState` record.
- `JS/app.js` contains similar historical calls but is inactive and not loaded. It is not a live caller.

### Internal Season interactions

- Season reward buttons are handled by a delegated document `click` listener matching `[data-season-claim]`.
- The handler calls private `claimReward(level)`, then updates the clicked button and rerenders.
- `renderSeason()` updates the Season header/status, countdown, level, progress, reward tiles, and claim controls using existing Season DOM selectors.

## 4. Cross-feature dependencies

Season reward claiming currently integrates with these existing globals/services:

| Dependency | Use |
|---|---|
| `window.addImprovementPoints(amount)` | Grant Improvement Points rewards |
| `window.playAppTone("achievement")` | Reward sound |
| `window.cardCatalog` | Mutable catalogue availability check; built-in records are initialized by the catalogue data module |
| `window.StandOutCore.cardCatalogue.getById(id)` | Preferred modular card lookup |
| `window.ownedCards` / `ownedCards` | Synchronize the in-memory owned-card collection |
| `localStorage.ownedCards` | Persist Season card ownership |
| `getISTDate()` | Preferred minted date for Season card metadata |
| `renderMarketplace()` / `renderMyCards()` | Refresh card views after card grant |
| `window.showMintedCard(card)` | Show the minted-card reveal |
| `localStorage.earnedBadges` / `renderBadges()` | Badge reward branch (currently not used by the active Season 03 reward configuration) |
| `window.unlockAchievement(id)` | Achievement reward branch and reward-unlock integration |
| `window.showSmartNotification(title, message)` | Reward unlock/claim notifications |

Several dependencies are optional and checked at runtime. Some legacy identifiers (`ownedCards`, `renderMarketplace`, `renderMyCards`, `renderBadges`, `getISTDate`) are accessed without a single consistent module API. They require careful compatibility handling in any extraction.

## 5. Persistence contracts

### Season state

- LocalStorage key: `standoutSeasonState`.
- Default/current shape:

```js
{
  seasonId: "season-03",
  xp: 0,
  level: 1,
  completed: false,
  startedAt: "2026-11-01T00:00:00+05:30",
  endedAt: null,
  rewards: {}
}
```

- Per-level reward state is written as `{ unlocked: true, claimed: false, unlockedAt: ISOString }`; claim adds `claimed: true` and `claimedAt`.
- `loadState()` overlays parsed data on defaults only when `seasonId` matches the configured Season ID. Invalid JSON or a different Season ID returns a new default state. Do not change this behavior or key as part of a structural extraction.

### Related reward stores

- Season card ownership is stored in `ownedCards` using the existing object keyed by card ID. A Season card record includes `mintedAt`, `source: "season"`, `seasonId`, and `seasonLevel`.
- The badge reward branch reads/writes `earnedBadges` as an array. Although not active in the current reward table, it is executable code and should not be silently deleted without a deliberate scope decision.

## 6. Current Season configuration (source snapshot)

- ID: `season-03`; number: `3`; name: `The Eternal Dharm`.
- Start: `2026-11-01T00:00:00+05:30`; end: `2026-11-30T23:59:59+05:30`.
- Maximum level: 20; XP per level: 150.
- Level 5: 180 Improvement Points (configured title: `100 Improvement Points`).
- Level 10: 250 Improvement Points (configured title: `200 Improvement Points`).
- Level 15: card `season_03_card` (`Jatayu`).
- Level 20: exclusive card `season_03_exclusive_card` (`Sita Maa`).

The configured reward amounts and their human-readable `title` strings do not match for levels 5 and 10. This map records the source as-is; it does not correct the discrepancy.

## 7. DOM and presentation contracts

- Season panel: `#seasonCard` and descendants with `[data-season-name]`, `[data-season-countdown]`, `[data-season-level]`, `[data-season-progress]`, `[data-season-progress-bar]`, `[data-season-reward-level]`, and `[data-season-claim]`.
- Season-owned cards section: `#seasonCardsSection` / `#seasonCards` is rendered by the separate card marketplace feature, not by the Season IIFE.
- Season-specific presentation is in `CSS/season.css`.
- Keep IDs, data attributes, classes, button states, and render timing stable during extraction.

## 8. Monthly Resolution is a separate feature

The code after the Season IIFE implements Monthly Resolution and should not be moved into a Season module simply because it is physically located in `JS/season.js`.

- Storage key: `monthlyResolutionData`.
- Public globals: `window.renderMonthlyResolution`, `window.saveMonthlyResolution`, `window.answerMonthlyResolution`.
- DOM root and controls: `#monthlyResolutionCard`, `#monthlyResolutionInput`, `#monthlyResolutionSave`, `#monthlyResolutionStatus`, `#monthlyResolutionHint`, `#monthlyResolutionReview`, `#monthlyResolutionYes`, `#monthlyResolutionNo`.
- It initializes from its own `DOMContentLoaded` listener and uses `customAlert()`.
- Its date logic uses local `Date` methods (not the Season's configured start/end timestamps).
- Keep it as a distinct migration unit, ideally under its own feature folder, with its three global bridges preserved until callers/HTML are migrated.

## 9. Recommended extraction sequence

1. Extract Season configuration and pure level/progress calculations first; retain `window.StandOutSeason` and current storage reads/writes.
2. Extract Season state persistence behind a focused state module; preserve the exact LocalStorage key and shape.
3. Extract reward progression and claiming, with explicit adapters for points, cards, badges, achievements, notifications, and sound. Do not change grant semantics in the same change.
4. Extract Season DOM rendering and delegated claim-button handling; preserve selectors and event timing.
5. Separately migrate Monthly Resolution after mapping its callers and deciding its own feature boundary.

Do not combine extraction with reward rebalance, season-date changes, UI redesign, storage migration, or security policy changes. Each step needs source audits plus manual browser checks for XP sources, level crossings, each reward type, card recovery/idempotency, countdown/expiry, reset, reload, backup/restore, and offline startup.

## 10. Sprint 60 conclusion

This sprint intentionally changes documentation only. The Season feature has enough cross-feature coupling and shared global access that moving code before defining adapters would create unnecessary regression risk. The map identifies a staged path but does not certify browser behavior or production readiness.


## Sprint 61 update — first extraction completed

`JS/features/season/season-core.js` now owns the Season configuration, `standoutSeasonState` key constant, default-state factory, and pure XP-to-level calculation. `JS/season.js` imports these exports and retains the existing runtime implementation and `window.StandOutSeason` compatibility object. The Season script is now a module entry point; the three documented Monthly Resolution public functions remain explicitly exposed on `window`.

No storage read/write behavior, reward grant behavior, reward text/value, Season dates, DOM selectors, or XP callers were changed. Remaining extraction candidates are persistence, reward progression/claiming, and UI rendering, in that order.
