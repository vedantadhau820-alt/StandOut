/* =========================================================
   CUSTOM CARDS
   IndexedDB + Marketplace Integration
========================================================= */

const CUSTOM_CARD_DB_NAME = "standout-custom-cards";
const CUSTOM_CARD_DB_VERSION = 1;
const CUSTOM_CARD_STORE = "cards";

let customCardDB = null;

const CUSTOM_CARD_IMAGE_MAX_FILE_BYTES = 10 * 1024 * 1024;
const CUSTOM_CARD_IMAGE_DATA_URL_PATTERN =
    /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/i;

function isSafeCustomCardImageData(value) {
    return typeof value === "string" &&
        value.length <= 2_000_000 &&
        CUSTOM_CARD_IMAGE_DATA_URL_PATTERN.test(value);
}


/* =========================================================
   OPEN DATABASE
========================================================= */

function openCustomCardDB() {

    return new Promise((resolve, reject) => {

        const request = indexedDB.open(
            CUSTOM_CARD_DB_NAME,
            CUSTOM_CARD_DB_VERSION
        );


        request.onupgradeneeded = event => {

            const db = event.target.result;

            if (
                !db.objectStoreNames.contains(
                    CUSTOM_CARD_STORE
                )
            ) {

                db.createObjectStore(
                    CUSTOM_CARD_STORE,
                    {
                        keyPath: "id"
                    }
                );

            }

        };


        request.onsuccess = event => {

            customCardDB =
                event.target.result;

            resolve(customCardDB);

        };


        request.onerror = () => {

            reject(request.error);

        };

    });

}


/* =========================================================
   SAVE CARD
========================================================= */

function saveCustomCard(card) {

    return new Promise(async (resolve, reject) => {

        try {

            const db =
                customCardDB ||
                await openCustomCardDB();


            if (
                !db.objectStoreNames.contains(
                    CUSTOM_CARD_STORE
                )
            ) {

                throw new Error(
                    "Custom card object store does not exist."
                );

            }


            const transaction =
                db.transaction(
                    CUSTOM_CARD_STORE,
                    "readwrite"
                );


            const store =
                transaction.objectStore(
                    CUSTOM_CARD_STORE
                );


            const request =
                store.put(card);


            request.onerror = () => {

                reject(
                    request.error ||
                    new Error(
                        "IndexedDB put failed."
                    )
                );

            };


            transaction.oncomplete = () => {

                resolve(card);

            };


            transaction.onerror = () => {

                reject(
                    transaction.error ||
                    new Error(
                        "IndexedDB transaction failed."
                    )
                );

            };


            transaction.onabort = () => {

                reject(
                    transaction.error ||
                    new Error(
                        "IndexedDB transaction aborted."
                    )
                );

            };

        } catch (error) {

            reject(error);

        }

    });

}


/* =========================================================
   GET ALL CUSTOM CARDS
========================================================= */

function getCustomCards() {

    return new Promise(async (resolve, reject) => {

        try {

            const db =
                customCardDB ||
                await openCustomCardDB();


            const transaction =
                db.transaction(
                    CUSTOM_CARD_STORE,
                    "readonly"
                );


            const store =
                transaction.objectStore(
                    CUSTOM_CARD_STORE
                );


            const request =
                store.getAll();


            request.onsuccess = () => {

                resolve(
                    request.result || []
                );

            };


            request.onerror = () => {

                reject(
                    request.error
                );

            };

        } catch (error) {

            reject(error);

        }

    });

}


/* =========================================================
   REPLACE ALL CARDS (BACKUP RESTORE)
========================================================= */

async function replaceAllCustomCards(cards) {
    if (!Array.isArray(cards)) {
        throw new TypeError("Custom cards must be an array.");
    }
    if (cards.some(card => !card || typeof card !== "object" || Array.isArray(card) || !card.id)) {
        throw new TypeError("Backup contains an invalid custom card.");
    }

    const db = customCardDB || await openCustomCardDB();
    return new Promise((resolve, reject) => {
        let transaction;
        try {
            transaction = db.transaction(CUSTOM_CARD_STORE, "readwrite");
            const store = transaction.objectStore(CUSTOM_CARD_STORE);
            store.clear();
            for (const card of cards) store.put(card);
        } catch (error) {
            reject(error);
            return;
        }

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error || new Error("Custom card restore failed."));
        transaction.onabort = () => reject(transaction.error || new Error("Custom card restore was aborted."));
    });
}


/* =========================================================
   DELETE CUSTOM CARD
========================================================= */

function deleteCustomCard(id) {

    return new Promise(async (resolve, reject) => {

        try {

            const db =
                customCardDB ||
                await openCustomCardDB();


            const transaction =
                db.transaction(
                    CUSTOM_CARD_STORE,
                    "readwrite"
                );


            const store =
                transaction.objectStore(
                    CUSTOM_CARD_STORE
                );


            store.delete(id);


            transaction.oncomplete = () => {

                resolve();

            };


            transaction.onerror = () => {

                reject(
                    transaction.error
                );

            };

        } catch (error) {

            reject(error);

        }

    });

}


/* =========================================================
   LOAD CUSTOM CARDS INTO MARKETPLACE
========================================================= */

async function loadCustomCardsIntoMarketplace() {

    try {

        const customCards =
            await getCustomCards();


        /*
         * Remove old injected custom cards.
         */

        window.cardCatalog =
            (window.cardCatalog || [])
                .filter(
                    card => !card.custom
                );


        /*
         * Add saved custom cards.
         */

        window.cardCatalog.push(
            ...customCards
        );


        /*
         * Refresh marketplace.
         */

        if (
            typeof window.renderMarketplace ===
            "function"
        ) {

            window.renderMarketplace(
                window.currentMarketplaceFilter ||
                "ALL"
            );

        }


        /*
         * Refresh owned cards if available.
         */

        if (
            typeof window.renderMyCards ===
            "function"
        ) {

            window.renderMyCards();

        }

    } catch (error) {

        console.error(
            "Failed to load custom cards:",
            error
        );

    }

}


/* =========================================================
   LIMITED EDITION CONTROLLER
========================================================= */

function initializeCustomCardGradeControls() {

    const limited =
        document.getElementById(
            "customCardLimited"
        );


    const grade =
        document.getElementById(
            "customCardGrade"
        );


    const expirationGroup =
        document.getElementById(
            "customCardExpirationGroup"
        );


    if (
        !limited ||
        !grade ||
        !expirationGroup
    ) {

        return;

    }


    /* =====================================================
       MAKE SURE W EXISTS
    ===================================================== */

    if (
        !grade.querySelector(
            'option[value="W"]'
        )
    ) {

        const wOption =
            document.createElement(
                "option"
            );

        wOption.value = "W";
        wOption.textContent = "W";

        grade.appendChild(
            wOption
        );

    }


    /* =====================================================
       TOGGLE
    ===================================================== */

    limited.addEventListener(
        "change",
        () => {

            if (
                limited.checked
            ) {

                /*
                 * Limited Edition = W
                 */

                grade.value = "W";

                grade.disabled = true;


                expirationGroup.style.display =
                    "block";

            } else {

                /*
                 * Normal card
                 */

                grade.disabled = false;


                if (
                    grade.value === "W"
                ) {

                    grade.value = "A";

                }


                expirationGroup.style.display =
                    "none";

            }

        }
    );


    /*
     * Apply correct initial state.
     */

    if (
        limited.checked
    ) {

        grade.value = "W";

        grade.disabled = true;

        expirationGroup.style.display =
            "block";

    } else {

        grade.disabled = false;

        expirationGroup.style.display =
            "none";

    }

}


/* =========================================================
   CUSTOM CARD CREATOR UI AND ARTWORK PIPELINE
========================================================= */

function openCustomCardModal() {
    const modal = document.getElementById("customCardModal");
    if (modal) modal.classList.add("active");
}

function closeCustomCardModal() {
    const modal = document.getElementById("customCardModal");
    if (modal) modal.classList.remove("active");
}

function initializeCustomCardImagePicker() {
    const picker = document.getElementById("customCardImagePicker");
    const input = document.getElementById("customCardImage");
    if (!picker || !input || picker.dataset.creatorBound === "true") return;
    picker.dataset.creatorBound = "true";
    picker.addEventListener("click", () => input.click());
    input.addEventListener("change", event => {
        const file = event.target.files?.[0];
        if (!file) return;
        const supportedImageTypes = new Set([
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
        ]);
        if (!supportedImageTypes.has(file.type.toLowerCase())) {
            customAlert("Please choose a JPEG, PNG, WebP, or GIF image.");
            input.value = "";
            return;
        }
        if (file.size > CUSTOM_CARD_IMAGE_MAX_FILE_BYTES) {
            customAlert("Please choose an image smaller than 10 MB.");
            input.value = "";
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                const MAX_SIZE = 1000;
                let width = img.width;
                let height = img.height;
                if (width > MAX_SIZE || height > MAX_SIZE) {
                    if (width > height) {
                        height = Math.round(height * (MAX_SIZE / width));
                        width = MAX_SIZE;
                    } else {
                        width = Math.round(width * (MAX_SIZE / height));
                        height = MAX_SIZE;
                    }
                }
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    customAlert("Could not process this image.");
                    return;
                }
                ctx.drawImage(img, 0, 0, width, height);
                window.customCardImageData = canvas.toDataURL("image/jpeg", 0.82);
                const preview = document.getElementById("customCardImagePreview");
                const placeholder = document.getElementById("customCardImagePlaceholder");
                if (preview) {
                    preview.src = window.customCardImageData;
                    preview.style.display = "block";
                }
                if (placeholder) placeholder.style.display = "none";
            };
            img.onerror = () => {
                console.error("Could not process card image.");
                window.customCardImageData = "";
                customAlert("Could not process this image.");
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    });
}

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

    const imageData = window.customCardImageData || "";


    /*
     * New cards require artwork.
     * Edited cards can reuse their existing artwork.
     */

    if (!isSafeCustomCardImageData(imageData)) {
        customAlert("Please choose valid card artwork again.");
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

    if (typeof window.renderMarketplace === "function") {
        window.renderMarketplace(window.currentMarketplaceFilter || "ALL");
    }


    /* =====================================================
       REFRESH CUSTOM CARD MANAGER
    ===================================================== */

    await renderCustomCardsManager();


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

    window.customCardImageData = "";

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



/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        /* ================================================
           DATABASE
        ================================================ */

        try {

            await openCustomCardDB();

            await loadCustomCardsIntoMarketplace();

        } catch (error) {

            console.error(
                "Custom card database failed:",
                error
            );

        }


        /* ================================================
           GRADE / LIMITED CONTROLS
        ================================================ */

        initializeCustomCardGradeControls();
        initializeCustomCardImagePicker();

        const grade = document.getElementById("customCardGrade");
        if (grade && grade.dataset.costRangeBound !== "true") {
            grade.dataset.costRangeBound = "true";
            grade.addEventListener("change", updateCustomCardCostRange);
            updateCustomCardCostRange();
        }

    }
);


/* =========================================================
   GLOBALS
========================================================= */

window.openCustomCardModal = openCustomCardModal;
window.closeCustomCardModal = closeCustomCardModal;
window.createCustomCard = createCustomCard;
window.resetCustomCardForm = resetCustomCardForm;
window.updateCustomCardCostRange = updateCustomCardCostRange;

window.openCustomCardDB =
    openCustomCardDB;

window.saveCustomCard =
    saveCustomCard;

window.getCustomCards =
    getCustomCards;

window.deleteCustomCard =
    deleteCustomCard;

window.loadCustomCardsIntoMarketplace =
    loadCustomCardsIntoMarketplace;

window.initializeCustomCardGradeControls =
    initializeCustomCardGradeControls;

/* =========================================================
CUSTOM CARD MANAGER
========================================================= */

async function renderCustomCardsManager() {

    const container =
        document.getElementById(
            "customCardsManager"
        );

    if (!container) {
        return;
    }


    container.replaceChildren();


    let cards = [];


    /* =====================================================
       LOAD CUSTOM CARDS
    ===================================================== */

    try {

        cards =
            await getCustomCards();

    } catch (error) {

        console.error(
            "Failed to load custom cards:",
            error
        );

        return;

    }


    /* =====================================================
       EMPTY STATE
    ===================================================== */

    if (!cards.length) {

        const empty =
            document.createElement("div");

        empty.className =
            "custom-cards-empty";

        empty.textContent =
            "You haven't created any custom cards yet.";

        container.appendChild(
            empty
        );

        return;

    }


    /* =====================================================
       OWNED CARDS
    ===================================================== */

    let ownedCards = {};

    try {

        ownedCards =
            JSON.parse(
                localStorage.getItem(
                    "ownedCards"
                ) || "{}"
            );

    } catch (error) {

        console.error(
            "Failed to read owned cards:",
            error
        );

        ownedCards = {};

    }


    /* =====================================================
       RENDER CARDS
    ===================================================== */

    const fragment = document.createDocumentFragment();

    cards.forEach(card => {


        /* =================================================
           CARD ROW
        ================================================= */

        const row =
            document.createElement(
                "div"
            );

        row.className =
            "custom-card-manager-item";


        /* =================================================
           IMAGE
        ================================================= */

        const image =
            document.createElement(
                "img"
            );

        image.className =
            "custom-card-manager-image";

        if (isSafeCustomCardImageData(card.image)) {
            image.src = card.image;
        } else {
            image.hidden = true;
        }

        image.alt =
            String(card.title || "Custom Card");


        /* =================================================
           INFO
        ================================================= */

        const info =
            document.createElement(
                "div"
            );

        info.className =
            "custom-card-manager-info";


        /* TITLE */

        const title =
            document.createElement(
                "div"
            );

        title.className =
            "custom-card-manager-title";

        title.textContent =
            card.title ||
            "Untitled";


        /* META */

        const meta =
            document.createElement(
                "div"
            );

        meta.className =
            "custom-card-manager-meta";


        /* GRADE */

        const grade =
            document.createElement(
                "span"
            );

        grade.className =
            "custom-card-manager-grade";

        grade.textContent =
            card.grade ||
            "A";


        /* SEPARATOR */

        const separator =
            document.createElement(
                "span"
            );

        separator.textContent =
            "•";


        /* COST */

        const cost =
            document.createElement(
                "span"
            );

        cost.textContent =
            `${card.cost || 0} pts`;


        meta.appendChild(
            grade
        );

        meta.appendChild(
            separator
        );

        meta.appendChild(
            cost
        );


        /* LIMITED LABEL */

        if (
            card.limited === true ||
            card.grade === "W"
        ) {

            const limited =
                document.createElement(
                    "span"
                );

            limited.textContent =
                "• Limited";

            meta.appendChild(
                limited
            );

        }


        /* OWNED LABEL */

        const isOwned =
            !!ownedCards[
            card.id
            ];


        if (isOwned) {

            const owned =
                document.createElement(
                    "span"
                );

            owned.textContent =
                "• Owned";

            meta.appendChild(
                owned
            );

        }


        info.appendChild(
            title
        );

        info.appendChild(
            meta
        );


        /* =================================================
           ACTIONS
        ================================================= */

        const actions =
            document.createElement(
                "div"
            );

        actions.className =
            "custom-card-manager-actions";


        /* =================================================
           LIMITED CHECK
        ================================================= */

        const isLimited =
            card.limited === true ||
            card.grade === "W";


        /* =================================================
           EDIT
           
           Only:
           - normal card
           - not owned
        ================================================= */

        if (
            !isOwned &&
            !isLimited
        ) {

            const edit =
                document.createElement(
                    "button"
                );

            edit.type =
                "button";

            edit.className =
                "custom-card-manager-edit";

            edit.title =
                "Edit card";

            edit.textContent =
                "✎";


            edit.addEventListener("click", () => {
                openEditCustomCard(card.id);
            });


            actions.appendChild(
                edit
            );

        }


        /* =================================================
           REMOVE
           
           Always available.
        ================================================= */

        const remove =
            document.createElement(
                "button"
            );

        remove.type =
            "button";

        remove.className =
            "custom-card-manager-delete";

        remove.title =
            "Remove card";

        remove.textContent =
            "×";


        remove.addEventListener("click", () => {
            confirmDeleteCustomCard(card.id, card.title);
        });


        actions.appendChild(
            remove
        );


        /* =================================================
           BUILD ROW
        ================================================= */

        row.appendChild(
            image
        );

        row.appendChild(
            info
        );

        row.appendChild(
            actions
        );


        fragment.appendChild(row);

    });

    container.replaceChildren(fragment);

}


/* =========================================================
   DELETE
========================================================= */

function confirmDeleteCustomCard(
    id,
    title
) {

    customConfirm(
        `Remove "${title}" from your custom cards?`,
        async () => {

            try {

                await deleteCustomCard(id);


                /*
                 * Remove from marketplace.
                 */

                window.cardCatalog =
                    (window.cardCatalog || [])
                        .filter(
                            card =>
                                card.id !== id
                        );


                /*
                 * Refresh marketplace.
                 */

                if (
                    typeof window.renderMarketplace ===
                    "function"
                ) {

                    window.renderMarketplace(
                        window.currentMarketplaceFilter ||
                        "ALL"
                    );

                }


                /*
                 * Refresh manager.
                 */

                await renderCustomCardsManager();


                customAlert(
                    "Custom card removed."
                );

            } catch (error) {

                console.error(
                    "Failed to delete custom card:",
                    error
                );

                customAlert(
                    "Could not remove the card."
                );

            }

        }
    );

}


/* =========================================================
   OPEN CREATOR
========================================================= */

function openCustomCardCreator() {

    window.customCardEditId =
        null;


    if (typeof window.resetCustomCardForm === "function") {
        window.resetCustomCardForm();
    }


    const modal =
        document.getElementById(
            "customCardModal"
        );

    if (!modal) {
        return;
    }


    const heading =
        modal.querySelector(
            ".custom-card-modal-header h2"
        );

    if (heading) {

        heading.textContent =
            "Create Custom Card";

    }


    const button =
        modal.querySelector(
            ".custom-card-create"
        );

    if (button) {

        button.textContent =
            "Create Card";

    }


    modal.classList.add(
        "active"
    );

}


/* =========================================================
   OPEN EDITOR
========================================================= */

async function openEditCustomCard(id) {

    let cards;

    try {

        cards =
            await getCustomCards();

    } catch (error) {

        console.error(
            "Failed to load card:",
            error
        );

        customAlert(
            "Could not load this card."
        );

        return;

    }


    const card =
        cards.find(
            item =>
                item.id === id
        );


    if (!card) {

        customAlert(
            "Custom card not found."
        );

        return;

    }

    window.customCardImageData =
        isSafeCustomCardImageData(card.image) ? card.image : "";
    /* =====================================================
   EDIT RESTRICTIONS
===================================================== */

    const ownedCards =
        JSON.parse(
            localStorage.getItem("ownedCards") ||
            "{}"
        );


    /* Owned cards cannot be edited */

    if (ownedCards[card.id]) {

        customAlert(
            "Owned cards cannot be edited."
        );

        return;

    }


    /* Limited Edition cards cannot be edited */

    if (
        card.limited === true ||
        card.grade === "W"
    ) {

        customAlert(
            "Limited Edition cards cannot be edited."
        );

        return;

    }


    window.customCardEditId =
        id;


    /*
     * Restore current artwork.
     */

    window.customCardImageData =
        isSafeCustomCardImageData(card.image) ? card.image : "";


    const title =
        document.getElementById(
            "customCardTitle"
        );

    const quote =
        document.getElementById(
            "customCardQuote"
        );

    const grade =
        document.getElementById(
            "customCardGrade"
        );

    const cost =
        document.getElementById(
            "customCardCost"
        );

    const limited =
        document.getElementById(
            "customCardLimited"
        );

    const expires =
        document.getElementById(
            "customCardExpiresAt"
        );

    const preview =
        document.getElementById(
            "customCardImagePreview"
        );

    const placeholder =
        document.getElementById(
            "customCardImagePlaceholder"
        );

    const expirationGroup =
        document.getElementById(
            "customCardExpirationGroup"
        );


    if (title) {
        title.value =
            card.title || "";
    }

    if (quote) {
        quote.value =
            card.quote || "";
    }

    if (grade) {
        grade.value =
            card.grade || "A";
    }

    if (cost) {
        cost.value =
            card.cost ?? 0;
    }

    if (limited) {
        limited.checked =
            !!card.limited;
    }

    if (expires) {
        expires.value =
            card.expiresAt || "";
    }


    if (preview && window.customCardImageData) {
        preview.src = window.customCardImageData;
        preview.style.display = "block";
    } else if (preview) {
        preview.removeAttribute("src");
        preview.style.display = "none";
    }

    if (placeholder) {
        placeholder.style.display = window.customCardImageData ? "none" : "flex";
    }


    if (expirationGroup) {

        expirationGroup.style.display =
            card.limited
                ? "block"
                : "none";

    }


    const modal =
        document.getElementById(
            "customCardModal"
        );

    if (!modal) {
        return;
    }


    const heading =
        modal.querySelector(
            ".custom-card-modal-header h2"
        );

    if (heading) {

        heading.textContent =
            "Edit Custom Card";

    }


    const button =
        modal.querySelector(
            ".custom-card-create"
        );

    if (button) {

        button.textContent =
            "Save Changes";

    }


    modal.classList.add(
        "active"
    );

}

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        try {

            await openCustomCardDB();

            await loadCustomCardsIntoMarketplace();

            await renderCustomCardsManager();

        } catch (error) {

            console.error(
                "Custom card initialization failed:",
                error
            );

        }

        initializeCustomCardGradeControls();

    }
);

/* =========================================================
   GLOBALS
========================================================= */

window.renderCustomCardsManager =
    renderCustomCardsManager;

window.confirmDeleteCustomCard =
    confirmDeleteCustomCard;

window.openCustomCardCreator =
    openCustomCardCreator;

window.openEditCustomCard =
    openEditCustomCard;


// Public module API for new feature code; legacy globals above remain supported.
export const customCards = Object.freeze({
    openDatabase: openCustomCardDB,
    save: saveCustomCard,
    getAll: getCustomCards,
    replaceAll: replaceAllCustomCards,
    remove: deleteCustomCard,
    loadIntoMarketplace: loadCustomCardsIntoMarketplace,
    initializeGradeControls: initializeCustomCardGradeControls,
    renderManager: renderCustomCardsManager,
    confirmDelete: confirmDeleteCustomCard,
    openCreator: openCustomCardCreator,
    openEditor: openEditCustomCard,
    openModal: openCustomCardModal,
    closeModal: closeCustomCardModal,
    create: createCustomCard,
    resetForm: resetCustomCardForm,
    updateCostRange: updateCustomCardCostRange,
    initializeImagePicker: initializeCustomCardImagePicker
});

export { CUSTOM_CARD_DB_NAME, CUSTOM_CARD_DB_VERSION, CUSTOM_CARD_STORE };
