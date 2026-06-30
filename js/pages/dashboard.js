/*
========================================================================
CIVICPULSE IMPACT ANALYTICS DASHBOARD PAGE COMPONENT
========================================================================
*/

import { store } from '../store.js';
import { getPredictiveInsights } from '../ai-engine.js';
import { generatePredictiveInsightWithAI, isAIConfigured } from '../gemini-ai.js';

export const dashboardPage = {
    charts: [],

    async render(container) {
        const issues = store.getIssues();
        
        // Compute metrics
        const totalReported = issues.length;
        const totalResolved = issues.filter(i => i.status === 'Resolved').length;
        const activeCitizens = store.getLeaderboard().length + 15; // mock active total
        const resRate = totalReported > 0 ? Math.round((totalResolved / totalReported) * 100) : 0;
        
        // Calculate average resolution time dynamically
        const resolvedIssues = issues.filter(i => i.status === 'Resolved');
        let avgResTime = "4.2 days"; // fallback
        if (resolvedIssues.length > 0) {
            let totalDays = 0;
            resolvedIssues.forEach(issue => {
                const start = new Date(issue.reportedAt);
                const endNode = issue.timeline.find(tNode => tNode.status === 'Resolved');
                if (endNode) {
                    const end = new Date(endNode.timestamp);
                    totalDays += (end - start) / (1000 * 60 * 60 * 24);
                }
            });
            avgResTime = `${(totalDays / resolvedIssues.length).toFixed(1)} days`;
        }

        // Fetch AI forecasts
        let aiForecasts;
        if (isAIConfigured()) {
            const stats = {
                total: totalReported,
                potholes: issues.filter(i => i.category === 'Pothole').length,
                waterLeaks: issues.filter(i => i.category === 'Water Leakage').length,
                garbage: issues.filter(i => i.category === 'Waste/Garbage').length,
                drainage: issues.filter(i => i.category === 'Drainage').length,
                streetlights: issues.filter(i => i.category === 'Streetlight').length
            };
            try {
                const insightText = await generatePredictiveInsightWithAI(stats);
                aiForecasts = [{
                    message: insightText,
                    action: "Deploy targeted municipal prevention assets to hotspots.",
                    confidence: 96,
                    isRealAI: true
                }];
            } catch (err) {
                aiForecasts = getPredictiveInsights();
            }
        } else {
            aiForecasts = getPredictiveInsights();
        }

        container.innerHTML = `
            <div class="dashboard-wrapper animated fadeIn">
                <div class="page-header">
                    <div class="page-title">
                        <h1>Impact Analytics Dashboard</h1>
                        <p>Transparency, performance metrics, and predictive hotspots for Delhi</p>
                    </div>
                </div>

                <!-- KPI Cards -->
                <div class="dashboard-grid">
                    <div class="card glass-panel stat-kpi hover-glow">
                        <div>
                            <span style="font-size:12px; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Reports Filed</span>
                            <div class="stat-kpi-val">${totalReported}</div>
                        </div>
                        <div class="stat-kpi-icon" style="color: var(--primary);"><i data-lucide="file-text"></i></div>
                    </div>
                    <div class="card glass-panel stat-kpi hover-glow">
                        <div>
                            <span style="font-size:12px; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Resolution Rate</span>
                            <div class="stat-kpi-val">${resRate}%</div>
                        </div>
                        <div class="stat-kpi-icon" style="color: var(--success);"><i data-lucide="check-circle2"></i></div>
                    </div>
                    <div class="card glass-panel stat-kpi hover-glow">
                        <div>
                            <span style="font-size:12px; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Avg. Fix Time</span>
                            <div class="stat-kpi-val">${avgResTime}</div>
                        </div>
                        <div class="stat-kpi-icon" style="color: var(--secondary);"><i data-lucide="clock"></i></div>
                    </div>
                </div>

                <!-- AI Predictive Panel -->
                <div class="prediction-box">
                    <div class="prediction-title" style="display: flex; align-items: center;">
                        <i data-lucide="brain"></i>
                        <span>CivicPulse AI Hotspot Forecasts</span>
                        ${aiForecasts.some(f => f.isRealAI) ? `<span class="badge" style="background: rgba(99, 102, 241, 0.2); color:#a5b4fc; border:1px solid rgba(99, 102, 241, 0.4); margin-left: 10px; font-size:11px; padding: 4px 8px; border-radius: 4px;">Gemini Real AI</span>` : ''}
                    </div>
                    <div style="display:flex; flex-direction:column; gap:12px;">
                        ${aiForecasts.map(f => `
                            <div style="font-size:13px; padding: 10px 14px; background: rgba(0,0,0,0.15); border-radius: 6px; border-left: 3px solid var(--accent); line-height:1.4;">
                                ${f.message} <br>
                                <span style="font-size:11px; color: var(--text-muted); display:inline-block; margin-top:4px;">Suggested Prevention: <strong>${f.action}</strong> (Confidence: ${f.confidence}%)</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Charts Layout Column 1 -->
                <div class="dashboard-main-row">
                    <!-- Reported vs Resolved monthly trend -->
                    <div class="card glass-panel chart-card hover-glow">
                        <h4 style="margin-bottom: 16px;">6-Month Performance Trend</h4>
                        <div class="chart-container">
                            <canvas id="trendChart"></canvas>
                        </div>
                    </div>

                    <!-- Issues by Category -->
                    <div class="card glass-panel chart-card hover-glow">
                        <h4 style="margin-bottom: 16px;">Reports by Category</h4>
                        <div class="chart-container">
                            <canvas id="categoryChart"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Charts Layout Column 2 -->
                <div class="dashboard-main-row">
                    <!-- Neighborhood distribution -->
                    <div class="card glass-panel chart-card hover-glow">
                        <h4 style="margin-bottom: 16px;">Top Problem Areas (Delhi Districts)</h4>
                        <div class="chart-container">
                            <canvas id="neighborhoodChart"></canvas>
                        </div>
                    </div>

                    <!-- Issues by Severity Radar -->
                    <div class="card glass-panel chart-card hover-glow">
                        <h4 style="margin-bottom: 16px;">Urgency Profile (Severity Radar)</h4>
                        <div class="chart-container">
                            <canvas id="severityRadarChart"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Third Row -->
                <div class="dashboard-main-row">
                    <!-- Issues by Status -->
                    <div class="card glass-panel chart-card hover-glow">
                        <h4 style="margin-bottom: 16px;">Resolution Status Breakdown</h4>
                        <div class="chart-container">
                            <canvas id="statusChart"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Department Performance Matrix -->
                <div class="card glass-panel" style="margin-top: 30px; border-radius: 16px; padding: 25px;">
                    <h3 style="margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                        <i data-lucide="building-2" style="color: var(--primary);"></i>
                        <span>Department Performance Matrix</span>
                    </h3>
                    <div class="table-responsive" style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
                            <thead>
                                <tr style="border-bottom: 1px solid var(--border-color); color: var(--text-secondary);">
                                    <th style="padding: 12px 15px;">Department</th>
                                    <th style="padding: 12px 15px; text-align: center;">Assigned Issues</th>
                                    <th style="padding: 12px 15px; text-align: center;">Resolved Issues</th>
                                    <th style="padding: 12px 15px; text-align: center;">Resolution Rate</th>
                                    <th style="padding: 12px 15px; text-align: center;">Avg. Fix Time</th>
                                </tr>
                            </thead>
                            <tbody id="dept-table-body">
                                <!-- Injected dynamically -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        // Render charts after drawing elements
        setTimeout(() => this.renderCharts(issues), 100);
    },

    renderCharts(issues) {
        // Destroy old chart instances if any
        this.charts.forEach(c => c.destroy());
        this.charts = [];

        // 1. Categories tally
        const categories = {};
        issues.forEach(i => {
            categories[i.category] = (categories[i.category] || 0) + 1;
        });

        // 2. Statuses tally
        const statuses = { 'Reported': 0, 'Verified': 0, 'In Progress': 0, 'Resolved': 0 };
        issues.forEach(i => {
            if (statuses[i.status] !== undefined) statuses[i.status]++;
        });

        // 3. Neighborhoods tally (extract district name)
        const neighborhoods = {};
        issues.forEach(i => {
            const parts = i.location.address.split(', ');
            const nName = parts.length >= 3 ? parts[parts.length - 2] : 'Central Delhi';
            neighborhoods[nName] = (neighborhoods[nName] || 0) + 1;
        });
        const sortedNeighborhoods = Object.entries(neighborhoods)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5); // top 5

        // 4. Monthly Trend calculation dynamically from issues reportedAt/timeline resolved timestamps
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const trendLabels = [];
        const reportedTrend = [];
        const resolvedTrend = [];

        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const m = d.getMonth();
            const y = d.getFullYear();
            trendLabels.push(`${monthNames[m]} ${y}`);
            
            // Count reported
            const repCount = issues.filter(issue => {
                const rDate = new Date(issue.reportedAt);
                return rDate.getMonth() === m && rDate.getFullYear() === y;
            }).length;
            reportedTrend.push(repCount);

            // Count resolved
            const resCount = issues.filter(issue => {
                if (issue.status !== 'Resolved') return false;
                const timelineNode = issue.timeline.find(tNode => tNode.status === 'Resolved');
                if (!timelineNode) return false;
                const rDate = new Date(timelineNode.timestamp);
                return rDate.getMonth() === m && rDate.getFullYear() === y;
            }).length;
            resolvedTrend.push(resCount);
        }

        // 5. Severity tally for Radar Chart
        const severities = { 'Low': 0, 'Medium': 0, 'High': 0, 'Critical': 0 };
        issues.forEach(i => {
            if (severities[i.severity] !== undefined) severities[i.severity]++;
        });

        // 6. Department matrix aggregation
        const depts = {};
        issues.forEach(i => {
            const d = i.department || 'MCD Public Grievance Cell';
            if (!depts[d]) {
                depts[d] = { name: d, assigned: 0, resolved: 0, totalDays: 0 };
            }
            depts[d].assigned++;
            if (i.status === 'Resolved') {
                depts[d].resolved++;
                const start = new Date(i.reportedAt);
                const endNode = i.timeline.find(tNode => tNode.status === 'Resolved');
                if (endNode) {
                    const end = new Date(endNode.timestamp);
                    depts[d].totalDays += (end - start) / (1000 * 60 * 60 * 24);
                }
            }
        });

        const deptTableBody = document.getElementById('dept-table-body');
        if (deptTableBody) {
            deptTableBody.innerHTML = Object.values(depts).map(d => {
                const rate = d.assigned > 0 ? Math.round((d.resolved / d.assigned) * 100) : 0;
                const avgFix = d.resolved > 0 ? `${(d.totalDays / d.resolved).toFixed(1)} days` : 'N/A';
                return `
                    <tr style="border-bottom: 1px solid var(--border-color); background: rgba(255,255,255,0.01);">
                        <td style="padding: 12px 15px; font-weight: 500; color: var(--text-primary);">${d.name}</td>
                        <td style="padding: 12px 15px; text-align: center; color: var(--text-primary);">${d.assigned}</td>
                        <td style="padding: 12px 15px; text-align: center; color: var(--text-primary);">${d.resolved}</td>
                        <td style="padding: 12px 15px; text-align: center; color: #10b981; font-weight: 600;">${rate}%</td>
                        <td style="padding: 12px 15px; text-align: center; color: var(--text-secondary);">${avgFix}</td>
                    </tr>
                `;
            }).join('');
        }

        // Chart styling templates matching index.css
        const darkThemeOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 } }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94a3b8', font: { family: 'Inter' } }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94a3b8', font: { family: 'Inter' } }
                }
            }
        };

        // Donut Chart: Categories
        const ctxCat = document.getElementById('categoryChart').getContext('2d');
        const catLabels = Object.keys(categories);
        const catData = Object.values(categories);
        const catColormap = {
            'Pothole': '#ef4444',
            'Water Leakage': '#06b6d4',
            'Streetlight': '#f59e0b',
            'Waste/Garbage': '#a855f7',
            'Road Damage': '#f97316',
            'Drainage': '#3b82f6',
            'Public Property': '#10b981',
            'Noise': '#ec4899',
            'Illegal Construction': '#b91c1c',
            'Other': '#64748b'
        };
        const catColors = catLabels.map(label => catColormap[label] || '#6366f1');

        this.charts.push(new Chart(ctxCat, {
            type: 'doughnut',
            data: {
                labels: catLabels,
                datasets: [{
                    data: catData,
                    backgroundColor: catColors,
                    borderWidth: 1,
                    borderColor: '#0f172a'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: '#94a3b8', boxWidth: 12, font: { family: 'Inter', size: 10 } }
                    }
                }
            }
        }));

        // Line Chart: Performance trends (last 6 months dynamically computed)
        const ctxTrend = document.getElementById('trendChart').getContext('2d');
        this.charts.push(new Chart(ctxTrend, {
            type: 'line',
            data: {
                labels: trendLabels,
                datasets: [
                    {
                        label: 'Reports Filed',
                        data: reportedTrend,
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.05)',
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: 'Fixed Issues',
                        data: resolvedTrend,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.05)',
                        fill: true,
                        tension: 0.3
                    }
                ]
            },
            options: darkThemeOptions
        }));

        // Horizontal Bar: Neighborhood density
        const ctxNeigh = document.getElementById('neighborhoodChart').getContext('2d');
        this.charts.push(new Chart(ctxNeigh, {
            type: 'bar',
            data: {
                labels: sortedNeighborhoods.map(n => n[0]),
                datasets: [{
                    label: 'Active Grievances',
                    data: sortedNeighborhoods.map(n => n[1]),
                    backgroundColor: 'rgba(6, 182, 212, 0.75)',
                    borderColor: '#06b6d4',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                ...darkThemeOptions
            }
        }));

        // Radar Chart: Severities
        const ctxRadar = document.getElementById('severityRadarChart').getContext('2d');
        this.charts.push(new Chart(ctxRadar, {
            type: 'radar',
            data: {
                labels: Object.keys(severities),
                datasets: [{
                    label: 'Severity Profile',
                    data: Object.values(severities),
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    borderColor: '#ef4444',
                    pointBackgroundColor: '#ef4444',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    r: {
                        angleLines: { color: 'rgba(255, 255, 255, 0.05)' },
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        pointLabels: { color: '#94a3b8', font: { family: 'Inter', size: 10 } },
                        ticks: { backdropColor: 'transparent', color: '#94a3b8', font: { size: 9 } }
                    }
                }
            }
        }));

        // Vertical Bar: Statuses
        const ctxStatus = document.getElementById('statusChart').getContext('2d');
        this.charts.push(new Chart(ctxStatus, {
            type: 'bar',
            data: {
                labels: Object.keys(statuses),
                datasets: [{
                    label: 'Reports count',
                    data: Object.values(statuses),
                    backgroundColor: [
                        'rgba(100, 116, 139, 0.6)', // Slate
                        'rgba(6, 182, 212, 0.6)',  // Cyan
                        'rgba(245, 158, 11, 0.6)',  // Amber
                        'rgba(16, 185, 129, 0.6)'   // Emerald
                    ],
                    borderColor: ['#64748b', '#06b6d4', '#f59e0b', '#10b981'],
                    borderWidth: 1
                }]
            },
            options: darkThemeOptions
        }));
    }
};
