// Startup orchestration is owned by JS/features/startup.js.
// Keep immediate goal-card reveal/binding here because it historically runs
// during classic-script evaluation, before deferred modules execute.
document.querySelectorAll("#goal-list .goal").forEach(div => {
    div.classList.add("show");
    const removeBtn = div.querySelector(".remove-btn");
    if (removeBtn) {
        removeBtn.addEventListener("click", () => window.removeGoal(removeBtn));
    }
});
