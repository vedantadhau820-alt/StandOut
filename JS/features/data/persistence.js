/**
 * StandOut local data persistence.
 * Keeps the existing localStorage keys and HTML snapshot format so current
 * user data remains compatible with previous releases.
 */

function saveData() {
    localStorage.setItem("completedMissionCount", window.completedMissionCount);
    localStorage.setItem("missionHistory", JSON.stringify(window.missionHistory));

    // Preserve mission state flags in the saved HTML snapshot.
    document.querySelectorAll("#mission-list li").forEach(li => {
        if (li.dataset.deducted) li.setAttribute("data-deducted", "true");
    });

    // Preserve skill XP in the saved HTML snapshot.
    document.querySelectorAll("#skill-list .skill").forEach(skill => {
        skill.setAttribute("data-xp", skill.dataset.xp || "0");
    });

    localStorage.setItem("missions", document.getElementById("mission-list").innerHTML);
    localStorage.setItem("skills", document.getElementById("skill-list").innerHTML);
    localStorage.setItem("goals", document.getElementById("goal-list").innerHTML);

    document.querySelectorAll("#mission-list li").forEach(li => {
        if (li.dataset.overdueNotified) {
            li.setAttribute("data-overdue-notified", "true");
        }
    });
}

const STORED_MARKUP_TAGS = new Set([
    "DIV", "SPAN", "BUTTON", "STRONG", "SMALL", "P", "UL", "OL", "LI",
    "B", "I", "EM", "BR", "HR", "LABEL", "TIME"
]);

const STORED_MARKUP_DROP_TAGS = new Set([
    "SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "SVG", "MATH",
    "TEMPLATE", "LINK", "META", "BASE"
]);

function copySafeStoredNode(node, targetDocument) {
    if (node.nodeType === Node.TEXT_NODE) {
        return targetDocument.createTextNode(node.nodeValue || "");
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return null;

    const tagName = node.tagName.toUpperCase();
    if (STORED_MARKUP_DROP_TAGS.has(tagName)) return null;

    // Unknown wrappers are unwrapped; their text and safe descendants survive.
    const output = STORED_MARKUP_TAGS.has(tagName)
        ? targetDocument.createElement(tagName.toLowerCase())
        : targetDocument.createDocumentFragment();

    if (output.nodeType === Node.ELEMENT_NODE) {
        for (const attribute of Array.from(node.attributes)) {
            const name = attribute.name.toLowerCase();
            const value = attribute.value;

            if (name === "class") {
                const safeClasses = value.split(/\s+/).filter(token => /^[a-zA-Z0-9_-]+$/.test(token));
                if (safeClasses.length) output.setAttribute("class", safeClasses.join(" "));
                continue;
            }

            // Data attributes are inert metadata used to rehydrate existing features.
            if (/^data-[a-z0-9_-]+$/.test(name) && value.length <= 2048) {
                output.setAttribute(name, value);
                continue;
            }

            if (/^aria-[a-z0-9_-]+$/.test(name) && value.length <= 512) {
                output.setAttribute(name, value);
                continue;
            }

            if (["type", "title", "role"].includes(name) && value.length <= 256) {
                output.setAttribute(name, value);
                continue;
            }

            if (["disabled", "hidden"].includes(name)) {
                output.setAttribute(name, "");
            }

            // Deliberately discard style, URL-bearing attributes, IDs, and all
            // event-handler attributes (on*) from browser-controlled storage.
        }
    }

    for (const child of Array.from(node.childNodes)) {
        const safeChild = copySafeStoredNode(child, targetDocument);
        if (safeChild) output.appendChild(safeChild);
    }

    return output;
}

function sanitizeStoredMarkup(markup) {
    if (typeof markup !== "string" || !markup) return document.createDocumentFragment();

    const parser = new DOMParser();
    const parsed = parser.parseFromString(markup, "text/html");
    const fragment = document.createDocumentFragment();

    for (const child of Array.from(parsed.body.childNodes)) {
        const safeChild = copySafeStoredNode(child, document);
        if (safeChild) fragment.appendChild(safeChild);
    }

    return fragment;
}

function loadData() {
    // Restore the Improvement Points balance.
    window.completedMissions = Math.max(
        0,
        Number(localStorage.getItem("completedMissions")) || 0
    );

    // Restore mission history without allowing malformed JSON to abort startup.
    try {
        const storedHistory = localStorage.getItem("missionHistory");
        window.missionHistory = storedHistory ? JSON.parse(storedHistory) : {};
    } catch (error) {
        console.warn("Could not load mission history:", error);
        window.missionHistory = {};
    }

    // LocalStorage is user-editable. Never assign persisted HTML directly to
    // innerHTML: rebuild a restricted set of inert elements and attributes.
    const missionList = document.getElementById("mission-list");
    const skillList = document.getElementById("skill-list");
    const goalList = document.getElementById("goal-list");

    if (missionList) {
        missionList.replaceChildren(sanitizeStoredMarkup(localStorage.getItem("missions") || ""));
    }
    if (skillList) {
        skillList.replaceChildren(sanitizeStoredMarkup(localStorage.getItem("skills") || ""));
    }
    if (goalList) {
        goalList.replaceChildren(sanitizeStoredMarkup(localStorage.getItem("goals") || ""));
    }

    // Rehydrate mission state and replace the removed inline completion handler.
    document.querySelectorAll("#mission-list li").forEach(li => {
        if (!li.querySelector(".overdueMark")) {
            const span = document.createElement("span");
            span.className = "overdueMark";
            li.appendChild(span);
        }

        if (!li.querySelector(".deadlineDisplay")) {
            const deadlineDisplay = document.createElement("span");
            deadlineDisplay.className = "deadlineDisplay";
            li.appendChild(deadlineDisplay);
        }

        const savedDeadline = li.getAttribute("data-deadline");
        if (savedDeadline) li.dataset.deadline = savedDeadline;
        if (li.getAttribute("data-deducted") === "true") li.dataset.deducted = "true";
        if (li.getAttribute("data-overdue-notified") === "true") li.dataset.overdueNotified = "true";
        if (li.getAttribute("data-hardcore") === "true") li.dataset.hardcore = "true";
        if (li.getAttribute("data-hardcore-punished") === "true") li.dataset.hardcorePunished = "true";

        const completeButton = li.querySelector(".complete-btn");
        if (completeButton) {
            // Persisted markup is sanitized on load, so reconstruct the
            // completed occurrence's button state from its saved data flag.
            // The recurrence scheduler can re-enable it when the next
            // occurrence begins.
            const occurrenceCompleted = li.dataset.completed === "true";
            completeButton.disabled = occurrenceCompleted;
            completeButton.style.opacity = occurrenceCompleted ? "0.45" : "";

            completeButton.addEventListener("click", event => {
                event.stopPropagation();
                window.completeMission?.(completeButton);
            });
        }

        li.addEventListener("click", event => {
            if (event.target.closest(".complete-btn")) return;
            window.openModal?.("edit-mission", li);
        });
    });

    // Reinitialize skill state and replace removed inline delete handlers.
    window.initializeSkills?.();
    document.querySelectorAll("#skill-list .skill .remove-btn").forEach(button => {
        button.addEventListener("click", event => {
            event.stopPropagation();
            window.deleteSkillDirect?.(button);
        });
    });

    // Rebind goal actions using the inert data-goal-id value, never stored code.
    document.querySelectorAll("#goal-list .goal").forEach(goal => {
        goal.classList.add("show");
        const goalId = goal.dataset.goalId;
        const actions = [
            [".goal-achieve-btn", window.markGoalAchieved],
            [".goal-edit-btn", window.openEditGoal],
            [".goal-remove-btn, .remove-btn", window.removeGoal]
        ];

        for (const [selector, action] of actions) {
            const button = goal.querySelector(selector);
            if (!button || !goalId || typeof action !== "function") continue;
            button.addEventListener("click", event => {
                event.stopPropagation();
                action(goalId);
            });
        }
    });

    const missionCounter = document.getElementById("missionCounter");
    if (missionCounter) missionCounter.textContent = window.completedMissions;
}

export const dataPersistence = Object.freeze({ saveData, loadData });

window.saveData = saveData;
window.loadData = loadData;
