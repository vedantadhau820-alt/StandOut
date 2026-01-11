/* =========================================================
   MISSIONS MODULE
========================================================= */

/* -------------------------
   CONSTANTS
------------------------- */
const DAILY_IMPROVEMENT_LIMIT = 10;
const missionMilestones = [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];


/* -------------------------
   STATE
------------------------- */
let completedMissions =
  parseInt(localStorage.getItem("completedMissions")) || 0;

let dailyImprovementCount =
  parseInt(localStorage.getItem("dailyImprovementCount")) || 0;

let lastImprovementDate =
  localStorage.getItem("lastImprovementDate") ||
  new Date().toDateString();


document.getElementById("missionCounter").textContent = completedMissions;


/* -------------------------
   DAILY RESET
------------------------- */
function resetDailyImprovementIfNeeded() {
  const today = new Date().toDateString();

  if (lastImprovementDate !== today) {
    dailyImprovementCount = 0;
    lastImprovementDate = today;

    localStorage.setItem("dailyImprovementCount", "0");
    localStorage.setItem("lastImprovementDate", today);
  }

  dailyImprovementCount =
    parseInt(localStorage.getItem("dailyImprovementCount")) || 0;
}


/* -------------------------
   ADD MISSION
------------------------- */
function addMission() {
  const text =
    document.getElementById("missionInput").value.trim();

  const deadline =
    document.getElementById("missionDeadline").value;

  const linkedSkill =
    document.getElementById("linkedSkill").value;

  const isHardcore =
    document.getElementById("hardcoreToggle").checked;

  if (!text) {
    closeModal();
    return;
  }

  if (isHardcore && !deadline) {
    customAlert("🔥 Hardcore missions require a deadline.");
    return;
  }

  if (deadline && isPastDateTime(deadline)) {
    customAlert("Deadline cannot be in the past.");
    return;
  }

  const li = document.createElement("li");

  li.dataset.deadline = deadline || "";
  li.dataset.skill = linkedSkill || "";
  li.dataset.completed = "false";
  li.dataset.hardcore = isHardcore ? "true" : "false";

  let deadlineText = "";
  if (deadline) {
    const d = new Date(deadline);
    deadlineText =
      `${d.toLocaleDateString([], { day: "numeric", month: "short" })}, ` +
      `${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }

  li.innerHTML = `
    <span class="mission-text">
      ${text} ${isHardcore ? "🔥" : ""}
    </span>

    <div class="deadline-row">
      <span class="deadlineDisplay">${deadlineText}</span>
      <span class="overdueMark"></span>
      <button class="complete-btn" onclick="completeMission(this)">✔</button>
    </div>
  `;

  li.addEventListener("click", e => {
    if (e.target.classList.contains("complete-btn")) return;
    openModal("edit-mission", li);
  });

  document.getElementById("mission-list").appendChild(li);
  saveData();
  closeModal();
}


/* -------------------------
   UPDATE MISSION
------------------------- */
function updateMission() {
  const li = window.missionBeingEdited;
  if (!li) return;

  const newText =
    document.getElementById("editMissionInput").value.trim();

  const newDeadline =
    document.getElementById("editMissionDeadline").value;

  const isHardcore = li.dataset.hardcore === "true";

  if (!newText) {
    closeModal();
    return;
  }

  if (!isHardcore && newDeadline && isPastDateTime(newDeadline)) {
    customAlert("Deadline cannot be in the past.");
    return;
  }

  li.querySelector(".mission-text").innerHTML =
    newText + (isHardcore ? " 🔥" : "");

  if (!isHardcore) {
    if (newDeadline) {
      const d = new Date(newDeadline);
      li.querySelector(".deadlineDisplay").textContent =
        `${d.toLocaleDateString([], { day: "numeric", month: "short" })}, ` +
        `${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
      li.dataset.deadline = newDeadline;
    } else {
      li.querySelector(".deadlineDisplay").textContent = "";
      li.dataset.deadline = "";
    }

    li.querySelector(".overdueMark").innerHTML = "";
    delete li.dataset.deducted;
  }

  saveData();
  closeModal();
}


/* -------------------------
   DELETE MISSION
------------------------- */
function deleteMission() {
  const li = window.missionBeingEdited;
  if (!li) return;

  if (li.dataset.hardcore === "true") {
    const deadline = li.dataset.deadline;
    const now = Date.now();

    if (deadline && new Date(deadline).getTime() <= now) {
      customAlert("🔥 Hardcore missions cannot be deleted after deadline.");
      return;
    }

    customConfirm(
      "🔥 This is a Hardcore mission.\nDelete only if created by mistake?",
      () => {
        li.remove();
        saveData();
        closeModal();
      }
    );
    return;
  }

  li.remove();
  saveData();
  closeModal();
}


/* -------------------------
   COMPLETE MISSION
------------------------- */
function completeMission(btn) {
  resetDailyImprovementIfNeeded();

  const li = btn.closest("li");
  const linkedSkill = li.dataset.skill;
  const deadline = li.dataset.deadline;

  li.classList.add("remove");
  li.dataset.completed = "true";
  setTimeout(() => li.remove(), 400);

  if (deadline && new Date(deadline).getTime() < Date.now()) {
    showPopup("Mission was overdue. No improvement points gained.");
    saveData();
    return;
  }

  if (dailyImprovementCount >= DAILY_IMPROVEMENT_LIMIT) {
    showPopup("You're too tired today. No improvement points gained.");
    saveData();
    return;
  }

  dailyImprovementCount++;
  completedMissions++;

  localStorage.setItem("dailyImprovementCount", dailyImprovementCount);
  localStorage.setItem("completedMissions", completedMissions);

  document.getElementById("missionCounter").textContent = completedMissions;

  if (linkedSkill) increaseSkillXP(linkedSkill, 1);

  checkMissionAchievements();
  showPopup("Mission completed! Improvement point gained.");
  saveData();
}


/* -------------------------
   DEADLINE CHECKER
------------------------- */
function checkMissedDeadlines() {
  const missions = document.querySelectorAll("#mission-list li");
  const now = Date.now();

  missions.forEach(li => {
    const deadline = li.dataset.deadline;
    if (!deadline || li.dataset.completed === "true") return;

    const deadlineTime = new Date(deadline).getTime();
    const timeLeft = deadlineTime - now;
    const overdueSpan = li.querySelector(".overdueMark");

    if (
      timeLeft > 0 &&
      timeLeft <= 2 * 60 * 60 * 1000 &&
      !li.dataset.warned
    ) {
      li.dataset.warned = "true";
      pushNotification(
        "Mission Deadline",
        `"${li.querySelector('.mission-text').textContent}" is due soon (within 2 hours!)`
      );
    }

    if (timeLeft <= 0) {
      overdueSpan.innerHTML = `<span class="overdue-badge">Overdue</span>`;

      if (!li.dataset.overdueNotified) {
        li.dataset.overdueNotified = "true";
        pushNotification(
          "⚠ Mission Overdue",
          `"${li.querySelector('.mission-text').textContent}" is overdue!`
        );
      }

      if (
        li.dataset.hardcore === "true" &&
        !li.dataset.hardcorePunished
      ) {
        li.dataset.hardcorePunished = "true";
        completedMissions = 0;

        localStorage.setItem("completedMissions", 0);
        document.getElementById("missionCounter").textContent = "0";

        renderMarketplace();
        renderMyCards();

        showSmartNotification(
          "🔥 Hardcore Failed",
          "Improvement Points reset to ZERO."
        );

        saveData();
        return;
      }

      if (!li.dataset.deducted) {
        completedMissions = Math.max(0, completedMissions - 1);
        li.dataset.deducted = "true";

        localStorage.setItem("completedMissions", completedMissions);
        document.getElementById("missionCounter").textContent = completedMissions;
        saveData();
      }
    }
  });
}

setInterval(checkMissedDeadlines, 60000);


/* -------------------------
   ACHIEVEMENTS
------------------------- */
function checkMissionAchievements() {
  missionMilestones.forEach(m => {
    if (completedMissions === m) {
      unlockAchievement("mission" + m);
    }
  });
  }
