const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve static frontend files (the HTML, CSS, JS)
app.use(express.static(path.join(__dirname)));

// Health check endpoint for settings page UI
app.get('/api/health', (req, res) => {
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 10) {
        res.json({ status: 'ok', message: 'Backend connected and API Key loaded' });
    } else {
        res.status(500).json({ status: 'error', message: 'API Key missing in .env file' });
    }
});

// Secure Proxy for Gemini API
app.post('/api/gemini/generateContent', async (req, res) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'Missing GEMINI_API_KEY in backend .env' });
        }

        const { prompt, imageBase64 } = req.body;

        // Construct Gemini payload
        let contents = [];
        if (imageBase64) {
            const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
            contents.push({
                parts: [
                    { text: prompt },
                    {
                        inline_data: {
                            mime_type: 'image/jpeg',
                            data: base64Data
                        }
                    }
                ]
            });
        } else {
            contents.push({
                parts: [{ text: prompt }]
            });
        }

        const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        // Dynamically import node-fetch if node version doesn't have native fetch
        const fetch = global.fetch || (await import('node-fetch')).default;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents,
                generationConfig: { temperature: 0.2 }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Google API Error (${response.status}): ${errText}`);
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0]) {
            throw new Error('Google returned no candidates');
        }

        // Return just the text content back to frontend to keep it simple
        res.json({
            text: data.candidates[0].content.parts[0].text
        });

    } catch (error) {
        console.error('API Proxy Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 CivicPulse Server running on http://localhost:${PORT}`);
    console.log(process.env.GEMINI_API_KEY ? '✅ API Key loaded' : '❌ Warning: No GEMINI_API_KEY in .env');
});
