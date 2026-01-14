
        if (!window.cardCatalog) {
  console.error("❌ cardCatalog not loaded");
  window.cardCatalog = [];
        }

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("message", event => {
    if (event.data?.type === "SW_UPDATED") {
      showUpdateNotification();
    }
  });
}

navigator.serviceWorker.register("/service-worker.js").then(reg => {
  reg.onupdatefound = () => {
    const newWorker = reg.installing;
    newWorker.onstatechange = () => {
      if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
        showSmartNotification(
          "Update Available",
          "New version installed. App refreshed."
        );
        newWorker.postMessage("SKIP_WAITING");
      }
    };
  };
});

function showUpdateNotification() {
  const bar = document.createElement("div");

  bar.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #111827;
    color: #fff;
    padding: 12px 18px;
    border-radius: 10px;
    z-index: 99999;
    display: flex;
    gap: 12px;
    align-items: center;
    box-shadow: 0 10px 30px rgba(0,0,0,.4);
  `;

  bar.innerHTML = `
    <span>🚀 New update available</span>
    <button style="
      background:#3B82F6;
      border:none;
      color:white;
      padding:6px 12px;
      border-radius:6px;
      cursor:pointer;
    ">Update</button>
  `;

  bar.querySelector("button").onclick = () => {
    location.reload();
  };

  document.body.appendChild(bar);
}

let currentMarketplaceFilter = "ALL";

function getISTDate() {
  return new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata"
    })
  );
}

        function getTodayKey() {
    return getISTDate().toISOString().slice(0, 10);
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

        window.addEventListener("load", () => {
    enforceDailyReset();
});

        setInterval(enforceDailyReset, 60 * 1000);

function getAppSnapshot() {
    return {
        version: "2.1.0",
        exportedAt: getISTDate().toISOString().slice(0, 10),

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
    resetData(true); // silent reset

    completedMissions = Number(data.completedMissions) || 0;
    dailyImprovementCount = Number(data.dailyImprovementCount) || 0;
    lastImprovementDate = data.lastImprovementDate || getISTDate().toISOString().slice(0, 10);

    localStorage.setItem("missions", data.missions || "");
    localStorage.setItem("skills", data.skills || "");
    localStorage.setItem("goals", data.goals || "");

    countdowns = Array.isArray(data.countdowns) ? data.countdowns : [];
    saveCountdowns();

    ownedCards = typeof data.ownedCards === "object" ? data.ownedCards : {};
    localStorage.setItem("ownedCards", JSON.stringify(ownedCards));

    achievementsData = Array.isArray(data.achievements)
        ? data.achievements
        : achievements.map(a => ({ ...a, unlocked: false }));

    localStorage.setItem("achievements", JSON.stringify(achievementsData));

    appNotifications = Array.isArray(data.notifications) ? data.notifications : [];
    localStorage.setItem("appNotifications", JSON.stringify(appNotifications));
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

    document.getElementById("missionCounter").textContent = completedMissions;
        }
        
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

        document.getElementById("importProgressFile").addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
        try {
            const text = reader.result.replace(/^\uFEFF/, "").trim();
            const data = JSON.parse(text);
            console.log("RAW FILE TEXT:", reader.result);
            console.log("PARSED DATA:", data);

            restoreAppSnapshot(data);
            customAlert("Progress restored successfully!");
        } catch (err) {
            console.error("Restore failed:", err);
            customAlert("Invalid or corrupted backup file.");
        }
    };

    reader.readAsText(file);
    e.target.value = "";
});

        window.saveProgressToFile = saveProgressToFile;
window.loadProgressFromFile = loadProgressFromFile;
        
        const DAILY_IMPROVEMENT_LIMIT = 10;

        let dailyImprovementCount = parseInt(localStorage.getItem("dailyImprovementCount")) || 0;
        let lastImprovementDate = localStorage.getItem("lastImprovementDate") || new Date().toDateString();

        
        let isMarketplaceOpen = false;


        let ownedCards = JSON.parse(localStorage.getItem("ownedCards")) || {};

        function renderMarketplace(filterGrade = "ALL") {
  const shop = document.getElementById("cardShop");
  if (!shop) return;

  shop.innerHTML = "";

  let cards = [...window.cardCatalog];

  if (filterGrade !== "ALL") {
    cards = cards.filter(c => c.grade === filterGrade);
  }

  // ✅ SINGLE SORT (safe)
  cards.sort((a, b) => {
    const aLimited = a.limited ? 1 : 0;
    const bLimited = b.limited ? 1 : 0;
    if (aLimited !== bLimited) return bLimited - aLimited;

    const aOwned = ownedCards[a.id] ? 1 : 0;
    const bOwned = ownedCards[b.id] ? 1 : 0;
    if (aOwned !== bOwned) return bOwned - aOwned;

    const aCanBuy = completedMissions >= a.cost ? 1 : 0;
    const bCanBuy = completedMissions >= b.cost ? 1 : 0;
    if (aCanBuy !== bCanBuy) return bCanBuy - aCanBuy;

    return gradeRank(b.grade) - gradeRank(a.grade);
  });

  cards.forEach(card => {
    const isOwned = !!ownedCards[card.id];
    const expired = isExpired(card);

    if (expired && !isOwned) return;

    const canBuy = completedMissions >= card.cost;
    const mintDate =
      isOwned && ownedCards[card.id]?.mintedAt
        ? formatDate(ownedCards[card.id].mintedAt)
        : "";

    const div = document.createElement("div");
    div.className = `
      flex-card
      grade-${card.grade.toLowerCase()}
      ${isOwned ? "owned" : "locked"}
      ${card.limited ? "limited" : ""}
    `;

      div.innerHTML = `
  <img src="${card.image}">
  <span class="grade-badge">${card.grade}</span>

  ${card.limited ? `<span class="limited-badge">LIMITED</span><strong>` : ""}

  <div class="card-body">
    <h3>${card.title}</h3>
    <p class="card-quote">${card.quote}</p>

    ${
  card.limited && !expired && !isOwned && card.expiresAt
    ? `<h6 class="expire-text">Will expire on: ${card.expiresAt.slice(0, 10)}</h6>`
    : ""
    }

    ${
      isOwned
        ? `<button class="buy-btn" disabled>OWNED</button>`
        : `<button class="buy-btn" ${!canBuy ? "disabled" : ""}>
             ${card.cost} pts
           </button>`
    }

    ${isOwned && mintDate ? `<div class="mint-date">Minted on ${mintDate}</div>
    <div class="mint-date">Card Cost ${card.cost} pts</div>` : ""}
  </div>
`;
    

    if (!isOwned && canBuy && !expired) {
      div.querySelector(".buy-btn").onclick = () => buyCard(card.id);
    }

    shop.appendChild(div);
  });
        }


        function isExpired(card) {
  if (!card.limited || !card.expiresAt) return false;

  const now = window.__timeTravelNow || Date.now();
  return new Date(card.expiresAt).getTime() < now;
}

function buyCard(cardId) {
  const card = window.cardCatalog.find(c => c.id === cardId);
  if (!card) return;

  // ❌ Prevent minting expired limited cards
  if (card.limited && isExpired(card)) {
    customAlert("This limited edition card is no longer available.");
    return;
  }

  if (completedMissions < card.cost) {
    customAlert("Not enough Improvement Points.");
    return;
  }

  customConfirm(
    `Mint "${card.title}" for ${card.cost} points?\nThis is permanent.`,
    () => {
      completedMissions -= card.cost;
      document.getElementById("missionCounter").textContent = completedMissions;

      ownedCards[card.id] = {
        mintedAt: getISTDate().toISOString().slice(0, 10)   // ✅ ISO format
      };

      localStorage.setItem("ownedCards", JSON.stringify(ownedCards));
      localStorage.setItem("completedMissions", completedMissions);

      renderMarketplace(currentMarketplaceFilter);
      renderMyCards();

      showSmartNotification(
        "Card Minted",
        `"${card.title}" is now part of your identity.`
      );
    }
  );
            }


        function formatDate(isoDate) {
    if (!isoDate) return "";
    const d = new Date(isoDate);
    return d.toLocaleDateString([], {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
        }

        function renderMyCards() {
            const container = document.getElementById("ownedCards");
            if (!container) return;

            container.innerHTML = "";

            const ownedList = window.cardCatalog
                .filter(card => ownedCards[card.id])
                .sort((a, b) => gradeRank(b.grade) - gradeRank(a.grade));

            if (ownedList.length === 0) {
                container.innerHTML = `<p style="opacity:.6;">No cards minted yet.</p>`;
                return;
            }

            ownedList.forEach(card => {
                const data = ownedCards[card.id];

                const div = document.createElement("div");
                div.className = `flex-card owned grade-${card.grade.toLowerCase()}`;

                div.innerHTML = `
    <img src="${card.image}" alt="${card.title}">
    <span class="grade-badge">${card.grade}</span>

    <div class="card-body">
        <h3>${card.title}</h3>
        <p class="card-quote">${card.quote}</p>

        ${
            isOwned
                ? `
                  <p class="mint-date">
                      Minted on ${mintedAt}
                  </p>
                  <button class="buy-btn" disabled>OWNED</button>
                `
                : `
                  <button class="buy-btn" ${!canBuy ? "disabled" : ""}>
                      ${card.cost} pts
                  </button>
                `
        }
    </div>
`;


                container.appendChild(div);
            });
        }

        const GRADE_ORDER = ["E", "D", "C", "B", "A", "w", "S", "SS"];

function gradeRank(grade) {
  return GRADE_ORDER.indexOf(grade) + 1;
}

        document.querySelectorAll(".card-filters button").forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll(".card-filters button")
                    .forEach(b => b.classList.remove("active"));

                btn.classList.add("active");

                const grade = btn.textContent === "All"
                    ? "ALL"
                    : btn.textContent;

                currentMarketplaceFilter = grade;

                renderMarketplace(grade);
            };
        });

        window.addEventListener("load", () => {
            renderMarketplace();
            renderMyCards();
        });


        document.getElementById("marketplaceIcon").onclick = () => {
            if (isMarketplaceOpen) {
                // Close marketplace → go back to missions (or last page)
                showPage("missions");
                isMarketplaceOpen = false;
            } else {
                // Open marketplace
                showPage("marketplace-cards");
                isMarketplaceOpen = true;
            }
        };


        document.getElementById("timerCloseBtn").onclick = () => {
            document.getElementById("timerScreen").style.display = "none";
            document.querySelector(".top-navbar").style.display = "flex";
            document.querySelector(".bottom-nav").style.display = "flex";

            clearInterval(timerInterval);
            stopAllMusic();
        };


        let playlist = [];
        let currentTrackIndex = 0;
        let timerInterval = null;
        let currentMusic = null;
        let music = new Audio();

        function stopAllMusic() {
            if (music) {
                music.pause();
                music.currentTime = 0;
                music.onended = null;
            }
        }


        function openFolderPicker() {
            const picker = document.getElementById("folderPicker");
            if (picker) {
                picker.click();
            } else {
                console.error("❌ folderPicker not found");
            }
        }

        document.getElementById("folderPicker").addEventListener("change", function (e) {
            stopAllMusic();

            const files = Array.from(e.target.files)
                .filter(file => file.type.startsWith("audio/"));

            if (files.length === 0) {
                customAlert("No audio files found in this folder.");
                return;
            }

            playlist = files;
            musicMode = "playlist";
            currentTrackIndex = 0;

            // hidePresetUI(); // 🔥 HIDE preset controls

            customConfirm(
                `Play ${playlist.length} songs from this folder?`,
                () => {
                    playCurrentTrack();
                    closeMusicModal();
                }
            );

            e.target.value = "";
        });


        function resumeMusicOnUserGesture() {
            const resume = () => {
                music.play().catch(() => { });
                document.removeEventListener("click", resume);
                document.removeEventListener("touchstart", resume);
            };

            document.addEventListener("click", resume);
            document.addEventListener("touchstart", resume);
        }


        function playCurrentTrack() {
            if (musicMode !== "playlist") return;
            if (!playlist[currentTrackIndex]) return;

            const file = playlist[currentTrackIndex];
            const url = URL.createObjectURL(file);

            music.src = url;
            music.loop = false;
            music.volume = document.getElementById("musicVolume").value;

            music.play()
                .then(() => { })
                .catch(() => {
                    // 🔥 FIX autoplay block
                    resumeMusicOnUserGesture();
                });

            music.onended = () => {
                if (musicMode !== "playlist") return;

                currentTrackIndex++;
                if (currentTrackIndex >= playlist.length) {
                    currentTrackIndex = 0;
                }
                playCurrentTrack();
            };
        }



        function setSelectedMusic() {
            stopAllMusic();

            const file = document.getElementById("musicSelect").value;
            if (!file) return;

            musicMode = "preset";
            playlist = [];
            currentTrackIndex = 0;

            showPresetUI(); // ✅ RESTORE HERE

            music.src = file;
            music.loop = true;
            music.volume = document.getElementById("musicVolume").value;

            music.play().catch(() => { });
            closeMusicModal();
        }




        function showPresetUI() {
            document.getElementById("presetControls").style.display = "block";
        }

        function hidePresetUI() {
            document.getElementById("presetControls").style.display = "none";
        }


        let musicMode = "preset"; // "preset" | "playlist"



        // =========================
        //   NOTIFICATION SYSTEM
        // =========================

        let appNotifications = JSON.parse(localStorage.getItem("appNotifications")) || [];

        // Save notif list
        function saveNotifications() {
            localStorage.setItem("appNotifications", JSON.stringify(appNotifications));
        }

        // Add new notification
        function pushNotification(title, msg) {
            appNotifications.unshift({
                title,
                msg,
                time: new Date().toLocaleString()
            });

            updateNotificationBadge();
            saveNotifications();
        }
        function clearAllNotifications() {
            appNotifications = [];                 // Clear array
            localStorage.removeItem("appNotifications"); // Remove from localStorage
            localStorage.removeItem("lastNotifCount");   // Reset unread count tracker

            // Update UI
            document.getElementById("notificationList").innerHTML =
                `<p style="opacity:0.6;">No notifications</p>`;

            const badge = document.getElementById("notifyBadge");
            badge.style.display = "none";
            badge.textContent = "";

            console.log("All notifications cleared.");
        }

        // Update badge count
        function updateNotificationBadge() {
            const badge = document.getElementById("notifyBadge");
            if (!badge) return;

            const lastCount = parseInt(localStorage.getItem("lastNotifCount")) || 0;

            const unread = appNotifications.length - lastCount;

            if (unread <= 0) {
                badge.style.display = "none";
            } else {
                badge.style.display = "inline-block";
                badge.textContent = unread;
            }
        }

        // Open/Close drawer
        document.getElementById("notifyBell").onclick = (e) => {
            e.stopPropagation();
            const drawer = document.getElementById("notificationDrawer");

            if (drawer.style.display === "none") {
                renderNotifications();
                drawer.style.display = "block";

                // 🔥 Clear the badge
                const badge = document.getElementById("notifyBadge");
                // Clear badge
                badge.style.display = "none";
                badge.textContent = "";

                // Mark all as read  (but keep them in list)
                // Reset unread count
                localStorage.setItem("lastNotifCount", appNotifications.length);
                updateNotificationBadge();
                saveNotifications();
            } else {
                drawer.style.display = "none";
            }
        }; // ← CLOSE THIS PROPERLY

        document.getElementById("notificationDrawer").addEventListener("click", function (e) {
            e.stopPropagation();
        });


        document.addEventListener("click", function () {
            const drawer = document.getElementById("notificationDrawer");
            if (drawer && drawer.style.display === "block") {
                drawer.style.display = "none";
            }
        });



        // ----------------------------
        // NOW define renderNotifications
        // ----------------------------
        function renderNotifications() {
            const container = document.getElementById("notificationList");
            container.innerHTML = "";

            if (appNotifications.length === 0) {
                container.innerHTML = `<p style="opacity:0.7; text-align:center;">No notifications</p>`;
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

        // Initialize badge on load
        window.addEventListener("load", updateNotificationBadge);

        function showSmartNotification(title, message) {
            const popup = document.getElementById("smartNotify");
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

            // auto hide
            setTimeout(() => {
                popup.style.opacity = 0;
                popup.style.transform = "translateY(-40px)";
                setTimeout(() => popup.style.display = "none", 400);
            }, 3000);
        }

        function dailyGoalReminder() {
            const today = new Date().toDateString();
            const lastRun = localStorage.getItem("dailyGoalReminder");

            if (lastRun === today) return; // already sent today

            localStorage.setItem("dailyGoalReminder", today);

            const goals = document.querySelectorAll("#goal-list .goal");
            goals.forEach(goal => {
                const title = goal.querySelector(".goal-title")?.textContent;
                if (title) {
                    pushNotification("Goal Reminder", `Don't forget your goal: "${title}"`);
                }
            });
        }

        /* =========================================================
       1. GLOBAL VARIABLES + STORED DATA
    ========================================================= */
        let completedMissions = parseInt(localStorage.getItem("completedMissions")) || 0;
        let missionHistory = JSON.parse(localStorage.getItem("missionHistory")) || {};
        window.addEventListener("load", () => {
            checkMissedDeadlines();
        });


        document.getElementById("missionCounter").textContent = completedMissions;


        /* =========================================================
           2. ACHIEVEMENTS SYSTEM
        ========================================================= */

        // Achievement definitions
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
            { id: "mission50", title: "Legendary Milestone", desc: "Complete 50 missions", unlocked: false },
            { id: "mission55", title: "Mastermind", desc: "Complete 55 missions", unlocked: false },
            { id: "mission60", title: "Champion", desc: "Complete 60 missions", unlocked: false },
            { id: "mission65", title: "Pathfinder", desc: "Complete 65 missions", unlocked: false },
            { id: "mission70", title: "Mission Conqueror", desc: "Complete 70 missions", unlocked: false },
            { id: "mission75", title: "Epic Endeavor", desc: "Complete 75 missions", unlocked: false },
            { id: "mission80", title: "Trail Master", desc: "Complete 80 missions", unlocked: false },
            { id: "mission85", title: "Ultimate Achiever", desc: "Complete 85 missions", unlocked: false },
            { id: "mission90", title: "Hero of Tasks", desc: "Complete 90 missions", unlocked: false },
            { id: "mission95", title: "Task Titan", desc: "Complete 95 missions", unlocked: false },
            { id: "mission100", title: "Century Club", desc: "Complete 100 missions", unlocked: false },
            { id: "mission105", title: "Beyond Limits", desc: "Complete 105 missions", unlocked: false },
            { id: "mission110", title: "Relentless", desc: "Complete 110 missions", unlocked: false },
            { id: "mission115", title: "Sky High", desc: "Complete 115 missions", unlocked: false },
            { id: "mission120", title: "Goal Crusher", desc: "Complete 120 missions", unlocked: false },
            { id: "mission125", title: "Mission Marathoner", desc: "Complete 125 missions", unlocked: false },
            { id: "mission130", title: "Infinite Drive", desc: "Complete 130 missions", unlocked: false },
            { id: "mission135", title: "Peak Performer", desc: "Complete 135 missions", unlocked: false },
            { id: "mission140", title: "Legend in Making", desc: "Complete 140 missions", unlocked: false },
            { id: "mission145", title: "Champion of Tasks", desc: "Complete 145 missions", unlocked: false },
            { id: "mission150", title: "Task Legend", desc: "Complete 150 missions", unlocked: false },
            { id: "mission155", title: "Milestone Achiever", desc: "Complete 155 missions", unlocked: false },
            { id: "mission160", title: "Mission Icon", desc: "Complete 160 missions", unlocked: false },
            { id: "mission165", title: "Epic Journey", desc: "Complete 165 missions", unlocked: false },
            { id: "mission170", title: "Task Champion", desc: "Complete 170 missions", unlocked: false },
            { id: "mission175", title: "Master of Milestones", desc: "Complete 175 missions", unlocked: false },
            { id: "mission180", title: "Legendary Achiever", desc: "Complete 180 missions", unlocked: false },
            { id: "mission185", title: "Ultimate Victor", desc: "Complete 185 missions", unlocked: false },
            { id: "mission190", title: "Task Hero", desc: "Complete 190 missions", unlocked: false },
            { id: "mission195", title: "Mission Elite", desc: "Complete 195 missions", unlocked: false },
            { id: "mission200", title: "Two Hundred Triumphs", desc: "Complete 200 missions", unlocked: false },
            { id: "mission205", title: "Beyond Achievement", desc: "Complete 205 missions", unlocked: false },
            { id: "mission210", title: "Victory Streak", desc: "Complete 210 missions", unlocked: false },
            { id: "mission215", title: "Unstoppable", desc: "Complete 215 missions", unlocked: false },
            { id: "mission220", title: "Peak Achiever", desc: "Complete 220 missions", unlocked: false },
            { id: "mission225", title: "Mission Overlord", desc: "Complete 225 missions", unlocked: false },
            { id: "mission230", title: "Epic Victor", desc: "Complete 230 missions", unlocked: false },
            { id: "mission235", title: "Champion of Goals", desc: "Complete 235 missions", unlocked: false },
            { id: "mission240", title: "Task Mastermind", desc: "Complete 240 missions", unlocked: false },
            { id: "mission245", title: "Legendary Hero", desc: "Complete 245 missions", unlocked: false },
            { id: "mission250", title: "Ultimate Legend", desc: "Complete 250 missions", unlocked: false }
        ];

        // Load achievements from storage
        let achievementsData = JSON.parse(localStorage.getItem("achievements"));
        if (!achievementsData) {
            achievementsData = achievements;
            localStorage.setItem("achievements", JSON.stringify(achievements));
        }

        const quotes = [
            "Discipline is the bridge between goals and achievement.",
            "Consistency creates progress, progress creates success.",
            "Small steps every day lead to big results.",
            "Effort today becomes strength tomorrow.",
            "Stay focused, stay strong, keep moving forward.",
            "Success is the sum of small efforts repeated daily.",
            "Your only limit is your mind.",
            "Great things never come from comfort zones.",
            "Dream it. Believe it. Achieve it.",
            "Push yourself, because no one else is going to do it for you.",
            "The harder you work for something, the greater you’ll feel when you achieve it.",
            "Don’t stop when you’re tired. Stop when you’re done.",
            "Focus on progress, not perfection.",
            "Your future is created by what you do today, not tomorrow.",
            "Small progress is still progress.",
            "Motivation gets you started, habit keeps you going.",
            "Do something today that your future self will thank you for.",
            "Success doesn’t come from what you do occasionally, it comes from what you do consistently.",
            "Believe in yourself and all that you are.",
            "Take the risk or lose the chance."
        ];

        /* Render achievements in account page */
        function renderAchievements() {
            const container = document.getElementById("achievementsViewer");
            if (!container) return;

            container.innerHTML = "";

            const unlocked = achievementsData.filter(a => a.unlocked);
            const locked = achievementsData.filter(a => !a.unlocked).slice(0, 5);
            const displayList = [...unlocked, ...locked];

            displayList.forEach(ach => {
                const div = document.createElement("div");
                div.className = "achievement-tile" + (ach.unlocked ? "" : " locked");

                const icon = ach.unlocked
                    ? '<i class="fas fa-trophy"></i>'
                    : '<i class="fas fa-lock"></i>';

                div.innerHTML = `
  <div class="achievement-icon">${icon}</div>
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
        }

        /* Unlock an achievement */
        function unlockAchievement(id) {
    const ach = achievementsData.find(a => a.id === id);

    if (ach && !ach.unlocked) {
        ach.unlocked = true;
        ach.unlockedAt = new Date().toDateString(); // 🔥 ADD THIS

        localStorage.setItem("achievements", JSON.stringify(achievementsData));

        pushNotification("🏆 New Achievement", `You unlocked: "${ach.title}"`);
        showAchievementPopup(ach.title, ach.desc);
        renderAchievements();
    }
        }

        function showAchievementPopup(title, desc) {
            window.isAchievementPlaying = true;

            const popup = document.createElement("div");
            popup.className = "achievement-popup";
            popup.innerHTML = `<h3>${title}</h3><p>${desc}</p>`;
            document.body.appendChild(popup);

            const audio = new Audio("Music/Achievements.mp3");
            audio.volume = 0.5;
            audio.play().catch(() => { });

            audio.onended = () => { window.isAchievementPlaying = false; };

            popup.style.opacity = 0;
            popup.style.transform = "translateY(-50px)";
            setTimeout(() => {
                popup.style.transition = "all 0.5s ease";
                popup.style.opacity = 1;
                popup.style.transform = "translateY(0)";
            }, 10);

            setTimeout(() => {
                popup.style.opacity = 0;
                popup.style.transform = "translateY(-50px)";
                setTimeout(() => popup.remove(), 500);
            }, 3000);
        }


        /* =========================================================
           3. NAVIGATION SYSTEM
        ========================================================= */
        function showPage(pageId) {
            document.querySelectorAll("section").forEach(sec =>
                sec.classList.remove("active")
            );

            const page = document.getElementById(pageId);
            if (page) page.classList.add("active");

            document.querySelectorAll(".bottom-nav > button")
                .forEach(b => b.classList.remove("active"));

            const btn = document.getElementById("nav-" + pageId);
            if (btn) btn.classList.add("active");

            updatePlusBtn(pageId);

            isMarketplaceOpen = (pageId === "marketplace-cards");


            if (pageId === "account") renderAchievements();
        }

        function updatePlusBtn(pageId) {
            const btn = document.getElementById("globalAddBtn");
            if (!btn) return;

            if (pageId === "missions") {
                btn.setAttribute("onclick", "openModal('mission')");
                btn.style.display = "block";
            } else if (pageId === "skillset") {
                btn.setAttribute("onclick", "openModal('skill')");
                btn.style.display = "block";
            } else if (pageId === "goals") {
                btn.setAttribute("onclick", "openModal('goal')");
                btn.style.display = "block";
            } else if (pageId === "time") {
                btn.setAttribute("onclick", "openModal('multi-time')");
                btn.style.display = "block";
            } else {
                btn.style.display = "none";
            }
        }
        // ===============================
        // FULLSCREEN TIMER MODE JS
        // ===============================



        // OPEN FULL SCREEN
        document.getElementById("timerIcon").onclick = () => {
            document.getElementById("timerScreen").style.display = "block";
            document.querySelector(".top-navbar").style.display = "none";
            document.querySelector(".bottom-nav").style.display = "none";
        };

        // EXIT FULL SCREEN
        document.getElementById("timerCloseBtn").onclick = () => {
            document.getElementById("timerScreen").style.display = "none";
            document.querySelector(".top-navbar").style.display = "flex";
            document.querySelector(".bottom-nav").style.display = "flex";

            clearInterval(timerInterval);

            music.pause();
            music.currentTime = 0;
        };


        // MUSIC MODAL
        document.getElementById("timerMusicBtn").onclick = () => {
            document.getElementById("musicModal").classList.add("active");

            if (musicMode === "preset") {
                showPresetUI();
            }
        };

        function closeMusicModal() {
            document.getElementById("musicModal").classList.remove("active");
        }
        // function setSelectedMusic() {
        //     let file = document.getElementById("musicSelect").value;
        //     currentMusic = file;
        //     music.src = file;
        //     music.loop = true;
        //     music.volume = document.getElementById("musicVolume").value;
        //     music.play();
        //     closeMusicModal();
        // }

        // SETTINGS MODAL
        document.getElementById("timerSettingsBtn").onclick = () => {
            document.getElementById("timerSettingModal").classList.add("active");
        };

        function closeTimerSettingModal() {
            document.getElementById("timerSettingModal").classList.remove("active");
        }

        // Apply timer settings
        function applyTimerSettings() {
            let h = parseInt(document.getElementById("setH").value);
            let m = parseInt(document.getElementById("setM").value);
            let s = parseInt(document.getElementById("setS").value);

            startStaticTimer(h, m, s);
            closeTimerSettingModal();
        }


        function startStaticTimer(h, m, s) {
            clearInterval(timerInterval);

            let total = h * 3600 + m * 60 + s;

            // Set initial values
            document.getElementById("h").textContent = h.toString().padStart(2, "0");
            document.getElementById("m").textContent = m.toString().padStart(2, "0");
            document.getElementById("s").textContent = s.toString().padStart(2, "0");

            timerInterval = setInterval(() => {
                if (total <= 0) {
                    clearInterval(timerInterval);
                    if (currentMusic) music.pause();
                    return;
                }

                total--;

                const hh = Math.floor(total / 3600);
                const mm = Math.floor((total % 3600) / 60);
                const ss = total % 60;

                document.getElementById("h").textContent = hh.toString().padStart(2, "0");
                document.getElementById("m").textContent = mm.toString().padStart(2, "0");
                document.getElementById("s").textContent = ss.toString().padStart(2, "0");

            }, 1000);
        }




        /* =========================================================
           4. MODALS (ADD / EDIT / ALERT / CONFIRM)
        ========================================================= */
        function openModal(type, skillDiv = null) {
            const modal = document.getElementById("modal");
            const content = document.getElementById("modal-content");

            modal.classList.add("active");

            // ---- Add Mission ----
            if (type === 'mission') {
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

            // ---- Edit Mission ----
            if (type === "edit-mission" && skillDiv) {
    const oldText = skillDiv.querySelector(".mission-text").textContent.replace("🔥", "").trim();
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
          ? `<button disabled 
              style="opacity:0.5;cursor:not-allowed;">
              🔒 Delete
            </button>`
          : `<button onclick="deleteMission()">Delete</button>`
      }

      <button onclick="closeModal()">Cancel</button>
    `;

    window.missionBeingEdited = skillDiv;
            }

            // ---- Add Skill ----
            if (type === "skill") {
                content.innerHTML = `
      <h3>Add Skill</h3>
      <input id="skillInput" placeholder="Skill name">
      <button onclick="addSkill()">Add</button>
      <button onclick="closeModal()">Cancel</button>
      `;
                //   <input id="progressInput" type="number" placeholder="Progress % (0-100)">
            }

            // ---- Edit Skill ----
            if (type === "edit-skill" && skillDiv) {
                const skillName = skillDiv.querySelector("strong").textContent;
                const currentProgress =
                    skillDiv.querySelector(".progress-bar").style.width.replace("%", "");

                content.innerHTML = `
      <h3>Edit ${skillName}</h3>
      <button onclick="deleteSkill('${skillName}')">Delete</button>
      <button onclick="closeModal()">Cancel</button>
    `;
            }

            // ---- Add Goal ----
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


            // ---- Add Countdown (FIXED) ----
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
        }

        // ---- FIXED: closeModal OUTSIDE openModal ----
        function closeModal() {
    document.getElementById("modal").classList.remove("active");

    // 🔥 RESET ALL MODAL INPUTS
    document.querySelectorAll("#modal input, #modal select").forEach(el => {
        el.value = "";
    });
}



        /* Alerts */
        function customAlert(msg) {
            document.getElementById("alertMsg").textContent = msg;
            document.getElementById("alertModal").classList.add("active");
        }

        function closeAlert() {
            document.getElementById("alertModal").classList.remove("active");
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


        /* =========================================================
           5. MISSIONS MODULE
        ========================================================= */
        const missionMilestones = [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

        function addMission() {
    const text = document.getElementById("missionInput").value.trim();
    const deadline = document.getElementById("missionDeadline").value;
    const linkedSkill = document.getElementById("linkedSkill").value;
    const isHardcore = document.getElementById("hardcoreToggle").checked;

    // ❌ Text required
    if (!text) {
        closeModal();
        return;
    }

    // 🔥 HARDCORE → DEADLINE REQUIRED
    if (isHardcore && !deadline) {
        customAlert("🔥 Hardcore missions require a deadline.");
        return;
    }

    // ❌ Past deadline not allowed
    if (deadline && isPastDateTime(deadline)) {
        customAlert("Deadline cannot be in the past.");
        return;
    }

    const li = document.createElement("li");
    li.dataset.deadline = deadline || "";
    li.dataset.skill = linkedSkill || "";
    li.dataset.completed = "false";
    li.dataset.hardcore = isHardcore ? "true" : "false";

    // Format deadline text
    let deadlineText = "";
    if (deadline) {
        const d = new Date(deadline);
        const date = d.toLocaleDateString([], { day: "numeric", month: "short" });
        const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        deadlineText = `${date}, ${time}`;
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

    // Click to edit (except complete)
    li.addEventListener("click", (e) => {
        if (e.target.classList.contains("complete-btn")) return;
        openModal("edit-mission", li);
    });

    document.getElementById("mission-list").appendChild(li);
    saveData();
    closeModal();
        }






        setInterval(checkMissedDeadlines, 60000); // check every 1 minute

        function updateMission() {
    const li = window.missionBeingEdited;
    if (!li) return;

    const newText = document.getElementById("editMissionInput").value.trim();
    const newDeadline = document.getElementById("editMissionDeadline").value;
    const isHardcore = li.dataset.hardcore === "true";

    if (!newText) {
        closeModal();
        return;
    }

    // ❌ Hardcore → deadline cannot change
    if (!isHardcore && newDeadline && isPastDateTime(newDeadline)) {
        customAlert("Deadline cannot be in the past.");
        return;
    }

    // ✅ Restore 🔥 if hardcore
    li.querySelector(".mission-text").innerHTML =
        newText + (isHardcore ? " 🔥" : "");

    // Update deadline ONLY if not hardcore
    if (!isHardcore) {
        if (newDeadline) {
            const d = new Date(newDeadline);
            const date = d.toLocaleDateString([], { day: "numeric", month: "short" });
            const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

            li.querySelector(".deadlineDisplay").textContent = `${date}, ${time}`;
            li.dataset.deadline = newDeadline;
        } else {
            li.querySelector(".deadlineDisplay").textContent = "";
            li.dataset.deadline = "";
        }

        // Reset overdue state if deadline changed
        li.querySelector(".overdueMark").innerHTML = "";
        delete li.dataset.deducted;
    }

    saveData();
    closeModal();
        }
        

        
function checkMissedDeadlines() {
    const missions = document.querySelectorAll("#mission-list li");
    const now = Date.now();

    missions.forEach(li => {
        const deadline = li.dataset.deadline;
        if (!deadline) return;

        if (li.dataset.completed === "true") return;

        const deadlineTime = new Date(deadline).getTime();
        const timeLeft = deadlineTime - now;

        const overdueSpan = li.querySelector(".overdueMark");
        if (!overdueSpan) return;

        // 🔔 Due soon warning (once)
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

        // ⏰ DEADLINE PASSED
        if (timeLeft <= 0) {
            overdueSpan.innerHTML = `<span class="overdue-badge">Overdue</span>`;

            // 🔔 Notify overdue (once)
            if (!li.dataset.overdueNotified) {
                li.dataset.overdueNotified = "true";
                pushNotification(
                    "⚠ Mission Overdue",
                    `"${li.querySelector('.mission-text').textContent}" is overdue!`
                );
            }

            // 🔥 HARDCORE MODE — RESET ALL POINTS (ONCE)
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
                return; // ⛔ stop further penalties
            }

            // ❌ NORMAL MODE — DEDUCT 1 POINT (ONCE)
            if (!li.dataset.deducted) {
                completedMissions = Math.max(0, completedMissions - 1);
                li.dataset.deducted = "true";

                document.getElementById("missionCounter").textContent = completedMissions;
                localStorage.setItem("completedMissions", completedMissions);

                saveData();
            }
        }
    });
}


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

    // Normal mission
    li.remove();
    saveData();
    closeModal();
        }


        function completeMission(btn) {
    enforceDailyReset();
    renderMarketplace(currentMarketplaceFilter);

    const li = btn.closest("li");
    const linkedSkill = li.dataset.skill;
    const deadline = li.dataset.deadline;

    li.classList.add("remove");
    li.dataset.completed = "true";
    setTimeout(() => li.remove(), 400);

    // ❌ OVERDUE → NO GAIN
    if (deadline && new Date(deadline).getTime() < Date.now()) {
        showPopup("Mission was overdue. No improvement points gained.");
        saveData();
        return;
    }

    // ❌ DAILY LIMIT REACHED
    if (dailyImprovementCount >= DAILY_IMPROVEMENT_LIMIT) {
        showPopup("You're too tired today. No improvement points gained.");
        saveData();
        return;
    }

    // ✅ SUCCESSFUL COMPLETION
    dailyImprovementCount++;
    completedMissions++;

    localStorage.setItem("dailyImprovementCount", dailyImprovementCount);
    localStorage.setItem("completedMissions", completedMissions);

    document.getElementById("missionCounter").textContent = completedMissions;

    if (linkedSkill) {
        increaseSkillXP(linkedSkill, 1);
    }

    checkMissionAchievements();
    showPopup("Mission completed! Improvement point gained.");
    saveData();
}



        function increaseSkillXP(skillName, amount) {
            const skills = document.querySelectorAll("#skill-list .skill");

            skills.forEach(skill => {
                const name = skill.querySelector("strong").textContent.trim();

                if (name === skillName.trim()) {
                    let xp = parseInt(skill.dataset.xp || "0");
                    xp = Math.min(100, xp + amount);

                    skill.dataset.xp = xp;
                    skill.setAttribute("data-xp", xp);

                    skill.querySelector(".xp-count").textContent = xp;
                    skill.querySelector(".progress-bar").style.width = xp + "%";

                    saveData(); // 🔥 force persist
                }
            });
        }



        function checkMissionAchievements() {
            missionMilestones.forEach(m => {
                if (completedMissions === m) unlockAchievement("mission" + m);
            });
        }

        function showPopup(achievementText) {
            const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

            document.getElementById("motivationQuote").innerText = randomQuote;
            document.getElementById("achievement").innerText = achievementText;

            const popup = document.getElementById("motivationPopup");
            popup.style.display = "flex";

            if (!window.isAchievementPlaying) {
                const sound = document.getElementById("popupSound");
                sound.currentTime = 0;
                sound.volume = 1.0;
                sound.play().catch(() => { });
            }
        }

        function closePopup() {
            const popup = document.getElementById("motivationPopup");
            const content = popup.querySelector(".popup-content");

            content.style.animation = "fadeOut 0.3s ease forwards";

            setTimeout(() => {
                popup.style.display = "none";
                content.style.animation = "popIn 0.4s ease forwards";
            }, 300);
        }


        /* =========================================================
           6. SKILLS MODULE
        ========================================================= */
        function addSkill() {
            const skill = document.getElementById("skillInput").value;
            if (!skill) return closeModal();

            const div = document.createElement("div");
            div.className = "skill show";
            div.dataset.xp = "0"; // 🔥 XP starts at 0

            div.innerHTML = `
        <strong>${skill}</strong>
        <div class="progress">
            <div class="progress-bar" style="width:0%"></div>
        </div>
        <small>XP: <span class="xp-count">0</span></small>
        <button class="remove-btn" onclick="deleteSkillDirect(this)">Remove</button>
        `;

            document.getElementById("skill-list").appendChild(div);
            saveData();
            closeModal();
        }

        function deleteSkillDirect(btn) {
            const skillDiv = btn.closest(".skill");
            const skillName = skillDiv.querySelector("strong").textContent;

            customConfirm(
                `Delete skill "${skillName}"?\nLinked missions will stop giving XP.`,
                () => {
                    skillDiv.remove();

                    // Remove skill link from missions
                    document.querySelectorAll("#mission-list li").forEach(li => {
                        if (li.dataset.skill === skillName) {
                            li.dataset.skill = "";
                        }
                    });

                    saveData();
                }
            );
        }


        // function updateSkillProgress(skillName) {
        //     let newProgress = document.getElementById("editProgressInput").value;
        //     newProgress = Math.min(100, Math.max(0, parseInt(newProgress)));

        //     const skills = document.querySelectorAll("#skill-list .skill");
        //     skills.forEach(skill => {
        //         if (skill.querySelector("strong").textContent === skillName) {
        //             skill.querySelector(".progress-bar").style.width = newProgress + "%";
        //         }
        //     });

        //     saveData();
        //     closeModal();
        // }

        function deleteSkill(skillName) {
            const skills = document.querySelectorAll("#skill-list .skill");
            skills.forEach(skill => {
                if (skill.querySelector("strong").textContent === skillName) skill.remove();
            });

            saveData();
            closeModal();
        }


        /* =========================================================
           7. GOALS MODULE
        ========================================================= */
        function addGoal() {
            const goalText = document.getElementById("goalInput").value;
            const priority = document.getElementById("priorityInput").value;
            const deadline = document.getElementById("goalDeadline").value;

            if (isPastDateTime(deadline)) {
                customAlert("Deadline cannot be in the past.");
                return;
            }


            if (!goalText) {
                closeModal();
                return;
            }

            // Create goal div
            const div = document.createElement("div");
            div.className = "goal show";
            div.dataset.deadline = deadline;

            // Format deadline
            let formattedDeadline = "";
            if (deadline) {
                const d = new Date(deadline);
                formattedDeadline = d.toLocaleDateString([], { day: "numeric", month: "short" });
            }

            // Fill goal card UI
            div.innerHTML = `
        <div class="goal-header">
            <span class="goal-title">${goalText} -</span>
            <span class="goal-priority ${priority}"><strong>${priority}</strong></span>
        </div>

        <div class="goal-subrow">
            <span class="goal-deadline">${formattedDeadline}</span>
            <span class="goal-overdue"></span>
            <button class="remove-btn" onclick="removeGoal(this)">Remove</button>
        </div>

        <div class="goal-timer" style="margin-top:6px; font-size:14px; opacity:.9;"></div>
    `;

            // Add to list
            document.getElementById("goal-list").appendChild(div);

            saveData();
            closeModal();

        }
        function updateGoalTimers() {
            const goals = document.querySelectorAll("#goal-list .goal");

            goals.forEach(goal => {
                const deadline = goal.dataset.deadline;
                if (!deadline) return;

                const timer = goal.querySelector(".goal-timer");
                const overdueBadge = goal.querySelector(".goal-overdue");

                const diff = new Date(deadline).getTime() - Date.now();

                if (diff > 0) {
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    const minutes = Math.floor((diff / (1000 * 60)) % 60);

                    timer.textContent = `${hours}h ${minutes}m left`;
                    overdueBadge.innerHTML = "";

                    if (diff <= 2 * 60 * 60 * 1000 && !goal.dataset.warned) {
                        goal.dataset.warned = "true";
                        pushNotification(
                            "Goal Reminder",
                            `Your goal "${goal.querySelector('.goal-title').textContent}" is due soon (within 2 hours).`
                        );
                    }

                } else {
                    timer.textContent = "";
                    overdueBadge.innerHTML = `<span class="overdue-badge">Overdue</span>`;

                    if (!goal.dataset.overdueNotified) {
                        goal.dataset.overdueNotified = "true";

                        pushNotification(
                            "⚠ Goal Overdue",
                            `"${goal.querySelector('.goal-title').textContent}" deadline has passed!`
                        );
                    }
                }
            });
        }

        // Run every second
        setInterval(updateGoalTimers, 1000);



        function removeGoal(btn) {
            const goalDiv = btn.closest(".goal");
            if (goalDiv) {
                goalDiv.remove();
                saveData();
            }
        }



        /* =========================================================
           8. COUNTDOWNS MODULE
        ========================================================= */
        let countdowns = JSON.parse(localStorage.getItem("countdowns")) || [];

        function saveCountdowns() {
            localStorage.setItem("countdowns", JSON.stringify(countdowns));
        }

        function addCountdown() {
    const titleInput = document.getElementById("countdownTitle");
    const timeInput = document.getElementById("countdownDateTime");

    const title = titleInput.value.trim();
    const dateTime = timeInput.value;

    // ❌ EMPTY CHECK
    if (!title || !dateTime) {
        closeModal();
        return;
    }

    // ❌ PAST TIME CHECK (HARD STOP)
    if (isPastDateTime(dateTime)) {
        customAlert("Countdown time cannot be in the past.");
        return; // 🔥 DO NOT CONTINUE
    }

    // ✅ ONLY NOW MUTATE STATE
    countdowns.push({
        title,
        date: new Date(dateTime).toISOString(),
        startTime: new Date().toISOString()
    });

    saveCountdowns();
    renderCountdowns();

    // 🔥 CLEANUP
    titleInput.value = "";
    timeInput.value = "";

    closeModal();
}





        function removeCountdown(index) {
            countdowns.splice(index, 1);
            saveCountdowns();
            renderCountdowns();
        }

        function renderCountdowns() {
            const list = document.getElementById("countdown-list");
            list.innerHTML = "";

            document.getElementById("countdownCounter").textContent = countdowns.length;

            if (countdowns.length === 0) {
                list.textContent = "No countdowns added";
                return;
            }

            countdowns.forEach((c, index) => {
                const div = document.createElement("div");
                div.className = "goal show";

                div.innerHTML = `
      <strong>${c.title}</strong>
      <div class="timer-row">
  <div class="timer-bar-container">
    <div class="timer-bar" id="timerbar-${index}"></div>
  </div>
  <div class="timer-text" id="timer-${index}"></div>
</div>
      <button class="remove-btn2" onclick="removeCountdown(${index})">Remove</button>
    `;

                list.appendChild(div);
            });

            updateTimers();
        }


        function updateTimers() {
            clearInterval(window.timerInterval);

            window.timerInterval = setInterval(() => {
                countdowns.forEach((c, index) => {
                    const now = new Date().getTime();
                    const target = new Date(c.date).getTime();
                    const diff = target - now;

                    const totalDuration = target - new Date(countdowns[index].startTime || c.date).getTime();
                    const remaining = diff;

                    let percent = (remaining / totalDuration) * 100;

                    // clamp values
                    if (percent < 0) percent = 0;
                    if (percent > 100) percent = 100;

                    const bar = document.getElementById(`timerbar-${index}`);
                    if (bar) bar.style.width = percent + "%";
                    // Notify when 1 hour left
                    if (diff > 0 && diff <= 60 * 60 * 1000 && !c.warned) {
                        c.warned = true;
                        pushNotification("Countdown Ending Soon", `"${c.title}" ends in 1 hour`);
                    }


                    const el = document.getElementById(`timer-${index}`);
                    if (!el) return;

                    if (diff <= 0) {
                        el.style.color = "red";
                        el.textContent = "Time's up!";
                        return;
                    }

                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const secs = Math.floor((diff % (1000 * 60)) / 1000);

                    el.textContent = `${days}d ${hours}h ${mins}m ${secs}s`;
                });
            }, 1000);
        }




        /* =========================================================
           9. RESET & DATA MANAGEMENT
        ========================================================= */
        function saveData() {
            localStorage.setItem("completedMissions", completedMissions);
            localStorage.setItem("missionHistory", JSON.stringify(missionHistory));
            // Save deducted flag on missions
            document.querySelectorAll("#mission-list li").forEach(li => {
                if (li.dataset.deducted) {
                    li.setAttribute("data-deducted", "true");
                }
            });


            // 🔥 STORE XP INTO HTML ATTRIBUTES
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

        function loadData() {
    document.getElementById("mission-list").innerHTML =
        localStorage.getItem("missions") || "";
    document.getElementById("skill-list").innerHTML =
        localStorage.getItem("skills") || "";
    document.getElementById("goal-list").innerHTML =
        localStorage.getItem("goals") || "";

    // --- FIX MISSIONS AFTER LOADING ---
    document.querySelectorAll("#mission-list li").forEach(li => {

        // 1. Ensure overdueMark exists
        if (!li.querySelector(".overdueMark")) {
            const span = document.createElement("span");
            span.className = "overdueMark";
            li.appendChild(span);
        }

        // 2. Ensure deadlineDisplay exists
        if (!li.querySelector(".deadlineDisplay")) {
            const dspan = document.createElement("span");
            dspan.className = "deadlineDisplay";
            li.appendChild(dspan);
        }

        // 3. Restore deadline
        const savedDeadline = li.getAttribute("data-deadline");
        if (savedDeadline) li.dataset.deadline = savedDeadline;

        // 4. Restore deducted flag
        if (li.getAttribute("data-deducted") === "true") {
            li.dataset.deducted = "true";
        }

        // 5. Restore overdue notification flag
        if (li.getAttribute("data-overdue-notified") === "true") {
            li.dataset.overdueNotified = "true";
        }

        // ===============================
        // 🔥 HARDCORE MODE RESTORE (NEW)
        // ===============================
        if (li.getAttribute("data-hardcore") === "true") {
            li.dataset.hardcore = "true";
        }

        if (li.getAttribute("data-hardcore-punished") === "true") {
            li.dataset.hardcorePunished = "true";
        }
        // ===============================

        // 6. Reattach edit modal click
        li.addEventListener("click", (e) => {
            if (e.target.classList.contains("complete-btn")) return;
            openModal("edit-mission", li);
        });
    });

    // ---- SKILLS ----
    document.querySelectorAll("#skill-list .skill").forEach(div => {
        div.addEventListener("click", () => openModal("edit-skill", div));
        div.classList.add("show");
    });

    // ---- GOALS ----
    document.querySelectorAll("#goal-list .goal").forEach(div => {
        div.classList.add("show");
        const removeBtn = div.querySelector(".remove-btn");
        if (removeBtn) {
            removeBtn.onclick = () => removeGoal(removeBtn);
        }
    });

    // ---- SKILL XP ----
    document.querySelectorAll("#skill-list .skill").forEach(skill => {
        const xp = parseInt(skill.getAttribute("data-xp") || "0");
        skill.dataset.xp = xp;
        skill.querySelector(".xp-count").textContent = xp;
        skill.querySelector(".progress-bar").style.width = xp + "%";
    });
}

        
        function resetData() {
            // ===============================
            // 1. RESET RUNTIME MEMORY (🔥 IMPORTANT)
            // ===============================
            completedMissions = 0;
            appNotifications = [];

            dailyImprovementCount = 0;
lastImprovementDate = new Date().toDateString();

localStorage.removeItem("dailyImprovementCount");
localStorage.removeItem("lastImprovementDate");


// RESET COUNTDOWNS
countdowns = [];
localStorage.removeItem("countdowns");

if (window.timerInterval) {
    clearInterval(window.timerInterval);
    window.timerInterval = null;
}

document.getElementById("countdown-list").innerHTML = "";
document.getElementById("countdownCounter").textContent = "0";



            // Reset achievements in memory
            achievementsData = achievements.map(a => ({ ...a, unlocked: false }));

            // ===============================
            // RESET MARKETPLACE
            // ===============================
            ownedCards = {};
            localStorage.removeItem("ownedCards");

            // Re-render marketplace UI
            renderMarketplace();
            renderMyCards();
            // ===============================
            // 2. CLEAR LOCAL STORAGE
            // ===============================
            localStorage.removeItem("missions");
            localStorage.removeItem("completedMissions");
            localStorage.removeItem("missionHistory");
            localStorage.removeItem("goals");
            localStorage.removeItem("skills");
            localStorage.removeItem("countdowns");
            localStorage.removeItem("achievements");
            localStorage.removeItem("appNotifications");
            localStorage.removeItem("lastNotifCount");

            // Extra safety cleanup
            Object.keys(localStorage).forEach(key => {
                if (
                    key.startsWith("mission") ||
                    key.startsWith("goal") ||
                    key.includes("timer") ||
                    key.includes("notif")
                ) {
                    localStorage.removeItem(key);
                }
            });

            // ===============================
            // 3. RESET UI (🔥 ALSO REQUIRED)
            // ===============================
            document.getElementById("missionCounter").textContent = "0";
            document.getElementById("countdownCounter").textContent = "0";

            document.getElementById("mission-list").innerHTML = "";
            document.getElementById("skill-list").innerHTML = "";
            document.getElementById("goal-list").innerHTML = "";
            document.getElementById("countdown-list").innerHTML = "";

            // Reset notifications UI
            const notifList = document.getElementById("notificationList");
            if (notifList) {
                notifList.innerHTML = `<p style="opacity:0.6;">No notifications</p>`;
            }

            const badge = document.getElementById("notifyBadge");
            if (badge) {
                badge.style.display = "none";
                badge.textContent = "";
            }

            // Save reset achievements back
            localStorage.setItem("achievements", JSON.stringify(achievementsData));
            renderAchievements();

            customAlert("All data has been reset successfully!");
        }


        function isPastDateTime(dateTimeValue) {
            if (!dateTimeValue) return false; // allow empty deadlines
            return new Date(dateTimeValue).getTime() < Date.now();
        }


        /* =========================================================
           10. INITIALIZATION
        ========================================================= */
        window.addEventListener("load", () => {
            enforceDailyReset();
            renderMarketplace();
            renderAchievements();
            renderCountdowns();
            loadData();
            

            const activePage = document.querySelector("section.active")
                ? document.querySelector("section.active").id
                : "missions";

            showPage(activePage);
        });

        document.querySelectorAll("#goal-list .goal").forEach(div => {
            div.classList.add("show");
            const removeBtn = div.querySelector(".remove-btn");
            if (removeBtn) {
                removeBtn.onclick = () => removeGoal(removeBtn);
            }
        });

        //Cheats

      let resetHoldTimer = null;
const RESET_HOLD_DURATION = 5000; // 5 seconds

const resetBtn = document.getElementById("resetDataBtn"); // your reset button ID

resetBtn.addEventListener("touchstart", startResetHold);
resetBtn.addEventListener("mousedown", startResetHold);

resetBtn.addEventListener("touchend", cancelResetHold);
resetBtn.addEventListener("mouseup", cancelResetHold);
resetBtn.addEventListener("mouseleave", cancelResetHold);

function startResetHold() {
    resetHoldTimer = setTimeout(() => {
        openCheatModal();
        if (navigator.vibrate) navigator.vibrate(80);
    }, RESET_HOLD_DURATION);
}

function cancelResetHold() {
    clearTimeout(resetHoldTimer);
}
function openCheatModal() {
    const modal = document.getElementById("cheatModal");
    modal.classList.add("active");

    if (input) input.value;

    setTimeout(() => {
        document.getElementById("cheatInput").focus();
    }, 150);
        }

function closeCheatModal() {
    document.getElementById("cheatModal").classList.remove("active");
}

        function confirmCheat() {
    const code = document.getElementById("cheatInput").value.trim();

    if (code !== "Thala") {
        customAlert("Invalid cheat code.");
        return;
    }
   if (navigator.vibrate) navigator.vibrate(80);
    // ✅ CHEAT SUCCESS
    completedMissions = 9999;
    dailyImprovementCount = 0;

    localStorage.setItem("completedMissions", completedMissions);
    document.getElementById("missionCounter").textContent = completedMissions;

    document.getElementById("cheatInput").value = "";      

    closeCheatModal();

    showSmartNotification(
        "Cheat Activated",
        "9999 Improvement Points granted."
    );
        }

function skipDayCheat() {
  // Get current logical day
  const currentDay = lastImprovementDate
    ? new Date(lastImprovementDate)
    : new Date();

  // Move +1 day
  currentDay.setDate(currentDay.getDate() + 1);

  const nextDayKey = currentDay.toISOString().slice(0, 10);

  // Apply skip
  lastImprovementDate = nextDayKey;
  dailyImprovementCount = 0;

  localStorage.setItem("lastImprovementDate", nextDayKey);
  localStorage.setItem("dailyImprovementCount", "0");

  closeCheatModal();

  showSmartNotification(
    "⏭ Day Skipped",
    `New day activated (${nextDayKey})`
  );

  console.log("⏭ Day skipped to:", nextDayKey);
};

































