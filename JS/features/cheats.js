/**
 * Hidden maintenance/cheat controls. The legacy application owns the
 * underlying counters; this module owns the hold gesture and modal workflow.
 */
let resetHoldTimer = null;
const RESET_HOLD_DURATION = 5000;

function vibrate() {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(80);
    }
}

function startResetHold() {
    cancelResetHold();
    resetHoldTimer = setTimeout(() => {
        resetHoldTimer = null;
        openCheatModal();
        vibrate();
    }, RESET_HOLD_DURATION);
}

function cancelResetHold() {
    if (resetHoldTimer !== null) {
        clearTimeout(resetHoldTimer);
        resetHoldTimer = null;
    }
}

function openCheatModal() {
    const modal = document.getElementById("cheatModal");
    if (!modal) return;
    modal.classList.add("active");

    setTimeout(() => {
        document.getElementById("cheatInput")?.focus();
    }, 150);
}

function closeCheatModal() {
    document.getElementById("cheatModal")?.classList.remove("active");
}

function confirmCheat(context = {}) {
    const input = document.getElementById("cheatInput");
    const code = input?.value?.trim() || "";

    if (code !== "Thala") {
        context.showAlert?.("Invalid cheat code.");
        return false;
    }

    vibrate();
    context.setCompletedMissions?.(9999);
    context.setDailyImprovementCount?.(0);
    localStorage.setItem("completedMissions", "9999");
    if (input) input.value = "";
    context.updateMissionCounter?.(9999);
    context.closeModal?.();
    context.showNotification?.(
        "Cheat Activated",
        "9999 Improvement Points granted."
    );
    return true;
}

function skipDayCheat(context = {}) {
    const lastDate = context.getLastImprovementDate?.();
    const currentDay = lastDate ? new Date(lastDate) : new Date();
    currentDay.setDate(currentDay.getDate() + 1);

    const nextDayKey = currentDay.toISOString().slice(0, 10);
    context.setLastImprovementDate?.(nextDayKey);
    context.setDailyImprovementCount?.(0);
    localStorage.setItem("lastImprovementDate", nextDayKey);
    localStorage.setItem("dailyImprovementCount", "0");
    context.closeModal?.();
    context.showNotification?.(
        "⏭ Day Skipped",
        `New day activated (${nextDayKey})`
    );
    console.log("⏭ Day skipped to:", nextDayKey);
    return nextDayKey;
}

function initializeCheatControls() {
    const resetButton = document.getElementById("resetDataBtn");
    if (!resetButton || resetButton.dataset.cheatHoldBound === "true") return;
    resetButton.dataset.cheatHoldBound = "true";

    resetButton.addEventListener("touchstart", startResetHold, { passive: true });
    resetButton.addEventListener("mousedown", startResetHold);
    resetButton.addEventListener("touchend", cancelResetHold);
    resetButton.addEventListener("touchcancel", cancelResetHold);
    resetButton.addEventListener("mouseup", cancelResetHold);
    resetButton.addEventListener("mouseleave", cancelResetHold);
    resetButton.addEventListener("blur", cancelResetHold);
}

export const cheats = Object.freeze({
    initializeCheatControls,
    startResetHold,
    cancelResetHold,
    openCheatModal,
    closeCheatModal,
    confirmCheat,
    skipDayCheat
});
