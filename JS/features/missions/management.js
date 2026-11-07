/**
 * Mission creation, editing, and deletion workflows.
 * Uses the existing DOM and legacy application services to preserve behavior.
 */

function addMission() {

    const text =
        document.getElementById("missionInput")
            .value.trim();

    const deadline =
        document.getElementById("missionDeadline")
            .value;

    const linkedSkill =
        document.getElementById("linkedSkill")
            .value;

    const isHardcore =
        document.getElementById("hardcoreToggle")
            .checked;

    const repeat =
        document.getElementById("missionRepeat")
            .value;


    // ❌ Text required
    if (!text) {
        closeModal();
        return;
    }


    // 🔥 HARDCORE → DEADLINE REQUIRED
    if (isHardcore && !deadline) {

        customAlert(
            "🔥 Hardcore missions require a deadline."
        );

        return;
    }


    // ❌ Past deadline not allowed
    if (
        deadline &&
        isPastDateTime(deadline)
    ) {

        customAlert(
            "Deadline cannot be in the past."
        );

        return;
    }


    const li =
        document.createElement("li");

    li.dataset.missionId = crypto.randomUUID();


    /* =====================================================
       MISSION DATA
    ===================================================== */

    li.dataset.deadline =
        deadline || "";

    li.dataset.skill =
        linkedSkill || "";

    li.dataset.completed =
        "false";

    li.dataset.hardcore =
        isHardcore
            ? "true"
            : "false";

    li.dataset.repeat = repeat;

    li.dataset.repeatKey = getRepeatKey(new Date(), repeat);


    /* =====================================================
       FORMAT DEADLINE
    ===================================================== */

    let deadlineText = "";

    if (deadline) {

        const d =
            new Date(deadline);

        const date =
            d.toLocaleDateString(
                [],
                {
                    day: "numeric",
                    month: "short"
                }
            );

        const time =
            d.toLocaleTimeString(
                [],
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );

        deadlineText =
            `${date}, ${time}`;
    }


    /* =====================================================
       MISSION DOM
    ===================================================== */

    const missionText = document.createElement("span");
    missionText.className = "mission-text";

    const deadlineRow = document.createElement("div");
    deadlineRow.className = "deadline-row";

    const deadlineDisplay = document.createElement("span");
    deadlineDisplay.className = "deadlineDisplay";
    deadlineDisplay.textContent = deadlineText;

    const repeatLabels = {
        daily: "Daily",
        weekly: "Weekly",
        monthly: "Monthly"
    };
    const repeatLabel = repeatLabels[repeat];
    if (repeatLabel) {
        const repeatBadge = document.createElement("span");
        repeatBadge.className = "repeat-badge";
        repeatBadge.textContent = `↻ ${repeatLabel}`;
        deadlineRow.append(deadlineDisplay, repeatBadge);
    } else {
        deadlineRow.append(deadlineDisplay);
    }

    const overdueMark = document.createElement("span");
    overdueMark.className = "overdueMark";

    const completeButton = document.createElement("button");
    completeButton.className = "complete-btn";
    completeButton.type = "button";
    completeButton.textContent = "✔";

    deadlineRow.append(overdueMark, completeButton);
    li.replaceChildren(missionText, deadlineRow);

    // Mission names are user-controlled text. Never interpolate them into HTML.
    li.querySelector(".mission-text").textContent = text + (isHardcore ? " 🔥" : "");
    li.querySelector(".complete-btn")?.addEventListener("click", event => {
        event.stopPropagation();
        window.completeMission?.(event.currentTarget);
    });

    /* =====================================================
       CLICK TO EDIT
    ===================================================== */

    li.addEventListener(
        "click",
        (e) => {

            if (
                e.target.classList
                    .contains("complete-btn")
            ) {
                return;
            }

            openModal(
                "edit-mission",
                li
            );
        }
    );


    /* =====================================================
       ADD + SAVE
    ===================================================== */

    document
        .getElementById("mission-list")
        .appendChild(li);

    saveData();

    closeModal();
}

function updateMission() {

    const li =
        window.missionBeingEdited;

    if (!li) return;


    const newText =
        document.getElementById(
            "editMissionInput"
        ).value.trim();


    const newDeadline =
        document.getElementById(
            "editMissionDeadline"
        ).value;


    const newRepeat =
        document.getElementById(
            "editMissionRepeat"
        ).value;


    const isHardcore =
        li.dataset.hardcore === "true";


    if (!newText) {

        closeModal();

        return;
    }


    /* =====================================================
       DEADLINE VALIDATION
    ===================================================== */

    if (
        !isHardcore &&
        newDeadline &&
        isPastDateTime(newDeadline)
    ) {

        customAlert(
            "Deadline cannot be in the past."
        );

        return;
    }


    /* =====================================================
       UPDATE TEXT
    ===================================================== */

    // Mission names are user-controlled text; render them as text, not HTML.
    li.querySelector(".mission-text").textContent =
        newText + (isHardcore ? " 🔥" : "");


    /* =====================================================
       UPDATE REPEAT
    ===================================================== */

    li.dataset.repeat = newRepeat;

    const repeatBadge =
        li.querySelector(".repeat-badge");

    if (repeatBadge) {

        repeatBadge.textContent =
            newRepeat === "daily"
                ? "↻ Daily"
                : newRepeat === "weekly"
                    ? "↻ Weekly"
                    : newRepeat === "monthly"
                        ? "↻ Monthly"
                        : "";

    }

    /*
       If recurrence was changed,
       start a fresh occurrence.
    */

    li.dataset.repeatKey = getRepeatKey(new Date(), newRepeat);


    /* =====================================================
       UPDATE DEADLINE
    ===================================================== */

    if (!isHardcore) {

        if (newDeadline) {

            const d =
                new Date(newDeadline);

            const date =
                d.toLocaleDateString(
                    [],
                    {
                        day: "numeric",
                        month: "short"
                    }
                );

            const time =
                d.toLocaleTimeString(
                    [],
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                );

            li.querySelector(
                ".deadlineDisplay"
            ).textContent =
                `${date}, ${time}`;

            li.dataset.deadline =
                newDeadline;

        } else {

            li.querySelector(
                ".deadlineDisplay"
            ).textContent = "";

            li.dataset.deadline =
                "";
        }


        /* Reset overdue state */

        li.querySelector(
            ".overdueMark"
        )?.replaceChildren();

        delete li.dataset.deducted;
        delete li.dataset.overdueNotified;
        delete li.dataset.warned;
    }


    saveData();

    closeModal();
}

function deleteMission() {
    const li = window.missionBeingEdited;
    if (!li || !li.isConnected) return;

    const isHardcore = li.dataset.hardcore === "true";
    const removeMission = () => {
        li.remove();
        window.missionBeingEdited = null;
        saveData();
        closeModal();
    };

    if (!isHardcore) {
        removeMission();
        return;
    }

    customConfirm(
        "🔥 Delete this Hardcore mission?\n\nIf its deadline has passed, the failure penalty will be applied before deletion.",
        () => {
            const deadlineTime = li.dataset.deadline
                ? new Date(li.dataset.deadline).getTime()
                : NaN;
            const overdue = Number.isFinite(deadlineTime) && deadlineTime <= Date.now();
            const unfinished = li.dataset.completed !== "true";

            if (overdue && unfinished && li.dataset.hardcorePunished !== "true") {
                if (typeof window.processMissionDeadline !== "function") {
                    customAlert("Unable to verify the Hardcore penalty. The mission was not deleted.");
                    return;
                }

                window.processMissionDeadline(li);
                if (li.dataset.hardcorePunished !== "true") {
                    customAlert("The Hardcore failure penalty could not be verified. The mission was not deleted.");
                    return;
                }
            }

            removeMission();
        }
    );
}

export const missionManagement = Object.freeze({
    addMission,
    updateMission,
    deleteMission
});

// Compatibility bridges for existing inline handlers and classic-script callers.
window.addMission = addMission;
window.updateMission = updateMission;
window.deleteMission = deleteMission;