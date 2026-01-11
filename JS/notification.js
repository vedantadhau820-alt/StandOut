/* =========================================================
   NOTIFICATIONS MODULE
========================================================= */

/* -------------------------
   STATE
------------------------- */
let appNotifications =
  JSON.parse(localStorage.getItem("appNotifications")) || [];


/* -------------------------
   STORAGE
------------------------- */
function saveNotifications() {
  localStorage.setItem("appNotifications", JSON.stringify(appNotifications));
}


/* -------------------------
   PUSH NOTIFICATION
------------------------- */
function pushNotification(title, msg) {
  appNotifications.unshift({
    title,
    msg,
    time: new Date().toLocaleString()
  });

  updateNotificationBadge();
  saveNotifications();
}


/* -------------------------
   BADGE COUNT
------------------------- */
function updateNotificationBadge() {
  const badge = document.getElementById("notifyBadge");
  if (!badge) return;

  const lastCount =
    parseInt(localStorage.getItem("lastNotifCount")) || 0;

  const unread = appNotifications.length - lastCount;

  if (unread <= 0) {
    badge.style.display = "none";
    badge.textContent = "";
  } else {
    badge.style.display = "inline-block";
    badge.textContent = unread;
  }
}


/* -------------------------
   CLEAR ALL
------------------------- */
function clearAllNotifications() {
  appNotifications = [];

  localStorage.removeItem("appNotifications");
  localStorage.removeItem("lastNotifCount");

  const list = document.getElementById("notificationList");
  if (list) {
    list.innerHTML = `<p style="opacity:0.6;">No notifications</p>`;
  }

  const badge = document.getElementById("notifyBadge");
  if (badge) {
    badge.style.display = "none";
    badge.textContent = "";
  }

  console.log("All notifications cleared.");
}


/* -------------------------
   RENDER DRAWER
------------------------- */
function renderNotifications() {
  const container = document.getElementById("notificationList");
  if (!container) return;

  container.innerHTML = "";

  if (appNotifications.length === 0) {
    container.innerHTML =
      `<p style="opacity:0.7; text-align:center;">No notifications</p>`;
    return;
  }

  appNotifications.forEach(n => {
    const div = document.createElement("div");
    div.className = "notification-card";

    div.innerHTML = `
      <strong>${n.title}</strong><br>
      <span>${n.msg}</span>
      <span class="notification-time">${n.time}</span>
    `;

    container.appendChild(div);
  });
}


/* -------------------------
   DRAWER TOGGLE
------------------------- */
document.getElementById("notifyBell")?.addEventListener("click", e => {
  e.stopPropagation();

  const drawer = document.getElementById("notificationDrawer");
  if (!drawer) return;

  if (drawer.style.display === "none" || drawer.style.display === "") {
    renderNotifications();
    drawer.style.display = "block";

    // Mark all as read
    localStorage.setItem(
      "lastNotifCount",
      appNotifications.length
    );

    const badge = document.getElementById("notifyBadge");
    if (badge) {
      badge.style.display = "none";
      badge.textContent = "";
    }

    updateNotificationBadge();
    saveNotifications();
  } else {
    drawer.style.display = "none";
  }
});


/* -------------------------
   CLICK SAFETY
------------------------- */
document
  .getElementById("notificationDrawer")
  ?.addEventListener("click", e => e.stopPropagation());

document.addEventListener("click", () => {
  const drawer = document.getElementById("notificationDrawer");
  if (drawer && drawer.style.display === "block") {
    drawer.style.display = "none";
  }
});


/* -------------------------
   SMART POPUP
------------------------- */
function showSmartNotification(title, message) {
  const popup = document.getElementById("smartNotify");
  if (!popup) return;

  document.getElementById("notifyTitle").innerText = title;
  document.getElementById("notifyMsg").innerText = message;

  popup.style.display = "block";
  popup.style.opacity = 0;
  popup.style.transform = "translateY(-40px)";

  setTimeout(() => {
    popup.style.transition = "all 0.4s ease";
    popup.style.opacity = 1;
    popup.style.transform = "translateY(0)";
  }, 20);

  setTimeout(() => {
    popup.style.opacity = 0;
    popup.style.transform = "translateY(-40px)";
    setTimeout(() => {
      popup.style.display = "none";
    }, 400);
  }, 3000);
}


/* -------------------------
   DAILY GOAL REMINDER
------------------------- */
function dailyGoalReminder() {
  const today = new Date().toDateString();
  const lastRun = localStorage.getItem("dailyGoalReminder");

  if (lastRun === today) return;

  localStorage.setItem("dailyGoalReminder", today);

  document
    .querySelectorAll("#goal-list .goal")
    .forEach(goal => {
      const title =
        goal.querySelector(".goal-title")?.textContent;
      if (title) {
        pushNotification(
          "Goal Reminder",
          `Don't forget your goal: "${title}"`
        );
      }
    });
}


/* -------------------------
   INIT
------------------------- */
window.addEventListener("load", updateNotificationBadge);
