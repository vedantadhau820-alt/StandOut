/**
 * Goals feature: owns goals state, persistence, CRUD, rendering, commitment
 * rules, achievement rewards, deadline enforcement, and goal presentation.
 * Existing goalsData and dailyGoalCompletions storage formats are retained.
 */

// Goals owns its runtime state. The window accessor is retained for existing
// integrations (backup/restore, reports, badges, and legacy inline handlers).
let goalsDataState = [];
try {
    const storedGoals = JSON.parse(localStorage.getItem("goalsData") || "[]");
    goalsDataState = Array.isArray(storedGoals)
        ? storedGoals.filter(goal => goal && typeof goal === "object" && !Array.isArray(goal))
        : [];
} catch (error) {
    console.warn("[StandOut] Invalid saved goals data; starting with an empty list.", error);
}

Object.defineProperty(window, "goalsData", {
    configurable: true,
    enumerable: true,
    get: () => goalsDataState,
    set: value => { goalsDataState = Array.isArray(value) ? value.filter(goal => goal && typeof goal === "object" && !Array.isArray(goal)) : []; }
});

window.goalsData.forEach(goal => {

    if (
        !goal.createdAt ||
        !goal.eligibleAt
    ) {

        goal.createdAt = null;
        goal.eligibleAt = Date.now();

    }

});

saveGoals();

let goalTestDate = null;

function getGoalNow() {

    if (goalTestDate) {
        return goalTestDate;
    }

    return Date.now();
}

function saveGoals() {
    localStorage.setItem("goalsData", JSON.stringify(window.goalsData));
}

/* ---------------------------------------------------------
   GOAL REWARD
--------------------------------------------------------- */

function getGoalReward(priority) {

    if (priority === "Low") {
        return 3;
    }

    if (priority === "Medium") {
        return 7;
    }

    if (priority === "High") {
        return 15;
    }

    return 0;
}

function getGoalCommitmentDays(priority) {

    if (priority === "Low") {
        return 3;
    }

    if (priority === "Medium") {
        return 7;
    }

    if (priority === "High") {
        return 25;
    }

    return 0;
}

/* ---------------------------------------------------------
   ADD GOAL
--------------------------------------------------------- */

function addGoal() {

    const title =
        document.getElementById("goalInput").value.trim();

    const priority =
        document.getElementById("priorityInput").value;

    const deadline =
        document.getElementById("goalDeadline").value;

    if (!title) {
        window.closeModal();
        return;
    }

    if (!deadline) {
        window.customAlert("Please set a deadline.");
        return;
    }

    if (window.isPastDateTime(deadline)) {

        window.customAlert(
            "Deadline cannot be in the past."
        );

        return;
    }


    /* -----------------------------------------
       MINIMUM DEADLINE
    ----------------------------------------- */

    const createdAt =
        getGoalNow();

    const commitmentDays =
        getGoalCommitmentDays(priority);

    const eligibleAt =
        createdAt +
        (
            commitmentDays *
            24 *
            60 *
            60 *
            1000
        );

    const deadlineTime =
        new Date(deadline).getTime();

    console.log("GOAL DEADLINE TEST");
    console.log("Created:", new Date(createdAt));
    console.log("Eligible:", new Date(eligibleAt));
    console.log("Deadline:", new Date(deadlineTime));
    console.log("Difference:", deadlineTime - createdAt);
    console.log(
        "Required:",
        commitmentDays * 24 * 60 * 60 * 1000
    );


    if (deadlineTime < eligibleAt) {

        window.customAlert(
            `Your ${priority.toLowerCase()} priority goal must have a deadline at least ${commitmentDays} days from now.`
        );
        return;
    }


    const newGoal = {

        id: Date.now().toString(),

        title,

        priority,

        deadline,

        createdAt,

        eligibleAt,

        achieved: false,

        achievedAt: null,

        overduePenaltyApplied: false,

        warned: false

    };

    window.goalsData.push(newGoal);

    saveGoals();

    renderGoals();

    window.closeModal();
}


/* ---------------------------------------------------------
   EDIT GOAL
--------------------------------------------------------- */

function openEditGoal(goalId) {

    const goal = window.goalsData.find(g => g.id === goalId);

    if (!goal) return;

    // Achieved goals are permanently locked
    if (goal.achieved) {
        window.customAlert("Achieved goals cannot be edited.");
        return;
    }

    // High priority goals are locked
    if (goal.priority === "High") {
        window.customAlert("High priority goals cannot be edited.");
        return;
    }

    const content =
        document.getElementById("modal-content");

    const modal =
        document.getElementById("modal");

    modal.classList.add("active");

    const heading = document.createElement("h3");
    heading.textContent = "Edit Goal";

    const titleInput = document.createElement("input");
    titleInput.id = "editGoalInput";
    titleInput.placeholder = "Goal";
    titleInput.value = String(goal.title ?? "");

    const priorityLabel = document.createElement("label");
    priorityLabel.textContent = "Priority";
    priorityLabel.htmlFor = "editGoalPriority";

    const prioritySelect = document.createElement("select");
    prioritySelect.id = "editGoalPriority";
    for (const priority of ["Low", "Medium"]) {
        const option = document.createElement("option");
        option.value = priority;
        option.textContent = priority;
        prioritySelect.append(option);
    }
    prioritySelect.value = ["Low", "Medium"].includes(goal.priority) ? goal.priority : "Low";

    const deadlineLabel = document.createElement("label");
    deadlineLabel.textContent = "Deadline";
    deadlineLabel.htmlFor = "editGoalDeadline";

    const deadlineInput = document.createElement("input");
    deadlineInput.id = "editGoalDeadline";
    deadlineInput.type = "datetime-local";
    deadlineInput.value = String(goal.deadline ?? "");

    const updateButton = document.createElement("button");
    updateButton.id = "updateGoalButton";
    updateButton.type = "button";
    updateButton.textContent = "Update";
    updateButton.addEventListener("click", () => updateGoal(goal.id));

    const cancelButton = document.createElement("button");
    cancelButton.id = "cancelGoalEditButton";
    cancelButton.type = "button";
    cancelButton.textContent = "Cancel";
    cancelButton.addEventListener("click", () => window.closeModal?.());

    content.replaceChildren(
        heading, titleInput, priorityLabel, prioritySelect,
        deadlineLabel, deadlineInput, updateButton, cancelButton
    );
}


/* ---------------------------------------------------------
   UPDATE GOAL
--------------------------------------------------------- */

function updateGoal(goalId) {

    const goal = window.goalsData.find(g => g.id === goalId);

    if (!goal) return;

    if (goal.achieved) {
        window.customAlert("Achieved goals cannot be edited.");
        return;
    }

    if (goal.priority === "High") {
        window.customAlert("High priority goals cannot be edited.");
        return;
    }

    const newTitle =
        document.getElementById("editGoalInput")
            .value.trim();

    const newPriority =
        document.getElementById("editGoalPriority")
            .value;

    const newDeadline =
        document.getElementById("editGoalDeadline")
            .value;

    if (!newTitle) {
        window.customAlert("Goal name cannot be empty.");
        return;
    }

    if (!newDeadline) {
        window.customAlert("Please set a deadline.");
        return;
    }

    if (window.isPastDateTime(newDeadline)) {
        window.customAlert("Deadline cannot be in the past.");
        return;
    }

    /* -----------------------------------------
   MINIMUM DEADLINE
----------------------------------------- */

    const editedAt =
        getGoalNow();

    const commitmentDays =
        getGoalCommitmentDays(
            newPriority
        );

    const eligibleAt =
        editedAt +
        (
            commitmentDays *
            24 *
            60 *
            60 *
            1000
        );

    const deadlineTime =
        new Date(newDeadline).getTime();


    if (deadlineTime < eligibleAt) {

        window.customAlert(
            `This ${newPriority.toLowerCase()} priority goal requires at least ${commitmentDays} days before its deadline.`
        );

        return;
    }

    goal.title = newTitle;

    goal.priority = newPriority;
    goal.deadline = newDeadline;


    /* -----------------------------------------
       RESET COMMITMENT PERIOD
    ----------------------------------------- */

    const editableAt = getGoalNow();



    goal.createdAt =
        editedAt;

    goal.eligibleAt =
        editedAt +
        (
            commitmentDays *
            24 *
            60 *
            60 *
            1000
        );


    /* -----------------------------------------
       RESET DEADLINE STATE
    ----------------------------------------- */

    goal.warned = false;

    goal.overduePenaltyApplied = false;

    saveGoals();

    renderGoals();

    window.closeModal();
}


/* ---------------------------------------------------------
   RENDER GOALS
--------------------------------------------------------- */

function getGoalCompletionDate() {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(new Date(getGoalNow()));
}

function getDailyGoalCompletions() {
    const today = getGoalCompletionDate();
    let data = {};

    try {
        data = JSON.parse(
            localStorage.getItem("dailyGoalCompletions")
        ) || {};
    } catch (error) {
        data = {};
    }

    if (data.date !== today) {
        data = {
            date: today,
            High: false,
            Medium: false,
            Low: false
        };

        localStorage.setItem(
            "dailyGoalCompletions",
            JSON.stringify(data)
        );
    }

    return data;
}


function renderGoals() {
    const container = document.getElementById("goal-list");
    if (!container) return;

    const activeGoals = window.goalsData.filter(goal => !goal.achieved);
    const achievedGoals = window.goalsData.filter(goal => goal.achieved);

    const achievedSection = document.createElement("div");
    achievedSection.className = "achieved-goals-section";

    const achievedToggle = document.createElement("button");
    achievedToggle.type = "button";
    achievedToggle.className = "achieved-goals-toggle";

    const achievedLabel = document.createElement("span");
    achievedLabel.className = "achieved-goals-label";
    achievedLabel.appendChild(document.createTextNode("View Achieved Goals "));

    const achievedCount = document.createElement("span");
    achievedCount.className = "achieved-goals-count";
    achievedCount.textContent = String(achievedGoals.length);
    achievedLabel.appendChild(achievedCount);

    const achievedChevron = document.createElement("span");
    achievedChevron.className = "achieved-goals-chevron";
    achievedChevron.textContent = "▼";

    achievedToggle.append(achievedLabel, achievedChevron);

    const achievedList = document.createElement("div");
    achievedList.className = "achieved-goals-list";
    achievedList.hidden = true;

    achievedToggle.addEventListener("click", () => {
        achievedList.hidden = !achievedList.hidden;
        achievedChevron.textContent = achievedList.hidden ? "▼" : "▲";
    });

    achievedSection.append(achievedToggle, achievedList);

    const createGoalElement = goal => {
        const priority = ["Low", "Medium", "High"].includes(goal.priority)
            ? goal.priority
            : "Low";

        const goalElement = document.createElement("div");
        goalElement.className = "goal show";
        goalElement.dataset.goalId = String(goal.id ?? "");
        goalElement.dataset.deadline = String(goal.deadline || "");

        if (goal.achieved) goalElement.classList.add("goal-achieved");

        const header = document.createElement("div");
        header.className = "goal-header";

        const title = document.createElement("span");
        title.className = "goal-title";
        title.textContent = String(goal.title ?? "");

        const priorityLabel = document.createElement("span");
        priorityLabel.className = `goal-priority ${priority}`;
        priorityLabel.textContent = priority;
        header.append(title, priorityLabel);

        const meta = document.createElement("div");
        meta.className = "goal-meta";

        const deadlineLabel = document.createElement("span");
        deadlineLabel.className = "goal-deadline";
        if (goal.deadline) {
            const date = new Date(goal.deadline);
            if (!Number.isNaN(date.getTime())) {
                deadlineLabel.textContent = date.toLocaleDateString([], {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                });
            }
        }
        meta.appendChild(deadlineLabel);

        const statusRow = document.createElement("div");
        statusRow.className = "goal-status-row";
        const timer = document.createElement("span");
        timer.className = "goal-timer";
        const overdue = document.createElement("span");
        overdue.className = "goal-overdue";
        statusRow.append(timer, overdue);

        const actions = document.createElement("div");
        actions.className = "goal-actions";

        if (goal.achieved) {
            const achievedBadge = document.createElement("span");
            achievedBadge.className = "achieved-badge";
            achievedBadge.textContent = "✓ Achieved";
            actions.appendChild(achievedBadge);
        } else {
            const achieveButton = document.createElement("button");
            achieveButton.type = "button";
            achieveButton.className = "goal-achieve-btn";
            const isCommitmentLocked = Boolean(goal.eligibleAt && getGoalNow() < goal.eligibleAt);
            achieveButton.disabled = isCommitmentLocked;
            achieveButton.textContent = isCommitmentLocked ? "Locked" : "Achieve";
            achieveButton.addEventListener("click", event => {
                event.stopPropagation();
                markGoalAchieved(goal.id);
            });
            actions.appendChild(achieveButton);

            if (priority === "High") {
                const lockedLabel = document.createElement("span");
                lockedLabel.className = "goal-locked";
                lockedLabel.textContent = "🔒 Locked";
                actions.appendChild(lockedLabel);
            } else {
                const editButton = document.createElement("button");
                editButton.type = "button";
                editButton.className = "goal-edit-btn";
                editButton.textContent = "Edit";
                editButton.addEventListener("click", event => {
                    event.stopPropagation();
                    openEditGoal(goal.id);
                });
                actions.appendChild(editButton);
            }

            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.className = "goal-remove-btn";
            removeButton.textContent = "Remove";
            removeButton.addEventListener("click", event => {
                event.stopPropagation();
                removeGoal(goal.id);
            });
            actions.appendChild(removeButton);
        }

        goalElement.append(header, meta, statusRow, actions);
        return goalElement;
    };

    const goalElements = [...activeGoals, ...achievedGoals].map(createGoalElement);
    const activeElements = goalElements.slice(0, activeGoals.length);
    const achievedElements = goalElements.slice(activeGoals.length);

    const fragment = document.createDocumentFragment();
    if (achievedGoals.length > 0) {
        achievedElements.forEach(element => achievedList.appendChild(element));
        fragment.appendChild(achievedSection);
    }
    activeElements.forEach(element => fragment.appendChild(element));

    container.replaceChildren(fragment);
    updateGoalTimers();
}

/* ---------------------------------------------------------
   ACHIEVE GOAL
--------------------------------------------------------- */
// function canCompleteGoalToday() {

//     const today =
//         getISTDate()
//             .toISOString()
//             .slice(0, 10);

//     const lastGoalCompletionDate =
//         localStorage.getItem(
//             "lastGoalCompletionDate"
//         );

//     return (
//         lastGoalCompletionDate !== today
//     );
// }

function markGoalAchieved(goalId) {

    const goal =
        window.goalsData.find(g => g.id === goalId);

    if (!goal || goal.achieved) return;

    /* -----------------------------------------
   COMMITMENT CHECK
----------------------------------------- */

    const now = getGoalNow();

    if (goal.eligibleAt && now < goal.eligibleAt) {

        const remaining =
            goal.eligibleAt - now;

        const days =
            Math.ceil(
                remaining /
                (1000 * 60 * 60 * 24)
            );

        window.customAlert(
            `This ${goal.priority.toLowerCase()} priority goal requires a ${getGoalCommitmentDays(goal.priority)}-day commitment.\n\n${days} day${days !== 1 ? "s" : ""} remaining.`
        );

        return;
    }


    /* -----------------------------------------
   DAILY GOAL COMPLETION LIMIT
----------------------------------------- */


    const dailyCompletions = getDailyGoalCompletions();

    if (dailyCompletions[goal.priority] !== false) {
        window.customAlert(
            `You have already completed a ${goal.priority} priority goal today. Try another priority or come back tomorrow.`
        );
        return;
    }


    // Safety: cannot complete overdue goals
    if (
        goal.deadline &&
        new Date(goal.deadline).getTime() <= now
    ) {
        window.customAlert(
            "This goal is overdue and can no longer be achieved."
        );

        return;
    }

    goal.achieved = true;

    goal.achievedAt =
        new Date().toLocaleDateString([], {
            day: "numeric",
            month: "short",
            year: "numeric"
        });


    dailyCompletions[goal.priority] = true;

    localStorage.setItem(
        "dailyGoalCompletions",
        JSON.stringify(dailyCompletions)
    );


    const reward =
        getGoalReward(goal.priority);

    window.completedMissions += reward;

    localStorage.setItem(
        "completedMissions",
        window.completedMissions
    );

    document.getElementById(
        "missionCounter"
    ).textContent = window.completedMissions;

    saveGoals();

    renderGoals();

    window.renderMarketplace(window.currentMarketplaceFilter);

    // Celebration
    // playAppTone("mint");

    window.playGoalAchievementVideo()

    window.pushNotification(
        "Goal Achieved 🎯",
        `"${goal.title}" completed • +${reward} Improvement Points`
    );

    window.showSmartNotification(
        "Goal Completed!",
        `+${reward} Improvement Points earned`
    );
}


/* ---------------------------------------------------------
   GOAL ACHIEVEMENT ANIMATION
--------------------------------------------------------- */

function playGoalAchievementVideo() {

    const overlay =
        document.createElement("div");

    overlay.className =
        "goal-achievement-video";

    const content = document.createElement("div");
    content.className = "goal-achievement-video-content";

    const title = document.createElement("div");
    title.className = "goal-achievement-video-title";
    title.textContent = "GOAL ACHIEVED";

    const frame = document.createElement("div");
    frame.className = "goal-achievement-video-frame";

    const videoElement = document.createElement("video");
    videoElement.autoplay = true;
    videoElement.playsInline = true;
    videoElement.preload = "auto";

    const source = document.createElement("source");
    source.src = "/AchievedGoal.mp4";
    source.type = "video/mp4";
    videoElement.append(source);
    frame.append(videoElement);

    const continueButton = document.createElement("button");
    continueButton.type = "button";
    continueButton.className = "goal-achievement-continue";
    continueButton.textContent = "Continue";

    content.append(title, frame, continueButton);
    overlay.append(content);

    document.body.appendChild(overlay);


    const video =
        overlay.querySelector("video");

    /* =========================================
       PLAY
    ========================================= */

    video.play().catch(error => {

        console.warn(
            "Goal achievement video could not autoplay:",
            error
        );

    });


    /* =========================================
       CLOSE
    ========================================= */

    function closeVideo() {

        if (
            overlay.classList.contains(
                "closing"
            )
        ) {
            return;
        }

        video.pause();
        window.stopAllAppAudio();

        overlay.classList.add(
            "closing"
        );

        setTimeout(() => {

            overlay.remove();

        }, 350);
    }


    /* =========================================
       CONTINUE BUTTON
    ========================================= */

    continueButton.addEventListener(
        "click",
        closeVideo
    );


    /* =========================================
       VIDEO FINISHED
    ========================================= */

    video.addEventListener(
        "ended",
        closeVideo
    );


    /* =========================================
       VIDEO ERROR
    ========================================= */

    video.addEventListener(
        "error",
        closeVideo
    );


    /* =========================================
       SHOW
    ========================================= */

    requestAnimationFrame(() => {

        requestAnimationFrame(() => {

            overlay.classList.add(
                "active"
            );

        });

    });

}


/* ---------------------------------------------------------
   GOAL TIMER + OVERDUE SYSTEM
--------------------------------------------------------- */

function updateGoalTimers() {

    const goalElements =
        document.querySelectorAll(
            "#goal-list .goal"
        );

    goalElements.forEach(el => {

        const goalId =
            el.dataset.goalId;

        const goal =
            window.goalsData.find(
                g => g.id === goalId
            );

        if (!goal || goal.achieved) return;

        if (!goal.deadline) return;


        const commitment =
            el.querySelector(".goal-commitment");

        const overdueBadge =
            el.querySelector(".goal-overdue");

        const achieveButton =
            el.querySelector(".goal-achieve-btn");

        /* -------------------------
   COMMITMENT PERIOD
------------------------- */

        if (
            commitment &&
            goal.eligibleAt
        ) {

            const commitmentDiff =
                goal.eligibleAt - getGoalNow();


            if (commitmentDiff > 0) {


                if (achieveButton) {
                    achieveButton.disabled = true;
                    achieveButton.textContent = "Locked";
                }

                const days =
                    Math.floor(
                        commitmentDiff /
                        (1000 * 60 * 60 * 24)
                    );

                const hours =
                    Math.floor(
                        (
                            commitmentDiff %
                            (1000 * 60 * 60 * 24)
                        ) /
                        (1000 * 60 * 60)
                    );

                if (days > 0) {

                    commitment.textContent =
                        `🔒 Commitment: ${days}d ${hours}h remaining`;

                } else {

                    commitment.textContent =
                        `🔒 Commitment: ${hours}h remaining`;

                }

            } else {

                commitment.textContent =
                    "✓ Ready to achieve";

                if (achieveButton) {
                    achieveButton.disabled = false;
                    achieveButton.textContent = "Achieve";
                }

            }

        }

        const deadline =
            new Date(goal.deadline).getTime();

        const diff =
            deadline - getGoalNow();

        const timer =
            el.querySelector(".goal-timer");




        /* -------------------------
           STILL ACTIVE
        ------------------------- */

        if (diff > 0) {

            const days =
                Math.floor(
                    diff /
                    (1000 * 60 * 60 * 24)
                );

            const hours =
                Math.floor(
                    (diff %
                        (1000 * 60 * 60 * 24)) /
                    (1000 * 60 * 60)
                );

            const minutes =
                Math.floor(
                    (diff %
                        (1000 * 60 * 60)) /
                    (1000 * 60)
                );

            if (days > 0) {

                timer.textContent =
                    `${days}d ${hours}h left`;

            } else {

                timer.textContent =
                    `${hours}h ${minutes}m left`;
            }

            overdueBadge.replaceChildren();


            // Due soon notification
            if (
                diff <= 2 * 60 * 60 * 1000 &&
                !goal.warned
            ) {

                goal.warned = true;

                window.pushNotification(
                    "Goal Deadline",
                    `"${goal.title}" is due within 2 hours.`
                );

                saveGoals();
            }

            return;
        }


        /* -------------------------
           OVERDUE
        ------------------------- */

        timer.textContent = "";

        const overdueLabel = document.createElement("span");
        overdueLabel.className = "overdue-badge";
        overdueLabel.textContent = "Overdue";
        overdueBadge.replaceChildren(overdueLabel);


        /*
         * PENALTY
         *
         * Only happens once.
         */

        if (!goal.overduePenaltyApplied) {

            goal.overduePenaltyApplied = true;

            const penalty =
                getGoalReward(goal.priority);

            window.completedMissions = Math.max(
                0,
                window.completedMissions - penalty
            );
            localStorage.setItem(
                "completedMissions",
                window.completedMissions
            );

            document.getElementById(
                "missionCounter"
            ).textContent =
                window.completedMissions;


            window.pushNotification(
                "⚠ Goal Failed",
                `"${goal.title}" expired. -${penalty} Improvement Points`
            );


            window.showSmartNotification(
                "Goal Overdue",
                `-${penalty} Improvement Points`
            );


            saveGoals();

            window.renderMarketplace(
                window.currentMarketplaceFilter
            );
        }
    });
}


/* ---------------------------------------------------------
   REMOVE GOAL
--------------------------------------------------------- */

function removeGoal(goalId) {

    const goal =
        window.goalsData.find(g => g.id === goalId);

    if (!goal) return;

    // Achieved = permanent


    window.customConfirm(
        `Remove "${goal.title}"?`,
        () => {

            window.goalsData =
                window.goalsData.filter(
                    g => g.id !== goalId
                );

            saveGoals();

            renderGoals();
        }
    );
}


/* ---------------------------------------------------------
   SAFE TEXT
--------------------------------------------------------- */


/* ---------------------------------------------------------
   ACHIEVED GOAL — LONG-PRESS DELETE
--------------------------------------------------------- */

let achievedGoalPressTimer = null;
let achievedGoalPressId = null;

function cancelAchievedGoalLongPress() {
    if (achievedGoalPressTimer !== null) {
        window.clearTimeout(achievedGoalPressTimer);
        achievedGoalPressTimer = null;
    }

    achievedGoalPressId = null;
}

function showAchievedGoalDeleteConfirmation(goalId) {
    const goal = window.goalsData.find(item => item.id === goalId);

    if (!goal || !goal.achieved) return;

    window.customConfirm(
        `Delete "${goal.title}"?\n\nThis achieved goal will be permanently removed.`,
        () => deleteAchievedGoal(goalId)
    );
}

function deleteAchievedGoal(goalId) {
    const goal = window.goalsData.find(item => item.id === goalId);

    // Achieved goals can be deleted here; active goals remain protected.
    if (!goal || !goal.achieved) return;

    window.goalsData = window.goalsData.filter(item => item.id !== goalId);
    saveGoals();
    renderGoals();
}

function handleAchievedGoalPointerDown(event) {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const goalElement = target.closest("#goal-list .goal.goal-achieved");
    if (!goalElement) return;

    const goalId = goalElement.dataset.goalId;
    if (!goalId) return;

    cancelAchievedGoalLongPress();
    achievedGoalPressId = goalId;

    achievedGoalPressTimer = window.setTimeout(() => {
        achievedGoalPressTimer = null;
        const pressedGoalId = achievedGoalPressId;
        if (pressedGoalId) showAchievedGoalDeleteConfirmation(pressedGoalId);
    }, 800);
}

document.addEventListener("pointerdown", handleAchievedGoalPointerDown);
document.addEventListener("pointerup", cancelAchievedGoalLongPress);
document.addEventListener("pointercancel", cancelAchievedGoalLongPress);
document.addEventListener("pointerleave", cancelAchievedGoalLongPress);

// Keep the existing one-second commitment/deadline refresh cadence.
const goalTimerInterval = window.setInterval(updateGoalTimers, 1000);

export const goalsFeature = Object.freeze({
    getGoalsData: () => goalsDataState,
    setGoalsData: value => { window.goalsData = value; },
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
    showAchievedGoalDeleteConfirmation,
    deleteAchievedGoal,
    cancelAchievedGoalLongPress,
    goalTimerInterval
});

// Compatibility bridges for inline handlers, backup/restore, and other features.
window.saveGoals = saveGoals;
window.getGoalReward = getGoalReward;
window.getGoalCommitmentDays = getGoalCommitmentDays;
window.addGoal = addGoal;
window.openEditGoal = openEditGoal;
window.updateGoal = updateGoal;
window.getGoalCompletionDate = getGoalCompletionDate;
window.getDailyGoalCompletions = getDailyGoalCompletions;
window.renderGoals = renderGoals;
window.markGoalAchieved = markGoalAchieved;
window.playGoalAchievementVideo = playGoalAchievementVideo;
window.updateGoalTimers = updateGoalTimers;
window.removeGoal = removeGoal;
