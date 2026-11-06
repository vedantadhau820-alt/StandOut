/**
 * Explicit compatibility bridges for the legacy app-part3 surface.
 * Keep global names and signatures stable while classic-script callers remain.
 */
export function initializeAppPart3Compatibility(windowRef = window) {
    const core = () => windowRef.StandOutCore;

    function shiftRecurringDeadline(li, repeat) {
        return core()?.missionScheduler?.shiftRecurringDeadline(li, repeat);
    }

    function increaseSkillXP(skillName, amount) {
        return core()?.skills?.increaseSkillXP(skillName, amount);
    }

    function checkMissionAchievements() {
        const milestones = core()?.progression?.missionMilestones || [];
        return core()?.achievements?.checkMissionAchievements(
            milestones,
            windowRef.completedMissionCount
        );
    }

    function updateMissionProgressCounters() {
        return core()?.achievements?.updateMissionProgressCounters({
            dailyCap: core()?.progression?.DAILY_IMPROVEMENT_LIMIT || 10,
            dailyCount: windowRef.dailyImprovementCount,
            completedCount: windowRef.completedMissionCount,
            milestones: core()?.progression?.missionMilestones || []
        });
    }

    function showPopup(achievementText) {
        return core()?.achievements?.showMotivationPopup(achievementText);
    }

    function closePopup() {
        return core()?.achievements?.closeMotivationPopup();
    }

    function addSkill() { return core()?.skills?.addSkill(); }
    function deleteSkillDirect(button) { return core()?.skills?.deleteSkillDirect(button); }
    function updateSkill() { return core()?.skills?.updateSkill(); }
    function checkSkillLevelUp(skillDiv) { return core()?.skills?.checkSkillLevelUp(skillDiv); }
    function deleteSkill(skillName) { return core()?.skills?.deleteSkill(skillName); }
    function initializeSkills() { return core()?.skills?.initializeSkills(); }

    function getGoalNow() { return core()?.goals?.getGoalNow() ?? Date.now(); }
    function saveGoals() { return core()?.goals?.saveGoals(); }
    function getGoalReward(priority) { return core()?.goals?.getGoalReward(priority) ?? 0; }
    function getGoalCommitmentDays(priority) { return core()?.goals?.getGoalCommitmentDays(priority) ?? 0; }
    function addGoal() { return core()?.goals?.addGoal(); }
    function openEditGoal(goalId) { return core()?.goals?.openEditGoal(goalId); }
    function updateGoal(goalId) { return core()?.goals?.updateGoal(goalId); }
    function getGoalCompletionDate() { return core()?.goals?.getGoalCompletionDate(); }
    function getDailyGoalCompletions() { return core()?.goals?.getDailyGoalCompletions(); }
    function renderGoals() { return core()?.goals?.renderGoals(); }
    function markGoalAchieved(goalId) { return core()?.goals?.markGoalAchieved(goalId); }
    function playGoalAchievementVideo() { return core()?.goals?.playGoalAchievementVideo(); }
    function updateGoalTimers() { return core()?.goals?.updateGoalTimers(); }
    function removeGoal(goalId) { return core()?.goals?.removeGoal(goalId); }

    function escapeHTML(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function saveCountdowns() { return core()?.countdowns?.saveCountdowns(); }
    function addCountdown() { return core()?.countdowns?.addCountdown(); }
    function removeCountdown(index) { return core()?.countdowns?.removeCountdown(index); }
    function renderCountdowns() { return core()?.countdowns?.renderCountdowns(); }
    function updateTimers() { return core()?.countdowns?.updateTimers(); }

    function saveData() { return core()?.dataPersistence?.saveData(); }
    function loadData() { return core()?.dataPersistence?.loadData(); }
    async function resetData() { return core()?.dataManagement?.resetData(); }

    function isPastDateTime(dateTimeValue) {
        if (!dateTimeValue) return false;
        return new Date(dateTimeValue).getTime() < Date.now();
    }

    function startResetHold() { return core()?.cheats?.startResetHold(); }
    function cancelResetHold() { return core()?.cheats?.cancelResetHold(); }
    function openCheatModal() { return core()?.cheats?.openCheatModal(); }
    function closeCheatModal() { return core()?.cheats?.closeCheatModal(); }
    function confirmCheat() {
        return core()?.cheats?.confirmCheat({
            setCompletedMissions: value => { windowRef.completedMissions = value; },
            setDailyImprovementCount: value => { windowRef.dailyImprovementCount = value; },
            updateMissionCounter: value => {
                const counter = windowRef.document?.getElementById("missionCounter");
                if (counter) counter.textContent = value;
            },
            showAlert: message => windowRef.customAlert(message),
            showNotification: (title, message) => windowRef.showSmartNotification(title, message),
            closeModal: () => windowRef.closeCheatModal()
        });
    }
    function skipDayCheat() {
        return core()?.cheats?.skipDayCheat({
            getLastImprovementDate: () => windowRef.lastImprovementDate,
            setLastImprovementDate: value => { windowRef.lastImprovementDate = value; },
            setDailyImprovementCount: value => { windowRef.dailyImprovementCount = value; },
            showNotification: (title, message) => windowRef.showSmartNotification(title, message),
            closeModal: () => windowRef.closeCheatModal()
        });
    }

    function showMintedCard(card) { return core()?.cards?.showMintedCard(card); }
    function closeMintedCard() { return core()?.cards?.closeMintedCard(); }
    function openCustomCardModal() { return core()?.customCards?.openModal(); }
    function closeCustomCardModal() { return core()?.customCards?.closeModal(); }
    function createCustomCard() { return core()?.customCards?.create(); }
    function resetCustomCardForm() { return core()?.customCards?.resetForm(); }
    function updateCustomCardCostRange() { return core()?.customCards?.updateCostRange(); }

    const bridges = {
        shiftRecurringDeadline,
        increaseSkillXP,
        checkMissionAchievements,
        updateMissionProgressCounters,
        showPopup,
        closePopup,
        addSkill,
        deleteSkillDirect,
        updateSkill,
        checkSkillLevelUp,
        deleteSkill,
        initializeSkills,
        getGoalNow,
        saveGoals,
        getGoalReward,
        getGoalCommitmentDays,
        addGoal,
        openEditGoal,
        updateGoal,
        getGoalCompletionDate,
        getDailyGoalCompletions,
        renderGoals,
        markGoalAchieved,
        playGoalAchievementVideo,
        updateGoalTimers,
        removeGoal,
        escapeHTML,
        saveCountdowns,
        addCountdown,
        removeCountdown,
        renderCountdowns,
        updateTimers,
        saveData,
        loadData,
        resetData,
        isPastDateTime,
        startResetHold,
        cancelResetHold,
        openCheatModal,
        closeCheatModal,
        confirmCheat,
        skipDayCheat,
        showMintedCard,
        closeMintedCard,
        openCustomCardModal,
        closeCustomCardModal,
        createCustomCard,
        resetCustomCardForm,
        updateCustomCardCostRange
    };

    Object.assign(windowRef, bridges);
    Object.defineProperty(windowRef, "customCardImageData", {
        configurable: true,
        enumerable: true,
        get: () => windowRef.__standOutCustomCardImageData || "",
        set: value => { windowRef.__standOutCustomCardImageData = String(value || ""); }
    });

    // Preserve the original app-part3 load-time progress-counter refresh.
    windowRef.addEventListener("load", updateMissionProgressCounters);

    return Object.freeze({
        ...bridges,
        getCustomCardImageData: () => windowRef.customCardImageData,
        setCustomCardImageData: value => { windowRef.customCardImageData = value; }
    });
}
