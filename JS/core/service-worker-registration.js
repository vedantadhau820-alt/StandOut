/**
 * Register the StandOut service worker and manage user-approved updates.
 *
 * Update lifecycle guarantees:
 * - Observe an existing registration before requesting an update (avoids the
 *   updatefound race that can occur while register()/update() is resolving).
 * - Inspect already-installing and already-waiting workers after attaching.
 * - Check on startup, periodically, on focus, pageshow, and tab visibility.
 * - Reload only after the user explicitly selects "Update now".
 */
export function registerServiceWorker({
    navigatorRef = globalThis.navigator,
    windowRef = globalThis.window,
    documentRef = globalThis.document,
    locationRef = globalThis.location,
    logger = globalThis.console,
    updateIntervalMs = 60_000,
    updateThrottleMs = 15_000
} = {}) {
    const serviceWorker = navigatorRef?.serviceWorker;
    if (!serviceWorker || !windowRef?.addEventListener) return false;

    let started = false;

    const start = async () => {
        if (started) return;
        started = true;

        let registration = null;
        let reloading = false;
        let userApprovedActivation = false;
        let dismissedForSession = false;
        let checkingUpdate = false;
        let lastUpdateCheckAt = 0;

        const trackedRegistrations = new WeakSet();
        const trackedWorkers = new WeakSet();

        const reloadOnce = () => {
            if (!userApprovedActivation || reloading) return;
            reloading = true;
            locationRef?.reload?.();
        };

        serviceWorker.addEventListener?.("controllerchange", reloadOnce);

        const removeBanner = () => {
            documentRef?.getElementById?.("standout-update-banner")?.remove?.();
        };

        const showBanner = (mode, worker = null) => {
            if (dismissedForSession || !documentRef?.createElement || !documentRef?.body) return;

            let banner = documentRef.getElementById?.("standout-update-banner");
            if (!banner) {
                banner = documentRef.createElement("section");
                banner.id = "standout-update-banner";
                banner.setAttribute?.("role", "status");
                banner.setAttribute?.("aria-live", "polite");
                banner.style.cssText = [
                    "position:fixed", "top:12px", "left:50%", "transform:translateX(-50%)",
                    "width:min(560px, calc(100% - 24px))", "box-sizing:border-box",
                    "z-index:100000", "display:flex", "align-items:center", "justify-content:space-between",
                    "gap:12px", "flex-wrap:wrap", "padding:14px 16px", "border-radius:12px",
                    "background:#172554", "color:#fff", "box-shadow:0 8px 28px rgba(0,0,0,.25)",
                    "font:500 14px/1.4 system-ui,sans-serif"
                ].join(";");
                documentRef.body.appendChild(banner);
            }

            banner.replaceChildren?.();
            const message = documentRef.createElement("span");
            message.textContent = mode === "ready"
                ? "A new StandOut version is ready."
                : "A StandOut update is downloading…";
            banner.appendChild(message);

            if (mode !== "ready") return;

            const actions = documentRef.createElement("div");
            actions.style.cssText = "display:flex;gap:8px;align-items:center;";

            const updateButton = documentRef.createElement("button");
            updateButton.type = "button";
            updateButton.textContent = "Update now";
            updateButton.style.cssText = "border:0;border-radius:8px;padding:9px 13px;background:#60a5fa;color:#0b1220;font-weight:700;cursor:pointer;";
            updateButton.addEventListener("click", () => {
                const waitingWorker = registration?.waiting || worker;
                if (!waitingWorker) {
                    updateButton.disabled = false;
                    updateButton.textContent = "Update now";
                    return;
                }

                userApprovedActivation = true;
                updateButton.disabled = true;
                updateButton.textContent = "Updating…";

                // controllerchange is the primary reload signal. Worker state
                // is also observed as a fallback for browsers with delayed events.
                waitingWorker.addEventListener?.("statechange", () => {
                    if (waitingWorker.state === "activated") reloadOnce();
                });
                waitingWorker.postMessage("SKIP_WAITING");
            }, { once: true });

            const laterButton = documentRef.createElement("button");
            laterButton.type = "button";
            laterButton.textContent = "Later";
            laterButton.style.cssText = "border:1px solid rgba(255,255,255,.35);border-radius:8px;padding:9px 12px;background:transparent;color:#fff;cursor:pointer;";
            laterButton.addEventListener("click", () => {
                dismissedForSession = true;
                removeBanner();
            }, { once: true });

            actions.append(updateButton, laterButton);
            banner.appendChild(actions);
        };

        const announceWaitingWorker = () => {
            if (registration?.waiting && serviceWorker.controller) {
                showBanner("ready", registration.waiting);
            }
        };

        const handleWorkerState = worker => {
            if (!worker) return;
            if (worker.state === "installed" && serviceWorker.controller) {
                showBanner("ready", registration?.waiting || worker);
            } else if (worker.state === "redundant") {
                // Do not remove a banner for a different, still-waiting worker.
                if (!registration?.waiting) removeBanner();
            } else if (worker.state === "activated") {
                reloadOnce();
            }
        };

        const trackInstallingWorker = worker => {
            if (!worker || trackedWorkers.has(worker)) return;
            trackedWorkers.add(worker);

            if (worker.state === "installing" && serviceWorker.controller) {
                showBanner("downloading", worker);
            }

            worker.addEventListener?.("statechange", () => handleWorkerState(worker));
            // The worker may already have reached installed before we attached.
            handleWorkerState(worker);
        };

        const attachRegistration = candidate => {
            if (!candidate || trackedRegistrations.has(candidate)) return;
            trackedRegistrations.add(candidate);

            // Attach before update() and before register() on an existing
            // registration, so updatefound cannot be missed.
            candidate.addEventListener?.("updatefound", () => {
                trackInstallingWorker(candidate.installing);
            });

            if (candidate.installing) trackInstallingWorker(candidate.installing);
            if (candidate.waiting && serviceWorker.controller) {
                showBanner("ready", candidate.waiting);
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
                announceWaitingWorker();
                if (registration.installing) trackInstallingWorker(registration.installing);
            } catch (error) {
                // Update checks must never prevent the app from starting.
                logger?.warn?.("StandOut update check failed; will retry later:", error);
            } finally {
                checkingUpdate = false;
            }
        };

        try {
            // Observe an existing registration before register() triggers its
            // built-in update check. This closes the updatefound timing race.
            try {
                const existingRegistration = await serviceWorker.getRegistration?.();
                if (existingRegistration) {
                    registration = existingRegistration;
                    attachRegistration(registration);
                }
            } catch (error) {
                logger?.warn?.("Could not inspect the existing service worker registration:", error);
            }

            const registered = await navigatorRef.serviceWorker.register("./service-worker.js", {
                updateViaCache: "none"
            });
            registration = registered;
            attachRegistration(registration);
            logger?.log?.("Service worker registered with scope:", registration.scope);

            announceWaitingWorker();
            await checkForUpdate({ force: true });
            announceWaitingWorker();

            // Check periodically while the app remains open.
            if (typeof windowRef.setInterval === "function") {
                windowRef.setInterval(() => checkForUpdate(), updateIntervalMs);
            }

            // Re-check when users return to the app or switch back to its tab.
            windowRef.addEventListener("focus", () => checkForUpdate());
            windowRef.addEventListener("pageshow", () => checkForUpdate());
            documentRef?.addEventListener?.("visibilitychange", () => {
                if (!documentRef.visibilityState || documentRef.visibilityState === "visible") {
                    checkForUpdate();
                }
            });
        } catch (error) {
            logger?.error?.("Service worker registration/update check failed:", error);
        }
    };

    if (documentRef?.readyState === "complete") {
        void start();
    } else {
        windowRef.addEventListener("load", () => { void start(); }, { once: true });
    }

    return true;
}

if (typeof window !== "undefined" && typeof navigator !== "undefined") {
    registerServiceWorker();
}
