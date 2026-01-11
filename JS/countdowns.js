/* =========================================================
   COUNTDOWNS MODULE
========================================================= */

let countdowns =
  JSON.parse(localStorage.getItem("countdowns")) || [];


/* -------------------------
   SAVE
------------------------- */
function saveCountdowns() {
  localStorage.setItem(
    "countdowns",
    JSON.stringify(countdowns)
  );
}


/* -------------------------
   ADD COUNTDOWN
------------------------- */
function addCountdown() {
  const titleInput =
    document.getElementById("countdownTitle");
  const timeInput =
    document.getElementById("countdownDateTime");

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

  countdowns.push({
    title,
    date: new Date(dateTime).toISOString(),
    startTime: new Date().toISOString()
  });

  saveCountdowns();
  renderCountdowns();

  titleInput.value = "";
  timeInput.value = "";

  closeModal();
}


/* -------------------------
   REMOVE COUNTDOWN
------------------------- */
function removeCountdown(index) {
  countdowns.splice(index, 1);
  saveCountdowns();
  renderCountdowns();
}


/* -------------------------
   RENDER COUNTDOWNS
------------------------- */
function renderCountdowns() {
  const list =
    document.getElementById("countdown-list");

  list.innerHTML = "";

  document.getElementById("countdownCounter")
    .textContent = countdowns.length;

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
          <div class="timer-bar"
               id="timerbar-${index}">
          </div>
        </div>
        <div class="timer-text"
             id="timer-${index}">
        </div>
      </div>

      <button class="remove-btn2"
              onclick="removeCountdown(${index})">
        Remove
      </button>
    `;

    list.appendChild(div);
  });

  updateTimers();
}


/* -------------------------
   UPDATE COUNTDOWN TIMERS
------------------------- */
function updateTimers() {
  clearInterval(window.timerInterval);

  window.timerInterval = setInterval(() => {
    countdowns.forEach((c, index) => {
      const now = Date.now();
      const target =
        new Date(c.date).getTime();
      const diff = target - now;

      const totalDuration =
        target -
        new Date(
          countdowns[index].startTime || c.date
        ).getTime();

      let percent =
        (diff / totalDuration) * 100;

      if (percent < 0) percent = 0;
      if (percent > 100) percent = 100;

      const bar =
        document.getElementById(
          `timerbar-${index}`
        );

      if (bar)
        bar.style.width = percent + "%";

      // 🔔 1 hour warning (once)
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
        document.getElementById(
          `timer-${index}`
        );

      if (!el) return;

      if (diff <= 0) {
        el.style.color = "red";
        el.textContent = "Time's up!";
        return;
      }

      const days =
        Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours =
        Math.floor(
          (diff %
            (1000 * 60 * 60 * 24)) /
            (1000 * 60 * 60)
        );
      const mins =
        Math.floor(
          (diff %
            (1000 * 60 * 60)) /
            (1000 * 60)
        );
      const secs =
        Math.floor(
          (diff % (1000 * 60)) / 1000
        );

      el.textContent =
        `${days}d ${hours}h ${mins}m ${secs}s`;
    });
  }, 1000);
}
