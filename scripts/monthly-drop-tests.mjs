import assert from "node:assert/strict";
import { createMonthlyDropController, MONTHLY_DROP_STORAGE_KEY } from "../JS/features/monthly-drop.js";

const values = new Map();
const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)) };
const logCalls = [];
const navigations = [];
let current = new Date(2026, 10, 1, 12, 0, 0);
const controller = createMonthlyDropController({
    storage,
    now: () => current,
    navigate: url => navigations.push(url),
    logger: { log: (...args) => logCalls.push(args) }
});

assert.equal(controller.getCurrentDropKey(), "2026-11");
assert.equal(controller.isMonthlyDropDay(), true);
assert.equal(controller.hasSeenCurrentDrop(), false);
assert.equal(MONTHLY_DROP_STORAGE_KEY, "standOutMonthlyDropSeen");

values.set(MONTHLY_DROP_STORAGE_KEY, "2026-11");
assert.equal(controller.hasSeenCurrentDrop(), true);
values.set(MONTHLY_DROP_STORAGE_KEY, "2026-10");
assert.equal(controller.hasSeenCurrentDrop(), false);

controller.openMonthlyDrop();
assert.deepEqual(navigations, ["drop-info.html"]);
assert.equal(logCalls.length, 1);

current = new Date(2026, 10, 2, 12, 0, 0);
assert.equal(controller.isMonthlyDropDay(), false);
assert.equal(controller.getCurrentDropKey(), "2026-11");

console.log("[Monthly Drop Tests] PASSED (month key, first-day gate, seen-state, navigation).");
