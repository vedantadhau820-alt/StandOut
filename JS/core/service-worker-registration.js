/**
 * StandOut automatic service-worker updater.
 *
 * Behavior:
 * - Checks for a new worker as soon as the app starts.
 * - Checks again periodically and when the app becomes visible/focused.
 * - Displays download progress sent by the installing service worker.
 * - Automatically activates the new worker after its install completes.
 * - The activating service worker navigates existing tabs after activation.
 */
export function registerServiceWorker({
    navigatorRef = globalThis.navigator,
    windowRef = globalThis.window,
    documentRef = globalThis.document,
    logger = globalThis.console,
    updateIntervalMs = 60_000,
    updateThrottleMs = 10_000
} = {}) {
    const serviceWorker = navigatorRef?.serviceWorker;
    if (!serviceWorker || !windowRef?.addEventListener) return false;

    let started = false;

    const start = async () => {
        if (started) return;
        started = true;

        const hadControllerAtStartup = Boolean(serviceWorker.controller);
        let registration = null;
        let checkingUpdate = false;
        let lastUpdateCheckAt = 0;
        let updateInProgress = false;
        let progressBanner = null;
        const trackedRegistrations = new WeakSet();
        const trackedWorkers = new WeakSet();

        const setProgressUI = (percent, message) => {
            if (!hadControllerAtStartup || !documentRef?.createElement || !documentRef?.body) return;

            if (!progressBanner || !documentRef.getElementById?.("standout-update-progress")) {
                progressBanner = documentRef.createElement("section");
                progressBanner.id = "standout-update-progress";
                progressBanner.setAttribute?.("role", "status");
                progressBanner.setAttribute?.("aria-live", "polite");
                progressBanner.style.cssText = [
                    "position:fixed", "top:12px", "left:50%", "transform:translateX(-50%)",
                    "width:min(520px,calc(100% - 24px))", "box-sizing:border-box", "z-index:100000",
                    "padding:14px 16px", "border-radius:12px", "background:#172554", "color:#fff",
                    "box-shadow:0 8px 28px rgba(0,0,0,.25)", "font:500 14px/1.4 system-ui,sans-serif"
                ].join(";");

                const label = documentRef.createElement("div");
                label.id = "standout-update-progress-label";
                label.style.cssText = "margin-bottom:9px";

                const track = documentRef.createElement("div");
                track.style.cssText = "height:7px;width:100%;overflow:hidden;border-radius:99px;background:rgba(255,255,255,.22)";

                const fill = documentRef.createElement("div");
                fill.id = "standout-update-progress-fill";
                fill.style.cssText = "height:100%;width:0%;border-radius:99px;background:#60a5fa;transition:width .18s ease";
                track.appendChild(fill);

                const percentLabel = documentRef.createElement("div");
                percentLabel.id = "standout-update-progress-percent";
                percentLabel.style.cssText = "margin-top:6px;text-align:right;font-size:12px;color:#bfdbfe";
                percentLabel.textContent = "0%";

                progressBanner.append(label, track, percentLabel);
                documentRef.body.appendChild(progressBanner);
            }

            const label = documentRef.getElementById?.("standout-update-progress-label");
            const fill = documentRef.getElementById?.("standout-update-progress-fill");
            const percentLabel = documentRef.getElementById?.("standout-update-progress-percent");
            const safePercent = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)));
            if (label) label.textContent = message;
            if (fill) fill.style.width = `${safePercent}%`;
            if (percentLabel) percentLabel.textContent = `${safePercent}%`;
        };

        const handleServiceWorkerMessage = event => {
            const data = event?.data;
            if (!data || typeof data !== "object") return;
            if (data.type === "STANDOUT_UPDATE_START") {
                updateInProgress = true;
                setProgressUI(0, "A new StandOut version was found. Preparing download…");
            } else if (data.type === "STANDOUT_UPDATE_PROGRESS") {
                updateInProgress = true;
                setProgressUI(data.percent, `Downloading StandOut update… ${data.completed}/${data.total}`);
            } else if (data.type === "STANDOUT_UPDATE_READY") {
                updateInProgress = true;
                setProgressUI(100, "Applying StandOut update…");
            } else if (data.type === "STANDOUT_UPDATE_FAILED") {
                updateInProgress = false;
                setProgressUI(0, "Update could not be completed. StandOut will retry next time.");
            }
        };

        serviceWorker.addEventListener?.("message", handleServiceWorkerMessage);
        const trackWorker = worker => {
            if (!worker || trackedWorkers.has(worker)) return;
            trackedWorkers.add(worker);
            if (worker.state === "installing" && hadControllerAtStartup) {
                updateInProgress = true;
                setProgressUI(0, "Preparing StandOut update…");
            }
            worker.addEventListener?.("statechange", () => {
                if (worker.state === "installing" && hadControllerAtStartup) {
                    updateInProgress = true;
                    setProgressUI(0, "Downloading StandOut update…");
                }
            });
        };

        const attachRegistration = candidate => {
            if (!candidate || trackedRegistrations.has(candidate)) return;
            trackedRegistrations.add(candidate);
            candidate.addEventListener?.("updatefound", () => trackWorker(candidate.installing));
            // Inspect current state after listener attachment; updatefound may
            // have happened before register() returned.
            if (candidate.installing) trackWorker(candidate.installing);
            if (candidate.waiting) {
                // Recover a worker left waiting by an older version of StandOut.
                updateInProgress = hadControllerAtStartup;
                candidate.waiting.postMessage?.("SKIP_WAITING");
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
                if (registration.waiting) {
                    updateInProgress = hadControllerAtStartup;
                    registration.waiting.postMessage?.("SKIP_WAITING");
                }
            } catch (error) {
                logger?.warn?.("StandOut update check failed; it will retry:", error);
            } finally {
                checkingUpdate = false;
            }
        };

        try {
            // Attach to an existing registration before register() can trigger
            // its implicit update check.
            try {
                const existing = await serviceWorker.getRegistration?.();
                if (existing) {
                    registration = existing;
                    attachRegistration(existing);
                }
            } catch (error) {
                logger?.warn?.("Could not inspect existing service worker registration:", error);
            }

            registration = await navigatorRef.serviceWorker.register("./service-worker.js", { updateViaCache: "none" });
            attachRegistration(registration);
            logger?.log?.("Service worker registered:", registration.scope);

            // Always check immediately when the app opens.
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

    if (documentRef?.readyState === "complete") void start();
    else windowRef.addEventListener("load", () => { void start(); }, { once: true });
    return true;
}

if (typeof window !== "undefined" && typeof navigator !== "undefined") registerServiceWorker();
