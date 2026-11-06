/**
 * Season persistence boundary.
 * Keeps the existing LocalStorage key, saved shape, and fallback behavior.
 */
import { SEASON, STORAGE_KEY, createDefaultSeasonState } from "./season-core.js";

export function loadSeasonState({
    storage = localStorage,
    season = SEASON,
    onError = error => console.warn("Could not load Season state:", error)
} = {}) {
    try {
        const stored = storage.getItem(STORAGE_KEY);

        if (!stored) {
            return createDefaultSeasonState(season);
        }

        const parsed = JSON.parse(stored);

        if (!parsed || parsed.seasonId !== season.id) {
            return createDefaultSeasonState(season);
        }

        return {
            ...createDefaultSeasonState(season),
            ...parsed,
            rewards: parsed.rewards && typeof parsed.rewards === "object"
                ? parsed.rewards
                : {}
        };
    } catch (error) {
        onError(error);
        return createDefaultSeasonState(season);
    }
}

export function saveSeasonState(state, {
    storage = localStorage,
    onError = error => console.warn("Could not save Season state:", error)
} = {}) {
    try {
        storage.setItem(STORAGE_KEY, JSON.stringify(state));
        return true;
    } catch (error) {
        onError(error);
        return false;
    }
}

export function resetSeasonState({
    storage = localStorage,
    season = SEASON,
    onError = error => console.warn("Could not save Season state:", error)
} = {}) {
    try {
        storage.removeItem(STORAGE_KEY);
    } catch (error) {
        onError(error);
    }

    const freshState = createDefaultSeasonState(season);
    saveSeasonState(freshState, { storage, onError });
    return freshState;
}
