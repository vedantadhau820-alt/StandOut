/**
 * Modal and dialog feature. Preserves modal IDs and behavior using delegated event listeners.
 */

function createModalElement(tag, { text = null, id = null, type = null, placeholder = null, maxLength = null, value = null, disabled = false, action = null, className = null, style = null, attributes = {} } = {}) {
    const element = document.createElement(tag);
    if (id) element.id = id;
    if (text !== null) element.textContent = String(text);
    if (type) element.type = type;
    if (placeholder !== null) element.placeholder = placeholder;
    if (maxLength !== null) element.maxLength = maxLength;
    if (value !== null) element.value = value;
    if (disabled) element.disabled = true;
    if (action) element.dataset.modalAction = action;
    if (className) element.className = className;
    if (style) Object.assign(element.style, style);
    for (const [name, attributeValue] of Object.entries(attributes)) element.setAttribute(name, attributeValue);
    return element;
}

function createModalHeading(text) {
    return createModalElement("h3", { text });
}

function createModalLabel(text, htmlFor = null) {
    return createModalElement("label", { text, attributes: htmlFor ? { for: htmlFor } : {} });
}

function createModalInput(id, options = {}) {
    return createModalElement("input", { id, ...options });
}

function createModalSelect(id, options, selectedValue = null) {
    const select = createModalElement("select", { id });
    for (const [value, label] of options) {
        const option = createModalElement("option", { text: label, value });
        if (value === selectedValue) option.selected = true;
        select.append(option);
    }
    return select;
}

function createModalButton(text, action, options = {}) {
    return createModalElement("button", {
        text, action, type: "button", disabled: options.disabled === true,
        style: options.style || null, attributes: options.attributes || {}
    });
}

function openModal(type, skillDiv = null) {
    const modal = document.getElementById("modal");
    const content = document.getElementById("modal-content");
    if (!modal || !content) return;
    modal.classList.add("active");
    const nodes = [];

    if (type === "mission") {
        nodes.push(
            createModalHeading("Add Mission"),
            createModalInput("missionInput", { placeholder: "Enter mission" }),
            createModalLabel("Link Skill"),
            createModalSelect("linkedSkill", [["", "None"]]),
            createModalElement("div", { className: "form-group" })
        );
        const group = nodes[nodes.length - 1];
        group.append(
            createModalLabel("Repeat", "missionRepeat"),
            createModalSelect("missionRepeat", [["none", "Doesn't repeat"], ["daily", "Every day"], ["weekly", "Every week"], ["monthly", "Every month"]], "none")
        );
        nodes.push(
            createModalLabel("Deadline", "missionDeadline"),
            createModalInput("missionDeadline", { type: "datetime-local" })
        );
        const toggleRow = createModalElement("div", { className: "toggle-row" });
        const toggle = createModalElement("label", { className: "toggle" });
        const checkbox = createModalInput("hardcoreToggle", { type: "checkbox" });
        const slider = createModalElement("span", { className: "slider" });
        toggle.append(checkbox, slider);
        toggleRow.append(toggle, createModalElement("span", { text: "Hardcore Mode", className: "toggle-label" }));
        nodes.push(toggleRow, createModalButton("Add", "addMission"), createModalButton("Cancel", "closeModal"));
        content.replaceChildren(...nodes);
        populateLinkedSkills(content);
        return;
    }

    if (type === "skill") {
        nodes.push(
            createModalHeading("Add Skill"),
            createModalInput("skillInput", { type: "text", placeholder: "Enter skill name", maxLength: 50, attributes: { autocomplete: "off" } }),
            createModalButton("Add Skill", "addSkill"),
            createModalButton("Cancel", "closeModal")
        );
        content.replaceChildren(...nodes);
        setTimeout(() => document.getElementById("skillInput")?.focus(), 50);
        return;
    }

    if (type === "edit-skill" && skillDiv) {
        const oldName = skillDiv.querySelector("strong")?.textContent.trim() || "";
        const currentXP = Number.parseInt(skillDiv.dataset.xp || "0", 10);
        const xp = createModalElement("p", { text: `XP: ${Number.isFinite(currentXP) ? currentXP : 0}`, style: { margin: "10px 0", opacity: "0.7", fontSize: "13px" } });
        nodes.push(
            createModalHeading("Edit Skill"),
            createModalInput("editSkillInput", { type: "text", maxLength: 50, attributes: { autocomplete: "off" }, value: oldName }),
            xp,
            createModalButton("Update", "updateSkill"),
            createModalButton("Cancel", "closeModal")
        );
        content.replaceChildren(...nodes);
        window.skillBeingEdited = skillDiv;
        setTimeout(() => document.getElementById("editSkillInput")?.focus(), 50);
        return;
    }

    if (type === "edit-mission" && skillDiv) {
        const oldText = skillDiv.querySelector(".mission-text")?.textContent.replace("🔥", "").trim() || "";
        const oldDeadline = skillDiv.dataset.deadline || "";
        const isHardcore = skillDiv.dataset.hardcore === "true";
        nodes.push(
            createModalHeading("Edit Mission"),
            createModalInput("editMissionInput", { value: oldText }),
            createModalLabel("Repeat", "editMissionRepeat"),
            createModalSelect("editMissionRepeat", [["none", "Doesn't repeat"], ["daily", "Every day"], ["weekly", "Every week"], ["monthly", "Every month"]], skillDiv.dataset.repeat || "none"),
            createModalLabel("Deadline", "editMissionDeadline"),
            createModalInput("editMissionDeadline", { type: "datetime-local", value: oldDeadline, disabled: isHardcore })
        );
        if (isHardcore) {
            nodes.push(createModalElement("p", { text: "🔥 Hardcore mission — deadline cannot be changed", style: { color: "#ef4444", fontSize: "12px", marginTop: "6px" } }));
        }
        nodes.push(createModalButton("Update", "updateMission"));
        nodes.push(createModalButton(isHardcore ? "🔥 Delete Hardcore Mission" : "Delete", "deleteMission"));
        nodes.push(createModalButton("Cancel", "closeModal"));
        content.replaceChildren(...nodes);
        window.missionBeingEdited = skillDiv;
        return;
    }

    if (type === "goal") {
        nodes.push(
            createModalHeading("Add Goal"),
            createModalInput("goalInput", { placeholder: "Goal", maxLength: 100 }),
            createModalLabel("Priority", "priorityInput"),
            createModalSelect("priorityInput", [["High", "High"], ["Medium", "Medium"], ["Low", "Low"]], "High"),
            createModalLabel("Deadline", "goalDeadline"),
            createModalInput("goalDeadline", { type: "datetime-local" }),
            createModalButton("Add Goal", "addGoal"),
            createModalButton("Cancel", "closeModal")
        );
        content.replaceChildren(...nodes);
        const now = new Date().toISOString().slice(0, 16);
        const deadline = document.getElementById("goalDeadline");
        if (deadline) deadline.min = now;
        return;
    }

    if (type === "multi-time") {
        nodes.push(
            createModalHeading("Add Countdown"),
            createModalInput("countdownTitle", { type: "text", placeholder: "Title", maxLength: 80, attributes: { autocomplete: "off" } }),
            createModalLabel("Date and time", "countdownDateTime"),
            createModalInput("countdownDateTime", { type: "datetime-local", attributes: { required: "" } }),
            createModalButton("Add", null, { attributes: { id: "addCountdownButton" } }),
            createModalButton("Cancel", null, { attributes: { id: "cancelCountdownButton" } })
        );
        content.replaceChildren(...nodes);
        const nowIST = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Kolkata" }).replace(" ", "T").slice(0, 16);
        const dateInput = document.getElementById("countdownDateTime");
        if (dateInput) dateInput.min = nowIST;
        document.getElementById("addCountdownButton")?.addEventListener("click", () => window.StandOutCore?.countdowns?.addCountdown());
        document.getElementById("cancelCountdownButton")?.addEventListener("click", closeModal);
    }
}


function populateLinkedSkills(content) {
    const select = content.querySelector("#linkedSkill");
    if (!select) return;

    document.querySelectorAll("#skill-list strong").forEach(skill => {
        const name = skill.textContent.trim();
        if (!name) return;
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        select.append(option);
    });
}

const modalActionHandlers = Object.freeze({
    addMission: () => window.addMission?.(),
    addSkill: () => window.addSkill?.(),
    updateSkill: () => window.updateSkill?.(),
    updateMission: () => window.updateMission?.(),
    deleteMission: () => window.deleteMission?.(),
    addGoal: () => window.addGoal?.(),
    closeModal: () => closeModal()
});

function initializeModalActions() {
    const content = document.getElementById("modal-content");
    if (!content || content.dataset.actionsBound === "true") return;
    content.dataset.actionsBound = "true";
    content.addEventListener("click", event => {
        const button = event.target.closest("[data-modal-action]");
        if (!button || !content.contains(button)) return;
        const action = modalActionHandlers[button.dataset.modalAction];
        if (typeof action === "function") action();
    });
}

initializeModalActions();

// ---- FIXED: closeModal OUTSIDE openModal ----
function closeModal() {
    document.getElementById("modal").classList.remove("active");

    // 🔥 RESET ALL MODAL INPUTS
    document.querySelectorAll("#modal input, #modal select").forEach(el => {
        el.value = "";
    });
}

// Explicit globals are used by dynamically generated modal controls and legacy inline handlers.
window.openModal = openModal;
window.closeModal = closeModal;



/* Alerts */
/* Alerts */

let alertCallback = null;

function customAlert(msg, callback = null) {

    alertCallback = callback;

    document.getElementById("alertMsg").textContent =
        msg;

    document
        .getElementById("alertModal")
        .classList.add("active");
}


window.reloadAfterAlert = false;

function closeAlert() {

    document
        .getElementById("alertModal")
        .classList.remove("active");

    if (window.reloadAfterAlert) {

        window.reloadAfterAlert = false;

        location.reload();

    }
}

/* Confirm */
let confirmCallback = null;

function customConfirm(msg, callback) {
    confirmCallback = callback;
    document.getElementById("confirmMsg").textContent = msg;
    document.getElementById("confirmModal").classList.add("active");
}

function confirmYes() {
    if (confirmCallback) confirmCallback();
    document.getElementById("confirmModal").classList.remove("active");
}

function confirmNo() {
    document.getElementById("confirmModal").classList.remove("active");
}

export const modals = Object.freeze({
    openModal,
    closeModal,
    customAlert,
    closeAlert,
    customConfirm,
    confirmYes,
    confirmNo
});
