/* =========================================================
   CUSTOM BACKGROUND
========================================================= */

const BACKGROUND_DB_NAME = "AppBackgroundDB";
const BACKGROUND_STORE = "background";
const BACKGROUND_APPEARANCE_KEY =
    "standout_background_appearance";

let backgroundDB = null;
let currentBackgroundURL = null;


/* =========================================================
   DATABASE
========================================================= */

function openBackgroundDB() {

    return new Promise((resolve, reject) => {

        const request =
            indexedDB.open(
                BACKGROUND_DB_NAME,
                1
            );

        request.onupgradeneeded = event => {

            const db = event.target.result;

            if (
                !db.objectStoreNames.contains(
                    BACKGROUND_STORE
                )
            ) {

                db.createObjectStore(
                    BACKGROUND_STORE
                );

            }

        };

        request.onsuccess = event => {

            backgroundDB =
                event.target.result;

            resolve(backgroundDB);

        };

        request.onerror = () => {

            reject(request.error);

        };

    });

}


/* =========================================================
   SAVE
========================================================= */

async function saveCustomBackground(blob) {

    const db =
        backgroundDB ||
        await openBackgroundDB();

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                BACKGROUND_STORE,
                "readwrite"
            );

        const store =
            transaction.objectStore(
                BACKGROUND_STORE
            );

        store.put(
            blob,
            "current"
        );

        transaction.oncomplete =
            () => resolve();

        transaction.onerror =
            () => reject(transaction.error);

    });

}


/* =========================================================
   LOAD
========================================================= */

async function loadCustomBackground() {

    const db =
        backgroundDB ||
        await openBackgroundDB();

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                BACKGROUND_STORE,
                "readonly"
            );

        const store =
            transaction.objectStore(
                BACKGROUND_STORE
            );

        const request =
            store.get("current");

        request.onsuccess =
            () => resolve(
                request.result || null
            );

        request.onerror =
            () => reject(request.error);

    });

}


/* =========================================================
   REMOVE
========================================================= */

async function removeCustomBackground() {

    const db =
        backgroundDB ||
        await openBackgroundDB();

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                BACKGROUND_STORE,
                "readwrite"
            );

        const store =
            transaction.objectStore(
                BACKGROUND_STORE
            );

        store.delete("current");

        transaction.oncomplete =
            () => resolve();

        transaction.onerror =
            () => reject(transaction.error);

    });

}


/* =========================================================
   CREATE BACKGROUND LAYER
========================================================= */

function createBackgroundLayer() {

    let layer =
        document.getElementById(
            "customBackgroundLayer"
        );

    if (layer) {
        return layer;
    }


    layer =
        document.createElement("div");

    layer.id =
        "customBackgroundLayer";


    const overlay =
        document.createElement("div");

    overlay.id =
        "customBackgroundOverlay";


    layer.appendChild(
        overlay
    );


    document.body.prepend(
        layer
    );


    return layer;

}


/* =========================================================
   APPLY
========================================================= */

function applyBackground(blob) {

    const layer =
        createBackgroundLayer();

    const overlay =
        document.getElementById(
            "customBackgroundOverlay"
        );


    if (currentBackgroundURL) {

        URL.revokeObjectURL(
            currentBackgroundURL
        );

        currentBackgroundURL =
            null;

    }


    if (!blob) {

        layer.style.backgroundImage =
            "none";

        return;

    }


    currentBackgroundURL =
        URL.createObjectURL(
            blob
        );


    layer.style.backgroundImage =
        `url("${currentBackgroundURL}")`;

}

/* =========================================================
   INITIALIZE
========================================================= */

async function initializeBackground() {

    try {

        const background =
            await loadCustomBackground();

        applyBackground(
            background
        );

        console.log(
            "Background system initialized:",
            !!background
        );

    } catch (error) {

        console.error(
            "Background initialization failed:",
            error
        );

    }

}


/* =========================================================
   CONTROLS
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const fileInput =
            document.getElementById(
                "backgroundFileInput"
            );

        const removeButton =
            document.getElementById(
                "removeBackgroundBtn"
            );


        /* Choose */

        if (fileInput) {

            fileInput.addEventListener(
                "change",
                async event => {

                    const file =
                        event.target.files[0];

                    if (!file) {
                        return;
                    }


                    if (
                        !file.type.startsWith(
                            "image/"
                        )
                    ) {

                        customAlert(
                            "Please choose an image."
                        );

                        return;

                    }


                    try {

                        await saveCustomBackground(
                            file
                        );

                        applyBackground(
                            file
                        );

                        console.log(
                            "Custom background applied."
                        );

                    } catch (error) {

                        console.error(
                            "Background save failed:",
                            error
                        );

                        customAlert(
                            "Could not save the background."
                        );

                    }

                }
            );

        }


        /* Remove */

        if (removeButton) {

            removeButton.addEventListener(
                "click",
                async () => {

                    try {

                        await removeCustomBackground();

                        applyBackground(
                            null
                        );

                        if (fileInput) {
                            fileInput.value = "";
                        }

                    } catch (error) {

                        console.error(
                            "Background removal failed:",
                            error
                        );

                    }

                }
            );

        }


        initializeBackground();

    }
);

/* =========================================================
   BACKGROUND APPEARANCE CONTROLS
========================================================= */

const backgroundOpacity =
    document.getElementById(
        "backgroundOpacity"
    );

const backgroundOverlay =
    document.getElementById(
        "backgroundOverlay"
    );

const backgroundBlur =
    document.getElementById(
        "backgroundBlur"
    );

const backgroundOpacityValue =
    document.getElementById(
        "backgroundOpacityValue"
    );

const backgroundOverlayValue =
    document.getElementById(
        "backgroundOverlayValue"
    );

const backgroundBlurValue =
    document.getElementById(
        "backgroundBlurValue"
    );


    function loadBackgroundAppearance() {

    try {

        const raw =
            localStorage.getItem(
                BACKGROUND_APPEARANCE_KEY
            );

        if (!raw) {
            return;
        }

        const saved =
            JSON.parse(raw);


        if (
            backgroundOpacity &&
            Number.isFinite(
                Number(saved.opacity)
            )
        ) {

            backgroundOpacity.value =
                Number(saved.opacity) * 100;

        }


        if (
            backgroundOverlay &&
            Number.isFinite(
                Number(saved.overlay)
            )
        ) {

            backgroundOverlay.value =
                Number(saved.overlay) * 100;

        }


        if (
            backgroundBlur &&
            Number.isFinite(
                Number(saved.blur)
            )
        ) {

            backgroundBlur.value =
                Number(saved.blur);

        }

    } catch (error) {

        console.warn(
            "Could not load background appearance:",
            error
        );

    }

}

function updateBackgroundAppearance() {

    const opacity =
        backgroundOpacity
            ? backgroundOpacity.value / 100
            : 1;

    const overlay =
        backgroundOverlay
            ? backgroundOverlay.value / 100
            : 0.35;

    const blur =
        backgroundBlur
            ? backgroundBlur.value
            : 0;


    /*
     * Apply appearance variables.
     */

    document.documentElement.style
        .setProperty(
            "--background-opacity",
            opacity
        );

    document.documentElement.style
        .setProperty(
            "--background-overlay",
            overlay
        );

    document.documentElement.style
        .setProperty(
            "--background-blur",
            `${blur}px`
        );


    /*
     * Update displayed values.
     */

    if (backgroundOpacityValue) {

        backgroundOpacityValue.textContent =
            `${Math.round(opacity * 100)}%`;

    }

    if (backgroundOverlayValue) {

        backgroundOverlayValue.textContent =
            `${Math.round(overlay * 100)}%`;

    }

    if (backgroundBlurValue) {

        backgroundBlurValue.textContent =
            `${blur}px`;

    }


    /*
     * Persist appearance settings.
     */

    try {

        localStorage.setItem(
            BACKGROUND_APPEARANCE_KEY,
            JSON.stringify({
                opacity,
                overlay,
                blur
            })
        );

    } catch (error) {

        console.warn(
            "Could not save background appearance:",
            error
        );

    }

}


/* Opacity */

if (backgroundOpacity) {

    backgroundOpacity.addEventListener(
        "input",
        updateBackgroundAppearance
    );

}


/* Overlay */

if (backgroundOverlay) {

    backgroundOverlay.addEventListener(
        "input",
        updateBackgroundAppearance
    );

}


/* Blur */

if (backgroundBlur) {

    backgroundBlur.addEventListener(
        "input",
        updateBackgroundAppearance
    );

}


loadBackgroundAppearance();
updateBackgroundAppearance();

/* =========================================================
   MODULE API + LEGACY COMPATIBILITY BRIDGE
========================================================= */

export const background = Object.freeze({
    openBackgroundDB,
    saveCustomBackground,
    loadCustomBackground,
    removeCustomBackground,
    createBackgroundLayer,
    applyBackground,
    initializeBackground,
    loadBackgroundAppearance,
    updateBackgroundAppearance
});

// Existing classic scripts call loadCustomBackground() directly. Keep that
// contract while new feature modules import the named background API.
Object.assign(window, {
    openBackgroundDB,
    saveCustomBackground,
    loadCustomBackground,
    removeCustomBackground,
    createBackgroundLayer,
    applyBackground,
    initializeBackground,
    loadBackgroundAppearance,
    updateBackgroundAppearance
});
