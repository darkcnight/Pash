// App Configuration and Settings
let CONFIG = {
    CLIENT_ID: '',
    API_KEY: '',
    WEATHER_API_KEY: '',
    WEATHER_LOCATION: 'Singapore',
    TIMEZONE: 'Asia/Singapore',
    DASHBOARD_TITLE: 'Pash',
    THEME: 'light', // 'light' or 'dark'
    SHOW_DATE: false, // Whether to show date with the time
    SHOW_WEATHER: true // Whether to show weather in the header
};

// Load settings from localStorage if available
function loadSettings() {
    const savedSettings = localStorage.getItem('dashboard_settings');
    if (savedSettings) {
        try {
            const parsedSettings = JSON.parse(savedSettings);
            CONFIG = { ...CONFIG, ...parsedSettings };
            
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

// Save settings to localStorage
function saveSettings(settings) {
    CONFIG = { ...CONFIG, ...settings };
    localStorage.setItem('dashboard_settings', JSON.stringify(CONFIG));
}

// Discovery docs and scopes for Calendar and Tasks
const DISCOVERY_DOCS = [
    'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
    'https://www.googleapis.com/discovery/v1/apis/tasks/v1/rest'
];

const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/tasks.readonly';

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
    
    // Set up title editing
    setupTitleEditing();
    
    // Set up notes functionality (works without API keys)
    setupNotes();
    
    // Set up clock (with timezone support)
    setupClock();
    
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
        script1.onload = gapiLoaded;
        document.body.appendChild(script1);
        
        // Load the Google Identity Services library
        const script2 = document.createElement('script');
        script2.src = 'https://accounts.google.com/gsi/client';
        script2.onload = gisLoaded;
        document.body.appendChild(script2);
        
        // Add event listeners for refresh buttons
        document.getElementById('refresh-calendar').addEventListener('click', () => {
            if (calendarAuthorized) {
                listCalendarEvents();
            }
        });
        
        document.getElementById('refresh-tasks').addEventListener('click', () => {
            if (tasksAuthorized) {
                listTasks();
            }
        });
        
        // Set up the automatic refresh interval
        setupAutoRefresh();
    } else {
        // Show API keys missing error in calendar and tasks sections
        showError('calendar-section', 'API Keys Missing', 'Please configure Google API credentials in settings to use Calendar integration.');
        showError('tasks-section', 'API Keys Missing', 'Please configure Google API credentials in settings to use Tasks integration.');
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
    try {
        gapi.load('client', initializeGapiClient);
    } catch (error) {
        console.error('Error loading Google API client:', error);
        showError('calendar-section', 'Google API Error', 'Failed to load Google API client. Please try again later.');
        showError('tasks-section', 'Google API Error', 'Failed to load Google API client. Please try again later.');
    }
}

// Initialize the Google API client with your API key and discovery docs
async function initializeGapiClient() {
    try {
        await gapi.client.init({
            apiKey: CONFIG.API_KEY,
            discoveryDocs: DISCOVERY_DOCS,
        });
        gapiInited = true;
        maybeEnableButtons();
    } catch (error) {
        console.error('Error initializing Google API client:', error);
        showError('calendar-section', 'Google API Error', 'Failed to initialize Google API client. Please check your API key in settings.');
        showError('tasks-section', 'Google API Error', 'Failed to initialize Google API client. Please check your API key in settings.');
    }
}

// Initialize the Google Identity Services client
function gisLoaded() {
    try {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CONFIG.CLIENT_ID,
            scope: SCOPES,
            callback: '', // Will be set later
        });
        gisInited = true;
        maybeEnableButtons();
    } catch (error) {
        console.error('Error initializing Google Identity Services:', error);
        showError('calendar-section', 'Google API Error', 'Failed to initialize Google Identity Services. Please check your Client ID in settings.');
        showError('tasks-section', 'Google API Error', 'Failed to initialize Google Identity Services. Please check your Client ID in settings.');
    }
}

// Enable the authorize buttons if both API clients are initialized
function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        document.getElementById('authorize-calendar').onclick = handleCalendarAuthClick;
        document.getElementById('authorize-tasks').onclick = handleTasksAuthClick;
        
        // Check if we have a token in local storage
        const token = localStorage.getItem('gapi_token');
        if (token) {
            // Try to use the stored token
            try {
                gapi.client.setToken(JSON.parse(token));
                handleCalendarAuthSuccess();
                handleTasksAuthSuccess();
            } catch (err) {
                console.error('Error setting stored token:', err);
                localStorage.removeItem('gapi_token');
            }
        }
    }
}

// Set up the settings modal
function setupSettingsModal() {
    const settingsButton = document.getElementById('settings-button');
    const modal = document.getElementById('settings-modal');
    const modalOverlay = document.getElementById('modal-overlay');
    const closeModal = document.querySelector('.close-modal');
    const saveButton = document.getElementById('settings-save');
    
    // Input fields
    const clientIdInput = document.getElementById('google-client-id');
    const apiKeyInput = document.getElementById('google-api-key');
    const weatherApiKeyInput = document.getElementById('weather-api-key');
    const timezoneSelect = document.getElementById('timezone-select');
    const themeToggle = document.getElementById('theme-toggle');
    const dateToggle = document.getElementById('date-toggle');
    
    // Help elements
    const helpButtons = document.querySelectorAll('.help-button');
    const helpDialog = document.getElementById('help-dialog');
    const helpDialogClose = document.getElementById('help-dialog-close');
    const helpDialogContent = document.getElementById('help-dialog-content');
    
    // Set up help dialog functionality
    helpButtons.forEach(button => {
        button.addEventListener('click', e => {
            const helpType = e.target.getAttribute('data-help');
            showHelpDialog(helpType);
            e.stopPropagation(); // Prevent the event from propagating to parent elements
        });
    });
    
    // Close help dialog when X is clicked
    helpDialogClose.addEventListener('click', () => {
        helpDialog.style.display = 'none';
    });
    
    // Close help dialog when clicking outside
    modalOverlay.addEventListener('click', () => {
        helpDialog.style.display = 'none';
    });
    
    // Function to show the appropriate help content
    function showHelpDialog(helpType) {
        let content = '';
        
        switch (helpType) {
            case 'google-api-key':
                content = `
                    <h3>Google API Key</h3>
                    <p><strong>Purpose:</strong> Identifies your Google Cloud project and is used for accessing public Google APIs.</p>
                    <p><a href="https://developers.google.com/maps/documentation/javascript/get-api-key" target="_blank">Official Documentation</a></p>
                    <p><strong>Steps:</strong></p>
                    <ul>
                        <li>Go to the <a href="https://console.cloud.google.com/apis/credentials" target="_blank">Google Cloud Console Credentials page</a>.</li>
                        <li>Click Create Credentials and select API key.</li>
                        <li>Copy the generated API key.</li>
                        <li>(Optional but recommended) Click on the API key name to set restrictions for security purposes.</li>
                    </ul>
                `;
                break;
            case 'oauth-client-id':
                content = `
                    <h3>Google OAuth Client ID</h3>
                    <p><strong>Purpose:</strong> Used for OAuth 2.0 authentication to access user-specific data like Google Calendar and Tasks.</p>
                    <p><a href="https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid" target="_blank">Official Documentation</a></p>
                    <p><strong>Steps:</strong></p>
                    <ul>
                        <li>Navigate to the <a href="https://console.cloud.google.com/apis/credentials" target="_blank">Google Cloud Console Credentials page</a>.</li>
                        <li>Click Create Credentials and choose OAuth client ID.</li>
                        <li>If prompted, configure the OAuth consent screen with your app details.</li>
                        <li>Select Web application as the application type.</li>
                        <li>Under Authorized JavaScript origins, add your app's URL (e.g., http://localhost:8000).</li>
                        <li>Click Create and copy the generated Client ID.</li>
                    </ul>
                `;
                break;
            case 'weather-api-key':
                content = `
                    <h3>OpenWeatherMap API Key</h3>
                    <p><strong>Purpose:</strong> Accesses weather data for displaying current conditions and forecasts.</p>
                    <p><a href="https://openweathermap.org/faq" target="_blank">Official Documentation</a></p>
                    <p><strong>Steps:</strong></p>
                    <ul>
                        <li>Sign up or log in at <a href="https://openweathermap.org/" target="_blank">OpenWeatherMap</a>.</li>
                        <li>Navigate to the API keys section of your account.</li>
                        <li>Click Create key, enter a name for the key, and submit.</li>
                        <li>Copy the generated API key for use in your application.</li>
                    </ul>
                `;
                break;
        }
        
        helpDialogContent.innerHTML = content;
        helpDialog.style.display = 'block';
    }
    
    // Populate the timezone dropdown
    populateTimezones(timezoneSelect);
    
    // Set current values
    clientIdInput.value = CONFIG.CLIENT_ID || '';
    apiKeyInput.value = CONFIG.API_KEY || '';
    weatherApiKeyInput.value = CONFIG.WEATHER_API_KEY || '';
    timezoneSelect.value = CONFIG.TIMEZONE || 'Asia/Singapore';
    themeToggle.checked = CONFIG.THEME === 'dark';
    dateToggle.checked = CONFIG.SHOW_DATE === true;
    const weatherToggle = document.getElementById('weather-toggle');
    weatherToggle.checked = CONFIG.SHOW_WEATHER !== false; // Default to true if not explicitly set to false
    
    // Show the modal when settings button is clicked
    settingsButton.addEventListener('click', () => {
        modal.style.display = 'block';
        modalOverlay.style.display = 'block';
    });
    
    // Close the modal when X is clicked
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
        modalOverlay.style.display = 'none';
    });
    
    // Close the modal when clicking outside
    modalOverlay.addEventListener('click', () => {
        modal.style.display = 'none';
        modalOverlay.style.display = 'none';
        document.getElementById('title-edit-modal').style.display = 'none';
    });
    
    // Toggle theme when theme toggle is clicked
    themeToggle.addEventListener('change', () => {
        if (themeToggle.checked) {
            document.body.classList.add('dark-mode');
            CONFIG.THEME = 'dark';
        } else {
            document.body.classList.remove('dark-mode');
            CONFIG.THEME = 'light';
        }
        saveSettings({ THEME: CONFIG.THEME });
    });
    
    // Toggle date display when date toggle is clicked
    dateToggle.addEventListener('change', () => {
        CONFIG.SHOW_DATE = dateToggle.checked;
        saveSettings({ SHOW_DATE: CONFIG.SHOW_DATE });
        // Update the clock immediately to reflect the change
        setupClock();
    });
    
    // Toggle weather display when weather toggle is clicked
    weatherToggle.addEventListener('change', () => {
        CONFIG.SHOW_WEATHER = weatherToggle.checked;
        saveSettings({ SHOW_WEATHER: CONFIG.SHOW_WEATHER });
        // Update the weather display immediately
        toggleWeatherDisplay(CONFIG.SHOW_WEATHER);
    });
    
    // Save settings when save button is clicked
    saveButton.addEventListener('click', () => {
        const settings = {
            CLIENT_ID: clientIdInput.value.trim(),
            API_KEY: apiKeyInput.value.trim(),
            WEATHER_API_KEY: weatherApiKeyInput.value.trim(),
            TIMEZONE: timezoneSelect.value,
            THEME: themeToggle.checked ? 'dark' : 'light',
            SHOW_DATE: dateToggle.checked,
            SHOW_WEATHER: weatherToggle.checked
        };
        
        saveSettings(settings);
        
        // Notify user
        alert('Settings saved! Please refresh the page for changes to take effect.');
        
        // Close the modal
        modal.style.display = 'none';
        modalOverlay.style.display = 'none';
    });
}

// Populate timezone dropdown
function populateTimezones(selectElement) {
    const timezones = [
        'Africa/Abidjan', 'Africa/Accra', 'Africa/Algiers', 'Africa/Cairo', 'Africa/Casablanca', 'Africa/Johannesburg', 'Africa/Lagos', 'Africa/Nairobi',
        'America/Anchorage', 'America/Bogota', 'America/Buenos_Aires', 'America/Caracas', 'America/Chicago', 'America/Denver', 'America/Halifax', 
        'America/Los_Angeles', 'America/Mexico_City', 'America/New_York', 'America/Phoenix', 'America/Santiago', 'America/Sao_Paulo', 'America/St_Johns', 
        'America/Toronto', 'America/Vancouver',
        'Asia/Almaty', 'Asia/Baghdad', 'Asia/Bangkok', 'Asia/Beijing', 'Asia/Beirut', 'Asia/Dhaka', 'Asia/Dubai', 'Asia/Ho_Chi_Minh', 'Asia/Hong_Kong', 
        'Asia/Jakarta', 'Asia/Jerusalem', 'Asia/Karachi', 'Asia/Kolkata', 'Asia/Kuala_Lumpur', 'Asia/Kuwait', 'Asia/Manila', 'Asia/Riyadh', 'Asia/Seoul', 
        'Asia/Shanghai', 'Asia/Singapore', 'Asia/Taipei', 'Asia/Tehran', 'Asia/Tokyo',
        'Australia/Adelaide', 'Australia/Brisbane', 'Australia/Darwin', 'Australia/Melbourne', 'Australia/Perth', 'Australia/Sydney',
        'Europe/Amsterdam', 'Europe/Athens', 'Europe/Belgrade', 'Europe/Berlin', 'Europe/Brussels', 'Europe/Budapest', 'Europe/Copenhagen', 'Europe/Dublin', 
        'Europe/Helsinki', 'Europe/Istanbul', 'Europe/Lisbon', 'Europe/London', 'Europe/Madrid', 'Europe/Moscow', 'Europe/Oslo', 'Europe/Paris', 'Europe/Prague', 
        'Europe/Rome', 'Europe/Stockholm', 'Europe/Vienna', 'Europe/Warsaw', 'Europe/Zurich',
        'Pacific/Auckland', 'Pacific/Fiji', 'Pacific/Honolulu', 'Pacific/Noumea', 'Pacific/Tahiti'
    ];
    
    // Add an option for each timezone
    timezones.forEach(tz => {
        const option = document.createElement('option');
        option.value = tz;
        option.textContent = tz.replace('_', ' ');
        selectElement.appendChild(option);
    });
    
    // Set default to Asia/Singapore
    if (!CONFIG.TIMEZONE) {
        selectElement.value = 'Asia/Singapore';
    }
}

// Handle authorization for Calendar
function handleCalendarAuthClick() {
    try {
        tokenClient.callback = async (resp) => {
            if (resp.error !== undefined) {
                throw resp;
            }
            // Store the token in local storage
            localStorage.setItem('gapi_token', JSON.stringify(gapi.client.getToken()));
            handleCalendarAuthSuccess();
            handleTasksAuthSuccess(); // Both APIs use the same token
        };
        
        if (gapi.client.getToken() === null) {
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            tokenClient.requestAccessToken({ prompt: '' });
        }
    } catch (error) {
        console.error('Error during Calendar authorization:', error);
        showError('calendar-section', 'Authorization Error', 'Failed to authorize Calendar access. Please try again later.');
    }
}

// Handle authorization for Tasks
function handleTasksAuthClick() {
    try {
        tokenClient.callback = async (resp) => {
            if (resp.error !== undefined) {
                throw resp;
            }
            // Store the token in local storage
            localStorage.setItem('gapi_token', JSON.stringify(gapi.client.getToken()));
            handleCalendarAuthSuccess(); // Both APIs use the same token
            handleTasksAuthSuccess();
        };
        
        if (gapi.client.getToken() === null) {
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            tokenClient.requestAccessToken({ prompt: '' });
        }
    } catch (error) {
        console.error('Error during Tasks authorization:', error);
        showError('tasks-section', 'Authorization Error', 'Failed to authorize Tasks access. Please try again later.');
    }
}

// Handle successful Calendar authorization
function handleCalendarAuthSuccess() {
    calendarAuthorized = true;
    document.getElementById('calendar-login-prompt').classList.add('hidden');
    listCalendarEvents();
}

// Handle successful Tasks authorization
function handleTasksAuthSuccess() {
    tasksAuthorized = true;
    document.getElementById('tasks-login-prompt').classList.add('hidden');
    listTasks();
}

// Set up local storage for notes and UI handling
function setupNotes() {
    const notesList = document.getElementById('notes-list');
    const noteInput = document.getElementById('note-input');
    const noteSendBtn = document.getElementById('note-send');
    
    // Load saved notes from local storage
    loadNotes();
    
    // Send note when pressing Enter (not with Shift key)
    noteInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            addNote();
        }
    });
    
    // Send note when clicking the Send button
    noteSendBtn.addEventListener('click', addNote);
    
    // Handle auto-resize of the textarea
    noteInput.addEventListener('input', () => {
        noteInput.style.height = 'auto';
        noteInput.style.height = Math.min(noteInput.scrollHeight, 120) + 'px';
    });
    
    // Function to add a new note
    function addNote() {
        const content = noteInput.value.trim();
        if (!content) return;
        
        // Create a new note object
        const note = {
            id: Date.now(),
            content: content,
            timestamp: new Date().toISOString()
        };
        
        // Add to local storage
        const notes = getNotes();
        notes.unshift(note); // Add to beginning (most recent first)
        saveNotes(notes);
        
        // Clear input
        noteInput.value = '';
        noteInput.style.height = '40px';
        
        // Refresh notes display
        loadNotes();
    }
    
    // Function to load notes from local storage
    function loadNotes() {
        const notes = getNotes();
        notesList.innerHTML = '';
        
        if (notes.length === 0) {
            notesList.innerHTML = '<div class="note-item" style="opacity: 0.7; text-align: center;">No notes yet. Type something to get started!</div>';
            return;
        }
        
        // Loop through notes - since we switched to column layout (not column-reverse),
        // we need to add newer notes to the top of the list
        notes.forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.className = 'note-item';
            noteElement.dataset.id = note.id;
            
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
            
            // Parse markdown safely
            let parsedContent;
            try {
                parsedContent = marked.parse(note.content);
            } catch (error) {
                parsedContent = note.content;
                console.error('Error parsing markdown:', error);
            }
            
            noteElement.innerHTML = `
                <div class="note-timestamp">${formattedDate}</div>
                <div class="note-content">${parsedContent}</div>
                <div class="note-actions">
                    <button class="note-action-btn edit-note">✏️</button>
                    <button class="note-action-btn delete-note">🗑️</button>
                </div>
            `;
            
            // Insert at the beginning of the list to maintain most recent first
            if (notesList.firstChild) {
                notesList.insertBefore(noteElement, notesList.firstChild);
            } else {
                notesList.appendChild(noteElement);
            }
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
                
                // Create edit mode interface
                const editArea = document.createElement('div');
                editArea.className = 'note-edit';
                editArea.innerHTML = `
                    <textarea class="note-edit-area">${note.content}</textarea>
                    <div class="note-edit-buttons">
                        <button class="note-cancel-btn">Cancel</button>
                        <button class="note-edit-btn">Save</button>
                    </div>
                `;
                
                // Replace content with edit area
                noteElement.querySelector('.note-content').replaceWith(editArea);
                noteElement.querySelector('.note-actions').style.display = 'none';
                
                // Focus on textarea
                const textarea = noteElement.querySelector('.note-edit-area');
                textarea.focus();
                
                // Add event listeners for save and cancel
                noteElement.querySelector('.note-edit-btn').addEventListener('click', () => {
                    saveEditedNote(noteId, textarea.value);
                });
                
                noteElement.querySelector('.note-cancel-btn').addEventListener('click', () => {
                    // Restore original content
                    const contentDiv = document.createElement('div');
                    contentDiv.className = 'note-content';
                    contentDiv.innerHTML = originalContent;
                    editArea.replaceWith(contentDiv);
                    noteElement.querySelector('.note-actions').style.display = '';
                });
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
            });
        });
    }
    
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
        return notesStr ? JSON.parse(notesStr) : [];
    }
    
    // Helper function to save notes to local storage
    function saveNotes(notes) {
        localStorage.setItem('dashboard_notes', JSON.stringify(notes));
    }
}

// Set up clock functionality with timezone support
function setupClock() {
    const clockElement = document.getElementById('clock');
    
    function updateClock() {
        try {
            // Use the configured timezone
            const now = DateTime.now().setZone(CONFIG.TIMEZONE);
            let formatted;
            
            if (CONFIG.SHOW_DATE) {
                // Format with date: 'ddd, dd MMM yyyy HH:mm'
                formatted = now.toFormat('ccc, dd LLL yyyy HH:mm');
            } else {
                // Format with time only
                formatted = now.toFormat('HH:mm');
            }
            
            clockElement.textContent = formatted;
        } catch (error) {
            // Fallback if there's an error
            console.error('Error updating clock:', error);
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            
            if (CONFIG.SHOW_DATE) {
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const day = days[now.getDay()];
                const date = String(now.getDate()).padStart(2, '0');
                const month = months[now.getMonth()];
                const year = now.getFullYear();
                clockElement.textContent = `${day}, ${date} ${month} ${year} ${hours}:${minutes}`;
            } else {
                clockElement.textContent = `${hours}:${minutes}`;
            }
        }
    }

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
    
    // Show loading state
    statusIndicator.innerHTML = 'Loading events... <div class="loader"></div>';
    
    // Get events from today in the user's timezone
    let today;
    try {
        today = DateTime.now().setZone(CONFIG.TIMEZONE).startOf('day');
    } catch (error) {
        console.error('Error setting timezone for calendar:', error);
        today = DateTime.now().startOf('day');
    }
    
    // Get events up to a week from now
    let nextWeek = today.plus({ days: 7 });
    
    try {
        gapi.client.calendar.events.list({
            'calendarId': 'primary',
            'timeMin': today.toISO(),
            'timeMax': nextWeek.toISO(),
            'singleEvents': true,
            'orderBy': 'startTime'
        }).then(response => {
            const events = response.result.items;
            displayCalendarEvents(events);
            statusIndicator.textContent = `Last updated: ${DateTime.now().setZone(CONFIG.TIMEZONE).toLocaleString(DateTime.TIME_SIMPLE)}`;
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
        // Group events by day
        const eventsByDay = {};
        let today, tomorrow;
        
        try {
            today = DateTime.now().setZone(CONFIG.TIMEZONE).startOf('day');
            tomorrow = today.plus({ days: 1 });
        } catch (error) {
            console.error('Error setting timezone for event display:', error);
            today = DateTime.now().startOf('day');
            tomorrow = today.plus({ days: 1 });
        }
        
        events.forEach(event => {
            // Parse event start time (with timezone support)
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
                    start = DateTime.fromISO(event.start.dateTime).setZone(CONFIG.TIMEZONE);
                } else {
                    start = DateTime.fromISO(event.start.date).setZone(CONFIG.TIMEZONE);
                }
                
                if (event.end && event.end.dateTime) {
                    end = DateTime.fromISO(event.end.dateTime).setZone(CONFIG.TIMEZONE);
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
                
                html += `
                    <div class="event-item">
                        <div class="event-title">${event.summary || 'Untitled Event'}</div>
                        <div class="event-time">${timeStr}</div>
                        ${event.location ? `<div class="event-location">📍 ${event.location}</div>` : ''}
                    </div>
                `;
            });
        });
        
        calendarContent.innerHTML = html;
    } catch (error) {
        console.error('Error displaying calendar events:', error);
        showError('calendar-section', 'Calendar Display Error', 'Failed to display calendar events due to an error.');
    }
}

// List Tasks
function listTasks() {
    const tasksContent = document.getElementById('tasks-content');
    const statusIndicator = document.getElementById('tasks-status');
    
    // Show loading state
    statusIndicator.innerHTML = 'Loading tasks... <div class="loader"></div>';
    
    try {
        // Get the default task list
        gapi.client.tasks.tasklists.list({
            'maxResults': 1
        }).then(response => {
            if (!response.result.items || response.result.items.length === 0) {
                throw new Error('No task lists found');
            }
            
            const taskList = response.result.items[0];
            return gapi.client.tasks.tasks.list({
                'tasklist': taskList.id
            });
        }).then(response => {
            const tasks = response.result.items || [];
            displayTasks(tasks);
            
            let updatedTime;
            try {
                updatedTime = DateTime.now().setZone(CONFIG.TIMEZONE).toLocaleString(DateTime.TIME_SIMPLE);
            } catch (error) {
                updatedTime = new Date().toLocaleTimeString();
            }
            
            statusIndicator.textContent = `Last updated: ${updatedTime}`;
        }).catch(error => {
            console.error('Error fetching tasks:', error);
            statusIndicator.textContent = 'Error loading tasks. Try refreshing.';
            
            if (error.status === 401) {
                // Token expired, try to refresh
                handleTasksAuthClick();
            } else {
                showError('tasks-section', 'Tasks Error', 'Failed to load tasks. Please try again later.');
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
    
    if (!tasks || tasks.length === 0) {
        tasksContent.innerHTML = '<div style="text-align: center; padding: 20px;">No tasks found.</div>';
        return;
    }
    
    try {
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
        
        // Setup timezone for due dates
        let today, tomorrow;
        try {
            today = DateTime.now().setZone(CONFIG.TIMEZONE).startOf('day');
            tomorrow = today.plus({ days: 1 });
        } catch (error) {
            console.error('Error setting timezone for tasks:', error);
            today = DateTime.now().startOf('day');
            tomorrow = today.plus({ days: 1 });
        }
        
        // Build HTML
        let html = '';
        
        tasks.forEach(task => {
            const isCompleted = task.status === 'completed';
            let dueDate = null;
            
            if (task.due) {
                try {
                    dueDate = DateTime.fromISO(task.due).setZone(CONFIG.TIMEZONE);
                } catch (error) {
                    console.error('Error parsing task due date:', error);
                    dueDate = new Date(task.due);
                }
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
            
            html += `
                <div class="task-item ${isCompleted ? 'completed' : ''}">
                    <input type="checkbox" class="task-checkbox" ${isCompleted ? 'checked' : ''} disabled>
                    <div class="task-text">
                        <div class="task-title">${task.title || 'Untitled Task'}</div>
                        ${dueStr ? `<div class="task-due">${dueStr}</div>` : ''}
                    </div>
                </div>
            `;
        });
        
        tasksContent.innerHTML = html;
    } catch (error) {
        console.error('Error displaying tasks:', error);
        showError('tasks-section', 'Tasks Display Error', 'Failed to display tasks due to an error.');
    }
}

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