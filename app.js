// Complete app.js with Fee Management System, Results/Leaderboard, and Announcements/Notice Board

// API Service Class
class ApiService {
    constructor() {
        this.baseURL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:5000/api'
            : 'https://eduplatform-backend-k9fr.onrender.com/api';
        this.token = localStorage.getItem('authToken');
        console.log('ðŸ”§ API Service initialized with base URL:', this.baseURL);
    }

    setAuthToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    clearAuthToken() {
        this.token = null;
        localStorage.removeItem('authToken');
    }

    getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    async makeRequest(endpoint, options = {}) {
        try {
            const url = `${this.baseURL}${endpoint}`;
            const config = {
                headers: this.getAuthHeaders(),
                ...options
            };
            
            console.log('ðŸ“¡ Making request to:', url);
            const response = await fetch(url, config);
            
            if (!response.ok) {
                let errorMessage = 'Request failed';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('âŒ API Request Error:', error);
            throw error;
        }
    }

    // Authentication methods
    async login(email, password) {
        return this.makeRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }

    async register(userData) {
        return this.makeRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    // User methods
    async getUserProfile() {
        return this.makeRequest('/user/profile');
    }

    async updateUserProfile(profileData) {
        return this.makeRequest('/user/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    }

    async uploadProfileImage(formData) {
        const headers = {};
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        const response = await fetch(`${this.baseURL}/user/profile/image`, {
            method: 'POST',
            headers,
            body: formData
        });

        if (!response.ok) {
            let errorMessage = 'Failed to upload profile image';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (e) {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }

        return await response.json();
    }

    async uploadStudentProfileImage(studentId, formData) {
        const headers = {};
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(`${this.baseURL}/students/${studentId}/profile/image`, {
            method: 'POST',
            headers,
            body: formData
        });

        if (!response.ok) {
            let errorMessage = 'Failed to upload student profile image';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (e) {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }

        return await response.json();
    }

    async updateStudentProfile(studentId, profileData) {
        return this.makeRequest(`/students/${studentId}/profile`, {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    }

    // Dashboard methods
    async getDashboardStats() {
        return this.makeRequest('/dashboard/stats');
    }

    // Resource methods
    async getResources(type = '', search = '') {
        const params = new URLSearchParams();
        if (type) params.append('type', type);
        if (search) params.append('search', search);
        const query = params.toString() ? `?${params.toString()}` : '';
        return this.makeRequest(`/resources${query}`);
    }

    async createResource(formData) {
        const headers = {};
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(`${this.baseURL}/resources`, {
            method: 'POST',
            headers,
            body: formData
        });

        if (!response.ok) {
            let errorMessage = 'Failed to create resource';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (e) {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }

        return await response.json();
    }

    async deleteResource(id) {
        return this.makeRequest(`/resources/${id}`, {
            method: 'DELETE'
        });
    }

    // Fixed download resource method
    async downloadResource(id) {
        const token = this.token;
        if (!token) {
            throw new Error('Please login to download this resource');
        }

        try {
            // First get resource details to get the filename
            const resource = await this.makeRequest(`/resources/${id}`);
            
            const downloadUrl = `${this.baseURL}/resources/${id}/download`;
            console.log('ðŸ”— Download URL:', downloadUrl);
            
            const response = await fetch(downloadUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('âŒ Download response:', response.status, errorText);
                throw new Error(`Download failed: ${response.status} - ${response.statusText}`);
            }

            // Get filename from response headers or use resource filename
            let fileName = resource.fileName || 'downloaded_file';
            const disposition = response.headers.get('content-disposition');
            if (disposition && disposition.includes('filename=')) {
                const filenameMatch = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (filenameMatch && filenameMatch[1]) {
                    fileName = filenameMatch[1].replace(/['"]/g, '');
                }
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();

            // Cleanup
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            console.log('âœ… File downloaded successfully:', fileName);
        } catch (error) {
            console.error('âŒ Download error:', error);
            throw new Error(`Failed to download file: ${error.message}`);
        }
    }

    // Get single resource (needed for download)
    async getResource(id) {
        return this.makeRequest(`/resources/${id}`);
    }

    // Schedule methods
    async getSchedules() {
        return this.makeRequest('/schedules');
    }

    async createSchedule(scheduleData) {
        return this.makeRequest('/schedules', {
            method: 'POST',
            body: JSON.stringify(scheduleData)
        });
    }

    async deleteSchedule(id) {
        return this.makeRequest(`/schedules/${id}`, {
            method: 'DELETE'
        });
    }

    // Student management methods
    async getStudents() {
        return this.makeRequest('/students');
    }

    async createStudent(studentData) {
        return this.makeRequest('/students', {
            method: 'POST',
            body: JSON.stringify(studentData)
        });
    }

    async deleteStudent(id) {
        return this.makeRequest(`/students/${id}`, {
            method: 'DELETE'
        });
    }

    // Fee management methods
    async getStudentFees() {
        return this.makeRequest('/fees');
    }

    async updateFeeStatus(feeData) {
        return this.makeRequest('/fees', {
            method: 'POST',
            body: JSON.stringify(feeData)
        });
    }

    async getStudentFeeStatus() {
        return this.makeRequest('/fees/status');
    }

    async getFeeStats() {
        return this.makeRequest('/fees/stats');
    }

    // Results management methods
    async getResults() {
        return this.makeRequest('/results');
    }

    async createResult(resultData) {
        return this.makeRequest('/results', {
            method: 'POST',
            body: JSON.stringify(resultData)
        });
    }

    async updateResult(id, resultData) {
        return this.makeRequest(`/results/${id}`, {
            method: 'PUT',
            body: JSON.stringify(resultData)
        });
    }

    async deleteResult(id) {
        return this.makeRequest(`/results/${id}`, {
            method: 'DELETE'
        });
    }

    async getLeaderboard() {
        return this.makeRequest('/results/leaderboard');
    }

    // NEW: Announcements methods
    async getAnnouncements() {
        return this.makeRequest('/announcements');
    }

    async createAnnouncement(announcementData) {
        return this.makeRequest('/announcements', {
            method: 'POST',
            body: JSON.stringify(announcementData)
        });
    }

    async updateAnnouncement(id, announcementData) {
        return this.makeRequest(`/announcements/${id}`, {
            method: 'PUT',
            body: JSON.stringify(announcementData)
        });
    }

    async deleteAnnouncement(id) {
        return this.makeRequest(`/announcements/${id}`, {
            method: 'DELETE'
        });
    }

    async markAnnouncementAsRead(id) {
        return this.makeRequest(`/announcements/${id}/read`, {
            method: 'POST'
        });
    }

    async getUnreadAnnouncementsCount() {
        return this.makeRequest('/announcements/unread/count');
    }
}

// Main Education App Class
class EducationApp {
    constructor() {
        this.api = new ApiService();
        this.currentUser = null;
        this.currentSection = 'dashboard';
        this.selectedStudentId = null;
        this.announcementPollInterval = null;
        this.init();
    }

    async init() {
        console.log('ðŸš€ Initializing Education App...');
        
        // Initialize theme first
        this.initializeTheme();

        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                this.currentUser = await this.api.getUserProfile();
                console.log('âœ… Auto-login successful:', this.currentUser.name);
                this.showMainApp();
                this.startAnnouncementPolling(); // Start polling for new announcements
            } catch (error) {
                console.error('âŒ Auto-login failed:', error);
                this.api.clearAuthToken();
                this.showLogin();
            }
        } else {
            this.showLogin();
        }

        this.bindEvents();
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);

        // Bind theme toggle events
        const themeToggle = document.getElementById('themeToggle');
        const floatingThemeToggle = document.getElementById('floatingThemeToggle');
        
        if (themeToggle) {
            themeToggle.removeEventListener('click', this.toggleTheme);
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        
        if (floatingThemeToggle) {
            floatingThemeToggle.removeEventListener('click', this.toggleTheme);
            floatingThemeToggle.addEventListener('click', () => this.toggleTheme());
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        // Add animation class to theme toggles
        const themeToggles = document.querySelectorAll('#themeToggle, #floatingThemeToggle');
        themeToggles.forEach(toggle => {
            toggle.classList.add('animating');
            setTimeout(() => toggle.classList.remove('animating'), 500);
        });

        // Apply new theme
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeIcon(newTheme);
        
        console.log('ðŸŽ¨ Theme changed to:', newTheme);
        
        // Show notification about theme change
        this.showNotification(`Switched to ${newTheme} mode`, 'info');
    }

    updateThemeIcon(theme) {
        const themeToggles = document.querySelectorAll('#themeToggle i, #floatingThemeToggle i');
        themeToggles.forEach(icon => {
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        });
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => {
            notification.classList.add('removing');
            setTimeout(() => notification.remove(), 300);
        });

        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;

        const iconMap = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        
        const icon = iconMap[type] || iconMap.info;

        notification.innerHTML = `
            <div class="notification__content">
                <i class="fas fa-${icon}"></i>
                <span>${message}</span>
            </div>
            <button class="notification__close">
                <i class="fas fa-times"></i>
            </button>
        `;

        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);

        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.classList.add('removing');
            setTimeout(() => notification.remove(), 300);
        }, 5000);

        // Manual close
        notification.querySelector('.notification__close').addEventListener('click', () => {
            notification.classList.add('removing');
            setTimeout(() => notification.remove(), 300);
        });
    }

    async startAnnouncementPolling() {
        if (this.currentUser && this.currentUser.role === 'student') {
            // Poll every 30 seconds for new announcements
            this.announcementPollInterval = setInterval(async () => {
                try {
                    const response = await this.api.getUnreadAnnouncementsCount();
                    this.updateAnnouncementBadge(response.count);
                } catch (error) {
                    console.error('Error polling announcements:', error);
                }
            }, 30000);

            // Initial check
            try {
                const response = await this.api.getUnreadAnnouncementsCount();
                this.updateAnnouncementBadge(response.count);
            } catch (error) {
                console.error('Error getting initial announcement count:', error);
            }
        }
    }

    updateAnnouncementBadge(count) {
        const noticeMenuItem = document.querySelector('[data-section="notices"]');
        if (noticeMenuItem) {
            // Remove existing badge
            const existingBadge = noticeMenuItem.querySelector('.notification-badge');
            if (existingBadge) {
                existingBadge.remove();
            }

            // Add new badge if count > 0
            if (count > 0) {
                const badge = document.createElement('span');
                badge.className = 'notification-badge';
                badge.textContent = count > 99 ? '99+' : count;
                noticeMenuItem.appendChild(badge);
            }
        }
    }

    bindEvents() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.handleLogout.bind(this));
        }

        // Sidebar navigation
        document.addEventListener('click', (e) => {
            const sidebarItem = e.target.closest('.sidebar-item');
            if (sidebarItem) {
                e.preventDefault();
                const section = sidebarItem.dataset.section;
                if (section) {
                    this.navigateToSection(section);
                }
            }
        });

        // Mobile sidebar toggle
        const mobileSidebarToggle = document.getElementById('mobileSidebarToggle');
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');

        if (mobileSidebarToggle) {
            mobileSidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });
        }

        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.remove('open');
            });
        }

        // Modal close handlers
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal') || e.target.closest('.close-modal')) {
                this.closeModal(e.target.closest('.modal') || e.target);
            }
        });

        // ESC key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal.show');
                if (openModal) {
                    this.closeModal(openModal);
                }
            }
        });

        // Resource form
        const resourceForm = document.getElementById('resourceForm');
        if (resourceForm) {
            resourceForm.addEventListener('submit', this.handleResourceUpload.bind(this));
        }

        // Add Student form
        const addStudentForm = document.getElementById('addStudentForm');
        if (addStudentForm) {
            addStudentForm.addEventListener('submit', this.handleAddStudent.bind(this));
        }

        // Student edit form
        const studentEditForm = document.getElementById('studentEditForm');
        if (studentEditForm) {
            studentEditForm.addEventListener('submit', this.handleStudentEdit.bind(this));
        }

        // Student image form
        const studentImageForm = document.getElementById('studentImageForm');
        if (studentImageForm) {
            studentImageForm.addEventListener('submit', this.handleStudentImageUpload.bind(this));
        }

        // Fee payment form
        const feePaymentForm = document.getElementById('feePaymentForm');
        if (feePaymentForm) {
            feePaymentForm.addEventListener('submit', this.handleFeePayment.bind(this));
        }

        // Result form
        const resultForm = document.getElementById('resultForm');
        if (resultForm) {
            resultForm.addEventListener('submit', this.handleResultSubmit.bind(this));
        }

        // Announcement form
        const announcementForm = document.getElementById('announcementForm');
        if (announcementForm) {
            announcementForm.addEventListener('submit', this.handleAnnouncementSubmit.bind(this));
        }

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.handleSearch(e.target.value);
                }, 300);
            });
        }

        // Profile image upload
        const profileImageContainer = document.querySelector('.profile-image-container');
        if (profileImageContainer) {
            profileImageContainer.addEventListener('click', () => {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = 'image/*';
                fileInput.addEventListener('change', this.handleProfileImageUpload.bind(this));
                fileInput.click();
            });
        }

        // Profile form
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', this.handleProfileUpdate.bind(this));
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const loginBtn = document.getElementById('loginBtn');
        const loginError = document.getElementById('loginError');

        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
        loginError.style.display = 'none';

        try {
            const response = await this.api.login(email, password);
            this.api.setAuthToken(response.token);
            this.currentUser = response.user;
            
            this.showNotification('Login successful! Welcome back.', 'success');
            this.showMainApp();
            this.startAnnouncementPolling(); // Start polling after login
        } catch (error) {
            console.error('Login error:', error);
            loginError.textContent = error.message;
            loginError.style.display = 'block';
            this.showNotification('Login failed. Please try again.', 'error');
        } finally {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
        }
    }

    handleLogout() {
        if (this.announcementPollInterval) {
            clearInterval(this.announcementPollInterval);
            this.announcementPollInterval = null;
        }
        
        this.api.clearAuthToken();
        this.currentUser = null;
        this.showLogin();
        this.showNotification('Logged out successfully.', 'info');
    }

    showLogin() {
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('mainApp').classList.add('hidden');
        
        // Clear form
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
        document.getElementById('loginError').style.display = 'none';
        
        // Remove user role from body
        document.body.removeAttribute('data-user-role');
    }

    showMainApp() {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        
        // Set user role on body for CSS targeting
        document.body.setAttribute('data-user-role', this.currentUser.role);
        
        this.updateUserInfo();
        this.navigateToSection('dashboard');
    }

    updateUserInfo() {
        const userAvatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');
        const userInfo = document.getElementById('userInfo');

        if (userAvatar && this.currentUser.profileImage) {
            userAvatar.src = this.currentUser.profileImage.startsWith('http') 
                ? this.currentUser.profileImage 
                : `${this.api.baseURL.replace('/api', '')}/${this.currentUser.profileImage}`;
        }

        if (userName) {
            userName.textContent = this.currentUser.name;
        }

        if (userInfo) {
            userInfo.textContent = this.currentUser.role.charAt(0).toUpperCase() + this.currentUser.role.slice(1);
        }
    }

    async navigateToSection(section) {
        if (this.currentSection === section) return;

        this.currentSection = section;
        
        // Update active sidebar item
        document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
        const activeItem = document.querySelector(`[data-section="${section}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }

        // Update page title
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = this.getSectionTitle(section);
        }

        // Close mobile sidebar
        document.getElementById('sidebar').classList.remove('open');

        try {
            await this.loadSection(section);
        } catch (error) {
            console.error(`Error loading section ${section}:`, error);
            this.showError('Failed to load section content');
        }
    }

    getSectionTitle(section) {
        const titles = {
            dashboard: 'Dashboard',
            notes: 'Notes',
            questions: 'Questions',
            books: 'Books',
            schedule: 'Schedule',
            students: 'Students',
            fees: 'Fee Management',
            results: 'Results & Leaderboard',
            announcements: 'Announcements',
            notices: 'Notice Board',
            profile: 'Profile',
            settings: 'Settings'
        };
        return titles[section] || 'Unknown Section';
    }

    async loadSection(section) {
        const contentArea = document.getElementById('contentArea');
        
        // Show loading state
        contentArea.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <p>Loading content...</p>
            </div>
        `;

        try {
            switch (section) {
                case 'dashboard':
                    await this.loadDashboard();
                    break;
                case 'notes':
                    await this.loadResources('note');
                    break;
                case 'questions':
                    await this.loadResources('question');
                    break;
                case 'books':
                    await this.loadResources('book');
                    break;
                case 'schedule':
                    await this.loadSchedule();
                    break;
                case 'students':
                    await this.loadStudents();
                    break;
                case 'fees':
                    await this.loadFees();
                    break;
                case 'results':
                    await this.loadResults();
                    break;
                case 'announcements':
                    await this.loadAnnouncements();
                    break;
                case 'notices':
                    await this.loadNotices();
                    break;
                case 'profile':
                    await this.loadProfile();
                    break;
                case 'settings':
                    await this.loadSettings();
                    break;
                default:
                    this.showError('Section not found');
            }
        } catch (error) {
            console.error('Section loading error:', error);
            this.showError(error.message);
        }
    }

    showError(message) {
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h2>Error</h2>
                <p>${message}</p>
            </div>
        `;
    }

    async loadDashboard() {
        try {
            const stats = await this.api.getDashboardStats();
            let feeData = null;
            
            // Get fee data for students
            if (this.currentUser.role === 'student') {
                try {
                    feeData = await this.api.getStudentFeeStatus();
                } catch (error) {
                    console.error('Error loading fee data:', error);
                }
            }

            this.renderDashboard(stats, feeData);
        } catch (error) {
            console.error('Dashboard loading error:', error);
            this.showError('Unable to load dashboard data');
        }
    }

    renderDashboard(stats, feeData = null) {
        const contentArea = document.getElementById('contentArea');
        
        let feeAlerts = '';
        
        // Generate fee alerts for students
        if (this.currentUser.role === 'student' && feeData) {
            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth(); // 0-based
            const months = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
            
            const overdueFees = feeData.filter(fee => fee.status === 'overdue');
            const pendingFees = feeData.filter(fee => fee.status === 'pending');
            
            if (overdueFees.length > 0) {
                feeAlerts += `
                    <div class="fee-alert fee-alert--danger">
                        <i class="fas fa-exclamation-triangle"></i>
                        <div>
                            <h3>Overdue Fee Payment</h3>
                            <p>You have ${overdueFees.length} overdue fee(s). Please pay immediately to avoid account suspension.</p>
                        </div>
                    </div>
                `;
            } else if (pendingFees.length > 0) {
                feeAlerts += `
                    <div class="fee-alert fee-alert--warning">
                        <i class="fas fa-clock"></i>
                        <div>
                            <h3>Pending Fee Payment</h3>
                            <p>You have ${pendingFees.length} pending fee payment(s). Please pay on time to continue your classes.</p>
                        </div>
                    </div>
                `;
            } else {
                feeAlerts += `
                    <div class="fee-alert fee-alert--success">
                        <i class="fas fa-check-circle"></i>
                        <div>
                            <h3>All Fees Paid</h3>
                            <p>Great! All your fees are up to date. Keep up the good work!</p>
                        </div>
                    </div>
                `;
            }
        }

        let content = `
            <div class="dashboard-header">
                <h1>Welcome back, ${this.currentUser.name}!</h1>
                <p>${this.currentUser.role === 'teacher' 
                    ? 'Here\'s an overview of your teaching platform.' 
                    : 'Welcome back! Continue your learning journey.'}</p>
            </div>

            ${feeAlerts}

            <div class="stats-grid">
        `;

        if (this.currentUser.role === 'teacher') {
            content += `
                <div class="stat-card">
                    <div class="stat-icon notes-icon">
                        <i class="fas fa-sticky-note"></i>
                    </div>
                    <div class="stat-content">
                        <h3>${stats.notes || 0}</h3>
                        <p>Total Notes</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon questions-icon">
                        <i class="fas fa-question-circle"></i>
                    </div>
                    <div class="stat-content">
                        <h3>${stats.questions || 0}</h3>
                        <p>Questions</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon books-icon">
                        <i class="fas fa-book"></i>
                    </div>
                    <div class="stat-content">
                        <h3>${stats.books || 0}</h3>
                        <p>Books</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon students-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="stat-content">
                        <h3>${stats.students || 0}</h3>
                        <p>Students</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon schedule-icon">
                        <i class="fas fa-calendar-alt"></i>
                    </div>
                    <div class="stat-content">
                        <h3>${stats.schedules || 0}</h3>
                        <p>Upcoming Classes</p>
                    </div>
                </div>
            `;
        } else {
            content += `
                <div class="stat-card">
                    <div class="stat-icon resources-icon">
                        <i class="fas fa-book-open"></i>
                    </div>
                    <div class="stat-content">
                        <h3>${stats.totalResources || 0}</h3>
                        <p>Total Resources</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon schedule-icon">
                        <i class="fas fa-calendar-alt"></i>
                    </div>
                    <div class="stat-content">
                        <h3>${stats.upcomingSchedules || 0}</h3>
                        <p>Upcoming Classes</p>
                    </div>
                </div>
            `;

            if (feeData) {
                const paidFees = feeData.filter(fee => fee.status === 'paid').length;
                const pendingFees = feeData.filter(fee => fee.status === 'pending' || fee.status === 'overdue').length;
                
                content += `
                    <div class="stat-card">
                        <div class="stat-icon notes-icon">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="stat-content">
                            <h3>${paidFees}</h3>
                            <p>Fees Paid</p>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon students-icon">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div class="stat-content">
                            <h3>${pendingFees}</h3>
                            <p>Pending Fees</p>
                        </div>
                    </div>
                `;
            }
        }

        content += `
            </div>
        `;

        // Quick actions for teachers
        if (this.currentUser.role === 'teacher') {
            content += `
                <div class="quick-actions">
                    <h2>Quick Actions</h2>
                    <div class="action-buttons">
                        <button class="btn btn--primary" onclick="app.showResourceModal('note')">
                            <i class="fas fa-plus"></i> Add Note
                        </button>
                        <button class="btn btn--primary" onclick="app.showResourceModal('question')">
                            <i class="fas fa-plus"></i> Add Question
                        </button>
                        <button class="btn btn--primary" onclick="app.showResourceModal('book')">
                            <i class="fas fa-plus"></i> Add Book
                        </button>
                        <button class="btn btn--primary" onclick="app.showAddStudentModal()">
                            <i class="fas fa-user-plus"></i> Add Student
                        </button>
                        <button class="btn btn--primary" onclick="app.showAnnouncementModal()">
                            <i class="fas fa-bullhorn"></i> Create Announcement
                        </button>
                    </div>
                </div>
            `;
        }

        contentArea.innerHTML = content;
    }

    async loadResources(type) {
        try {
            const resources = await this.api.getResources(type);
            this.renderResources(resources, type);
        } catch (error) {
            this.showError('Unable to load resources. Please try again.');
        }
    }

    renderResources(resources, type) {
        const contentArea = document.getElementById('contentArea');
        const typeTitle = type.charAt(0).toUpperCase() + type.slice(1) + 's';

        let content = `
            <div class="section-header">
                <h1>${typeTitle}</h1>
        `;

        if (this.currentUser.role === 'teacher') {
            content += `
                <button class="btn btn--primary" onclick="app.showResourceModal('${type}')">
                    <i class="fas fa-plus"></i> Add ${typeTitle.slice(0, -1)}
                </button>
            `;
        }

        content += `</div>`;

        if (resources.length === 0) {
            content += `
                <div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <h3>No ${typeTitle} Available</h3>
                    <p>There are no ${typeTitle.toLowerCase()} available at the moment.${this.currentUser.role === 'teacher' ? ` <button class="btn btn--primary" onclick="app.showResourceModal('${type}')">Add ${typeTitle.slice(0, -1)}</button>` : ''}</p>
                </div>
            `;
        } else {
            content += `<div class="resources-grid">`;
            
            resources.forEach(resource => {
                const fileSize = this.formatFileSize(resource.fileSize);
                const uploadDate = new Date(resource.createdAt).toLocaleDateString();
                
                content += `
                    <div class="resource-card">
                        <div class="resource-header">
                            <h3>${resource.title}</h3>
                            <div class="resource-actions">
                                <button class="btn btn--sm btn--secondary" onclick="app.downloadResource('${resource._id}')">
                                    <i class="fas fa-download"></i>
                                </button>
                `;
                
                if (this.currentUser.role === 'teacher') {
                    content += `
                                <button class="btn btn--sm btn--danger" onclick="app.deleteResource('${resource._id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                    `;
                }
                
                content += `
                            </div>
                        </div>
                        
                        ${resource.description ? `<p class="resource-description">${resource.description}</p>` : ''}
                        
                        <div class="resource-meta">
                            <span><i class="fas fa-file"></i> ${resource.fileName}</span>
                            <span><i class="fas fa-weight-hanging"></i> ${fileSize}</span>
                            <span><i class="fas fa-calendar"></i> ${uploadDate}</span>
                            <span><i class="fas fa-user"></i> ${resource.uploadedBy.name}</span>
                        </div>
                        
                        <div class="resource-footer">
                            <button class="btn btn--primary" onclick="app.downloadResource('${resource._id}')">
                                <i class="fas fa-download"></i> Download
                            </button>
                        </div>
                    </div>
                `;
            });
            
            content += `</div>`;
        }

        contentArea.innerHTML = content;
    }

    async loadSchedule() {
        try {
            const schedules = await this.api.getSchedules();
            this.renderSchedule(schedules);
        } catch (error) {
            this.showError('Unable to load schedules. Please try again.');
        }
    }

    renderSchedule(schedules) {
        const contentArea = document.getElementById('contentArea');

        let content = `
            <div class="section-header">
                <h1>Schedule</h1>
            </div>
        `;

        if (this.currentUser.role === 'teacher') {
            content += `
                <div class="schedule-form-section">
                    <h2>Add New Class</h2>
                    <form id="scheduleForm" class="schedule-form">
                        <div class="form-grid">
                            <div class="form-group">
                                <label class="form-label">Title</label>
                                <input type="text" name="title" class="form-control" required>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Date</label>
                                <input type="date" name="date" class="form-control" required>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Time</label>
                                <input type="time" name="time" class="form-control" required>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Meeting Link</label>
                                <input type="url" name="meetingLink" class="form-control" placeholder="https://zoom.us/...">
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Password</label>
                                <input type="text" name="password" class="form-control" placeholder="Meeting password">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Description</label>
                            <textarea name="description" class="form-control" rows="3" placeholder="Class description..."></textarea>
                        </div>
                        
                        <button type="submit" class="btn btn--primary">
                            <i class="fas fa-plus"></i> Add Class
                        </button>
                    </form>
                </div>
            `;
        }

        if (schedules.length === 0) {
            content += `
                <div class="empty-state">
                    <i class="fas fa-calendar"></i>
                    <h3>No Scheduled Classes</h3>
                    <p>There are no scheduled classes at the moment.</p>
                </div>
            `;
        } else {
            content += `<div class="schedules-grid">`;
            
            schedules.forEach(schedule => {
                const scheduleDate = new Date(schedule.date + 'T' + schedule.time);
                const isUpcoming = scheduleDate > new Date();
                
                content += `
                    <div class="schedule-card ${isUpcoming ? 'upcoming' : 'past'}">
                        <div class="schedule-header">
                            <h3>${schedule.title}</h3>
                `;
                
                if (this.currentUser.role === 'teacher') {
                    content += `
                            <button class="btn btn--sm btn--danger" onclick="app.deleteSchedule('${schedule._id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                    `;
                }
                
                content += `
                        </div>
                        
                        ${schedule.description ? `<p class="schedule-description">${schedule.description}</p>` : ''}
                        
                        <div class="schedule-meta">
                            <span><i class="fas fa-calendar"></i> ${new Date(schedule.date).toLocaleDateString()}</span>
                            <span><i class="fas fa-clock"></i> ${schedule.time}</span>
                            <span><i class="fas fa-user"></i> ${schedule.createdBy.name}</span>
                        </div>
                        
                        <div class="schedule-footer">
                `;
                
                if (schedule.meetingLink) {
                    content += `
                            <a href="${schedule.meetingLink}" target="_blank" class="btn btn--primary">
                                <i class="fas fa-video"></i> Join Meeting
                            </a>
                    `;
                }
                
                if (schedule.password) {
                    content += `
                            <div class="meeting-password">
                                <i class="fas fa-lock"></i> Password: <strong>${schedule.password}</strong>
                            </div>
                    `;
                }
                
                content += `
                        </div>
                    </div>
                `;
            });
            
            content += `</div>`;
        }

        contentArea.innerHTML = content;

        // Bind schedule form if teacher
        if (this.currentUser.role === 'teacher') {
            const scheduleForm = document.getElementById('scheduleForm');
            scheduleForm.addEventListener('submit', this.handleScheduleSubmit.bind(this));
        }
    }

    async loadStudents() {
        if (this.currentUser.role !== 'teacher') {
            this.showError('Access denied. Teachers only.');
            return;
        }

        try {
            const students = await this.api.getStudents();
            this.renderStudents(students);
        } catch (error) {
            this.showError('Unable to load students data. Please try again.');
        }
    }

    renderStudents(students) {
        const contentArea = document.getElementById('contentArea');

        let content = `
            <div class="section-header">
                <h1>Students Management</h1>
                <button class="btn btn--primary" onclick="app.showAddStudentModal()">
                    <i class="fas fa-user-plus"></i> Add Student
                </button>
            </div>
        `;

        if (students.length === 0) {
            content += `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3>No Students</h3>
                    <p>No students have been added yet. <button class="btn btn--primary" onclick="app.showAddStudentModal()"><i class="fas fa-user-plus"></i> Add your first student</button></p>
                </div>
            `;
        } else {
            content += `
                <div class="loading-state" id="studentsLoading">
                    <div class="loading-spinner">
                        <i class="fas fa-spinner fa-spin"></i>
                    </div>
                    <p>Loading students...</p>
                </div>
                
                <div class="students-grid" id="studentsGrid" style="display: none;">
            `;
            
            students.forEach(student => {
                const joinDate = new Date(student.createdAt).toLocaleDateString();
                const profileImage = student.profileImage 
                    ? (student.profileImage.startsWith('http') 
                        ? student.profileImage 
                        : `${this.api.baseURL.replace('/api', '')}/${student.profileImage}`)
                    : 'https://via.placeholder.com/60';

                content += `
                    <div class="student-card">
                        <div class="student-header">
                            <img src="${profileImage}" alt="${student.name}" onerror="this.src='https://via.placeholder.com/60'">
                            <div class="student-info">
                                <h3>${student.name}</h3>
                                <p>${student.email}</p>${student.bio ? `<small>${student.bio}</small>` : ''}
                            </div>
                            <div class="student-actions">
                                <button class="btn btn--sm btn--secondary" onclick="app.showStudentImageModal('${student._id}')" title="Update Photo">
                                    <i class="fas fa-camera"></i>
                                </button>
                                <button class="btn btn--sm btn--secondary" onclick="app.showEditStudentModal('${student._id}')" title="Edit Profile">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn--sm btn--danger" onclick="app.deleteStudent('${student._id}')" title="Delete Student">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="student-meta">
                            <span><i class="fas fa-calendar"></i> Joined: ${joinDate}</span>
                            ${student.phone ? `<span><i class="fas fa-phone"></i> ${student.phone}</span>` : ''}
                            ${student.dateOfBirth ? `<span><i class="fas fa-birthday-cake"></i> ${new Date(student.dateOfBirth).toLocaleDateString()}</span>` : ''}
                        </div>
                    </div>
                `;
            });
            
            content += `</div>`;
        }

        contentArea.innerHTML = content;

        // Show students grid after a short delay
        if (students.length > 0) {
            setTimeout(() => {
                document.getElementById('studentsLoading').style.display = 'none';
                document.getElementById('studentsGrid').style.display = 'grid';
            }, 500);
        }
    }

    async loadFees() {
        if (this.currentUser.role === 'teacher') {
            await this.loadTeacherFees();
        } else {
            await this.loadStudentFees();
        }
    }

    async loadTeacherFees() {
        try {
            const studentsWithFees = await this.api.getStudentFees();
            const feeStats = await this.api.getFeeStats();
            this.renderTeacherFees(studentsWithFees, feeStats);
        } catch (error) {
            this.showError('Unable to load fee data. Please try again.');
        }
    }

    async loadStudentFees() {
        try {
            const fees = await this.api.getStudentFeeStatus();
            this.renderStudentFees(fees);
        } catch (error) {
            this.showError('Unable to load your fee data. Please try again.');
        }
    }

    renderTeacherFees(studentsWithFees, feeStats) {
        const contentArea = document.getElementById('contentArea');

        let content = `
            <div class="section-header">
                <h1>Fee Management</h1>
            </div>

            <div class="loading-state" id="feesLoading">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <p>Loading fee management...</p>
            </div>

            <div id="feesContent" style="display: none;">
        `;

        if (studentsWithFees.length === 0) {
            content += `
                <div class="empty-state">
                    <i class="fas fa-money-check-alt"></i>
                    <h3>No Fee Records</h3>
                    <p>No fee records found. Add students and manage their fees.</p>
                </div>
            `;
        } else {
            // Fee Statistics
            content += `
                <div class="fee-stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon notes-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="stat-content">
                            <h3>${feeStats.totalStudents || 0}</h3>
                            <p>Total Students</p>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon questions-icon">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="stat-content">
                            <h3>${feeStats.paidStudents || 0}</h3>
                            <p>Students with Paid Fees</p>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon books-icon">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div class="stat-content">
                            <h3>${feeStats.pendingStudents || 0}</h3>
                            <p>Students with Pending Fees</p>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon students-icon">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div class="stat-content">
                            <h3>${feeStats.overdueStudents || 0}</h3>
                            <p>Students with Overdue Fees</p>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon resources-icon">
                            <i class="fas fa-rupee-sign"></i>
                        </div>
                        <div class="stat-content">
                            <h3>â‚¹${feeStats.totalAmount || 0}</h3>
                            <p>Total Fee Collection</p>
                        </div>
                    </div>
                </div>

                <div class="students-grid">
            `;

            studentsWithFees.forEach(student => {
                const profileImage = student.profileImage 
                    ? (student.profileImage.startsWith('http') 
                        ? student.profileImage 
                        : `${this.api.baseURL.replace('/api', '')}/${student.profileImage}`)
                    : 'https://via.placeholder.com/60';

                // Get latest fee status
                const latestFee = student.fees.length > 0 ? student.fees[0] : null;
                const feeStatus = latestFee ? latestFee.status : 'unknown';

                content += `
                    <div class="student-card">
                        <div class="student-header">
                            <img src="${profileImage}" alt="${student.name}" onerror="this.src='https://via.placeholder.com/60'">
                            <div class="student-info">
                                <h3>${student.name}</h3>
                                <p>${student.email}</p>
                            </div>
                            <div class="student-actions">
                                <button class="btn btn--sm btn--primary" onclick="app.showFeePaymentModal('${student._id}', '${student.name}')">
                                    <i class="fas fa-money-check-alt"></i> Manage Fee
                                </button>
                            </div>
                        </div>
                        
                        <div class="fee-status-section">
                            <span class="status status--${feeStatus}">${feeStatus.charAt(0).toUpperCase() + feeStatus.slice(1)}</span>
                        </div>

                        <div class="student-fees-list">
                `;

                if (student.fees.length > 0) {
                    student.fees.slice(0, 3).forEach(fee => {
                        content += `
                            <div class="fee-record">
                                <span>${fee.month} ${fee.year}</span>
                                <span class="status status--${fee.status}">â‚¹${fee.amount}</span>
                            </div>
                        `;
                    });
                } else {
                    content += '<p class="text-muted">No fee records</p>';
                }

                content += `
                        </div>
                    </div>
                `;
            });

            content += `</div>`;
        }

        content += `</div>`;
        contentArea.innerHTML = content;

        // Show content after loading
        setTimeout(() => {
            document.getElementById('feesLoading').style.display = 'none';
            document.getElementById('feesContent').style.display = 'block';
        }, 500);
    }

    renderStudentFees(fees) {
        const contentArea = document.getElementById('contentArea');

        let content = `
            <div class="section-header">
                <h1>My Fee Status</h1>
            </div>
        `;

        if (fees.length === 0) {
            content += `
                <div class="empty-state">
                    <i class="fas fa-money-check-alt"></i>
                    <h3>No Fee Records</h3>
                    <p>No fee records found for your account.</p>
                </div>
            `;
        } else {
            content += `<div class="student-fees-list">`;
            
            fees.forEach(fee => {
                const paymentDate = fee.paymentDate 
                    ? new Date(fee.paymentDate).toLocaleDateString() 
                    : 'Not paid';

                content += `
                    <div class="fee-record-card">
                        <div class="fee-header">
                            <h3>${fee.month} ${fee.year}</h3>
                            <span class="status status--${fee.status}">${fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}</span>
                        </div>
                        
                        <div class="fee-details">
                            <div class="fee-amount">â‚¹${fee.amount}</div>
                            <div class="fee-meta">
                                <span><i class="fas fa-calendar"></i> Payment Date: ${paymentDate}</span>
                                ${fee.notes ? `<span><i class="fas fa-note-sticky"></i> ${fee.notes}</span>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            });
            
            content += `</div>`;
        }

        contentArea.innerHTML = content;
    }

    async loadResults() {
        try {
            const results = await this.api.getResults();
            let leaderboard = [];
            
            if (this.currentUser.role === 'teacher') {
                leaderboard = await this.api.getLeaderboard();
            }
            
            this.renderResults(results, leaderboard);
        } catch (error) {
            this.showError('Unable to load results. Please try again.');
        }
    }

    renderResults(results, leaderboard = []) {
        const contentArea = document.getElementById('contentArea');

        let content = `
            <div class="section-header">
                <h1>Results & Performance</h1>
        `;

        if (this.currentUser.role === 'teacher') {
            content += `
                <button class="btn btn--primary" onclick="app.showResultModal()">
                    <i class="fas fa-plus"></i> Add Result
                </button>
            `;
        }

        content += `</div>`;

        if (results.length === 0) {
            content += `
                <div class="empty-state">
                    <i class="fas fa-trophy"></i>
                    <h3>No Results Available</h3>
                    <p>No exam results available yet.</p>
                </div>
            `;
        } else {
            content += `<div class="results-grid">`;
            
            results.forEach(result => {
                const examDate = new Date(result.examDate).toLocaleDateString();
                const gradeClass = result.grade.replace('+', '').toLowerCase();
                
                content += `
                    <div class="result-card">
                        <div class="result-header">
                            <div>
                                <h3>${result.examName}</h3>
                                <p>${result.subject} - ${result.class}</p>
                            </div>
                            <div class="result-grade grade-${gradeClass.charAt(0)}">${result.grade}</div>
                        </div>
                        
                        <div class="result-details">
                `;
                
                if (this.currentUser.role === 'teacher') {
                    content += `<p><strong>Student:</strong> ${result.studentId.name}</p>`;
                }
                
                content += `
                        </div>
                        
                        <div class="result-info">
                            <span><i class="fas fa-calendar"></i> ${examDate}</span>
                        </div>
                        
                        <div class="result-score">
                            <div class="score-display">
                                <div class="marks">${result.marksObtained}/${result.totalMarks}</div>
                                <div class="percentage">${result.percentage}%</div>
                            </div>
                        </div>
                        
                        ${result.remarks ? `
                        <div class="result-remarks">
                            <i class="fas fa-comment"></i>
                            <span>${result.remarks}</span>
                        </div>
                        ` : ''}
                `;
                
                if (this.currentUser.role === 'teacher') {
                    content += `
                        <div class="result-actions">
                            <button class="btn btn--sm btn--secondary" onclick="app.editResult('${result._id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn--sm btn--danger" onclick="app.deleteResult('${result._id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                }
                
                content += `</div>`;
            });
            
            content += `</div>`;
        }

        // Add leaderboard for teachers
        if (this.currentUser.role === 'teacher' && leaderboard.length > 0) {
            content += `
                <div class="leaderboard-section">
                    <h2>Class Leaderboard</h2>
                    <div class="leaderboard-grid">
            `;
            
            leaderboard.forEach(student => {
                const profileImage = student.profileImage 
                    ? (student.profileImage.startsWith('http') 
                        ? student.profileImage 
                        : `${this.api.baseURL.replace('/api', '')}/${student.profileImage}`)
                    : 'https://via.placeholder.com/50';

                content += `
                    <div class="leaderboard-card rank-${student.rank <= 3 ? student.rank : 'other'}">
                        <div class="leaderboard-rank">${student.rank}</div>
                        <div class="leaderboard-student">
                            <img src="${profileImage}" alt="${student.name}" onerror="this.src='https://via.placeholder.com/50'">
                            <div class="student-details">
                                <h4>${student.name}</h4>
                                <p>${student.email}</p>
                            </div>
                        </div>
                        <div class="leaderboard-stats">
                            <div class="stat">
                                <span class="stat-value">${student.averagePercentage}%</span>
                                <span class="stat-label">Avg</span>
                            </div>
                            <div class="stat">
                                <span class="stat-value">${student.totalExams}</span>
                                <span class="stat-label">Exams</span>
                            </div>
                            <div class="stat">
                                <span class="stat-value">${student.highestScore}%</span>
                                <span class="stat-label">Best</span>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            content += `</div></div>`;
        }

        contentArea.innerHTML = content;
    }

    async loadAnnouncements() {
        if (this.currentUser.role !== 'teacher') {
            this.showError('Access denied. Teachers only.');
            return;
        }

        try {
            const announcements = await this.api.getAnnouncements();
            this.renderAnnouncements(announcements);
        } catch (error) {
            this.showError('Unable to load announcements. Please try again.');
        }
    }

    renderAnnouncements(announcements) {
        const contentArea = document.getElementById('contentArea');

        let content = `
            <div class="section-header">
                <h1>Announcements</h1>
                <button class="btn btn--primary" onclick="app.showAnnouncementModal()">
                    <i class="fas fa-plus"></i> Create Announcement
                </button>
            </div>
        `;

        if (announcements.length === 0) {
            content += `
                <div class="empty-state">
                    <i class="fas fa-bullhorn"></i>
                    <h3>No Announcements</h3>
                    <p>There are no announcements at the moment.${this.currentUser.role === 'teacher' ? ' Create your first announcement!' : ''}</p>
                </div>
            `;
        } else {
            content += `<div class="announcements-grid">`;
            
            announcements.forEach(announcement => {
                const createdDate = new Date(announcement.createdAt).toLocaleDateString();
                const createdTime = new Date(announcement.createdAt).toLocaleTimeString();
                
                content += `
                    <div class="announcement-card ${announcement.priority === 'high' ? 'announcement-card--urgent' : ''}">
                        <div class="announcement-header">
                            <div class="announcement-title">
                                <h3>${announcement.title} ${announcement.priority === 'high' ? '<i class="fas fa-exclamation-triangle text-warning"></i>' : ''}</h3>
                                <span class="announcement-priority priority--${announcement.priority}">${announcement.priority}</span>
                            </div>
                            <div class="announcement-actions">
                                <button class="btn btn--sm btn--secondary" onclick="app.editAnnouncement('${announcement._id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn--sm btn--danger" onclick="app.deleteAnnouncement('${announcement._id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="announcement-content">
                            <p>${announcement.content}</p>
                        </div>
                        
                        <div class="announcement-meta">
                            <span><i class="fas fa-calendar"></i> ${createdDate}</span>
                            <span><i class="fas fa-clock"></i> ${createdTime}</span>
                            <span><i class="fas fa-user"></i> ${announcement.createdBy.name}</span>
                            <span><i class="fas fa-eye"></i> ${announcement.readBy.length} read</span>
                        </div>
                    </div>
                `;
            });
            
            content += `</div>`;
        }

        contentArea.innerHTML = content;
    }

    async loadNotices() {
        if (this.currentUser.role !== 'student') {
            this.showError('Access denied. Students only.');
            return;
        }

        try {
            const announcements = await this.api.getAnnouncements();
            this.renderNotices(announcements);
        } catch (error) {
            this.showError('Unable to load notices. Please try again.');
        }
    }

    renderNotices(announcements) {
        const contentArea = document.getElementById('contentArea');

        let content = `
            <div class="section-header">
                <h1>Notice Board</h1>
            </div>
        `;

        if (announcements.length === 0) {
            content += `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <h3>No Notices</h3>
                    <p>There are no notices from your teacher at the moment.</p>
                </div>
            `;
        } else {
            content += `<div class="notices-container">`;
            
            announcements.forEach(announcement => {
                const createdDate = new Date(announcement.createdAt).toLocaleDateString();
                const isUnread = !announcement.readBy.includes(this.currentUser._id);
                
                content += `
                    <div class="notice-card ${announcement.priority === 'high' ? 'notice-card--urgent' : ''} ${isUnread ? 'notice-card--unread' : ''}" onclick="app.markNoticeAsRead('${announcement._id}')">
                        <div class="notice-header">
                            <div class="notice-title">
                                <h3>${announcement.title} ${isUnread ? '<span class="new-badge">NEW</span>' : ''}</h3>
                                <span class="notice-priority priority--${announcement.priority}">${announcement.priority}</span>
                            </div>
                            <div class="notice-date">
                                <p>${createdDate}</p>
                            </div>
                        </div>
                        
                        <div class="notice-content">
                            <p>${announcement.content}</p>
                        </div>
                        
                        <div class="notice-footer">
                            <div class="notice-author">
                                <i class="fas fa-user"></i>
                                <span>${announcement.createdBy.name}</span>
                            </div>
                            <div class="notice-status">
                                <span class="status--${isUnread ? 'unread' : 'read'}">
                                    <i class="fas fa-${isUnread ? 'circle' : 'check-circle'}"></i>
                                    ${isUnread ? 'Unread' : 'Read'}
                                </span>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            content += `</div>`;
        }

        contentArea.innerHTML = content;
    }

    async loadProfile() {
        const contentArea = document.getElementById('contentArea');
        
        const profileImage = this.currentUser.profileImage 
            ? (this.currentUser.profileImage.startsWith('http') 
                ? this.currentUser.profileImage 
                : `${this.api.baseURL.replace('/api', '')}/${this.currentUser.profileImage}`)
            : 'https://via.placeholder.com/100';

        let content = `
            <div class="section-header">
                <h1>Profile</h1>
            </div>

            <div class="profile-section">
                <div class="profile-card">
                    <div class="profile-header">
                        <div class="profile-image-container" onclick="app.triggerProfileImageUpload()">
                            <img src="${profileImage}" alt="${this.currentUser.name}" class="profile-image" onerror="this.src='https://via.placeholder.com/100'">
                            <div class="profile-image-overlay">
                                <i class="fas fa-camera"></i>
                            </div>
                        </div>
                        <div class="profile-info">
                            <h2>${this.currentUser.name}</h2>
                            <span class="profile-role">${this.currentUser.role}</span>
                            <p class="profile-email">${this.currentUser.email}</p>
                        </div>
                    </div>
                    
                    <form id="profileForm" class="profile-form">
                        <h3>Profile Information</h3>
                        <p>Manage your personal information and settings</p>
                        
                        <div class="form-grid">
                            <div class="form-group">
                                <label class="form-label">Full Name</label>
                                <input type="text" name="name" class="form-control" value="${this.currentUser.name || ''}" required>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Phone Number</label>
                                <input type="tel" name="phone" class="form-control" value="${this.currentUser.phone || ''}">
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Date of Birth</label>
                                <input type="date" name="dateOfBirth" class="form-control" value="${this.currentUser.dateOfBirth || ''}">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Bio</label>
                            <textarea name="bio" class="form-control" rows="3" placeholder="Tell us about yourself...">${this.currentUser.bio || ''}</textarea>
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="btn btn--primary">
                                <i class="fas fa-save"></i> Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        contentArea.innerHTML = content;

        // Bind profile form
        const profileForm = document.getElementById('profileForm');
        profileForm.addEventListener('submit', this.handleProfileUpdate.bind(this));
    }

    loadSettings() {
        const contentArea = document.getElementById('contentArea');
        const currentTheme = document.documentElement.getAttribute('data-theme');

        let content = `
            <div class="section-header">
                <h1>Settings</h1>
            </div>

            <div class="settings-section">
                <div class="settings-card">
                    <div class="settings-header">
                        <h2>Application Settings</h2>
                        <p>This section will contain application settings and preferences.</p>
                    </div>
                    
                    <div class="settings-content">
                        <div class="setting-item">
                            <div class="setting-info">
                                <h3>Theme</h3>
                                <p>Choose between light and dark mode</p>
                            </div>
                            <div class="setting-control">
                                <button class="btn btn--secondary" onclick="app.toggleTheme()">
                                    <i class="fas fa-${currentTheme === 'dark' ? 'sun' : 'moon'}"></i>
                                    Switch to ${currentTheme === 'dark' ? 'Light' : 'Dark'} Mode
                                </button>
                            </div>
                        </div>
                        
                        <div class="setting-item">
                            <div class="setting-info">
                                <h3>Account Information</h3>
                                <p>Your account details and preferences</p>
                            </div>
                            <div class="setting-details">
                                <p><strong>Name:</strong> ${this.currentUser.name}</p>
                                <p><strong>Email:</strong> ${this.currentUser.email}</p>
                                <p><strong>Role:</strong> ${this.currentUser.role}</p>
                            </div>
                        </div>
                        
                        <div class="setting-item">
                            <div class="setting-info">
                                <h3>Logout</h3>
                                <p>Sign out of your account</p>
                            </div>
                            <div class="setting-control">
                                <button class="btn btn--danger" onclick="app.handleLogout()">
                                    <i class="fas fa-sign-out-alt"></i> Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        contentArea.innerHTML = content;
    }

    // Modal methods
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal(modal) {
        if (typeof modal === 'string') {
            modal = document.getElementById(modal);
        }
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    showResourceModal(type) {
        const modal = document.getElementById('resourceModal');
        const title = document.getElementById('resourceModalTitle');
        const typeInput = document.getElementById('resourceType');
        
        if (modal && title && typeInput) {
            const typeTitle = type.charAt(0).toUpperCase() + type.slice(1);
            title.textContent = `Add ${typeTitle}`;
            typeInput.value = type;
            
            // Reset form
            document.getElementById('resourceForm').reset();
            
            this.showModal('resourceModal');
        }
    }

    showAddStudentModal() {
        // Reset form
        document.getElementById('addStudentForm').reset();
        this.showModal('addStudentModal');
    }

    showEditStudentModal(studentId) {
        // Find student data
        this.selectedStudentId = studentId;
        
        // You would typically fetch the student data here
        // For now, we'll show the modal and let the form be filled when opened
        this.showModal('editStudentModal');
        
        // Load student data into form
        this.loadStudentDataForEdit(studentId);
    }

    async loadStudentDataForEdit(studentId) {
        try {
            const students = await this.api.getStudents();
            const student = students.find(s => s._id === studentId);
            
            if (student) {
                document.getElementById('editStudentId').value = student._id;
                document.getElementById('editStudentName').value = student.name || '';
                document.getElementById('editStudentEmail').value = student.email || '';
                document.getElementById('editStudentPhone').value = student.phone || '';
                document.getElementById('editStudentDob').value = student.dateOfBirth || '';
                document.getElementById('editStudentBio').value = student.bio || '';
            }
        } catch (error) {
            console.error('Error loading student data:', error);
            this.showNotification('Failed to load student data', 'error');
        }
    }

    showStudentImageModal(studentId) {
        this.selectedStudentId = studentId;
        document.getElementById('imageStudentId').value = studentId;
        
        // Reset form
        document.getElementById('studentImageForm').reset();
        this.showModal('studentImageModal');
    }

    showFeePaymentModal(studentId, studentName) {
        document.getElementById('feeStudentId').value = studentId;
        document.getElementById('feeStudentName').value = studentName;
        
        // Set current year as default
        document.getElementById('feeYear').value = new Date().getFullYear();
        
        // Reset other fields
        document.getElementById('feePaymentForm').reset();
        document.getElementById('feeStudentId').value = studentId;
        document.getElementById('feeStudentName').value = studentName;
        document.getElementById('feeYear').value = new Date().getFullYear();
        
        this.showModal('feePaymentModal');
    }

    async showResultModal(resultId = null) {
        try {
            // Load students for dropdown
            const students = await this.api.getStudents();
            const studentSelect = document.getElementById('resultStudent');
            
            studentSelect.innerHTML = '<option value="">Select Student</option>';
            students.forEach(student => {
                studentSelect.innerHTML += `<option value="${student._id}">${student.name}</option>`;
            });
            
            if (resultId) {
                // Edit mode - load result data
                document.getElementById('resultId').value = resultId;
                // You would load the result data here
            } else {
                // Add mode - reset form
                document.getElementById('resultForm').reset();
                document.getElementById('resultId').value = '';
            }
            
            this.showModal('resultModal');
        } catch (error) {
            console.error('Error loading students for result modal:', error);
            this.showNotification('Failed to load students', 'error');
        }
    }

    showAnnouncementModal(announcementId = null) {
        const modal = document.getElementById('announcementModal');
        const title = document.getElementById('announcementModalTitle');
        const submitText = document.getElementById('announcementSubmitText');
        
        if (announcementId) {
            // Edit mode
            title.textContent = 'Edit Announcement';
            submitText.textContent = 'Update Announcement';
            document.getElementById('announcementId').value = announcementId;
            // Load announcement data here
        } else {
            // Add mode
            title.textContent = 'New Announcement';
            submitText.textContent = 'Create Announcement';
            document.getElementById('announcementForm').reset();
            document.getElementById('announcementId').value = '';
        }
        
        this.showModal('announcementModal');
    }

    // Form handlers
    async handleResourceUpload(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

        try {
            await this.api.createResource(formData);
            this.showNotification('Resource uploaded successfully!', 'success');
            this.closeModal('resourceModal');
            
            // Refresh current section if it's a resource section
            if (['notes', 'questions', 'books'].includes(this.currentSection)) {
                this.loadSection(this.currentSection);
            }
        } catch (error) {
            console.error('Resource upload error:', error);
            this.showNotification('Failed to upload resource: ' + error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-upload"></i> Upload';
        }
    }

    async handleAddStudent(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding Student...';

        try {
            const studentData = {
                name: formData.get('name'),
                email: formData.get('email'),
                password: formData.get('password'),
                phone: formData.get('phone'),
                dateOfBirth: formData.get('dateOfBirth'),
                bio: formData.get('bio')
            };

            await this.api.createStudent(studentData);
            this.showNotification('Student added successfully!', 'success');
            this.closeModal('addStudentModal');
            
            // Refresh students section if currently viewing
            if (this.currentSection === 'students') {
                this.loadSection('students');
            }
        } catch (error) {
            console.error('Add student error:', error);
            this.showNotification('Failed to add student: ' + error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Add Student';
        }
    }

    async handleStudentEdit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const studentId = formData.get('studentId');
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        try {
            const profileData = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                dateOfBirth: formData.get('dateOfBirth'),
                bio: formData.get('bio')
            };

            await this.api.updateStudentProfile(studentId, profileData);
            this.showNotification('Student profile updated successfully!', 'success');
            this.closeModal('editStudentModal');
            
            // Refresh students section if currently viewing
            if (this.currentSection === 'students') {
                this.loadSection('students');
            }
        } catch (error) {
            console.error('Student edit error:', error);
            this.showNotification('Failed to update student: ' + error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
        }
    }

    async handleStudentImageUpload(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const studentId = formData.get('studentId');
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

        try {
            await this.api.uploadStudentProfileImage(studentId, formData);
            this.showNotification('Student profile picture updated successfully!', 'success');
            this.closeModal('studentImageModal');
            
            // Refresh students section if currently viewing
            if (this.currentSection === 'students') {
                this.loadSection('students');
            }
        } catch (error) {
            console.error('Student image upload error:', error);
            this.showNotification('Failed to upload profile picture: ' + error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-upload"></i> Upload Picture';
        }
    }

    async handleFeePayment(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';

        try {
            const feeData = {
                studentId: formData.get('studentId'),
                month: formData.get('month'),
                year: parseInt(formData.get('year')),
                amount: parseFloat(formData.get('amount')),
                status: formData.get('status'),
                paymentDate: formData.get('paymentDate'),
                notes: formData.get('notes')
            };

            await this.api.updateFeeStatus(feeData);
            this.showNotification('Fee status updated successfully!', 'success');
            this.closeModal('feePaymentModal');
            
            // Refresh fees section if currently viewing
            if (this.currentSection === 'fees') {
                this.loadSection('fees');
            }
        } catch (error) {
            console.error('Fee update error:', error);
            this.showNotification('Failed to update fee status: ' + error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Fee Status';
        }
    }

    async handleResultSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const resultId = formData.get('resultId');
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        try {
            const resultData = {
                studentId: formData.get('studentId'),
                examName: formData.get('examName'),
                subject: formData.get('subject'),
                class: formData.get('class'),
                examDate: formData.get('examDate'),
                totalMarks: parseInt(formData.get('totalMarks')),
                marksObtained: parseInt(formData.get('marksObtained')),
                remarks: formData.get('remarks')
            };

            if (resultId) {
                await this.api.updateResult(resultId, resultData);
                this.showNotification('Result updated successfully!', 'success');
            } else {
                await this.api.createResult(resultData);
                this.showNotification('Result added successfully!', 'success');
            }
            
            this.closeModal('resultModal');
            
            // Refresh results section if currently viewing
            if (this.currentSection === 'results') {
                this.loadSection('results');
            }
        } catch (error) {
            console.error('Result submit error:', error);
            this.showNotification('Failed to save result: ' + error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Add Result';
        }
    }

    async handleAnnouncementSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const announcementId = formData.get('announcementId');
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        try {
            const announcementData = {
                title: formData.get('title'),
                content: formData.get('content'),
                priority: formData.get('priority')
            };

            if (announcementId) {
                await this.api.updateAnnouncement(announcementId, announcementData);
                this.showNotification('Announcement updated successfully!', 'success');
            } else {
                await this.api.createAnnouncement(announcementData);
                this.showNotification('Announcement created successfully!', 'success');
            }
            
            this.closeModal('announcementModal');
            
            // Refresh announcements section if currently viewing
            if (this.currentSection === 'announcements') {
                this.loadSection('announcements');
            }
        } catch (error) {
            console.error('Announcement submit error:', error);
            this.showNotification('Failed to save announcement: ' + error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-bullhorn"></i> Create Announcement';
        }
    }

    async handleScheduleSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';

        try {
            const scheduleData = {
                title: formData.get('title'),
                description: formData.get('description'),
                date: formData.get('date'),
                time: formData.get('time'),
                meetingLink: formData.get('meetingLink'),
                password: formData.get('password')
            };

            await this.api.createSchedule(scheduleData);
            this.showNotification('Class scheduled successfully!', 'success');
            
            // Reset form
            e.target.reset();
            
            // Refresh schedule section
            this.loadSection('schedule');
        } catch (error) {
            console.error('Schedule submit error:', error);
            this.showNotification('Failed to schedule class: ' + error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add Class';
        }
    }

    triggerProfileImageUpload() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.addEventListener('change', this.handleProfileImageUpload.bind(this));
        fileInput.click();
    }

    async handleProfileImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('profileImage', file);

        try {
            this.showNotification('Uploading profile image...', 'info');
            const response = await this.api.uploadProfileImage(formData);
            
            this.currentUser = response.user;
            this.updateUserInfo();
            
            // Update profile image in profile section if currently viewing
            if (this.currentSection === 'profile') {
                const profileImg = document.querySelector('.profile-image');
                if (profileImg) {
                    profileImg.src = response.profileImage.startsWith('http') 
                        ? response.profileImage 
                        : `${this.api.baseURL.replace('/api', '')}/${response.profileImage}`;
                }
            }
            
            this.showNotification('Profile image updated successfully!', 'success');
        } catch (error) {
            console.error('Profile image upload error:', error);
            this.showNotification('Failed to upload profile image: ' + error.message, 'error');
        }
    }

    async handleProfileUpdate(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        try {
            const profileData = {
                name: formData.get('name'),
                bio: formData.get('bio'),
                phone: formData.get('phone'),
                dateOfBirth: formData.get('dateOfBirth')
            };

            const updatedUser = await this.api.updateUserProfile(profileData);
            this.currentUser = { ...this.currentUser, ...updatedUser };
            this.updateUserInfo();
            
            this.showNotification('Profile updated successfully!', 'success');
        } catch (error) {
            console.error('Profile update error:', error);
            this.showNotification('Failed to update profile: ' + error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
        }
    }

    // Action methods
    async downloadResource(resourceId) {
        try {
            this.showNotification('Downloading file...', 'info');
            await this.api.downloadResource(resourceId);
            this.showNotification('File downloaded successfully!', 'success');
        } catch (error) {
            console.error('Download error:', error);
            this.showNotification('Download failed: ' + error.message, 'error');
        }
    }

    async deleteResource(resourceId) {
        if (!confirm('Are you sure you want to delete this resource?')) {
            return;
        }

        try {
            await this.api.deleteResource(resourceId);
            this.showNotification('Resource deleted successfully!', 'success');
            
            // Refresh current section
            this.loadSection(this.currentSection);
        } catch (error) {
            console.error('Delete error:', error);
            this.showNotification('Failed to delete resource: ' + error.message, 'error');
        }
    }

    async deleteStudent(studentId) {
        if (!confirm('Are you sure you want to delete this student? This will also delete all their fee records and results.')) {
            return;
        }

        try {
            await this.api.deleteStudent(studentId);
            this.showNotification('Student deleted successfully!', 'success');
            
            // Refresh students section
            if (this.currentSection === 'students') {
                this.loadSection('students');
            }
        } catch (error) {
            console.error('Delete student error:', error);
            this.showNotification('Failed to delete student: ' + error.message, 'error');
        }
    }

    async deleteSchedule(scheduleId) {
        if (!confirm('Are you sure you want to delete this scheduled class?')) {
            return;
        }

        try {
            await this.api.deleteSchedule(scheduleId);
            this.showNotification('Schedule deleted successfully!', 'success');
            
            // Refresh schedule section
            this.loadSection('schedule');
        } catch (error) {
            console.error('Delete schedule error:', error);
            this.showNotification('Failed to delete schedule: ' + error.message, 'error');
        }
    }

    async deleteResult(resultId) {
        if (!confirm('Are you sure you want to delete this result?')) {
            return;
        }

        try {
            await this.api.deleteResult(resultId);
            this.showNotification('Result deleted successfully!', 'success');
            
            // Refresh results section
            this.loadSection('results');
        } catch (error) {
            console.error('Delete result error:', error);
            this.showNotification('Failed to delete result: ' + error.message, 'error');
        }
    }

    async deleteAnnouncement(announcementId) {
        if (!confirm('Are you sure you want to delete this announcement?')) {
            return;
        }

        try {
            await this.api.deleteAnnouncement(announcementId);
            this.showNotification('Announcement deleted successfully!', 'success');
            
            // Refresh announcements section
            this.loadSection('announcements');
        } catch (error) {
            console.error('Delete announcement error:', error);
            this.showNotification('Failed to delete announcement: ' + error.message, 'error');
        }
    }

    async editAnnouncement(announcementId) {
        try {
            const announcements = await this.api.getAnnouncements();
            const announcement = announcements.find(a => a._id === announcementId);
            
            if (announcement) {
                document.getElementById('announcementId').value = announcement._id;
                document.getElementById('announcementTitle').value = announcement.title;
                document.getElementById('announcementContent').value = announcement.content;
                document.getElementById('announcementPriority').value = announcement.priority;
                
                this.showAnnouncementModal(announcementId);
            }
        } catch (error) {
            console.error('Error loading announcement for edit:', error);
            this.showNotification('Failed to load announcement data', 'error');
        }
    }

    async markNoticeAsRead(announcementId) {
        try {
            await this.api.markAnnouncementAsRead(announcementId);
            
            // Update the UI to show as read
            const noticeCard = document.querySelector(`[onclick="app.markNoticeAsRead('${announcementId}')"]`);
            if (noticeCard) {
                noticeCard.classList.remove('notice-card--unread');
                const newBadge = noticeCard.querySelector('.new-badge');
                if (newBadge) {
                    newBadge.remove();
                }
                
                const statusEl = noticeCard.querySelector('.notice-status span');
                if (statusEl) {
                    statusEl.className = 'status--read';
                    statusEl.innerHTML = '<i class="fas fa-check-circle"></i> Read';
                }
            }
            
            // Update announcement count
            const response = await this.api.getUnreadAnnouncementsCount();
            this.updateAnnouncementBadge(response.count);
            
        } catch (error) {
            console.error('Mark notice as read error:', error);
            this.showNotification('Failed to mark notice as read', 'error');
        }
    }

    // Utility methods
    handleSearch(query) {
        console.log('Search:', query);
        // Implement search functionality based on current section
        if (['notes', 'questions', 'books'].includes(this.currentSection)) {
            this.searchResources(query);
        }
    }

    async searchResources(query) {
        try {
            const type = this.currentSection.slice(0, -1); // Remove 's' from the end
            const resources = await this.api.getResources(type, query);
            this.renderResources(resources, type);
        } catch (error) {
            console.error('Search error:', error);
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Initialize the application
const app = new EducationApp();

// Make app globally available for onclick handlers
window.app = app;