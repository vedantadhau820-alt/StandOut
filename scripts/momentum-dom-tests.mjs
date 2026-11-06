import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const source = await readFile(new URL('JS/features/momentum/momentum.js', root), 'utf8');
const renderStart = source.indexOf('function renderCore()');
const renderEnd = source.indexOf('/* =========================================================\n       RENDER EVERYTHING', renderStart);
assert.ok(renderStart >= 0 && renderEnd > renderStart, 'Momentum render functions must remain present');
const renderers = source.slice(renderStart, renderEnd);
assert.doesNotMatch(renderers, /\.innerHTML\s*=/, 'Momentum renderers must not assign HTML strings');
assert.match(source, /function createMomentumNode\(/, 'DOM helper must create elements explicitly');
assert.match(source, /function createMomentumLight\(/, 'Core artwork must be built from DOM nodes');
assert.match(renderers, /core\.replaceChildren\(light, text\)/, 'Core must replace its children atomically');
assert.match(renderers, /panel\.replaceChildren\(fragment\)/, 'Panel must replace its children atomically');
assert.match(renderers, /createMomentumNode\("strong", "", state\.momentum\)/, 'Momentum count must be inserted as text');
assert.match(renderers, /createMomentumNode\("strong", "", `\$\{state\.energy\}%`\)/, 'Energy value must be inserted as text');
assert.match(renderers, /energyFill\.style\.width = `\$\{Math\.min\(100, Math\.max\(0, Number\(state\.energy\) \|\| 0\)\)\}%`/, 'Energy bar width must be numerically bounded');
assert.match(renderers, /progressFill\.style\.width = `\$\{progress\}%`/, 'Progress bar width must use the bounded computed progress');
console.log('[Momentum DOM Tests] PASSED (core artwork, panel, text-only dynamic values, and bounded progress styles).');
