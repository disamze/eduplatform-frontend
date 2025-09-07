// Complete app.js with Fee Management System, Results/Leaderboard, and Announcements/Notice Board

// API Service Class
class ApiService {
    constructor() {
        this.baseURL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:5000/api'
            : 'https://eduplatform-backend-k9fr.onrender.com/api';
        this.token = localStorage.getItem('authToken');
        console.log('🔧 API Service initialized with base URL:', this.baseURL);
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
        const headers = { 'Content-Type': 'application/json' };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    async makeRequest(endpoint, options = {}) {
        try {
            const url = `${this.baseURL}${endpoint}`;
            const config = { headers: this.getAuthHeaders(), ...options };
            console.log('📡 Making request to:', url);

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
            console.error('❌ API Request Error:', error);
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
        return this.makeRequest(`/resources/${id}`, { method: 'DELETE' });
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
            console.log('🔗 Download URL:', downloadUrl);

            const response = await fetch(downloadUrl, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Download response:', response.status, errorText);
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
            console.log('✅ File downloaded successfully:', fileName);

        } catch (error) {
            console.error('❌ Download error:', error);
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
        return this.makeRequest(`/schedules/${id}`, { method: 'DELETE' });
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
        return this.makeRequest(`/students/${id}`, { method: 'DELETE' });
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
        return this.makeRequest(`/results/${id}`, { method: 'DELETE' });
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
        return this.makeRequest(`/announcements/${id}`, { method: 'DELETE' });
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
        console.log('🚀 Initializing Education App...');
        
        // Initialize theme first
        this.initializeTheme();

        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                this.currentUser = await this.api.getUserProfile();
                console.log('✅ Auto-login successful:', this.currentUser.name);
                this.showMainApp();
                this.startAnnouncementPolling(); // Start polling for new announcements
            } catch (error) {
                console.error('❌ Auto-login failed:', error);
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
        console.log('🎨 Theme changed to:', newTheme);

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
            <div class="notification-content">
                <i class="fas fa-${icon}"></i>
                <span>${message}</span>
            </div>
            <button onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--color-surface);
            border: 1px solid var(--color-border);
            border-left: 4px solid var(--color-${type === 'info' ? 'primary' : type});
            border-radius: 8px;
            padding: 16px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-width: 300px;
            max-width: 500px;
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Auto remove after 4 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOutRight 0.3s ease forwards';
                setTimeout(() => notification.remove(), 300);
            }
        }, 4000);
    }

    bindEvents() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Logout button
        document.addEventListener('click', (e) => {
            if (e.target.closest('#logoutBtn')) {
                this.handleLogout();
            }
        });

        // Sidebar navigation
        document.addEventListener('click', (e) => {
            const sidebarItem = e.target.closest('.sidebar-item');
            if (sidebarItem) {
                e.preventDefault();
                const section = sidebarItem.dataset.section;
                if (section) {
                    this.showSection(section);
                }
            }
        });

        // Mobile sidebar toggle
        document.addEventListener('click', (e) => {
            if (e.target.closest('#mobileSidebarToggle')) {
                document.getElementById('sidebar').classList.toggle('open');
            }
        });

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        // Modal events
        this.bindModalEvents();
    }

    bindModalEvents() {
        // Close modal events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close-modal') || e.target.closest('.close-modal')) {
                this.closeAllModals();
            }
        });

        // Click outside modal to close
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });

        // Resource form
        const resourceForm = document.getElementById('resourceForm');
        if (resourceForm) {
            resourceForm.addEventListener('submit', (e) => this.handleResourceSubmit(e));
        }

        // Result form
        const resultForm = document.getElementById('resultForm');
        if (resultForm) {
            resultForm.addEventListener('submit', (e) => this.handleResultSubmit(e));
        }

        // Announcement form
        const announcementForm = document.getElementById('announcementForm');
        if (announcementForm) {
            announcementForm.addEventListener('submit', (e) => this.handleAnnouncementSubmit(e));
        }

        // Student edit form
        const studentEditForm = document.getElementById('studentEditForm');
        if (studentEditForm) {
            studentEditForm.addEventListener('submit', (e) => this.handleStudentEditSubmit(e));
        }

        // Fee payment form
        const feePaymentForm = document.getElementById('feePaymentForm');
        if (feePaymentForm) {
            feePaymentForm.addEventListener('submit', (e) => this.handleFeePaymentSubmit(e));
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const loginBtn = document.getElementById('loginBtn');
        const loginError = document.getElementById('loginError');

        try {
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
            loginError.style.display = 'none';

            const response = await this.api.login(email, password);
            this.api.setAuthToken(response.token);
            this.currentUser = response.user;

            console.log('✅ Login successful:', this.currentUser.name);
            this.showMainApp();
            this.showNotification(`Welcome back, ${this.currentUser.name}!`, 'success');
            this.startAnnouncementPolling();

        } catch (error) {
            console.error('❌ Login failed:', error);
            loginError.textContent = error.message;
            loginError.style.display = 'block';
            this.showNotification('Login failed. Please check your credentials.', 'error');
        } finally {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
        }
    }

    handleLogout() {
        this.api.clearAuthToken();
        this.currentUser = null;
        this.stopAnnouncementPolling();
        this.showLogin();
        this.showNotification('You have been logged out successfully', 'info');
    }

    showLogin() {
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('mainApp').classList.add('hidden');
    }

    showMainApp() {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        this.updateUserInfo();
        this.showSection('dashboard');
    }

    updateUserInfo() {
        const userAvatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');
        const userInfo = document.getElementById('userInfo');

        if (userAvatar) {
            userAvatar.src = this.currentUser.profileImage || 'https://via.placeholder.com/40';
        }
        if (userName) {
            userName.textContent = this.currentUser.name;
        }
        if (userInfo) {
            userInfo.textContent = this.currentUser.role === 'teacher' ? 'Teacher' : 'Student';
        }

        // Show/hide sections based on role
        const teacherOnlySections = document.querySelectorAll('.teacher-only');
        const studentOnlySections = document.querySelectorAll('.student-only');
        
        teacherOnlySections.forEach(section => {
            section.style.display = this.currentUser.role === 'teacher' ? 'block' : 'none';
        });
        
        studentOnlySections.forEach(section => {
            section.style.display = this.currentUser.role === 'student' ? 'block' : 'none';
        });

        // Set body attribute for CSS targeting
        document.body.setAttribute('data-user-role', this.currentUser.role);
    }

    // Start polling for new announcements
    startAnnouncementPolling() {
        if (this.currentUser && this.currentUser.role === 'student') {
            this.updateAnnouncementBadge();
            this.announcementPollInterval = setInterval(() => {
                this.updateAnnouncementBadge();
            }, 30000); // Check every 30 seconds
        }
    }

    stopAnnouncementPolling() {
        if (this.announcementPollInterval) {
            clearInterval(this.announcementPollInterval);
            this.announcementPollInterval = null;
        }
    }

    async updateAnnouncementBadge() {
        try {
            const response = await this.api.getUnreadAnnouncementsCount();
            const count = response.count;
            
            // Update notice board badge
            const noticeMenuItem = document.querySelector('[data-section="notices"]');
            if (noticeMenuItem) {
                let badge = noticeMenuItem.querySelector('.notification-badge');
                if (count > 0) {
                    if (!badge) {
                        badge = document.createElement('span');
                        badge.className = 'notification-badge';
                        noticeMenuItem.appendChild(badge);
                    }
                    badge.textContent = count > 99 ? '99+' : count.toString();
                } else if (badge) {
                    badge.remove();
                }
            }

        } catch (error) {
            console.error('❌ Error updating announcement badge:', error);
        }
    }

    async showSection(sectionName) {
        this.currentSection = sectionName;
        
        // Update active sidebar item
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.remove('active');
        });
        const activeItem = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }

        // Update page title
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = this.getSectionTitle(sectionName);
        }

        // Load section content
        const contentArea = document.getElementById('contentArea');
        if (contentArea) {
            contentArea.innerHTML = '<div class="loading-state"><div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i></div><p>Loading content...</p></div>';

            try {
                switch (sectionName) {
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
                        await this.loadSchedules();
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
                        await this.loadNoticeBoard();
                        break;
                    case 'profile':
                        await this.loadProfile();
                        break;
                    case 'settings':
                        await this.loadSettings();
                        break;
                    default:
                        contentArea.innerHTML = `<div class="error-state"><i class="fas fa-exclamation-triangle"></i><h2>Section Not Found</h2><p>The requested section could not be found.</p></div>`;
                }
            } catch (error) {
                console.error(`❌ Error loading ${sectionName}:`, error);
                contentArea.innerHTML = `<div class="error-state"><i class="fas fa-exclamation-triangle"></i><h2>Error Loading Content</h2><p>${error.message}</p></div>`;
            }
        }
    }

    getSectionTitle(sectionName) {
        const titles = {
            dashboard: 'Dashboard',
            notes: 'Notes',
            questions: 'Questions',
            books: 'Books',
            schedule: 'Schedule',
            students: 'Students',
            fees: 'Fee Management',
            results: 'Results',
            announcements: 'Announcements',
            notices: 'Notice Board',
            profile: 'Profile',
            settings: 'Settings'
        };
        return titles[sectionName] || 'Unknown';
    }

    async loadDashboard() {
        const contentArea = document.getElementById('contentArea');
        
        try {
            const stats = await this.api.getDashboardStats();
            
            if (this.currentUser.role === 'teacher') {
                contentArea.innerHTML = `
                    <div class="dashboard-header">
                        <h1><i class="fas fa-tachometer-alt"></i> Dashboard</h1>
                        <p>Here's an overview of your teaching platform.</p>
                    </div>
                    
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon notes-icon"><i class="fas fa-sticky-note"></i></div>
                            <div class="stat-content">
                                <h3>${stats.notes || 0}</h3>
                                <p>Notes</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon questions-icon"><i class="fas fa-question-circle"></i></div>
                            <div class="stat-content">
                                <h3>${stats.questions || 0}</h3>
                                <p>Questions</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon books-icon"><i class="fas fa-book"></i></div>
                            <div class="stat-content">
                                <h3>${stats.books || 0}</h3>
                                <p>Books</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon students-icon"><i class="fas fa-users"></i></div>
                            <div class="stat-content">
                                <h3>${stats.students || 0}</h3>
                                <p>Students</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon schedule-icon"><i class="fas fa-calendar-alt"></i></div>
                            <div class="stat-content">
                                <h3>${stats.schedules || 0}</h3>
                                <p>Schedules</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="quick-actions">
                        <h2>Quick Actions</h2>
                        <div class="action-buttons">
                            <button class="btn btn--primary" onclick="app.openResourceModal('note')">
                                <i class="fas fa-plus"></i> Add Note
                            </button>
                            <button class="btn btn--primary" onclick="app.openResourceModal('question')">
                                <i class="fas fa-plus"></i> Add Question
                            </button>
                            <button class="btn btn--primary" onclick="app.openResourceModal('book')">
                                <i class="fas fa-plus"></i> Add Book
                            </button>
                            <button class="btn btn--primary" onclick="app.openAnnouncementModal()">
                                <i class="fas fa-bullhorn"></i> New Announcement
                            </button>
                        </div>
                    </div>
                `;
            } else {
                // Student dashboard with fee status
                const fees = await this.api.getStudentFeeStatus();
                const paidFees = fees.filter(fee => fee.status === 'paid');
                const pendingFees = fees.filter(fee => fee.status === 'pending');
                const overdueFees = fees.filter(fee => fee.status === 'overdue');

                let feeStatusHtml = '';
                if (overdueFees.length > 0) {
                    feeStatusHtml = `
                        <div class="fee-alert fee-alert--danger">
                            <i class="fas fa-exclamation-triangle"></i>
                            <div>
                                <h3>Overdue Fees</h3>
                                <p>You have ${overdueFees.length} overdue fee(s). Please pay immediately to avoid account suspension.</p>
                            </div>
                        </div>
                    `;
                } else if (pendingFees.length > 0) {
                    feeStatusHtml = `
                        <div class="fee-alert fee-alert--warning">
                            <i class="fas fa-clock"></i>
                            <div>
                                <h3>Pending Fees</h3>
                                <p>You have ${pendingFees.length} pending fee payment(s). Please pay on time to continue your classes.</p>
                            </div>
                        </div>
                    `;
                } else {
                    feeStatusHtml = `
                        <div class="fee-alert fee-alert--success">
                            <i class="fas fa-check-circle"></i>
                            <div>
                                <h3>All Fees Paid</h3>
                                <p>Great! All your fees are up to date. Keep up the good work!</p>
                            </div>
                        </div>
                    `;
                }

                contentArea.innerHTML = `
                    <div class="dashboard-header">
                        <h1><i class="fas fa-home"></i> Welcome Back, ${this.currentUser.name}!</h1>
                        <p>Welcome back! Continue your learning journey.</p>
                    </div>

                    ${feeStatusHtml}
                    
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon resources-icon"><i class="fas fa-book-open"></i></div>
                            <div class="stat-content">
                                <h3>${stats.totalResources || 0}</h3>
                                <p>Total Resources</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon schedule-icon"><i class="fas fa-calendar-check"></i></div>
                            <div class="stat-content">
                                <h3>${stats.upcomingSchedules || 0}</h3>
                                <p>Upcoming Classes</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon notes-icon"><i class="fas fa-money-check-alt"></i></div>
                            <div class="stat-content">
                                <h3>${paidFees.length}</h3>
                                <p>Fees Paid</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon questions-icon"><i class="fas fa-clock"></i></div>
                            <div class="stat-content">
                                <h3>${pendingFees.length + overdueFees.length}</h3>
                                <p>Pending Fees</p>
                            </div>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            console.error('❌ Error loading dashboard:', error);
            contentArea.innerHTML = `<div class="error-state"><i class="fas fa-exclamation-triangle"></i><h2>Error Loading Dashboard</h2><p>Unable to load dashboard data. Please try again.</p></div>`;
        }
    }

    // NEW: Load Announcements (Teacher View)
    async loadAnnouncements() {
        const contentArea = document.getElementById('contentArea');

        try {
            const announcements = await this.api.getAnnouncements();

            contentArea.innerHTML = `
                <div class="section-header">
                    <h1><i class="fas fa-bullhorn"></i> Announcements</h1>
                    ${this.currentUser.role === 'teacher' ? `
                        <button class="btn btn--primary" onclick="app.openAnnouncementModal()">
                            <i class="fas fa-plus"></i> New Announcement
                        </button>
                    ` : ''}
                </div>

                <div class="announcements-grid">
                    ${announcements.length === 0 ? `
                        <div class="empty-state">
                            <i class="fas fa-bullhorn"></i>
                            <h3>No Announcements</h3>
                            <p>There are no announcements at the moment.${this.currentUser.role === 'teacher' ? ' Create your first announcement!' : ''}</p>
                        </div>
                    ` : announcements.map(announcement => this.renderAnnouncementCard(announcement)).join('')}
                </div>
            `;

        } catch (error) {
            console.error('❌ Error loading announcements:', error);
            contentArea.innerHTML = `<div class="error-state"><i class="fas fa-exclamation-triangle"></i><h2>Error Loading Announcements</h2><p>Unable to load announcements. Please try again.</p></div>`;
        }
    }

    // NEW: Load Notice Board (Student View)
    async loadNoticeBoard() {
        const contentArea = document.getElementById('contentArea');

        try {
            const announcements = await this.api.getAnnouncements();

            // Mark announcements as read when student views them
            const unreadAnnouncements = announcements.filter(a => !a.readBy.includes(this.currentUser.id));
            for (const announcement of unreadAnnouncements) {
                try {
                    await this.api.markAnnouncementAsRead(announcement._id);
                } catch (error) {
                    console.error('❌ Error marking announcement as read:', error);
                }
            }

            // Update badge after marking as read
            setTimeout(() => this.updateAnnouncementBadge(), 1000);

            contentArea.innerHTML = `
                <div class="section-header">
                    <h1><i class="fas fa-clipboard-list"></i> Notice Board</h1>
                    <div class="notice-stats">
                        <span class="notice-count">
                            <i class="fas fa-bell"></i>
                            ${announcements.length} Total Notices
                        </span>
                    </div>
                </div>

                <div class="notices-container">
                    ${announcements.length === 0 ? `
                        <div class="empty-state">
                            <i class="fas fa-clipboard-list"></i>
                            <h3>No Notices</h3>
                            <p>There are no notices from your teacher at the moment.</p>
                        </div>
                    ` : announcements.map(announcement => this.renderNoticeCard(announcement)).join('')}
                </div>
            `;

        } catch (error) {
            console.error('❌ Error loading notice board:', error);
            contentArea.innerHTML = `<div class="error-state"><i class="fas fa-exclamation-triangle"></i><h2>Error Loading Notice Board</h2><p>Unable to load notices. Please try again.</p></div>`;
        }
    }

    renderAnnouncementCard(announcement) {
        const createdDate = new Date(announcement.createdAt);
        const isUrgent = announcement.priority === 'high';
        
        return `
            <div class="announcement-card ${isUrgent ? 'announcement-card--urgent' : ''}" data-id="${announcement._id}">
                <div class="announcement-header">
                    <div class="announcement-title">
                        <h3>
                            ${isUrgent ? '<i class="fas fa-exclamation-triangle text-warning"></i>' : '<i class="fas fa-bullhorn"></i>'}
                            ${announcement.title}
                        </h3>
                        <span class="announcement-priority priority--${announcement.priority}">
                            ${announcement.priority.toUpperCase()}
                        </span>
                    </div>
                    ${this.currentUser.role === 'teacher' ? `
                        <div class="announcement-actions">
                            <button class="btn btn--secondary btn-icon" onclick="app.editAnnouncement('${announcement._id}')" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn--danger btn-icon" onclick="app.deleteAnnouncement('${announcement._id}')" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    ` : ''}
                </div>
                
                <div class="announcement-content">
                    <p>${announcement.content}</p>
                </div>
                
                <div class="announcement-meta">
                    <span><i class="fas fa-calendar"></i> ${createdDate.toLocaleDateString()}</span>
                    <span><i class="fas fa-clock"></i> ${createdDate.toLocaleTimeString()}</span>
                    ${this.currentUser.role === 'teacher' ? `
                        <span><i class="fas fa-eye"></i> ${announcement.readBy.length} read</span>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderNoticeCard(announcement) {
        const createdDate = new Date(announcement.createdAt);
        const isUrgent = announcement.priority === 'high';
        const isRead = announcement.readBy.includes(this.currentUser.id);
        
        return `
            <div class="notice-card ${isUrgent ? 'notice-card--urgent' : ''} ${!isRead ? 'notice-card--unread' : ''}" data-id="${announcement._id}">
                <div class="notice-header">
                    <div class="notice-title">
                        <h3>
                            ${isUrgent ? '<i class="fas fa-exclamation-triangle text-warning"></i>' : '<i class="fas fa-bell"></i>'}
                            ${announcement.title}
                            ${!isRead ? '<span class="new-badge">NEW</span>' : ''}
                        </h3>
                        <span class="notice-priority priority--${announcement.priority}">
                            ${announcement.priority.toUpperCase()}
                        </span>
                    </div>
                    <div class="notice-date">
                        <span>${createdDate.toLocaleDateString()}</span>
                        <span>${createdDate.toLocaleTimeString()}</span>
                    </div>
                </div>
                
                <div class="notice-content">
                    <p>${announcement.content}</p>
                </div>
                
                <div class="notice-footer">
                    <span class="notice-author">
                        <i class="fas fa-user"></i>
                        ${announcement.createdBy.name}
                    </span>
                    <span class="notice-status ${isRead ? 'status--read' : 'status--unread'}">
                        <i class="fas fa-${isRead ? 'check-circle' : 'circle'}"></i>
                        ${isRead ? 'Read' : 'Unread'}
                    </span>
                </div>
            </div>
        `;
    }

    openAnnouncementModal(announcementId = null) {
        const modal = document.getElementById('announcementModal');
        const form = document.getElementById('announcementForm');
        const modalTitle = document.getElementById('announcementModalTitle');
        
        form.reset();
        
        if (announcementId) {
            modalTitle.textContent = 'Edit Announcement';
            document.getElementById('announcementId').value = announcementId;
            // Load announcement data here if editing
        } else {
            modalTitle.textContent = 'New Announcement';
            document.getElementById('announcementId').value = '';
        }
        
        modal.classList.add('show');
    }

    async handleAnnouncementSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const announcementId = formData.get('announcementId');
        
        const announcementData = {
            title: formData.get('title'),
            content: formData.get('content'),
            priority: formData.get('priority') || 'normal'
        };

        try {
            if (announcementId) {
                await this.api.updateAnnouncement(announcementId, announcementData);
                this.showNotification('Announcement updated successfully!', 'success');
            } else {
                await this.api.createAnnouncement(announcementData);
                this.showNotification('Announcement created successfully!', 'success');
            }
            
            this.closeAllModals();
            if (this.currentSection === 'announcements') {
                this.loadAnnouncements();
            }
        } catch (error) {
            console.error('❌ Error saving announcement:', error);
            this.showNotification('Failed to save announcement: ' + error.message, 'error');
        }
    }

    async deleteAnnouncement(announcementId) {
        if (!confirm('Are you sure you want to delete this announcement?')) {
            return;
        }

        try {
            await this.api.deleteAnnouncement(announcementId);
            this.showNotification('Announcement deleted successfully!', 'success');
            if (this.currentSection === 'announcements') {
                this.loadAnnouncements();
            }
        } catch (error) {
            console.error('❌ Error deleting announcement:', error);
            this.showNotification('Failed to delete announcement: ' + error.message, 'error');
        }
    }

    async loadResources(type) {
        const contentArea = document.getElementById('contentArea');
        const typeTitle = type.charAt(0).toUpperCase() + type.slice(1) + 's';

        try {
            const resources = await this.api.getResources(type);

            contentArea.innerHTML = `
                <div class="section-header">
                    <h1><i class="fas fa-${type === 'note' ? 'sticky-note' : type === 'question' ? 'question-circle' : 'book'}"></i> ${typeTitle}</h1>
                    ${this.currentUser.role === 'teacher' ? `
                        <button class="btn btn--primary" onclick="app.openResourceModal('${type}')">
                            <i class="fas fa-plus"></i> Add ${type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                    ` : ''}
                </div>

                <div class="resources-grid">
                    ${resources.length === 0 ? `
                        <div class="empty-state">
                            <i class="fas fa-${type === 'note' ? 'sticky-note' : type === 'question' ? 'question-circle' : 'book'}"></i>
                            <h3>No ${typeTitle} Available</h3>
                            <p>There are no ${typeTitle.toLowerCase()} available at the moment.${this.currentUser.role === 'teacher' ? ` <button class="btn btn--primary" onclick="app.openResourceModal('${type}')">Add ${type.charAt(0).toUpperCase() + type.slice(1)}</button>` : ''}</p>
                        </div>
                    ` : resources.map(resource => this.renderResourceCard(resource)).join('')}
                </div>
            `;

        } catch (error) {
            console.error(`❌ Error loading ${type}s:`, error);
            contentArea.innerHTML = `<div class="error-state"><i class="fas fa-exclamation-triangle"></i><h2>Error Loading ${typeTitle}</h2><p>Unable to load ${typeTitle.toLowerCase()}. Please try again.</p></div>`;
        }
    }

    renderResourceCard(resource) {
        const uploadDate = new Date(resource.createdAt).toLocaleDateString();
        const fileSize = (resource.fileSize / (1024 * 1024)).toFixed(2) + ' MB';

        return `
            <div class="resource-card" data-id="${resource._id}">
                <div class="resource-header">
                    <h3>${resource.title}</h3>
                    <div class="resource-actions">
                        <button class="btn btn--secondary btn-icon" onclick="app.downloadResource('${resource._id}')" title="Download">
                            <i class="fas fa-download"></i>
                        </button>
                        ${this.currentUser.role === 'teacher' ? `
                            <button class="btn btn--danger btn-icon" onclick="app.deleteResource('${resource._id}')" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
                
                <div class="resource-description">
                    ${resource.description || 'No description available.'}
                </div>
                
                <div class="resource-meta">
                    <span><i class="fas fa-calendar"></i> ${uploadDate}</span>
                    <span><i class="fas fa-hdd"></i> ${fileSize}</span>
                    <span><i class="fas fa-user"></i> ${resource.uploadedBy.name}</span>
                    <span><i class="fas fa-file"></i> ${resource.fileName}</span>
                </div>
                
                <div class="resource-footer">
                    <button class="btn btn--primary" onclick="app.downloadResource('${resource._id}')">
                        <i class="fas fa-download"></i> Download
                    </button>
                </div>
            </div>
        `;
    }

    async loadSchedules() {
        const contentArea = document.getElementById('contentArea');
        
        try {
            const schedules = await this.api.getSchedules();
            
            contentArea.innerHTML = `
                <div class="section-header">
                    <h1><i class="fas fa-calendar-alt"></i> Schedules</h1>
                </div>

                ${schedules.length === 0 ? `
                    <div class="empty-state">
                        <i class="fas fa-calendar-alt"></i>
                        <h3>No Schedules</h3>
                        <p>There are no scheduled classes at the moment.</p>
                    </div>
                ` : `
                    <div class="schedules-grid">
                        ${schedules.map(schedule => this.renderScheduleCard(schedule)).join('')}
                    </div>
                `}
            `;
        } catch (error) {
            console.error('❌ Error loading schedules:', error);
            contentArea.innerHTML = `<div class="error-state"><i class="fas fa-exclamation-triangle"></i><h2>Error Loading Schedules</h2><p>Unable to load schedules. Please try again.</p></div>`;
        }
    }

    renderScheduleCard(schedule) {
        const scheduleDate = new Date(schedule.date).toLocaleDateString();
        
        return `
            <div class="schedule-card" data-id="${schedule._id}">
                <div class="schedule-header">
                    <h3>${schedule.title}</h3>
                    ${this.currentUser.role === 'teacher' ? `
                        <button class="btn btn--danger btn-icon" onclick="app.deleteSchedule('${schedule._id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
                
                <div class="schedule-description">
                    ${schedule.description || 'No description available.'}
                </div>
                
                <div class="schedule-meta">
                    <span><i class="fas fa-calendar"></i> ${scheduleDate}</span>
                    <span><i class="fas fa-clock"></i> ${schedule.time}</span>
                    ${schedule.meetingLink ? `<span><i class="fas fa-link"></i> Online Meeting</span>` : ''}
                </div>
                
                <div class="schedule-footer">
                    ${schedule.meetingLink ? `
                        <a href="${schedule.meetingLink}" target="_blank" class="btn btn--primary">
                            <i class="fas fa-video"></i> Join Meeting
                        </a>
                    ` : ''}
                    ${schedule.password ? `
                        <div class="meeting-password">
                            <i class="fas fa-key"></i>
                            Password: <strong>${schedule.password}</strong>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    async loadStudents() {
        const contentArea = document.getElementById('contentArea');
        
        contentArea.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <p>Loading students...</p>
            </div>
        `;

        try {
            const students = await this.api.getStudents();
            
            if (students.length === 0) {
                contentArea.innerHTML = `
                    <div class="section-header">
                        <h1><i class="fas fa-users"></i> Students</h1>
                    </div>
                    <div class="empty-state">
                        <i class="fas fa-users"></i>
                        <h3>No Students</h3>
                        <p>No students have been added yet.</p>
                    </div>
                `;
                return;
            }

            const studentsHtml = students.map(student => `
                <div class="student-card" data-id="${student._id}">
                    <div class="student-header">
                        <img src="${student.profileImage || 'https://via.placeholder.com/60'}" alt="${student.name}" />
                        <div class="student-info">
                            <h3>${student.name}</h3>
                            <p>${student.email}</p>${student.bio ? `<small>${student.bio}</small>` : ''}
                        </div>
                        <div class="student-actions">
                            <button class="btn btn--secondary btn-icon" onclick="app.editStudent('${student._id}')" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn--danger btn-icon" onclick="app.deleteStudent('${student._id}')" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="student-meta">
                        <span><i class="fas fa-phone"></i> ${student.phone || 'N/A'}</span>
                        <span><i class="fas fa-calendar"></i> ${student.dateOfBirth || 'N/A'}</span>
                    </div>
                </div>
            `).join('');

            contentArea.innerHTML = `
                <div class="section-header">
                    <h1><i class="fas fa-users"></i> Students</h1>
                </div>
                <div class="students-grid">
                    ${studentsHtml}
                </div>
            `;

        } catch (error) {
            console.error('❌ Error loading students:', error);
            contentArea.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h2>Error Loading Students</h2>
                    <p>Unable to load students data. Please try again.</p>
                </div>
            `;
        }
    }

    async loadFees() {
        const contentArea = document.getElementById('contentArea');
        
        contentArea.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <p>Loading fee management...</p>
            </div>
        `;

        try {
            const studentsWithFees = await this.api.getStudentFees();
            const feeStats = await this.api.getFeeStats();
            
            if (studentsWithFees.length === 0) {
                contentArea.innerHTML = `
                    <div class="section-header">
                        <h1><i class="fas fa-money-check-alt"></i> Fee Management</h1>
                    </div>
                    <div class="empty-state">
                        <i class="fas fa-money-check-alt"></i>
                        <h3>No Fee Records</h3>
                        <p>No fee records found. Add students and manage their fees.</p>
                    </div>
                `;
                return;
            }

            const studentsHtml = studentsWithFees.map(student => {
                const latestFee = student.fees[0];
                const statusClass = latestFee ? `status--${latestFee.status}` : 'status--unknown';
                
                return `
                    <div class="student-card" data-id="${student._id}">
                        <div class="student-header">
                            <img src="${student.profileImage || 'https://via.placeholder.com/60'}" alt="${student.name}" />
                            <div class="student-info">
                                <h3>${student.name}</h3>
                                <p>${student.email}</p>
                            </div>
                            <div class="student-actions">
                                <button class="btn btn--primary btn-icon" onclick="app.openFeePaymentModal('${student._id}', '${student.name}')" title="Update Fee">
                                    <i class="fas fa-money-bill"></i>
                                </button>
                            </div>
                        </div>
                        <div class="student-meta">
                            <span class="status ${statusClass}">
                                <i class="fas fa-circle"></i>
                                ${latestFee ? latestFee.status.toUpperCase() : 'NO RECORDS'}
                            </span>
                            ${latestFee ? `<span><i class="fas fa-calendar"></i> ${latestFee.month} ${latestFee.year}</span>` : ''}
                        </div>
                    </div>
                `;
            }).join('');

            contentArea.innerHTML = `
                <div class="section-header">
                    <h1><i class="fas fa-money-check-alt"></i> Fee Management</h1>
                </div>
                
                <div class="fee-stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon notes-icon"><i class="fas fa-check-circle"></i></div>
                        <div class="stat-content">
                            <h3>${feeStats.paidStudents}</h3>
                            <p>Students with Paid Fees</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon questions-icon"><i class="fas fa-clock"></i></div>
                        <div class="stat-content">
                            <h3>${feeStats.pendingStudents}</h3>
                            <p>Students with Pending Fees</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon books-icon"><i class="fas fa-exclamation-triangle"></i></div>
                        <div class="stat-content">
                            <h3>${feeStats.overdueStudents}</h3>
                            <p>Students with Overdue Fees</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon students-icon"><i class="fas fa-rupee-sign"></i></div>
                        <div class="stat-content">
                            <h3>₹${feeStats.totalAmount}</h3>
                            <p>Total Fee Collection</p>
                        </div>
                    </div>
                </div>
                
                <div class="students-grid">
                    ${studentsHtml}
                </div>
            `;

        } catch (error) {
            console.error('❌ Error loading fees:', error);
            contentArea.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h2>Error Loading Fee Data</h2>
                    <p>Unable to load fee data. Please try again.</p>
                </div>
            `;
        }
    }

    async loadResults() {
        const contentArea = document.getElementById('contentArea');
        
        try {
            const results = await this.api.getResults();
            const leaderboard = this.currentUser.role === 'teacher' ? await this.api.getLeaderboard() : null;
            
            let resultsHtml = '';
            if (results.length === 0) {
                resultsHtml = `
                    <div class="empty-state">
                        <i class="fas fa-trophy"></i>
                        <h3>No Results</h3>
                        <p>No exam results available yet.</p>
                    </div>
                `;
            } else {
                resultsHtml = `
                    <div class="results-grid">
                        ${results.map(result => this.renderResultCard(result)).join('')}
                    </div>
                `;
            }

            let leaderboardHtml = '';
            if (this.currentUser.role === 'teacher' && leaderboard && leaderboard.length > 0) {
                leaderboardHtml = `
                    <div class="leaderboard-section">
                        <h2><i class="fas fa-trophy"></i> Student Leaderboard</h2>
                        <div class="leaderboard-grid">
                            ${leaderboard.slice(0, 10).map(student => this.renderLeaderboardCard(student)).join('')}
                        </div>
                    </div>
                `;
            }

            contentArea.innerHTML = `
                <div class="section-header">
                    <h1><i class="fas fa-trophy"></i> Results</h1>
                    ${this.currentUser.role === 'teacher' ? `
                        <button class="btn btn--primary" onclick="app.openResultModal()">
                            <i class="fas fa-plus"></i> Add Result
                        </button>
                    ` : ''}
                </div>
                
                ${resultsHtml}
                ${leaderboardHtml}
            `;

        } catch (error) {
            console.error('❌ Error loading results:', error);
            contentArea.innerHTML = `<div class="error-state"><i class="fas fa-exclamation-triangle"></i><h2>Error Loading Results</h2><p>Unable to load results. Please try again.</p></div>`;
        }
    }

    renderResultCard(result) {
        const examDate = new Date(result.examDate).toLocaleDateString();
        const gradeClass = result.percentage >= 90 ? 'grade-a' : result.percentage >= 70 ? 'grade-b' : result.percentage >= 50 ? 'grade-c' : 'grade-f';
        
        return `
            <div class="result-card" data-id="${result._id}">
                <div class="result-header">
                    <h3>${result.examName}</h3>
                    <span class="result-grade ${gradeClass}">${result.grade}</span>
                </div>
                
                <div class="result-details">
                    <div class="result-info">
                        <span><i class="fas fa-book"></i> ${result.subject}</span>
                        <span><i class="fas fa-graduation-cap"></i> ${result.class}</span>
                        <span><i class="fas fa-calendar"></i> ${examDate}</span>
                    </div>
                    
                    <div class="result-score">
                        <div class="score-display">
                            <span class="marks">${result.marksObtained}/${result.totalMarks}</span>
                            <span class="percentage">${result.percentage}%</span>
                        </div>
                    </div>
                </div>
                
                ${result.remarks ? `
                    <div class="result-remarks">
                        <i class="fas fa-comment"></i>
                        ${result.remarks}
                    </div>
                ` : ''}
                
                ${this.currentUser.role === 'teacher' ? `
                    <div class="result-actions">
                        <button class="btn btn--secondary btn-icon" onclick="app.editResult('${result._id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn--danger btn-icon" onclick="app.deleteResult('${result._id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderLeaderboardCard(student) {
        const rankClass = student.rank <= 3 ? `rank-${student.rank}` : 'rank-other';
        
        return `
            <div class="leaderboard-card ${rankClass}" data-rank="${student.rank}">
                <div class="leaderboard-rank">
                    <span class="rank-number">${student.rank}</span>
                </div>
                
                <div class="leaderboard-student">
                    <img src="${student.profileImage || 'https://via.placeholder.com/50'}" alt="${student.name}" />
                    <div class="student-details">
                        <h4>${student.name}</h4>
                        <p>${student.email}</p>
                    </div>
                </div>
                
                <div class="leaderboard-stats">
                    <div class="stat">
                        <span class="stat-value">${student.averagePercentage}%</span>
                        <span class="stat-label">Average</span>
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
    }

    async loadProfile() {
        const contentArea = document.getElementById('contentArea');
        
        contentArea.innerHTML = `
            <div class="section-header">
                <h1><i class="fas fa-user"></i> Profile</h1>
            </div>
            <div class="profile-content">
                <p>Manage your personal information and settings</p>
            </div>
        `;
    }

    async loadSettings() {
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `
            <div class="section-header">
                <h1><i class="fas fa-cog"></i> Settings</h1>
            </div>
            <div class="settings-content">
                <p>This section will contain application settings and preferences.</p>
            </div>
        `;
    }

    // Helper methods
    openResourceModal(type) {
        const modal = document.getElementById('resourceModal');
        const modalTitle = document.getElementById('resourceModalTitle');
        const resourceType = document.getElementById('resourceType');
        
        modalTitle.textContent = `Add ${type.charAt(0).toUpperCase() + type.slice(1)}`;
        resourceType.value = type;
        modal.classList.add('show');
    }

    async handleResourceSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);

        try {
            await this.api.createResource(formData);
            this.showNotification('Resource uploaded successfully!', 'success');
            this.closeAllModals();
            
            // Reload current section if it's a resource section
            const resourceType = formData.get('type');
            if (this.currentSection === `${resourceType}s`) {
                this.loadResources(resourceType);
            }
        } catch (error) {
            console.error('❌ Error uploading resource:', error);
            this.showNotification('Failed to upload resource: ' + error.message, 'error');
        }
    }

    async downloadResource(resourceId) {
        try {
            this.showNotification('Starting download...', 'info');
            await this.api.downloadResource(resourceId);
            this.showNotification('Download completed successfully!', 'success');
        } catch (error) {
            console.error('❌ Download failed:', error);
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
            
            // Reload current section
            if (this.currentSection === 'notes') {
                this.loadResources('note');
            } else if (this.currentSection === 'questions') {
                this.loadResources('question');
            } else if (this.currentSection === 'books') {
                this.loadResources('book');
            }
        } catch (error) {
            console.error('❌ Error deleting resource:', error);
            this.showNotification('Failed to delete resource: ' + error.message, 'error');
        }
    }

    openFeePaymentModal(studentId, studentName) {
        const modal = document.getElementById('feePaymentModal');
        const form = document.getElementById('feePaymentForm');
        
        form.reset();
        document.getElementById('feeStudentId').value = studentId;
        document.getElementById('feeStudentName').value = studentName;
        document.getElementById('feeYear').value = new Date().getFullYear();
        
        modal.classList.add('show');
    }

    async handleFeePaymentSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        
        const feeData = {
            studentId: formData.get('studentId'),
            month: formData.get('month'),
            year: formData.get('year'),
            amount: formData.get('amount'),
            status: formData.get('status'),
            paymentDate: formData.get('paymentDate'),
            notes: formData.get('notes')
        };

        try {
            await this.api.updateFeeStatus(feeData);
            this.showNotification('Fee status updated successfully!', 'success');
            this.closeAllModals();
            if (this.currentSection === 'fees') {
                this.loadFees();
            }
        } catch (error) {
            console.error('❌ Error updating fee status:', error);
            this.showNotification('Failed to update fee status: ' + error.message, 'error');
        }
    }

    closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.classList.remove('show');
        });
    }

    handleSearch(query) {
        // Search functionality can be implemented here
        console.log('Searching for:', query);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 DOM loaded, initializing app...');
    window.app = new EducationApp();
    
    // Add CSS animations for notifications
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 12px;
                flex: 1;
            }
            
            .notification button {
                background: none;
                border: none;
                color: var(--color-text-secondary);
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                transition: all 0.2s;
            }
            
            .notification button:hover {
                background: rgba(0,0,0,0.1);
            }

            /* Fee Alert Styles */
            .fee-alert {
                display: flex;
                align-items: center;
                gap: var(--space-16);
                padding: var(--space-20);
                border-radius: var(--radius-lg);
                margin-bottom: var(--space-24);
                border-left: 4px solid;
            }
            
            .fee-alert--success {
                background: rgba(var(--color-success-rgb), 0.1);
                border-left-color: var(--color-success);
                color: var(--color-success);
            }
            
            .fee-alert--warning {
                background: rgba(var(--color-warning-rgb), 0.1);
                border-left-color: var(--color-warning);
                color: var(--color-warning);
            }
            
            .fee-alert--danger {
                background: rgba(var(--color-error-rgb), 0.1);
                border-left-color: var(--color-error);
                color: var(--color-error);
            }
            
            .fee-alert i {
                font-size: var(--font-size-2xl);
                flex-shrink: 0;
            }
            
            .fee-alert h3 {
                margin: 0 0 var(--space-4) 0;
                font-size: var(--font-size-lg);
                font-weight: var(--font-weight-semibold);
            }
            
            .fee-alert p {
                margin: 0;
                opacity: 0.8;
            }

            /* Fee Stats Grid */
            .fee-stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: var(--space-16);
                margin-bottom: var(--space-32);
            }

            /* Announcements Styles */
            .announcements-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
                gap: var(--space-16);
            }
            
            .announcement-card {
                background: var(--color-surface);
                border: 1px solid var(--color-border);
                border-radius: var(--radius-lg);
                padding: var(--space-24);
                transition: all var(--duration-fast);
                position: relative;
            }
            
            .announcement-card--urgent {
                border-left: 4px solid var(--color-error);
                background: rgba(var(--color-error-rgb), 0.05);
            }
            
            .announcement-card:hover {
                transform: translateY(-2px);
                box-shadow: var(--shadow-lg);
            }
            
            .announcement-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: var(--space-12);
            }
            
            .announcement-title h3 {
                font-size: var(--font-size-lg);
                font-weight: var(--font-weight-semibold);
                color: var(--color-text);
                margin: 0;
                display: flex;
                align-items: center;
                gap: var(--space-8);
            }
            
            .announcement-priority {
                font-size: var(--font-size-xs);
                padding: var(--space-2) var(--space-8);
                border-radius: var(--radius-full);
                font-weight: var(--font-weight-semibold);
                text-transform: uppercase;
            }
            
            .priority--high {
                background: rgba(var(--color-error-rgb), 0.2);
                color: var(--color-error);
            }
            
            .priority--normal {
                background: rgba(var(--color-info-rgb), 0.2);
                color: var(--color-info);
            }
            
            .priority--low {
                background: rgba(var(--color-success-rgb), 0.2);
                color: var(--color-success);
            }
            
            .announcement-content {
                margin-bottom: var(--space-16);
                color: var(--color-text-secondary);
                line-height: var(--line-height-normal);
            }
            
            .announcement-meta {
                display: flex;
                gap: var(--space-16);
                font-size: var(--font-size-sm);
                color: var(--color-text-secondary);
                flex-wrap: wrap;
            }
            
            .announcement-meta span {
                display: flex;
                align-items: center;
                gap: var(--space-4);
            }
            
            .announcement-actions {
                display: flex;
                gap: var(--space-4);
            }
            
            /* Notice Board Styles */
            .notices-container {
                display: grid;
                gap: var(--space-16);
            }
            
            .notice-card {
                background: var(--color-surface);
                border: 1px solid var(--color-border);
                border-radius: var(--radius-lg);
                padding: var(--space-24);
                transition: all var(--duration-fast);
                position: relative;
            }
            
            .notice-card--urgent {
                border-left: 4px solid var(--color-error);
                background: rgba(var(--color-error-rgb), 0.05);
            }
            
            .notice-card--unread {
                border-left: 4px solid var(--color-primary);
                background: rgba(var(--color-primary-rgb), 0.05);
            }
            
            .notice-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: var(--space-16);
            }
            
            .notice-title {
                display: flex;
                flex-direction: column;
                gap: var(--space-8);
            }
            
            .notice-title h3 {
                font-size: var(--font-size-lg);
                font-weight: var(--font-weight-semibold);
                color: var(--color-text);
                margin: 0;
                display: flex;
                align-items: center;
                gap: var(--space-8);
            }
            
            .new-badge {
                background: var(--color-primary);
                color: var(--color-btn-primary-text);
                font-size: var(--font-size-xs);
                padding: var(--space-2) var(--space-6);
                border-radius: var(--radius-full);
                font-weight: var(--font-weight-semibold);
                animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
            
            .notice-date {
                text-align: right;
                color: var(--color-text-secondary);
                font-size: var(--font-size-sm);
            }
            
            .notice-content {
                color: var(--color-text-secondary);
                line-height: var(--line-height-normal);
                margin-bottom: var(--space-16);
            }
            
            .notice-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding-top: var(--space-12);
                border-top: 1px solid var(--color-border);
                font-size: var(--font-size-sm);
            }
            
            .notice-author {
                display: flex;
                align-items: center;
                gap: var(--space-4);
                color: var(--color-text-secondary);
            }
            
            .notice-status {
                display: flex;
                align-items: center;
                gap: var(--space-4);
                font-weight: var(--font-weight-medium);
            }
            
            .status--read {
                color: var(--color-success);
            }
            
            .status--unread {
                color: var(--color-primary);
            }
            
            .notice-stats {
                display: flex;
                gap: var(--space-16);
                font-size: var(--font-size-sm);
                color: var(--color-text-secondary);
            }
            
            .notice-count {
                display: flex;
                align-items: center;
                gap: var(--space-4);
            }
            
            /* Notification Badge */
            .notification-badge {
                position: absolute;
                top: -8px;
                right: -8px;
                background: var(--color-error);
                color: var(--color-btn-primary-text);
                border-radius: var(--radius-full);
                font-size: var(--font-size-xs);
                font-weight: var(--font-weight-bold);
                padding: 2px 6px;
                min-width: 18px;
                height: 18px;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: bounce 2s infinite;
            }
            
            @keyframes bounce {
                0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                40% { transform: translateY(-3px); }
                60% { transform: translateY(-2px); }
            }

            /* Results Styles */
            .results-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                gap: var(--space-16);
                margin-bottom: var(--space-32);
            }
            
            .result-card {
                background: var(--color-surface);
                border: 1px solid var(--color-border);
                border-radius: var(--radius-lg);
                padding: var(--space-24);
                transition: all var(--duration-fast);
                position: relative;
            }
            
            .result-card:hover {
                transform: translateY(-2px);
                box-shadow: var(--shadow-lg);
            }
            
            .result-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: var(--space-16);
            }
            
            .result-grade {
                font-size: var(--font-size-xl);
                font-weight: var(--font-weight-bold);
                padding: var(--space-8) var(--space-12);
                border-radius: var(--radius-base);
            }
            
            .grade-a { background: var(--color-success); color: white; }
            .grade-b { background: var(--color-primary); color: white; }
            .grade-c { background: var(--color-warning); color: white; }
            .grade-f { background: var(--color-error); color: white; }
            
            .leaderboard-section {
                margin-top: var(--space-32);
            }
            
            .leaderboard-grid {
                display: grid;
                gap: var(--space-12);
            }
            
            .leaderboard-card {
                display: flex;
                align-items: center;
                gap: var(--space-16);
                background: var(--color-surface);
                border: 1px solid var(--color-border);
                border-radius: var(--radius-lg);
                padding: var(--space-16);
                transition: all var(--duration-fast);
            }
            
            .leaderboard-card:hover {
                transform: translateY(-1px);
                box-shadow: var(--shadow-md);
            }
            
            .rank-1 { border-left: 4px solid #FFD700; }
            .rank-2 { border-left: 4px solid #C0C0C0; }
            .rank-3 { border-left: 4px solid #CD7F32; }
            
            @media (max-width: 768px) {
                .announcements-grid {
                    grid-template-columns: 1fr;
                }
                
                .notice-header {
                    flex-direction: column;
                    gap: var(--space-8);
                }
                
                .notice-date {
                    text-align: left;
                }
                
                .notice-footer {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: var(--space-8);
                }
                
                .results-grid {
                    grid-template-columns: 1fr;
                }
            }
        `;
        document.head.appendChild(style);
    }
});