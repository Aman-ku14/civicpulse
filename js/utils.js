/*
========================================================================
CIVICPULSE SHARED UTILITIES
========================================================================
*/

/**
 * Calculates distance between two points using the Haversine formula
 * @param {number} lat1 Latitude of point 1
 * @param {number} lon1 Longitude of point 1
 * @param {number} lat2 Latitude of point 2
 * @param {number} lon2 Longitude of point 2
 * @returns {number} Distance in meters
 */
export function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) *
        Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in meters
}

/**
 * Generates a random alphanumeric ID
 * @returns {string} Unique ID
 */
export function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback for older browsers
    return 'issue_' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

/**
 * Formats a Date object or string into a relative timeline description
 * @param {Date|string} dateVal The timestamp to format
 * @returns {string} Relative time string (e.g., "3 hours ago")
 */
export function formatRelativeTime(dateVal) {
    if (!dateVal) return 'Unknown';
    const date = new Date(dateVal);
    if (isNaN(date.getTime())) return 'Unknown';
    const now = new Date();
    const diffMs = now - date;
    if (diffMs < 0) return 'Just now'; // future date guard
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

/**
 * Formats a date value cleanly for human reading
 * @param {Date|string} dateVal Date value
 * @returns {string} Formatted string
 */
export function formatFriendlyDate(dateVal) {
    return new Date(dateVal).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Creates custom color templates based on the issue category for Leaflet map markers
 * @param {string} category The issue category
 * @returns {string} Hex color code
 */
export function getCategoryColor(category) {
    const mapping = {
        'Pothole': '#ef4444',        /* Red */
        'Water Leakage': '#06b6d4',  /* Cyan */
        'Streetlight': '#f59e0b',    /* Amber */
        'Waste/Garbage': '#a855f7',  /* Purple */
        'Road Damage': '#f97316',    /* Orange */
        'Drainage': '#3b82f6',       /* Blue */
        'Public Property': '#10b981',/* Emerald */
        'Noise': '#ec4899',          /* Pink */
        'Illegal Construction': '#b91c1c', /* Dark Red */
        'Other': '#64748b'           /* Slate */
    };
    return mapping[category] || '#6366f1';
}

/**
 * Returns a Lucide icon identifier string for a category
 * @param {string} category The category
 * @returns {string} Icon identifier
 */
export function getCategoryIconName(category) {
    const mapping = {
        'Pothole': 'alert-triangle',
        'Water Leakage': 'droplet',
        'Streetlight': 'lightbulb',
        'Waste/Garbage': 'trash-2',
        'Road Damage': 'shield-alert',
        'Drainage': 'wind',
        'Public Property': 'landmark',
        'Noise': 'volume-x',
        'Illegal Construction': 'construction',
        'Other': 'help-circle'
    };
    return mapping[category] || 'alert-circle';
}

/**
 * Custom alert trigger that renders animated notification toasts
 * @param {string} message Text to display
 * @param {'success'|'error'|'info'|'warning'} type Notification type
 */
export function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Choose icon based on type
    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    if (type === 'error') iconName = 'x-circle';
    if (type === 'warning') iconName = 'alert-triangle';

    // Build toast using DOM APIs to prevent XSS from message content
    const icon = document.createElement('i');
    icon.setAttribute('data-lucide', iconName);

    const msgDiv = document.createElement('div');
    msgDiv.className = 'toast-message';
    msgDiv.textContent = message; // textContent prevents XSS

    toast.appendChild(icon);
    toast.appendChild(msgDiv);
    container.appendChild(toast);

    // Render only the new toast's icon
    if (window.lucide) {
        window.lucide.createIcons({
            attrs: { class: 'lucide-icon-toast' },
            nameAttr: 'data-lucide',
            nodes: [icon]
        });
    }

    // Auto-remove toast after 4s with fallback timeout
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s reverse forwards';
        // Fallback: force-remove after 400ms in case animationend doesn't fire
        const fallback = setTimeout(() => toast.remove(), 400);
        toast.addEventListener('animationend', () => {
            clearTimeout(fallback);
            toast.remove();
        });
    }, 4000);
}

/**
 * Simulates a delay (e.g. for network mock)
 * @param {number} ms Milliseconds
 * @returns {Promise<void>}
 */
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
