/**
 * HEARTAI SYSTEM - ADMIN PANEL CONTROLLER
 */

const Admin = {
    users: [],
    predictions: [],

    async init() {
        if (!Auth.isLoggedIn() || !Auth.isAdmin()) {
            Toast.error('Access Denied. Administrator role required.');
            window.location.hash = '/dashboard';
            return;
        }

        this.setupTabs();
        this.setupEventListeners();
        await this.loadUsers();
        await this.loadPredictions();
    },

    setupTabs() {
        const tabs = document.querySelectorAll('.admin-tab');
        tabs.forEach(tab => {
            tab.onclick = () => {
                const target = tab.dataset.target;
                
                // Toggle active tab header
                tabs.forEach(t => t.classList.toggle('active', t === tab));
                
                // Toggle active tab content
                document.querySelectorAll('.admin-panel-content').forEach(content => {
                    content.classList.toggle('active', content.id === target);
                });
            };
        });
    },

    setupEventListeners() {
        // Search filter listeners
        const userSearch = document.getElementById('admin-users-search');
        if (userSearch) {
            userSearch.oninput = (e) => this.filterUsers(e.target.value);
        }

        const logSearch = document.getElementById('admin-logs-search');
        if (logSearch) {
            logSearch.oninput = (e) => this.filterPredictions(e.target.value);
        }

        // Setup File Upload Zone
        const uploadZone = document.getElementById('dataset-upload-zone');
        const fileInput = document.getElementById('dataset-file-input');

        if (uploadZone && fileInput) {
            uploadZone.onclick = () => fileInput.click();
            
            uploadZone.ondragover = (e) => {
                e.preventDefault();
                uploadZone.style.borderColor = 'var(--primary)';
            };

            uploadZone.ondragleave = () => {
                uploadZone.style.borderColor = 'var(--border)';
            };

            uploadZone.ondrop = (e) => {
                e.preventDefault();
                uploadZone.style.borderColor = 'var(--border)';
                if (e.dataTransfer.files.length > 0) {
                    this.uploadDataset(e.dataTransfer.files[0]);
                }
            };

            fileInput.onchange = (e) => {
                if (e.target.files.length > 0) {
                    this.uploadDataset(e.target.files[0]);
                }
            };
        }
    },

    async loadUsers() {
        const listContainer = document.getElementById('admin-users-list');
        listContainer.innerHTML = Skeletons.renderTable(4, 5);

        try {
            const response = await fetch('/api/admin/users', {
                headers: Auth.getHeaders()
            });
            const data = await response.json();

            if (response.ok) {
                this.users = data.users || [];
                this.renderUsersTable(this.users);
            } else {
                Toast.error(data.message || 'Failed to load user accounts.');
            }
        } catch (e) {
            Toast.error('Network error fetching users list.');
            console.error(e);
        }
    },

    renderUsersTable(usersList) {
        const container = document.getElementById('admin-users-list');
        
        if (usersList.length === 0) {
            container.innerHTML = `<div style="text-align: center; padding: 20px;">No registered accounts matched.</div>`;
            return;
        }

        let rows = '';
        usersList.forEach(u => {
            const date = new Date(u.created_at).toLocaleString();
            const isSelf = u.id === Auth.getUser().id;

            rows += `
                <tr>
                    <td>${u.id}</td>
                    <td>${u.username}</td>
                    <td>${u.email}</td>
                    <td><span class="badge ${u.role === 'admin' ? 'badge-high' : 'badge-low'}">${u.role}</span></td>
                    <td>${date}</td>
                    <td>
                        ${isSelf ? '<span style="font-size: 11px; color: var(--text-secondary);">Current Session</span>' : 
                        `<button onclick="Admin.deleteUser(${u.id}, '${u.username}')" class="btn btn-danger" style="padding: 4px 8px; font-size: 11px;">Delete</button>`}
                    </td>
                </tr>
            `;
        });

        container.innerHTML = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>User ID</th>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Date Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    },

    async loadPredictions() {
        const listContainer = document.getElementById('admin-logs-list');
        listContainer.innerHTML = Skeletons.renderTable(4, 6);

        try {
            const response = await fetch('/api/admin/predictions', {
                headers: Auth.getHeaders()
            });
            const data = await response.json();

            if (response.ok) {
                this.predictions = data.predictions || [];
                this.renderPredictionsTable(this.predictions);
            } else {
                Toast.error(data.message || 'Failed to load prediction history logs.');
            }
        } catch (e) {
            Toast.error('Network error fetching predictions list.');
            console.error(e);
        }
    },

    renderPredictionsTable(predList) {
        const container = document.getElementById('admin-logs-list');
        
        if (predList.length === 0) {
            container.innerHTML = `<div style="text-align: center; padding: 20px;">No diagnostic records found.</div>`;
            return;
        }

        let rows = '';
        predList.forEach(p => {
            const date = new Date(p.created_at).toLocaleString();
            let badgeClass = 'badge-low';
            if (p.risk_level === 'High') badgeClass = 'badge-high';
            if (p.risk_level === 'Medium') badgeClass = 'badge-medium';

            rows += `
                <tr>
                    <td>HT-2026-${p.id}</td>
                    <td>${p.username} (${p.email})</td>
                    <td>${p.age} yrs / ${p.sex === 1 ? 'M' : 'F'}</td>
                    <td>${p.model_used}</td>
                    <td>${(p.probability * 100).toFixed(0)}%</td>
                    <td><span class="badge ${badgeClass}">${p.risk_level}</span></td>
                    <td>${date}</td>
                    <td style="display: flex; gap: 5px;">
                        <a href="/api/reports/download/${p.id}" target="_blank" class="btn btn-outline" style="padding: 4px 8px; font-size: 11px;">PDF</a>
                        <button onclick="Admin.deletePrediction(${p.id})" class="btn btn-danger" style="padding: 4px 8px; font-size: 11px;">Delete</button>
                    </td>
                </tr>
            `;
        });

        container.innerHTML = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Report ID</th>
                            <th>Patient Detail</th>
                            <th>Age/Gender</th>
                            <th>Ensemble Model</th>
                            <th>Probability</th>
                            <th>Risk Classification</th>
                            <th>Inference Timestamp</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    },

    filterUsers(query) {
        const filtered = this.users.filter(u => 
            u.username.toLowerCase().includes(query.toLowerCase()) || 
            u.email.toLowerCase().includes(query.toLowerCase()) ||
            u.role.toLowerCase().includes(query.toLowerCase())
        );
        this.renderUsersTable(filtered);
    },

    filterPredictions(query) {
        const filtered = this.predictions.filter(p => 
            p.username.toLowerCase().includes(query.toLowerCase()) || 
            p.email.toLowerCase().includes(query.toLowerCase()) ||
            p.risk_level.toLowerCase().includes(query.toLowerCase()) ||
            p.model_used.toLowerCase().includes(query.toLowerCase())
        );
        this.renderPredictionsTable(filtered);
    },

    async deleteUser(userId, username) {
        if (!confirm(`Are you sure you want to permanently delete user account "${username}" and all their diagnostic predictions?`)) {
            return;
        }

        Loader.show('Deleting user...');
        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: Auth.getHeaders()
            });
            const data = await response.json();
            Loader.hide();

            if (response.ok) {
                Toast.success(`User ${username} deleted successfully.`);
                await this.loadUsers();
                await this.loadPredictions();
            } else {
                Toast.error(data.message || 'Deletion failed.');
            }
        } catch (e) {
            Loader.hide();
            Toast.error('Network error deleting user account.');
        }
    },

    async deletePrediction(predId) {
        if (!confirm(`Are you sure you want to delete prediction record HT-2026-${predId}?`)) {
            return;
        }

        Loader.show('Deleting log...');
        try {
            const response = await fetch(`/api/admin/predictions/${predId}`, {
                method: 'DELETE',
                headers: Auth.getHeaders()
            });
            const data = await response.json();
            Loader.hide();

            if (response.ok) {
                Toast.success('Diagnostic log deleted successfully.');
                await this.loadPredictions();
            } else {
                Toast.error(data.message || 'Deletion failed.');
            }
        } catch (e) {
            Loader.hide();
            Toast.error('Network error deleting prediction log.');
        }
    },

    async uploadDataset(file) {
        if (!file.name.endsWith('.csv')) {
            Toast.error('Please upload a valid CSV file dataset.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        Loader.show('Uploading dataset & retraining model (can take a minute)...');
        try {
            const response = await fetch('/api/admin/upload-dataset', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${Auth.getToken()}`
                    // Do not set Content-Type header so the browser sets it automatically with the multipart boundary
                },
                body: formData
            });
            const data = await response.json();
            Loader.hide();

            if (response.ok) {
                Toast.success('Dataset loaded and ML models retrained successfully!');
                
                // Refresh visualizations and reload charts
                const metricResponse = await fetch('/api/predict/metrics', { headers: Auth.getHeaders() });
                const metrics = await metricResponse.json();
                Prediction.renderModelMetricsGrid(metrics);
                
                // Force update dataset info charts by adding timestamps
                const heatmapImg = document.getElementById('dataset-heatmap-img');
                const distImg = document.getElementById('dataset-dist-img');
                if (heatmapImg) heatmapImg.src = `/static/img/heatmap.png?t=${new Date().getTime()}`;
                if (distImg) distImg.src = `/static/img/distributions.png?t=${new Date().getTime()}`;
                
            } else {
                Toast.error(data.message || 'Dataset upload and retraining failed.');
            }
        } catch (error) {
            Loader.hide();
            Toast.error('Network error uploading dataset CSV.');
            console.error(error);
        }
    }
};

window.Admin = Admin;
