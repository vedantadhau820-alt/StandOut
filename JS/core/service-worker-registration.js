/**
 * Register the app service worker, check for a newer deployment on every app
 * open, and present an explicit update action before activating it.
 */
export function registerServiceWorker({
    navigatorRef = globalThis.navigator,
    windowRef = globalThis.window,
    documentRef = globalThis.document,
    locationRef = globalThis.location,
    logger = globalThis.console
} = {}) {
    const serviceWorker = navigatorRef?.serviceWorker;
    if (!serviceWorker || !windowRef?.addEventListener) return false;

    windowRef.addEventListener("load", async () => {
        try {
            const registration = await navigatorRef.serviceWorker.register("./service-worker.js", {
                updateViaCache: "none"
            });
            logger?.log?.("Service worker registered with scope:", registration.scope);

            let reloading = false;
            const hadController = Boolean(serviceWorker.controller);

            serviceWorker.addEventListener?.("controllerchange", () => {
                if (!hadController || reloading) return;
                reloading = true;
                locationRef?.reload?.();
            });

            const showBanner = (mode, worker = null) => {
                if (!documentRef?.createElement || !documentRef?.body) return;
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

                if (mode === "ready") {
                    const actions = documentRef.createElement("div");
                    actions.style.cssText = "display:flex;gap:8px;align-items:center;";
                    const updateButton = documentRef.createElement("button");
                    updateButton.type = "button";
                    updateButton.textContent = "Update now";
                    updateButton.style.cssText = "border:0;border-radius:8px;padding:9px 13px;background:#60a5fa;color:#0b1220;font-weight:700;cursor:pointer;";
                    updateButton.addEventListener("click", () => {
                        const waitingWorker = worker || registration.waiting;
                        if (!waitingWorker) return;
                        updateButton.disabled = true;
                        updateButton.textContent = "Updating…";
                        waitingWorker.postMessage("SKIP_WAITING");
                    }, { once: true });
                    const laterButton = documentRef.createElement("button");
                    laterButton.type = "button";
                    laterButton.textContent = "Later";
                    laterButton.style.cssText = "border:1px solid rgba(255,255,255,.35);border-radius:8px;padding:9px 12px;background:transparent;color:#fff;cursor:pointer;";
                    laterButton.addEventListener("click", () => banner.remove(), { once: true });
                    actions.append(updateButton, laterButton);
                    banner.appendChild(actions);
                }
            };

            const announceWaitingWorker = () => {
                if (registration.waiting && serviceWorker.controller) {
                    showBanner("ready", registration.waiting);
                }
            };

            registration.addEventListener?.("updatefound", () => {
                const installingWorker = registration.installing;
                if (!installingWorker) return;
                if (serviceWorker.controller) showBanner("downloading");
                installingWorker.addEventListener?.("statechange", () => {
                    if (installingWorker.state === "installed" && serviceWorker.controller) {
                        showBanner("ready", registration.waiting || installingWorker);
                    } else if (installingWorker.state === "redundant") {
                        documentRef?.getElementById?.("standout-update-banner")?.remove?.();
                    }
                });
            });

            // A waiting worker may already exist when the user reopens the app.
            announceWaitingWorker();

            // register() checks for updates, and update() explicitly bypasses
            // stale HTTP caches so each app opening checks the deployed worker.
            if (typeof registration.update === "function") {
                await registration.update();
                announceWaitingWorker();
            }
        } catch (error) {
            logger?.error?.("Service worker registration/update check failed:", error);
        }
    }, { once: true });

    return true;
}

if (typeof window !== "undefined" && typeof navigator !== "undefined") {
    registerServiceWorker();
}
