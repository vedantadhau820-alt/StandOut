import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const welcome = fs.readFileSync(new URL("../JS/features/welcome-intro.js", import.meta.url), "utf8");
const browserSmoke = fs.readFileSync(new URL("./browser-smoke.mjs", import.meta.url), "utf8");
assert.match(html, /<script type="module" src="JS\/features\/welcome-intro\.js"><\/script>/);
assert.doesNotMatch(html, /JS\/welcome\.js/);
for (const id of ["welcomeIntro", "welcomePanel", "welcomeReadyBtn", "welcomeVideoStage", "welcomeVideo"]) {
    assert.ok(welcome.includes(id), `Missing welcome DOM contract: ${id}`);
}
assert.match(welcome, /monthlyDrop\.isMonthlyDropDay\(\)/);
assert.match(welcome, /monthlyDrop\.hasSeenCurrentDrop\(\)/);
assert.match(welcome, /monthlyDrop\.openMonthlyDrop\(\)/);
assert.match(welcome, /video\.addEventListener\(\s*["']ended["']/);
assert.match(welcome, /event\.key === ["']Escape["']/);

assert.ok(browserSmoke.includes("async function dismissWelcomeIntro(page, label)"), "Browser smoke must dismiss the welcome intro before navigation.");
assert.ok(browserSmoke.includes("dismissWelcomeIntro(page, 'Desktop')"), "Desktop smoke must exercise welcome dismissal.");
assert.ok(browserSmoke.includes("dismissWelcomeIntro(mobilePage, 'Mobile')"), "Mobile smoke must exercise welcome dismissal.");
assert.ok(browserSmoke.includes("standOutMonthlyDropSeen"), "Browser contexts must isolate the optional Monthly Drop route.");

console.log("[Welcome Intro Smoke Tests] PASSED (module loading, DOM contracts, Monthly Drop integration, video completion, Escape handling, and browser-smoke welcome lifecycle).");
