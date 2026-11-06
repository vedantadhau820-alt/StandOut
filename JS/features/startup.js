/**
 * Coordinates the existing application startup sequence.
 * Keep this sequence ordered: data restore/reset and feature rendering depend
 * on the same legacy initialization order. The module is loaded after the
 * modular compatibility bootstrap and before the window load event.
 */
export function initializeStartupCoordinator({
    windowRef = window,
    documentRef = document,
    setTimeoutRef = setTimeout
} = {}) {
    let initialized = false;

    function handleWindowLoad() {
        if (initialized) return;
        initialized = true;

        windowRef.loadData();
        windowRef.enforceDailyReset();
        if (typeof windowRef.refreshDailyChallenge === "function") {
            windowRef.refreshDailyChallenge();
        }
        windowRef.renderMarketplace();
        windowRef.refreshRecurringMissions();
        windowRef.checkMissedDeadlines();
        windowRef.renderAchievements();
        windowRef.renderCountdowns();
        windowRef.renderGoals();

        // Preserve the legacy optional Monthly Report integration.
        if (typeof windowRef.renderMonthlyReport === "function") {
            windowRef.renderMonthlyReport();
        }

        setTimeoutRef(() => {
            windowRef.cacheAllMusic();
        }, 1000);

        const activeSection = documentRef.querySelector("section.active");
        const activePage = activeSection ? activeSection.id : "missions";
        windowRef.showPage(activePage);
    }

    windowRef.addEventListener("load", handleWindowLoad, { once: true });
    return Object.freeze({ handleWindowLoad });
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
    initializeStartupCoordinator();
}
