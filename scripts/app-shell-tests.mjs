import assert from 'node:assert/strict';
import { initializeAppShell } from '../JS/features/app-shell.js';

const nodes = new Map();
const sections = [makeElement('goals')];
const calls = { intervals: [], notifications: [], reports: 0, pages: [] };
const documentRef = {
    body: { appendChild(node) { nodes.set(node.id, node); } },
    createElement() {
        return {
            id: '', textContent: '', style: {},
            remove() { nodes.delete(this.id); }
        };
    },
    getElementById(id) {
        if (id === 'monthlyReportIcon') return icon;
        if (id === 'monthlyReport') return report;
        if (id === 'missions') return missions;
        if (id === 'sw-updating') return nodes.get(id) || null;
        return null;
    },
    querySelectorAll(selector) { return selector === 'section' ? sections : []; }
};
function makeElement(id) {
    const classes = new Set();
    return {
        id,
        classList: {
            add(name) { classes.add(name); },
            remove(name) { classes.delete(name); },
            contains(name) { return classes.has(name); }
        },
        classes,
        addEventListener(type, callback) { this.listener = callback; }
    };
}
const icon = makeElement('monthlyReportIcon');
const report = makeElement('monthlyReport');
const missions = makeElement('missions');
missions.classList.add('active');
sections.unshift(missions, report);
const windowRef = {
    showSmartNotification(...args) { calls.notifications.push(args); },
    renderMonthlyReport() { calls.reports += 1; },
    updatePlusBtn(page) { calls.pages.push(page); }
};

initializeAppShell({
    documentRef,
    windowRef,
    setIntervalRef(callback, delay) { calls.intervals.push({ callback, delay }); }
});

assert.equal(typeof windowRef.showUpdatingIndicator, 'function');
assert.equal(typeof windowRef.hideUpdatingIndicator, 'function');
assert.equal(typeof windowRef.showUpdateReadyIndicator, 'function');
windowRef.showUpdatingIndicator();
assert.equal(nodes.get('sw-updating').textContent, '⬇️ Updating app...');
windowRef.showUpdatingIndicator();
assert.equal(nodes.size, 1, 'indicator creation should be idempotent');
assert.equal(calls.intervals.length, 1);
assert.equal(calls.intervals[0].delay, 500);
calls.intervals[0].callback();
assert.equal(nodes.get('sw-updating').textContent, '⬇️ Updating app.');
windowRef.hideUpdatingIndicator();
assert.equal(nodes.has('sw-updating'), false);
windowRef.showUpdateReadyIndicator();
assert.deepEqual(calls.notifications[0], ['Update Ready', 'New version downloaded.']);

icon.listener();
assert.equal(report.classList.contains('active'), true);
assert.equal(missions.classList.contains('active'), false);
assert.equal(calls.reports, 1);
assert.equal(calls.pages.at(-1), 'monthlyReport');
icon.listener();
assert.equal(report.classList.contains('active'), false);
assert.equal(missions.classList.contains('active'), true);
assert.equal(calls.pages.at(-1), 'missions');

console.log('[App Shell Tests] PASSED (update indicator, compatibility globals, report toggle, and navigation bridge).');
