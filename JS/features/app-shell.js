/**
 * App-shell UI integrations extracted from the legacy app-part1 script.
 * Public window methods are retained for compatibility with service-worker
 * update flows and existing global callers.
 */

export function initializeAppShell({
    documentRef = document,
    windowRef = window,
    setIntervalRef = setInterval
} = {}) {
    function showUpdatingIndicator() {
        if (documentRef.getElementById("sw-updating")) return;

        const bar = documentRef.createElement("div");
        bar.id = "sw-updating";
        bar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #f59e0b;
            color: #000;
            padding: 6px;
            text-align: center;
            font-size: 13px;
            z-index: 99999;
        `;
        bar.textContent = "⬇️ Updating app...";
        documentRef.body.appendChild(bar);
    }

    function hideUpdatingIndicator() {
        documentRef.getElementById("sw-updating")?.remove();
    }

    function showUpdateReadyIndicator() {
        windowRef.showSmartNotification?.(
            "Update Ready",
            "New version downloaded."
        );
    }

    Object.assign(windowRef, {
        showUpdatingIndicator,
        hideUpdatingIndicator,
        showUpdateReadyIndicator
    });

    let dots = 0;
    setIntervalRef(() => {
        const element = documentRef.getElementById("sw-updating");
        if (!element) return;
        dots = (dots + 1) % 4;
        element.textContent = "⬇️ Updating app" + ".".repeat(dots);
    }, 500);

    const monthlyReportIcon = documentRef.getElementById("monthlyReportIcon");
    if (monthlyReportIcon) {
        monthlyReportIcon.addEventListener("click", () => {
            const report = documentRef.getElementById("monthlyReport");
            const missions = documentRef.getElementById("missions");
            if (!report || !missions) return;

            const isOpen = report.classList.contains("active");
            if (isOpen) {
                report.classList.remove("active");
                missions.classList.add("active");
            } else {
                documentRef.querySelectorAll("section").forEach(section => {
                    section.classList.remove("active");
                });
                report.classList.add("active");
                windowRef.renderMonthlyReport?.();
            }

            windowRef.updatePlusBtn?.(isOpen ? "missions" : "monthlyReport");
        });
    }
}

if (typeof document !== "undefined" && typeof window !== "undefined") {
    initializeAppShell();
}
