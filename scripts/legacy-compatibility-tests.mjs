import assert from 'node:assert/strict';
import { initializeLegacyCompatibility } from '../JS/features/legacy-compatibility.js';

const calls = [];
const windowRef = {
    document: {
        querySelectorAll() { return []; },
        getElementById() { return null; }
    },
    StandOutCore: {
        navigation: { showPage: (...args) => calls.push(['showPage', ...args]), updatePlusBtn: (...args) => calls.push(['updatePlusBtn', ...args]) },
        timer: {
            closeTimerSettingModal: () => calls.push(['closeTimerSettingModal']),
            applyTimerSettings: () => calls.push(['applyTimerSettings']),
            startStaticTimer: (...args) => calls.push(['startStaticTimer', ...args])
        },
        modals: {
            openModal: (...args) => calls.push(['openModal', ...args]),
            closeModal: () => calls.push(['closeModal']),
            customAlert: (...args) => calls.push(['customAlert', ...args]),
            closeAlert: () => calls.push(['closeAlert']),
            customConfirm: (...args) => calls.push(['customConfirm', ...args]),
            confirmYes: () => calls.push(['confirmYes']),
            confirmNo: () => calls.push(['confirmNo'])
        },
        missionCompletion: { completeMission: (...args) => calls.push(['completeMission', ...args]) },
        points: { add: (...args) => calls.push(['addImprovementPoints', ...args]) },
        missionScheduler: {
            getRepeatKey: (...args) => { calls.push(['getRepeatKey', ...args]); return 'daily-key'; },
            refreshRecurringMissions: () => calls.push(['refreshRecurringMissions']),
            resetRecurringMission: (...args) => calls.push(['resetRecurringMission', ...args]),
            checkMissedDeadlines: () => calls.push(['checkMissedDeadlines'])
        }
    }
};

const api = initializeLegacyCompatibility(windowRef);
assert.equal(typeof api.showPage, 'function');
assert.equal(typeof windowRef.showPage, 'function');
assert.equal(windowRef.getRepeatKey(new Date('2026-11-05T00:00:00Z'), 'weekly'), 'daily-key');
windowRef.showPage('goals');
windowRef.updatePlusBtn('missions');
windowRef.closeTimerSettingModal();
windowRef.applyTimerSettings();
windowRef.startStaticTimer(1, 2, 3);
windowRef.openModal('mission', { id: 'skill' });
windowRef.closeModal();
windowRef.customAlert('hello', () => {});
windowRef.closeAlert();
windowRef.customConfirm('sure?', () => {});
windowRef.confirmYes();
windowRef.confirmNo();
windowRef.completeMission({ id: 'mission' });
windowRef.addImprovementPoints(15);
windowRef.refreshRecurringMissions();
windowRef.resetRecurringMission({ id: 'li' }, 'key');
windowRef.checkMissedDeadlines();

for (const name of [
    'showPage', 'updatePlusBtn', 'closeTimerSettingModal', 'applyTimerSettings',
    'startStaticTimer', 'openModal', 'closeModal', 'customAlert', 'closeAlert',
    'customConfirm', 'confirmYes', 'confirmNo', 'completeMission',
    'addImprovementPoints', 'getRepeatKey', 'refreshRecurringMissions',
    'resetRecurringMission', 'checkMissedDeadlines'
]) assert.equal(typeof windowRef[name], 'function', `${name} global should exist`);

assert.ok(calls.some(([name]) => name === 'showPage'));
assert.ok(calls.some(([name]) => name === 'completeMission'));
assert.ok(calls.some(([name]) => name === 'addImprovementPoints'));
assert.ok(calls.some(([name]) => name === 'checkMissedDeadlines'));
console.log('[Legacy Compatibility Tests] PASSED (17 global bridges and delegated calls).');
