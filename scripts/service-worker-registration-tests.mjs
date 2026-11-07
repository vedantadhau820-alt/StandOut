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
assert.equal(registerServiceWorker({ navigatorRef, windowRef, logger, documentRef: undefined }), true);
await new Promise(resolve => setImmediate(resolve));
assert.deepEqual(calls.registrations, ['./service-worker.js']);
assert.ok(calls.listeners.some(item => item.type === 'focus'));
assert.ok(calls.listeners.some(item => item.type === 'pageshow'));
assert.equal(calls.logs.length, 1);
assert.equal(calls.errors.length, 0);

const failingWindow = { addEventListener() {} };
const failingNavigator = { serviceWorker: { async register() { throw new Error('registration denied'); } } };
assert.equal(registerServiceWorker({ navigatorRef: failingNavigator, windowRef: failingWindow, logger, documentRef: undefined }), true);
await new Promise(resolve => setImmediate(resolve));
assert.equal(calls.errors.length, 1, 'registration failures should be reported');

console.log('[Service Worker Registration Tests] PASSED (unsupported browser, load timing, app-relative path, and failure handling).');
