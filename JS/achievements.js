/* =========================================================
   ACHIEVEMENTS MODULE
========================================================= */

/* -------------------------
   ACHIEVEMENT DEFINITIONS
------------------------- */
const achievements = [
  { id: "mission1", title: "First Step", desc: "Complete your very first mission", unlocked: false },
  { id: "mission5", title: "On a Roll", desc: "Complete 5 missions", unlocked: false },
  { id: "mission10", title: "Mission Master", desc: "Complete 10 missions", unlocked: false },
  { id: "mission15", title: "Halfway Hero", desc: "Complete 15 missions", unlocked: false },
  { id: "mission20", title: "Goal Getter", desc: "Complete 20 missions", unlocked: false },
  { id: "mission25", title: "Silver Streak", desc: "Complete 25 missions", unlocked: false },
  { id: "mission30", title: "Mission Maestro", desc: "Complete 30 missions", unlocked: false },
  { id: "mission35", title: "Trailblazer", desc: "Complete 35 missions", unlocked: false },
  { id: "mission40", title: "Achievement Hunter", desc: "Complete 40 missions", unlocked: false },
  { id: "mission45", title: "Mission Veteran", desc: "Complete 45 missions", unlocked: false },
  { id: "mission50", title: "Legendary Milestone", desc: "Complete 50 missions", unlocked: false }
];

/* -------------------------
   LOAD / INIT STATE
------------------------- */
window.achievementsData =
  JSON.parse(localStorage.getItem("achievements")) ||
  achievements.map(a => ({ ...a }));

localStorage.setItem(
  "achievements",
  JSON.stringify(window.achievementsData)
);

/* -------------------------
   RENDER ACHIEVEMENTS
------------------------- */
window.renderAchievements = function () {
  const container = document.getElementById("achievementsViewer");
  if (!container) return;

  container.innerHTML = "";

  const unlocked = achievementsData.filter(a => a.unlocked);
  const locked = achievementsData.filter(a => !a.unlocked).slice(0, 5);

  [...unlocked, ...locked].forEach(ach => {
    const div = document.createElement("div");
    div.className = "achievement-tile" + (ach.unlocked ? "" : " locked");

    div.innerHTML = `
      <div class="achievement-icon">
        <i class="fas ${ach.unlocked ? "fa-trophy" : "fa-lock"}"></i>
      </div>
      <div class="achievement-title">${ach.title}</div>
      <div class="achievement-desc">${ach.desc}</div>
      ${
        ach.unlocked && ach.unlockedAt
          ? `<div class="achievement-date">
              Achieved on: ${ach.unlockedAt}
            </div>`
          : ""
      }
    `;

    container.appendChild(div);
  });
};

/* -------------------------
   UNLOCK ACHIEVEMENT
------------------------- */
window.unlockAchievement = function (id) {
  const ach = achievementsData.find(a => a.id === id);
  if (!ach || ach.unlocked) return;

  ach.unlocked = true;
  ach.unlockedAt = new Date().toDateString();

  localStorage.setItem(
    "achievements",
    JSON.stringify(achievementsData)
  );

  pushNotification(
    "🏆 New Achievement",
    `You unlocked: "${ach.title}"`
  );

  showAchievementPopup(ach.title, ach.desc);
  renderAchievements();
};

/* -------------------------
   ACHIEVEMENT POPUP
------------------------- */
window.showAchievementPopup = function (title, desc) {
  window.isAchievementPlaying = true;

  const popup = document.createElement("div");
  popup.className = "achievement-popup";
  popup.innerHTML = `<h3>${title}</h3><p>${desc}</p>`;
  document.body.appendChild(popup);

  const audio = new Audio("Achievements.mp3");
  audio.volume = 0.5;
  audio.play().catch(() => {});

  audio.onended = () => {
    window.isAchievementPlaying = false;
  };

  popup.style.opacity = 0;
  popup.style.transform = "translateY(-50px)";

  setTimeout(() => {
    popup.style.transition = "all 0.4s ease";
    popup.style.opacity = 1;
    popup.style.transform = "translateY(0)";
  }, 10);

  setTimeout(() => {
    popup.style.opacity = 0;
    popup.style.transform = "translateY(-50px)";
    setTimeout(() => popup.remove(), 400);
  }, 3000);
};

/* -------------------------
   MISSION → ACHIEVEMENT CHECK
------------------------- */
const missionMilestones = [
  1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50
];

window.checkMissionAchievements = function () {
  missionMilestones.forEach(m => {
    if (completedMissions === m) {
      unlockAchievement("mission" + m);
    }
  });
};
