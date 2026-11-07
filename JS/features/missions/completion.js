/**
 * Mission completion and reward orchestration.
 * Runtime state and legacy services are accessed through explicit window bridges.
 */
import { canEarnMissionImprovementPoint } from "./progression.js";

const COMPLETED_MISSION_COUNT_KEY = "completedMissionCount";
let completedMissionCountState = 0;

try {
    const storedCount = Number.parseInt(localStorage.getItem(COMPLETED_MISSION_COUNT_KEY), 10);
    if (Number.isFinite(storedCount)) completedMissionCountState = storedCount;
} catch (error) {
    console.warn("[Mission Completion] Could not load completed mission count:", error);
}

// Keep the legacy global interface while the Mission Completion feature owns state.
Object.defineProperty(window, "completedMissionCount", {
    configurable: true,
    enumerable: false,
    get: () => completedMissionCountState,
    set: value => { completedMissionCountState = Number(value) || 0; }
});

function completeMission(btn) {
    // Mission completion must not depend on unrelated dashboard rendering.
    // Keep daily reset best-effort so a reset/UI error cannot block completion.
    try {
        window.enforceDailyReset?.();
    } catch (error) {
        console.warn("[StandOut] Daily reset check failed during mission completion:", error);
    }

    const li = btn?.closest("li");

    if (!li) return;


    const linkedSkill =
        li.dataset.skill;

    const deadline =
        li.dataset.deadline;

    const repeat =
        li.dataset.repeat || "none";


    /* =====================================================
       PREVENT DOUBLE COMPLETION
    ===================================================== */

    if (
        li.dataset.completed === "true"
    ) {
        return;
    }


    /* =====================================================
       MARK COMPLETED
    ===================================================== */

    li.dataset.completed = "true";


    /* =====================================================
       OVERDUE → NO REWARD
    ===================================================== */

    if (
        deadline &&
        new Date(deadline).getTime() < Date.now()
    ) {

        /*
         * Mission is already overdue.
         * It gets NO Improvement Point.
         */

        const completeBtn =
            li.querySelector(".complete-btn");

        /*
         * Disable the button immediately.
         * This occurrence is finished.
         */

        if (completeBtn) {

            completeBtn.disabled = true;

            completeBtn.style.opacity = "0.45";

        }


        /*
         * Mark the occurrence visually.
         */

        li.classList.add("completed");


        /*
         * One-time missions disappear.
         */

        if (repeat === "none") {

            li.classList.add("remove");

            setTimeout(() => {

                li.remove();

                window.saveData?.();

            }, 400);

        }


        /*
         * Recurring missions stay visible.
         * The recurrence engine will reset them
         * when the next occurrence begins.
         */

        else {

            window.showPopup?.(
                "Mission was overdue. No improvement points gained."
            );

            window.saveData?.();

        }

        return;
    }


    /* =====================================================
       DAILY LIMIT
    ===================================================== */

    // if (
    //     dailyImprovementCount >=
    //     DAILY_IMPROVEMENT_LIMIT
    // ) {

    //     li.dataset.completed = "false";

    //     window.showPopup(
    //         "You're too tired today. No improvement points gained."
    //     );

    //     window.saveData();

    //     return;
    // }


    /* =====================================================
       SUCCESSFUL COMPLETION
    ===================================================== */

    const isHardcore = li.dataset.hardcore === "true";

    // Normal and Hardcore missions share one daily 10-point allowance.
    // Hardcore still has its separate failure penalty, but no longer bypasses
    // the reward cap or the daily task count.
    const canEarnImprovementPoint = canEarnMissionImprovementPoint({
        dailyCount: window.dailyImprovementCount
    });

    if (canEarnImprovementPoint) {
        window.completedMissionCount++;
        window.completedMissions++;

        window.dailyImprovementCount++;
    }


// Audio and history are supporting effects; they must not prevent the
// mission state/reward transition if either integration is unavailable.
try {
    window.playAppTone?.("mission");
} catch (error) {
    console.warn("[StandOut] Mission sound could not play:", error);
}

try {
    window.recordMissionPerformance?.(li, "completed", canEarnImprovementPoint ? 1 : 0);
} catch (error) {
    console.warn("[StandOut] Mission history could not be recorded:", error);
}

    /* =====================================================
   SEASON XP
===================================================== */

    if (
        window.StandOutSeason &&
        typeof window.StandOutSeason.addXP === "function"
    ) {

        window.StandOutSeason.addXP(
            10,
            "Mission"
        );

    }

    if (
        window.Momentum &&
        typeof window.Momentum.reload === "function"
    ) {
        window.Momentum.reload();
    }

    localStorage.setItem(
        "dailyImprovementCount",
        window.dailyImprovementCount
    );

    localStorage.setItem(
        "completedMissions",
        window.completedMissions
    );


    const missionCounter = document.getElementById("missionCounter");
    if (missionCounter) {
        missionCounter.textContent = window.completedMissions;
    }


    /* =====================================================
       SKILL XP
    ===================================================== */

    if (linkedSkill) {

        try {
            window.increaseSkillXP?.(linkedSkill, 1);
        } catch (error) {
            console.warn("[StandOut] Linked skill XP could not be updated:", error);
        }

    }


    /* =====================================================
       ACHIEVEMENTS
    ===================================================== */

    try {
        window.checkMissionAchievements?.();
    } catch (error) {
        console.warn("[StandOut] Mission achievements could not be checked:", error);
    }


    /* =====================================================
       RECURRING vs ONE-TIME
    ===================================================== */

    if (repeat === "none") {

        /*
           Normal mission:
           remove it permanently.
        */

        li.classList.add(
            "remove"
        );

        setTimeout(() => {

            li.remove();

            window.saveData?.();

        }, 400);


    } else {

        /*
           Recurring mission:
           KEEP the mission.

           It becomes completed for
           the current occurrence.

           Tomorrow/week/month it will
           be reset by the recurrence engine.
        */

        li.classList.add(
            "completed"
        );


        const completeBtn =
            li.querySelector(
                ".complete-btn"
            );

        if (completeBtn) {

            completeBtn.disabled =
                true;

            completeBtn.style.opacity =
                "0.45";

        }


        /*
           Remove deadline warning
           because today's occurrence
           has already been completed.
        */

        const overdueMark =
            li.querySelector(
                ".overdueMark"
            );

        if (overdueMark) {
            overdueMark.replaceChildren();
        }

    }


    // A successful mission is Momentum proof regardless of whether it is
    // normal or Hardcore. Hardcore missions intentionally do not increment
    // dailyImprovementCount, so Momentum must not depend on that counter.
    // registerProof is idempotent per IST day; the legacy click detector can
    // safely remain as a compatibility fallback for other completion paths.
    try {
        window.Momentum?.registerProof?.("mission");
    } catch (error) {
        console.warn("[StandOut] Momentum proof could not be registered:", error);
    }

    window.showPopup?.(
        canEarnImprovementPoint
            ? (
                isHardcore
                    ? "🔥 Hardcore mission completed! +1 Improvement Point."
                    : repeat === "none"
                        ? "Mission completed! Improvement point gained."
                        : "Mission completed! It will return for the next occurrence."
            )
            : (
                repeat === "none"
                    ? "Mission completed! No Improvement Point gained. Daily 10-task limit reached."
                    : "Mission completed! No Improvement Point gained. Daily 10-task limit reached. It will return for the next occurrence."
            )
    );


    window.saveData?.();

    if (typeof window.updateMissionProgressCounters === "function") {
        window.updateMissionProgressCounters();
    }
}



export const missionCompletion = Object.freeze({
    completeMission,
    getCompletedMissionCount: () => completedMissionCountState,
    setCompletedMissionCount: value => {
        window.completedMissionCount = value;
        return completedMissionCountState;
    }
});
