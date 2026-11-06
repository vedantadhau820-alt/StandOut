/**
 * StandOut complete backup creation and JSON download.
 * LocalStorage is captured in full; feature-owned IndexedDB data is added
 * through the corresponding feature APIs. Custom audio is intentionally
 * excluded, matching the historical complete-backup contract.
 */
import { customCards } from "../cards/custom-cards.js";
import { background } from "../background/background.js";

const BACKUP_TYPE = "STANDOUT_COMPLETE";
const BACKUP_VERSION = 5;

function cloneJSON(value, fallback = null) {
    if (value === undefined) return fallback;
    try {
        return JSON.parse(JSON.stringify(value));
    } catch (error) {
        throw new Error(`Could not serialize backup state: ${error.message}`);
    }
}

function blobToDataURL(blob) {
    if (!blob) return Promise.resolve(null);
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error || new Error("Could not read background image."));
        reader.readAsDataURL(blob);
    });
}

function collectLocalStorage() {
    const data = {};
    for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (key !== null) data[key] = localStorage.getItem(key);
    }
    return data;
}

function collectRuntimeState() {
    return {
        completedMissions: Number(window.completedMissions) || 0,
        completedMissionCount: Number(window.completedMissionCount) || 0,
        dailyImprovementCount: Number(window.dailyImprovementCount) || 0,
        lastImprovementDate: window.lastImprovementDate || "",
        missionHistory: cloneJSON(window.missionHistory, {}),
        ownedCards: cloneJSON(window.ownedCards, {}),
        appNotifications: cloneJSON(window.appNotifications, []),
        countdowns: cloneJSON(window.countdowns, []),
        achievementsData: cloneJSON(window.achievementsData, []),
        soundSettings: cloneJSON(window.soundSettings, {})
    };
}

function getISTFileStamp(date = new Date()) {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        hourCycle: "h23"
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}-${values.hour}-${values.minute}-${values.second}`;
}

async function createBackupPayload() {
    // Persist the current mission/skill/goal HTML before reading storage.
    window.saveData?.();

    const [cards, backgroundBlob] = await Promise.all([
        customCards.getAll(),
        background.loadCustomBackground()
    ]);

    return {
        backupVersion: BACKUP_VERSION,
        backupType: BACKUP_TYPE,
        createdAt: new Date().toISOString(),
        timezone: "Asia/Kolkata",
        localStorage: collectLocalStorage(),
        runtimeState: collectRuntimeState(),
        customCards: cloneJSON(cards, []),
        cardCatalog: Array.isArray(window.cardCatalog)
            ? cloneJSON(window.cardCatalog, [])
            : [],
        background: {
            customBackgroundDataUrl: await blobToDataURL(backgroundBlob)
        },
        included: {
            localStorage: true,
            runtimeState: true,
            customCards: true,
            customBackground: true,
            customAudio: false
        }
    };
}

async function downloadStandOutBackup() {
    try {
        const backup = await createBackupPayload();
        const json = JSON.stringify(backup, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `standout-backup-${getISTFileStamp()}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1500);

        window.customAlert?.("Complete StandOut backup downloaded successfully.");
        console.info("[StandOut Backup] Backup created.", {
            backupVersion: BACKUP_VERSION,
            localStorageKeys: Object.keys(backup.localStorage).length,
            customCards: backup.customCards.length,
            customBackground: Boolean(backup.background.customBackgroundDataUrl)
        });
        return backup;
    } catch (error) {
        console.error("[StandOut Backup] Backup failed:", error);
        window.customAlert?.("Could not create a complete backup. Check the console for details.");
        return false;
    }
}

export const backupFeature = Object.freeze({
    createBackupPayload,
    downloadStandOutBackup
});

window.downloadStandOutBackup = downloadStandOutBackup;
