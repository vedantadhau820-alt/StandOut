/* =========================================================
   COUNTDOWNS MODULE
========================================================= */

/* -------------------------
   SAVE
------------------------- */
window.saveCountdowns = function () {
  localStorage.setItem(
    "countdowns",
    JSON.stringify(window.countdowns)
  );
};

/* -------------------------
   ADD COUNTDOWN
------------------------- */
window.addCountdown = function () {
  const titleInput =
    document.getElementById("countdownTitle");
  const timeInput =
    document.getElementById("countdownDateTime");

  if (!titleInput || !timeInput) return;

  const title = titleInput.value.trim();
  const dateTime = timeInput.value;

  if (!title || !dateTime) {
    closeModal();
    return;
  }

  if (isPastDateTime(dateTime)) {
    customAlert("Countdown time cannot be in the past.");
    return;
  }

  window.countdowns.push({
    title,
    date: new Date(dateTime).toISOString(),
    startTime: new Date().toISOString()
  });

  saveCountdowns();
  renderCountdowns();

  titleInput.value = "";
  timeInput.value = "";

  closeModal();
};

/* -------------------------
   REMOVE COUNTDOWN
------------------------- */
window.removeCountdown = function (index) {
  window.countdowns.splice(index, 1);
  saveCountdowns();
  renderCountdowns();
};

/* -------------------------
   RENDER COUNTDOWNS
------------------------- */
window.renderCountdowns = function () {
  const list =
    document.getElementById("countdown-list");

  if (!list) return;

  list.innerHTML = "";

  const counter =
    document.getElementById("countdownCounter");
  if (counter) counter.textContent = window.countdowns.length;

  if (window.countdowns.length === 0) {
    list.textContent = "No countdowns added";
    return;
  }

  window.countdowns.forEach((c, index) => {
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

      <button class="remove-btn2"
              onclick="removeCountdown(${index})">
        Remove
      </button>
    `;

    list.appendChild(div);
  });

  updateTimers();
};

/* -------------------------
   UPDATE TIMERS
------------------------- */
window.updateTimers = function () {
  clearInterval(window.timerInterval);

  window.timerInterval = setInterval(() => {
    window.countdowns.forEach((c, index) => {
      const now = Date.now();
      const target = new Date(c.date).getTime();
      const diff = target - now;

      const totalDuration =
        target -
        new Date(c.startTime || c.date).getTime();

      let percent = (diff / totalDuration) * 100;
      percent = Math.max(0, Math.min(100, percent));

      const bar =
        document.getElementById(`timerbar-${index}`);
      if (bar) bar.style.width = percent + "%";

      if (
        diff > 0 &&
        diff <= 60 * 60 * 1000 &&
        !c.warned
      ) {
        c.warned = true;
        pushNotification(
          "Countdown Ending Soon",
          `"${c.title}" ends in 1 hour`
        );
      }

      const el =
        document.getElementById(`timer-${index}`);
      if (!el) return;

      if (diff <= 0) {
        el.style.color = "red";
        el.textContent = "Time's up!";
        return;
      }

      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);

      el.textContent =
        `${days}d ${hours}h ${mins}m ${secs}s`;
    });
  }, 1000);
};
