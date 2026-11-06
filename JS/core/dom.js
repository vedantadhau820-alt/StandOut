/**
 * Minimal DOM helpers for new feature modules.
 * These helpers do not replace or alter the existing global DOM APIs.
 */
export const dom = Object.freeze({
    byId(id, scope = document) {
        return scope.getElementById(id);
    },

    one(selector, scope = document) {
        return scope.querySelector(selector);
    },

    all(selector, scope = document) {
        return Array.from(scope.querySelectorAll(selector));
    },

    on(element, eventName, handler, options = undefined) {
        if (!element) {
            throw new TypeError(`Cannot bind "${eventName}" to a missing element.`);
        }

        element.addEventListener(eventName, handler, options);
        return () => element.removeEventListener(eventName, handler, options);
    }
});
