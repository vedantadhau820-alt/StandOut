
if (!window.cardCatalog) {
    console.error("❌ cardCatalog not loaded");
    window.cardCatalog = [];
}

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/service-worker.js").then(reg => {

        // 🔥 Update found → downloading started.
        reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (!newWorker) return;

            showUpdatingIndicator(); // 👈 IMMEDIATE feedback

            newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed") {
                    if (navigator.serviceWorker.controller) {
                        showUpdateReadyIndicator();
                    }
                }
            });
        });

        // 🔥 New SW takes control
        navigator.serviceWorker.addEventListener("controllerchange", () => {
            hideUpdatingIndicator();
            location.reload();
        });
    });
}

function showUpdatingIndicator() {
    if (document.getElementById("sw-updating")) return;

    const bar = document.createElement("div");
    bar.id = "sw-updating";

    bar.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #f59e0b;
    color: #000;
    padding: 6px;
    text-align: center;
    font-size: 13px;
    z-index: 99999;
  `;

    bar.textContent = "⬇️ Updating app...";
    document.body.appendChild(bar);
}

function hideUpdatingIndicator() {
    document.getElementById("sw-updating")?.remove();
}

function showUpdateReadyIndicator() {
    showSmartNotification(
        "Update Ready",
        "New version downloaded."
    );
}

let dots = 0;
setInterval(() => {
    const el = document.getElementById("sw-updating");
    if (!el) return;
    dots = (dots + 1) % 4;
    el.textContent = "⬇️ Updating app" + ".".repeat(dots);
}, 500);


let currentMarketplaceFilter = "ALL";

function getISTDate() {
    return new Date(
        new Date().toLocaleString("en-US", {
            timeZone: "Asia/Kolkata"
        })
    );
}

function getTodayKey() {
    return getISTDate().toISOString().slice(0, 10);
}

function enforceDailyReset() {
    const today = getTodayKey();

    if (lastImprovementDate !== today) {
        dailyImprovementCount = 0;
        lastImprovementDate = today;

        localStorage.setItem("dailyImprovementCount", "0");
        localStorage.setItem("lastImprovementDate", today);

        console.log("✅ Daily reset enforced:", today);
    }
}

window.addEventListener("load", () => {
    enforceDailyReset();
});

setInterval(enforceDailyReset, 60 * 1000);

function getAppSnapshot() {
    return {
        version: "2.1.0",
        exportedAt: getISTDate().toISOString().slice(0, 10),

        completedMissions,
        dailyImprovementCount,
        lastImprovementDate,

        missions: localStorage.getItem("missions") || "",
        skills: localStorage.getItem("skills") || "",
        goals: localStorage.getItem("goals") || "",

        countdowns: JSON.parse(JSON.stringify(countdowns || [])),
        ownedCards: JSON.parse(JSON.stringify(ownedCards || {})),

        achievements: JSON.parse(JSON.stringify(achievementsData || [])),
        notifications: JSON.parse(JSON.stringify(appNotifications || [])),
        lastNotifCount: Number(localStorage.getItem("lastNotifCount")) || 0
    };
}

function restoreAppSnapshot(data) {
    resetData(true); // silent reset

    completedMissions = Number(data.completedMissions) || 0;
    dailyImprovementCount = Number(data.dailyImprovementCount) || 0;
    lastImprovementDate = data.lastImprovementDate || getISTDate().toISOString().slice(0, 10);

    localStorage.setItem("missions", data.missions || "");
    localStorage.setItem("skills", data.skills || "");
    localStorage.setItem("goals", data.goals || "");

    countdowns = Array.isArray(data.countdowns) ? data.countdowns : [];
    saveCountdowns();

    ownedCards = typeof data.ownedCards === "object" ? data.ownedCards : {};
    localStorage.setItem("ownedCards", JSON.stringify(ownedCards));

    achievementsData = Array.isArray(data.achievements)
        ? data.achievements
        : achievements.map(a => ({ ...a, unlocked: false }));

    localStorage.setItem("achievements", JSON.stringify(achievementsData));

    appNotifications = Array.isArray(data.notifications) ? data.notifications : [];
    localStorage.setItem("appNotifications", JSON.stringify(appNotifications));
    localStorage.setItem("lastNotifCount", data.lastNotifCount || 0);

    localStorage.setItem("completedMissions", completedMissions);
    localStorage.setItem("dailyImprovementCount", dailyImprovementCount);
    localStorage.setItem("lastImprovementDate", lastImprovementDate);

    loadData();
    renderAchievements();
    renderCountdowns();
    renderMarketplace();
    renderMyCards();
    updateNotificationBadge();

    document.getElementById("missionCounter").textContent = completedMissions;
}

/* =========================================================
   COMPLETE BACKUP
   Everything EXCEPT custom audio
========================================================= */

async function saveProgressToFile() {

    try {

        /* =====================================================
           1. COLLECT ALL LOCAL STORAGE
        ===================================================== */

        const localStorageData = {};

        for (
            let i = 0;
            i < localStorage.length;
            i++
        ) {

            const key =
                localStorage.key(i);

            if (!key) {
                continue;
            }

            localStorageData[key] =
                localStorage.getItem(key);

        }


        /* =====================================================
           2. COLLECT RUNTIME APPLICATION STATE
        ===================================================== */

        const runtimeState = {};


        /* -----------------------------------------------------
           MISSIONS
        ----------------------------------------------------- */

        if (
            typeof missions !==
            "undefined"
        ) {

            runtimeState.missions =
                JSON.parse(
                    JSON.stringify(
                        missions || []
                    )
                );

        }


        /* -----------------------------------------------------
           GOALS
        ----------------------------------------------------- */

        if (
            typeof goalsData !==
            "undefined"
        ) {

            runtimeState.goalsData =
                JSON.parse(
                    JSON.stringify(
                        goalsData || []
                    )
                );

        }


        /* -----------------------------------------------------
           COUNTDOWNS
        ----------------------------------------------------- */

        if (
            typeof countdowns !==
            "undefined"
        ) {

            runtimeState.countdowns =
                JSON.parse(
                    JSON.stringify(
                        countdowns || []
                    )
                );

        }


        /* -----------------------------------------------------
           COMPLETED MISSIONS
        ----------------------------------------------------- */

        if (
            typeof completedMissions !==
            "undefined"
        ) {

            runtimeState.completedMissions =
                Number(
                    completedMissions
                ) || 0;

        }


        /* -----------------------------------------------------
           DAILY IMPROVEMENT
        ----------------------------------------------------- */

        if (
            typeof dailyImprovementCount !==
            "undefined"
        ) {

            runtimeState.dailyImprovementCount =
                Number(
                    dailyImprovementCount
                ) || 0;

        }


        if (
            typeof lastImprovementDate !==
            "undefined"
        ) {

            runtimeState.lastImprovementDate =
                lastImprovementDate;

        }


        /* -----------------------------------------------------
           OWNED CARDS
        ----------------------------------------------------- */

        if (
            typeof ownedCards !==
            "undefined"
        ) {

            runtimeState.ownedCards =
                JSON.parse(
                    JSON.stringify(
                        ownedCards || {}
                    )
                );

        }


        /* -----------------------------------------------------
           ACHIEVEMENTS / BADGES
        ----------------------------------------------------- */

        if (
            typeof achievementsData !==
            "undefined"
        ) {

            runtimeState.achievementsData =
                JSON.parse(
                    JSON.stringify(
                        achievementsData || []
                    )
                );

        }


        /* -----------------------------------------------------
           NOTIFICATIONS
        ----------------------------------------------------- */

        if (
            typeof appNotifications !==
            "undefined"
        ) {

            runtimeState.appNotifications =
                JSON.parse(
                    JSON.stringify(
                        appNotifications || []
                    )
                );

        }


        /* -----------------------------------------------------
           SOUND SETTINGS
        ----------------------------------------------------- */

        if (
            typeof soundSettings !==
            "undefined"
        ) {

            runtimeState.soundSettings =
                JSON.parse(
                    JSON.stringify(
                        soundSettings || {}
                    )
                );

        }


        /* =====================================================
           3. MONTHLY REPORT
        ===================================================== */

        const monthlyReport = {};


        /* -----------------------------------------------------
           MONTHLY REPORT RUNTIME DATA
        ----------------------------------------------------- */

        if (
            typeof monthlyReportData !==
            "undefined"
        ) {

            monthlyReport.monthlyReportData =
                JSON.parse(
                    JSON.stringify(
                        monthlyReportData
                    )
                );

        }


        if (
            typeof monthlySummaryData !==
            "undefined"
        ) {

            monthlyReport.monthlySummaryData =
                JSON.parse(
                    JSON.stringify(
                        monthlySummaryData
                    )
                );

        }


        if (
            typeof monthlyStats !==
            "undefined"
        ) {

            monthlyReport.monthlyStats =
                JSON.parse(
                    JSON.stringify(
                        monthlyStats || {}
                    )
                );

        }


        /* =====================================================
           4. COLLECT MONTHLY-RELATED LOCAL STORAGE
        ===================================================== */

        monthlyReport.storage = {};


        for (
            let i = 0;
            i < localStorage.length;
            i++
        ) {

            const key =
                localStorage.key(i);

            if (!key) {
                continue;
            }


            /*
             * Anything related to the monthly report
             * is preserved separately as well.
             */

            const lowerKey =
                key.toLowerCase();


            if (
                lowerKey.includes(
                    "monthly"
                ) ||
                lowerKey.includes(
                    "momentum"
                ) ||
                lowerKey.includes(
                    "consistency"
                )
            ) {

                monthlyReport.storage[key] =
                    localStorage.getItem(key);

            }

        }


        /* =====================================================
           5. GET CUSTOM CARDS
        ===================================================== */

        let customCards = [];


        try {

            if (
                typeof getCustomCards ===
                "function"
            ) {

                customCards =
                    await getCustomCards();

            }

        } catch (error) {

            console.error(
                "Failed to backup custom cards:",
                error
            );

        }


        /* =====================================================
           6. GET CUSTOM AUDIO
        ===================================================== */

        let customAudio = [];


        try {

            /*
             * If your app exposes a function for retrieving
             * custom audio, use it.
             */

            if (
                typeof getCustomAudio ===
                "function"
            ) {

                customAudio =
                    await getCustomAudio();

            }

        } catch (error) {

            console.error(
                "Failed to backup custom audio:",
                error
            );

        }


        /* =====================================================
           7. BACKGROUND STATE
        ===================================================== */

        const backgroundState = {};


        /*
         * First capture known runtime variables.
         */

        if (
            typeof customBackground !==
            "undefined"
        ) {

            backgroundState.customBackground =
                customBackground;

        }


        if (
            typeof customBackgroundImage !==
            "undefined"
        ) {

            backgroundState.customBackgroundImage =
                customBackgroundImage;

        }


        if (
            typeof backgroundImage !==
            "undefined"
        ) {

            backgroundState.backgroundImage =
                backgroundImage;

        }


        /*
         * Capture background-related localStorage
         * independently so nothing gets lost.
         */

        backgroundState.storage = {};


        for (
            let i = 0;
            i < localStorage.length;
            i++
        ) {

            const key =
                localStorage.key(i);

            if (!key) {
                continue;
            }


            const lowerKey =
                key.toLowerCase();


            if (
                lowerKey.includes(
                    "background"
                ) ||
                lowerKey.includes(
                    "custombg"
                )
            ) {

                backgroundState.storage[key] =
                    localStorage.getItem(key);

            }

        }


        /* =====================================================
           8. CARD CATALOG
        ===================================================== */

        let cardCatalog = [];


        if (
            Array.isArray(
                window.cardCatalog
            )
        ) {

            cardCatalog =
                JSON.parse(
                    JSON.stringify(
                        window.cardCatalog
                    )
                );

        }


        /* =====================================================
           9. CREATE COMPLETE BACKUP
        ===================================================== */

        const backup = {

            /* -------------------------------------------------
               BACKUP INFORMATION
            ------------------------------------------------- */

            backupVersion: 4,

            backupType:
                "STANDOUT_COMPLETE",

            createdAt:
                new Date().toISOString(),


            /* -------------------------------------------------
               LOCAL STORAGE
            ------------------------------------------------- */

            localStorage:
                localStorageData,


            /* -------------------------------------------------
               RUNTIME STATE
            ------------------------------------------------- */

            runtimeState:
                runtimeState,


            /* -------------------------------------------------
               MONTHLY REPORT
            ------------------------------------------------- */

            monthlyReport:
                monthlyReport,


            /* -------------------------------------------------
               BACKGROUND
            ------------------------------------------------- */

            background:
                backgroundState,


            /* -------------------------------------------------
               CUSTOM CARDS
            ------------------------------------------------- */

            customCards:
                customCards,


            /* -------------------------------------------------
               CUSTOM AUDIO
            ------------------------------------------------- */

            customAudio:
                customAudio,


            /* -------------------------------------------------
               CARD CATALOG
            ------------------------------------------------- */

            cardCatalog:
                cardCatalog

        };


        /* =====================================================
           10. CONVERT TO JSON
        ===================================================== */

        const json =
            JSON.stringify(
                backup,
                null,
                2
            );


        /* =====================================================
           11. CREATE FILE
        ===================================================== */

        const blob =
            new Blob(
                [json],
                {
                    type:
                        "application/json"
                }
            );


        /* =====================================================
           12. DOWNLOAD
        ===================================================== */

        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            url;


        link.download =
    `standout-backup-${getBackupDate()}-${Date.now()}.json`;


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        URL.revokeObjectURL(
            url
        );


        /* =====================================================
           13. SUCCESS
        ===================================================== */

        customAlert(
            "Complete backup created successfully."
        );


        console.log(
            "✓ Complete Standout backup created",
            backup
        );


    } catch (error) {

        console.error(
            "Backup failed:",
            error
        );


        customAlert(
            "Could not create complete backup."
        );

    }

    checkMissedDeadlines()

}

/* =========================================================
   BACKUP DATE
========================================================= */

function getBackupDate() {

    const date =
        new Date();

    return [

        date.getFullYear(),

        String(
            date.getMonth() + 1
        ).padStart(2, "0"),

        String(
            date.getDate()
        ).padStart(2, "0")

    ].join("-");

}

/* =========================================================
   COMPLETE RESTORE
   Restores EVERYTHING from backup
   EXCEPT custom audio
========================================================= */

async function loadProgressFromFile() {

    try {

        /* =====================================================
           1. CREATE FILE INPUT
        ===================================================== */

        const input =
            document.createElement("input");

        input.type = "file";
        input.accept = ".json,application/json";


        /* =====================================================
           2. WAIT FOR FILE
        ===================================================== */

        const file =
            await new Promise(resolve => {

                input.onchange = () => {

                    resolve(
                        input.files?.[0] ||
                        null
                    );

                };

                input.click();

            });


        if (!file) {

            return;

        }


        /* =====================================================
           3. READ FILE
        ===================================================== */

        const text =
            await file.text();

        let backup;


        try {

            backup =
                JSON.parse(text);

        } catch (error) {

            customAlert(
                "This backup file is not valid."
            );

            return;

        }


        /* =====================================================
           4. VALIDATE BACKUP
        ===================================================== */

        if (
            !backup ||
            backup.backupType !==
            "STANDOUT_COMPLETE"
        ) {

            customAlert(
                "This is not a valid Standout backup."
            );

            return;

        }


        if (
            !backup.localStorage ||
            typeof backup.localStorage !==
            "object"
        ) {

            customAlert(
                "Backup data is incomplete."
            );

            return;

        }


        /* =====================================================
           5. CONFIRM RESTORE
        ===================================================== */

        function customConfirm(
            message,
            title = "Are you sure?"
        ) {

            return new Promise(resolve => {

                const overlay =
                    document.createElement(
                        "div"
                    );


                overlay.className =
                    "custom-confirm-overlay";


                overlay.innerHTML = `

                    <div
                        class="custom-confirm-card"
                    >

                        <div
                            class="
                                custom-confirm-title
                            "
                        >
                            ${escapeHTML(title)}
                        </div>


                        <div
                            class="
                                custom-confirm-message
                            "
                        >
                            ${escapeHTML(message)}
                        </div>


                        <div
                            class="
                                custom-confirm-actions
                            "
                        >

                            <button
                                type="button"
                                class="
                                    custom-confirm-cancel
                                "
                            >
                                Cancel
                            </button>


                            <button
                                type="button"
                                class="
                                    custom-confirm-ok
                                "
                            >
                                Continue
                            </button>

                        </div>

                    </div>

                `;


                document.body.appendChild(
                    overlay
                );


                const cancel =
                    overlay.querySelector(
                        ".custom-confirm-cancel"
                    );


                const ok =
                    overlay.querySelector(
                        ".custom-confirm-ok"
                    );


                function close(result) {

                    overlay.classList.remove(
                        "active"
                    );


                    setTimeout(() => {

                        overlay.remove();

                        resolve(result);

                    }, 200);

                }


                cancel.onclick =
                    () => close(false);


                ok.onclick =
                    () => close(true);


                overlay.addEventListener(
                    "click",
                    event => {

                        if (
                            event.target ===
                            overlay
                        ) {

                            close(false);

                        }

                    }
                );


                requestAnimationFrame(() => {

                    requestAnimationFrame(() => {

                        overlay.classList.add(
                            "active"
                        );

                    });

                });

            });

        }


        const confirmed =
            await customConfirm(
                "Your current progress will be replaced by the backup.",
                "Restore Backup?"
            );


        if (!confirmed) {

            return;

        }


        /* =====================================================
           6. STOP ACTIVE AUDIO
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
           7. CLEAR CURRENT LOCAL STORAGE
        ===================================================== */

        localStorage.clear();


        /* =====================================================
           8. RESTORE LOCAL STORAGE
        ===================================================== */

        Object.entries(
            backup.localStorage
        ).forEach(
            ([key, value]) => {

                try {

                    localStorage.setItem(
                        key,
                        value
                    );

                } catch (error) {

                    console.warn(
                        "Could not restore localStorage key:",
                        key,
                        error
                    );

                }

            }
        );

        /* =====================================================
   RELOAD IMPROVEMENT POINTS
===================================================== */

        try {

            const storedPoints =
                localStorage.getItem(
                    "completedMissions"
                );

            completedMissions =
                Math.max(
                    0,
                    Number(storedPoints) || 0
                );

        } catch (error) {

            console.warn(
                "Could not reload Improvement Points:",
                error
            );

        }

        /* =====================================================
   RELOAD MISSION HISTORY
===================================================== */

        try {

            const storedHistory =
                localStorage.getItem(
                    "missionHistory"
                );

            missionHistory =
                storedHistory
                    ? JSON.parse(storedHistory)
                    : {};

        } catch (error) {

            console.warn(
                "Could not reload mission history:",
                error
            );

        }

        /* =====================================================
           9. RESTORE RUNTIME STATE
        ===================================================== */

        const runtime =
            backup.runtimeState || {};


        if (
            Array.isArray(
                runtime.missions
            )
        ) {

            missions =
                JSON.parse(
                    JSON.stringify(
                        runtime.missions
                    )
                );

        }


        if (
            Array.isArray(
                runtime.goalsData
            )
        ) {

            goalsData =
                JSON.parse(
                    JSON.stringify(
                        runtime.goalsData
                    )
                );

        }


        if (
            Array.isArray(
                runtime.countdowns
            )
        ) {

            countdowns =
                JSON.parse(
                    JSON.stringify(
                        runtime.countdowns
                    )
                );

        }


        if (
            runtime.completedMissions !==
            undefined
        ) {

            completedMissions =
                Math.max(
                    0,
                    Number(
                        runtime.completedMissions
                    ) || 0
                );

        }


        if (
            runtime.dailyImprovementCount !==
            undefined
        ) {

            dailyImprovementCount =
                Number(
                    runtime.dailyImprovementCount
                ) || 0;

        }


        if (
            runtime.lastImprovementDate !==
            undefined
        ) {

            lastImprovementDate =
                runtime.lastImprovementDate;

        }


        if (
            runtime.ownedCards
        ) {

            ownedCards =
                JSON.parse(
                    JSON.stringify(
                        runtime.ownedCards
                    )
                );

        }


        if (
            Array.isArray(
                runtime.achievementsData
            )
        ) {

            achievementsData =
                JSON.parse(
                    JSON.stringify(
                        runtime.achievementsData
                    )
                );

        }


        if (
            Array.isArray(
                runtime.appNotifications
            )
        ) {

            appNotifications =
                JSON.parse(
                    JSON.stringify(
                        runtime.appNotifications
                    )
                );

        }


        if (
            runtime.soundSettings
        ) {

            soundSettings =
                JSON.parse(
                    JSON.stringify(
                        runtime.soundSettings
                    )
                );

        }

        /* =====================================================
   SYNC RESTORED MISSION STATE
===================================================== */

        completedMissions =
            Math.max(
                0,
                Number(
                    localStorage.getItem(
                        "completedMissions"
                    )
                ) || 0
            );


        dailyImprovementCount =
            Math.max(
                0,
                Number(
                    localStorage.getItem(
                        "dailyImprovementCount"
                    )
                ) || 0
            );


        lastImprovementDate =
            localStorage.getItem(
                "lastImprovementDate"
            ) || "";


        /* -----------------------------------------------------
           MISSION HISTORY
        ----------------------------------------------------- */

        try {

            const storedHistory =
                localStorage.getItem(
                    "missionHistory"
                );

            missionHistory =
                storedHistory
                    ? JSON.parse(storedHistory)
                    : {};

        } catch (error) {

            console.error(
                "Could not restore mission history:",
                error
            );

            missionHistory = {};

        }


        /* -----------------------------------------------------
           UPDATE COUNTER
        ----------------------------------------------------- */

        const missionCounter =
            document.getElementById(
                "missionCounter"
            );

        if (missionCounter) {

            missionCounter.textContent =
                completedMissions;

        }


        /* =====================================================
           10. RESTORE MONTHLY REPORT
        ===================================================== */

        const monthlyReport =
            backup.monthlyReport || {};


        if (
            monthlyReport.monthlyReportData !==
            undefined
        ) {

            if (
                typeof monthlyReportData !==
                "undefined"
            ) {

                monthlyReportData =
                    JSON.parse(
                        JSON.stringify(
                            monthlyReport.monthlyReportData
                        )
                    );

            }

        }


        if (
            monthlyReport.monthlySummaryData !==
            undefined
        ) {

            if (
                typeof monthlySummaryData !==
                "undefined"
            ) {

                monthlySummaryData =
                    JSON.parse(
                        JSON.stringify(
                            monthlyReport.monthlySummaryData
                        )
                    );

            }

        }


        if (
            monthlyReport.monthlyStats !==
            undefined
        ) {

            if (
                typeof monthlyStats !==
                "undefined"
            ) {

                monthlyStats =
                    JSON.parse(
                        JSON.stringify(
                            monthlyReport.monthlyStats
                        )
                    );

            }

        }


        /* =====================================================
           11. RESTORE MONTHLY STORAGE
        ===================================================== */

        if (
            monthlyReport.storage &&
            typeof monthlyReport.storage ===
            "object"
        ) {

            Object.entries(
                monthlyReport.storage
            ).forEach(
                ([key, value]) => {

                    try {

                        localStorage.setItem(
                            key,
                            value
                        );

                    } catch (error) {

                        console.warn(
                            "Could not restore monthly data:",
                            key,
                            error
                        );

                    }

                }
            );

        }


        /* =====================================================
           12. RESTORE BACKGROUND
        ===================================================== */

        const background =
            backup.background || {};


        /*
         * Restore background-related
         * localStorage values.
         */

        if (
            background.storage &&
            typeof background.storage ===
            "object"
        ) {

            Object.entries(
                background.storage
            ).forEach(
                ([key, value]) => {

                    try {

                        localStorage.setItem(
                            key,
                            value
                        );

                    } catch (error) {

                        console.warn(
                            "Could not restore background setting:",
                            key,
                            error
                        );

                    }

                }
            );

        }


        /*
         * Restore runtime background variables
         * if they exist in this version of the app.
         */

        if (
            background.customBackground !==
            undefined
        ) {

            if (
                typeof customBackground !==
                "undefined"
            ) {

                customBackground =
                    background.customBackground;

            }

        }


        if (
            background.customBackgroundImage !==
            undefined
        ) {

            if (
                typeof customBackgroundImage !==
                "undefined"
            ) {

                customBackgroundImage =
                    background.customBackgroundImage;

            }

        }


        if (
            background.backgroundImage !==
            undefined
        ) {

            if (
                typeof backgroundImage !==
                "undefined"
            ) {

                backgroundImage =
                    background.backgroundImage;

            }

        }


        /* =====================================================
           13. RESTORE CUSTOM CARDS
        ===================================================== */

        if (
            Array.isArray(
                backup.customCards
            )
        ) {

            try {

                await openCustomCardDB();


                const db =
                    customCardDB ||
                    await openCustomCardDB();


                await new Promise(
                    (resolve, reject) => {

                        const transaction =
                            db.transaction(
                                "cards",
                                "readwrite"
                            );


                        const store =
                            transaction.objectStore(
                                "cards"
                            );


                        store.clear();


                        transaction.oncomplete =
                            () => resolve();


                        transaction.onerror =
                            () => reject(
                                transaction.error
                            );

                    }
                );


                for (
                    const card
                    of backup.customCards
                ) {

                    if (
                        !card ||
                        !card.id
                    ) {

                        continue;

                    }


                    await saveCustomCard(
                        card
                    );

                }

            } catch (error) {

                console.error(
                    "Failed to restore custom cards:",
                    error
                );

                customAlert(
                    "Progress restored, but custom cards could not be restored."
                );

                return;

            }

        }


        /* =====================================================
           14. RESTORE CUSTOM AUDIO
        ===================================================== */

        if (
            Array.isArray(
                backup.customAudio
            ) &&
            backup.customAudio.length > 0
        ) {

            try {

                if (
                    typeof restoreCustomAudio ===
                    "function"
                ) {

                    await restoreCustomAudio(
                        backup.customAudio
                    );

                } else {

                    console.warn(
                        "Backup contains custom audio, but restoreCustomAudio() is not available."
                    );

                }

            } catch (error) {

                console.error(
                    "Failed to restore custom audio:",
                    error
                );

            }

        }


        /* =====================================================
           15. RESTORE CARD CATALOG
        ===================================================== */

        if (
            Array.isArray(
                backup.cardCatalog
            )
        ) {

            window.cardCatalog =
                JSON.parse(
                    JSON.stringify(
                        backup.cardCatalog
                    )
                );

        }


        /* =====================================================
           16. RELOAD SOUND SETTINGS
        ===================================================== */

        try {

            if (
                typeof loadSoundSettings ===
                "function"
            ) {

                await loadSoundSettings();

            }

        } catch (error) {

            console.warn(
                "Could not reload sound settings:",
                error
            );

        }


        /* =====================================================
           17. RELOAD MAIN DATA
        ===================================================== */

        if (
            typeof loadData ===
            "function"
        ) {

            loadData();

        }

        /* =====================================================
   RELOAD MOMENTUM
===================================================== */

        if (
            typeof Momentum !== "undefined" &&
            typeof Momentum.reload === "function"
        ) {

            Momentum.reload();

        }


        /* =====================================================
           18. LOAD CUSTOM CARDS
        ===================================================== */

        if (
            typeof loadCustomCardsIntoMarketplace ===
            "function"
        ) {

            await loadCustomCardsIntoMarketplace();

        }


        /* =====================================================
           19. REAPPLY BACKGROUND
        ===================================================== */

        try {

            if (
                typeof loadCustomBackground ===
                "function"
            ) {

                loadCustomBackground();

            }

        } catch (error) {

            console.warn(
                "Could not restore custom background:",
                error
            );

        }


        try {

            if (
                typeof renderCustomBackground ===
                "function"
            ) {

                renderCustomBackground();

            }

        } catch (error) {

            console.warn(
                "Could not render custom background:",
                error
            );

        }

        /* =====================================================
   SYNC RESTORED RUNTIME STATE
===================================================== */

        try {

            /* -------------------------------------------------
               IMPROVEMENT POINTS
            ------------------------------------------------- */

            completedMissions =
                Math.max(
                    0,
                    Number(
                        localStorage.getItem(
                            "completedMissions"
                        )
                    ) || 0
                );


            /* -------------------------------------------------
               DAILY IMPROVEMENT
            ------------------------------------------------- */

            dailyImprovementCount =
                Math.max(
                    0,
                    Number(
                        localStorage.getItem(
                            "dailyImprovementCount"
                        )
                    ) || 0
                );


            /* -------------------------------------------------
               LAST IMPROVEMENT DATE
            ------------------------------------------------- */

            lastImprovementDate =
                localStorage.getItem(
                    "lastImprovementDate"
                ) || "";


            /* -------------------------------------------------
               MISSION HISTORY
               
               IMPORTANT:
               Replace the in-memory object.
               Writing to localStorage alone does NOT update
               the existing missionHistory object.
            ------------------------------------------------- */

            const storedMissionHistory =
                localStorage.getItem(
                    "missionHistory"
                );

            missionHistory =
                storedMissionHistory
                    ? JSON.parse(
                        storedMissionHistory
                    )
                    : {};


            /* -------------------------------------------------
               UPDATE IMPROVEMENT COUNTER UI
            ------------------------------------------------- */

            const missionCounter =
                document.getElementById(
                    "missionCounter"
                );

            if (missionCounter) {

                missionCounter.textContent =
                    completedMissions;

            }


            console.log(
                "✓ Restored Improvement Points:",
                completedMissions
            );

            console.log(
                "✓ Restored Daily Improvement:",
                dailyImprovementCount
            );

            console.log(
                "✓ Restored Mission History:",
                missionHistory
            );

        } catch (error) {

            console.error(
                "Failed to synchronize restored mission state:",
                error
            );

        }

        /* =====================================================
   FINAL MOMENTUM SYNC AFTER RESTORE
===================================================== */

        if (
            typeof Momentum !== "undefined" &&
            typeof Momentum.reload === "function"
        ) {
            Momentum.reload();
        }

        /* =====================================================
           20. REFRESH UI
        ===================================================== */

        if (
            typeof renderMissions ===
            "function"
        ) {

            renderMissions();

        }


        /* =====================================================
   CHECK RESTORED MISSION DEADLINES
===================================================== */

        if (
            typeof checkMissedDeadlines ===
            "function"
        ) {

            checkMissedDeadlines();

        }

        if (
            typeof renderGoals ===
            "function"
        ) {

            renderGoals();

        }


        if (
            typeof renderSkills ===
            "function"
        ) {

            renderSkills();

        }


        if (
            typeof renderCountdowns ===
            "function"
        ) {

            renderCountdowns();

        }


        if (
            typeof renderAchievements ===
            "function"
        ) {

            renderAchievements();

        }


        if (
            typeof renderMarketplace ===
            "function"
        ) {

            renderMarketplace(
                window.currentMarketplaceFilter ||
                "ALL"
            );

        }


        if (
            typeof renderMyCards ===
            "function"
        ) {

            renderMyCards();

        }


        if (
            typeof renderCustomCardsManager ===
            "function"
        ) {

            await renderCustomCardsManager();

        }


        /* =====================================================
           21. REFRESH MONTHLY REPORT
        ===================================================== */

        if (
            typeof renderMonthlyReport ===
            "function"
        ) {

            renderMonthlyReport();

        }


        if (
            typeof renderMonthlySummary ===
            "function"
        ) {

            renderMonthlySummary();

        }


        if (
            typeof renderMonthlyGoals ===
            "function"
        ) {

            renderMonthlyGoals();

        }


        if (
            typeof renderMonthlyMomentum ===
            "function"
        ) {

            renderMonthlyMomentum();

        }


        /* =====================================================
           22. REFRESH MONTHLY BADGES
        ===================================================== */

        if (
            typeof renderMonthlyBadgePage ===
            "function"
        ) {

            renderMonthlyBadgePage();

        }


        if (
            typeof renderBadgeCollection ===
            "function"
        ) {

            renderBadgeCollection();

        }


        /* =====================================================
           23. REFRESH SOUND UI
        ===================================================== */

        if (
            typeof renderSoundSettings ===
            "function"
        ) {

            try {

                renderSoundSettings();

            } catch (error) {

                console.warn(
                    "Could not refresh sound UI:",
                    error
                );

            }

        }


        /* =====================================================
           24. SUCCESS
        ===================================================== */

        customAlert(
            "Backup restored successfully."
        );


        console.log(
            "✓ Complete Standout backup restored."
        );


    } catch (error) {

        console.error(
            "Restore failed:",
            error
        );


        customAlert(
            "Could not restore backup."
        );

    }

}

document.getElementById("importProgressFile").addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
        try {
            const text = reader.result.replace(/^\uFEFF/, "").trim();
            const data = JSON.parse(text);
            console.log("RAW FILE TEXT:", reader.result);
            console.log("PARSED DATA:", data);

            restoreAppSnapshot(data);
            customAlert("Progress restored successfully!");
        } catch (err) {
            console.error("Restore failed:", err);
            customAlert("Invalid or corrupted backup file.");
        }
    };

    reader.readAsText(file);
    e.target.value = "";
});

window.saveProgressToFile = saveProgressToFile;
window.loadProgressFromFile = loadProgressFromFile;

const DAILY_IMPROVEMENT_LIMIT = 10;

let dailyImprovementCount = parseInt(localStorage.getItem("dailyImprovementCount")) || 0;
let lastImprovementDate = localStorage.getItem("lastImprovementDate") || new Date().toDateString();


let isMarketplaceOpen = false;


let ownedCards = JSON.parse(localStorage.getItem("ownedCards")) || {};

function renderMarketplace(filterGrade = "ALL") {
    const shop = document.getElementById("cardShop");
    if (!shop) return;

    shop.innerHTML = "";

    let cards = [...window.cardCatalog];

    if (filterGrade !== "ALL") {
        cards = cards.filter(c => c.grade === filterGrade);
    }

    // ✅ SINGLE SORT (safe)
    cards.sort((a, b) => {
        const aLimited = a.limited ? 1 : 0;
        const bLimited = b.limited ? 1 : 0;
        if (aLimited !== bLimited) return bLimited - aLimited;

        const aOwned = ownedCards[a.id] ? 1 : 0;
        const bOwned = ownedCards[b.id] ? 1 : 0;
        if (aOwned !== bOwned) return bOwned - aOwned;

        const aCanBuy = completedMissions >= a.cost ? 1 : 0;
        const bCanBuy = completedMissions >= b.cost ? 1 : 0;
        if (aCanBuy !== bCanBuy) return bCanBuy - aCanBuy;

        return gradeRank(b.grade) - gradeRank(a.grade);
    });

    cards.forEach(card => {
        const isOwned = !!ownedCards[card.id];
        const expired = isExpired(card);

        if (expired && !isOwned) return;

        const canBuy = completedMissions >= card.cost;
        const mintDate =
            isOwned && ownedCards[card.id]?.mintedAt
                ? formatDate(ownedCards[card.id].mintedAt)
                : "";

        const div = document.createElement("div");
        div.className = `
      flex-card
      grade-${card.grade.toLowerCase()}
      ${isOwned ? "owned" : "locked"}
      ${card.limited ? "limited" : ""}
    `;

        div.innerHTML = `
  <img
  src="${card.image}"
  class="${isOwned ? "owned-card-image" : "market-card-image"}"
  alt="${card.title}"
>
  <span class="grade-badge">${card.grade}</span>

  ${card.limited ? `<span class="limited-badge">LIMITED</span><strong>` : ""}

  <div class="card-body">
    <h3>${card.title}</h3>
    <p class="card-quote">${card.quote}</p>

    ${card.limited && !expired && !isOwned && card.expiresAt
                ? `<h6 class="expire-text">Will expire on: ${card.expiresAt.slice(0, 10)}</h6>`
                : ""
            }

    ${isOwned
                ? `<button class="buy-btn" disabled>OWNED</button>`
                : `<button class="buy-btn" ${!canBuy ? "disabled" : ""}>
             ${card.cost} pts
           </button>`
            }

    ${isOwned && mintDate ? `<div class="mint-date">Minted on ${mintDate}</div>
    <div class="mint-date">Card Cost ${card.cost} pts</div>` : ""}
  </div>
`;


        if (!isOwned && canBuy && !expired) {
            div.querySelector(".buy-btn").onclick = () => buyCard(card.id);
        }

        shop.appendChild(div);
    });
}


function isExpired(card) {
    if (!card.limited || !card.expiresAt) return false;

    const now = window.__timeTravelNow || Date.now();
    return new Date(card.expiresAt).getTime() < now;
}

function buyCard(cardId) {
    const card = window.cardCatalog.find(c => c.id === cardId);
    if (!card) return;

    // ❌ Prevent minting expired limited cards
    if (card.limited && isExpired(card)) {
        customAlert("This limited edition card is no longer available.");
        return;
    }

    if (completedMissions < card.cost) {
        customAlert("Not enough Improvement Points.");
        return;
    }

    customConfirm(
        `Mint "${card.title}" for ${card.cost} points?\nThis is permanent.`,
        () => {
            completedMissions -= card.cost;
            document.getElementById("missionCounter").textContent = completedMissions;

            ownedCards[card.id] = {
                mintedAt: getISTDate().toISOString().slice(0, 10)   // ✅ ISO format
            };

            localStorage.setItem("ownedCards", JSON.stringify(ownedCards));
            localStorage.setItem("completedMissions", completedMissions);

            renderMarketplace(currentMarketplaceFilter);
            renderMyCards();

            // showSmartNotification(
            //   "Card Minted",
            //   `"${card.title}" is now part of your identity.`
            // );

            showMintedCard(card);
        }
    );
}


function formatDate(isoDate) {
    if (!isoDate) return "";
    const d = new Date(isoDate);
    return d.toLocaleDateString([], {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function renderMyCards() {
    const container = document.getElementById("ownedCards");
    if (!container) return;

    container.innerHTML = "";

    const ownedList = window.cardCatalog
        .filter(card => ownedCards[card.id])
        .sort((a, b) => gradeRank(b.grade) - gradeRank(a.grade));

    if (ownedList.length === 0) {
        container.innerHTML = `<p style="opacity:.6;">No cards minted yet.</p>`;
        return;
    }

    ownedList.forEach(card => {
        const data = ownedCards[card.id];

        const div = document.createElement("div");
        div.className = `flex-card owned grade-${card.grade.toLowerCase()}`;

        div.innerHTML = `
    <img src="${card.image}" alt="${card.title}">
    <span class="grade-badge">${card.grade}</span>

    <div class="card-body">
        <h3>${card.title}</h3>
        <p class="card-quote">${card.quote}</p>

        ${isOwned
                ? `
                  <p class="mint-date">
                      Minted on ${mintedAt}
                  </p>
                  <button class="buy-btn" disabled>OWNED</button>
                `
                : `
                  <button class="buy-btn" ${!canBuy ? "disabled" : ""}>
                      ${card.cost} pts
                  </button>
                `
            }
    </div>
`;


        container.appendChild(div);
    });
}

const GRADE_ORDER = ["E", "D", "C", "B", "A", "S", "w"];

function gradeRank(grade) {
    return GRADE_ORDER.indexOf(grade) + 1;
}

document.querySelectorAll(".card-filters button").forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll(".card-filters button")
            .forEach(b => b.classList.remove("active"));

        btn.classList.add("active");

        const grade = btn.textContent === "All"
            ? "ALL"
            : btn.textContent;

        currentMarketplaceFilter = grade;

        renderMarketplace(grade);
    };
});

window.addEventListener("load", () => {
    renderMarketplace();
    renderMyCards();
});


document.getElementById("marketplaceIcon").onclick = () => {
    if (isMarketplaceOpen) {
        // Close marketplace → go back to missions (or last page)
        showPage("missions");
        isMarketplaceOpen = false;
    } else {
        // Open marketplace
        showPage("marketplace-cards");
        isMarketplaceOpen = true;
    }
};

/* =========================================================
   MONTHLY REPORT TOGGLE
========================================================= */

const monthlyReportIcon = document.getElementById("monthlyReportIcon");

if (monthlyReportIcon) {
    monthlyReportIcon.addEventListener("click", () => {
        const report = document.getElementById("monthlyReport");
        const missions = document.getElementById("missions");

        if (!report || !missions) return;

        const isOpen = report.classList.contains("active");

        if (isOpen) {
            report.classList.remove("active");
            missions.classList.add("active");
        } else {
            document.querySelectorAll("section").forEach(section => {
                section.classList.remove("active");
            });

            report.classList.add("active");
            renderMonthlyReport();
        }

        updatePlusBtn(isOpen ? "missions" : "monthlyReport");
    });
}

let playlist = [];
let currentTrackIndex = 0;
let timerInterval = null;
let currentMusic = null;
let music = new Audio();

/* =========================================================
   PRESET MUSIC CACHE
========================================================= */

const MUSIC_CACHE_NAME = "mission-app-music-v1";

const MUSIC_FILES = [
    "Music/m1.mp3",
    "Music/m2.mp3",
    "Music/m3.mp3",
    "Music/m4.mp3",
    "Music/m5.mp3",
    "Music/m6.mp3"
];

async function cacheAllMusic() {

    try {

        const cache =
            await caches.open(MUSIC_CACHE_NAME);

        for (const file of MUSIC_FILES) {

            try {

                const existing =
                    await cache.match(file);

                if (existing) {
                    continue;
                }

                await cache.add(file);

                console.log(
                    "Music cached:",
                    file
                );

            } catch (error) {

                console.warn(
                    "Could not cache music:",
                    file,
                    error
                );
            }
        }

        console.log("Preset music cache ready.");

    } catch (error) {

        console.warn(
            "Music cache unavailable:",
            error
        );
    }
}

async function getCachedMusicURL(file) {

    try {

        const cache =
            await caches.open(MUSIC_CACHE_NAME);

        let response =
            await cache.match(file);

        /*
         * If the background cache has not finished yet,
         * download this specific track now.
         */
        if (!response) {

            console.log(
                "Music not cached yet. Downloading:",
                file
            );

            response =
                await fetch(file);

            if (!response.ok) {
                throw new Error(
                    `Failed to load music: ${response.status}`
                );
            }

            await cache.put(
                file,
                response.clone()
            );
        }

        const blob =
            await response.blob();

        return URL.createObjectURL(blob);

    } catch (error) {

        console.warn(
            "Cached music failed, using normal URL:",
            error
        );

        /*
         * Final fallback.
         * The music can still play even if
         * Cache Storage isn't available.
         */
        return file;
    }
}

function stopAllMusic() {
    if (!music) return;

    music.pause();
    music.onended = null;
    music.onerror = null;
    music.removeAttribute("src");
    music.load();
}


function openFolderPicker() {
    const picker = document.getElementById("folderPicker");
    if (picker) {
        picker.click();
    } else {
        console.error("❌ folderPicker not found");
    }
}

document.getElementById("folderPicker").addEventListener("change", function (e) {
    stopAllMusic();

    const files = Array.from(e.target.files)
        .filter(file => file.type.startsWith("audio/"));

    if (files.length === 0) {
        customAlert("No audio files found in this folder.");
        return;
    }

    playlist = files;
    musicMode = "playlist";
    currentTrackIndex = 0;

    // hidePresetUI(); // 🔥 HIDE preset controls

    customConfirm(
        `Play ${playlist.length} songs from this folder?`,
        () => {
            playCurrentTrack();
            closeMusicModal();
        }
    );

    e.target.value = "";
});


function resumeMusicOnUserGesture() {
    const resume = () => {
        music.play().catch(() => { });
        document.removeEventListener("click", resume);
        document.removeEventListener("touchstart", resume);
    };

    document.addEventListener("click", resume);
    document.addEventListener("touchstart", resume);
}


function playCurrentTrack() {

    stopAllAppAudio();

    if (musicMode !== "playlist") return;
    if (!playlist[currentTrackIndex]) return;

    const file = playlist[currentTrackIndex];
    const url = URL.createObjectURL(file);

    music.src = url;
    music.loop = false;
    music.volume = document.getElementById("musicVolume").value;

    music.play()
        .then(() => { })
        .catch(() => {
            // 🔥 FIX autoplay block
            resumeMusicOnUserGesture();
        });

    music.onended = () => {
        if (musicMode !== "playlist") return;

        currentTrackIndex++;
        if (currentTrackIndex >= playlist.length) {
            currentTrackIndex = 0;
        }
        playCurrentTrack();
    };
}



async function setSelectedMusic() {

    const file =
        document.getElementById("musicSelect").value;

    /*
  * Stop every other application audio source.
  */
    stopAllAppAudio();

    /*
     * "None" selected.
     */
    if (!file) {

        musicMode = "none";
        playlist = [];
        currentTrackIndex = 0;

        closeMusicModal();

        return;
    }

    musicMode = "preset";

    playlist = [];

    currentTrackIndex = 0;

    /*
     * Get the cached audio.
     * If it isn't cached yet, it will be
     * downloaded and cached now.
     */
    const audioURL =
        await getCachedMusicURL(file);

    music.src = audioURL;

    music.loop = true;

    music.volume =
        document.getElementById("musicVolume").value;

    music.load();

    try {

        await music.play();

    } catch (error) {

        console.warn(
            "Music playback waiting for user gesture:",
            error
        );
    }

    closeMusicModal();
}




function showPresetUI() {
    document.getElementById("presetControls").style.display = "block";
}

function hidePresetUI() {
    document.getElementById("presetControls").style.display = "none";
}


let musicMode = "preset"; // "preset" | "playlist"



// =========================
//   NOTIFICATION SYSTEM
// =========================

let appNotifications = JSON.parse(localStorage.getItem("appNotifications")) || [];

// Save notif list
function saveNotifications() {
    localStorage.setItem("appNotifications", JSON.stringify(appNotifications));
}

// Add new notification
function pushNotification(title, msg) {
    appNotifications.unshift({
        title,
        msg,
        time: new Date().toLocaleString()
    });

    updateNotificationBadge();
    saveNotifications();
}
function clearAllNotifications() {
    appNotifications = [];                 // Clear array
    localStorage.removeItem("appNotifications"); // Remove from localStorage
    localStorage.removeItem("lastNotifCount");   // Reset unread count tracker

    // Update UI
    document.getElementById("notificationList").innerHTML =
        `<p style="opacity:0.6;">No notifications</p>`;

    const badge = document.getElementById("notifyBadge");
    badge.style.display = "none";
    badge.textContent = "";

    console.log("All notifications cleared.");
}

// Update badge count
function updateNotificationBadge() {
    const badge = document.getElementById("notifyBadge");
    if (!badge) return;

    const lastCount = parseInt(localStorage.getItem("lastNotifCount")) || 0;

    const unread = appNotifications.length - lastCount;

    if (unread <= 0) {
        badge.style.display = "none";
    } else {
        badge.style.display = "inline-block";
        badge.textContent = unread;
    }
}

// Open/Close drawer
document.getElementById("notifyBell").onclick = (e) => {
    e.stopPropagation();
    const drawer = document.getElementById("notificationDrawer");

    if (drawer.style.display === "none") {
        renderNotifications();
        drawer.style.display = "block";

        // 🔥 Clear the badge
        const badge = document.getElementById("notifyBadge");
        // Clear badge
        badge.style.display = "none";
        badge.textContent = "";

        // Mark all as read  (but keep them in list)
        // Reset unread count
        localStorage.setItem("lastNotifCount", appNotifications.length);
        updateNotificationBadge();
        saveNotifications();
    } else {
        drawer.style.display = "none";
    }
}; // ← CLOSE THIS PROPERLY

document.getElementById("notificationDrawer").addEventListener("click", function (e) {
    e.stopPropagation();
});


document.addEventListener("click", function () {
    const drawer = document.getElementById("notificationDrawer");
    if (drawer && drawer.style.display === "block") {
        drawer.style.display = "none";
    }
});



// ----------------------------
// NOW define renderNotifications
// ----------------------------
function renderNotifications() {
    const container = document.getElementById("notificationList");
    container.innerHTML = "";

    if (appNotifications.length === 0) {
        container.innerHTML = `<p style="opacity:0.7; text-align:center;">No notifications</p>`;
        return;
    }

    appNotifications.forEach(n => {
        const div = document.createElement("div");
        div.className = "notification-card";

        div.innerHTML = `
            <strong>${n.title}</strong><br>
            <span>${n.msg}</span>
            <span class="notification-time">${n.time}</span>
        `;

        container.appendChild(div);
    });
}

// Initialize badge on load
window.addEventListener("load", updateNotificationBadge);

function showSmartNotification(title, message) {
    const popup = document.getElementById("smartNotify");
    document.getElementById("notifyTitle").innerText = title;
    document.getElementById("notifyMsg").innerText = message;

    popup.style.display = "block";
    popup.style.opacity = 0;
    popup.style.transform = "translateY(-40px)";

    setTimeout(() => {
        popup.style.transition = "all 0.4s ease";
        popup.style.opacity = 1;
        popup.style.transform = "translateY(0)";
    }, 20);

    // auto hide
    setTimeout(() => {
        popup.style.opacity = 0;
        popup.style.transform = "translateY(-40px)";
        setTimeout(() => popup.style.display = "none", 400);
    }, 3000);
}

function dailyGoalReminder() {
    const today = new Date().toDateString();
    const lastRun = localStorage.getItem("dailyGoalReminder");

    if (lastRun === today) return; // already sent today

    localStorage.setItem("dailyGoalReminder", today);

    const goals = document.querySelectorAll("#goal-list .goal");
    goals.forEach(goal => {
        const title = goal.querySelector(".goal-title")?.textContent;
        if (title) {
            pushNotification("Goal Reminder", `Don't forget your goal: "${title}"`);
        }
    });
}

/* =========================================================
1. GLOBAL VARIABLES + STORED DATA
========================================================= */
let completedMissions = parseInt(localStorage.getItem("completedMissions")) || 0;
let missionHistory = JSON.parse(localStorage.getItem("missionHistory")) || {};
window.addEventListener("load", () => {
    checkMissedDeadlines();
});

/* =========================================================
   MONTHLY REPORT — PERFORMANCE HISTORY
========================================================= */

function getPerformanceDate() {
    return getISTDate().toISOString().slice(0, 10);
}

function recordMissionPerformance(
    li,
    status,
    pointsDelta = 0
) {
    if (!li) return;

    const date =
        li.dataset.repeat !== "none" &&
            li.dataset.repeatKey
            ? li.dataset.repeatKey
            : getPerformanceDate();

    if (!missionHistory[date]) {
        missionHistory[date] = {
            completed: 0,
            missed: 0,
            pointsDelta: 0,
            events: []
        };
    }

    const missionId =
        li.dataset.missionId ||
        li.dataset.deadline ||
        li.querySelector(".mission-text")?.textContent?.trim() ||
        "unknown";

    const missionName =
        li.querySelector(".mission-text")
            ?.textContent
            ?.trim() ||
        "Mission";

    /*
     * One mission occurrence =
     *
     * mission identity + logical date
     */
    const occurrenceKey =
        `${missionId}|${date}`;

    const existingEvent =
        missionHistory[date].events.find(
            event =>
                event.key === occurrenceKey
        );

    /*
     * If this occurrence has already been
     * recorded, don't create another event.
     */
    if (existingEvent) {

        /*
         * Allow an existing event to transition
         * from "missed" → "completed" only if
         * the app legitimately allows that.
         *
         * For now, keep the first recorded state.
         */
        return;
    }

    const isRecurring =
        li.dataset.repeat &&
        li.dataset.repeat !== "none";

    const isHardcore =
        li.dataset.hardcore === "true";

    let missionType = "one-time";

    if (isHardcore) {
        missionType = "hardcore";
    } else if (isRecurring) {
        missionType = "recurring";
    }

    missionHistory[date].events.push({
        key: occurrenceKey,
        missionId,
        mission: missionName,

        type: missionType,

        status,
        pointsDelta,

        timestamp:
            new Date().toISOString()
    });

    if (status === "completed") {
        missionHistory[date].completed++;
    }

    if (status === "missed") {
        missionHistory[date].missed++;
    }

    missionHistory[date].pointsDelta +=
        pointsDelta;

    localStorage.setItem(
        "missionHistory",
        JSON.stringify(missionHistory)
    );
}

/* =========================================================
   MONTHLY REPORT — METRICS ENGINE
========================================================= */

function calculateMonthMetrics(year, month) {
    const metrics = {
        completed: 0,
        missed: 0,
        activeDays: 0,
        improvementPoints: 0,
        consistency: 0
    };

    const monthPrefix =
        `${year}-${String(month + 1).padStart(2, "0")}`;

    const days =
        Object.keys(missionHistory)
            .filter(date => date.startsWith(monthPrefix));

    days.forEach(date => {
        const day = missionHistory[date];

        if (!day) return;

        metrics.completed +=
            Number(day.completed) || 0;

        metrics.missed +=
            Number(day.missed) || 0;

        metrics.improvementPoints +=
            Number(day.pointsDelta) || 0;

        /*
         * A day counts as active when
         * something actually happened.
         */
        const events =
            Array.isArray(day.events)
                ? day.events
                : [];

        if (events.length > 0) {
            metrics.activeDays++;
        }
    });

    const totalMissions =
        metrics.completed +
        metrics.missed;

    if (totalMissions > 0) {
        metrics.consistency =
            Math.round(
                (metrics.completed /
                    totalMissions) * 100
            );
    }

    return metrics;
}

/* =========================================================
   MONTHLY REPORT — MISSION TYPE PERFORMANCE
========================================================= */

function calculateMissionTypePerformance(year, month) {

    const monthPrefix =
        `${year}-${String(month + 1).padStart(2, "0")}`;

    const result = {
        hardcore: 0,
        recurring: 0,
        oneTime: 0
    };

    Object.keys(missionHistory)
        .filter(date =>
            date.startsWith(monthPrefix)
        )
        .forEach(date => {

            const day =
                missionHistory[date];

            const events =
                Array.isArray(day.events)
                    ? day.events
                    : [];

            events.forEach(event => {

                if (event.type === "hardcore") {
                    result.hardcore++;
                }

                else if (
                    event.type === "recurring"
                ) {
                    result.recurring++;
                }

                else if (event.type === "one-time") {
                    result.oneTime++;
                }

            });

        });

    return result;
}
/* =========================================================
   MONTHLY REPORT — DAILY CONSISTENCY DATA
========================================================= */

function calculateDailyConsistency(year, month) {

    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();

    const result = [];

    for (let day = 1; day <= daysInMonth; day++) {

        const dateKey =
            `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        const dayData =
            missionHistory[dateKey];

        const completed =
            Number(dayData?.completed) || 0;

        const missed =
            Number(dayData?.missed) || 0;

        const total =
            completed + missed;

        const consistency =
            total > 0
                ? Math.round(
                    (completed / total) * 100
                )
                : null;

        result.push({
            day,
            date: dateKey,
            completed,
            missed,
            consistency
        });
    }

    return result;
}

/* =========================================================
   MONTHLY REPORT — MISSION PERFORMANCE
========================================================= */

function calculateMissionPerformance(year, month) {

    const monthPrefix =
        `${year}-${String(month + 1).padStart(2, "0")}`;

    const performance = {
        completed: 0,
        missed: 0,
        total: 0,
        completionRate: 0
    };

    Object.keys(missionHistory)
        .filter(date => date.startsWith(monthPrefix))
        .forEach(date => {

            const day =
                missionHistory[date];

            performance.completed +=
                Number(day.completed) || 0;

            performance.missed +=
                Number(day.missed) || 0;
        });


    performance.total =
        performance.completed +
        performance.missed;


    if (performance.total > 0) {

        performance.completionRate =
            Math.round(
                (
                    performance.completed /
                    performance.total
                ) * 100
            );

    }


    return performance;
}
/* =========================================================
   MONTHLY REPORT — MONTH OVERVIEW
========================================================= */

function renderMonthlyReport() {

    const now = new Date();

    const year =
        now.getFullYear();

    const month =
        now.getMonth();

    const metrics =
        calculateMonthMetrics(
            year,
            month
        );


    /* =========================
       MONTH NAME
    ========================= */

    const monthName =
        new Date(
            year,
            month,
            1
        ).toLocaleDateString(
            [],
            {
                month: "long",
                year: "numeric"
            }
        );


    /* =========================
       UPDATE UI
    ========================= */

    const monthElement =
        document.getElementById(
            "monthlyReportMonth"
        );

    const consistencyElement =
        document.getElementById(
            "monthlyConsistency"
        );

    const completedElement =
        document.getElementById(
            "monthlyCompleted"
        );

    const missedElement =
        document.getElementById(
            "monthlyMissed"
        );

    const activeDaysElement =
        document.getElementById(
            "monthlyActiveDays"
        );

    const pointsElement =
        document.getElementById(
            "monthlyImprovementPoints"
        );


    if (monthElement) {
        monthElement.textContent =
            monthName.toUpperCase();
    }

    if (consistencyElement) {
        consistencyElement.textContent =
            `${metrics.consistency}%`;
    }

    if (completedElement) {
        completedElement.textContent =
            metrics.completed;
    }

    if (missedElement) {
        missedElement.textContent =
            metrics.missed;
    }

    if (activeDaysElement) {
        activeDaysElement.textContent =
            metrics.activeDays;
    }

    if (pointsElement) {
        pointsElement.textContent =
            metrics.improvementPoints;
    }

    renderMonthlyActivityCalendar(
        year,
        month
    );

    renderMonthlyConsistencyChart(
        year,
        month
    );

    renderMonthlyMissionPerformance(
        year,
        month
    );

    renderMonthlyMomentum(
        year,
        month
    );
    renderMonthlyMomentumChart(
        year,
        month
    );
    renderMonthlyGoalsProgress(
        year,
        month
    );
    renderMonthlyInsights(
        year,
        month
    );
    renderMonthlySummary(
        year,
        month
    );
}

function getMonthlyMomentumHistory(year, month) {

    const history = Momentum.getHistory();

    const prefix =
        `${year}-${String(month + 1).padStart(2, "0")}`;

    return Object.entries(history)
        .filter(([date]) =>
            date.startsWith(prefix)
        )
        .map(([date, data]) => ({
            date: date,
            momentum: Number(data.momentum) || 0
        }))
        .sort((a, b) =>
            a.date.localeCompare(b.date)
        );
}

function generateMonthlyInsights(year, month) {

    const metrics =
        calculateMonthMetrics(year, month);

    const performance =
        calculateMissionPerformance(year, month);

    const goals =
        calculateMonthlyGoalMetrics(year, month);

    const insights = [];


    /* =========================
       MISSION PERFORMANCE
    ========================= */

    if (performance.total > 0) {

        if (performance.completionRate >= 80) {

            insights.push({
                type: "positive",
                title: "Strong execution",
                text:
                    `You completed ${performance.completionRate}% of your recorded missions.`
            });

        } else if (
            performance.completionRate >= 50
        ) {

            insights.push({
                type: "neutral",
                title: "Decent execution",
                text:
                    `You completed ${performance.completionRate}% of your recorded missions.`
            });

        } else {

            insights.push({
                type: "warning",
                title: "Execution gap",
                text:
                    `You completed ${performance.completionRate}% of your recorded missions.`
            });

        }

    }


    /* =========================
       CONSISTENCY
    ========================= */

    if (metrics.consistency >= 80) {

        insights.push({
            type: "positive",
            title: "Highly consistent",
            text:
                `Your monthly consistency reached ${metrics.consistency}%.`
        });

    } else if (
        metrics.consistency >= 50
    ) {

        insights.push({
            type: "neutral",
            title: "Room to improve consistency",
            text:
                `Your monthly consistency was ${metrics.consistency}%.`
        });

    } else {

        insights.push({
            type: "warning",
            title: "Consistency needs attention",
            text:
                `Your monthly consistency was ${metrics.consistency}%.`
        });

    }


    /* =========================
       GOALS
    ========================= */

    if (goals.total > 0) {

        if (goals.completionRate === 100) {

            insights.push({
                type: "positive",
                title: "Goals completed",
                text:
                    `You completed all ${goals.total} of your monthly goals.`
            });

        } else {

            insights.push({
                type: "neutral",
                title: "Goal progress",
                text:
                    `You completed ${goals.completed} of ${goals.total} goals.`
            });

        }

    }


    /* =========================
       MOMENTUM
    ========================= */

    if (
        metrics.activeDays > 0 &&
        metrics.momentum !== undefined
    ) {

        insights.push({
            type: "positive",
            title: "Momentum built",
            text:
                `Your current Momentum is ${metrics.momentum}.`
        });

    }


    return insights;
}

/* =========================================================
   MONTHLY REPORT — MOMENTUM METRICS
========================================================= */

function calculateMonthlyMomentum(year, month) {

    const prefix =
        `${year}-${String(month + 1).padStart(2, "0")}`;

    const history =
        Momentum.getHistory();

    const entries =
        Object.entries(history)
            .filter(([date]) =>
                date.startsWith(prefix)
            )
            .sort(
                ([a], [b]) =>
                    a.localeCompare(b)
            );


    const result = {
        started: 0,
        peak: 0,
        ended: 0,
        longest: 0,
        history: []
    };


    if (entries.length === 0) {
        return result;
    }


    /* =========================
       HISTORY
    ========================= */

    result.history =
        entries.map(
            ([date, data]) => ({
                date,
                momentum:
                    Number(data.momentum) || 0,
                energy:
                    Number(data.energy) || 0
            })
        );


    /* =========================
       STARTED
    ========================= */

    result.started =
        result.history[0].momentum;


    /* =========================
       ENDED
    ========================= */

    result.ended =
        result.history[
            result.history.length - 1
        ].momentum;


    /* =========================
       PEAK
    ========================= */

    result.peak =
        Math.max(
            ...result.history.map(
                item => item.momentum
            )
        );


    /* =========================
       LONGEST
    ========================= */

    let currentStreak = 0;

    result.history.forEach(
        item => {

            if (item.momentum > 0) {

                currentStreak =
                    item.momentum;

                result.longest =
                    Math.max(
                        result.longest,
                        currentStreak
                    );

            } else {

                currentStreak = 0;

            }

        }
    );


    return result;
}

function generateMonthlySummary(year, month) {

    const metrics =
        calculateMonthMetrics(year, month);

    const performance =
        calculateMissionPerformance(year, month);

    const goals =
        calculateMonthlyGoalMetrics(year, month);

    const monthName =
        new Date(year, month, 1)
            .toLocaleDateString([], {
                month: "long"
            });



    let opening;

    if (performance.total === 0) {

        opening =
            `${monthName} doesn't have enough recorded data for a meaningful summary.`;

    } else if (performance.completionRate >= 80) {

        opening =
            `${monthName} was a strong execution month.`;

    } else if (performance.completionRate >= 50) {

        opening =
            `${monthName} was a moderately productive month.`;

    } else {

        opening =
            `${monthName} was a challenging month.`;
    }


    let consistencyInsight;

    if (performance.total === 0) {

        consistencyInsight =
            `There isn't enough recorded activity to evaluate consistency.`;

    } else if (metrics.consistency >= 80) {

        consistencyInsight =
            `You maintained strong consistency at ${metrics.consistency}%.`;

    } else if (metrics.consistency >= 50) {

        consistencyInsight =
            `Your consistency was ${metrics.consistency}%, leaving room to build a stronger routine.`;

    } else {

        consistencyInsight =
            `Your consistency was ${metrics.consistency}%, making consistency the biggest area to improve.`;
    }

    let goalInsight = "";

    if (goals.total > 0) {

        if (goals.completionRate === 100) {

            goalInsight =
                `You completed all ${goals.total} of your goals.`;

        } else {

            goalInsight =
                `You completed ${goals.completed} of ${goals.total} goals.`;
        }

    }


    return {
        month: monthName,
        opening,
        completionRate:
            performance.completionRate,
        consistency:
            metrics.consistency,
        completedMissions:
            performance.completed,
        missedMissions:
            performance.missed,
        goalsCompleted:
            goals.completed,
        goalsTotal:
            goals.total,
        summary:
            `${opening} You completed ${performance.completionRate}% of your recorded missions. ${consistencyInsight} ${goalInsight}`
    };

}
/* =========================================================
   MONTHLY REPORT — MISSION PERFORMANCE UI
========================================================= */

function renderMonthlyMissionPerformance(year, month) {

    const performance =
        calculateMissionPerformance(
            year,
            month
        );

    const rate =
        document.getElementById(
            "missionCompletionRate"
        );

    const completed =
        document.getElementById(
            "missionPerformanceCompleted"
        );

    const missed =
        document.getElementById(
            "missionPerformanceMissed"
        );

    const total =
        document.getElementById(
            "missionPerformanceTotal"
        );


    if (rate) {
        rate.textContent =
            `${performance.completionRate}%`;
    }

    if (completed) {
        completed.textContent =
            performance.completed;
    }

    if (missed) {
        missed.textContent =
            performance.missed;
    }

    if (total) {
        total.textContent =
            performance.total;
    }

    const types =
        calculateMissionTypePerformance(
            year,
            month
        );

    const hardcore =
        document.getElementById(
            "missionHardcoreCount"
        );

    const recurring =
        document.getElementById(
            "missionRecurringCount"
        );

    const oneTime =
        document.getElementById(
            "missionOneTimeCount"
        );

    if (hardcore) {
        hardcore.textContent =
            types.hardcore;
    }

    if (recurring) {
        recurring.textContent =
            types.recurring;
    }

    if (oneTime) {
        oneTime.textContent =
            types.oneTime;
    }
}

function renderMonthlyMomentumChart(year, month) {

    const container =
        document.getElementById(
            "monthlyMomentumChart"
        );

    if (!container) {
        return;
    }

    const history =
        getMonthlyMomentumHistory(
            year,
            month
        );

    container.innerHTML = "";


    const yAxis =
        document.getElementById(
            "momentumGraphYAxis"
        );

    const xAxis =
        document.getElementById(
            "momentumGraphXAxis"
        );

    const peakLabel =
        document.getElementById(
            "monthlyMomentumPeakLabel"
        );


    if (yAxis) {
        yAxis.innerHTML = "";
    }

    if (xAxis) {
        xAxis.innerHTML = "";
    }


    /* =========================================
       EMPTY STATE
    ========================================= */

    if (history.length === 0) {

        container.innerHTML = `
            <div class="momentum-graph-empty">
                No Momentum data for this month.
            </div>
        `;

        return;
    }


    /* =========================================
       VALUES
    ========================================= */

    const values =
        history.map(
            item => Number(item.momentum) || 0
        );


    const maxMomentum =
        Math.max(...values, 1);


    const graphMax =
        Math.max(
            1,
            Math.ceil(maxMomentum / 5) * 5
        );


    /* =========================================
       PEAK LABEL
    ========================================= */

    if (peakLabel) {

        peakLabel.textContent =
            `Peak ${maxMomentum}`;

    }


    /* =========================================
       Y AXIS
    ========================================= */

    if (yAxis) {

        const steps = 4;

        for (
            let i = steps;
            i >= 0;
            i--
        ) {

            const value =
                Math.round(
                    (graphMax / steps) * i
                );

            const label =
                document.createElement("span");

            label.textContent = value;

            yAxis.appendChild(label);
        }
    }


    /* =========================================
       SVG
    ========================================= */

    const width = 1000;
    const height = 300;

    const paddingTop = 18;
    const paddingBottom = 18;
    const paddingLeft = 8;
    const paddingRight = 8;

    const graphWidth =
        width -
        paddingLeft -
        paddingRight;

    const graphHeight =
        height -
        paddingTop -
        paddingBottom;


    const points =
        history.map(
            (item, index) => {

                const x =
                    history.length === 1
                        ? width / 2
                        : paddingLeft +
                        (
                            index /
                            (history.length - 1)
                        ) *
                        graphWidth;


                const y =
                    paddingTop +
                    graphHeight -
                    (
                        item.momentum /
                        graphMax
                    ) *
                    graphHeight;


                return {
                    x,
                    y,
                    date: item.date,
                    momentum: item.momentum
                };

            }
        );


    const svg =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg"
        );


    svg.setAttribute(
        "viewBox",
        `0 0 ${width} ${height}`
    );

    svg.setAttribute(
        "preserveAspectRatio",
        "none"
    );


    /* =========================================
       GRID
    ========================================= */

    const gridSteps = 4;

    for (
        let i = 0;
        i <= gridSteps;
        i++
    ) {

        const y =
            paddingTop +
            (
                graphHeight /
                gridSteps
            ) *
            i;


        const line =
            document.createElementNS(
                "http://www.w3.org/2000/svg",
                "line"
            );


        line.setAttribute(
            "x1",
            0
        );

        line.setAttribute(
            "x2",
            width
        );

        line.setAttribute(
            "y1",
            y
        );

        line.setAttribute(
            "y2",
            y
        );

        line.setAttribute(
            "class",
            "momentum-grid-line"
        );


        svg.appendChild(line);
    }


    /* =========================================
       AREA
    ========================================= */

    const areaPoints = [
        `${points[0].x},${height}`,
        ...points.map(
            point =>
                `${point.x},${point.y}`
        ),
        `${points[points.length - 1].x},${height}`
    ];


    const area =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "polygon"
        );


    area.setAttribute(
        "points",
        areaPoints.join(" ")
    );

    area.setAttribute(
        "class",
        "momentum-chart-area-fill"
    );


    svg.appendChild(area);


    /* =========================================
       LINE
    ========================================= */

    const line =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "polyline"
        );


    line.setAttribute(
        "points",
        points
            .map(
                point =>
                    `${point.x},${point.y}`
            )
            .join(" ")
    );


    line.setAttribute(
        "class",
        "momentum-chart-line"
    );


    svg.appendChild(line);


    /* =========================================
       POINTS
    ========================================= */

    points.forEach(
        point => {

            const circle =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "circle"
                );


            circle.setAttribute(
                "cx",
                point.x
            );

            circle.setAttribute(
                "cy",
                point.y
            );

            circle.setAttribute(
                "r",
                "5"
            );

            circle.setAttribute(
                "class",
                "momentum-chart-point"
            );


            svg.appendChild(circle);

        }
    );


    container.appendChild(svg);


    /* =========================================
       X AXIS
    ========================================= */

    if (xAxis) {

        const labels = [];


        if (history.length <= 5) {

            history.forEach(
                item => {

                    labels.push(item);

                }
            );

        } else {

            labels.push(
                history[0]
            );

            labels.push(
                history[
                Math.floor(
                    history.length / 2
                )
                ]
            );

            labels.push(
                history[
                history.length - 1
                ]
            );

        }


        labels.forEach(
            item => {

                const label =
                    document.createElement(
                        "span"
                    );


                const date =
                    new Date(
                        item.date + "T00:00:00"
                    );


                label.textContent =
                    date.toLocaleDateString(
                        [],
                        {
                            day: "numeric",
                            month: "short"
                        }
                    );


                xAxis.appendChild(
                    label
                );

            }
        );

    }

}

function getMonthlyEnergyHistory(year, month) {

    const history = Momentum.getHistory();

    const prefix =
        `${year}-${String(month + 1).padStart(2, "0")}`;

    return Object.entries(history)
        .filter(([date]) =>
            date.startsWith(prefix)
        )
        .map(([date, data]) => ({
            date: date,
            energy: Number(data.energy) || 0
        }))
        .sort((a, b) =>
            a.date.localeCompare(b.date)
        );
}
/* =========================================================
   MONTHLY REPORT — MOMENTUM JOURNEY UI
========================================================= */

function renderMonthlyMomentum(year, month) {

    const momentum =
        calculateMonthlyMomentum(
            year,
            month
        );


    const ended =
        document.getElementById(
            "monthlyMomentumEnded"
        );

    const started =
        document.getElementById(
            "monthlyMomentumStarted"
        );

    const peak =
        document.getElementById(
            "monthlyMomentumPeak"
        );

    const endedStat =
        document.getElementById(
            "monthlyMomentumEndedStat"
        );

    const longest =
        document.getElementById(
            "monthlyMomentumLongest"
        );


    if (ended) {
        ended.textContent =
            momentum.ended;
    }

    if (started) {
        started.textContent =
            momentum.started;
    }

    if (peak) {
        peak.textContent =
            momentum.peak;
    }

    if (endedStat) {
        endedStat.textContent =
            momentum.ended;
    }

    if (longest) {
        longest.textContent =
            `${momentum.longest} ${momentum.longest === 1
                ? "DAY"
                : "DAYS"
            }`;
    }

}

function renderMonthlyInsights(year, month) {

    const container =
        document.getElementById(
            "monthlyInsights"
        );

    if (!container) {
        return;
    }

    const insights =
        generateMonthlyInsights(
            year,
            month
        );

    container.innerHTML = "";


    if (insights.length === 0) {

        container.innerHTML = `
            <div class="monthly-insight-empty">
                Not enough data to generate insights yet.
            </div>
        `;

        return;
    }


    insights.forEach(insight => {

        const item =
            document.createElement("div");

        item.className =
            `monthly-insight monthly-insight-${insight.type}`;


        item.innerHTML = `
            <div class="monthly-insight-indicator"></div>

            <div class="monthly-insight-content">

                <strong>
                    ${insight.title}
                </strong>

                <span>
                    ${insight.text}
                </span>

            </div>
        `;


        container.appendChild(item);

    });

}

function renderMonthlySummary(year, month) {

    const summary =
        generateMonthlySummary(
            year,
            month
        );

    const title =
        document.getElementById(
            "monthlySummaryTitle"
        );

    const text =
        document.getElementById(
            "monthlySummaryText"
        );

    const completion =
        document.getElementById(
            "monthlySummaryCompletion"
        );

    const consistency =
        document.getElementById(
            "monthlySummaryConsistency"
        );

    const goals =
        document.getElementById(
            "monthlySummaryGoals"
        );


    if (title) {
        title.textContent =
            summary.month;
    }


    if (text) {
        text.textContent =
            summary.summary;
    }


    if (completion) {
        completion.textContent =
            `${summary.completionRate}%`;
    }


    if (consistency) {
        consistency.textContent =
            `${summary.consistency}%`;
    }


    if (goals) {
        goals.textContent =
            `${summary.goalsCompleted}/${summary.goalsTotal}`;
    }

}
/* =========================================================
   MONTHLY REPORT — ACTIVITY CALENDAR
========================================================= */

function renderMonthlyActivityCalendar(year, month) {

    const container =
        document.getElementById(
            "monthlyActivityCalendar"
        );

    if (!container) return;

    container.innerHTML = "";


    /* =========================
       MONTH INFORMATION
    ========================= */

    const firstDay =
        new Date(
            year,
            month,
            1
        );

    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    /*
     * JavaScript:
     *
     * Sunday = 0
     * Monday = 1
     * ...
     *
     * Our calendar starts Monday.
     */
    const firstWeekday =
        (firstDay.getDay() + 6) % 7;


    /* =========================
       WEEKDAY HEADERS
    ========================= */

    const weekdays = [
        "MON",
        "TUE",
        "WED",
        "THU",
        "FRI",
        "SAT",
        "SUN"
    ];

    weekdays.forEach(day => {

        const header =
            document.createElement("div");

        header.className =
            "calendar-weekday";

        header.textContent =
            day;

        container.appendChild(header);

    });


    /* =========================
       EMPTY CELLS
    ========================= */

    for (
        let i = 0;
        i < firstWeekday;
        i++
    ) {

        const empty =
            document.createElement("div");

        empty.className =
            "calendar-day calendar-empty";

        container.appendChild(empty);

    }


    /* =========================
       DAYS
    ========================= */

    const today =
        getISTDate();

    const todayKey =
        today.toISOString()
            .slice(0, 10);


    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const dateKey =
            `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        const dayData =
            missionHistory[dateKey];


        const cell =
            document.createElement("div");

        cell.className =
            "calendar-day";


        /* =========================
           DAY NUMBER
        ========================= */

        const number =
            document.createElement("span");

        number.className =
            "calendar-day-number";

        number.textContent =
            day;

        cell.appendChild(number);


        /* =========================
           ACTIVITY STATE
        ========================= */

        const events =
            dayData &&
                Array.isArray(dayData.events)
                ? dayData.events
                : [];


        const hasCompleted =
            events.some(
                event =>
                    event.status === "completed"
            );

        const hasMissed =
            events.some(
                event =>
                    event.status === "missed"
            );


        if (hasCompleted && hasMissed) {

            cell.classList.add(
                "calendar-partial"
            );

        }
        else if (hasCompleted) {

            cell.classList.add(
                "calendar-active"
            );

        }
        else if (hasMissed) {

            cell.classList.add(
                "calendar-missed"
            );

        }
        else {

            cell.classList.add(
                "calendar-no-activity"
            );

        }

        /* =========================
           TODAY
        ========================= */

        if (dateKey === todayKey) {

            cell.classList.add(
                "calendar-today"
            );

        }


        container.appendChild(cell);

    }

}

function calculateMonthlyGoalMetrics(year, month) {

    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 1);

    const goals = goalsData.filter(goal => {

        const deadline =
            goal.deadline
                ? new Date(goal.deadline)
                : null;

        const achievedAt =
            goal.achievedAt
                ? new Date(goal.achievedAt)
                : null;

        return (
            (deadline && deadline >= start && deadline < end) ||
            (achievedAt && achievedAt >= start && achievedAt < end)
        );
    });

    const completed =
        goals.filter(goal => goal.achieved).length;

    const active =
        goals.filter(goal =>
            !goal.achieved &&
            new Date(goal.deadline) >= new Date()
        ).length;

    const missed =
        goals.filter(goal =>
            !goal.achieved &&
            goal.deadline &&
            new Date(goal.deadline) < new Date()
        ).length;

    const total = goals.length;

    const completionRate =
        total > 0
            ? Math.round((completed / total) * 100)
            : 0;

    return {
        completed,
        active,
        missed,
        total,
        completionRate
    };
}
/* =========================================================
   MONTHLY REPORT — CONSISTENCY GRAPH
========================================================= */

function renderMonthlyConsistencyChart(year, month) {

    const container =
        document.getElementById(
            "monthlyConsistencyChart"
        );

    if (!container) return;

    container.innerHTML = "";

    const data =
        calculateDailyConsistency(
            year,
            month
        );


    /* =========================
       CHART
    ========================= */

    const chart =
        document.createElement("div");

    chart.className =
        "consistency-chart-inner";


    /* =========================
       Y AXIS
    ========================= */

    const yAxis =
        document.createElement("div");

    yAxis.className =
        "consistency-y-axis";

    [100, 75, 50, 25, 0]
        .forEach(value => {

            const label =
                document.createElement("span");

            label.textContent =
                value + "%";

            yAxis.appendChild(label);

        });


    chart.appendChild(yAxis);


    /* =========================
       GRAPH AREA
    ========================= */

    const graph =
        document.createElement("div");

    graph.className =
        "consistency-graph-area";


    /* =========================
       GRID
    ========================= */

    [100, 75, 50, 25, 0]
        .forEach(value => {

            const line =
                document.createElement("div");

            line.className =
                "consistency-grid-line";

            line.style.bottom =
                `${value}%`;

            graph.appendChild(line);

        });


    /* =========================
       SVG
    ========================= */

    const svg =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg"
        );

    svg.classList.add(
        "consistency-svg"
    );

    svg.setAttribute(
        "viewBox",
        `0 0 ${data.length * 20} 100`
    );

    svg.setAttribute(
        "preserveAspectRatio",
        "none"
    );


    /* =========================
       POINTS
    ========================= */

    const points = [];

    data.forEach((item, index) => {

        if (item.consistency === null) {
            return;
        }

        const x =
            index * 20 + 10;

        const y =
            100 - item.consistency;

        points.push({
            x,
            y,
            item
        });

    });


    /* =========================
       LINE
    ========================= */

    if (points.length > 1) {

        const path =
            document.createElementNS(
                "http://www.w3.org/2000/svg",
                "polyline"
            );

        path.setAttribute(
            "points",
            points
                .map(point =>
                    `${point.x},${point.y}`
                )
                .join(" ")
        );

        path.classList.add(
            "consistency-line"
        );

        svg.appendChild(path);

    }


    /* =========================
       POINT DOTS
    ========================= */

    points.forEach(point => {

        const circle =
            document.createElementNS(
                "http://www.w3.org/2000/svg",
                "circle"
            );

        circle.setAttribute(
            "cx",
            point.x
        );

        circle.setAttribute(
            "cy",
            point.y
        );

        circle.setAttribute(
            "r",
            "2"
        );

        circle.classList.add(
            "consistency-point"
        );

        svg.appendChild(circle);

    });


    graph.appendChild(svg);


    /* =========================
       X AXIS
    ========================= */

    const xAxis =
        document.createElement("div");

    xAxis.className =
        "consistency-x-axis";

    data.forEach(item => {

        const label =
            document.createElement("span");

        /*
         * Only show useful labels.
         */
        if (
            item.day === 1 ||
            item.day % 7 === 0 ||
            item.day === data.length
        ) {
            label.textContent =
                item.day;
        }

        xAxis.appendChild(label);

    });

    graph.appendChild(xAxis);

    chart.appendChild(graph);

    container.appendChild(chart);
}

function getMonthlyGoalProgress(year, month) {

    const metrics =
        calculateMonthlyGoalMetrics(
            year,
            month
        );

    return {
        ...metrics,
        progress: metrics.completionRate
    };
}

function renderMonthlyGoalsProgress(year, month) {

    const metrics =
        getMonthlyGoalProgress(
            year,
            month
        );

    const progressValue =
        document.getElementById(
            "monthlyGoalsProgressValue"
        );

    const completedText =
        document.getElementById(
            "monthlyGoalsCompletedText"
        );

    const progressBar =
        document.getElementById(
            "monthlyGoalsProgressBar"
        );

    const completed =
        document.getElementById(
            "monthlyGoalsCompleted"
        );

    const missed =
        document.getElementById(
            "monthlyGoalsMissed"
        );

    const active =
        document.getElementById(
            "monthlyGoalsActive"
        );


    if (progressValue) {
        progressValue.textContent =
            `${metrics.progress}%`;
    }


    if (completedText) {
        completedText.textContent =
            `${metrics.completed} of ${metrics.total}`;
    }


    if (progressBar) {
        progressBar.style.width =
            `${metrics.progress}%`;
    }


    if (completed) {
        completed.textContent =
            metrics.completed;
    }


    if (missed) {
        missed.textContent =
            metrics.missed;
    }


    if (active) {
        active.textContent =
            metrics.active;
    }

}

document.getElementById("missionCounter").textContent = completedMissions;


/* =========================================================
   2. ACHIEVEMENTS SYSTEM
========================================================= */

// Achievement definitions
const achievements = [
    { id: "mission1", title: "First Step", desc: "Complete your very first mission", unlocked: false },
    { id: "mission5", title: "On a Roll", desc: "Complete 5 missions", unlocked: false },
    { id: "mission10", title: "Mission Master", desc: "Complete 10 missions", unlocked: false },
    { id: "mission15", title: "Halfway Hero", desc: "Complete 15 missions", unlocked: false },
    { id: "mission20", title: "Goal Getter", desc: "Complete 20 missions", unlocked: false },
    { id: "mission25", title: "Silver Streak", desc: "Complete 25 missions", unlocked: false },
    { id: "mission30", title: "Mission Maestro", desc: "Complete 30 missions", unlocked: false },
    { id: "mission35", title: "Trailblazer", desc: "Complete 35 missions", unlocked: false },
    { id: "mission40", title: "Achievement Hunter", desc: "Complete 40 missions", unlocked: false },
    { id: "mission45", title: "Mission Veteran", desc: "Complete 45 missions", unlocked: false },
    { id: "mission50", title: "Legendary Milestone", desc: "Complete 50 missions", unlocked: false },
    { id: "mission55", title: "Mastermind", desc: "Complete 55 missions", unlocked: false },
    { id: "mission60", title: "Champion", desc: "Complete 60 missions", unlocked: false },
    { id: "mission65", title: "Pathfinder", desc: "Complete 65 missions", unlocked: false },
    { id: "mission70", title: "Mission Conqueror", desc: "Complete 70 missions", unlocked: false },
    { id: "mission75", title: "Epic Endeavor", desc: "Complete 75 missions", unlocked: false },
    { id: "mission80", title: "Trail Master", desc: "Complete 80 missions", unlocked: false },
    { id: "mission85", title: "Ultimate Achiever", desc: "Complete 85 missions", unlocked: false },
    { id: "mission90", title: "Hero of Tasks", desc: "Complete 90 missions", unlocked: false },
    { id: "mission95", title: "Task Titan", desc: "Complete 95 missions", unlocked: false },
    { id: "mission100", title: "Century Club", desc: "Complete 100 missions", unlocked: false },
    { id: "mission105", title: "Beyond Limits", desc: "Complete 105 missions", unlocked: false },
    { id: "mission110", title: "Relentless", desc: "Complete 110 missions", unlocked: false },
    { id: "mission115", title: "Sky High", desc: "Complete 115 missions", unlocked: false },
    { id: "mission120", title: "Goal Crusher", desc: "Complete 120 missions", unlocked: false },
    { id: "mission125", title: "Mission Marathoner", desc: "Complete 125 missions", unlocked: false },
    { id: "mission130", title: "Infinite Drive", desc: "Complete 130 missions", unlocked: false },
    { id: "mission135", title: "Peak Performer", desc: "Complete 135 missions", unlocked: false },
    { id: "mission140", title: "Legend in Making", desc: "Complete 140 missions", unlocked: false },
    { id: "mission145", title: "Champion of Tasks", desc: "Complete 145 missions", unlocked: false },
    { id: "mission150", title: "Task Legend", desc: "Complete 150 missions", unlocked: false },
    { id: "mission155", title: "Milestone Achiever", desc: "Complete 155 missions", unlocked: false },
    { id: "mission160", title: "Mission Icon", desc: "Complete 160 missions", unlocked: false },
    { id: "mission165", title: "Epic Journey", desc: "Complete 165 missions", unlocked: false },
    { id: "mission170", title: "Task Champion", desc: "Complete 170 missions", unlocked: false },
    { id: "mission175", title: "Master of Milestones", desc: "Complete 175 missions", unlocked: false },
    { id: "mission180", title: "Legendary Achiever", desc: "Complete 180 missions", unlocked: false },
    { id: "mission185", title: "Ultimate Victor", desc: "Complete 185 missions", unlocked: false },
    { id: "mission190", title: "Task Hero", desc: "Complete 190 missions", unlocked: false },
    { id: "mission195", title: "Mission Elite", desc: "Complete 195 missions", unlocked: false },
    { id: "mission200", title: "Two Hundred Triumphs", desc: "Complete 200 missions", unlocked: false },
    { id: "mission205", title: "Beyond Achievement", desc: "Complete 205 missions", unlocked: false },
    { id: "mission210", title: "Victory Streak", desc: "Complete 210 missions", unlocked: false },
    { id: "mission215", title: "Unstoppable", desc: "Complete 215 missions", unlocked: false },
    { id: "mission220", title: "Peak Achiever", desc: "Complete 220 missions", unlocked: false },
    { id: "mission225", title: "Mission Overlord", desc: "Complete 225 missions", unlocked: false },
    { id: "mission230", title: "Epic Victor", desc: "Complete 230 missions", unlocked: false },
    { id: "mission235", title: "Champion of Goals", desc: "Complete 235 missions", unlocked: false },
    { id: "mission240", title: "Task Mastermind", desc: "Complete 240 missions", unlocked: false },
    { id: "mission245", title: "Legendary Hero", desc: "Complete 245 missions", unlocked: false },
    { id: "mission250", title: "Ultimate Legend", desc: "Complete 250 missions", unlocked: false }
];

// Load achievements from storage
let achievementsData = JSON.parse(localStorage.getItem("achievements"));
if (!achievementsData) {
    achievementsData = achievements;
    localStorage.setItem("achievements", JSON.stringify(achievements));
}

const quotes = [
    "Discipline is the bridge between goals and achievement.",
    "Consistency creates progress, progress creates success.",
    "Small steps every day lead to big results.",
    "Effort today becomes strength tomorrow.",
    "Stay focused, stay strong, keep moving forward.",
    "Success is the sum of small efforts repeated daily.",
    "Your only limit is your mind.",
    "Great things never come from comfort zones.",
    "Dream it. Believe it. Achieve it.",
    "Push yourself, because no one else is going to do it for you.",
    "The harder you work for something, the greater you’ll feel when you achieve it.",
    "Don’t stop when you’re tired. Stop when you’re done.",
    "Focus on progress, not perfection.",
    "Your future is created by what you do today, not tomorrow.",
    "Small progress is still progress.",
    "Motivation gets you started, habit keeps you going.",
    "Do something today that your future self will thank you for.",
    "Success doesn’t come from what you do occasionally, it comes from what you do consistently.",
    "Believe in yourself and all that you are.",
    "Take the risk or lose the chance."
];

/* Render achievements in account page */
function renderAchievements() {
    const container = document.getElementById("achievementsViewer");
    if (!container) return;

    container.innerHTML = "";

    const unlocked = achievementsData.filter(a => a.unlocked);
    const locked = achievementsData.filter(a => !a.unlocked).slice(0, 5);
    const displayList = [...unlocked, ...locked];

    displayList.forEach(ach => {
        const div = document.createElement("div");
        div.className = "achievement-tile" + (ach.unlocked ? "" : " locked");

        const icon = ach.unlocked
            ? '<i class="fas fa-trophy"></i>'
            : '<i class="fas fa-lock"></i>';

        div.innerHTML = `
  <div class="achievement-icon">${icon}</div>
  <div class="achievement-title">${ach.title}</div>
  <div class="achievement-desc">${ach.desc}</div>

  ${ach.unlocked && ach.unlockedAt
                ? `<div class="achievement-date">
           Achieved on: ${ach.unlockedAt}
         </div>`
                : ""
            }
`;

        container.appendChild(div);
    });
}

/* Unlock an achievement */
function unlockAchievement(id) {
    const ach = achievementsData.find(a => a.id === id);

    if (ach && !ach.unlocked) {
        ach.unlocked = true;
        ach.unlockedAt = new Date().toDateString(); // 🔥 ADD THIS

        localStorage.setItem("achievements", JSON.stringify(achievementsData));

        pushNotification("🏆 New Achievement", `You unlocked: "${ach.title}"`);
        showAchievementPopup(ach.title, ach.desc);
        renderAchievements();
    }
}

function showAchievementPopup(title, desc) {
    window.isAchievementPlaying = true;

    const popup = document.createElement("div");
    popup.className = "achievement-popup";
    popup.innerHTML = `<h3>${title}</h3><p>${desc}</p>`;
    document.body.appendChild(popup);

    // const audio = new Audio("Music/Achievements.mp3");
    // audio.volume = 0.5;
    // audio.play().catch(() => { });

    // audio.onended = () => { window.isAchievementPlaying = false; };
    const audio = playAppTone("achievement");

    if (audio) {
        window.isAchievementPlaying = true;

        audio.onended = () => {
            window.isAchievementPlaying = false;
        };
    } else {
        window.isAchievementPlaying = false;
    }

    popup.style.opacity = 0;
    popup.style.transform = "translateY(-50px)";
    setTimeout(() => {
        popup.style.transition = "all 0.5s ease";
        popup.style.opacity = 1;
        popup.style.transform = "translateY(0)";
    }, 10);

    setTimeout(() => {
        popup.style.opacity = 0;
        popup.style.transform = "translateY(-50px)";
        setTimeout(() => popup.remove(), 500);
    }, 1500);
}


/* =========================================================
   3. NAVIGATION SYSTEM
========================================================= */
function showPage(pageId) {
    document.querySelectorAll("section").forEach(sec =>
        sec.classList.remove("active")
    );

    const page = document.getElementById(pageId);
    if (page) page.classList.add("active");

    document.querySelectorAll(".bottom-nav > button")
        .forEach(b => b.classList.remove("active"));

    const btn = document.getElementById("nav-" + pageId);
    if (btn) btn.classList.add("active");

    updatePlusBtn(pageId);

    isMarketplaceOpen = (pageId === "marketplace-cards");


    if (pageId === "account") renderAchievements();
}

function updatePlusBtn(pageId) {
    const btn = document.getElementById("globalAddBtn");
    if (!btn) return;

    if (pageId === "missions") {
        btn.setAttribute("onclick", "openModal('mission')");
        btn.style.display = "block";
    } else if (pageId === "skillset") {
        btn.setAttribute("onclick", "openModal('skill')");
        btn.style.display = "block";
    } else if (pageId === "goals") {
        btn.setAttribute("onclick", "openModal('goal')");
        btn.style.display = "block";
    } else if (pageId === "time") {
        btn.setAttribute("onclick", "openModal('multi-time')");
        btn.style.display = "block";
    } else {
        btn.style.display = "none";
    }
}
// ===============================
// FULLSCREEN TIMER MODE JS
// ===============================



// OPEN FULL SCREEN
document.getElementById("timerIcon").onclick = () => {
    document.getElementById("timerScreen").style.display = "block";
    document.querySelector(".top-navbar").style.display = "none";
    document.querySelector(".bottom-nav").style.display = "none";
};

// EXIT FULL SCREEN
document.getElementById("timerCloseBtn").onclick = () => {
    document.getElementById("timerScreen").style.display = "none";
    document.querySelector(".top-navbar").style.display = "flex";
    document.querySelector(".bottom-nav").style.display = "flex";

    clearInterval(timerInterval);

    stopAllAppAudio();
    music.pause();
    music.currentTime = 0;
};


// MUSIC MODAL
document.getElementById("timerMusicBtn").onclick = () => {
    document.getElementById("musicModal").classList.add("active");

    if (musicMode === "preset") {
        showPresetUI();
    }
};

function closeMusicModal() {
    document.getElementById("musicModal").classList.remove("active");
}


// SETTINGS MODAL
document.getElementById("timerSettingsBtn").onclick = () => {
    document.getElementById("timerSettingModal").classList.add("active");
};

function closeTimerSettingModal() {
    document.getElementById("timerSettingModal").classList.remove("active");
}

// Apply timer settings
function applyTimerSettings() {
    let h = parseInt(document.getElementById("setH").value);
    let m = parseInt(document.getElementById("setM").value);
    let s = parseInt(document.getElementById("setS").value);

    startStaticTimer(h, m, s);
    closeTimerSettingModal();
}


function startStaticTimer(h, m, s) {
    clearInterval(timerInterval);

    let total = h * 3600 + m * 60 + s;

    // Set initial values
    document.getElementById("h").textContent = h.toString().padStart(2, "0");
    document.getElementById("m").textContent = m.toString().padStart(2, "0");
    document.getElementById("s").textContent = s.toString().padStart(2, "0");

    timerInterval = setInterval(() => {
        if (total <= 0) {
            clearInterval(timerInterval);
            stopAllAppAudio();
            return;
        }

        total--;

        const hh = Math.floor(total / 3600);
        const mm = Math.floor((total % 3600) / 60);
        const ss = total % 60;

        document.getElementById("h").textContent = hh.toString().padStart(2, "0");
        document.getElementById("m").textContent = mm.toString().padStart(2, "0");
        document.getElementById("s").textContent = ss.toString().padStart(2, "0");

    }, 1000);
}




/* =========================================================
   4. MODALS (ADD / EDIT / ALERT / CONFIRM)
========================================================= */
function openModal(type, skillDiv = null) {
    const modal = document.getElementById("modal");
    const content = document.getElementById("modal-content");

    modal.classList.add("active");

    // ---- Add Mission ----
    if (type === 'mission') {
        const skills = [...document.querySelectorAll("#skill-list strong")]
            .map(s => `<option value="${s.textContent}">${s.textContent}</option>`)
            .join("");

        content.innerHTML = `
  <h3>Add Mission</h3>
  <input id="missionInput" placeholder="Enter mission">

  <label>Link Skill</label>
  <select id="linkedSkill">
    <option value="">None</option>
    ${skills}
  </select>

  <div class="form-group">

    <label for="missionRepeat">
        Repeat
    </label>

    <select id="missionRepeat">

        <option value="none">
            Doesn't repeat
        </option>

        <option value="daily">
            Every day
        </option>

        <option value="weekly">
            Every week
        </option>

        <option value="monthly">
            Every month
        </option>

    </select>

</div>

  <label>Deadline</label>
  <input id="missionDeadline" type="datetime-local">

  <div class="toggle-row">
  <label class="toggle">
    <input type="checkbox" id="hardcoreToggle">
    <span class="slider"></span>
  </label>
  <span class="toggle-label">Hardcore Mode</span>
</div>

  <button onclick="addMission()">Add</button>
  <button onclick="closeModal()">Cancel</button>
`;

    }

    /* =====================================================
   ADD SKILL
===================================================== */

    if (type === "skill") {

        content.innerHTML = `
        <h3>Add Skill</h3>

        <input
            id="skillInput"
            type="text"
            placeholder="Enter skill name"
            maxlength="50"
            autocomplete="off"
        >

        <button
            type="button"
            onclick="addSkill()"
        >
            Add Skill
        </button>

        <button
            type="button"
            onclick="closeModal()"
        >
            Cancel
        </button>
    `;

        /* Focus input automatically */

        setTimeout(() => {

            document
                .getElementById("skillInput")
                ?.focus();

        }, 50);

    }

    // ---- Edit Mission ----
    if (type === "edit-mission" && skillDiv) {
        const oldText = skillDiv.querySelector(".mission-text").textContent.replace("🔥", "").trim();
        const oldDeadline = skillDiv.dataset.deadline || "";
        const isHardcore = skillDiv.dataset.hardcore === "true";

        content.innerHTML = `
      <h3>Edit Mission</h3>

      <input id="editMissionInput" value="${oldText}">

<label>Repeat</label>

<select id="editMissionRepeat">

  <option value="none"
    ${skillDiv.dataset.repeat === "none" || !skillDiv.dataset.repeat ? "selected" : ""}>
    Doesn't repeat
  </option>

  <option value="daily"
    ${skillDiv.dataset.repeat === "daily" ? "selected" : ""}>
    Every day
  </option>

  <option value="weekly"
    ${skillDiv.dataset.repeat === "weekly" ? "selected" : ""}>
    Every week
  </option>

  <option value="monthly"
    ${skillDiv.dataset.repeat === "monthly" ? "selected" : ""}>
    Every month
  </option>

</select>

      <label>Deadline</label>
      <input 
        id="editMissionDeadline" 
        type="datetime-local" 
        value="${oldDeadline}"
        ${isHardcore ? "disabled" : ""}
      >

      ${isHardcore
                ? `<p style="color:#ef4444;font-size:12px;margin-top:6px;">
              🔥 Hardcore mission — deadline cannot be changed
            </p>`
                : ""
            }

      <button onclick="updateMission()">Update</button>

      ${isHardcore
                ? `<button disabled 
              style="opacity:0.5;cursor:not-allowed;">
              🔒 Delete
            </button>`
                : `<button onclick="deleteMission()">Delete</button>`
            }

      <button onclick="closeModal()">Cancel</button>
    `;

        window.missionBeingEdited = skillDiv;
    }

    // ---- Add Goal ----
    if (type === "goal") {

        content.innerHTML = `
        <h3>Add Goal</h3>

        <input
            id="goalInput"
            placeholder="Goal"
            maxlength="100"
        >

        <label>Priority</label>

        <select id="priorityInput">
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
        </select>

        <label>Deadline</label>

        <input
            id="goalDeadline"
            type="datetime-local"
        >

        <button onclick="addGoal()">
            Add Goal
        </button>

        <button onclick="closeModal()">
            Cancel
        </button>
    `;

        const now =
            new Date()
                .toISOString()
                .slice(0, 16);

        document.getElementById(
            "goalDeadline"
        ).min = now;
    }


    // ---- Add Goal ----
    if (type === "goal") {
        content.innerHTML = `
    <h3>Add Goal</h3>
    <input id="goalInput" placeholder="Goal">

    <label>Priority</label>
    <select id="priorityInput">
      <option>High</option>
      <option>Medium</option>
      <option>Low</option>
    </select>

    <label>Deadline</label>
    <input id="goalDeadline" type="datetime-local">

    <button onclick="addGoal()">Add</button>
    <button onclick="closeModal()">Cancel</button>
  `;
    }


    // ---- Add Countdown (FIXED) ----
    if (type === "multi-time") {
        content.innerHTML = `
      <h3>Add Countdown</h3>
<input id="countdownTitle" placeholder="Title">
<input id="countdownDateTime" type="datetime-local">

<button onclick="addCountdown()">Add</button>
<button onclick="closeModal()">Cancel</button>

    `;
        const now = new Date().toISOString().slice(0, 16);
        document.getElementById("countdownDateTime").min = now;

    }
}

// ---- FIXED: closeModal OUTSIDE openModal ----
function closeModal() {
    document.getElementById("modal").classList.remove("active");

    // 🔥 RESET ALL MODAL INPUTS
    document.querySelectorAll("#modal input, #modal select").forEach(el => {
        el.value = "";
    });
}



/* Alerts */
/* Alerts */

let alertCallback = null;

function customAlert(msg, callback = null) {

    alertCallback = callback;

    document.getElementById("alertMsg").textContent =
        msg;

    document
        .getElementById("alertModal")
        .classList.add("active");
}


let reloadAfterAlert = false;

function closeAlert() {

    document
        .getElementById("alertModal")
        .classList.remove("active");

    if (reloadAfterAlert) {

        reloadAfterAlert = false;

        location.reload();

    }
}

/* Confirm */
let confirmCallback = null;

function customConfirm(msg, callback) {
    confirmCallback = callback;
    document.getElementById("confirmMsg").textContent = msg;
    document.getElementById("confirmModal").classList.add("active");
}

function confirmYes() {
    if (confirmCallback) confirmCallback();
    document.getElementById("confirmModal").classList.remove("active");
}

function confirmNo() {
    document.getElementById("confirmModal").classList.remove("active");
}


/* =========================================================
   5. MISSIONS MODULE
========================================================= */
const missionMilestones = [1];

for (let i = 5; i <= 250; i += 5) {
    missionMilestones.push(i);
}

function addMission() {

    const text =
        document.getElementById("missionInput")
            .value.trim();

    const deadline =
        document.getElementById("missionDeadline")
            .value;

    const linkedSkill =
        document.getElementById("linkedSkill")
            .value;

    const isHardcore =
        document.getElementById("hardcoreToggle")
            .checked;

    const repeat =
        document.getElementById("missionRepeat")
            .value;


    // ❌ Text required
    if (!text) {
        closeModal();
        return;
    }


    // 🔥 HARDCORE → DEADLINE REQUIRED
    if (isHardcore && !deadline) {

        customAlert(
            "🔥 Hardcore missions require a deadline."
        );

        return;
    }


    // ❌ Past deadline not allowed
    if (
        deadline &&
        isPastDateTime(deadline)
    ) {

        customAlert(
            "Deadline cannot be in the past."
        );

        return;
    }


    const li =
        document.createElement("li");

    li.dataset.missionId = crypto.randomUUID();


    /* =====================================================
       MISSION DATA
    ===================================================== */

    li.dataset.deadline =
        deadline || "";

    li.dataset.skill =
        linkedSkill || "";

    li.dataset.completed =
        "false";

    li.dataset.hardcore =
        isHardcore
            ? "true"
            : "false";

    li.dataset.repeat =
        repeat;

    li.dataset.repeatKey = getRepeatKey(new Date(), repeat);


    /* =====================================================
       FORMAT DEADLINE
    ===================================================== */

    let deadlineText = "";

    if (deadline) {

        const d =
            new Date(deadline);

        const date =
            d.toLocaleDateString(
                [],
                {
                    day: "numeric",
                    month: "short"
                }
            );

        const time =
            d.toLocaleTimeString(
                [],
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );

        deadlineText =
            `${date}, ${time}`;
    }


    /* =====================================================
       MISSION HTML
    ===================================================== */

    li.innerHTML = `
        <span class="mission-text">
            ${text}
            ${isHardcore ? " 🔥" : ""}
        </span>

       <div class="deadline-row">

    <span class="deadlineDisplay">
        ${deadlineText}
    </span>

    ${repeat !== "none"
            ? `<span class="repeat-badge">
                ↻ ${repeat === "daily"
                ? "Daily"
                : repeat === "weekly"
                    ? "Weekly"
                    : "Monthly"
            }
               </span>`
            : ""
        }

    <span class="overdueMark"></span>

    <button
        class="complete-btn"
        onclick="completeMission(this)"
    >
        ✔
    </button>

</div>
    `;


    /* =====================================================
       CLICK TO EDIT
    ===================================================== */

    li.addEventListener(
        "click",
        (e) => {

            if (
                e.target.classList
                    .contains("complete-btn")
            ) {
                return;
            }

            openModal(
                "edit-mission",
                li
            );
        }
    );


    /* =====================================================
       ADD + SAVE
    ===================================================== */

    document
        .getElementById("mission-list")
        .appendChild(li);

    saveData();

    closeModal();
}




setInterval(checkMissedDeadlines, 30 * 1000); // check every 1 minute
function updateMission() {

    const li =
        window.missionBeingEdited;

    if (!li) return;


    const newText =
        document.getElementById(
            "editMissionInput"
        ).value.trim();


    const newDeadline =
        document.getElementById(
            "editMissionDeadline"
        ).value;


    const newRepeat =
        document.getElementById(
            "editMissionRepeat"
        ).value;


    const isHardcore =
        li.dataset.hardcore === "true";


    if (!newText) {

        closeModal();

        return;
    }


    /* =====================================================
       DEADLINE VALIDATION
    ===================================================== */

    if (
        !isHardcore &&
        newDeadline &&
        isPastDateTime(newDeadline)
    ) {

        customAlert(
            "Deadline cannot be in the past."
        );

        return;
    }


    /* =====================================================
       UPDATE TEXT
    ===================================================== */

    li.querySelector(
        ".mission-text"
    ).innerHTML =
        newText +
        (
            isHardcore
                ? " 🔥"
                : ""
        );


    /* =====================================================
       UPDATE REPEAT
    ===================================================== */

    li.dataset.repeat =
        newRepeat;

    const repeatBadge =
        li.querySelector(".repeat-badge");

    if (repeatBadge) {

        repeatBadge.textContent =
            newRepeat === "daily"
                ? "↻ Daily"
                : newRepeat === "weekly"
                    ? "↻ Weekly"
                    : newRepeat === "monthly"
                        ? "↻ Monthly"
                        : "";

    }

    /*
       If recurrence was changed,
       start a fresh occurrence.
    */

    li.dataset.repeatKey = getRepeatKey(new Date(), newRepeat);


    /* =====================================================
       UPDATE DEADLINE
    ===================================================== */

    if (!isHardcore) {

        if (newDeadline) {

            const d =
                new Date(newDeadline);

            const date =
                d.toLocaleDateString(
                    [],
                    {
                        day: "numeric",
                        month: "short"
                    }
                );

            const time =
                d.toLocaleTimeString(
                    [],
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                );

            li.querySelector(
                ".deadlineDisplay"
            ).textContent =
                `${date}, ${time}`;

            li.dataset.deadline =
                newDeadline;

        } else {

            li.querySelector(
                ".deadlineDisplay"
            ).textContent = "";

            li.dataset.deadline =
                "";
        }


        /* Reset overdue state */

        li.querySelector(
            ".overdueMark"
        ).innerHTML = "";

        delete li.dataset.deducted;
        delete li.dataset.overdueNotified;
        delete li.dataset.warned;
    }


    saveData();

    closeModal();
}



function checkMissedDeadlines() {
    const missions = document.querySelectorAll("#mission-list li");
    const now = Date.now();

    missions.forEach(li => {
        const deadline = li.dataset.deadline;
        if (!deadline) return;

        if (li.dataset.completed === "true") return;

        const deadlineTime = new Date(deadline).getTime();
        const timeLeft = deadlineTime - now;

        const overdueSpan = li.querySelector(".overdueMark");
        if (!overdueSpan) return;

        // 🔔 Due soon warning (once)
        if (
            timeLeft > 0 &&
            timeLeft <= 2 * 60 * 60 * 1000 &&
            !li.dataset.warned
        ) {
            li.dataset.warned = "true";
            pushNotification(
                "Mission Deadline",
                `"${li.querySelector('.mission-text').textContent}" is due soon (within 2 hours!)`
            );
        }

        // ⏰ DEADLINE PASSED
        if (timeLeft <= 0) {
            overdueSpan.innerHTML = `<span class="overdue-badge">Overdue</span>`;

            // 🔔 Notify overdue (once)
            if (!li.dataset.overdueNotified) {
                li.dataset.overdueNotified = "true";
                pushNotification(
                    "⚠ Mission Overdue",
                    `"${li.querySelector('.mission-text').textContent}" is overdue!`
                );
            }

            // // 🔥 HARDCORE MODE — RESET ALL POINTS (ONCE)
            // if (
            //     li.dataset.hardcore === "true" &&
            //     !li.dataset.hardcorePunished
            // ) {
            //     li.dataset.hardcorePunished = "true";

            //     if (completedMissions < 0) {

            //         completedMissions -= 4;
            //         localStorage.setItem("completedMissions", completedMissions);
            //         document.getElementById("missionCounter").textContent = completedMissions;
            //     }
            //     else {

            //         completedMissions = 0;
            //         localStorage.setItem("completedMissions", 0);
            //         document.getElementById("missionCounter").textContent = "0";

            //     }

            //     renderMarketplace();
            //     renderMyCards();

            //     showSmartNotification(
            //         "🔥 Hardcore Failed",
            //         "Improvement Points reduce -5."
            //     );

            //     saveData();
            //     return; // ⛔ stop further penalties
            // }

            // 🔥 HARDCORE MODE — DEDUCT 5 POINTS (ONCE)
            if (
                li.dataset.hardcore === "true" &&
                !li.dataset.hardcorePunished
            ) {

                li.dataset.hardcorePunished = "true";
                li.dataset.deducted = "true";
                const hardcorePenalty = 5;

                const pointsBefore =
                    completedMissions;

                completedMissions = Math.max(
                    0,
                    completedMissions - hardcorePenalty
                );

                const pointsLost =
                    pointsBefore - completedMissions;

                localStorage.setItem(
                    "completedMissions",
                    completedMissions
                );

                document.getElementById(
                    "missionCounter"
                ).textContent =
                    completedMissions;

                renderMarketplace(
                    currentMarketplaceFilter
                );

                renderMyCards();

                showSmartNotification(
                    "🔥 Hardcore Failed",
                    `-${pointsLost} Improvement Points`
                );

                saveData();

                return;
            }

            // ❌ NORMAL MODE — DEDUCT 1 POINT (ONCE)
            if (!li.dataset.deducted) {

                const pointsBefore =
                    completedMissions;


                completedMissions = Math.max(
                    0,
                    completedMissions - 1
                );
                li.dataset.deducted = "true";

                const pointsDelta =
                    completedMissions - pointsBefore;

                recordMissionPerformance(
                    li,
                    "missed",
                    pointsDelta
                );

                document.getElementById(
                    "missionCounter"
                ).textContent =
                    completedMissions;

                localStorage.setItem(
                    "completedMissions",
                    completedMissions
                );

                saveData();
            }
        }
    });
}


function deleteMission() {
    const li = window.missionBeingEdited;
    if (!li) return;

    if (li.dataset.hardcore === "true") {
        const deadline = li.dataset.deadline;
        const now = Date.now();

        if (deadline && new Date(deadline).getTime() <= now) {
            customAlert("🔥 Hardcore missions cannot be deleted after deadline.");
            return;
        }

        customConfirm(
            "🔥 This is a Hardcore mission.\nDelete only if created by mistake?",
            () => {
                li.remove();
                saveData();
                closeModal();
            }
        );
        return;
    }

    // Normal mission
    li.remove();
    saveData();
    closeModal();
}


function completeMission(btn) {

    enforceDailyReset();

    renderMarketplace(currentMarketplaceFilter);


    const li =
        btn.closest("li");

    if (!li) return;


    const linkedSkill =
        li.dataset.skill;

    const deadline =
        li.dataset.deadline;

    const repeat =
        li.dataset.repeat || "none";


    /* =====================================================
       PREVENT DOUBLE COMPLETION
    ===================================================== */

    if (
        li.dataset.completed === "true"
    ) {
        return;
    }


    /* =====================================================
       MARK COMPLETED
    ===================================================== */

    li.dataset.completed = "true";


    /* =====================================================
       OVERDUE → NO REWARD
    ===================================================== */

    if (
        deadline &&
        new Date(deadline).getTime() < Date.now()
    ) {

        /*
         * Mission is already overdue.
         * It gets NO Improvement Point.
         */

        const completeBtn =
            li.querySelector(".complete-btn");

        /*
         * Disable the button immediately.
         * This occurrence is finished.
         */

        if (completeBtn) {

            completeBtn.disabled = true;

            completeBtn.style.opacity = "0.45";

        }


        /*
         * Mark the occurrence visually.
         */

        li.classList.add("completed");


        /*
         * One-time missions disappear.
         */

        if (repeat === "none") {

            li.classList.add("remove");

            setTimeout(() => {

                li.remove();

                saveData();

            }, 400);

        }


        /*
         * Recurring missions stay visible.
         * The recurrence engine will reset them
         * when the next occurrence begins.
         */

        else {

            showPopup(
                "Mission was overdue. No improvement points gained."
            );

            saveData();

        }

        return;
    }


    /* =====================================================
       DAILY LIMIT
    ===================================================== */

    if (
        dailyImprovementCount >=
        DAILY_IMPROVEMENT_LIMIT
    ) {

        li.dataset.completed = "false";

        showPopup(
            "You're too tired today. No improvement points gained."
        );

        saveData();

        return;
    }


    /* =====================================================
       SUCCESSFUL COMPLETION
    ===================================================== */

    dailyImprovementCount++;

    completedMissions++;
    const isMissionAchievement =
        missionMilestones.includes(completedMissions);

    if (!isMissionAchievement) {
        playAppTone("mission");
    }

    recordMissionPerformance(
        li,
        "completed",
        1
    );

    if (
        typeof Momentum !== "undefined" &&
        typeof Momentum.reload === "function"
    ) {
        Momentum.reload();
    }

    localStorage.setItem(
        "dailyImprovementCount",
        dailyImprovementCount
    );

    localStorage.setItem(
        "completedMissions",
        completedMissions
    );


    document.getElementById(
        "missionCounter"
    ).textContent =
        completedMissions;


    /* =====================================================
       SKILL XP
    ===================================================== */

    if (linkedSkill) {

        increaseSkillXP(
            linkedSkill,
            1
        );

    }


    /* =====================================================
       ACHIEVEMENTS
    ===================================================== */

    checkMissionAchievements();


    /* =====================================================
       RECURRING vs ONE-TIME
    ===================================================== */

    if (repeat === "none") {

        /*
           Normal mission:
           remove it permanently.
        */

        li.classList.add(
            "remove"
        );

        setTimeout(() => {

            li.remove();

            saveData();

        }, 400);


    } else {

        /*
           Recurring mission:
           KEEP the mission.

           It becomes completed for
           the current occurrence.

           Tomorrow/week/month it will
           be reset by the recurrence engine.
        */

        li.classList.add(
            "completed"
        );


        const completeBtn =
            li.querySelector(
                ".complete-btn"
            );

        if (completeBtn) {

            completeBtn.disabled =
                true;

            completeBtn.style.opacity =
                "0.45";

        }


        /*
           Remove deadline warning
           because today's occurrence
           has already been completed.
        */

        const overdueMark =
            li.querySelector(
                ".overdueMark"
            );

        if (overdueMark) {
            overdueMark.innerHTML = "";
        }

    }


    showPopup(
        repeat === "none"
            ? "Mission completed! Improvement point gained."
            : "Mission completed! It will return for the next occurrence."
    );


    saveData();
}
//

/* =========================================================
   RECURRING MISSIONS
========================================================= */

function getRepeatKey(date = new Date(), repeat = "daily") {

    const d = new Date(date);

    if (repeat === "daily") {

        return [
            d.getFullYear(),
            String(d.getMonth() + 1).padStart(2, "0"),
            String(d.getDate()).padStart(2, "0")
        ].join("-");

    }


    if (repeat === "weekly") {

        const day =
            d.getDay();

        d.setDate(
            d.getDate() - day
        );

        return [
            d.getFullYear(),
            String(d.getMonth() + 1).padStart(2, "0"),
            String(d.getDate()).padStart(2, "0")
        ].join("-");

    }


    if (repeat === "monthly") {

        return [
            d.getFullYear(),
            String(d.getMonth() + 1).padStart(2, "0")
        ].join("-");

    }


    return "once";
}


/* =========================================================
   REFRESH RECURRING MISSIONS
========================================================= */

function refreshRecurringMissions() {

    const missions =
        document.querySelectorAll(
            "#mission-list li"
        );

    const today = new Date();

    let changed = false;


    missions.forEach(li => {

        const repeat =
            li.dataset.repeat || "none";

        if (repeat === "none") {
            return;
        }


        const currentKey =
            getRepeatKey(
                today,
                repeat
            );

        const previousKey =
            li.dataset.repeatKey;


        /*
         * First time this mission is using
         * recurrence.
         */

        if (!previousKey) {

            li.dataset.repeatKey =
                currentKey;

            changed = true;

            return;
        }


        /*
         * Same occurrence.
         * Don't reset anything.
         */

        if (previousKey === currentKey) {
            return;
        }


        /*
         * NEW OCCURRENCE
         */

        resetRecurringMission(
            li,
            currentKey
        );

        changed = true;

    });


    if (changed) {
        saveData();
    }
}


/* =========================================================
   RESET ONE RECURRING MISSION
========================================================= */

function resetRecurringMission(li, currentKey) {

    const repeat =
        li.dataset.repeat || "none";


    /* New occurrence */

    li.dataset.repeatKey =
        currentKey;

    li.dataset.completed =
        "false";


    /* Reset visual state */

    li.classList.remove(
        "completed",
        "remove"
    );


    /* Reset old warning / penalty state */

    delete li.dataset.deducted;
    delete li.dataset.overdueNotified;
    delete li.dataset.warned;
    delete li.dataset.hardcorePunished;


    /* Enable complete button */

    const completeBtn =
        li.querySelector(
            ".complete-btn"
        );

    if (completeBtn) {

        completeBtn.disabled =
            false;

        completeBtn.style.opacity =
            "";

    }


    /* Clear overdue indicator */

    const overdueMark =
        li.querySelector(
            ".overdueMark"
        );

    if (overdueMark) {
        overdueMark.textContent = "";
    }


    /* Move deadline */

    if (repeat !== "none") {

        shiftRecurringDeadline(
            li,
            repeat
        );

    }
}


/* =========================================================
   UPDATE DAILY DEADLINE
========================================================= */

function shiftRecurringDeadline(li, repeat) {

    if (!li) return;

    const oldDeadline = li.dataset.deadline;

    if (!oldDeadline) return;

    const oldDate = new Date(oldDeadline);

    if (isNaN(oldDate.getTime())) return;

    let nextDeadline = new Date(oldDate);


    /* =========================
       DAILY
    ========================= */

    if (repeat === "daily") {

        nextDeadline.setDate(
            nextDeadline.getDate() + 1
        );

    }


    /* =========================
       WEEKLY
    ========================= */

    else if (repeat === "weekly") {

        nextDeadline.setDate(
            nextDeadline.getDate() + 7
        );

    }


    /* =========================
       MONTHLY
    ========================= */

    else if (repeat === "monthly") {

        const originalDay =
            nextDeadline.getDate();

        nextDeadline.setMonth(
            nextDeadline.getMonth() + 1
        );

        /*
         * Handle:
         * Jan 31 → Feb 28
         */

        if (
            nextDeadline.getDate() !==
            originalDay
        ) {
            nextDeadline.setDate(0);
        }

    }


    else {
        return;
    }


    /* =========================
       SAVE ISO-LIKE LOCAL VALUE
    ========================= */

    const year =
        nextDeadline.getFullYear();

    const month =
        String(
            nextDeadline.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            nextDeadline.getDate()
        ).padStart(2, "0");

    const hours =
        String(
            nextDeadline.getHours()
        ).padStart(2, "0");

    const minutes =
        String(
            nextDeadline.getMinutes()
        ).padStart(2, "0");

    const newDeadline =
        `${year}-${month}-${day}T${hours}:${minutes}`;


    /* =========================
       UPDATE DATA
    ========================= */

    li.dataset.deadline =
        newDeadline;


    /* =========================
       UPDATE VISIBLE DEADLINE
    ========================= */

    const deadlineDisplay =
        li.querySelector(".deadlineDisplay");

    if (deadlineDisplay) {

        deadlineDisplay.textContent =
            nextDeadline.toLocaleDateString(
                [],
                {
                    day: "numeric",
                    month: "short"
                }
            )
            + ", " +
            nextDeadline.toLocaleTimeString(
                [],
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );
    }
}


function increaseSkillXP(skillName, amount) {
    const skills = document.querySelectorAll("#skill-list .skill");

    skills.forEach(skill => {
        const name = skill.querySelector("strong").textContent.trim();

        if (name === skillName.trim()) {
            let xp = parseInt(skill.dataset.xp);
            xp = xp + amount;

            skill.dataset.xp = xp;
            skill.setAttribute("data-xp", xp);

            skill.querySelector(".xp-count").textContent = xp;
            skill.querySelector(".progress-bar").style.width = xp + "%";

            checkSkillLevelUp(skill);
            saveData(); // 🔥 force persist
        }
    });
}

/*function increaseSkillXP(skillName, amount) {
    const skills = document.querySelectorAll("#skill-list .skill");

    skills.forEach(skillDiv => {
        if (skillDiv.querySelector("strong").textContent === skillName) {

            let xp = parseInt(skillDiv.dataset.xp) + amount;
            skillDiv.dataset.xp = xp;

            checkSkillLevelUp(skillDiv);
            saveData();
        }
    });
}
*/


function checkMissionAchievements() {
    missionMilestones.forEach(m => {
        if (completedMissions === m) unlockAchievement("mission" + m);
    });
}

function showPopup(achievementText) {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

    document.getElementById("motivationQuote").innerText = randomQuote;
    document.getElementById("achievement").innerText = achievementText;

    const popup = document.getElementById("motivationPopup");
    popup.style.display = "flex";

    if (!window.isAchievementPlaying) {
        const sound = document.getElementById("popupSound");
        sound.currentTime = 0;
        sound.volume = 1.0;
        sound.play().catch(() => { });
    }
}

function closePopup() {
    const popup = document.getElementById("motivationPopup");
    const content = popup.querySelector(".popup-content");

    content.style.animation = "fadeOut 0.3s ease forwards";

    setTimeout(() => {
        popup.style.display = "none";
        content.style.animation = "popIn 0.4s ease forwards";
    }, 300);
}


/* =========================================================
   6. SKILLS MODULE
========================================================= */
function addSkill() {
    const skill = document.getElementById("skillInput").value;
    if (!skill) return closeModal();

    const div = document.createElement("div");
    div.className = "skill show";
    div.dataset.xp = "0";
    div.dataset.level = "0";

    div.innerHTML = `
        <strong>${skill}</strong>
        <span class="skill-level">Level 0</span>

        <div class="progress">
            <div class="progress-bar" style="width:0%"></div>
        </div>

        <small>XP: <span class="xp-count">0</span></small>
        <button class="remove-btn" onclick="deleteSkillDirect(this)">Remove</button>
    `;

    document.getElementById("skill-list").appendChild(div);
    saveData();
    closeModal();
}

function deleteSkillDirect(btn) {
    const skillDiv = btn.closest(".skill");
    const skillName = skillDiv.querySelector("strong").textContent;

    customConfirm(
        `Delete skill "${skillName}"?\nLinked missions will stop giving XP.`,
        () => {
            skillDiv.remove();

            // Remove skill link from missions
            document.querySelectorAll("#mission-list li").forEach(li => {
                if (li.dataset.skill === skillName) {
                    li.dataset.skill = "";
                }
            });

            saveData();
        }
    );
}



// function updateSkillProgress(skillName) {
//     let newProgress = document.getElementById("editProgressInput").value;
//     newProgress = Math.min(100, Math.max(0, parseInt(newProgress)));

//     const skills = document.querySelectorAll("#skill-list .skill");
//     skills.forEach(skill => {
//         if (skill.querySelector("strong").textContent === skillName) {
//             skill.querySelector(".progress-bar").style.width = newProgress + "%";
//         }
//     });

//     saveData();
//     closeModal();
// }

function checkSkillLevelUp(skillDiv) {
    let xp = parseInt(skillDiv.dataset.xp);
    let levelTag = skillDiv.querySelector(".skill-level");

    if (!levelTag) {
        console.log("❌ No level tag found. Adding automatically...");
        levelTag = document.createElement("span");
        levelTag.className = "skill-level";
        levelTag.textContent = "Level 0";
        skillDiv.insertBefore(levelTag, skillDiv.querySelector(".progress"));
    }

    let level = parseInt(levelTag.textContent.replace("Level ", ""));

    while (xp >= 100) {
        xp -= 100;
        level++;
    }

    skillDiv.dataset.xp = xp;
    levelTag.textContent = "Level " + level;

    skillDiv.querySelector(".xp-count").textContent = xp;
    skillDiv.querySelector(".progress-bar").style.width = xp + "%";
}


function deleteSkill(skillName) {
    const skills = document.querySelectorAll("#skill-list .skill");
    skills.forEach(skill => {
        if (skill.querySelector("strong").textContent === skillName) skill.remove();
    });

    saveData();
    closeModal();
}


/* =========================================================
   7. GOALS MODULE
========================================================= */

let goalsData = JSON.parse(localStorage.getItem("goalsData")) || [];

goalsData.forEach(goal => {

    if (
        !goal.createdAt ||
        !goal.eligibleAt
    ) {

        goal.createdAt = null;
        goal.eligibleAt = Date.now();

    }

});

saveGoals();

let goalTestDate = null;

function getGoalNow() {

    if (goalTestDate) {
        return goalTestDate;
    }

    return Date.now();
}

function saveGoals() {
    localStorage.setItem("goalsData", JSON.stringify(goalsData));
}

/* ---------------------------------------------------------
   GOAL REWARD
--------------------------------------------------------- */

function getGoalReward(priority) {

    if (priority === "Low") {
        return 3;
    }

    if (priority === "Medium") {
        return 7;
    }

    if (priority === "High") {
        return 15;
    }

    return 0;
}

function getGoalCommitmentDays(priority) {

    if (priority === "Low") {
        return 3;
    }

    if (priority === "Medium") {
        return 7;
    }

    if (priority === "High") {
        return 30;
    }

    return 0;
}

/* ---------------------------------------------------------
   ADD GOAL
--------------------------------------------------------- */

function addGoal() {

    const title =
        document.getElementById("goalInput").value.trim();

    const priority =
        document.getElementById("priorityInput").value;

    const deadline =
        document.getElementById("goalDeadline").value;

    if (!title) {
        closeModal();
        return;
    }

    if (!deadline) {
        customAlert("Please set a deadline.");
        return;
    }

    if (isPastDateTime(deadline)) {

        customAlert(
            "Deadline cannot be in the past."
        );

        return;
    }


    /* -----------------------------------------
       MINIMUM DEADLINE
    ----------------------------------------- */

    const createdAt =
        getGoalNow();

    const commitmentDays =
        getGoalCommitmentDays(priority);

    const eligibleAt =
        createdAt +
        (
            commitmentDays *
            24 *
            60 *
            60 *
            1000
        );

    const deadlineTime =
        new Date(deadline).getTime();

    console.log("GOAL DEADLINE TEST");
    console.log("Created:", new Date(createdAt));
    console.log("Eligible:", new Date(eligibleAt));
    console.log("Deadline:", new Date(deadlineTime));
    console.log("Difference:", deadlineTime - createdAt);
    console.log(
        "Required:",
        commitmentDays * 24 * 60 * 60 * 1000
    );


    if (deadlineTime < eligibleAt) {

        customAlert(
            `Your ${priority.toLowerCase()} priority goal must have a deadline at least ${commitmentDays} days from now.`
        );
        return;
    }


    const newGoal = {

        id: Date.now().toString(),

        title,

        priority,

        deadline,

        createdAt,

        eligibleAt,

        achieved: false,

        achievedAt: null,

        overduePenaltyApplied: false,

        warned: false

    };

    goalsData.push(newGoal);

    saveGoals();

    renderGoals();

    closeModal();
}


/* ---------------------------------------------------------
   EDIT GOAL
--------------------------------------------------------- */

function openEditGoal(goalId) {

    const goal = goalsData.find(g => g.id === goalId);

    if (!goal) return;

    // Achieved goals are permanently locked
    if (goal.achieved) {
        customAlert("Achieved goals cannot be edited.");
        return;
    }

    // High priority goals are locked
    if (goal.priority === "High") {
        customAlert("High priority goals cannot be edited.");
        return;
    }

    const content =
        document.getElementById("modal-content");

    const modal =
        document.getElementById("modal");

    modal.classList.add("active");

    content.innerHTML = `
        <h3>Edit Goal</h3>

        <input
            id="editGoalInput"
            value="${escapeHTML(goal.title)}"
            placeholder="Goal"
        >

        <label>Priority</label>

        <select id="editGoalPriority">

            <option value="Low"
                ${goal.priority === "Low" ? "selected" : ""}>
                Low
            </option>

            <option value="Medium"
                ${goal.priority === "Medium" ? "selected" : ""}>
                Medium
            </option>

        </select>

        <label>Deadline</label>

        <input
            id="editGoalDeadline"
            type="datetime-local"
            value="${goal.deadline || ""}"
        >

        <button onclick="updateGoal('${goal.id}')">
            Update
        </button>

        <button onclick="closeModal()">
            Cancel
        </button>
    `;
}


/* ---------------------------------------------------------
   UPDATE GOAL
--------------------------------------------------------- */

function updateGoal(goalId) {

    const goal = goalsData.find(g => g.id === goalId);

    if (!goal) return;

    if (goal.achieved) {
        customAlert("Achieved goals cannot be edited.");
        return;
    }

    if (goal.priority === "High") {
        customAlert("High priority goals cannot be edited.");
        return;
    }

    const newTitle =
        document.getElementById("editGoalInput")
            .value.trim();

    const newPriority =
        document.getElementById("editGoalPriority")
            .value;

    const newDeadline =
        document.getElementById("editGoalDeadline")
            .value;

    if (!newTitle) {
        customAlert("Goal name cannot be empty.");
        return;
    }

    if (!newDeadline) {
        customAlert("Please set a deadline.");
        return;
    }

    if (isPastDateTime(newDeadline)) {
        customAlert("Deadline cannot be in the past.");
        return;
    }

    /* -----------------------------------------
   MINIMUM DEADLINE
----------------------------------------- */

    const editedAt =
        getGoalNow();

    const commitmentDays =
        getGoalCommitmentDays(
            newPriority
        );

    const eligibleAt =
        editedAt +
        (
            commitmentDays *
            24 *
            60 *
            60 *
            1000
        );

    const deadlineTime =
        new Date(newDeadline).getTime();


    if (deadlineTime < eligibleAt) {

        customAlert(
            `This ${newPriority.toLowerCase()} priority goal requires at least ${commitmentDays} days before its deadline.`
        );

        return;
    }

    goal.title = newTitle;

    goal.priority = newPriority;
    goal.deadline = newDeadline;


    /* -----------------------------------------
       RESET COMMITMENT PERIOD
    ----------------------------------------- */

    const editableAt = getGoalNow();



    goal.createdAt =
        editedAt;

    goal.eligibleAt =
        editedAt +
        (
            commitmentDays *
            24 *
            60 *
            60 *
            1000
        );


    /* -----------------------------------------
       RESET DEADLINE STATE
    ----------------------------------------- */

    goal.warned = false;

    goal.overduePenaltyApplied = false;

    saveGoals();

    renderGoals();

    closeModal();
}


/* ---------------------------------------------------------
   RENDER GOALS
--------------------------------------------------------- */
function getGoalCompletionDate() {

    const date = new Date(getGoalNow());

    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("-");
}


function canCompleteGoalToday() {

    const today =
        getGoalCompletionDate();

    const lastGoalCompletionDate =
        localStorage.getItem(
            "lastGoalCompletionDate"
        );

    return (
        lastGoalCompletionDate !== today
    );
}

function renderGoals() {

    const container =
        document.getElementById("goal-list");

    container.innerHTML = "";

    goalsData.forEach(goal => {

        const div =
            document.createElement("div");

        div.className = "goal show";

        div.dataset.goalId = goal.id;

        div.dataset.deadline =
            goal.deadline || "";

        if (goal.achieved) {
            div.classList.add("goal-achieved");
        }

        let formattedDeadline = "";

        if (goal.deadline) {

            const d =
                new Date(goal.deadline);

            formattedDeadline =
                d.toLocaleDateString([], {
                    day: "numeric",
                    month: "short"
                })

        }

        const reward =
            getGoalReward(goal.priority);

        const isLocked =
            goal.achieved ||
            goal.priority === "High";

        div.innerHTML = `

            <div class="goal-header">

                <span class="goal-title">
                    ${escapeHTML(goal.title)}
                </span>

                <span class="goal-priority ${goal.priority}">
                    ${goal.priority}
                </span>

            </div>


            <div class="goal-meta">

                <span class="goal-deadline">
                    ${formattedDeadline}
                </span>

            </div>


            <div class="goal-status-row">

                <span class="goal-timer"></span>
                <span class="goal-overdue"></span>

            </div>


<div class="goal-actions">

    ${goal.achieved
                ? `
            <span class="achieved-badge">
                ✓ Achieved
            </span>
        `
                : `
            <button
    class="goal-achieve-btn"
    ${goal.eligibleAt && getGoalNow() < goal.eligibleAt
                    ? "disabled"
                    : ""
                }
    onclick="event.stopPropagation();
    markGoalAchieved('${goal.id}')"
>
    ${goal.eligibleAt && getGoalNow() < goal.eligibleAt
                    ? "Locked"
                    : "Achieve"
                }
</button>

            ${goal.priority === "High"
                    ? `
                    <span class="goal-locked">
                        🔒 Locked
                    </span>
                `
                    : `
                    <button
                        class="goal-edit-btn"
                        onclick="event.stopPropagation();
                        openEditGoal('${goal.id}')"
                    >
                        Edit
                    </button>
                `
                }

            <button
                class="goal-remove-btn"
                onclick="event.stopPropagation();
                removeGoal('${goal.id}')"
            >
                Remove
            </button>
        `
            }

</div>
        `;

        container.appendChild(div);
    });

    updateGoalTimers();
}


/* ---------------------------------------------------------
   ACHIEVE GOAL
--------------------------------------------------------- */
// function canCompleteGoalToday() {

//     const today =
//         getISTDate()
//             .toISOString()
//             .slice(0, 10);

//     const lastGoalCompletionDate =
//         localStorage.getItem(
//             "lastGoalCompletionDate"
//         );

//     return (
//         lastGoalCompletionDate !== today
//     );
// }

function markGoalAchieved(goalId) {

    const goal =
        goalsData.find(g => g.id === goalId);

    if (!goal || goal.achieved) return;

    /* -----------------------------------------
   COMMITMENT CHECK
----------------------------------------- */

    const now = getGoalNow();

    if (goal.eligibleAt && now < goal.eligibleAt) {

        const remaining =
            goal.eligibleAt - now;

        const days =
            Math.ceil(
                remaining /
                (1000 * 60 * 60 * 24)
            );

        customAlert(
            `This ${goal.priority.toLowerCase()} priority goal requires a ${getGoalCommitmentDays(goal.priority)}-day commitment.\n\n${days} day${days !== 1 ? "s" : ""} remaining.`
        );

        return;
    }


    /* -----------------------------------------
   DAILY GOAL COMPLETION LIMIT
----------------------------------------- */

    if (!canCompleteGoalToday()) {

        customAlert(
            "You can only complete one goal per day."
        );

        return;
    }

    // Safety: cannot complete overdue goals
    if (
        goal.deadline &&
        new Date(goal.deadline).getTime() <= now
    ) {
        customAlert(
            "This goal is overdue and can no longer be achieved."
        );

        return;
    }

    goal.achieved = true;

    goal.achievedAt =
        new Date().toLocaleDateString([], {
            day: "numeric",
            month: "short",
            year: "numeric"
        });

    localStorage.setItem(
        "lastGoalCompletionDate",
        getGoalCompletionDate()
    );

    const reward =
        getGoalReward(goal.priority);

    completedMissions += reward;

    localStorage.setItem(
        "completedMissions",
        completedMissions
    );

    document.getElementById(
        "missionCounter"
    ).textContent = completedMissions;

    saveGoals();

    renderGoals();

    renderMarketplace(currentMarketplaceFilter);

    // Celebration
    // playAppTone("mint");

    playGoalAchievementVideo()

    pushNotification(
        "Goal Achieved 🎯",
        `"${goal.title}" completed • +${reward} Improvement Points`
    );

    showSmartNotification(
        "Goal Completed!",
        `+${reward} Improvement Points earned`
    );
}


/* ---------------------------------------------------------
   GOAL ACHIEVEMENT ANIMATION
--------------------------------------------------------- */

function playGoalAchievementVideo() {

    const overlay =
        document.createElement("div");

    overlay.className =
        "goal-achievement-video";

    overlay.innerHTML = `

        <div class="goal-achievement-video-content">

            <div class="goal-achievement-video-title">
                GOAL ACHIEVED
            </div>

            <div class="goal-achievement-video-frame">

                <video
                    autoplay
                    playsinline
                    preload="auto"
                >
                    <source
                        src="/AchievedGoal.mp4"
                        type="video/mp4"
                    >
                </video>

            </div>

            <button
                type="button"
                class="goal-achievement-continue"
            >
                Continue
            </button>

        </div>
    `;

    document.body.appendChild(overlay);


    const video =
        overlay.querySelector("video");

    const continueButton =
        overlay.querySelector(
            ".goal-achievement-continue"
        );


    /* =========================================
       PLAY
    ========================================= */

    video.play().catch(error => {

        console.warn(
            "Goal achievement video could not autoplay:",
            error
        );

    });


    /* =========================================
       CLOSE
    ========================================= */

    function closeVideo() {

        if (
            overlay.classList.contains(
                "closing"
            )
        ) {
            return;
        }

        video.pause();
        stopAllAppAudio();

        overlay.classList.add(
            "closing"
        );

        setTimeout(() => {

            overlay.remove();

        }, 350);
    }


    /* =========================================
       CONTINUE BUTTON
    ========================================= */

    continueButton.addEventListener(
        "click",
        closeVideo
    );


    /* =========================================
       VIDEO FINISHED
    ========================================= */

    video.addEventListener(
        "ended",
        closeVideo
    );


    /* =========================================
       VIDEO ERROR
    ========================================= */

    video.addEventListener(
        "error",
        closeVideo
    );


    /* =========================================
       SHOW
    ========================================= */

    requestAnimationFrame(() => {

        requestAnimationFrame(() => {

            overlay.classList.add(
                "active"
            );

        });

    });

}


/* ---------------------------------------------------------
   GOAL TIMER + OVERDUE SYSTEM
--------------------------------------------------------- */

function updateGoalTimers() {

    const goalElements =
        document.querySelectorAll(
            "#goal-list .goal"
        );

    goalElements.forEach(el => {

        const goalId =
            el.dataset.goalId;

        const goal =
            goalsData.find(
                g => g.id === goalId
            );

        if (!goal || goal.achieved) return;

        if (!goal.deadline) return;


        const commitment =
            el.querySelector(".goal-commitment");

        const overdueBadge =
            el.querySelector(".goal-overdue");

        const achieveButton =
            el.querySelector(".goal-achieve-btn");

        /* -------------------------
   COMMITMENT PERIOD
------------------------- */

        if (
            commitment &&
            goal.eligibleAt
        ) {

            const commitmentDiff =
                goal.eligibleAt - getGoalNow();


            if (commitmentDiff > 0) {


                if (achieveButton) {
                    achieveButton.disabled = true;
                    achieveButton.textContent = "Locked";
                }

                const days =
                    Math.floor(
                        commitmentDiff /
                        (1000 * 60 * 60 * 24)
                    );

                const hours =
                    Math.floor(
                        (
                            commitmentDiff %
                            (1000 * 60 * 60 * 24)
                        ) /
                        (1000 * 60 * 60)
                    );

                if (days > 0) {

                    commitment.textContent =
                        `🔒 Commitment: ${days}d ${hours}h remaining`;

                } else {

                    commitment.textContent =
                        `🔒 Commitment: ${hours}h remaining`;

                }

            } else {

                commitment.textContent =
                    "✓ Ready to achieve";

                if (achieveButton) {
                    achieveButton.disabled = false;
                    achieveButton.textContent = "Achieve";
                }

            }

        }

        const deadline =
            new Date(goal.deadline).getTime();

        const diff =
            deadline - getGoalNow();

        const timer =
            el.querySelector(".goal-timer");




        /* -------------------------
           STILL ACTIVE
        ------------------------- */

        if (diff > 0) {

            const days =
                Math.floor(
                    diff /
                    (1000 * 60 * 60 * 24)
                );

            const hours =
                Math.floor(
                    (diff %
                        (1000 * 60 * 60 * 24)) /
                    (1000 * 60 * 60)
                );

            const minutes =
                Math.floor(
                    (diff %
                        (1000 * 60 * 60)) /
                    (1000 * 60)
                );

            if (days > 0) {

                timer.textContent =
                    `${days}d ${hours}h left`;

            } else {

                timer.textContent =
                    `${hours}h ${minutes}m left`;
            }

            overdueBadge.innerHTML = "";


            // Due soon notification
            if (
                diff <= 2 * 60 * 60 * 1000 &&
                !goal.warned
            ) {

                goal.warned = true;

                pushNotification(
                    "Goal Deadline",
                    `"${goal.title}" is due within 2 hours.`
                );

                saveGoals();
            }

            return;
        }


        /* -------------------------
           OVERDUE
        ------------------------- */

        timer.textContent = "";

        overdueBadge.innerHTML =
            `<span class="overdue-badge">
                Overdue
            </span>`;


        /*
         * PENALTY
         *
         * Only happens once.
         */

        if (!goal.overduePenaltyApplied) {

            goal.overduePenaltyApplied = true;

            const penalty =
                getGoalReward(goal.priority);

            completedMissions = Math.max(
                0,
                completedMissions - penalty
            );
            localStorage.setItem(
                "completedMissions",
                completedMissions
            );

            document.getElementById(
                "missionCounter"
            ).textContent =
                completedMissions;


            pushNotification(
                "⚠ Goal Failed",
                `"${goal.title}" expired. -${penalty} Improvement Points`
            );


            showSmartNotification(
                "Goal Overdue",
                `-${penalty} Improvement Points`
            );


            saveGoals();

            renderMarketplace(
                currentMarketplaceFilter
            );
        }
    });
}


/* ---------------------------------------------------------
   REMOVE GOAL
--------------------------------------------------------- */

function removeGoal(goalId) {

    const goal =
        goalsData.find(g => g.id === goalId);

    if (!goal) return;

    // Achieved = permanent


    customConfirm(
        `Remove "${goal.title}"?`,
        () => {

            goalsData =
                goalsData.filter(
                    g => g.id !== goalId
                );

            saveGoals();

            renderGoals();
        }
    );
}


/* ---------------------------------------------------------
   SAFE TEXT
--------------------------------------------------------- */

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* ---------------------------------------------------------
   GOAL TIMER
--------------------------------------------------------- */

setInterval(
    updateGoalTimers,
    1000
);

/* =========================================================
   8. COUNTDOWNS MODULE
========================================================= */
let countdowns = JSON.parse(localStorage.getItem("countdowns")) || [];

function saveCountdowns() {
    localStorage.setItem("countdowns", JSON.stringify(countdowns));
}

function addCountdown() {
    const titleInput = document.getElementById("countdownTitle");
    const timeInput = document.getElementById("countdownDateTime");

    const title = titleInput.value.trim();
    const dateTime = timeInput.value;

    // ❌ EMPTY CHECK
    if (!title || !dateTime) {
        closeModal();
        return;
    }

    // ❌ PAST TIME CHECK (HARD STOP)
    if (isPastDateTime(dateTime)) {
        customAlert("Countdown time cannot be in the past.");
        return; // 🔥 DO NOT CONTINUE
    }

    // ✅ ONLY NOW MUTATE STATE
    countdowns.push({
        title,
        date: new Date(dateTime).toISOString(),
        startTime: new Date().toISOString()
    });

    saveCountdowns();
    renderCountdowns();

    // 🔥 CLEANUP
    titleInput.value = "";
    timeInput.value = "";

    closeModal();
}





function removeCountdown(index) {
    countdowns.splice(index, 1);
    saveCountdowns();
    renderCountdowns();
}

function renderCountdowns() {
    const list = document.getElementById("countdown-list");
    const counter = document.getElementById("countdownCounter");

    if (!list) return;

    list.innerHTML = "";

    if (counter) {
        counter.textContent = countdowns.length;
    }

    list.innerHTML = "";

    document.getElementById("countdownCounter").textContent = countdowns.length;

    if (countdowns.length === 0) {
        list.textContent = "No countdowns added";
        return;
    }

    countdowns.forEach((c, index) => {
        const div = document.createElement("div");
        div.className = "goal show";

        div.innerHTML = `
      <strong>${c.title}</strong>
      <div class="timer-row">
  <div class="timer-bar-container">
    <div class="timer-bar" id="timerbar-${index}"></div>
  </div>
  <div class="timer-text" id="timer-${index}"></div>
</div>
      <button class="remove-btn2" onclick="removeCountdown(${index})">Remove</button>
    `;

        list.appendChild(div);
    });

    updateTimers();
}


function updateTimers() {
    clearInterval(window.timerInterval);

    window.timerInterval = setInterval(() => {
        countdowns.forEach((c, index) => {
            const now = new Date().getTime();
            const target = new Date(c.date).getTime();
            const diff = target - now;

            const totalDuration = target - new Date(countdowns[index].startTime || c.date).getTime();
            const remaining = diff;

            let percent = (remaining / totalDuration) * 100;

            // clamp values
            if (percent < 0) percent = 0;
            if (percent > 100) percent = 100;

            const bar = document.getElementById(`timerbar-${index}`);
            if (bar) bar.style.width = percent + "%";
            // Notify when 1 hour left
            if (diff > 0 && diff <= 60 * 60 * 1000 && !c.warned) {
                c.warned = true;
                pushNotification("Countdown Ending Soon", `"${c.title}" ends in 1 hour`);
            }


            const el = document.getElementById(`timer-${index}`);
            if (!el) return;

            if (diff <= 0) {
                el.style.color = "red";
                el.textContent = "Time's up!";
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const secs = Math.floor((diff % (1000 * 60)) / 1000);

            el.textContent = `${days}d ${hours}h ${mins}m ${secs}s`;
        });
    }, 1000);
}




/* =========================================================
   9. RESET & DATA MANAGEMENT
========================================================= */
function saveData() {
    localStorage.setItem("completedMissions", completedMissions);
    localStorage.setItem("missionHistory", JSON.stringify(missionHistory));
    // Save deducted flag on missions
    document.querySelectorAll("#mission-list li").forEach(li => {
        if (li.dataset.deducted) {
            li.setAttribute("data-deducted", "true");
        }
    });


    // 🔥 STORE XP INTO HTML ATTRIBUTES
    document.querySelectorAll("#skill-list .skill").forEach(skill => {
        skill.setAttribute("data-xp", skill.dataset.xp || "0");
    });

    localStorage.setItem("missions", document.getElementById("mission-list").innerHTML);
    localStorage.setItem("skills", document.getElementById("skill-list").innerHTML);
    localStorage.setItem("goals", document.getElementById("goal-list").innerHTML);

    document.querySelectorAll("#mission-list li").forEach(li => {
        if (li.dataset.overdueNotified) {
            li.setAttribute("data-overdue-notified", "true");
        }
    });

}

function loadData() {

    /* =====================================================
       SYNC IMPROVEMENT POINTS FROM STORAGE
    ===================================================== */

    completedMissions = Math.max(
        0,
        Number(
            localStorage.getItem(
                "completedMissions"
            )
        ) || 0
    );

    try {
        const storedHistory =
            localStorage.getItem("missionHistory");

        missionHistory =
            storedHistory
                ? JSON.parse(storedHistory)
                : {};

    } catch (error) {
        console.warn(
            "Could not load mission history:",
            error
        );

        missionHistory = {};
    }


    document.getElementById("mission-list").innerHTML =
        localStorage.getItem("missions") || "";
    document.getElementById("skill-list").innerHTML =
        localStorage.getItem("skills") || "";
    document.getElementById("goal-list").innerHTML =
        localStorage.getItem("goals") || "";

    // --- FIX MISSIONS AFTER LOADING ---
    document.querySelectorAll("#mission-list li").forEach(li => {

        // 1. Ensure overdueMark exists
        if (!li.querySelector(".overdueMark")) {
            const span = document.createElement("span");
            span.className = "overdueMark";
            li.appendChild(span);
        }

        // 2. Ensure deadlineDisplay exists
        if (!li.querySelector(".deadlineDisplay")) {
            const dspan = document.createElement("span");
            dspan.className = "deadlineDisplay";
            li.appendChild(dspan);
        }

        // 3. Restore deadline
        const savedDeadline = li.getAttribute("data-deadline");
        if (savedDeadline) li.dataset.deadline = savedDeadline;

        // 4. Restore deducted flag
        if (li.getAttribute("data-deducted") === "true") {
            li.dataset.deducted = "true";
        }

        // 5. Restore overdue notification flag
        if (li.getAttribute("data-overdue-notified") === "true") {
            li.dataset.overdueNotified = "true";
        }

        // ===============================
        // 🔥 HARDCORE MODE RESTORE (NEW)
        // ===============================
        if (li.getAttribute("data-hardcore") === "true") {
            li.dataset.hardcore = "true";
        }

        if (li.getAttribute("data-hardcore-punished") === "true") {
            li.dataset.hardcorePunished = "true";
        }
        // ===============================

        // 6. Reattach edit modal click
        li.addEventListener("click", (e) => {
            if (e.target.classList.contains("complete-btn")) return;
            openModal("edit-mission", li);
        });
    });

    // ---- SKILLS ----
    document.querySelectorAll("#skill-list .skill").forEach(div => {
        div.addEventListener("click", () => openModal("edit-skill", div));
        div.classList.add("show");
    });

    // ---- GOALS ----
    document.querySelectorAll("#goal-list .goal").forEach(div => {
        div.classList.add("show");
        const removeBtn = div.querySelector(".remove-btn");
        if (removeBtn) {
            removeBtn.onclick = () => removeGoal(removeBtn);
        }
    });

    // ---- SKILL XP ----
    document.querySelectorAll("#skill-list .skill").forEach(skill => {
        const xp = parseInt(skill.getAttribute("data-xp") || "0");
        skill.dataset.xp = xp;
        skill.querySelector(".xp-count").textContent = xp;
        skill.querySelector(".progress-bar").style.width = xp + "%";
    });

    const missionCounter =
        document.getElementById("missionCounter");

    if (missionCounter) {
        missionCounter.textContent =
            completedMissions;
    }
}

/* =========================================================
   COMPLETE APP RESET
   EVERYTHING → FACTORY STATE
========================================================= */

/* =========================================================
   COMPLETE APP RESET
   EVERYTHING → FACTORY STATE
========================================================= */

/* =========================================================
   COMPLETE APP RESET
   EVERYTHING → FACTORY STATE
========================================================= */

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

            soundSettings = {
                ...DEFAULT_SOUND_SETTINGS
            };

        }


        /* =====================================================
           4. RESET ALL LOCAL STORAGE
        ===================================================== */

        localStorage.clear();


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

        missionHistory = {};


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

        if (
            window.timerInterval
        ) {

            clearInterval(
                window.timerInterval
            );

            window.timerInterval =
                null;

        }


        /* =====================================================
           12. RESET PREVIEW / AUDIO REFERENCES
        ===================================================== */

        if (
            typeof activeTone !==
            "undefined"
        ) {

            activeTone = null;

        }


        if (
            typeof previewAudio !==
            "undefined"
        ) {

            previewAudio = null;

        }


        if (
            typeof previewType !==
            "undefined"
        ) {

            previewType = null;

        }


        /* =====================================================
           13. RESET UI LISTS
        ===================================================== */

        const missionList =
            document.getElementById(
                "mission-list"
            );


        const skillList =
            document.getElementById(
                "skill-list"
            );


        const goalList =
            document.getElementById(
                "goal-list"
            );


        const countdownList =
            document.getElementById(
                "countdown-list"
            );


        if (missionList) {

            missionList.innerHTML =
                "";

        }


        if (skillList) {

            skillList.innerHTML =
                "";

        }


        if (goalList) {

            goalList.innerHTML =
                "";

        }


        if (countdownList) {

            countdownList.innerHTML =
                "";

        }


        /* =====================================================
           14. RESET COUNTERS
        ===================================================== */

        const missionCounter =
            document.getElementById(
                "missionCounter"
            );


        const countdownCounter =
            document.getElementById(
                "countdownCounter"
            );


        if (missionCounter) {

            missionCounter.textContent =
                "0";

        }


        if (countdownCounter) {

            countdownCounter.textContent =
                "0";

        }


        /* =====================================================
           15. RESET NOTIFICATIONS UI
        ===================================================== */

        const notificationList =
            document.getElementById(
                "notificationList"
            );


        if (notificationList) {

            notificationList.innerHTML =
                `<p style="opacity:.6;">
                    No notifications
                </p>`;

        }


        const notificationBadge =
            document.getElementById(
                "notifyBadge"
            );


        if (notificationBadge) {

            notificationBadge.style.display =
                "none";

            notificationBadge.textContent =
                "";

        }


        /* =====================================================
           16. RESET CUSTOM CARD MANAGER
        ===================================================== */

        const customCardsManager =
            document.getElementById(
                "customCardsManager"
            );


        if (customCardsManager) {

            customCardsManager.innerHTML =
                `
                <div class="custom-cards-empty">
                    You haven't created any
                    custom cards yet.
                </div>
                `;

        }


        /* =====================================================
           17. RESET MONTHLY SUMMARY
        ===================================================== */

        const monthlySummaryTitle =
            document.getElementById(
                "monthlySummaryTitle"
            );


        const monthlySummaryText =
            document.getElementById(
                "monthlySummaryText"
            );


        const monthlySummaryCompletion =
            document.getElementById(
                "monthlySummaryCompletion"
            );


        const monthlySummaryConsistency =
            document.getElementById(
                "monthlySummaryConsistency"
            );


        const monthlySummaryGoals =
            document.getElementById(
                "monthlySummaryGoals"
            );


        const monthlyConsistency =
            document.getElementById(
                "monthlyConsistency"
            );


        const monthlyCompleted =
            document.getElementById(
                "monthlyCompleted"
            );


        const monthlyMissed =
            document.getElementById(
                "monthlyMissed"
            );


        const monthlyActiveDays =
            document.getElementById(
                "monthlyActiveDays"
            );


        const monthlyImprovementPoints =
            document.getElementById(
                "monthlyImprovementPoints"
            );


        if (monthlySummaryTitle) {

            monthlySummaryTitle.textContent =
                new Date(
                    new Date().getFullYear(),
                    new Date().getMonth(),
                    1
                ).toLocaleDateString(
                    [],
                    {
                        month: "long"
                    }
                );

        }


        if (monthlySummaryText) {

            monthlySummaryText.textContent =
                "No summary available yet.";

        }


        if (monthlySummaryCompletion) {

            monthlySummaryCompletion.textContent =
                "0%";

        }


        if (monthlySummaryConsistency) {

            monthlySummaryConsistency.textContent =
                "0%";

        }


        if (monthlySummaryGoals) {

            monthlySummaryGoals.textContent =
                "0/0";

        }


        if (monthlyConsistency) {

            monthlyConsistency.textContent =
                "0%";

        }


        if (monthlyCompleted) {

            monthlyCompleted.textContent =
                "0";

        }


        if (monthlyMissed) {

            monthlyMissed.textContent =
                "0";

        }


        if (monthlyActiveDays) {

            monthlyActiveDays.textContent =
                "0";

        }


        if (monthlyImprovementPoints) {

            monthlyImprovementPoints.textContent =
                "0";

        }


        /* =====================================================
           18. RESET MONTHLY ACTIVITY CALENDAR
        ===================================================== */

        const monthlyActivityCalendar =
            document.getElementById(
                "monthlyActivityCalendar"
            );


        if (monthlyActivityCalendar) {

            monthlyActivityCalendar.innerHTML =
                "";

        }


        /* =====================================================
           19. RESET MONTHLY GRAPH
        ===================================================== */

        const monthlyConsistencyGraph =
            document.getElementById(
                "monthlyConsistencyGraph"
            );


        if (monthlyConsistencyGraph) {

            monthlyConsistencyGraph.innerHTML =
                "";

        }


        /* =====================================================
           20. RESET MONTHLY GOALS / MOMENTUM
        ===================================================== */

        const monthlyGoals =
            document.getElementById(
                "monthlyGoals"
            );


        if (monthlyGoals) {

            monthlyGoals.innerHTML =
                "";

        }


        const monthlyMomentum =
            document.getElementById(
                "monthlyMomentum"
            );


        if (monthlyMomentum) {

            monthlyMomentum.innerHTML =
                "";

        }


        /* =====================================================
           21. RESET MARKETPLACE
        ===================================================== */

        if (
            typeof renderMarketplace ===
            "function"
        ) {

            renderMarketplace(
                "ALL"
            );

        }


        if (
            typeof renderMyCards ===
            "function"
        ) {

            renderMyCards();

        }


        /* =====================================================
           22. RESET ACHIEVEMENTS
        ===================================================== */

        if (
            typeof renderAchievements ===
            "function"
        ) {

            renderAchievements();

        }


        /* =====================================================
           23. RESET CUSTOM CARD CONTROLS
        ===================================================== */

        if (
            typeof initializeCustomCardGradeControls ===
            "function"
        ) {

            initializeCustomCardGradeControls();

        }


        /* =====================================================
           24. RESET SOUND UI
        ===================================================== */

        if (
            typeof renderSoundSettings ===
            "function"
        ) {

            try {

                renderSoundSettings();

            } catch (error) {

                console.warn(
                    "Could not reset sound UI:",
                    error
                );

            }

        }


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


        /* =====================================================
           26. RESET MONTHLY RUNTIME VARIABLES
        ===================================================== */

        if (
            typeof monthlyReportData !==
            "undefined"
        ) {

            monthlyReportData = null;

        }


        if (
            typeof monthlySummaryData !==
            "undefined"
        ) {

            monthlySummaryData = null;

        }


        if (
            typeof monthlyStats !==
            "undefined"
        ) {

            monthlyStats = {};

        }


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

        reloadAfterAlert = true;

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



function isPastDateTime(dateTimeValue) {
    if (!dateTimeValue) return false; // allow empty deadlines
    return new Date(dateTimeValue).getTime() < Date.now();
}


/* =========================================================
   10. INITIALIZATION
========================================================= */
window.addEventListener("load", () => {
    loadData();
    enforceDailyReset();
    renderMarketplace();
    refreshRecurringMissions();
    checkMissedDeadlines();
    renderAchievements();
    renderCountdowns();
    renderGoals();

    /* =====================================================
       MONTHLY REPORT
    ===================================================== */

    if (
        typeof renderMonthlyReport ===
        "function"
    ) {
        renderMonthlyReport();
    }


    setTimeout(() => {

        cacheAllMusic();

    }, 1000);


    const activePage = document.querySelector("section.active")
        ? document.querySelector("section.active").id
        : "missions";

    showPage(activePage);
});

document.querySelectorAll("#goal-list .goal").forEach(div => {
    div.classList.add("show");
    const removeBtn = div.querySelector(".remove-btn");
    if (removeBtn) {
        removeBtn.onclick = () => removeGoal(removeBtn);
    }
});

//Cheats

let resetHoldTimer = null;
const RESET_HOLD_DURATION = 5000; // 5 seconds

const resetBtn = document.getElementById("resetDataBtn"); // your reset button ID

resetBtn.addEventListener("touchstart", startResetHold);
resetBtn.addEventListener("mousedown", startResetHold);

resetBtn.addEventListener("touchend", cancelResetHold);
resetBtn.addEventListener("mouseup", cancelResetHold);
resetBtn.addEventListener("mouseleave", cancelResetHold);

function startResetHold() {
    resetHoldTimer = setTimeout(() => {
        openCheatModal();
        if (navigator.vibrate) navigator.vibrate(80);
    }, RESET_HOLD_DURATION);
}

function cancelResetHold() {
    clearTimeout(resetHoldTimer);
}
function openCheatModal() {
    const modal = document.getElementById("cheatModal");
    modal.classList.add("active");

    if (input) input.value;

    setTimeout(() => {
        document.getElementById("cheatInput").focus();
    }, 150);
}

function closeCheatModal() {
    document.getElementById("cheatModal").classList.remove("active");
}

function confirmCheat() {
    const code = document.getElementById("cheatInput").value.trim();

    if (code !== "Thala") {
        customAlert("Invalid cheat code.");
        return;
    }
    if (navigator.vibrate) navigator.vibrate(80);
    // ✅ CHEAT SUCCESS
    completedMissions = 9999;
    dailyImprovementCount = 0;

    localStorage.setItem("completedMissions", completedMissions);
    document.getElementById("missionCounter").textContent = completedMissions;

    document.getElementById("cheatInput").value = "";

    closeCheatModal();

    showSmartNotification(
        "Cheat Activated",
        "9999 Improvement Points granted."
    );
}

function skipDayCheat() {
    // Get current logical day
    const currentDay = lastImprovementDate
        ? new Date(lastImprovementDate)
        : new Date();

    // Move +1 day
    currentDay.setDate(currentDay.getDate() + 1);

    const nextDayKey = currentDay.toISOString().slice(0, 10);

    // Apply skip
    lastImprovementDate = nextDayKey;
    dailyImprovementCount = 0;

    localStorage.setItem("lastImprovementDate", nextDayKey);
    localStorage.setItem("dailyImprovementCount", "0");

    closeCheatModal();

    showSmartNotification(
        "⏭ Day Skipped",
        `New day activated (${nextDayKey})`
    );

    console.log("⏭ Day skipped to:", nextDayKey);
};


// New After August 2026

/* =========================================================
   FULL CARD MINT REVEAL
========================================================= */

function showMintedCard(card) {
    if (!card) return;

    document.getElementById("mintReveal")?.remove();

    const overlay = document.createElement("div");

    overlay.id = "mintReveal";

    overlay.innerHTML = `
        <div class="mint-reveal-content">

            <div class="mint-reveal-label">
                CARD MINTED
            </div>

            <div class="mint-card-stage">

                <div class="mint-card-light"></div>

                <img
                    class="mint-reveal-image"
                    src="${card.image}"
                    alt="${card.title}"
                >

            </div>

            <div class="mint-reveal-earned">
                YOU EARNED THIS
            </div>

            <h2 class="mint-reveal-title">
                ${card.title}
            </h2>

            <p class="mint-reveal-quote">
                ${card.quote || ""}
            </p>

            <button
                class="mint-reveal-close"
                onclick="closeMintedCard()"
            >
                Continue
            </button>

        </div>
    `;

    document.body.appendChild(overlay);

    // Start animation
    requestAnimationFrame(() => {
        overlay.classList.add("show");
    });


    playAppTone("mint");


    // Close by tapping outside
    overlay.addEventListener("click", e => {

        if (e.target === overlay) {
            closeMintedCard();
        }

    });
}


function closeMintedCard() {

    const reveal =
        document.getElementById("mintReveal");

    if (!reveal) return;

    reveal.classList.remove("show");

    setTimeout(() => {
        reveal.remove();
    }, 300);
}


window.showMintedCard =
    showMintedCard;

window.closeMintedCard =
    closeMintedCard;

/* =========================================================
   CUSTOM CARD CREATOR
========================================================= */

let customCardImageData = "";


/* =========================================================
   OPEN MODAL
========================================================= */

function openCustomCardModal() {

    const modal =
        document.getElementById(
            "customCardModal"
        );

    if (!modal) return;

    modal.classList.add("active");

}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeCustomCardModal() {

    const modal =
        document.getElementById(
            "customCardModal"
        );

    if (!modal) return;

    modal.classList.remove("active");

}


/* =========================================================
   IMAGE PICKER
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const picker =
            document.getElementById(
                "customCardImagePicker"
            );

        const input =
            document.getElementById(
                "customCardImage"
            );


        if (picker && input) {

            picker.addEventListener(
                "click",
                () => {

                    input.click();

                }
            );


            input.addEventListener(
                "change",
                event => {

                    const file =
                        event.target.files?.[0];

                    if (!file) return;


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



                    const reader = new FileReader();

                    reader.onload = () => {

                        const img = new Image();

                        img.onload = () => {

                            const MAX_SIZE = 1000;

                            let width = img.width;
                            let height = img.height;


                            /* Keep aspect ratio */

                            if (width > MAX_SIZE || height > MAX_SIZE) {

                                if (width > height) {

                                    height =
                                        Math.round(
                                            height *
                                            (MAX_SIZE / width)
                                        );

                                    width = MAX_SIZE;

                                } else {

                                    width =
                                        Math.round(
                                            width *
                                            (MAX_SIZE / height)
                                        );

                                    height = MAX_SIZE;

                                }

                            }


                            const canvas =
                                document.createElement(
                                    "canvas"
                                );

                            canvas.width = width;
                            canvas.height = height;


                            const ctx =
                                canvas.getContext(
                                    "2d"
                                );


                            ctx.drawImage(
                                img,
                                0,
                                0,
                                width,
                                height
                            );


                            /*
                             * Convert to compressed JPEG.
                             * This dramatically reduces IndexedDB usage.
                             */

                            customCardImageData =
                                canvas.toDataURL(
                                    "image/jpeg",
                                    0.82
                                );


                            const preview =
                                document.getElementById(
                                    "customCardImagePreview"
                                );

                            const placeholder =
                                document.getElementById(
                                    "customCardImagePlaceholder"
                                );


                            if (preview) {

                                preview.src =
                                    customCardImageData;

                                preview.style.display =
                                    "block";

                            }


                            if (placeholder) {

                                placeholder.style.display =
                                    "none";

                            }

                        };


                        img.onerror = () => {

                            console.error(
                                "Could not process card image."
                            );

                            customCardImageData = "";

                            customAlert(
                                "Could not process this image."
                            );

                        };


                        img.src =
                            reader.result;

                    };

                    reader.readAsDataURL(file);

                }
            );

        }


        /* =================================================
           LIMITED TOGGLE
        ================================================= */

        const limited =
            document.getElementById(
                "customCardLimited"
            );

        const expirationGroup =
            document.getElementById(
                "customCardExpirationGroup"
            );


        if (
            limited &&
            expirationGroup
        ) {

            limited.addEventListener(
                "change",
                () => {

                    expirationGroup.style.display =
                        limited.checked
                            ? "block"
                            : "none";

                }
            );

        }

    }
);


/* =========================================================
   CREATE CARD
   STEP 1 ONLY
========================================================= */

/* =========================================================
   CREATE / EDIT CUSTOM CARD
========================================================= */

async function createCustomCard() {

    const title =
        document.getElementById(
            "customCardTitle"
        )?.value.trim();

    const quote =
        document.getElementById(
            "customCardQuote"
        )?.value.trim();

    const grade =
        document.getElementById(
            "customCardGrade"
        )?.value || "A";

    const cost =
        Number(
            document.getElementById(
                "customCardCost"
            )?.value
        );

    const limited =
        document.getElementById(
            "customCardLimited"
        )?.checked || false;

    const expiresAt =
        document.getElementById(
            "customCardExpiresAt"
        )?.value || null;


    /* =====================================================
       VALIDATION
    ===================================================== */

    const imageData =
        window.customCardImageData ||
        customCardImageData ||
        "";


    /*
     * New cards require artwork.
     * Edited cards can reuse their existing artwork.
     */

    if (!imageData) {

        customAlert(
            "Please choose card artwork."
        );

        return;

    }


    if (!title) {

        customAlert(
            "Please enter a card title."
        );

        return;

    }


    if (!quote) {

        customAlert(
            "Please enter a quote."
        );

        return;

    }


    if (
        !Number.isFinite(cost) ||
        cost < 0
    ) {

        customAlert(
            "Please enter a valid card cost."
        );

        return;

    }


    const costRanges = {

        E: { min: 5, max: 14 },
        D: { min: 15, max: 24 },
        C: { min: 25, max: 49 },
        B: { min: 50, max: 79 },
        A: { min: 80, max: 150 },
        S: { min: 151, max: 200 }

    };

    const range =
        costRanges[grade];

    if (!range) {

        customAlert(
            "Invalid card grade."
        );

        return;
    }

    if (
        !Number.isFinite(cost) ||
        cost < range.min ||
        cost > range.max
    ) {

        customAlert(
            `${grade} cards must cost between ${range.min} and ${range.max} points.`
        );

        return;
    }


    /* =====================================================
       CREATE OR UPDATE ID
    ===================================================== */

    const existingCard =
        window.customCardEditId || null;

    if (existingCard) {

        const ownedCards =
            JSON.parse(
                localStorage.getItem("ownedCards") ||
                "{}"
            );

        if (ownedCards[existingCard]) {

            customAlert(
                "Owned cards cannot be edited."
            );

            return;

        }

    }

    if (
        existingCard &&
        grade === "W"
    ) {

        customAlert(
            "Limited Edition cards cannot be edited."
        );

        return;

    }


    const card = {

        id:
            existingCard ||
            `custom_${Date.now()}_${Math.random()
                .toString(36)
                .slice(2, 8)}`,

        title,

        quote,

        grade,

        cost,

        image:
            imageData,

        limited: false,

        expiresAt: null,

        custom:
            true

    };


    /* =====================================================
       SAVE TO INDEXEDDB
    ===================================================== */

    try {

        await saveCustomCard(
            card
        );

    } catch (error) {

        console.error(
            "Failed to save custom card:",
            error
        );

        customAlert(
            "Could not save the card."
        );

        return;

    }


    /* =====================================================
       UPDATE CURRENT CATALOG
    ===================================================== */

    window.cardCatalog =
        (window.cardCatalog || [])
            .filter(
                existing =>
                    existing.id !== card.id
            );


    window.cardCatalog.push(
        card
    );


    /* =====================================================
       REFRESH MARKETPLACE
    ===================================================== */

    if (
        typeof renderMarketplace ===
        "function"
    ) {

        renderMarketplace(
            window.currentMarketplaceFilter ||
            "ALL"
        );

    }


    /* =====================================================
       REFRESH CUSTOM CARD MANAGER
    ===================================================== */

    if (
        typeof renderCustomCardsManager ===
        "function"
    ) {

        await renderCustomCardsManager();

    }


    /* =====================================================
       CLOSE
    ===================================================== */

    closeCustomCardModal();


    /* =====================================================
       RESET
    ===================================================== */

    resetCustomCardForm();


    window.customCardEditId =
        null;


    /* =====================================================
       SUCCESS
    ===================================================== */

    customAlert(
        existingCard
            ? `"${title}" updated successfully.`
            : `"${title}" added to the marketplace.`
    );

}

function resetCustomCardForm() {

    customCardImageData = "";

    const title =
        document.getElementById(
            "customCardTitle"
        );

    const quote =
        document.getElementById(
            "customCardQuote"
        );

    const cost =
        document.getElementById(
            "customCardCost"
        );

    const image =
        document.getElementById(
            "customCardImagePreview"
        );

    const placeholder =
        document.getElementById(
            "customCardImagePlaceholder"
        );

    const file =
        document.getElementById(
            "customCardImage"
        );

    const expirationGroup =
        document.getElementById(
            "customCardExpirationGroup"
        );


    if (title) title.value = "";

    if (quote) quote.value = "";

    if (cost) cost.value = "";

    const grade =
        document.getElementById(
            "customCardGrade"
        );

    if (grade) {

        grade.value = "A";

        grade.disabled = false;

    }

    if (file) file.value = "";


    if (expirationGroup) {
        expirationGroup.style.display = "none";
    }

    if (image) {

        image.src = "";

        image.style.display =
            "none";

    }

    if (placeholder) {

        placeholder.style.display =
            "flex";

    }

}

function updateCustomCardCostRange() {

    const grade =
        document.getElementById(
            "customCardGrade"
        );

    const cost =
        document.getElementById(
            "customCardCost"
        );

    if (!grade || !cost) {
        return;
    }


    const ranges = {

        E: {
            min: 5,
            max: 14
        },

        D: {
            min: 15,
            max: 24
        },

        C: {
            min: 25,
            max: 49
        },

        B: {
            min: 50,
            max: 79
        },

        A: {
            min: 80,
            max: 150
        },

        S: {
            min: 151,
            max: 200
        }

    };


    const range =
        ranges[grade.value];

    if (!range) {
        return;
    }


    cost.min =
        range.min;

    cost.max =
        range.max;


    /*
     * If the current value is outside
     * the selected grade's range,
     * automatically move it into range.
     */

    const current =
        Number(cost.value);


    if (
        !Number.isFinite(current) ||
        current < range.min
    ) {

        cost.value =
            range.min;

    } else if (
        current > range.max
    ) {

        cost.value =
            range.max;

    }


    cost.placeholder =
        `${range.min}–${range.max}`;
}

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const grade =
            document.getElementById(
                "customCardGrade"
            );

        if (!grade) {
            return;
        }


        grade.addEventListener(
            "change",
            updateCustomCardCostRange
        );


        updateCustomCardCostRange();

    }
);
