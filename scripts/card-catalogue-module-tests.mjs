import assert from 'node:assert/strict';
import crypto from 'node:crypto';

// The browser module publishes the catalogue on the global compatibility API.
globalThis.window = globalThis;

const { builtInCardCatalog } = await import('../JS/features/cards/catalogue-data.js');
const { cardCatalogue } = await import('../JS/features/cards/catalogue.js');

assert.equal(Array.isArray(globalThis.cardCatalog), true, 'module must publish window.cardCatalog');
assert.equal(globalThis.cardCatalog, builtInCardCatalog, 'global must reference the canonical built-in array');
assert.equal(builtInCardCatalog.length, 43, 'built-in card record count must remain unchanged');

const checksum = crypto
    .createHash('sha256')
    .update(JSON.stringify(builtInCardCatalog))
    .digest('hex');
assert.equal(
    checksum,
    'e15a2ae2c009855eb0d54a2e849f3b7033d43db49546acf7cf2de0fc3ce91af8',
    'serialized built-in card data must remain byte-for-byte equivalent in meaning'
);

const originalCatalogue = globalThis.cardCatalog;
const replacement = [{ id: 'runtime-reassignment-test', title: 'Runtime Test', grade: 'E', cost: 1 }];
globalThis.cardCatalog = replacement;
assert.equal(cardCatalogue.getAll().length, 1, 'facade must resolve the current global array');
assert.equal(cardCatalogue.getById('runtime-reassignment-test'), replacement[0]);
assert.equal(cardCatalogue.getAll()[0], replacement[0], 'facade copy must retain live record identity');
assert.equal(cardCatalogue.validate().valid, true);

// Reassignment is intentionally supported by custom-card, restore, and reset flows.
globalThis.cardCatalog = originalCatalogue;
assert.equal(cardCatalogue.getAll().length, 43, 'restoring the global must restore facade visibility');
assert.equal(cardCatalogue.getSeasonRewards('season-03').length, 2);
assert.equal(cardCatalogue.getById('season_03_card').specialPower, 'shield');
assert.equal(cardCatalogue.getById('season_03_exclusive_card').specialPower, 'improvement');
assert.equal(cardCatalogue.getById('Raje').specialPower, 'discount');
assert.equal(cardCatalogue.getMarketplaceCards().some(card => card.seasonReward === true), false);

console.log('[Card Catalogue Module Tests] PASSED (43 records, checksum, global publication, reassignment, facade behavior, and Season rewards).');
