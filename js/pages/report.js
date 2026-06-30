/*
========================================================================
CIVICPULSE REPORT ISSUE PAGE COMPONENT (MULTI-STEP WIZARD)
========================================================================
*/

import { store, NEIGHBORHOOD_COORDS } from '../store.js';
import { generateUUID } from '../utils.js';
import { analyzeReportAI, scanDuplicates, calculatePriorityScore } from '../ai-engine.js';
import { classifyTextWithAI, analyzeImageWithAI, isAIConfigured } from '../gemini-ai.js';

export const reportPage = {
    currentStep: 1,
    issueData: {
        id: '',
        title: '',
        description: '',
        category: 'Other',
        severity: 'Medium',
        location: {
            lat: 28.6139,
            lng: 77.2090,
            address: 'Connaught Place, New Delhi'
        },
        imageUrl: '',
        duplicates: []
    },
    map: null,
    marker: null,

    async render(container) {
        // Cleanup old map instance if navigating back to this page
        if (this.map) {
            this.map.remove();
            this.map = null;
            this.marker = null;
        }

        this.currentStep = 1;
        this.issueData = {
            id: generateUUID(),
            title: '',
            description: '',
            category: 'Other',
            severity: 'Medium',
            location: {
                lat: 28.6139,
                lng: 77.2090,
                address: 'Connaught Place, New Delhi, Delhi'
            },
            imageUrl: '',
            duplicates: []
        };

        container.innerHTML = `
            <div class="report-wizard animated fadeIn">
                <div class="page-header" style="margin-bottom: 20px;">
                    <div class="page-title">
                        <h1>Report Community Issue</h1>
                        <p>AI-assisted multi-step reporting for fast city response</p>
                    </div>
                </div>

                <!-- Stepper Progress -->
                <div class="wizard-steps">
                    <div class="wizard-step active" id="step-node-1">
                        <div class="step-num">1</div>
                        <span class="step-lbl">Capture</span>
                    </div>
                    <div class="wizard-step" id="step-node-2">
                        <div class="step-num">2</div>
                        <span class="step-lbl">Locate</span>
                    </div>
                    <div class="wizard-step" id="step-node-3">
                        <div class="step-num">3</div>
                        <span class="step-lbl">Describe</span>
                    </div>
                    <div class="wizard-step" id="step-node-4">
                        <div class="step-num">4</div>
                        <span class="step-lbl">AI Verification</span>
                    </div>
                </div>

                <!-- Step 1: Capture File Upload -->
                <div class="wizard-panel active" id="step-panel-1">
                    <div class="card glass-panel">
                        <h3 style="margin-bottom: 16px;">Step 1: Upload Photo or Video</h3>
                        <p style="color: var(--text-secondary); margin-bottom: 24px;">Upload clear visual evidence of the issue to speed up verification and department routing.</p>
                        
                        <div class="upload-area" id="fileDropzone">
                            <i data-lucide="image" class="upload-icon" style="width:48px;height:48px;margin: 0 auto 16px auto;"></i>
                            <h4 style="margin-bottom: 8px;">Drag and drop image here</h4>
                            <p style="color: var(--text-muted); font-size: 13px; margin-bottom: 16px;">Supports JPEG, PNG, MP4 up to 10MB</p>
                            <input type="file" id="fileInput" accept="image/*,video/*" style="display: none;">
                            <button class="btn btn-secondary" onclick="document.getElementById('fileInput').click()">Browse Files</button>
                        </div>
                        
                        <div id="imagePreviewContainer" style="display: none; margin-top: 24px; text-align: center;">
                            <img id="imagePreview" src="" style="max-height: 250px; border-radius: 8px; border: 1px solid var(--border-color);" alt="Evidence Preview">
                            <button class="btn btn-outline btn-icon" id="removeFileBtn" style="margin-top: 12px; margin-left: auto; margin-right: auto; display: block;">
                                <i data-lucide="trash"></i><span>Remove Photo</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Step 2: Map Selector -->
                <div class="wizard-panel" id="step-panel-2">
                    <div class="card glass-panel">
                        <h3 style="margin-bottom: 16px;">Step 2: Drop Location Pin</h3>
                        <p style="color: var(--text-secondary); margin-bottom: 16px;">Click on the Delhi map to specify the exact location of the issue.</p>
                        
                        <div class="map-selector-container" style="padding: 0; background: #0f172a; border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; height: 300px; margin-bottom: 12px;">
                            <iframe id="report-map-iframe" src="map-picker.html" style="width: 100%; height: 100%; border: none;"></iframe>
                        </div>

                        <div class="form-group" style="margin-top: 16px;">
                            <label>Identified Address / Proximity</label>
                            <input type="text" id="reportAddress" class="form-control" readonly value="Connaught Place, New Delhi, Delhi">
                        </div>
                    </div>
                </div>

                <!-- Step 3: Text Form -->
                <div class="wizard-panel" id="step-panel-3">
                    <div class="card glass-panel">
                        <h3 style="margin-bottom: 20px;">Step 3: Provide Details</h3>
                        
                        <div class="form-group">
                            <label for="issueTitle">Brief Summary / Title</label>
                            <input type="text" id="issueTitle" class="form-control" placeholder="e.g. Deep pothole blocking left lane of main road">
                        </div>

                        <div class="form-group">
                            <label for="issueDesc">Full Description</label>
                            <textarea id="issueDesc" class="form-control" rows="5" placeholder="Provide details like safety risks, street landmarks, how long it has been present, etc."></textarea>
                        </div>

                        <div class="grid-2">
                            <div class="form-group">
                                <label for="issueSeverity">Initial Severity Level</label>
                                <select id="issueSeverity" class="form-control">
                                    <option value="Low">Low (Minor annoyance, e.g. cracked sidewalk bench)</option>
                                    <option value="Medium" selected>Medium (Standard issue, e.g. broken streetlight bulb)</option>
                                    <option value="High">High (Dangerous, e.g. large pothole on highway)</option>
                                    <option value="Critical">Critical (Immediate danger, e.g. burst pipeline flooding residential block)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Step 4: AI scanning and Confirmation -->
                <div class="wizard-panel" id="step-panel-4">
                    <div id="aiScanningView">
                        <div class="card glass-panel text-center" style="padding: 48px; text-align: center;">
                            <div class="spinner" style="margin: 0 auto 24px auto;"></div>
                            <h3 style="margin-bottom: 12px;">CivicPulse AI is analyzing your report...</h3>
                            <p style="color: var(--text-secondary);">Matching key terms, classifying categories, searching coordinates for active duplicate reports, and mapping response routing.</p>
                        </div>
                    </div>

                    <div id="aiResultView" style="display: none;">
                        <div class="ai-analyzing-card">
                            <div class="scan-line-animation"></div>
                            <div>
                                <h4 style="color: var(--primary); margin-bottom: 4px;">CivicPulse AI Audit Complete</h4>
                                <p style="font-size: 13px; color: var(--text-secondary);">Image signature and description match high priority templates.</p>
                            </div>
                        </div>

                        <!-- Duplicate Warning -->
                        <div id="duplicateWarningPanel" style="display: none; margin-bottom: 24px;">
                            <div class="card" style="border-color: var(--accent); background: var(--accent-glow);">
                                <div style="display: flex; gap: 16px;">
                                    <i data-lucide="alert-triangle" style="color: var(--accent); flex-shrink: 0; width: 24px; height: 24px;"></i>
                                    <div>
                                        <h4 style="color: var(--accent); margin-bottom: 4px;">Potential Duplicate Detected Nearby</h4>
                                        <p style="font-size: 13px; color: var(--text-primary); margin-bottom: 12px;">Our AI detected a similar report matching the same category within 200 meters. Would you like to upvote the existing report to raise its priority instead?</p>
                                        <div id="duplicateReportSummary" style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 6px; margin-bottom: 12px; font-size: 13px;">
                                            <!-- Dynamic duplicate info -->
                                        </div>
                                        <div style="display: flex; gap: 12px;">
                                            <button class="btn btn-accent btn-icon" id="upvoteDuplicateBtn">
                                                <i data-lucide="thumbs-up"></i><span>Upvote & Cancel My Report</span>
                                            </button>
                                            <button class="btn btn-outline" id="forceSubmitBtn" style="font-size: 12px;">No, Submit as New Report</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- AI Classification Card -->
                        <div class="card glass-panel" style="margin-bottom: 24px;">
                            <h3 style="margin-bottom: 16px;">AI Routing Summary</h3>
                            <div class="grid-2">
                                <div class="form-group">
                                    <label>Auto-Classified Category</label>
                                    <div style="display:flex; align-items:center; gap:8px; font-weight:700; font-size:16px;">
                                        <span id="aiSuggestedCategory" class="pill pill-verified" style="font-size:13px; padding: 6px 12px;">Pothole</span>
                                        <span id="aiConfidence" style="color: var(--text-muted); font-size:13px;">(94% confidence)</span>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label>Assigned Department</label>
                                    <span id="aiRoutedDept" style="font-weight: 600;">Delhi Public Works Department (PWD)</span>
                                </div>
                                <div class="form-group">
                                    <label>Smart Priority Score</label>
                                    <div style="display:flex; align-items:center; gap:8px;">
                                        <span id="aiPriorityVal" style="font-size: 24px; font-weight: 800; color: var(--danger);">78 / 100</span>
                                        <span style="color: var(--text-muted); font-size:12px;">(High urgency)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Navigation Controls -->
                <div class="wizard-actions">
                    <button class="btn btn-secondary btn-icon" id="prevBtn" style="visibility: hidden;">
                        <i data-lucide="arrow-left"></i><span>Back</span>
                    </button>
                    <button class="btn btn-primary btn-icon" id="nextBtn">
                        <span>Continue</span><i data-lucide="arrow-right"></i>
                    </button>
                </div>
            </div>
        `;

        this.initEvents(container);
    },

    setupIframeListener() {
        if (this.iframeListenerAdded) return;
        
        window.addEventListener('message', (e) => {
            if (e.data && e.data.type === 'location-picked') {
                this.updateAddress(e.data.lat, e.data.lng);
            } else if (e.data && e.data.type === 'map-picker-ready') {
                this.iframeReady = true;
                this.sendLocationToIframe();
            }
        });
        
        this.iframeListenerAdded = true;
    },

    sendLocationToIframe() {
        if (!this.iframeReady) return;
        const iframe = document.getElementById('report-map-iframe');
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({
                type: 'set-location',
                lat: this.issueData.location.lat,
                lng: this.issueData.location.lng
            }, '*');
        }
    },

    updateAddress(lat, lng) {
        // Find closest neighborhood to simulate clean addresses
        let closestNeighbor = 'Connaught Place';
        let minDist = Infinity;
        
        for (let [name, coords] of Object.entries(NEIGHBORHOOD_COORDS)) {
            const dy = coords.lat - lat;
            const dx = coords.lng - lng;
            const d = dy*dy + dx*dx;
            if (d < minDist) {
                minDist = d;
                closestNeighbor = name;
            }
        }

        const randNo = Math.floor(Math.random() * 120) + 1;
        const address = `Sector ${Math.floor(Math.random() * 10) + 1}, Block H-${randNo}, ${closestNeighbor}, Delhi`;
        
        this.issueData.location.lat = parseFloat(lat.toFixed(5));
        this.issueData.location.lng = parseFloat(lng.toFixed(5));
        this.issueData.location.address = address;

        const addrInput = document.getElementById('reportAddress');
        if (addrInput) addrInput.value = address;
    },

    initEvents(container) {
        this.setupIframeListener();
        const fileDropzone = container.querySelector('#fileDropzone');
        const fileInput = container.querySelector('#fileInput');
        const imagePreviewContainer = container.querySelector('#imagePreviewContainer');
        const imagePreview = container.querySelector('#imagePreview');
        const removeFileBtn = container.querySelector('#removeFileBtn');

        const prevBtn = container.querySelector('#prevBtn');
        const nextBtn = container.querySelector('#nextBtn');

        const issueTitle = container.querySelector('#issueTitle');
        const issueDesc = container.querySelector('#issueDesc');
        const issueSeverity = container.querySelector('#issueSeverity');

        // File upload setup
        fileDropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileDropzone.style.borderColor = 'var(--primary)';
        });
        fileDropzone.addEventListener('dragleave', () => {
            fileDropzone.style.borderColor = 'var(--border-color)';
        });
        fileDropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) this.handleFile(file, imagePreview, imagePreviewContainer, fileDropzone);
        });
        fileInput.addEventListener('change', () => {
            const file = fileInput.files[0];
            if (file) this.handleFile(file, imagePreview, imagePreviewContainer, fileDropzone);
        });
        removeFileBtn.addEventListener('click', () => {
            this.issueData.imageUrl = '';
            imagePreview.src = '';
            imagePreviewContainer.style.display = 'none';
            fileDropzone.style.display = 'block';
            fileInput.value = '';
        });

        // Navigation clicks
        prevBtn.addEventListener('click', () => {
            if (this.currentStep > 1) {
                this.setStep(this.currentStep - 1);
            }
        });

        nextBtn.addEventListener('click', () => {
            if (this.currentStep === 1) {
                if (!this.issueData.imageUrl) {
                    import('../utils.js').then(u => u.showToast("Please upload an image of the issue to proceed.", "warning"));
                    return;
                }
                this.setStep(2);
            } else if (this.currentStep === 2) {
                this.setStep(3);
            } else if (this.currentStep === 3) {
                const titleVal = issueTitle.value.trim();
                const descVal = issueDesc.value.trim();
                if (!titleVal || !descVal) {
                    import('../utils.js').then(u => u.showToast("Please enter a title and description.", "warning"));
                    return;
                }
                this.issueData.title = titleVal;
                this.issueData.description = descVal;
                this.issueData.severity = issueSeverity.value;
                this.setStep(4);
            } else if (this.currentStep === 4) {
                this.finalizeSubmission();
            }
        });
    },

    handleFile(file, preview, container, dropzone) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            preview.src = e.target.result;
            this.issueData.imageUrl = e.target.result;
            container.style.display = 'block';
            dropzone.style.display = 'none';

            // Vision AI scan trigger
            if (isAIConfigured()) {
                const loader = document.createElement('div');
                loader.id = 'vision-ai-loading';
                loader.innerHTML = `
                    <div style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 8px; padding: 15px; margin-top: 15px; display: flex; align-items: center; justify-content: center; gap: 10px;">
                        <i data-lucide="brain-circuit" class="pulse-icon" style="color: var(--primary); animation: pulse 1.5s infinite;"></i>
                        <span style="font-weight: 500; font-size: 13px;">🧠 Gemini Vision is analyzing your photo...</span>
                    </div>
                `;
                container.appendChild(loader);
                if (window.lucide) window.lucide.createIcons();

                try {
                    const aiResult = await analyzeImageWithAI(e.target.result);
                    
                    // Autofill inputs
                    const issueTitle = document.getElementById('issueTitle');
                    const issueDesc = document.getElementById('issueDesc');
                    const issueSeverity = document.getElementById('issueSeverity');
                    
                    if (issueTitle) issueTitle.value = aiResult.title || '';
                    if (issueDesc) issueDesc.value = aiResult.description || '';
                    if (issueSeverity) issueSeverity.value = aiResult.severity || 'Medium';

                    this.issueData.category = aiResult.category || 'Other';
                    this.issueData.severity = aiResult.severity || 'Medium';

                    // Replace loader with success indicator
                    loader.innerHTML = `
                        <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 15px; margin-top: 15px; display: flex; align-items: center; justify-content: center; gap: 10px;">
                            <i data-lucide="check-circle" style="color: var(--success);"></i>
                            <span style="font-weight: 500; font-size: 13px;">🧠 Gemini Vision Scan: Detected <strong>${aiResult.category}</strong> (${aiResult.severity})</span>
                        </div>
                    `;
                    if (window.lucide) window.lucide.createIcons();
                } catch (err) {
                    console.error("Vision AI failed", err);
                    loader.remove();
                }
            }
        };
        reader.readAsDataURL(file);
    },

    setStep(stepNum) {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        // Hide current step panel
        document.getElementById(`step-panel-${this.currentStep}`).classList.remove('active');
        document.getElementById(`step-node-${this.currentStep}`).classList.remove('active');
        if (this.currentStep < stepNum) {
            document.getElementById(`step-node-${this.currentStep}`).classList.add('completed');
        } else {
            document.getElementById(`step-node-${stepNum}`).classList.remove('completed');
        }

        this.currentStep = stepNum;

        // Show new panel
        document.getElementById(`step-panel-${stepNum}`).classList.add('active');
        document.getElementById(`step-node-${stepNum}`).classList.add('active');

        // Controls visibility
        prevBtn.style.visibility = stepNum === 1 ? 'hidden' : 'visible';
        
        if (stepNum === 4) {
            nextBtn.querySelector('span').innerText = 'Submit Report';
            nextBtn.querySelector('i').setAttribute('data-lucide', 'check');
            if (window.lucide) window.lucide.createIcons();
            this.runAISimulation();
        } else {
            nextBtn.querySelector('span').innerText = 'Continue';
            nextBtn.querySelector('i').setAttribute('data-lucide', 'arrow-right');
            if (window.lucide) window.lucide.createIcons();
        }

        // Map rendering trigger
        if (stepNum === 2) {
            // Tell iframe to update location
            setTimeout(() => this.sendLocationToIframe(), 100);
        }
    },

    async runAISimulation() {
        const scanningView = document.getElementById('aiScanningView');
        const resultView = document.getElementById('aiResultView');
        const dupWarning = document.getElementById('duplicateWarningPanel');
        
        scanningView.style.display = 'block';
        resultView.style.display = 'none';
        dupWarning.style.display = 'none';

        let analysis;
        try {
            if (isAIConfigured()) {
                analysis = await classifyTextWithAI(this.issueData.title, this.issueData.description);
            } else {
                // Offline fallback
                const offline = analyzeReportAI(this.issueData.title, this.issueData.description);
                analysis = {
                    category: offline.category,
                    confidence: offline.confidence,
                    department: offline.department,
                    severity: this.issueData.severity || 'Medium'
                };
            }
        } catch (e) {
            console.error("AI scanning failed, using fallback", e);
            const offline = analyzeReportAI(this.issueData.title, this.issueData.description);
            analysis = {
                category: offline.category,
                confidence: offline.confidence,
                department: offline.department,
                severity: this.issueData.severity || 'Medium'
            };
        }
        
        this.issueData.category = analysis.category;
        
        // Scan duplicates
        const duplicates = scanDuplicates(
            analysis.category,
            this.issueData.location.lat,
            this.issueData.location.lng
        );
        this.issueData.duplicates = duplicates;

        // Render AI stats in HTML
        document.getElementById('aiSuggestedCategory').innerText = analysis.category;
        document.getElementById('aiConfidence').innerText = isAIConfigured() 
            ? `(Real-time AI Audit)` 
            : `(${Math.floor(analysis.confidence * 100)}% confidence)`;
        document.getElementById('aiRoutedDept').innerText = analysis.department;

        // Smart priority score calculation
        const priorityScore = calculatePriorityScore(
            analysis.category,
            analysis.severity || this.issueData.severity,
            this.issueData.location.lat,
            this.issueData.location.lng
        );
        
        let priorityColor = 'var(--success)';
        let priorityLabel = 'Low Urgency';
        if (priorityScore > 75) {
            priorityColor = 'var(--danger)';
            priorityLabel = 'Critical Priority';
        } else if (priorityScore > 45) {
            priorityColor = 'var(--accent)';
            priorityLabel = 'Moderate Priority';
        }

        const prioSpan = document.getElementById('aiPriorityVal');
        prioSpan.innerText = `${priorityScore} / 100`;
        prioSpan.style.color = priorityColor;
        prioSpan.nextElementSibling.innerText = `(${priorityLabel})`;

        // Toggle Duplicate panel if matches found
        if (duplicates.length > 0) {
            const dupReport = duplicates[0];
            const summaryDiv = document.getElementById('duplicateReportSummary');
            summaryDiv.innerHTML = `
                <strong>${dupReport.title}</strong><br>
                Address: ${dupReport.location.address}<br>
                Reported: ${new Date(dupReport.reportedAt).toLocaleDateString()} &middot; Status: ${dupReport.status}
            `;
            
            dupWarning.style.display = 'block';
            
            // Set up button event
            document.getElementById('upvoteDuplicateBtn').onclick = () => {
                store.upvoteIssue(dupReport.id);
                store.awardPoints(5, `Upvoted duplicate issue`);
                
                // Show points reward animation
                this.triggerFloatingPoints(5);

                import('../utils.js').then(u => {
                    u.showToast("Upvoted existing report! Earned +5 verifier points.", "success");
                    window.location.hash = `#issue/${dupReport.id}`;
                });
            };

            document.getElementById('forceSubmitBtn').onclick = () => {
                dupWarning.style.display = 'none';
            };
        }

        scanningView.style.display = 'none';
        resultView.style.display = 'block';
        if (window.lucide) window.lucide.createIcons();
    },

    triggerConfetti() {
        const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];
        for (let i = 0; i < 80; i++) {
            const p = document.createElement('div');
            p.className = 'confetti-particle';
            p.style.background = colors[Math.floor(Math.random() * colors.length)];
            p.style.left = Math.random() * 100 + 'vw';
            p.style.top = '-10px';
            p.style.transform = `scale(${Math.random() * 0.6 + 0.4})`;
            p.style.animationDelay = Math.random() * 0.8 + 's';
            
            document.body.appendChild(p);
            
            setTimeout(() => p.remove(), 3000);
        }
    },

    triggerFloatingPoints(amount) {
        const el = document.createElement('div');
        el.className = 'floating-points';
        el.textContent = `+${amount} PTS`;
        el.style.left = '50%';
        el.style.top = '50%';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1500);
    },

    finalizeSubmission() {
        const timestamp = new Date().toISOString();
        const user = store.getUser();

        const newIssue = {
            id: this.issueData.id,
            title: `${this.issueData.category} - ${this.issueData.title}`,
            description: this.issueData.description,
            category: this.issueData.category,
            status: 'Reported',
            severity: this.issueData.severity,
            location: {
                lat: this.issueData.location.lat,
                lng: this.issueData.location.lng,
                address: this.issueData.location.address
            },
            reporterName: user.name,
            reporterId: user.id,
            reportedAt: timestamp,
            upvotes: 1,
            verifications: 1,
            department: document.getElementById('aiRoutedDept').innerText,
            imageUrl: this.issueData.imageUrl,
            comments: [],
            timeline: [
                {
                    status: 'Reported',
                    timestamp: timestamp,
                    note: `Issue reported by citizen ${user.name}. Auto-routed to authority.`,
                    actor: user.name
                }
            ]
        };

        // Save to store
        store.saveIssue(newIssue);
        
        // Award points
        store.awardPoints(10, `Reported issue ${newIssue.title}`);

        // Trigger wow factor animations
        this.triggerConfetti();
        this.triggerFloatingPoints(10);

        // Route to Details
        import('../utils.js').then(u => {
            u.showToast("Report submitted! +10 Watchdog points earned.", "success");
            
            // Clean map instance
            if (this.map) {
                this.map.remove();
                this.map = null;
                this.marker = null;
            }
            
            // Short delay so they can appreciate the confetti before redirecting
            setTimeout(() => {
                window.location.hash = `#issue/${newIssue.id}`;
            }, 1000);
        });
    }
};
