/*
========================================================================
CIVICPULSE SETTINGS PAGE MODULE
Manages AI engine settings, connection testing, and provider updates.
========================================================================
*/

import { testAIConnection } from '../gemini-ai.js';
import { t } from '../i18n.js';
import { showToast } from '../utils.js';

export const settingsPage = {
    async render(container) {
        container.innerHTML = `
            <div class="page-header anim-fade-in">
                <div class="header-titles">
                    <h1 class="page-title">AI System Status</h1>
                    <p class="page-subtitle">Monitor the secure backend connection to Gemini AI</p>
                </div>
            </div>

            <div class="settings-grid anim-slide-up" style="display: grid; grid-template-columns: 1fr; gap: 30px; margin-top: 20px; max-width: 800px;">
                <!-- Diagnostics Panel -->
                <div class="glass-card diagnostics-card" style="padding: 25px; border-radius: 16px; border-left: 4px solid var(--accent);">
                    <h3 style="margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                        <i data-lucide="server"></i>
                        <span>Backend Connection</span>
                    </h3>
                    <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 15px;">
                        The API key is securely stored in the backend <code>.env</code> file. No keys are exposed to the browser.
                    </p>
                    <div style="display: flex; align-items: center; gap: 10px; font-weight: 500; margin-bottom: 25px;">
                        <span>Status:</span>
                        <span id="connection-status-badge" class="badge" style="padding: 6px 12px; border-radius: 20px; background: rgba(245, 158, 11, 0.2); color: #f59e0b;">
                            Ready (Not Tested)
                        </span>
                    </div>

                    <button type="button" id="test-connection-btn" class="btn btn-secondary" style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <i data-lucide="zap"></i>
                        <span>Test Backend Connection</span>
                    </button>
                </div>
            </div>
        `;

        // Initialize Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }

        this.setupEventListeners();
    },

    setupEventListeners() {
        const testBtn = document.getElementById('test-connection-btn');

        // Test connection click handler
        testBtn.addEventListener('click', async () => {
            testBtn.disabled = true;
            const originalHTML = testBtn.innerHTML;
            testBtn.innerHTML = `<i data-lucide="loader" class="spin-icon"></i> Testing...`;
            if (window.lucide) window.lucide.createIcons();

            try {
                const res = await testAIConnection();
                if (res.success) {
                    showToast(res.message, "success");
                    this.updateBadge(true);
                } else {
                    showToast("Connection Failed: " + res.message, "error");
                    this.updateBadge(false);
                }
            } catch (err) {
                console.error(err);
                showToast("Connection Failed: " + err.message, "error");
                this.updateBadge(false);
            } finally {
                testBtn.disabled = false;
                testBtn.innerHTML = originalHTML;
                if (window.lucide) window.lucide.createIcons();
            }
        });
    },

    updateBadge(forceSuccess = null) {
        const badge = document.getElementById('connection-status-badge');
        if (!badge) return;

        if (forceSuccess === true) {
            badge.className = 'badge badge-success';
            badge.style.background = 'rgba(16, 185, 129, 0.2)';
            badge.style.color = '#10b981';
            badge.textContent = 'Connected (Secure)';
        } else if (forceSuccess === false) {
            badge.className = 'badge badge-danger';
            badge.style.background = 'rgba(239, 68, 68, 0.2)';
            badge.style.color = '#ef4444';
            badge.textContent = 'Connection Error';
        }
    }
};
