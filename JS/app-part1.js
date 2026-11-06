
// Service worker registration is handled once from index.html using a
// document-relative URL. Avoid a second origin-root registration here.

function getISTDate() {
    return window.StandOutCore?.dailyCycle?.getISTDate() ||
        new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
}
function getTodayKey() {
    return window.StandOutCore?.dailyCycle?.getTodayKey() ||
        new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit"
        }).format(new Date());
}
function enforceDailyReset() {
    return window.StandOutCore?.dailyCycle?.enforceDailyReset();
}

// Backup and restore are implemented by JS/features/data/backup.js and restore.js.

// Daily improvement state is owned by JS/features/data/daily-cycle.js.



// Owned-card state is owned by JS/features/cards/marketplace.js.
// Marketplace implementation is owned by JS/features/cards/marketplace.js.

/* =========================================================
   MUSIC PLAYER — LEGACY COMPATIBILITY BRIDGES
========================================================= */
function cacheAllMusic() { return window.StandOutCore?.music?.cacheAllMusic(); }
function getCachedMusicURL(file) { return window.StandOutCore?.music?.getCachedMusicURL(file); }
function stopAllMusic() { return window.StandOutCore?.music?.stopAllMusic(); }
function openFolderPicker() { return window.StandOutCore?.music?.openFolderPicker(); }
function resumeMusicOnUserGesture() { return window.StandOutCore?.music?.resumeMusicOnUserGesture(); }
function playCurrentTrack() { return window.StandOutCore?.music?.playCurrentTrack(); }
function setSelectedMusic() { return window.StandOutCore?.music?.setSelectedMusic(); }
function showPresetUI() { return window.StandOutCore?.music?.showPresetUI(); }
function hidePresetUI() { return window.StandOutCore?.music?.hidePresetUI(); }
function closeMusicModal() { return window.StandOutCore?.music?.closeMusicModal(); }

// =========================
//   NOTIFICATION SYSTEM
// =========================

// Notification state and behavior are owned by the modular Notifications feature.

/* =========================================================
1. GLOBAL VARIABLES + STORED DATA
========================================================= */
// Improvement Points balance is owned by JS/features/economy/points.js.
// Mission history state is owned by JS/features/missions/history.js.
// Completed mission count state is owned by the Mission Completion feature.
window.addEventListener("load", () => {
    checkMissedDeadlines();
});

/* =========================================================
   MONTHLY REPORT — PERFORMANCE HISTORY
========================================================= */
