import assert from 'node:assert/strict';

const listeners = new Map();
const saveButtonListeners = new Map();
const fakeDocument = {
    readyState: 'loading',
    addEventListener(type, callback) {
        listeners.set(type, callback);
    },
    getElementById(id) {
        if (id !== 'monthlyResolutionSave') return null;
        return {
            addEventListener(type, callback) {
                saveButtonListeners.set(type, callback);
            }
        };
    }
};

globalThis.document = fakeDocument;
globalThis.window = {};
globalThis.localStorage = {
    getItem() { return null; },
    setItem() {}
};
globalThis.customAlert = () => {};

const { initializeMonthlyResolution } = await import(
    '../JS/features/monthly-resolution/monthly-resolution.js'
);

initializeMonthlyResolution();
assert.equal(typeof window.renderMonthlyResolution, 'function');
assert.equal(typeof window.saveMonthlyResolution, 'function');
assert.equal(typeof window.answerMonthlyResolution, 'function');
assert.equal(typeof listeners.get('DOMContentLoaded'), 'function');

listeners.get('DOMContentLoaded')();
assert.equal(typeof saveButtonListeners.get('click'), 'function');

// Missing feature markup must remain a safe no-op.
assert.doesNotThrow(() => window.renderMonthlyResolution());

console.log('Monthly Resolution tests passed (legacy API, startup binding, missing-markup safety).');
