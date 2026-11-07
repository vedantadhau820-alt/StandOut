import { DAILY_IMPROVEMENT_LIMIT, shouldApplyMissionFailurePenalty } from "./progression.js";

/**
 * Mission scheduling feature.
 *
 * Owns recurring occurrence rollover, deadline warnings, overdue penalties,
 * and recurring deadline movement. Existing saved mission HTML/data attributes
 * remain the persistence format for backward compatibility.
 */

function getRepeatKey(date = new Date(), repeat = "daily") {
    const d = new Date(date);

    if (repeat === "daily") {
        return [
            d.getFullYear(),
            String(d.getMonth() + 1).padStart(2, "0"),
            String(d.getDate()).padStart(2, "0")
        ].join("-");
    }

    if (repeat === "weekly") {
        const day = d.getDay();
        d.setDate(d.getDate() - day);
        return [
            d.getFullYear(),
            String(d.getMonth() + 1).padStart(2, "0"),
            String(d.getDate()).padStart(2, "0")
        ].join("-");
    }

    if (repeat === "monthly") {
        return [
            d.getFullYear(),
            String(d.getMonth() + 1).padStart(2, "0")
        ].join("-");
    }

    return "once";
}

function refreshRecurringMissions() {
    // Process expired deadlines before resetting recurring missions.
    checkMissedDeadlines();

    const missions = document.querySelectorAll("#mission-list li");
    const today = new Date();
    let changed = false;

    missions.forEach(li => {
        const repeat = li.dataset.repeat || "none";
        if (repeat === "none") return;

        const currentKey = getRepeatKey(today, repeat);
        const previousKey = li.dataset.repeatKey;

        // First time this mission is using recurrence.
        if (!previousKey) {
            li.dataset.repeatKey = currentKey;
            changed = true;
            return;
        }

        // Same occurrence: do not reset anything.
        if (previousKey === currentKey) return;

        resetRecurringMission(li, currentKey);
        changed = true;
    });

    if (changed && typeof window.saveData === "function") {
        window.saveData();
    }
}

function resetRecurringMission(li, currentKey) {
    if (!li) return;

    const repeat = li.dataset.repeat || "none";

    // Start a new occurrence and clear the previous occurrence state.
    li.dataset.repeatKey = currentKey;
    li.dataset.completed = "false";
    li.classList.remove("completed", "remove");

    delete li.dataset.deducted;
    delete li.dataset.penaltySuppressed;
    delete li.dataset.overdueNotified;
    delete li.dataset.warned;
    delete li.dataset.hardcorePunished;

    const completeBtn = li.querySelector(".complete-btn");
    if (completeBtn) {
        completeBtn.disabled = false;
        completeBtn.style.opacity = "";
    }

    const overdueMark = li.querySelector(".overdueMark");
    if (overdueMark) overdueMark.textContent = "";

    if (repeat !== "none") {
        shiftRecurringDeadline(li, repeat);
    }
}

function shiftRecurringDeadline(li, repeat) {
    if (!li) return;

    const oldDeadline = li.dataset.deadline;
    if (!oldDeadline) return;

    const oldDate = new Date(oldDeadline);
    if (Number.isNaN(oldDate.getTime())) return;

    const nextDeadline = new Date(oldDate);

    if (repeat === "daily") {
        nextDeadline.setDate(nextDeadline.getDate() + 1);
    } else if (repeat === "weekly") {
        nextDeadline.setDate(nextDeadline.getDate() + 7);
    } else if (repeat === "monthly") {
        const originalDay = nextDeadline.getDate();
        nextDeadline.setMonth(nextDeadline.getMonth() + 1);

        // Preserve the existing end-of-month behavior (e.g. Jan 31 -> Feb 28).
        if (nextDeadline.getDate() !== originalDay) {
            nextDeadline.setDate(0);
        }
    } else {
        return;
    }

    const year = nextDeadline.getFullYear();
    const month = String(nextDeadline.getMonth() + 1).padStart(2, "0");
    const day = String(nextDeadline.getDate()).padStart(2, "0");
    const hours = String(nextDeadline.getHours()).padStart(2, "0");
    const minutes = String(nextDeadline.getMinutes()).padStart(2, "0");
    const newDeadline = `${year}-${month}-${day}T${hours}:${minutes}`;

    li.dataset.deadline = newDeadline;

    const deadlineDisplay = li.querySelector(".deadlineDisplay");
    if (deadlineDisplay) {
        deadlineDisplay.textContent =
            nextDeadline.toLocaleDateString([], {
                day: "numeric",
                month: "short"
            }) + ", " + nextDeadline.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            });
    }
}

function processMissionDeadline(li, now = Date.now()) {
    if (!li) return false;

    // Keep the normal-task eligibility window aligned with the IST daily cycle,
    // even when the deadline poll runs before the regular reset interval.
    try {
        window.enforceDailyReset?.();
    } catch (error) {
        console.warn("[StandOut] Daily reset check failed during deadline processing:", error);
    }
    const deadline = li.dataset.deadline;
    if (!deadline || li.dataset.completed === "true") return false;

    const deadlineTime = new Date(deadline).getTime();
    if (Number.isNaN(deadlineTime)) return false;

    const timeLeft = deadlineTime - now;
    const overdueSpan = li.querySelector(".overdueMark");
    const missionName = li.querySelector(".mission-text")?.textContent?.trim() || "Mission";

    if (timeLeft > 0 && timeLeft <= 2 * 60 * 60 * 1000 && !li.dataset.warned) {
        li.dataset.warned = "true";
        window.pushNotification(
            "Mission Deadline",
            `"${missionName}" is due soon (within 2 hours!)`
        );
    }

    if (timeLeft > 0) return false;

    if (overdueSpan) {
        const overdueBadge = document.createElement("span");
        overdueBadge.className = "overdue-badge";
        overdueBadge.textContent = "Overdue";
        overdueSpan.replaceChildren(overdueBadge);
    }

    if (!li.dataset.overdueNotified) {
        li.dataset.overdueNotified = "true";
        window.pushNotification("⚠ Mission Overdue", `"${missionName}" is overdue!`);
    }

    if (li.dataset.hardcore === "true") {
        if (li.dataset.hardcorePunished === "true") return true;

        li.dataset.hardcorePunished = "true";
        li.dataset.deducted = "true";

        const pointsBefore = Number(window.completedMissions) || 0;
        const hardcorePenalty = 5;
        window.completedMissions = Math.max(0, pointsBefore - hardcorePenalty);
        const pointsLost = pointsBefore - window.completedMissions;

        window.localStorage.setItem("completedMissions", window.completedMissions);
        const counter = document.getElementById("missionCounter");
        if (counter) counter.textContent = window.completedMissions;

        window.renderMarketplace?.(window.currentMarketplaceFilter);
        window.renderMyCards?.();
        window.showSmartNotification?.("🔥 Hardcore Failed", `-${pointsLost} Improvement Points`);
        window.saveData?.();
        return true;
    }

    if (!li.dataset.deducted) {
        const normalDailyCount = Math.max(0, Number(window.dailyImprovementCount) || 0);

        // Normal missions stop affecting IP after the shared daily reward cap
        // has been reached. Mark the occurrence handled so it cannot be
        // penalized later after midnight or after a reload.
        if (!shouldApplyMissionFailurePenalty({
            isHardcore: false,
            dailyCount: normalDailyCount
        })) {
            li.dataset.deducted = "true";
            li.dataset.penaltySuppressed = "daily-limit";
            window.recordMissionPerformance?.(li, "missed", 0);
            window.saveData?.();
            window.updateMissionProgressCounters?.();
            return true;
        }

        const pointsBefore = Number(window.completedMissions) || 0;
        window.completedMissions = Math.max(0, pointsBefore - 1);
        li.dataset.deducted = "true";

        const pointsDelta = window.completedMissions - pointsBefore;
        window.recordMissionPerformance?.(li, "missed", pointsDelta);

        const counter = document.getElementById("missionCounter");
        if (counter) counter.textContent = window.completedMissions;
        window.localStorage.setItem("completedMissions", window.completedMissions);
        window.saveData?.();
    }

    return true;
}

function checkMissedDeadlines() {
    document.querySelectorAll("#mission-list li").forEach(li => {
        processMissionDeadline(li);
    });
}

// Keep the existing 30-second deadline polling cadence.
const deadlineCheckInterval = window.setInterval(checkMissedDeadlines, 30 * 1000);

export const missionScheduler = Object.freeze({
    getRepeatKey,
    refreshRecurringMissions,
    resetRecurringMission,
    shiftRecurringDeadline,
    checkMissedDeadlines,
    processMissionDeadline,
    deadlineCheckInterval
});