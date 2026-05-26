/**
 * HEARTAI SYSTEM - DASHBOARD VISUALIZATIONS & LOGIC
 */

const Dashboard = {
    charts: {},

    async init() {
        if (!Auth.isLoggedIn()) {
            window.location.hash = '/login';
            return;
        }

        // Render Skeletons first
        document.getElementById('db-cards-container').innerHTML = Skeletons.renderDashboardCards();
        document.getElementById('recent-activity-container').innerHTML = Skeletons.renderTable(3, 4);

        await this.loadDashboardData();
    },

    async loadDashboardData() {
        try {
            // Fetch user predictions history
            const historyResponse = await fetch('/api/predict/history', {
                headers: Auth.getHeaders()
            });
            const historyData = await historyResponse.json();

            // Fetch model training metrics
            const metricsResponse = await fetch('/api/predict/metrics', {
                headers: Auth.getHeaders()
            });
            const metricsData = await metricsResponse.json();

            if (!historyResponse.ok || !metricsResponse.ok) {
                Toast.error('Failed to load dashboard parameters.');
                return;
            }

            const predictions = historyData.predictions || [];
            
            // Process metrics
            this.updateStatsCards(predictions, metricsData);
            this.renderRecentTable(predictions);
            this.renderCharts(predictions, metricsData);

        } catch (error) {
            console.error('Dashboard loading error:', error);
            Toast.error('Network error loading dashboard statistics.');
        }
    },

    updateStatsCards(predictions, metricsData) {
        const total = predictions.length;
        const highRisk = predictions.filter(p => p.risk_level === 'High').length;
        const lowRisk = predictions.filter(p => p.risk_level === 'Low').length;
        
        // Stacking Classifier Accuracy as overall model accuracy
        const modelAccuracy = metricsData['Stacking Classifier'] ? 
            (metricsData['Stacking Classifier'].accuracy * 100).toFixed(1) + '%' : '85.2%';

        const html = `
            <div class="glass-card metric-card">
                <div class="metric-icon-box">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart-pulse"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l1.5-3 2 6 1.5-3h3.8"/></svg>
                </div>
                <div class="metric-info">
                    <h3>${total}</h3>
                    <p>Total Predictions</p>
                </div>
            </div>
            <div class="glass-card metric-card">
                <div class="metric-icon-box">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-alert"><path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.8 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                </div>
                <div class="metric-info">
                    <h3>${highRisk}</h3>
                    <p>High Risk Cases</p>
                </div>
            </div>
            <div class="glass-card metric-card">
                <div class="metric-icon-box">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-check"><path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.8 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
                </div>
                <div class="metric-info">
                    <h3>${lowRisk}</h3>
                    <p>Low Risk Cases</p>
                </div>
            </div>
            <div class="glass-card metric-card">
                <div class="metric-icon-box">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-activity-square"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M17 12h-2l-2 5-2-10-2 5H7"/></svg>
                </div>
                <div class="metric-info">
                    <h3>${modelAccuracy}</h3>
                    <p>Model Accuracy</p>
                </div>
            </div>
        `;
        document.getElementById('db-cards-container').innerHTML = html;
    },

    renderRecentTable(predictions) {
        const container = document.getElementById('recent-activity-container');
        
        if (predictions.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 30px; color: var(--text-secondary);">
                    No prediction history found. Click "Start Diagnosis" to test!
                </div>
            `;
            return;
        }

        // Get top 5 sorted by date (newest first)
        const recent = predictions.slice(0, 5);

        let tableRows = '';
        recent.forEach(p => {
            const date = new Date(p.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            const probabilityPercent = (p.probability * 100).toFixed(0) + '%';
            
            let riskBadgeClass = 'badge-low';
            if (p.risk_level === 'High') riskBadgeClass = 'badge-high';
            if (p.risk_level === 'Medium') riskBadgeClass = 'badge-medium';

            tableRows += `
                <tr>
                    <td>${date}</td>
                    <td>${p.model_used}</td>
                    <td>${probabilityPercent}</td>
                    <td><span class="badge ${riskBadgeClass}">${p.risk_level}</span></td>
                    <td>
                        <a href="/api/reports/download/${p.id}" target="_blank" class="btn btn-outline" style="padding: 4px 10px; font-size: 12px; display: inline-flex; gap: 4px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download-cloud"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m8 17 4 4 4-4"/></svg> PDF
                        </a>
                    </td>
                </tr>
            `;
        });

        container.innerHTML = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>AI Model</th>
                            <th>Probability</th>
                            <th>Risk Classification</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderCharts(predictions, metricsData) {
        // Destroy existing charts to prevent rendering overlapping canvas glitches
        Object.keys(this.charts).forEach(key => {
            if (this.charts[key]) this.charts[key].destroy();
        });

        const isDark = document.body.classList.contains('dark-mode');
        const textCol = isDark ? '#f1f5f9' : '#1e293b';
        const gridCol = isDark ? '#1f2937' : '#e2e8f0';

        // 1. Pie Chart - Risk Categories Distribution
        const lowCount = predictions.filter(p => p.risk_level === 'Low').length;
        const medCount = predictions.filter(p => p.risk_level === 'Medium').length;
        const highCount = predictions.filter(p => p.risk_level === 'High').length;
        
        // Safe check for empty charts
        const pieData = (lowCount === 0 && medCount === 0 && highCount === 0) ? [1, 0, 0] : [lowCount, medCount, highCount];
        const pieLabels = (lowCount === 0 && medCount === 0 && highCount === 0) ? ['No Data (Low)', 'Medium', 'High'] : ['Low Risk', 'Medium Risk', 'High Risk'];

        const ctxPie = document.getElementById('riskPieChart').getContext('2d');
        this.charts.pie = new Chart(ctxPie, {
            type: 'doughnut',
            data: {
                labels: pieLabels,
                datasets: [{
                    data: pieData,
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                    borderWidth: 2,
                    borderColor: isDark ? '#111827' : '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: textCol, boxWidth: 12, font: { family: 'Inter', size: 11 } }
                    }
                },
                cutout: '65%'
            }
        });

        // 2. Bar Chart - Model Performance Benchmark Comparison
        const models = ['Random Forest', 'XGBoost', 'Stacking Classifier'];
        const accuracies = models.map(m => metricsData[m] ? metricsData[m].accuracy * 100 : 80);
        const precisions = models.map(m => metricsData[m] ? metricsData[m].precision * 100 : 78);
        const recalls = models.map(m => metricsData[m] ? metricsData[m].recall * 100 : 82);

        const ctxBar = document.getElementById('modelBarChart').getContext('2d');
        this.charts.bar = new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: models,
                datasets: [
                    {
                        label: 'Accuracy',
                        data: accuracies,
                        backgroundColor: '#0F4C81',
                        borderRadius: 4
                    },
                    {
                        label: 'Precision',
                        data: precisions,
                        backgroundColor: '#00A8A8',
                        borderRadius: 4
                    },
                    {
                        label: 'Recall',
                        data: recalls,
                        backgroundColor: '#FF6B6B',
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: textCol, boxWidth: 12 }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: textCol },
                        grid: { display: false }
                    },
                    y: {
                        min: 0,
                        max: 100,
                        ticks: { color: textCol },
                        grid: { color: gridCol }
                    }
                }
            }
        });

        // 3. Line Chart - Risk Distribution Graph over logged history
        // Plot probability scores of the last 10 predictions chronologically
        const chronological = [...predictions].reverse().slice(-10);
        const lineLabels = chronological.map((_, idx) => `Diagnosis ${idx + 1}`);
        const lineData = chronological.map(p => p.probability * 100);

        const ctxLine = document.getElementById('riskTrendChart').getContext('2d');
        this.charts.line = new Chart(ctxLine, {
            type: 'line',
            data: {
                labels: lineLabels.length > 0 ? lineLabels : ['No Data'],
                datasets: [{
                    label: 'Calculated Risk Probability %',
                    data: lineData.length > 0 ? lineData : [0],
                    borderColor: '#FF6B6B',
                    backgroundColor: 'rgba(255, 107, 107, 0.15)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: '#0F4C81',
                    pointBorderColor: '#fff',
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        ticks: { color: textCol },
                        grid: { display: false }
                    },
                    y: {
                        min: 0,
                        max: 100,
                        ticks: { color: textCol },
                        grid: { color: gridCol }
                    }
                }
            }
        });
    }
};

window.Dashboard = Dashboard;
