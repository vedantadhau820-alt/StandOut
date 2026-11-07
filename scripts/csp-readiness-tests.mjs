import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = new URL('../', import.meta.url);
const htmlFiles = ['index.html', 'documentation.html', 'standout-guide.html', 'drop-info.html'];
let inlineScripts = 0;
let inlineHandlers = 0;
let embeddedStyles = 0;
let inlineStyleAttributes = 0;
for (const file of htmlFiles) {
  const rawHtml = await readFile(new URL(file, root), 'utf8');
  const html = rawHtml.replace(/<!--[\s\S]*?-->/g, '');
  inlineScripts += [...html.matchAll(/<script\b(?![^>]*\bsrc\s*=)[^>]*>/gi)].length;
  inlineHandlers += [...html.matchAll(/\son[a-z]+\s*=/gi)].length;
  embeddedStyles += [...html.matchAll(/<style\b/gi)].length;
  inlineStyleAttributes += [...html.matchAll(/\sstyle\s*=/gi)].length;
}
assert.equal(inlineScripts, 0, 'HTML pages must not reintroduce inline script blocks');
assert.equal(inlineHandlers, 0, 'HTML pages must not reintroduce inline event-handler attributes');
assert.equal(embeddedStyles, 0, 'Embedded style blocks must remain externalized');
assert.equal(inlineStyleAttributes, 0, 'Static inline style attributes must be externalized before CSP rollout');
for (const [htmlFile, cssFile] of [
  ['index.html', 'CSS/index-embedded.css'],
  ['documentation.html', 'CSS/documentation-embedded.css'],
  ['standout-guide.html', 'CSS/standout-guide-embedded.css'],
]) {
  const html = await readFile(new URL(htmlFile, root), 'utf8');
  const css = await readFile(new URL(cssFile, root), 'utf8');
  assert.ok(html.includes(cssFile), `${htmlFile} must link ${cssFile}`);
  assert.ok(css.trim().length > 0, `${cssFile} must contain extracted styles`);
}
const sw = await readFile(new URL('service-worker.js', root), 'utf8');
for (const asset of ['index-embedded.css', 'documentation-embedded.css', 'standout-guide-embedded.css']) {
  assert.ok(sw.includes(`/CSS/${asset}`), `${asset} must be included in the service-worker app shell`);
}
assert.match(sw, /standout-v2\.100-special-card-interactions/, 'Service-worker cache version must be advanced');
const draft = await readFile(new URL('Extra/CSP-REPORT-ONLY-DRAFT.md', root), 'utf8');
assert.match(draft, /Content-Security-Policy-Report-Only:/, 'A report-only candidate header must be documented');
assert.match(draft, /CSP enforcement is not enabled/i, 'The report must state that enforcing CSP remains disabled');
const indexHtml = await readFile(new URL('index.html', root), 'utf8');
const indexCss = await readFile(new URL('CSS/index-embedded.css', root), 'utf8');
const timerCss = await readFile(new URL('CSS/timer.css', root), 'utf8');
for (const className of ['top-nav-action', 'top-nav-action-icon', 'top-nav-notification-badge', 'achievements-viewer', 'backup-save-btn', 'backup-restore-btn', 'smart-notification-popup', 'visually-hidden-file-input', 'music-volume-label']) {
  assert.ok(indexHtml.includes(className), `index.html must use externalized class ${className}`);
  assert.ok(indexCss.includes(`.${className}`), `index-embedded.css must define ${className}`);
}
assert.match(timerCss, /#flipTimer\s*\{/);
assert.match(timerCss, /#timerScreen\s*\{/);
console.log(`[CSP Readiness Tests] PASSED (4 HTML pages; inline scripts=${inlineScripts}, handlers=${inlineHandlers}, embedded styles=${embeddedStyles}, style attributes=${inlineStyleAttributes}).`);
