// App Configuration and Settings
let CONFIG = {
    CLIENT_ID: '',
    API_KEY: '',
    WEATHER_API_KEY: '',
    WEATHER_LOCATION: 'Singapore',
    DASHBOARD_TITLE: 'Pash',
    THEME: 'light', // 'light' or 'dark'
    SHOW_DATE: false, // Whether to show date with the time
    SHOW_WEATHER: true, // Whether to show weather in the header
    CALENDAR_DAYS: 7,  // Number of days to pull calendar events (default: 7)
    CLOCK_24H: true // Whether to use 24-hour format (true) or 12-hour format (false)
};

// Load settings from localStorage if available
function loadSettings() {
    const savedSettings = localStorage.getItem('dashboard_settings');
    console.log("Loading settings from localStorage:", savedSettings);
    
    if (savedSettings) {
        try {
            const parsedSettings = JSON.parse(savedSettings);
            console.log("Parsed settings:", parsedSettings);
            CONFIG = { ...CONFIG, ...parsedSettings };
            console.log("Merged CONFIG:", CONFIG);
            
            // Apply title
            if (CONFIG.DASHBOARD_TITLE) {
                document.getElementById('dashboard-title').textContent = CONFIG.DASHBOARD_TITLE;
                document.title = CONFIG.DASHBOARD_TITLE + " - Personal Dashboard";
            }
            
            // Apply theme
            if (CONFIG.THEME === 'dark') {
                document.body.classList.add('dark-mode');
                document.getElementById('theme-toggle').checked = true;
            }
            
            // Apply date toggle setting
            if (CONFIG.SHOW_DATE === true && document.getElementById('date-toggle')) {
                document.getElementById('date-toggle').checked = true;
            }
            
            // Apply clock format setting
            if (document.getElementById('clock-format-toggle')) {
                // 12h format = checked, 24h format = unchecked
                document.getElementById('clock-format-toggle').checked = !CONFIG.CLOCK_24H;
            }
            
            // Apply weather toggle setting
            if (CONFIG.SHOW_WEATHER === false && document.getElementById('weather-toggle')) {
                document.getElementById('weather-toggle').checked = false;
                toggleWeatherDisplay(false);
            } else {
                toggleWeatherDisplay(true);
            }
        } catch (err) {
            console.error('Error parsing saved settings:', err);
        }
    } else {
        // Check system preference if no saved theme
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark-mode');
            CONFIG.THEME = 'dark';
            document.getElementById('theme-toggle').checked = true;
        }
    }
}

// Show a toast notification
function showToast(message, type = 'info', duration = 3000) {
    const toastContainer = document.getElementById('toast-container');
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Set icon based on type
    let icon = '';
    switch (type) {
        case 'success':
            icon = '<i class="fas fa-check-circle"></i>';
            break;
        case 'error':
            icon = '<i class="fas fa-exclamation-circle"></i>';
            break;
        case 'warning':
            icon = '<i class="fas fa-exclamation-triangle"></i>';
            break;
        case 'info':
        default:
            icon = '<i class="fas fa-info-circle"></i>';
            break;
    }
    
    // Create toast HTML
    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-content">
            <p class="toast-message">${message}</p>
        </div>
        <div class="toast-progress">
            <div class="toast-progress-bar"></div>
        </div>
    `;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Animate progress bar
    const progressBar = toast.querySelector('.toast-progress-bar');
    progressBar.style.transition = `width ${duration}ms linear`;
    
    // Start the animation in the next frame to ensure it runs
    setTimeout(() => {
        progressBar.style.width = '0%';
    }, 10);
    
    // Remove toast after duration
    setTimeout(() => {
        toast.style.animation = 'toast-out 0.3s forwards';
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300);
    }, duration);
    
    return toast;
}

// Apply settings changes immediately without requiring a page refresh
function applySettings(changedSettings) {
    // Track which settings were actually changed
    const changedSettingKeys = {};
    
    // Apply each setting that changed
    Object.keys(changedSettings).forEach(key => {
        const oldValue = CONFIG[key];
        const newValue = changedSettings[key];
        
        // Skip if no change
        if (oldValue === newValue) return;
        
        // Mark as changed
        changedSettingKeys[key] = true;
        
        // Apply specific settings
        switch (key) {
            case 'DASHBOARD_TITLE':
                document.getElementById('dashboard-title').textContent = newValue;
                document.title = newValue + " - Personal Dashboard";
                break;
                
            case 'THEME':
                if (newValue === 'dark') {
                    document.body.classList.add('dark-mode');
                    if (document.getElementById('theme-toggle')) {
                        document.getElementById('theme-toggle').checked = true;
                    }
                } else {
                    document.body.classList.remove('dark-mode');
                    if (document.getElementById('theme-toggle')) {
                        document.getElementById('theme-toggle').checked = false;
                    }
                }
                break;
                
            case 'DARK_MODE':
                // Toggle dark mode
                if (newValue === true) {
                    document.body.classList.add('dark-mode');
                } else {
                    document.body.classList.remove('dark-mode');
                }
                
                // Refresh calendar and task display to update colors
                if (calendarAuthorized) {
                    refreshCalendarDisplay();
                }
                if (tasksAuthorized) {
                    refreshTasksDisplay();
                }
                
                // Restore any custom colors
                restoreCustomColors();
                break;
                
            case 'SHOW_DATE':
            case 'CLOCK_24H':
                // Update clock format
                setupClock();
                break;
                
            case 'SHOW_WEATHER':
                // Toggle weather visibility
                toggleWeatherDisplay(newValue);
                break;
                
            case 'CALENDAR_DAYS':
                // This is handled separately in the existing code
                break;
                
            // Add any other settings as needed
        }
    });
    
    // Return the keys that were actually changed
    return Object.keys(changedSettingKeys);
}

// Helper function to restore custom colors after theme change
function restoreCustomColors() {
    // Get stored colors
    const itemColors = getItemColors();
    
    // Restore colors for each type
    Object.keys(itemColors).forEach(itemType => {
        const typeColors = itemColors[itemType];
        Object.keys(typeColors).forEach(itemId => {
            const color = typeColors[itemId];
            if (color) {
                // Find the element in the DOM
                let item = null;
                if (itemType === 'note') {
                    item = document.querySelector(`.note-item[data-id="${itemId}"]`);
                } else {
                    item = document.querySelector(`[data-id="${itemId}"][data-type="${itemType}"]`);
                }
                
                // If found, apply the color
                if (item) {
                    item.style.borderLeftColor = color;
                }
            }
        });
    });
}

// Highlight a changed setting in the UI
function highlightChangedSetting(settingKey) {
    let element;
    
    // Find the corresponding element in the settings modal
    switch (settingKey) {
        case 'CLIENT_ID':
            element = document.getElementById('google-client-id');
            break;
        case 'API_KEY':
            element = document.getElementById('google-api-key');
            break;
        case 'WEATHER_API_KEY':
            element = document.getElementById('weather-api-key');
            break;
        case 'CALENDAR_DAYS':
            element = document.getElementById('calendar-days-select');
            break;
        case 'DARK_MODE':
            // Highlight the theme toggle container
            element = document.querySelector('.theme-toggle-container:first-of-type');
            break;
        case 'SHOW_DATE':
        case 'SHOW_WEATHER':
            // Find appropriate container
            const containerSelector = settingKey === 'SHOW_DATE' ? 
                '.theme-toggle-container:nth-of-type(2)' : 
                '.theme-toggle-container:nth-of-type(3)';
            element = document.querySelector(containerSelector);
            break;
    }
    
    if (element) {
        // Add and then remove the highlight class
        element.classList.add('setting-changed');
        // Remove the class after animation completes
        setTimeout(() => {
            element.classList.remove('setting-changed');
        }, 2000);
    }
}

// Refresh calendar display without reloading data
function refreshCalendarDisplay() {
    if (!calendarAuthorized) return;
    
    // If we have cached events, refresh their display
    const calendarContent = document.getElementById('calendar-content');
    if (calendarContent && !calendarContent.querySelector('.login-prompt')) {
        // We have event data, refresh display
        // Get the events from the last response if available
        if (window.lastCalendarResponse && window.lastCalendarResponse.result) {
            displayCalendarEvents(window.lastCalendarResponse.result.items);
        } else {
            // If no cached data, we'll need to reload
            listCalendarEvents();
        }
    }
}

// Refresh tasks display without reloading data
function refreshTasksDisplay() {
    if (!tasksAuthorized) return;
    
    // Get status indicator
    const statusIndicator = document.getElementById('tasks-status');
    
    // If we have cached tasks, refresh their display
    const tasksContent = document.getElementById('tasks-content');
    if (tasksContent && !tasksContent.querySelector('.login-prompt')) {
        console.log('Refreshing tasks display');
        
        // Make sure currentTaskListId is preserved if we have it
        const currentId = window.currentTaskListId;
        
        // Get the tasks from the last response if available
        if (window.lastTasksResponse && window.lastTasksResponse.result) {
            const tasks = window.lastTasksResponse.result.items || [];
            console.log(`Refreshing display with ${tasks.length} cached tasks`);
            displayTasks(tasks);
            
            // Ensure we don't lose the task list ID during refresh
            if (currentId && !window.currentTaskListId) {
                window.currentTaskListId = currentId;
                console.log('Restored task list ID after refresh:', currentId);
            }
            
            // Make sure the status indicator shows the last updated time
            if (statusIndicator) {
                // Use system timezone instead of configured timezone
                let updatedTime = DateTime.now().toLocaleString(DateTime.TIME_SIMPLE);
                statusIndicator.textContent = `Last updated: ${updatedTime}`;
            }
        } else {
            console.log('No cached task data, reloading from API');
            // If no cached data, we'll need to reload
            listTasks();
        }
    }
}

// Reinitialize Google APIs with new credentials
function reinitializeGoogleAPIs() {
    console.log("📌 reinitializeGoogleAPIs() called");
    console.log("📌 CONFIG.API_KEY:", CONFIG.API_KEY ? "Present (length:" + CONFIG.API_KEY.length + ")" : "Missing");
    console.log("📌 CONFIG.CLIENT_ID:", CONFIG.CLIENT_ID ? "Present (length:" + CONFIG.CLIENT_ID.length + ")" : "Missing");
    console.log("📌 Current state - gapiInited:", gapiInited, "gisInited:", gisInited);
    
    // Show loading indicator
    showToast('Updating Google API configuration...', 'info', 5000);
    
    // Reset state
    gapiInited = false;
    gisInited = false;
    console.log("📌 Reset initialization flags - gapiInited:", gapiInited, "gisInited:", gisInited);
    
    try {
        if (!window.gapi || !window.gapi.client) {
            console.error("📌 ERROR: gapi or gapi.client is not available. Scripts may not be loaded properly.");
            showToast('Failed to update Google API configuration. Scripts not loaded.', 'error');
            return;
        }
        
        // Reinitialize gapi with new API key
        console.log("📌 Setting new API key to gapi.client");
        gapi.client.setApiKey(CONFIG.API_KEY);
        
        // Reinitialize the client
        console.log("📌 Reinitializing gapi.client with new configuration");
        gapi.client.init({
            apiKey: CONFIG.API_KEY,
            discoveryDocs: DISCOVERY_DOCS,
        }).then(() => {
            console.log("📌 gapi.client successfully reinitialized");
            gapiInited = true;
            console.log("📌 gapiInited set to:", gapiInited);
            
            if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
                console.error("📌 ERROR: google.accounts.oauth2 is not available. Google Identity Services script may not be loaded properly.");
                showToast('Failed to update Google API configuration. Identity Services not loaded.', 'error');
                return;
            }
            
            // Reinitialize token client with new client ID
            console.log("📌 Reinitializing tokenClient with new CLIENT_ID");
            tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: CONFIG.CLIENT_ID,
                scope: SCOPES,
                callback: '', // Will be set later
            });
            console.log("📌 tokenClient successfully reinitialized");
            gisInited = true;
            console.log("📌 gisInited set to:", gisInited);
            
            // Check if we're authorized
            if (gapi.client.getToken() !== null) {
                console.log("📌 Found existing token, refreshing data");
                // We're already authenticated, refresh the data
                if (calendarAuthorized) {
                    listCalendarEvents();
                }
                if (tasksAuthorized) {
                    listTasks();
                }
                showToast('Google API configuration updated successfully!', 'success');
            } else {
                console.log("📌 No token found, need to re-authenticate");
                // Need to re-authenticate
                maybeEnableButtons();
                showToast('Please sign in again with your Google account', 'warning');
            }
        }).catch(error => {
            console.error('📌 Error reinitializing Google API client:', error);
            console.error('📌 Error message:', error.message);
            console.error('📌 Error details:', JSON.stringify(error, null, 2));
            showToast('Failed to update Google API configuration. Please check your credentials.', 'error');
        });
    } catch (error) {
        console.error('📌 Error during Google APIs reinitialization:', error);
        console.error('📌 Error message:', error.message);
        console.error('📌 Error stack:', error.stack);
        showToast('Error updating Google API configuration', 'error');
    }
}

// Save settings to localStorage
function saveSettings(settings) {
    try {
        // Keep track of the previous settings for comparison
        const previousSettings = { ...CONFIG };
        
        // Merge with existing settings
    CONFIG = { ...CONFIG, ...settings };
        
        // Save to localStorage
    localStorage.setItem('dashboard_settings', JSON.stringify(CONFIG));
        
        // Handle immediate setting updates
        if (settings.CALENDAR_DAYS) {
            // Update the settings modal dropdown
            const settingsCalendarWindowSelect = document.getElementById('calendar-days-select');
            if (settingsCalendarWindowSelect) {
                settingsCalendarWindowSelect.value = settings.CALENDAR_DAYS.toString();
            }
            
            // Update the calendar section dropdown
            const calendarWindowSelect = document.getElementById('calendar-window-select');
            if (calendarWindowSelect) {
                calendarWindowSelect.value = settings.CALENDAR_DAYS.toString();
            }
            
            // Reload calendar events if authorized
            if (calendarAuthorized) {
                listCalendarEvents();
            }
        }
        
        // Apply settings changes
        const changes = applySettings(settings);
        
        // If Google API keys were added for the first time, load Google APIs
        if (
            (settings.CLIENT_ID && settings.API_KEY) && 
            (!previousSettings.CLIENT_ID || !previousSettings.API_KEY || !gapiInited || !gisInited)
        ) {
            console.log("Attempting to load Google APIs with new keys");
            console.log("Previous CLIENT_ID:", previousSettings.CLIENT_ID ? "Set" : "Not set");
            console.log("Previous API_KEY:", previousSettings.API_KEY ? "Set" : "Not set");
            console.log("gapiInited:", gapiInited);
            console.log("gisInited:", gisInited);
            
            // Check if scripts are already loaded
            if (!window.gapi) {
                console.log("Loading Google API scripts for the first time");
                // Load the Google API client library
                const script1 = document.createElement('script');
                script1.src = 'https://apis.google.com/js/api.js';
                script1.onload = function() {
                    console.log("Google API script loaded successfully");
                    gapiLoaded();
                };
                script1.onerror = function() {
                    console.error("Failed to load Google API script");
                };
                document.body.appendChild(script1);
                
                // Load the Google Identity Services library
                const script2 = document.createElement('script');
                script2.src = 'https://accounts.google.com/gsi/client';
                script2.onload = function() {
                    console.log("Google Identity Services script loaded successfully");
                    gisLoaded();
                };
                script2.onerror = function() {
                    console.error("Failed to load Google Identity Services script");
                };
                document.body.appendChild(script2);
                
                showToast('Google API configuration saved. Loading API clients...', 'info');
            } else if (gapiInited && gisInited) {
                console.log("Reinitializing Google APIs with new keys");
                // APIs already loaded, just reinitialize with new keys
                reinitializeGoogleAPIs();
            } else {
                console.log("Google API object exists but not initialized. Waiting for initialization.");
                showToast('Google API configuration saved. Waiting for initialization...', 'info');
            }
        }
        
        // Show success toast if any changes were made
        if (changes) {
            showToast('Settings updated successfully!', 'success');
        }
        
        return true;
    } catch (err) {
        console.error('Error saving settings:', err);
        showToast('Error saving settings: ' + err.message, 'error');
        return false;
    }
}

// Discovery docs and scopes for Calendar and Tasks
const DISCOVERY_DOCS = [
    'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
    'https://www.googleapis.com/discovery/v1/apis/tasks/v1/rest'
];

const SCOPES = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/tasks https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/tasks.readonly https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.events.readonly';

let tokenClient;
let gapiInited = false;
let gisInited = false;
let calendarAuthorized = false;
let tasksAuthorized = false;
let refreshInterval;
let weatherRefreshInterval;
let DateTime = luxon.DateTime;

// Show an error message in a section
function showError(sectionId, errorTitle, errorMsg) {
    const section = document.getElementById(sectionId);
    const contentDiv = section.querySelector('.section-content');
    
    // Create error message element
    const errorEl = document.createElement('div');
    errorEl.className = 'error-message';
    errorEl.innerHTML = `
        <h3>${errorTitle}</h3>
        <p>${errorMsg}</p>
    `;
    
    // Clear and add error message
    contentDiv.innerHTML = '';
    contentDiv.appendChild(errorEl);
}

// Load the Google API client library
document.addEventListener('DOMContentLoaded', () => {
    // Load saved settings first
    loadSettings();
    
    // Set up settings modal
    setupSettingsModal();
    
    // Set up help buttons
    setupHelpButtons();
    
    // Set up title editing
    setupTitleEditing();
    
    // Set up notes functionality (works without API keys)
    setupNotes();
    
    // Set up clock
    setupClock();
    
    // Set up calendar window dropdown
    setupCalendarWindowDropdown();
    
    // Set up sortable panes
    setupSortablePanes();
    
    // Only attempt to load APIs if keys are provided and weather is enabled
    if (CONFIG.WEATHER_API_KEY && CONFIG.SHOW_WEATHER !== false) {
        // Set up weather
        setupWeather();
    } else if (!CONFIG.WEATHER_API_KEY && CONFIG.SHOW_WEATHER !== false) {
        document.getElementById('weather').innerHTML = `
            <div>Weather API key not configured</div>
        `;
    }
    
    // If weather should be hidden, apply that now
    if (CONFIG.SHOW_WEATHER === false) {
        toggleWeatherDisplay(false);
    }
    
    // Only attempt to load Google APIs if keys are provided
    if (CONFIG.CLIENT_ID && CONFIG.API_KEY) {
        // Load the Google API client library
        const script1 = document.createElement('script');
        script1.src = 'https://apis.google.com/js/api.js';
        script1.onload = function() {
            console.log("Google API script loaded successfully");
            gapiLoaded();
        };
        document.body.appendChild(script1);
        
        // Load the Google Identity Services library
        const script2 = document.createElement('script');
        script2.src = 'https://accounts.google.com/gsi/client';
        script2.onload = function() {
            console.log("Google Identity Services script loaded successfully");
            gisLoaded();
        };
        document.body.appendChild(script2);
    } else {
        console.log("Google API keys not provided in CONFIG. Google services disabled.");
        document.getElementById('calendar-content').innerHTML = `
            <div>Google API keys not configured. Set them in ⚙️ settings.</div>
        `;
        document.getElementById('tasks-content').innerHTML = `
            <div>Google API keys not configured. Set them in ⚙️ settings.</div>
        `;
    }
});

// Set up the title editing functionality
function setupTitleEditing() {
    const editButton = document.getElementById('edit-title-btn');
    const titleModal = document.getElementById('title-edit-modal');
    const modalOverlay = document.getElementById('modal-overlay');
    const closeButton = document.getElementById('close-title-modal');
    const saveButton = document.getElementById('title-save');
    const titleInput = document.getElementById('dashboard-title-input');
    
    // Show the modal when edit button is clicked
    editButton.addEventListener('click', () => {
        titleInput.value = CONFIG.DASHBOARD_TITLE || 'Pash';
        titleModal.style.display = 'block';
        modalOverlay.style.display = 'block';
        titleInput.focus();
        titleInput.select();
    });
    
    // Close the modal when X is clicked
    closeButton.addEventListener('click', () => {
        titleModal.style.display = 'none';
        modalOverlay.style.display = 'none';
    });
    
    // Save the title when save button is clicked
    saveButton.addEventListener('click', saveTitle);
    
    // Save title when Enter is pressed
    titleInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            saveTitle();
        }
    });
    
    function saveTitle() {
        const newTitle = titleInput.value.trim();
        if (newTitle) {
            document.getElementById('dashboard-title').textContent = newTitle;
            document.title = newTitle + " - Personal Dashboard";
            
            // Save to config
            saveSettings({ DASHBOARD_TITLE: newTitle });
            
            // Close the modal
            titleModal.style.display = 'none';
            modalOverlay.style.display = 'none';
        }
    }
}

// Initialize the Google API client library
function gapiLoaded() {
    console.log("📌 gapiLoaded() called - Starting Google API client loading process");
    console.log("📌 CONFIG.API_KEY:", CONFIG.API_KEY ? "Present (length:" + CONFIG.API_KEY.length + ")" : "Missing");
    console.log("📌 CONFIG.CLIENT_ID:", CONFIG.CLIENT_ID ? "Present (length:" + CONFIG.CLIENT_ID.length + ")" : "Missing");
    
    try {
        console.log("📌 Attempting to load gapi.client");
        gapi.load('client', {
            callback: function() {
                console.log("📌 gapi.client successfully loaded");
                initializeGapiClient();
            },
            onerror: function(error) {
                console.error("📌 Error loading gapi.client:", error);
                showError('calendar-section', 'Google API Error', 'Failed to load Google API client. Check console for details.');
                showError('tasks-section', 'Google API Error', 'Failed to load Google API client. Check console for details.');
            },
            timeout: 10000, // 10 seconds
            ontimeout: function() {
                console.error("📌 Timeout loading gapi.client");
                showError('calendar-section', 'Google API Error', 'Timeout loading Google API client.');
                showError('tasks-section', 'Google API Error', 'Timeout loading Google API client.');
            }
        });
    } catch (error) {
        console.error('📌 Error in gapiLoaded function:', error);
        showError('calendar-section', 'Google API Error', 'Failed to load Google API client. Please try again later.');
        showError('tasks-section', 'Google API Error', 'Failed to load Google API client. Please try again later.');
    }
}

// Initialize the Google API client with your API key and discovery docs
async function initializeGapiClient() {
    console.log("📌 initializeGapiClient() called");
    console.log("📌 Using API Key:", CONFIG.API_KEY ? "Present (length:" + CONFIG.API_KEY.length + ")" : "Missing");
    console.log("📌 Discovery Docs:", DISCOVERY_DOCS);
    
    try {
        console.log("📌 Calling gapi.client.init with API key");
        await gapi.client.init({
            apiKey: CONFIG.API_KEY,
            discoveryDocs: DISCOVERY_DOCS,
        });
        console.log("📌 gapi.client.init completed successfully");
        gapiInited = true;
        console.log("📌 gapiInited set to:", gapiInited);
        maybeEnableButtons();
    } catch (error) {
        console.error('📌 Detailed error initializing Google API client:', error);
        console.error('📌 Error message:', error.message);
        console.error('📌 Error details:', JSON.stringify(error, null, 2));
        showError('calendar-section', 'Google API Error', 'Failed to initialize Google API client. Please check your API key in settings.');
        showError('tasks-section', 'Google API Error', 'Failed to initialize Google API client. Please check your API key in settings.');
    }
}

// Initialize the Google Identity Services client
function gisLoaded() {
    console.log("📌 gisLoaded() called - Starting Google Identity Services initialization");
    console.log("📌 CONFIG.CLIENT_ID:", CONFIG.CLIENT_ID ? "Present (length:" + CONFIG.CLIENT_ID.length + ")" : "Missing");
    
    try {
        console.log("📌 Creating tokenClient with CLIENT_ID");
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CONFIG.CLIENT_ID,
            scope: SCOPES,
            callback: '', // Will be set later
        });
        console.log("📌 tokenClient successfully created:", tokenClient ? "Present" : "Missing");
        gisInited = true;
        console.log("📌 gisInited set to:", gisInited);
        maybeEnableButtons();
    } catch (error) {
        console.error('📌 Error initializing Google Identity Services:', error);
        console.error('📌 Error message:', error.message);
        console.error('📌 Error details:', JSON.stringify(error, null, 2));
        showError('calendar-section', 'Google API Error', 'Failed to initialize Google Identity Services. Please check your Client ID in settings.');
        showError('tasks-section', 'Google API Error', 'Failed to initialize Google Identity Services. Please check your Client ID in settings.');
    }
}

// Enable the authorize buttons if both API clients are initialized
function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        // Attempt to load token from localStorage first
        const storedToken = localStorage.getItem('gapi_token');
        if (storedToken) {
            try {
                const token = JSON.parse(storedToken);
                // Check if token has expired (optional, but good practice)
                // Note: Google tokens usually last 1 hour
                if (token && token.expires_at && Date.now() < token.expires_at) {
                    console.log("📌 Found valid token in localStorage, applying...");
                    gapi.client.setToken(token);
                    
                    // If token is set successfully, update auth state and UI
                    if (gapi.client.getToken()) { 
                        calendarAuthorized = true;
                        tasksAuthorized = true;
                        console.log("📌 Token applied successfully. Fetching data.");
                        handleCalendarAuthSuccess(); // Hides prompt, lists events
                        handleTasksAuthSuccess();   // Hides prompt, lists tasks
                        return; // Skip enabling buttons if already authorized
                    } else {
                        console.warn("📌 Failed to apply stored token.");
                        localStorage.removeItem('gapi_token'); // Clear invalid token
                    }
                } else {
                    console.log("📌 Stored token is missing, invalid, or expired. Clearing.");
                    localStorage.removeItem('gapi_token');
                }
            } catch (error) {
                console.error("📌 Error parsing stored token:", error);
                localStorage.removeItem('gapi_token'); // Clear corrupted token
            }
        }
        
        // If no valid token was loaded, enable the sign-in buttons
        console.log("📌 No valid token found or applied. Enabling sign-in buttons.");
        
        // Calendar buttons
        const authorizeCalendarButton = document.getElementById('authorize-calendar');
        if (authorizeCalendarButton) {
            authorizeCalendarButton.disabled = false;
            authorizeCalendarButton.onclick = handleCalendarAuthClick;
        }
        
        // Tasks buttons
        const authorizeTasksButton = document.getElementById('authorize-tasks');
        if (authorizeTasksButton) {
            authorizeTasksButton.disabled = false;
            authorizeTasksButton.onclick = handleTasksAuthClick;
        }
    }
}

// Populate timezone select with IANA timezones
function populateTimezones(selectElement) {
    // Clear existing options
    selectElement.innerHTML = '';
    
    // Add Auto option
    const autoOption = document.createElement('option');
    autoOption.value = 'auto';
    autoOption.textContent = 'Auto (System Timezone)';
    selectElement.appendChild(autoOption);
    
    // Common timezones with readable names
    const commonTimezones = [
        { zone: 'America/New_York', name: 'US Eastern Time (New York)' },
        { zone: 'America/Chicago', name: 'US Central Time (Chicago)' },
        { zone: 'America/Denver', name: 'US Mountain Time (Denver)' },
        { zone: 'America/Los_Angeles', name: 'US Pacific Time (Los Angeles)' },
        { zone: 'America/Anchorage', name: 'US Alaska Time (Anchorage)' },
        { zone: 'America/Honolulu', name: 'US Hawaii Time (Honolulu)' },
        { zone: 'America/Toronto', name: 'Canada Eastern Time (Toronto)' },
        { zone: 'Europe/London', name: 'UK Time (London)' },
        { zone: 'Europe/Paris', name: 'Central European Time (Paris)' },
        { zone: 'Europe/Berlin', name: 'Central European Time (Berlin)' },
        { zone: 'Europe/Moscow', name: 'Moscow Time' },
        { zone: 'Asia/Tokyo', name: 'Japan Time (Tokyo)' },
        { zone: 'Asia/Shanghai', name: 'China Time (Shanghai)' },
        { zone: 'Asia/Singapore', name: 'Singapore Time' },
        { zone: 'Australia/Sydney', name: 'Australia Eastern Time (Sydney)' },
        { zone: 'Pacific/Auckland', name: 'New Zealand Time (Auckland)' }
    ];
    
    // Add timezone options
    commonTimezones.forEach(tz => {
        const option = document.createElement('option');
        option.value = tz.zone;
        option.textContent = tz.name;
        selectElement.appendChild(option);
    });
    
    // Set current timezone
    if (CONFIG.TIMEZONE && CONFIG.TIMEZONE !== 'auto') {
        selectElement.value = CONFIG.TIMEZONE;
    } else {
        selectElement.value = 'auto';
    }
}

// Handle authorization for Calendar
function handleCalendarAuthClick() {
    if (!tokenClient) {
        console.error("Token client not initialized");
        showToast("Error: Token client not initialized", "error");
        return;
    }
    
    // Callback after token is obtained
    tokenClient.callback = (resp) => {
        if (resp.error !== undefined) {
            console.error("Error getting auth token:", resp);
            showToast("Error signing in to Calendar", "error");
            // Check for specific errors like popup closed
            if (resp.error === 'popup_closed_by_user') {
                 showToast('Sign-in cancelled by user', 'info');
            } else if (resp.error === 'access_denied') {
                 showToast('Permissions denied for Google services', 'warning');
            }
            return;
        }
        
        // Store the token in local storage, adding expiry time
        const tokenResponse = gapi.client.getToken();
        if (tokenResponse) {
            // Calculate expiry time (expires_in is in seconds)
            const expiresIn = tokenResponse.expires_in * 1000; // Convert to milliseconds
            const expiresAt = Date.now() + expiresIn;
            const tokenToStore = { ...tokenResponse, expires_at: expiresAt };
            
            console.log("📌 Token obtained via Calendar button:", tokenToStore);
            localStorage.setItem('gapi_token', JSON.stringify(tokenToStore));
        } else {
             console.warn("📌 No token received after successful auth callback (Calendar)");
        }
        
        // Call success handlers for BOTH services
        handleCalendarAuthSuccess();
        handleTasksAuthSuccess(); 
    };
        
    // If there's no token, prompt for one
    if (gapi.client.getToken() === null) {
        console.log("📌 No existing token, requesting with consent prompt for Calendar");
        // Use prompt: 'consent' to ensure user sees the permissions screen
        tokenClient.requestAccessToken({ prompt: 'consent' }); 
    } else {
        console.log("📌 Existing token found, requesting without prompt for Calendar");
        // We already have a token, potentially just need to refresh data or ensure scopes
        tokenClient.requestAccessToken({ prompt: '' });
    }
}

// Handle authorization for Tasks
function handleTasksAuthClick() {
    console.log("📌 handleTasksAuthClick() called");
    console.log("📌 tokenClient:", tokenClient ? "Available" : "Missing");
    
    try {
        console.log("📌 Setting up tokenClient callback for Tasks auth");
        tokenClient.callback = async (resp) => {
            console.log("📌 Auth callback received for Tasks:", resp ? "Response received" : "No response");
            if (resp.error !== undefined) {
                console.error("📌 Auth error in callback:", resp.error);
                throw resp;
            }
            console.log("📌 Auth successful, storing token");
            
            // Store the token in local storage, adding expiry time
            const tokenResponse = gapi.client.getToken();
            if (tokenResponse) {
                // Calculate expiry time (expires_in is in seconds)
                const expiresIn = tokenResponse.expires_in * 1000; // Convert to milliseconds
                const expiresAt = Date.now() + expiresIn;
                const tokenToStore = { ...tokenResponse, expires_at: expiresAt };
                
                console.log("📌 Token obtained via Tasks button:", tokenToStore);
                localStorage.setItem('gapi_token', JSON.stringify(tokenToStore));
            } else {
                console.warn("📌 No token received after successful auth callback (Tasks)");
            }

            handleCalendarAuthSuccess(); // Both APIs use the same token
            handleTasksAuthSuccess();
        };
        
        if (gapi.client.getToken() === null) {
            console.log("📌 No existing token, requesting with consent prompt");
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            console.log("📌 Existing token found, requesting without prompt");
            tokenClient.requestAccessToken({ prompt: '' });
        }
    } catch (error) {
        console.error('📌 Error during Tasks authorization:', error);
        console.error('📌 Error details:', JSON.stringify(error, null, 2));
        showError('tasks-section', 'Authorization Error', 'Failed to authorize Tasks access. Please try again later.');
    }
}

// Handle successful Calendar authorization
function handleCalendarAuthSuccess() {
    console.log("📌 handleCalendarAuthSuccess() called");
    calendarAuthorized = true;
    console.log("📌 calendarAuthorized set to:", calendarAuthorized);
    
    const loginPrompt = document.getElementById('calendar-login-prompt');
    if (loginPrompt) {
        console.log("📌 Hiding calendar login prompt");
        loginPrompt.classList.add('hidden');
    } else {
        console.log("📌 WARNING: calendar-login-prompt element not found");
    }
    
    console.log("📌 Calling listCalendarEvents()");
    listCalendarEvents();
}

// Handle successful Tasks authorization
function handleTasksAuthSuccess() {
    console.log("📌 handleTasksAuthSuccess() called");
    tasksAuthorized = true;
    console.log("📌 tasksAuthorized set to:", tasksAuthorized);
    
    const loginPrompt = document.getElementById('tasks-login-prompt');
    if (loginPrompt) {
        console.log("📌 Hiding tasks login prompt");
        loginPrompt.classList.add('hidden');
    } else {
        console.log("📌 WARNING: tasks-login-prompt element not found");
    }
    
    console.log("📌 Calling listTasks()");
    listTasks();
}

// Set up local storage for notes and UI handling
function setupNotes() {
    const notesList = document.getElementById('notes-list');
    const noteSendBtn = document.getElementById('note-send');
    
    // Initialize Quill editor
    const quill = new Quill('#quill-editor', {
        theme: 'snow',
        placeholder: 'Type a note...',
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline', 'strike'],
                ['blockquote', 'code-block'],
                [{ 'header': 1 }, { 'header': 2 }],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'script': 'sub'}, { 'script': 'super' }],
                [{ 'indent': '-1'}, { 'indent': '+1' }],
                ['link', 'image'],
                ['clean']
            ]
        }
    });
    
    // Add tooltips to Quill toolbar buttons
    addQuillTooltips();
    
    // Load saved notes from local storage
    loadNotes();
    
    // Helper tooltip for the editor
    const editorTooltip = document.createElement('div');
    editorTooltip.className = 'editor-tooltip';
    editorTooltip.innerHTML = 'Tip: Use Ctrl+Enter to save your note';
    editorTooltip.style.opacity = '0';
    document.querySelector('.note-input-container').appendChild(editorTooltip);
    
    // Show tooltip when editor is focused
    quill.root.addEventListener('focus', () => {
        editorTooltip.style.opacity = '1';
        // Hide tooltip after 3 seconds
        setTimeout(() => {
            editorTooltip.style.opacity = '0';
        }, 3000);
    });
    
    // Toggle send button visibility based on editor content
    function toggleSendButton() {
        const content = quill.root.innerHTML.trim();
        if (content && content !== '<p><br></p>') {
            noteSendBtn.classList.add('note-send-btn-visible');
        } else {
            noteSendBtn.classList.remove('note-send-btn-visible');
        }
    }
    
    // Check for content when editor changes
    quill.on('text-change', toggleSendButton);
    
    // Initial check
    toggleSendButton();
    
    // Send note when Enter with Ctrl key is pressed (standard rich text behavior)
    quill.keyboard.addBinding({
        key: 13, // Enter key
        ctrlKey: true
    }, function() {
        addNote();
    });
    
    // Function to add tooltips to Quill toolbar buttons
    function addQuillTooltips() {
        // Give time for Quill to render completely
        setTimeout(() => {
            const tooltipData = [
                { selector: 'button.ql-bold', text: 'Bold (Ctrl+B)' },
                { selector: 'button.ql-italic', text: 'Italic (Ctrl+I)' },
                { selector: 'button.ql-underline', text: 'Underline (Ctrl+U)' },
                { selector: 'button.ql-strike', text: 'Strikethrough' },
                { selector: 'button.ql-blockquote', text: 'Blockquote' },
                { selector: 'button.ql-code-block', text: 'Code Block' },
                { selector: 'button.ql-header[value="1"]', text: 'Heading 1' },
                { selector: 'button.ql-header[value="2"]', text: 'Heading 2' },
                { selector: 'button.ql-list[value="ordered"]', text: 'Numbered List' },
                { selector: 'button.ql-list[value="bullet"]', text: 'Bullet List' },
                { selector: 'button.ql-script[value="sub"]', text: 'Subscript' },
                { selector: 'button.ql-script[value="super"]', text: 'Superscript' },
                { selector: 'button.ql-indent[value="-1"]', text: 'Decrease Indent' },
                { selector: 'button.ql-indent[value="+1"]', text: 'Increase Indent' },
                { selector: 'button.ql-link', text: 'Insert Link' },
                { selector: 'button.ql-image', text: 'Insert Image' },
                { selector: 'button.ql-clean', text: 'Clear Formatting' }
            ];
            
            // Find all buttons in the toolbar and add tooltips
            tooltipData.forEach(({ selector, text }) => {
                document.querySelectorAll(selector).forEach(button => {
                    // Add HTML title attribute for native browser tooltip
                    button.setAttribute('title', text);
                    
                    // Add custom tooltip
                    button.addEventListener('mouseenter', (e) => {
                        const tooltip = document.createElement('div');
                        tooltip.className = 'quill-button-tooltip';
                        tooltip.textContent = text;
                        
                        // Position the tooltip above the button
                        const rect = button.getBoundingClientRect();
                        tooltip.style.left = rect.left + (rect.width / 2) + 'px';
                        tooltip.style.top = rect.top - 5 + 'px'; // Adjusted offset to account for transform
                        
                        document.body.appendChild(tooltip);
                        
                        // Store the tooltip in a property so we can remove it later
                        button._tooltip = tooltip;
                    });
                    
                    // Remove tooltip when mouse leaves
                    button.addEventListener('mouseleave', () => {
                        if (button._tooltip) {
                            button._tooltip.remove();
                            button._tooltip = null;
                        }
                    });
                });
            });
        }, 300); // Increased delay to ensure Quill is fully initialized
    }
    
    // Send note when clicking the Send button
    noteSendBtn.addEventListener('click', addNote);
    
    // Function to add a new note
    function addNote() {
        const content = quill.root.innerHTML.trim();
        if (!content || content === '<p><br></p>') return;
        
        // Create a new note object
        const note = {
            id: Date.now(),
            content: content, // Store HTML content
            timestamp: new Date().toISOString(),
            pinned: false,
            order: 0
        };
        
        // Add to local storage
        const notes = getNotes();
        notes.unshift(note); // Add to beginning (most recent first)
        saveNotes(notes);
        
        // Clear input
        quill.root.innerHTML = '';
        
        // Hide send button
        noteSendBtn.classList.remove('note-send-btn-visible');
        
        // Refresh notes display
        loadNotes();
    }
    
    // Function to load notes from local storage
    function loadNotes() {
        const notes = getNotes();
        notesList.innerHTML = '';
        
        // Get saved colors with proper error handling
        let itemColors = { event: {}, task: {}, note: {} };
        try {
            const colors = getItemColors();
            if (colors && typeof colors === 'object') {
                itemColors = colors;
                // Ensure note property exists
                if (!itemColors.note) itemColors.note = {};
            }
        } catch (e) {
            console.error('Error getting item colors:', e);
        }
        
        if (notes.length === 0) {
            notesList.innerHTML = '<div class="note-item" style="opacity: 0.7; text-align: center;">No notes yet. Type something to get started!</div>';
            return;
        }
        
        // Loop through notes - add according to sort order
        notes.forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.className = 'note-item';
            if (note.pinned) {
                noteElement.classList.add('pinned');
            }
            noteElement.dataset.id = note.id;
            noteElement.dataset.type = 'note';
            noteElement.dataset.order = note.order || 0;
            noteElement.draggable = true; // Enable dragging
            
            // Apply saved color if exists - with extra safeguards
            let tabColor = '';
            if (note && note.id && itemColors && itemColors.note) {
                try {
                    tabColor = itemColors.note[note.id] || '';
                } catch(e) {
                    console.error('Error accessing note color:', e);
                }
            }
            
            if (tabColor) {
                noteElement.style.borderLeftColor = tabColor;
                if (note.pinned) {
                    noteElement.style.borderTopColor = tabColor;
                }
            }
            
            // Format the date in the user's timezone
            let formattedDate;
            try {
                formattedDate = DateTime.fromISO(note.timestamp)
                    .setZone(CONFIG.TIMEZONE)
                    .toLocaleString(DateTime.DATETIME_SHORT);
            } catch (error) {
                // Fallback to browser's locale formatting if timezone is invalid
                formattedDate = new Date(note.timestamp).toLocaleString();
            }
            
            // Add drag handle div
            const dragHandle = document.createElement('div');
            dragHandle.className = 'note-drag-handle';
            noteElement.appendChild(dragHandle);
            
            // No need to parse markdown - display HTML directly
            const noteContent = document.createElement('div');
            noteContent.innerHTML = `
                <div class="note-timestamp">${formattedDate}</div>
                <div class="note-content">${note.content}</div>
                <div class="note-actions">
                    <button class="note-action-btn pin-note" title="${note.pinned ? 'Unpin note' : 'Pin note'}">
                        <i class="fas ${note.pinned ? 'fa-thumbtack fa-rotate-45' : 'fa-thumbtack'}"></i>
                    </button>
                    <button class="note-action-btn edit-note" title="Edit note">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="note-action-btn delete-note" title="Delete note">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            noteElement.appendChild(noteContent);
            
            // Add to the notes list
                notesList.appendChild(noteElement);
        });
        
        // Add event listeners for edit and delete buttons
        document.querySelectorAll('.edit-note').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const noteElement = e.target.closest('.note-item');
                const noteId = parseInt(noteElement.dataset.id);
                const note = getNotes().find(n => n.id === noteId);
                
                if (!note) return;
                
                // Store the original content for cancel action
                const originalContent = noteElement.querySelector('.note-content').innerHTML;
                
                // Create a temporary Quill editor for editing
                const editArea = document.createElement('div');
                editArea.className = 'note-edit';
                
                const editContainer = document.createElement('div');
                editContainer.id = `quill-edit-${noteId}`;
                editContainer.className = 'quill-edit-container';
                
                const buttonContainer = document.createElement('div');
                buttonContainer.className = 'note-edit-buttons';
                buttonContainer.innerHTML = `
                    <button class="note-cancel-btn">Cancel</button>
                    <button class="note-edit-btn">Save</button>
                `;
                
                editArea.appendChild(editContainer);
                editArea.appendChild(buttonContainer);
                
                // Replace content with edit area
                noteElement.querySelector('.note-content').replaceWith(editArea);
                noteElement.querySelector('.note-actions').style.display = 'none';
                
                // Declare editQuill variable here so it's accessible in listeners
                let editQuill = null;

                // Defer Quill initialization slightly to ensure DOM is ready
                setTimeout(() => {
                     // Initialize a Quill instance for editing
                    editQuill = new Quill(`#quill-edit-${noteId}`, {
                        theme: 'snow',
                        modules: {
                            toolbar: [
                                ['bold', 'italic', 'underline', 'strike'],
                                ['blockquote', 'code-block'],
                                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                ['link'],
                                ['clean']
                            ]
                        }
                    });
                    
                    // Set content from note
                    editQuill.clipboard.dangerouslyPasteHTML(note.content);
                    
                    // Focus the editor
                    editQuill.focus();

                    // Add event listeners for save and cancel INSIDE the timeout
                    // after editQuill is defined
                    noteElement.querySelector('.note-edit-btn').addEventListener('click', () => {
                        if (editQuill) { // Check if editor exists
                            const htmlContent = editQuill.root.innerHTML;
                            saveEditedNote(noteId, htmlContent);
                        }
                    });
                    
                    noteElement.querySelector('.note-cancel-btn').addEventListener('click', () => {
                        // Restore original content view
                        const contentDiv = document.createElement('div');
                        contentDiv.className = 'note-content';
                        contentDiv.innerHTML = originalContent;
                        editArea.replaceWith(contentDiv);
                        noteElement.querySelector('.note-actions').style.display = '';
                    });

                }, 0); // Timeout 0 defers execution slightly
                
            });
        });
        
        // Add pin button event listeners
        document.querySelectorAll('.pin-note').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const noteElement = e.target.closest('.note-item');
                const noteId = parseInt(noteElement.dataset.id);
                toggleNotePin(noteId);
                e.stopPropagation(); // Prevent event bubbling
            });
        });
        
        document.querySelectorAll('.delete-note').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const noteElement = e.target.closest('.note-item');
                const noteId = parseInt(noteElement.dataset.id);
                
                // Remove from DOM with animation
                noteElement.style.opacity = '0';
                noteElement.style.height = '0';
                noteElement.style.margin = '0';
                noteElement.style.padding = '0';
                noteElement.style.overflow = 'hidden';
                noteElement.style.transition = 'all 0.3s ease';
                
                // Delete from storage and refresh after animation
                setTimeout(() => {
                    deleteNote(noteId);
                }, 300);
                
                e.stopPropagation(); // Prevent event bubbling
            });
        });
        
        // Add direct note color functionality
        setupNoteColorListeners();
        
        // Add drag and drop functionality
        setupNoteDragDrop();
    }
    
    // Function to setup color listeners specifically for notes
    function setupNoteColorListeners() {
        console.log("Setting up note color listeners");
        const notes = document.querySelectorAll('.note-item');
        console.log(`Found ${notes.length} notes to setup color listeners for`);
        
        notes.forEach(note => {
            // Remove any existing listeners first to avoid duplicates
            const clonedNote = note.cloneNode(true);
            note.parentNode.replaceChild(clonedNote, note);
            
            // Add new event listener
            clonedNote.addEventListener('click', function(e) {
                const rect = this.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                
                // If click is within first 15px (the tab area)
                if (clickX <= 15) {
                    const itemId = this.dataset.id;
                    if (itemId) {
                        console.log(`Note tab clicked: ${itemId}`);
                        // Show color picker
                        showColorPicker(itemId, 'note', this);
                        e.stopPropagation(); // Prevent event bubbling
                    }
                }
            });
            
            // Re-add pin button listener
            const pinBtn = clonedNote.querySelector('.pin-note');
            if (pinBtn) {
                pinBtn.addEventListener('click', function(e) {
                    console.log("Pin button clicked");
                    const noteElement = e.target.closest('.note-item');
                    const noteId = parseInt(noteElement.dataset.id);
                    toggleNotePin(noteId);
                    e.stopPropagation(); // Prevent event bubbling
                });
            }
            
            // Re-add edit button listener
            const editBtn = clonedNote.querySelector('.edit-note');
            if (editBtn) {
                editBtn.addEventListener('click', function(e) {
                    e.stopPropagation(); // Prevent triggering color picker
                    const noteElement = this.closest('.note-item');
                    const noteId = parseInt(noteElement.dataset.id);
                    const note = getNotes().find(n => n.id === noteId);
                    
                    if (!note) return;
                    
                    // Store the original content for cancel action
                    const originalContent = note.content; // Get original from data
                    
                    // Create a temporary Quill editor for editing
                    const editArea = document.createElement('div');
                    editArea.className = 'note-edit';
                    
                    const editContainer = document.createElement('div');
                    editContainer.id = `quill-edit-${noteId}`;
                    editContainer.className = 'quill-edit-container';
                    
                    const buttonContainer = document.createElement('div');
                    buttonContainer.className = 'note-edit-buttons';
                    buttonContainer.innerHTML = `
                        <button class="note-cancel-btn">Cancel</button>
                        <button class="note-edit-btn">Save</button>
                    `;
                    
                    editArea.appendChild(editContainer);
                    editArea.appendChild(buttonContainer);
                    
                    // Find the current content display and replace it
                    const currentContentDiv = noteElement.querySelector('.note-content');
                    if (currentContentDiv) {
                         currentContentDiv.replaceWith(editArea);
                    } else {
                        // Fallback if .note-content isn't found directly (shouldn't happen)
                        const noteTimestamp = noteElement.querySelector('.note-timestamp');
                        if(noteTimestamp) noteTimestamp.insertAdjacentElement('afterend', editArea);
                    }
                   
                    noteElement.querySelector('.note-actions').style.display = 'none';

                    // Declare editQuill variable here so it's accessible in listeners
                    let editQuill = null;

                    // Defer Quill initialization slightly to ensure DOM is ready
                    setTimeout(() => {
                         // Initialize a Quill instance for editing
                        editQuill = new Quill(`#quill-edit-${noteId}`, {
                            theme: 'snow',
                            modules: {
                                toolbar: [
                                    ['bold', 'italic', 'underline', 'strike'],
                                    ['blockquote', 'code-block'],
                                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                    ['link'],
                                    ['clean']
                                ]
                            }
                        });
                        
                        // Set content from note
                        editQuill.clipboard.dangerouslyPasteHTML(note.content);
                        
                        // Focus the editor
                        editQuill.focus();

                        // Add event listeners for save and cancel INSIDE the timeout
                        // after editQuill is defined
                        noteElement.querySelector('.note-edit-btn').addEventListener('click', () => {
                            if (editQuill) { // Check if editor exists
                                const htmlContent = editQuill.root.innerHTML;
                                saveEditedNote(noteId, htmlContent);
                            }
                        });
                        
                        noteElement.querySelector('.note-cancel-btn').addEventListener('click', () => {
                            // Restore original content view
                            const contentDiv = document.createElement('div');
                            contentDiv.className = 'note-content';
                            contentDiv.innerHTML = originalContent;
                            editArea.replaceWith(contentDiv);
                            noteElement.querySelector('.note-actions').style.display = '';
                        });

                    }, 0); // Timeout 0 defers execution slightly
                    
                });
            }
            
            // Re-add delete button listener
            const deleteBtn = clonedNote.querySelector('.delete-note');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', function(e) {
                    const noteElement = e.target.closest('.note-item');
                    const noteId = parseInt(noteElement.dataset.id);
                    
                    // Remove from DOM with animation
                    noteElement.style.opacity = '0';
                    noteElement.style.height = '0';
                    noteElement.style.margin = '0';
                    noteElement.style.padding = '0';
                    noteElement.style.overflow = 'hidden';
                    noteElement.style.transition = 'all 0.3s ease';
                    
                    // Delete from storage and refresh after animation
                    setTimeout(() => {
                        deleteNote(noteId);
                    }, 300);
                    
                    e.stopPropagation(); // Prevent event bubbling
                });
            }
        });
    }
    
    // This function should be called whenever the DOM content is loaded or notes are refreshed
    document.addEventListener('DOMContentLoaded', function() {
        // Wait for notes to be loaded
        setTimeout(function() {
            setupNoteColorListeners();
        }, 500);
    });
    
    // Function to save edited note
    function saveEditedNote(noteId, newContent) {
        const notes = getNotes();
        const noteIndex = notes.findIndex(n => n.id === noteId);
        
        if (noteIndex === -1) return;
        
        notes[noteIndex].content = newContent;
        saveNotes(notes);
        loadNotes();
    }
    
    // Function to delete a note
    function deleteNote(noteId) {
        const notes = getNotes().filter(note => note.id !== noteId);
        saveNotes(notes);
        loadNotes();
    }
    
    // Helper function to get notes from local storage
    function getNotes() {
        const notesStr = localStorage.getItem('dashboard_notes');
        let notes = notesStr ? JSON.parse(notesStr) : [];
        
        // Ensure each note has the required properties
        notes = notes.map(note => {
            if (!note.hasOwnProperty('pinned')) {
                note.pinned = false;
            }
            if (!note.hasOwnProperty('order')) {
                note.order = 0;
            }
            return note;
        });
        
        // Sort notes: pinned first, then by order, then by most recent
        notes.sort((a, b) => {
            // Pinned notes go first
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            
            // If both pinned or both not pinned, sort by order
            if (a.order !== b.order) return a.order - b.order;
            
            // If order is the same, sort by timestamp (most recent first)
            return new Date(b.timestamp) - new Date(a.timestamp);
        });
        
        return notes;
    }
    
    // Helper function to save notes to local storage
    function saveNotes(notes) {
        localStorage.setItem('dashboard_notes', JSON.stringify(notes));
    }
    
    // Function to toggle the pinned status of a note
    function toggleNotePin(noteId) {
        const notes = getNotes();
        const noteIndex = notes.findIndex(n => n.id === noteId);
        
        if (noteIndex === -1) return;
        
        // Toggle pinned status
        notes[noteIndex].pinned = !notes[noteIndex].pinned;
        
        // Save and refresh
        saveNotes(notes);
        
        // Update the UI without full reload if possible
        const noteElement = document.querySelector(`.note-item[data-id="${noteId}"]`);
        if (noteElement) {
            if (notes[noteIndex].pinned) {
                noteElement.classList.add('pinned');
                // Copy border-left-color to border-top-color if custom color exists
                const leftBorderColor = noteElement.style.borderLeftColor;
                if (leftBorderColor) {
                    noteElement.style.borderTopColor = leftBorderColor;
                }
            } else {
                noteElement.classList.remove('pinned');
                noteElement.style.borderTopColor = '';
            }
            
            // Update the pin icon
            const pinButton = noteElement.querySelector('.pin-note i');
            if (pinButton) {
                if (notes[noteIndex].pinned) {
                    pinButton.className = 'fas fa-thumbtack fa-rotate-45';
                } else {
                    pinButton.className = 'fas fa-thumbtack';
                }
            }
            
            // Re-sort the notes list
            const notesList = document.getElementById('notes-list');
            const sortedNotes = getNotes(); // This gets the sorted list
            
            // Remove all notes
            const noteElements = [...notesList.querySelectorAll('.note-item')];
            noteElements.forEach(el => el.remove());
            
            // Re-add in correct order
            sortedNotes.forEach(note => {
                const el = noteElements.find(el => parseInt(el.dataset.id) === note.id);
                if (el) notesList.appendChild(el);
            });
        } else {
            // Fallback to full reload if note element not found
            loadNotes();
        }
        
        // Show toast notification
        const pinStatus = notes[noteIndex].pinned ? 'pinned' : 'unpinned';
        showToast(`Note ${pinStatus}`, 'info', 2000);
    }
    
    // Function to setup drag and drop functionality for notes
    function setupNoteDragDrop() {
        const noteItems = document.querySelectorAll('.note-item');
        const dragHandles = document.querySelectorAll('.note-drag-handle');
        let draggedItem = null;
        
        // Setup drag events for each note
        noteItems.forEach(note => {
            // Start drag only from the drag handle
            note.addEventListener('dragstart', (e) => {
                // Check if the drag started from the handle or close to the left edge
                const rect = note.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                
                // Only allow dragging from the handle area (left 15px)
                if (clickX > 15) {
                    e.preventDefault();
                    return false;
                }
                
                draggedItem = note;
                
                // Make it half transparent and add dragging style
                setTimeout(() => {
                    note.classList.add('dragging');
                }, 0);
                
                // Set the drag data (required for Firefox)
                e.dataTransfer.setData('text/plain', note.dataset.id);
                e.dataTransfer.effectAllowed = 'move';
            });
            
            note.addEventListener('dragend', () => {
                // Remove the dragging class
                if (draggedItem) {
                    draggedItem.classList.remove('dragging');
                    draggedItem = null;
                }
            });
            
            // Handle dropping notes
            note.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                
                // Get the closest note to drop before or after
                const afterElement = getDragAfterElement(notesList, e.clientY);
                
                if (afterElement == null) {
                    notesList.appendChild(draggedItem);
                } else {
                    notesList.insertBefore(draggedItem, afterElement);
                }
            });
            
            note.addEventListener('drop', (e) => {
                e.preventDefault();
                // The dragover event already handled the visual reordering
                
                // Now we need to update the order in our data model
                updateNotesOrder();
            });
        });
        
        // Add listeners to the note container for when dragging outside notes
        notesList.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            // If we're not over a note item, append to the end
            const afterElement = getDragAfterElement(notesList, e.clientY);
            if (afterElement == null && draggedItem) {
                notesList.appendChild(draggedItem);
            }
        });
        
        notesList.addEventListener('drop', (e) => {
            e.preventDefault();
            // Update the order in our data model
            updateNotesOrder();
        });
        
        // Helper function to determine where to drop the dragged item
        function getDragAfterElement(container, y) {
            // Get all notes that aren't currently being dragged
            const draggableElements = [...container.querySelectorAll('.note-item:not(.dragging)')];
            
            // Find the element whose middle is closest to the mouse position
            return draggableElements.reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;
                
                // If we're above the middle of an element and closer than the previous closest
                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                } else {
                    return closest;
                }
            }, { offset: Number.NEGATIVE_INFINITY }).element;
        }
        
        // Function to update the order of notes in storage
        function updateNotesOrder() {
            const notes = getNotes();
            const noteItems = notesList.querySelectorAll('.note-item');
            const newOrderMap = {};
            
            // Create a map of note IDs to their new order
            noteItems.forEach((item, index) => {
                const noteId = parseInt(item.dataset.id);
                newOrderMap[noteId] = index;
            });
            
            // Update the order property of each note
            notes.forEach(note => {
                if (newOrderMap.hasOwnProperty(note.id)) {
                    note.order = newOrderMap[note.id];
                }
            });
            
            // Save the updated notes
            saveNotes(notes);
        }
    }
}

// Set up clock functionality with timezone support
function setupClock() {
    const clockElement = document.getElementById('clock');
    
    function updateClock() {
        try {
            // Use system timezone instead of configured timezone
            const now = DateTime.now();
            let formatted;
            
            if (CONFIG.SHOW_DATE) {
                // Format with date
                const timeFormat = CONFIG.CLOCK_24H ? 'HH:mm' : 'h:mm a';
                formatted = now.toFormat(`ccc, dd LLL yyyy ${timeFormat}`);
            } else {
                // Format with time only
                const timeFormat = CONFIG.CLOCK_24H ? 'HH:mm' : 'h:mm a';
                formatted = now.toFormat(timeFormat);
            }
            
            clockElement.textContent = formatted;
        } catch (error) {
            // Fallback if there's an error
            console.error('Error updating clock:', error);
            const now = new Date();
            let hours = now.getHours();
            const minutes = String(now.getMinutes()).padStart(2, '0');
            let timeStr = '';
            
            // Format the time based on the clock format preference
            if (CONFIG.CLOCK_24H) {
                // 24-hour format
                hours = String(hours).padStart(2, '0');
                timeStr = `${hours}:${minutes}`;
            } else {
                // 12-hour format
                const period = hours >= 12 ? 'PM' : 'AM';
                hours = hours % 12 || 12; // Convert to 12-hour format
                timeStr = `${hours}:${minutes} ${period}`;
            }
            
            if (CONFIG.SHOW_DATE) {
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const day = days[now.getDay()];
                const date = String(now.getDate()).padStart(2, '0');
                const month = months[now.getMonth()];
                const year = now.getFullYear();
                clockElement.textContent = `${day}, ${date} ${month} ${year} ${timeStr}`;
            } else {
                clockElement.textContent = timeStr;
            }
        }
    }

    // Store updateClock function globally so it can be called from elsewhere
    window.updateClockFn = updateClock;

    updateClock();
    
    // Update every minute since we don't show seconds
    // Clear any existing intervals to prevent multiple updates
    if (window.clockInterval) {
        clearInterval(window.clockInterval);
    }
    window.clockInterval = setInterval(updateClock, 60000);
}

// Set up weather functionality
function setupWeather() {
    const weatherContainer = document.getElementById('weather');
    
    // Show a weather error with a friendly message
    function showWeatherError(message) {
        weatherContainer.innerHTML = `<div style="color: #e53935;">${message}</div>`;
    }
    
    // Try to get user's location
    function getLocation() {
        weatherContainer.innerHTML = '<div id="weather-loading">Loading weather...</div>';
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
                },
                error => {
                    console.log('Geolocation error:', error);
                    fetchWeatherByCity(CONFIG.WEATHER_LOCATION);
                },
                { timeout: 10000 } // 10 second timeout
            );
        } else {
            fetchWeatherByCity(CONFIG.WEATHER_LOCATION);
        }
    }
    
    // Fetch weather by coordinates
    function fetchWeatherByCoords(lat, lon) {
        const lastWeatherUpdate = localStorage.getItem('last_weather_update');
        const cachedWeather = localStorage.getItem('cached_weather');
        
        // Check if we have cached weather data less than 10 minutes old
        if (lastWeatherUpdate && cachedWeather) {
            const updateTime = parseInt(lastWeatherUpdate);
            const currentTime = Date.now();
            
            // If cache is less than 10 minutes old (600000 ms)
            if (currentTime - updateTime < 600000) {
                try {
                    displayWeather(JSON.parse(cachedWeather));
                    return;
                } catch (error) {
                    console.error('Error parsing cached weather:', error);
                    // Continue with fetching fresh data
                }
            }
        }
        
        if (!CONFIG.WEATHER_API_KEY) {
            showWeatherError('API key missing. Set in ⚙️ settings.');
            return;
        }
        
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${CONFIG.WEATHER_API_KEY}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                displayWeather(data);
                
                // Cache the weather data
                localStorage.setItem('cached_weather', JSON.stringify(data));
                localStorage.setItem('last_weather_update', Date.now().toString());
            })
            .catch(error => {
                console.error('Error fetching weather:', error);
                
                // If there's cached data, use it even if it's old
                if (cachedWeather) {
                    try {
                        displayWeather(JSON.parse(cachedWeather));
                        weatherContainer.innerHTML += `<div style="font-size: 0.7rem; color: #e53935;">Using cached data (Failed to update)</div>`;
                    } catch (parseError) {
                        showWeatherError('Weather unavailable');
                    }
                } else {
                    showWeatherError('Weather unavailable');
                }
            });
    }
    
    // Fetch weather by city name
    function fetchWeatherByCity(city) {
        const lastWeatherUpdate = localStorage.getItem('last_weather_update');
        const cachedWeather = localStorage.getItem('cached_weather');
        
        // Check if we have cached weather data less than 10 minutes old
        if (lastWeatherUpdate && cachedWeather) {
            const updateTime = parseInt(lastWeatherUpdate);
            const currentTime = Date.now();
            
            // If cache is less than 10 minutes old (600000 ms)
            if (currentTime - updateTime < 600000) {
                try {
                    displayWeather(JSON.parse(cachedWeather));
                    return;
                } catch (error) {
                    console.error('Error parsing cached weather:', error);
                    // Continue with fetching fresh data
                }
            }
        }
        
        if (!CONFIG.WEATHER_API_KEY) {
            showWeatherError('API key missing. Set in ⚙️ settings.');
            return;
        }
        
        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${CONFIG.WEATHER_API_KEY}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                displayWeather(data);
                
                // Cache the weather data
                localStorage.setItem('cached_weather', JSON.stringify(data));
                localStorage.setItem('last_weather_update', Date.now().toString());
            })
            .catch(error => {
                console.error('Error fetching weather:', error);
                
                // If there's cached data, use it even if it's old
                if (cachedWeather) {
                    try {
                        displayWeather(JSON.parse(cachedWeather));
                        weatherContainer.innerHTML += `<div style="font-size: 0.7rem; color: #e53935;">Using cached data (Failed to update)</div>`;
                    } catch (parseError) {
                        showWeatherError('Weather unavailable');
                    }
                } else {
                    showWeatherError('Weather unavailable');
                }
            });
    }
    
    // Display weather data
    function displayWeather(data) {
        if (!data || data.cod === '404') {
            showWeatherError('Location not found');
            return;
        }
        
        try {
            const temp = Math.round(data.main.temp);
            const description = data.weather[0].description;
            const iconCode = data.weather[0].icon;
            const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
            
            weatherContainer.innerHTML = `
                <img class="weather-icon" src="${iconUrl}" alt="${description}">
                <div class="weather-details">
                    <div class="weather-temp">${temp}°C</div>
                    <div class="weather-desc">${description}</div>
                </div>
            `;
        } catch (error) {
            console.error('Error displaying weather:', error);
            showWeatherError('Weather data error');
        }
    }
    
    // Start by getting location
    getLocation();
    
    // Refresh weather every 30 minutes
    weatherRefreshInterval = setInterval(getLocation, 1800000);
}

// Set up automatic refresh
function setupAutoRefresh() {
    // Clear any existing interval
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    
    // Set up automatic refresh every 5 minutes
    refreshInterval = setInterval(() => {
        if (calendarAuthorized) {
            listCalendarEvents();
        }
        if (tasksAuthorized) {
            listTasks();
        }
    }, 300000); // 5 minutes
}

// List Calendar events
function listCalendarEvents() {
    const calendarContent = document.getElementById('calendar-content');
    const statusIndicator = document.getElementById('calendar-status');
    const headerSection = document.querySelector('#calendar-section .section-header');
    
    // Add 'Show Hidden' button if it doesn't exist
    if (!document.getElementById('show-hidden-events') && getHiddenItems().event.length > 0) {
        const showHiddenBtn = document.createElement('button');
        showHiddenBtn.className = 'show-hidden-btn';
        showHiddenBtn.id = 'show-hidden-events';
        showHiddenBtn.innerHTML = '<i class="fas fa-eye"></i>';
        showHiddenBtn.title = 'Show hidden events';
        showHiddenBtn.addEventListener('click', () => {
            clearHiddenItemsByType('event');
        });
        
        // Fix: Get the section-controls div instead of the header section
        const sectionControls = headerSection.querySelector('.section-controls');
        // Insert at the beginning of section-controls (before any other buttons)
        sectionControls.insertBefore(showHiddenBtn, sectionControls.firstChild);
    }
    
    // Show loading state
    statusIndicator.innerHTML = 'Loading events... <div class="loader"></div>';
    
    // Get events from today in the system timezone instead of user's configured timezone
    let today = DateTime.now().startOf('day');
    
    // Get events up to specified number of days from now
    let nextWeek = today.plus({ days: CONFIG.CALENDAR_DAYS });
    
    try {
        gapi.client.calendar.events.list({
            'calendarId': 'primary',
            'timeMin': today.toISO(),
            'timeMax': nextWeek.toISO(),
            'singleEvents': true,
            'orderBy': 'startTime'
        }).then(response => {
            // Store the response for later use
            window.lastCalendarResponse = response;
            
            const events = response.result.items;
            displayCalendarEvents(events);
            statusIndicator.textContent = `Last updated: ${DateTime.now().toLocaleString(DateTime.TIME_SIMPLE)}`;
        }).catch(error => {
            console.error('Error fetching calendar events:', error);
            statusIndicator.textContent = 'Error loading events. Try refreshing.';
            
            if (error.status === 401) {
                // Token expired, try to refresh
                handleCalendarAuthClick();
            } else {
                showError('calendar-section', 'Calendar Error', 'Failed to load calendar events. Please try again later.');
            }
        });
    } catch (error) {
        console.error('Error listing calendar events:', error);
        showError('calendar-section', 'Calendar Error', 'An unexpected error occurred. Please try again later.');
    }
}

// Display calendar events
function displayCalendarEvents(events) {
    const calendarContent = document.getElementById('calendar-content');
    
    if (!events || events.length === 0) {
        calendarContent.innerHTML = '<div style="text-align: center; padding: 20px;">No upcoming events found.</div>';
        return;
    }
    
    try {
        // Get hidden items
        const hiddenItems = getHiddenItems();
        
        // Get saved item colors
        const itemColors = getItemColors();
        
        // Group events by day
        const eventsByDay = {};
        
        // Use system timezone instead of configured timezone
        const today = DateTime.now().startOf('day');
        const tomorrow = today.plus({ days: 1 });
        
        events.forEach(event => {
            // Skip hidden events
            if (hiddenItems.event.includes(event.id)) {
                return;
            }
            
            // Parse event start time (with system timezone)
            let start;
            if (event.start.dateTime) {
                start = DateTime.fromISO(event.start.dateTime);
            } else {
                start = DateTime.fromISO(event.start.date);
            }
            
            // Set the event's day label
            let day;
            
            if (start < tomorrow && start >= today) {
                day = 'Today';
            } else if (start < tomorrow.plus({ days: 1 }) && start >= tomorrow) {
                day = 'Tomorrow';
            } else {
                day = start.toLocaleString({ weekday: 'long', month: 'short', day: 'numeric' });
            }
            
            if (!eventsByDay[day]) {
                eventsByDay[day] = [];
            }
            
            eventsByDay[day].push(event);
        });
        
        // Build HTML
        let html = '';
        
        Object.keys(eventsByDay).forEach(day => {
            html += `<div class="time-label">${day}</div>`;
            
            eventsByDay[day].forEach(event => {
                let start, end;
                if (event.start.dateTime) {
                    // Use system timezone instead of configured timezone
                    start = DateTime.fromISO(event.start.dateTime);
                } else {
                    start = DateTime.fromISO(event.start.date);
                }
                
                if (event.end && event.end.dateTime) {
                    // Use system timezone instead of configured timezone
                    end = DateTime.fromISO(event.end.dateTime);
                }
                
                let timeStr;
                if (event.start.dateTime) {
                    timeStr = start.toLocaleString(DateTime.TIME_SIMPLE);
                    if (end) {
                        timeStr += ` - ${end.toLocaleString(DateTime.TIME_SIMPLE)}`;
                    }
                } else {
                    timeStr = 'All day';
                }
                
                // Get the saved color for this event or use default
                const tabColor = itemColors.event[event.id] || '';
                const tabStyle = tabColor ? `style="border-left-color: ${tabColor};"` : '';
                
                html += `
                    <div class="event-item" data-id="${event.id}" data-type="event" ${tabStyle}>
                        <div class="event-title">${event.summary || 'Untitled Event'}</div>
                        <div class="event-time">${timeStr}</div>
                        ${event.location ? `<div class="event-location">📍 ${event.location}</div>` : ''}
                        <button class="hide-item-btn" title="Hide this event"><i class="fas fa-eye-slash"></i></button>
                    </div>
                `;
            });
        });
        
        calendarContent.innerHTML = html;
        
        // Add event listeners to hide buttons
        addHideButtonListeners();
        
        // Add event listeners to tab colors
        addTabColorListeners();
    } catch (error) {
        console.error('Error displaying calendar events:', error);
        showError('calendar-section', 'Calendar Display Error', 'Failed to display calendar events due to an error.');
    }
}

// List Tasks
function listTasks() {
    const tasksContent = document.getElementById('tasks-content');
    const statusIndicator = document.getElementById('tasks-status');
    const headerSection = document.querySelector('#tasks-section .section-header');
    
    // Add 'Show Hidden' button if it doesn't exist
    if (!document.getElementById('show-hidden-tasks') && getHiddenItems().task.length > 0) {
        const showHiddenBtn = document.createElement('button');
        showHiddenBtn.className = 'show-hidden-btn';
        showHiddenBtn.id = 'show-hidden-tasks';
        showHiddenBtn.innerHTML = '<i class="fas fa-eye"></i>';
        showHiddenBtn.title = 'Show hidden tasks';
        showHiddenBtn.addEventListener('click', () => {
            clearHiddenItemsByType('task');
        });
        
        // Fix: Get the section-controls div instead of the header section
        const sectionControls = headerSection.querySelector('.section-controls');
        // Insert at the beginning of section-controls (before the refresh button)
        sectionControls.insertBefore(showHiddenBtn, sectionControls.firstChild);
    }
    
    // Show loading state
    statusIndicator.innerHTML = 'Loading tasks... <div class="loader"></div>';
    
    // Check if we are properly authenticated
    if (!gapi.client.getToken()) {
        console.error("No authentication token available");
        statusIndicator.textContent = 'Authentication required';
        showToast("Please sign in to view tasks", "error");
        return;
    }
    
    try {
        // Get the default task list
        gapi.client.tasks.tasklists.list({
            'maxResults': 10
        }).then(response => {
            if (!response.result.items || response.result.items.length === 0) {
                console.log('No task lists found, creating a default task list');
                return gapi.client.tasks.tasklists.insert({
                    resource: {
                        title: 'My Tasks'
                    }
                }).then(newListResponse => {
                    console.log('Created new task list:', newListResponse.result);
                    return { result: { items: [newListResponse.result] } };
                });
            }
            return response;
        }).then(response => {
            const taskList = response.result.items[0];
            console.log('Using task list:', taskList.id, taskList.title);
            
            // Store task list ID globally for later use
            window.currentTaskListId = taskList.id;
            
            return gapi.client.tasks.tasks.list({
                'tasklist': taskList.id
            });
        }).then(response => {
            // Store the response for later use
            window.lastTasksResponse = response;
            
            const tasks = response.result.items || [];
            console.log(`Retrieved ${tasks.length} tasks from list`);
            
            displayTasks(tasks);
            
            // Use system timezone instead of configured timezone
            const updatedTime = DateTime.now().toLocaleString(DateTime.TIME_SIMPLE);
            statusIndicator.textContent = `Last updated: ${updatedTime}`;
        }).catch(error => {
            console.error('Error fetching tasks:', error);
            console.log('Error details:', JSON.stringify(error, null, 2));
            statusIndicator.textContent = 'Error loading tasks. Try refreshing.';
            
            if (error.status === 401) {
                // Token expired, try to refresh
                handleTasksAuthClick();
                showToast('Authentication expired. Reconnecting...', 'warning');
            } else {
                const errorMessage = error.result?.error?.message || 'Failed to load tasks. Please try again later.';
                showError('tasks-section', 'Tasks Error', errorMessage);
                showToast('Failed to load tasks. Check console for details.', 'error');
            }
        });
    } catch (error) {
        console.error('Error listing tasks:', error);
        showError('tasks-section', 'Tasks Error', 'An unexpected error occurred. Please try again later.');
    }
}

// Display tasks
function displayTasks(tasks) {
    const tasksContent = document.getElementById('tasks-content');
    const statusIndicator = document.getElementById('tasks-status');
    
    if (!tasks || tasks.length === 0) {
        tasksContent.innerHTML = '<div style="text-align: center; padding: 20px;">No tasks found.</div>';
        // Add task input even if no tasks
        addTaskInputElement(tasksContent);
        
        // Make sure status indicator is visible
        // Use system timezone instead of configured timezone
        const updatedTime = DateTime.now().toLocaleString(DateTime.TIME_SIMPLE);
        statusIndicator.textContent = `Last updated: ${updatedTime}`;
        return;
    }
    
    try {
        // Get hidden items
        const hiddenItems = getHiddenItems();
        
        // Get saved item colors
        const itemColors = getItemColors();
        
        // Sort tasks: incomplete first, then by due date
        tasks.sort((a, b) => {
            if ((a.status === 'completed') !== (b.status === 'completed')) {
                return a.status === 'completed' ? 1 : -1;
            }
            
            if (!a.due && !b.due) return 0;
            if (!a.due) return 1;
            if (!b.due) return -1;
            
            return new Date(a.due) - new Date(b.due);
        });
        
        // Filter out completed tasks (they should not be displayed)
        const displayTasks = tasks.filter(task => task.status !== 'completed');
        
        // Setup timezone for due dates - use system timezone instead of configured timezone
        const today = DateTime.now().startOf('day');
        const tomorrow = today.plus({ days: 1 });
        
        // Make sure we have a task list ID
        if (!window.currentTaskListId && window.lastTasksResponse?.result?.items) {
            const firstTask = window.lastTasksResponse.result.items[0];
            if (firstTask?.selfLink) {
                // Extract task list ID from the selfLink URL
                const match = firstTask.selfLink.match(/lists\/([^\/]+)\/tasks/);
                if (match && match[1]) {
                    window.currentTaskListId = match[1];
                    console.log('Recovered task list ID from task self link:', window.currentTaskListId);
                }
            }
        }
        
        // Build HTML
        let html = '';
        
        displayTasks.forEach(task => {
            // Skip hidden tasks
            if (hiddenItems.task.includes(task.id)) {
                return;
            }
            
            const isCompleted = task.status === 'completed';
            let dueDate = null;
            
            if (task.due) {
                // Use system timezone instead of configured timezone
                dueDate = DateTime.fromISO(task.due);
            }
            
            let dueStr = '';
            if (dueDate) {
                if (dueDate < today) {
                    dueStr = `Overdue: ${dueDate.toLocaleString({ month: 'short', day: 'numeric' })}`;
                } else if (dueDate < tomorrow) {
                    dueStr = 'Due: Today';
                } else if (dueDate < tomorrow.plus({ days: 1 })) {
                    dueStr = 'Due: Tomorrow';
                } else {
                    dueStr = `Due: ${dueDate.toLocaleString({ month: 'short', day: 'numeric' })}`;
                }
            }
            
            // Get the saved color for this task or use default
            const tabColor = itemColors.task[task.id] || '';
            const tabStyle = tabColor ? `style="border-left-color: ${tabColor};"` : '';
            
            html += `
                <div class="task-item ${isCompleted ? 'completed' : ''}" data-id="${task.id}" data-type="task" data-title="${escapeHtml(task.title)}" ${tabStyle}>
                    <input type="checkbox" class="task-checkbox" ${isCompleted ? 'checked' : ''}>
                    <div class="task-text">
                        <div class="task-title">${task.title || 'Untitled Task'}</div>
                        ${dueStr ? `<div class="task-due">${dueStr}</div>` : ''}
                    </div>
                    <button class="undo-btn" style="display: none;"><i class="fas fa-undo"></i></button>
                    <button class="delete-task-btn" title="Delete this task"><i class="fas fa-times"></i></button>
                    <button class="hide-item-btn" title="Hide this task"><i class="fas fa-eye-slash"></i></button>
                </div>
            `;
        });
        
        tasksContent.innerHTML = html;
        
        // Add task input field
        addTaskInputElement(tasksContent);
        
        // Add event listeners to hide buttons
        addHideButtonListeners();
        
        // Add event listeners to tab colors
        addTabColorListeners();
        
        // Add event listeners for task checkboxes and delete buttons
        addTaskActionListeners();
    } catch (error) {
        console.error('Error displaying tasks:', error);
        showError('tasks-section', 'Tasks Display Error', 'Failed to display tasks due to an error.');
    }
}

// Helper function to escape HTML special characters
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add task input field to tasks section
function addTaskInputElement(tasksContent) {
    const taskInputContainer = document.createElement('div');
    taskInputContainer.className = 'task-input-container';
    
    taskInputContainer.innerHTML = `
        <input type="text" id="new-task-input" placeholder="Add a task...">
        <button id="add-task-btn" title="Add task"><i class="fas fa-plus"></i></button>
    `;
    
    // Append at the end but make it sticky with CSS
    tasksContent.appendChild(taskInputContainer);
    
    // Add event listener to input field
    const taskInput = document.getElementById('new-task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    
    taskInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            addNewTask();
        }
    });
    
    addTaskBtn.addEventListener('click', addNewTask);
}

// Add new task to Google Tasks
function addNewTask() {
    const taskInput = document.getElementById('new-task-input');
    const taskTitle = taskInput.value.trim();
    
    if (!taskTitle) return;
    
    // Get the task list ID
    const taskListId = window.currentTaskListId;
    if (!taskListId) {
        console.error('No task list ID available for adding new task');
        showToast('Error: Task list not found. Please reload the page.', 'error');
        
        // Try to get task list ID again
        listTasks();
        return;
    }
    
    // Show loading state
    taskInput.disabled = true;
    const addTaskBtn = document.getElementById('add-task-btn');
    addTaskBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    console.log(`Adding new task "${taskTitle}" to list ${taskListId}`);
    
    // Check if we are properly authenticated
    if (!gapi.client.getToken()) {
        console.error("No authentication token available");
        taskInput.disabled = false;
        addTaskBtn.innerHTML = '<i class="fas fa-plus"></i>';
        showToast("Please sign in to add tasks", "error");
        handleTasksAuthClick();
        return;
    }
    
    // Create the task with detailed error logging
    try {
        gapi.client.tasks.tasks.insert({
            tasklist: taskListId,
            resource: {
                title: taskTitle,
                status: 'needsAction'
            }
        }).then(response => {
            console.log('Task added successfully:', response.result);
            
            // Clear input field
            taskInput.value = '';
            taskInput.disabled = false;
            addTaskBtn.innerHTML = '<i class="fas fa-plus"></i>';
            
            // Refresh tasks list
            listTasks();
            
            // Show success message
            showToast('Task added successfully', 'success');
        }).catch(error => {
            console.error('Error adding task:', error);
            console.log('Error details:', JSON.stringify(error, null, 2));
            
            // Reset UI
            taskInput.disabled = false;
            addTaskBtn.innerHTML = '<i class="fas fa-plus"></i>';
            
            // Check if token expired
            if (error.status === 401) {
                showToast('Authentication expired. Reconnecting...', 'warning');
                // Try to refresh token
                handleTasksAuthClick();
            } else {
                // Show error message with details
                const errorMessage = error.result?.error?.message || 'Error adding task. Please try again.';
                showToast(errorMessage, 'error');
            }
        });
    } catch (error) {
        console.error('Exception in addNewTask:', error);
        taskInput.disabled = false;
        addTaskBtn.innerHTML = '<i class="fas fa-plus"></i>';
        showToast('Error adding task: ' + error.message, 'error');
    }
}

// Add event listeners for task checkboxes and delete buttons
function addTaskActionListeners() {
    // Add event listeners for checkboxes
    document.querySelectorAll('.task-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function(e) {
            e.stopPropagation();
            const taskItem = this.closest('.task-item');
            if (!taskItem) return; // Safety check if element not found
            
            const taskId = taskItem.dataset.id;
            const isCompleted = this.checked;
            
            // Update UI immediately
            if (isCompleted) {
                taskItem.classList.add('pending-completion');
                const titleEl = taskItem.querySelector('.task-title');
                if (titleEl) titleEl.style.textDecoration = 'line-through';
            } else {
                taskItem.classList.remove('pending-completion');
                const titleEl = taskItem.querySelector('.task-title'); 
                if (titleEl) titleEl.style.textDecoration = 'none';
            }
            
            // Show undo button
            const undoBtn = taskItem.querySelector('.undo-btn');
            if (undoBtn) undoBtn.style.display = 'block';
            
            // Hide delete button when undo is shown
            const deleteBtn = taskItem.querySelector('.delete-task-btn');
            if (deleteBtn) deleteBtn.style.display = 'none';
            
            // Clear existing timer if any
            if (taskItem.dataset.timerId) {
                clearTimeout(parseInt(taskItem.dataset.timerId));
            }
            
            // Set timer for API update
            const timerId = setTimeout(() => {
                if (!document.body.contains(taskItem)) return; // Check if element still exists
                
                updateTaskStatus(taskId, isCompleted);
                
                // Remove task from view if completed - do it immediately now
                if (isCompleted) {
                    taskItem.remove();
                }
            }, 10000); // 10 second delay
            
            // Store timer ID in the task item
            taskItem.dataset.timerId = timerId;
            
            // Show toast message
            const actionText = isCompleted ? 'completed' : 'uncompleted';
            showToast(`Task will be marked as ${actionText} in 10 seconds. Click undo to cancel.`, 'info', 10000);
        });
    });
    
    // Add event listeners for delete buttons
    document.querySelectorAll('.delete-task-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const taskItem = this.closest('.task-item');
            if (!taskItem) return; // Safety check if element not found
            
            const taskId = taskItem.dataset.id;
            const taskTitle = taskItem.dataset.title || 'this task';
            
            // Update UI immediately
            taskItem.classList.add('pending-deletion');
            
            // Show undo button
            const undoBtn = taskItem.querySelector('.undo-btn');
            if (undoBtn) undoBtn.style.display = 'block';
            
            // Hide delete button when undo is shown
            this.style.display = 'none';
            
            // Clear existing timer if any
            if (taskItem.dataset.timerId) {
                clearTimeout(parseInt(taskItem.dataset.timerId));
            }
            
            // Set timer for API update
            const timerId = setTimeout(() => {
                if (!document.body.contains(taskItem)) return; // Check if element still exists
                
                deleteTask(taskId);
                // Remove task from view
                taskItem.style.height = '0';
                taskItem.style.opacity = '0';
                taskItem.style.margin = '0';
                taskItem.style.padding = '0';
                taskItem.style.overflow = 'hidden';
                
                setTimeout(() => {
                    if (document.body.contains(taskItem)) {
                        taskItem.remove();
                    }
                }, 300);
            }, 10000); // 10 second delay
            
            // Store timer ID in the task item
            taskItem.dataset.timerId = timerId;
            
            // Show toast message
            showToast(`"${taskTitle}" will be deleted in 10 seconds. Click undo to cancel.`, 'info', 10000);
        });
    });
    
    // Add event listeners for undo buttons
    document.querySelectorAll('.undo-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const taskItem = this.closest('.task-item');
            if (!taskItem) return; // Safety check if element not found
            
            const taskId = taskItem.dataset.id;
            const timerId = taskItem.dataset.timerId;
            
            // Clear the timeout
            if (timerId) {
                clearTimeout(parseInt(timerId));
                taskItem.removeAttribute('data-timer-id');
            }
            
            // Reset UI
            taskItem.classList.remove('pending-completion', 'pending-deletion');
            const checkbox = taskItem.querySelector('.task-checkbox');
            const titleEl = taskItem.querySelector('.task-title');
            
            if (taskItem.classList.contains('completed') && checkbox && titleEl) {
                checkbox.checked = true;
                titleEl.style.textDecoration = 'line-through';
            } else if (checkbox && titleEl) {
                checkbox.checked = false;
                titleEl.style.textDecoration = 'none';
            }
            
            // Hide undo button and show delete button again
            this.style.display = 'none';
            const deleteBtn = taskItem.querySelector('.delete-task-btn');
            if (deleteBtn) deleteBtn.style.display = '';
            
            // Show toast message
            showToast('Action cancelled', 'success');
        });
    });
}

// Update task status in Google Tasks API
function updateTaskStatus(taskId, isCompleted) {
    const taskListId = window.currentTaskListId;
    if (!taskListId) {
        console.error('Task list ID not found');
        showToast('Error: Task list not found. Please reload the page.', 'error');
        return;
    }
    
    console.log(`Updating task ${taskId} in list ${taskListId} to ${isCompleted ? 'completed' : 'needsAction'}`);
    
    try {
        // First get the current task to preserve other fields
        gapi.client.tasks.tasks.get({
            tasklist: taskListId,
            task: taskId
        }).then(response => {
            const task = response.result;
            
            // Update status
            task.status = isCompleted ? 'completed' : 'needsAction';
            
            // If marking as not completed, also clear completed date
            if (!isCompleted) {
                task.completed = null;
            }
            
            // Update the task
            return gapi.client.tasks.tasks.update({
                tasklist: taskListId,
                task: taskId,
                resource: task
            });
        }).then(response => {
            console.log('Task status updated successfully', response);
            showToast('Task updated successfully', 'success');
        }).catch(error => {
            console.error('Error updating task status:', error);
            
            // Check if token expired
            if (error.status === 401) {
                showToast('Authentication expired. Reconnecting...', 'warning');
                // Try to refresh token
                handleTasksAuthClick();
            } else {
                showToast('Error updating task. Please try again.', 'error');
                
                // Refresh the task list to ensure UI is in sync with server
                setTimeout(() => {
                    listTasks();
                }, 1000);
            }
        });
    } catch (error) {
        console.error('Unexpected error updating task status:', error);
        showToast('An unexpected error occurred. Please try again.', 'error');
        
        // Refresh the task list to ensure UI is in sync with server
        setTimeout(() => {
            listTasks();
        }, 1000);
    }
}

// Delete task from Google Tasks API
function deleteTask(taskId) {
    const taskListId = window.currentTaskListId;
    if (!taskListId) {
        console.error('Task list ID not found');
        showToast('Error: Task list not found. Please reload the page.', 'error');
        return;
    }
    
    console.log(`Deleting task ${taskId} from list ${taskListId}`);
    
    try {
        gapi.client.tasks.tasks.delete({
            tasklist: taskListId,
            task: taskId
        }).then(response => {
            console.log('Task deleted successfully', response);
            showToast('Task deleted successfully', 'success');
        }).catch(error => {
            console.error('Error deleting task:', error);
            
            // Check if token expired
            if (error.status === 401) {
                showToast('Authentication expired. Reconnecting...', 'warning');
                // Try to refresh token
                handleTasksAuthClick();
            } else {
                showToast('Error deleting task. Please try again.', 'error');
                
                // Refresh the task list to ensure UI is in sync with server
                setTimeout(() => {
                    listTasks();
                }, 1000);
            }
        });
    } catch (error) {
        console.error('Unexpected error deleting task:', error);
        showToast('An unexpected error occurred. Please try again.', 'error');
        
        // Refresh the task list to ensure UI is in sync with server
        setTimeout(() => {
            listTasks();
        }, 1000);
    }
}

// Save item colors to localStorage
function saveItemColors(itemColors) {
    localStorage.setItem('dashboard_item_colors', JSON.stringify(itemColors));
}

// Add event listeners to tab color elements
function addTabColorListeners() {
    // Events and tasks (they now have the data-type attribute directly on the item)
    document.querySelectorAll('.event-item, .task-item').forEach(item => {
        item.addEventListener('click', function(e) {
            // Only trigger color picker if clicking on the left edge of the item (the tab)
            const rect = this.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            
            // If click is within first 15px (the tab area)
            if (clickX <= 15) {
                const itemId = this.dataset.id;
                const itemType = this.dataset.type;
                
                // Show color picker
                showColorPicker(itemId, itemType, this);
                e.stopPropagation(); // Prevent event bubbling
            }
        });
    });
}

// Show color picker menu
function showColorPicker(itemId, itemType, targetElement) {
    console.log(`Opening color picker for ${itemType} with id ${itemId}`);
    
    // Remove any existing color pickers
    const existingPicker = document.getElementById('color-picker-menu');
    if (existingPicker) {
        existingPicker.remove();
    }
    
    // Define preset colors
    const presetColors = [
        '#FF5252', // Red
        '#FF7043', // Deep Orange
        '#FFCA28', // Amber
        '#66BB6A', // Green
        '#26A69A', // Teal
        '#42A5F5', // Blue
        '#5C6BC0', // Indigo
        '#AB47BC', // Purple
        '#EC407A', // Pink
        '#78909C'  // Blue Grey
    ];
    
    // Get current color
    let currentColor = '';
    
    try {
        const itemColors = getItemColors();
        if (itemColors && itemColors[itemType] && itemId) {
            currentColor = itemColors[itemType][itemId] || '';
        }
    } catch (e) {
        console.error('Error getting current color:', e);
    }
    
    // Create color picker menu
    const pickerMenu = document.createElement('div');
    pickerMenu.id = 'color-picker-menu';
    pickerMenu.className = 'color-picker-menu';
    
    // Create preset colors
    let presetsHtml = '<div class="preset-colors">';
    presetColors.forEach(color => {
        const isSelected = color === currentColor ? 'selected' : '';
        presetsHtml += `<div class="color-preset ${isSelected}" style="background-color: ${color};" data-color="${color}"></div>`;
    });
    presetsHtml += '</div>';
    
    // Create custom color picker
    const customPickerHtml = `
        <div class="custom-color-picker">
            <label for="custom-color">Custom:</label>
            <input type="color" id="custom-color" value="${currentColor || '#3498db'}">
            <input type="text" id="hex-color" placeholder="#HEX" value="${currentColor || ''}">
        </div>
        <div class="color-picker-actions">
            <button id="reset-color" class="reset-color-btn">Reset</button>
            <button id="apply-color" class="apply-color-btn">Apply</button>
        </div>
    `;
    
    // Add all content to the menu
    pickerMenu.innerHTML = presetsHtml + customPickerHtml;
    
    // Position the menu near the clicked element - handle different positioning for notes
    const rect = targetElement.getBoundingClientRect();
    
    // Make sure the menu is always visible within viewport
    const menuTop = Math.min(rect.top + 20, window.innerHeight - 300);
    const menuLeft = Math.min(rect.left + 20, window.innerWidth - 250);
    
    pickerMenu.style.top = `${menuTop}px`;
    pickerMenu.style.left = `${menuLeft}px`;
    
    // Add to the document
    document.body.appendChild(pickerMenu);
    
    // Set up event listeners for the color picker
    
    // Preset color selection
    pickerMenu.querySelectorAll('.color-preset').forEach(preset => {
        preset.addEventListener('click', function() {
            // Remove selected class from all presets
            pickerMenu.querySelectorAll('.color-preset').forEach(p => p.classList.remove('selected'));
            // Add selected class to clicked preset
            this.classList.add('selected');
            
            // Update the color inputs
            const color = this.dataset.color;
            document.getElementById('custom-color').value = color;
            document.getElementById('hex-color').value = color;
            
            // Apply the color immediately
            applyColorToItem(itemId, itemType, color);
        });
    });
    
    // Custom color picker changes
    document.getElementById('custom-color').addEventListener('input', function() {
        document.getElementById('hex-color').value = this.value;
        
        // Remove selected class from all presets
        pickerMenu.querySelectorAll('.color-preset').forEach(p => p.classList.remove('selected'));
    });
    
    // Hex input changes
    document.getElementById('hex-color').addEventListener('input', function() {
        const hexValue = this.value;
        // If it's a valid hex code, update the color picker
        if (/^#[0-9A-F]{6}$/i.test(hexValue)) {
            document.getElementById('custom-color').value = hexValue;
            
            // Remove selected class from all presets
            pickerMenu.querySelectorAll('.color-preset').forEach(p => p.classList.remove('selected'));
        }
    });
    
    // Apply button click
    document.getElementById('apply-color').addEventListener('click', function() {
        const colorInput = document.getElementById('hex-color');
        let color = colorInput.value;
        
        // Validate hex code format
        if (color && !color.startsWith('#')) {
            color = '#' + color;
            colorInput.value = color;
        }
        
        // Apply the color
        applyColorToItem(itemId, itemType, color);
        
        console.log(`Applied color ${color} to ${itemType} ${itemId}`);
        
        // Close the picker
        pickerMenu.remove();
    });
    
    // Reset button click
    document.getElementById('reset-color').addEventListener('click', function() {
        applyColorToItem(itemId, itemType, '');
        pickerMenu.remove();
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function closeColorPicker(e) {
        if (!pickerMenu.contains(e.target) && e.target !== targetElement) {
            pickerMenu.remove();
            document.removeEventListener('click', closeColorPicker);
        }
    });
}

// Apply selected color to an item
function applyColorToItem(itemId, itemType, color) {
    console.log(`Applying color ${color} to ${itemType} with id ${itemId}`);
    
    // Update color in storage
    const itemColors = getItemColors();
    
    if (color) {
        // Make sure the itemType object exists
        if (!itemColors[itemType]) {
            itemColors[itemType] = {};
        }
        itemColors[itemType][itemId] = color;
    } else {
        // If empty color, remove the entry
        if (itemColors[itemType]) {
            delete itemColors[itemType][itemId];
        }
    }
    
    saveItemColors(itemColors);
    
    // Update the element in the DOM
    let item = null;
    
    // First try using data attributes
    if (itemType === 'note') {
        // Special handling for notes
        item = document.querySelector(`.note-item[data-id="${itemId}"]`);
    } else {
        // For tasks and events
        item = document.querySelector(`[data-id="${itemId}"][data-type="${itemType}"]`);
    }
    
    if (item) {
        if (color) {
            // Apply color to the left border
            item.style.borderLeftColor = color;
            
            // Also apply to top border if pinned
            if (item.classList.contains('pinned')) {
                item.style.borderTopColor = color;
            }
            
            // Also add a custom attribute to help with theme changes
            item.setAttribute('data-custom-color', color);
        } else {
            // Reset to default border color based on type
            item.style.borderLeftColor = '';
            item.style.borderTopColor = '';
            item.removeAttribute('data-custom-color');
        }
        console.log(`Color applied to element:`, item);
    } else {
        console.error(`Element not found for ${itemType} with id ${itemId}`);
    }
}

// Add to existing document.addEventListener('DOMContentLoaded', () => { ... }
// This can be added after all existing code in that event handler
document.addEventListener('DOMContentLoaded', () => {
    // Add CSS for the color picker and tabs
    const style = document.createElement('style');
    style.textContent = `
        .event-item, .task-item, .note-item {
            position: relative;
            cursor: default;
            transition: border-left-color 0.2s ease;
        }
        
        /* Custom color tab indicator */
        .event-item::before, .task-item::before, .note-item::before {
            content: '';
            position: absolute;
            left: -4px;
            top: 0;
            bottom: 0;
            width: 8px;
            background-color: transparent;
            z-index: 5;
            cursor: pointer;
        }
        
        .event-item:hover::before, .task-item:hover::before, .note-item:hover::before {
            background-color: var(--tab-hover);
        }
        
        .color-picker-menu {
            position: fixed;
            z-index: 1000;
            background-color: var(--section-bg);
            border-radius: 5px;
            box-shadow: 0 3px 10px var(--section-shadow);
            padding: 10px;
            min-width: 200px;
            max-width: 300px;
            color: var(--text-color);
        }
        
        .preset-colors {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 5px;
            margin-bottom: 10px;
        }
        
        .color-preset {
            width: 25px;
            height: 25px;
            border-radius: 50%;
            cursor: pointer;
            border: 2px solid transparent;
        }
        
        .color-preset:hover {
            transform: scale(1.1);
        }
        
        .color-preset.selected {
            border-color: var(--text-color);
            box-shadow: 0 0 0 1px var(--border-color);
        }
        
        .custom-color-picker {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
            gap: 5px;
        }
        
        .custom-color-picker label {
            flex: 0 0 auto;
        }
        
        #custom-color {
            width: 30px;
            height: 30px;
            border: none;
            cursor: pointer;
        }
        
        #hex-color {
            flex: 1;
            padding: 5px;
            border: 1px solid var(--border-color);
            border-radius: 3px;
            background-color: var(--section-bg);
            color: var(--text-color);
        }
        
        .color-picker-actions {
            display: flex;
            justify-content: space-between;
        }
        
        .reset-color-btn, .apply-color-btn {
            padding: 5px 10px;
            border: none;
            border-radius: 3px;
            cursor: pointer;
        }
        
        .reset-color-btn {
            background-color: var(--bg-color);
            color: var(--text-color);
        }
        
        .apply-color-btn {
            background-color: var(--accent-color);
            color: white;
        }
    `;
    document.head.appendChild(style);
    
    // Add tab color listeners after initial load
    setTimeout(function() {
        addTabColorListeners();
        
        // Add special direct listeners to notes
        document.querySelectorAll('.note-item').forEach(note => {
            note.addEventListener('click', function(e) {
                const rect = this.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                
                // If click is within first 15px (the tab area)
                if (clickX <= 15) {
                    const itemId = this.dataset.id;
                    if (itemId) {
                        // Show color picker
                        showColorPicker(itemId, 'note', this);
                        e.stopPropagation(); // Prevent event bubbling
                    }
                }
            });
        });
    }, 1000);
});

// Function to toggle weather display and adjust header layout
function toggleWeatherDisplay(show) {
    const weatherContainer = document.getElementById('weather');
    const dashboardTitle = document.querySelector('.dashboard-title-container');
    
    if (show) {
        weatherContainer.style.display = 'flex';
        dashboardTitle.classList.remove('title-left');
    } else {
        weatherContainer.style.display = 'none';
        dashboardTitle.classList.add('title-left');
    }
}

// Add event listeners to hide buttons for both calendar events and tasks
function addHideButtonListeners() {
    document.querySelectorAll('.hide-item-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent event bubbling
            const item = this.closest('.event-item, .task-item');
            if (item) {
                item.style.display = 'none';
                
                // Store the hidden state in localStorage
                const itemId = item.dataset.id;
                const itemType = item.dataset.type || (item.classList.contains('event-item') ? 'event' : 'task');
                
                if (itemId) {
                    // Get current hidden items
                    const hiddenItems = getHiddenItems();
                    
                    // Add this item to the hidden items list if not already there
                    if (!hiddenItems[itemType].includes(itemId)) {
                        hiddenItems[itemType].push(itemId);
                        saveHiddenItems(hiddenItems);
                    }
                }
            }
        });
    });
}

// Get hidden items from localStorage
function getHiddenItems() {
    const hiddenItemsStr = localStorage.getItem('dashboard_hidden_items');
    const defaultHiddenItems = { event: [], task: [] };
    
    if (!hiddenItemsStr) {
        return defaultHiddenItems;
    }
    
    try {
        return JSON.parse(hiddenItemsStr);
    } catch (error) {
        console.error('Error parsing hidden items:', error);
        return defaultHiddenItems;
    }
}

// Save hidden items to localStorage
function saveHiddenItems(hiddenItems) {
    localStorage.setItem('dashboard_hidden_items', JSON.stringify(hiddenItems));
}

// Clear all hidden items
function clearHiddenItems() {
    saveHiddenItems({ event: [], task: [] });
    // Refresh the displayed items
    if (calendarAuthorized) {
        listCalendarEvents();
    }
    if (tasksAuthorized) {
        listTasks();
    }
}

// Clear hidden items of a specific type
function clearHiddenItemsByType(type) {
    const hiddenItems = getHiddenItems();
    hiddenItems[type] = [];
    saveHiddenItems(hiddenItems);
    
    // Refresh the appropriate section
    if (type === 'event' && calendarAuthorized) {
        listCalendarEvents();
    } else if (type === 'task' && tasksAuthorized) {
        listTasks();
    }
} 

// Set up calendar window dropdown functionality
function setupCalendarWindowDropdown() {
    // Get the dropdown element in the calendar section header
    const calendarWindowSelect = document.getElementById('calendar-window-select');
    
    if (calendarWindowSelect) {
        // Set the initial value to match the current setting
        if (CONFIG.CALENDAR_DAYS) {
            calendarWindowSelect.value = CONFIG.CALENDAR_DAYS.toString();
        }
        
        // Add change event listener
        calendarWindowSelect.addEventListener('change', () => {
            const days = parseInt(calendarWindowSelect.value, 10);
            CONFIG.CALENDAR_DAYS = days;
            saveSettings(CONFIG);
            
            // Reload calendar events to reflect the new setting
            if (calendarAuthorized) {
                listCalendarEvents();
            }
        });
    }
}

// Get item colors from localStorage
function getItemColors() {
    const itemColorsStr = localStorage.getItem('dashboard_item_colors');
    const defaultItemColors = { event: {}, task: {}, note: {} };
    
    if (!itemColorsStr) {
        return defaultItemColors;
    }
    
    try {
        return JSON.parse(itemColorsStr);
    } catch (error) {
        console.error('Error parsing item colors:', error);
        return defaultItemColors;
    }
}

// Function to revoke tokens and clear auth state
function revokeTokens() {
    try {
        // Clear token from local storage
        localStorage.removeItem('gapi_token');
        
        // Reset auth state
        calendarAuthorized = false;
        tasksAuthorized = false;
        
        // Clear the token client side
        if (gapi.client.getToken()) {
            google.accounts.oauth2.revoke(gapi.client.getToken().access_token, () => {
                console.log('Token revoked');
                gapi.client.setToken('');
                showToast('Authentication tokens revoked', 'info');
                
                // Reset UI state
                document.getElementById('calendar-login-prompt').style.display = 'block';
                document.getElementById('tasks-login-prompt').style.display = 'block';
                document.getElementById('calendar-content').innerHTML = '';
                document.getElementById('tasks-content').innerHTML = '';
                
                // Add login buttons back
                const calendarLoginPrompt = document.getElementById('calendar-login-prompt');
                const tasksLoginPrompt = document.getElementById('tasks-login-prompt');
                
                calendarLoginPrompt.innerHTML = `
                    <p>Sign in to view your Google Calendar events</p>
                    <button class="login-button" id="authorize-calendar">Sign In</button>
                `;
                
                tasksLoginPrompt.innerHTML = `
                    <p>Sign in to view your Google Tasks</p>
                    <button class="login-button" id="authorize-tasks">Sign In</button>
                `;
                
                // Re-attach event handlers
                document.getElementById('authorize-calendar').onclick = handleCalendarAuthClick;
                document.getElementById('authorize-tasks').onclick = handleTasksAuthClick;
            });
        } else {
            showToast('No active token found', 'info');
        }
    } catch (error) {
        console.error('Error revoking token:', error);
        showToast('Error revoking tokens', 'error');
    }
}

// Set up help buttons
function setupHelpButtons() {
    const helpDialog = document.getElementById('help-dialog');
    const helpDialogContent = document.getElementById('help-dialog-content');
    const closeHelpBtn = document.getElementById('help-dialog-close');
    const modalOverlay = document.getElementById('modal-overlay');
    
    // Help content for each help topic
    const helpContent = {
        'oauth-client-id': `
            <h3>Google API Client ID</h3>
            <p>The Client ID is required for authentication with Google services.</p>
            <p>To get a Client ID:</p>
            <ol>
                <li>Go to the <a href="https://console.cloud.google.com/" target="_blank">Google Cloud Console</a></li>
                <li>Create a new project or select an existing one</li>
                <li>Navigate to "APIs & Services" > "Credentials"</li>
                <li>Click "Create Credentials" and select "OAuth client ID"</li>
                <li>Set the application type to "Web application"</li>
                <li>Add your domain to the authorized JavaScript origins</li>
                <li>Click "Create" and copy the Client ID</li>
            </ol>
        `,
        'google-api-key': `
            <h3>Google API Key</h3>
            <p>The API Key is required to access Google Calendar and Tasks APIs.</p>
            <p>To get an API Key:</p>
            <ol>
                <li>Go to the <a href="https://console.cloud.google.com/" target="_blank">Google Cloud Console</a></li>
                <li>Create a new project or select an existing one</li>
                <li>Navigate to "APIs & Services" > "Credentials"</li>
                <li>Click "Create Credentials" and select "API Key"</li>
                <li>Copy the API Key</li>
                <li>Optionally restrict the key to only Calendar and Tasks APIs</li>
            </ol>
            <p>You also need to enable the Google Calendar API and Tasks API in the "APIs & Services" > "Library" section.</p>
        `,
        'weather-api-key': `
            <h3>OpenWeatherMap API Key</h3>
            <p>This key is required to display weather information.</p>
            <p>To get an OpenWeatherMap API Key:</p>
            <ol>
                <li>Go to <a href="https://openweathermap.org/" target="_blank">OpenWeatherMap</a> and create an account</li>
                <li>After logging in, go to your profile > "API Keys"</li>
                <li>Generate a new API key or use the default one provided</li>
                <li>Copy the key and paste it here</li>
            </ol>
            <p>Note: New API keys may take a few hours to activate.</p>
        `
    };
    
    // Close help dialog when close button is clicked
    closeHelpBtn.addEventListener('click', () => {
        helpDialog.style.display = 'none';
        modalOverlay.style.display = 'none';
    });
    
    // Close help dialog when clicking outside
    modalOverlay.addEventListener('click', () => {
        if (helpDialog.style.display === 'block') {
            helpDialog.style.display = 'none';
            modalOverlay.style.display = 'none';
        }
    });
    
    // Add click event listeners to all help buttons
    document.querySelectorAll('.help-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const helpTopic = button.getAttribute('data-help');
            if (helpTopic && helpContent[helpTopic]) {
                helpDialogContent.innerHTML = helpContent[helpTopic];
                helpDialog.style.display = 'block';
                modalOverlay.style.display = 'block';
                e.stopPropagation(); // Prevent event bubbling to modal overlay
            }
        });
    });
}

// Set up settings modal
function setupSettingsModal() {
    console.log("📌 setupSettingsModal() called");
    const settingsButton = document.getElementById('settings-button');
    const settingsModal = document.getElementById('settings-modal');
    const modalOverlay = document.getElementById('modal-overlay');
    const closeModalBtn = settingsModal.querySelector('.close-modal');
    const saveSettingsBtn = document.getElementById('settings-save');
    
    console.log("📌 Settings modal elements:", {
        settingsButton: !!settingsButton,
        settingsModal: !!settingsModal,
        modalOverlay: !!modalOverlay,
        closeModalBtn: !!closeModalBtn,
        saveSettingsBtn: !!saveSettingsBtn
    });
    
    // Get all form elements
    const clientIdInput = document.getElementById('google-client-id');
    const apiKeyInput = document.getElementById('google-api-key');
    const weatherApiKeyInput = document.getElementById('weather-api-key');
    const themeToggle = document.getElementById('theme-toggle');
    const dateToggle = document.getElementById('date-toggle');
    const weatherToggle = document.getElementById('weather-toggle');
    const calendarDaysSelect = document.getElementById('calendar-days-select');
    const clockFormatToggle = document.getElementById('clock-format-toggle');
    
    console.log("📌 Form elements:", {
        clientIdInput: !!clientIdInput,
        apiKeyInput: !!apiKeyInput,
        weatherApiKeyInput: !!weatherApiKeyInput,
        themeToggle: !!themeToggle,
        dateToggle: !!dateToggle,
        weatherToggle: !!weatherToggle,
        calendarDaysSelect: !!calendarDaysSelect,
        clockFormatToggle: !!clockFormatToggle
    });
    
    // Open modal when settings button is clicked
    if (settingsButton) {
        settingsButton.addEventListener('click', () => {
            // Populate form fields with current settings
            if (clientIdInput) clientIdInput.value = CONFIG.CLIENT_ID || '';
            if (apiKeyInput) apiKeyInput.value = CONFIG.API_KEY || '';
            if (weatherApiKeyInput) weatherApiKeyInput.value = CONFIG.WEATHER_API_KEY || '';
            
            // Set toggle switches
            if (themeToggle) themeToggle.checked = CONFIG.THEME === 'dark';
            if (dateToggle) dateToggle.checked = CONFIG.SHOW_DATE === true;
            if (weatherToggle) weatherToggle.checked = CONFIG.SHOW_WEATHER !== false;
            if (clockFormatToggle) clockFormatToggle.checked = !CONFIG.CLOCK_24H;
            
            // Set calendar days
            if (calendarDaysSelect && CONFIG.CALENDAR_DAYS) {
                calendarDaysSelect.value = CONFIG.CALENDAR_DAYS.toString();
            }
            
            // Show the modal
            if (settingsModal) settingsModal.style.display = 'block';
            if (modalOverlay) modalOverlay.style.display = 'block';
        });
    }
    
    // Close modal when close button is clicked
    if (closeModalBtn && settingsModal && modalOverlay) {
        closeModalBtn.addEventListener('click', () => {
            settingsModal.style.display = 'none';
            modalOverlay.style.display = 'none';
        });
    }
    
    // Close modal when overlay is clicked
    if (modalOverlay && settingsModal) {
        modalOverlay.addEventListener('click', () => {
            settingsModal.style.display = 'none';
            modalOverlay.style.display = 'none';
        });
    }
    
    // Theme toggle
    if (themeToggle) {
        themeToggle.addEventListener('change', () => {
            CONFIG.THEME = themeToggle.checked ? 'dark' : 'light';
            document.body.className = themeToggle.checked ? 'dark-mode' : '';
            saveSettings(CONFIG);
        });
    }
    
    // Date toggle
    if (dateToggle) {
        dateToggle.addEventListener('change', () => {
            CONFIG.SHOW_DATE = dateToggle.checked;
            setupClock();
            saveSettings(CONFIG);
        });
    }
    
    // Weather toggle
    if (weatherToggle) {
        weatherToggle.addEventListener('change', () => {
            CONFIG.SHOW_WEATHER = weatherToggle.checked;
            toggleWeatherDisplay(weatherToggle.checked);
            saveSettings(CONFIG);
        });
    }
    
    // Clock format toggle
    if (clockFormatToggle) {
        clockFormatToggle.addEventListener('change', () => {
            CONFIG.CLOCK_24H = !clockFormatToggle.checked;
            setupClock();
            saveSettings(CONFIG);
        });
    }
    
    // Save settings button
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', () => {
            // Get settings from form
            const newSettings = {
                CLIENT_ID: clientIdInput ? clientIdInput.value.trim() : '',
                API_KEY: apiKeyInput ? apiKeyInput.value.trim() : '',
                WEATHER_API_KEY: weatherApiKeyInput ? weatherApiKeyInput.value.trim() : '',
                THEME: themeToggle && themeToggle.checked ? 'dark' : 'light',
                SHOW_DATE: dateToggle ? dateToggle.checked : false,
                SHOW_WEATHER: weatherToggle ? weatherToggle.checked : true,
                CLOCK_24H: clockFormatToggle ? !clockFormatToggle.checked : true,
                CALENDAR_DAYS: calendarDaysSelect ? parseInt(calendarDaysSelect.value, 10) : 7
            };
            
            // Save settings
            saveSettings(newSettings);
            
            // Show success toast
            showToast('Settings saved successfully', 'success');
            
            // Close the modal
            settingsModal.style.display = 'none';
            modalOverlay.style.display = 'none';
        });
    }
    
    // Add sign out button to the modal footer
    if (settingsModal) {
        const modalFooter = settingsModal.querySelector('.modal-footer');
        if (modalFooter) {
            const signOutButton = document.createElement('button');
            signOutButton.id = 'sign-out-btn';
            signOutButton.className = 'sign-out-btn';
            signOutButton.textContent = 'Sign Out of Google';
            signOutButton.addEventListener('click', revokeTokens);
            
            if (modalFooter.querySelector('.github-link')) {
                modalFooter.insertBefore(signOutButton, modalFooter.querySelector('.github-link'));
            } else {
                modalFooter.appendChild(signOutButton);
            }
        }
    }
}

// Debug function for Google API issues
function debugGoogleApiIssues() {
    console.log("=============== GOOGLE API DEBUG INFO ===============");
    console.log("📌 CONFIG:", {
        CLIENT_ID: CONFIG.CLIENT_ID ? `${CONFIG.CLIENT_ID.substring(0, 10)}...` : "Missing",
        API_KEY: CONFIG.API_KEY ? `${CONFIG.API_KEY.substring(0, 10)}...` : "Missing",
        CLIENT_ID_TYPE: typeof CONFIG.CLIENT_ID,
        API_KEY_TYPE: typeof CONFIG.API_KEY
    });
    
    console.log("📌 Script loading status:");
    console.log("  - window.gapi:", typeof window.gapi !== 'undefined' ? "Loaded" : "Not loaded");
    console.log("  - window.google:", typeof window.google !== 'undefined' ? "Loaded" : "Not loaded");
    
    if (typeof window.gapi !== 'undefined') {
        console.log("  - window.gapi.client:", typeof window.gapi.client !== 'undefined' ? "Loaded" : "Not loaded");
        
        if (typeof window.gapi.client !== 'undefined') {
            console.log("  - window.gapi.client.getToken:", typeof window.gapi.client.getToken === 'function' ? "Available" : "Not available");
            console.log("  - Current token:", window.gapi.client.getToken() ? "Present" : "None");
        }
    }
    
    if (typeof window.google !== 'undefined') {
        console.log("  - window.google.accounts:", typeof window.google.accounts !== 'undefined' ? "Loaded" : "Not loaded");
        
        if (typeof window.google.accounts !== 'undefined') {
            console.log("  - window.google.accounts.oauth2:", typeof window.google.accounts.oauth2 !== 'undefined' ? "Loaded" : "Not loaded");
        }
    }
    
    console.log("📌 Initialization state:");
    console.log("  - gapiInited:", gapiInited);
    console.log("  - gisInited:", gisInited);
    console.log("  - calendarAuthorized:", calendarAuthorized);
    console.log("  - tasksAuthorized:", tasksAuthorized);
    console.log("  - tokenClient:", tokenClient ? "Exists" : "Not created");
    
    console.log("📌 DOM Elements:");
    console.log("  - #calendar-login-prompt:", document.getElementById('calendar-login-prompt') ? "Exists" : "Not found");
    console.log("  - #tasks-login-prompt:", document.getElementById('tasks-login-prompt') ? "Exists" : "Not found");
    console.log("  - #authorize-calendar:", document.getElementById('authorize-calendar') ? "Exists" : "Not found");
    console.log("  - #authorize-tasks:", document.getElementById('authorize-tasks') ? "Exists" : "Not found");
    
    console.log("📌 Local Storage:");
    console.log("  - gapi_token:", localStorage.getItem('gapi_token') ? "Present" : "Not present");
    console.log("  - dashboard_settings:", localStorage.getItem('dashboard_settings') ? "Present" : "Not present");
    
    console.log("📌 Browser environment:");
    console.log("  - User Agent:", navigator.userAgent);
    console.log("  - Cookies enabled:", navigator.cookieEnabled);
    console.log("  - Third-party cookies:", "Check browser settings");
    console.log("  - Potential blockers:", "Check for ad-blockers, privacy extensions");
    
    console.log("=============== END DEBUG INFO ===============");
}

// Run the debug function during initialization
document.addEventListener('DOMContentLoaded', function() {
    // Run debug automatically after 3 seconds - hidden from user
    setTimeout(debugGoogleApiIssues, 3000);
});

// Add setupSortablePanes function to initialize Sortable.js for the panes
function setupSortablePanes() {
    // Get main sortable container
    const sortableContainer = document.getElementById('sortable-panes');
    
    if (!sortableContainer) {
        console.warn('Sortable container not found');
        return;
    }

    // Load saved pane order FIRST
    loadPaneOrder();
    
    // Initialize the main sortable container for panes
    const sortablePanes = new Sortable(sortableContainer, {
        animation: 150,
        handle: '.drag-handle',
        ghostClass: 'sortable-ghost',
        onEnd: function(evt) {
            // Save the new pane order
            savePaneOrder();
        }
    });
}

// Save the order of panes to localStorage
function savePaneOrder() {
    const panes = document.querySelectorAll('.section[data-type="pane"]');
    const paneOrder = Array.from(panes).map(pane => pane.id);
    
    localStorage.setItem('paneOrder', JSON.stringify(paneOrder));
    console.log('Saved pane order:', paneOrder);
}

// Load and apply the saved pane order from localStorage
function loadPaneOrder() {
    const savedOrder = localStorage.getItem('paneOrder');
    if (!savedOrder) return;
    
    try {
        const paneOrder = JSON.parse(savedOrder);
        const container = document.getElementById('sortable-panes');
        
        // Reorder the panes according to the saved order
        paneOrder.forEach(paneId => {
            const pane = document.getElementById(paneId);
            if (pane) container.appendChild(pane);
        });
        
        console.log('Loaded pane order:', paneOrder);
    } catch (error) {
        console.error('Error loading pane order:', error);
    }
}

// The setupSortablePanes function is already called in the main DOMContentLoaded event listener