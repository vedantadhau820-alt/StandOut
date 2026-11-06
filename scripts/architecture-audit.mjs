#!/usr/bin/env node
/**
 * StandOut architecture guardrails.
 *
 * Checks the active modular bootstrap import graph, service-worker app-shell
 * coverage, local import resolution, and critical HTML startup ordering. This
 * is intentionally dependency-free and does not modify application data.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const warnings = [];
const toPosix = value => value.split(path.sep).join('/');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const serviceWorker = read('service-worker.js');
const appShellMatch = serviceWorker.match(/const APP_SHELL\s*=\s*\[([\s\S]*?)\n\];/);
if (!appShellMatch) {
    console.error('[Architecture Audit] Could not locate APP_SHELL in service-worker.js.');
    process.exit(1);
}

const appShellEntries = [...appShellMatch[1].matchAll(/["']([^"']+)["']/g)]
    .map(match => match[1].replace(/^\.\//, '').replace(/^\/+/, ''));
const appShell = new Set(appShellEntries);
const duplicateEntries = appShellEntries.filter((entry, index) => appShellEntries.indexOf(entry) !== index);
if (duplicateEntries.length) {
    failures.push(`Duplicate service-worker app-shell entries: ${[...new Set(duplicateEntries)].join(', ')}`);
}

const visited = new Set();
const importedModules = new Set();
function inspectModule(relativePath) {
    const absolutePath = path.resolve(root, relativePath);
    if (!absolutePath.startsWith(root + path.sep) || !fs.existsSync(absolutePath)) {
        failures.push(`Missing local module: ${relativePath}`);
        return;
    }
    const normalized = toPosix(path.relative(root, absolutePath));
    if (visited.has(normalized)) return;
    visited.add(normalized);
    importedModules.add(normalized);

    const source = fs.readFileSync(absolutePath, 'utf8');
    const importPattern = /(?:\bfrom\s*|\bimport\s*)["']([^"']+)["']/g;
    for (const match of source.matchAll(importPattern)) {
        const specifier = match[1];
        if (!specifier.startsWith('.')) continue;
        const resolved = path.resolve(path.dirname(absolutePath), specifier);
        if (!resolved.startsWith(root + path.sep) || !fs.existsSync(resolved)) {
            failures.push(`Unresolved import "${specifier}" in ${normalized}`);
            continue;
        }
        const dependency = toPosix(path.relative(root, resolved));
        if (!appShell.has(dependency)) {
            failures.push(`Imported module missing from service-worker APP_SHELL: ${dependency}`);
        }
        inspectModule(dependency);
    }
}

inspectModule('JS/core/service-worker-registration.js');
inspectModule('JS/core/bootstrap.js');
inspectModule('JS/features/cards/catalogue-data.js');
inspectModule('JS/season.js');
inspectModule('JS/features/app-shell.js');
inspectModule('JS/features/startup.js');
inspectModule('JS/features/welcome-intro.js');

const html = read('index.html').replace(/<!--[\s\S]*?-->/g, '');
const activeScripts = [...html.matchAll(/<script\b([^>]*)>/gi)]
    .map(match => match[1]);
const srcs = activeScripts.map(attrs => attrs.match(/\bsrc=["']([^"']+)["']/i)?.[1]).filter(Boolean);
const bootstrapIndex = srcs.findIndex(src => src.replace(/^\.\//, '') === 'JS/core/bootstrap.js');
const legacyIndices = ['JS/app-part1.js', 'JS/app-part2.js', 'JS/app-part3.js', 'JS/season.js']
    .map(required => srcs.findIndex(src => src.replace(/^\.\//, '') === required));
if (bootstrapIndex < 0) failures.push('Active HTML does not load JS/core/bootstrap.js.');
const appShellIndex = srcs.findIndex(src => src.replace(/^\.\//, '') === 'JS/features/app-shell.js');
const startupIndex = srcs.findIndex(src => src.replace(/^\.\//, '') === 'JS/features/startup.js');
const welcomeIndex = srcs.findIndex(src => src.replace(/^\.\//, '') === 'JS/features/welcome-intro.js');
if (appShellIndex < 0) failures.push('Active HTML does not load JS/features/app-shell.js.');
if (startupIndex < 0) failures.push('Active HTML does not load JS/features/startup.js.');
if (welcomeIndex < 0) failures.push('Active HTML does not load JS/features/welcome-intro.js.');
if (bootstrapIndex >= 0 && appShellIndex >= 0 && appShellIndex < bootstrapIndex) failures.push('App-shell module must execute after the modular bootstrap.');
if (bootstrapIndex >= 0 && startupIndex >= 0 && startupIndex < bootstrapIndex) failures.push('Startup coordinator must execute after the modular bootstrap.');
if (appShellIndex >= 0 && startupIndex >= 0 && startupIndex < appShellIndex) failures.push('Startup coordinator must execute after the app-shell module.');
if (startupIndex >= 0 && welcomeIndex >= 0 && welcomeIndex < startupIndex) failures.push('Welcome intro module must load after the startup coordinator.');
if (legacyIndices.some(index => index < 0)) failures.push('One or more required legacy compatibility scripts are not loaded.');
if (bootstrapIndex >= 0 && legacyIndices.some(index => index > bootstrapIndex)) {
    failures.push('The modular bootstrap must load after the legacy compatibility scripts.');
}
if (srcs.some(src => src.replace(/^\.\//, '') === 'JS/app.js')) {
    failures.push('Inactive legacy JS/app.js must not be loaded alongside app-part scripts.');
}
if (srcs.some(src => src.replace(/^\.\//, '') === 'JS/cards.js')) {
    failures.push('Built-in card catalogue must be loaded through its ES-module dependency, not the removed classic script.');
}
const appPart1 = read('JS/app-part1.js');
if (/if\s*\(!window\.cardCatalog\)[\s\S]{0,180}window\.cardCatalog\s*=\s*\[\]/.test(appPart1)) {
    failures.push('Obsolete empty card-catalogue fallback remains in JS/app-part1.js.');
}
if (!/import\s*\{\s*cardCatalogue\s*\}\s*from\s*["']\.\.\/features\/cards\/catalogue\.js["']/.test(read('JS/core/bootstrap.js'))) {
    failures.push('Modular bootstrap must import the card catalogue facade.');
}
if (!/import\s*["']\.\/catalogue-data\.js["']/.test(read('JS/features/cards/catalogue.js'))) {
    failures.push('Card catalogue facade must import the built-in catalogue data module.');
}
if (!appShell.has('JS/features/cards/catalogue-data.js')) {
    failures.push('Built-in card catalogue data module is missing from service-worker APP_SHELL.');
}
if (appShell.has('JS/cards.js')) {
    failures.push('Removed classic JS/cards.js must not remain in service-worker APP_SHELL.');
}

const serviceWorkerRegistration = read('JS/core/service-worker-registration.js');
const registrationCount = (html + serviceWorkerRegistration).match(/navigatorRef\.serviceWorker\.register\s*\(/g)?.length || 0;
if (registrationCount !== 1) {
    failures.push(`Expected exactly one active service-worker registration; found ${registrationCount}.`);
}
if (!/navigatorRef\.serviceWorker\.register\(\s*["']\.\/service-worker\.js["']/.test(serviceWorkerRegistration)) {
    failures.push('Service-worker registration must use the app-relative ./service-worker.js path from its external module.');
}
if (!appShell.has('JS/core/service-worker-registration.js')) {
    failures.push('External service-worker registration module is missing from APP_SHELL.');
}
if (!appShell.has('JS/core/event-delegation.js')) {
    failures.push('External HTML event delegation module is missing from APP_SHELL.');
}
for (const file of ['JS/features/cards/marketplace.js', 'JS/features/monthly-resolution/monthly-resolution.js', 'JS/features/notifications/notifications.js', 'JS/app-part3.js']) {
    const source = read(file);
    if (/\.onclick\s*=/.test(source)) {
        failures.push(`Active UI module ${file} must use addEventListener instead of onclick assignment.`);
    }
}
if (/<script\b(?![^>]*\bsrc\s*=)[^>]*>/i.test(html)) {
    failures.push('Active index.html must not contain inline script blocks.');
}

const cacheVersion = serviceWorker.match(/const CACHE_NAME\s*=\s*["']([^"']+)["']/)?.[1];
if (!cacheVersion) failures.push('Could not identify the service-worker cache version.');

if (failures.length) {
    console.error('[Architecture Audit] FAILED');
    failures.forEach(item => console.error(` - ${item}`));
    process.exit(1);
}

console.log('[Architecture Audit] PASSED');
console.log(` - ${importedModules.size} active module files (all active module entry points and dependencies) resolve and are present in APP_SHELL.`);
console.log(' - Active script order preserves legacy bridges before the modular bootstrap.');
console.log(' - Exactly one app-relative service-worker registration is active.');
console.log(` - Service-worker cache version: ${cacheVersion}`);
warnings.forEach(item => console.warn(` - ${item}`));
