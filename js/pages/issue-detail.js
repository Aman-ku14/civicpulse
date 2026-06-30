/*
========================================================================
CIVICPULSE ISSUE DETAIL & TIMELINE TRACKING PAGE COMPONENT
========================================================================
*/

import { store } from '../store.js';
import { formatFriendlyDate, formatRelativeTime, getCategoryColor } from '../utils.js';

export const issueDetailPage = {
    issue: null,
    miniMap: null,

    async render(container, issueId) {
        if (!issueId) {
            container.innerHTML = `<div style="padding:40px; text-align:center;"><h2>No Issue Specified</h2></div>`;
            return;
        }

        this.issue = store.getIssueById(issueId);

        if (!this.issue) {
            container.innerHTML = `
                <div style="padding: 40px; text-align: center;">
                    <h2>Issue Not Found</h2>
                    <p style="color: var(--text-secondary); margin-top: 10px;">The issue ID "${issueId}" does not exist in local storage database.</p>
                    <a href="#home" class="btn btn-primary" style="margin-top: 20px;">Return Home</a>
                </div>
            `;
            return;
        }

        const color = getCategoryColor(this.issue.category);
        const statusClass = `pill-${this.issue.status.toLowerCase().replace(' ', '')}`;

        container.innerHTML = `
            <div class="detail-wrapper animated fadeIn">
                <!-- Header Breadcrumb -->
                <div class="page-header" style="margin-bottom: 24px;">
                    <div class="page-title">
                        <a href="#map" style="display:inline-flex; align-items:center; gap:6px; font-size:13px; font-weight:600; color:var(--text-secondary); margin-bottom:8px;">
                            <i data-lucide="arrow-left" style="width:14px;height:14px;"></i><span>Back to Live Map</span>
                        </a>
                        <h1>Report #${this.issue.id.split('_').pop().toUpperCase()}</h1>
                        <p>Track progress, verify severity, and collaborate on resolution</p>
                    </div>
                    <div>
                        <button class="btn btn-secondary btn-icon" id="shareIssueBtn">
                            <i data-lucide="share-2"></i><span>Share</span>
                        </button>
                    </div>
                </div>

                <div class="detail-layout">
                    <!-- Column 1: Media, Description, Discussions -->
                    <div>
                        <div class="detail-img-container">
                            <img src="${this.issue.imageUrl}" class="detail-img" alt="${this.issue.title}">
                            <div class="detail-status-bar">
                                <span class="pill ${statusClass}" style="font-size:12px; padding:6px 14px;">${this.issue.status}</span>
                                <span style="font-size: 13px; font-weight:600; text-shadow:0 2px 4px rgba(0,0,0,0.8);"><i data-lucide="thumbs-up" style="display:inline; vertical-align:-2px; margin-right:4px;"></i>${this.issue.upvotes} Upvotes</span>
                            </div>
                        </div>

                        <div class="card glass-panel" style="margin-bottom: 24px;">
                            <h2 style="font-size: 22px; margin-bottom: 12px;">${this.issue.title}</h2>
                            <div style="display:flex; gap:16px; margin-bottom: 20px; font-size:13px; color:var(--text-muted);">
                                <span>Reported by: <strong>${this.issue.reporterName}</strong></span>
                                <span>&middot;</span>
                                <span>Date: ${formatFriendlyDate(this.issue.reportedAt)}</span>
                            </div>
                            <p style="font-size: 15px; line-height: 1.7; color: var(--text-secondary); white-space: pre-line;">${this.issue.description}</p>
                        </div>

                        <!-- Comments Section -->
                        <div class="card glass-panel">
                            <h3 style="margin-bottom: 20px;">Community Discussion</h3>
                            
                            <div class="discussion-input-group">
                                <input type="text" id="newCommentText" class="form-control" placeholder="Add a comment or update about this issue...">
                                <button class="btn btn-primary" id="submitCommentBtn">Post</button>
                            </div>

                            <div class="comments-list" id="commentsListContainer">
                                ${this.renderCommentsList()}
                            </div>
                        </div>
                    </div>

                    <!-- Column 2: Maps, Verification, Timeline -->
                    <div>
                        <!-- Proximity Verification Card -->
                        <div class="verification-card">
                            <i data-lucide="shield-check" style="width:36px; height:36px; color: var(--secondary); margin: 0 auto 12px auto;"></i>
                            <h4 style="margin-bottom: 6px;">Community Verification</h4>
                            <p style="font-size:13px; color:var(--text-secondary); margin-bottom:16px;">This report has <strong>${this.issue.verifications} verifications</strong>. Help authorities confirm this issue by verifying it if you live nearby.</p>
                            <button class="btn btn-accent btn-icon" id="verifyIssueBtn" style="width:100%; justify-content:center;">
                                <i data-lucide="check"></i><span>Verify this Report</span>
                            </button>
                        </div>

                        <!-- Mini map showing coordinates -->
                        <div class="card glass-panel" style="margin-bottom: 24px; padding: 16px;">
                            <h4 style="margin-bottom: 12px;">Report Location</h4>
                            <div class="minimap-card">
                                <div id="minimap-elem"></div>
                            </div>
                            <span style="font-size: 12px; color: var(--text-secondary); display:flex; align-items:center; gap:4px; line-height:1.3;">
                                <i data-lucide="map-pin" style="flex-shrink:0;width:14px;height:14px;"></i>${this.issue.location.address}
                            </span>
                        </div>

                        <!-- Timeline track -->
                        <div class="card glass-panel">
                            <h4 style="margin-bottom: 20px;">Resolution Timeline</h4>
                            <div class="timeline-list">
                                ${this.renderTimeline()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Load mini map after DOM updates
        setTimeout(() => this.initMiniMap(), 100);

        this.initEvents();
    },

    renderCommentsList() {
        if (!this.issue.comments || this.issue.comments.length === 0) {
            return `<div style="text-align: center; padding: 16px; color: var(--text-muted); font-size:13px;">No comments yet. Be the first to discuss!</div>`;
        }

        return this.issue.comments
            .map(c => `
                <div class="comment-card">
                    <div class="comment-header">
                        <span class="comment-user">${c.user}</span>
                        <span class="comment-date">${formatRelativeTime(c.timestamp)}</span>
                    </div>
                    <div class="comment-body">${c.text}</div>
                </div>
            `)
            .join('');
    },

    renderTimeline() {
        const steps = ['Reported', 'Verified', 'In Progress', 'Resolved'];
        const currentIdx = steps.indexOf(this.issue.status);

        return steps.map((step, idx) => {
            const isCompleted = idx <= currentIdx;
            const isActive = idx === currentIdx && this.issue.status !== 'Resolved';
            const nodeClass = isCompleted ? (isActive ? 'active' : 'completed') : '';

            // Find matching event from timeline data
            const eventData = this.issue.timeline.find(t => t.status === step);
            const title = step;
            const time = eventData ? formatFriendlyDate(eventData.timestamp) : 'Pending authority action';
            const desc = eventData ? eventData.note : `Awaiting preceding steps.`;

            let icon = 'circle';
            if (step === 'Reported') icon = 'flag';
            if (step === 'Verified') icon = 'shield';
            if (step === 'In Progress') icon = 'clock';
            if (step === 'Resolved') icon = 'check-circle2';

            return `
                <div class="timeline-node ${nodeClass}">
                    <div class="timeline-dot">
                        <i data-lucide="${icon}"></i>
                    </div>
                    <div class="timeline-node-title">${title}</div>
                    <div class="timeline-node-time">${time}</div>
                    <div class="timeline-node-desc">${desc}</div>
                </div>
            `;
        }).join('');
    },

    initMiniMap() {
        if (this.miniMap) return;

        const coords = [this.issue.location.lat, this.issue.location.lng];
        this.miniMap = L.map('minimap-elem', {
            zoomControl: false,
            dragging: false,
            touchZoom: false,
            scrollWheelZoom: false,
            doubleClickZoom: false
        }).setView(coords, 14);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 20
        }).addTo(this.miniMap);

        const color = getCategoryColor(this.issue.category);
        const markerSVG = `
            <div class="custom-marker-icon" style="background-color: ${color}; width: 24px; height: 24px; border-width: 1px;">
                <div style="background-color: white; width: 6px; height: 6px; border-radius: 50%;"></div>
            </div>
        `;
        const icon = L.divIcon({
            html: markerSVG,
            className: 'leaflet-custom-marker-wrapper',
            iconSize: [24, 24],
            iconAnchor: [12, 24]
        });

        L.marker(coords, { icon }).addTo(this.miniMap);
    },

    initEvents() {
        const verifyBtn = document.getElementById('verifyIssueBtn');
        const shareBtn = document.getElementById('shareIssueBtn');
        const submitCommentBtn = document.getElementById('submitCommentBtn');
        const commentInput = document.getElementById('newCommentText');

        // Share Link copy trigger
        shareBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(window.location.href);
            import('../utils.js').then(u => {
                u.showToast("Link copied to clipboard!", "success");
            });
        });

        // Verify report trigger
        verifyBtn.addEventListener('click', () => {
            const verifyResult = store.verifyIssue(this.issue.id);
            if (verifyResult) {
                // Update local model
                this.issue = store.getIssueById(this.issue.id);
                
                // Redraw UI components
                document.querySelector('.verification-card p strong').innerText = `${this.issue.verifications} verifications`;
                document.querySelector('.timeline-list').innerHTML = this.renderTimeline();
                
                // Update status badge inside status bar
                const statusBadge = document.querySelector('.detail-status-bar span:first-child');
                statusBadge.className = `pill pill-${this.issue.status.toLowerCase().replace(' ', '')}`;
                statusBadge.innerText = this.issue.status;

                if (window.lucide) window.lucide.createIcons();

                import('../utils.js').then(u => {
                    u.showToast(`Verified! +${verifyResult.pointsGained} verifier points added.`, "success");
                });
            }
        });

        // Submit comment trigger
        const submitComment = () => {
            const commentText = commentInput.value.trim();
            if (!commentText) return;

            const newComment = store.addIssueComment(this.issue.id, commentText);
            if (newComment) {
                commentInput.value = '';
                
                // Re-fetch and redraw comment feed
                this.issue = store.getIssueById(this.issue.id);
                document.getElementById('commentsListContainer').innerHTML = this.renderCommentsList();
                
                import('../utils.js').then(u => {
                    u.showToast("Comment posted! +2 points earned.", "success");
                });
            }
        };

        submitCommentBtn.addEventListener('click', submitComment);
        commentInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') submitComment();
        });
    }
};
