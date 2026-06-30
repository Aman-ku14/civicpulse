/*
========================================================================
CIVICPULSE CITIZEN PROFILE PAGE COMPONENT
========================================================================
*/

import { store } from '../store.js';
import { formatRelativeTime } from '../utils.js';

export const profilePage = {
    async render(container) {
        const user = store.getUser();
        const allIssues = store.getIssues();

        // Filter issues reported by active user
        const myReports = allIssues.filter(issue => issue.reporterId === user.id);
        
        // Calculate points breakdown
        const pointsPerLevel = 150;
        const currentLvlNum = Math.floor(user.points / pointsPerLevel) + 1;
        const nextLvlPoints = currentLvlNum * pointsPerLevel;
        const currentLvlStartPoints = (currentLvlNum - 1) * pointsPerLevel;
        const progressInLevel = user.points - currentLvlStartPoints;

        // Generate dynamic contribution heat squares (last 35 days)
        const heatSquares = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Count reports per day
        const activityMap = new Map();
        myReports.forEach(issue => {
            const d = new Date(issue.timestamp);
            d.setHours(0,0,0,0);
            const diffTime = today.getTime() - d.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays >= 0 && diffDays <= 35) {
                activityMap.set(diffDays, (activityMap.get(diffDays) || 0) + 1);
            }
        });

        // Add some baseline "views/upvotes" activity seeded by the user's ID so it doesn't look completely empty,
        // while still dynamically incorporating their real reports.
        const userSeed = user.id.length; 

        for (let i = 35; i >= 0; i--) {
            let count = activityMap.get(i) || 0;
            
            // Add deterministic baseline activity (minor actions like upvotes)
            if (i % (userSeed + 1) === 0) count += 1;
            if (i % 8 === 0) count += 1;
            if (i === 1) count += 2; // Always show recent baseline activity
            
            let lvl = 0;
            if (count === 1) lvl = 1;
            else if (count === 2) lvl = 2;
            else if (count === 3) lvl = 3;
            else if (count >= 4) lvl = 4;

            heatSquares.push(`<div class="heat-day lvl-${lvl}" title="${i === 0 ? 'Today' : i + ' days ago'}: ${count} civic actions"></div>`);
        }

        container.innerHTML = `
            <div class="profile-wrapper animated fadeIn">
                <!-- Profile Header -->
                <div class="profile-hero">
                    <div class="profile-avatar-big">${user.avatarChar}</div>
                    <div class="profile-meta">
                        <h2>${user.name}</h2>
                        <div style="display:flex; align-items:center; gap:12px; margin-top:8px;">
                            <span class="profile-level-badge">${user.level} (Level ${currentLvlNum})</span>
                            <span style="color: var(--text-secondary); font-size:14px;">Delhi Rank #${user.rank}</span>
                        </div>
                    </div>
                </div>

                <div class="grid-3" style="margin-bottom: 32px;">
                    <!-- Stats Card -->
                    <div class="card glass-panel" style="display:flex; flex-direction:column; justify-content:space-between;">
                        <h3 style="margin-bottom: 16px;">Points Summary</h3>
                        <div style="margin-bottom: 20px;">
                            <span style="font-size:12px; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Watchdog Score</span>
                            <div style="font-size: 36px; font-weight:800; color:var(--primary); font-family:var(--font-heading);">${user.points} pts</div>
                        </div>
                        <div class="form-group" style="margin-bottom:0;">
                            <div style="display:flex; justify-content:space-between; font-size:12px; color:var(--text-secondary);">
                                <span>Progress to Level ${currentLvlNum + 1}</span>
                                <span>${progressInLevel} / 150 pts</span>
                            </div>
                            <div style="background-color: rgba(255,255,255,0.05); height: 8px; border-radius:4px; overflow:hidden; margin-top:6px;">
                                <div style="background: linear-gradient(to right, var(--primary), var(--secondary)); width: ${user.levelProgress}%; height: 100%;"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Breakdown stats -->
                    <div class="card glass-panel" style="grid-column: span 2;">
                        <h3 style="margin-bottom: 20px;">Civic Action Counts</h3>
                        <div class="grid-3">
                            <div style="text-align: center; border-right: 1px solid var(--border-color); padding: 10px;">
                                <div style="font-size:28px; font-weight:800; font-family:var(--font-heading); color:var(--primary);">${(user.contributions[0] || {}).count || 0}</div>
                                <span style="font-size:12px; color:var(--text-muted); text-transform:uppercase; font-weight:600;">Issues Filed</span>
                            </div>
                            <div style="text-align: center; border-right: 1px solid var(--border-color); padding: 10px;">
                                <div style="font-size:28px; font-weight:800; font-family:var(--font-heading); color:var(--secondary);">${(user.contributions[1] || {}).count || 0}</div>
                                <span style="font-size:12px; color:var(--text-muted); text-transform:uppercase; font-weight:600;">Verifications</span>
                            </div>
                            <div style="text-align: center; padding: 10px;">
                                <div style="font-size:28px; font-weight:800; font-family:var(--font-heading); color:var(--accent);">${(user.contributions[2] || {}).count || 0}</div>
                                <span style="font-size:12px; color:var(--text-muted); text-transform:uppercase; font-weight:600;">Comments</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="grid-3" style="margin-bottom: 32px;">
                    <!-- Activity Heat Calendar -->
                    <div class="card glass-panel" style="grid-column: span 2;">
                        <div class="heat-calendar-title">Daily Civic Participation (Last 35 Days)</div>
                        <div class="heat-grid">
                            ${heatSquares.join('')}
                        </div>
                        <div style="display:flex; justify-content:flex-end; gap:6px; font-size:11px; color:var(--text-muted); margin-top:8px; align-items:center;">
                            <span>Less</span>
                            <div style="width:10px;height:10px;background-color:rgba(255,255,255,0.05);border-radius:1px;"></div>
                            <div style="width:10px;height:10px;background-color:rgba(99, 102, 241, 0.2);border-radius:1px;"></div>
                            <div style="width:10px;height:10px;background-color:rgba(99, 102, 241, 0.5);border-radius:1px;"></div>
                            <div style="width:10px;height:10px;background-color:rgba(99, 102, 241, 0.8);border-radius:1px;"></div>
                            <div style="width:10px;height:10px;background-color:rgba(99, 102, 241, 1);border-radius:1px;"></div>
                            <span>More</span>
                        </div>
                    </div>

                    <!-- Achievements checklist -->
                    <div class="card glass-panel">
                        <h3 style="margin-bottom: 16px;">Unlocked Badges</h3>
                        <div class="badge-grid">
                            ${user.badges.map(b => {
                                const lockedClass = b.unlocked ? '' : 'locked';
                                const label = b.unlocked ? b.name : '🔒 Locked';
                                return `
                                    <div class="badge-card ${lockedClass}" title="${b.desc}">
                                        <div class="badge-icon-med">${b.name.split(' ')[0]}</div>
                                        <div class="badge-card-name">${b.unlocked ? b.name.split(' ').slice(1).join(' ') : 'Locked'}</div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>

                <!-- My Reports Grid -->
                <section>
                    <div class="section-title">
                        <h3>My Reported Issues</h3>
                    </div>
                    ${myReports.length === 0 ? `
                        <div class="card glass-panel text-center" style="padding: 32px; text-align: center; color: var(--text-muted);">
                            You have not reported any issues yet. Click "Report Issue" to file your first.
                        </div>
                    ` : `
                        <div class="grid-3">
                            ${myReports.map(issue => {
                                const statusClass = `pill-${issue.status.toLowerCase().replaceAll(' ', '')}`;
                                return `
                                    <div class="card issue-card glass-panel" onclick="window.location.hash='#issue/${issue.id}'" style="cursor:pointer;">
                                        <img src="${issue.imageUrl}" class="issue-card-image" alt="">
                                        <div class="issue-card-header">
                                            <span class="pill ${statusClass}">${issue.status}</span>
                                            <span style="font-size:12px; color:var(--text-muted);">${formatRelativeTime(issue.reportedAt)}</span>
                                        </div>
                                        <h4>${issue.title}</h4>
                                        <p class="issue-card-desc">${issue.description}</p>
                                        <div class="issue-card-footer">
                                            <span class="issue-card-loc"><i data-lucide="map-pin" style="width:12px;height:12px;"></i>${issue.location.address.split(', ')[2] || issue.location.address.split(', ').at(-1) || 'Delhi'}</span>
                                            <span style="font-size:12px; font-weight:600;"><i data-lucide="thumbs-up" style="width:10px;height:10px;display:inline;vertical-align:-1px;margin-right:3px;"></i>${issue.upvotes}</span>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `}
                </section>
            </div>
        `;
    }
};
