/**
 * Reset the visible application surfaces after persistent state is cleared.
 * Existing feature renderers remain the source of truth for their own views.
 */
export function resetApplicationUI() {
    /* =====================================================
       13. RESET UI LISTS
    ===================================================== */

    const missionList =
        document.getElementById(
            "mission-list"
        );


    const skillList =
        document.getElementById(
            "skill-list"
        );


    const goalList =
        document.getElementById(
            "goal-list"
        );


    const countdownList =
        document.getElementById(
            "countdown-list"
        );


    if (missionList) {

        missionList.replaceChildren();

    }


    if (skillList) {

        skillList.replaceChildren();

    }


    if (goalList) {

        goalList.replaceChildren();

    }


    if (countdownList) {

        countdownList.replaceChildren();

    }


    /* =====================================================
       14. RESET COUNTERS
    ===================================================== */

    const missionCounter =
        document.getElementById(
            "missionCounter"
        );


    const countdownCounter =
        document.getElementById(
            "countdownCounter"
        );


    if (missionCounter) {

        missionCounter.textContent =
            "0";

    }


    if (countdownCounter) {

        countdownCounter.textContent =
            "0";

    }


    /* =====================================================
       15. RESET NOTIFICATIONS UI
    ===================================================== */

    const notificationList =
        document.getElementById(
            "notificationList"
        );


    if (notificationList) {

        const emptyState = document.createElement("p");
        emptyState.style.opacity = "0.6";
        emptyState.textContent = "No notifications";
        notificationList.replaceChildren(emptyState);

    }


    const notificationBadge =
        document.getElementById(
            "notifyBadge"
        );


    if (notificationBadge) {

        notificationBadge.style.display =
            "none";

        notificationBadge.textContent =
            "";

    }


    /* =====================================================
       16. RESET CUSTOM CARD MANAGER
    ===================================================== */

    const customCardsManager =
        document.getElementById(
            "customCardsManager"
        );


    if (customCardsManager) {

        const emptyState = document.createElement("div");
        emptyState.className = "custom-cards-empty";
        emptyState.textContent = "You haven't created any custom cards yet.";
        customCardsManager.replaceChildren(emptyState);

    }


    /* =====================================================
       17. RESET MONTHLY SUMMARY
    ===================================================== */

    const monthlySummaryTitle =
        document.getElementById(
            "monthlySummaryTitle"
        );


    const monthlySummaryText =
        document.getElementById(
            "monthlySummaryText"
        );


    const monthlySummaryCompletion =
        document.getElementById(
            "monthlySummaryCompletion"
        );


    const monthlySummaryConsistency =
        document.getElementById(
            "monthlySummaryConsistency"
        );


    const monthlySummaryGoals =
        document.getElementById(
            "monthlySummaryGoals"
        );


    const monthlyConsistency =
        document.getElementById(
            "monthlyConsistency"
        );


    const monthlyCompleted =
        document.getElementById(
            "monthlyCompleted"
        );


    const monthlyMissed =
        document.getElementById(
            "monthlyMissed"
        );


    const monthlyActiveDays =
        document.getElementById(
            "monthlyActiveDays"
        );


    const monthlyImprovementPoints =
        document.getElementById(
            "monthlyImprovementPoints"
        );


    if (monthlySummaryTitle) {

        monthlySummaryTitle.textContent =
            new Date(
                new Date().getFullYear(),
                new Date().getMonth(),
                1
            ).toLocaleDateString(
                [],
                {
                    month: "long"
                }
            );

    }


    if (monthlySummaryText) {

        monthlySummaryText.textContent =
            "No summary available yet.";

    }


    if (monthlySummaryCompletion) {

        monthlySummaryCompletion.textContent =
            "0%";

    }


    if (monthlySummaryConsistency) {

        monthlySummaryConsistency.textContent =
            "0%";

    }


    if (monthlySummaryGoals) {

        monthlySummaryGoals.textContent =
            "0/0";

    }


    if (monthlyConsistency) {

        monthlyConsistency.textContent =
            "0%";

    }


    if (monthlyCompleted) {

        monthlyCompleted.textContent =
            "0";

    }


    if (monthlyMissed) {

        monthlyMissed.textContent =
            "0";

    }


    if (monthlyActiveDays) {

        monthlyActiveDays.textContent =
            "0";

    }


    if (monthlyImprovementPoints) {

        monthlyImprovementPoints.textContent =
            "0";

    }


    /* =====================================================
       18. RESET MONTHLY ACTIVITY CALENDAR
    ===================================================== */

    const monthlyActivityCalendar =
        document.getElementById(
            "monthlyActivityCalendar"
        );


    if (monthlyActivityCalendar) {

        monthlyActivityCalendar.replaceChildren();

    }


    /* =====================================================
       19. RESET MONTHLY GRAPH
    ===================================================== */

    const monthlyConsistencyGraph =
        document.getElementById(
            "monthlyConsistencyGraph"
        );


    if (monthlyConsistencyGraph) {

        monthlyConsistencyGraph.replaceChildren();

    }


    /* =====================================================
       20. RESET MONTHLY GOALS / MOMENTUM
    ===================================================== */

    const monthlyGoals =
        document.getElementById(
            "monthlyGoals"
        );


    if (monthlyGoals) {

        monthlyGoals.replaceChildren();

    }


    const monthlyMomentum =
        document.getElementById(
            "monthlyMomentum"
        );


    if (monthlyMomentum) {

        monthlyMomentum.replaceChildren();

    }


    /* =====================================================
       21. RESET MARKETPLACE
    ===================================================== */

    if (
        typeof renderMarketplace ===
        "function"
    ) {

        renderMarketplace(
            "ALL"
        );

    }


    if (
        typeof renderMyCards ===
        "function"
    ) {

        renderMyCards();

    }


    /* =====================================================
       22. RESET ACHIEVEMENTS
    ===================================================== */

    if (
        typeof renderAchievements ===
        "function"
    ) {

        renderAchievements();

    }


    /* =====================================================
       23. RESET CUSTOM CARD CONTROLS
    ===================================================== */

    if (
        typeof initializeCustomCardGradeControls ===
        "function"
    ) {

        initializeCustomCardGradeControls();

    }


    /* =====================================================
       24. RESET SOUND UI
    ===================================================== */

    if (
        typeof renderSoundSettings ===
        "function"
    ) {

        try {

            renderSoundSettings();

        } catch (error) {

            console.warn(
                "Could not reset sound UI:",
                error
            );

        }

    }


}
