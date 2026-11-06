/**
 * Register the application service worker after the document has loaded.
 * Kept external so the startup path does not require an inline script block.
 */
export function registerServiceWorker({
    navigatorRef = globalThis.navigator,
    windowRef = globalThis.window,
    logger = globalThis.console
} = {}) {
    if (!navigatorRef?.serviceWorker || !windowRef?.addEventListener) return false;

    windowRef.addEventListener("load", async () => {
        try {
            const registration = await navigatorRef.serviceWorker.register("./service-worker.js");
            logger?.log?.("Service worker registered with scope:", registration.scope);
        } catch (error) {
            logger?.error?.("Service worker registration failed:", error);
        }
    }, { once: true });

    return true;
}

if (typeof window !== "undefined" && typeof navigator !== "undefined") {
    registerServiceWorker();
}
