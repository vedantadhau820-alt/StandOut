/**
 * Improvement Points economy.
 * Owns the balance and point-grant operation while preserving the legacy
 * global, LocalStorage key, counter UI, and marketplace refresh contract.
 */
let completedMissionsState = 0;

try {
    const storedBalance = Number.parseInt(localStorage.getItem("completedMissions"), 10);
    if (Number.isFinite(storedBalance)) completedMissionsState = storedBalance;
} catch (error) {
    console.error("[Points] Could not load Improvement Points balance:", error);
}

Object.defineProperty(window, "completedMissions", {
    configurable: true,
    get: () => completedMissionsState,
    set: value => { completedMissionsState = Number(value) || 0; }
});

function refreshPointsUI() {
    try {
        const counter = document.getElementById("missionCounter");
        if (counter) counter.textContent = window.completedMissions;

        window.renderMarketplace?.(window.currentMarketplaceFilter || "ALL");
    } catch (error) {
        // UI refresh failures must not turn a successfully persisted economy
        // transaction into an apparent failed spend.
        console.error("[Points] Balance saved, but the UI could not refresh:", error);
    }
}

function addImprovementPoints(amount) {
    const points = Number(amount) || 0;

    if (points <= 0) {
        return window.completedMissions;
    }

    window.completedMissions = (Number(window.completedMissions) || 0) + points;

    localStorage.setItem("completedMissions", window.completedMissions);
    refreshPointsUI();

    return window.completedMissions;
}

/**
 * Spend points exactly once, persisting before changing the in-memory balance.
 * Returns false when the amount is invalid or the current balance is too low.
 * Storage errors are allowed to propagate so callers can roll back related work.
 */
function spendImprovementPoints(amount) {
    const pointsToSpend = Number(amount);
    const currentBalance = Number(window.completedMissions) || 0;

    if (!Number.isFinite(pointsToSpend) || pointsToSpend < 0 || currentBalance < pointsToSpend) {
        return false;
    }

    if (pointsToSpend === 0) return true;

    const nextBalance = currentBalance - pointsToSpend;
    localStorage.setItem("completedMissions", nextBalance);
    window.completedMissions = nextBalance;
    refreshPointsUI();

    return true;
}

export const points = Object.freeze({
    add: addImprovementPoints,
    addImprovementPoints,
    spend: spendImprovementPoints,
    spendImprovementPoints,
    getBalance: () => completedMissionsState,
    setBalance: value => { window.completedMissions = value; }
});
