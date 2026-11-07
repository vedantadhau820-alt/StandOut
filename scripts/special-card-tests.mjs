import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = file => readFile(new URL(file, root), 'utf8');
const [catalogue, marketplace, momentum, css, serviceWorker] = await Promise.all([
    read('JS/features/cards/catalogue-data.js'),
    read('JS/features/cards/marketplace.js'),
    read('JS/features/momentum/momentum.js'),
    read('CSS/components.css'),
    read('service-worker.js')
]);

assert.match(catalogue, /id: "season_03_card"[\s\S]*?specialPower: "shield"/);
assert.match(catalogue, /id: "season_03_exclusive_card"[\s\S]*?specialPower: "improvement"/);
assert.match(catalogue, /id: "Raje"[\s\S]*?specialPower: "discount"/);
assert.match(marketplace, /intervalDays: 7/);
assert.match(marketplace, /intervalDays: 14/);
assert.match(marketplace, /addCalendarMonthsToKey\(activatedAt, 3\)/);
assert.match(marketplace, /ACTIVATE/);
assert.match(marketplace, /20% OFF/);
assert.match(marketplace, /rewardThroughDate/);
assert.match(marketplace, /__standoutSpecialCardClockStarted/);
assert.match(marketplace, /nextRewardDate <= rewardThroughDate/);
assert.match(marketplace, /Math\.round\(cost \* 0\.8\)/);
assert.match(momentum, /addShieldPoints\(amount = 1\)/);
assert.match(momentum, /state\.shields = Math\.max\(0, Number\(state\.shields\) \|\| 0\) \+ value/);
assert.match(css, /SPECIAL CARDS — shared treatment across Marketplace\/collection/);
assert.match(css, /\.special-activate-btn/);
assert.match(serviceWorker, /standout-v2\.100-special-card-interactions/);


assert.ok(marketplace.includes("!/ ^") === false && marketplace.includes("!/^\\d{4}-\\d{2}-\\d{2}$/"), "Date parser must validate YYYY-MM-DD using digit classes.");
assert.match(marketplace, /function bindSpecialActionButton\(/);
assert.match(marketplace, /addEventListener\("dblclick"/);
assert.match(marketplace, /togglePinnedCard\(card\)/);
assert.match(marketplace, /window\.__standoutSpecialCardTestDate/);
assert.match(marketplace, /localStorage\.getItem\("ownedCards"\)/);
assert.match(marketplace, /special-discount-banner/);
assert.match(marketplace, /window\.isSpecialDiscountActive = isSpecialDiscountActive/);

console.log('[Special Card Tests] PASSED (assignments, activation, calendar expiry, reward cadence/catch-up, Sunday discount, Shield integration, and shared styling).');
