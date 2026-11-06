/**
 * Mission history persistence and monthly aggregate metrics.
 * The legacy mission lifecycle remains in classic scripts for now.
 */
const HISTORY_KEY = "missionHistory";

// The Mission History feature owns the runtime state. Keep a window bridge
// for backup/restore, persistence, reports, and classic-script integrations.
let missionHistoryState = {};

try {
    const storedHistory = localStorage.getItem(HISTORY_KEY);
    const parsedHistory = storedHistory ? JSON.parse(storedHistory) : {};
    missionHistoryState = parsedHistory && typeof parsedHistory === "object" && !Array.isArray(parsedHistory)
        ? parsedHistory
        : {};
} catch (error) {
    console.warn("Could not initialize mission history:", error);
    missionHistoryState = {};
}

Object.defineProperty(window, "missionHistory", {
    configurable: true,
    enumerable: true,
    get: () => missionHistoryState,
    set: value => {
        missionHistoryState = value && typeof value === "object" && !Array.isArray(value)
            ? value
            : {};
    }
});

function getPerformanceDate() {
    const istDate = window.getISTDate();
    return istDate.toISOString().slice(0, 10);
}

function recordMissionPerformance(li, status, pointsDelta = 0) {
    if (!li) return;
    const history = window.missionHistory;
    const date = li.dataset.repeat !== "none" && li.dataset.repeatKey
        ? li.dataset.repeatKey
        : getPerformanceDate();

    if (!history[date]) history[date] = { completed: 0, missed: 0, pointsDelta: 0, events: [] };

    const missionId = li.dataset.missionId || li.dataset.deadline ||
        li.querySelector(".mission-text")?.textContent?.trim() || "unknown";
    const missionName = li.querySelector(".mission-text")?.textContent?.trim() || "Mission";
    const occurrenceKey = `${missionId}|${date}`;

    // Preserve the existing first-write-wins rule for each mission occurrence.
    if (history[date].events.find(event => event.key === occurrenceKey)) return;

    const isRecurring = li.dataset.repeat && li.dataset.repeat !== "none";
    const isHardcore = li.dataset.hardcore === "true";
    const missionType = isHardcore ? "hardcore" : isRecurring ? "recurring" : "one-time";

    history[date].events.push({
        key: occurrenceKey, missionId, mission: missionName, type: missionType,
        status, pointsDelta, timestamp: new Date().toISOString()
    });
    if (status === "completed") history[date].completed++;
    if (status === "missed") history[date].missed++;
    history[date].pointsDelta += pointsDelta;
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function calculateMonthMetrics(year, month) {
    const metrics = { completed: 0, missed: 0, activeDays: 0, improvementPoints: 0, consistency: 0 };
    const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
    const history = window.missionHistory;

    Object.keys(history).filter(date => date.startsWith(monthPrefix)).forEach(date => {
        const day = history[date];
        if (!day) return;
        metrics.completed += Number(day.completed) || 0;
        metrics.missed += Number(day.missed) || 0;
        metrics.improvementPoints += Number(day.pointsDelta) || 0;
        if (Array.isArray(day.events) && day.events.length > 0) metrics.activeDays++;
    });

    const totalMissions = metrics.completed + metrics.missed;
    if (totalMissions > 0) metrics.consistency = Math.round((metrics.completed / totalMissions) * 100);
    return metrics;
}

export const missionHistoryFeature = Object.freeze({
    getPerformanceDate,
    recordMissionPerformance,
    calculateMonthMetrics,
    getMissionHistory: () => missionHistoryState,
    setMissionHistory: value => { window.missionHistory = value; return missionHistoryState; }
});
