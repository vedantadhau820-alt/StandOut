#!/usr/bin/env node
/** Dependency-free tests for pure Season progression calculations. */
import assert from 'node:assert/strict';
import { SEASON, createDefaultSeasonState } from '../JS/features/season/season-core.js';
import {
    calculateSeasonXPProgression,
    getNewlyUnlockedSeasonRewards,
    calculateSeasonProgress
} from '../JS/features/season/season-progression.js';

const state = createDefaultSeasonState();

assert.equal(calculateSeasonXPProgression(state, 0), null);
assert.equal(calculateSeasonXPProgression(state, -10), null);
assert.equal(calculateSeasonXPProgression(state, 'invalid'), null);

let result = calculateSeasonXPProgression(state, 149);
assert.deepEqual(result, {
    xp: 149,
    oldLevel: 1,
    newLevel: 1,
    totalXP: 149,
    crossedLevels: []
});

result = calculateSeasonXPProgression({ ...state, xp: 140 }, 20);
assert.equal(result.totalXP, 160);
assert.equal(result.newLevel, 2);
assert.deepEqual(result.crossedLevels, [2]);

result = calculateSeasonXPProgression({ ...state, xp: 100 }, 700);
assert.equal(result.newLevel, 6);
assert.deepEqual(result.crossedLevels, [2, 3, 4, 5, 6]);

const unlocked = getNewlyUnlockedSeasonRewards(state, 1, 20);
assert.deepEqual(unlocked.map(item => item.level), [5, 10, 15, 20]);
const partiallyUnlocked = {
    ...state,
    rewards: { 5: { unlocked: true, claimed: false } }
};
assert.deepEqual(
    getNewlyUnlockedSeasonRewards(partiallyUnlocked, 1, 20).map(item => item.level),
    [10, 15, 20]
);

assert.deepEqual(calculateSeasonProgress({ ...state, xp: 75 }), {
    level: 1,
    xp: 75,
    currentXP: 75,
    requiredXP: 150,
    percentage: 50
});
assert.equal(
    calculateSeasonProgress({ ...state, xp: 3000, level: 20 }).percentage,
    100
);

const customSeason = { ...SEASON, maxLevel: 3, xpPerLevel: 100, rewards: {} };
assert.equal(
    calculateSeasonXPProgression({ ...state, xp: 250 }, 100, customSeason).newLevel,
    3
);

console.log('[Season Progression Tests] PASSED (10 scenario groups).');
