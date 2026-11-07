import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const indexHTML = await readFile(new URL('index.html', root), 'utf8');
const guideHTML = await readFile(new URL('standout-guide.html', root), 'utf8');
const serviceWorker = await readFile(new URL('service-worker.js', root), 'utf8');
const moduleSource = await readFile(new URL('../JS/core/event-delegation.js', import.meta.url), 'utf8');

function withoutComments(source) {
    return source.replace(/<!--[\s\S]*?-->/g, '');
}

for (const [name, source] of [['index.html', indexHTML], ['standout-guide.html', guideHTML]]) {
    const activeMarkup = withoutComments(source);
    assert.doesNotMatch(activeMarkup, /\son(?:click|input|change|submit|keydown|keyup|keypress|load|error|focus|blur)\s*=/i,
        `${name} must not contain inline event-handler attributes`);
    assert.match(activeMarkup, /JS\/core\/event-delegation\.js/,
        `${name} must load the external event delegation module`);
}

assert.match(serviceWorker, /standout-v2\.100-special-card-interactions/,
    'service-worker cache must be versioned for the new active module');
assert.match(serviceWorker, /"\/JS\/core\/event-delegation\.js"/,
    'event delegation module must be precached');
assert.doesNotMatch(moduleSource, /\beval\s*\(|\bnew\s+Function\s*\(/,
    'event delegation must not evaluate strings');
const htmlActionNames = [...(indexHTML + guideHTML).matchAll(/data-action-name="([^"]+)"/g)].map(match => match[1]);
assert.equal(htmlActionNames.length, 40, 'all 39 index actions and the guide action must be migrated');

class FakeElement {
    constructor(action, name) {
        this.dataset = { action, actionName: name };
        this.value = '0.35';
    }
    closest() { return this; }
}
class FakeHTMLElement extends FakeElement {}
const listeners = {};
globalThis.Element = FakeElement;
globalThis.HTMLElement = FakeHTMLElement;
globalThis.window = {
    calls: [],
    closePopup() { this.calls.push('closePopup'); },
    music: { volume: 1 }
};
globalThis.document = {
    addEventListener(type, callback) { listeners[type] = callback; }
};

const { ACTIONS, dispatchClick, dispatchInput } = await import('../JS/core/event-delegation.js');
assert.equal(typeof listeners.click, 'function');
assert.equal(typeof listeners.input, 'function');
assert.ok(Object.isFrozen(ACTIONS), 'action registry must be immutable');
for (const name of htmlActionNames) assert.ok(Object.hasOwn(ACTIONS, name) || name === 'setMusicVolume', `missing action mapping: ${name}`);

dispatchClick({ target: new FakeHTMLElement('click', 'closePopup') });
assert.deepEqual(window.calls, ['closePopup'], 'delegated click must invoke the allow-listed action');
dispatchInput({ target: new FakeHTMLElement('input', 'setMusicVolume') });
assert.equal(window.music.volume, '0.35', 'volume input must update the existing music element');
const originalError = console.error;
console.error = () => {};
dispatchClick({ target: new FakeHTMLElement('click', 'not-registered') });
console.error = originalError;
assert.deepEqual(window.calls, ['closePopup'], 'unknown actions must not execute');

globalThis.document = undefined;
globalThis.window = undefined;
console.log('[Event Delegation Tests] PASSED (static HTML, allow-list, click/input dispatch, unknown action rejection, and cache coverage).');
