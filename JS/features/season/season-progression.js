/**
 * Pure Season progression and reward-eligibility calculations.
 * No storage, DOM, timestamps, logging, or cross-feature side effects.
 */
import { SEASON } from "./season-core.js";
import { calculateSeasonLevel } from "./season-core.js";

export function calculateSeasonXPProgression(state, amount, season = SEASON) {
    const xp = Number(amount);
    if (!Number.isFinite(xp) || xp <= 0) return null;

    const oldLevel = calculateSeasonLevel(state.xp, season);
    const nextXP = Math.max(0, Math.floor(state.xp + xp));
    const newLevel = calculateSeasonLevel(nextXP, season);

    return {
        xp,
        oldLevel,
        newLevel,
        totalXP: nextXP,
        crossedLevels: newLevel > oldLevel
            ? Array.from({ length: newLevel - oldLevel }, (_, index) => oldLevel + index + 1)
            : []
    };
}

export function getNewlyUnlockedSeasonRewards(state, oldLevel, newLevel, season = SEASON) {
    const newlyUnlocked = [];

    for (let level = oldLevel + 1; level <= newLevel; level++) {
        const reward = season.rewards[level];
        if (!reward) continue;
        if (state.rewards[level] && state.rewards[level].unlocked) continue;
        newlyUnlocked.push({ level, reward });
    }

    return newlyUnlocked;
}

export function calculateSeasonProgress(state, season = SEASON) {
    const level = state.level;

    if (level >= season.maxLevel) {
        return {
            level,
            xp: state.xp,
            currentXP: season.xpPerLevel,
            requiredXP: season.xpPerLevel,
            percentage: 100
        };
    }

    const levelStartXP = (level - 1) * season.xpPerLevel;
    const levelEndXP = level * season.xpPerLevel;
    const currentXP = Math.max(0, state.xp - levelStartXP);
    const requiredXP = levelEndXP - levelStartXP;
    const percentage = Math.min(100, Math.max(0, (currentXP / requiredXP) * 100));

    return { level, xp: state.xp, currentXP, requiredXP, percentage };
}
