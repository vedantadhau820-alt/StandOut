/* =========================================================
   APP CORE & GLOBAL STATE (SINGLE SOURCE OF TRUTH)
========================================================= */

/* ---------- Service Worker ---------- */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then(reg => console.log("✅ Service Worker registered", reg.scope))
      .catch(err => console.error("❌ Service Worker failed", err));
  });
}

/* ---------- Safety ---------- */
if (!window.cardCatalog) {
  console.warn("⚠ cardCatalog not loaded yet");
  window.cardCatalog = [];
}

/* =========================================================
   GLOBAL CONSTANTS (DECLARE ONCE)
========================================================= */
window.DAILY_IMPROVEMENT_LIMIT = 10;
window.GRADE_ORDER = ["E", "D", "C", "B", "A", "X", "S", "SS"];

/* =========================================================
   GLOBAL STATE (SHARED ACROSS MODULES)
========================================================= */
window.completedMissions =
  parseInt(localStorage.getItem("completedMissions")) || 0;

window.dailyImprovementCount =
  parseInt(localStorage.getItem("dailyImprovementCount")) || 0;

window.lastImprovementDate =
  localStorage.getItem("lastImprovementDate") || new Date().toDateString();

window.ownedCards =
  JSON.parse(localStorage.getItem("ownedCards")) || {};

window.countdowns =
  JSON.parse(localStorage.getItem("countdowns")) || [];

window.appNotifications =
  JSON.parse(localStorage.getItem("appNotifications")) || [];

window.achievementsData =
  JSON.parse(localStorage.getItem("achievements")) || null;

window.isMarketplaceOpen = false;

/* =========================================================
   GLOBAL UTILITIES (USED BY MANY FILES)
========================================================= */
window.gradeRank = function (grade) {
  return GRADE_ORDER.indexOf(grade) + 1;
};

window.getTodayKey = function () {
  return new Date().toISOString().slice(0, 10);
};

window.isPastDateTime = function (val) {
  if (!val) return false;
  return new Date(val).getTime() < Date.now();
};

/* =========================================================
   DAILY RESET LOGIC
========================================================= */
window.enforceDailyReset = function () {
  const today = getTodayKey();

  if (lastImprovementDate !== today) {
    dailyImprovementCount = 0;
    lastImprovementDate = today;

    localStorage.setItem("dailyImprovementCount", "0");
    localStorage.setItem("lastImprovementDate", today);

    console.log("✅ Daily reset enforced:", today);
  }
};

window.resetDailyImprovementIfNeeded = function () {
  const today = new Date().toDateString();

  if (lastImprovementDate !== today) {
    localStorage.setItem("dailyImprovementCount", "0");
    localStorage.setItem("lastImprovementDate", today);
  }

  dailyImprovementCount =
    parseInt(localStorage.getItem("dailyImprovementCount")) || 0;

  lastImprovementDate =
    localStorage.getItem("lastImprovementDate") || today;
};

/* =========================================================
   BACKUP / RESTORE (GLOBAL API)
========================================================= */
window.getAppSnapshot = function () {
  return {
    version: "2.1.0",
    exportedAt: new Date().toISOString(),

    completedMissions,
    dailyImprovementCount,
    lastImprovementDate,

    missions: localStorage.getItem("missions") || "",
    skills: localStorage.getItem("skills") || "",
    goals: localStorage.getItem("goals") || "",

    countdowns: JSON.parse(JSON.stringify(countdowns)),
    ownedCards: JSON.parse(JSON.stringify(ownedCards)),

    achievements: JSON.parse(JSON.stringify(achievementsData || [])),
    notifications: JSON.parse(JSON.stringify(appNotifications || [])),
    lastNotifCount: Number(localStorage.getItem("lastNotifCount")) || 0
  };
};

window.restoreAppSnapshot = function (data) {
  resetData(true);

  completedMissions = Number(data.completedMissions) || 0;
  dailyImprovementCount = Number(data.dailyImprovementCount) || 0;
  lastImprovementDate = data.lastImprovementDate || new Date().toDateString();

  localStorage.setItem("missions", data.missions || "");
  localStorage.setItem("skills", data.skills || "");
  localStorage.setItem("goals", data.goals || "");

  countdowns = Array.isArray(data.countdowns) ? data.countdowns : [];
  ownedCards = typeof data.ownedCards === "object" ? data.ownedCards : {};

  achievementsData = Array.isArray(data.achievements)
    ? data.achievements
    : [];

  appNotifications = Array.isArray(data.notifications)
    ? data.notifications
    : [];

  localStorage.setItem("countdowns", JSON.stringify(countdowns));
  localStorage.setItem("ownedCards", JSON.stringify(ownedCards));
  localStorage.setItem("achievements", JSON.stringify(achievementsData));
  localStorage.setItem("appNotifications", JSON.stringify(appNotifications));
  localStorage.setItem("completedMissions", completedMissions);
  localStorage.setItem("dailyImprovementCount", dailyImprovementCount);
  localStorage.setItem("lastImprovementDate", lastImprovementDate);
  localStorage.setItem("lastNotifCount", data.lastNotifCount || 0);

  loadData();
  renderAchievements();
  renderCountdowns();
  renderMarketplace();
  renderMyCards();
  updateNotificationBadge();

  document.getElementById("missionCounter").textContent =
    completedMissions;
};

window.saveProgressToFile = function () {
  const blob = new Blob(
    [JSON.stringify(getAppSnapshot(), null, 2)],
    { type: "application/json" }
  );

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `standout-backup-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
};

window.loadProgressFromFile = function () {
  customConfirm(
    "Restoring will overwrite your current progress. Continue?",
    () => document.getElementById("importProgressFile")?.click()
  );
};

/* =========================================================
   INIT
========================================================= */
window.addEventListener("load", () => {
  enforceDailyReset();
  resetDailyImprovementIfNeeded();

  const counter = document.getElementById("missionCounter");
  if (counter) counter.textContent = completedMissions;
});
