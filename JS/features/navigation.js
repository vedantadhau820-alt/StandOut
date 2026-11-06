/**
 * Navigation feature: page switching and context-sensitive global Add button.
 * Navigation controls use event listeners; no inline handler attributes are required.
 */

let activeModalType = null;
let controlsInitialized = false;

function initialize() {
    if (controlsInitialized) return;
    controlsInitialized = true;

    const pages = ["missions", "skillset", "time", "goals", "account"];
    pages.forEach(pageId => {
        const button = document.getElementById(`nav-${pageId}`);
        button?.addEventListener("click", () => showPage(pageId));
    });

    document.getElementById("globalAddBtn")?.addEventListener("click", () => {
        if (activeModalType) window.openModal?.(activeModalType);
    });
}

function updatePlusBtn(pageId) {
    const button = document.getElementById("globalAddBtn");
    if (!button) return;

    const modalTypes = {
        missions: "mission",
        skillset: "skill",
        goals: "goal",
        time: "multi-time"
    };
    const modalType = modalTypes[pageId];
    activeModalType = modalType || null;

    if (!modalType) {
        button.style.display = "none";
        return;
    }

    button.dataset.modalType = modalType;
    button.style.display = "block";
}

function showPage(pageId) {
    document.querySelectorAll("section").forEach(section => {
        section.classList.remove("active");
    });

    document.getElementById(pageId)?.classList.add("active");

    document.querySelectorAll(".bottom-nav > button").forEach(button => {
        button.classList.remove("active");
    });

    document.getElementById(`nav-${pageId}`)?.classList.add("active");

    updatePlusBtn(pageId);
    window.isMarketplaceOpen = pageId === "marketplace-cards";

    if (pageId === "account") {
        window.renderAchievements?.();
    }
}

export const navigation = Object.freeze({
    initialize,
    showPage,
    updatePlusBtn
});
