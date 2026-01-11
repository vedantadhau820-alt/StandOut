/* =========================================================
   SKILLS MODULE
========================================================= */

/* -------------------------
   ADD SKILL
------------------------- */
window.addSkill = function () {
  const skill =
    document.getElementById("skillInput")?.value.trim();

  if (!skill) {
    closeModal();
    return;
  }

  const div = document.createElement("div");
  div.className = "skill show";
  div.dataset.xp = "0"; // XP starts at 0

  div.innerHTML = `
    <strong>${skill}</strong>
    <div class="progress">
      <div class="progress-bar" style="width:0%"></div>
    </div>
    <small>XP: <span class="xp-count">0</span></small>
    <button class="remove-btn"
            onclick="deleteSkillDirect(this)">
      Remove
    </button>
  `;

  document.getElementById("skill-list")
    .appendChild(div);

  saveData();
  closeModal();
};

/* -------------------------
   DELETE SKILL (DIRECT)
------------------------- */
window.deleteSkillDirect = function (btn) {
  const skillDiv = btn.closest(".skill");
  if (!skillDiv) return;

  const skillName =
    skillDiv.querySelector("strong").textContent;

  customConfirm(
    `Delete skill "${skillName}"?\nLinked missions will stop giving XP.`,
    () => {
      skillDiv.remove();

      // Remove skill links from missions
      document.querySelectorAll("#mission-list li")
        .forEach(li => {
          if (li.dataset.skill === skillName) {
            li.dataset.skill = "";
          }
        });

      saveData();
    }
  );
};

/* -------------------------
   DELETE SKILL (FROM EDIT MODAL)
------------------------- */
window.deleteSkill = function (skillName) {
  document.querySelectorAll("#skill-list .skill")
    .forEach(skill => {
      if (
        skill.querySelector("strong").textContent === skillName
      ) {
        skill.remove();
      }
    });

  saveData();
  closeModal();
};

/* -------------------------
   INCREASE SKILL XP
------------------------- */
window.increaseSkillXP = function (skillName, amount) {
  document.querySelectorAll("#skill-list .skill")
    .forEach(skill => {
      const name =
        skill.querySelector("strong").textContent.trim();

      if (name === skillName.trim()) {
        let xp =
          parseInt(skill.dataset.xp || "0", 10);

        xp = Math.min(100, xp + amount);

        skill.dataset.xp = xp;
        skill.setAttribute("data-xp", xp);

        skill.querySelector(".xp-count").textContent = xp;
        skill.querySelector(".progress-bar").style.width =
          xp + "%";

        saveData();
      }
    });
};

/* -------------------------
   RESTORE SKILLS AFTER LOAD
------------------------- */
window.restoreSkillsUI = function () {
  document.querySelectorAll("#skill-list .skill")
    .forEach(skill => {
      const xp =
        parseInt(skill.getAttribute("data-xp") || "0", 10);

      skill.dataset.xp = xp;
      skill.querySelector(".xp-count").textContent = xp;
      skill.querySelector(".progress-bar").style.width =
        xp + "%";

      skill.addEventListener("click", () =>
        openModal("edit-skill", skill)
      );

      skill.classList.add("show");
    });
};
