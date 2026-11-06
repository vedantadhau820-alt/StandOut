/* =========================================================
   MASTERY SYSTEM
   Stand Out
========================================================= */

const MASTERY_STORAGE_KEY =
    "standout_masteries";

let masteries = [];


/* =========================================================
   STORAGE
========================================================= */

function loadMasteries() {

    try {

        const stored =
            localStorage.getItem(
                MASTERY_STORAGE_KEY
            );

        if (!stored) {
            masteries = [];
            return;
        }

        const parsed =
            JSON.parse(stored);

        masteries =
            Array.isArray(parsed)
                ? parsed
                : [];

    } catch (error) {

        console.warn(
            "Could not load Masteries:",
            error
        );

        masteries = [];

    }

}


function saveMasteries() {

    try {

        localStorage.setItem(
            MASTERY_STORAGE_KEY,
            JSON.stringify(masteries)
        );

    } catch (error) {

        console.warn(
            "Could not save Masteries:",
            error
        );

    }

}


/* =========================================================
   CREATE MASTERY
========================================================= */

function createMastery(
    title,
    description = "",
    milestones = []
) {

    /* =============================================
       MAXIMUM 2 MASTERIES
    ============================================= */

    if (masteries.length >= 2) {

    openMasteryLimitModal();

    return null;
}
    title =
        String(title || "").trim();

    description =
        String(description || "").trim();


    if (!title) {
        return null;
    }


    const mastery = {

        id:
            "mastery_" +
            Date.now() +
            "_" +
            Math.random()
                .toString(36)
                .slice(2, 8),

        title,

        description,

        createdAt:
            new Date().toISOString(),

        completedAt:
            null,

        completed:
            false,

        milestones:
            milestones
                .map(
                    milestone => ({

                        id:
                            "milestone_" +
                            Date.now() +
                            "_" +
                            Math.random()
                                .toString(36)
                                .slice(2, 7),

                        title:
                            String(
                                milestone || ""
                            ).trim(),

                        completed:
                            false,

                        completedAt:
                            null,

                        evidence:
                            ""

                    })
                )
                .filter(
                    milestone =>
                        milestone.title
                )

    };


    /* =============================================
       ADD — DO NOT REPLACE
    ============================================= */

    masteries.push(
        mastery
    );


    saveMasteries();

    renderMasteries();


    return mastery;

}

/* =========================================================
   DELETE MASTERY
========================================================= */

function deleteMastery(
    masteryId
) {

    const index =
        masteries.findIndex(
            mastery =>
                mastery.id === masteryId
        );


    if (index === -1) {
        return;
    }


    masteries.splice(
        index,
        1
    );


    saveMasteries();

    renderMasteries();

}


/* =========================================================
   COMPLETE MILESTONE
========================================================= */

function completeMasteryMilestone(
    masteryId,
    milestoneId
) {

    const mastery =
        masteries.find(
            item =>
                item.id === masteryId
        );


    if (!mastery) {
        return;
    }


    const milestone =
        mastery.milestones.find(
            item =>
                item.id === milestoneId
        );


    if (!milestone) {
        return;
    }


    if (milestone.completed) {
        return;
    }


    milestone.completed =
        true;

    milestone.completedAt =
        new Date().toISOString();


    checkMasteryCompletion(
        mastery
    );


    saveMasteries();

    renderMasteries();

}


/* =========================================================
   UNCOMPLETE MILESTONE
========================================================= */

function uncompleteMasteryMilestone(
    masteryId,
    milestoneId
) {

    const mastery =
        masteries.find(
            item =>
                item.id === masteryId
        );


    if (!mastery) {
        return;
    }


    const milestone =
        mastery.milestones.find(
            item =>
                item.id === milestoneId
        );


    if (!milestone) {
        return;
    }


    milestone.completed =
        false;

    milestone.completedAt =
        null;


    mastery.completed =
        false;

    mastery.completedAt =
        null;


    saveMasteries();

    renderMasteries();

}


/* =========================================================
   CHECK MASTERY COMPLETION
========================================================= */

function checkMasteryCompletion(
    mastery
) {

    if (
        !mastery.milestones.length
    ) {

        mastery.completed =
            false;

        mastery.completedAt =
            null;

        return;

    }


    const allCompleted =
        mastery.milestones.every(
            milestone =>
                milestone.completed
        );


    if (allCompleted) {

        mastery.completed =
            true;

        mastery.completedAt =
            new Date().toISOString();

    }

}


/* =========================================================
   PROGRESS
========================================================= */

function getMasteryProgress(
    mastery
) {

    const total =
        mastery.milestones.length;


    if (!total) {
        return 0;
    }


    const completed =
        mastery.milestones.filter(
            milestone =>
                milestone.completed
        ).length;


    return Math.round(
        (
            completed /
            total
        ) * 100
    );

}


/* =========================================================
   MILESTONE COUNT
========================================================= */

function getMasteryMilestoneCount(
    mastery
) {

    const total =
        mastery.milestones.length;


    const completed =
        mastery.milestones.filter(
            milestone =>
                milestone.completed
        ).length;


    return {
        completed,
        total
    };

}


/* =========================================================
   MASTERY STAGE
========================================================= */

function getMasteryStage(
    mastery
) {

    const progress =
        getMasteryProgress(
            mastery
        );


    if (progress === 0) {
        return "Not Started";
    }

    if (progress < 25) {
        return "Exploring";
    }

    if (progress < 50) {
        return "Developing";
    }

    if (progress < 75) {
        return "Advancing";
    }

    if (progress < 100) {
        return "Near Mastery";
    }

    return "Mastered";

}


/* =========================================================
   FIND MASTERY
========================================================= */

function getMastery(
    masteryId
) {

    return masteries.find(
        mastery =>
            mastery.id === masteryId
    ) || null;

}


/* =========================================================
   GET ALL MASTERIES
========================================================= */

function getAllMasteries() {

    return [
        ...masteries
    ];

}


/* =========================================================
   INITIALIZE
========================================================= */

function initializeMastery() {

    loadMasteries();

    renderMasteries();

}


/* =========================================================
   RENDER
========================================================= */

function createMasteryNode(tag, className = "", text = null) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== null) node.textContent = String(text);
    return node;
}

function renderMasteries() {
    const container = document.getElementById("mastery-list");
    if (!container) {
        console.warn("Mastery list container not found.");
        return;
    }
    if (!masteries.length) {
        const empty = createMasteryNode("div", "mastery-empty");
        empty.append(
            createMasteryNode("div", "mastery-empty-icon", "+"),
            createMasteryNode("strong", "", "No Masteries Yet"),
            createMasteryNode("span", "", "Choose something you want to become exceptionally good at.")
        );
        const button = createMasteryNode("button", "mastery-empty-add-btn", "CREATE MASTERY");
        button.type = "button";
        button.addEventListener("click", openMasteryModal);
        empty.append(button);
        container.replaceChildren(empty);
        return;
    }
    const fragment = document.createDocumentFragment();
    masteries.forEach(mastery => fragment.append(createMasteryCardElement(mastery)));
    container.replaceChildren(fragment);
}

function createMasteryCardElement(mastery) {
    const progress = Math.max(0, Math.min(100, Number(getMasteryProgress(mastery)) || 0));
    const counts = getMasteryMilestoneCount(mastery);
    const article = createMasteryNode("article", "mastery-card");
    article.classList.toggle("mastered", Boolean(mastery.completed));

    const header = createMasteryNode("div", "mastery-card-header");
    const headingGroup = document.createElement("div");
    headingGroup.append(
        createMasteryNode("span", "mastery-eyebrow", "MASTERY"),
        createMasteryNode("h3", "", mastery.title || "")
    );
    const actions = createMasteryNode("div", "mastery-card-actions");
    const edit = createMasteryNode("button", "mastery-action-btn", "⋯");
    edit.type = "button";
    edit.setAttribute("aria-label", "Edit Mastery");
    edit.addEventListener("click", () => openMasteryEditModal(mastery.id));
    const add = createMasteryNode("button", "mastery-add-btn", "+");
    add.type = "button";
    add.setAttribute("aria-label", "Create another Mastery");
    add.addEventListener("click", openMasteryModal);
    actions.append(edit, add);
    header.append(headingGroup, createMasteryNode("span", "mastery-stage", getMasteryStage(mastery)), actions);
    article.append(header);

    if (mastery.description) article.append(createMasteryNode("p", "mastery-description", mastery.description));
    const progressRow = createMasteryNode("div", "mastery-progress-row");
    progressRow.append(
        createMasteryNode("strong", "", `${progress}%`),
        createMasteryNode("span", "", `${counts.completed} / ${counts.total} milestones`)
    );
    article.append(progressRow);
    const track = createMasteryNode("div", "mastery-progress");
    const fill = createMasteryNode("div", "mastery-progress-fill");
    fill.style.width = `${progress}%`;
    track.append(fill);
    article.append(track);
    const milestoneList = createMasteryNode("div", "mastery-milestones");
    (Array.isArray(mastery.milestones) ? mastery.milestones : []).forEach(item => {
        milestoneList.append(createMasteryMilestoneElement(mastery, item));
    });
    article.append(milestoneList);
    return article;
}

function createMasteryMilestoneElement(mastery, milestone) {
    const wrapper = createMasteryNode("div", "mastery-milestone-wrapper");
    wrapper.classList.toggle("completed", Boolean(milestone.completed));
    const button = createMasteryNode("button", "mastery-milestone");
    button.type = "button";
    button.classList.toggle("completed", Boolean(milestone.completed));
    button.append(
        createMasteryNode("span", "mastery-milestone-check", milestone.completed ? "✓" : ""),
        createMasteryNode("span", "mastery-milestone-title", milestone.title || "")
    );
    button.addEventListener("click", () => {
        if (milestone.completed) uncompleteMasteryMilestone(mastery.id, milestone.id);
        else completeMasteryMilestone(mastery.id, milestone.id);
    });
    wrapper.append(button);
    if (milestone.completed) {
        const evidence = createMasteryNode("div", "mastery-evidence");
        evidence.id = `evidence-${String(mastery.id)}-${String(milestone.id)}`;
        const evidenceButton = createMasteryNode("button", "mastery-evidence-btn", milestone.evidence ? "View Evidence" : "Add Evidence");
        evidenceButton.type = "button";
        evidenceButton.addEventListener("click", () => openMasteryEvidence(mastery.id, milestone.id));
        evidence.append(evidenceButton);
        if (milestone.evidence) evidence.append(createMasteryNode("p", "mastery-evidence-preview", milestone.evidence));
        wrapper.append(evidence);
    }
    return wrapper;
}

/* =========================================================
   GLOBAL ACCESS
========================================================= */

window.createMastery =
    createMastery;

window.deleteMastery =
    deleteMastery;

window.completeMasteryMilestone =
    completeMasteryMilestone;

window.uncompleteMasteryMilestone =
    uncompleteMasteryMilestone;

window.getMastery =
    getMastery;

window.getAllMasteries =
    getAllMasteries;

window.getMasteryProgress =
    getMasteryProgress;


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeMastery
);

/* =========================================================
   MASTERY CREATION MODAL
========================================================= */

function openMasteryModal() {

    const modal =
        document.getElementById("mastery-modal");

    if (!modal) {
        return;
    }

    const title =
        document.getElementById("mastery-title");

    const description =
        document.getElementById("mastery-description");

    const inputs =
        document.getElementById("mastery-milestone-inputs");

    const error =
        document.getElementById("mastery-form-error");


    /* =============================================
       ALWAYS RESET THE CREATION FORM
    ============================================= */

    if (title) {
        title.value = "";
    }

    if (description) {
        description.value = "";
    }

    if (inputs) inputs.replaceChildren();

    if (error) {
        error.textContent = "";
    }


    /* =============================================
       CREATE FRESH MILESTONE FIELDS
    ============================================= */

    addMasteryMilestoneInput();
    addMasteryMilestoneInput();


    /* =============================================
       OPEN MODAL
    ============================================= */

    modal.classList.add("open");

    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    setTimeout(() => {

        if (title) {
            title.focus();
        }

    }, 100);

}


function closeMasteryModal() {

    const modal =
        document.getElementById(
            "mastery-modal"
        );

    if (!modal) {
        return;
    }


    modal.classList.remove(
        "open"
    );

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

}


/* =========================================================
   ADD MILESTONE INPUT
========================================================= */

function addMasteryMilestoneInput() {
    const container = document.getElementById("mastery-milestone-inputs");
    if (!container) return;
    const count = container.querySelectorAll(".mastery-milestone-input-row").length;
    if (count >= 12) return;
    const row = document.createElement("div");
    row.className = "mastery-milestone-input-row";
    const number = createMasteryNode("span", "mastery-milestone-number", count + 1);
    const input = document.createElement("input");
    input.type = "text";
    input.className = "mastery-milestone-input";
    input.maxLength = 120;
    input.placeholder = `Milestone ${count + 1}`;
    input.autocomplete = "off";
    const remove = createMasteryNode("button", "mastery-remove-milestone", "×");
    remove.type = "button";
    remove.setAttribute("aria-label", "Remove milestone");
    remove.addEventListener("click", () => { row.remove(); renumberMasteryMilestones(); });
    row.append(number, input, remove);
    container.append(row);
}

/* =========================================================
   RENUMBER MILESTONES
========================================================= */

function renumberMasteryMilestones() {

    const container =
        document.getElementById(
            "mastery-milestone-inputs"
        );

    if (!container) {
        return;
    }


    const rows =
        container.querySelectorAll(
            ".mastery-milestone-input-row"
        );


    rows.forEach(
        (row, index) => {

            const number =
                row.querySelector(
                    ".mastery-milestone-number"
                );

            const input =
                row.querySelector(
                    ".mastery-milestone-input"
                );


            if (number) {

                number.textContent =
                    index + 1;

            }


            if (input) {

                input.placeholder =
                    `Milestone ${index + 1}`;

            }

        }
    );

}


/* =========================================================
   SUBMIT MASTERY
========================================================= */

function submitMasteryCreation() {

    const titleInput =
        document.getElementById(
            "mastery-title"
        );

    const descriptionInput =
        document.getElementById(
            "mastery-description"
        );

    const error =
        document.getElementById(
            "mastery-form-error"
        );


    const title =
        titleInput
            ? titleInput.value.trim()
            : "";


    const description =
        descriptionInput
            ? descriptionInput.value.trim()
            : "";


    if (!title) {

        if (error) {

            error.textContent =
                "Give your Mastery a name.";

        }

        return;

    }


    const milestoneInputs =
        document.querySelectorAll(
            "#mastery-milestone-inputs .mastery-milestone-input"
        );


    const milestones =
        Array.from(
            milestoneInputs
        )
            .map(
                input =>
                    input.value.trim()
            )
            .filter(
                value =>
                    value.length > 0
            );


    if (!milestones.length) {

        if (error) {

            error.textContent =
                "Add at least one milestone.";

        }

        return;

    }


    createMastery(
        title,
        description,
        milestones
    );


    closeMasteryModal();

}


/* =========================================================
   GLOBAL ACCESS
========================================================= */

window.openMasteryModal =
    openMasteryModal;

window.closeMasteryModal =
    closeMasteryModal;

window.addMasteryMilestoneInput =
    addMasteryMilestoneInput;

window.submitMasteryCreation =
    submitMasteryCreation;

    /* =========================================================
   EDIT MASTERY
========================================================= */

function openMasteryEditModal(masteryId) {

    const mastery =
        getMastery(masteryId);

    if (!mastery) {
        return;
    }


    const modal =
        document.getElementById(
            "mastery-edit-modal"
        );

    const idInput =
        document.getElementById(
            "mastery-edit-id"
        );

    const titleInput =
        document.getElementById(
            "mastery-edit-title"
        );

    const descriptionInput =
        document.getElementById(
            "mastery-edit-description"
        );

    const milestonesContainer =
        document.getElementById(
            "mastery-edit-milestones"
        );

    const error =
        document.getElementById(
            "mastery-edit-error"
        );


    if (!modal) {
        return;
    }


    if (idInput) {
        idInput.value = mastery.id;
    }

    if (titleInput) {
        titleInput.value = mastery.title;
    }

    if (descriptionInput) {
        descriptionInput.value =
            mastery.description || "";
    }

    if (error) {
        error.textContent = "";
    }


    if (milestonesContainer) {

        milestonesContainer.replaceChildren();

        mastery.milestones.forEach(
            milestone => {

                addEditMasteryMilestone(
                    milestone
                );

            }
        );

    }


    modal.classList.add("open");

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

}


function closeMasteryEditModal() {

    const modal =
        document.getElementById(
            "mastery-edit-modal"
        );

    if (!modal) {
        return;
    }


    modal.classList.remove("open");

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

}

/* =========================================================
   EDIT MILESTONE INPUT
========================================================= */

function addEditMasteryMilestone(existingMilestone = null) {
    const container = document.getElementById("mastery-edit-milestones");
    if (!container) return;
    const count = container.querySelectorAll(".mastery-milestone-input-row").length;
    if (count >= 12) return;
    const row = document.createElement("div");
    row.className = "mastery-milestone-input-row";
    row.dataset.milestoneId = existingMilestone ? String(existingMilestone.id) : "";
    const number = createMasteryNode("span", "mastery-milestone-number", count + 1);
    const input = document.createElement("input");
    input.type = "text";
    input.className = "mastery-milestone-input";
    input.maxLength = 120;
    input.placeholder = `Milestone ${count + 1}`;
    input.value = existingMilestone ? String(existingMilestone.title || "") : "";
    input.autocomplete = "off";
    const remove = createMasteryNode("button", "mastery-remove-milestone", "×");
    remove.type = "button";
    remove.setAttribute("aria-label", "Remove milestone");
    remove.addEventListener("click", () => { row.remove(); renumberEditMasteryMilestones(); });
    row.append(number, input, remove);
    container.append(row);
}

function renumberEditMasteryMilestones() {

    const container =
        document.getElementById(
            "mastery-edit-milestones"
        );

    if (!container) {
        return;
    }


    container
        .querySelectorAll(
            ".mastery-milestone-input-row"
        )
        .forEach(
            (row, index) => {

                const number =
                    row.querySelector(
                        ".mastery-milestone-number"
                    );

                const input =
                    row.querySelector(
                        ".mastery-milestone-input"
                    );


                if (number) {
                    number.textContent =
                        index + 1;
                }

                if (input) {
                    input.placeholder =
                        `Milestone ${index + 1}`;
                }

            }
        );

}


window.addEditMasteryMilestone =
    addEditMasteryMilestone;

    /* =========================================================
   SAVE MASTERY EDITS
========================================================= */

function saveMasteryEdits() {

    const id =
        document.getElementById(
            "mastery-edit-id"
        )?.value;


    const mastery =
        getMastery(id);


    if (!mastery) {
        return;
    }


    const title =
        document.getElementById(
            "mastery-edit-title"
        )?.value.trim();


    const description =
        document.getElementById(
            "mastery-edit-description"
        )?.value.trim();


    const error =
        document.getElementById(
            "mastery-edit-error"
        );


    if (!title) {

        if (error) {
            error.textContent =
                "Give your Mastery a name.";
        }

        return;

    }


    const rows =
        document.querySelectorAll(
            "#mastery-edit-milestones " +
            ".mastery-milestone-input-row"
        );


    const updatedMilestones = [];


    rows.forEach(row => {

        const input =
            row.querySelector(
                ".mastery-milestone-input"
            );


        const text =
            input
                ? input.value.trim()
                : "";


        if (!text) {
            return;
        }


        const existingId =
            row.dataset.milestoneId;


        /*
         * Preserve the original milestone ID
         * whenever possible.
         */

        const oldMilestone =
            existingId
                ? mastery.milestones.find(
                    item =>
                        item.id ===
                        existingId
                )
                : null;


        updatedMilestones.push({

            id:
                oldMilestone
                    ? oldMilestone.id
                    : (
                        "milestone_" +
                        Date.now() +
                        "_" +
                        Math.random()
                            .toString(36)
                            .slice(2, 8)
                    ),

            title:
                text,

            completed:
                oldMilestone
                    ? oldMilestone.completed
                    : false,

            completedAt:
                oldMilestone
                    ? oldMilestone.completedAt
                    : null,

            evidence:
                oldMilestone
                    ? oldMilestone.evidence || ""
                    : ""

        });

    });


    if (!updatedMilestones.length) {

        if (error) {
            error.textContent =
                "Add at least one milestone.";
        }

        return;

    }


    mastery.title =
        title;

    mastery.description =
        description;

    mastery.milestones =
        updatedMilestones;


    /*
     * Recalculate completion after editing.
     */

    checkMasteryCompletion(
        mastery
    );


    saveMasteries();

    renderMasteries();

    closeMasteryEditModal();

}

window.openMasteryEditModal =
    openMasteryEditModal;

window.closeMasteryEditModal =
    closeMasteryEditModal;

window.saveMasteryEdits =
    saveMasteryEdits;

    /* =========================================================
   DELETE MASTERY CONFIRMATION
========================================================= */

function openDeleteMasteryModal() {

    const editId =
        document.getElementById(
            "mastery-edit-id"
        );

    const deleteModal =
        document.getElementById(
            "mastery-delete-modal"
        );


    if (!editId || !deleteModal) {
        return;
    }


    if (!editId.value) {
        return;
    }


    deleteModal.dataset.masteryId =
        editId.value;


    deleteModal.classList.add(
        "open"
    );

    deleteModal.setAttribute(
        "aria-hidden",
        "false"
    );

}


function closeDeleteMasteryModal() {

    const modal =
        document.getElementById(
            "mastery-delete-modal"
        );


    if (!modal) {
        return;
    }


    modal.classList.remove(
        "open"
    );

    modal.setAttribute(
        "aria-hidden",
        "true"
    );


    delete modal.dataset.masteryId;

}


function confirmDeleteMastery() {

    const modal =
        document.getElementById(
            "mastery-delete-modal"
        );


    if (!modal) {
        return;
    }


    const masteryId =
        modal.dataset.masteryId;


    if (!masteryId) {
        return;
    }


    /*
     * Use the existing delete function.
     */

    deleteMastery(
        masteryId
    );


    closeDeleteMasteryModal();

    closeMasteryEditModal();

}


window.openDeleteMasteryModal =
    openDeleteMasteryModal;

window.closeDeleteMasteryModal =
    closeDeleteMasteryModal;

window.confirmDeleteMastery =
    confirmDeleteMastery;

function renderMasteryMilestone(mastery, milestone) {
    return createMasteryMilestoneElement(mastery, milestone);
}

/* =========================================================
   EVIDENCE
========================================================= */

function toggleMasteryEvidence(
    masteryId,
    milestoneId
) {

    const evidence =
        document.getElementById(
            `evidence-${masteryId}-${milestoneId}`
        );

    if (!evidence) {
        return;
    }

    evidence.classList.toggle("show");

}


/* =========================================================
   EVIDENCE MODAL
========================================================= */

let activeEvidenceMasteryId = null;
let activeEvidenceMilestoneId = null;


function openMasteryEvidence(
    masteryId,
    milestoneId
) {

    const mastery =
        getMastery(masteryId);

    if (!mastery) {
        return;
    }


    const milestone =
        mastery.milestones.find(
            item =>
                item.id === milestoneId
        );

    if (!milestone) {
        return;
    }


    const modal =
        document.getElementById(
            "mastery-evidence-modal"
        );

    const title =
        document.getElementById(
            "mastery-evidence-title"
        );

    const milestoneTitle =
        document.getElementById(
            "mastery-evidence-milestone"
        );

    const input =
        document.getElementById(
            "mastery-evidence-input"
        );

    const error =
        document.getElementById(
            "mastery-evidence-error"
        );


    if (!modal || !input) {
        return;
    }


    activeEvidenceMasteryId =
        masteryId;

    activeEvidenceMilestoneId =
        milestoneId;


    if (title) {

        title.textContent =
            milestone.evidence
                ? "Edit Evidence"
                : "Add Evidence";

    }


    if (milestoneTitle) {

        milestoneTitle.textContent =
            milestone.title;

    }


    input.value =
        milestone.evidence || "";


    if (error) {
        error.textContent = "";
    }


    updateMasteryEvidenceCounter();


    modal.classList.add("open");

    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    setTimeout(() => {

        input.focus();

        input.setSelectionRange(
            input.value.length,
            input.value.length
        );

    }, 150);

}


function closeMasteryEvidenceModal() {

    const modal =
        document.getElementById(
            "mastery-evidence-modal"
        );

    if (!modal) {
        return;
    }


    modal.classList.remove(
        "open"
    );

    modal.setAttribute(
        "aria-hidden",
        "true"
    );


    activeEvidenceMasteryId =
        null;

    activeEvidenceMilestoneId =
        null;

}

window.toggleMasteryEvidence =
    toggleMasteryEvidence;

window.openMasteryEvidence =
    openMasteryEvidence;


    /* =========================================================
   SAVE EVIDENCE
========================================================= */

function saveMasteryEvidence() {

    if (
        !activeEvidenceMasteryId ||
        !activeEvidenceMilestoneId
    ) {
        return;
    }


    const mastery =
        getMastery(
            activeEvidenceMasteryId
        );

    if (!mastery) {
        return;
    }


    const milestone =
        mastery.milestones.find(
            item =>
                item.id ===
                activeEvidenceMilestoneId
        );

    if (!milestone) {
        return;
    }


    const input =
        document.getElementById(
            "mastery-evidence-input"
        );

    const error =
        document.getElementById(
            "mastery-evidence-error"
        );


    const evidence =
        input
            ? input.value.trim()
            : "";


    if (!evidence) {

        if (error) {

            error.textContent =
                "Add some evidence before saving.";

        }

        return;

    }


    milestone.evidence =
        evidence;


    saveMasteries();

    renderMasteries();

    closeMasteryEvidenceModal();

}

/* =========================================================
   EVIDENCE CHARACTER COUNTER
========================================================= */

function updateMasteryEvidenceCounter() {

    const input =
        document.getElementById(
            "mastery-evidence-input"
        );

    const counter =
        document.getElementById(
            "mastery-evidence-count"
        );


    if (!input || !counter) {
        return;
    }


    counter.textContent =
        input.value.length;

}


document.addEventListener(
    "input",
    event => {

        if (
            event.target.id ===
            "mastery-evidence-input"
        ) {

            updateMasteryEvidenceCounter();

        }

    }
);

window.openMasteryEvidence =
    openMasteryEvidence;

window.closeMasteryEvidenceModal =
    closeMasteryEvidenceModal;

window.saveMasteryEvidence =
    saveMasteryEvidence;

/* =========================================================
   MASTERY LIMIT ALERT
========================================================= */

function openMasteryLimitModal() {

    const modal =
        document.getElementById(
            "mastery-limit-modal"
        );

    if (!modal) {
        return;
    }

    modal.classList.add("open");

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

}


function closeMasteryLimitModal() {

    const modal =
        document.getElementById(
            "mastery-limit-modal"
        );

    if (!modal) {
        return;
    }

    modal.classList.remove("open");

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

}


window.openMasteryLimitModal =
    openMasteryLimitModal;

window.closeMasteryLimitModal =
    closeMasteryLimitModal;

/* =========================================================
   MODULE API
========================================================= */

export const mastery = Object.freeze({
    load: loadMasteries,
    save: saveMasteries,
    initialize: initializeMastery,
    render: renderMasteries,
    create: createMastery,
    delete: deleteMastery,
    completeMilestone: completeMasteryMilestone,
    uncompleteMilestone: uncompleteMasteryMilestone,
    get: getMastery,
    getAll: getAllMasteries,
    getProgress: getMasteryProgress,
    getMilestoneCount: getMasteryMilestoneCount,
    getStage: getMasteryStage,
    openModal: openMasteryModal,
    closeModal: closeMasteryModal,
    submitCreation: submitMasteryCreation,
    openEditModal: openMasteryEditModal,
    closeEditModal: closeMasteryEditModal,
    saveEdits: saveMasteryEdits,
    addEditMilestone: addEditMasteryMilestone,
    openDeleteModal: openDeleteMasteryModal,
    closeDeleteModal: closeDeleteMasteryModal,
    confirmDelete: confirmDeleteMastery,
    toggleEvidence: toggleMasteryEvidence,
    openEvidence: openMasteryEvidence,
    closeEvidenceModal: closeMasteryEvidenceModal,
    saveEvidence: saveMasteryEvidence,
    updateEvidenceCounter: updateMasteryEvidenceCounter,
    openLimitModal: openMasteryLimitModal,
    closeLimitModal: closeMasteryLimitModal
});

