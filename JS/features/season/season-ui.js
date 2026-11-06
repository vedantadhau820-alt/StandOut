/**
 * Season DOM rendering.
 * Keeps selectors and visible labels compatible with the existing Season UI.
 */
export function renderSeasonUI({
    state,
    progress,
    season,
    started,
    documentRef = document,
    countdownUpdater = updateSeasonCountdown
}) {
    documentRef.querySelectorAll(".season-status").forEach(element => {
        if (state.completed) {
            element.textContent = "COMPLETED";
        } else if (!started) {
            element.textContent = "ARIVING";
        } else {
            element.textContent = "ACTIVE";
        }
    });

    documentRef.querySelectorAll("[data-season-level]").forEach(element => {
        element.textContent = progress.level;
    });

    documentRef.querySelectorAll("[data-season-xp]").forEach(element => {
        element.textContent = state.xp;
    });

    documentRef.querySelectorAll("[data-season-progress]").forEach(element => {
        element.textContent = progress.level >= season.maxLevel
            ? "MAX LEVEL"
            : `${progress.currentXP} / ${progress.requiredXP} XP`;
    });

    documentRef.querySelectorAll("[data-season-progress-bar]").forEach(bar => {
        bar.style.width = `${progress.percentage}%`;
    });

    documentRef.querySelectorAll("[data-season-name]").forEach(element => {
        element.textContent = season.name;
    });

    countdownUpdater(season, documentRef);

    documentRef.querySelectorAll("[data-season-reward-level]").forEach(element => {
        const level = Number(element.dataset.seasonRewardLevel);
        const rewardState = state.rewards[level];
        const unlocked = !!(rewardState && rewardState.unlocked);
        const claimed = !!(rewardState && rewardState.claimed);

        element.classList.toggle("unlocked", unlocked);
        element.classList.toggle("claimed", claimed);
        element.classList.toggle("locked", !unlocked);

        const button = element.querySelector("[data-season-claim]");
        const lock = element.querySelector(".season-reward-lock");

        if (button) {
            button.style.display = unlocked ? "" : "none";
            button.disabled = claimed;
            button.textContent = claimed ? "CLAIMED" : "CLAIM";
        }

        if (lock) {
            lock.style.display = unlocked ? "none" : "";
        }
    });
}

export function updateSeasonCountdown(season, documentRef = document, now = new Date()) {
    const elements = documentRef.querySelectorAll("[data-season-countdown]");
    if (!elements.length) return;

    const currentTime = now.getTime();
    const startTime = new Date(season.start).getTime();
    const endTime = new Date(season.end).getTime();
    let text = "";

    if (currentTime < startTime) {
        const difference = startTime - currentTime;
        const days = Math.floor(difference / 86400000);
        const hours = Math.floor((difference % 86400000) / 3600000);
        const minutes = Math.floor((difference % 3600000) / 60000);
        const seconds = Math.floor((difference % 60000) / 1000);
        text = days > 0
            ? `Starts in ${days}d ${hours}h`
            : `${hours}h ${minutes}m ${seconds}s until start`;
    } else if (currentTime <= endTime) {
        const difference = endTime - currentTime;
        const days = Math.floor(difference / 86400000);
        const hours = Math.floor((difference % 86400000) / 3600000);
        const minutes = Math.floor((difference % 3600000) / 60000);
        text = days > 0
            ? `${days}d ${hours}h remaining`
            : `${hours}h ${minutes}m remaining`;
    } else {
        text = "Season Complete";
    }

    elements.forEach(element => {
        element.textContent = text;
    });
}
