/**
 * Countdown feature: creation, persistence, rendering, removal, and live timers.
 * Keeps the existing `countdowns` LocalStorage key and record shape intact.
 */
import { storage } from "../../core/storage.js";

const STORAGE_KEY = "countdowns";
const ONE_HOUR = 60 * 60 * 1000;
const SECOND = 1000;

// This feature owns countdown state. The window accessor is retained for
// existing backup/restore/reset integrations and classic-script consumers.
let countdownItems = storage.local.getJSON(STORAGE_KEY, []);
if (!Array.isArray(countdownItems)) countdownItems = [];

Object.defineProperty(window, "countdowns", {
    configurable: true,
    enumerable: true,
    get: () => countdownItems,
    set: value => {
        countdownItems = Array.isArray(value) ? value : [];
    }
});

function getCountdowns() {
    return countdownItems;
}

function saveCountdowns() {
    storage.local.setJSON(STORAGE_KEY, getCountdowns());
}

function addCountdown() {
    const titleInput = document.getElementById("countdownTitle");
    const timeInput = document.getElementById("countdownDateTime");
    if (!titleInput || !timeInput) return;

    const title = titleInput.value.trim();
    const dateTime = timeInput.value;

    if (!title || !dateTime) {
        window.customAlert?.("Please enter both a title and a date/time.");
        return;
    }

    // datetime-local contains a wall-clock value without a timezone. The app
    // stores countdown targets as explicit IST instants for consistent results.
    const [datePart, timePart] = dateTime.split("T");
    if (!datePart || !timePart) {
        window.customAlert?.("Please enter a valid countdown date and time.");
        return;
    }
    const targetIST = new Date(`${datePart}T${timePart}:00+05:30`);
    if (Number.isNaN(targetIST.getTime())) {
        window.customAlert?.("Please enter a valid countdown date and time.");
        return;
    }
    if (targetIST.getTime() <= Date.now()) {
        window.customAlert?.("Countdown time must be in the future.");
        return;
    }

    getCountdowns().push({
        title,
        date: targetIST.toISOString(),
        startTime: new Date().toISOString()
    });

    saveCountdowns();
    renderCountdowns();
    titleInput.value = "";
    timeInput.value = "";
    window.closeModal?.();
}

function removeCountdown(index) {
    const items = getCountdowns();
    if (!Number.isInteger(index) || index < 0 || index >= items.length) return;
    items.splice(index, 1);
    saveCountdowns();
    renderCountdowns();
}

function renderCountdowns() {
    const list = document.getElementById("countdown-list");
    const counter = document.getElementById("countdownCounter");
    const items = getCountdowns();
    if (counter) counter.textContent = String(items.length);
    if (!list) return;

    list.replaceChildren();
    if (items.length === 0) {
        list.textContent = "No countdowns added";
        updateTimers();
        return;
    }

    items.forEach((countdown, index) => {
        const card = document.createElement("div");
        card.className = "goal show";

        const title = document.createElement("strong");
        title.textContent = String(countdown.title ?? "Untitled countdown");

        const timerRow = document.createElement("div");
        timerRow.className = "timer-row";
        const barContainer = document.createElement("div");
        barContainer.className = "timer-bar-container";
        const bar = document.createElement("div");
        bar.className = "timer-bar";
        bar.id = `timerbar-${index}`;
        barContainer.appendChild(bar);
        const timerText = document.createElement("div");
        timerText.className = "timer-text";
        timerText.id = `timer-${index}`;
        timerRow.append(barContainer, timerText);

        const removeButton = document.createElement("button");
        removeButton.className = "remove-btn2";
        removeButton.type = "button";
        removeButton.textContent = "Remove";
        removeButton.addEventListener("click", () => removeCountdown(index));

        card.append(title, timerRow, removeButton);
        list.appendChild(card);
    });

    updateTimers();
}

function updateTimers() {
    if (window.countdownTimerInterval) window.clearInterval(window.countdownTimerInterval);
    window.countdownTimerInterval = null;

    if (getCountdowns().length === 0) return;

    window.countdownTimerInterval = window.setInterval(() => {
        getCountdowns().forEach((countdown, index) => {
            const target = new Date(countdown.date).getTime();
            const now = Date.now();
            const diff = target - now;
            const start = new Date(countdown.startTime || countdown.date).getTime();
            const totalDuration = target - start;
            let percent = totalDuration > 0 ? (diff / totalDuration) * 100 : 0;
            percent = Math.max(0, Math.min(100, percent));

            const bar = document.getElementById(`timerbar-${index}`);
            if (bar) bar.style.width = `${percent}%`;

            if (diff > 0 && diff <= ONE_HOUR && !countdown.warned) {
                countdown.warned = true;
                window.pushNotification?.("Countdown Ending Soon", `"${countdown.title}" ends in 1 hour`);
            }

            const element = document.getElementById(`timer-${index}`);
            if (!element) return;
            if (diff <= 0) {
                element.style.color = "red";
                element.textContent = "Time's up!";
                return;
            }

            const days = Math.floor(diff / (24 * ONE_HOUR));
            const hours = Math.floor((diff % (24 * ONE_HOUR)) / ONE_HOUR);
            const minutes = Math.floor((diff % ONE_HOUR) / 60000);
            const seconds = Math.floor((diff % 60000) / SECOND);
            element.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        });
    }, SECOND);
}

export const countdownsFeature = Object.freeze({
    saveCountdowns,
    addCountdown,
    removeCountdown,
    renderCountdowns,
    updateTimers
});

// Preserve the global API used by inline handlers and backup/restore scripts.
window.saveCountdowns = saveCountdowns;
window.addCountdown = addCountdown;
window.removeCountdown = removeCountdown;
window.renderCountdowns = renderCountdowns;
window.updateTimers = updateTimers;
