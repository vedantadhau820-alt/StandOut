/* =========================================================
   STAND OUT — MONTHLY DROP BANNER
========================================================= */

(() => {

    "use strict";


    /* =====================================================
       CONSTANT
    ===================================================== */

    const MONTHLY_DROP_KEY =
        "standOutMonthlyDropSeen";


    /* =====================================================
       DROP DATA
    ===================================================== */

    const DROP_DATA = {

        name:
            "THE ETERNAL DHARM",

        description:
            "A new month. A new challenge."

    };


    /* =====================================================
       GET CURRENT DROP INFORMATION
    ===================================================== */

    function getCurrentDropInfo() {

        const now = new Date();

        const year =
            now.getFullYear();

        const monthIndex =
            now.getMonth();

        const monthName =
            now.toLocaleString(
                "en-US",
                {
                    month: "long"
                }
            );

        const lastDay =
            new Date(
                year,
                monthIndex + 1,
                0
            ).getDate();


        return {

            key:
                `${year}-${String(
                    monthIndex + 1
                ).padStart(2, "0")}`,

            month:
                `${monthName} ${year}`,

            expiry:
                `${monthName} ${lastDay}, ${year}`

        };

    }


    /* =====================================================
       RENDER DROP BANNER
    ===================================================== */

    function renderDrop() {

        const info =
            getCurrentDropInfo();


        const dropName =
            document.getElementById(
                "dropName"
            );

        const dropMonth =
            document.getElementById(
                "dropMonth"
            );

        const dropDescription =
            document.getElementById(
                "dropDescription"
            );

        const dropExpiry =
            document.getElementById(
                "dropExpiry"
            );


        /* -----------------------------------------------
           DROP NAME
        ------------------------------------------------ */

        if (dropName) {

            dropName.textContent =
                DROP_DATA.name;

        }


        /* -----------------------------------------------
           MONTH
        ------------------------------------------------ */

        if (dropMonth) {

            dropMonth.textContent =
                info.month.toUpperCase();

        }


        /* -----------------------------------------------
           DESCRIPTION
        ------------------------------------------------ */

        if (dropDescription) {

            dropDescription.textContent =
                DROP_DATA.description;

        }


        /* -----------------------------------------------
           EXPIRY
        ------------------------------------------------ */

        if (dropExpiry) {

            dropExpiry.textContent =
                info.expiry.toUpperCase();

        }

    }


    /* =====================================================
       MARK DROP AS SEEN
    ===================================================== */

    function markDropAsSeen() {

        const info =
            getCurrentDropInfo();


        localStorage.setItem(
            MONTHLY_DROP_KEY,
            info.key
        );


        console.log(
            "✓ Monthly Drop marked as seen:",
            info.key
        );

    }


    /* =====================================================
       CONTINUE BUTTON
    ===================================================== */

    function continueToApp() {

        markDropAsSeen();


        /*
         * Return to the main StandOut application.
         */

        window.location.href =
            "index.html";

    }


    /* =====================================================
       INITIALIZE
    ===================================================== */

    function initializeDrop() {

        renderDrop();


        const continueButton =
            document.getElementById(
                "dropContinue"
            );


        if (!continueButton) {

            console.warn(
                "Monthly Drop: Continue button not found."
            );

            return;

        }


        continueButton.addEventListener(
            "click",
            continueToApp
        );


        console.log(
            "✓ Monthly Drop banner initialized."
        );

    }


    /* =====================================================
       START
    ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeDrop
        );

    } else {

        initializeDrop();

    }

})();
