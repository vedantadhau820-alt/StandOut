/* =========================================================
   SOUND & TONES
   Stand Out
========================================================= */

const SOUND_SETTINGS_KEY = "standout_sound_settings";

const DEFAULT_SOUND_SETTINGS = {
    achievement: "default",
    mission: "default",
    mint: "default",
    dailyChallenge: "default",
    musicCard: "default"
};


/* =========================================================
   DEFAULT SOUND FILES
========================================================= */

const SOUND_FILES = {
    achievement: "Music/Achievements.mp3",
    mission: "Music/Complete.mp3",
    mint: "Music/CardMint.mp3",
    dailyChallenge: "Music/DailyChallenge.mp3",
    musicCard: "Music/MusicCard.mp3"
};


/* =========================================================
   INDEXEDDB
   Custom tones are stored here.
========================================================= */

const SOUND_DB_NAME = "standout-sounds";
const SOUND_DB_VERSION = 1;
const SOUND_STORE = "custom-tones";

let soundDB = null;


/* =========================================================
   OPEN SOUND DATABASE
========================================================= */

function openSoundDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(
            SOUND_DB_NAME,
            SOUND_DB_VERSION
        );

        request.onupgradeneeded = event => {
            const db = event.target.result;

            if (!db.objectStoreNames.contains(SOUND_STORE)) {
                db.createObjectStore(SOUND_STORE);
            }
        };

        request.onsuccess = event => {
            soundDB = event.target.result;
            resolve(soundDB);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}


/* =========================================================
   SAVE CUSTOM TONE
========================================================= */

function saveCustomTone(type, file) {
    return new Promise(async (resolve, reject) => {
        try {
            const db = soundDB || await openSoundDB();

            const transaction = db.transaction(
                SOUND_STORE,
                "readwrite"
            );

            const store = transaction.objectStore(SOUND_STORE);

            store.put({
                blob: file,
                name: file.name,
                type: file.type
            }, type);

            transaction.oncomplete = () => {
                resolve();
            };

            transaction.onerror = () => {
                reject(transaction.error);
            };
        } catch (error) {
            reject(error);
        }
    });
}


/* =========================================================
   GET CUSTOM TONE
========================================================= */

function getCustomTone(type) {
    return new Promise(async (resolve, reject) => {
        try {
            const db = soundDB || await openSoundDB();

            const transaction = db.transaction(
                SOUND_STORE,
                "readonly"
            );

            const store = transaction.objectStore(SOUND_STORE);
            const request = store.get(type);

            request.onsuccess = () => {
                resolve(request.result || null);
            };

            request.onerror = () => {
                reject(request.error);
            };
        } catch (error) {
            reject(error);
        }
    });
}


/* =========================================================
   LOAD SOUND SETTINGS
========================================================= */

function loadSoundSettings() {
    try {
        const saved = localStorage.getItem(SOUND_SETTINGS_KEY);

        if (!saved) {
            return { ...DEFAULT_SOUND_SETTINGS };
        }

        return {
            ...DEFAULT_SOUND_SETTINGS,
            ...JSON.parse(saved)
        };
    } catch (error) {
        console.error("Failed to load sound settings:", error);
        return { ...DEFAULT_SOUND_SETTINGS };
    }
}


/* =========================================================
   CURRENT SOUND SETTINGS
========================================================= */

let soundSettings = loadSoundSettings();


/* =========================================================
   SAVE SOUND SETTINGS
========================================================= */

function saveSoundSettings() {
    try {
        localStorage.setItem(
            SOUND_SETTINGS_KEY,
            JSON.stringify(soundSettings)
        );
    } catch (error) {
        console.error("Failed to save sound settings:", error);
    }
}


/* =========================================================
   ACTIVE EVENT SOUND
========================================================= */

let activeTone = null;
let toneTimeout = null;
let toneRequestId = 0;


/* =========================================================
   GLOBAL AUDIO CONTROLLER
   Only one application audio source may play at a time.
========================================================= */

function stopAllAppAudio() {
    // Stop event tone
    if (typeof stopActiveTone === "function") {
        stopActiveTone();
    }

    // Stop Account preview
    if (typeof stopPreview === "function") {
        stopPreview();
    }

    // Stop timer music
    if (typeof stopAllMusic === "function") {
        stopAllMusic();
    }

    // Stop achievement / goal videos
    document
        .querySelectorAll(
            ".goal-achievement-video video, #mintReveal video"
        )
        .forEach(video => {
            try {
                video.pause();
                video.currentTime = 0;
            } catch (error) {
                console.warn(
                    "Could not stop application video:",
                    error
                );
            }
        });
}


/* =========================================================
   STOP ACTIVE TONE
========================================================= */

function stopActiveTone() {
    if (toneTimeout) {
        clearTimeout(toneTimeout);
        toneTimeout = null;
    }

    if (!activeTone) {
        return;
    }

    activeTone.pause();
    activeTone.currentTime = 0;

    if (activeTone._objectUrl) {
        URL.revokeObjectURL(activeTone._objectUrl);
    }

    activeTone = null;
}

/* =========================================================
   PLAY APP TONE
   Used by actual app events.
========================================================= */

async function playAppTone(type) {
    const setting = soundSettings[type];

    // No valid setting
    if (!setting) {
        return null;
    }

    // Sound disabled
    if (setting === "none") {
        return null;
    }

    // Invalidate older requests that are still loading
    const requestId = ++toneRequestId;

    // Stop everything currently playing
    stopAllAppAudio();

    let audio = null;

    /* =====================================================
       CUSTOM TONE
    ===================================================== */

    if (setting === "custom") {
        try {
            const custom = await getCustomTone(type);

            if (requestId !== toneRequestId) {
                return null;
            }

            if (!custom || !custom.blob) {
                console.warn("Custom tone not found:", type);
                return null;
            }

            const url = URL.createObjectURL(custom.blob);
            audio = new Audio(url);
            audio._objectUrl = url;
        } catch (error) {
            console.error("Failed to load custom tone:", error);
            return null;
        }
    }

    /* =====================================================
       DEFAULT TONE
    ===================================================== */

    else {
        const src = SOUND_FILES[type];

        if (!src) {
            return null;
        }

        audio = new Audio(src);
    }

    // Check whether another tone was requested while loading
    if (requestId !== toneRequestId) {
        if (audio?._objectUrl) {
            URL.revokeObjectURL(audio._objectUrl);
        }

        return null;
    }

    audio.volume = 0.7;
    activeTone = audio;

    audio.onended = () => {
        if (activeTone === audio) {
            if (audio._objectUrl) {
                URL.revokeObjectURL(audio._objectUrl);
            }

            activeTone = null;
        }
    };

    try {
        await audio.play();

        if (requestId !== toneRequestId) {
            if (activeTone === audio) {
                stopActiveTone();
            }

            return null;
        }

        // Maximum tone duration: 5 seconds
        toneTimeout = setTimeout(() => {
            if (activeTone === audio) {
                stopActiveTone();
            }
        }, 15000);

        return audio;
    } catch (error) {
        console.warn("Unable to play tone:", error);

        if (activeTone === audio) {
            activeTone = null;
        }

        if (audio._objectUrl) {
            URL.revokeObjectURL(audio._objectUrl);
        }

        return null;
    }
}


/* =========================================================
   UPDATE SOUND SETTING
========================================================= */

function updateSoundSetting(type, value) {
    if (
        !Object.prototype.hasOwnProperty.call(
            DEFAULT_SOUND_SETTINGS,
            type
        )
    ) {
        return;
    }

    soundSettings[type] = value;

    saveSoundSettings();
    updateToneControls(type);
}


/* =========================================================
   PREVIEW SYSTEM
   Account page only.
========================================================= */

let previewAudio = null;
let previewType = null;


/* =========================================================
   STOP PREVIEW
========================================================= */

function stopPreview() {
    if (!previewAudio) {
        return;
    }

    previewAudio.pause();
    previewAudio.currentTime = 0;

    if (previewAudio._objectUrl) {
        URL.revokeObjectURL(previewAudio._objectUrl);
    }

    if (previewType) {
        const prefix = {
            achievement: "achievement",
            mission: "mission",
            mint: "mint",
            dailyChallenge: "dailyChallenge",
            musicCard: "musicCard"
        }[previewType] || previewType;

        const button = document.getElementById(
            `${prefix}PreviewBtn`
        );

        if (button) {
            button.textContent = "▶";
        }
    }

    previewAudio = null;
    previewType = null;
}


/* =========================================================
   PREVIEW TONE
   Play / Stop toggle.
========================================================= */

async function previewTone(type) {
    // Click the same button while playing to stop
    if (previewAudio && previewType === type) {
        stopPreview();
        return;
    }

    // Stop all other application audio
    stopAllAppAudio();
    stopPreview();

    const setting = soundSettings[type];

    if (!setting || setting === "none") {
        return;
    }

    let audio = null;

    if (setting === "custom") {
        try {
            const custom = await getCustomTone(type);

            if (!custom || !custom.blob) {
                console.warn("Custom tone not found:", type);
                return;
            }

            const url = URL.createObjectURL(custom.blob);
            audio = new Audio(url);
            audio._objectUrl = url;
        } catch (error) {
            console.error("Failed to load preview:", error);
            return;
        }
    } else {
        const src = SOUND_FILES[type];

        if (!src) {
            return;
        }

        audio = new Audio(src);
    }

    previewAudio = audio;
    previewType = type;
    audio.volume = 0.7;

    const prefix = {
        achievement: "achievement",
        mission: "mission",
        mint: "mint",
        dailyChallenge: "dailyChallenge",
        musicCard: "musicCard"
    }[type] || type;

    const button = document.getElementById(
        `${prefix}PreviewBtn`
    );

    if (button) {
        button.textContent = "■";
    }

    audio.onended = () => {
        if (previewAudio === audio) {
            stopPreview();
        }
    };

    try {
        await audio.play();
    } catch (error) {
        console.warn("Unable to preview tone:", error);

        if (previewAudio === audio) {
            stopPreview();
        }
    }
}

/* =========================================================
   UPDATE ACCOUNT UI
========================================================= */

async function updateToneControls(type) {
    const prefix = {
        achievement: "achievement",
        mission: "mission",
        mint: "mint",
        dailyChallenge: "dailyChallenge",
        musicCard: "musicCard"
    }[type] || type;

    const select = document.getElementById(`${prefix}Tone`);
    const choose = document.getElementById(`${prefix}ChooseBtn`);
    const preview = document.getElementById(`${prefix}PreviewBtn`);
    const fileName = document.getElementById(`${prefix}ToneName`);

    if (!select) {
        return;
    }

    select.value = soundSettings[type];

    /* CUSTOM */

    if (soundSettings[type] === "custom") {
        let custom = null;

        try {
            custom = await getCustomTone(type);
        } catch (error) {
            console.error("Failed to read custom tone:", error);
        }

        if (choose) {
            choose.textContent = custom?.name ? "Change" : "Choose";
            choose.title = custom?.name || "";
        }

        if (preview) {
            preview.disabled = !custom;
        }

        if (fileName) {
            fileName.textContent = custom?.name
                ? custom.name
                : "No custom tone selected";
        }

        return;
    }

    /* DEFAULT */

    if (soundSettings[type] === "default") {
        if (choose) {
            choose.textContent = "Choose";
            choose.title = "";
        }

        if (preview) {
            preview.disabled = false;
        }

        if (fileName) {
            fileName.textContent = "Using default tone";
        }

        return;
    }

    /* NONE */

    if (soundSettings[type] === "none") {
        if (choose) {
            choose.textContent = "Choose";
            choose.title = "";
        }

        if (preview) {
            preview.disabled = false;
        }

        if (fileName) {
            fileName.textContent = "Sound disabled";
        }
    }
}

/* =========================================================
   INITIALIZE ACCOUNT SOUND SETTINGS
========================================================= */

async function initializeSoundSettings() {
    // Open database
    try {
        await openSoundDB();
    } catch (error) {
        console.error("Sound database failed:", error);
    }

    const configs = [
        {
            type: "achievement",
            select: "achievementTone",
            file: "achievementToneFile",
            choose: "achievementChooseBtn",
            preview: "achievementPreviewBtn"
        },
        {
            type: "mission",
            select: "missionTone",
            file: "missionToneFile",
            choose: "missionChooseBtn",
            preview: "missionPreviewBtn"
        },
        {
            type: "mint",
            select: "mintTone",
            file: "mintToneFile",
            choose: "mintChooseBtn",
            preview: "mintPreviewBtn"
        },
        {
            type: "dailyChallenge",
            select: "dailyChallengeTone",
            file: "dailyChallengeToneFile",
            choose: "dailyChallengeChooseBtn",
            preview: "dailyChallengePreviewBtn"
        },
        {
            type: "musicCard",
            select: "musicCardTone",
            file: "musicCardToneFile",
            choose: "musicCardChooseBtn",
            preview: "musicCardPreviewBtn"
        }
    ];

    configs.forEach(config => {
        const select = document.getElementById(config.select);
        const fileInput = document.getElementById(config.file);
        const choose = document.getElementById(config.choose);
        const preview = document.getElementById(config.preview);

        // Skip sound types that don't have Account UI controls
        if (!select) {
            return;
        }

        // Restore saved setting
        select.value = soundSettings[config.type];

        // Handle setting changes
        select.addEventListener("change", () => {
            stopPreview();

            updateSoundSetting(
                config.type,
                select.value
            );
        });

        // Open custom audio file picker
        if (choose && fileInput) {
            choose.addEventListener("click", () => {
                fileInput.click();
            });
        }

        // Handle selected custom audio
        if (fileInput) {
            fileInput.addEventListener("change", async () => {
                const file = fileInput.files?.[0];

                if (!file) {
                    return;
                }

                // Validate audio file
                if (!file.type.startsWith("audio/")) {
                    alert("Please choose an audio file.");
                    fileInput.value = "";
                    return;
                }

                try {
                    stopPreview();

                    // Save custom sound in IndexedDB
                    await saveCustomTone(
                        config.type,
                        file
                    );

                    // Automatically activate custom sound
                    soundSettings[config.type] = "custom";

                    saveSoundSettings();

                    select.value = "custom";

                    await updateToneControls(config.type);

                    console.log(
                        `Custom ${config.type} tone saved:`,
                        file.name
                    );
                } catch (error) {
                    console.error(
                        "Failed to save custom tone:",
                        error
                    );

                    alert("Could not save this audio file.");
                }

                // Allow selecting the same file again
                fileInput.value = "";
            });
        }

        // Preview button
        if (preview) {
            preview.addEventListener("click", async () => {
                await previewTone(config.type);
            });
        }
    });

    // Restore all available Account controls
    await Promise.all(
        configs.map(config =>
            updateToneControls(config.type)
        )
    );
}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeSoundSettings
);


/* =========================================================
   LEGACY COMPATIBILITY BRIDGE
   Keep the public names used by existing classic scripts.
========================================================= */

export const sound = Object.freeze({
    get settings() {
        return soundSettings;
    },
    get defaults() {
        return DEFAULT_SOUND_SETTINGS;
    },
    loadSoundSettings,
    saveSoundSettings,
    openSoundDB,
    saveCustomTone,
    getCustomTone,
    stopAllAppAudio,
    stopActiveTone,
    playAppTone,
    updateSoundSetting,
    stopPreview,
    previewTone,
    updateToneControls,
    initializeSoundSettings
});

const soundPublicApi = {
    loadSoundSettings,
    saveSoundSettings,
    openSoundDB,
    saveCustomTone,
    getCustomTone,
    stopAllAppAudio,
    stopActiveTone,
    playAppTone,
    updateSoundSetting,
    stopPreview,
    previewTone,
    updateToneControls,
    initializeSoundSettings
};

for (const [name, value] of Object.entries(soundPublicApi)) {
    Object.defineProperty(window, name, {
        configurable: true,
        enumerable: true,
        writable: true,
        value
    });
}

// Classic scripts still read and assign these names. Accessors keep their
// values synchronized with this ES module's private lexical state.
Object.defineProperty(window, "soundSettings", {
    configurable: true,
    enumerable: true,
    get: () => soundSettings,
    set: (value) => {
        if (value && typeof value === "object" && !Array.isArray(value)) {
            soundSettings = value;
        }
    }
});

Object.defineProperty(window, "DEFAULT_SOUND_SETTINGS", {
    configurable: true,
    enumerable: true,
    get: () => DEFAULT_SOUND_SETTINGS
});
