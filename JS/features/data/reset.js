import { resetApplicationUI } from "./reset-ui.js";

/**
 * StandOut full application reset orchestration.
 *
 * This feature coordinates existing feature APIs and legacy DOM surfaces; it
 * intentionally preserves the current factory-reset behavior and storage keys.
 */

async function resetData() {

    try {

        /* =====================================================
           1. STOP ACTIVE AUDIO
        ===================================================== */

        if (
            typeof stopActiveTone ===
            "function"
        ) {

            stopActiveTone();

        }


        if (
            typeof stopPreview ===
            "function"
        ) {

            stopPreview();

        }


        /* =====================================================
           2. DELETE CUSTOM AUDIO DATABASE
        ===================================================== */

        try {

            if (
                typeof deleteCustomAudioDatabase ===
                "function"
            ) {

                await deleteCustomAudioDatabase();

            }

        } catch (error) {

            console.warn(
                "Could not reset custom audio:",
                error
            );

        }


        /* =====================================================
           3. RESET SOUND SETTINGS
        ===================================================== */

        localStorage.removeItem(
            "standout_sound_settings"
        );


        if (
            typeof DEFAULT_SOUND_SETTINGS !==
            "undefined"
        ) {

            window.soundSettings = {
                ...DEFAULT_SOUND_SETTINGS
            };

        }


        /* =====================================================
           4. RESET ALL LOCAL STORAGE
        ===================================================== */

        localStorage.clear();

        window.ownedCards = {};

        /* =====================================================
   RESET SEASON
   Full app reset → Season returns to factory state.
===================================================== */

        if (
            window.StandOutSeason &&
            typeof window.StandOutSeason.resetSeason === "function"
        ) {
            try {
                window.StandOutSeason.resetSeason();

                console.log("✓ Season state reset.");

            } catch (error) {

                console.warn(
                    "Could not reset Season state:",
                    error
                );

            }
        }


        /* =====================================================
           5. RESET MISSION HISTORY
        ===================================================== */

        /*
         * IMPORTANT:
         *
         * Monthly reports are calculated directly from
         * missionHistory.
         *
         * Clearing LocalStorage alone is not enough because
         * missionHistory already exists in memory.
         */

        window.missionHistory = {};


        localStorage.removeItem(
            "missionHistory"
        );


        /* =====================================================
           6. RESET BACKGROUND
        ===================================================== */

        const backgroundStorageKeys = [

            "customBackground",
            "customBackgroundImage",
            "backgroundImage",
            "backgroundImageData",
            "background",
            "appBackground",
            "customBg",
            "customBgImage",
            "backgroundSettings",
            "backgroundOpacity",
            "backgroundBlur"

        ];


        backgroundStorageKeys.forEach(
            key => {

                try {

                    localStorage.removeItem(
                        key
                    );

                } catch (error) {

                    console.warn(
                        "Could not remove background key:",
                        key,
                        error
                    );

                }

            }
        );


        /* =====================================================
           7. RESET BACKGROUND CSS VARIABLES
        ===================================================== */

        document.documentElement.style.removeProperty(
            "--custom-background"
        );

        document.documentElement.style.removeProperty(
            "--background-image"
        );

        document.documentElement.style.removeProperty(
            "--background-opacity"
        );

        document.documentElement.style.removeProperty(
            "--background-blur"
        );

        document.documentElement.style.removeProperty(
            "--bg-image"
        );

        document.documentElement.style.removeProperty(
            "--app-background"
        );


        /* =====================================================
           8. RESET BODY BACKGROUND
        ===================================================== */

        document.body.style.backgroundImage =
            "";

        document.body.style.backgroundSize =
            "";

        document.body.style.backgroundPosition =
            "";

        document.body.style.backgroundRepeat =
            "";

        document.body.style.backgroundAttachment =
            "";

        document.body.style.backgroundColor =
            "";


        /* =====================================================
           9. RESET BACKGROUND LAYERS
        ===================================================== */

        const backgroundLayer =
            document.getElementById(
                "customBackgroundLayer"
            );


        if (backgroundLayer) {

            backgroundLayer.style.backgroundImage =
                "";

            backgroundLayer.style.opacity =
                "";

            backgroundLayer.style.filter =
                "";

        }


        const backgroundOverlay =
            document.getElementById(
                "customBackgroundOverlay"
            );


        if (backgroundOverlay) {

            backgroundOverlay.style.opacity =
                "";

            backgroundOverlay.style.background =
                "";

            backgroundOverlay.style.filter =
                "";

            backgroundOverlay.style.backdropFilter =
                "";

        }


        document
            .querySelectorAll(
                ".custom-background, .background-layer, .app-background, .background-image-layer"
            )
            .forEach(
                element => {

                    element.remove();

                }
            );


        /* =====================================================
           10. RESET CARD CATALOG
           Keep only built-in cards.
        ===================================================== */

        if (
            Array.isArray(
                window.cardCatalog
            )
        ) {

            window.cardCatalog =
                window.cardCatalog.filter(
                    card =>
                        !card.custom
                );

        }


        /* =====================================================
           11. RESET TIMER
        ===================================================== */

        if (window.countdownTimerInterval) {
            clearInterval(window.countdownTimerInterval);
            window.countdownTimerInterval = null;
        }

        if (window.timerInterval) {
            clearInterval(window.timerInterval);
            window.timerInterval = null;
        }


        /* =====================================================
           13–24. RESET APPLICATION UI
        ===================================================== */

        resetApplicationUI();


        /* =====================================================
           25. RESET MONTHLY REPORT STORAGE
        ===================================================== */

        const monthlyStorageKeys = [

            "monthlyReport",
            "monthlyReports",
            "monthlySummary",
            "monthlySummaryData",
            "monthlyReportData",
            "monthlyGoals",
            "monthlyMomentum",
            "monthlyStats",
            "monthlyHistory"

        ];


        monthlyStorageKeys.forEach(
            key => {

                try {

                    localStorage.removeItem(
                        key
                    );

                } catch (error) {

                    console.warn(
                        "Could not remove monthly key:",
                        key,
                        error
                    );

                }

            }
        );

        /* Monthly report runtime is derived from mission history and refreshed below. */




        /* =====================================================
           27. RESET NOTIFICATION BADGE
        ===================================================== */

        if (
            typeof updateNotificationBadge ===
            "function"
        ) {

            updateNotificationBadge();

        }


        /* =====================================================
   28. RESET COMPLETE
===================================================== */

        console.log(
            "✓ COMPLETE APP RESET"
        );

        window.reloadAfterAlert = true;

        customAlert(
            "Reset completed. Please Reopen The App."
        );

    } catch (error) {

        console.error(
            "Complete reset failed:",
            error
        );

        customAlert(
            "Reset failed. Check the console."
        );

    }

}


export const dataManagement = Object.freeze({ resetData });

