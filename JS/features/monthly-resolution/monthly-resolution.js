/**
 * Monthly Resolution feature.
 * Owns its existing LocalStorage contract and DOM behavior independently of Season.
 */

const MONTHLY_RESOLUTION_KEY =
    "monthlyResolutionData";


/* ---------------------------------------------------------
   DATE HELPERS
--------------------------------------------------------- */

function getResolutionNow() {
    return new Date();
}


function getResolutionMonthKey(date = getResolutionNow()) {

    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0")
    ].join("-");
}


function getDaysInCurrentMonth(date = getResolutionNow()) {

    return new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0
    ).getDate();
}


/* ---------------------------------------------------------
   STORAGE
--------------------------------------------------------- */

function loadMonthlyResolutionData() {

    try {

        return JSON.parse(
            localStorage.getItem(
                MONTHLY_RESOLUTION_KEY
            )
        ) || {};

    } catch (error) {

        console.warn(
            "Could not load monthly resolution:",
            error
        );

        return {};
    }
}


function saveMonthlyResolutionData(data) {

    localStorage.setItem(
        MONTHLY_RESOLUTION_KEY,
        JSON.stringify(data)
    );
}


/* ---------------------------------------------------------
   CURRENT MONTH DATA
--------------------------------------------------------- */

function getCurrentMonthlyResolution() {

    const data =
        loadMonthlyResolutionData();

    const month =
        getResolutionMonthKey();

    if (!data[month]) {

        data[month] = {
            month,
            text: "",
            achieved: null,
            reviewed: false
        };

        saveMonthlyResolutionData(data);
    }

    return data[month];
}


/* ---------------------------------------------------------
   PERIOD STATE
--------------------------------------------------------- */

function getResolutionPeriod() {

    const today =
        getResolutionNow();

    const day =
        today.getDate();

    const daysInMonth =
        getDaysInCurrentMonth(today);

    /*
     * Days 1–5
     */
    if (day <= 5) {
        return "editable";
    }

    /*
     * Last 5 days
     */
    if (day > daysInMonth - 5) {
        return "reflection";
    }

    /*
     * Everything between
     */
    return "locked";
}


/* ---------------------------------------------------------
   SAVE RESOLUTION
--------------------------------------------------------- */

function saveMonthlyResolution() {

    const period =
        getResolutionPeriod();

    if (period !== "editable") {

        customAlert(
            "Your resolution can only be changed during the first 5 days of the month."
        );

        return;
    }


    const input =
        document.getElementById(
            "monthlyResolutionInput"
        );

    if (!input) return;


    const text =
        input.value.trim();


    if (!text) {

        customAlert(
            "Write your resolution first."
        );

        return;
    }


    const data =
        loadMonthlyResolutionData();

    const month =
        getResolutionMonthKey();


    if (!data[month]) {

        data[month] = {
            month,
            text: "",
            achieved: null,
            reviewed: false
        };
    }


    data[month].text = text;


    saveMonthlyResolutionData(data);

    renderMonthlyResolution();


    customAlert(
        "Monthly resolution saved."
    );
}


/* ---------------------------------------------------------
   LAST-DAY REVIEW
--------------------------------------------------------- */

function answerMonthlyResolution(achieved) {

    const today =
        getResolutionNow();

    const daysInMonth =
        getDaysInCurrentMonth(today);


    /*
     * Only allow review on the
     * actual last day.
     */
    if (today.getDate() !== daysInMonth) {

        return;
    }


    const data =
        loadMonthlyResolutionData();

    const month =
        getResolutionMonthKey();


    if (!data[month]) return;

    if (!data[month].text) {

        customAlert(
            "You didn't set a resolution this month."
        );

        return;
    }


    /*
     * Prevent changing the answer
     * after submitting it.
     */
    if (data[month].reviewed) {

        return;
    }


    data[month].achieved =
        !!achieved;

    data[month].reviewed =
        true;


    saveMonthlyResolutionData(data);

    renderMonthlyResolution();


    customAlert(
        achieved
            ? "Resolution completed. Well done."
            : "Not this time. Start again next month."
    );
}


/* ---------------------------------------------------------
   RENDER
--------------------------------------------------------- */

function renderMonthlyResolution() {

    const card =
        document.getElementById(
            "monthlyResolutionCard"
        );

    const input =
        document.getElementById(
            "monthlyResolutionInput"
        );

    const saveButton =
        document.getElementById(
            "monthlyResolutionSave"
        );

    const status =
        document.getElementById(
            "monthlyResolutionStatus"
        );

    const hint =
        document.getElementById(
            "monthlyResolutionHint"
        );

    const review =
        document.getElementById(
            "monthlyResolutionReview"
        );

    const yesButton =
        document.getElementById(
            "monthlyResolutionYes"
        );

    const noButton =
        document.getElementById(
            "monthlyResolutionNo"
        );


    if (
        !card ||
        !input ||
        !saveButton ||
        !status ||
        !hint ||
        !review
    ) {
        return;
    }


    const resolution =
        getCurrentMonthlyResolution();

    const period =
        getResolutionPeriod();

    const today =
        getResolutionNow();

    const day =
        today.getDate();

    const daysInMonth =
        getDaysInCurrentMonth(today);


    /*
     * Reset visual states.
     */
    card.classList.remove(
        "locked",
        "reflection-period"
    );


    /*
     * Always show current month's
     * saved resolution.
     */
    input.value =
        resolution.text || "";


    /* =====================================================
       FIRST 5 DAYS
    ===================================================== */

    if (period === "editable") {

        input.disabled = false;

        saveButton.disabled = false;

        status.textContent =
            "EDITABLE";

        hint.textContent =
            `Editable until ${today.toLocaleDateString(
                [],
                {
                    month: "short",
                    day: "numeric"
                }
            )}`;

        review.hidden = true;

        return;
    }


    /* =====================================================
       LOCKED PERIOD
    ===================================================== */

    input.disabled = true;

    saveButton.disabled = true;

    card.classList.add("locked");


    /* =====================================================
       FINAL 5 DAYS
    ===================================================== */

    if (period === "reflection") {

        card.classList.add(
            "reflection-period"
        );

        status.textContent =
            "REFLECTION";

        if (day === daysInMonth) {

            hint.textContent =
                "Today is the final day.";

        } else {

            hint.textContent =
                "Your month is coming to an end.";
        }


        /*
         * Only show the review on
         * the actual last day.
         */
        if (
            day === daysInMonth &&
            resolution.text &&
            !resolution.reviewed
        ) {

            review.hidden = false;

        } else {

            review.hidden = true;
        }

    } else {

        status.textContent =
            "LOCKED";

        hint.textContent =
            "Your resolution is locked for this month.";

        review.hidden = true;
    }


    /*
     * Already reviewed
     */
    if (resolution.reviewed) {

        review.hidden = false;

        const reviewLabel = document.createElement("span");
        reviewLabel.className = "monthly-resolution-review-label";
        reviewLabel.textContent = "MONTHLY REFLECTION";

        const reviewMessage = document.createElement("strong");
        reviewMessage.textContent = resolution.achieved === true
            ? "✓ You achieved your resolution."
            : "Not this time. A new month is a new opportunity.";

        review.replaceChildren(reviewLabel, reviewMessage);
    }


}

/** Register startup behavior and preserve the three legacy window entry points. */
export function initializeMonthlyResolution() {
    document.addEventListener(
        "DOMContentLoaded",
        () => {
            const saveButton = document.getElementById("monthlyResolutionSave");
            if (saveButton) {
                saveButton.addEventListener("click", saveMonthlyResolution);
            }
            const yesButton = document.getElementById("monthlyResolutionYes");
            const noButton = document.getElementById("monthlyResolutionNo");
            yesButton?.addEventListener("click", () => answerMonthlyResolution(true));
            noButton?.addEventListener("click", () => answerMonthlyResolution(false));
            renderMonthlyResolution();
        }
    );

    window.renderMonthlyResolution = renderMonthlyResolution;
    window.saveMonthlyResolution = saveMonthlyResolution;
    window.answerMonthlyResolution = answerMonthlyResolution;
}
