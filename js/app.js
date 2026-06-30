/*
========================================================================
CIVICPULSE ROOT SPA APP ENGINE & CLIENT ROUTER
Orchestrates global lifecycles, sidebar, router, and toast events.
========================================================================
*/

import { store } from './store.js';
import { homePage } from './pages/home.js';
import { mapPage } from './pages/map.js';
import { reportPage } from './pages/report.js';
import { dashboardPage } from './pages/dashboard.js';
import { leaderboardPage } from './pages/leaderboard.js';
import { profilePage } from './pages/profile.js';
import { issueDetailPage } from './pages/issue-detail.js';
import { settingsPage } from './pages/settings.js';
import { adminPage } from './pages/admin.js';
import { AuthManager } from './auth.js';
import { getLanguage, setLanguage, translateDOM, t } from './i18n.js';
import { NotificationManager } from './notifications.js';
import { formatRelativeTime } from './utils.js';

class CivicPulseApp {
    constructor() {
        this.pageContainer = document.getElementById('page-container');
        this.navLinks = document.querySelectorAll('.nav-item');
        this.sidebar = document.querySelector('.sidebar');
        this.menuToggle = document.getElementById('menuToggle');
        this.globalSearch = document.getElementById('globalSearch');
        
        this.routes = {
            'home': homePage,
            'map': mapPage,
            'report': reportPage,
            'dashboard': dashboardPage,
            'leaderboard': leaderboardPage,
            'profile': profilePage,
            'issue': issueDetailPage,
            'settings': settingsPage,
            'admin': adminPage
        };

        this.init();
    }

    init() {
        // Set up authentication modal handlers
        this.setupAuthHandlers();

        // Router listeners
        window.addEventListener('hashchange', () => this.route());

        // Since this script loads as type="module" it is deferred — DOM is already
        // parsed by the time this runs, so DOMContentLoaded has already fired.
        // Call setup directly instead of registering a listener that will never fire.
        this.setupLanguageToggle();

        // Auth Check on Init
        if (!AuthManager.isLoggedIn()) {
            this.showAuthModal();
        } else {
            this.route();
        }

        this.updateSidebarUser();

        // Re-render user info if store updates
        store.subscribe(() => {
            this.updateSidebarUser();
        });

        // Listen for logout event dispatched by AuthManager (avoids page reload loop)
        window.addEventListener('civicpulse:logout', () => {
            this.pageContainer.innerHTML = '';
            this.updateSidebarUser();
            this.showAuthModal();
        });

        // Mobile sidebar toggle
        if (this.menuToggle) {
            this.menuToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.sidebar.classList.toggle('active');
            });
        }

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && !this.sidebar.contains(e.target) && e.target !== this.menuToggle) {
                this.sidebar.classList.remove('active');
            }
        });
        
        // Close sidebar when clicking a nav link on mobile
        this.navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    this.sidebar.classList.remove('active');
                }
            });
        });

        // Search dropdown logic
        if (this.globalSearch) {
            const resultsDropdown = document.getElementById('searchResults');
            let debounceTimer;

            this.globalSearch.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                const query = e.target.value.trim().toLowerCase();
                
                if (!query) {
                    resultsDropdown.style.display = 'none';
                    return;
                }

                debounceTimer = setTimeout(() => {
                    const issues = store.getIssues();
                    const matched = issues.filter(issue => 
                        issue.title.toLowerCase().includes(query) || 
                        issue.category.toLowerCase().includes(query) ||
                        issue.location.address.toLowerCase().includes(query)
                    ).slice(0, 5); // top 5

                    if (matched.length > 0) {
                        resultsDropdown.innerHTML = matched.map(m => `
                            <a href="#issue?id=${m.id}" class="search-result-item">
                                <div class="search-result-icon">
                                    <i data-lucide="map-pin"></i>
                                </div>
                                <div class="search-result-content">
                                    <h6>${m.title}</h6>
                                    <p>${m.location.address}</p>
                                </div>
                            </a>
                        `).join('');
                        if (window.lucide) window.lucide.createIcons();
                        resultsDropdown.style.display = 'block';
                    } else {
                        resultsDropdown.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:13px;">No results found</div>';
                        resultsDropdown.style.display = 'block';
                    }
                }, 300);
            });

            this.globalSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const query = this.globalSearch.value.trim();
                    if (query) {
                        window.location.hash = `#map?search=${encodeURIComponent(query)}`;
                        this.globalSearch.value = '';
                        resultsDropdown.style.display = 'none';
                    }
                }
            });

            // Close on click outside
            document.addEventListener('click', (e) => {
                if (!this.globalSearch.contains(e.target) && !resultsDropdown.contains(e.target)) {
                    resultsDropdown.style.display = 'none';
                }
            });
            
            // Close on result click
            resultsDropdown.addEventListener('click', (e) => {
                if (e.target.closest('.search-result-item')) {
                    resultsDropdown.style.display = 'none';
                    this.globalSearch.value = '';
                }
            });
        }

        // Initialize notifications UI
        this.initNotifications();
    }

    initNotifications() {
        const notifBtn = document.getElementById('notifBtn');
        const notifDropdown = document.getElementById('notifDropdown');
        const markAllReadBtn = document.getElementById('markAllReadBtn');

        const renderNotifications = () => {
            const notifs = NotificationManager.getNotifications();
            const unreadCount = NotificationManager.getUnreadCount();
            const badge = document.getElementById('notifCount');
            const list = document.getElementById('notifList');
            
            if (badge) {
                badge.textContent = unreadCount;
                badge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
            }
            
            if (list) {
                if (notifs.length === 0) {
                    list.innerHTML = '<div style="padding:20px; text-align:center; color:var(--text-muted); font-size:13px;">No notifications yet</div>';
                } else {
                    list.innerHTML = notifs.map(n => `
                        <a href="${n.link || '#'}" class="notif-item ${n.read ? '' : 'unread'}" data-id="${n.id}">
                            <div class="notif-item-icon ${n.type}">
                                <i data-lucide="${n.type === 'success' ? 'check' : n.type === 'warning' ? 'alert-circle' : 'info'}"></i>
                            </div>
                            <div class="notif-item-content">
                                <h5>${n.title}</h5>
                                <p>${n.message}</p>
                                <span class="notif-time">${formatRelativeTime(n.timestamp)}</span>
                            </div>
                        </a>
                    `).join('');
                    if (window.lucide) window.lucide.createIcons();
                }
            }
        };

        if (notifBtn && notifDropdown) {
            notifBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                notifDropdown.style.display = notifDropdown.style.display === 'none' ? 'flex' : 'none';
            });
            
            document.addEventListener('click', (e) => {
                if (!notifBtn.contains(e.target) && !notifDropdown.contains(e.target)) {
                    notifDropdown.style.display = 'none';
                }
            });
            
            document.getElementById('notifList').addEventListener('click', (e) => {
                const item = e.target.closest('.notif-item');
                if (item) {
                    NotificationManager.markAsRead(item.dataset.id);
                    notifDropdown.style.display = 'none';
                }
            });
        }

        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                NotificationManager.markAllRead();
            });
        }

        // Listen for updates
        window.addEventListener('civicpulse:notifications_updated', renderNotifications);
        
        // Initial render
        renderNotifications();
    }

    setupAuthHandlers() {
        const modal = document.getElementById('auth-modal');
        const tabLogin = document.getElementById('tab-login');
        const tabSignup = document.getElementById('tab-signup');
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');

        if (!modal) return;

        // Switch to login tab
        tabLogin.addEventListener('click', () => {
            tabLogin.classList.add('active');
            tabSignup.classList.remove('active');
            loginForm.style.display = 'block';
            signupForm.style.display = 'none';
        });

        // Switch to signup tab
        tabSignup.addEventListener('click', () => {
            tabSignup.classList.add('active');
            tabLogin.classList.remove('active');
            loginForm.style.display = 'none';
            signupForm.style.display = 'block';
        });

        // Login submit
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value.trim();
            const pass = document.getElementById('login-password').value.trim();
            
            try {
                AuthManager.login(email, pass);
                import('./utils.js').then(utils => {
                    utils.showToast("Signed in successfully. Welcome back!", "success");
                });
                modal.style.display = 'none';
                this.updateSidebarUser();
                this.route();
            } catch (err) {
                import('./utils.js').then(utils => {
                    utils.showToast(err.message, "error");
                });
            }
        });

        // Signup submit
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('signup-name').value.trim();
            const email = document.getElementById('signup-email').value.trim();
            const pass = document.getElementById('signup-password').value.trim();
            
            try {
                AuthManager.signup(name, email, pass);
                import('./utils.js').then(utils => {
                    utils.showToast("Account created successfully. Welcome to CivicPulse!", "success");
                });
                modal.style.display = 'none';
                this.updateSidebarUser();
                this.route();
            } catch (err) {
                import('./utils.js').then(utils => {
                    utils.showToast(err.message, "error");
                });
            }
        });
    }

    showAuthModal() {
        this.pageContainer.innerHTML = ''; // Clear the initial loading spinner
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    setupLanguageToggle() {
        const toggleBtn = document.getElementById('langToggle');
        if (!toggleBtn) return;

        // Set initial language label
        const currentLang = getLanguage();
        toggleBtn.querySelector('span').textContent = currentLang === 'en' ? 'हिं' : 'EN';
        translateDOM(); // Translate DOM elements initially

        toggleBtn.addEventListener('click', () => {
            const nextLang = getLanguage() === 'en' ? 'hi' : 'en';
            setLanguage(nextLang);
            toggleBtn.querySelector('span').textContent = nextLang === 'en' ? 'हिं' : 'EN';
            import('./utils.js').then(utils => {
                utils.showToast(nextLang === 'en' ? "Language changed to English" : "भाषा बदलकर हिंदी की गई", "info");
            });
        });
    }

    updateSidebarUser() {
        const userInfoContainer = document.getElementById('sidebar-user-info');
        if (!userInfoContainer) return;

        const user = store.getUser();
        if (!user) return;
        
        // Show/hide admin-only nav items based on role
        const adminLinks = document.querySelectorAll('.nav-item[data-page="admin"], .nav-item[data-page="settings"]');
        adminLinks.forEach(link => {
            link.style.display = user.isAdmin ? 'flex' : 'none';
        });
        
        // Build sidebar user info safely using DOM APIs (avoids XSS from user.name)
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'display: flex; align-items: center; justify-content: space-between; width: 100%;';

        const leftDiv = document.createElement('div');
        leftDiv.style.cssText = 'display: flex; align-items: center; gap: 10px;';

        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'quick-avatar';
        avatarDiv.textContent = user.avatarChar;

        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'quick-details';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'quick-name';
        nameSpan.textContent = user.name;

        const levelSpan = document.createElement('span');
        levelSpan.className = 'quick-level';
        levelSpan.textContent = `${user.level} (Lvl ${Math.floor(user.points / 150) + 1})`;

        detailsDiv.appendChild(nameSpan);
        detailsDiv.appendChild(levelSpan);
        leftDiv.appendChild(avatarDiv);
        leftDiv.appendChild(detailsDiv);

        const logoutButton = document.createElement('button');
        logoutButton.id = 'logout-btn';
        logoutButton.className = 'btn-icon-only';
        logoutButton.style.cssText = 'background: none; border: none; color: var(--danger); cursor: pointer; padding: 5px; display: flex; align-items: center; justify-content: center;';
        logoutButton.title = t('logout');
        logoutButton.innerHTML = '<i data-lucide="log-out" style="width: 18px; height: 18px;"></i>';
        logoutButton.addEventListener('click', (e) => {
            e.stopPropagation();
            AuthManager.logout();
        });

        wrapper.appendChild(leftDiv);
        wrapper.appendChild(logoutButton);

        userInfoContainer.innerHTML = '';
        userInfoContainer.appendChild(wrapper);

        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    /**
     * Main router method
     */
    async route() {
        // Enforce login modal before loading any page
        if (!AuthManager.isLoggedIn()) {
            this.showAuthModal();
            return;
        }

        const hash = window.location.hash || '#home';
        
        // Parse parameters e.g., #issue/123 or #map?search=pothole
        let pageName = 'home';
        let param = null;
        let queryParams = {};

        if (hash.startsWith('#')) {
            const cleanHash = hash.slice(1);
            if (cleanHash.includes('?')) {
                const parts = cleanHash.split('?');
                pageName = parts[0];
                const searchParams = new URLSearchParams(parts[1]);
                for (let [key, val] of searchParams.entries()) {
                    queryParams[key] = val;
                }
            } else if (cleanHash.includes('/')) {
                const parts = cleanHash.split('/');
                pageName = parts[0];
                param = parts[1];
            } else {
                pageName = cleanHash;
            }
        }

        // Role-Based Access Control (RBAC) check for admin-only pages
        const user = store.getUser();
        if ((pageName === 'admin' || pageName === 'settings') && (!user || !user.isAdmin)) {
            import('./utils.js').then(utils => {
                utils.showToast("Access Denied: Administrator privileges required.", "error");
            });
            window.location.hash = '#home';
            return;
        }

        // Highlight matching link in nav sidebar
        this.navLinks.forEach(link => {
            if (link.getAttribute('data-page') === pageName) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Close sidebar on route (for mobile)
        this.sidebar.classList.remove('active');

        // Check if page handler exists
        const page = this.routes[pageName];
        if (!page) {
            this.pageContainer.innerHTML = `
                <div style="padding: 40px; text-align: center;">
                    <h2>Page Not Found</h2>
                    <p style="color: var(--text-secondary); margin-top: 10px;">The page you are looking for does not exist.</p>
                    <a href="#home" class="btn btn-primary" style="margin-top: 20px;">Return Home</a>
                </div>
            `;
            return;
        }

        // Show page loader with skeleton loading class
        this.pageContainer.innerHTML = `
            <div class="page-loader" style="padding: 40px;">
                <div class="shimmer-container">
                    <div class="shimmer-item" style="height: 50px; width: 60%;"></div>
                    <div class="shimmer-item" style="height: 150px; width: 100%;"></div>
                    <div class="shimmer-item" style="height: 100px; width: 100%;"></div>
                </div>
            </div>
        `;

        try {
            // Render target page
            await page.render(this.pageContainer, param, queryParams);
            
            // Translate the new DOM content
            translateDOM();
            
            // Execute icon rendering
            if (window.lucide) {
                window.lucide.createIcons();
            }
        } catch (error) {
            console.error(`Error rendering page: ${pageName}`, error);
            const errDiv = document.createElement('div');
            errDiv.style.cssText = 'padding: 40px; text-align: center; color: var(--danger);';
            const h2 = document.createElement('h2');
            h2.textContent = 'Failed to load page';
            const p = document.createElement('p');
            p.style.cssText = 'color: var(--text-secondary); margin-top: 10px;';
            p.textContent = error.message; // textContent prevents XSS from error messages
            const btn = document.createElement('button');
            btn.className = 'btn btn-secondary';
            btn.style.marginTop = '20px';
            btn.textContent = 'Retry';
            btn.onclick = () => window.location.reload();
            errDiv.appendChild(h2);
            errDiv.appendChild(p);
            errDiv.appendChild(btn);
            this.pageContainer.innerHTML = '';
            this.pageContainer.appendChild(errDiv);
        }
    }
}

// Instantiate Global App Shell
const app = new CivicPulseApp();
export default app;
