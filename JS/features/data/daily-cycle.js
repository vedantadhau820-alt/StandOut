/**
 * India Standard Time date utilities and the daily improvement-counter reset.
 * Existing storage keys and the legacy 60-second reset check are preserved.
 */
export function getISTDate() {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
}

export function getTodayKey() {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(new Date());
}

// Daily improvement state lives with the IST daily-cycle feature. The window
// accessors retain compatibility with classic scripts, inline handlers, and
// backup/restore without maintaining a second copy of either value.
let dailyImprovementCountState = 0;
let lastImprovementDateState = getTodayKey();

try {
    const storedCount = Number.parseInt(localStorage.getItem("dailyImprovementCount"), 10);
    if (Number.isFinite(storedCount)) dailyImprovementCountState = storedCount;
} catch (error) {
    console.error("[Daily Cycle] Could not load daily improvement count:", error);
}

try {
    const storedDate = localStorage.getItem("lastImprovementDate");
    if (storedDate) lastImprovementDateState = storedDate;
} catch (error) {
    console.error("[Daily Cycle] Could not load last improvement date:", error);
}

Object.defineProperties(window, {
    dailyImprovementCount: {
        configurable: true,
        enumerable: true,
        get: () => dailyImprovementCountState,
        set: value => {
            const parsed = Number(value);
            dailyImprovementCountState = Number.isFinite(parsed) ? parsed : 0;
        }
    },
    lastImprovementDate: {
        configurable: true,
        enumerable: true,
        get: () => lastImprovementDateState,
        set: value => { lastImprovementDateState = String(value || ""); }
    }
});

export function enforceDailyReset() {
    const today = getTodayKey();
    if (window.lastImprovementDate !== today) {
        window.dailyImprovementCount = 0;
        window.lastImprovementDate = today;
        localStorage.setItem("dailyImprovementCount", "0");
        localStorage.setItem("lastImprovementDate", today);
        console.log("✅ Daily reset enforced:", today);
    }
    if (typeof window.updateMissionProgressCounters === "function") {
        window.updateMissionProgressCounters();
    }
}

let initialized = false;
export function initializeDailyCycle() {
    if (initialized) return;
    initialized = true;
    window.addEventListener("load", enforceDailyReset, { once: true });
    window.setInterval(enforceDailyReset, 60 * 1000);
}

export const dailyCycle = Object.freeze({
    getISTDate,
    getTodayKey,
    getDailyImprovementCount: () => dailyImprovementCountState,
    setDailyImprovementCount: value => { window.dailyImprovementCount = value; },
    getLastImprovementDate: () => lastImprovementDateState,
    setLastImprovementDate: value => { window.lastImprovementDate = value; },
    enforceDailyReset,
    initialize: initializeDailyCycle
});
