/**
 * StandOut complete backup validation and restore.
 * Supports the previous STANDOUT_COMPLETE v4 format and the current v5 format.
 */
import { customCards } from "../cards/custom-cards.js";
import { background } from "../background/background.js";
import { normalizeMomentumStorageValue } from "../momentum/normalization.js";

const BACKUP_TYPE = "STANDOUT_COMPLETE";

function isRecord(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validateBackup(backup) {
    if (!isRecord(backup) || backup.backupType !== BACKUP_TYPE) {
        throw new TypeError("This is not a valid StandOut complete backup.");
    }
    const version = Number(backup.backupVersion);
    if (!Number.isInteger(version) || ![4, 5].includes(version)) {
        throw new TypeError("This backup version is not supported. Supported versions are 4 and 5.");
    }
    if (!isRecord(backup.localStorage)) {
        throw new TypeError("The backup is missing its LocalStorage data.");
    }
    for (const [key, value] of Object.entries(backup.localStorage)) {
        if (!key || typeof value !== "string") {
            throw new TypeError(`The backup contains an invalid LocalStorage entry: ${key}`);
        }
    }
    if (backup.customCards !== undefined && !Array.isArray(backup.customCards)) {
        throw new TypeError("The backup custom-card data is invalid.");
    }
    if (Array.isArray(backup.customCards) && backup.customCards.some(card =>
        !isRecord(card) || !card.id
    )) {
        throw new TypeError("The backup contains an invalid custom card.");
    }
    if (backup.background !== undefined && !isRecord(backup.background)) {
        throw new TypeError("The backup background data is invalid.");
    }
    if (backup.cardCatalog !== undefined && !Array.isArray(backup.cardCatalog)) {
        throw new TypeError("The backup card catalogue is invalid.");
    }
    if (backup.cardCatalog?.some(card => !isRecord(card) || !card.id)) {
        throw new TypeError("The backup contains an invalid catalogue card.");
    }
    if (backup.dailyChallenge !== undefined && backup.dailyChallenge !== null &&
        typeof backup.dailyChallenge !== "string") {
        throw new TypeError("The backup daily-challenge data is invalid.");
    }
    if (backup.background?.customBackgroundDataUrl !== undefined &&
        backup.background.customBackgroundDataUrl !== null &&
        typeof backup.background.customBackgroundDataUrl !== "string") {
        throw new TypeError("The backup custom background image is invalid.");
    }
    return backup;
}

function dataURLToBlob(dataURL) {
    if (typeof dataURL !== "string") throw new TypeError("Background image data is invalid.");
    const match = dataURL.match(/^data:([^;,]+)?(;base64)?,(.*)$/s);
    if (!match) throw new TypeError("Background image data URL is malformed.");
    const mime = match[1] || "application/octet-stream";
    const binary = match[2]
        ? atob(match[3])
        : decodeURIComponent(match[3]);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
    }
    return new Blob([bytes], { type: mime });
}

function captureLocalStorage() {
    const snapshot = {};
    for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (key !== null) snapshot[key] = localStorage.getItem(key);
    }
    return snapshot;
}

function buildStoragePayload(backup) {
    const values = { ...backup.localStorage };
    const runtime = isRecord(backup.runtimeState) ? backup.runtimeState : {};
    const monthly = isRecord(backup.monthlyReport) ? backup.monthlyReport : {};
    const backgroundData = isRecord(backup.background) ? backup.background : {};

    const runtimeKeys = {
        completedMissions: "completedMissions",
        completedMissionCount: "completedMissionCount",
        dailyImprovementCount: "dailyImprovementCount",
        lastImprovementDate: "lastImprovementDate",
        missionHistory: "missionHistory",
        ownedCards: "ownedCards",
        appNotifications: "appNotifications",
        countdowns: "countdowns",
        achievementsData: "achievements",
        soundSettings: "standout_sound_settings"
    };

    for (const [stateKey, storageKey] of Object.entries(runtimeKeys)) {
        if (runtime[stateKey] !== undefined) {
            const value = runtime[stateKey];
            values[storageKey] = typeof value === "string" && ["lastImprovementDate"].includes(stateKey)
                ? value
                : JSON.stringify(value);
        }
    }

    // v4 stored these groups separately in addition to its complete storage map.
    for (const group of [monthly.storage, backgroundData.storage]) {
        if (isRecord(group)) {
            for (const [key, value] of Object.entries(group)) {
                if (typeof value === "string") values[key] = value;
            }
        }
    }

    // Correctly restore the daily-challenge key if an older backup has the
    // separate top-level field (the original restore used a mismatched key).
    if (typeof backup.dailyChallenge === "string") {
        values.standout_daily_challenge = backup.dailyChallenge;
    }

    // Momentum state/history must use canonical IST date keys after restore.
    // Older backups may contain MM/DD/YYYY keys and duplicate days in both
    // formats; normalize before replacing the user's current LocalStorage.
    for (const key of ["standout_momentum_state", "standout_momentum_history"]) {
        if (typeof values[key] === "string") {
            values[key] = normalizeMomentumStorageValue(key, values[key]);
        }
    }

    return values;
}

async function replaceLocalStorage(values) {
    localStorage.clear();
    for (const [key, value] of Object.entries(values)) {
        localStorage.setItem(key, value);
    }
}

async function restoreStandOutBackupFile() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.hidden = true;

    const file = await new Promise(resolve => {
        input.addEventListener("change", () => resolve(input.files?.[0] || null), { once: true });
        input.addEventListener("cancel", () => resolve(null), { once: true });
        document.body.appendChild(input);
        input.click();
    });
    input.remove();
    if (!file) return false;

    try {
        const text = (await file.text()).replace(/^\uFEFF/, "").trim();
        const backup = validateBackup(JSON.parse(text));

        // Build and validate all LocalStorage values before any destructive
        // IndexedDB or LocalStorage changes are attempted.
        const storagePayload = buildStoragePayload(backup);

        const confirmed = window.confirm(
            "Restore this StandOut backup? Your current app data will be replaced. " +
            "Custom audio is not included in backups."
        );
        if (!confirmed) return false;

        // Capture the current state so a failed restore can roll back both
        // LocalStorage and feature-owned IndexedDB data.
        const previousStorage = captureLocalStorage();
        const previousCards = backup.customCards !== undefined
            ? await customCards.getAll()
            : null;
        const previousCardCatalog = backup.cardCatalog !== undefined
            ? (Array.isArray(window.cardCatalog) ? window.cardCatalog.map(card => ({ ...card })) : [])
            : null;
        const hasBackgroundPayload = Object.prototype.hasOwnProperty.call(
            backup.background || {}, "customBackgroundDataUrl"
        );
        const previousBackground = hasBackgroundPayload
            ? await background.loadCustomBackground()
            : null;

        try {
            if (backup.customCards !== undefined) {
                await customCards.replaceAll(backup.customCards);
            }

            if (backup.cardCatalog !== undefined) {
                window.cardCatalog = backup.cardCatalog.map(card => ({ ...card }));
            }

            if (hasBackgroundPayload) {
                if (backup.background.customBackgroundDataUrl) {
                    await background.saveCustomBackground(
                        dataURLToBlob(backup.background.customBackgroundDataUrl)
                    );
                } else {
                    await background.removeCustomBackground();
                }
            }

            await replaceLocalStorage(storagePayload);
        } catch (restoreError) {
            console.error("[StandOut Restore] Restore failed; rolling back:", restoreError);
            try {
                await replaceLocalStorage(previousStorage);
                if (previousCards) await customCards.replaceAll(previousCards);
                if (previousCardCatalog) window.cardCatalog = previousCardCatalog;
                if (hasBackgroundPayload) {
                    if (previousBackground) await background.saveCustomBackground(previousBackground);
                    else await background.removeCustomBackground();
                }
            } catch (rollbackError) {
                console.error("[StandOut Restore] Rollback also failed:", rollbackError);
            }
            throw restoreError;
        }

        console.info("[StandOut Restore] Backup restored.", {
            backupVersion: backup.backupVersion,
            localStorageKeys: Object.keys(storagePayload).length,
            customCards: Array.isArray(backup.customCards) ? backup.customCards.length : "unchanged",
            cardCatalog: Array.isArray(backup.cardCatalog) ? backup.cardCatalog.length : "unchanged"
        });

        window.reloadAfterAlert = true;
        window.customAlert?.("Backup restored successfully. Close this message to reload StandOut.");
        if (typeof window.customAlert !== "function") window.location.reload();
        return true;
    } catch (error) {
        console.error("[StandOut Restore] Could not restore backup:", error);
        window.customAlert?.(error instanceof SyntaxError
            ? "The selected file is not valid JSON."
            : `Could not restore backup: ${error.message}`);
        return false;
    }
}

export const restoreFeature = Object.freeze({
    validateBackup,
    buildStoragePayload,
    restoreStandOutBackupFile
});

window.restoreStandOutBackup = restoreStandOutBackupFile;
