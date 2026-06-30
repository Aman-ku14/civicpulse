# CivicPulse 🏙️

**Hyperlocal Issue Solver & Community Dashboard**

CivicPulse is an AI-powered web application designed to empower citizens to report, map, and resolve community infrastructure issues (like potholes, water leaks, and broken streetlights). By leveraging Google's Gemini AI, the platform automates issue classification, prevents duplicate reports, and provides predictive analytics for city administrators.

---

## 🌟 Key Features

*   **🤖 AI-Powered Reporting:** Upload a photo of a civic issue, and the Gemini AI vision model will automatically detect the problem, assign a category, assess the severity, and generate a descriptive title.
*   **🗺️ Interactive Live Map:** Explore a dynamic map of Delhi showing all reported issues in real-time, categorized by color and clustered by proximity.
*   **🧠 Smart Auto-Routing:** The AI automatically analyzes text descriptions to route complaints to the correct government department (e.g., PWD, Delhi Jal Board).
*   **🚫 Duplicate Detection:** Prevents spam by scanning nearby coordinates and issue descriptions, prompting users to upvote existing issues instead of creating duplicates.
*   **📊 Admin Impact Dashboard:** A comprehensive dashboard for city administrators to track resolution metrics, view AI-generated predictive hotspot forecasts, and manage community reports.

## 🛠️ Technology Stack

*   **Frontend:** Vanilla JavaScript, HTML5, CSS3 (Custom Glassmorphism UI)
*   **Backend:** Node.js, Express.js
*   **AI Engine:** Google Gemini API (gemini-1.5-flash-latest)
*   **Maps:** Leaflet.js with OpenStreetMap

---

## 🚀 Running Locally

To run this project on your local machine, you will need [Node.js](https://nodejs.org/) installed.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Aman-ku14/civicpulse.git
   cd civicpulse
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a file named `.env` in the root directory and add your Google Gemini API key:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   ```

4. **Start the server:**
   ```bash
   npm start
   ```

5. **Open in Browser:**
   Navigate to `http://localhost:3000` in your web browser. 
   *(Demo Admin Login: `admin@civicpulse.org` / Password: `admin123`)*

---

## ☁️ Deployment

This project is fully ready to be deployed on cloud platforms like **Render**, **Railway**, or **Glitch**. 

1. Connect your GitHub repository to the hosting provider.
2. Set the Build Command to `npm install` and the Start Command to `npm start`.
3. Add your `GEMINI_API_KEY` to the Environment Variables settings on your hosting provider. (Never commit your `.env` file to GitHub).

---
*Built to make cities smarter, safer, and more responsive.*
