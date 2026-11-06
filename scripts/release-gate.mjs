#!/usr/bin/env node
/** StandOut release candidate gate. Read-only, does not alter app/user data. */
import { spawnSync } from 'node:child_process';
import { readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const scripts = join(root, 'scripts');
const checks = [
  ...readdirSync(scripts).filter(name => name.endsWith('-tests.mjs')).sort(),
  'architecture-audit.mjs', 'security-audit.mjs', 'release-audit.mjs', 'csp-readiness-tests.mjs'
].filter((name, index, all) => all.indexOf(name) === index);
const results = [];
for (const name of checks) {
  const run = spawnSync(process.execPath, [join(scripts, name)], { cwd: root, encoding: 'utf8', timeout: 30000, maxBuffer: 4 * 1024 * 1024 });
  const status = run.error ? 'ERROR' : run.status === 0 ? 'PASS' : 'FAIL';
  results.push({ check: name, status, exitCode: run.status, output: ((run.stdout || '') + (run.stderr || '')).trim().slice(-3000), error: run.error?.message || null });
  process.stdout.write(`${status.padEnd(5)} ${name}\n`);
}
const browser = { status: 'NOT_RUN', reason: 'Run node scripts/browser-smoke.mjs in a supported Chromium/Playwright environment, and complete BROWSER-TESTING.md manual workflows.' };
const report = { schemaVersion: 1, createdAt: new Date().toISOString(), automated: { passed: results.filter(x => x.status === 'PASS').length, total: results.length, results }, browser, releaseReady: false, note: 'Automated checks alone do not certify production readiness.' };
const outputArg = process.argv.find(arg => arg.startsWith('--output='));
if (outputArg) {
  const destination = resolve(process.cwd(), outputArg.slice('--output='.length));
  writeFileSync(destination, JSON.stringify(report, null, 2) + '\n');
  console.log(`Wrote ${destination}`);
}
console.log(`Automated: ${report.automated.passed}/${report.automated.total}. Browser: ${browser.status}. Release ready: NO.`);
if (report.automated.passed !== report.automated.total) process.exitCode = 1;
