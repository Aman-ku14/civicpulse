/*
========================================================================
CIVICPULSE LEADERBOARD & GAMIFICATION PAGE COMPONENT
========================================================================
*/

import { store } from '../store.js';

export const leaderboardPage = {
    async render(container) {
        const leaderboard = store.getLeaderboard();
        const user = store.getUser();
        
        // Split top 3 for podium
        const first = leaderboard.find(item => item.rank === 1);
        const second = leaderboard.find(item => item.rank === 2);
        const third = leaderboard.find(item => item.rank === 3);
        const remaining = leaderboard.filter(item => item.rank > 3);

        container.innerHTML = `
            <div class="leaderboard-wrapper animated fadeIn">
                <div class="page-header">
                    <div class="page-title">
                        <h1>Citizen Leaderboard</h1>
                        <p>Earn points by reporting issues, verifying reports, and keeping Delhi safe</p>
                    </div>
                </div>

                <!-- Podium Layout for Top 3 -->
                <div class="leaderboard-podium">
                    <!-- 2nd Place -->
                    ${second ? `
                        <div class="podium-item second">
                            <div class="podium-avatar">${second.avatarChar}</div>
                            <div class="leaderboard-name">${second.name}</div>
                            <div class="leaderboard-pts">${second.points} pts</div>
                            <div class="podium-stand">
                                <span class="podium-rank">2</span>
                                <span style="font-size:10px; color:var(--text-muted); text-transform:uppercase;">${second.level}</span>
                            </div>
                        </div>
                    ` : ''}

                    <!-- 1st Place (Winner) -->
                    ${first ? `
                        <div class="podium-item first">
                            <span class="podium-crown">👑</span>
                            <div class="podium-avatar" style="box-shadow: 0 0 25px rgba(245, 158, 11, 0.4);">${first.avatarChar}</div>
                            <div class="leaderboard-name" style="font-weight:700;">${first.name}</div>
                            <div class="leaderboard-pts" style="color:var(--accent); font-weight:700;">${first.points} pts</div>
                            <div class="podium-stand">
                                <span class="podium-rank">1</span>
                                <span style="font-size:10px; color:var(--accent); font-weight:700; text-transform:uppercase;">${first.level}</span>
                            </div>
                        </div>
                    ` : ''}

                    <!-- 3rd Place -->
                    ${third ? `
                        <div class="podium-item third">
                            <div class="podium-avatar">${third.avatarChar}</div>
                            <div class="leaderboard-name">${third.name}</div>
                            <div class="leaderboard-pts">${third.points} pts</div>
                            <div class="podium-stand">
                                <span class="podium-rank">3</span>
                                <span style="font-size:10px; color:var(--text-muted); text-transform:uppercase;">${third.level}</span>
                            </div>
                        </div>
                    ` : ''}
                </div>

                <!-- Table for Remaining Ranks -->
                <div class="tbl-container">
                    <table class="leaderboard-tbl">
                        <thead>
                            <tr>
                                <th class="rank-col">Rank</th>
                                <th class="avatar-col">User</th>
                                <th>Name</th>
                                <th>Level</th>
                                <th>Points</th>
                                <th>Badges Unlocked</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${remaining.map(item => {
                                const isCurrentUser = item.name === user.name;
                                const rowStyle = isCurrentUser ? 'style="background: linear-gradient(to right, rgba(99, 102, 241, 0.1), transparent); font-weight: 600;"' : '';
                                const userLabel = isCurrentUser ? `${item.name} <span class="pill pill-verified" style="font-size:8px; padding:1px 4px; margin-left:6px;">You</span>` : item.name;

                                return `
                                    <tr ${rowStyle}>
                                        <td class="rank-col">${item.rank}</td>
                                        <td class="avatar-col">
                                            <div class="tbl-avatar" style="${isCurrentUser ? 'background: var(--primary); color: white;' : ''}">
                                                ${item.avatarChar}
                                            </div>
                                        </td>
                                        <td>${userLabel}</td>
                                        <td><span class="pill ${isCurrentUser ? 'pill-verified' : 'pill-reported'}" style="font-size:10px;">${item.level}</span></td>
                                        <td style="font-weight:700;">${item.points}</td>
                                        <td>
                                            <div class="leaderboard-badges-container">
                                                ${item.badges.map(b => `<span class="badge-tag">${b}</span>`).join('')}
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
};
