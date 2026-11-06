import { SEASON, calculateSeasonLevel } from "./features/season/season-core.js";
import { loadSeasonState, saveSeasonState, resetSeasonState } from "./features/season/season-state.js";
import { calculateSeasonXPProgression, getNewlyUnlockedSeasonRewards, calculateSeasonProgress } from "./features/season/season-progression.js";
import { renderSeasonUI, updateSeasonCountdown } from "./features/season/season-ui.js";
import { initializeMonthlyResolution } from "./features/monthly-resolution/monthly-resolution.js";

/* =========================================================
   SEASON SYSTEM
========================================================= */

(() => {

    "use strict";


    /* =====================================================
       SEASON CONFIG
    ===================================================== */

    // Configuration and pure calculations live in season-core.js.


    /* =====================================================
       STORAGE
    ===================================================== */



    /* =====================================================
       LOAD STATE
    ===================================================== */

    function loadState() {
        return loadSeasonState({ season: SEASON });
    }

    function saveState(state) {
        return saveSeasonState(state);
    }

    /* =====================================================
       LEVEL CALCULATION
    ===================================================== */

    function calculateLevel(xp) {
        return calculateSeasonLevel(xp, SEASON);
    }


    /* =====================================================
       REWARD UNLOCK
    ===================================================== */

    function unlockSeasonRewards(
        state,
        oldLevel,
        newLevel
    ) {

        const newlyUnlocked = getNewlyUnlockedSeasonRewards(
            state,
            oldLevel,
            newLevel,
            SEASON
        );

        newlyUnlocked.forEach(({ level, reward }) => {
            state.rewards[level] = {
                unlocked: true,
                claimed: false,
                unlockedAt: new Date().toISOString()
            };

            console.log(
                `🏆 Season Reward Unlocked: Level ${level}`,
                reward.title
            );

            if (
                reward.type === "achievement" &&
                typeof window.unlockAchievement === "function"
            ) {
                window.unlockAchievement(reward.id);
            }

            if (typeof window.showSmartNotification === "function") {
                window.showSmartNotification(
                    "🏆 Season Reward Unlocked",
                    `Level ${level}: ${reward.title}`
                );
            }
        });

    }


    /* =====================================================
       ADD SEASON XP
    ===================================================== */

    function addXP(
        amount,
        source = "Activity"
    ) {

        const state =
            loadState();

        /*
     * Season has not started yet.
     * Do NOT award Season XP.
     */
        if (!hasSeasonStarted()) {

            console.log(
                "Season has not started yet. XP not awarded."
            );

            return state;
        }



        /*
         * Season already completed.
         */

        if (state.completed) {

            console.log(
                "Season is already complete."
            );

            return state;

        }


        const progression = calculateSeasonXPProgression(
            state,
            amount,
            SEASON
        );

        if (!progression) {
            return state;
        }

        state.xp = progression.totalXP;
        state.level = progression.newLevel;

        const oldLevel = progression.oldLevel;
        const newLevel = progression.newLevel;


        /*
         * Unlock any rewards crossed.
         */

        if (
            newLevel > oldLevel
        ) {

            unlockSeasonRewards(
                state,
                oldLevel,
                newLevel
            );


            console.log(
                `🏆 Season Level Up: ${newLevel}`
            );

        }


        /*
         * Save.
         */

        saveState(state);


        /*
         * Update UI.
         */

        renderSeason();


        console.log(
            `🏆 +${progression.xp} Season XP — ${source}`
        );


        return state;

    }


    /* =====================================================
       GET STATE
    ===================================================== */

    function getState() {

        return loadState();

    }


    /* =====================================================
       GET REWARD
    ===================================================== */

    function getReward(level) {

        return SEASON.rewards[level] || null;

    }


    /* =====================================================
       GET REWARD STATE
    ===================================================== */

    function getRewardState(level) {

        const state =
            loadState();

        return (
            state.rewards[level] ||
            null
        );

    }


    /* =====================================================
       CLAIM REWARD
    ===================================================== */

    /* =====================================================
   CLAIM SEASON REWARD
===================================================== */


    function claimReward(level) {

        const state = loadState();
        const reward = SEASON.rewards[level];

        if (!reward) {
            console.warn("Season reward does not exist:", level);
            return false;
        }

        const rewardState = state.rewards[level];

        if (!rewardState || !rewardState.unlocked) {
            console.warn("Season reward is locked:", level);
            return false;
        }

        const isCardReward =
            reward.type === "card" ||
            reward.type === "exclusive-card";

        /*
         * Allow recovery if a reward was marked claimed
         * but its card was never saved.
         */
        if (rewardState.claimed) {

            if (!isCardReward) {
                console.warn("Season reward already claimed:", level);
                return false;
            }

            let existingCards = {};

            try {
                existingCards = JSON.parse(
                    localStorage.getItem("ownedCards") || "{}"
                );

                if (
                    !existingCards ||
                    typeof existingCards !== "object" ||
                    Array.isArray(existingCards)
                ) {
                    existingCards = {};
                }
            } catch (error) {
                console.error("Could not read owned cards:", error);
                return false;
            }

            if (
                Object.prototype.hasOwnProperty.call(
                    existingCards,
                    reward.id
                )
            ) {
                console.log("Season card is already saved:", reward.id);
                return true;
            }

            console.log(
                "Recovering missing Season card:",
                reward.id
            );
        }

        /*
         * Improvement Points
         */
        if (reward.type === "improvement-points") {

            const amount = Number(reward.amount) || 0;

            if (amount <= 0) {
                console.error("Invalid Improvement Point reward:", amount);
                return false;
            }

            if (typeof window.addImprovementPoints !== "function") {
                console.error("Improvement Point system unavailable.");
                return false;
            }

            window.addImprovementPoints(amount);

            if (typeof window.playAppTone === "function") {
                window.playAppTone("achievement");
            }

            console.log(`🎁 +${amount} Improvement Points`);
        }

        /*
         * Season Card
         */
        else if (isCardReward) {

            if (!Array.isArray(window.cardCatalog)) {
                console.error("Card catalog is unavailable.");
                return false;
            }

            const card = window.StandOutCore?.cardCatalogue?.getById(reward.id)
                || window.cardCatalog.find(item => item.id === reward.id);

            if (!card) {
                console.error("Season card not found:", reward.id);
                return false;
            }

            let latestOwnedCards = {};

            try {
                latestOwnedCards = JSON.parse(
                    localStorage.getItem("ownedCards") || "{}"
                );

                if (
                    !latestOwnedCards ||
                    typeof latestOwnedCards !== "object" ||
                    Array.isArray(latestOwnedCards)
                ) {
                    latestOwnedCards = {};
                }
            } catch (error) {
                console.error("Failed to load owned cards:", error);
                return false;
            }

            const alreadyOwned =
                Object.prototype.hasOwnProperty.call(
                    latestOwnedCards,
                    reward.id
                );

            /*
             * Add card only when it is missing.
             */
            if (!alreadyOwned) {

                latestOwnedCards[reward.id] = {
                    mintedAt:
                        typeof getISTDate === "function"
                            ? getISTDate().toISOString().slice(0, 10)
                            : new Date().toISOString().slice(0, 10),

                    source: "season",
                    seasonId: SEASON.id,
                    seasonLevel: level
                };

                try {
                    localStorage.setItem(
                        "ownedCards",
                        JSON.stringify(latestOwnedCards)
                    );
                } catch (error) {
                    console.error("Failed to save Season card:", error);
                    return false;
                }

                console.log("Season card saved:", reward.id);

            }

            /*
             * Synchronize in-memory collection.
             */
            if (typeof ownedCards !== "undefined") {
                ownedCards = latestOwnedCards;
            }

            window.ownedCards = latestOwnedCards;

            /*
             * Refresh card interfaces.
             */
            if (typeof renderMarketplace === "function") {
                renderMarketplace();
            }

            if (typeof renderMyCards === "function") {
                renderMyCards();
            }

            /*
             * Mint animation only for a newly saved card.
             */
            if (!alreadyOwned) {
                if (typeof window.showMintedCard === "function") {
                    window.showMintedCard(card);
                } else {
                    console.warn("Season card mint animation unavailable.");
                }
            }
        }

        /*
         * Badge Reward
         */
        else if (reward.type === "badge") {

            let earnedBadges = [];

            try {
                earnedBadges = JSON.parse(
                    localStorage.getItem("earnedBadges") || "[]"
                );

                if (!Array.isArray(earnedBadges)) {
                    earnedBadges = [];
                }
            } catch (error) {
                console.error("Could not load earned badges:", error);
                return false;
            }

            const alreadyOwned = earnedBadges.some(
                badge => badge.id === reward.id
            );

            if (!alreadyOwned) {

                earnedBadges.push({
                    id: reward.id,
                    title: reward.title,
                    artwork: "",
                    month: SEASON.name,
                    earnedAt: new Date().toISOString(),
                    source: "season",
                    seasonId: SEASON.id,
                    seasonLevel: level
                });

                localStorage.setItem(
                    "earnedBadges",
                    JSON.stringify(earnedBadges)
                );
            }

            if (typeof renderBadges === "function") {
                renderBadges();
            }
        }

        /*
         * Achievement Reward
         */
        else if (reward.type === "achievement") {

            if (typeof window.unlockAchievement !== "function") {
                console.error("Achievement system unavailable:", reward.id);
                return false;
            }

            window.unlockAchievement(reward.id);
        }

        /*
         * Mark reward claimed and save Season progress.
         */
        rewardState.claimed = true;
        rewardState.claimedAt =
            rewardState.claimedAt || new Date().toISOString();

        saveState(state);

        renderSeason();

        console.log(
            `🎁 Season Reward Claimed: Level ${level}`,
            reward.title
        );

        if (typeof window.showSmartNotification === "function") {
            window.showSmartNotification(
                "🎁 Reward Claimed",
                reward.title
            );
        }

        return true;
    }



    /* =====================================================
       SEASON PROGRESS
    ===================================================== */

    function getProgress() {
        const state = loadState();
        return calculateSeasonProgress(state, SEASON);
    }

    /* =====================================================
       SEASON TIME
    ===================================================== */

    function getTimeRemaining() {

        const now =
            new Date();

        const end =
            new Date(
                SEASON.end
            );

        const difference =
            end.getTime() -
            now.getTime();

        if (
            difference <= 0
        ) {

            return {

                expired: true,

                days: 0,

                hours: 0,

                minutes: 0,

                seconds: 0

            };

        }


        const days =
            Math.floor(
                difference /
                86400000
            );

        const hours =
            Math.floor(
                (
                    difference %
                    86400000
                ) /
                3600000
            );

        const minutes =
            Math.floor(
                (
                    difference %
                    3600000
                ) /
                60000
            );

        const seconds =
            Math.floor(
                (
                    difference %
                    60000
                ) /
                1000
            );


        return {

            expired: false,

            days,

            hours,

            minutes,

            seconds

        };

    }

    /* =====================================================
   SEASON START CHECK
===================================================== */

    function hasSeasonStarted() {

        const now = new Date();
        const start = new Date(SEASON.start);

        return now.getTime() >= start.getTime();
    }


    /* =====================================================
       SEASON EXPIRY
    ===================================================== */

    function checkSeasonExpiry() {

        const state =
            loadState();

        if (
            state.completed
        ) {

            return state;

        }


        const remaining =
            getTimeRemaining();


        if (
            remaining.expired
        ) {

            state.completed = true;

            state.endedAt =
                new Date().toISOString();

            saveState(state);


            console.log(
                "🏆 Season Complete"
            );

        }


        return state;

    }


    /* =====================================================
       RENDER SEASON
    ===================================================== */

    function renderSeason() {
        const started = hasSeasonStarted();
        const state = checkSeasonExpiry();
        const progress = getProgress();

        renderSeasonUI({
            state,
            progress,
            season: SEASON,
            started
        });
    }

    /* =====================================================
       COUNTDOWN
    ===================================================== */

    /* =====================================================
   SEASON COUNTDOWN
===================================================== */


    /* =====================================================
   SEASON REWARD BUTTONS
===================================================== */

    document.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-season-claim]"
                );

            if (!button) {
                return;
            }


            const level =
                Number(
                    button.dataset.seasonClaim
                );


            const success =
                claimReward(level);


            if (!success) {
                return;
            }


            button.textContent =
                "CLAIMED";

            button.disabled = true;


            /*
             * Refresh reward state.
             */

            renderSeason();

        }
    );

    /* =====================================================
       INITIALIZE
    ===================================================== */

    function initializeSeason() {

        const state =
            loadState();


        /*
         * Ensure level is synchronized
         * with stored XP.
         */

        state.level =
            calculateLevel(
                state.xp
            );


        saveState(state);

        renderSeason();


        console.log(
            "🏆 Season system initialized:",
            SEASON.name
        );

    }

    /* =====================================================
   TEST / SEASON RESET
   Resets ONLY Season 01 state.
===================================================== */

    function resetSeason() {

        const freshState = resetSeasonState({ season: SEASON });

        renderSeason();

        console.log(
            "🔄 Season state reset successfully."
        );

        return freshState;
    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.StandOutSeason = {

        addXP,

        getState,

        getReward,

        getRewardState,

        claimReward,

        getProgress,

        getTimeRemaining,

        renderSeason,
        resetSeason,

        checkSeasonExpiry,

        calculateLevel,

        SEASON

    };


    /* =====================================================
       START
    ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeSeason
        );

    } else {

        initializeSeason();

    }


    /*
     * Keep countdown fresh.
     */

    setInterval(
        () => updateSeasonCountdown(SEASON),
        1000
    );


})();

// Preserve the original startup order: Season initializes before Monthly Resolution.
initializeMonthlyResolution();
