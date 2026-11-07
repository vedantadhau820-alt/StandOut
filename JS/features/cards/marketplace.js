import { cardCatalogue } from "./catalogue.js";
import { points } from "../economy/points.js";

/**
 * Cards marketplace and collection feature.
 * Marketplace view state is owned here and exposed through window accessors
 * for navigation, account, and existing classic-script integrations.
 */

let currentMarketplaceFilter = "ALL";
let isMarketplaceOpen = false;
let ownedCardsState = {};
let lastSpecialCardCheckDate = null;

try {
    const storedOwnedCards = localStorage.getItem("ownedCards");
    if (storedOwnedCards) {
        const parsedOwnedCards = JSON.parse(storedOwnedCards);
        if (parsedOwnedCards && typeof parsedOwnedCards === "object" && !Array.isArray(parsedOwnedCards)) {
            ownedCardsState = parsedOwnedCards;
        }
    }
} catch (error) {
    console.error("Failed to load ownedCards:", error);
}

Object.defineProperties(window, {
    currentMarketplaceFilter: {
        configurable: true,
        enumerable: true,
        get: () => currentMarketplaceFilter,
        set: value => { currentMarketplaceFilter = value || "ALL"; }
    },
    isMarketplaceOpen: {
        configurable: true,
        enumerable: true,
        get: () => isMarketplaceOpen,
        set: value => { isMarketplaceOpen = Boolean(value); }
    },
    ownedCards: {
        configurable: true,
        enumerable: true,
        get: () => ownedCardsState,
        set: value => {
            ownedCardsState = value && typeof value === "object" && !Array.isArray(value)
                ? value
                : {};
        }
    }
});

const PINNED_CARDS_STORAGE_KEY = "pinnedCards";
const MAX_PINNED_CARDS = 4;
const PIN_CARD_COST = 2;

const SPECIAL_CARD_STORAGE_KEY = "standout_special_cards";
const SPECIAL_CARD_DEFINITIONS = Object.freeze({
    // season_03_exclusive_card: { type: "improvement", label: "Weekly Improvement", description: "+2 Improvement Points every 7 days", intervalDays: 7 },
    Raje: { type: "discount", label: "Sunday Discount", description: "20% off Marketplace cards every Sunday", intervalDays: 7 },
    // season_03_card: { type: "shield", label: "Universal Protection", description: "+1 Shield Point every 14 days", intervalDays: 14 }
});

function getISTTodayKey() {
    // Explicit test-only override; clear it to return to the real IST date.
    if (typeof window.__standoutSpecialCardTestDate === "string" &&
        parseDateKey(window.__standoutSpecialCardTestDate)) {
        return window.__standoutSpecialCardTestDate;
    }
    return typeof window.getTodayKey === "function"
        ? window.getTodayKey()
        : new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function parseDateKey(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null;
}

function dateKey(date) {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function addDaysToKey(key, days) {
    const date = parseDateKey(key);
    if (!date) return null;
    date.setUTCDate(date.getUTCDate() + days);
    return dateKey(date);
}

function addCalendarMonthsToKey(key, months) {
    const date = parseDateKey(key);
    if (!date) return null;
    const originalDay = date.getUTCDate();
    date.setUTCDate(1);
    date.setUTCMonth(date.getUTCMonth() + months);
    const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
    date.setUTCDate(Math.min(originalDay, lastDay));
    return dateKey(date);
}

function readSpecialCardState() {
    try {
        const value = JSON.parse(localStorage.getItem(SPECIAL_CARD_STORAGE_KEY) || "{}");
        return value && typeof value === "object" && !Array.isArray(value) ? value : {};
    } catch (error) {
        console.error("[Special Cards] Could not read reward ledger:", error);
        return {};
    }
}

function writeSpecialCardState(state) {
    localStorage.setItem(SPECIAL_CARD_STORAGE_KEY, JSON.stringify(state));
}

function getSpecialDefinition(cardOrId) {
    const id = typeof cardOrId === "string" ? cardOrId : cardOrId?.id;
    return SPECIAL_CARD_DEFINITIONS[id] || null;
}

function getSpecialActivation(cardId, owned = window.ownedCards || {}) {
    const data = owned?.[cardId];
    const definition = getSpecialDefinition(cardId);
    const activation = data?.specialActivation;
    if (!definition || !activation?.activatedAt || !activation?.expiresAt) return null;
    const today = getISTTodayKey();
    if (today >= activation.expiresAt) return { ...activation, status: "expired" };
    return { ...activation, status: "active" };
}

function isSpecialDiscountActive() {
    const today = getISTTodayKey();
    const date = parseDateKey(today);
    if (!date || date.getUTCDay() !== 0) return false;

    // Always inspect the latest persisted ownership state, including after reload
    // or activation from another browser tab.
    let owned = window.ownedCards || {};
    try {
        const stored = JSON.parse(localStorage.getItem("ownedCards") || "{}");
        if (stored && typeof stored === "object" && !Array.isArray(stored)) {
            owned = stored;
            window.ownedCards = stored;
        }
    } catch (error) {
        console.warn("[Special Cards] Could not refresh owned cards for discount check:", error);
    }

    const activation = owned.Raje?.specialActivation;
    return Boolean(
        activation?.activatedAt &&
        activation?.expiresAt &&
        today >= activation.activatedAt &&
        today < activation.expiresAt
    );
}

function activateSpecialCard(cardId) {
    const definition = getSpecialDefinition(cardId);
    if (!definition) return;
    const owned = { ...(window.ownedCards || {}) };
    const data = { ...(owned[cardId] || {}) };
    if (!data.mintedAt) {
        window.customAlert?.("This card must be owned before activation.");
        return;
    }
    if (data.specialActivation) {
        window.customAlert?.("This Special Card has already been activated.");
        return;
    }

    const activatedAt = getISTTodayKey();
    data.specialActivation = {
        activatedAt,
        expiresAt: addCalendarMonthsToKey(activatedAt, 3),
        nextRewardDate: definition.intervalDays ? addDaysToKey(activatedAt, definition.intervalDays) : null
    };
    owned[cardId] = data;

    try {
        localStorage.setItem("ownedCards", JSON.stringify(owned));
        window.ownedCards = owned;
    } catch (error) {
        console.error("[Special Cards] Activation could not be saved:", error);
        window.customAlert?.("Could not activate this card. Please try again.");
        return;
    }

    processSpecialCardRewards();
    renderMarketplace(window.currentMarketplaceFilter || "ALL");
    renderMyCards();
    window.customAlert?.(`${definition.label} activated. Powers expire on ${formatDate(data.specialActivation.expiresAt)}.`);
}

function processSpecialCardRewards() {
    const today = getISTTodayKey();
    const owned = { ...(window.ownedCards || {}) };
    const ledger = readSpecialCardState();
    let ownedChanged = false;
    let pointsGranted = 0;
    let shieldsGranted = 0;

    Object.entries(SPECIAL_CARD_DEFINITIONS).forEach(([cardId, definition]) => {
        const data = owned[cardId];
        const activation = data?.specialActivation;
        if (!activation?.activatedAt || !activation?.expiresAt || !definition.intervalDays) return;

        // Catch up every reward earned during the active window, even if the
        // user next opens the app after the card has expired.
        const lastEligibleDate = addDaysToKey(activation.expiresAt, -1);
        const rewardThroughDate = today < lastEligibleDate ? today : lastEligibleDate;
        let nextRewardDate = activation.nextRewardDate || addDaysToKey(activation.activatedAt, definition.intervalDays);
        let guard = 0;
        while (nextRewardDate && nextRewardDate <= rewardThroughDate && nextRewardDate < activation.expiresAt && guard < 20) {
            const claimKey = `${cardId}:${nextRewardDate}`;
            if (!ledger[claimKey]) {
                ledger[claimKey] = { cardId, rewardDate: nextRewardDate, type: definition.type, amount: definition.type === "improvement" ? 2 : 1 };
                if (definition.type === "improvement") pointsGranted += 2;
                if (definition.type === "shield") shieldsGranted += 1;
            }
            nextRewardDate = addDaysToKey(nextRewardDate, definition.intervalDays);
            guard += 1;
        }
        if (activation.nextRewardDate !== nextRewardDate) {
            data.specialActivation = { ...activation, nextRewardDate };
            ownedChanged = true;
        }
    });

    // Persist claims and schedule advancement before applying rewards, preventing
    // repeat grants on reload or when multiple UI surfaces render.
    if (pointsGranted || shieldsGranted || ownedChanged) {
        try {
            writeSpecialCardState(ledger);
            if (ownedChanged) {
                localStorage.setItem("ownedCards", JSON.stringify(owned));
                window.ownedCards = owned;
            }
        } catch (error) {
            console.error("[Special Cards] Could not persist reward claims:", error);
            return;
        }
        if (pointsGranted > 0) points.add(pointsGranted);
        if (shieldsGranted > 0) window.Momentum?.addShieldPoints?.(shieldsGranted);
        if (pointsGranted || shieldsGranted) {
            window.customAlert?.(`Special Card rewards collected: ${pointsGranted ? `${pointsGranted} Improvement Points` : ""}${pointsGranted && shieldsGranted ? " and " : ""}${shieldsGranted ? `${shieldsGranted} Shield Point${shieldsGranted > 1 ? "s" : ""}` : ""}.`);
        }
    }
}

function getDiscountedCardCost(card) {
    const cost = Math.max(0, Number(card?.cost) || 0);
    return isSpecialDiscountActive() ? Math.round(cost * 0.8) : cost;
}


function getPinnedCardIds() {
    try {
        const stored = JSON.parse(localStorage.getItem(PINNED_CARDS_STORAGE_KEY) || "[]");
        return Array.isArray(stored)
            ? [...new Set(stored.filter(id => typeof id === "string" && id.trim()))].slice(0, MAX_PINNED_CARDS)
            : [];
    } catch (error) {
        console.error("[Cards] Could not load pinned cards:", error);
        return [];
    }
}

function togglePinnedCard(cardOrId) {
    const id = String(typeof cardOrId === "object" && cardOrId ? cardOrId.id : cardOrId || "");
    const cardTitle = typeof cardOrId === "object" && cardOrId?.title
        ? String(cardOrId.title)
        : id;
    if (!id || !window.ownedCards?.[id]) return;

    const pinned = getPinnedCardIds();
    if (pinned.includes(id)) {
        try {
            localStorage.setItem(PINNED_CARDS_STORAGE_KEY, JSON.stringify(pinned.filter(item => item !== id)));
        } catch (error) {
            console.error("[Cards] Could not unpin card:", error);
            window.customAlert?.("Could not save this change. Please try again.");
            return;
        }

        // Unpinning is free. Refresh only after the persisted change succeeds.
        try { renderMyCards(); } catch (error) {
            console.error("[Cards] Card was unpinned, but the collection could not refresh:", error);
        }
        return;
    }

    if (pinned.length >= MAX_PINNED_CARDS) {
        window.customAlert?.("You can pin up to 4 cards. Unpin a card before pinning another.");
        return;
    }

    if (!points.spend(PIN_CARD_COST)) {
        window.customAlert?.("Not enough Improvement Points to pin this card.");
        return;
    }

    // Persist pin state separately from rendering and alert presentation. In the
    // previous flow, a rendering exception could skip the success alert even
    // though the card had already been pinned and points deducted.
    try {
        localStorage.setItem(PINNED_CARDS_STORAGE_KEY, JSON.stringify([...pinned, id]));
    } catch (error) {
        console.error("[Cards] Could not save pinned card:", error);
        try { points.add(PIN_CARD_COST); } catch (rollbackError) {
            console.error("[Cards] Could not roll back failed pin charge:", rollbackError);
        }
        window.customAlert?.("Could not save this pin. Your 2 Improvement Points have been restored.");
        return;
    }

    // Confirm immediately after both the charge and pin state have persisted.
    // Do this before re-rendering so UI refresh errors cannot suppress feedback.
    try {
        if (typeof window.customAlert === "function") {
            window.customAlert(`2 Improvement Points deducted. ${cardTitle} pinned.`);
        } else {
            console.error("[Cards] Pin succeeded, but the alert service is unavailable.");
        }
    } catch (alertError) {
        console.error("[Cards] Pin succeeded, but its confirmation alert failed:", alertError);
    }

    try { renderMyCards(); } catch (renderError) {
        console.error("[Cards] Pin succeeded, but the collection could not refresh:", renderError);
    }
}

/**
 * Bind pinning to a deliberate double-click/double-tap on the OWNED button.
 * A single click never changes pin state. The time-window fallback also makes
 * the interaction work on touch browsers that emit two click events without
 * dispatching a native dblclick event.
 */
function bindOwnedButtonDoubleClick(button, card) {
    const DOUBLE_CLICK_WINDOW_MS = 350;
    let lastClickAt = 0;

    const isPinned = () => getPinnedCardIds().includes(card.id);
    const syncButton = () => {
        const pinned = isPinned();
        button.textContent = pinned ? "PINNED" : "OWNED";
        button.classList.toggle("is-pinned", pinned);
        button.dataset.pinned = String(pinned);
        button.setAttribute("aria-pressed", String(pinned));
        button.setAttribute(
            "aria-label",
            pinned
                ? `${card.title} is pinned. Double-click to unpin.`
                : `${card.title} is owned. Double-click to pin for 2 Improvement Points.`
        );
        button.title = pinned
            ? "Double-click to unpin this card"
            : "Double-click to pin this card for 2 Improvement Points";
    };

    button.addEventListener("click", event => {
        const now = Date.now();
        const isSecondClick = lastClickAt > 0 && now - lastClickAt <= DOUBLE_CLICK_WINDOW_MS;

        if (!isSecondClick) {
            lastClickAt = now;
            return;
        }

        lastClickAt = 0;
        event.preventDefault();
        event.stopPropagation();
        togglePinnedCard(card);
    });

    syncButton();
    return syncButton;
}

function createOwnedButton(card, button) {
    button.type = "button";
    button.disabled = false;
    button.classList.add("owned-card-button");
    button.textContent = "OWNED";
    button.dataset.cardId = card.id;
    bindOwnedButtonDoubleClick(button, card);
    return button;
}

function bindSpecialActionButton(button, card, singleClickAction = null) {
    let clickTimer = null;
    const syncPinnedState = () => {
        const pinned = getPinnedCardIds().includes(card.id);
        button.classList.toggle("is-pinned", pinned);
        button.dataset.pinned = String(pinned);
        button.setAttribute("aria-pressed", String(pinned));
        button.title = pinned
            ? `${card.title} is pinned. Double-click to unpin.`
            : `Double-click to pin ${card.title} for 2 Improvement Points.`;
    };

    button.addEventListener("click", event => {
        event.preventDefault();
        if (clickTimer !== null) return;
        clickTimer = window.setTimeout(() => {
            clickTimer = null;
            if (typeof singleClickAction === "function") singleClickAction();
        }, 350);
    });

    button.addEventListener("dblclick", event => {
        event.preventDefault();
        event.stopPropagation();
        if (clickTimer !== null) {
            window.clearTimeout(clickTimer);
            clickTimer = null;
        }
        togglePinnedCard(card);
    });

    syncPinnedState();
    return syncPinnedState;
}

function getSafeCardImageSource(value) {
    if (typeof value !== "string" || !value || value.length > 2_000_000 || /[\u0000-\u001f\u007f]/.test(value)) {
        return "";
    }

    if (/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/i.test(value)) {
        return value;
    }

    try {
        const url = new URL(value, document.baseURI);
        if ((url.protocol === "http:" || url.protocol === "https:") && url.origin === window.location.origin) {
            return value;
        }
    } catch (error) {
        return "";
    }

    return "";
}

function createCardElement(card, { owned = false, canBuy = false, mintDate = "" } = {}) {
    const gradeValues = new Set(["E", "D", "C", "B", "A", "S", "SS", "X", "W"]);
    const grade = String(card.grade || "A").toUpperCase();
    const safeGrade = gradeValues.has(grade) ? grade : "A";
    const cost = Number.isFinite(Number(card.cost)) && Number(card.cost) >= 0
        ? Number(card.cost)
        : 0;
    const limited = card.limited === true;
    const specialDefinition = getSpecialDefinition(card);
    const specialActivation = owned && specialDefinition ? getSpecialActivation(card.id) : null;
    const showSpecialFeatures = Boolean(specialDefinition && specialActivation?.status !== "expired");
    const cardElement = document.createElement("div");
    cardElement.className = `flex-card grade-${safeGrade.toLowerCase()} ${owned ? "owned" : "locked"}${limited ? " limited" : ""}${showSpecialFeatures ? " special-card" : ""}${specialActivation?.status === "active" ? " special-card-active" : ""}`;

    const image = document.createElement("img");
    const imageSource = getSafeCardImageSource(card.image);
    image.className = owned ? "owned-card-image" : "market-card-image";
    image.alt = String(card.title || "Card artwork");
    if (imageSource) image.src = imageSource;
    else image.hidden = true;
    cardElement.appendChild(image);

    const gradeBadge = document.createElement("span");
    gradeBadge.className = "grade-badge";
    gradeBadge.textContent = safeGrade;
    cardElement.appendChild(gradeBadge);

    // if (showSpecialFeatures) {
    //     const specialBadge = document.createElement("span");
    //     specialBadge.className = "special-card-badge";
    //     specialBadge.textContent = "SPECIAL";
    //     cardElement.appendChild(specialBadge);
    // }

    if (limited) {
        const limitedBadge = document.createElement("span");
        limitedBadge.className = "limited-badge";
        limitedBadge.textContent = "LIMITED";
        cardElement.appendChild(limitedBadge);
    }

    const body = document.createElement("div");
    body.className = "card-body";

    const title = document.createElement("h3");
    title.textContent = String(card.title || "Untitled card");
    body.appendChild(title);

    const quote = document.createElement("p");
    quote.className = "card-quote";
    quote.textContent = String(card.quote || "");
    body.appendChild(quote);

    if (!owned && limited && card.expiresAt) {
        const expiry = document.createElement("h6");
        expiry.className = "expire-text";
        expiry.textContent = `Will expire on: ${String(card.expiresAt).slice(0, 10)}`;
        body.appendChild(expiry);
    }

    if (showSpecialFeatures) {
        const power = document.createElement("div");
        power.className = "special-card-power";
        power.textContent = specialDefinition.description;
        body.appendChild(power);
    }

    const buyButton = document.createElement("button");
    buyButton.className = "buy-btn";
    buyButton.type = "button";
    if (owned && specialDefinition && !specialActivation) {
        buyButton.classList.add("special-activate-btn");
        buyButton.textContent = "ACTIVATE";
        bindSpecialActionButton(buyButton, card, () => activateSpecialCard(card.id));
    } else if (owned && specialDefinition && specialActivation?.status === "active") {
        buyButton.classList.add("special-active-btn");
        buyButton.textContent = "ACTIVE";
        bindSpecialActionButton(buyButton, card);
    } else if (owned) {
        createOwnedButton(card, buyButton);
    } else {
        const discountedCost = getDiscountedCardCost(card);
        buyButton.disabled = !canBuy;
        buyButton.textContent = isSpecialDiscountActive()
            ? `${discountedCost} pts · 20% OFF`
            : `${cost} pts`;
        if (canBuy && !isExpired(card)) {
            buyButton.addEventListener("click", () => buyCard(card.id));
        }
    }
    body.appendChild(buyButton);

    if (specialActivation?.status === "active") {
        const status = document.createElement("div");
        status.className = "special-card-status";
        status.textContent = `Active until ${formatDate(specialActivation.expiresAt)}`;
        body.appendChild(status);
    }

    if (owned && mintDate) {
        const minted = document.createElement("div");
        minted.className = "mint-date";
        minted.textContent = `Minted on ${mintDate}`;
        body.appendChild(minted);

        const cardCost = document.createElement("div");
        cardCost.className = "mint-date";
        cardCost.textContent = `Card Cost ${cost} pts`;
        body.appendChild(cardCost);
    }

    cardElement.appendChild(body);

    return cardElement;
}

function renderMarketplace(filterGrade = "ALL") {
    processSpecialCardRewards();
    const shop = document.getElementById("cardShop");
    if (!shop) return;

    shop.replaceChildren();
    const fragment = document.createDocumentFragment();

    if (isSpecialDiscountActive()) {
        const discountBanner = document.createElement("div");
        discountBanner.className = "special-discount-banner";
        discountBanner.textContent = "RAJE POWER ACTIVE · 20% OFF ALL MARKETPLACE CARDS TODAY, INCLUDING LIMITED EDITIONS";
        fragment.appendChild(discountBanner);
    }

    let cards = cardCatalogue.getAll();
    if (filterGrade !== "ALL") {
        cards = cards.filter(card => card.grade === filterGrade);
    }

    cards.sort((a, b) => {
        const aLimited = a.limited ? 1 : 0;
        const bLimited = b.limited ? 1 : 0;
        if (aLimited !== bLimited) return bLimited - aLimited;

        const aOwned = window.ownedCards[a.id] ? 1 : 0;
        const bOwned = window.ownedCards[b.id] ? 1 : 0;
        if (aOwned !== bOwned) return bOwned - aOwned;

        const aCanBuy = window.completedMissions >= getDiscountedCardCost(a) ? 1 : 0;
        const bCanBuy = window.completedMissions >= getDiscountedCardCost(b) ? 1 : 0;
        if (aCanBuy !== bCanBuy) return bCanBuy - aCanBuy;

        return window.gradeRank(b.grade) - window.gradeRank(a.grade);
    });

    document.querySelectorAll("[data-card-tab]").forEach(tab => {
        if (tab.dataset.marketplaceTabBound === "true") return;
        tab.dataset.marketplaceTabBound = "true";
        tab.addEventListener("click", () => {
            const target = tab.dataset.cardTab;
            document.querySelectorAll("[data-card-tab]").forEach(button => button.classList.remove("active"));
            tab.classList.add("active");

            const marketplaceView = document.getElementById("cards-marketplace-view");
            const collectionView = document.getElementById("cards-collection-view");
            if (!marketplaceView || !collectionView) return;

            if (target === "collection") {
                marketplaceView.classList.remove("active");
                collectionView.classList.add("active");
                renderMyCards();
            } else {
                collectionView.classList.remove("active");
                marketplaceView.classList.add("active");
                renderMarketplace(window.currentMarketplaceFilter);
            }
        });
    });

    cards.forEach(card => {
        if (!card || card.seasonReward === true || window.ownedCards[card.id]) return;
        const expired = isExpired(card);
        if (expired) return;

        const canBuy = window.completedMissions >= getDiscountedCardCost(card);
        fragment.appendChild(createCardElement(card, { canBuy }));
    });
    shop.replaceChildren(fragment);
}

function isExpired(card) {
    if (!card.limited || !card.expiresAt) return false;

    const now = window.__timeTravelNow || Date.now();
    return new Date(card.expiresAt).getTime() < now;
}

function buyCard(cardId) {
    const card = cardCatalogue.getById(cardId);
    if (!card) return;

    if (card.limited && isExpired(card)) {
        window.customAlert("This limited edition card is no longer available.");
        return;
    }

    if (window.ownedCards?.[card.id]) {
        window.customAlert("You already own this card.");
        return;
    }

    const purchaseCost = getDiscountedCardCost(card);
    if (window.completedMissions < purchaseCost) {
        window.customAlert("Not enough Improvement Points.");
        return;
    }

    window.customConfirm(
        `Mint "${card.title}" for ${purchaseCost} points${purchaseCost < card.cost ? " (20% Sunday discount)" : ""}?\nThis is permanent.`,
        () => {
            // Re-check mutable conditions after confirmation to prevent stale or
            // repeated confirmation callbacks from charging for the same card.
            if (card.limited && isExpired(card)) {
                window.customAlert("This limited edition card is no longer available.");
                return;
            }

            let previousOwnedCardsRaw;
            let latestOwnedCards = {};

            try {
                previousOwnedCardsRaw = localStorage.getItem("ownedCards");
                const parsedOwnedCards = previousOwnedCardsRaw
                    ? JSON.parse(previousOwnedCardsRaw)
                    : {};

                if (!parsedOwnedCards || typeof parsedOwnedCards !== "object" || Array.isArray(parsedOwnedCards)) {
                    throw new Error("Saved card collection has an invalid format.");
                }

                latestOwnedCards = parsedOwnedCards;
            } catch (error) {
                console.error("Failed to reload owned cards:", error);
                window.customAlert("Could not load your card collection. Purchase cancelled.");
                return;
            }

            // A second callback or another tab may have completed this purchase.
            if (latestOwnedCards[card.id]) {
                window.ownedCards = latestOwnedCards;
                window.customAlert("You already own this card.");
                renderMarketplace(window.currentMarketplaceFilter);
                renderMyCards();
                return;
            }

            const finalPurchaseCost = getDiscountedCardCost(card);
            if (window.completedMissions < finalPurchaseCost) {
                window.customAlert("Not enough Improvement Points.");
                return;
            }

            const nextOwnedCards = {
                ...latestOwnedCards,
                [card.id]: {
                    ...(latestOwnedCards[card.id] || {}),
                    mintedAt: window.getISTDate().toISOString().slice(0, 10)
                }
            };

            // Save ownership first. If spending fails, restore the prior saved
            // collection so a card can never be granted without its point cost.
            try {
                localStorage.setItem("ownedCards", JSON.stringify(nextOwnedCards));
                window.ownedCards = nextOwnedCards;

                if (!points.spend(finalPurchaseCost)) {
                    if (previousOwnedCardsRaw === null) {
                        localStorage.removeItem("ownedCards");
                    } else {
                        localStorage.setItem("ownedCards", previousOwnedCardsRaw);
                    }
                    window.ownedCards = latestOwnedCards;
                    window.customAlert("Not enough Improvement Points. Purchase cancelled.");
                    return;
                }
            } catch (error) {
                console.error("Card purchase could not be saved:", error);
                try {
                    if (previousOwnedCardsRaw === null) {
                        localStorage.removeItem("ownedCards");
                    } else {
                        localStorage.setItem("ownedCards", previousOwnedCardsRaw);
                    }
                } catch (rollbackError) {
                    console.error("Could not roll back the card collection:", rollbackError);
                }
                window.ownedCards = latestOwnedCards;
                window.customAlert("Could not save this purchase. Your points were not intentionally charged.");
                return;
            }

            renderMyCards();
            window.showMintedCard(card);
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
    processSpecialCardRewards();

    const container =
        document.getElementById("ownedCards");

    const seasonContainer =
        document.getElementById("seasonCards");

    const seasonSection =
        document.getElementById(
            "seasonCardsSection"
        );


    if (!container) return;

    const pinnedIds = getPinnedCardIds();
    const pinCounter = document.getElementById("pinnedCardsCounter");
    if (pinCounter) {
        pinCounter.textContent = `Pinned ${pinnedIds.length}/${MAX_PINNED_CARDS} · Pinning costs 2 Improvement Points. Unpin anytime; no refund.`;
    }

    /* =====================================================
       LOAD OWNED CARDS
    ===================================================== */

    let currentOwnedCards = {};

    try {

        currentOwnedCards =
            JSON.parse(
                localStorage.getItem(
                    "ownedCards"
                ) || "{}"
            );

    } catch (error) {

        console.error(
            "Could not load owned cards:",
            error
        );

        currentOwnedCards = {};
    }


    if (
        typeof window.ownedCards !==
        "undefined"
    ) {

        window.ownedCards =
            currentOwnedCards;

    }


    /* =====================================================
       FIND OWNED CARDS
    ===================================================== */

    const ownedList =
        cardCatalogue.getAll()
            .filter(
                card =>
                    currentOwnedCards[
                    card.id
                    ]
            )
            .sort((a, b) => {
                const aPinned = pinnedIds.includes(a.id) ? 1 : 0;
                const bPinned = pinnedIds.includes(b.id) ? 1 : 0;
                if (aPinned !== bPinned) return bPinned - aPinned;
                return window.gradeRank(b.grade) - window.gradeRank(a.grade);
            });


    /* =====================================================
       SEPARATE SEASON CARDS
    ===================================================== */

    const normalCards =
        ownedList.filter(
            card =>
                !card.seasonReward
        );


    const seasonCards =
        ownedList.filter(
            card =>
                card.seasonReward
        );


    /* =====================================================
       NORMAL CARDS
    ===================================================== */

    container.replaceChildren();

    if (normalCards.length === 0) {
        const empty = document.createElement("p");
        empty.style.opacity = "0.6";
        empty.textContent = "No regular cards minted yet.";
        container.appendChild(empty);
    } else {
        const fragment = document.createDocumentFragment();
        normalCards.forEach(card => {
            const data = currentOwnedCards[card.id];
            const mintedAt = data?.mintedAt ? formatDate(data.mintedAt) : "Unknown";
            fragment.appendChild(createCardElement(card, { owned: true, mintDate: mintedAt }));
        });
        container.replaceChildren(fragment);
    }

    /* =====================================================
       SEASON CARDS
    ===================================================== */

    if (!seasonContainer) {
        return;
    }


    seasonContainer.replaceChildren();


    if (
        seasonCards.length === 0
    ) {

        if (seasonSection) {

            seasonSection.style.display =
                "none";

        }

        return;
    }


    if (seasonSection) {

        seasonSection.style.display =
            "block";

    }


    seasonCards.forEach(
        card => {

            const data =
                currentOwnedCards[
                card.id
                ];


            const mintedAt =
                data?.mintedAt
                    ? formatDate(
                        data.mintedAt
                    )
                    : "Unknown";


            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "season-owned-card";

            const seasonNumber = card.season
                ? card.season
                    .replace("season-", "")
                    .padStart(2, "0")
                : "01";


            const art = document.createElement("div");
            art.className = "season-owned-card-art";

            const image = document.createElement("img");
            image.src = getSafeCardImageSource(card.image);
            image.alt = String(card.title || "Season card");
            image.loading = "lazy";
            art.append(image);

            const badge = document.createElement("span");
            badge.className = "season-owned-card-badge";
            badge.textContent = `SEASON ${seasonNumber}`;
            art.append(badge);

            const body = document.createElement("div");
            body.className = "season-owned-card-body";

            const title = document.createElement("h3");
            title.textContent = String(card.title || "Untitled card");
            body.append(title);

            const quote = document.createElement("p");
            quote.textContent = String(card.quote || "");
            body.append(quote);

            const meta = document.createElement("div");
            meta.className = "season-owned-card-meta";
            meta.textContent = `Minted on ${mintedAt}`;
            body.append(meta);

            const specialDefinition = getSpecialDefinition(card);
            const specialActivation = specialDefinition ? getSpecialActivation(card.id, currentOwnedCards) : null;
            const showSpecialFeatures = Boolean(specialDefinition && specialActivation?.status !== "expired");
            if (showSpecialFeatures) {
                div.classList.add("special-card");
                const specialBadge = document.createElement("span");
                specialBadge.className = "special-card-badge season-special-badge";
                specialBadge.textContent = "SPECIAL";
                art.append(specialBadge);

                const power = document.createElement("p");
                power.className = "special-card-power";
                power.textContent = specialDefinition.description;
                body.append(power);
            }

            if (specialDefinition && !specialActivation) {
                const activateButton = document.createElement("button");
                activateButton.type = "button";
                activateButton.className = "season-owned-card-owned-button special-activate-btn";
                activateButton.textContent = "ACTIVATE";
                bindSpecialActionButton(activateButton, card, () => activateSpecialCard(card.id));
                body.append(activateButton);
            } else if (specialDefinition && specialActivation?.status === "active") {
                const activeButton = document.createElement("button");
                activeButton.type = "button";
                activeButton.disabled = false;
                activeButton.className = "season-owned-card-owned-button special-active-btn";
                activeButton.textContent = "ACTIVE";
                bindSpecialActionButton(activeButton, card);
                body.append(activeButton);
                const status = document.createElement("div");
                status.className = "special-card-status";
                status.textContent = `Active until ${formatDate(specialActivation.expiresAt)}`;
                body.append(status);
            } else {
                const ownedButton = document.createElement("button");
                ownedButton.className = "season-owned-card-owned-button";
                createOwnedButton(card, ownedButton);
                body.append(ownedButton);
            }

            art.append(body);
            div.append(art);

            seasonContainer.appendChild(
                div
            );

        }
    );

}


const GRADE_ORDER = ["D", "C", "B", "X", "A", "S", "SS", "w"];

function gradeRank(grade) {
    return GRADE_ORDER.indexOf(grade) + 1;
}

/* =========================================================
   CARD MINT REVEAL
========================================================= */

function showMintedCard(card) {
    if (!card || typeof card !== "object") return;

    document.getElementById("mintReveal")?.remove();

    const overlay = document.createElement("div");
    overlay.id = "mintReveal";

    const content = document.createElement("div");
    content.className = "mint-reveal-content";

    const label = document.createElement("div");
    label.className = "mint-reveal-label";
    label.textContent = "CARD MINTED";

    const stage = document.createElement("div");
    stage.className = "mint-card-stage";
    const light = document.createElement("div");
    light.className = "mint-card-light";
    const image = document.createElement("img");
    image.className = "mint-reveal-image";
    image.alt = String(card.title ?? "Minted card");
    const imagePath = String(card.image ?? "");
    if (/^(https?:\/\/|\.\.?\/|Images\/)/i.test(imagePath) && !/["'<>\s]/.test(imagePath)) {
        image.src = imagePath;
    }
    stage.append(light, image);

    const earned = document.createElement("div");
    earned.className = "mint-reveal-earned";
    earned.textContent = "YOU EARNED THIS";

    const title = document.createElement("h2");
    title.className = "mint-reveal-title";
    title.textContent = String(card.title ?? "");

    const quote = document.createElement("p");
    quote.className = "mint-reveal-quote";
    quote.textContent = String(card.quote ?? "");

    const close = document.createElement("button");
    close.className = "mint-reveal-close";
    close.type = "button";
    close.textContent = "Continue";
    close.addEventListener("click", closeMintedCard);

    content.append(label, stage, earned, title, quote, close);
    overlay.appendChild(content);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => overlay.classList.add("show"));
    window.playAppTone?.("mint");

    overlay.addEventListener("click", event => {
        if (event.target === overlay) closeMintedCard();
    });
}

function closeMintedCard() {
    const reveal = document.getElementById("mintReveal");
    if (!reveal) return;

    reveal.classList.remove("show");

    setTimeout(() => {
        reveal.remove();
    }, 300);
}

function initializeCardMarketplace() {
    lastSpecialCardCheckDate = getISTTodayKey();
    if (!window.__standoutSpecialCardClockStarted) {
        window.__standoutSpecialCardClockStarted = true;
        window.setInterval(() => {
            const today = getISTTodayKey();
            if (today === lastSpecialCardCheckDate) return;
            lastSpecialCardCheckDate = today;
            processSpecialCardRewards();
            renderMarketplace(window.currentMarketplaceFilter || "ALL");
            renderMyCards();
        }, 60_000);
    }

    document.querySelectorAll(".card-filters button").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".card-filters button")
                .forEach(button => button.classList.remove("active"));
            btn.classList.add("active");
            const grade = btn.textContent === "All" ? "ALL" : btn.textContent;
            window.currentMarketplaceFilter = grade;
            renderMarketplace(grade);
        });
    });

    window.addEventListener("load", () => {
        processSpecialCardRewards();
        renderMarketplace();
        renderMyCards();
    });

    const marketplaceIcon = document.getElementById("marketplaceIcon");
    if (marketplaceIcon) {
        marketplaceIcon.addEventListener("click", () => {
            if (window.isMarketplaceOpen) {
                window.showPage("missions");
                window.isMarketplaceOpen = false;
            } else {
                window.showPage("marketplace-cards");
                window.isMarketplaceOpen = true;
                document.querySelectorAll("[data-card-tab]").forEach(button => {
                    button.classList.remove("active");
                });
                const marketplaceTab = document.querySelector('[data-card-tab="marketplace"]');
                if (marketplaceTab) marketplaceTab.classList.add("active");
                const marketplaceView = document.getElementById("cards-marketplace-view");
                const collectionView = document.getElementById("cards-collection-view");
                if (marketplaceView) marketplaceView.classList.add("active");
                if (collectionView) collectionView.classList.remove("active");
                renderMarketplace(window.currentMarketplaceFilter);
            }
        });
    }
}

window.showMintedCard = showMintedCard;
window.closeMintedCard = closeMintedCard;
window.renderMarketplace = renderMarketplace;
window.renderMyCards = renderMyCards;
window.togglePinnedCard = togglePinnedCard;
window.buyCard = buyCard;
window.activateSpecialCard = activateSpecialCard;
window.isSpecialDiscountActive = isSpecialDiscountActive;
window.getDiscountedCardCost = getDiscountedCardCost;
window.activateSpecialCard = activateSpecialCard;
window.isSpecialDiscountActive = isSpecialDiscountActive;
window.getDiscountedCardCost = getDiscountedCardCost;
window.isExpired = isExpired;
window.formatDate = formatDate;
window.formatCardDate = formatDate;
window.gradeRank = gradeRank;

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeCardMarketplace, { once: true });
} else {
    initializeCardMarketplace();
}

export const cardsFeature = Object.freeze({
    showMintedCard,
    closeMintedCard,
    renderMarketplace,
    renderMyCards,
    togglePinnedCard,
    getPinnedCardIds,
    buyCard,
    isExpired,
    formatDate,
    activateSpecialCard,
    processSpecialCardRewards,
    getSpecialDefinition,
    gradeRank,
    getCurrentFilter: () => currentMarketplaceFilter,
    setCurrentFilter: value => { currentMarketplaceFilter = value || "ALL"; },
    isOpen: () => isMarketplaceOpen,
    setOpen: value => { isMarketplaceOpen = Boolean(value); },
    getOwnedCards: () => ownedCardsState,
    setOwnedCards: value => {
        ownedCardsState = value && typeof value === "object" && !Array.isArray(value)
            ? value
            : {};
        return ownedCardsState;
    }
});


/**
 * Purchase one Momentum Shield for 10 Improvement Points.
 * Uses the existing Improvement Points and Momentum balance systems.
 */
window.buyShieldPoints = function buyShieldPoints() {
    const cost = 10;
    const currentBalance = Number(window.completedMissions) || 0;

    if (currentBalance < cost) {
        window.customAlert?.("You need 10 Improvement Points to buy 1 Shield Point.");
        return;
    }

    if (typeof window.Momentum?.addShieldPoints !== "function") {
        window.customAlert?.("Shield Points are currently unavailable. Please try again.");
        return;
    }

    window.customConfirm?.(
        "Buy 1 Shield Point for 10 Improvement Points?",
        () => {
            // Recheck after confirmation in case the balance changed.
            if ((Number(window.completedMissions) || 0) < cost) {
                window.customAlert?.("Not enough Improvement Points. Purchase cancelled.");
                return;
            }

            const momentum = window.Momentum;
            const before = Number(momentum.getState?.()?.shields) || 0;

            try {
                if (!points.spend(cost)) {
                    window.customAlert?.("Not enough Improvement Points. Purchase cancelled.");
                    return;
                }

                const after = momentum.addShieldPoints(1);
                if (Number(after) !== before + 1) {
                    throw new Error("Shield Point balance did not update.");
                }

                window.customAlert?.("Purchase successful! 1 Shield Point added.");
            } catch (error) {
                console.error("[Shield Shop] Purchase failed:", error);
                // Refund the Improvement Points if Shield Point persistence fails.
                try { points.add(cost); } catch (refundError) {
                    console.error("[Shield Shop] Refund failed:", refundError);
                }
                window.customAlert?.("Purchase could not be completed. Your Improvement Points were refunded if possible.");
            }
        }
    );
};
