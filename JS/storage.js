/* =========================================================
   STORAGE & PERSISTENCE MODULE
========================================================= */

/* -------------------------
   SAVE CORE DATA
------------------------- */
function saveData() {
  localStorage.setItem(
    "completedMissions",
    completedMissions
  );

  localStorage.setItem(
    "dailyImprovementCount",
    dailyImprovementCount
  );

  localStorage.setItem(
    "lastImprovementDate",
    lastImprovementDate
  );

  // Save HTML snapshots
  localStorage.setItem(
    "missions",
    document.getElementById("mission-list")?.innerHTML || ""
  );

  localStorage.setItem(
    "skills",
    document.getElementById("skill-list")?.innerHTML || ""
  );

  localStorage.setItem(
    "goals",
    document.getElementById("goal-list")?.innerHTML || ""
  );

  // Persist mission flags
  document.querySelectorAll("#mission-list li").forEach(li => {
    if (li.dataset.deducted) {
      li.setAttribute("data-deducted", "true");
    }
    if (li.dataset.overdueNotified) {
      li.setAttribute("data-overdue-notified", "true");
    }
    if (li.dataset.hardcore) {
      li.setAttribute("data-hardcore", "true");
    }
    if (li.dataset.hardcorePunished) {
      li.setAttribute("data-hardcore-punished", "true");
    }
  });

  // Persist skill XP
  document.querySelectorAll("#skill-list .skill").forEach(skill => {
    skill.setAttribute("data-xp", skill.dataset.xp || "0");
  });
}

/* -------------------------
   LOAD CORE DATA
------------------------- */
function loadData() {
  const missionList = document.getElementById("mission-list");
  const skillList = document.getElementById("skill-list");
  const goalList = document.getElementById("goal-list");

  if (missionList) {
    missionList.innerHTML =
      localStorage.getItem("missions") || "";
  }

  if (skillList) {
    skillList.innerHTML =
      localStorage.getItem("skills") || "";
  }

  if (goalList) {
    goalList.innerHTML =
      localStorage.getItem("goals") || "";
  }

  /* ---------- RESTORE MISSIONS ---------- */
  document.querySelectorAll("#mission-list li").forEach(li => {
    if (li.getAttribute("data-deducted") === "true") {
      li.dataset.deducted = "true";
    }

    if (li.getAttribute("data-overdue-notified") === "true") {
      li.dataset.overdueNotified = "true";
    }

    if (li.getAttribute("data-hardcore") === "true") {
      li.dataset.hardcore = "true";
    }

    if (li.getAttribute("data-hardcore-punished") === "true") {
      li.dataset.hardcorePunished = "true";
    }

    if (!li.querySelector(".overdueMark")) {
      const span = document.createElement("span");
      span.className = "overdueMark";
      li.appendChild(span);
    }

    if (!li.querySelector(".deadlineDisplay")) {
      const span = document.createElement("span");
      span.className = "deadlineDisplay";
      li.appendChild(span);
    }

    li.addEventListener("click", e => {
      if (e.target.classList.contains("complete-btn")) return;
      openModal("edit-mission", li);
    });
  });

  /* ---------- RESTORE SKILLS ---------- */
  document.querySelectorAll("#skill-list .skill").forEach(skill => {
    const xp =
      parseInt(skill.getAttribute("data-xp") || "0");

    skill.dataset.xp = xp;
    skill.querySelector(".xp-count").textContent = xp;
    skill.querySelector(".progress-bar").style.width = xp + "%";
    skill.classList.add("show");

    skill.addEventListener("click", () =>
      openModal("edit-skill", skill)
    );
  });

  /* ---------- RESTORE GOALS ---------- */
  document.querySelectorAll("#goal-list .goal").forEach(goal => {
    goal.classList.add("show");

    const removeBtn = goal.querySelector(".remove-btn");
    if (removeBtn) {
      removeBtn.onclick = () => removeGoal(removeBtn);
    }
  });
}

/* -------------------------
   FULL RESET
------------------------- */
function resetData(silent = false) {
  completedMissions = 0;
  dailyImprovementCount = 0;
  lastImprovementDate = new Date().toDateString();

  appNotifications = [];
  countdowns = [];
  ownedCards = {};

  [
    "missions",
    "skills",
    "goals",
    "countdowns",
    "completedMissions",
    "dailyImprovementCount",
    "lastImprovementDate",
    "ownedCards",
    "achievements",
    "appNotifications",
    "lastNotifCount"
  ].forEach(k => localStorage.removeItem(k));

  document.getElementById("mission-list").innerHTML = "";
  document.getElementById("skill-list").innerHTML = "";
  document.getElementById("goal-list").innerHTML = "";
  document.getElementById("countdown-list").innerHTML = "";

  document.getElementById("missionCounter").textContent = "0";
  document.getElementById("countdownCounter").textContent = "0";

  achievementsData = achievements.map(a => ({
    ...a,
    unlocked: false
  }));

  localStorage.setItem(
    "achievements",
    JSON.stringify(achievementsData)
  );

  window.renderAchievements && renderAchievements();
  window.renderMarketplace && renderMarketplace();
  window.renderMyCards && renderMyCards();

  if (!silent) {
    customAlert("All data has been reset successfully!");
  }
}
