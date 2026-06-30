/*
========================================================================
CIVICPULSE AUTHENTICATION MANAGER
Manages user profiles, signup, login, and localStorage session management.
========================================================================
*/

const USERS_KEY = 'civicpulse_users';
const SESSION_KEY = 'civicpulse_session'; // stores active user ID
const CURRENT_USER_KEY = 'civicpulse_user'; // synchronized with store.js

// Simple synchronous string hashing for demo purposes
function hashPassword(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash &= hash; // Convert to 32bit integer
    }
    return 'cp_' + Math.abs(hash).toString(16);
}

const DEFAULT_DEMO_USER = {
    id: 'user_active_citizen_1',
    name: 'Aarav Sharma',
    email: 'aarav@civicpulse.org',
    passwordHash: hashPassword('password123'),
    level: 'Watchdog',
    levelProgress: 65,
    points: 340,
    rank: 6, // Updated to match actual seed rank
    joinDate: '2026-01-15T10:30:00Z',
    avatarChar: 'A',
    contributions: [
        { type: 'report', count: 12 },
        { type: 'verify', count: 28 },
        { type: 'comment', count: 15 }
    ],
    badges: [
        { id: 'first_report', name: '🔍 First Watch', desc: 'Reported your first community issue', unlocked: true, date: '2026-01-16T12:00:00Z' },
        { id: 'verifier', name: '✅ Civic Eye', desc: 'Verified 10 or more community reports', unlocked: true, date: '2026-02-10T15:45:00Z' },
        { id: 'streak', name: '🔥 Dedicated', desc: 'Maintained a 7-day daily activity streak', unlocked: true, date: '2026-03-01T09:00:00Z' },
        { id: 'solver', name: '🏆 Clean Street', desc: 'Had 5 reported issues resolved by authority', unlocked: false, date: null }
    ],
    streak: 4,
    isAdmin: false
};

const DEFAULT_DEMO_ADMIN = {
    id: 'user_admin_1',
    name: 'System Admin',
    email: 'admin@civicpulse.org',
    passwordHash: hashPassword('admin123'),
    level: 'Administrator',
    levelProgress: 100,
    points: 9999,
    rank: 1,
    joinDate: '2025-01-01T00:00:00Z',
    avatarChar: '⚙️',
    contributions: [],
    badges: [],
    streak: 0,
    isAdmin: true
};

export class AuthManager {
    static init() {
        // Initialize users collection if empty
        let users = [];
        if (!localStorage.getItem(USERS_KEY)) {
            users = [DEFAULT_DEMO_USER, DEFAULT_DEMO_ADMIN];
            localStorage.setItem(USERS_KEY, JSON.stringify(users));
        } else {
            // Migration: Ensure admin exists in existing sessions
            users = JSON.parse(localStorage.getItem(USERS_KEY));
            if (!users.find(u => u.email === 'admin@civicpulse.org')) {
                users.push(DEFAULT_DEMO_ADMIN);
                localStorage.setItem(USERS_KEY, JSON.stringify(users));
            }
        }

    }

    static getUsers() {
        return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    }

    static saveUsers(users) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    static getCurrentUser() {
        const session = localStorage.getItem(SESSION_KEY);
        if (!session) return null;
        
        const users = this.getUsers();
        return users.find(u => u.id === session) || null;
    }

    static isLoggedIn() {
        return this.getCurrentUser() !== null;
    }

    static setSession(user) {
        localStorage.setItem(SESSION_KEY, user.id);
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    }

    static signup(name, email, password) {
        const users = this.getUsers();
        
        // Check if email already exists
        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
            throw new Error('An account with this email already exists.');
        }

        const newUser = {
            id: 'user_' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36),
            name: name,
            email: email.toLowerCase(),
            passwordHash: hashPassword(password),
            level: 'Citizen',
            levelProgress: 0,
            points: 0,
            rank: users.length + 1,
            joinDate: new Date().toISOString(),
            avatarChar: name.charAt(0).toUpperCase(),
            contributions: [
                { type: 'report', count: 0 },
                { type: 'verify', count: 0 },
                { type: 'comment', count: 0 }
            ],
            badges: [
                { id: 'first_report', name: '🔍 First Watch', desc: 'Reported your first community issue', unlocked: false, date: null },
                { id: 'verifier', name: '✅ Civic Eye', desc: 'Verified 10 or more community reports', unlocked: false, date: null },
                { id: 'streak', name: '🔥 Dedicated', desc: 'Maintained a 7-day daily activity streak', unlocked: false, date: null },
                { id: 'solver', name: '🏆 Clean Street', desc: 'Had 5 reported issues resolved by authority', unlocked: false, date: null }
            ],
            streak: 0
        };

        users.push(newUser);
        this.saveUsers(users);
        this.setSession(newUser);
        
        // Add to leaderboard seed in store if not present
        this.syncLeaderboard(newUser);
        
        return newUser;
    }

    static login(email, password) {
        const users = this.getUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (!user || user.passwordHash !== hashPassword(password)) {
            throw new Error('Invalid email or password.');
        }

        this.setSession(user);
        return user;
    }

    static logout() {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(CURRENT_USER_KEY);
        // Dispatch a custom event so app.js can react without a full page reload
        // (a reload would immediately re-trigger init() and auto-login the demo user)
        window.dispatchEvent(new CustomEvent('civicpulse:logout'));
    }

    // Sync store's user changes back to the users DB
    static syncUserFromStore(updatedUser) {
        const users = this.getUsers();
        const idx = users.findIndex(u => u.id === updatedUser.id);
        if (idx !== -1) {
            users[idx] = { ...users[idx], ...updatedUser };
            this.saveUsers(users);
        }
    }

    static syncLeaderboard(user) {
        const leaderboardKey = 'civicpulse_leaderboard';
        let leaderboard = JSON.parse(localStorage.getItem(leaderboardKey)) || [];
        
        // Add if not present (match by id to avoid name collision)
        if (!leaderboard.some(item => item.id === user.id)) {
            leaderboard.push({
                id: user.id,
                rank: leaderboard.length + 1,
                name: user.name,
                points: user.points,
                level: user.level,
                avatarChar: user.avatarChar,
                badges: []
            });
            localStorage.setItem(leaderboardKey, JSON.stringify(leaderboard));
        }
    }
}

// Initialize Auth on script load
AuthManager.init();
