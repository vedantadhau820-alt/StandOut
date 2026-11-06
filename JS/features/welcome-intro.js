import { createMonthlyDropController } from "./monthly-drop.js";

/* =========================================================
   STAND OUT — WELCOME INTRO
========================================================= */

function initializeWelcomeIntro() {

    "use strict";


    const monthlyDrop = createMonthlyDropController();


    /* =====================================================
       WELCOME INTRO
    ===================================================== */

    const VIDEO_URL =
        "welcome.mp4";


    const intro =
        document.getElementById(
            "welcomeIntro"
        );

    const panel =
        document.getElementById(
            "welcomePanel"
        );

    const readyButton =
        document.getElementById(
            "welcomeReadyBtn"
        );

    const buttonText =
        readyButton?.querySelector(
            ".welcome-btn-text"
        );

    const loader =
        readyButton?.querySelector(
            ".welcome-loader"
        );

    const videoStage =
        document.getElementById(
            "welcomeVideoStage"
        );

    const video =
        document.getElementById(
            "welcomeVideo"
        );


    if (
        !intro ||
        !panel ||
        !readyButton ||
        !videoStage ||
        !video
    ) {

        console.warn(
            "Welcome Intro: required elements missing."
        );

        return;
    }


    let videoReady = false;

    let finishing = false;


    /* =====================================================
       PREPARE VIDEO
    ===================================================== */

    function prepareVideo() {

        video.src =
            VIDEO_URL;

        video.load();

       video.volume = 0.2; // 30% volume


        /*
         * Browser already has enough data.
         */
        if (video.readyState >= 2) {

            markReady();

            return;
        }


        video.addEventListener(
            "loadeddata",
            markReady,
            { once: true }
        );


        video.addEventListener(
            "canplay",
            markReady,
            { once: true }
        );


        video.addEventListener(
            "error",
            handleVideoError,
            { once: true }
        );
    }


    /* =====================================================
       VIDEO READY
    ===================================================== */

    function markReady() {

        if (videoReady) {
            return;
        }


        videoReady = true;


        readyButton.disabled =
            false;


        buttonText.textContent =
            "Ready";


        loader.classList.add(
            "hidden"
        );


        console.log(
            "✓ Welcome video ready"
        );
    }


    /* =====================================================
       VIDEO ERROR
    ===================================================== */

    function handleVideoError() {

        console.error(
            "Welcome video failed:",
            video.error
        );


        /*
         * Don't leave the user trapped.
         */
        buttonText.textContent =
            "Ready";


        loader.classList.add(
            "hidden"
        );


        readyButton.disabled =
            false;


        videoReady = true;
    }


    /* =====================================================
       START VIDEO
    ===================================================== */

    async function startVideo() {

        if (
            !videoReady ||
            finishing
        ) {

            return;
        }


        console.log(
            "▶ Starting welcome video..."
        );


        /*
         * Prepare the video stage FIRST.
         */
        videoStage.classList.add(
            "active"
        );


        videoStage.setAttribute(
            "aria-hidden",
            "false"
        );


        /*
         * Hide welcome text.
         */
        panel.style.opacity =
            "0";

        panel.style.transform =
            "translateY(-10px) scale(.98)";


        setTimeout(() => {

            panel.style.display =
                "none";

        }, 300);


        /*
         * Reset video.
         */
        video.currentTime = 0;


        try {

            await video.play();


            console.log(
                "✓ Welcome video playing"
            );

        } catch (error) {

            console.error(
                "Welcome video playback failed:",
                error
            );


            finishIntro();
        }
    }


    /* =====================================================
       FINISH
    ===================================================== */

    function finishIntro() {

        if (finishing) {
            return;
        }


        finishing = true;


        console.log(
            "✓ Closing welcome intro"
        );


        video.pause();


        videoStage.classList.remove(
            "active"
        );


        setTimeout(() => {

            intro.classList.add(
                "is-exiting"
            );


            setTimeout(() => {

                intro.remove();

            }, 950);

        }, 350);
    }


    /* =====================================================
       READY BUTTON
    ===================================================== */

    readyButton.addEventListener(
        "click",
        event => {

            event.stopPropagation();


            /*
             * =================================================
             * MONTHLY DROP CHECK
             * =================================================
             *
             * Only show the Drop:
             *
             * 1. On the first day of a month
             * 2. If this month's Drop has not been seen
             */

            if (
                monthlyDrop.isMonthlyDropDay() &&
                !monthlyDrop.hasSeenCurrentDrop()
            ) {

                monthlyDrop.openMonthlyDrop();

                return;
            }


            /*
             * Normal Welcome flow.
             */
            startVideo();
        }
    );


    /* =====================================================
       CLICK VIDEO TO SKIP
    ===================================================== */

    videoStage.addEventListener(
        "click",
        finishIntro
    );


    /* =====================================================
       VIDEO ENDED
    ===================================================== */

    video.addEventListener(
        "ended",
        finishIntro
    );


    /* =====================================================
       ESC
    ===================================================== */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                videoStage.classList.contains(
                    "active"
                )
            ) {

                finishIntro();
            }
        }
    );


    /* =====================================================
       INITIALIZE
    ===================================================== */

    prepareVideo();

}

initializeWelcomeIntro();
