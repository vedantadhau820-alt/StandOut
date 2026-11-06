#!/usr/bin/env node
/**
 * StandOut real-browser smoke test.
 *
 * Requires the optional Playwright package and a locally installed Chromium:
 *   npm install --no-save playwright
 *   npx playwright install chromium
 *   node scripts/browser-smoke.mjs
 *
 * Uses a fresh browser context. It does not touch the user's real browser
 * profile or any deployed data.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let chromium;
try {
    ({ chromium } = await import('playwright'));
} catch {
    console.error('[Browser Smoke] Playwright is not installed.');
    console.error('Run: npm install --no-save playwright');
    console.error('Then: npx playwright install chromium');
    process.exit(2);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mimeTypes = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8', '.png': 'image/png',
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2'
};

const server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const target = path.resolve(root, relative);
    if (target !== root && !target.startsWith(root + path.sep)) {
        response.writeHead(403).end('Forbidden');
        return;
    }
    fs.stat(target, (error, stat) => {
        if (error || !stat.isFile()) {
            response.writeHead(404).end('Not found');
            return;
        }
        response.writeHead(200, {
            'Content-Type': mimeTypes[path.extname(target).toLowerCase()] || 'application/octet-stream',
            'Cache-Control': 'no-store'
        });
        fs.createReadStream(target).pipe(response);
    });
});

const failures = [];
const warnings = [];
const runtime = { consoleErrors: [], pageErrors: [], failedRequests: [], httpErrors: [] };
let browser;

function check(condition, message) {
    if (!condition) failures.push(message);
}

/**
 * Exercise the real welcome flow before testing navigation. The intro is a
 * full-screen modal by design, so navigation clicks must not bypass it.
 * The test fixture marks this month's Drop as seen to keep the flow focused
 * on the intro rather than navigating away to the optional Monthly Drop page.
 */
async function dismissWelcomeIntro(page, label) {
    const intro = page.locator('#welcomeIntro');
    if (await intro.count() === 0) return;

    const readyButton = page.locator('#welcomeReadyBtn');
    await page.waitForFunction(() => {
        const button = document.querySelector('#welcomeReadyBtn');
        return !button || button.disabled === false;
    }, null, { timeout: 15000 });

    if (await readyButton.count()) await readyButton.click();

    // A playable video is skipped through the intro's click-to-skip UI.
    // If optional media is missing, playback fails and the app closes intro.
    await page.waitForFunction(() => {
        const overlay = document.querySelector('#welcomeIntro');
        const videoStage = document.querySelector('#welcomeVideoStage');
        return !overlay || overlay.classList.contains('is-exiting') ||
            Boolean(videoStage?.classList.contains('active'));
    }, null, { timeout: 10000 });

    const videoStage = page.locator('#welcomeVideoStage.active');
    if (await videoStage.count()) {
        await videoStage.click({ position: { x: 20, y: 20 } });
    }

    await page.locator('#welcomeIntro').waitFor({ state: 'detached', timeout: 7000 });
    console.log(`[Browser Smoke] ${label} welcome intro dismissed through UI.`);
}

async function isolateMonthlyDrop(context) {
    await context.addInitScript(() => {
        const now = new Date();
        const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        localStorage.setItem('standOutMonthlyDropSeen', key);
    });
}

try {
    await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', resolve);
    });
    const address = server.address();
    const origin = `http://127.0.0.1:${address.port}`;
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1365, height: 900 }, serviceWorkers: 'allow' });
    await isolateMonthlyDrop(context);
    const page = await context.newPage();
    page.on('console', message => {
        if (message.type() === 'error') runtime.consoleErrors.push(message.text());
    });
    page.on('pageerror', error => runtime.pageErrors.push(error.message));
    page.on('requestfailed', request => runtime.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
    page.on('response', response => {
        if (response.status() >= 400) runtime.httpErrors.push({ status: response.status(), url: response.url() });
    });

    const response = await page.goto(`${origin}/index.html`, { waitUntil: 'load', timeout: 60000 });
    check(response?.ok(), `Application page did not load successfully (HTTP ${response?.status() ?? 'no response'}).`);
    await page.waitForFunction(() => window.StandOutCore?.ready === true, null, { timeout: 20000 }).catch(() => {
        failures.push('Modular application core did not reach ready state within 20 seconds.');
    });
    await page.waitForTimeout(1200);

    check(await page.title() !== '', 'Document title is empty.');
    check(await page.locator('#missions').count() === 1, 'Missions section is missing.');
    check(await page.locator('#welcomeIntro').count() === 1, 'Welcome intro is missing on initial load.');

    // Dismiss the full-screen welcome intro through its normal UI before navigation checks.
    await dismissWelcomeIntro(page, 'Desktop');

    // Verify each visible bottom-nav control changes the active section.
    for (const [buttonId, sectionId] of [
        ['nav-missions', 'missions'], ['nav-skillset', 'skillset'],
        ['nav-time', 'time'], ['nav-goals', 'goals'], ['nav-account', 'account']
    ]) {
        const button = page.locator(`#${buttonId}`);
        check(await button.count() === 1, `Navigation control #${buttonId} is missing.`);
        if (await button.count()) {
            await button.click();
            await page.waitForTimeout(80);
            check(await page.locator(`#${sectionId}.active`).count() === 1,
                `Navigation control #${buttonId} did not activate #${sectionId}.`);
        }
    }

    // Check the welcome-media fallback without asserting that optional media exists.
    const videoRequest = runtime.httpErrors.find(item => item.url.endsWith('/welcome.mp4'));
    if (videoRequest?.status === 404) {
        warnings.push('Optional welcome.mp4 is absent; the intro was dismissed through its media-error fallback.');
    }

    // Confirm a service-worker registration can activate under localhost's secure-context rules.
    const registration = await page.evaluate(async () => {
        if (!('serviceWorker' in navigator)) return { supported: false };
        const registrations = await navigator.serviceWorker.getRegistrations();
        return {
            supported: true,
            registrations: registrations.map(item => ({ scope: item.scope, active: Boolean(item.active) }))
        };
    });
    if (!registration.supported) warnings.push('Service workers are unsupported in this browser context.');
    else if (!registration.registrations.some(item => item.active)) warnings.push('No active service worker was observed after initial page load.');

    const unexpectedLocalHttpErrors = runtime.httpErrors.filter(item =>
        item.url.startsWith(origin) && item.status >= 400 &&
        !item.url.endsWith('/welcome.mp4') && !item.url.endsWith('/Music/Complete.mp3')
    );
    check(unexpectedLocalHttpErrors.length === 0,
        `Unexpected local HTTP errors: ${JSON.stringify(unexpectedLocalHttpErrors)}`);
    check(runtime.pageErrors.length === 0, `Uncaught page errors: ${runtime.pageErrors.join(' | ')}`);

    // Repeat the core startup/navigation checks in a narrow mobile viewport.
    // This is a responsive smoke check, not a substitute for visual review on devices.
    const mobileContext = await browser.newContext({
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true,
        serviceWorkers: 'allow'
    });
    await isolateMonthlyDrop(mobileContext);
    const mobilePage = await mobileContext.newPage();
    mobilePage.on('pageerror', error => runtime.pageErrors.push(`[mobile] ${error.message}`));
    mobilePage.on('console', message => {
        if (message.type() === 'error') runtime.consoleErrors.push(`[mobile] ${message.text()}`);
    });
    const mobileResponse = await mobilePage.goto(`${origin}/index.html`, { waitUntil: 'load', timeout: 60000 });
    check(mobileResponse?.ok(), `Mobile application page did not load successfully (HTTP ${mobileResponse?.status() ?? 'no response'}).`);
    await mobilePage.waitForFunction(() => window.StandOutCore?.ready === true, null, { timeout: 20000 }).catch(() => {
        failures.push('Mobile modular application core did not reach ready state within 20 seconds.');
    });
    await dismissWelcomeIntro(mobilePage, 'Mobile');
    const mobileNavigation = [];
    for (const [buttonId, sectionId] of [
        ['nav-missions', 'missions'], ['nav-skillset', 'skillset'],
        ['nav-time', 'time'], ['nav-goals', 'goals'], ['nav-account', 'account']
    ]) {
        const button = mobilePage.locator(`#${buttonId}`);
        const exists = await button.count() === 1;
        if (exists) {
            await button.click();
            await mobilePage.waitForTimeout(60);
        }
        const active = exists && await mobilePage.locator(`#${sectionId}.active`).count() === 1;
        mobileNavigation.push({ buttonId, exists, active });
        check(exists && active, `Mobile navigation failed for #${buttonId}.`);
    }
    const mobileLayout = await mobilePage.evaluate(() => ({
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
        viewportHeight: window.innerHeight
    }));

    console.log(JSON.stringify({
        result: failures.length ? 'FAILED' : 'PASSED',
        browser: browser.version(),
        desktop: {
            appCoreReady: await page.evaluate(() => Boolean(window.StandOutCore?.ready)),
            navigationChecks: 5,
            serviceWorker: registration
        },
        mobile: {
            appCoreReady: await mobilePage.evaluate(() => Boolean(window.StandOutCore?.ready)),
            navigation: mobileNavigation,
            layout: mobileLayout
        },
        runtime,
        warnings,
        failures
    }, null, 2));

    await mobileContext.close();
    await context.close();
} catch (error) {
    console.error(`[Browser Smoke] Could not complete: ${error.stack || error.message}`);
    process.exitCode = 2;
} finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
}

if (failures.length) process.exitCode = 1;
