import assert from 'node:assert/strict';
import { registerServiceWorker } from '../JS/core/service-worker-registration.js';

const calls = { listeners: [], registrations: [], logs: [], errors: [] };
const navigatorRef = {
    serviceWorker: {
        async register(path) {
            calls.registrations.push(path);
            return { scope: 'https://example.test/app/' };
        }
    }
};
const windowRef = {
    addEventListener(type, callback, options) {
        calls.listeners.push({ type, callback, options });
    }
};
const logger = {
    log(...args) { calls.logs.push(args); },
    error(...args) { calls.errors.push(args); }
};

assert.equal(registerServiceWorker({ navigatorRef: {}, windowRef, logger }), false,
    'unsupported browsers should not register or throw');
assert.equal(registerServiceWorker({ navigatorRef, windowRef, logger }), true);
assert.equal(calls.listeners.length, 1);
assert.equal(calls.listeners[0].type, 'load');
assert.deepEqual(calls.listeners[0].options, { once: true });
await calls.listeners[0].callback();
assert.deepEqual(calls.registrations, ['./service-worker.js']);
assert.equal(calls.logs.length, 1);
assert.equal(calls.errors.length, 0);

const failingWindow = { addEventListener(type, callback) { this.callback = callback; } };
const failingNavigator = { serviceWorker: { async register() { throw new Error('registration denied'); } } };
assert.equal(registerServiceWorker({ navigatorRef: failingNavigator, windowRef: failingWindow, logger }), true);
await failingWindow.callback();
assert.equal(calls.errors.length, 1, 'registration failures should be reported');

console.log('[Service Worker Registration Tests] PASSED (unsupported browser, load timing, app-relative path, and failure handling).');
