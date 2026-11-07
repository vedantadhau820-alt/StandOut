import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = file => readFile(new URL(file, root), 'utf8');
const [notifications, resetUI, missionManagement, scheduler, monthlyReport, momentum, serviceWorker] = await Promise.all([
    read('JS/features/notifications/notifications.js'),
    read('JS/features/data/reset-ui.js'),
    read('JS/features/missions/management.js'),
    read('JS/features/missions/scheduler.js'),
    read('JS/features/monthly-report.js'),
    read('JS/features/momentum/momentum.js'),
    read('service-worker.js')
]);

assert.doesNotMatch(notifications, /\.innerHTML\s*=/,
    'notification rendering and clearing must not use HTML-string sinks');
assert.match(notifications, /title\.textContent\s*=\s*notification\.title/);
assert.match(notifications, /message\.textContent\s*=\s*notification\.msg/);
assert.match(notifications, /list\.replaceChildren\(empty\)/,
    'cleared notifications must use a DOM-built empty state');

assert.doesNotMatch(resetUI, /\.innerHTML\s*=/,
    'reset UI must clear or build nodes with DOM APIs');
assert.match(resetUI, /customCardsManager\.replaceChildren\(emptyState\)/);
assert.match(resetUI, /notificationList\.replaceChildren\(emptyState\)/);

assert.doesNotMatch(missionManagement, /li\.innerHTML\s*=/,
    'mission structure must be built with DOM nodes');
assert.match(missionManagement, /deadlineDisplay\.textContent\s*=\s*deadlineText/);
assert.match(missionManagement, /repeatLabels\s*=\s*\{/);
assert.match(missionManagement, /li\.replaceChildren\(missionText, deadlineRow\)/);
assert.doesNotMatch(scheduler, /overdueSpan\.innerHTML\s*=/,
    'overdue badge must be constructed as a DOM node');
assert.match(scheduler, /overdueSpan\.replaceChildren\(overdueBadge\)/);

const momentumChart = monthlyReport.slice(
    monthlyReport.indexOf('function renderMonthlyMomentumChart('),
    monthlyReport.indexOf('function ', monthlyReport.indexOf('function renderMonthlyMomentumChart(') + 12)
);
assert.doesNotMatch(momentumChart, /\.innerHTML\s*=/,
    'monthly momentum chart clearing and empty state must use DOM APIs');
assert.match(momentumChart, /container\.replaceChildren\(emptyState\)/);
assert.doesNotMatch(momentum.slice(momentum.indexOf('function renderCore()'), momentum.indexOf('/* =========================================================\n       RENDER EVERYTHING', momentum.indexOf('function renderCore()'))), /\.innerHTML\s*=/,
    'Momentum core and panel must use safe DOM construction');
assert.match(momentum, /core\.replaceChildren\(light, text\)/);
assert.match(momentum, /panel\.replaceChildren\(fragment\)/);
assert.match(serviceWorker, /standout-v2\.100-special-card-interactions/);

console.log('[Safe Rendering Tests] PASSED (notification content, reset states, mission DOM, overdue badge, monthly momentum empty state, and cache version).');
