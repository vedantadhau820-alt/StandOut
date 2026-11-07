import { normalizeMomentumState, normalizeMomentumHistory } from "./normalization.js";

/* =========================================================
   MOMENTUM SYSTEM
   Standalone system for Standout

   IMPORTANT:
   - Does NOT require HTML changes
   - Does NOT modify app.js directly
   - Core stays in Missions header
   - Expanded panel sits below header
========================================================= */

export const momentum = (() => {

    "use strict";


    /* =========================================================
       CONFIG
    ========================================================= */

    const STORAGE_KEY =
        "standout_momentum_state";

    const MOMENTUM_HISTORY_KEY =
        "standout_momentum_history";


    const LEVELS = [

        {
            min: 0,
            name: "Ember",
            icon: "ember"
        },

        {
            min: 3,
            name: "Flame",
            icon: "flame"
        },

        {
            min: 7,
            name: "Burning",
            icon: "burning"
        },

        {
            min: 14,
            name: "Beacon",
            icon: "beacon"
        },

        {
            min: 30,
            name: "Guardian",
            icon: "guardian"
        },

        {
            min: 60,
            name: "Radiant",
            icon: "radiant"
        },

        {
            min: 100,
            name: "Eternal",
            icon: "eternal"
        }

    ];


    const DEFAULT_STATE = {

        version: 1,

        momentum: 0,

        energy: 100,

        bestMomentum: 0,

        shields: 0,

        lastProofDate: null,

        lastCheckDate: null,

        totalProofDays: 0

    };


    let state =
        loadState();


    /*
     * Developer test date.
     *
     * null = real date
     * string = simulated date
     */
    let momentumTestDate = null;


    let isOpen = false;


    /* =========================================================
       STORAGE
    ========================================================= */

    function loadState() {

        try {

            const raw =
                localStorage.getItem(
                    STORAGE_KEY
                );


            if (!raw) {

                return {
                    ...DEFAULT_STATE
                };

            }


            const saved =
                JSON.parse(raw);


            return {
                ...DEFAULT_STATE,
                ...normalizeMomentumState(saved)
            };

        }

        catch (error) {

            console.error(
                "Momentum load error:",
                error
            );


            return {
                ...DEFAULT_STATE
            };

        }

    }

    /* =========================================================
   MOMENTUM HISTORY
========================================================= */

    function loadMomentumHistory() {

        try {

            const raw =
                localStorage.getItem(
                    MOMENTUM_HISTORY_KEY
                );

            if (!raw) {
                return {};
            }

            const saved =
                JSON.parse(raw);

            return normalizeMomentumHistory(saved);

        }

        catch (error) {

            console.error(
                "Momentum history load error:",
                error
            );

            return {};

        }

    }


    let momentumHistory =
        loadMomentumHistory();


    function saveMomentumHistory() {

        try {

            localStorage.setItem(
                MOMENTUM_HISTORY_KEY,
                JSON.stringify(
                    momentumHistory
                )
            );

        }

        catch (error) {

            console.error(
                "Momentum history save error:",
                error
            );

        }

    }

    function reloadFromStorage() {

        state = loadState();

        momentumHistory =
            loadMomentumHistory();

        render();

    }


    function recordMomentumHistory() {

        const date =
            today();

        momentumHistory[date] = {

            momentum:
                state.momentum,

            energy:
                state.energy

        };

        saveMomentumHistory();

    }

    function saveState() {

        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(state)
            );

        }

        catch (error) {

            console.error(
                "Momentum save error:",
                error
            );

        }

    }


    /* =========================================================
       DATE
    ========================================================= */

    function today() {

        /*
         * Developer testing date.
         */

        if (
            momentumTestDate
        ) {

            return momentumTestDate;

        }


        /*
         * Use application's date
         * function when available.
         */

        try {

            if (
                typeof window.getTodayKey ===
                "function"
            ) {

                return window.getTodayKey();

            }

        }

        catch (_) { }


        /*
         * Fallback to IST.
         */

        return new Intl.DateTimeFormat(

            "en-CA",

            {

                timeZone:
                    "Asia/Kolkata",

                year:
                    "numeric",

                month:
                    "2-digit",

                day:
                    "2-digit"

            }

        ).format(
            new Date()
        );

    }


    function daysBetween(
        first,
        second
    ) {

        if (
            !first ||
            !second
        ) {

            return 0;

        }


        const a =
            new Date(
                `${first}T00:00:00`
            );


        const b =
            new Date(
                `${second}T00:00:00`
            );


        return Math.round(
            (b - a) /
            86400000
        );

    }


    /* =========================================================
       LEVEL
    ========================================================= */

    function getLevel() {

        let result =
            LEVELS[0];


        LEVELS.forEach(
            level => {

                if (
                    state.momentum >=
                    level.min
                ) {

                    result =
                        level;

                }

            }
        );


        return result;

    }


    function getNextLevel() {

        return (

            LEVELS.find(
                level =>
                    level.min >
                    state.momentum
            )

            ||

            null

        );

    }


    /* =========================================================
       ENERGY
    ========================================================= */

    function energyClass() {

        if (
            state.energy >= 80
        ) {

            return "strong";

        }


        if (
            state.energy >= 55
        ) {

            return "healthy";

        }


        if (
            state.energy >= 30
        ) {

            return "risk";

        }


        return "critical";

    }


    /* =========================================================
       TODAY'S PROOF
    ========================================================= */

    function proofComplete() {

        return (

            state.lastProofDate ===
            today()

        );

    }


    /* =========================================================
       CREATE MISSION HEADER
    ========================================================= */

    function createMissionHeader() {

        const missions =
            document.getElementById(
                "missions"
            );


        if (!missions) {

            return null;

        }


        let header =
            document.getElementById(
                "momentumMissionHeader"
            );


        if (header) {

            return header;

        }


        const title =
            missions.querySelector(
                "h2"
            );


        const points =
            missions.querySelector(
                "p"
            );


        const missionList =
            document.getElementById(
                "mission-list"
            );


        if (
            !title ||
            !points
        ) {

            return null;

        }


        header =
            document.createElement(
                "div"
            );


        header.id =
            "momentumMissionHeader";


        const titleGroup =
            document.createElement(
                "div"
            );


        titleGroup.className =
            "momentum-title-group";


        titleGroup.appendChild(
            title
        );


        titleGroup.appendChild(
            points
        );


        const coreSlot =
            document.createElement(
                "div"
            );


        coreSlot.id =
            "momentumCoreSlot";


        coreSlot.className =
            "momentum-core-slot";


        header.appendChild(
            titleGroup
        );


        header.appendChild(
            coreSlot
        );


        if (missionList) {

            missions.insertBefore(
                header,
                missionList
            );

        }

        else {

            missions.appendChild(
                header
            );

        }


        /*
         * Panel slot.
         */

        const panelSlot =
            document.createElement(
                "div"
            );


        panelSlot.id =
            "momentumPanelSlot";


        panelSlot.className =
            "momentum-panel-slot";


        if (missionList) {

            missions.insertBefore(
                panelSlot,
                missionList
            );

        }

        else {

            missions.appendChild(
                panelSlot
            );

        }


        return header;

    }


    /* =========================================================
       CREATE CORE
    ========================================================= */

    function createCore() {

        const slot =
            document.getElementById(
                "momentumCoreSlot"
            );


        if (!slot) {

            return null;

        }


        let core =
            document.getElementById(
                "momentumCore"
            );


        if (core) {

            return core;

        }


        core =
            document.createElement(
                "button"
            );


        core.type =
            "button";


        core.id =
            "momentumCore";


        core.className =
            "momentum-core-button";


        core.addEventListener(
            "click",
            event => {

                event.preventDefault();

                event.stopPropagation();

                togglePanel();

            }
        );


        slot.appendChild(
            core
        );


        return core;

    }


    /* =========================================================
       CREATE PANEL
    ========================================================= */

    function createPanel() {

        const slot =
            document.getElementById(
                "momentumPanelSlot"
            );


        if (!slot) {

            return null;

        }


        let panel =
            document.getElementById(
                "momentumPanel"
            );


        if (panel) {

            return panel;

        }


        panel =
            document.createElement(
                "div"
            );


        panel.id =
            "momentumPanel";


        panel.className =
            "momentum-panel";


        slot.appendChild(
            panel
        );


        return panel;

    }


    /* =========================================================
       TOGGLE
    ========================================================= */

    function togglePanel() {

        isOpen =
            !isOpen;


        const core =
            document.getElementById(
                "momentumCore"
            );


        const panel =
            document.getElementById(
                "momentumPanel"
            );


        const slot =
            document.getElementById(
                "momentumPanelSlot"
            );


        if (
            !core ||
            !panel ||
            !slot
        ) {

            return;

        }


        if (isOpen) {

            core.classList.add(
                "open"
            );


            panel.classList.add(
                "open"
            );


            slot.classList.add(
                "open"
            );

        }

        else {

            core.classList.remove(
                "open"
            );


            panel.classList.remove(
                "open"
            );


            slot.classList.remove(
                "open"
            );

        }

    }


    /* =========================================================
       SAFE DOM RENDER HELPERS
    ========================================================= */

    function createMomentumNode(tagName, className = "", text = null) {
        const node = document.createElement(tagName);
        if (className) node.className = className;
        if (text !== null) node.textContent = String(text);
        return node;
    }

    function createMomentumLight(level, stateClass, energy) {
        const light = createMomentumNode(
            "span",
            `last-light last-light-${level.icon} ${stateClass} ${energy}`
        );
        light.setAttribute("aria-hidden", "true");

        light.append(
            createMomentumNode("span", "light-aura"),
            createMomentumNode("span", "light-orbit orbit-one"),
            createMomentumNode("span", "light-orbit orbit-two"),
            createMomentumNode("span", "light-orbit orbit-three")
        );

        const flame = createMomentumNode("span", "light-flame");
        flame.append(
            createMomentumNode("span", "flame-outer"),
            createMomentumNode("span", "flame-inner"),
            createMomentumNode("span", "flame-core")
        );
        light.append(flame);
        return light;
    }


    /* =========================================================
       RENDER CORE
    ========================================================= */

    function renderCore() {
        const core = document.getElementById("momentumCore");
        if (!core) return;

        const level = getLevel();
        const energy = energyClass();
        const missedToday = state.lastProofDate !== today();
        const coreState = state.energy <= 0
            ? "extinguished"
            : missedToday && state.lastProofDate
                ? "fading"
                : "alive";

        const light = createMomentumLight(level, coreState, energy);
        const text = createMomentumNode("span", "momentum-core-text");
        text.append(
            createMomentumNode("strong", "", state.momentum),
            createMomentumNode("small", "", level.name)
        );

        core.replaceChildren(light, text);
    }


    /* =========================================================
       RENDER PANEL
    ========================================================= */

    function renderPanel() {
        const panel = document.getElementById("momentumPanel");
        if (!panel) return;

        const level = getLevel();
        const next = getNextLevel();
        const proof = proofComplete();
        const energy = energyClass();

        let progress = 100;
        if (next) {
            const range = next.min - level.min;
            const current = state.momentum - level.min;
            progress = Math.min(100, Math.max(0, (current / range) * 100));
        }

        const fragment = document.createDocumentFragment();

        const header = createMomentumNode("div", "momentum-panel-header");
        const headingGroup = createMomentumNode("div");
        headingGroup.append(
            createMomentumNode("span", "momentum-panel-label", "MOMENTUM"),
            createMomentumNode("h3", "", level.name)
        );
        header.append(headingGroup);
        fragment.append(header);

        const bigCore = createMomentumNode("div", `momentum-big-core ${energy}`);
        bigCore.append(createMomentumLight(level, "", energy));
        fragment.append(bigCore);

        const days = createMomentumNode("div", "momentum-days");
        days.append(
            createMomentumNode("strong", "", state.momentum),
            createMomentumNode("span", "", "DAYS")
        );
        fragment.append(days);

        const energyRow = createMomentumNode("div", "momentum-energy-row");
        energyRow.append(
            createMomentumNode("span", "", "Core Energy"),
            createMomentumNode("strong", "", `${state.energy}%`)
        );
        fragment.append(energyRow);

        const energyBar = createMomentumNode("div", "momentum-energy-bar");
        const energyFill = createMomentumNode("div", `momentum-energy-fill ${energy}`);
        energyFill.style.width = `${Math.min(100, Math.max(0, Number(state.energy) || 0))}%`;
        energyBar.append(energyFill);
        fragment.append(energyBar);

        const todayRow = createMomentumNode("div", "momentum-today");
        const todayCopy = createMomentumNode("div");
        todayCopy.append(
            createMomentumNode("strong", "", "Today's Proof"),
            createMomentumNode("span", "", "Complete a successful Mission to strengthen your Momentum.")
        );
        const proofStatus = proof
            ? createMomentumNode("b", "momentum-proof-complete", "✓ COMPLETE")
            : createMomentumNode("b", "momentum-proof-waiting", "○ WAITING");
        todayRow.append(todayCopy, proofStatus);
        fragment.append(todayRow);

        const nextSection = createMomentumNode("div", "momentum-next");
        const nextTop = createMomentumNode("div", "momentum-next-top");
        if (next) {
            nextTop.append(
                createMomentumNode("span", "", "NEXT EVOLUTION"),
                createMomentumNode("strong", "", next.name)
            );
            const progressTrack = createMomentumNode("div", "momentum-progress");
            const progressFill = createMomentumNode("div");
            progressFill.style.width = `${progress}%`;
            progressTrack.append(progressFill);
            nextSection.append(
                nextTop,
                progressTrack,
                createMomentumNode("small", "", `${next.min - state.momentum} days remaining`)
            );
        } else {
            nextTop.append(
                createMomentumNode("span", "", "EVOLUTION"),
                createMomentumNode("strong", "", "Maximum reached")
            );
            nextSection.append(nextTop);
        }
        fragment.append(nextSection);

        const stats = createMomentumNode("div", "momentum-stats");
        stats.append(
            createMomentumNode("span", "", `🛡 ${state.shields} shield${state.shields === 1 ? "" : "s"}`),
            createMomentumNode("span", "", `Best: ${state.bestMomentum}`),
            createMomentumNode("span", "", `${state.totalProofDays} proof days`)
        );

        const buyShieldButton = createMomentumNode("button", "buy-shield-points-btn", "BUY SHIELD POINTS · 10 IP");
        buyShieldButton.type = "button";
        buyShieldButton.addEventListener("click", () => {
            if (typeof window.buyShieldPoints === "function") {
                window.buyShieldPoints();
            } else {
                window.customAlert?.("Shield Shop is still loading. Please try again.");
            }
        });
        stats.append(buyShieldButton);
        fragment.append(stats);

        panel.replaceChildren(fragment);
    }


    /* =========================================================
       RENDER EVERYTHING
    ========================================================= */

    function render() {

        renderCore();

        renderPanel();

    }


    /* =========================================================
       REGISTER PROOF
    ========================================================= */

    function registerProof() {

        const currentDay =
            today();


        /*
         * Already proved today.
         */

        if (
            state.lastProofDate ===
            currentDay
        ) {

            return false;

        }


        const oldMomentum =
            state.momentum;


        /*
         * Increase Momentum.
         */

        state.momentum += 1;


        /*
         * Successful Mission restores
         * Core Energy.
         */

        state.energy =
            Math.min(
                100,
                state.energy + 18
            );


        state.bestMomentum =
            Math.max(
                state.bestMomentum,
                state.momentum
            );


        state.lastProofDate =
            currentDay;


        state.lastCheckDate =
            currentDay;


        state.totalProofDays += 1;

        recordMomentumHistory();


        /*
         * Milestone shields.
         */

        const milestones = [
            7,
            14,
            30,
            60,
            100
        ];


        if (
            milestones.includes(
                state.momentum
            ) &&

            state.momentum >
            oldMomentum
        ) {

            state.shields += 1;


            showToast(
                "Momentum Shield earned",
                `${state.momentum} day milestone reached.`
            );

        }

        else {

            showToast(
                "Momentum +1",
                "Today's proof is complete."
            );

        }


        saveState();

        render();


        return true;

    }


    /* =========================================================
       MISSED DAYS
    ========================================================= */

    function checkMissedDays() {

        const currentDay =
            today();

        /*
 * No Momentum streak has ever started.
 * There is nothing to penalize yet.
 */
        if (!state.lastProofDate) {

            state.lastCheckDate = currentDay;

            saveState();

            return;
        }


        /*
         * First initialization.
         */

        if (
            !state.lastCheckDate
        ) {

            state.lastCheckDate =
                currentDay;

            saveState();

            return;

        }


        const difference =
            daysBetween(
                state.lastCheckDate,
                currentDay
            );


        /*
         * Same day.
         */

        if (
            difference <= 0
        ) {

            return;

        }


        /*
         * If yesterday was completed
         * and only one day passed,
         * there was no missed day.
         */

        if (
            state.lastProofDate ===
            state.lastCheckDate &&

            difference === 1
        ) {

            state.lastCheckDate =
                currentDay;


            saveState();

            return;

        }


        /*
         * Missed days.
         */

        const missed =
            Math.max(
                1,
                difference
            );


        /*
         * Shield protects the Momentum.
         */

        if (
            state.shields > 0
        ) {

            state.shields -= 1;


            state.energy =
                Math.max(
                    0,
                    state.energy - 5
                );


            showToast(
                "Momentum Shield used",
                "Your Momentum survived."
            );

        }

        else {

            /*
             * Energy damage.
             *
             * 1 missed day = -20
             * 2 missed days = -35 max
             * 3+ missed days = -35 max
             */

            state.energy =
                Math.max(

                    0,

                    state.energy -
                    Math.min(
                        35,
                        missed * 20
                    )

                );


            /*
             * Momentum only weakens
             * after Core Energy dies.
             */

            if (
                state.energy <= 0 &&

                state.momentum > 0
            ) {

                state.momentum =
                    Math.max(

                        0,

                        state.momentum -
                        Math.min(
                            3,
                            missed
                        )

                    );


                showToast(
                    "Momentum weakened",
                    "Your Core needs attention."
                );

            }

            else {

                showToast(
                    "Momentum at risk",
                    "Complete a Mission today."
                );

            }

        }


        state.lastCheckDate =
            currentDay;

        recordMomentumHistory();

        saveState();

        render();

    }


    /* =========================================================
       MISSION COMPLETION DETECTOR
    ========================================================= */

    function hookMissionCompletion() {

        /*
         * Prevent duplicate listeners.
         */

        if (
            window.__momentumMissionListener
        ) {

            return;

        }


        window.__momentumMissionListener =
            true;


        document.addEventListener(

            "click",

            event => {

                const button =
                    event.target.closest(
                        "#mission-list .complete-btn"
                    );


                if (!button) {

                    return;

                }


                /*
                 * Read Improvement Points
                 * before app.js processes
                 * the Mission.
                 */

                const before =
                    Number(
                        localStorage.getItem(
                            "dailyImprovementCount"
                        )
                    ) || 0;


                /*
                 * Give app.js time to complete
                 * the Mission.
                 */

                setTimeout(

                    () => {

                        const after =
                            Number(
                                localStorage.getItem(
                                    "dailyImprovementCount"
                                )
                            ) || 0;


                        /*
                         * Reward only if the
                         * Improvement Point count
                         * genuinely increased.
                         */

                        if (
                            after > before
                        ) {

                            console.log(
                                "🔥 Momentum: Mission completed."
                            );


                            registerProof();

                        }

                    },

                    150

                );

            },

            true

        );


        console.log(
            "✓ Momentum Mission detector installed."
        );

    }


    /* =========================================================
       RESET HOOK
    ========================================================= */

    function hookReset() {

        const original =
            window.resetData;


        if (
            typeof original !==
            "function"
        ) {

            return;

        }


        if (
            original.__momentumWrapped
        ) {

            return;

        }


        const wrapped =
            async function (...args) {

                const result =
                    await original.apply(
                        this,
                        args
                    );


                state = {
                    ...DEFAULT_STATE
                };


                isOpen =
                    false;


                momentumTestDate =
                    null;


                saveState();

                render();


                return result;

            };


        wrapped.__momentumWrapped =
            true;


        window.resetData =
            wrapped;

    }


    /* =========================================================
       TOAST
    ========================================================= */

    function showToast(
        title,
        message
    ) {

        let toast =
            document.getElementById(
                "momentumToast"
            );


        if (!toast) {

            toast =
                document.createElement(
                    "div"
                );


            toast.id =
                "momentumToast";


            document.body.appendChild(
                toast
            );

        }


        const titleNode = document.createElement("strong");
        titleNode.textContent = String(title ?? "");

        const messageNode = document.createElement("span");
        messageNode.textContent = String(message ?? "");

        toast.replaceChildren(titleNode, messageNode);


        toast.classList.add(
            "show"
        );


        clearTimeout(
            toast._timer
        );


        toast._timer =
            setTimeout(

                () => {

                    toast.classList.remove(
                        "show"
                    );

                },

                2800

            );

    }


    function escapeHTML(
        value
    ) {

        return String(value)

            .replaceAll(
                "&",
                "&amp;"
            )

            .replaceAll(
                "<",
                "&lt;"
            )

            .replaceAll(
                ">",
                "&gt;"
            )

            .replaceAll(
                '"',
                "&quot;"
            )

            .replaceAll(
                "'",
                "&#039;"
            );

    }


    /* =========================================================
       INITIALIZATION
    ========================================================= */

    function init() {

        const missions =
            document.getElementById(
                "missions"
            );


        if (!missions) {

            console.warn(
                "Momentum: Missions section not found."
            );

            return;

        }


        createMissionHeader();

        createCore();

        createPanel();


        /*
         * Process real missed days.
         */

        checkMissedDays();


        render();


        hookMissionCompletion();

        hookReset();


        /*
         * Recheck when returning
         * to the app.
         */

        document.addEventListener(

            "visibilitychange",

            () => {

                if (
                    !document.hidden
                ) {

                    checkMissedDays();

                    render();

                }

            }

        );


        window.addEventListener(

            "focus",

            () => {

                checkMissedDays();

                render();

            }

        );


        /*
         * Retry Mission hook.
         */

        setTimeout(
            hookMissionCompletion,
            500
        );


        setTimeout(
            hookMissionCompletion,
            1500
        );


        console.log(
            "✓ Momentum system ready."
        );

    }


    /* =========================================================
       PUBLIC API
    ========================================================= */

    window.Momentum = {

        getState:
            () => ({
                ...state
            }),

        getHistory:
            () => ({
                ...momentumHistory
            }),

        reload:
            reloadFromStorage,


        getLevel:
            () =>
                getLevel(),


        registerProof:
            registerProof,

        addShieldPoints(amount = 1) {
            const value = Math.max(0, Math.floor(Number(amount) || 0));
            if (!value) return state.shields;
            state.shields = Math.max(0, Number(state.shields) || 0) + value;
            saveState();
            render();
            return state.shields;
        },

        render:
            render,


        reset:
            () => {

                state = {
                    ...DEFAULT_STATE
                };


                isOpen =
                    false;


                momentumTestDate =
                    null;


                saveState();

                render();

            },


        /* =====================================================
           DEVELOPER TESTING
        ===================================================== */

        testSet(days = 0) {

            days =
                Math.max(
                    0,
                    Math.floor(
                        Number(days) || 0
                    )
                );


            state.momentum =
                days;


            state.energy =
                100;


            state.bestMomentum =
                Math.max(
                    state.bestMomentum,
                    days
                );


            /*
             * Mark current simulated day
             * as completed so visual testing
             * starts with an alive Core.
             */

            state.lastProofDate =
                today();


            state.lastCheckDate =
                today();


            saveState();

            render();


            console.log(
                `🔥 Momentum Test → ${days} days`
            );


            console.table({

                momentum:
                    state.momentum,

                energy:
                    state.energy,

                level:
                    getLevel().name,

                lastProofDate:
                    state.lastProofDate,

                lastCheckDate:
                    state.lastCheckDate

            });

        },


        testMissDays(days = 1) {

            days =
                Math.floor(
                    Number(days)
                );


            if (
                !Number.isInteger(days) ||
                days < 1
            ) {

                console.error(
                    "Use MomentumTest.missDays(1)"
                );

                return;

            }


            /*
             * Start from the last date
             * Momentum checked.
             */

            let startDate;


            if (
                state.lastCheckDate
            ) {

                startDate =
                    new Date(
                        state.lastCheckDate +
                        "T12:00:00"
                    );

            }

            else {

                startDate =
                    new Date();

            }


            /*
             * Move forward by the number
             * of missed days.
             */

            startDate.setDate(
                startDate.getDate() +
                days
            );


            momentumTestDate =
                startDate
                    .toISOString()
                    .slice(0, 10);


            /*
             * Run the SAME engine that
             * real calendar changes use.
             */

            checkMissedDays();


            render();


            console.log(
                `🔥 Momentum Test → ${days} missed day(s)`
            );


            console.table({

                missedDays:
                    days,

                momentum:
                    state.momentum,

                energy:
                    state.energy,

                level:
                    getLevel().name,

                lastProofDate:
                    state.lastProofDate,

                lastCheckDate:
                    state.lastCheckDate,

                shields:
                    state.shields

            });

        },


        testResetDate() {

            momentumTestDate =
                null;


            console.log(
                "🔥 Momentum Test → real date restored."
            );


            render();

        },


        testStatus() {

            console.table({

                momentum:
                    state.momentum,

                energy:
                    state.energy,

                level:
                    getLevel().name,

                lastProofDate:
                    state.lastProofDate,

                lastCheckDate:
                    state.lastCheckDate,

                shields:
                    state.shields,

                totalProofDays:
                    state.totalProofDays,

                simulatedDate:
                    momentumTestDate ||
                    "REAL DATE"

            });

        }

    };


    /* =========================================================
       MOMENTUM TEST SHORTCUTS
    ========================================================= */

    window.MomentumTest = {

        /*
         * Visual stages.
         */

        set(days = 0) {

            window.Momentum.testSet(
                days
            );

        },


        spark() {

            window.Momentum.testSet(
                0
            );

        },


        flame() {

            window.Momentum.testSet(
                3
            );

        },


        burning() {

            window.Momentum.testSet(
                7
            );

        },


        beacon() {

            window.Momentum.testSet(
                14
            );

        },


        guardian() {

            window.Momentum.testSet(
                30
            );

        },


        radiant() {

            window.Momentum.testSet(
                60
            );

        },


        eternal() {

            window.Momentum.testSet(
                100
            );

        },


        /*
         * Missed days.
         */

        missDays(days = 1) {

            window.Momentum.testMissDays(
                days
            );

        },


        oneDay() {

            window.Momentum.testMissDays(
                1
            );

        },


        twoDays() {

            window.Momentum.testMissDays(
                2
            );

        },


        threeDays() {

            window.Momentum.testMissDays(
                3
            );

        },


        /*
         * Utilities.
         */

        status() {

            window.Momentum.testStatus();

        },


        reset() {

            window.Momentum.reset();

        },


        resetDate() {

            window.Momentum.testResetDate();

        }

    };


    /* =========================================================
       START
    ========================================================= */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init
        );

    }

    else {

        init();

    }

    // Export the same public object exposed to legacy scripts. The public
    // methods and developer test helpers retain their existing signatures.
    return window.Momentum;

})();
