/* =========================================================
   MONTHLY BADGES
========================================================= */
const monthlyBadgeButton =
    document.getElementById("monthlyBadgeOpenBtn");

if (monthlyBadgeButton) {
    monthlyBadgeButton.addEventListener(
        "click",
        toggleMonthlyBadgePage
    );
}


const MONTHLY_BADGES = {

    /* -----------------------------------------------------
       AUGUST 2026 — TEST BADGE
    ----------------------------------------------------- */

    "2026-08": {

        id: "aug-2026",

        title: "The Relentless",

        artwork: "badges/aug-2026.png",

        requirements: {
            missions: 10,
            goals: 1,
            activeDays: 3
        }

    },


    /* -----------------------------------------------------
       SEPTEMBER 2026
    ----------------------------------------------------- */

    "2026-09": {

        id: "sep-2026",

        title: "The Endgame",

        artwork: "badges/sep-2026.png",

        requirements: {

            missions: 20,

            goals: 1,

            activeDays: 15

        }

    },

   /* -----------------------------------------------------
       SEPTEMBER 2026
    ----------------------------------------------------- */

    "2026-10": {

        id: "oct-2026",

        title: "The Cursed Era",

        artwork: "badges/oct-2026.png",

        requirements: {

            missions: 60,

            goals: 3,

            activeDays: 20

        }

    },

   /* -----------------------------------------------------
       November 2026
    ----------------------------------------------------- */

    "2026-11": {

        id: "nov-2026",

        title: "The Eternal Dharm",

        artwork: "badges/nov-2026.png",

        requirements: {

            missions: 108,

            goals: 3,

            activeDays: 21

        }

    },

};



/* =========================================================
   CURRENT BADGE KEY
========================================================= */

function getCurrentBadgeKey() {

    const date =
        new Date();

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    return `${year}-${month}`;
}

/* =========================================================
   GET CURRENT MONTHLY BADGE
========================================================= */

function getCurrentMonthlyBadge() {

    const key =
        getCurrentBadgeKey();


    return (
        MONTHLY_BADGES[key] ||
        null
    );

}


/* =========================================================
   MONTHLY GOAL COUNT
========================================================= */

function getMonthlyGoalCount() {

    const key =
        getCurrentBadgeKey();


    const [year, month] =
        key
            .split("-")
            .map(Number);


    /*
       goalsData already contains
       the user's goals.
    */

    if (
        !Array.isArray(
            window.goalsData
        )
    ) {

        return 0;

    }


    return window.goalsData.filter(
        goal => {

            /*
               Only achieved goals count.
            */

            if (
                !goal.achieved ||
                !goal.achievedAt
            ) {

                return false;

            }


            const achievedDate =
                new Date(
                    goal.achievedAt
                );


            return (

                achievedDate.getFullYear()
                === year

                &&

                achievedDate.getMonth() + 1
                === month

            );

        }
    ).length;

}


/* =========================================================
   MONTHLY MISSION COUNT
========================================================= */

function getMonthlyMissionCount() {

    const key =
        getCurrentBadgeKey();


    const [year, month] =
        key
            .split("-")
            .map(Number);


    /*
       Mission history is stored
       in localStorage.
    */

    let history = {};

    try {

        history =
            JSON.parse(
                localStorage.getItem(
                    "missionHistory"
                )
            ) || {};

    } catch (error) {

        console.warn(
            "Could not read mission history:",
            error
        );

        return 0;

    }


    const monthPrefix =
        `${year}-${String(month).padStart(2, "0")}`;


    let completed =
        0;


    Object.keys(history)

        .filter(
            date =>
                date.startsWith(
                    monthPrefix
                )
        )

        .forEach(
            date => {

                const day =
                    history[date];


                if (!day) {

                    return;

                }


                completed +=
                    Number(
                        day.completed
                    ) || 0;

            }
        );


    return completed;

}


/* =========================================================
   MONTHLY ACTIVE DAYS
========================================================= */

function getMonthlyActiveDays() {

    const key =
        getCurrentBadgeKey();


    const [year, month] =
        key
            .split("-")
            .map(Number);


    let history = {};

    try {

        history =
            JSON.parse(
                localStorage.getItem(
                    "missionHistory"
                )
            ) || {};

    } catch (error) {

        console.warn(
            "Could not read mission history:",
            error
        );

        return 0;

    }


    const monthPrefix =
        `${year}-${String(month).padStart(2, "0")}`;


    let activeDays =
        0;


    Object.keys(history)

        .filter(
            date =>
                date.startsWith(
                    monthPrefix
                )
        )

        .forEach(
            date => {

                const day =
                    history[date];


                if (!day) {

                    return;

                }


                /*
                   A day is active when
                   at least one mission
                   was completed.
                */

                if (
                    Number(
                        day.completed
                    ) > 0
                ) {

                    activeDays++;

                }

            }
        );


    return activeDays;

}


/* =========================================================
   MONTHLY BADGE PROGRESS
========================================================= */

function getMonthlyBadgeProgress() {

    const badge =
        getCurrentMonthlyBadge();


    /*
       No badge configured
       for this month.
    */

    if (!badge) {

        return null;

    }


    const requirements =
        badge.requirements;


    const progress = {

        missions:
            getMonthlyMissionCount(),

        goals:
            getMonthlyGoalCount(),

        activeDays:
            getMonthlyActiveDays()

    };


    /*
       Check every requirement.
    */

    const earned =

        progress.missions >=
        requirements.missions

        &&

        progress.goals >=
        requirements.goals

        &&

        progress.activeDays >=
        requirements.activeDays;


    return {

        badge,

        progress,

        earned

    };

}


/* =========================================================
   BADGE REQUIREMENT STATUS
========================================================= */

function getMonthlyBadgeRequirementStatus() {

    const data =
        getMonthlyBadgeProgress();


    if (!data) {

        return null;

    }


    const requirements =
        data.badge.requirements;


    return {

        missions: {

            current:
                data.progress.missions,

            required:
                requirements.missions,

            complete:
                data.progress.missions >=
                requirements.missions

        },


        goals: {

            current:
                data.progress.goals,

            required:
                requirements.goals,

            complete:
                data.progress.goals >=
                requirements.goals

        },


        activeDays: {

            current:
                data.progress.activeDays,

            required:
                requirements.activeDays,

            complete:
                data.progress.activeDays >=
                requirements.activeDays

        }

    };

}


/* =========================================================
   BADGE DEBUG
========================================================= */

function debugMonthlyBadge() {

    const key =
        getCurrentBadgeKey();


    const badge =
        getCurrentMonthlyBadge();


    const progress =
        getMonthlyBadgeProgress();


    console.log(
        "================================="
    );

    console.log(
        "MONTHLY BADGE TEST"
    );

    console.log(
        "================================="
    );


    console.log(
        "Current Month:",
        key
    );


    console.log(
        "Badge:",
        badge
    );


    console.log(
        "Progress:",
        progress
    );


    if (progress) {

        console.log(
            `Missions: ${progress.progress.missions} / ${progress.badge.requirements.missions}`
        );

        console.log(
            `Goals: ${progress.progress.goals} / ${progress.badge.requirements.goals}`
        );

        console.log(
            `Active Days: ${progress.progress.activeDays} / ${progress.badge.requirements.activeDays}`
        );

        console.log(
            "Earned:",
            progress.earned
        );

    }

    console.log(
        "================================="
    );

}

/* =========================================================
   MONTHLY BADGE PAGE NAVIGATION
========================================================= */

/* =========================================================
   MONTHLY BADGE PAGE TOGGLE
========================================================= */

function toggleMonthlyBadgePage() {

    const page =
        document.getElementById(
            "monthlyBadgePage"
        );

    const plusButton =
        document.getElementById(
            "globalAddBtn"
        );


    if (!page) {
        return;
    }


    const isOpen =
        page.classList.contains(
            "active"
        );


    /* =========================================
       CLOSE BADGE PAGE
    ========================================= */

    if (isOpen) {

        page.classList.remove(
            "active"
        );


        const missions =
            document.getElementById(
                "missions"
            );


        if (missions) {

            missions.classList.add(
                "active"
            );

        }


        /* SHOW + BUTTON */

        if (plusButton) {

            plusButton.style.display =
                "";

        }


        return;

    }


    /* =========================================
       OPEN BADGE PAGE
    ========================================= */

    document
        .querySelectorAll("section")
        .forEach(section => {

            section.classList.remove(
                "active"
            );

        });


    page.classList.add(
        "active"
    );


    /* HIDE + BUTTON */

    if (plusButton) {

        plusButton.style.display =
            "none";

    }


    renderMonthlyBadgePage();

}
/* =========================================================
   NAV LOGO
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const navButton =
            document.getElementById(
                "monthlyBadgeNavBtn"
            );


        if (!navButton) {
            return;
        }


        navButton.addEventListener(
            "click",
            toggleMonthlyBadgePage
        );

    }
);

/* =========================================================
   RENDER MONTHLY BADGE PAGE
========================================================= */

function renderMonthlyBadgePage() {

    checkAndAwardMonthlyBadge();

    const data =
        getMonthlyBadgeProgress();


    if (!data) {
        return;
    }


    const badge =
        data.badge;

    renderMonthlyBadgeArtwork(
        badge.artwork,
        data.earned
    );

    const progress =
        data.progress;

    const requirements =
        badge.requirements;


    const monthElement =
        document.getElementById(
            "monthlyBadgeMonth"
        );


    const titleElement =
        document.getElementById(
            "monthlyBadgeTitle"
        );


    const statusElement =
        document.getElementById(
            "monthlyBadgeStatus"
        );


    const artworkElement =
        document.getElementById(
            "monthlyBadgeArtwork"
        );


    const descriptionElement =
        document.getElementById(
            "monthlyBadgeDescription"
        );


    const requirementsElement =
        document.getElementById(
            "monthlyBadgeRequirements"
        );


    const requirementCountElement =
        document.getElementById(
            "monthlyBadgeRequirementCount"
        );


    const earnedMessage =
        document.getElementById(
            "monthlyBadgeEarnedMessage"
        );


    if (!monthElement) {
        return;
    }


    /* -----------------------------------------
       MONTH
    ----------------------------------------- */

    /* -----------------------------------------
   MONTH
----------------------------------------- */

    const badgeKey =
        getCurrentBadgeKey();

    const [
        badgeYear,
        badgeMonth
    ] = badgeKey.split("-");

    const date =
        new Date(
            Number(badgeYear),
            Number(badgeMonth) - 1,
            1
        );

    const monthName =
        date.toLocaleDateString(
            [],
            {
                month: "long"
            }
        );

    monthElement.textContent =
        `${monthName} ${badgeYear}`;


    /* -----------------------------------------
       TITLE
    ----------------------------------------- */

    titleElement.textContent =
        badge.title;


    /* -----------------------------------------
       STATUS
    ----------------------------------------- */

    if (data.earned) {

        statusElement.textContent =
            "EARNED";

        statusElement.classList.add(
            "earned"
        );

        artworkElement.classList.remove(
            "locked"
        );

        artworkElement.classList.add(
            "earned"
        );

        descriptionElement.textContent =
            "You completed this month's challenge.";

        earnedMessage.classList.add(
            "active"
        );

    } else {

        statusElement.textContent =
            "LOCKED";

        statusElement.classList.remove(
            "earned"
        );

        artworkElement.classList.add(
            "locked"
        );

        artworkElement.classList.remove(
            "earned"
        );

        descriptionElement.textContent =
            "Complete this month's challenges to earn this badge.";

        earnedMessage.classList.remove(
            "active"
        );

    }


    /* -----------------------------------------
       REQUIREMENTS
    ----------------------------------------- */

    let completedRequirements =
        0;

    let totalRequirements =
        0;


    const requirementData = [

        {
            name: "Missions",

            current:
                progress.missions,

            required:
                requirements.missions

        },

        {
            name: "Goals",

            current:
                progress.goals,

            required:
                requirements.goals

        },

        {
            name: "Active Days",

            current:
                progress.activeDays,

            required:
                requirements.activeDays

        }

    ];


    requirementsElement.replaceChildren();


    requirementData.forEach(
        requirement => {

            totalRequirements++;


            const complete =
                requirement.current >=
                requirement.required;


            if (complete) {

                completedRequirements++;

            }


            const percentage =
                Math.min(
                    100,

                    Math.round(
                        (
                            requirement.current /
                            requirement.required
                        ) * 100
                    )
                );


            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "monthly-badge-requirement";


            const top = document.createElement("div");
            top.className = "monthly-badge-requirement-top";

            const name = document.createElement("span");
            name.className = "monthly-badge-requirement-name";
            name.textContent = String(requirement.name ?? "");

            const value = document.createElement("span");
            value.className = "monthly-badge-requirement-value";
            value.classList.toggle("complete", complete);
            const current = Number.isFinite(Number(requirement.current))
                ? Math.max(0, Number(requirement.current)) : 0;
            const required = Number.isFinite(Number(requirement.required))
                ? Math.max(0, Number(requirement.required)) : 0;
            value.textContent = `${complete ? "✓ " : ""}${current} / ${required}`;
            top.append(name, value);

            const progressTrack = document.createElement("div");
            progressTrack.className = "monthly-badge-progress";
            const progressFill = document.createElement("div");
            progressFill.className = "monthly-badge-progress-fill";
            progressFill.style.width = `${Math.max(0, Math.min(100, Number.isFinite(percentage) ? percentage : 0))}%`;
            progressTrack.append(progressFill);
            row.append(top, progressTrack);


            requirementsElement.appendChild(
                row
            );

        }
    );


    requirementCountElement.textContent =
        `${completedRequirements} / ${totalRequirements}`;

    renderBadgeCollection();

}

/* =========================================================
   MONTHLY BADGE ARTWORK
========================================================= */

function createBadgeArtworkNode(artwork) {
    if (artwork === "badges/aug-2026.png") {
        const art = document.createElement("div");
        art.className = "badge-art-relentless";
        const ring = document.createElement("div");
        ring.className = "badge-art-ring";
        const symbol = document.createElement("span");
        symbol.className = "badge-art-symbol";
        symbol.textContent = "⚡";
        ring.append(symbol);
        const year = document.createElement("span");
        year.className = "badge-art-year";
        year.textContent = "AUG 2026";
        art.append(ring, year);
        return art;
    }

    if (artwork === "disciplined") {
        const art = document.createElement("div");
        art.className = "badge-art-disciplined";
        const ring = document.createElement("div");
        ring.className = "badge-art-ring";
        const symbol = document.createElement("span");
        symbol.className = "badge-art-symbol";
        symbol.textContent = "◆";
        ring.append(symbol);
        const year = document.createElement("span");
        year.className = "badge-art-year";
        year.textContent = "SEP 2026";
        art.append(ring, year);
        return art;
    }

    const fallback = document.createElement("div");
    fallback.className = "badge-art-fallback";
    fallback.textContent = "★";
    return fallback;
}

function renderMonthlyBadgeArtworkLegacy(artwork, earned) {
    const artworkElement = document.getElementById("monthlyBadgeArtwork");
    const innerElement = document.getElementById("monthlyBadgeArtworkInner");
    if (!artworkElement || !innerElement) return;

    artworkElement.classList.toggle("locked", !earned);
    artworkElement.classList.toggle("earned", earned);
    innerElement.replaceChildren(createBadgeArtworkNode(artwork));
}

/* =========================================================
   EARNED BADGES
========================================================= */

function getEarnedBadges() {

    try {

        const parsed = JSON.parse(localStorage.getItem("earnedBadges") || "[]");
        return Array.isArray(parsed)
            ? parsed.filter(item => item && typeof item === "object" && !Array.isArray(item))
            : [];

    } catch (error) {

        console.warn(
            "Could not read earned badges:",
            error
        );

        return [];

    }

}


function saveEarnedBadges(
    badges
) {

    localStorage.setItem(
        "earnedBadges",
        JSON.stringify(
            badges
        )
    );

}

/* =========================================================
   AWARD CURRENT BADGE
========================================================= */

function checkAndAwardMonthlyBadge() {

    const data =
        getMonthlyBadgeProgress();


    if (!data) {
        return false;
    }


    if (!data.earned) {
        return false;
    }


    const badge =
        data.badge;


    const earnedBadges =
        getEarnedBadges();


    /*
       Already earned?
       Do nothing.
    */

    const alreadyEarned =
        earnedBadges.some(
            earned =>
                earned.id === badge.id
        );


    if (alreadyEarned) {

        return false;

    }


    /*
       Save permanent badge.
    */

    earnedBadges.push({

        id:
            badge.id,

        title:
            badge.title,

        artwork:
            badge.artwork,

        month:
            getCurrentBadgeKey(),

        earnedAt:
            Date.now()

    });


    saveEarnedBadges(
        earnedBadges
    );


    console.log(
        `🏅 Badge earned: ${badge.title}`
    );


    return true;

}


/* =========================================================
   BADGE COLLECTION
========================================================= */

/* =========================================================
   BADGE COLLECTION
========================================================= */

function renderBadgeCollection() {

    const earnedBadges =
        getEarnedBadges();


    const collection =
        document.getElementById(
            "monthlyBadgeCollection"
        );


    if (!collection) {

        return;

    }


    if (earnedBadges.length === 0) {
        const empty = document.createElement("div");
        empty.className = "badge-collection-empty";
        const icon = document.createElement("span");
        icon.textContent = "🏅";
        const message = document.createElement("p");
        message.textContent = "No badges earned yet.";
        empty.append(icon, message);
        collection.replaceChildren(empty);
        return;
    }

    collection.replaceChildren();


    earnedBadges
        .slice()
        .reverse()
        .forEach(
            badge => {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "badge-collection-item";


                const art = document.createElement("div");
                art.className = "badge-collection-art";
                const image = document.createElement("img");
                image.className = "badge-collection-image";
                image.alt = String(badge.title ?? "Earned badge");
                const artworkPath = String(badge.artwork ?? "");
                if (/^badges\/[a-zA-Z0-9_-]+\.(?:png|jpe?g|webp)$/i.test(artworkPath)) {
                    image.src = artworkPath;
                } else {
                    image.hidden = true;
                }
                art.append(image);

                const info = document.createElement("div");
                info.className = "badge-collection-info";
                const title = document.createElement("strong");
                title.textContent = String(badge.title ?? "Untitled badge");
                const month = document.createElement("span");
                month.textContent = String(badge.month ?? "");
                info.append(title, month);
                item.append(art, info);


                collection.appendChild(
                    item
                );

            }
        );

}

/* =========================================================
   MONTHLY BADGE ARTWORK
========================================================= */

function renderMonthlyBadgeArtwork(artwork, earned) {
    const artworkElement = document.getElementById("monthlyBadgeArtwork");
    const innerElement = document.getElementById("monthlyBadgeArtworkInner");
    if (!artworkElement || !innerElement) return;

    artworkElement.classList.toggle("locked", !earned);
    artworkElement.classList.toggle("earned", earned);

    const image = document.createElement("img");
    image.className = "monthly-badge-image";
    image.alt = "Monthly badge";
    const artworkPath = String(artwork ?? "");
    if (/^badges\/[a-zA-Z0-9_-]+\.(?:png|jpe?g|webp)$/i.test(artworkPath)) {
        image.src = artworkPath;
        innerElement.replaceChildren(image);
    } else {
        innerElement.replaceChildren(createBadgeArtworkNode(artworkPath));
    }
}


// Temp

/* =========================================================
   TEMPORARY TEST
   LONG-PRESS LOCKED GOAL → PLAY ACHIEVEMENT VIDEO
========================================================= 

/* document.addEventListener(
    "pointerdown",
    function (event) {

        const button =
            event.target.closest(
                ".goal-achieve-btn"
            );

        if (!button) {
            return;
        }

        /*
         * Only work on locked buttons.
         
        if (!button.disabled) {
            return;
        }

        let longPressTimer =
            setTimeout(() => {

                console.log(
                    "TEMP TEST: Locked goal long-pressed"
                );

                playGoalAchievementVideo();

            }, 800);


        /*
         * Store timer on the button
         * so pointerup can cancel it.
         *
        button._longPressTimer =
            longPressTimer;

    }
);


/* ---------------------------------------------------------
   CANCEL LONG PRESS
--------------------------------------------------------- *

document.addEventListener(
    "pointerup",
    function (event) {

        const button =
            event.target.closest(
                ".goal-achieve-btn"
            );

        if (!button) {
            return;
        }

        if (button._longPressTimer) {

            clearTimeout(
                button._longPressTimer
            );

            button._longPressTimer =
                null;
        }

    }
);


/* ---------------------------------------------------------
   CANCEL IF POINTER LEAVES
--------------------------------------------------------- *

document.addEventListener(
    "pointercancel",
    function (event) {

        const button =
            event.target.closest(
                ".goal-achieve-btn"
            );

        if (!button) {
            return;
        }

        if (button._longPressTimer) {

            clearTimeout(
                button._longPressTimer
            );

            button._longPressTimer =
                null;
        }

    }
);
*/

/* =========================================================
   MODULE API AND LEGACY COMPATIBILITY
========================================================= */

export const badgesFeature = Object.freeze({
    get definitions() { return MONTHLY_BADGES; },
    getCurrentKey: getCurrentBadgeKey,
    getCurrent: getCurrentMonthlyBadge,
    getMonthlyGoalCount,
    getMonthlyMissionCount,
    getMonthlyActiveDays,
    getProgress: getMonthlyBadgeProgress,
    getRequirementStatus: getMonthlyBadgeRequirementStatus,
    debug: debugMonthlyBadge,
    togglePage: toggleMonthlyBadgePage,
    renderPage: renderMonthlyBadgePage,
    renderArtwork: renderMonthlyBadgeArtwork,
    getEarned: getEarnedBadges,
    saveEarned: saveEarnedBadges,
    checkAndAward: checkAndAwardMonthlyBadge,
    renderCollection: renderBadgeCollection
});

// Keep the existing global API for classic scripts and legacy UI callbacks.
window.getCurrentBadgeKey = getCurrentBadgeKey;
window.getCurrentMonthlyBadge = getCurrentMonthlyBadge;
window.getMonthlyGoalCount = getMonthlyGoalCount;
window.getMonthlyMissionCount = getMonthlyMissionCount;
window.getMonthlyActiveDays = getMonthlyActiveDays;
window.getMonthlyBadgeProgress = getMonthlyBadgeProgress;
window.getMonthlyBadgeRequirementStatus = getMonthlyBadgeRequirementStatus;
window.debugMonthlyBadge = debugMonthlyBadge;
window.toggleMonthlyBadgePage = toggleMonthlyBadgePage;
window.renderMonthlyBadgePage = renderMonthlyBadgePage;
window.renderMonthlyBadgeArtwork = renderMonthlyBadgeArtwork;
window.getEarnedBadges = getEarnedBadges;
window.saveEarnedBadges = saveEarnedBadges;
window.checkAndAwardMonthlyBadge = checkAndAwardMonthlyBadge;
window.renderBadgeCollection = renderBadgeCollection;

