# Pash - Personal Dashboard

Pash is a minimalist personal dashboard for your browser. It integrates Google Calendar, Google Tasks, a local notes app with rich text editing, a weather widget (optional), and a clock. Everything is handled client-side; no server or backend is required.

---

## Features

★ View your **Google Calendar** events
★ Manage your **Google Tasks**
★ Create and edit **rich-text notes** (powered by Quill.js)
★ Display **current weather** (requires OpenWeatherMap API key)
★ Live clock (uses **system timezone** automatically)
★ **Dark mode** and **light mode** themes
★ **Persistent settings** saved in your browser (localStorage)
★ **No backend** required

*Stretch goal: an Electron-based app version in the future.*

---

## Setup Instructions

1. **Clone this repository**

   ```bash
   git clone https://github.com/yourusername/pash.git
   ```

2. **Host the files**

   - You can simply open `index.html` in your browser for local use.
   - For remote hosting, upload to any web server (even basic FTP hosting works).

3. **Set up API credentials**

   - Go to [Google Cloud Console](https://console.cloud.google.com/):
     - Create OAuth 2.0 Client ID credentials (type: Web Application)
     - Authorise **JavaScript origins** and **redirect URIs** (e.g., `https://yourdomain.com/pash/`).
     - **Important:** Redirect URIs must exactly match your deployed URL, **including trailing slashes**.
   - Enable the **Google Calendar API** and **Google Tasks API**.
   - (Optional) Sign up for [OpenWeatherMap](https://openweathermap.org/api) to get a free weather API key.

4. **Configure settings**

   - Open the ⚙️ **Settings** panel on your dashboard.
   - Enter your **Google API Client ID**, **Google API Key**, and **OpenWeatherMap API Key** if desired.
   - Customise title, theme, clock format, and other options.

5. **Done!**

---

## Screenshots

---

## Important Notes

- This app relies entirely on client-side execution. Your data remains on your device.
- No personal or calendar/task data is ever sent to any third-party servers.
- Pop-up blockers may interfere with the Google sign-in process.
- Weather functionality is optional. If you do not configure a weather API key, the widget will not display live data.
- Future development may include an optional Electron desktop version.

---

## License

Pash is licensed under the **Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)** license.

### Summary:

- You are free to **share** and **adapt** the code.
- **Attribution** is required (credit the original author).
- **Non-commercial use only.** Commercial use is **strictly prohibited** without explicit permission.

For full details, see the official [license description](https://creativecommons.org/licenses/by-nc/4.0/).

---

## Roadmap

- Electron integration

---

## Contributing

Contributions are welcome for non-commercial improvements! Submit a pull request or open an issue if you have suggestions or bugs to report.

---

## Acknowledgements

- [Google Identity Services](https://developers.google.com/identity)
- [Google Calendar API](https://developers.google.com/calendar)
- [Google Tasks API](https://developers.google.com/tasks)
- [OpenWeatherMap API](https://openweathermap.org/api)
- [Quill.js](https://quilljs.com/) for rich text editing
- [Font Awesome](https://fontawesome.com/) for icons

---

> Dashboard built for personal use and learning purposes. Use responsibly.

