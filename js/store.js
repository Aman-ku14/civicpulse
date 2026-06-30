/*
========================================================================
CIVICPULSE DATA STORAGE & SEED ENGINE
Manages local persistence and stores seed data for the Delhi demo.
========================================================================
*/

import { AuthManager } from './auth.js';
import { NotificationManager } from './notifications.js';

// --- Default Mock User Profile ---
const DEFAULT_USER = {
    id: 'user_active_citizen_1',
    name: 'Aarav Sharma',
    level: 'Watchdog',
    levelProgress: 65, // % progress to next level
    points: 340,
    rank: 12,
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
    streak: 4
};

// --- Delhi Landmarks / Neighborhood Coordinates ---
const NEIGHBORHOODS = {
    'Connaught Place': { lat: 28.6304, lng: 77.2177 },
    'Karol Bagh': { lat: 28.6443, lng: 77.1895 },
    'Chandni Chowk': { lat: 28.6562, lng: 77.2300 },
    'Saket': { lat: 28.5244, lng: 77.2066 },
    'Dwarka': { lat: 28.5921, lng: 77.0460 },
    'Vasant Kunj': { lat: 28.5461, lng: 77.1627 },
    'Lajpat Nagar': { lat: 28.5679, lng: 77.2435 },
    'Rohini': { lat: 28.7159, lng: 77.1140 },
    'Noida Sector 62': { lat: 28.6273, lng: 77.3725 },
    'Gurugram Phase 3': { lat: 28.4901, lng: 77.0898 }
};

// --- Mock Issue Descriptions & Templates ---
const ISSUE_TEMPLATES = [
    {
        category: 'Pothole',
        title: 'Deep Pothole near Outer Ring Road exit',
        desc: 'A large pothole has formed near the main flyover exit. It is posing a major danger to two-wheelers, especially at night when the streetlights are dim. Already saw two scooters slip.',
        severity: 'High',
        department: 'Delhi Public Works Department (PWD)'
    },
    {
        category: 'Water Leakage',
        title: 'Broken main pipeline leaking drinking water',
        desc: 'Thousands of liters of clean water are being wasted from a burst main line. The street is starting to flood, causing muddy water logs and blockages.',
        severity: 'Critical',
        department: 'Delhi Jal Board (DJB)'
    },
    {
        category: 'Streetlight',
        title: 'Entire row of streetlights non-functional',
        desc: 'Five consecutive streetlights are out of order. The block is completely dark, causing safety concerns for women and elderly residents returning home after work.',
        severity: 'Medium',
        department: 'Municipal Corporation of Delhi (MCD)'
    },
    {
        category: 'Waste/Garbage',
        title: 'Unattended plastic waste and garbage pile-up',
        desc: 'The commercial market dumpster is overflowing and garbage has spilled onto the road. Stray animals are scattered around it, and it smells terrible.',
        severity: 'Medium',
        department: 'Municipal Corporation of Delhi (MCD)'
    },
    {
        category: 'Road Damage',
        title: 'Cracked asphalt and loose gravel on interior lane',
        desc: 'The internal sector road was dug up for cable lines last month and left un-carpeted. Loose gravel is flying, causing windshield damage and slipping risks.',
        severity: 'Low',
        department: 'PWD Road Division'
    },
    {
        category: 'Drainage',
        title: 'Clogged sewer causing black sewage backflow',
        desc: 'The storm-water drain is completely choked with plastic packets. Sewage water has overflowed into the residential compound gateway.',
        severity: 'High',
        department: 'Delhi Jal Board (DJB)'
    },
    {
        category: 'Public Property',
        title: 'Damaged benches and swing set in public park',
        desc: 'The children’s swing is rusted and broken, and three concrete benches are cracked and unusable. Need repair so kids can play safely.',
        severity: 'Low',
        department: 'MCD Horticulture Dept'
    },
    {
        category: 'Noise',
        title: 'Construction machinery operating past midnight',
        desc: 'Heavy concrete mixer running at 1 AM in a residential street. The noise level exceeds permissible limits, disrupting sleep for children and patients.',
        severity: 'Medium',
        department: 'Delhi Pollution Control Committee (DPCC)'
    },
    {
        category: 'Illegal Construction',
        title: 'Encroachment of public footpath by local shop',
        desc: 'A permanent metal shelter is being built directly blocking the pavement, forcing pedestrians to walk on the busy high-speed road.',
        severity: 'High',
        department: 'MCD Encroachment Wing'
    }
];

// Returns relative paths to the generated realistic images
export function getMockImagePath(category) {
    const mapping = {
        'Pothole': 'assets/images/pothole.png',
        'Water Leakage': 'assets/images/water_leak.png',
        'Streetlight': 'assets/images/streetlight.png',
        'Waste/Garbage': 'assets/images/garbage.png',
        'Road Damage': 'assets/images/pothole.png',
        'Drainage': 'assets/images/water_leak.png',
        'Public Property': 'assets/images/construction.png',
        'Noise': 'assets/images/streetlight.png',
        'Illegal Construction': 'assets/images/construction.png'
    };
    return mapping[category] || 'assets/images/pothole.png';
}

// Generate 50+ realistic issues in Delhi
function generateSeedIssues() {
    const list = [];
    const statuses = ['Reported', 'Verified', 'In Progress', 'Resolved'];
    const names = ['Amit Patel', 'Priya Iyer', 'Rohan Gupta', 'Neha Singh', 'Sunil Kumar', 'Anjali Rao', 'Vikram Malhotra', 'Siddharth Sen', 'Meera Joshi', 'Karan Khanna'];
    
    // Create base distribution
    for (let i = 1; i <= 52; i++) {
        // Randomly select neighborhood & template
        const nNames = Object.keys(NEIGHBORHOODS);
        const neighborhoodName = nNames[i % nNames.length];
        const centerCoords = NEIGHBORHOODS[neighborhoodName];
        
        // Add random scatter of ~1.5km
        const lat = centerCoords.lat + (Math.random() - 0.5) * 0.025;
        const lng = centerCoords.lng + (Math.random() - 0.5) * 0.025;
        
        const template = ISSUE_TEMPLATES[i % ISSUE_TEMPLATES.length];
        const status = statuses[i % statuses.length];
        
        // Setup reporter and timestamps (spread over 12 months)
        const reporter = names[i % names.length];
        const monthsAgo = Math.floor(Math.random() * 11);
        const daysAgo = Math.floor(Math.random() * 28);
        const reportedDate = new Date();
        reportedDate.setMonth(reportedDate.getMonth() - monthsAgo);
        reportedDate.setDate(reportedDate.getDate() - daysAgo);
        
        // Set dates
        const verifiedDate = new Date(reportedDate.getTime() + 1000 * 60 * 60 * 24 * (1 + Math.random() * 2));
        const progressDate = new Date(verifiedDate.getTime() + 1000 * 60 * 60 * 24 * (2 + Math.random() * 4));
        const resolvedDate = new Date(progressDate.getTime() + 1000 * 60 * 60 * 24 * (3 + Math.random() * 5));

        const votes = Math.floor(Math.random() * 45) + 3;
        const verifications = Math.floor(votes * 0.6) + 1;
        
        const timeline = [
            {
                status: 'Reported',
                timestamp: reportedDate.toISOString(),
                note: `Issue reported by citizen ${reporter}. Categorized by AI.`,
                actor: reporter
            }
        ];
        
        if (status === 'Verified' || status === 'In Progress' || status === 'Resolved') {
            timeline.push({
                status: 'Verified',
                timestamp: verifiedDate.toISOString(),
                note: `Report verified by ${verifications} community members via geo-proximity.`,
                actor: 'CivicPulse Community'
            });
        }
        
        if (status === 'In Progress' || status === 'Resolved') {
            timeline.push({
                status: 'In Progress',
                timestamp: progressDate.toISOString(),
                note: `Authority acknowledged. Work order issued to field team.`,
                actor: template.department
            });
        }
        
        if (status === 'Resolved') {
            timeline.push({
                status: 'Resolved',
                timestamp: resolvedDate.toISOString(),
                note: `Issue resolved. Asphalt laid / pipeline welded. Photo proof approved.`,
                actor: template.department
            });
        }

        // Add mock comments
        const comments = [];
        if (i % 3 === 0) {
            comments.push({
                id: 'comment_' + i + '_1',
                user: names[(i + 2) % names.length],
                text: 'Drove past this lane today. It is indeed extremely unsafe, watch out!',
                timestamp: new Date(reportedDate.getTime() + 3600000 * 4).toISOString()
            });
        }
        if (i % 3 === 0 && status === 'Resolved') {
            comments.push({
                id: 'comment_' + i + '_2',
                user: reporter,
                text: 'Thank you PWD team for taking action so quickly! The stretch is clear now.',
                timestamp: new Date(resolvedDate.getTime() + 3600000 * 2).toISOString()
            });
        }

        list.push({
            id: 'issue_seed_' + i,
            title: `${template.category} - ${template.title}`,
            description: template.desc,
            category: template.category,
            status: status,
            severity: template.severity,
            location: {
                lat: lat,
                lng: lng,
                address: `${Math.floor(Math.random() * 200) + 1}, Block ${String.fromCharCode(65 + (i % 6))}, ${neighborhoodName}, Delhi`
            },
            reporterName: reporter,
            reporterId: 'user_seed_' + (i % 10),
            reportedAt: reportedDate.toISOString(),
            upvotes: votes,
            verifications: verifications,
            department: template.department,
            imageUrl: getMockImagePath(template.category),
            comments: comments,
            timeline: timeline
        });
    }
    
    return list;
}

// --- Leaderboard Mock Data ---
const LEADERBOARD_SEED = [
    { rank: 1, name: 'Ananya Deshmukh', points: 720, level: 'Guardian', avatarChar: 'A', badges: ['🔍', '✅', '🛡️', '🏆'] },
    { rank: 2, name: 'Kabir Malhotra', points: 680, level: 'Guardian', avatarChar: 'K', badges: ['🔍', '✅', '🏆'] },
    { rank: 3, name: 'Rohit Verma', points: 510, level: 'Watchdog', avatarChar: 'R', badges: ['🔍', '✅', '🔥'] },
    { rank: 4, name: 'Meera Nair', points: 430, level: 'Watchdog', avatarChar: 'M', badges: ['🔍', '✅'] },
    { rank: 5, name: 'Vikram Joshi', points: 390, level: 'Watchdog', avatarChar: 'V', badges: ['🔍', '🔥'] },
    { rank: 6, name: 'Aarav Sharma', points: 340, level: 'Watchdog', avatarChar: 'A', badges: ['🔍', '✅', '🔥'] }, // Active User
    { rank: 7, name: 'Neha Chawla', points: 280, level: 'Citizen', avatarChar: 'N', badges: ['🔍'] },
    { rank: 8, name: 'Siddharth Roy', points: 245, level: 'Citizen', avatarChar: 'S', badges: ['🔍'] },
    { rank: 9, name: 'Pooja Hegde', points: 190, level: 'Citizen', avatarChar: 'P', badges: ['✅'] },
    { rank: 10, name: 'Aditya Das', points: 110, level: 'Citizen', avatarChar: 'A', badges: ['🔍'] }
];

// --- CivicPulse Store Management ---
class CivicPulseStore {
    constructor() {
        this.issuesKey = 'civicpulse_issues';
        this.userKey = 'civicpulse_user';
        this.leaderboardKey = 'civicpulse_leaderboard';
        
        this.listeners = [];
        this.init();
    }

    init() {
        try {
            // Initialize Issues Store
            if (!localStorage.getItem(this.issuesKey)) {
                const seedIssues = generateSeedIssues();
                localStorage.setItem(this.issuesKey, JSON.stringify(seedIssues));
            }

            // Initialize Active User (only if no auth session already set)
            if (!localStorage.getItem(this.userKey)) {
                localStorage.setItem(this.userKey, JSON.stringify(DEFAULT_USER));
            }

            // Initialize Leaderboard
            if (!localStorage.getItem(this.leaderboardKey)) {
                localStorage.setItem(this.leaderboardKey, JSON.stringify(LEADERBOARD_SEED));
            }
        } catch (e) {
            console.error('CivicPulse: localStorage init failed', e);
        }
    }

    // Subscribe to state updates
    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    notify() {
        this.listeners.forEach(callback => callback());
    }

    // --- User Operations ---
    getUser() {
        try {
            return JSON.parse(localStorage.getItem(this.userKey));
        } catch (e) {
            console.error('CivicPulse: Failed to parse user from localStorage', e);
            return null;
        }
    }

    saveUser(user) {
        localStorage.setItem(this.userKey, JSON.stringify(user));
        
        // Sync to multi-user database
        AuthManager.syncUserFromStore(user);
        
        // Update user inside leaderboard list (match by id, not name)
        const leaderboard = this.getLeaderboard();
        const idx = leaderboard.findIndex(item => item.id === user.id || item.name === user.name);
        if (idx !== -1) {
            leaderboard[idx].points = user.points;
            leaderboard[idx].level = user.level;
            // Map unlock badges to emojis for leaderboard display
            leaderboard[idx].badges = user.badges.filter(b => b.unlocked).map(b => b.name.split(' ')[0]);
            
            // Sort leaderboard
            leaderboard.sort((a, b) => b.points - a.points);
            leaderboard.forEach((item, index) => {
                item.rank = index + 1;
            });
            localStorage.setItem(this.leaderboardKey, JSON.stringify(leaderboard));
        }
        
        this.notify();
    }

    awardPoints(amount, actionDesc) {
        const user = this.getUser();
        user.points += amount;
        
        // Update level progress calculations
        const pointsPerLevel = 150;
        const currentLvlNum = Math.floor(user.points / pointsPerLevel) + 1;
        const remainder = user.points % pointsPerLevel;
        user.levelProgress = Math.floor((remainder / pointsPerLevel) * 100);
        
        // Upgrade check
        const levels = ['Citizen', 'Watchdog', 'Guardian', 'Champion', 'Legend'];
        const targetLvl = levels[Math.min(currentLvlNum - 1, levels.length - 1)];
        if (user.level !== targetLvl) {
            user.level = targetLvl;
        }

        // Update action contribution counts
        if (actionDesc.includes('Report')) user.contributions[0].count++;
        if (actionDesc.includes('Verify')) user.contributions[1].count++;
        if (actionDesc.includes('Comment')) user.contributions[2].count++;

        this.saveUser(user);
        return {
            pointsGained: amount,
            currentTotal: user.points,
            levelUp: user.level
        };
    }

    // --- Issues Operations ---
    getIssues() {
        try {
            return JSON.parse(localStorage.getItem(this.issuesKey)) || [];
        } catch (e) {
            console.error('CivicPulse: Failed to parse issues from localStorage', e);
            return [];
        }
    }

    getIssueById(id) {
        return this.getIssues().find(issue => issue.id === id);
    }

    saveIssue(newOrUpdatedIssue) {
        const issues = this.getIssues();
        const index = issues.findIndex(issue => issue.id === newOrUpdatedIssue.id);
        
        let isNew = false;
        if (index !== -1) {
            issues[index] = newOrUpdatedIssue;
        } else {
            issues.unshift(newOrUpdatedIssue); // Put newest reports first
            isNew = true;
        }
        
        localStorage.setItem(this.issuesKey, JSON.stringify(issues));
        
        if (isNew) {
            NotificationManager.addNotification(
                'success',
                'Issue Reported successfully',
                `Your report "${newOrUpdatedIssue.title}" has been submitted and is pending verification.`,
                `#issue?id=${newOrUpdatedIssue.id}`
            );
        }
        
        this.notify();
    }

    addIssueComment(issueId, text) {
        const user = this.getUser();
        const issue = this.getIssueById(issueId);
        if (!issue) return;

        const newComment = {
            id: 'comment_' + Math.random().toString(36).slice(2, 7),
            user: user.name,
            text: text,
            timestamp: new Date().toISOString()
        };

        issue.comments.push(newComment);
        this.saveIssue(issue);
        
        // Award points
        this.awardPoints(2, `Commented on issue ${issue.title}`);
        return newComment;
    }

    upvoteIssue(issueId) {
        const issue = this.getIssueById(issueId);
        if (!issue) return;

        // Prevent duplicate votes per session (stored as a Set in sessionStorage)
        const votedKey = 'civicpulse_voted';
        const voted = new Set(JSON.parse(sessionStorage.getItem(votedKey) || '[]'));
        if (voted.has(issueId)) return issue.upvotes; // already voted
        voted.add(issueId);
        sessionStorage.setItem(votedKey, JSON.stringify([...voted]));

        issue.upvotes += 1;
        this.saveIssue(issue);
        return issue.upvotes;
    }

    verifyIssue(issueId) {
        const issue = this.getIssueById(issueId);
        if (!issue) return;

        // Prevent duplicate verifications per session
        const verifiedKey = 'civicpulse_verified';
        const verified = new Set(JSON.parse(sessionStorage.getItem(verifiedKey) || '[]'));
        if (verified.has(issueId)) return { verifications: issue.verifications, status: issue.status, pointsGained: 0, alreadyVerified: true };
        verified.add(issueId);
        sessionStorage.setItem(verifiedKey, JSON.stringify([...verified]));

        issue.verifications += 1;
        
        // If verifications cross threshold, status pushes to "Verified"
        if (issue.status === 'Reported' && issue.verifications >= 5) {
            issue.status = 'Verified';
            issue.timeline.push({
                status: 'Verified',
                timestamp: new Date().toISOString(),
                note: `Community verification quota achieved. Forwarding report status to authority.`,
                actor: 'CivicPulse Auto Router'
            });
        }
        
        this.saveIssue(issue);
        
        // Award points
        const pointsResult = this.awardPoints(5, `Verified issue ${issue.title}`);
        return {
            verifications: issue.verifications,
            status: issue.status,
            pointsGained: pointsResult.pointsGained
        };
    }

    // --- Leaderboard Operations ---
    getLeaderboard() {
        return JSON.parse(localStorage.getItem(this.leaderboardKey)) || [];
    }
}

export const store = new CivicPulseStore();
export const NEIGHBORHOOD_COORDS = NEIGHBORHOODS;
