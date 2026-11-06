/**
 * Small application event bus for communication between feature modules.
 * Event names are namespaced (for example: "mission:completed").
 */
const target = new EventTarget();

export const events = Object.freeze({
    emit(name, detail = undefined) {
        target.dispatchEvent(new CustomEvent(name, { detail }));
    },

    on(name, listener, options = undefined) {
        if (typeof listener !== "function") {
            throw new TypeError("Event listener must be a function.");
        }

        target.addEventListener(name, listener, options);
        return () => target.removeEventListener(name, listener, options);
    },

    once(name, listener) {
        return this.on(name, listener, { once: true });
    }
});
