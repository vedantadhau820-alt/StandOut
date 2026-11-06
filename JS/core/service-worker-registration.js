/**
 * StandOut automatic service-worker updater.
 *
 * Inspired by the supplied working pattern:
 * - Attach updatefound/statechange listeners as soon as possible.
 * - Show an update indicator as soon as an installing worker is detected.
 * - Use controllerchange as the authoritative signal that the new worker
 *   controls this page, then reload exactly once.
 * - Keep a visible, honest progress indicator. The percentage represents
 *   app-shell assets processed by the service worker, not downloaded bytes.
 */
export function registerServiceWorker({
    navigatorRef = globalThis.navigator,
    windowRef = globalThis.window,
    documentRef = globalThis.document,
    logger = globalThis.console,
    updateIntervalMs = 60_000,
    updateThrottleMs = 5_000
} = {}) {
    const serviceWorker = navigatorRef?.serviceWorker;
    if (!serviceWorker || !windowRef?.addEventListener) return false;

    // A page may have an existing active registration before the browser has
    // assigned its controller (for example during startup/navigation). Treat
    // that as an update-capable session too, rather than hiding update UI.
    let hadPreviousWorkerAtStartup = Boolean(serviceWorker.controller);
    let started = false;
    let registration = null;
    let checkingUpdate = false;
    let lastUpdateCheckAt = 0;
    let reloadingForUpdate = false;
    let progressBanner = null;
    const trackedRegistrations = new WeakSet();
    const trackedWorkers = new WeakSet();
    let pendingUpdateMessages = [];

    let readyWorker = null;
    let reloadRequested = false;

    const setProgressUI = (percent, message, { ready = false } = {}) => {
        // Never show update UI for a genuine first installation.
        if (!hadPreviousWorkerAtStartup || !documentRef?.createElement || !documentRef?.body) return;

        if (!progressBanner || !documentRef.getElementById?.("standout-update-progress")) {
            progressBanner = documentRef.createElement("section");
            progressBanner.id = "standout-update-progress";
            progressBanner.className = "standout-update-toast";
            progressBanner.setAttribute?.("role", "status");
            progressBanner.setAttribute?.("aria-live", "polite");

            const heading = documentRef.createElement("div");
            heading.className = "standout-update-toast__heading";
            heading.textContent = "StandOut update";

            const label = documentRef.createElement("p");
            label.id = "standout-update-progress-label";
            label.className = "standout-update-toast__message";

            const track = documentRef.createElement("div");
            track.className = "standout-update-progress__track";
            track.setAttribute?.("role", "progressbar");
            track.setAttribute?.("aria-label", "StandOut update progress");
            track.setAttribute?.("aria-valuemin", "0");
            track.setAttribute?.("aria-valuemax", "100");

            const fill = documentRef.createElement("div");
            fill.id = "standout-update-progress-fill";
            fill.className = "standout-update-progress__fill is-indeterminate";
            track.appendChild(fill);

            const footer = documentRef.createElement("div");
            footer.className = "standout-update-toast__footer";

            const percentLabel = documentRef.createElement("span");
            percentLabel.id = "standout-update-progress-percent";
            percentLabel.className = "standout-update-toast__percent";
            percentLabel.textContent = "Preparing update…";

            const reloadButton = documentRef.createElement("button");
            reloadButton.id = "standout-update-reload";
            reloadButton.className = "standout-update-toast__button";
            reloadButton.type = "button";
            reloadButton.textContent = "Reload now";
            reloadButton.hidden = true;
            reloadButton.addEventListener?.("click", () => {
                if (reloadRequested) return;
                const worker = registration?.waiting || readyWorker;
                if (!worker) {
                    if (label) label.textContent = "Update is ready. Preparing the reload…";
                    return;
                }
                reloadRequested = true;
                reloadButton.disabled = true;
                reloadButton.textContent = "Reloading…";
                if (label) label.textContent = "Applying the update and reloading StandOut…";
                worker.postMessage?.("SKIP_WAITING");
            });

            footer.append(percentLabel, reloadButton);
            progressBanner.append(heading, label, track, footer);
            documentRef.body.appendChild(progressBanner);
        }

        const label = documentRef.getElementById?.("standout-update-progress-label");
        const fill = documentRef.getElementById?.("standout-update-progress-fill");
        const track = fill?.parentNode;
        const percentLabel = documentRef.getElementById?.("standout-update-progress-percent");
        const reloadButton = documentRef.getElementById?.("standout-update-reload");
        if (label) label.textContent = message;

        if (percent === null || percent === undefined || !Number.isFinite(Number(percent))) {
            if (fill) {
                fill.className = "standout-update-progress__fill is-indeterminate";
                fill.style.width = "38%";
            }
            if (percentLabel) percentLabel.textContent = "Downloading update…";
            if (track) track.removeAttribute?.("aria-valuenow");
        } else {
            const safePercent = Math.max(0, Math.min(100, Math.round(Number(percent))));
            if (fill) {
                fill.className = "standout-update-progress__fill";
                fill.style.width = `${safePercent}%`;
            }
            if (percentLabel) percentLabel.textContent = `${safePercent}% · app files processed`;
            if (track) track.setAttribute?.("aria-valuenow", String(safePercent));
        }

        if (ready && reloadButton) {
            reloadButton.hidden = false;
            if (label) label.textContent = "Update ready. Reload StandOut to start using the latest version.";
            if (percentLabel) percentLabel.textContent = "Update downloaded";
        }
    };

    const showUpdateReadyUI = worker => {
        if (worker) readyWorker = worker;
        setProgressUI(100, "Update downloaded. Reload StandOut to finish.", { ready: true });
    };

    const handleServiceWorkerMessage = event => {
        const data = event?.data;
        if (!data || typeof data !== "object") return;

        // Install messages can arrive before register() resolves. Buffer them
        // until the registration tells us whether this is an upgrade or a
        // first-ever installation, otherwise the whole progress sequence can
        // finish before the UI is allowed to appear.
        if (!hadPreviousWorkerAtStartup && [
            "STANDOUT_UPDATE_START", "STANDOUT_UPDATE_PROGRESS",
            "STANDOUT_UPDATE_READY", "STANDOUT_UPDATE_FAILED"
        ].includes(data.type)) {
            pendingUpdateMessages.push(data);
            return;
        }

        if (data.type === "STANDOUT_UPDATE_START") {
            setProgressUI(0, "A new StandOut version was found. Starting update…");
        } else if (data.type === "STANDOUT_UPDATE_PROGRESS") {
            setProgressUI(data.percent, `Updating StandOut… ${data.completed}/${data.total} files processed`);
        } else if (data.type === "STANDOUT_UPDATE_READY") {
            showUpdateReadyUI(registration?.waiting || readyWorker);
        } else if (data.type === "STANDOUT_UPDATE_FAILED") {
            setProgressUI(null, "Update could not finish. StandOut will retry automatically.");
        }
    };

    const handleControllerChange = () => {
        // Ignore first installation; reload only when replacing an existing app worker.
        if (!hadPreviousWorkerAtStartup || reloadingForUpdate) return;
        reloadingForUpdate = true;
        setProgressUI(100, "Update applied. Reloading StandOut…");
        const reload = () => windowRef.location?.reload?.();
        if (typeof windowRef.setTimeout === "function") windowRef.setTimeout(reload, 350);
        else reload();
    };

    // Register listeners before registration/update can trigger installation.
    serviceWorker.addEventListener?.("message", handleServiceWorkerMessage);
    serviceWorker.addEventListener?.("controllerchange", handleControllerChange);

    const trackWorker = worker => {
        if (!worker || trackedWorkers.has(worker)) return;
        trackedWorkers.add(worker);

        if (worker.state === "installing") {
            setProgressUI(null, "A new StandOut version was found. Updating app…");
        }

        worker.addEventListener?.("statechange", () => {
            if (worker.state === "installing") {
                setProgressUI(null, "Downloading StandOut update…");
            } else if (worker.state === "installed" && hadPreviousWorkerAtStartup) {
                showUpdateReadyUI(worker);
            } else if (worker.state === "redundant" && hadPreviousWorkerAtStartup && !reloadingForUpdate) {
                setProgressUI(null, "Update was interrupted. StandOut will retry automatically.");
            }
        });
    };

    const attachRegistration = candidate => {
        if (!candidate || trackedRegistrations.has(candidate)) return;
        trackedRegistrations.add(candidate);

        // This is the key lifecycle from the supplied example.
        candidate.addEventListener?.("updatefound", () => {
            const installingWorker = candidate.installing;
            if (!installingWorker) return;

            // The active worker on the registration is the reliable signal that
            // this is an upgrade, even when serviceWorker.controller is null.
            // Set the flag before rendering so a fast install cannot outrun the UI.
            if (candidate.active) hadPreviousWorkerAtStartup = true;
            if (hadPreviousWorkerAtStartup) {
                setProgressUI(null, "A new StandOut version was found. Updating app…");
            }
            trackWorker(installingWorker);
        });

        // Recover workers whose updatefound event happened before registration resolved.
        // Do not infer an upgrade merely from candidate.active here: on a very
        // fast first install, that may already be the newly installed worker.
        if (candidate.installing) {
            if (hadPreviousWorkerAtStartup) {
                setProgressUI(null, "A new StandOut version was found. Updating app…");
            }
            trackWorker(candidate.installing);
        }
        if (candidate.waiting && hadPreviousWorkerAtStartup) {
            showUpdateReadyUI(candidate.waiting);
        }
    };

    const checkForUpdate = async ({ force = false } = {}) => {
        if (!registration || typeof registration.update !== "function" || checkingUpdate) return;
        const now = Date.now();
        if (!force && now - lastUpdateCheckAt < updateThrottleMs) return;
        checkingUpdate = true;
        lastUpdateCheckAt = now;
        try {
            await registration.update();
            if (registration.installing) trackWorker(registration.installing);
            if (registration.waiting && hadPreviousWorkerAtStartup) {
                showUpdateReadyUI(registration.waiting);
            }
        } catch (error) {
            logger?.warn?.("StandOut update check failed; it will retry:", error);
        } finally {
            checkingUpdate = false;
        }
    };

    const start = async () => {
        if (started) return;
        started = true;

        try {
            // Attach to an existing registration before register() performs its own check.
            const existing = await serviceWorker.getRegistration?.();
            if (existing) {
                registration = existing;
                if (existing.active) hadPreviousWorkerAtStartup = true;
                attachRegistration(existing);
            }

            registration = await navigatorRef.serviceWorker.register("./service-worker.js", { updateViaCache: "none" });
            attachRegistration(registration);

            if (hadPreviousWorkerAtStartup && pendingUpdateMessages.length) {
                const bufferedMessages = pendingUpdateMessages;
                pendingUpdateMessages = [];
                for (const data of bufferedMessages) handleServiceWorkerMessage({ data });
            } else {
                // A genuine first install must not leave a stale progress banner.
                pendingUpdateMessages = [];
            }
            logger?.log?.("Service worker registered:", registration.scope);

            // The register() call itself checks for updates; this explicit check
            // forces a fresh script check and bypasses the browser's HTTP cache.
            await checkForUpdate({ force: true });

            if (typeof windowRef.setInterval === "function") {
                windowRef.setInterval(() => checkForUpdate(), updateIntervalMs);
            }
            windowRef.addEventListener("focus", () => checkForUpdate());
            windowRef.addEventListener("pageshow", () => checkForUpdate());
            documentRef?.addEventListener?.("visibilitychange", () => {
                if (!documentRef.visibilityState || documentRef.visibilityState === "visible") checkForUpdate();
            });
        } catch (error) {
            logger?.error?.("Service worker registration failed:", error);
        }
    };

    // This module is loaded near the end of index.html. Start immediately rather
    // than waiting for window.load, so updatefound/message events are not missed.
    if (documentRef?.readyState === "loading") {
        documentRef.addEventListener?.("DOMContentLoaded", () => { void start(); }, { once: true });
    } else {
        void start();
    }

    return true;
}

if (typeof window !== "undefined" && typeof navigator !== "undefined") registerServiceWorker();
