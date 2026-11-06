#!/usr/bin/env node
/**
 * Dependency-free security guardrails for the active StandOut entry points.
 * This is a source-level audit, not a substitute for browser or penetration testing.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const failures = [];
const warnings = [];

const missionManagement = read('JS/features/missions/management.js');
if (/\$\{\s*text\s*\}/.test(missionManagement)) {
    failures.push('Mission creation appears to interpolate user-entered text into an HTML template.');
}
if (!/\.mission-text"\)\.textContent\s*=\s*text/.test(missionManagement)) {
    failures.push('Mission creation must render the mission name through textContent.');
}
if (!/\.mission-text"\)\.textContent\s*=\s*\n?\s*newText/.test(missionManagement)) {
    failures.push('Mission editing must render the mission name through textContent.');
}

const html = read('index.html').replace(/<!--[\s\S]*?-->/g, '');
if (/<script\b(?![^>]*\bsrc\s*=)[^>]*>/i.test(html.replace(/<!--[\s\S]*?-->/g, ''))) {
    failures.push('Active index.html must not contain inline script blocks; move startup code to an external module.');
}
const activeIndexHTML = html.replace(/<!--[\s\S]*?-->/g, '');
const guideHTML = read('standout-guide.html').replace(/<!--[\s\S]*?-->/g, '');
for (const [page, source] of [['index.html', activeIndexHTML], ['standout-guide.html', guideHTML]]) {
    if (/\son[a-z]+\s*=\s*(["'])/i.test(source)) {
        failures.push(`${page} must not contain active inline event-handler attributes.`);
    }
    if (!source.includes('JS/core/event-delegation.js')) {
        failures.push(`${page} must load the external event delegation module.`);
    }
}
const eventDelegation = read('JS/core/event-delegation.js');
if (!/document\.addEventListener\("click", dispatchClick\)/.test(eventDelegation) || !/document\.addEventListener\("input", dispatchInput\)/.test(eventDelegation) || /\beval\s*\(|\bnew\s+Function\s*\(/.test(eventDelegation)) {
    failures.push('Static HTML actions must use the safe external allow-listed event delegation module.');
}
const activeClassicScripts = [...html.matchAll(/<script\b([^>]*)>/gi)]
    .map(match => match[1])
    .filter(attrs => !/\btype\s*=\s*["']module["']/i.test(attrs))
    .map(attrs => attrs.match(/\bsrc=["']([^"']+)["']/i)?.[1])
    .filter(Boolean)
    .map(src => src.replace(/^\.\//, ''));
const activeFiles = new Set(activeClassicScripts);
const pendingModules = ['JS/core/bootstrap.js', ...[...html.matchAll(/<script\b([^>]*)>/gi)]
    .map(match => match[1])
    .filter(attrs => /\btype\s*=\s*[\"']module[\"']/i.test(attrs))
    .map(attrs => attrs.match(/\bsrc=[\"']([^\"']+)[\"']/i)?.[1])
    .filter(Boolean)
    .map(src => src.replace(/^\.\//, ''))];
while (pendingModules.length) {
    const file = pendingModules.pop();
    if (activeFiles.has(file)) continue;
    activeFiles.add(file);
    const absolute = path.join(root, file);
    if (!fs.existsSync(absolute)) {
        warnings.push(`Could not inspect active script path: ${file}`);
        continue;
    }
    const source = fs.readFileSync(absolute, 'utf8');
    for (const match of source.matchAll(/(?:from\s*|import\s*)["']([^"']+)["']/g)) {
        const specifier = match[1];
        if (specifier.startsWith('.')) {
            pendingModules.push(path.posix.normalize(path.posix.join(path.posix.dirname(file), specifier)));
        }
    }
}

for (const file of activeFiles) {
    const absolute = path.join(root, file);
    if (!fs.existsSync(absolute)) continue;
    const source = fs.readFileSync(absolute, 'utf8');
    if (/\beval\s*\(|\bnew\s+Function\s*\(|document\.write\s*\(/.test(source)) {
        failures.push(`Unsafe dynamic execution API found in ${file}.`);
    }
    if (/\.on(?:click|input|change|submit|keydown|keyup|keypress|mouseover|mouseout|focus|blur)\s*=/.test(source)) {
        failures.push(`Direct DOM event-property assignment remains in active script ${file}; use addEventListener.`);
    }
}

const vercelConfig = JSON.parse(read('vercel.json'));
const vercelHeaders = vercelConfig.headers || [];
const reportOnlyConfigured = vercelHeaders.some(route =>
    (route.headers || []).some(header => header.key?.toLowerCase() === 'content-security-policy-report-only')
);
const enforcingCspConfigured = /http-equiv=["']Content-Security-Policy["']/i.test(html) || vercelHeaders.some(route =>
    (route.headers || []).some(header => header.key?.toLowerCase() === 'content-security-policy')
);
if (!enforcingCspConfigured && !reportOnlyConfigured) {
    warnings.push('No Content Security Policy is configured. Review dynamic HTML sinks, runtime style mutations, and third-party assets before enforcing a strict policy.');
} else if (reportOnlyConfigured && !enforcingCspConfigured) {
    console.log('[Security Audit] Vercel CSP is configured in Report-Only mode; enforcement remains disabled pending deployed-origin review.');
}
const persistence = read('JS/features/data/persistence.js');
if (/localStorage\.getItem\(["'](?:missions|skills|goals)["']\)[\s\S]{0,180}\.innerHTML\s*=/.test(persistence)) {
    failures.push('HTML-backed LocalStorage snapshots must never be assigned directly to innerHTML.');
}
if (!/function sanitizeStoredMarkup\(/.test(persistence) || !/STORED_MARKUP_DROP_TAGS/.test(persistence)) {
    failures.push('Stored HTML restoration must pass through the restricted markup sanitizer.');
}
if (!/window\.completeMission\?\.\(completeButton\)/.test(persistence) || !/window\.deleteSkillDirect\?\.\(button\)/.test(persistence)) {
    failures.push('Sanitized mission and skill controls must be rebound without inline handlers.');
}
const notifications = read('JS/features/notifications/notifications.js');
if (/\.innerHTML\s*=/.test(notifications) || !/title\.textContent\s*=\s*notification\.title/.test(notifications) || !/message\.textContent\s*=\s*notification\.msg/.test(notifications) || !/list\.replaceChildren\(empty\)/.test(notifications)) {
    failures.push('Notification content and empty states must use safe DOM nodes and textContent.');
}

const resetUI = read('JS/features/data/reset-ui.js');
if (/\.innerHTML\s*=/.test(resetUI) || !/customCardsManager\.replaceChildren\(emptyState\)/.test(resetUI) || !/notificationList\.replaceChildren\(emptyState\)/.test(resetUI)) {
    failures.push('Reset UI must clear containers with replaceChildren and construct empty states with DOM APIs.');
}

const missionManagementDOM = read('JS/features/missions/management.js');
if (/li\.innerHTML\s*=/.test(missionManagementDOM) || !/li\.replaceChildren\(missionText, deadlineRow\)/.test(missionManagementDOM) || !/deadlineDisplay\.textContent\s*=\s*deadlineText/.test(missionManagementDOM)) {
    failures.push('Mission structure and deadline labels must be constructed with DOM APIs and textContent.');
}
const missionScheduler = read('JS/features/missions/scheduler.js');
if (/overdueSpan\.innerHTML\s*=/.test(missionScheduler) || !/overdueSpan\.replaceChildren\(overdueBadge\)/.test(missionScheduler)) {
    failures.push('Overdue badges must be constructed with DOM APIs.');
}

const monthlyReportForMomentum = read('JS/features/monthly-report.js');
const monthlyMomentum = monthlyReportForMomentum.slice(monthlyReportForMomentum.indexOf('function renderMonthlyMomentumChart('), monthlyReportForMomentum.indexOf('function ', monthlyReportForMomentum.indexOf('function renderMonthlyMomentumChart(') + 12));
if (/\.innerHTML\s*=/.test(monthlyMomentum) || !/container\.replaceChildren\(emptyState\)/.test(monthlyMomentum)) {
    failures.push('Monthly momentum chart clearing and empty states must use DOM APIs.');
}

const achievements = read('JS/features/achievements/achievements.js');
const achievementPopup = achievements.slice(achievements.indexOf('function showAchievementPopup('));
if (/popup\.innerHTML/.test(achievementPopup) || !/heading\.textContent\s*=\s*String\(title/.test(achievementPopup) || !/description\.textContent\s*=\s*String\(desc/.test(achievementPopup)) {
    failures.push('Achievement popup content must be rendered as text, not interpreted as HTML.');
}
const achievementRenderer = achievements.slice(achievements.indexOf('function renderAchievements('));
if (/tile\.innerHTML|toggle\.innerHTML/.test(achievementRenderer) || !/title\.textContent\s*=\s*String\(achievement\.title/.test(achievementRenderer) || !/description\.textContent\s*=\s*String\(achievement\.desc/.test(achievementRenderer) || !/date\.textContent\s*=/.test(achievementRenderer)) {
    failures.push('Achievement tiles must render stored title, description, and unlock date through textContent.');
}

const badges = read('JS/features/badges/badges.js');
if (/\.innerHTML\s*=/.test(badges) || !/title\.textContent\s*=\s*String\(badge\.title/.test(badges) || !/month\.textContent\s*=\s*String\(badge\.month/.test(badges) || !/\^badges\\\//.test(badges)) {
    failures.push('Badge requirements and collection must use DOM properties, and stored badge artwork must pass a local-path allow-list.');
}
const goalFeature = read('JS/features/goals/goals.js');
const goalEditModal = goalFeature.slice(goalFeature.indexOf('function openEditGoal('), goalFeature.indexOf('/* ---------------------------------------------------------\n   UPDATE GOAL', goalFeature.indexOf('function openEditGoal(')));
const goalAchievementOverlay = goalFeature.slice(goalFeature.indexOf('function playGoalAchievementVideo('));
if (/\.innerHTML\s*=/.test(goalEditModal) || /overlay\.innerHTML\s*=/.test(goalAchievementOverlay) || /overdueBadge\.innerHTML\s*=/.test(goalFeature) || !/content\.replaceChildren\(/.test(goalEditModal) || !/overdueBadge\.replaceChildren\(overdueLabel\)/.test(goalFeature)) {
    failures.push('Goal edit, achievement, and overdue UI must be built with safe DOM APIs.');
}

const marketplace = read('JS/features/cards/marketplace.js');
const mintReveal = marketplace.slice(marketplace.indexOf('function showMintedCard('), marketplace.indexOf('function closeMintedCard('));
if (/overlay\.innerHTML|onclick\s*=/.test(mintReveal) || !/title\.textContent\s*=\s*String\(card\.title/.test(mintReveal) || !/quote\.textContent\s*=\s*String\(card\.quote/.test(mintReveal) || !/imagePath\)/.test(mintReveal)) {
    failures.push('Minted-card reveal must build DOM safely, render text with textContent, and validate image paths.');
}

const monthlyResolution = read('JS/features/monthly-resolution/monthly-resolution.js');
if (/review\.innerHTML/.test(monthlyResolution) || !/review\.replaceChildren\(reviewLabel, reviewMessage\)/.test(monthlyResolution) || !/reviewMessage\.textContent/.test(monthlyResolution)) {
    failures.push('Monthly resolution review messages must be built with DOM nodes and textContent.');
}

const monthlyReport = read('JS/features/monthly-report.js');
const monthlyInsights = monthlyReport.slice(monthlyReport.indexOf('function renderMonthlyInsights('), monthlyReport.indexOf('function renderMonthlySummary(', monthlyReport.indexOf('function renderMonthlyInsights(')));
if (/container\.innerHTML\s*=|item\.innerHTML\s*=/.test(monthlyInsights) || !/title\.textContent\s*=\s*String\(insight\.title/.test(monthlyInsights) || !/description\.textContent\s*=\s*String\(insight\.text/.test(monthlyInsights) || !/allowedInsightTypes/.test(monthlyInsights) || !/container\.replaceChildren\(fragment\)/.test(monthlyInsights)) {
    failures.push('Monthly insights must render generated insight content with DOM nodes, textContent, and allowlisted type classes.');
}

const navigation = read('JS/features/navigation.js');
if (/setAttribute\(\s*["']onclick/i.test(navigation) || !/button\?\.addEventListener\(["']click["']/.test(navigation) || !/globalAddBtn[\s\S]{0,180}addEventListener\(["']click["']/.test(navigation)) {
    failures.push('Navigation and global Add controls must use registered event listeners, not inline handler attributes.');
}
for (const pageId of ['missions', 'skillset', 'time', 'goals', 'account']) {
    if (new RegExp(`<button\\s+id=[\\"']nav-${pageId}[\\"'][^>]*onclick`, 'i').test(html)) {
        failures.push(`Bottom navigation control ${pageId} must not use an inline onclick handler.`);
    }
}
if (/<button[^>]*id=["']globalAddBtn["'][^>]*onclick/i.test(html)) {
    failures.push('Global Add button must not use an inline onclick handler.');
}

const modals = read('JS/features/modals.js');
if (/onclick\s*=/.test(modals)) {
    failures.push('Modal templates must not emit inline event-handler attributes.');
}
if (/\$\{\s*oldName\s*\}|\$\{\s*oldText\s*\}/.test(modals)) {
    failures.push('Existing user-entered skill and mission names must be assigned through DOM properties, not HTML templates.');
}
if (!/createModalInput\("editSkillInput"[^\n]*value:\s*oldName/.test(modals) || !/createModalInput\("editMissionInput"[^\n]*value:\s*oldText/.test(modals)) {
    failures.push('Edit modal values must be populated through input.value.');
}
if (!/option\.textContent\s*=\s*name/.test(modals) || !/option\.value\s*=\s*name/.test(modals)) {
    failures.push('Linked skill options must be created as DOM nodes with textContent and value properties.');
}
if (!/content\.addEventListener\("click"/.test(modals) || !/modalActionHandlers/.test(modals)) {
    failures.push('Modal actions must be dispatched through a delegated event listener.');
}

const goals = read('JS/features/goals/goals.js');
const goalRenderer = goals.slice(goals.indexOf('function renderGoals()'), goals.indexOf('/* ---------------------------------------------------------\n   ACHIEVE GOAL', goals.indexOf('function renderGoals()')));
if (/\.innerHTML\s*=/.test(goalRenderer) || !/title\.textContent\s*=\s*String\(goal\.title/.test(goalRenderer) || !/container\.replaceChildren\(fragment\)/.test(goalRenderer)) {
    failures.push('Goal cards and achieved-goal controls must be built with safe DOM APIs and textContent.');
}
if (/onclick\s*=\s*["'][^"']*\$\{\s*goal\.id/.test(goals)) {
    failures.push('Stored goal IDs must never be interpolated into inline JavaScript handlers.');
}
if (!/markGoalAchieved\(goal\.id\)/.test(goalRenderer) || !/openEditGoal\(goal\.id\)/.test(goalRenderer) || !/removeGoal\(goal\.id\)/.test(goalRenderer)) {
    failures.push('Goal actions must be rebound through event listeners and inert goal IDs.');
}

const mastery = read('JS/features/mastery/mastery.js');
if (/\.innerHTML\s*=|onclick\s*=|\.onclick\s*=/.test(mastery)) {
    failures.push('Mastery rendering and milestone input rows must not use HTML-string sinks or inline click handlers.');
}
if (!/function createMasteryCardElement\(/.test(mastery) || !/function createMasteryMilestoneElement\(/.test(mastery) || !/container\.replaceChildren\(fragment\)/.test(mastery)) {
    failures.push('Mastery cards and milestones must be constructed with DOM APIs and replaceChildren.');
}
if (!/createMasteryNode\("h3", "", mastery\.title/.test(mastery) || !/createMasteryNode\("p", "mastery-description", mastery\.description/.test(mastery) || !/input\.value = existingMilestone \? String\(existingMilestone\.title/.test(mastery)) {
    failures.push('Mastery titles, descriptions, and existing milestone values must be assigned through safe text/value properties.');
}
if (!/completeMasteryMilestone\(mastery\.id, milestone\.id\)/.test(mastery) || !/openMasteryEvidence\(mastery\.id, milestone\.id\)/.test(mastery)) {
    failures.push('Mastery milestone and evidence actions must be bound through event listeners with inert IDs.');
}

const customCards = read('JS/features/cards/custom-cards.js');
const customManager = customCards.slice(customCards.indexOf('async function renderCustomCardsManager()'), customCards.indexOf('/* =========================================================\n   DELETE', customCards.indexOf('async function renderCustomCardsManager()')));
if (/container\.innerHTML\s*=|\.onclick\s*=/.test(customManager) || !/title\.textContent\s*=/.test(customManager) || !/addEventListener\("click"/.test(customManager) || !/container\.replaceChildren\(fragment\)/.test(customManager)) {
    failures.push('Custom-card manager must render stored card text through DOM properties and bind actions with event listeners.');
}
if (!/function isSafeCustomCardImageData\(/.test(customCards) || !customCards.includes('jpeg|png|webp') || !customCards.includes('data:image') || !/CUSTOM_CARD_IMAGE_MAX_FILE_BYTES/.test(customCards) || !/supportedImageTypes/.test(customCards)) {
    failures.push('Custom-card artwork must be restricted to supported raster data URLs and bounded upload sizes.');
}

const marketplaceRenderer = read('JS/features/cards/marketplace.js');
const cardElementBuilder = marketplaceRenderer.slice(marketplaceRenderer.indexOf('function createCardElement('), marketplaceRenderer.indexOf('function renderMarketplace('));
const marketplaceRender = marketplaceRenderer.slice(marketplaceRenderer.indexOf('function renderMarketplace('), marketplaceRenderer.indexOf('function isExpired('));
if (/innerHTML|\.onclick\s*=/.test(cardElementBuilder + marketplaceRender) || !/title\.textContent\s*=/.test(cardElementBuilder) || !/quote\.textContent\s*=/.test(cardElementBuilder) || !/getSafeCardImageSource\(card\.image\)/.test(cardElementBuilder) || !/shop\.replaceChildren\(fragment\)/.test(marketplaceRender)) {
    failures.push('Marketplace cards must render catalogue text and images through safe DOM properties.');
}
const ownedCardRender = marketplaceRenderer.slice(marketplaceRenderer.indexOf('function renderMyCards()'), marketplaceRenderer.indexOf('/* =========================================================\n   MINTED CARD REVEAL', marketplaceRenderer.indexOf('function renderMyCards()')));
if (/container\.innerHTML\s*=/.test(ownedCardRender) || !/createCardElement\(card, \{ owned: true/.test(ownedCardRender)) {
    failures.push('Owned custom cards must use the safe card DOM builder.');
}
const goalsStorage = read('JS/features/goals/goals.js');
if (!/storedGoals\.filter\(goal => goal && typeof goal === "object" && !Array\.isArray\(goal\)\)/.test(goalsStorage) || !/goalsDataState = Array\.isArray\(value\) \? value\.filter\(goal => goal && typeof goal === "object" && !Array\.isArray\(goal\)\)/.test(goalsStorage)) {
    failures.push('Persisted and externally assigned goal collections must reject null, primitive, and array records.');
}
const achievementStorage = read('JS/features/achievements/achievements.js');
if (!/savedAchievements = stored\.filter\([\s\S]*?item && typeof item === "object" && !Array\.isArray\(item\)/.test(achievementStorage)) {
    failures.push('Persisted achievement collections must reject malformed records before property access.');
}
const ownedSeasonCards = marketplaceRenderer.slice(marketplaceRenderer.indexOf('function renderMyCards()'), marketplaceRenderer.indexOf('/* =========================================================\n   MINTED CARD REVEAL', marketplaceRenderer.indexOf('function renderMyCards()')));
if (/div\.innerHTML\s*=/.test(ownedSeasonCards) || !/image\.src = getSafeCardImageSource\(card\.image\)/.test(ownedSeasonCards) || !/title\.textContent = String\(card\.title/.test(ownedSeasonCards) || !/quote\.textContent = String\(card\.quote/.test(ownedSeasonCards)) {
    failures.push('Owned season-card artwork, titles, and quotes must be built with safe DOM properties.');
}
const momentum = read('JS/features/momentum/momentum.js');
if (/toast\.innerHTML\s*=/.test(momentum) || !/toast\.replaceChildren\(titleNode, messageNode\)/.test(momentum)) {
    failures.push('Momentum toast content must be rendered through textContent and replaceChildren.');
}
const modalFeature = read('JS/features/modals.js');
if (/\.innerHTML\s*=/.test(modalFeature) || !/content\.replaceChildren\(\.\.\.nodes\)/.test(modalFeature) || !/createModalElement\(/.test(modalFeature) || !/option\.textContent/.test(modalFeature)) {
    failures.push('Modal forms must be assembled with DOM APIs and dynamic values must be assigned as text or form values.');
}
const missionCompletion = read('JS/features/missions/completion.js');
if (/overdueMark\.innerHTML\s*=/.test(missionCompletion) || !/overdueMark\.replaceChildren\(\)/.test(missionCompletion)) {
    failures.push('Mission completion must clear overdue markers with replaceChildren.');
}
const monthlyReportSelector = read('JS/features/monthly-report.js');
if (/monthSelect\.innerHTML\s*=/.test(monthlyReportSelector) || !/monthSelect\.replaceChildren\(\)/.test(monthlyReportSelector)) {
    failures.push('Monthly report selector must clear options through DOM APIs.');
}

if (/https:\/\/(?:cdnjs\.cloudflare\.com|fonts\.googleapis\.com)/.test(html)) {
    warnings.push('The page loads third-party assets; review self-hosting, pinning, and integrity controls.');
}

if (failures.length) {
    console.error('[Security Audit] FAILED');
    failures.forEach(item => console.error(` - ${item}`));
    process.exit(1);
}

console.log('[Security Audit] PASSED');
console.log(` - Inspected ${activeFiles.size} active script entry/import paths for unsafe dynamic execution APIs.`);
console.log(' - Mission creation and editing render user-entered names as text.');
console.log(' - Achievement tiles, achievement popup, minted-card, and monthly-resolution UI content uses safe DOM properties.');
console.log(' - Goal cards, edit modal, achievement overlay, and overdue labels use safe DOM APIs.');
console.log(' - Badge requirements, artwork, and collection render stored values through safe DOM properties and validated local image paths.');
console.log(' - Custom-card manager and marketplace card text/actions/images use validated DOM construction.');
console.log(' - Mastery cards, milestones, evidence previews, and milestone inputs use safe DOM construction.');
console.log(' - Monthly insight cards render generated titles and descriptions with textContent and allowlisted classes.');
console.log(' - Bottom navigation and global Add controls use event listeners rather than inline handlers.');
console.log(' - Goal and achievement storage collections reject malformed record entries.');
console.log(' - Owned season cards, momentum toast, monthly selector, and modal forms use safe DOM APIs.')
warnings.forEach(item => console.warn(` - WARNING: ${item}`));
