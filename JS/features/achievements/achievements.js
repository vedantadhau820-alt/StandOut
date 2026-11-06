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
    { id: "mission250", title: "Ultimate Legend", desc: "Complete 250 missions", unlocked: false },

    // Every 10 missions: 260 → 500
    { id: "mission260", title: "Elite Tenacity", desc: "Complete 260 missions", unlocked: false },
    { id: "mission270", title: "Relentless Force", desc: "Complete 270 missions", unlocked: false },
    { id: "mission280", title: "Master of Progress", desc: "Complete 280 missions", unlocked: false },
    { id: "mission290", title: "Unbreakable", desc: "Complete 290 missions", unlocked: false },
    { id: "mission300", title: "Three Hundred Triumphs", desc: "Complete 300 missions", unlocked: false },
    { id: "mission310", title: "Elite Performer", desc: "Complete 310 missions", unlocked: false },
    { id: "mission320", title: "Mission Commander", desc: "Complete 320 missions", unlocked: false },
    { id: "mission330", title: "Goal Dominator", desc: "Complete 330 missions", unlocked: false },
    { id: "mission340", title: "Task Conqueror", desc: "Complete 340 missions", unlocked: false },
    { id: "mission350", title: "Master of the Journey", desc: "Complete 350 missions", unlocked: false },
    { id: "mission360", title: "Limit Breaker", desc: "Complete 360 missions", unlocked: false },
    { id: "mission370", title: "Unstoppable Achiever", desc: "Complete 370 missions", unlocked: false },
    { id: "mission380", title: "Mission Legend", desc: "Complete 380 missions", unlocked: false },
    { id: "mission390", title: "Peak of Progress", desc: "Complete 390 missions", unlocked: false },
    { id: "mission400", title: "Four Hundred Triumphs", desc: "Complete 400 missions", unlocked: false },
    { id: "mission410", title: "Task Titan Elite", desc: "Complete 410 missions", unlocked: false },
    { id: "mission420", title: "Mission Vanguard", desc: "Complete 420 missions", unlocked: false },
    { id: "mission430", title: "Goal Master", desc: "Complete 430 missions", unlocked: false },
    { id: "mission440", title: "Legendary Progress", desc: "Complete 440 missions", unlocked: false },
    { id: "mission450", title: "Mission Grandmaster", desc: "Complete 450 missions", unlocked: false },
    { id: "mission460", title: "Beyond Greatness", desc: "Complete 460 missions", unlocked: false },
    { id: "mission470", title: "Task Overlord", desc: "Complete 470 missions", unlocked: false },
    { id: "mission480", title: "Ultimate Performer", desc: "Complete 480 missions", unlocked: false },
    { id: "mission490", title: "Legendary Streak", desc: "Complete 490 missions", unlocked: false },
    { id: "mission500", title: "Five Hundred Triumphs", desc: "Complete 500 missions", unlocked: false },

    // Every 20 missions: 520 → 2000

{ id: "mission520", title: "Relentless Achiever", desc: "Complete 520 missions", unlocked: false },
{ id: "mission540", title: "Unyielding Force", desc: "Complete 540 missions", unlocked: false },
{ id: "mission560", title: "Master of Discipline", desc: "Complete 560 missions", unlocked: false },
{ id: "mission580", title: "Limitless Drive", desc: "Complete 580 missions", unlocked: false },
{ id: "mission600", title: "Six Hundred Triumphs", desc: "Complete 600 missions", unlocked: false },
{ id: "mission620", title: "Unstoppable Force", desc: "Complete 620 missions", unlocked: false },
{ id: "mission640", title: "Elite Discipline", desc: "Complete 640 missions", unlocked: false },
{ id: "mission660", title: "Relentless Legend", desc: "Complete 660 missions", unlocked: false },
{ id: "mission680", title: "Master of Progress", desc: "Complete 680 missions", unlocked: false },
{ id: "mission700", title: "Seven Hundred Triumphs", desc: "Complete 700 missions", unlocked: false },
{ id: "mission720", title: "Beyond Limits", desc: "Complete 720 missions", unlocked: false },
{ id: "mission740", title: "Supreme Achiever", desc: "Complete 740 missions", unlocked: false },
{ id: "mission760", title: "Unbreakable Will", desc: "Complete 760 missions", unlocked: false },
{ id: "mission780", title: "Infinite Momentum", desc: "Complete 780 missions", unlocked: false },
{ id: "mission800", title: "Eight Hundred Triumphs", desc: "Complete 800 missions", unlocked: false },
{ id: "mission820", title: "Elite Performer", desc: "Complete 820 missions", unlocked: false },
{ id: "mission840", title: "Immortal Drive", desc: "Complete 840 missions", unlocked: false },
{ id: "mission860", title: "Legendary Force", desc: "Complete 860 missions", unlocked: false },
{ id: "mission880", title: "Master of Tenacity", desc: "Complete 880 missions", unlocked: false },
{ id: "mission900", title: "Nine Hundred Triumphs", desc: "Complete 900 missions", unlocked: false },
{ id: "mission920", title: "Limitless Achiever", desc: "Complete 920 missions", unlocked: false },
{ id: "mission940", title: "Ultimate Discipline", desc: "Complete 940 missions", unlocked: false },
{ id: "mission960", title: "Relentless Champion", desc: "Complete 960 missions", unlocked: false },
{ id: "mission980", title: "Legendary Momentum", desc: "Complete 980 missions", unlocked: false },
{ id: "mission1000", title: "Millennium Master", desc: "Complete 1000 missions", unlocked: false },
{ id: "mission1020", title: "Beyond Mastery", desc: "Complete 1020 missions", unlocked: false },
{ id: "mission1040", title: "Elite Tenacity", desc: "Complete 1040 missions", unlocked: false },
{ id: "mission1060", title: "Unstoppable Legend", desc: "Complete 1060 missions", unlocked: false },
{ id: "mission1080", title: "Master of Progress", desc: "Complete 1080 missions", unlocked: false },
{ id: "mission1100", title: "Eleven Hundred Triumphs", desc: "Complete 1100 missions", unlocked: false },
{ id: "mission1120", title: "Limitless Force", desc: "Complete 1120 missions", unlocked: false },
{ id: "mission1140", title: "Supreme Discipline", desc: "Complete 1140 missions", unlocked: false },
{ id: "mission1160", title: "Relentless Achiever", desc: "Complete 1160 missions", unlocked: false },
{ id: "mission1180", title: "Immortal Momentum", desc: "Complete 1180 missions", unlocked: false },
{ id: "mission1200", title: "Twelve Hundred Triumphs", desc: "Complete 1200 missions", unlocked: false },
{ id: "mission1220", title: "Elite Master", desc: "Complete 1220 missions", unlocked: false },
{ id: "mission1240", title: "Unbreakable Legend", desc: "Complete 1240 missions", unlocked: false },
{ id: "mission1260", title: "Infinite Achiever", desc: "Complete 1260 missions", unlocked: false },
{ id: "mission1280", title: "Master of Tenacity", desc: "Complete 1280 missions", unlocked: false },
{ id: "mission1300", title: "Thirteen Hundred Triumphs", desc: "Complete 1300 missions", unlocked: false },
{ id: "mission1320", title: "Limitless Champion", desc: "Complete 1320 missions", unlocked: false },
{ id: "mission1340", title: "Relentless Force", desc: "Complete 1340 missions", unlocked: false },
{ id: "mission1360", title: "Elite Momentum", desc: "Complete 1360 missions", unlocked: false },
{ id: "mission1380", title: "Unstoppable Achiever", desc: "Complete 1380 missions", unlocked: false },
{ id: "mission1400", title: "Fourteen Hundred Triumphs", desc: "Complete 1400 missions", unlocked: false },
{ id: "mission1420", title: "Beyond Limits", desc: "Complete 1420 missions", unlocked: false },
{ id: "mission1440", title: "Supreme Achiever", desc: "Complete 1440 missions", unlocked: false },
{ id: "mission1460", title: "Immortal Legend", desc: "Complete 1460 missions", unlocked: false },
{ id: "mission1480", title: "Master of Progress", desc: "Complete 1480 missions", unlocked: false },
{ id: "mission1500", title: "Fifteen Hundred Triumphs", desc: "Complete 1500 missions", unlocked: false },
{ id: "mission1520", title: "Elite Discipline", desc: "Complete 1520 missions", unlocked: false },
{ id: "mission1540", title: "Relentless Legend", desc: "Complete 1540 missions", unlocked: false },
{ id: "mission1560", title: "Unbreakable Force", desc: "Complete 1560 missions", unlocked: false },
{ id: "mission1580", title: "Infinite Drive", desc: "Complete 1580 missions", unlocked: false },
{ id: "mission1600", title: "Sixteen Hundred Triumphs", desc: "Complete 1600 missions", unlocked: false },
{ id: "mission1620", title: "Limitless Achiever", desc: "Complete 1620 missions", unlocked: false },
{ id: "mission1640", title: "Elite Performer", desc: "Complete 1640 missions", unlocked: false },
{ id: "mission1660", title: "Unstoppable Force", desc: "Complete 1660 missions", unlocked: false },
{ id: "mission1680", title: "Master of Tenacity", desc: "Complete 1680 missions", unlocked: false },
{ id: "mission1700", title: "Seventeen Hundred Triumphs", desc: "Complete 1700 missions", unlocked: false },
{ id: "mission1720", title: "Relentless Champion", desc: "Complete 1720 missions", unlocked: false },
{ id: "mission1740", title: "Beyond Mastery", desc: "Complete 1740 missions", unlocked: false },
{ id: "mission1760", title: "Immortal Achiever", desc: "Complete 1760 missions", unlocked: false },
{ id: "mission1780", title: "Legendary Momentum", desc: "Complete 1780 missions", unlocked: false },
{ id: "mission1800", title: "Eighteen Hundred Triumphs", desc: "Complete 1800 missions", unlocked: false },
{ id: "mission1820", title: "Supreme Discipline", desc: "Complete 1820 missions", unlocked: false },
{ id: "mission1840", title: "Infinite Force", desc: "Complete 1840 missions", unlocked: false },
{ id: "mission1860", title: "Unbreakable Legend", desc: "Complete 1860 missions", unlocked: false },
{ id: "mission1880", title: "Elite Tenacity", desc: "Complete 1880 missions", unlocked: false },
{ id: "mission1900", title: "Nineteen Hundred Triumphs", desc: "Complete 1900 missions", unlocked: false },
{ id: "mission1920", title: "Limitless Legend", desc: "Complete 1920 missions", unlocked: false },
{ id: "mission1940", title: "Relentless Achiever", desc: "Complete 1940 missions", unlocked: false },
{ id: "mission1960", title: "Master of Progress", desc: "Complete 1960 missions", unlocked: false },
{ id: "mission1980", title: "Unstoppable Force", desc: "Complete 1980 missions", unlocked: false },
{ id: "mission2000", title: "Two Thousand Triumphs", desc: "Complete 2000 missions", unlocked: false },
];

// =========================================================
// ACHIEVEMENT DATA SYNC
// =========================================================

function syncAchievements() {

    let savedAchievements = [];

    try {
        const stored =
            JSON.parse(localStorage.getItem("achievements"));

        if (Array.isArray(stored)) {
            // Ignore malformed entries before accessing achievement properties.
            savedAchievements = stored.filter(
                item => item && typeof item === "object" && !Array.isArray(item)
            );
        }

    } catch (error) {

        console.warn(
            "Failed to load saved achievements:",
            error
        );

    }

    // Build the new achievement list
    // using the CURRENT achievements array
    const syncedAchievements = achievements.map(current => {

        const old = savedAchievements.find(
            saved => saved.id === current.id
        );

        // New achievement
        if (!old) {

            return {
                ...current,
                unlocked: false,
                unlockedAt: null
            };

        }

        // Existing achievement
        // Keep progress, but use current
        // title / description / order.
        return {
            ...current,
            unlocked: old.unlocked === true,
            unlockedAt: old.unlockedAt || null
        };

    });

    // Save the synchronized list
    localStorage.setItem(
        "achievements",
        JSON.stringify(syncedAchievements)
    );

    return syncedAchievements;
}


// Actual achievement data used by the app
let achievementsData = syncAchievements();


// Add any new achievement definitions that
// don't exist in the user's saved data.
//
// This allows old users who previously had
// achievements only up to 250 to receive
// the newer achievements up to 1000.

const savedAchievementMap =
    new Map(
        achievementsData.map(
            achievement => [
                achievement.id,
                achievement
            ]
        )
    );

achievements.forEach(achievement => {

    if (!savedAchievementMap.has(achievement.id)) {

        achievementsData.push({
            ...achievement
        });

    }

});

// Save the migrated achievement list
localStorage.setItem(
    "achievements",
    JSON.stringify(achievementsData)
);

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
let achievementsExpanded = false;

function renderAchievements() {
    const container = document.getElementById("achievementsViewer");

    if (!container) return;

    container.replaceChildren();

    let displayList;

    /*
     * ============================
     * EXPANDED VIEW
     * ============================
     */
    if (achievementsExpanded) {

        displayList = achievementsData;

    }

    /*
     * ============================
     * COLLAPSED VIEW
     * ============================
     *
     * Show:
     * - 5 previous achievements
     * - 5 upcoming achievements
     *
     * The first locked achievement is
     * considered the next achievement.
     */
    else {

        const nextIndex = achievementsData.findIndex(
            achievement => !achievement.unlocked
        );

        /*
         * If all achievements are unlocked,
         * show the final 5.
         */
        if (nextIndex === -1) {

            displayList = achievementsData.slice(-5);

        }

        /*
         * Otherwise show:
         *
         * [previous 5] [next 5]
         */
        else {

            const previousStart =
                Math.max(0, nextIndex - 5);

            const previousAchievements =
                achievementsData.slice(
                    previousStart,
                    nextIndex
                );

            const upcomingAchievements =
                achievementsData.slice(
                    nextIndex,
                    nextIndex + 5
                );

            displayList = [
                ...previousAchievements,
                ...upcomingAchievements
            ];
        }
    }

    /*
     * ============================
     * RENDER ACHIEVEMENTS
     * ============================
     */

    displayList.forEach(achievement => {

        const tile = document.createElement("div");

        tile.className =
            "achievement-tile" +
            (achievement.unlocked ? "" : " locked");

        const iconContainer = document.createElement("div");
        iconContainer.className = "achievement-icon";

        const icon = document.createElement("i");
        icon.className = achievement.unlocked
            ? "fas fa-trophy"
            : "fas fa-lock";
        iconContainer.appendChild(icon);

        const title = document.createElement("div");
        title.className = "achievement-title";
        title.textContent = String(achievement.title ?? "");

        const description = document.createElement("div");
        description.className = "achievement-desc";
        description.textContent = String(achievement.desc ?? "");

        tile.append(iconContainer, title, description);

        if (achievement.unlocked && achievement.unlockedAt) {
            const date = document.createElement("div");
            date.className = "achievement-date";
            date.textContent = `Achieved on: ${String(achievement.unlockedAt)}`;
            tile.appendChild(date);
        }

        container.appendChild(tile);
    });

    /*
     * ============================
     * EXPAND / COLLAPSE BUTTON
     * ============================
     */

    if (achievementsData.length > 10) {

        const toggle =
            document.createElement("button");

        toggle.type = "button";

        toggle.className =
            "achievements-toggle";

        const toggleLabel = document.createElement("span");
        toggleLabel.textContent = achievementsExpanded ? "Show Recent" : "View All";

        const toggleIcon = document.createElement("i");
        toggleIcon.className = achievementsExpanded
            ? "fas fa-chevron-up"
            : "fas fa-chevron-down";
        toggleIcon.setAttribute("aria-hidden", "true");

        toggle.append(toggleLabel, document.createTextNode(" "), toggleIcon);

        toggle.addEventListener("click", () => {

            achievementsExpanded =
                !achievementsExpanded;

            renderAchievements();
        });

        container.appendChild(toggle);
    }
}

/* Unlock an achievement */
function unlockAchievement(id) {
    const ach = achievementsData.find(a => a.id === id);

    if (ach && !ach.unlocked) {
        ach.unlocked = true;

        /* =====================================================
   SEASON XP
===================================================== */

        if (
            window.StandOutSeason &&
            typeof window.StandOutSeason.addXP === "function"
        ) {

            window.StandOutSeason.addXP(
                25,
                "Achievement"
            );

        }
        ach.unlockedAt = new Date().toDateString(); // 🔥 ADD THIS

        localStorage.setItem("achievements", JSON.stringify(achievementsData));

        pushNotification("🏆 New Achievement", `You unlocked: "${ach.title}"`);
        showAchievementPopup(ach.title, ach.desc);
        renderAchievements();

        if (typeof window.updateMissionProgressCounters === "function") {
            window.updateMissionProgressCounters();
        }
    }
}

function showAchievementPopup(title, desc) {
    window.isAchievementPlaying = true;

    const popup = document.createElement("div");
    popup.className = "achievement-popup";

    const heading = document.createElement("h3");
    heading.textContent = String(title ?? "");
    const description = document.createElement("p");
    description.textContent = String(desc ?? "");
    popup.append(heading, description);
    document.body.appendChild(popup);

    // const audio = new Audio("Music/Achievements.mp3");
    // audio.volume = 0.5;
    // audio.play().catch(() => { });

    // audio.onended = () => { window.isAchievementPlaying = false; };
    const audio = playAppTone("achievement");

    if (audio) {
        window.isAchievementPlaying = true;

        audio.onended = () => {
            window.isAchievementPlaying = false;
        };
    } else {
        window.isAchievementPlaying = false;
    }

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
    }, 1500);
}

/* =========================================================
   MISSION MILESTONES AND PROGRESS INDICATORS
========================================================= */

function checkMissionAchievements(milestones = [], completedCount = 0) {
    const completed = Number(completedCount) || 0;
    (Array.isArray(milestones) ? milestones : []).forEach(milestone => {
        if (completed === Number(milestone)) unlockAchievement(`mission${milestone}`);
    });
}

function updateMissionProgressCounters({
    dailyCap = 10,
    dailyCount = window.dailyImprovementCount,
    completedCount = window.completedMissionCount,
    milestones = []
} = {}) {
    const cap = Number(dailyCap) || 11;
    const currentDailyCount = Math.min(cap, Math.max(
        0,
        Number(localStorage.getItem("dailyImprovementCount")) || Number(dailyCount) || 0
    ));
    const remaining = Math.max(0, cap - currentDailyCount);

    const capCount = document.getElementById("dailyCapCount");
    const capRemaining = document.getElementById("dailyCapRemaining");
    const capBar = document.getElementById("dailyCapBar");
    const capTrack = capBar?.parentElement;

    if (capCount) capCount.textContent = `${currentDailyCount} / ${cap}`;
    if (capRemaining) {
        capRemaining.textContent = remaining === 0
            ? "Normal-task IP cap reached — Hardcore rewards remain unlimited"
            : `${remaining} normal task${remaining === 1 ? "" : "s"} left to earn IP`;
    }
    if (capBar) capBar.style.width = `${Math.min(100, (currentDailyCount / cap) * 100)}%`;
    if (capTrack) {
        capTrack.setAttribute("aria-valuemax", String(cap));
        capTrack.setAttribute("aria-valuenow", String(currentDailyCount));
    }

    const completed = Math.max(0, Number(completedCount) || 0);
    const sortedMilestones = (Array.isArray(milestones) ? milestones : [])
        .map(Number)
        .filter(threshold => Number.isFinite(threshold) && threshold > 0)
        .sort((left, right) => left - right);
    const nextThreshold = sortedMilestones.find(threshold => threshold > completed);

    const nextCount = document.getElementById("nextAchievementRemaining");
    const nextDetail = document.getElementById("nextAchievementDetail");
    const nextBar = document.getElementById("nextAchievementBar");
    const nextTrack = nextBar?.parentElement;

    if (nextThreshold === undefined) {
        if (nextCount) nextCount.textContent = "Complete";
        if (nextDetail) nextDetail.textContent = "All mission milestones have been reached.";
        if (nextBar) nextBar.style.width = "100%";
        if (nextTrack) {
            nextTrack.setAttribute("aria-valuemax", "1");
            nextTrack.setAttribute("aria-valuenow", "1");
        }
        return;
    }

    const previousThreshold = sortedMilestones
        .filter(threshold => threshold < nextThreshold)
        .reduce((max, threshold) => Math.max(max, threshold), 0);
    const needed = nextThreshold - completed;
    const progress = nextThreshold > previousThreshold
        ? Math.max(0, Math.min(100,
            ((completed - previousThreshold) / (nextThreshold - previousThreshold)) * 100))
        : 0;

    const matchingAchievement = Array.isArray(achievementsData)
        ? achievementsData.find(achievement => achievement.id === `mission${nextThreshold}`)
        : null;
    const achievementTitle = matchingAchievement?.title || `Mission ${nextThreshold}`;

    if (nextCount) nextCount.textContent = `${needed} task${needed === 1 ? "" : "s"}`;
    if (nextDetail) nextDetail.textContent = `${achievementTitle} · ${completed} / ${nextThreshold} missions`;
    if (nextBar) nextBar.style.width = `${progress}%`;
    if (nextTrack) {
        nextTrack.setAttribute("aria-valuemax", String(nextThreshold));
        nextTrack.setAttribute("aria-valuenow", String(completed));
    }
}

/* =========================================================
   MOTIVATION POPUP
========================================================= */



function showMotivationPopup(achievementText) {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    document.getElementById("motivationQuote").innerText = randomQuote;
    document.getElementById("achievement").innerText = achievementText;

    const popup = document.getElementById("motivationPopup");
    popup.style.display = "flex";

    if (!window.isAchievementPlaying) {
        const sound = document.getElementById("popupSound");
        sound.currentTime = 0;
        sound.volume = 1.0;
        sound.play().catch(() => {});
    }
}

function closeMotivationPopup() {
    const popup = document.getElementById("motivationPopup");
    if (!popup) return;
    const content = popup.querySelector(".popup-content");
    if (!content) {
        popup.style.display = "none";
        return;
    }
    content.style.animation = "fadeOut 0.3s ease forwards";
    setTimeout(() => {
        popup.style.display = "none";
        content.style.animation = "popIn 0.4s ease forwards";
    }, 300);
}

/* =========================================================
   MODULE API AND LEGACY COMPATIBILITY
========================================================= */

export const achievementsFeature = Object.freeze({
    get definitions() { return achievements; },
    get data() { return achievementsData; },
    set data(value) { achievementsData = value; },
    sync: syncAchievements,
    render: renderAchievements,
    unlock: unlockAchievement,
    showPopup: showAchievementPopup,
    checkMissionAchievements,
    updateMissionProgressCounters,
    showMotivationPopup,
    closeMotivationPopup
});

// Existing classic scripts and inline handlers still resolve these names.
Object.defineProperties(window, {
    achievements: {
        configurable: true,
        enumerable: true,
        get: () => achievements
    },
    achievementsData: {
        configurable: true,
        enumerable: true,
        get: () => achievementsData,
        set: value => { achievementsData = value; }
    }
});

window.syncAchievements = syncAchievements;
window.renderAchievements = renderAchievements;
window.unlockAchievement = unlockAchievement;
window.showAchievementPopup = showAchievementPopup;