/**
 * Built-in and runtime card catalogue access.
 * Importing the data module publishes the canonical built-in records to the
 * live window.cardCatalog compatibility surface before this facade is used.
 * Custom-card, backup/restore, and reset flows may still mutate or reassign it.
 */
import "./catalogue-data.js";

const VALID_GRADES = new Set(["E", "D", "C", "B", "A", "S", "SS", "X", "w"]);

function getAll() {
    return Array.isArray(window.cardCatalog) ? [...window.cardCatalog] : [];
}

function getById(cardId) {
    if (cardId == null) return null;
    return getAll().find(card => card && card.id === cardId) || null;
}

function getBySeason(seasonId) {
    if (!seasonId) return [];
    return getAll().filter(card => card && card.season === seasonId);
}

function getSeasonRewards(seasonId) {
    return getBySeason(seasonId).filter(card => card.seasonReward === true);
}

function getMarketplaceCards() {
    return getAll().filter(card => card.seasonReward !== true);
}

/**
 * Non-destructive diagnostics. Existing catalogue records are never rewritten.
 * Returns errors and warnings so future catalogue edits can be checked safely.
 */
function validate(cards = getAll()) {
    const errors = [];
    const warnings = [];
    const seenIds = new Set();

    if (!Array.isArray(cards)) {
        return { valid: false, errors: ["Catalogue must be an array."], warnings };
    }

    cards.forEach((card, index) => {
        const label = `Card at index ${index}`;
        if (!card || typeof card !== "object" || Array.isArray(card)) {
            errors.push(`${label} must be an object.`);
            return;
        }
        if (typeof card.id !== "string" || !card.id.trim()) {
            errors.push(`${label} is missing a valid id.`);
        } else if (seenIds.has(card.id)) {
            errors.push(`Duplicate card id: ${card.id}.`);
        } else {
            seenIds.add(card.id);
        }
        if (typeof card.title !== "string" || !card.title.trim()) {
            errors.push(`${label} (${card.id || "unknown id"}) is missing a title.`);
        }
        if (card.grade && !VALID_GRADES.has(card.grade)) {
            warnings.push(`Unknown grade "${card.grade}" on ${card.id || label}.`);
        }
        if (card.cost !== undefined && (!Number.isFinite(Number(card.cost)) || Number(card.cost) < 0)) {
            errors.push(`Invalid cost on ${card.id || label}.`);
        }
        if (card.seasonReward === true && !card.season) {
            warnings.push(`Season reward ${card.id || label} has no season id.`);
        }
    });

    return { valid: errors.length === 0, errors, warnings };
}

export const cardCatalogue = Object.freeze({
    getAll,
    getById,
    getBySeason,
    getSeasonRewards,
    getMarketplaceCards,
    validate,
    validGrades: Object.freeze([...VALID_GRADES])
});
