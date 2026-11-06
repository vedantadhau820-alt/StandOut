/**
 * StandOut Notifications feature.
 *
 * Owns notification persistence, unread badge state, drawer rendering and
 * transient smart notifications. Legacy global names are exposed deliberately
 * because existing features and inline HTML handlers still call them.
 *
 * Existing persistence contract is unchanged:
 *   appNotifications: JSON array of { title, msg, time }
 *   lastNotifCount:   numeric string representing the read boundary
 */
export function initializeNotifications({ storage, dom }) {
    const local = storage.local;

    // The Notifications feature owns its state. Keep the established global
    // accessor as a compatibility surface for backup, restore, and older code.
    let notificationsState = [];
    try {
        const saved = local.getJSON("appNotifications", []);
        notificationsState = Array.isArray(saved) ? saved : [];
    } catch (error) {
        console.warn("[StandOut Notifications] Could not load saved notifications:", error);
    }

    Object.defineProperty(window, "appNotifications", {
        configurable: false,
        enumerable: true,
        get() {
            return notificationsState;
        },
        set(value) {
            notificationsState = Array.isArray(value) ? value : [];
        }
    });

    function getNotifications() {
        return Array.isArray(window.appNotifications)
            ? window.appNotifications
            : [];
    }

    function setNotifications(notifications) {
        window.appNotifications = Array.isArray(notifications) ? notifications : [];
    }

    function saveNotifications() {
        local.setJSON("appNotifications", getNotifications());
    }

    function updateNotificationBadge() {
        const badge = dom.byId("notifyBadge");
        if (!badge) return;

        const lastCount = parseInt(local.get("lastNotifCount"), 10) || 0;
        const unread = getNotifications().length - lastCount;

        if (unread <= 0) {
            badge.style.display = "none";
        } else {
            badge.style.display = "inline-block";
            badge.textContent = unread;
        }
    }

    function pushNotification(title, msg) {
        const notifications = getNotifications();
        notifications.unshift({
            title,
            msg,
            time: new Date().toLocaleString()
        });

        setNotifications(notifications);
        updateNotificationBadge();
        saveNotifications();
    }

    function renderNotifications() {
        const container = dom.byId("notificationList");
        if (!container) return;

        container.replaceChildren();
        const notifications = getNotifications();

        if (notifications.length === 0) {
            const empty = document.createElement("p");
            empty.style.opacity = "0.7";
            empty.style.textAlign = "center";
            empty.textContent = "No notifications";
            container.appendChild(empty);
            return;
        }

        notifications.forEach((notification) => {
            const card = document.createElement("div");
            card.className = "notification-card";

            const title = document.createElement("strong");
            title.textContent = notification.title ?? "";

            const message = document.createElement("span");
            message.textContent = notification.msg ?? "";

            const time = document.createElement("span");
            time.className = "notification-time";
            time.textContent = notification.time ?? "";

            card.append(title, document.createElement("br"), message, time);
            container.appendChild(card);
        });
    }

    function clearAllNotifications() {
        setNotifications([]);
        // Persist the empty state instead of removing the key. This prevents a
        // stale notification snapshot from being restored by another startup path.
        local.setJSON("appNotifications", []);
        local.set("lastNotifCount", "0");

        const list = dom.byId("notificationList");
        if (list) {
            const empty = document.createElement("p");
            empty.style.opacity = "0.6";
            empty.textContent = "No notifications";
            list.replaceChildren(empty);
        }

        const badge = dom.byId("notifyBadge");
        if (badge) {
            badge.style.display = "none";
            badge.textContent = "";
        }

        console.log("All notifications cleared.");
    }

    function showSmartNotification(title, message) {
        const popup = dom.byId("smartNotify");
        const titleElement = dom.byId("notifyTitle");
        const messageElement = dom.byId("notifyMsg");
        if (!popup || !titleElement || !messageElement) return;

        titleElement.innerText = title;
        messageElement.innerText = message;

        popup.style.display = "block";
        popup.style.opacity = 0;
        popup.style.transform = "translateY(-40px)";

        setTimeout(() => {
            popup.style.transition = "all 0.4s ease";
            popup.style.opacity = 1;
            popup.style.transform = "translateY(0)";
        }, 20);

        setTimeout(() => {
            popup.style.opacity = 0;
            popup.style.transform = "translateY(-40px)";
            setTimeout(() => {
                popup.style.display = "none";
            }, 400);
        }, 3000);
    }

    function bindDrawer() {
        const bell = dom.byId("notifyBell");
        const drawer = dom.byId("notificationDrawer");

        if (bell) {
            bell.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                if (!drawer) return;

                const isOpen = drawer.classList.contains("notification-open");
                if (!isOpen) {
                    renderNotifications();
                    drawer.classList.add("notification-open");

                    const badge = dom.byId("notifyBadge");
                    if (badge) {
                        badge.style.display = "none";
                        badge.textContent = "";
                    }

                    local.set("lastNotifCount", getNotifications().length);
                    updateNotificationBadge();
                    saveNotifications();
                } else {
                    drawer.classList.remove("notification-open");
                }
            });
        }

        // The drawer intentionally stops click propagation. Therefore the Clear
        // button must be handled here directly; document-level delegation cannot
        // receive its click while it is inside the drawer.
        const clearButton = drawer?.querySelector?.(".notification-clear-btn");
        if (clearButton) {
            clearButton.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                clearAllNotifications();
            });
        }

        if (drawer) {
            drawer.addEventListener("click", (event) => event.stopPropagation());
        }

        document.addEventListener("click", () => {
            if (drawer && drawer.style.display === "block") {
                drawer.style.display = "none";
            }
        });
    }

    // Keep the names used by existing classic scripts and inline HTML handlers.
    Object.assign(window, {
        saveNotifications,
        pushNotification,
        clearAllNotifications,
        updateNotificationBadge,
        renderNotifications,
        showSmartNotification
    });

    bindDrawer();
    window.addEventListener("load", updateNotificationBadge);

    return Object.freeze({
        save: saveNotifications,
        push: pushNotification,
        clear: clearAllNotifications,
        updateBadge: updateNotificationBadge,
        render: renderNotifications,
        show: showSmartNotification,
        getAll: getNotifications
    });
}
