/*
========================================================================
CIVICPULSE LANDING / HOME PAGE COMPONENT
========================================================================
*/

import { store } from '../store.js';
import { formatRelativeTime } from '../utils.js';

export const homePage = {
    activityInterval: null,

    async render(container) {
        if (this.activityInterval) {
            clearInterval(this.activityInterval);
            this.activityInterval = null;
        }

        const issues = store.getIssues();
        const user = store.getUser();

        // Calculate home page statistics
        const totalReported = issues.length;
        const totalResolved = issues.filter(i => i.status === 'Resolved').length;
        const totalVerified = issues.filter(i => i.status === 'Verified' || i.status === 'In Progress').length;
        
        // Select recent issues (first 6)
        const recentIssues = issues.slice(0, 6);

        // Build recent activities ticker (e.g. status changes, new issues)
        const activities = issues
            .flatMap(issue => {
                return issue.timeline.map(t => ({
                    issueId: issue.id,
                    title: issue.title,
                    status: t.status,
                    actor: t.actor,
                    timestamp: t.timestamp,
                    note: t.note
                }));
            })
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 4); // Top 4 recent actions

        container.innerHTML = `
            <div class="home-wrapper animated fadeIn">
                <!-- Hero Panel -->
                <section class="home-hero">
                    <div class="hero-text">
                        <h2>Hyperlocal Resolution Platform for Delhi</h2>
                        <p>Empowering citizens to report, map, verify, and resolve community infrastructure issues. Join your neighbors to shape a safer, cleaner city.</p>
                        <div class="hero-btns">
                            <a href="#report" class="btn btn-primary btn-icon">
                                <i data-lucide="plus-circle"></i><span>Report Issue</span>
                            </a>
                            <a href="#map" class="btn btn-secondary btn-icon">
                                <i data-lucide="map"></i><span>Explore Live Map</span>
                            </a>
                        </div>
                    </div>
                    <div class="hero-stats">
                        <div class="hero-stat-card hover-glow">
                            <i data-lucide="alert-circle" style="color: var(--danger);"></i>
                            <div>
                                <div class="hero-stat-val">${totalReported}</div>
                                <div class="hero-stat-lbl">Issues Reported</div>
                            </div>
                        </div>
                        <div class="hero-stat-card hover-glow">
                            <i data-lucide="check-circle2" style="color: var(--success);"></i>
                            <div>
                                <div class="hero-stat-val">${totalResolved}</div>
                                <div class="hero-stat-lbl">Issues Resolved</div>
                            </div>
                        </div>
                    </div>
                </section>

                <div class="grid-3" style="margin-bottom: 32px;">
                    <!-- Activity Feed Ticker -->
                    <div class="card glass-panel" style="grid-column: span 2;">
                        <div class="section-title">
                            <h3>
                                <i data-lucide="activity" style="display:inline; vertical-align:-3px; margin-right:8px; color:var(--primary);"></i>
                                <span>Live Pulse Feed</span>
                                <span class="live-dot" style="display:inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: #10b981; box-shadow: 0 0 8px #10b981; margin-left: 6px; vertical-align: middle; animation: fadeIn 1.5s infinite alternate;"></span>
                            </h3>
                            <span class="pill pill-verified">Realtime</span>
                        </div>
                        <div class="activity-list" id="home-activities">
                            ${activities.map(act => {
                                let itemClass = act.status === 'Resolved' ? 'resolved' : 'new';
                                let icon = act.status === 'Resolved' ? 'check' : 'plus';
                                let actionWord = act.status === 'Resolved' ? 'resolved' : 'reported';
                                if (act.status === 'In Progress') {
                                    itemClass = 'progress';
                                    icon = 'clock';
                                    actionWord = 'updated to in progress';
                                } else if (act.status === 'Verified') {
                                    itemClass = 'verified';
                                    icon = 'shield-check';
                                    actionWord = 'verified';
                                }

                                return `
                                    <div class="activity-item ${itemClass}">
                                        <div class="activity-badge">
                                            <i data-lucide="${icon}" style="width:16px;height:16px;"></i>
                                        </div>
                                        <div class="activity-info">
                                            <div class="activity-desc">
                                                <strong>${act.actor}</strong> ${actionWord} <a href="#issue/${act.issueId}">${act.title}</a>
                                            </div>
                                            <div class="activity-time">${formatRelativeTime(act.timestamp)}</div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    <!-- Personal Level Progress Card -->
                    <div class="card glass-panel" style="display: flex; flex-direction: column; justify-content: space-between;">
                        <div>
                            <div class="section-title">
                                <h3>Citizen Level</h3>
                                <span class="pill pill-reported">${user.level}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 16px; margin: 16px 0;">
                                <div class="profile-avatar-big" style="width: 52px; height: 52px; font-size: 20px;">${user.avatarChar}</div>
                                <div>
                                    <h4 style="font-size: 16px;">${user.name}</h4>
                                    <span style="color: var(--text-secondary); font-size: 13px;">Rank #${user.rank} in Delhi</span>
                                </div>
                            </div>
                            <div class="form-group" style="margin-bottom: 0;">
                                <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted);">
                                    <span>Progress to Lvl ${Math.floor(user.points / 150) + 2}</span>
                                    <span>${user.points % 150} / 150 pts</span>
                                </div>
                                <div style="background-color: rgba(255,255,255,0.05); height: 8px; border-radius: 4px; overflow: hidden; margin-top: 6px;">
                                    <div style="background: linear-gradient(to right, var(--primary), var(--secondary)); width: ${user.levelProgress}%; height: 100%;"></div>
                                </div>
                            </div>
                        </div>
                        <a href="#profile" class="btn btn-secondary btn-icon" style="margin-top: 16px; justify-content: center; width: 100%;">
                            <i data-lucide="user"></i><span>View Profile Details</span>
                        </a>
                    </div>
                </div>

                <!-- Category quick access -->
                <section style="margin-bottom: 40px;">
                    <div class="section-title">
                        <h3>Issue Categories</h3>
                    </div>
                    <div class="grid-4" id="category-grid">
                        <div class="category-item" data-category="Pothole">
                            <div class="category-icon"><i data-lucide="alert-triangle"></i></div>
                            <span class="category-name">Potholes</span>
                        </div>
                        <div class="category-item" data-category="Water Leakage">
                            <div class="category-icon"><i data-lucide="droplet"></i></div>
                            <span class="category-name">Water Leakage</span>
                        </div>
                        <div class="category-item" data-category="Streetlight">
                            <div class="category-icon"><i data-lucide="lightbulb"></i></div>
                            <span class="category-name">Streetlights</span>
                        </div>
                        <div class="category-item" data-category="Waste/Garbage">
                            <div class="category-icon"><i data-lucide="trash-2"></i></div>
                            <span class="category-name">Waste Management</span>
                        </div>
                    </div>
                </section>

                <!-- Recent Grid Section -->
                <section>
                    <div class="section-title">
                        <h3>Recent Reports in Delhi</h3>
                        <a href="#map" style="font-size: 13px; font-weight: 600;">View All</a>
                    </div>
                    <div class="grid-3" id="home-issues-grid">
                        ${recentIssues.map(issue => {
                            let statusClass = `pill-${issue.status.toLowerCase().replace(' ', '')}`;
                            return `
                                <div class="card issue-card glass-panel" data-id="${issue.id}">
                                    <img src="${issue.imageUrl}" class="issue-card-image" alt="${issue.title}">
                                    <div class="issue-card-header">
                                        <span class="pill ${statusClass}">${issue.status}</span>
                                        <span class="pill pill-danger" style="background: rgba(239,68,68,0.1); color: var(--danger); font-size:10px;">${issue.severity}</span>
                                    </div>
                                    <h4 title="${issue.title}">${issue.title}</h4>
                                    <p class="issue-card-desc">${issue.description}</p>
                                    <div class="issue-card-footer">
                                        <span class="issue-card-loc"><i data-lucide="map-pin" style="width:12px;height:12px;"></i>${issue.location.address.split(', ')[2] || 'Delhi'}</span>
                                        <div class="issue-card-votes">
                                            <i data-lucide="thumbs-up" class="upvote-trigger" data-id="${issue.id}"></i>
                                            <span class="vote-count">${issue.upvotes}</span>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </section>
            </div>
        `;

        this.initEvents(container);
        this.startLiveFeed(container);
    },

    startLiveFeed(container) {
        if (this.activityInterval) {
            clearInterval(this.activityInterval);
        }

        const activitiesList = container.querySelector('#home-activities');
        if (!activitiesList) return;

        const statuses = ['Verified', 'In Progress', 'Resolved'];
        const notes = {
            'Verified': 'Report verified by community members via proximity.',
            'In Progress': 'Authority acknowledged. Work order issued to field team.',
            'Resolved': 'Issue resolved. Site cleared and proof approved.'
        };
        const actors = {
            'Verified': 'CivicPulse Community',
            'In Progress': 'Delhi PWD Maintenance',
            'Resolved': 'MCD Field Staff'
        };

        this.activityInterval = setInterval(() => {
            // Self-cleaning: if container is no longer in DOM, clear interval
            if (!document.getElementById('home-activities')) {
                clearInterval(this.activityInterval);
                this.activityInterval = null;
                return;
            }

            const issues = store.getIssues();
            if (issues.length === 0) return;

            // Pick a random issue
            const issue = issues[Math.floor(Math.random() * issues.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const actor = actors[status];
            const note = notes[status];

            // Build item HTML
            let itemClass = status === 'Resolved' ? 'resolved' : 'new';
            let icon = status === 'Resolved' ? 'check' : 'plus';
            let actionWord = status === 'Resolved' ? 'resolved' : 'reported';
            if (status === 'In Progress') {
                itemClass = 'progress';
                icon = 'clock';
                actionWord = 'updated to in progress';
            } else if (status === 'Verified') {
                itemClass = 'verified';
                icon = 'shield-check';
                actionWord = 'verified';
            }

            const itemDiv = document.createElement('div');
            itemDiv.className = `activity-item ${itemClass}`;
            itemDiv.style.animation = 'slideInRight 0.5s ease-out forwards';
            itemDiv.innerHTML = `
                <div class="activity-badge">
                    <i data-lucide="${icon}" style="width:16px;height:16px;"></i>
                </div>
                <div class="activity-info">
                    <div class="activity-desc">
                        <strong>${actor}</strong> ${actionWord} <a href="#issue/${issue.id}">${issue.title}</a>
                    </div>
                    <div class="activity-time">Just now</div>
                </div>
            `;

            // Insert at the top
            activitiesList.insertBefore(itemDiv, activitiesList.firstChild);

            // Re-render Lucide icons
            if (window.lucide) {
                window.lucide.createIcons();
            }

            // Remove oldest if count > 6
            const items = activitiesList.querySelectorAll('.activity-item');
            if (items.length > 6) {
                items[items.length - 1].remove();
            }

            // Fire a subtle toast to notify the user
            import('../utils.js').then(utils => {
                utils.showToast(`Live Feed: ${actor} ${actionWord} "${issue.title.substring(0, 20)}..."`, "info");
            });

        }, Math.floor(Math.random() * 6000) + 12000); // 12-18 seconds random interval
    },

    initEvents(container) {
        // Upvote click handler
        const upvoteTriggers = container.querySelectorAll('.upvote-trigger');
        upvoteTriggers.forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                const issueId = trigger.getAttribute('data-id');
                const votesSpan = trigger.nextElementSibling;
                const newVotes = store.upvoteIssue(issueId);
                if (newVotes) {
                    votesSpan.innerText = newVotes;
                    trigger.style.color = 'var(--primary)';
                    trigger.style.transform = 'scale(1.2)';
                    import('../utils.js').then(utils => {
                        utils.showToast("Upvoted! Priority rank increased.", "success");
                    });
                }
            });
        });

        // Click on Issue card triggers details navigation
        const issueCards = container.querySelectorAll('.issue-card');
        issueCards.forEach(card => {
            card.addEventListener('click', () => {
                const issueId = card.getAttribute('data-id');
                window.location.hash = `#issue/${issueId}`;
            });
        });

        // Category items redirect to map view filtered
        const catItems = container.querySelectorAll('.category-item');
        catItems.forEach(item => {
            item.addEventListener('click', () => {
                const cat = item.getAttribute('data-category');
                window.location.hash = `#map?category=${encodeURIComponent(cat)}`;
            });
        });
    }
};
