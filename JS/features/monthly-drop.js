/**
 * Monthly Drop eligibility and navigation.
 * The storage key and local-calendar first-day rule are retained from the
 * original Welcome script. Dependencies are injectable for deterministic tests.
 */
export const MONTHLY_DROP_STORAGE_KEY = "standOutMonthlyDropSeen";

export function createMonthlyDropController({
    storage = window.localStorage,
    now = () => new Date(),
    navigate = url => { window.location.href = url; },
    logger = console
} = {}) {
    function getCurrentDropKey() {
        const current = now();
        return `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`;
    }

    function isMonthlyDropDay() {
        return now().getDate() === 1;
    }

    function hasSeenCurrentDrop() {
        return storage.getItem(MONTHLY_DROP_STORAGE_KEY) === getCurrentDropKey();
    }

    function openMonthlyDrop() {
        logger.log("🎁 Opening Monthly Drop:", getCurrentDropKey());
        navigate("drop-info.html");
    }

    return Object.freeze({
        getCurrentDropKey,
        isMonthlyDropDay,
        hasSeenCurrentDrop,
        openMonthlyDrop
    });
}
