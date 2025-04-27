# Pash

[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-47848F?style=for-the-badge&logo=electron&logoColor=white)](https://www.electronjs.org/)

**Pash** is a sleek, modern personal dashboard optimized for fullscreen display on a secondary monitor. It brings together all your essential daily information in one elegant, customizable interface.

Say goodbye to constantly switching between apps to check your schedule, tasks, and notes. Pash consolidates everything important in one beautiful, distraction-free dashboard that keeps you focused and organized.

Perfect for professionals working from home, productivity enthusiasts, or anyone who wants to streamline their digital workspace.

![Pash Dashboard Screenshot](https://github.com/darkcnight/Pash/raw/main/screenshots/dashboard.png)
<!-- *[Add a screenshot of your dashboard here!]* -->

## Key Features

- **Google Calendar integration** - See your upcoming events at a glance (read-only)
- **Google Tasks integration** - Track your to-dos in one place (read-only)
- **Personal notes area** with Markdown support and rich text editing
- **Messaging-style notes UI** with edit, delete, and hover actions
- **Live clock** with timezone support
- **Live weather widget** powered by OpenWeatherMap API
- **Zero backend required** - All data stored in LocalStorage
- **Full dark mode and light mode** support
- **Electron desktop app** version for standalone use
- **Settings page** to customize your experience and manage API keys
- **Auto-launch** option for Electron version (starts on system boot)

---

## Screenshots

<!-- *[Place additional screenshots of your app here!]* -->

<!-- 
- Dashboard overview
- Dark mode
- Notes section
- Calendar and tasks
- Settings panel
-->

---

## Setup Instructions

### Web Version

1. **Clone the repository**
   ```bash
   git clone https://github.com/darkcnight/Pash.git
   cd Pash
   ```

2. **Configure API Keys**
   - You'll need to set up API keys for Google (Calendar & Tasks) and OpenWeatherMap
   - See the API Keys section below for detailed instructions
   - Enter your API keys in the settings panel (⚙️ icon)

3. **Launch**
   - Open `index.html` in your browser
   - For best results, use a modern browser like Chrome, Firefox, or Edge
   - For proper functionality, either:
     - Run on a local web server
     - Use the Electron app version

### Electron App Version (Coming Soon)

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run the App**
   ```bash
   npm start
   ```

3. **Build for Your Platform**
   ```bash
   npm run build
   ```
   This will create executable files for your operating system.

---

## API Keys Setup

### Google API (Calendar & Tasks)

1. **Create a Google Cloud Project**
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable the Google Calendar API and Google Tasks API

2. **Create API Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Create an API Key:
     - Click "Create Credentials" > "API Key"
     - Copy the generated key for "Google API Key" in Pash settings
     - Recommended: Restrict the key to only Calendar and Tasks APIs
   
   - Create OAuth Client ID:
     - Click "Create Credentials" > "OAuth client ID"
     - Application type: "Web application"
     - Add authorized JavaScript origins for your domain (e.g., `http://localhost:8000`)
     - Copy the Client ID for "Google API Client ID" in Pash settings

### OpenWeatherMap API

1. **Create an Account**
   - Sign up at [OpenWeatherMap](https://openweathermap.org/)
   - Go to your API keys section

2. **Generate an API Key**
   - Create a new API key if you don't have one
   - Copy the API key
   - Paste it into "OpenWeatherMap API Key" in Pash settings
   - Note: New API keys may take a few hours to activate

---

## License

MIT License (Coming Soon)

---

*Made with ❤️ by the Darkcnight and Cursor*
