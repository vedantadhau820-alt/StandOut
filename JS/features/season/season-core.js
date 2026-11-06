/**
 * Season configuration and pure calculations.
 * No DOM, storage, timers, or cross-feature side effects.
 */
export const SEASON = {

        id: "season-03",

        number: 3,

        name: "The Eternal Dharm",

        /*
         * TESTING START DATE
         * Change back to September 1 for production.
         */
        start: "2026-11-01T00:00:00+05:30",

        end: "2026-11-30T23:59:59+05:30",

        maxLevel: 20,

        xpPerLevel: 150,


        /* =================================================
           SEASON REWARDS
        ================================================= */

        rewards: {

            5: {
                type: "improvement-points",
                amount: 180,
                title: "100 Improvement Points"
            },

            10: {
                type: "improvement-points",
                amount: 250,
                title: "200 Improvement Points"
            },

            15: {
                type: "card",
                id: "season_03_card",
                title: "Jatayu"
            },

            20: {
                type: "exclusive-card",
                id: "season_03_exclusive_card",
                title: "Sita Maa"
            }

        }

    };

export const STORAGE_KEY = "standoutSeasonState";

export function createDefaultSeasonState(season = SEASON) {
    return {
        seasonId: season.id,
        xp: 0,
        level: 1,
        completed: false,
        startedAt: season.start,
        endedAt: null,
        rewards: {}
    };
}

export function calculateSeasonLevel(xp, season = SEASON) {
    const safeXP = Math.max(0, Number(xp) || 0);
    const level = Math.floor(safeXP / season.xpPerLevel) + 1;
    return Math.min(season.maxLevel, Math.max(1, level));
}
