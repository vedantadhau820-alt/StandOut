/**
 * Skills feature: skill CRUD, mission links, XP progression, and legacy HTML hydration.
 * The existing `skills` LocalStorage value remains HTML-backed for compatibility.
 */

function getSkillList() {
    return document.getElementById("skill-list");
}

function persistSkills() {
    window.saveData?.();
}

function addSkill() {
    const input = document.getElementById("skillInput");
    const list = getSkillList();
    if (!input || !list) return;

    const skillName = input.value;
    if (!skillName) {
        window.closeModal?.();
        return;
    }

    const div = document.createElement("div");
    div.className = "skill show";
    div.dataset.xp = "0";
    div.dataset.level = "0";

    const name = document.createElement("strong");
    name.textContent = skillName;
    const level = document.createElement("span");
    level.className = "skill-level";
    level.textContent = "Level 0";
    const progress = document.createElement("div");
    progress.className = "progress";
    const bar = document.createElement("div");
    bar.className = "progress-bar";
    bar.style.width = "0%";
    progress.appendChild(bar);
    const xpLabel = document.createElement("small");
    xpLabel.append("XP: ");
    const xpCount = document.createElement("span");
    xpCount.className = "xp-count";
    xpCount.textContent = "0";
    xpLabel.appendChild(xpCount);
    const remove = document.createElement("button");
    remove.className = "remove-btn";
    remove.type = "button";
    remove.textContent = "Remove";
    remove.addEventListener("click", event => {
        event.stopPropagation();
        deleteSkillDirect(remove);
    });

    div.append(name, level, progress, xpLabel, remove);
    list.appendChild(div);
    bindSkillInteractions(div);
    persistSkills();
    window.closeModal?.();
}

function deleteSkillDirect(button) {
    const skillDiv = button?.closest(".skill");
    if (!skillDiv) return;
    const skillName = skillDiv.querySelector("strong")?.textContent ?? "";

    window.customConfirm?.(
        `Delete skill "${skillName}"?\nLinked missions will stop giving XP.`,
        () => {
            skillDiv.remove();
            document.querySelectorAll("#mission-list li").forEach(mission => {
                if (mission.dataset.skill === skillName) mission.dataset.skill = "";
            });
            persistSkills();
        }
    );
}

function updateSkill() {
    const skillDiv = window.skillBeingEdited;
    if (!skillDiv) {
        window.closeModal?.();
        return;
    }

    const input = document.getElementById("editSkillInput");
    if (!input) return;
    const oldName = skillDiv.querySelector("strong")?.textContent.trim() ?? "";
    const newName = input.value.trim();

    if (!newName) {
        window.customAlert?.("Please enter a skill name.");
        return;
    }
    if (newName === oldName) {
        window.closeModal?.();
        return;
    }

    skillDiv.querySelector("strong").textContent = newName;
    document.querySelectorAll("#mission-list li").forEach(mission => {
        if (mission.dataset.skill === oldName) mission.dataset.skill = newName;
    });

    persistSkills();
    window.closeModal?.();
    window.skillBeingEdited = null;
}

function checkSkillLevelUp(skillDiv) {
    if (!skillDiv) return;
    let xp = Number.parseInt(skillDiv.dataset.xp, 10);
    if (!Number.isFinite(xp)) xp = 0;
    let levelTag = skillDiv.querySelector(".skill-level");

    if (!levelTag) {
        levelTag = document.createElement("span");
        levelTag.className = "skill-level";
        levelTag.textContent = "Level 0";
        const progress = skillDiv.querySelector(".progress");
        skillDiv.insertBefore(levelTag, progress ?? null);
    }

    let level = Number.parseInt(levelTag.textContent.replace("Level ", ""), 10);
    if (!Number.isFinite(level)) level = 0;
    while (xp >= 100) {
        xp -= 100;
        level++;
    }

    skillDiv.dataset.xp = String(xp);
    skillDiv.dataset.level = String(level);
    levelTag.textContent = `Level ${level}`;
    const xpCount = skillDiv.querySelector(".xp-count");
    const progressBar = skillDiv.querySelector(".progress-bar");
    if (xpCount) xpCount.textContent = String(xp);
    if (progressBar) progressBar.style.width = `${xp}%`;
}

function increaseSkillXP(skillName, amount) {
    const targetName = String(skillName ?? "").trim();
    const points = Number(amount);
    if (!targetName || !Number.isFinite(points)) return;

    document.querySelectorAll("#skill-list .skill").forEach(skill => {
        const name = skill.querySelector("strong")?.textContent.trim() ?? "";
        if (name !== targetName) return;

        let xp = Number.parseInt(skill.dataset.xp, 10);
        if (!Number.isFinite(xp)) xp = 0;
        skill.dataset.xp = String(xp + points);
        skill.setAttribute("data-xp", String(xp + points));
        checkSkillLevelUp(skill);
        persistSkills();
    });
}

function deleteSkill(skillName) {
    document.querySelectorAll("#skill-list .skill").forEach(skill => {
        if (skill.querySelector("strong")?.textContent === skillName) skill.remove();
    });
    persistSkills();
    window.closeModal?.();
}

const initializedSkills = new WeakSet();
function bindSkillInteractions(skill) {
    if (!skill || initializedSkills.has(skill)) return;
    skill.addEventListener("click", event => {
        // A remove action is inside the clickable skill card. Do not let it
        // bubble into the card's edit handler and open the update modal.
        if (event.target.closest("button, .remove-btn")) return;
        window.openModal?.("edit-skill", skill);
    });
    initializedSkills.add(skill);
}

function initializeSkills() {
    document.querySelectorAll("#skill-list .skill").forEach(skill => {
        bindSkillInteractions(skill);
        skill.classList.add("show");

        const xp = Number.parseInt(skill.getAttribute("data-xp") || "0", 10);
        skill.dataset.xp = String(Number.isFinite(xp) ? xp : 0);
        const xpCount = skill.querySelector(".xp-count");
        const progressBar = skill.querySelector(".progress-bar");
        if (xpCount) xpCount.textContent = skill.dataset.xp;
        if (progressBar) progressBar.style.width = `${skill.dataset.xp}%`;
    });
}

export const skillsFeature = Object.freeze({
    addSkill,
    deleteSkillDirect,
    updateSkill,
    checkSkillLevelUp,
    increaseSkillXP,
    deleteSkill,
    initializeSkills
});

// Explicit bridges preserve inline handlers and callers in classic scripts.
window.addSkill = addSkill;
window.deleteSkillDirect = deleteSkillDirect;
window.updateSkill = updateSkill;
window.checkSkillLevelUp = checkSkillLevelUp;
window.increaseSkillXP = increaseSkillXP;
window.deleteSkill = deleteSkill;
window.initializeSkills = initializeSkills;
