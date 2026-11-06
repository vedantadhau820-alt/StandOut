/** Centralized delegation for static HTML actions. No inline JS or eval. */
const ACTIONS = Object.freeze({
    closePopup: () => window.closePopup(),
    openMasteryModal: () => window.openMasteryModal(),
    closeMasteryLimitModal: () => window.closeMasteryLimitModal(),
    closeMasteryEvidenceModal: () => window.closeMasteryEvidenceModal(),
    saveMasteryEvidence: () => window.saveMasteryEvidence(),
    closeMasteryModal: () => window.closeMasteryModal(),
    addMasteryMilestoneInput: () => window.addMasteryMilestoneInput(),
    submitMasteryCreation: () => window.submitMasteryCreation(),
    closeMasteryEditModal: () => window.closeMasteryEditModal(),
    addEditMasteryMilestone: () => window.addEditMasteryMilestone(),
    saveMasteryEdits: () => window.saveMasteryEdits(),
    openDeleteMasteryModal: () => window.openDeleteMasteryModal(),
    closeDeleteMasteryModal: () => window.closeDeleteMasteryModal(),
    confirmDeleteMastery: () => window.confirmDeleteMastery(),
    confirmCheat: () => window.confirmCheat(),
    closeCheatModal: () => window.closeCheatModal(),
    skipDayCheat: () => window.skipDayCheat(),
    openCustomCardCreator: () => window.openCustomCardCreator(),
    downloadStandOutBackup: () => window.downloadStandOutBackup(),
    restoreStandOutBackup: () => window.restoreStandOutBackup(),
    confirmResetData: () => window.customConfirm("Are you sure you want to reset all data?", window.resetData),
    closeAlert: () => window.closeAlert(),
    confirmYes: () => window.confirmYes(),
    confirmNo: () => window.confirmNo(),
    clearAllNotifications: () => window.clearAllNotifications(),
    setSelectedMusic: () => window.setSelectedMusic(),
    openFolderPicker: () => window.openFolderPicker(),
    closeMusicModal: () => window.closeMusicModal(),
    applyTimerSettings: () => window.applyTimerSettings(),
    closeTimerSettingModal: () => window.closeTimerSettingModal(),
    closeCustomCardModal: () => window.closeCustomCardModal(),
    createCustomCard: () => window.createCustomCard(),
    historyBack: () => window.history.back()
});

function getActionElement(target, eventName) {
    if (!(target instanceof Element)) return null;
    const element = target.closest(`[data-action="${eventName}"][data-action-name]`);
    return element instanceof HTMLElement ? element : null;
}

function dispatchClick(event) {
    const element = getActionElement(event.target, "click");
    if (!element) return;
    const action = ACTIONS[element.dataset.actionName];
    if (typeof action !== "function") {
        console.error("Unknown delegated action:", element.dataset.actionName);
        return;
    }
    action.call(element, event);
}

function dispatchInput(event) {
    const element = getActionElement(event.target, "input");
    if (element?.dataset.actionName === "setMusicVolume" && window.music) {
        window.music.volume = element.value;
    }
}

document.addEventListener("click", dispatchClick);
document.addEventListener("input", dispatchInput);
export { ACTIONS, dispatchClick, dispatchInput };
