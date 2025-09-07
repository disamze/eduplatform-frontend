// Complete app.js with Fee Management System

// API Service Class
class ApiService {
    constructor() {
        this.baseURL = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1'
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
            console.log('🔗 Download URL:', downloadUrl);
            
            const response = await fetch(downloadUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
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
}

// Main Education App Class
class EducationApp {
    constructor() {
        this.api = new ApiService();
        this.currentUser = null;
        this.currentSection = 'dashboard';
        this.selectedStudentId = null;
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
            <button class="notification-close" onclick="this.parentElement.classList.add('removing'); setTimeout(() => this.parentElement.remove(), 300);">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Apply immediate styles
        Object.assign(notification.style, {
            position: 'fixed',
            top: '80px',
            right: '20px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            zIndex: '3000',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            maxWidth: '400px',
            minWidth: '300px',
            animation: 'slideInRight 0.4s ease-out',
            borderLeft: `4px solid ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'}`
        });
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.classList.add('removing');
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    showLogin() {
        console.log('📝 Showing login screen');
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('mainApp').classList.add('hidden');
    }

    async showMainApp() {
        console.log('🏠 Showing main application');
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');

        this.updateUserProfile();
        this.setupSidebar();
        await this.loadDashboard();
    }

    updateUserProfile() {
        const userInfo = document.getElementById('userInfo');
        const userAvatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');

        if (userInfo) {
            userInfo.textContent = this.currentUser.role.charAt(0).toUpperCase() + this.currentUser.role.slice(1);
        }

        if (userAvatar) {
            const imageSrc = this.currentUser.profileImage
                ? (this.currentUser.profileImage.startsWith('http')
                    ? this.currentUser.profileImage
                    : `${this.api.baseURL.replace('/api', '')}/${this.currentUser.profileImage}`)
                : 'https://via.placeholder.com/40';
            userAvatar.src = imageSrc;
        }

        if (userName) {
            userName.textContent = this.currentUser.name;
        }
    }

    setupSidebar() {
        const teacherOnlyItems = document.querySelectorAll('.teacher-only');
        if (this.currentUser.role !== 'teacher') {
            teacherOnlyItems.forEach(item => {
                item.style.display = 'none';
            });
        }
    }

    bindEvents() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        const sidebarItems = document.querySelectorAll('.sidebar-item');
        sidebarItems.forEach(item => {
            item.addEventListener('click', (e) => this.handleNavigation(e));
        });

        const mobileSidebarToggle = document.getElementById('mobileSidebarToggle');
        if (mobileSidebarToggle) {
            mobileSidebarToggle.addEventListener('click', () => this.toggleMobileSidebar());
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e));
        }

        this.bindModalEvents();

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModals();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModals();
            }
        });
    }

    bindModalEvents() {
        const resourceForm = document.getElementById('resourceForm');
        if (resourceForm) {
            resourceForm.addEventListener('submit', (e) => this.handleResourceSubmit(e));
        }

        const studentEditForm = document.getElementById('studentEditForm');
        if (studentEditForm) {
            studentEditForm.addEventListener('submit', (e) => this.handleStudentEditSubmit(e));
        }

        const feePaymentForm = document.getElementById('feePaymentForm');
        if (feePaymentForm) {
            feePaymentForm.addEventListener('submit', (e) => this.handleFeePaymentSubmit(e));
        }

        // Bind image upload events
        const editStudentImageInput = document.getElementById('editStudentImageInput');
        if (editStudentImageInput) {
            editStudentImageInput.addEventListener('change', (e) => this.handleStudentImageUpload(e));
        }

        const closeButtons = document.querySelectorAll('.close-modal');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => this.closeModals());
        });
    }

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const errorMsg = document.getElementById('loginError');
        const loginBtn = document.getElementById('loginBtn');

        try {
            this.showLoading(loginBtn, true);
            errorMsg.style.display = 'none';

            console.log('🔐 Attempting login for:', email);
            const response = await this.api.login(email, password);

            this.api.setAuthToken(response.token);
            this.currentUser = response.user;

            console.log('✅ Login successful:', this.currentUser.name);
            await this.showMainApp();

        } catch (error) {
            console.error('❌ Login failed:', error);
            errorMsg.textContent = error.message;
            errorMsg.style.display = 'block';
        } finally {
            this.showLoading(loginBtn, false);
        }
    }

    handleNavigation(e) {
        e.preventDefault();
        const section = e.currentTarget.getAttribute('data-section');
        if (!section) return;

        this.currentSection = section;

        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.remove('active');
        });
        e.currentTarget.classList.add('active');

        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            const titles = {
                'dashboard': 'Dashboard',
                'notes': 'Notes',
                'questions': 'Questions', 
                'books': 'Books',
                'schedule': 'Schedule',
                'students': 'Students',
                'fees': 'Fee Management',
                'profile': 'Profile',
                'settings': 'Settings'
            };
            pageTitle.textContent = titles[section] || section.charAt(0).toUpperCase() + section.slice(1);
        }

        this.closeMobileSidebar();
        this.loadSection(section);
    }

    async loadSection(section) {
        console.log('📄 Loading section:', section);
        const contentArea = document.getElementById('contentArea');

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
                await this.loadSchedules();
                break;
            case 'students':
                await this.loadStudents();
                break;
            case 'fees':
                await this.loadFeeManagement();
                break;
            case 'profile':
                await this.loadProfile();
                break;
            case 'settings':
                this.loadSettings();
                break;
            default:
                contentArea.innerHTML = `
                    <div class="error-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h2>Section Not Found</h2>
                        <p>The requested section could not be found.</p>
                    </div>
                `;
                break;
        }
    }

    async loadDashboard() {
        const contentArea = document.getElementById('contentArea');
        
        try {
            if (this.currentUser.role === 'teacher') {
                const stats = await this.api.getDashboardStats();
                const feeStats = await this.api.getFeeStats();
                
                contentArea.innerHTML = `
                    <div class="dashboard-header">
                        <h1>Teacher Dashboard</h1>
                        <p>Here's an overview of your teaching platform.</p>
                    </div>
                    
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon notes-icon">
                                <i class="fas fa-book"></i>
                            </div>
                            <div class="stat-content">
                                <h3>${stats.notes}</h3>
                                <p>Notes</p>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-icon questions-icon">
                                <i class="fas fa-question-circle"></i>
                            </div>
                            <div class="stat-content">
                                <h3>${stats.questions}</h3>
                                <p>Questions</p>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-icon books-icon">
                                <i class="fas fa-book-open"></i>
                            </div>
                            <div class="stat-content">
                                <h3>${stats.books}</h3>
                                <p>Books</p>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-icon students-icon">
                                <i class="fas fa-users"></i>
                            </div>
                            <div class="stat-content">
                                <h3>${stats.students}</h3>
                                <p>Students</p>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-icon schedule-icon">
                                <i class="fas fa-calendar-alt"></i>
                            </div>
                            <div class="stat-content">
                                <h3>${stats.schedules}</h3>
                                <p>Schedules</p>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-icon" style="background: linear-gradient(135deg, #10b981, #059669);">
                                <i class="fas fa-money-bill-wave"></i>
                            </div>
                            <div class="stat-content">
                                <h3>${feeStats?.paidStudents || 0}</h3>
                                <p>Paid Fees</p>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-icon" style="background: linear-gradient(135deg, #f59e0b, #d97706);">
                                <i class="fas fa-exclamation-triangle"></i>
                            </div>
                            <div class="stat-content">
                                <h3>${feeStats?.pendingStudents || 0}</h3>
                                <p>Pending Fees</p>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-icon" style="background: linear-gradient(135deg, #ef4444, #dc2626);">
                                <i class="fas fa-clock"></i>
                            </div>
                            <div class="stat-content">
                                <h3>${feeStats?.overdueStudents || 0}</h3>
                                <p>Overdue Fees</p>
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
                            <button class="btn btn--primary" onclick="app.loadSection('fees')">
                                <i class="fas fa-money-bill-wave"></i> Manage Fees
                            </button>
                        </div>
                    </div>
                `;
            } else {
                const stats = await this.api.getDashboardStats();
                const feeStatus = await this.api.getStudentFeeStatus();
                
                // Generate fee notifications for student
                let feeNotifications = '';
                if (feeStatus && feeStatus.length > 0) {
                    const pendingFees = feeStatus.filter(fee => fee.status === 'pending');
                    const overdueFees = feeStatus.filter(fee => fee.status === 'overdue');
                    
                    if (overdueFees.length > 0) {
                        feeNotifications += `
                            <div class="fee-alert fee-alert--danger">
                                <i class="fas fa-exclamation-triangle"></i>
                                <div>
                                    <h3>⚠️ Overdue Fee Alert</h3>
                                    <p>You have ${overdueFees.length} overdue fee(s). Please pay immediately to avoid account suspension.</p>
                                </div>
                            </div>
                        `;
                    } else if (pendingFees.length > 0) {
                        feeNotifications += `
                            <div class="fee-alert fee-alert--warning">
                                <i class="fas fa-clock"></i>
                                <div>
                                    <h3>📋 Fee Payment Reminder</h3>
                                    <p>You have ${pendingFees.length} pending fee payment(s). Please pay on time to continue your classes.</p>
                                </div>
                            </div>
                        `;
                    } else {
                        feeNotifications += `
                            <div class="fee-alert fee-alert--success">
                                <i class="fas fa-check-circle"></i>
                                <div>
                                    <h3>✅ All Fees Paid</h3>
                                    <p>Great! All your fees are up to date. Keep up the good work!</p>
                                </div>
                            </div>
                        `;
                    }
                }
                
                contentArea.innerHTML = `
                    <div class="dashboard-header">
                        <h1>Student Dashboard</h1>
                        <p>Welcome back! Continue your learning journey.</p>
                    </div>
                    
                    ${feeNotifications}
                    
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon resources-icon">
                                <i class="fas fa-book"></i>
                            </div>
                            <div class="stat-content">
                                <h3>${stats.totalResources}</h3>
                                <p>Total Resources</p>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-icon schedule-icon">
                                <i class="fas fa-calendar-alt"></i>
                            </div>
                            <div class="stat-content">
                                <h3>${stats.upcomingSchedules}</h3>
                                <p>Upcoming Classes</p>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-icon" style="background: linear-gradient(135deg, #10b981, #059669);">
                                <i class="fas fa-money-bill-wave"></i>
                            </div>
                            <div class="stat-content">
                                <h3>${feeStatus?.filter(f => f.status === 'paid').length || 0}</h3>
                                <p>Fees Paid</p>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-icon" style="background: linear-gradient(135deg, #f59e0b, #d97706);">
                                <i class="fas fa-clock"></i>
                            </div>
                            <div class="stat-content">
                                <h3>${feeStatus?.filter(f => f.status === 'pending' || f.status === 'overdue').length || 0}</h3>
                                <p>Pending Fees</p>
                            </div>
                        </div>
                    </div>
                    
                    ${feeStatus && feeStatus.length > 0 ? `
                        <div class="fee-status-section">
                            <h2><i class="fas fa-money-bill-wave"></i> Fee Status</h2>
                            <div class="fee-status-grid">
                                ${feeStatus.map(fee => `
                                    <div class="fee-status-card fee-status--${fee.status}">
                                        <div class="fee-month">${fee.month} ${fee.year}</div>
                                        <div class="fee-amount">₹${fee.amount}</div>
                                        <div class="fee-status-badge fee-badge--${fee.status}">
                                            ${fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                                        </div>
                                        ${fee.paymentDate ? `<div class="fee-date">Paid on ${new Date(fee.paymentDate).toLocaleDateString()}</div>` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                `;
            }
        } catch (error) {
            console.error('❌ Error loading dashboard:', error);
            contentArea.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h2>Error Loading Dashboard</h2>
                    <p>Unable to load dashboard data. Please try again.</p>
                </div>
            `;
        }
    }

    async loadFeeManagement() {
        if (this.currentUser.role !== 'teacher') {
            return;
        }

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
            const studentFees = await this.api.getStudentFees();
            const feeStats = await this.api.getFeeStats();

            const paidStudents = studentFees.filter(student => {
                return student.fees.some(fee => fee.status === 'paid');
            });

            const unpaidStudents = studentFees.filter(student => {
                return student.fees.some(fee => fee.status === 'pending' || fee.status === 'overdue');
            });

            const allPaidStudents = studentFees.filter(student => {
                return student.fees.every(fee => fee.status === 'paid');
            });

            let feesHtml = '';
            
            if (studentFees.length === 0) {
                feesHtml = `
                    <div class="empty-state">
                        <i class="fas fa-money-bill-wave"></i>
                        <h3>No Fee Records</h3>
                        <p>No fee records found. Add students and manage their fees.</p>
                    </div>
                `;
            } else {
                const studentFeeCards = studentFees.map(student => {
                    const latestFee = student.fees[0]; // Assuming fees are sorted by latest
                    const totalPaid = student.fees.filter(f => f.status === 'paid').length;
                    const totalPending = student.fees.filter(f => f.status === 'pending' || f.status === 'overdue').length;

                    const imageSrc = student.profileImage
                        ? (student.profileImage.startsWith('http')
                            ? student.profileImage
                            : `${this.api.baseURL.replace('/api', '')}/${student.profileImage}`)
                        : 'https://via.placeholder.com/60';

                    return `
                        <div class="fee-student-card">
                            <div class="student-header">
                                <img src="${imageSrc}" alt="${student.name}">
                                <div class="student-info">
                                    <h3>${student.name}</h3>
                                    <p>${student.email}</p>
                                    <div class="fee-summary">
                                        <span class="fee-paid">✅ Paid: ${totalPaid}</span>
                                        <span class="fee-pending">⏳ Pending: ${totalPending}</span>
                                    </div>
                                </div>
                                <div class="student-actions">
                                    <button class="btn btn--primary btn-sm" onclick="app.openFeePaymentModal('${student._id}', '${student.name}')">
                                        <i class="fas fa-money-bill-wave"></i> Manage Fee
                                    </button>
                                </div>
                            </div>
                            
                            <div class="recent-fees">
                                <h4>Recent Fee Records</h4>
                                <div class="fee-records">
                                    ${student.fees.slice(0, 3).map(fee => `
                                        <div class="fee-record fee-record--${fee.status}">
                                            <span class="fee-month">${fee.month} ${fee.year}</span>
                                            <span class="fee-amount">₹${fee.amount}</span>
                                            <span class="fee-status fee-status--${fee.status}">
                                                ${fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                                            </span>
                                            ${fee.paymentDate ? `<span class="fee-date">${new Date(fee.paymentDate).toLocaleDateString()}</span>` : ''}
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');

                feesHtml = `
                    <div class="fee-stats-grid">
                        <div class="fee-stat-card fee-stat--paid">
                            <i class="fas fa-check-circle"></i>
                            <div>
                                <h3>${feeStats?.paidStudents || 0}</h3>
                                <p>Students with Paid Fees</p>
                            </div>
                        </div>
                        
                        <div class="fee-stat-card fee-stat--pending">
                            <i class="fas fa-clock"></i>
                            <div>
                                <h3>${feeStats?.pendingStudents || 0}</h3>
                                <p>Students with Pending Fees</p>
                            </div>
                        </div>
                        
                        <div class="fee-stat-card fee-stat--overdue">
                            <i class="fas fa-exclamation-triangle"></i>
                            <div>
                                <h3>${feeStats?.overdueStudents || 0}</h3>
                                <p>Students with Overdue Fees</p>
                            </div>
                        </div>
                        
                        <div class="fee-stat-card fee-stat--total">
                            <i class="fas fa-money-bill-wave"></i>
                            <div>
                                <h3>₹${feeStats?.totalAmount || 0}</h3>
                                <p>Total Fee Collection</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="fee-filters">
                        <button class="btn btn--secondary filter-btn active" onclick="app.filterFees('all')">All Students</button>
                        <button class="btn btn--secondary filter-btn" onclick="app.filterFees('paid')">Paid (${allPaidStudents.length})</button>
                        <button class="btn btn--secondary filter-btn" onclick="app.filterFees('pending')">Pending (${unpaidStudents.length})</button>
                    </div>
                    
                    <div class="fee-students-grid" id="feeStudentsGrid">
                        ${studentFeeCards}
                    </div>
                `;
            }

            contentArea.innerHTML = `
                <div class="section-header">
                    <h1><i class="fas fa-money-bill-wave"></i> Fee Management</h1>
                    <div class="fee-actions">
                        <button class="btn btn--primary" onclick="app.loadSection('students')">
                            <i class="fas fa-plus"></i> Add Student
                        </button>
                    </div>
                </div>
                
                ${feesHtml}
            `;

        } catch (error) {
            console.error('❌ Error loading fee management:', error);
            contentArea.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h2>Error Loading Fee Management</h2>
                    <p>Unable to load fee data. Please try again.</p>
                </div>
            `;
        }
    }

    filterFees(type) {
        // Update filter button styles
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');

        // Filter the fee cards (implementation can be enhanced)
        const cards = document.querySelectorAll('.fee-student-card');
        cards.forEach(card => {
            // Simple show/hide based on filter type
            // In a real implementation, you'd filter based on actual fee status
            card.style.display = 'block';
        });
    }

    openFeePaymentModal(studentId, studentName) {
        document.getElementById('paymentStudentId').value = studentId;
        document.getElementById('paymentStudentName').value = studentName;
        
        // Set current month and year as default
        const now = new Date();
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
        document.getElementById('paymentMonth').value = months[now.getMonth()];
        document.getElementById('paymentYear').value = now.getFullYear();
        
        document.getElementById('feePaymentModal').classList.add('show');
    }

    async handleFeePaymentSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const feeData = Object.fromEntries(formData.entries());

        try {
            this.showNotification('Updating fee status...', 'info');
            
            await this.api.updateFeeStatus(feeData);
            
            this.showNotification('Fee status updated successfully!', 'success');
            
            // Close modal and refresh
            this.closeModals();
            await this.loadFeeManagement();
            
        } catch (error) {
            console.error('❌ Error updating fee status:', error);
            this.showNotification(`Failed to update fee status: ${error.message}`, 'error');
        }
    }

    async loadProfile() {
        const contentArea = document.getElementById('contentArea');
        
        try {
            const user = await this.api.getUserProfile();
            
            const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long'
            });
            
            const lastUpdated = user.updatedAt ? new Date(user.updatedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }) : 'Never';

            const profileImageSrc = user.profileImage
                ? (user.profileImage.startsWith('http')
                    ? user.profileImage
                    : `${this.api.baseURL.replace('/api', '')}/${user.profileImage}`)
                : 'https://via.placeholder.com/200';

            contentArea.innerHTML = `
                <div class="profile-container">
                    <div class="profile-header">
                        <h1><i class="fas fa-user"></i> My Profile</h1>
                        <p>Manage your personal information and settings</p>
                    </div>
                    
                    <div class="profile-content">
                        <div class="profile-image-section">
                            <div class="profile-image-container">
                                <img src="${profileImageSrc}" alt="Profile Picture" class="profile-image" id="profileImage">
                                <div class="image-overlay" onclick="document.getElementById('profileImageInput').click()">
                                    <i class="fas fa-camera"></i>
                                    <span>Change Photo</span>
                                </div>
                                <input type="file" id="profileImageInput" accept="image/*" style="display: none;">
                            </div>
                            
                            <div class="image-actions">
                                <button class="btn btn--primary file-upload-btn" onclick="document.getElementById('profileImageInput').click()">
                                    <i class="fas fa-upload"></i> Upload New Photo
                                </button>
                                <button class="btn btn--secondary" onclick="app.removeProfileImage()">
                                    <i class="fas fa-trash"></i> Remove Photo
                                </button>
                            </div>
                        </div>
                        
                        <div class="profile-info-section">
                            <form class="profile-form" id="profileForm">
                                <div class="form-group">
                                    <label class="form-label">
                                        <i class="fas fa-user"></i> Full Name
                                    </label>
                                    <input type="text" name="name" class="form-control" value="${user.name || ''}" required>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label">
                                        <i class="fas fa-envelope"></i> Email Address
                                    </label>
                                    <input type="email" class="form-control" value="${user.email}" disabled>
                                    <small class="form-help">Email address cannot be changed</small>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label">
                                        <i class="fas fa-phone"></i> Phone Number
                                    </label>
                                    <input type="tel" name="phone" class="form-control" value="${user.phone || ''}" placeholder="+91 9876543210">
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label">
                                        <i class="fas fa-calendar"></i> Date of Birth
                                    </label>
                                    <input type="date" name="dateOfBirth" class="form-control" value="${user.dateOfBirth || ''}">
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label">
                                        <i class="fas fa-info-circle"></i> Bio
                                    </label>
                                    <textarea name="bio" class="form-control" rows="4" placeholder="Tell us about yourself...">${user.bio || ''}</textarea>
                                </div>
                                
                                <div class="profile-actions">
                                    <button type="button" class="btn btn--secondary" onclick="app.loadProfile()">
                                        <i class="fas fa-undo"></i> Reset
                                    </button>
                                    <button type="submit" class="btn btn--primary">
                                        <i class="fas fa-save"></i> Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                    
                    <div class="account-info-section">
                        <h3><i class="fas fa-info-circle"></i> Account Information</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Role</label>
                                <span>${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span>
                            </div>
                            <div class="info-item">
                                <label>Member Since</label>
                                <span>${memberSince}</span>
                            </div>
                            <div class="info-item">
                                <label>Last Updated</label>
                                <span>${lastUpdated}</span>
                            </div>
                            <div class="info-item">
                                <label>Account Status</label>
                                <span class="status status--success">Active</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Bind profile form submit
            const profileForm = document.getElementById('profileForm');
            if (profileForm) {
                profileForm.addEventListener('submit', (e) => this.handleProfileSubmit(e));
            }

            // Bind profile image upload
            const profileImageInput = document.getElementById('profileImageInput');
            if (profileImageInput) {
                profileImageInput.addEventListener('change', (e) => this.handleProfileImageUpload(e));
            }

        } catch (error) {
            console.error('❌ Error loading profile:', error);
            contentArea.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h2>Error Loading Profile</h2>
                    <p>Unable to load profile data. Please try again.</p>
                </div>
            `;
        }
    }

    async loadStudents() {
        if (this.currentUser.role !== 'teacher') {
            return;
        }

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

            let studentsHtml = '';
            
            if (students.length === 0) {
                studentsHtml = `
                    <div class="empty-state">
                        <i class="fas fa-users"></i>
                        <h3>No Students Yet</h3>
                        <p>No students have been added yet.</p>
                        <button class="btn btn--primary" onclick="app.openStudentModal()">
                            <i class="fas fa-plus"></i> Add Student
                        </button>
                    </div>
                `;
            } else {
                const studentCards = students.map(student => {
                    const imageSrc = student.profileImage
                        ? (student.profileImage.startsWith('http')
                            ? student.profileImage
                            : `${this.api.baseURL.replace('/api', '')}/${student.profileImage}`)
                        : 'https://via.placeholder.com/60';

                    return `
                        <div class="student-card">
                            <div class="student-header">
                                <div class="student-image-container" onclick="app.openStudentImageUpload('${student._id}')">
                                    <img src="${imageSrc}" alt="${student.name}">
                                    <div class="image-upload-overlay">
                                        <i class="fas fa-camera"></i>
                                    </div>
                                </div>
                                <div class="student-info">
                                    <h3>${student.name}</h3>
                                    <p>${student.email}</p>
                                    ${student.bio ? `<small>${student.bio}</small>` : ''}
                                </div>
                                <div class="student-actions">
                                    <button class="btn-icon btn--secondary" onclick="app.editStudent('${student._id}')" title="Edit student">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn-icon btn--danger" onclick="app.deleteStudent('${student._id}')" title="Delete student">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="student-meta">
                                ${student.phone ? `<span><i class="fas fa-phone"></i> ${student.phone}</span>` : ''}
                                ${student.dateOfBirth ? `<span><i class="fas fa-birthday-cake"></i> ${new Date(student.dateOfBirth).toLocaleDateString()}</span>` : ''}
                                <span><i class="fas fa-calendar"></i> Joined ${new Date(student.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    `;
                }).join('');

                studentsHtml = `
                    <div class="students-grid">
                        ${studentCards}
                    </div>
                `;
            }

            contentArea.innerHTML = `
                <div class="section-header">
                    <h1>Students Management</h1>
                    <button class="btn btn--primary" onclick="app.openStudentModal()">
                        <i class="fas fa-plus"></i> Add Student
                    </button>
                </div>
                
                <div class="student-form-section" id="studentFormSection" style="display: none;">
                    <h2>Add New Student</h2>
                    <form id="studentForm" class="form-grid">
                        <div class="form-group">
                            <label class="form-label">Full Name</label>
                            <input type="text" name="name" class="form-control" required>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Email Address</label>
                            <input type="email" name="email" class="form-control" required>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Password</label>
                            <input type="password" name="password" class="form-control" required>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Phone Number</label>
                            <input type="tel" name="phone" class="form-control">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Date of Birth</label>
                            <input type="date" name="dateOfBirth" class="form-control">
                        </div>
                        
                        <div class="form-group" style="grid-column: 1 / -1;">
                            <label class="form-label">Bio</label>
                            <textarea name="bio" class="form-control" rows="3"></textarea>
                        </div>
                        
                        <div class="form-group" style="grid-column: 1 / -1;">
                            <button type="submit" class="btn btn--primary">
                                <i class="fas fa-plus"></i> Add Student
                            </button>
                            <button type="button" class="btn btn--secondary" onclick="document.getElementById('studentFormSection').style.display='none'">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
                
                ${studentsHtml}

                <!-- Hidden file input for profile image upload -->
                <input type="file" id="studentImageUploadInput" accept="image/*" style="display: none;">
            `;

            // Bind student form events
            const studentForm = document.getElementById('studentForm');
            if (studentForm) {
                studentForm.addEventListener('submit', (e) => this.handleStudentSubmit(e));
            }

            // Bind student image upload
            const studentImageUploadInput = document.getElementById('studentImageUploadInput');
            if (studentImageUploadInput) {
                studentImageUploadInput.addEventListener('change', (e) => this.handleStudentImageUploadDirect(e));
            }

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

    // Student image upload methods
    openStudentImageUpload(studentId) {
        this.selectedStudentId = studentId;
        document.getElementById('studentImageUploadInput').click();
    }

    async handleStudentImageUploadDirect(e) {
        const file = e.target.files[0];
        if (!file || !this.selectedStudentId) return;

        try {
            const formData = new FormData();
            formData.append('profileImage', file);

            this.showNotification('Uploading image...', 'info');
            
            const response = await this.api.uploadStudentProfileImage(this.selectedStudentId, formData);
            
            this.showNotification('Profile image updated successfully!', 'success');
            
            // Refresh students list
            await this.loadStudents();
            
        } catch (error) {
            console.error('❌ Error uploading student image:', error);
            this.showNotification(`Failed to upload image: ${error.message}`, 'error');
        }

        // Clear the input
        e.target.value = '';
        this.selectedStudentId = null;
    }

    openStudentModal() {
        const studentFormSection = document.getElementById('studentFormSection');
        if (studentFormSection) {
            studentFormSection.style.display = 'block';
            studentFormSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    async handleStudentSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const studentData = Object.fromEntries(formData.entries());

        try {
            this.showNotification('Adding student...', 'info');
            
            await this.api.createStudent(studentData);
            
            this.showNotification('Student added successfully!', 'success');
            
            // Hide form and refresh students list
            document.getElementById('studentFormSection').style.display = 'none';
            e.target.reset();
            await this.loadStudents();
            
        } catch (error) {
            console.error('❌ Error adding student:', error);
            this.showNotification(`Failed to add student: ${error.message}`, 'error');
        }
    }

    async editStudent(studentId) {
        try {
            // Get student details
            const students = await this.api.getStudents();
            const student = students.find(s => s._id === studentId);
            
            if (!student) {
                this.showNotification('Student not found', 'error');
                return;
            }

            // Populate edit modal
            document.getElementById('editStudentId').value = student._id;
            document.getElementById('editStudentName').value = student.name || '';
            document.getElementById('editStudentEmail').value = student.email || '';
            document.getElementById('editStudentPhone').value = student.phone || '';
            document.getElementById('editStudentDob').value = student.dateOfBirth || '';
            document.getElementById('editStudentBio').value = student.bio || '';

            const imageSrc = student.profileImage
                ? (student.profileImage.startsWith('http')
                    ? student.profileImage
                    : `${this.api.baseURL.replace('/api', '')}/${student.profileImage}`)
                : 'https://via.placeholder.com/80';

            document.getElementById('editStudentImage').src = imageSrc;

            // Show modal
            document.getElementById('studentEditModal').classList.add('show');

        } catch (error) {
            console.error('❌ Error loading student for edit:', error);
            this.showNotification('Failed to load student details', 'error');
        }
    }

    async handleStudentEditSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const studentId = formData.get('studentId');
        const updateData = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            dateOfBirth: formData.get('dateOfBirth'),
            bio: formData.get('bio')
        };

        try {
            this.showNotification('Updating student...', 'info');
            
            await this.api.updateStudentProfile(studentId, updateData);
            
            this.showNotification('Student updated successfully!', 'success');
            
            // Close modal and refresh
            this.closeModals();
            await this.loadStudents();
            
        } catch (error) {
            console.error('❌ Error updating student:', error);
            this.showNotification(`Failed to update student: ${error.message}`, 'error');
        }
    }

    async handleStudentImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const studentId = document.getElementById('editStudentId').value;
        if (!studentId) return;

        try {
            const formData = new FormData();
            formData.append('profileImage', file);

            this.showNotification('Uploading image...', 'info');
            
            const response = await this.api.uploadStudentProfileImage(studentId, formData);
            
            // Update the image in the modal
            document.getElementById('editStudentImage').src = 
                `${this.api.baseURL.replace('/api', '')}/${response.profileImage}`;
            
            this.showNotification('Profile image updated successfully!', 'success');
            
        } catch (error) {
            console.error('❌ Error uploading student image:', error);
            this.showNotification(`Failed to upload image: ${error.message}`, 'error');
        }

        // Clear the input
        e.target.value = '';
    }

    async deleteStudent(studentId) {
        if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
            return;
        }

        try {
            this.showNotification('Deleting student...', 'info');
            
            await this.api.deleteStudent(studentId);
            
            this.showNotification('Student deleted successfully!', 'success');
            
            // Refresh students list
            await this.loadStudents();
            
        } catch (error) {
            console.error('❌ Error deleting student:', error);
            this.showNotification(`Failed to delete student: ${error.message}`, 'error');
        }
    }

    async loadResources(type) {
        const contentArea = document.getElementById('contentArea');
        const typeTitle = type.charAt(0).toUpperCase() + type.slice(1) + 's';
        
        contentArea.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <p>Loading ${typeTitle.toLowerCase()}...</p>
            </div>
        `;

        try {
            const resources = await this.api.getResources(type);
            
            let resourcesHtml = '';
            
            if (resources.length === 0) {
                resourcesHtml = `
                    <div class="empty-state">
                        <i class="fas fa-book"></i>
                        <h3>No ${typeTitle} Available</h3>
                        <p>There are no ${typeTitle.toLowerCase()} available at the moment.</p>
                        ${this.currentUser.role === 'teacher' ? `
                            <button class="btn btn--primary" onclick="app.openResourceModal('${type}')">
                                <i class="fas fa-plus"></i> Add ${type.charAt(0).toUpperCase() + type.slice(1)}
                            </button>
                        ` : ''}
                    </div>
                `;
            } else {
                const resourceCards = resources.map(resource => `
                    <div class="resource-card">
                        <div class="resource-header">
                            <h3>${resource.title}</h3>
                            <div class="resource-actions">
                                <button class="btn-icon btn--secondary" onclick="app.downloadResource('${resource._id}')" title="Download">
                                    <i class="fas fa-download"></i>
                                </button>
                                ${this.currentUser.role === 'teacher' ? `
                                    <button class="btn-icon btn--danger" onclick="app.deleteResource('${resource._id}')" title="Delete">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                        
                        ${resource.description ? `<div class="resource-description">${resource.description}</div>` : '<div class="resource-description">No description available</div>'}
                        
                        <div class="resource-meta">
                            <span><i class="fas fa-file"></i> ${resource.fileName}</span>
                            <span><i class="fas fa-weight"></i> ${this.formatFileSize(resource.fileSize)}</span>
                            <span><i class="fas fa-user"></i> ${resource.uploadedBy?.name || 'Unknown'}</span>
                            <span><i class="fas fa-calendar"></i> ${new Date(resource.createdAt).toLocaleDateString()}</span>
                        </div>
                        
                        <div class="resource-footer">
                            <button class="btn btn--primary" onclick="app.downloadResource('${resource._id}')">
                                <i class="fas fa-download"></i> Download
                            </button>
                        </div>
                    </div>
                `).join('');

                resourcesHtml = `
                    <div class="resources-grid">
                        ${resourceCards}
                    </div>
                `;
            }

            contentArea.innerHTML = `
                <div class="section-header">
                    <h1>${typeTitle}</h1>
                    ${this.currentUser.role === 'teacher' ? `
                        <button class="btn btn--primary" onclick="app.openResourceModal('${type}')">
                            <i class="fas fa-plus"></i> Add ${type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                    ` : ''}
                </div>
                
                ${resourcesHtml}
            `;

        } catch (error) {
            console.error('❌ Error loading resources:', error);
            this.showError('Error loading resources', error.message);
        }
    }

    async downloadResource(id) {
        try {
            this.showNotification('Starting download...', 'info');
            await this.api.downloadResource(id);
            this.showNotification('File downloaded successfully!', 'success');
        } catch (error) {
            console.error('❌ Error downloading resource:', error);
            this.showNotification(`Download failed: ${error.message}`, 'error');
        }
    }

    async loadSchedules() {
        const contentArea = document.getElementById('contentArea');
        
        contentArea.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <p>Loading schedules...</p>
            </div>
        `;

        try {
            const schedules = await this.api.getSchedules();
            
            let schedulesHtml = '';
            
            if (schedules.length === 0) {
                schedulesHtml = `
                    <div class="empty-state">
                        <i class="fas fa-calendar-alt"></i>
                        <h3>No Scheduled Classes</h3>
                        <p>There are no scheduled classes at the moment.</p>
                    </div>
                `;
            } else {
                const scheduleCards = schedules.map(schedule => `
                    <div class="schedule-card">
                        <div class="schedule-header">
                            <h3>${schedule.title}</h3>
                            ${this.currentUser.role === 'teacher' ? `
                                <button class="btn-icon btn--danger" onclick="app.deleteSchedule('${schedule._id}')" title="Delete">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : ''}
                        </div>
                        
                        ${schedule.description ? `<div class="schedule-description">${schedule.description}</div>` : '<div class="schedule-description">No description available</div>'}
                        
                        <div class="schedule-meta">
                            <span><i class="fas fa-calendar"></i> ${new Date(schedule.date).toLocaleDateString()}</span>
                            <span><i class="fas fa-clock"></i> ${schedule.time}</span>
                        </div>
                        
                        <div class="schedule-footer">
                            ${schedule.meetingLink ? `<a href="${schedule.meetingLink}" class="btn btn--primary" target="_blank"><i class="fas fa-video"></i> Join Meeting</a>` : ''}
                            ${schedule.password ? `<div class="meeting-password"><i class="fas fa-key"></i> Password: ${schedule.password}</div>` : ''}
                        </div>
                    </div>
                `).join('');

                schedulesHtml = `
                    <div class="schedules-grid">
                        ${scheduleCards}
                    </div>
                `;
            }

            contentArea.innerHTML = `
                <div class="section-header">
                    <h1>Class Schedule</h1>
                    ${this.currentUser.role === 'teacher' ? `
                        <button class="btn btn--primary" onclick="app.showScheduleForm()">
                            <i class="fas fa-plus"></i> Add Schedule
                        </button>
                    ` : ''}
                </div>
                
                ${this.currentUser.role === 'teacher' ? `
                    <div class="schedule-form-section" id="scheduleFormSection" style="display: none;">
                        <h2>Add New Schedule</h2>
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
                                    <input type="url" name="meetingLink" class="form-control" placeholder="https://zoom.us/j/...">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Description</label>
                                <textarea name="description" class="form-control" rows="3"></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Meeting Password (Optional)</label>
                                <input type="text" name="password" class="form-control">
                            </div>
                            
                            <div class="form-group">
                                <button type="submit" class="btn btn--primary">
                                    <i class="fas fa-plus"></i> Add Schedule
                                </button>
                                <button type="button" class="btn btn--secondary" onclick="document.getElementById('scheduleFormSection').style.display='none'">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                ` : ''}
                
                ${schedulesHtml}
            `;

            // Bind schedule form events if teacher
            if (this.currentUser.role === 'teacher') {
                const scheduleForm = document.getElementById('scheduleForm');
                if (scheduleForm) {
                    scheduleForm.addEventListener('submit', (e) => this.handleScheduleSubmit(e));
                }
            }

        } catch (error) {
            console.error('❌ Error loading schedules:', error);
            this.showError('Error loading schedules', error.message);
        }
    }

    showScheduleForm() {
        const scheduleFormSection = document.getElementById('scheduleFormSection');
        if (scheduleFormSection) {
            scheduleFormSection.style.display = 'block';
            scheduleFormSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    async handleScheduleSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const scheduleData = Object.fromEntries(formData.entries());

        try {
            this.showNotification('Adding schedule...', 'info');
            
            await this.api.createSchedule(scheduleData);
            
            this.showNotification('Schedule added successfully!', 'success');
            
            // Hide form and refresh schedules
            document.getElementById('scheduleFormSection').style.display = 'none';
            e.target.reset();
            await this.loadSchedules();
            
        } catch (error) {
            console.error('❌ Error adding schedule:', error);
            this.showNotification(`Failed to add schedule: ${error.message}`, 'error');
        }
    }

    async deleteSchedule(scheduleId) {
        if (!confirm('Are you sure you want to delete this schedule?')) {
            return;
        }

        try {
            this.showNotification('Deleting schedule...', 'info');
            
            await this.api.deleteSchedule(scheduleId);
            
            this.showNotification('Schedule deleted successfully!', 'success');
            
            // Refresh schedules
            await this.loadSchedules();
            
        } catch (error) {
            console.error('❌ Error deleting schedule:', error);
            this.showNotification(`Failed to delete schedule: ${error.message}`, 'error');
        }
    }

    loadSettings() {
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `
            <div class="section-header">
                <h1>Settings</h1>
            </div>
            
            <div class="card">
                <div class="card__body">
                    <h3>Settings panel coming soon!</h3>
                    <p>This section will contain application settings and preferences.</p>
                </div>
            </div>
        `;
    }

    openResourceModal(type) {
        document.getElementById('resourceType').value = type;
        document.getElementById('resourceModalTitle').textContent = `Add ${type.charAt(0).toUpperCase() + type.slice(1)}`;
        document.getElementById('resourceModal').classList.add('show');
    }

    async handleResourceSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);

        try {
            this.showNotification('Uploading resource...', 'info');
            
            await this.api.createResource(formData);
            
            this.showNotification('Resource uploaded successfully!', 'success');
            
            // Close modal and refresh current section
            this.closeModals();
            e.target.reset();
            
            const currentType = this.currentSection;
            if (['notes', 'questions', 'books'].includes(currentType)) {
                await this.loadResources(currentType.slice(0, -1)); // Remove 's' from plural
            }
            
        } catch (error) {
            console.error('❌ Error uploading resource:', error);
            this.showNotification(`Failed to upload resource: ${error.message}`, 'error');
        }
    }

    async deleteResource(resourceId) {
        if (!confirm('Are you sure you want to delete this resource?')) {
            return;
        }

        try {
            this.showNotification('Deleting resource...', 'info');
            
            await this.api.deleteResource(resourceId);
            
            this.showNotification('Resource deleted successfully!', 'success');
            
            // Refresh current section
            const currentType = this.currentSection;
            if (['notes', 'questions', 'books'].includes(currentType)) {
                await this.loadResources(currentType.slice(0, -1)); // Remove 's' from plural
            }
            
        } catch (error) {
            console.error('❌ Error deleting resource:', error);
            this.showNotification(`Failed to delete resource: ${error.message}`, 'error');
        }
    }

    async handleProfileSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const profileData = Object.fromEntries(formData.entries());

        try {
            this.showNotification('Updating profile...', 'info');
            
            const updatedUser = await this.api.updateUserProfile(profileData);
            this.currentUser = updatedUser;
            
            this.showNotification('Profile updated successfully!', 'success');
            
            // Update user display
            this.updateUserProfile();
            
        } catch (error) {
            console.error('❌ Error updating profile:', error);
            this.showNotification(`Failed to update profile: ${error.message}`, 'error');
        }
    }

    async handleProfileImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const formData = new FormData();
            formData.append('profileImage', file);

            this.showNotification('Uploading image...', 'info');
            
            // Add loading state to image
            const profileImage = document.getElementById('profileImage');
            if (profileImage) {
                profileImage.classList.add('uploading');
            }

            const response = await this.api.uploadProfileImage(formData);
            this.currentUser = response.user;
            
            // Update profile image display
            const newImageSrc = `${this.api.baseURL.replace('/api', '')}/${response.profileImage}`;
            if (profileImage) {
                profileImage.src = newImageSrc;
                profileImage.classList.remove('uploading');
            }

            // Update user avatar in sidebar
            this.updateUserProfile();
            
            this.showNotification('Profile image updated successfully!', 'success');
            
        } catch (error) {
            console.error('❌ Error uploading profile image:', error);
            this.showNotification(`Failed to upload image: ${error.message}`, 'error');
            
            // Remove loading state
            const profileImage = document.getElementById('profileImage');
            if (profileImage) {
                profileImage.classList.remove('uploading');
            }
        }

        // Clear the input
        e.target.value = '';
    }

    async removeProfileImage() {
        if (!confirm('Are you sure you want to remove your profile image?')) {
            return;
        }

        try {
            this.showNotification('Removing profile image...', 'info');
            
            // You might want to add an API endpoint for this
            // For now, we'll just update with placeholder
            const profileImage = document.getElementById('profileImage');
            if (profileImage) {
                profileImage.src = 'https://via.placeholder.com/200';
            }

            const userAvatar = document.getElementById('userAvatar');
            if (userAvatar) {
                userAvatar.src = 'https://via.placeholder.com/40';
            }
            
            this.showNotification('Profile image removed successfully!', 'success');
            
        } catch (error) {
            console.error('❌ Error removing profile image:', error);
            this.showNotification(`Failed to remove image: ${error.message}`, 'error');
        }
    }

    handleSearch(e) {
        const searchTerm = e.target.value.toLowerCase();
        console.log('🔍 Searching for:', searchTerm);
        
        // Implement search functionality based on current section
        if (searchTerm.length > 2) {
            this.performSearch(searchTerm);
        }
    }

    async performSearch(searchTerm) {
        if (['notes', 'questions', 'books'].includes(this.currentSection)) {
            const type = this.currentSection.slice(0, -1); // Remove 's' from plural
            try {
                const resources = await this.api.getResources(type, searchTerm);
                this.displaySearchResults(resources, type);
            } catch (error) {
                console.error('❌ Search error:', error);
            }
        }
    }

    displaySearchResults(resources, type) {
        const contentArea = document.getElementById('contentArea');
        const typeTitle = type.charAt(0).toUpperCase() + type.slice(1) + 's';
        
        if (resources.length === 0) {
            contentArea.innerHTML = `
                <div class="section-header">
                    <h1>${typeTitle} - Search Results</h1>
                </div>
                
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>No Results Found</h3>
                    <p>No ${typeTitle.toLowerCase()} match your search criteria.</p>
                </div>
            `;
        } else {
            const resourceCards = resources.map(resource => `
                <div class="resource-card">
                    <div class="resource-header">
                        <h3>${resource.title}</h3>
                        <div class="resource-actions">
                            <button class="btn-icon btn--secondary" onclick="app.downloadResource('${resource._id}')" title="Download">
                                <i class="fas fa-download"></i>
                            </button>
                            ${this.currentUser.role === 'teacher' ? `
                                <button class="btn-icon btn--danger" onclick="app.deleteResource('${resource._id}')" title="Delete">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="resource-description">${resource.description || 'No description available'}</div>
                    
                    <div class="resource-meta">
                        <span><i class="fas fa-file"></i> ${resource.fileName}</span>
                        <span><i class="fas fa-weight"></i> ${this.formatFileSize(resource.fileSize)}</span>
                        <span><i class="fas fa-user"></i> ${resource.uploadedBy?.name || 'Unknown'}</span>
                        <span><i class="fas fa-calendar"></i> ${new Date(resource.createdAt).toLocaleDateString()}</span>
                    </div>
                    
                    <div class="resource-footer">
                        <button class="btn btn--primary" onclick="app.downloadResource('${resource._id}')">
                            <i class="fas fa-download"></i> Download
                        </button>
                    </div>
                </div>
            `).join('');

            contentArea.innerHTML = `
                <div class="section-header">
                    <h1>${typeTitle} - Search Results</h1>
                    <button class="btn btn--secondary" onclick="app.loadSection('${type}s')">
                        <i class="fas fa-arrow-left"></i> Back to All ${typeTitle}
                    </button>
                </div>
                
                <div class="resources-grid">
                    ${resourceCards}
                </div>
            `;
        }
    }

    toggleMobileSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('open');
    }

    closeMobileSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.remove('open');
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
        });
    }

    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            this.api.clearAuthToken();
            this.currentUser = null;
            this.showLogin();
            this.showNotification('Logged out successfully', 'info');
        }
    }

    showLoading(button, show) {
        if (show) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }

    showError(title, message) {
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h2>${title}</h2>
                <p>${message}</p>
            </div>
        `;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Initialize the app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new EducationApp();
});

// CSS styles for fee management components
const feeStyles = `
<style>
/* Fee Management Styles */
.fee-alert {
    display: flex;
    align-items: center;
    gap: var(--space-12);
    padding: var(--space-16);
    border-radius: var(--radius-lg);
    margin-bottom: var(--space-16);
    border: 1px solid;
}

.fee-alert--success {
    background: rgba(34, 197, 94, 0.1);
    color: var(--color-success);
    border-color: var(--color-success);
}

.fee-alert--warning {
    background: rgba(245, 158, 11, 0.1);
    color: var(--color-warning);
    border-color: var(--color-warning);
}

.fee-alert--danger {
    background: rgba(239, 68, 68, 0.1);
    color: var(--color-error);
    border-color: var(--color-error);
}

.fee-alert i {
    font-size: 24px;
    flex-shrink: 0;
}

.fee-status-section {
    margin-top: var(--space-32);
}

.fee-status-section h2 {
    margin-bottom: var(--space-16);
    color: var(--color-text);
}

.fee-status-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--space-16);
}

.fee-status-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-16);
    text-align: center;
}

.fee-status-card.fee-status--paid {
    border-left: 4px solid var(--color-success);
    background: rgba(34, 197, 94, 0.05);
}

.fee-status-card.fee-status--pending {
    border-left: 4px solid var(--color-warning);
    background: rgba(245, 158, 11, 0.05);
}

.fee-status-card.fee-status--overdue {
    border-left: 4px solid var(--color-error);
    background: rgba(239, 68, 68, 0.05);
}

.fee-month {
    font-weight: var(--font-weight-semibold);
    color: var(--color-text);
    margin-bottom: var(--space-4);
}

.fee-amount {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--color-primary);
    margin-bottom: var(--space-8);
}

.fee-status-badge {
    display: inline-block;
    padding: var(--space-4) var(--space-8);
    border-radius: var(--radius-full);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    text-transform: uppercase;
}

.fee-badge--paid {
    background: var(--color-success);
    color: white;
}

.fee-badge--pending {
    background: var(--color-warning);
    color: white;
}

.fee-badge--overdue {
    background: var(--color-error);
    color: white;
}

.fee-date {
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
    margin-top: var(--space-4);
}

/* Teacher Fee Management */
.fee-stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--space-16);
    margin-bottom: var(--space-24);
}

.fee-stat-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-20);
    display: flex;
    align-items: center;
    gap: var(--space-16);
}

.fee-stat-card i {
    font-size: var(--font-size-2xl);
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-lg);
}

.fee-stat--paid i {
    background: var(--color-success);
    color: white;
}

.fee-stat--pending i {
    background: var(--color-warning);
    color: white;
}

.fee-stat--overdue i {
    background: var(--color-error);
    color: white;
}

.fee-stat--total i {
    background: var(--color-primary);
    color: white;
}

.fee-stat-card h3 {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text);
    margin: 0;
}

.fee-stat-card p {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin: 0;
}

.fee-filters {
    display: flex;
    gap: var(--space-8);
    margin-bottom: var(--space-24);
    flex-wrap: wrap;
}

.filter-btn {
    min-width: auto;
    padding: var(--space-6) var(--space-12);
}

.filter-btn.active {
    background: var(--color-primary);
    color: var(--color-btn-primary-text);
}

.fee-students-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: var(--space-16);
}

.fee-student-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-20);
}

.fee-student-card .student-header {
    display: flex;
    align-items: center;
    gap: var(--space-12);
    margin-bottom: var(--space-16);
}

.fee-student-card .student-header img {
    width: 50px;
    height: 50px;
    border-radius: var(--radius-full);
    object-fit: cover;
}

.fee-summary {
    display: flex;
    gap: var(--space-12);
    margin-top: var(--space-4);
}

.fee-paid,
.fee-pending {
    font-size: var(--font-size-xs);
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-sm);
}

.fee-paid {
    background: rgba(34, 197, 94, 0.1);
    color: var(--color-success);
}

.fee-pending {
    background: rgba(245, 158, 11, 0.1);
    color: var(--color-warning);
}

.recent-fees h4 {
    color: var(--color-text);
    margin-bottom: var(--space-8);
    font-size: var(--font-size-sm);
}

.fee-records {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
}

.fee-record {
    display: grid;
    grid-template-columns: 1fr auto auto auto;
    gap: var(--space-8);
    align-items: center;
    padding: var(--space-6);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    font-size: var(--font-size-xs);
}

.fee-record--paid {
    background: rgba(34, 197, 94, 0.05);
    border-color: var(--color-success);
}

.fee-record--pending {
    background: rgba(245, 158, 11, 0.05);
    border-color: var(--color-warning);
}

.fee-record--overdue {
    background: rgba(239, 68, 68, 0.05);
    border-color: var(--color-error);
}

.fee-record .fee-status {
    padding: var(--space-1) var(--space-4);
    border-radius: var(--radius-full);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    text-transform: uppercase;
}

.fee-status--paid {
    background: var(--color-success);
    color: white;
}

.fee-status--pending {
    background: var(--color-warning);
    color: white;
}

.fee-status--overdue {
    background: var(--color-error);
    color: white;
}

/* Mobile responsive */
@media (max-width: 768px) {
    .fee-stats-grid {
        grid-template-columns: 1fr;
    }
    
    .fee-students-grid {
        grid-template-columns: 1fr;
    }
    
    .fee-filters {
        flex-direction: column;
    }
    
    .fee-record {
        grid-template-columns: 1fr;
        text-align: center;
    }
    
    .fee-status-grid {
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    }
}
</style>
`;

// Inject fee management styles
document.head.insertAdjacentHTML('beforeend', feeStyles);