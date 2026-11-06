#!/usr/bin/env node
/**
 * Read-only architecture assessment for the active StandOut application.
 * Reports startup scripts, the modular import graph, legacy script sizes,
 * global compatibility writes, and inline HTML event handlers.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const html = read('index.html').replace(/<!--[\s\S]*?-->/g, '');
const scriptTags = [...html.matchAll(/<script\b([^>]*)>/gi)].map(match => match[1]);
const activeScriptRecords = scriptTags
    .map(attrs => ({
        src: attrs.match(/\bsrc=["']([^"']+)["']/i)?.[1],
        isModule: /\btype=["']module["']/i.test(attrs)
    }))
    .filter(record => record.src)
    .map(record => ({ ...record, src: record.src.replace(/^\.\//, '').replace(/^\//, '') }));
const activeScripts = activeScriptRecords.map(record => record.src);
const inlineHandlerCount = [...html.matchAll(/\bon[a-z][a-z0-9_-]*\s*=/gi)].length;

const visited = new Set();
const failures = [];
function visit(relative) {
    const absolute = path.resolve(root, relative);
    if (!absolute.startsWith(root + path.sep) || !fs.existsSync(absolute)) {
        failures.push(`Missing active module: ${relative}`);
        return;
    }
    const normalized = path.relative(root, absolute).split(path.sep).join('/');
    if (visited.has(normalized)) return;
    visited.add(normalized);
    const source = fs.readFileSync(absolute, 'utf8');
    const importPattern = /(?:\bfrom\s*|\bimport\s*)["']([^"']+)["']/g;
    for (const match of source.matchAll(importPattern)) {
        if (!match[1].startsWith('.')) continue;
        const resolved = path.resolve(path.dirname(absolute), match[1]);
        if (!resolved.startsWith(root + path.sep) || !fs.existsSync(resolved)) {
            failures.push(`Unresolved import ${match[1]} in ${normalized}`);
            continue;
        }
        visit(path.relative(root, resolved));
    }
}

const bootstrapIndex = activeScripts.indexOf('JS/core/bootstrap.js');
if (bootstrapIndex < 0) failures.push('Modular bootstrap is not loaded by index.html.');
else {
    for (const record of activeScriptRecords.filter(item => item.isModule)) visit(record.src);
}

const legacyScripts = activeScriptRecords
    .filter(record => !record.isModule && record.src.endsWith('.js'))
    .map(record => record.src);
const activeFeatureModules = activeScriptRecords
    .filter(record => record.isModule)
    .map(record => record.src);
const legacyDetails = legacyScripts.map(relative => {
    const source = read(relative);
    return {
        path: relative,
        lines: source.split(/\r?\n/).length,
        bytes: Buffer.byteLength(source),
        windowAssignments: [...source.matchAll(/\bwindow\.[A-Za-z_$][\w$]*\s*=/g)].length
    };
});

const monolithPath = 'JS/app.js';
const monolithExists = fs.existsSync(path.join(root, monolithPath));
const monolithLoaded = activeScripts.includes(monolithPath);
const monolithLines = monolithExists ? read(monolithPath).split(/\r?\n/).length : 0;
const totalLegacyLines = legacyDetails.reduce((sum, item) => sum + item.lines, 0);

if (failures.length) {
    console.error('[Architecture Assessment] FAILED');
    failures.forEach(item => console.error(` - ${item}`));
    process.exit(1);
}

console.log('[Architecture Assessment] COMPLETED');
console.log(` - Active external scripts: ${activeScripts.length}`);
console.log(` - Modular bootstrap dependency graph: ${visited.size} files`);
console.log(` - Active legacy classic scripts: ${legacyDetails.length}`);
console.log(` - Active module script entry points: ${activeFeatureModules.length}`);
for (const item of activeFeatureModules) console.log(`   module: ${item}`);
console.log(` - Active legacy classic-script lines (approx.): ${totalLegacyLines}`);
console.log(` - Inline HTML event-handler attributes: ${inlineHandlerCount}`);
console.log(` - Inactive ${monolithPath}: ${monolithExists ? `${monolithLines} lines, not loaded` : 'not present'}`);
console.log(' - Active legacy script inventory:');
for (const item of legacyDetails) {
    console.log(`   ${item.path}: ${item.lines} lines, ${item.windowAssignments} window assignments`);
}
console.log(' - Assessment is read-only; no application or user data was modified.');
