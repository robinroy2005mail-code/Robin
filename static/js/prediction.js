/**
 * HEARTAI SYSTEM - CARDIOVASCULAR PREDICTION MODULE
 */

const Prediction = {
    currentStep: 1,
    totalSteps: 3,

    init() {
        this.currentStep = 1;
        this.updateWizardUI();
        this.setupEventListeners();
        this.loadModelMetrics();
    },

    setupEventListeners() {
        const nextBtn = document.getElementById('wizard-next-btn');
        const prevBtn = document.getElementById('wizard-prev-btn');
        const form = document.getElementById('prediction-wizard-form');

        if (nextBtn) {
            nextBtn.onclick = () => {
                if (this.validateStep(this.currentStep)) {
                    this.currentStep++;
                    this.updateWizardUI();
                }
            };
        }

        if (prevBtn) {
            prevBtn.onclick = () => {
                this.currentStep--;
                this.updateWizardUI();
            };
        }

        if (form) {
            form.onsubmit = (e) => {
                e.preventDefault();
                if (this.validateStep(this.currentStep)) {
                    this.submitPrediction();
                }
            };
        }
    },

    updateWizardUI() {
        // Toggle step panes
        for (let i = 1; i <= this.totalSteps; i++) {
            const pane = document.getElementById(`wizard-step-${i}`);
            const node = document.getElementById(`wizard-node-${i}`);
            
            if (pane) pane.classList.toggle('active', i === this.currentStep);
            
            if (node) {
                node.classList.toggle('active', i === this.currentStep);
                node.classList.toggle('completed', i < this.currentStep);
            }
        }

        // Update progress line fill
        const fillPercent = ((this.currentStep - 1) / (this.totalSteps - 1)) * 100;
        const progressFill = document.getElementById('wizard-progress-fill');
        if (progressFill) progressFill.style.width = `${fillPercent}%`;

        // Update Button States
        const prevBtn = document.getElementById('wizard-prev-btn');
        const nextBtn = document.getElementById('wizard-next-btn');
        const submitBtn = document.getElementById('wizard-submit-btn');

        if (prevBtn) prevBtn.style.display = this.currentStep === 1 ? 'none' : 'flex';
        if (nextBtn) nextBtn.style.display = this.currentStep === this.totalSteps ? 'none' : 'flex';
        if (submitBtn) submitBtn.style.display = this.currentStep === this.totalSteps ? 'flex' : 'none';
    },

    validateStep(step) {
        let isValid = true;

        const clearError = (id) => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.remove('is-invalid');
                const feedback = el.nextElementSibling;
                if (feedback && feedback.classList.contains('invalid-feedback')) {
                    feedback.style.display = 'none';
                }
            }
        };

        const showError = (id, msg) => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.add('is-invalid');
                const feedback = el.nextElementSibling;
                if (feedback && feedback.classList.contains('invalid-feedback')) {
                    feedback.innerText = msg;
                    feedback.style.display = 'block';
                }
            }
            isValid = false;
        };

        if (step === 1) {
            clearError('age');
            clearError('trestbps');
            clearError('chol');

            const age = parseInt(document.getElementById('age').value);
            const trestbps = parseInt(document.getElementById('trestbps').value);
            const chol = parseInt(document.getElementById('chol').value);

            if (isNaN(age) || age < 1 || age > 120) {
                showError('age', 'Please enter a realistic age between 1 and 120.');
            }
            if (isNaN(trestbps) || trestbps < 50 || trestbps > 250) {
                showError('trestbps', 'Please enter a valid blood pressure value between 50 and 250 mmHg.');
            }
            if (isNaN(chol) || chol < 80 || chol > 600) {
                showError('chol', 'Please enter a valid serum cholesterol level between 80 and 600 mg/dL.');
            }
        }

        if (step === 2) {
            clearError('thalach');

            const thalach = parseInt(document.getElementById('thalach').value);

            if (isNaN(thalach) || thalach < 50 || thalach > 220) {
                showError('thalach', 'Please enter a realistic maximum heart rate between 50 and 220 bpm.');
            }
        }

        if (step === 3) {
            clearError('oldpeak');

            const oldpeak = parseFloat(document.getElementById('oldpeak').value);

            if (isNaN(oldpeak) || oldpeak < 0.0 || oldpeak > 10.0) {
                showError('oldpeak', 'ST depression must be a valid float value between 0.0 and 10.0 mm.');
            }
        }

        return isValid;
    },

    async loadModelMetrics() {
        try {
            const response = await fetch('/api/predict/metrics', {
                headers: Auth.getHeaders()
            });
            const data = await response.json();
            
            if (response.ok) {
                this.renderModelMetricsGrid(data);
            }
        } catch (e) {
            console.error('Failed to load model metrics:', e);
        }
    },

    renderModelMetricsGrid(data) {
        const container = document.getElementById('model-metrics-eval-grid');
        if (!container) return;

        const models = ['Random Forest', 'XGBoost', 'Stacking Classifier'];
        let html = '';

        models.forEach(m => {
            const mData = data[m];
            if (!mData) return;

            const acc = (mData.accuracy * 100).toFixed(1) + '%';
            const prec = (mData.precision * 100).toFixed(1) + '%';
            const rec = (mData.recall * 100).toFixed(1) + '%';
            const f1 = (mData.f1_score * 100).toFixed(1) + '%';

            // Confusion matrix diagonal matching
            const cm = mData.confusion_matrix;
            const tn = cm[0][0], fp = cm[0][1], fn = cm[1][0], tp = cm[1][1];

            html += `
                <div class="eval-card">
                    <h4>${m} Performance</h4>
                    <div class="eval-metric-row"><span>Accuracy</span><span>${acc}</span></div>
                    <div class="eval-metric-row"><span>Precision</span><span>${prec}</span></div>
                    <div class="eval-metric-row"><span>Recall</span><span>${rec}</span></div>
                    <div class="eval-metric-row"><span>F1-Score</span><span>${f1}</span></div>
                    
                    <div class="confusion-matrix-box">
                        <div style="font-weight: 600; margin-bottom: 5px;">Confusion Matrix</div>
                        <div class="cm-row">
                            <div class="cm-cell diagonal" title="True Negative (TN)">${tn}</div>
                            <div class="cm-cell" title="False Positive (FP)">${fp}</div>
                        </div>
                        <div class="cm-row">
                            <div class="cm-cell" title="False Negative (FN)">${fn}</div>
                            <div class="cm-cell diagonal" title="True Positive (TP)">${tp}</div>
                        </div>
                        <div style="font-size: 9px; color: var(--text-secondary); margin-top: 5px;">[TN   FP] / [FN   TP]</div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    async submitPrediction() {
        if (!Auth.isLoggedIn()) {
            Toast.error('Please login to complete prediction requests.');
            window.location.hash = '/login';
            return;
        }

        Loader.show('Analyzing cardiovascular data...');

        // Assemble body payload
        const formData = {
            age: parseInt(document.getElementById('age').value),
            sex: parseInt(document.getElementById('sex').value),
            cp: parseInt(document.getElementById('cp').value),
            trestbps: parseInt(document.getElementById('trestbps').value),
            chol: parseInt(document.getElementById('chol').value),
            fbs: parseInt(document.getElementById('fbs').value),
            restecg: parseInt(document.getElementById('restecg').value),
            thalach: parseInt(document.getElementById('thalach').value),
            exang: parseInt(document.getElementById('exang').value),
            oldpeak: parseFloat(document.getElementById('oldpeak').value),
            slope: parseInt(document.getElementById('slope').value),
            ca: parseInt(document.getElementById('ca').value),
            thal: parseInt(document.getElementById('thal').value),
            model_used: document.getElementById('model_used').value
        };

        try {
            const response = await fetch('/api/predict', {
                method: 'POST',
                headers: Auth.getHeaders(),
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            Loader.hide();

            if (response.ok) {
                Toast.success('AI Diagnostics Complete!');
                this.displayResults(data.prediction);
            } else {
                Toast.error(data.message || 'Analysis failed. Please check inputs.');
            }
        } catch (error) {
            Loader.hide();
            Toast.error('Server error executing prediction.');
            console.error(error);
        }
    },

    displayResults(pred) {
        // Reroute to results view
        window.location.hash = '/results';

        // Calculate visual properties
        const probability = pred.probability * 100;
        const healthScore = Math.max(0, Math.min(100, Math.round(100 - probability)));
        const riskLevel = pred.risk_level;

        // Update score texts
        document.getElementById('result-score-num').innerText = `${healthScore}`;
        document.getElementById('result-prob-percentage').innerText = `${probability.toFixed(1)}%`;
        document.getElementById('result-model-text').innerText = pred.model_used;

        // Circular stroke animation
        // Radius of circle is 50, circumference is 2 * PI * r = 314.159
        const circle = document.getElementById('risk-progress-circle');
        if (circle) {
            const circumference = 2 * Math.PI * 50; // 314.159
            circle.style.strokeDasharray = `${circumference}`;
            
            // strokeDashoffset indicates empty gap. If probability is 80%, gap should be 20%
            // So offset is 20% of circumference
            const offset = circumference - (probability / 100) * circumference;
            circle.style.strokeDashoffset = `${offset}`;

            // Adjust stroke color
            if (riskLevel === 'High') {
                circle.style.stroke = '#ef4444'; // Coral Red
            } else if (riskLevel === 'Medium') {
                circle.style.stroke = '#f59e0b'; // Amber Yellow
            } else {
                circle.style.stroke = '#10b981'; // Green
            }
        }

        // Configure Risk Banner Card Alert
        const alertCard = document.getElementById('result-alert-card');
        alertCard.className = `result-card-alert ${riskLevel.toLowerCase()}`;
        
        let headerTxt = '';
        let bodyTxt = '';

        if (riskLevel === 'High') {
            headerTxt = 'DIAGNOSTIC CRITERIA: HIGH CLINICAL RISK';
            bodyTxt = 'Ensemble classification metrics indicate high risk of coronary heart disease. It is strongly recommended to register these findings with a medical professional immediately. Avoid sudden intense exercise and plan a clinical examination (stress test, echocardiography, or angiography).';
        } else if (riskLevel === 'Medium') {
            headerTxt = 'DIAGNOSTIC CRITERIA: MODERATE CLINICAL RISK';
            bodyTxt = 'Ensemble metrics indicate moderate risk indicators. We suggest scheduling an assessment with your physician to evaluate vitals, review dietary profiles, and establish preventive diagnostic logs.';
        } else {
            headerTxt = 'DIAGNOSTIC CRITERIA: NORMAL / LOW RISK';
            bodyTxt = 'Ensemble classifiers detected low statistical correlation with coronary artery disease. Continue maintaining cardio-protective eating, consistent physical activities, and periodic checkups.';
        }

        alertCard.innerHTML = `
            <h4 style="font-weight: 800; font-size: 15px; margin-bottom: 8px;">${headerTxt}</h4>
            <p style="font-size: 13.5px; opacity: 0.95;">${bodyTxt}</p>
        `;

        // Update suggestions
        this.updateSuggestions(riskLevel);

        // Configure PDF link
        const pdfBtn = document.getElementById('results-pdf-btn');
        if (pdfBtn) {
            pdfBtn.href = `/api/reports/download/${pred.id}`;
        }
    },

    updateSuggestions(riskLevel) {
        let diet = '', exercise = '', medical = '', lifestyle = '';

        if (riskLevel === 'High') {
            diet = "Strict low-sodium DASH diet. Minimize trans/saturated lipids and simple sugars. Maximize dietary fibers.";
            exercise = "Perform structured cardiovascular rehab. Avoid lifting or high intensity aerobics until cleared by your cardiologist.";
            medical = "Book an urgent cardiology review. Obtain lipid panels, resting ECG, and stress echocardiogram.";
            lifestyle = "Abstain from all nicotine/tobacco, establish daily blood pressure charts, and prioritize stress relief.";
        } else if (riskLevel === 'Medium') {
            diet = "Transition towards Mediterranean eating habits. Restrict sodium and decrease red meat intake.";
            exercise = "Engage in moderate-intensity aerobic exercise (brisk walking) for 30 minutes, 3-5 days weekly.";
            medical = "Schedule routine physician follow-up to check vitals, lipid logs, and discuss family risk variables.";
            lifestyle = "Implement daily breathing exercises or mindfulness, ensure 7-8 hours of sleep, and curb alcohol consumption.";
        } else {
            diet = "Ensure nutrient-dense daily intake of raw greens, legumes, healthy fats, and high-quality protein.";
            exercise = "Achieve 150 minutes of moderate aerobic workouts or 75 minutes of heavy training weekly.";
            medical = "Maintain annual biometric screenings (blood pressure, fasting glucose, standard lipid profiles).";
            lifestyle = "Keep daily stress managed, minimize physical sitting times, and avoid secondary smoke exposure.";
        }

        const content = `
            <div class="suggestion-item">
                <div class="suggestion-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
                <div class="suggestion-text">
                    <h4>Dietary Recommendations</h4>
                    <p>${diet}</p>
                </div>
            </div>
            <div class="suggestion-item lifestyle">
                <div class="suggestion-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.8 6a2.46 2.46 0 0 0-3.6 0l-.8.8-.8-.8a2.46 2.46 0 0 0-3.6 0 2.46 2.46 0 0 0 0 3.6l.8.8-4 4a2.46 2.46 0 0 0 0 3.6 2.46 2.46 0 0 0 3.6 0l4-4 .8.8a2.46 2.46 0 0 0 3.6 0 2.46 2.46 0 0 0 0-3.6l-.8-.8.8-.8a2.46 2.46 0 0 0 0-3.6Z"/></svg>
                </div>
                <div class="suggestion-text">
                    <h4>Exercise Guidelines</h4>
                    <p>${exercise}</p>
                </div>
            </div>
            <div class="suggestion-item medical">
                <div class="suggestion-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m14 12-8.5 8.5a2.12 2.12 0 1 1-3-3L11 9"/><path d="M15 13 9 7"/><path d="m9 22 10-10L14 7 4 17l5 5Z"/><path d="m17 12 5-5-4-4-5 5 4 4Z"/></svg>
                </div>
                <div class="suggestion-text">
                    <h4>Medical Consultations</h4>
                    <p>${medical}</p>
                </div>
            </div>
            <div class="suggestion-item">
                <div class="suggestion-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>
                </div>
                <div class="suggestion-text">
                    <h4>Lifestyle Modifiers</h4>
                    <p>${lifestyle}</p>
                </div>
            </div>
        `;
        document.getElementById('result-suggestions-container').innerHTML = content;
    }
};

window.Prediction = Prediction;
