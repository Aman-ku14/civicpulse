/*
========================================================================
CIVICPULSE AUTHORITY ADMIN PANEL PAGE
Allows Delhi municipal officers to triage, assign, and resolve reports.
========================================================================
*/

import { store } from '../store.js';
import { t } from '../i18n.js';
import { showToast, formatFriendlyDate } from '../utils.js';

export const adminPage = {
    async render(container) {
        const issues = store.getIssues();
        
        // Count metrics
        const pendingCount = issues.filter(i => i.status === 'Reported').length;
        const inProgressCount = issues.filter(i => i.status === 'In Progress' || i.status === 'Verified').length;
        const resolvedCount = issues.filter(i => i.status === 'Resolved').length;

        container.innerHTML = `
            <div class="page-header anim-fade-in">
                <div class="header-titles">
                    <h1 class="page-title" data-i18n="nav_admin">${t('nav_admin')}</h1>
                    <p class="page-subtitle" data-i18n="admin_desc">${t('admin_desc')}</p>
                </div>
            </div>

            <!-- KPI Row -->
            <div class="admin-kpi-grid anim-slide-up" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 25px;">
                <div class="glass-card kpi-card" style="padding: 20px; border-left: 4px solid #ef4444; border-radius: 12px; display: flex; align-items: center; gap: 15px;">
                    <div style="background: rgba(239, 68, 68, 0.1); width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #ef4444;">
                        <i data-lucide="alert-circle"></i>
                    </div>
                    <div>
                        <div style="font-size: 24px; font-weight: bold; color: var(--text-primary);">${pendingCount}</div>
                        <div style="font-size: 13px; color: var(--text-secondary);">Pending Verification</div>
                    </div>
                </div>
                <div class="glass-card kpi-card" style="padding: 20px; border-left: 4px solid #f59e0b; border-radius: 12px; display: flex; align-items: center; gap: 15px;">
                    <div style="background: rgba(245, 158, 11, 0.1); width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #f59e0b;">
                        <i data-lucide="clock"></i>
                    </div>
                    <div>
                        <div style="font-size: 24px; font-weight: bold; color: var(--text-primary);">${inProgressCount}</div>
                        <div style="font-size: 13px; color: var(--text-secondary);">Active Work Orders</div>
                    </div>
                </div>
                <div class="glass-card kpi-card" style="padding: 20px; border-left: 4px solid #10b981; border-radius: 12px; display: flex; align-items: center; gap: 15px;">
                    <div style="background: rgba(16, 185, 129, 0.1); width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #10b981;">
                        <i data-lucide="check-circle2"></i>
                    </div>
                    <div>
                        <div style="font-size: 24px; font-weight: bold; color: var(--text-primary);">${resolvedCount}</div>
                        <div style="font-size: 13px; color: var(--text-secondary);">Resolved complaints</div>
                    </div>
                </div>
            </div>

            <!-- Filters Bar -->
            <div class="glass-card filter-card anim-slide-up" style="padding: 15px 20px; border-radius: 12px; margin-bottom: 20px; display: flex; flex-wrap: wrap; gap: 15px; align-items: center;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i data-lucide="filter" style="color: var(--accent); width: 18px;"></i>
                    <span style="font-weight: 500; font-size: 14px;">Filters:</span>
                </div>
                <select id="admin-filter-dept" class="form-control" style="padding: 8px 12px; border-radius: 6px; background: rgba(30, 41, 59, 0.7); border: 1px solid var(--border-color); color: var(--text-primary); font-size: 13px;">
                    <option value="">All Departments</option>
                    <option value="PWD">Public Works Department (PWD)</option>
                    <option value="MCD">Municipal Corporation of Delhi (MCD)</option>
                    <option value="DJB">Delhi Jal Board (DJB)</option>
                    <option value="DPCC">Pollution Control Committee (DPCC)</option>
                </select>
                <select id="admin-filter-status" class="form-control" style="padding: 8px 12px; border-radius: 6px; background: rgba(30, 41, 59, 0.7); border: 1px solid var(--border-color); color: var(--text-primary); font-size: 13px;">
                    <option value="">All Statuses</option>
                    <option value="Reported">Reported</option>
                    <option value="Verified">Verified</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                </select>
                <input type="text" id="admin-search-issues" placeholder="Quick filter by ID, Title, or Street..." style="flex: 1; padding: 8px 12px; border-radius: 6px; background: rgba(30, 41, 59, 0.7); border: 1px solid var(--border-color); color: var(--text-primary); font-size: 13px;">
            </div>

            <!-- Bulk Operations -->
            <div id="bulk-operations-bar" class="glass-card anim-fade-in" style="padding: 12px 20px; border-radius: 12px; margin-bottom: 15px; background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.3); display: none; align-items: center; justify-content: space-between;">
                <div style="font-weight: 500; font-size: 14px; color: #a5b4fc; display: flex; align-items: center; gap: 8px;">
                    <i data-lucide="check-square"></i>
                    <span id="selected-count">0 issues selected</span>
                </div>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <select id="bulk-status-select" class="form-control" style="padding: 6px 12px; border-radius: 6px; background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-primary); font-size: 13px;">
                        <option value="">Choose Status...</option>
                        <option value="Verified">Set Verified</option>
                        <option value="In Progress">Set In Progress</option>
                        <option value="Resolved">Set Resolved</option>
                    </select>
                    <button id="apply-bulk-status" class="btn btn-primary" style="padding: 6px 16px; font-size: 13px;">Apply Status</button>
                    <button id="clear-selections" class="btn btn-secondary" style="padding: 6px 12px; font-size: 13px;">Cancel</button>
                </div>
            </div>

            <!-- Issues Table -->
            <div class="glass-card table-responsive anim-slide-up" style="border-radius: 16px; overflow: hidden; border: 1px solid var(--border-color);">
                <table class="admin-table" style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
                    <thead style="background: rgba(30, 41, 59, 0.8); border-bottom: 1px solid var(--border-color);">
                        <tr>
                            <th style="padding: 16px 20px; width: 40px;"><input type="checkbox" id="select-all-issues"></th>
                            <th style="padding: 16px 20px;">Issue & Details</th>
                            <th style="padding: 16px 20px;">Department</th>
                            <th style="padding: 16px 20px;">Status</th>
                            <th style="padding: 16px 20px;">Date Reported</th>
                            <th style="padding: 16px 20px; text-align: right;">Action</th>
                        </tr>
                    </thead>
                    <tbody id="admin-table-body">
                        <!-- Injected dynamically -->
                    </tbody>
                </table>
            </div>
        `;

        if (window.lucide) {
            window.lucide.createIcons();
        }

        this.renderTableRows();
        this.setupEventListeners();
    },

    renderTableRows() {
        const tableBody = document.getElementById('admin-table-body');
        if (!tableBody) return;

        const deptFilter = document.getElementById('admin-filter-dept').value;
        const statusFilter = document.getElementById('admin-filter-status').value;
        const searchQuery = document.getElementById('admin-search-issues').value.toLowerCase();

        let issues = store.getIssues();

        // Apply filters
        if (deptFilter) {
            issues = issues.filter(i => i.department && i.department.includes(deptFilter));
        }
        if (statusFilter) {
            issues = issues.filter(i => i.status === statusFilter);
        }
        if (searchQuery) {
            issues = issues.filter(i => 
                i.id.toLowerCase().includes(searchQuery) ||
                i.title.toLowerCase().includes(searchQuery) ||
                i.category.toLowerCase().includes(searchQuery) ||
                i.location.address.toLowerCase().includes(searchQuery)
            );
        }

        if (issues.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="padding: 40px; text-align: center; color: var(--text-secondary);">
                        <i data-lucide="folder-open" style="width: 40px; height: 40px; margin-bottom: 10px; opacity: 0.5;"></i>
                        <p>No complaints match the selected filter criteria.</p>
                    </td>
                </tr>
            `;
            if (window.lucide) window.lucide.createIcons();
            return;
        }

        tableBody.innerHTML = issues.map(issue => {
            let badgeStyle = '';
            let statusText = t('status_' + issue.status.toLowerCase().replace(' ', '_'), issue.status);
            if (issue.status === 'Reported') badgeStyle = 'background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3);';
            else if (issue.status === 'Verified') badgeStyle = 'background: rgba(59, 130, 246, 0.15); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3);';
            else if (issue.status === 'In Progress') badgeStyle = 'background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3);';
            else if (issue.status === 'Resolved') badgeStyle = 'background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3);';

            return `
                <tr style="border-bottom: 1px solid var(--border-color); background: rgba(30, 41, 59, 0.2);" class="admin-table-row" data-id="${issue.id}">
                    <td style="padding: 16px 20px;"><input type="checkbox" class="issue-select-checkbox" value="${issue.id}"></td>
                    <td style="padding: 16px 20px;">
                        <a href="#issue/${issue.id}" style="color: var(--text-primary); font-weight: 600; text-decoration: none; display: block; margin-bottom: 4px;" class="admin-issue-link">${issue.title}</a>
                        <div style="font-size: 12px; color: var(--text-secondary); display: flex; align-items: center; gap: 8px;">
                            <span>ID: <strong>${issue.id.substring(0, 11)}</strong></span>
                            <span>•</span>
                            <span>📍 ${issue.location.address.split(', ')[2] || issue.location.address.split(', ').at(-1) || 'Delhi'}</span>
                            <span>•</span>
                            <span style="color: #a78bfa;">🔥 ${issue.upvotes} Votes</span>
                        </div>
                    </td>
                    <td style="padding: 16px 20px; font-size: 13px; color: var(--text-secondary);">${issue.department || 'Not Assigned'}</td>
                    <td style="padding: 16px 20px;"><span class="badge" style="padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; ${badgeStyle}">${statusText}</span></td>
                    <td style="padding: 16px 20px; font-size: 13px; color: var(--text-secondary);">${formatFriendlyDate(issue.reportedAt)}</td>
                    <td style="padding: 16px 20px; text-align: right;">
                        <select class="row-status-select" data-id="${issue.id}" style="padding: 6px 8px; border-radius: 4px; background: rgba(15, 23, 42, 0.8); border: 1px solid var(--border-color); color: var(--text-primary); font-size: 12px;">
                            <option value="Reported" ${issue.status === 'Reported' ? 'selected' : ''}>Reported</option>
                            <option value="Verified" ${issue.status === 'Verified' ? 'selected' : ''}>Verified</option>
                            <option value="In Progress" ${issue.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                            <option value="Resolved" ${issue.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                        </select>
                    </td>
                </tr>
            `;
        }).join('');

        if (window.lucide) {
            window.lucide.createIcons();
        }

        // Add change listener to row status selects
        document.querySelectorAll('.row-status-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const issueId = e.target.getAttribute('data-id');
                const newStatus = e.target.value;
                this.updateSingleStatus(issueId, newStatus);
            });
        });

        // Add checkbox listener to update bulk bar
        document.querySelectorAll('.issue-select-checkbox').forEach(cb => {
            cb.addEventListener('change', () => this.updateBulkBar());
        });
    },

    updateSingleStatus(issueId, newStatus) {
        const issue = store.getIssueById(issueId);
        if (!issue) return;

        const prevStatus = issue.status;
        issue.status = newStatus;
        
        // Add timeline node
        issue.timeline.push({
            status: newStatus,
            timestamp: new Date().toISOString(),
            note: `Status updated to ${newStatus} by Delhi administrative authority staff.`,
            actor: issue.department || 'Delhi Civil Authority'
        });

        store.saveIssue(issue);
        showToast(`Updated issue ${issueId.substring(0,8)} status from ${prevStatus} to ${newStatus}`, "success");
        this.renderTableRows();
    },

    updateBulkBar() {
        const checkboxes = document.querySelectorAll('.issue-select-checkbox:checked');
        const bulkBar = document.getElementById('bulk-operations-bar');
        const countText = document.getElementById('selected-count');

        if (checkboxes.length > 0) {
            bulkBar.style.display = 'flex';
            countText.textContent = `${checkboxes.length} complaints selected`;
        } else {
            bulkBar.style.display = 'none';
        }
    },

    setupEventListeners() {
        const selectAll = document.getElementById('select-all-issues');
        const filterDept = document.getElementById('admin-filter-dept');
        const filterStatus = document.getElementById('admin-filter-status');
        const searchInput = document.getElementById('admin-search-issues');
        const applyBulk = document.getElementById('apply-bulk-status');
        const clearBulk = document.getElementById('clear-selections');
        const bulkStatusSelect = document.getElementById('bulk-status-select');

        // Select All Handler
        selectAll.addEventListener('change', () => {
            const rowCheckboxes = document.querySelectorAll('.issue-select-checkbox');
            rowCheckboxes.forEach(cb => {
                cb.checked = selectAll.checked;
            });
            this.updateBulkBar();
        });

        // Filter Handlers
        filterDept.addEventListener('change', () => this.renderTableRows());
        filterStatus.addEventListener('change', () => this.renderTableRows());
        searchInput.addEventListener('input', () => this.renderTableRows());

        // Clear Selections
        clearBulk.addEventListener('click', () => {
            const rowCheckboxes = document.querySelectorAll('.issue-select-checkbox');
            rowCheckboxes.forEach(cb => cb.checked = false);
            selectAll.checked = false;
            this.updateBulkBar();
        });

        // Apply Bulk Status Changes
        applyBulk.addEventListener('click', () => {
            const newStatus = bulkStatusSelect.value;
            if (!newStatus) {
                showToast("Please choose a status to apply in bulk.", "warning");
                return;
            }

            const checkedBoxes = document.querySelectorAll('.issue-select-checkbox:checked');
            let updatedCount = 0;

            checkedBoxes.forEach(cb => {
                const issueId = cb.value;
                const issue = store.getIssueById(issueId);
                if (issue && issue.status !== newStatus) {
                    issue.status = newStatus;
                    issue.timeline.push({
                        status: newStatus,
                        timestamp: new Date().toISOString(),
                        note: `Bulk status update applied by city control administrators.`,
                        actor: issue.department || 'Delhi Civil Authority'
                    });
                    store.saveIssue(issue);
                    updatedCount++;
                }
            });

            showToast(`Batch updated ${updatedCount} complaints to status: ${newStatus}`, "success");
            selectAll.checked = false;
            this.updateBulkBar();
            this.renderTableRows();
        });
    }
};
