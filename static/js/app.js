/**
 * HEARTAI SYSTEM - MAIN APPLICATION ROUTER & ENVIRONMENT
 */

import Auth from './auth.js';
import Dashboard from './dashboard.js';
import Prediction from './prediction.js';
import Admin from './admin.js';

const App = {
    protectedRoutes: ['/dashboard', '/predict', '/results', '/admin', '/profile', '/settings'],
    adminRoutes: ['/admin'],

    init() {
        // Setup Routing
        window.addEventListener('hashchange', () => this.handleRouting());
        
        // Setup Theme Switcher
        this.setupTheme();

        // Setup Dropdowns & Global UI Controls
        this.setupGlobalUI();

        // Initialize Authentication States
        Auth.updateNavUI();

        // Trigger Initial Routing
        this.handleRouting();
    },

    setupTheme() {
        const themeToggle = document.getElementById('theme-toggle-checkbox');
        const savedTheme = localStorage.getItem('heart_ai_theme') || 'light';

        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            if (themeToggle) themeToggle.checked = true;
        } else {
            document.body.classList.remove('dark-mode');
            if (themeToggle) themeToggle.checked = false;
        }

        if (themeToggle) {
            themeToggle.onchange = (e) => {
                if (e.target.checked) {
                    document.body.classList.add('dark-mode');
                    localStorage.setItem('heart_ai_theme', 'dark');
                    Toast.info('Dark mode activated.');
                } else {
                    document.body.classList.remove('dark-mode');
                    localStorage.setItem('heart_ai_theme', 'light');
                    Toast.info('Light mode activated.');
                }
                
                // Redraw dashboard charts to match background grid colors if on dashboard
                if (window.location.hash === '#/dashboard' && typeof Dashboard !== 'undefined') {
                    Dashboard.loadDashboardData();
                }
            };
        }
    },

    setupGlobalUI() {
        // Toggle Profile Dropdown
        const profileTrigger = document.getElementById('nav-profile-trigger');
        const profileDropdown = document.getElementById('nav-profile-dropdown');

        if (profileTrigger && profileDropdown) {
            profileTrigger.onclick = (e) => {
                e.stopPropagation();
                profileDropdown.classList.toggle('active');
            };

            document.addEventListener('click', () => {
                profileDropdown.classList.remove('active');
            });
        }

        // Connect Logout Buttons
        const logoutButtons = document.querySelectorAll('.logout-trigger');
        logoutButtons.forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                Auth.logout();
            };
        });

        // Initialize forms callbacks
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.onsubmit = async (e) => {
                e.preventDefault();
                const email = document.getElementById('login-email').value;
                const pass = document.getElementById('login-password').value;
                const rem = document.getElementById('login-remember').checked;
                await Auth.login(email, pass, rem);
            };
        }

        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.onsubmit = async (e) => {
                e.preventDefault();
                const user = document.getElementById('register-username').value;
                const email = document.getElementById('register-email').value;
                const pass = document.getElementById('register-password').value;
                const confirmPass = document.getElementById('register-confirm-password').value;

                if (pass !== confirmPass) {
                    Toast.error('Passwords do not match.');
                    return;
                }

                await Auth.register(user, email, pass);
            };
        }

        const adminLoginForm = document.getElementById('admin-login-form');
        if (adminLoginForm) {
            adminLoginForm.onsubmit = async (e) => {
                e.preventDefault();
                const email = document.getElementById('admin-email').value;
                const pass = document.getElementById('admin-password').value;
                await Auth.adminLogin(email, pass);
            };
        }

        // Forgot/Reset forms mock
        const forgotForm = document.getElementById('forgot-form');
        if (forgotForm) {
            forgotForm.onsubmit = async (e) => {
                e.preventDefault();
                const email = document.getElementById('forgot-email').value;
                await Auth.forgotPassword(email);
            };
        }

        // Setup smooth loading transitions
        window.addEventListener('beforeunload', () => Loader.show('Navigating...'));
    },

    handleRouting() {
        let hash = window.location.hash || '#/';
        
        // Strip out trailing slash or queries
        if (hash.startsWith('#')) {
            hash = hash.substring(1);
        }
        
        // Clean route path
        const path = hash.split('?')[0];

        // Security Route Guard
        const isLoggedIn = Auth.isLoggedIn();
        const isAdmin = Auth.isAdmin();

        if (this.protectedRoutes.includes(path) && !isLoggedIn) {
            Toast.warning('Access Denied. Please authenticate first.');
            window.location.hash = '/login';
            return;
        }

        if (this.adminRoutes.includes(path) && !isAdmin) {
            Toast.warning('Access Denied. Administrator credentials required.');
            window.location.hash = '/dashboard';
            return;
        }

        // Update nav active tags
        const navLinks = document.querySelectorAll('header nav a, .sidebar-link');
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href) {
                link.classList.toggle('active', href === `#${path}`);
            }
        });

        // Hide all views first
        const views = document.querySelectorAll('.view-section');
        views.forEach(v => v.classList.remove('active'));

        // Resolve View Div IDs
        let viewId = 'landing-view';
        if (path === '/') viewId = 'landing-view';
        else if (path === '/login') viewId = 'login-view';
        else if (path === '/register') viewId = 'register-view';
        else if (path === '/admin-login') viewId = 'admin-login-view';
        else if (path === '/forgot-password') viewId = 'forgot-password-view';
        else if (path === '/dashboard') viewId = 'dashboard-view';
        else if (path === '/predict') viewId = 'predict-view';
        else if (path === '/results') viewId = 'results-view';
        else if (path === '/dataset-info') viewId = 'dataset-view';
        else if (path === '/admin') viewId = 'admin-view';
        else if (path === '/docs') viewId = 'docs-view';
        else if (path === '/profile') viewId = 'profile-view';
        else if (path === '/settings') viewId = 'settings-view';

        const activeView = document.getElementById(viewId);
        if (activeView) {
            activeView.classList.add('active');
            window.scrollTo(0, 0);
        } else {
            // Fallback 404
            const fallback = document.getElementById('landing-view');
            if (fallback) fallback.classList.add('active');
        }

        // Sub-module Initializers
        if (path === '/dashboard') {
            Dashboard.init();
        } else if (path === '/predict') {
            Prediction.init();
        } else if (path === '/admin') {
            Admin.init();
        } else if (path === '/profile') {
            this.loadProfile();
        }
    },

    loadProfile() {
        const user = Auth.getUser();
        if (user) {
            document.getElementById('profile-username-val').innerText = user.username;
            document.getElementById('profile-email-val').innerText = user.email;
            document.getElementById('profile-role-val').innerText = user.role.toUpperCase();
            document.getElementById('profile-avatar-lbl').innerText = user.username.charAt(0).toUpperCase();
        }
    }
};

// Start App when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

window.App = App;
export default App;
