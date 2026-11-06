/**
 * Explicit global compatibility bridges for legacy HTML and feature callers.
 * Keep these names/signatures stable until their remaining callers are migrated.
 */
export function initializeLegacyCompatibility(windowRef = window) {
    const core = () => windowRef.StandOutCore;

    function showPage(pageId) {
        const navigation = core()?.navigation;
        if (navigation) return navigation.showPage(pageId);

        // Preserve the original fallback for delayed modular startup.
        windowRef.document?.querySelectorAll("section").forEach(section => section.classList.remove("active"));
        windowRef.document?.getElementById(pageId)?.classList.add("active");
        windowRef.document?.querySelectorAll(".bottom-nav > button").forEach(button => button.classList.remove("active"));
        windowRef.document?.getElementById(`nav-${pageId}`)?.classList.add("active");
        windowRef.updatePlusBtn?.(pageId);
        windowRef.isMarketplaceOpen = pageId === "marketplace-cards";
        if (pageId === "account") windowRef.renderAchievements?.();
    }

    function updatePlusBtn(pageId) {
        const navigation = core()?.navigation;
        if (navigation) return navigation.updatePlusBtn(pageId);

        const button = windowRef.document?.getElementById("globalAddBtn");
        if (!button) return;
        const modalTypes = { missions: "mission", skillset: "skill", goals: "goal", time: "multi-time" };
        const modalType = modalTypes[pageId];
        if (!modalType) {
            button.style.display = "none";
            return;
        }
        button.dataset.legacyModalType = modalType || "";
        if (button.dataset.legacyAddListener !== "true") {
            button.addEventListener("click", () => {
                const selectedType = button.dataset.legacyModalType;
                if (selectedType) openModal(selectedType);
            });
            button.dataset.legacyAddListener = "true";
        }
        button.style.display = "block";
    }

    function closeTimerSettingModal() { return core()?.timer?.closeTimerSettingModal(); }
    function applyTimerSettings() { return core()?.timer?.applyTimerSettings(); }
    function startStaticTimer(h, m, s) { return core()?.timer?.startStaticTimer(h, m, s); }

    function openModal(type, skillDiv = null) { return core()?.modals?.openModal(type, skillDiv); }
    function closeModal() { return core()?.modals?.closeModal(); }
    function customAlert(msg, callback = null) { return core()?.modals?.customAlert(msg, callback); }
    function closeAlert() { return core()?.modals?.closeAlert(); }
    function customConfirm(msg, callback) { return core()?.modals?.customConfirm(msg, callback); }
    function confirmYes() { return core()?.modals?.confirmYes(); }
    function confirmNo() { return core()?.modals?.confirmNo(); }

    function completeMission(btn) {
        const completion = core()?.missionCompletion;
        if (!completion) {
            console.error("[StandOut] Mission completion module is not ready.");
            return;
        }
        return completion.completeMission(btn);
    }

    function addImprovementPoints(amount) { return core()?.points?.add(amount); }

    function getRepeatKey(date = new Date(), repeat = "daily") {
        const scheduler = core()?.missionScheduler;
        if (!scheduler) {
            console.error("[StandOut] Mission scheduler module is not ready.");
            return "once";
        }
        return scheduler.getRepeatKey(date, repeat);
    }

    function refreshRecurringMissions() { return core()?.missionScheduler?.refreshRecurringMissions(); }
    function resetRecurringMission(li, currentKey) { return core()?.missionScheduler?.resetRecurringMission(li, currentKey); }
    function checkMissedDeadlines() { return core()?.missionScheduler?.checkMissedDeadlines(); }
    function processMissionDeadline(li) { return core()?.missionScheduler?.processMissionDeadline(li); }

    Object.assign(windowRef, {
        showPage,
        updatePlusBtn,
        closeTimerSettingModal,
        applyTimerSettings,
        startStaticTimer,
        openModal,
        closeModal,
        customAlert,
        closeAlert,
        customConfirm,
        confirmYes,
        confirmNo,
        completeMission,
        addImprovementPoints,
        getRepeatKey,
        refreshRecurringMissions,
        resetRecurringMission,
        checkMissedDeadlines,
        processMissionDeadline
    });

    return Object.freeze({
        showPage, updatePlusBtn, closeTimerSettingModal, applyTimerSettings,
        startStaticTimer, openModal, closeModal, customAlert, closeAlert,
        customConfirm, confirmYes, confirmNo, completeMission,
        addImprovementPoints, getRepeatKey, refreshRecurringMissions,
        resetRecurringMission, checkMissedDeadlines, processMissionDeadline
    });
}
