/**
 * Canonical Momentum persistence helpers.
 * Supports historical IST date keys written as YYYY-MM-DD and MM/DD/YYYY.
 */
function isRecord(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function normalizeMomentumDateKey(value) {
    if (typeof value !== "string" || !value.trim()) return null;
    const input = value.trim();
    let year;
    let month;
    let day;

    let match = input.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (match) {
        [, year, month, day] = match;
    } else {
        match = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (!match) return null;
        [, month, day, year] = match;
    }

    const y = Number(year);
    const m = Number(month);
    const d = Number(day);
    const date = new Date(Date.UTC(y, m - 1, d));
    if (
        !Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d) ||
        date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d
    ) return null;

    return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function normalizeMomentumState(value) {
    if (!isRecord(value)) throw new TypeError("Momentum state must be a JSON object.");
    const nonNegativeInteger = (input, fallback = 0) => {
        const number = Number(input);
        return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : fallback;
    };
    const energyNumber = Number(value.energy);

    return {
        ...value,
        version: Number.isInteger(Number(value.version)) ? Number(value.version) : 1,
        momentum: nonNegativeInteger(value.momentum),
        energy: Number.isFinite(energyNumber) ? Math.min(100, Math.max(0, energyNumber)) : 100,
        bestMomentum: nonNegativeInteger(value.bestMomentum),
        shields: nonNegativeInteger(value.shields),
        lastProofDate: normalizeMomentumDateKey(value.lastProofDate),
        lastCheckDate: normalizeMomentumDateKey(value.lastCheckDate),
        totalProofDays: nonNegativeInteger(value.totalProofDays)
    };
}

export function normalizeMomentumHistory(value) {
    if (!isRecord(value)) throw new TypeError("Momentum history must be a JSON object.");
    const normalized = {};

    for (const [rawDate, rawEntry] of Object.entries(value)) {
        const date = normalizeMomentumDateKey(rawDate);
        if (!date || !isRecord(rawEntry)) continue;

        const momentumNumber = Number(rawEntry.momentum);
        if (!Number.isFinite(momentumNumber) || momentumNumber < 0) continue;

        const energyNumber = Number(rawEntry.energy);
        const entry = {
            ...rawEntry,
            momentum: Math.floor(momentumNumber),
            energy: rawEntry.energy === null || rawEntry.energy === undefined || !Number.isFinite(energyNumber)
                ? null
                : Math.min(100, Math.max(0, energyNumber))
        };

        const previous = normalized[date];
        // Mixed legacy date formats can produce duplicate days. Keep the
        // highest recorded Momentum value; for ties prefer known Energy.
        if (
            !previous ||
            entry.momentum > previous.momentum ||
            (entry.momentum === previous.momentum && previous.energy === null && entry.energy !== null)
        ) {
            normalized[date] = entry;
        }
    }

    return Object.fromEntries(
        Object.entries(normalized).sort(([a], [b]) => a.localeCompare(b))
    );
}

export function normalizeMomentumStorageValue(key, rawValue) {
    if (key !== "standout_momentum_state" && key !== "standout_momentum_history") {
        return rawValue;
    }
    let parsed;
    try {
        parsed = JSON.parse(rawValue);
    } catch {
        throw new TypeError(`The backup contains invalid JSON for ${key}.`);
    }
    const normalized = key === "standout_momentum_state"
        ? normalizeMomentumState(parsed)
        : normalizeMomentumHistory(parsed);
    return JSON.stringify(normalized);
}
