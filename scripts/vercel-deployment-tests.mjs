import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const config = JSON.parse(await readFile(new URL('vercel.json', root), 'utf8'));
assert.ok(Array.isArray(config.headers), 'Vercel headers must be configured');
const allHeaders = config.headers.flatMap(route => route.headers || []);
const get = name => allHeaders.find(header => header.key.toLowerCase() === name.toLowerCase())?.value;
for (const name of ['X-Content-Type-Options', 'Referrer-Policy', 'X-Frame-Options', 'Permissions-Policy']) {
  assert.ok(get(name), `${name} must be configured`);
}
assert.ok(get('Content-Security-Policy-Report-Only'), 'CSP must be report-only during observation');
assert.equal(get('Content-Security-Policy'), undefined, 'An enforcing CSP must not be enabled before deployed-origin review');
assert.ok(config.headers.some(route => route.source === '/service-worker.js' && (route.headers || []).some(header => header.key === 'Cache-Control' && /no-cache/.test(header.value))), 'Service worker must revalidate instead of being served with a long-lived cache');
assert.ok(config.headers.some(route => route.source === '/manifest.json' && (route.headers || []).some(header => header.key === 'Cache-Control')), 'Manifest must have an explicit revalidation policy');
assert.equal(config.rewrites, undefined, 'Do not add SPA rewrites to the current multi-page static app');
const sw = await readFile(new URL('service-worker.js', root), 'utf8');
assert.match(sw, /standout-v2\.100-special-card-interactions/, 'Deployment preparation must not change the verified service-worker cache identity');
console.log('[Vercel Deployment Tests] PASSED (headers, report-only CSP, cache revalidation, no SPA rewrites, unchanged SW cache).');
