/**
 * HEARTAI SYSTEM - AUTHENTICATION MODULE
 */

const Auth = {
    TOKEN_KEY: 'heart_ai_token',
    USER_KEY: 'heart_ai_user',

    getToken() {
        return localStorage.getItem(this.TOKEN_KEY) || sessionStorage.getItem(this.TOKEN_KEY);
    },

    getUser() {
        const userStr = localStorage.getItem(this.USER_KEY) || sessionStorage.getItem(this.USER_KEY);
        try {
            return userStr ? JSON.parse(userStr) : null;
        } catch (e) {
            return null;
        }
    },

    setSession(token, user, rememberMe = false) {
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem(this.TOKEN_KEY, token);
        storage.setItem(this.USER_KEY, JSON.stringify(user));
    },

    clearSession() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        sessionStorage.removeItem(this.TOKEN_KEY);
        sessionStorage.removeItem(this.USER_KEY);
    },

    getHeaders() {
        const token = this.getToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        };
    },

    isLoggedIn() {
        return !!this.getToken();
    },

    isAdmin() {
        const user = this.getUser();
        return user && user.role === 'admin';
    },

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    },

    validatePassword(password) {
        // At least 8 characters, one letter and one number
        return password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
    },

    async login(email, password, rememberMe = false) {
        if (!email || !password) {
            Toast.error('Please enter both email and password.');
            return false;
        }
        if (!this.validateEmail(email)) {
            Toast.error('Please enter a valid email address.');
            return false;
        }

        Loader.show('Logging in...');
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();

            Loader.hide();
            if (response.ok) {
                this.setSession(data.token, data.user, rememberMe);
                Toast.success(`Welcome back, ${data.user.username}!`);
                window.location.hash = '/dashboard';
                this.updateNavUI();
                return true;
            } else {
                Toast.error(data.message || 'Login failed.');
                return false;
            }
        } catch (error) {
            Loader.hide();
            Toast.error('Network error during login.');
            console.error(error);
            return false;
        }
    },

    async adminLogin(email, password) {
        if (!email || !password) {
            Toast.error('Please enter admin credentials.');
            return false;
        }

        Loader.show('Authenticating Admin...');
        try {
            const response = await fetch('/api/auth/admin-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();

            Loader.hide();
            if (response.ok) {
                this.setSession(data.token, data.user, false);
                Toast.success(`Administrator session started: ${data.user.username}`);
                window.location.hash = '/admin';
                this.updateNavUI();
                return true;
            } else {
                Toast.error(data.message || 'Admin authentication failed.');
                return false;
            }
        } catch (error) {
            Loader.hide();
            Toast.error('Network error during admin login.');
            console.error(error);
            return false;
        }
    },

    async register(username, email, password) {
        if (!username || !email || !password) {
            Toast.error('All fields are required.');
            return false;
        }
        if (username.length < 3) {
            Toast.error('Username must be at least 3 characters.');
            return false;
        }
        if (!this.validateEmail(email)) {
            Toast.error('Please enter a valid email address.');
            return false;
        }
        if (!this.validatePassword(password)) {
            Toast.error('Password must be at least 8 characters and contain at least one letter and one number.');
            return false;
        }

        Loader.show('Creating account...');
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            const data = await response.json();

            Loader.hide();
            if (response.ok) {
                Toast.success('Account registered successfully! Please log in.');
                window.location.hash = '/login';
                return true;
            } else {
                Toast.error(data.message || 'Registration failed.');
                return false;
            }
        } catch (error) {
            Loader.hide();
            Toast.error('Network error during registration.');
            console.error(error);
            return false;
        }
    },

    async forgotPassword(email) {
        if (!email || !this.validateEmail(email)) {
            Toast.error('Please enter a valid email address.');
            return false;
        }

        Loader.show('Sending reset request...');
        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await response.json();
            
            Loader.hide();
            if (response.ok) {
                Toast.success('Password reset link sent to your email. Check your inbox!');
                return true;
            } else {
                Toast.error(data.message || 'Failed to process request.');
                return false;
            }
        } catch (error) {
            Loader.hide();
            Toast.error('Network error during password reset request.');
            return false;
        }
    },

    async resetPassword(token, password) {
        if (!password || !this.validatePassword(password)) {
            Toast.error('New password must be at least 8 characters with letters and numbers.');
            return false;
        }

        Loader.show('Resetting password...');
        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            });
            const data = await response.json();

            Loader.hide();
            if (response.ok) {
                Toast.success('Password reset successfully. You can now login.');
                window.location.hash = '/login';
                return true;
            } else {
                Toast.error(data.message || 'Reset failed.');
                return false;
            }
        } catch (error) {
            Loader.hide();
            Toast.error('Network error resetting password.');
            return false;
        }
    },

    logout() {
        this.clearSession();
        Toast.success('Logged out successfully.');
        window.location.hash = '/';
        this.updateNavUI();
    },

    updateNavUI() {
        const user = this.getUser();
        const isLoggedIn = this.isLoggedIn();
        
        const navAuthElements = document.querySelectorAll('.nav-auth-state');
        const userDisplayElements = document.querySelectorAll('.nav-user-display');
        const userRoleElements = document.querySelectorAll('.nav-role-display');
        const dropdownAvatar = document.getElementById('nav-avatar-char');
        
        if (isLoggedIn && user) {
            // Show user items
            navAuthElements.forEach(el => {
                if (el.dataset.show === 'logged-in') el.style.display = 'flex';
                if (el.dataset.show === 'logged-out') el.style.display = 'none';
                if (el.dataset.show === 'admin-only') el.style.display = user.role === 'admin' ? 'flex' : 'none';
            });
            
            userDisplayElements.forEach(el => el.innerText = user.username);
            userRoleElements.forEach(el => el.innerText = user.role === 'admin' ? 'Administrator' : 'Patient');
            
            if (dropdownAvatar) {
                dropdownAvatar.innerText = user.username.charAt(0).toUpperCase();
            }
        } else {
            // Show guest items
            navAuthElements.forEach(el => {
                if (el.dataset.show === 'logged-in') el.style.display = 'none';
                if (el.dataset.show === 'logged-out') el.style.display = 'flex';
                if (el.dataset.show === 'admin-only') el.style.display = 'none';
            });
        }
    }
};

window.Auth = Auth;
export default Auth;
