/*
========================================================================
CIVICPULSE I18N LOCALIZATION ENGINE
Manages language state and dictionary translation for English / Hindi.
========================================================================
*/

const LANG_KEY = 'civicpulse_lang';

const DICTIONARY = {
    en: {
        // Sidebar Navigation
        'nav_home': 'Home',
        'nav_map': 'Delhi Map',
        'nav_report': 'Report Issue',
        'nav_dashboard': 'Impact Dashboard',
        'nav_leaderboard': 'Leaderboard',
        'nav_profile': 'My Profile',
        'nav_settings': 'AI Settings',
        'nav_admin': 'Admin Panel',
        'logout': 'Logout',

        // Header and Search
        'search_placeholder': 'Search issues, sectors, or streets in Delhi...',
        'report_btn': 'Report',

        // Global Statuses
        'status_reported': 'Reported',
        'status_verified': 'Verified',
        'status_in_progress': 'In Progress',
        'status_resolved': 'Resolved',

        // Home Page
        'live_feed': 'Live Pulse Feed',
        'live_feed_sub': 'Real-time infrastructure reports around Delhi',
        'welcome_back': 'Welcome back,',
        'explore_categories': 'Explore Categories',
        'active_issues': 'Active Issues',
        'resolved_issues': 'Resolved Issues',
        'points_earned': 'Points Earned',
        'recent_activity': 'Recent Activity',

        // Issue Details
        'upvotes': 'Upvotes',
        'verifications': 'Verifications',
        'verify_action': 'Verify Location',
        'upvote_action': 'Upvote',
        'add_comment': 'Add Comment',
        'comment_placeholder': 'Share information or update...',
        'timeline': 'Timeline',

        // Report Page
        'report_title': 'File a Civic Report',
        'step_1': 'Capture & Upload',
        'step_2': 'Pin Location',
        'step_3': 'Describe Details',
        'step_4': 'Review & Submit',
        'upload_photo': 'Upload Photo',
        'upload_desc': 'Take a photo or upload an image of the issue to auto-categorize it using Gemini AI.',
        'locate_title': 'Locate the Issue',
        'description_title': 'Issue Details',
        'issue_title_label': 'Title / Headline',
        'issue_desc_label': 'Description',
        'issue_severity_label': 'Visual Severity',
        'submit_report': 'Submit Report',
        'ai_scanning': 'AI is analyzing your report details...',

        // Settings Page
        'settings_title': 'AI Configuration & Settings',
        'settings_desc': 'Configure your AI provider for image analysis, auto-categorization, and predictive analytics.',
        'ai_provider': 'AI Provider',
        'copilot_url': 'API Base URL / Copilot Proxy Link',
        'api_key': 'API Key',
        'save_settings': 'Save Settings',
        'connection_status': 'Connection Status',
        'connected': 'Connected',
        'disconnected': 'Offline Mode',

        // Admin Page
        'admin_title': 'Authority Administration Portal',
        'admin_desc': 'Review, assign, and update civic issues reported by Delhi citizens.',
        'pending_action': 'Pending Action',
        'bulk_actions': 'Bulk Actions',
        'update_status': 'Update Status',
        'assign_dept': 'Department Routing'
    },
    hi: {
        // Sidebar Navigation
        'nav_home': 'मुख्य पृष्ठ',
        'nav_map': 'दिल्ली मानचित्र',
        'nav_report': 'समस्या दर्ज करें',
        'nav_dashboard': 'प्रभाव डैशबोर्ड',
        'nav_leaderboard': 'लीडरबोर्ड',
        'nav_profile': 'मेरी प्रोफ़ाइल',
        'nav_settings': 'एआई सेटिंग्स',
        'nav_admin': 'प्रशासन पैनल',
        'logout': 'लॉगआउट',

        // Header and Search
        'search_placeholder': 'दिल्ली में समस्याओं, क्षेत्रों या सड़कों की खोज करें...',
        'report_btn': 'दर्ज करें',

        // Global Statuses
        'status_reported': 'दर्ज की गई',
        'status_verified': 'सत्यापित',
        'status_in_progress': 'प्रगति पर',
        'status_resolved': 'सुलझाई गई',

        // Home Page
        'live_feed': 'लाइव पल्स फ़ीड',
        'live_feed_sub': 'दिल्ली के आसपास वास्तविक समय की बुनियादी ढांचा रिपोर्ट',
        'welcome_back': 'स्वागत है,',
        'explore_categories': 'श्रेणियों का पता लगाएं',
        'active_issues': 'सक्रिय समस्याएं',
        'resolved_issues': 'सुलझाई गई समस्याएं',
        'points_earned': 'अर्जित अंक',
        'recent_activity': 'हाल की गतिविधि',

        // Issue Details
        'upvotes': 'अपवोट',
        'verifications': 'सत्यापन',
        'verify_action': 'स्थान सत्यापित करें',
        'upvote_action': 'अपवोट करें',
        'add_comment': 'टिप्पणी जोड़ें',
        'comment_placeholder': 'जानकारी या अपडेट साझा करें...',
        'timeline': 'समय रेखा',

        // Report Page
        'report_title': 'एक नागरिक रिपोर्ट दर्ज करें',
        'step_1': 'फ़ोटो अपलोड करें',
        'step_2': 'स्थान चिह्नित करें',
        'step_3': 'विवरण भरें',
        'step_4': 'समीक्षा और सबमिट',
        'upload_photo': 'फोटो अपलोड करें',
        'upload_desc': 'जेमिनी एआई का उपयोग करके समस्या को स्वचालित रूप से वर्गीकृत करने के लिए एक फोटो लें या अपलोड करें।',
        'locate_title': 'समस्या का स्थान',
        'description_title': 'समस्या का विवरण',
        'issue_title_label': 'शीर्षक / हेडलाइन',
        'issue_desc_label': 'विवरण',
        'issue_severity_label': 'दृश्य गंभीरता',
        'submit_report': 'रिपोर्ट जमा करें',
        'ai_scanning': 'एआई आपकी रिपोर्ट के विवरण का विश्लेषण कर रहा है...',

        // Settings Page
        'settings_title': 'एआई कॉन्फ़िगरेशन और सेटिंग्स',
        'settings_desc': 'छवि विश्लेषण, स्वचालित वर्गीकरण और भविष्य कहनेवाला विश्लेषिकी के लिए अपने एआई प्रदाता को कॉन्फ़िगर करें।',
        'ai_provider': 'एआई प्रदाता',
        'copilot_url': 'एपीआई बेस यूआरएल / कोपायलट प्रॉक्सी लिंक',
        'api_key': 'एपीआई कुंजी',
        'save_settings': 'सेटिंग्स सहेजें',
        'connection_status': 'कनेक्शन की स्थिति',
        'connected': 'कनेक्टेड',
        'disconnected': 'ऑफलाइन मोड',

        // Admin Page
        'admin_title': 'प्राधिकरण प्रशासन पोर्टल',
        'admin_desc': 'दिल्ली के नागरिकों द्वारा रिपोर्ट की गई नागरिक समस्याओं की समीक्षा, आवंटन और अपडेट करें।',
        'pending_action': 'लंबित कार्रवाई',
        'bulk_actions': 'थोक कार्रवाई',
        'update_status': 'स्थिति अपडेट करें',
        'assign_dept': 'विभाग आवंटन'
    }
};

export function getLanguage() {
    return localStorage.getItem(LANG_KEY) || 'en';
}

export function setLanguage(lang) {
    if (lang === 'en' || lang === 'hi') {
        localStorage.setItem(LANG_KEY, lang);
        translateDOM();
        // Dispatches event to allow page modules to re-render dynamic content
        window.dispatchEvent(new CustomEvent('languagechanged', { detail: lang }));
    }
}

export function t(key, fallback = '') {
    const lang = getLanguage();
    return DICTIONARY[lang][key] || fallback || key;
}

export function translateDOM() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translation = t(key);
        if (el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'search')) {
            el.placeholder = translation;
        } else {
            // Preserve child icons if present (e.g., in buttons and nav items)
            const icon = el.querySelector('i[data-lucide]');
            if (icon) {
                // If it contains an icon, replace only the text node next to it or wrap text in span
                const textSpan = el.querySelector('span');
                if (textSpan) {
                    textSpan.textContent = translation;
                } else {
                    el.innerHTML = `<i data-lucide="${icon.getAttribute('data-lucide')}"></i>${translation}`;
                }
            } else {
                el.textContent = translation;
            }
        }
    });

    // Re-create icons for any new text injections containing icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
}
