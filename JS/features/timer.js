/**
 * Full-screen focus timer feature.
 * Preserves the existing timer markup and classic global entry points.
 */

function setDisplay(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = String(value).padStart(2, "0");
}

function stopStaticTimer() {
    if (window.timerInterval) {
        clearInterval(window.timerInterval);
        window.timerInterval = null;
    }
}

function resetTimerDisplay() {
    setDisplay("h", 0);
    setDisplay("m", 0);
    setDisplay("s", 0);
}

function openFullscreen() {
    const screen = document.getElementById("timerScreen");
    const topNav = document.querySelector(".top-navbar");
    const bottomNav = document.querySelector(".bottom-nav");
    if (screen) screen.style.display = "block";
    if (topNav) topNav.style.display = "none";
    if (bottomNav) bottomNav.style.display = "none";
}

function closeFullscreen() {
    const screen = document.getElementById("timerScreen");
    const topNav = document.querySelector(".top-navbar");
    const bottomNav = document.querySelector(".bottom-nav");
    if (screen) screen.style.display = "none";
    if (topNav) topNav.style.display = "flex";
    if (bottomNav) bottomNav.style.display = "flex";

    stopStaticTimer();
    resetTimerDisplay();
    window.stopAllAppAudio?.();
    window.music?.pause?.();
    if (window.music) window.music.currentTime = 0;
}

function openSettings() {
    document.getElementById("timerSettingModal")?.classList.add("active");
}

function closeTimerSettingModal() {
    document.getElementById("timerSettingModal")?.classList.remove("active");
}

function startStaticTimer(hours, minutes, seconds) {
    const values = [hours, minutes, seconds].map(Number);
    const [h, m, s] = values;
    if (!values.every(Number.isInteger) || h < 0 || h > 23 || m < 0 || m > 59 || s < 0 || s > 59) {
        window.customAlert?.("Enter valid timer values.");
        return false;
    }

    let total = h * 3600 + m * 60 + s;
    if (total <= 0) {
        window.customAlert?.("Set a timer greater than zero.");
        return false;
    }

    stopStaticTimer();
    setDisplay("h", h);
    setDisplay("m", m);
    setDisplay("s", s);

    window.timerInterval = setInterval(() => {
        if (total <= 0) {
            stopStaticTimer();
            window.stopAllAppAudio?.();
            return;
        }

        total -= 1;
        setDisplay("h", Math.floor(total / 3600));
        setDisplay("m", Math.floor((total % 3600) / 60));
        setDisplay("s", total % 60);
    }, 1000);

    return true;
}

function applyTimerSettings() {
    const h = Number.parseInt(document.getElementById("setH")?.value, 10);
    const m = Number.parseInt(document.getElementById("setM")?.value, 10);
    const s = Number.parseInt(document.getElementById("setS")?.value, 10);

    if (startStaticTimer(h, m, s)) closeTimerSettingModal();
}

function initialize() {
    document.getElementById("timerIcon")?.addEventListener("click", openFullscreen);
    document.getElementById("timerCloseBtn")?.addEventListener("click", closeFullscreen);
    document.getElementById("timerSettingsBtn")?.addEventListener("click", openSettings);
}

export const timer = Object.freeze({
    initialize,
    openFullscreen,
    closeFullscreen,
    openSettings,
    closeTimerSettingModal,
    applyTimerSettings,
    startStaticTimer,
    stopStaticTimer,
    resetTimerDisplay
});
