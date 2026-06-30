/*
========================================================================
CIVICPULSE AI DUAL-ENGINE GATEWAY (GEMINI / COPILOT PROXY)
Enables vision analysis, categorization, and predictions using real LLM APIs.
========================================================================
*/

import { analyzeReportAI } from './ai-engine.js';

// Configuration keys (Deprecated - now handled securely by backend)
export function getAIConfig() { return { provider: 'backend' }; }
export function saveAIConfig() {}
export function isAIConfigured() { return true; }

// Clean JSON response from LLMs (removing markdown code blocks)
function parseJSONResponse(text) {
    let clean = text.trim();
    // Strip markdown code fences anywhere in the string (with optional language tag)
    clean = clean.replace(/```[\w]*\n?/g, '').trim();
    return JSON.parse(clean);
}

// Call the secure local backend proxy
async function callLocalProxy(prompt, imageBase64 = null) {
    const url = '/api/gemini/generateContent';

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, imageBase64 }),
            signal: ctrl.signal
        });
        clearTimeout(timer);

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`Backend Proxy Error (${response.status}): ${errBody}`);
        }

        const data = await response.json();
        if (data.error) throw new Error(data.error);
        if (!data.text) throw new Error('Proxy returned empty response');
        
        return data.text;
    } catch (e) {
        clearTimeout(timer);
        throw e;
    }
}

/**
 * Analyzes an uploaded image
 */
export async function analyzeImageWithAI(imageBase64) {
    if (!isAIConfigured()) {
        // Fallback mock
        return {
            category: 'Pothole',
            severity: 'High',
            title: 'Pothole reported via Image Upload',
            description: 'Detected issue via local scanning. Requires verification on-site.'
        };
    }

    const prompt = `You are an expert AI eye detecting civic infrastructure and community issues from a photo.
Analyze this photo and provide an assessment.
Respond ONLY with a valid JSON object in this format (no other text, no markdown backticks outside of the JSON itself):
{
  "category": "One of: Pothole, Water Leakage, Streetlight, Waste/Garbage, Road Damage, Drainage, Public Property, Noise, Illegal Construction, Other",
  "severity": "One of: Low, Medium, High, Critical",
  "title": "A short, descriptive headline of the issue in Delhi (e.g., 'Flooded Ring Road near CP')",
  "description": "A detailed 2-3 sentence description of the damage visible in the photo, including safety hazards."
}`;

    try {
        const responseText = await callLocalProxy(prompt, imageBase64);
        return parseJSONResponse(responseText);
    } catch (e) {
        console.error("AI image analysis failed, falling back", e);
        // Fallback
        return {
            category: 'Pothole',
            severity: 'High',
            title: 'Pothole scanned offline',
            description: 'Offline fallback description. Gemini API was not reachable: ' + e.message
        };
    }
}

/**
 * Classifies report text
 */
export async function classifyTextWithAI(title, description) {
    if (!isAIConfigured()) {
        const offlineResult = analyzeReportAI(title, description);
        return {
            category: offlineResult.category,
            confidence: offlineResult.confidence,
            department: offlineResult.department,
            severity: 'Medium'
        };
    }

    const prompt = `You are a civic issue classification AI for Delhi.
Analyze the following title and description of a reported community issue:
Title: "${title}"
Description: "${description}"

Respond ONLY with a valid JSON object in this format (no markdown formatting, no code block tags):
{
  "category": "One of: Pothole, Water Leakage, Streetlight, Waste/Garbage, Road Damage, Drainage, Public Property, Noise, Illegal Construction, Other",
  "confidence": 0.95,
  "department": "Name of the government department responsible for this issue in Delhi (e.g., PWD, MCD, Delhi Jal Board, Delhi Police, DPCC)",
  "severity": "One of: Low, Medium, High, Critical"
}`;

    try {
        const responseText = await callLocalProxy(prompt);
        return parseJSONResponse(responseText);
    } catch (e) {
        console.error("AI text classification failed, falling back", e);
        const offlineResult = analyzeReportAI(title, description);
        return {
            category: offlineResult.category,
            confidence: offlineResult.confidence,
            department: offlineResult.department,
            severity: 'Medium'
        };
    }
}

/**
 * Generates AI Hotspot Forecasts
 */
export async function generatePredictiveInsightWithAI(issueStats) {
    if (!isAIConfigured()) {
        return "AI models predict a 20% increase in water log and drainage complaints in Dwarka and Saket as pre-monsoon showers commence. Preventive drainage clearing is advised.";
    }

    const prompt = `You are the CivicPulse Predictive Analytics AI. Given these current Delhi issue statistics:
Total active reports: ${issueStats.total}
Potholes: ${issueStats.potholes}
Water Leakages: ${issueStats.waterLeaks}
Garbage Piles: ${issueStats.garbage}
Clogged Drains: ${issueStats.drainage}
Streetlights Out: ${issueStats.streetlights}

Generate a 2-3 sentence forward-looking predictive analytics forecast (hotspot warning) for Delhi infrastructure. Predict which categories or areas are likely to see a surge in the next 30 days due to seasonal factors (like monsoon waterlogging, summer heat, construction activity, etc.). Make it sound highly professional, data-backed, and specific.
Return ONLY the text paragraph.`;

    try {
        const responseText = await callLocalProxy(prompt);
        return responseText.trim();
    } catch (e) {
        console.error("AI prediction failed, falling back", e);
        return "Offline prediction: PWD Bitumen teams should expect 15% higher reports of potholes in Karol Bagh and Connaught Place corridor next month due to increased municipal construction work.";
    }
}

/**
 * Validates connection settings
 */
export async function testAIConnection() {
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10000);
        const response = await fetch('/api/health', {
            signal: controller.signal
        });
        clearTimeout(timer);

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Connection test failed: ${response.status} - ${text}`);
        }

        const data = await response.json();
        
        if (data.status === 'ok') {
            return { success: true, message: "Connected to CivicPulse Secure Backend." };
        } else {
            throw new Error(data.message || 'Unknown backend error');
        }
    } catch (e) {
        return { success: false, message: e.message };
    }
}
