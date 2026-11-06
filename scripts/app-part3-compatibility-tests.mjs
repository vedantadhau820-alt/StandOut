import assert from 'node:assert/strict';
import { initializeAppPart3Compatibility } from '../JS/features/app-part3-compatibility.js';

const calls = [];
const loadListeners = [];
const methods = [
    'increaseSkillXP', 'checkMissionAchievements', 'updateMissionProgressCounters',
    'showMotivationPopup', 'closeMotivationPopup', 'addSkill', 'deleteSkillDirect',
    'updateSkill', 'checkSkillLevelUp', 'deleteSkill', 'initializeSkills',
    'getGoalNow', 'saveGoals', 'getGoalReward', 'getGoalCommitmentDays', 'addGoal',
    'openEditGoal', 'updateGoal', 'getGoalCompletionDate', 'getDailyGoalCompletions',
    'renderGoals', 'markGoalAchieved', 'playGoalAchievementVideo', 'updateGoalTimers',
    'removeGoal', 'saveCountdowns', 'addCountdown', 'removeCountdown',
    'renderCountdowns', 'updateTimers', 'saveData', 'loadData', 'resetData',
    'startResetHold', 'cancelResetHold', 'openCheatModal', 'closeCheatModal',
    'confirmCheat', 'skipDayCheat', 'showMintedCard', 'closeMintedCard',
    'openModal', 'closeModal', 'create', 'resetForm', 'updateCostRange',
    'shiftRecurringDeadline'
];
const makeFeature = name => Object.fromEntries(methods.map(method => [method, (...args) => {
    calls.push([`${name}.${method}`, ...args]);
    return `${name}.${method}.result`;
}]));

const windowRef = {
    completedMissionCount: 12,
    dailyImprovementCount: 4,
    lastImprovementDate: '2026-11-04',
    __standOutCustomCardImageData: 'old-image',
    document: { getElementById: id => id === 'missionCounter' ? { textContent: '' } : null },
    addEventListener: (name, callback) => loadListeners.push([name, callback]),
    customAlert: message => calls.push(['customAlert', message]),
    showSmartNotification: (...args) => calls.push(['showSmartNotification', ...args])
};
windowRef.StandOutCore = {
    missionScheduler: makeFeature('scheduler'),
    skills: makeFeature('skills'),
    progression: { missionMilestones: [10, 20], DAILY_IMPROVEMENT_LIMIT: 10 },
    achievements: makeFeature('achievements'),
    goals: makeFeature('goals'),
    countdowns: makeFeature('countdowns'),
    dataPersistence: makeFeature('persistence'),
    dataManagement: makeFeature('dataManagement'),
    cheats: makeFeature('cheats'),
    cards: makeFeature('cards'),
    customCards: makeFeature('customCards')
};

const api = initializeAppPart3Compatibility(windowRef);
const expectedGlobals = [
    'shiftRecurringDeadline', 'increaseSkillXP', 'checkMissionAchievements',
    'updateMissionProgressCounters', 'showPopup', 'closePopup', 'addSkill',
    'deleteSkillDirect', 'updateSkill', 'checkSkillLevelUp', 'deleteSkill',
    'initializeSkills', 'getGoalNow', 'saveGoals', 'getGoalReward',
    'getGoalCommitmentDays', 'addGoal', 'openEditGoal', 'updateGoal',
    'getGoalCompletionDate', 'getDailyGoalCompletions', 'renderGoals',
    'markGoalAchieved', 'playGoalAchievementVideo', 'updateGoalTimers',
    'removeGoal', 'escapeHTML', 'saveCountdowns', 'addCountdown',
    'removeCountdown', 'renderCountdowns', 'updateTimers', 'saveData',
    'loadData', 'resetData', 'isPastDateTime', 'startResetHold',
    'cancelResetHold', 'openCheatModal', 'closeCheatModal', 'confirmCheat',
    'skipDayCheat', 'showMintedCard', 'closeMintedCard', 'openCustomCardModal',
    'closeCustomCardModal', 'createCustomCard', 'resetCustomCardForm',
    'updateCustomCardCostRange'
];
for (const name of expectedGlobals) assert.equal(typeof windowRef[name], 'function', `${name} should be exposed`);

windowRef.increaseSkillXP('Writing', 25);
windowRef.checkMissionAchievements();
windowRef.updateMissionProgressCounters();
windowRef.showPopup('Achievement');
windowRef.closePopup();
windowRef.addSkill();
windowRef.deleteSkillDirect({ id: 'skill' });
windowRef.updateSkill();
windowRef.checkSkillLevelUp({ id: 'skill' });
windowRef.deleteSkill('Writing');
windowRef.initializeSkills();
windowRef.getGoalNow();
windowRef.saveGoals();
windowRef.getGoalReward('High');
windowRef.getGoalCommitmentDays('High');
windowRef.addGoal();
windowRef.openEditGoal('g1');
windowRef.updateGoal('g1');
windowRef.getGoalCompletionDate();
windowRef.getDailyGoalCompletions();
windowRef.renderGoals();
windowRef.markGoalAchieved('g1');
windowRef.playGoalAchievementVideo();
windowRef.updateGoalTimers();
windowRef.removeGoal('g1');
windowRef.saveCountdowns();
windowRef.addCountdown();
windowRef.removeCountdown(2);
windowRef.renderCountdowns();
windowRef.updateTimers();
windowRef.saveData();
windowRef.loadData();
await windowRef.resetData();
windowRef.startResetHold();
windowRef.cancelResetHold();
windowRef.openCheatModal();
windowRef.closeCheatModal();
windowRef.confirmCheat();
windowRef.skipDayCheat();
windowRef.showMintedCard({ id: 'c1' });
windowRef.closeMintedCard();
windowRef.openCustomCardModal();
windowRef.closeCustomCardModal();
windowRef.createCustomCard();
windowRef.resetCustomCardForm();
windowRef.updateCustomCardCostRange();
windowRef.shiftRecurringDeadline({ id: 'm1' }, 'weekly');

assert.equal(windowRef.escapeHTML(`<tag a="b">'&`), '&lt;tag a=&quot;b&quot;&gt;&#039;&amp;');
assert.equal(windowRef.isPastDateTime(''), false);
assert.equal(windowRef.isPastDateTime('2000-01-01T00:00:00Z'), true);
assert.equal(windowRef.customCardImageData, 'old-image');
windowRef.customCardImageData = null;
assert.equal(windowRef.customCardImageData, '');
windowRef.customCardImageData = 123;
assert.equal(windowRef.customCardImageData, '123');
assert.equal(loadListeners.length, 1);
assert.equal(loadListeners[0][0], 'load');
loadListeners[0][1]();
assert.ok(calls.some(([name]) => name === 'achievements.updateMissionProgressCounters'));
assert.ok(calls.some(([name]) => name === 'cheats.confirmCheat'));
assert.ok(calls.some(([name]) => name === 'customCards.create'));
assert.equal(typeof api.resetData, 'function');
console.log(`[App-Part3 Compatibility Tests] PASSED (${expectedGlobals.length} globals, delegated calls, load hook, utility/accessor behavior).`);
