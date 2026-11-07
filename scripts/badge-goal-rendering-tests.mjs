import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = file => readFile(new URL(file, root), 'utf8');
const [badges, goals, serviceWorker] = await Promise.all([
    read('JS/features/badges/badges.js'),
    read('JS/features/goals/goals.js'),
    read('service-worker.js')
]);

assert.doesNotMatch(badges, /\.innerHTML\s*=/,
    'badge requirements, artwork, and collection must not use HTML-string sinks');
assert.match(badges, /name\.textContent\s*=\s*String\(requirement\.name/,
    'badge requirement labels must be rendered as text');
assert.match(badges, /title\.textContent\s*=\s*String\(badge\.title/,
    'stored badge titles must be rendered as text');
assert.match(badges, /month\.textContent\s*=\s*String\(badge\.month/,
    'stored badge months must be rendered as text');
assert.ok(badges.includes('^badges\\/'),
    'stored badge artwork must pass the local badge-path allow-list');
assert.match(badges, /collection\.replaceChildren\(empty\)/);
assert.match(badges, /createBadgeArtworkNode\(artwork\)/);

const goalEdit = goals.slice(goals.indexOf('function openEditGoal('), goals.indexOf('/* ---------------------------------------------------------\n   UPDATE GOAL', goals.indexOf('function openEditGoal(')));
assert.doesNotMatch(goalEdit, /\.innerHTML\s*=/,
    'goal edit modal must be built with DOM nodes');
assert.match(goalEdit, /titleInput\.value\s*=\s*String\(goal\.title/);
assert.match(goalEdit, /content\.replaceChildren\(/);
const achievementOverlay = goals.slice(goals.indexOf('function playGoalAchievementVideo('));
assert.doesNotMatch(achievementOverlay, /overlay\.innerHTML\s*=/,
    'goal achievement overlay must be built with DOM nodes');
assert.match(achievementOverlay, /videoElement\.append\(source\)/);
assert.match(goals, /overdueBadge\.replaceChildren\(overdueLabel\)/);
assert.doesNotMatch(goals, /overdueBadge\.innerHTML\s*=/);
assert.match(serviceWorker, /standout-v2\.100-special-card-interactions/);

console.log('[Badge & Goal Rendering Tests] PASSED (badge text, artwork allow-list, collection, goal edit modal, achievement overlay, overdue label, and cache version).');
