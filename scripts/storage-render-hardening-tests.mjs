import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = file => readFile(new URL(file, root), 'utf8');
const [goals, achievements, marketplace, momentum, monthlyReport, serviceWorker] = await Promise.all([
    read('JS/features/goals/goals.js'),
    read('JS/features/achievements/achievements.js'),
    read('JS/features/cards/marketplace.js'),
    read('JS/features/momentum/momentum.js'),
    read('JS/features/monthly-report.js'),
    read('service-worker.js')
]);

assert.match(goals, /storedGoals\.filter\(goal => goal && typeof goal === "object" && !Array\.isArray\(goal\)\)/,
    'malformed goal storage entries must be excluded before record access');
assert.match(goals, /set: value => \{ goalsDataState = Array\.isArray\(value\) \? value\.filter\(goal => goal && typeof goal === "object" && !Array\.isArray\(goal\)\) : \[\]; \}/,
    'the compatibility setter must enforce the same goal record shape');
assert.match(achievements, /savedAchievements = stored\.filter\([\s\S]*?item && typeof item === "object" && !Array\.isArray\(item\)/,
    'malformed achievement entries must be excluded before ID lookup');
assert.match(achievements, /container\.replaceChildren\(\)/,
    'achievement collection clearing must not use an HTML-string sink');
assert.doesNotMatch(marketplace.slice(marketplace.indexOf('function renderMyCards()'), marketplace.indexOf('function isExpired(')), /\.innerHTML\s*=/,
    'owned season-card rendering must use DOM properties');
assert.match(marketplace, /image\.src = getSafeCardImageSource\(card\.image\)/,
    'owned season-card image paths must use the existing source allow-list');
assert.match(marketplace, /title\.textContent = String\(card\.title/);
assert.match(marketplace, /quote\.textContent = String\(card\.quote/);
assert.match(momentum, /toast\.replaceChildren\(titleNode, messageNode\)/,
    'momentum toast content must be assigned as text');
assert.doesNotMatch(momentum.slice(momentum.indexOf('function showMomentumToast'), momentum.indexOf('function ', momentum.indexOf('function showMomentumToast') + 10)), /toast\.innerHTML\s*=/);
assert.match(monthlyReport, /monthSelect\.replaceChildren\(\)/,
    'monthly report options must be cleared with DOM APIs');
assert.doesNotMatch(momentum.slice(momentum.indexOf('function renderCore()'), momentum.indexOf('/* =========================================================\n       RENDER EVERYTHING', momentum.indexOf('function renderCore()'))), /\.innerHTML\s*=/,
    'Momentum core and panel must use safe DOM construction');
assert.match(momentum, /core\.replaceChildren\(light, text\)/);
assert.match(momentum, /panel\.replaceChildren\(fragment\)/);
assert.match(serviceWorker, /standout-v2\.100-special-card-interactions/);

console.log('[Storage & Rendering Hardening Tests] PASSED (goal record shape, achievement record shape, owned season cards, momentum toast, monthly selector, and cache version).');
