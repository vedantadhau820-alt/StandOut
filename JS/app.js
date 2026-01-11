/* =========================================================
   APP CORE & GLOBAL STATE
========================================================= */

/* ---------- Service Worker ---------- */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then(reg => {
        console.log("✅ Service Worker registered", reg.scope);
      })
      .catch(err => {
        console.error("❌ Service Worker failed", err);
      });
  });
}

/* ---------- Safety: cardCatalog ---------- */
if (!window.cardCatalog) {
  console.error("❌ cardCatalog not loaded");
  window.cardCatalog = [];
}

/* =========================================================
   GLOBAL CONSTANTS
========================================================= */
const DAILY_IMPROVEMENT_LIMIT = 10;
const GRADE_ORDER = ["E", "D", "C", "B", "A", "X", "S", "SS"];

/* =========================================================
   GLOBAL STATE
========================================================= */
let completedMissions =
  parseInt(localStorage.getItem("completedMissions")) || 0;

let dailyImprovementCount =
  parseInt(localStorage.getItem("dailyImprovementCount")) || 0;

let lastImprovementDate =
  localStorage.getItem("lastImprovementDate") || new Date().toDateString();

let ownedCards =
  JSON.parse(localStorage.getItem("ownedCards")) || {};

let countdowns =
  JSON.parse(localStorage.getItem("countdowns")) || [];

let appNotifications =
  JSON.parse(localStorage.getItem("appNotifications")) || [];

let achievementsData =
  JSON.parse(localStorage.getItem("achievements")) || null;

let isMarketplaceOpen = false;

/* =========================================================
   DATE & TIME HELPERS
========================================================= */
function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function isPastDateTime(dateTimeValue) {
  if (!dateTimeValue) return false;
  return new Date(dateTimeValue).getTime() < Date.now();
}

/* =========================================================
   DAILY RESET LOGIC
========================================================= */
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

function resetDailyImprovementIfNeeded() {
  const today = new Date().toDateString();

  if (lastImprovementDate !== today) {
    localStorage.setItem("dailyImprovementCount", "0");
    localStorage.setItem("lastImprovementDate", today);
  }

  dailyImprovementCount =
    parseInt(localStorage.getItem("dailyImprovementCount")) || 0;

  lastImprovementDate =
    localStorage.getItem("lastImprovementDate") || today;
}

/* =========================================================
   GRADE UTIL
========================================================= */
function gradeRank(grade) {
  return GRADE_ORDER.indexOf(grade) + 1;
}

/* =========================================================
   APP SNAPSHOT (BACKUP / RESTORE)
========================================================= */
function getAppSnapshot() {
  return {
    version: "2.1.0",
    exportedAt: new Date().toISOString(),

    completedMissions,
    dailyImprovementCount,
    lastImprovementDate,

    missions: localStorage.getItem("missions") || "",
    skills: localStorage.getItem("skills") || "",
    goals: localStorage.getItem("goals") || "",

    countdowns: JSON.parse(JSON.stringify(countdowns || [])),
    ownedCards: JSON.parse(JSON.stringify(ownedCards || {})),

    achievements: JSON.parse(JSON.stringify(achievementsData || [])),
    notifications: JSON.parse(JSON.stringify(appNotifications || [])),
    lastNotifCount: Number(localStorage.getItem("lastNotifCount")) || 0
  };
}

function restoreAppSnapshot(data) {
  resetData(true);

  completedMissions = Number(data.completedMissions) || 0;
  dailyImprovementCount = Number(data.dailyImprovementCount) || 0;
  lastImprovementDate = data.lastImprovementDate || new Date().toDateString();

  localStorage.setItem("missions", data.missions || "");
  localStorage.setItem("skills", data.skills || "");
  localStorage.setItem("goals", data.goals || "");

  countdowns = Array.isArray(data.countdowns) ? data.countdowns : [];
  localStorage.setItem("countdowns", JSON.stringify(countdowns));

  ownedCards = typeof data.ownedCards === "object" ? data.ownedCards : {};
  localStorage.setItem("ownedCards", JSON.stringify(ownedCards));

  achievementsData = Array.isArray(data.achievements)
    ? data.achievements
    : achievements.map(a => ({ ...a, unlocked: false }));

  localStorage.setItem("achievements", JSON.stringify(achievementsData));

  appNotifications = Array.isArray(data.notifications)
    ? data.notifications
    : [];

  localStorage.setItem(
    "appNotifications",
    JSON.stringify(appNotifications)
  );
  localStorage.setItem("lastNotifCount", data.lastNotifCount || 0);

  localStorage.setItem("completedMissions", completedMissions);
  localStorage.setItem("dailyImprovementCount", dailyImprovementCount);
  localStorage.setItem("lastImprovementDate", lastImprovementDate);

  loadData();
  renderAchievements();
  renderCountdowns();
  renderMarketplace();
  renderMyCards();
  updateNotificationBadge();

  document.getElementById("missionCounter").textContent =
    completedMissions;
}

/* =========================================================
   BACKUP / RESTORE UI
========================================================= */
function saveProgressToFile() {
  const snapshot = getAppSnapshot();

  const blob = new Blob(
    [JSON.stringify(snapshot, null, 2)],
    { type: "application/json" }
  );

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `standout-backup-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

function loadProgressFromFile() {
  customConfirm(
    "Restoring will overwrite your current progress. Continue?",
    () => document.getElementById("importProgressFile").click()
  );
}

document
  .getElementById("importProgressFile")
  ?.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result.replace(/^\uFEFF/, "").trim();
        const data = JSON.parse(text);
        restoreAppSnapshot(data);
        customAlert("Progress restored successfully!");
      } catch {
        customAlert("Invalid or corrupted backup file.");
      }
    };

    reader.readAsText(file);
    e.target.value = "";
  });

/* =========================================================
   INITIALIZATION
========================================================= */
window.addEventListener("load", () => {
  enforceDailyReset();
  resetDailyImprovementIfNeeded();

  document.getElementById("missionCounter").textContent =
    completedMissions;
});
