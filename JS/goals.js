/* =========================================================
   GOALS MODULE
========================================================= */


/* -------------------------
   ADD GOAL
------------------------- */
window.addGoal() {
  const goalText =
    document.getElementById("goalInput").value.trim();
  const priority =
    document.getElementById("priorityInput").value;
  const deadline =
    document.getElementById("goalDeadline").value;

  if (isPastDateTime(deadline)) {
    customAlert("Deadline cannot be in the past.");
    return;
  }

  if (!goalText) {
    closeModal();
    return;
  }

  const div = document.createElement("div");
  div.className = "goal show";
  div.dataset.deadline = deadline;

  let formattedDeadline = "";
  if (deadline) {
    const d = new Date(deadline);
    formattedDeadline = d.toLocaleDateString([], {
      day: "numeric",
      month: "short"
    });
  }

  div.innerHTML = `
    <div class="goal-header">
      <span class="goal-title">${goalText} -</span>
      <span class="goal-priority ${priority}">
        <strong>${priority}</strong>
      </span>
    </div>

    <div class="goal-subrow">
      <span class="goal-deadline">${formattedDeadline}</span>
      <span class="goal-overdue"></span>
      <button class="remove-btn" onclick="removeGoal(this)">Remove</button>
    </div>

    <div class="goal-timer"
         style="margin-top:6px;font-size:14px;opacity:.9;">
    </div>
  `;

  document.getElementById("goal-list").appendChild(div);

  saveData();
  closeModal();
}


/* -------------------------
   REMOVE GOAL
------------------------- */
window.removeGoal(btn) {
  const goalDiv = btn.closest(".goal");
  if (!goalDiv) return;

  goalDiv.remove();
  saveData();
}


/* -------------------------
   UPDATE GOAL TIMERS
------------------------- */
function updateGoalTimers() {
  const goals =
    document.querySelectorAll("#goal-list .goal");

  goals.forEach(goal => {
    const deadline = goal.dataset.deadline;
    if (!deadline) return;

    const timer =
      goal.querySelector(".goal-timer");
    const overdueBadge =
      goal.querySelector(".goal-overdue");

    const diff =
      new Date(deadline).getTime() - Date.now();

    if (diff > 0) {
      const hours =
        Math.floor(diff / (1000 * 60 * 60));
      const minutes =
        Math.floor((diff / (1000 * 60)) % 60);

      timer.textContent =
        `${hours}h ${minutes}m left`;
      overdueBadge.innerHTML = "";

      // 🔔 Due soon warning (once)
      if (
        diff <= 2 * 60 * 60 * 1000 &&
        !goal.dataset.warned
      ) {
        goal.dataset.warned = "true";
        pushNotification(
          "Goal Reminder",
          `Your goal "${goal
            .querySelector(".goal-title")
            .textContent}" is due soon (within 2 hours).`
        );
      }

    } else {
      timer.textContent = "";
      overdueBadge.innerHTML =
        `<span class="overdue-badge">Overdue</span>`;

      // 🔔 Overdue notification (once)
      if (!goal.dataset.overdueNotified) {
        goal.dataset.overdueNotified = "true";
        pushNotification(
          "⚠ Goal Overdue",
          `"${goal
            .querySelector(".goal-title")
            .textContent}" deadline has passed!`
        );
      }
    }
  });
}


/* -------------------------
   RESTORE GOALS AFTER LOAD
------------------------- */
function restoreGoalsUI() {
  document
    .querySelectorAll("#goal-list .goal")
    .forEach(div => {
      div.classList.add("show");

      const removeBtn =
        div.querySelector(".remove-btn");

      if (removeBtn) {
        removeBtn.onclick = () =>
          removeGoal(removeBtn);
      }
    });
}


/* -------------------------
   AUTO TIMER LOOP
------------------------- */
setInterval(updateGoalTimers, 1000);
