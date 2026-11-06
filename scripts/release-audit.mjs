#!/usr/bin/env node
/**
 * StandOut release/deployment sanity checks.
 * Read-only: validates local active-page references and PWA manifest paths.
 * Known absent optional media is reported as a warning, not silently ignored.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const warnings = [];
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const optionalMissing = new Set(['welcome.mp4', 'Music/Complete.mp3']);

const html = read('index.html').replace(/<!--[\s\S]*?-->/g, '');
const references = [];
for (const match of html.matchAll(/<(script|link|img|video|source|audio)\b[^>]*?\b(src|href)=["']([^"']+)["']/gi)) {
    const [, tag, attribute, value] = match;
    if (/^(?:https?:|data:|blob:|#)/i.test(value) || value.startsWith('//')) continue;
    const relative = value.split(/[?#]/, 1)[0].replace(/^\.\//, '').replace(/^\/+/, '');
    if (!relative) continue;
    references.push({ tag: tag.toLowerCase(), attribute: attribute.toLowerCase(), relative });
}

for (const reference of references) {
    if (exists(reference.relative)) continue;
    const message = `Missing active HTML asset: ${reference.relative} (${reference.tag}.${reference.attribute})`;
    if (optionalMissing.has(reference.relative)) warnings.push(message);
    else failures.push(message);
}

let manifest;
try {
    manifest = JSON.parse(read('manifest.json'));
} catch (error) {
    failures.push(`manifest.json is invalid JSON: ${error.message}`);
}

if (manifest) {
    for (const field of ['start_url', 'scope']) {
        if (typeof manifest[field] !== 'string' || !manifest[field]) {
            failures.push(`PWA manifest is missing ${field}.`);
        } else if (/^(?:https?:)?\/\//i.test(manifest[field]) || manifest[field].startsWith('/')) {
            failures.push(`PWA manifest ${field} must be relative for subfolder deployment: ${manifest[field]}`);
        }
    }
    if (!Array.isArray(manifest.icons) || manifest.icons.length === 0) {
        failures.push('PWA manifest must declare at least one icon.');
    } else {
        for (const icon of manifest.icons) {
            if (!icon || typeof icon.src !== 'string') {
                failures.push('PWA manifest contains an invalid icon entry.');
                continue;
            }
            const iconPath = icon.src.replace(/^\.\//, '').replace(/^\/+/, '');
            if (!exists(iconPath)) failures.push(`PWA manifest icon is missing: ${icon.src}`);
            if (iconPath.endsWith('.jpeg') && icon.type !== 'image/jpeg') {
                failures.push(`PWA manifest MIME type does not match JPEG icon: ${icon.src}`);
            }
        }
    }
}

if (failures.length) {
    console.error('[Release Audit] FAILED');
    failures.forEach(message => console.error(` - ${message}`));
    process.exit(1);
}

console.log('[Release Audit] PASSED');
console.log(` - ${references.length} active HTML asset references checked.`);
console.log(' - PWA start_url and scope are relative and manifest icons resolve.');
for (const warning of warnings) console.warn(`[Release Audit] WARNING: ${warning}`);
