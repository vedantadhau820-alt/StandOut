import assert from 'node:assert/strict';
import { initializeStartupCoordinator } from '../JS/features/startup.js';

const calls = [];
let loadHandler;
let loadOptions;
let timeoutCallback;
let timeoutDelay;
const windowRef = {
    addEventListener(type, callback, options) {
        assert.equal(type, 'load');
        loadHandler = callback;
        loadOptions = options;
    },
    loadData() { calls.push('loadData'); },
    enforceDailyReset() { calls.push('enforceDailyReset'); },
    refreshDailyChallenge() { calls.push('refreshDailyChallenge'); },
    renderMarketplace() { calls.push('renderMarketplace'); },
    refreshRecurringMissions() { calls.push('refreshRecurringMissions'); },
    checkMissedDeadlines() { calls.push('checkMissedDeadlines'); },
    renderAchievements() { calls.push('renderAchievements'); },
    renderCountdowns() { calls.push('renderCountdowns'); },
    renderGoals() { calls.push('renderGoals'); },
    renderMonthlyReport() { calls.push('renderMonthlyReport'); },
    cacheAllMusic() { calls.push('cacheAllMusic'); },
    showPage(page) { calls.push(`showPage:${page}`); }
};
const documentRef = {
    querySelector(selector) {
        assert.equal(selector, 'section.active');
        return { id: 'goals' };
    }
};

const coordinator = initializeStartupCoordinator({
    windowRef,
    documentRef,
    setTimeoutRef(callback, delay) {
        timeoutCallback = callback;
        timeoutDelay = delay;
    }
});

assert.equal(typeof loadHandler, 'function');
assert.deepEqual(loadOptions, { once: true });
assert.equal(typeof coordinator.handleWindowLoad, 'function');
assert.deepEqual(calls, [], 'startup must wait for the window load event');

loadHandler();
assert.deepEqual(calls, [
    'loadData',
    'enforceDailyReset',
    'refreshDailyChallenge',
    'renderMarketplace',
    'refreshRecurringMissions',
    'checkMissedDeadlines',
    'renderAchievements',
    'renderCountdowns',
    'renderGoals',
    'renderMonthlyReport',
    'showPage:goals'
]);
assert.equal(timeoutDelay, 1000, 'music caching delay must remain one second');
assert.equal(typeof timeoutCallback, 'function');
timeoutCallback();
assert.equal(calls.at(-1), 'cacheAllMusic');

const firstRunCount = calls.length;
loadHandler();
assert.equal(calls.length, firstRunCount, 'startup sequence must be idempotent');

const fallbackCalls = [];
let fallbackLoad;
initializeStartupCoordinator({
    windowRef: {
        addEventListener(type, callback) { fallbackLoad = callback; },
        loadData() { fallbackCalls.push('loadData'); },
        enforceDailyReset() { fallbackCalls.push('enforceDailyReset'); },
        renderMarketplace() { fallbackCalls.push('renderMarketplace'); },
        refreshRecurringMissions() { fallbackCalls.push('refreshRecurringMissions'); },
        checkMissedDeadlines() { fallbackCalls.push('checkMissedDeadlines'); },
        renderAchievements() { fallbackCalls.push('renderAchievements'); },
        renderCountdowns() { fallbackCalls.push('renderCountdowns'); },
        renderGoals() { fallbackCalls.push('renderGoals'); },
        cacheAllMusic() {},
        showPage(page) { fallbackCalls.push(`showPage:${page}`); }
    },
    documentRef: { querySelector() { return null; } },
    setTimeoutRef() {}
});
fallbackLoad();
assert.equal(fallbackCalls.at(-1), 'showPage:missions');
assert.equal(fallbackCalls.includes('refreshDailyChallenge'), false);
assert.equal(fallbackCalls.includes('renderMonthlyReport'), false);

console.log('[Startup Coordinator Tests] PASSED (ordered startup, optional integrations, 1s music delay, fallback page, and idempotence).');
