#!/usr/bin/env node
/**
 * Final, read-only security release inventory for StandOut.
 * Reports remaining inline handlers and HTML sinks without treating every
 * occurrence as exploitable. Review each context before migrating it.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const html = read('index.html');
const activeHtmlForScripts = html.replace(/<!--[\s\S]*?-->/g, '');
const activeClassicScripts = [...activeHtmlForScripts.matchAll(/<script\b([^>]*)>/gi)]
  .map(match => match[1])
  .filter(attrs => !/\btype\s*=\s*["']module["']/i.test(attrs))
  .map(attrs => attrs.match(/\bsrc=["']([^"']+)['"]/i)?.[1])
  .filter(Boolean)
  .map(src => src.replace(/^\.\//, ''));

const activeFiles = new Set(activeClassicScripts);
const pending = ['JS/core/bootstrap.js'];
while (pending.length) {
  const file = pending.pop();
  if (activeFiles.has(file)) continue;
  activeFiles.add(file);
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute)) continue;
  const source = fs.readFileSync(absolute, 'utf8');
  for (const match of source.matchAll(/(?:from\s*|import\s*)["']([^"']+)['"]/g)) {
    if (match[1].startsWith('.')) {
      pending.push(path.posix.normalize(path.posix.join(path.posix.dirname(file), match[1])));
    }
  }
}

const activeHtml = html.replace(/<!--[\s\S]*?-->/g, '');
const inlineAttributes = [...activeHtml.matchAll(/\son[a-z]+\s*=\s*(["'])/gi)].length;
const inlineScriptBlocks = [...activeHtmlForScripts.matchAll(/<script\b(?![^>]*\bsrc\s*=)[^>]*>/gi)].length;
const inventory = [];
let innerHTMLAssignments = 0;
let inlinePropertyAssignments = 0;
let insertAdjacentHTMLCalls = 0;
let dynamicExecutionApis = 0;

for (const file of [...activeFiles].sort()) {
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute)) continue;
  const source = fs.readFileSync(absolute, 'utf8');
  const counts = {
    innerHTML: [...source.matchAll(/\.innerHTML\s*=/g)].length,
    inlineHandlers: [...source.matchAll(/\.on[a-z]+\s*=/gi)].length,
    insertAdjacentHTML: [...source.matchAll(/insertAdjacentHTML\s*\(/g)].length,
    dynamicExecution: [...source.matchAll(/\beval\s*\(|\bnew\s+Function\s*\(|document\.write\s*\(/g)].length,
  };
  innerHTMLAssignments += counts.innerHTML;
  inlinePropertyAssignments += counts.inlineHandlers;
  insertAdjacentHTMLCalls += counts.insertAdjacentHTML;
  dynamicExecutionApis += counts.dynamicExecution;
  if (Object.values(counts).some(Boolean)) inventory.push({ file, ...counts });
}

const audit = read('scripts/security-audit.mjs');
const requiredGuards = [
  ['mission creation/editing', /mission creation must render|missionManagement/],
  ['achievement rendering', /Achievement tiles must render/],
  ['minted-card rendering', /Minted-card reveal must build DOM safely/],
  ['monthly resolution rendering', /Monthly resolution review messages must be built/],
  ['navigation event handlers', /Navigation and global Add controls must use registered event listeners/],
  ['programmatic UI event migration', /Direct DOM event-property assignment remains in active script/],
  ['modal event handlers', /Modal templates must not emit inline event-handler attributes/],
  ['mastery rendering', /Mastery rendering and milestone input rows must not use HTML-string sinks/],
  ['monthly insights rendering', /Monthly insights must render generated insight content with DOM nodes/],
  ['safe notification, reset, mission, and chart rendering', /Notification content and empty states must use safe DOM nodes/],
];
const missingGuards = requiredGuards.filter(([, pattern]) => !pattern.test(audit)).map(([name]) => name);

console.log('[Security Release Review] COMPLETED');
console.log(` - Active script paths inspected: ${activeFiles.size}`);
console.log(` - Inline event attributes remaining in index.html: ${inlineAttributes}`);
console.log(` - Inline script blocks in index.html: ${inlineScriptBlocks}`);
console.log(` - innerHTML assignments in active scripts (context review required): ${innerHTMLAssignments}`);
console.log(` - inline event-property assignments in active scripts: ${inlinePropertyAssignments}`);
console.log(` - insertAdjacentHTML calls in active scripts: ${insertAdjacentHTMLCalls}`);
console.log(` - unsafe dynamic execution APIs: ${dynamicExecutionApis}`);
console.log(` - security regression guards present: ${requiredGuards.length - missingGuards.length}/${requiredGuards.length}`);
if (missingGuards.length) {
  console.error(` - Missing regression guards: ${missingGuards.join(', ')}`);
  process.exitCode = 1;
}
console.log(' - Largest remaining review areas:');
for (const item of inventory.sort((a, b) => (b.innerHTML + b.inlineHandlers) - (a.innerHTML + a.inlineHandlers)).slice(0, 12)) {
  console.log(`   ${item.file}: innerHTML=${item.innerHTML}, inlineHandlers=${item.inlineHandlers}, insertAdjacentHTML=${item.insertAdjacentHTML}`);
}
console.log(' - This inventory is conservative and does not prove exploitability. Manually review each sink and its input sources.');
