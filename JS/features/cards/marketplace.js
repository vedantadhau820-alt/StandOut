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

function togglePinnedCard(cardId) {
    const id = String(cardId || "");
    if (!id || !window.ownedCards?.[id]) return;

    const pinned = getPinnedCardIds();
    if (pinned.includes(id)) {
        try {
            localStorage.setItem(PINNED_CARDS_STORAGE_KEY, JSON.stringify(pinned.filter(item => item !== id)));
            renderMyCards();
        } catch (error) {
            console.error("[Cards] Could not unpin card:", error);
            window.customAlert?.("Could not save this change. Please try again.");
        }
        return;
    }

    if (pinned.length >= MAX_PINNED_CARDS) {
        window.customAlert?.("You can pin up to 4 cards. Unpin a card before pinning another.");
        return;
    }

    if ((Number(window.completedMissions) || 0) < PIN_CARD_COST) {
        window.customAlert?.("You need 2 Improvement Points to pin a card.");
        return;
    }

    if (!points.spend(PIN_CARD_COST)) {
        window.customAlert?.("Not enough Improvement Points to pin this card.");
        return;
    }

    try {
        localStorage.setItem(PINNED_CARDS_STORAGE_KEY, JSON.stringify([...pinned, id]));
        renderMyCards();
    } catch (error) {
        console.error("[Cards] Could not save pinned card:", error);
        // Roll back the charge only when the pin operation itself failed to persist.
        try { points.add(PIN_CARD_COST); } catch (rollbackError) {
            console.error("[Cards] Could not roll back failed pin charge:", rollbackError);
        }
        window.customAlert?.("Could not save this pin. Your 2 Improvement Points have been restored.");
    }
}

function createPinButton(card) {
    const pinned = getPinnedCardIds().includes(card.id);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `card-pin-button${pinned ? " is-pinned" : ""}`;
    button.textContent = pinned ? "Pinned · Unpin" : "Pin · 2 pts";
    button.setAttribute("aria-pressed", String(pinned));
    button.addEventListener("click", () => togglePinnedCard(card.id));
    return button;
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
    const cardElement = document.createElement("div");
    cardElement.className = `flex-card grade-${safeGrade.toLowerCase()} ${owned ? "owned" : "locked"}${limited ? " limited" : ""}`;

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

    if (limited && card.expiresAt) {
        const expiry = document.createElement("h6");
        expiry.className = "expire-text";
        expiry.textContent = `Will expire on: ${String(card.expiresAt).slice(0, 10)}`;
        body.appendChild(expiry);
    }

    const buyButton = document.createElement("button");
    buyButton.className = "buy-btn";
    buyButton.type = "button";
    if (owned) {
        buyButton.disabled = true;
        buyButton.textContent = "OWNED";
    } else {
        buyButton.disabled = !canBuy;
        buyButton.textContent = `${cost} pts`;
        if (canBuy && !isExpired(card)) {
            buyButton.addEventListener("click", () => buyCard(card.id));
        }
    }
    body.appendChild(buyButton);

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

    if (owned) {
        body.appendChild(createPinButton(card));
    }

    cardElement.appendChild(body);
    return cardElement;
}

function renderMarketplace(filterGrade = "ALL") {
    const shop = document.getElementById("cardShop");
    if (!shop) return;

    shop.replaceChildren();

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

        const aCanBuy = window.completedMissions >= a.cost ? 1 : 0;
        const bCanBuy = window.completedMissions >= b.cost ? 1 : 0;
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

    const fragment = document.createDocumentFragment();
    cards.forEach(card => {
        if (!card || card.seasonReward === true || window.ownedCards[card.id]) return;
        const expired = isExpired(card);
        if (expired) return;

        const canBuy = window.completedMissions >= Number(card.cost);
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

    if (window.completedMissions < card.cost) {
        window.customAlert("Not enough Improvement Points.");
        return;
    }

    window.customConfirm(
        `Mint "${card.title}" for ${card.cost} points?\nThis is permanent.`,
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

            if (window.completedMissions < card.cost) {
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

                if (!points.spend(card.cost)) {
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
            body.append(createPinButton(card));

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
