/**
 * StandOut modular bootstrap.
 *
 * This is intentionally loaded after the legacy classic scripts. That ordering
 * keeps current inline handlers and global function declarations working while
 * making a stable API available to newly extracted ES modules.
 */
import { storage } from "./storage.js";
import { events } from "./events.js";
import { dom } from "./dom.js";
import { initializeNotifications } from "../features/notifications/notifications.js";
import { sound } from "../features/sound/sound.js";
import { background } from "../features/background/background.js";
import { dailyChallenge } from "../features/daily-challenge/daily-challenge.js";
import { momentum } from "../features/momentum/momentum.js";
import { mastery } from "../features/mastery/mastery.js";
import { achievementsFeature } from "../features/achievements/achievements.js";
import { badgesFeature } from "../features/badges/badges.js";
import { customCards } from "../features/cards/custom-cards.js";
import { cardsFeature } from "../features/cards/marketplace.js";
import { cardCatalogue } from "../features/cards/catalogue.js";
import { missionHistoryFeature } from "../features/missions/history.js";
import { missionManagement } from "../features/missions/management.js";
import { missionCompletion } from "../features/missions/completion.js";
import { missionScheduler } from "../features/missions/scheduler.js";
import { goalsFeature } from "../features/goals/goals.js";
import { countdownsFeature } from "../features/countdowns/countdowns.js";
import { skillsFeature } from "../features/skills.js";
import { navigation } from "../features/navigation.js";
import { timer } from "../features/timer.js";
import { modals } from "../features/modals.js";
import { music } from "../features/music.js";
import { monthlyReport } from "../features/monthly-report.js";
import { cheats } from "../features/cheats.js";
import { dataPersistence } from "../features/data/persistence.js";
import { dataManagement } from "../features/data/reset.js";
import { dailyCycle } from "../features/data/daily-cycle.js";
import { points } from "../features/economy/points.js";
import { missionProgression } from "../features/missions/progression.js";
import { backupFeature } from "../features/data/backup.js";
import { restoreFeature } from "../features/data/restore.js";
import { initializeLegacyCompatibility } from "../features/legacy-compatibility.js";
import { initializeAppPart3Compatibility } from "../features/app-part3-compatibility.js";

const notifications = initializeNotifications({ storage, dom });

const core = Object.freeze({
    version: "0.1.0",
    storage,
    events,
    dom,
    notifications,
    sound,
    background,
    dailyChallenge,
    momentum,
    mastery,
    achievements: achievementsFeature,
    badges: badgesFeature,
    customCards,
    cards: cardsFeature,
    cardCatalogue,
    missionHistory: missionHistoryFeature,
    missionManagement,
    missionCompletion,
    missionScheduler,
    goals: goalsFeature,
    countdowns: countdownsFeature,
    skills: skillsFeature,
    navigation,
    timer,
    modals,
    music,
    monthlyReport,
    cheats,
    dataPersistence,
    dataManagement,
    dailyCycle,
    points,
    progression: missionProgression,
    backup: backupFeature,
    restore: restoreFeature,
    ready: true
});

Object.defineProperty(window, "StandOutCore", {
    configurable: false,
    enumerable: true,
    writable: false,
    value: core
});

window.recordMissionPerformance = missionHistoryFeature.recordMissionPerformance;
window.calculateMonthMetrics = missionHistoryFeature.calculateMonthMetrics;
window.getRepeatKey = missionScheduler.getRepeatKey;
window.refreshRecurringMissions = missionScheduler.refreshRecurringMissions;
window.resetRecurringMission = missionScheduler.resetRecurringMission;
window.shiftRecurringDeadline = missionScheduler.shiftRecurringDeadline;
window.checkMissedDeadlines = missionScheduler.checkMissedDeadlines;

// Restore the legacy global API after direct feature aliases are registered.
initializeLegacyCompatibility(window);
initializeAppPart3Compatibility(window);

// Preserve the monthly report entry points used by restore/reset flows.
window.renderMonthlyReport = (...args) => monthlyReport.renderMonthlyReport(...args);
window.renderMonthlySummary = (...args) => monthlyReport.renderMonthlySummary(...args);
window.renderMonthlyMomentum = (...args) => monthlyReport.renderMonthlyMomentum(...args);

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        monthlyReport.initializeMonthlyReportSelector();
    }, { once: true });
} else {
    monthlyReport.initializeMonthlyReportSelector();
}

navigation.initialize();
dailyCycle.initialize();
timer.initialize();
music.initialize();
cheats.initializeCheatControls();

window.dispatchEvent(new CustomEvent("standout:core-ready", {
    detail: { version: core.version }
}));

console.info(`[StandOut] Modular compatibility foundation ready (v${core.version}).`);
