// Updated app.js - Complete frontend JavaScript with profile functionality

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
    
    async downloadResource(id) {
        const token = this.token;
        if (!token) {
            throw new Error('Please login to download this resource');
        }

        const downloadUrl = `${this.baseURL}/resources/${id}/download`;

        try {
            const response = await fetch(downloadUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Download failed: ' + response.statusText);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            const disposition = response.headers.get('content-disposition');
            let fileName = 'downloaded_file';
            if (disposition && disposition.indexOf('filename=') !== -1) {
                const filenameMatch = disposition.match(/filename="?(.+)"?/);
                if (filenameMatch && filenameMatch.length > 1) fileName = filenameMatch[1];
            }
            a.download = fileName;

            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

        } catch (error) {
            throw new Error('Error downloading file: ' + error.message);
        }
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
}

// Main Education App Class
class EducationApp {
    constructor() {
        this.api = new ApiService();
        this.currentUser = null;
        this.currentSection = 'dashboard';
        this.init();
    }
    
    async init() {
        console.log('🚀 Initializing Education App...');
        
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
        
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
        
        if (userInfo) userInfo.textContent = this.currentUser.role.charAt(0).toUpperCase() + this.currentUser.role.slice(1);
        if (userAvatar) {
            const imageSrc = this.currentUser.profileImage 
                ? (this.currentUser.profileImage.startsWith('http') 
                    ? this.currentUser.profileImage 
                    : `${this.api.baseURL.replace('/api', '')}/${this.currentUser.profileImage}`)
                : 'https://via.placeholder.com/40';
            userAvatar.src = imageSrc;
        }
        if (userName) userName.textContent = this.currentUser.name;
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
        
        const themeToggle = document.getElementById('themeToggle');
        const floatingThemeToggle = document.getElementById('floatingThemeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        if (floatingThemeToggle) {
            floatingThemeToggle.addEventListener('click', () => this.toggleTheme());
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
            pageTitle.textContent = section.charAt(0).toUpperCase() + section.slice(1);
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
        }
    }
    
    async loadDashboard() {
        const contentArea = document.getElementById('contentArea');
        
        try {
            this.showContentLoading(contentArea);
            const stats = await this.api.getDashboardStats();
            
            if (this.currentUser.role === 'teacher') {
                contentArea.innerHTML = `
                    <div class="dashboard-header">
                        <h1>Welcome back, ${this.currentUser.name}!</h1>
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
                    </div>
                    
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
                            <button class="btn btn--secondary" onclick="app.loadSection('schedule')">
                                <i class="fas fa-calendar-plus"></i> Create Schedule
                            </button>
                        </div>
                    </div>
                `;
            } else {
                contentArea.innerHTML = `
                    <div class="dashboard-header">
                        <h1>Welcome back, ${this.currentUser.name}!</h1>
                        <p>Continue your learning journey.</p>
                    </div>
                    
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
                    </div>
                    
                    <div class="quick-actions">
                        <h2>Quick Actions</h2>
                        <div class="action-buttons">
                            <button class="btn btn--primary" onclick="app.loadSection('notes')">
                                <i class="fas fa-book"></i> Browse Notes
                            </button>
                            <button class="btn btn--primary" onclick="app.loadSection('questions')">
                                <i class="fas fa-question-circle"></i> Practice Questions
                            </button>
                            <button class="btn btn--secondary" onclick="app.loadSection('schedule')">
                                <i class="fas fa-calendar"></i> View Schedule
                            </button>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            console.error('❌ Error loading dashboard:', error);
            this.showError(contentArea, 'Error Loading Dashboard', error.message);
        }
    }
    
    async loadProfile() {
        const contentArea = document.getElementById('contentArea');
        
        try {
            this.showContentLoading(contentArea);
            const user = await this.api.getUserProfile();
            this.currentUser = user; // Update current user data
            
            const imageSrc = user.profileImage 
                ? (user.profileImage.startsWith('http') 
                    ? user.profileImage 
                    : `${this.api.baseURL.replace('/api', '')}/${user.profileImage}`)
                : 'https://via.placeholder.com/150';

            contentArea.innerHTML = `
                <div class="profile-container">
                    <div class="profile-header">
                        <h1><i class="fas fa-user"></i> My Profile</h1>
                        <p>Manage your personal information and settings</p>
                    </div>
                    
                    <div class="profile-content">
                        <!-- Profile Image Section -->
                        <div class="profile-image-section">
                            <div class="profile-image-container">
                                <img src="${imageSrc}" alt="${user.name}" class="profile-image" id="currentProfileImage">
                                <div class="image-overlay" onclick="document.getElementById('profileImageInput').click()">
                                    <i class="fas fa-camera"></i>
                                    <span>Change Photo</span>
                                </div>
                                <input type="file" id="profileImageInput" accept="image/*" style="display: none;">
                            </div>
                            <div class="image-actions">
                                <button class="btn btn--primary" onclick="document.getElementById('profileImageInput').click()">
                                    <i class="fas fa-upload"></i> Upload New Photo
                                </button>
                                ${user.profileImage && !user.profileImage.startsWith('http') ? `
                                    <button class="btn btn--danger" onclick="app.removeProfileImage()">
                                        <i class="fas fa-trash"></i> Remove Photo
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                        
                        <!-- Profile Information -->
                        <div class="profile-info-section">
                            <form id="profileForm" class="profile-form">
                                <div class="form-grid">
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
                                        <small class="form-help">Email cannot be changed</small>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label class="form-label">
                                            <i class="fas fa-phone"></i> Phone Number
                                        </label>
                                        <input type="tel" name="phone" class="form-control" value="${user.phone || ''}" placeholder="+91-9876543210">
                                    </div>
                                    
                                    <div class="form-group">
                                        <label class="form-label">
                                            <i class="fas fa-birthday-cake"></i> Date of Birth
                                        </label>
                                        <input type="date" name="dateOfBirth" class="form-control" value="${user.dateOfBirth || ''}">
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label">
                                        <i class="fas fa-info-circle"></i> Bio
                                    </label>
                                    <textarea name="bio" class="form-control" rows="4" placeholder="Tell us about yourself...">${user.bio || ''}</textarea>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label">
                                        <i class="fas fa-shield-alt"></i> Role
                                    </label>
                                    <input type="text" class="form-control" value="${user.role.charAt(0).toUpperCase() + user.role.slice(1)}" disabled>
                                </div>
                                
                                <div class="profile-actions">
                                    <button type="submit" class="btn btn--primary">
                                        <i class="fas fa-save"></i> Save Changes
                                    </button>
                                    <button type="button" class="btn btn--secondary" onclick="app.resetProfileForm()">
                                        <i class="fas fa-undo"></i> Reset Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                        
                        <!-- Account Information -->
                        <div class="account-info-section">
                            <h3><i class="fas fa-info-circle"></i> Account Information</h3>
                            <div class="info-grid">
                                <div class="info-item">
                                    <label>Member Since</label>
                                    <span>${new Date(user.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div class="info-item">
                                    <label>Last Updated</label>
                                    <span>${new Date(user.updatedAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Bind profile form events
            this.bindProfileEvents();
            
        } catch (error) {
            console.error('❌ Error loading profile:', error);
            this.showError(contentArea, 'Error Loading Profile', error.message);
        }
    }
    
    bindProfileEvents() {
        // Profile form submission
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => this.handleProfileSubmit(e));
        }
        
        // Profile image upload
        const profileImageInput = document.getElementById('profileImageInput');
        if (profileImageInput) {
            profileImageInput.addEventListener('change', (e) => this.handleProfileImageUpload(e));
        }
    }
    
    async handleProfileSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const profileData = Object.fromEntries(formData.entries());
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        try {
            this.showLoading(submitBtn, true);
            const updatedUser = await this.api.updateUserProfile(profileData);
            
            this.currentUser = updatedUser;
            this.updateUserProfile(); // Update sidebar user info
            this.showNotification('Profile updated successfully!', 'success');
            
        } catch (error) {
            console.error('❌ Error updating profile:', error);
            this.showNotification(error.message, 'error');
        } finally {
            this.showLoading(submitBtn, false);
        }
    }
    
    async handleProfileImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            this.showNotification('File size must be less than 5MB', 'error');
            return;
        }
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showNotification('Please select an image file', 'error');
            return;
        }
        
        const formData = new FormData();
        formData.append('profileImage', file);
        
        try {
            this.showNotification('Uploading profile image...', 'info');
            const result = await this.api.uploadProfileImage(formData);
            
            // Update the profile image display
            const currentProfileImage = document.getElementById('currentProfileImage');
            if (currentProfileImage) {
                const imageSrc = `${this.api.baseURL.replace('/api', '')}/${result.profileImage}`;
                currentProfileImage.src = imageSrc;
            }
            
            // Update current user data
            this.currentUser = result.user;
            this.updateUserProfile(); // Update sidebar avatar
            
            this.showNotification('Profile image updated successfully!', 'success');
            
        } catch (error) {
            console.error('❌ Error uploading profile image:', error);
            this.showNotification(error.message, 'error');
        }
        
        // Clear the input
        e.target.value = '';
    }
    
    resetProfileForm() {
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            // Reset form to current user data
            profileForm.querySelector('input[name="name"]').value = this.currentUser.name || '';
            profileForm.querySelector('input[name="phone"]').value = this.currentUser.phone || '';
            profileForm.querySelector('input[name="dateOfBirth"]').value = this.currentUser.dateOfBirth || '';
            profileForm.querySelector('textarea[name="bio"]').value = this.currentUser.bio || '';
        }
    }
    
    async removeProfileImage() {
        if (!confirm('Are you sure you want to remove your profile image?')) {
            return;
        }
        
        try {
            // Create empty FormData to remove image
            const formData = new FormData();
            formData.append('profileImage', '');
            
            const result = await this.api.uploadProfileImage(formData);
            
            // Update the profile image display
            const currentProfileImage = document.getElementById('currentProfileImage');
            if (currentProfileImage) {
                currentProfileImage.src = 'https://via.placeholder.com/150';
            }
            
            this.currentUser = result.user;
            this.updateUserProfile();
            
            this.showNotification('Profile image removed successfully!', 'success');
            
        } catch (error) {
            console.error('❌ Error removing profile image:', error);
            this.showNotification(error.message, 'error');
        }
    }
    
    async loadResources(type) {
        const contentArea = document.getElementById('contentArea');
        
        try {
            this.showContentLoading(contentArea);
            const resources = await this.api.getResources(type);
            
            const typeTitle = type.charAt(0).toUpperCase() + type.slice(1) + 's';
            
            let content = `
                <div class="section-header">
                    <h1>${typeTitle}</h1>
                    ${this.currentUser.role === 'teacher' ? `
                        <button class="btn btn--primary" onclick="app.showResourceModal('${type}')">
                            <i class="fas fa-plus"></i> Add ${type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                    ` : ''}
                </div>
                
                <div class="resources-grid">
            `;
            
            if (resources.length === 0) {
                content += `
                    <div class="empty-state">
                        <i class="fas fa-folder-open"></i>
                        <h3>No ${typeTitle} Found</h3>
                        <p>There are no ${typeTitle.toLowerCase()} available at the moment.</p>
                    </div>
                `;
            } else {
                resources.forEach(resource => {
                    content += this.createResourceCard(resource);
                });
            }
            
            content += '</div>';
            contentArea.innerHTML = content;
            
        } catch (error) {
            console.error(`❌ Error loading ${type}s:`, error);
            this.showError(contentArea, `Failed to load ${type}s`, error.message);
        }
    }
    
    createResourceCard(resource) {
        const formattedDate = new Date(resource.createdAt).toLocaleDateString();
        const fileSize = this.formatFileSize(resource.fileSize);
        
        return `
            <div class="resource-card">
                <div class="resource-header">
                    <h3>${resource.title}</h3>
                    ${this.currentUser.role === 'teacher' ? `
                        <div class="resource-actions">
                            <button class="btn-icon btn--danger" onclick="app.deleteResource('${resource._id}', '${resource.type}')" title="Delete resource">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    ` : ''}
                </div>
                <p class="resource-description">${resource.description || 'No description available'}</p>
                <div class="resource-meta">
                    <span><i class="fas fa-file"></i> ${resource.fileName}</span>
                    <span><i class="fas fa-hdd"></i> ${fileSize}</span>
                    <span><i class="fas fa-calendar"></i> ${formattedDate}</span>
                    <span><i class="fas fa-user"></i> ${resource.uploadedBy?.name || 'Unknown'}</span>
                </div>
                <div class="resource-footer">
                    <button class="btn btn--primary" onclick="app.downloadResource('${resource._id}')">
                        <i class="fas fa-download"></i> Download
                    </button>
                </div>
            </div>
        `;
    }
    
    async downloadResource(resourceId) {
        try {
            await this.api.downloadResource(resourceId);
            this.showNotification('Download started successfully!', 'success');
        } catch (error) {
            console.error('❌ Error downloading resource:', error);
            this.showNotification(error.message, 'error');
        }
    }
    
    async loadSchedules() {
        const contentArea = document.getElementById('contentArea');
        
        try {
            this.showContentLoading(contentArea);
            const schedules = await this.api.getSchedules();
            
            let content = `
                <div class="section-header">
                    <h1>Class Schedule</h1>
                </div>
            `;

            if (this.currentUser.role === 'teacher') {
                content += `
                    <div class="schedule-form-section">
                        <h3>Create New Schedule</h3>
                        <form id="scheduleForm" class="schedule-form">
                            <div class="form-grid">
                                <div class="form-group">
                                    <label class="form-label">Title</label>
                                    <input type="text" name="title" class="form-control" placeholder="Class title" required>
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
                                    <input type="url" name="meetingLink" class="form-control" placeholder="https://meet.google.com/...">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Description</label>
                                <textarea name="description" class="form-control" rows="3" placeholder="Class description"></textarea>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Meeting Password</label>
                                <input type="text" name="password" class="form-control" placeholder="Meeting password (optional)">
                            </div>
                            <button type="submit" class="btn btn--primary">
                                <i class="fas fa-plus"></i> Create Schedule
                            </button>
                        </form>
                    </div>
                `;
                
                setTimeout(() => {
                    const scheduleForm = document.getElementById('scheduleForm');
                    if (scheduleForm) {
                        scheduleForm.addEventListener('submit', (e) => this.handleScheduleSubmit(e));
                    }
                }, 100);
            }
            
            content += '<div class="schedules-grid">';
            
            if (schedules.length === 0) {
                content += `
                    <div class="empty-state">
                        <i class="fas fa-calendar"></i>
                        <h3>No Schedules Found</h3>
                        <p>There are no scheduled classes at the moment.</p>
                    </div>
                `;
            } else {
                schedules.forEach(schedule => {
                    content += this.createScheduleCard(schedule);
                });
            }
            
            content += '</div>';
            contentArea.innerHTML = content;
            
        } catch (error) {
            console.error('❌ Error loading schedules:', error);
            this.showError(contentArea, 'Failed to load schedules', error.message);
        }
    }
    
    createScheduleCard(schedule) {
        const formattedDate = new Date(schedule.date).toLocaleDateString();
        
        return `
            <div class="schedule-card">
                <div class="schedule-header">
                    <h3>${schedule.title}</h3>
                    ${this.currentUser.role === 'teacher' ? `
                        <button class="btn-icon btn--danger" onclick="app.deleteSchedule('${schedule._id}')" title="Delete schedule">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
                <p class="schedule-description">${schedule.description || 'No description available'}</p>
                <div class="schedule-meta">
                    <span><i class="fas fa-calendar"></i> ${formattedDate}</span>
                    <span><i class="fas fa-clock"></i> ${schedule.time}</span>
                    <span><i class="fas fa-user"></i> ${schedule.createdBy?.name || 'Unknown'}</span>
                </div>
                ${schedule.meetingLink ? `
                    <div class="schedule-footer">
                        <a href="${schedule.meetingLink}" class="btn btn--primary" target="_blank" rel="noopener noreferrer">
                            <i class="fas fa-video"></i> Join Meeting
                        </a>
                        ${schedule.password ? `
                            <span class="meeting-password">
                                <i class="fas fa-key"></i> Password: ${schedule.password}
                            </span>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    async loadStudents() {
        if (this.currentUser.role !== 'teacher') {
            return;
        }
        
        const contentArea = document.getElementById('contentArea');
        
        try {
            this.showContentLoading(contentArea);
            const students = await this.api.getStudents();
            
            let content = `
                <div class="section-header">
                    <h1>Student Management</h1>
                </div>
                
                <div class="student-form-section">
                    <h3>Add New Student</h3>
                    <form id="studentForm" class="schedule-form">
                        <div class="form-grid">
                            <div class="form-group">
                                <label class="form-label">Student Name</label>
                                <input type="text" name="name" class="form-control" placeholder="Full name" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Email Address</label>
                                <input type="email" name="email" class="form-control" placeholder="student@example.com" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Password</label>
                                <input type="password" name="password" class="form-control" placeholder="Temporary password" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Phone Number</label>
                                <input type="tel" name="phone" class="form-control" placeholder="+91-9876543210">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Bio</label>
                            <textarea name="bio" class="form-control" rows="2" placeholder="Brief description about the student"></textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Date of Birth</label>
                            <input type="date" name="dateOfBirth" class="form-control">
                        </div>
                        <button type="submit" class="btn btn--primary">
                            <i class="fas fa-plus"></i> Add Student
                        </button>
                    </form>
                </div>
                
                <div class="students-grid">
            `;
            
            setTimeout(() => {
                const studentForm = document.getElementById('studentForm');
                if (studentForm) {
                    studentForm.addEventListener('submit', (e) => this.handleStudentSubmit(e));
                }
            }, 100);
            
            if (students.length === 0) {
                content += `
                    <div class="empty-state">
                        <i class="fas fa-users"></i>
                        <h3>No Students Found</h3>
                        <p>No students have been added yet.</p>
                    </div>
                `;
            } else {
                students.forEach(student => {
                    content += this.createStudentCard(student);
                });
            }
            
            content += '</div>';
            contentArea.innerHTML = content;
            
        } catch (error) {
            console.error('❌ Error loading students:', error);
            this.showError(contentArea, 'Failed to load students', error.message);
        }
    }
    
    createStudentCard(student) {
        const formattedDate = new Date(student.createdAt).toLocaleDateString();
        const imageSrc = student.profileImage 
            ? (student.profileImage.startsWith('http') 
                ? student.profileImage 
                : `${this.api.baseURL.replace('/api', '')}/${student.profileImage}`)
            : 'https://via.placeholder.com/50';
        
        return `
            <div class="student-card">
                <div class="student-header">
                    <img src="${imageSrc}" alt="${student.name}" loading="lazy">
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
                    <span><i class="fas fa-calendar-plus"></i> Joined: ${formattedDate}</span>
                    ${student.phone ? `<span><i class="fas fa-phone"></i> ${student.phone}</span>` : ''}
                </div>
            </div>
        `;
    }
    
    loadSettings() {
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `
            <div class="section-header">
                <h1>Settings</h1>
            </div>
            <div class="empty-state">
                <i class="fas fa-cog"></i>
                <h3>Settings</h3>
                <p>Settings panel coming soon!</p>
            </div>
        `;
    }
    
    showResourceModal(type) {
        const modal = document.getElementById('resourceModal');
        const modalTitle = document.getElementById('resourceModalTitle');
        const resourceTypeInput = document.getElementById('resourceType');
        
        if (modal && modalTitle && resourceTypeInput) {
            modalTitle.textContent = `Add ${type.charAt(0).toUpperCase() + type.slice(1)}`;
            resourceTypeInput.value = type;
            modal.classList.add('show');
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }
    
    async handleResourceSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        try {
            this.showLoading(submitBtn, true);
            await this.api.createResource(formData);
            
            this.closeModals();
            this.showNotification('Resource added successfully!', 'success');
            
            e.target.reset();
            
            const resourceSections = ['notes', 'questions', 'books'];
            if (resourceSections.some(section => this.currentSection.includes(section))) {
                const type = this.currentSection.slice(0, -1);
                await this.loadResources(type);
            }
            
        } catch (error) {
            console.error('❌ Error creating resource:', error);
            this.showNotification(error.message, 'error');
        } finally {
            this.showLoading(submitBtn, false);
        }
    }
    
    async handleScheduleSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const scheduleData = Object.fromEntries(formData.entries());
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        try {
            this.showLoading(submitBtn, true);
            await this.api.createSchedule(scheduleData);
            
            e.target.reset();
            this.showNotification('Schedule created successfully!', 'success');
            await this.loadSchedules();
            
        } catch (error) {
            console.error('❌ Error creating schedule:', error);
            this.showNotification(error.message, 'error');
        } finally {
            this.showLoading(submitBtn, false);
        }
    }
    
    async handleStudentSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const studentData = Object.fromEntries(formData.entries());
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        try {
            this.showLoading(submitBtn, true);
            await this.api.createStudent(studentData);
            
            e.target.reset();
            this.showNotification('Student added successfully!', 'success');
            await this.loadStudents();
            
        } catch (error) {
            console.error('❌ Error creating student:', error);
            this.showNotification(error.message, 'error');
        } finally {
            this.showLoading(submitBtn, false);
        }
    }
    
    async deleteResource(id, type) {
        if (!confirm('Are you sure you want to delete this resource?')) {
            return;
        }
        
        try {
            await this.api.deleteResource(id);
            this.showNotification('Resource deleted successfully!', 'success');
            await this.loadResources(type);
        } catch (error) {
            console.error('❌ Error deleting resource:', error);
            this.showNotification(error.message, 'error');
        }
    }
    
    async deleteSchedule(id) {
        if (!confirm('Are you sure you want to delete this schedule?')) {
            return;
        }
        
        try {
            await this.api.deleteSchedule(id);
            this.showNotification('Schedule deleted successfully!', 'success');
            await this.loadSchedules();
        } catch (error) {
            console.error('❌ Error deleting schedule:', error);
            this.showNotification(error.message, 'error');
        }
    }
    
    async deleteStudent(id) {
        if (!confirm('Are you sure you want to delete this student?')) {
            return;
        }
        
        try {
            await this.api.deleteStudent(id);
            this.showNotification('Student deleted successfully!', 'success');
            await this.loadStudents();
        } catch (error) {
            console.error('❌ Error deleting student:', error);
            this.showNotification(error.message, 'error');
        }
    }
    
    editStudent(id) {
        // TODO: Implement edit student modal
        this.showNotification('Edit student feature coming soon!', 'info');
    }
    
    closeModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.classList.remove('show');
            modal.style.display = 'none';
        });
        document.body.style.overflow = '';
    }
    
    toggleMobileSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.toggle('open');
        }
    }
    
    closeMobileSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.remove('open');
        }
    }
    
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeIcon(newTheme);
        
        console.log('🎨 Theme changed to:', newTheme);
    }
    
    updateThemeIcon(theme) {
        const themeToggles = document.querySelectorAll('#themeToggle i, #floatingThemeToggle i');
        themeToggles.forEach(icon => {
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        });
    }
    
    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            console.log('👋 User logging out');
            this.api.clearAuthToken();
            this.currentUser = null;
            this.showLogin();
        }
    }
    
    handleSearch(e) {
        const searchTerm = e.target.value.toLowerCase();
        console.log('🔍 Searching for:', searchTerm);
        
        if (['notes', 'questions', 'books'].includes(this.currentSection)) {
            this.searchResources(searchTerm);
        }
    }
    
    async searchResources(searchTerm) {
        if (!searchTerm.trim()) {
            const type = this.currentSection.slice(0, -1);
            await this.loadResources(type);
            return;
        }
        
        const type = this.currentSection.slice(0, -1);
        try {
            const resources = await this.api.getResources(type, searchTerm);
            this.renderResourceGrid(resources, type);
        } catch (error) {
            console.error('❌ Search error:', error);
            this.showNotification('Search failed', 'error');
        }
    }
    
    renderResourceGrid(resources, type) {
        const contentArea = document.getElementById('contentArea');
        const typeTitle = type.charAt(0).toUpperCase() + type.slice(1) + 's';
        
        let content = `
            <div class="section-header">
                <h1>${typeTitle}</h1>
                ${this.currentUser.role === 'teacher' ? `
                    <button class="btn btn--primary" onclick="app.showResourceModal('${type}')">
                        <i class="fas fa-plus"></i> Add ${type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                ` : ''}
            </div>
            
            <div class="resources-grid">
        `;
        
        if (resources.length === 0) {
            content += `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>No Results Found</h3>
                    <p>No ${typeTitle.toLowerCase()} match your search criteria.</p>
                </div>
            `;
        } else {
            resources.forEach(resource => {
                content += this.createResourceCard(resource);
            });
        }
        
        content += '</div>';
        contentArea.innerHTML = content;
    }
    
    showLoading(element, isLoading) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        
        if (!element) return;
        
        if (isLoading) {
            element.setAttribute('data-original-text', element.innerHTML);
            element.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
            element.disabled = true;
        } else {
            element.innerHTML = element.getAttribute('data-original-text') || 'Submit';
            element.disabled = false;
            element.removeAttribute('data-original-text');
        }
    }
    
    showContentLoading(container) {
        container.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <p>Loading content...</p>
            </div>
        `;
    }
    
    showError(container, title, message) {
        container.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h2>${title}</h2>
                <p>${message}</p>
                <button class="btn btn--primary" onclick="location.reload()">
                    <i class="fas fa-refresh"></i> Reload Page
                </button>
            </div>
        `;
    }
    
    showNotification(message, type = 'info') {
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());
        
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
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--color-surface);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-lg);
            padding: var(--spacing-lg);
            box-shadow: var(--shadow-lg);
            z-index: 3000;
            display: flex;
            align-items: center;
            gap: var(--spacing-md);
            max-width: 400px;
            animation: slideInRight 0.3s ease-out;
            border-left: 4px solid var(--${type === 'success' ? 'success' : type === 'error' ? 'danger' : type === 'warning' ? 'warning' : 'primary'}-500);
        `;
        
        const content = notification.querySelector('.notification-content');
        content.style.cssText = `
            display: flex;
            align-items: center;
            gap: var(--spacing-sm);
            flex: 1;
            color: var(--color-text);
        `;
        
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.style.cssText = `
            background: none;
            border: none;
            color: var(--color-text-secondary);
            cursor: pointer;
            padding: var(--spacing-xs);
            border-radius: var(--radius-sm);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOutRight 0.3s ease-out forwards';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎓 Educational Platform starting...');
    window.app = new EducationApp();
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('📱 App hidden');
    } else {
        console.log('📱 App visible');
    }
});