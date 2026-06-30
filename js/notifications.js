import { generateUUID } from './utils.js';

const NOTIFICATIONS_KEY = 'civicpulse_notifications';

export class NotificationManager {
    static getNotifications() {
        try {
            const data = localStorage.getItem(NOTIFICATIONS_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    static saveNotifications(notifications) {
        localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
        // Dispatch event for UI updates
        window.dispatchEvent(new CustomEvent('civicpulse:notifications_updated'));
    }

    static addNotification(type, title, message, link = null) {
        const notifications = this.getNotifications();
        const notif = {
            id: generateUUID(),
            type, // 'info', 'success', 'warning', 'error'
            title,
            message,
            link,
            read: false,
            timestamp: new Date().toISOString()
        };
        notifications.unshift(notif); // Add to beginning
        this.saveNotifications(notifications);
    }

    static getUnreadCount() {
        return this.getNotifications().filter(n => !n.read).length;
    }

    static markAllRead() {
        const notifications = this.getNotifications();
        let changed = false;
        notifications.forEach(n => {
            if (!n.read) {
                n.read = true;
                changed = true;
            }
        });
        if (changed) this.saveNotifications(notifications);
    }

    static markAsRead(id) {
        const notifications = this.getNotifications();
        const notif = notifications.find(n => n.id === id);
        if (notif && !notif.read) {
            notif.read = true;
            this.saveNotifications(notifications);
        }
    }
}
