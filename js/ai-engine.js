/*
========================================================================
CIVICPULSE AI INTELLIGENCE SIMULATION ENGINE
Handles auto-categorization, duplicate checking, and predictive modeling.
========================================================================
*/

import { getDistance } from './utils.js';
import { store } from './store.js';

/**
 * Simulates natural language understanding for classification.
 * Matches keywords inside description & title.
 * @param {string} title Report title
 * @param {string} desc Report description
 * @returns {object} AI assessment with category, confidence, priority, and routing department
 */
export function analyzeReportAI(title, desc) {
    const text = (title + ' ' + desc).toLowerCase();
    
    // Keyword arrays
    const keywordRules = [
        {
            category: 'Pothole',
            keywords: ['pothole', 'crater', 'hole in the road', 'broken road', 'pit', 'deep road hole'],
            department: 'PWD Road Repair Division'
        },
        {
            category: 'Water Leakage',
            keywords: ['water leak', 'burst pipe', 'water pipeline', 'gushing water', 'water log', 'drinking water waste'],
            department: 'Delhi Jal Board (DJB)'
        },
        {
            category: 'Streetlight',
            keywords: ['streetlight', 'lamp post', 'light bulb', 'dark road', 'no light', 'electricity pole'],
            department: 'MCD Streetlighting Dept'
        },
        {
            category: 'Waste/Garbage',
            keywords: ['garbage', 'trash', 'dumpster', 'waste dump', 'smell', 'plastic dump', 'overflowing bin'],
            department: 'MCD Sanitation Department'
        },
        {
            category: 'Road Damage',
            keywords: ['gravel', 'unpaved', 'digging', 'cable wire road', 'asphalt', 'cobblestone', 'cracked road'],
            department: 'PWD Road Repair Division'
        },
        {
            category: 'Drainage',
            keywords: ['drain', 'sewer', 'sewage', 'gutter', 'drain blockage', 'choked drain', 'dirty water overflow'],
            department: 'Delhi Jal Board (DJB)'
        },
        {
            category: 'Public Property',
            keywords: ['park bench', 'playground', 'swing', 'public toilet', 'railing broken', 'metro pillar damage'],
            department: 'MCD Horticulture & Public Works'
        },
        {
            category: 'Noise',
            keywords: ['noise', 'loudspeaker', 'night music', 'generator sound', 'construction noise', 'industrial sound'],
            department: 'Delhi Pollution Control Committee (DPCC)'
        },
        {
            category: 'Illegal Construction',
            keywords: ['encroach', 'footpath shop', 'unauthorized build', 'illegal extension', 'pavement block'],
            department: 'MCD Encroachment Wing'
        }
    ];

    let matchedCategory = 'Other';
    let matchedDept = 'MCD Public Grievance Cell';
    let confidence = 0.5;
    let highestCount = 0;

    // Search and count keywords
    keywordRules.forEach(rule => {
        let matchCount = 0;
        rule.keywords.forEach(keyword => {
            const regex = new RegExp('\\b' + keyword + '\\b|' + keyword, 'gi');
            const matches = text.match(regex);
            if (matches) {
                matchCount += matches.length;
            }
        });

        if (matchCount > highestCount) {
            highestCount = matchCount;
            matchedCategory = rule.category;
            matchedDept = rule.department;
            // Generate dynamic confidence score
            confidence = Math.min(0.7 + (matchCount * 0.08), 0.98);
        }
    });

    // Fallback confidence if low count
    if (highestCount === 0) {
        confidence = 0.65;
    }

    return {
        category: matchedCategory,
        confidence: parseFloat(confidence.toFixed(2)),
        department: matchedDept,
        routedAt: new Date().toISOString()
    };
}

/**
 * Scans the database to identify potential duplicate issues reported nearby
 * @param {string} category Category of the new report
 * @param {number} lat Latitude
 * @param {number} lng Longitude
 * @returns {Array<object>} List of matching active issues within 200m
 */
export function scanDuplicates(category, lat, lng) {
    const allIssues = store.getIssues();
    const radiusThreshold = 200; // 200 meters for duplication check
    
    return allIssues.filter(issue => {
        // Only compare active issues (skip resolved)
        if (issue.status === 'Resolved') return false;
        
        // Match category
        if (issue.category !== category) return false;
        
        // Calculate distance
        const dist = getDistance(lat, lng, issue.location.lat, issue.location.lng);
        return dist <= radiusThreshold;
    });
}

/**
 * Evaluates issue urgency and assigns a score (1-100) based on severity, density and type.
 * @param {string} category Issue Category
 * @param {string} severity Low, Medium, High, Critical
 * @param {number} lat Latitude
 * @param {number} lng Longitude
 * @returns {number} Priority Score (1-100)
 */
export function calculatePriorityScore(category, severity, lat, lng) {
    let score = 20; // baseline

    // Severity mapping
    const severityPoints = { 'Low': 10, 'Medium': 25, 'High': 50, 'Critical': 70 };
    score += severityPoints[severity] || 10;

    // Category weighting
    const categoryWeights = {
        'Water Leakage': 15,
        'Drainage': 12,
        'Pothole': 10,
        'Streetlight': 8,
        'Illegal Construction': 8,
        'Noise': 5,
        'Waste/Garbage': 5,
        'Public Property': 3,
        'Road Damage': 3,
        'Other': 2
    };
    score += categoryWeights[category] || 2;

    // Density mapping (issues within 500m)
    const allIssues = store.getIssues();
    const localDensity = allIssues.filter(issue => {
        if (issue.status === 'Resolved') return false;
        const dist = getDistance(lat, lng, issue.location.lat, issue.location.lng);
        return dist <= 500;
    }).length;

    // Cap density contribution at 10 points
    score += Math.min(localDensity * 2, 10);

    return Math.min(score, 100);
}

/**
 * Computes predictive trends and hotspot forecasts
 * @returns {Array<object>} List of AI forecasted warnings
 */
export function getPredictiveInsights() {
    const issues = store.getIssues();
    const insights = [];
    
    // Group issues by sector/area & category
    const hotspotGroups = {};
    issues.forEach(issue => {
        const address = issue.location.address;
        const parts = address.split(', ');
        const sector = parts.length >= 3 ? parts[parts.length - 2] : 'Central Delhi';
        const key = `${sector}::${issue.category}`;

        if (!hotspotGroups[key]) {
            hotspotGroups[key] = {
                sector: sector,
                category: issue.category,
                count: 0,
                recentCount: 0
            };
        }

        hotspotGroups[key].count++;
        
        // Count issues in last 30 days
        const reportDate = new Date(issue.reportedAt);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        if (reportDate > thirtyDaysAgo) {
            hotspotGroups[key].recentCount++;
        }
    });

    // Generate specific mock forecasts based on densities
    Object.values(hotspotGroups).forEach(group => {
        if (group.recentCount >= 2) {
            let percentage = Math.floor(Math.random() * 25) + 15;
            let seasonText = '';
            
            if (group.category === 'Pothole') {
                seasonText = 'monsoon traffic congestion and sub-surface moisture retention';
            } else if (group.category === 'Water Leakage') {
                seasonText = 'pressure surges in supply lines during peak summer request cycles';
            } else if (group.category === 'Waste/Garbage') {
                seasonText = 'increased commercial market footprint and municipal schedule gaps';
            } else {
                seasonText = 'observed frequency curves over the past quarter';
            }

            insights.push({
                sector: group.sector,
                category: group.category,
                message: `AI predicts a <strong>${percentage}% surge</strong> in <strong>${group.category}</strong> reports in <strong>${group.sector}</strong> over the next 30 days due to ${seasonText}.`,
                confidence: 88,
                action: `Notify MCD Maintenance Teams to conduct preventive patrols in ${group.sector}.`
            });
        }
    });

    // Provide default insight if none generated
    if (insights.length === 0) {
        insights.push({
            sector: 'Connaught Place',
            category: 'Pothole',
            message: 'AI predicts a <strong>15% increase</strong> in pothole incidents around outer circle corridors due to seasonal road surface wear.',
            confidence: 82,
            action: 'Schedule PWD preventive bitumen patching.'
        });
    }

    return insights.slice(0, 3); // top 3 insights
}
