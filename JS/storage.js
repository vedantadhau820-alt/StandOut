/* =========================================================
   STORAGE & PERSISTENCE MODULE
========================================================= */

/* -------------------------
   DAILY RESET
------------------------- */
function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function enforceDailyReset() {
  const today = getTodayKey();

  if (lastImprovementDate !== today) {
    dailyImprovementCount = 0;
    lastImprovementDate = today;

    localStorage.setItem("dailyImprovementCount", "0");
    localStorage.setItem("lastImprovementDate", today);

    console.log("✅ Daily reset enforced:", today);
  }
}

window.addEventListener("load", enforceDailyReset);
setInterval(enforceDailyReset, 60 * 1000);


/* -------------------------
   SAVE / LOAD CORE DATA
------------------------- */
function saveData() {
  localStorage.setItem("completedMissions", completedMissions);
  localStorage.setItem("missionHistory", JSON.stringify(missionHistory));

  // Save missions / skills / goals HTML
  localStorage.setItem(
    "missions",
    document.getElementById("mission-list").innerHTML
  );
  localStorage.setItem(
    "skills",
    document.getElementById("skill-list").innerHTML
  );
  localStorage.setItem(
    "goals",
    document.getElementById("goal-list").innerHTML
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


function loadData() {
  document.getElementById("mission-list").innerHTML =
    localStorage.getItem("missions") || "";
  document.getElementById("skill-list").innerHTML =
    localStorage.getItem("skills") || "";
  document.getElementById("goal-list").innerHTML =
    localStorage.getItem("goals") || "";

  /* ---------- RESTORE MISSIONS ---------- */
  document.querySelectorAll("#mission-list li").forEach(li => {
    // Restore deadline
    const savedDeadline = li.getAttribute("data-deadline");
    if (savedDeadline) li.dataset.deadline = savedDeadline;

    // Restore flags
    if (li.getAttribute("data-deducted") === "true")
      li.dataset.deducted = "true";

    if (li.getAttribute("data-overdue-notified") === "true")
      li.dataset.overdueNotified = "true";

    if (li.getAttribute("data-hardcore") === "true")
      li.dataset.hardcore = "true";

    if (li.getAttribute("data-hardcore-punished") === "true")
      li.dataset.hardcorePunished = "true";

    // Ensure UI spans exist
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

    // Reattach edit handler
    li.addEventListener("click", e => {
      if (e.target.classList.contains("complete-btn")) return;
      openModal("edit-mission", li);
    });
  });

  /* ---------- RESTORE SKILLS ---------- */
  document.querySelectorAll("#skill-list .skill").forEach(skill => {
    const xp = parseInt(skill.getAttribute("data-xp") || "0");
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
   FULL RESET (MASTER RESET)
------------------------- */
function resetData(silent = false) {
  completedMissions = 0;
  dailyImprovementCount = 0;
  lastImprovementDate = new Date().toDateString();
  appNotifications = [];
  countdowns = [];
  ownedCards = {};

  // Clear timers
  if (window.timerInterval) {
    clearInterval(window.timerInterval);
    window.timerInterval = null;
  }

  // Clear localStorage
  [
    "missions",
    "skills",
    "goals",
    "countdowns",
    "completedMissions",
    "missionHistory",
    "dailyImprovementCount",
    "lastImprovementDate",
    "ownedCards",
    "achievements",
    "appNotifications",
    "lastNotifCount"
  ].forEach(k => localStorage.removeItem(k));

  // Clear UI
  document.getElementById("mission-list").innerHTML = "";
  document.getElementById("skill-list").innerHTML = "";
  document.getElementById("goal-list").innerHTML = "";
  document.getElementById("countdown-list").innerHTML = "";

  document.getElementById("missionCounter").textContent = "0";
  document.getElementById("countdownCounter").textContent = "0";

  const notifList = document.getElementById("notificationList");
  if (notifList) {
    notifList.innerHTML =
      `<p style="opacity:.6;">No notifications</p>`;
  }

  const badge = document.getElementById("notifyBadge");
  if (badge) {
    badge.style.display = "none";
    badge.textContent = "";
  }

  // Reset achievements
  achievementsData = achievements.map(a => ({
    ...a,
    unlocked: false
  }));
  localStorage.setItem(
    "achievements",
    JSON.stringify(achievementsData)
  );

  renderAchievements();
  renderMarketplace();
  renderMyCards();

  if (!silent) {
    customAlert("All data has been reset successfully!");
  }
}


/* -------------------------
   DATE UTILITY
------------------------- */
function isPastDateTime(dateTimeValue) {
  if (!dateTimeValue) return false;
  return new Date(dateTimeValue).getTime() < Date.now();
    }
