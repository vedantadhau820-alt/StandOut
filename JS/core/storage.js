/**
 * StandOut storage compatibility layer.
 *
 * This layer deliberately preserves the application's existing storage formats:
 * - LocalStorage values remain raw strings unless a caller explicitly uses JSON helpers.
 * - Existing IndexedDB database/store names and schemas are not changed.
 * - Cache API names and cache contents are not changed.
 *
 * New modules should depend on this adapter instead of accessing browser storage
 * directly. Legacy scripts remain untouched during the compatibility phase.
 */

const assertKey = (key) => {
    if (key === undefined || key === null || String(key).length === 0) {
        throw new TypeError("A non-empty storage key is required.");
    }
    return String(key);
};

const getRaw = (key) => window.localStorage.getItem(assertKey(key));
const setRaw = (key, value) => window.localStorage.setItem(assertKey(key), String(value));
const removeRaw = (key) => window.localStorage.removeItem(assertKey(key));

const getLocalKeys = () => {
    const keys = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
        const key = window.localStorage.key(index);
        if (key !== null) keys.push(key);
    }
    return keys;
};

export const localStore = Object.freeze({
    get: getRaw,
    set: setRaw,
    remove: removeRaw,

    has(key) {
        return getRaw(key) !== null;
    },

    keys: getLocalKeys,

    entries() {
        return getLocalKeys().map((key) => [key, getRaw(key)]);
    },

    getJSON(key, fallback = null) {
        const raw = getRaw(key);
        if (raw === null) return fallback;

        try {
            return JSON.parse(raw);
        } catch (error) {
            console.warn(`[StandOut storage] Invalid JSON at key "${key}".`, error);
            return fallback;
        }
    },

    setJSON(key, value) {
        setRaw(key, JSON.stringify(value));
    }
});

/**
 * Opens an existing IndexedDB database without changing its schema.
 * The upgrade callback is optional and should only be supplied by the feature
 * that owns a new database. Existing StandOut databases should not be upgraded
 * as part of the compatibility foundation.
 */
export function openDatabase(name, version, onUpgrade) {
    if (!("indexedDB" in window)) {
        return Promise.reject(new Error("IndexedDB is not available in this browser."));
    }

    return new Promise((resolve, reject) => {
        const request = version === undefined
            ? window.indexedDB.open(name)
            : window.indexedDB.open(name, version);

        request.onupgradeneeded = (event) => {
            if (typeof onUpgrade === "function") {
                onUpgrade(request.result, event.oldVersion, event.newVersion, request.transaction);
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error(`Unable to open IndexedDB database "${name}".`));
        request.onblocked = () => reject(new Error(`Opening IndexedDB database "${name}" was blocked.`));
    });
}

/**
 * Runs one IndexedDB request and resolves with its result.
 * The caller owns transaction lifetime and database connection lifecycle.
 */
export function runStoreRequest(database, storeName, mode, operation) {
    return new Promise((resolve, reject) => {
        let transaction;

        try {
            transaction = database.transaction(storeName, mode);
            const store = transaction.objectStore(storeName);
            const request = operation(store);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error || new Error("IndexedDB request failed."));
            transaction.onabort = () => reject(transaction.error || new Error("IndexedDB transaction aborted."));
        } catch (error) {
            reject(error);
        }
    });
}

const openCache = async (name) => {
    if (!("caches" in window)) {
        throw new Error("Cache API is not available in this browser.");
    }
    return window.caches.open(name);
};

export const cacheStore = Object.freeze({
    open: openCache,

    async match(cacheName, request) {
        const cache = await openCache(cacheName);
        return cache.match(request);
    },

    async put(cacheName, request, response) {
        const cache = await openCache(cacheName);
        return cache.put(request, response);
    },

    async delete(cacheName, request) {
        const cache = await openCache(cacheName);
        return cache.delete(request);
    }
});

export const storage = Object.freeze({
    local: localStore,
    indexedDB: Object.freeze({
        open: openDatabase,
        request: runStoreRequest
    }),
    cache: cacheStore
});
