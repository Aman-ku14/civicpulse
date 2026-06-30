/*
========================================================================
CIVICPULSE DELHI LIVE MAP PAGE COMPONENT
========================================================================
*/

import { store } from '../store.js';
import { getCategoryColor } from '../utils.js';

export const mapPage = {
    map: null,
    markerClusterGroup: null,
    heatmapCircles: [],
    heatmapEnabled: false,
    activeIssues: [],
    
    async render(container, param, queryParams) {
        this.activeIssues = store.getIssues();
        this.heatmapCircles = [];
        this.heatmapEnabled = false;

        // Fetch queries if any (e.g. search query, category quick link)
        const filterCat = queryParams.category || '';
        const searchQuery = queryParams.search || '';

        container.innerHTML = `
            <div class="map-layout-wrapper animated fadeIn">
                <!-- Sidebar controls -->
                <aside class="map-sidebar">
                    <div class="map-filters">
                        <h3 style="margin-bottom: 16px;">Delhi Reports</h3>
                        
                        <div class="map-filter-group">
                            <label for="filterCategory">Category</label>
                            <select id="filterCategory" class="form-control">
                                <option value="">All Categories</option>
                                <option value="Pothole" ${filterCat === 'Pothole' ? 'selected' : ''}>Potholes</option>
                                <option value="Water Leakage" ${filterCat === 'Water Leakage' ? 'selected' : ''}>Water Leakage</option>
                                <option value="Streetlight" ${filterCat === 'Streetlight' ? 'selected' : ''}>Streetlights</option>
                                <option value="Waste/Garbage" ${filterCat === 'Waste/Garbage' ? 'selected' : ''}>Waste Management</option>
                                <option value="Road Damage" ${filterCat === 'Road Damage' ? 'selected' : ''}>Road Damage</option>
                                <option value="Drainage" ${filterCat === 'Drainage' ? 'selected' : ''}>Drainage & Sewerage</option>
                                <option value="Public Property" ${filterCat === 'Public Property' ? 'selected' : ''}>Public Property</option>
                                <option value="Noise" ${filterCat === 'Noise' ? 'selected' : ''}>Noise Pollution</option>
                                <option value="Illegal Construction" ${filterCat === 'Illegal Construction' ? 'selected' : ''}>Illegal Encroachments</option>
                            </select>
                        </div>

                        <div class="map-filter-group">
                            <label for="filterStatus">Status</label>
                            <select id="filterStatus" class="form-control">
                                <option value="">All Statuses</option>
                                <option value="Reported">Reported</option>
                                <option value="Verified">Verified</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Resolved">Resolved</option>
                            </select>
                        </div>
                    </div>

                    <!-- Scrollable list of active coordinates -->
                    <div class="map-list-container" id="map-list-elements">
                        <!-- Populated dynamically -->
                    </div>
                </aside>

                <!-- Fullscreen map viewport -->
                <div class="map-container-main">
                    <div id="map-view-elem"></div>
                    
                    <!-- Floating map toggle overlays -->
                    <div class="map-overlays">
                        <button class="btn btn-secondary btn-icon" id="toggleHeatmapBtn" style="backdrop-filter: var(--glass-blur); font-size:12px;">
                            <i data-lucide="flame"></i><span>Toggle Heatmap</span>
                        </button>
                        <button class="btn btn-secondary btn-icon" id="recenterMapBtn" style="backdrop-filter: var(--glass-blur); font-size:12px;">
                            <i data-lucide="crosshair"></i><span>Recenter Map</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Wait for DOM paint before loading Leaflet map
        setTimeout(() => {
            this.initMap();
            if (searchQuery) {
                const searchField = document.getElementById('globalSearch');
                if (searchField) searchField.value = searchQuery;
                this.applyFilters(searchQuery);
            } else {
                this.applyFilters();
            }
        }, 100);

        this.initEvents(container);
    },

    initMap() {
        if (this.map) {
            this.map.remove();
        }

        const delhiCenter = [28.6139, 77.2090]; // CP Delhi
        this.map = L.map('map-view-elem', {
            zoomControl: false
        }).setView(delhiCenter, 11);

        // Add Leaflet zoom controls in top-left position
        L.control.zoom({
            position: 'topleft'
        }).addTo(this.map);

        // Dark thematic map tile from CartoDB
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 20,
            attribution: '&copy; OpenStreetMap &copy; CARTO'
        }).addTo(this.map);

        // Marker cluster group setup
        this.markerClusterGroup = L.markerClusterGroup({
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            maxClusterRadius: 40
        });
        this.map.addLayer(this.markerClusterGroup);

        // Attach popupopen handler once here (not inside renderMarkers which runs on every filter)
        this.map.on('popupopen', () => {
            if (window.lucide) window.lucide.createIcons();
        });
    },

    initEvents(container) {
        const categorySelect = container.querySelector('#filterCategory');
        const statusSelect = container.querySelector('#filterStatus');
        const heatmapBtn = container.querySelector('#toggleHeatmapBtn');
        const recenterBtn = container.querySelector('#recenterMapBtn');

        categorySelect.addEventListener('change', () => this.applyFilters());
        statusSelect.addEventListener('change', () => this.applyFilters());

        heatmapBtn.addEventListener('click', () => {
            this.heatmapEnabled = !this.heatmapEnabled;
            if (this.heatmapEnabled) {
                heatmapBtn.classList.add('btn-accent');
                heatmapBtn.classList.remove('btn-secondary');
                this.showHeatmap();
            } else {
                heatmapBtn.classList.remove('btn-accent');
                heatmapBtn.classList.add('btn-secondary');
                this.hideHeatmap();
            }
        });

        recenterBtn.addEventListener('click', () => {
            this.map.setView([28.6139, 77.2090], 11);
        });
    },

    applyFilters(searchStr = '') {
        const catFilter = document.getElementById('filterCategory').value;
        const statusFilter = document.getElementById('filterStatus').value;

        // Filter database
        this.activeIssues = store.getIssues().filter(issue => {
            if (catFilter && issue.category !== catFilter) return false;
            if (statusFilter && issue.status !== statusFilter) return false;
            if (searchStr) {
                const searchLower = searchStr.toLowerCase();
                const titleMatch = issue.title.toLowerCase().includes(searchLower);
                const descMatch = issue.description.toLowerCase().includes(searchLower);
                const addrMatch = issue.location.address.toLowerCase().includes(searchLower);
                if (!titleMatch && !descMatch && !addrMatch) return false;
            }
            return true;
        });

        this.renderMarkers();
        this.renderSidebarList();
        
        if (this.heatmapEnabled) {
            this.showHeatmap(); // refresh heatmap overlay bounds
        }
    },

    renderMarkers() {
        // Clear old markers from cluster group
        this.markerClusterGroup.clearLayers();

        this.activeIssues.forEach(issue => {
            const color = getCategoryColor(issue.category);
            
            // Custom CSS styled divIcon marker
            const markerSVG = `
                <div class="custom-marker-icon" style="background-color: ${color}; width: 28px; height: 28px;">
                    <div style="background-color: white; width: 8px; height: 8px; border-radius: 50%;"></div>
                </div>
            `;

            const icon = L.divIcon({
                html: markerSVG,
                className: 'leaflet-custom-marker-wrapper',
                iconSize: [28, 28],
                iconAnchor: [14, 28]
            });

            const marker = L.marker([issue.location.lat, issue.location.lng], { icon });

            // Popup Layout
            const statusClass = `pill-${issue.status.toLowerCase().replace(' ', '')}`;
            const popupContent = `
                <div style="width: 220px; font-family: var(--font-body);">
                    <div style="font-weight: 700; font-size:14px; margin-bottom:4px; text-overflow:ellipsis; white-space:nowrap; overflow:hidden;">${issue.title}</div>
                    <div style="font-size:11px; color:var(--text-muted); margin-bottom:8px; text-overflow:ellipsis; white-space:nowrap; overflow:hidden;">${issue.location.address}</div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                        <span class="pill ${statusClass}" style="font-size:9px; padding:2px 6px;">${issue.status}</span>
                        <span style="font-size:11px; font-weight:600;"><i data-lucide="thumbs-up" style="width:10px;height:10px;display:inline;vertical-align:-1px;margin-right:3px;"></i>${issue.upvotes} votes</span>
                    </div>
                    <button class="btn btn-primary btn-icon" onclick="window.location.hash='#issue/${issue.id}'" style="width: 100%; font-size:11px; padding:6px 12px; justify-content:center;">
                        <span>View Details</span>
                    </button>
                </div>
            `;

            marker.bindPopup(popupContent);
            this.markerClusterGroup.addLayer(marker);
        });
    },

    renderSidebarList() {
        const listContainer = document.getElementById('map-list-elements');
        if (!listContainer) return;

        if (this.activeIssues.length === 0) {
            listContainer.innerHTML = `
                <div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 13px;">
                    No matching reports found.
                </div>
            `;
            return;
        }

        listContainer.innerHTML = this.activeIssues.map(issue => {
            const statusClass = `pill-${issue.status.toLowerCase().replace(' ', '')}`;
            return `
                <div class="map-list-item" data-id="${issue.id}">
                    <div class="map-list-title" title="${issue.title}">${issue.title}</div>
                    <div style="font-size:11px; color:var(--text-muted); margin-bottom:8px; text-overflow:ellipsis; white-space:nowrap; overflow:hidden;">${issue.location.address}</div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span class="pill ${statusClass}" style="font-size:9px; padding: 1px 6px;">${issue.status}</span>
                        <span style="font-size:11px; font-weight:500; color:var(--text-secondary);">${issue.upvotes} votes</span>
                    </div>
                </div>
            `;
        }).join('');

        // Wire click handlers for list items
        listContainer.querySelectorAll('.map-list-item').forEach(item => {
            item.addEventListener('click', () => {
                const issueId = item.getAttribute('data-id');
                const issue = this.activeIssues.find(i => i.id === issueId);
                if (issue) {
                    this.map.setView([issue.location.lat, issue.location.lng], 15);
                    
                    // Open popup programmatically
                    this.markerClusterGroup.eachLayer(layer => {
                        const latlng = layer.getLatLng();
                        if (latlng.lat === issue.location.lat && latlng.lng === issue.location.lng) {
                            layer.openPopup();
                        }
                    });
                }
            });
        });
    },

    showHeatmap() {
        this.hideHeatmap(); // clear previous first

        // Render overlapping density circles as heatmaps
        this.activeIssues.forEach(issue => {
            const color = getCategoryColor(issue.category);
            const circle = L.circle([issue.location.lat, issue.location.lng], {
                color: color,
                fillColor: color,
                fillOpacity: 0.15,
                radius: 400, // 400m density glow radius
                stroke: false
            }).addTo(this.map);
            
            this.heatmapCircles.push(circle);
        });
    },

    hideHeatmap() {
        this.heatmapCircles.forEach(circle => {
            this.map.removeLayer(circle);
        });
        this.heatmapCircles = [];
    }
};
