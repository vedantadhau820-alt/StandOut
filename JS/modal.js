// ===============================
// MODAL SYSTEM (GLOBAL)
// ===============================

let confirmCallback = null;

// ===============================
// OPEN MODAL
// ===============================
window.openModal = function (type, skillDiv = null) {
  const modal = document.getElementById("modal");
  const content = document.getElementById("modal-content");

  if (!modal || !content) {
    console.error("❌ Modal elements not found");
    return;
  }

  modal.classList.add("active");

  // ---- ADD MISSION ----
  if (type === "mission") {
    const skills = [...document.querySelectorAll("#skill-list strong")]
      .map(s => `<option value="${s.textContent}">${s.textContent}</option>`)
      .join("");

    content.innerHTML = `
      <h3>Add Mission</h3>
      <input id="missionInput" placeholder="Enter mission">

      <label>Link Skill</label>
      <select id="linkedSkill">
        <option value="">None</option>
        ${skills}
      </select>

      <label>Deadline</label>
      <input id="missionDeadline" type="datetime-local">

      <div class="toggle-row">
        <label class="toggle">
          <input type="checkbox" id="hardcoreToggle">
          <span class="slider"></span>
        </label>
        <span class="toggle-label">Hardcore Mode</span>
      </div>

      <button onclick="addMission()">Add</button>
      <button onclick="closeModal()">Cancel</button>
    `;
  }

  // ---- EDIT MISSION ----
  if (type === "edit-mission" && skillDiv) {
    const oldText = skillDiv.querySelector(".mission-text")
      .textContent.replace("🔥", "").trim();
    const oldDeadline = skillDiv.dataset.deadline || "";
    const isHardcore = skillDiv.dataset.hardcore === "true";

    content.innerHTML = `
      <h3>Edit Mission</h3>

      <input id="editMissionInput" value="${oldText}">

      <label>Deadline</label>
      <input
        id="editMissionDeadline"
        type="datetime-local"
        value="${oldDeadline}"
        ${isHardcore ? "disabled" : ""}
      >

      ${
        isHardcore
          ? `<p style="color:#ef4444;font-size:12px;margin-top:6px;">
              🔥 Hardcore mission — deadline cannot be changed
            </p>`
          : ""
      }

      <button onclick="updateMission()">Update</button>
      ${
        isHardcore
          ? `<button disabled style="opacity:.5;cursor:not-allowed;">🔒 Delete</button>`
          : `<button onclick="deleteMission()">Delete</button>`
      }
      <button onclick="closeModal()">Cancel</button>
    `;

    window.missionBeingEdited = skillDiv;
  }

  // ---- ADD SKILL ----
  if (type === "skill") {
    content.innerHTML = `
      <h3>Add Skill</h3>
      <input id="skillInput" placeholder="Skill name">
      <button onclick="addSkill()">Add</button>
      <button onclick="closeModal()">Cancel</button>
    `;
  }

  // ---- ADD GOAL ----
  if (type === "goal") {
    content.innerHTML = `
      <h3>Add Goal</h3>
      <input id="goalInput" placeholder="Goal">

      <label>Priority</label>
      <select id="priorityInput">
        <option>High</option>
        <option>Medium</option>
        <option>Low</option>
      </select>

      <label>Deadline</label>
      <input id="goalDeadline" type="datetime-local">

      <button onclick="addGoal()">Add</button>
      <button onclick="closeModal()">Cancel</button>
    `;
  }

  // ---- ADD COUNTDOWN ----
  if (type === "multi-time") {
    content.innerHTML = `
      <h3>Add Countdown</h3>
      <input id="countdownTitle" placeholder="Title">
      <input id="countdownDateTime" type="datetime-local">

      <button onclick="addCountdown()">Add</button>
      <button onclick="closeModal()">Cancel</button>
    `;

    const now = new Date().toISOString().slice(0, 16);
    document.getElementById("countdownDateTime").min = now;
  }
};

// ===============================
// CLOSE MODAL
// ===============================
window.closeModal = function () {
  const modal = document.getElementById("modal");
  if (!modal) return;

  modal.classList.remove("active");

  document
    .querySelectorAll("#modal input, #modal select")
    .forEach(el => (el.value = ""));
};

// ===============================
// ALERT
// ===============================
window.customAlert = function (msg) {
  document.getElementById("alertMsg").textContent = msg;
  document.getElementById("alertModal").classList.add("active");
};

window.closeAlert = function () {
  document.getElementById("alertModal").classList.remove("active");
};

// ===============================
// CONFIRM
// ===============================
window.customConfirm = function (msg, callback) {
  confirmCallback = callback;
  document.getElementById("confirmMsg").textContent = msg;
  document.getElementById("confirmModal").classList.add("active");
};

window.confirmYes = function () {
  if (confirmCallback) confirmCallback();
  document.getElementById("confirmModal").classList.remove("active");
};

window.confirmNo = function () {
  document.getElementById("confirmModal").classList.remove("active");
};

// ===============================
// CHEAT MODAL
// ===============================
window.confirmCheat = function () {
  const code = document.getElementById("cheatInput").value.trim();

  if (code !== "Thala") {
    customAlert("Invalid cheat code.");
    return;
  }

  completedMissions = 9999;
  dailyImprovementCount = 0;

  localStorage.setItem("completedMissions", completedMissions);
  document.getElementById("missionCounter").textContent = completedMissions;

  closeCheatModal();

  showSmartNotification(
    "Cheat Activated",
    "9999 Improvement Points granted."
  );
};

window.closeCheatModal = function () {
  document.getElementById("cheatModal")?.classList.remove("active");
};
