import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const root = new URL("../", import.meta.url);
const [modals, completion, serviceWorker] = await Promise.all([
  readFile(new URL("JS/features/modals.js", root), "utf8"),
  readFile(new URL("JS/features/missions/completion.js", root), "utf8"),
  readFile(new URL("service-worker.js", root), "utf8")
]);
assert.doesNotMatch(modals, /\.innerHTML\s*=/, "modal forms must not use HTML-string sinks");
assert.match(modals, /function createModalElement\(/);
assert.match(modals, /function createModalSelect\(/);
assert.match(modals, /option\.textContent = name/);
assert.match(modals, /content\.replaceChildren\(\.\.\.nodes\)/);
assert.match(modals, /nodes\.push\(createModalButton\("Update", "updateMission"\)\)/);
assert.match(modals, /window\.missionBeingEdited = skillDiv/);
assert.match(modals, /window\.skillBeingEdited = skillDiv/);
assert.match(modals, /timeZone: "Asia\/Kolkata"/);
assert.doesNotMatch(completion, /overdueMark\.innerHTML\s*=/);
assert.match(completion, /overdueMark\.replaceChildren\(\)/);
assert.match(serviceWorker, /standout-v2\.100-special-card-interactions/);
console.log("[Modal DOM Tests] PASSED (DOM-built forms, text-safe dynamic values, edit state, countdown IST, and completion marker clearing).");
