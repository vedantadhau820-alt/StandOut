import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sources = {
    marketplace: await readFile(new URL('../JS/features/cards/marketplace.js', import.meta.url), 'utf8'),
    monthlyResolution: await readFile(new URL('../JS/features/monthly-resolution/monthly-resolution.js', import.meta.url), 'utf8'),
    notifications: await readFile(new URL('../JS/features/notifications/notifications.js', import.meta.url), 'utf8'),
    appPart3: await readFile(new URL('../JS/app-part3.js', import.meta.url), 'utf8'),
    serviceWorker: await readFile(new URL('../service-worker.js', import.meta.url), 'utf8')
};

for (const [name, source] of Object.entries(sources)) {
    if (name === 'serviceWorker') continue;
    assert.doesNotMatch(source, /\.onclick\s*=/, `${name} must not assign onclick properties`);
}

assert.match(sources.marketplace, /\.card-filters button[\s\S]*?addEventListener\("click"/,
    'marketplace filters must bind click listeners');
assert.match(sources.marketplace, /marketplaceIcon\.addEventListener\("click"/,
    'marketplace icon must bind a click listener');
assert.match(sources.monthlyResolution, /yesButton\?\.addEventListener\("click"/,
    'monthly resolution Yes action must be registered once during initialization');
assert.match(sources.monthlyResolution, /noButton\?\.addEventListener\("click"/,
    'monthly resolution No action must be registered once during initialization');
assert.match(sources.notifications, /bell\.addEventListener\("click"/,
    'notification drawer toggle must use addEventListener');
assert.match(sources.appPart3, /removeBtn\.addEventListener\("click"/,
    'legacy goal-card remove action must use addEventListener');
assert.match(sources.serviceWorker, /standout-v2\.100-special-card-interactions/,
    'service worker cache must be versioned for this release');

console.log('[Programmatic Event Tests] PASSED (marketplace, monthly resolution, notifications, goal cards, and cache version).');
