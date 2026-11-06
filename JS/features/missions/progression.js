/**
 * Shared mission progression rules.
 * Keeps the daily earning cap and achievement thresholds in one place.
 */
export const DAILY_IMPROVEMENT_LIMIT = 10;

function buildMissionMilestones() {
    const milestones = [1];

    for (let value = 5; value <= 250; value += 5) milestones.push(value);
    for (let value = 260; value <= 500; value += 10) milestones.push(value);
    for (let value = 520; value <= 2000; value += 20) milestones.push(value);

    return Object.freeze(milestones);
}

export const missionMilestones = buildMissionMilestones();

/**
 * Normal missions share one daily IP allowance for rewards and failure
 * penalties. Hardcore missions are intentionally exempt from this cap.
 */
export function canEarnMissionImprovementPoint({ isHardcore = false, dailyCount = 0 } = {}) {
    if (isHardcore) return true;
    return Math.max(0, Number(dailyCount) || 0) < DAILY_IMPROVEMENT_LIMIT;
}

export function shouldApplyMissionFailurePenalty({ isHardcore = false, dailyCount = 0 } = {}) {
    if (isHardcore) return true;
    return Math.max(0, Number(dailyCount) || 0) < DAILY_IMPROVEMENT_LIMIT;
}


export const missionProgression = Object.freeze({
    DAILY_IMPROVEMENT_LIMIT,
    missionMilestones,
    canEarnMissionImprovementPoint,
    shouldApplyMissionFailurePenalty
});
