#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { renderSeasonUI, updateSeasonCountdown } from '../JS/features/season/season-ui.js';

function element({ dataset = {}, children = {} } = {}) {
    const classes = new Set();
    return {
        dataset,
        style: {},
        classList: {
            toggle(name, enabled) {
                if (enabled) classes.add(name);
                else classes.delete(name);
            },
            contains(name) { return classes.has(name); }
        },
        querySelector(selector) { return children[selector] || null; },
        classes
    };
}

const status = element();
const level = element();
const xp = element();
const progressText = element();
const progressBar = element();
const name = element();
const claimButton = element();
const lock = element();
const reward = element({
    dataset: { seasonRewardLevel: '5' },
    children: { '[data-season-claim]': claimButton, '.season-reward-lock': lock }
});
const countdown = element();
const nodes = {
    '.season-status': [status],
    '[data-season-level]': [level],
    '[data-season-xp]': [xp],
    '[data-season-progress]': [progressText],
    '[data-season-progress-bar]': [progressBar],
    '[data-season-name]': [name],
    '[data-season-reward-level]': [reward],
    '[data-season-countdown]': [countdown]
};
const documentRef = { querySelectorAll(selector) { return nodes[selector] || []; } };
const season = { name: 'The Ascension', maxLevel: 20, start: '2026-09-01T00:00:00', end: '2026-09-30T23:59:59' };
const state = { completed: false, xp: 325, rewards: { 5: { unlocked: true, claimed: false } } };
const progress = { level: 5, currentXP: 25, requiredXP: 150, percentage: 16.67 };
let countdownCalled = false;

renderSeasonUI({
    state, progress, season, started: true, documentRef,
    countdownUpdater() { countdownCalled = true; }
});
assert.equal(status.textContent, 'ACTIVE');
assert.equal(level.textContent, 5);
assert.equal(xp.textContent, 325);
assert.equal(progressText.textContent, '25 / 150 XP');
assert.equal(progressBar.style.width, '16.67%');
assert.equal(name.textContent, 'The Ascension');
assert.equal(claimButton.textContent, 'CLAIM');
assert.equal(claimButton.disabled, false);
assert.equal(claimButton.style.display, '');
assert.equal(lock.style.display, 'none');
assert.equal(reward.classList.contains('unlocked'), true);
assert.equal(reward.classList.contains('locked'), false);
assert.equal(countdownCalled, true);

state.rewards[5].claimed = true;
renderSeasonUI({ state, progress: { ...progress, level: 20 }, season, started: false, documentRef, countdownUpdater() {} });
assert.equal(status.textContent, 'ARIVING');
assert.equal(progressText.textContent, 'MAX LEVEL');
assert.equal(claimButton.textContent, 'CLAIMED');
assert.equal(claimButton.disabled, true);
assert.equal(reward.classList.contains('claimed'), true);

updateSeasonCountdown(season, documentRef, new Date('2026-08-31T23:00:00'));
assert.match(countdown.textContent, /until start$/);
updateSeasonCountdown(season, documentRef, new Date('2026-09-10T12:00:00'));
assert.match(countdown.textContent, /remaining$/);
updateSeasonCountdown(season, documentRef, new Date('2026-10-01T00:00:00'));
assert.equal(countdown.textContent, 'Season Complete');

// Regression: the one-second production timer must supply the season configuration.
const seasonModulePath = resolve(dirname(fileURLToPath(import.meta.url)), '../JS/season.js');
const seasonModuleSource = readFileSync(seasonModulePath, 'utf8');
assert.match(
    seasonModuleSource,
    /setInterval\(\s*\(\)\s*=>\s*updateSeasonCountdown\(SEASON\),\s*1000\s*\)/,
    'Season countdown interval must pass SEASON; passing updateSeasonCountdown directly invokes it without arguments.'
);

console.log('[Season UI Tests] PASSED (rendering, reward states, max-level label, and countdown phases).');
