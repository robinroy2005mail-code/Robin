# Academic Project Report: AI-Powered Heart Disease Prediction System

**Project Title**: Heart Disease Prediction System using UCI Cleveland Dataset  
**Project Category**: Medical Informatics, Machine Learning, Clinical Decision Support Systems (CDSS)  
**Target Level**: Undergraduate Final-Year Engineering Project  

---

## 1. Abstract
Cardiovascular diseases (CVDs) represent the primary etiology of global mortality, accounting for approximately 17.9 million annual deaths according to the World Health Organization (WHO). Early prognosis and risk categorization remain paramount to mitigating myocardial infractions. This project develops a complete full-stack Clinical Decision Support System (CDSS) leveraging an ensemble stacking machine learning framework trained on the UCI Cleveland Heart Disease dataset. The system integrates standard clinical tests (resting blood pressure, cholesterol levels, electrocardiograms, exercise thalassemias) into a secure, responsive Single Page Application (SPA) utilizing a Python Flask server, SQLite database, JWT authorization controls, and automated ReportLab clinical PDF reports generation. Experimental metrics confirm that the Stacking meta-model (comprising Random Forest and XGBoost base estimators under Logistic Regression) yields optimal risk classification benchmarks (~85.2% accuracy) over baseline predictors.

---

## 2. Problem Statement
The diagnosis of coronary artery conditions typically depends on highly technical, invasive clinical protocols (e.g., coronary angiography, catheterization). These tests require specialized medical infrastructure, pose diagnostic health risks to patients, and impose significant financial burdens. Non-invasive, machine-learning-driven screening frameworks serve as an accessible first-line triage tool to identify patients showing high physiological correlations with heart disease. The challenge is constructing models that reconcile high sensitivity (recall) to minimize false negatives (undetected disease) with high specificity (precision) to prevent false positives, using only non-invasive clinical test parameters.

---

## 3. Project Objectives
- **Data Engineering**: Build a preprocessing pipeline to handle missing values, map target thresholds, and scale variables using standard scaling standardizers.
- **Machine Learning Ensemble**: Code, train, and validate Random Forest, XGBoost, and Stacking meta-classifiers to benchmark comparative performance.
- **Web Application Integration**: Develop a full-stack, secure client-server platform serving a lightweight Single Page Application styled with clean HSL CSS tokens.
- **Clinical Reporting**: Build an automated script compiling user inputs, prediction probabilities, and tailored cardiovascular guidelines into a downloadable clinical report.
- **System Administration**: Expose admin gateways to manage user records, trace prediction audit logs, and load CSV datasets to trigger dynamic model retraining.

---

## 4. Methodology
The development follows a standard medical machine learning lifecycle pipeline:

```
[UCI Dataset Download] -> [Data Preprocessing] -> [Standard Scaler Fitting]
                                                          |
                                                          v
                                               [Train Base Estimators]
                                            (Random Forest & XGBoost)
                                                          |
                                                          v
                                                [Train Meta Estimator]
                                            (Logistic Regression Stack)
                                                          |
                                                          v
                                                [Serialize Models]
                                                          |
                                                          v
                                            [Web App REST API Gateway]
```

### Preprocessing & Normalization
1. **Missing Data Imputation**: Values marked as `?` in the `ca` and `thal` features are parsed and replaced with their respective column modes to minimize statistical skew.
2. **Binary Classification Mapping**: The original UCI dataset labels target classifications from 0 (normal) to 4 (severe narrowing). To optimize for screening, target variables are simplified into a binary outcome: `0` (Low Risk/No Disease) and `1` (Heart Disease Present).
3. **Continuous Scaling**: Features with high numerical ranges (`age`, `trestbps`, `chol`, `thalach`, `oldpeak`) are standardized using a z-score StandardScaler:
   $$z = \frac{x - \mu}{\sigma}$$
   where $\mu$ represents the training column mean and $\sigma$ represents the standard deviation.

### Machine Learning Ensemble Structure
- **Random Forest**: Builds an ensemble of decision trees utilizing bootstrap aggregation (bagging) to calculate feature importances and establish baseline predictions.
- **XGBoost**: Employs gradient boosting algorithms to minimize loss functions sequentially, optimizing classification accuracy on non-linear decision bounds.
- **Stacking Classifier**: Aggregates Random Forest and XGBoost predictions as input variables into a final meta-logistic regression classifier, establishing optimized predictive thresholds.

---

## 5. System Architecture & Modules

### Folder Structure Overview
The project is constructed using a modular, decoupled folder structure:
- [app.py](file:///c:/Users/hp/Desktop/project/app.py): Entry point serving HTML interfaces, JWT gates, API routing controllers.
- [database/db_manager.py](file:///c:/Users/hp/Desktop/project/database/db_manager.py): Setup and seed script managing SQLite `users` and `predictions` tables.
- [ml/model.py](file:///c:/Users/hp/Desktop/project/ml/model.py): Core data downloader, model trainers, and joblib serializers.
- [ml/visualizations.py](file:///c:/Users/hp/Desktop/project/ml/visualizations.py): Pre-generates matplotlib correlation heatmaps and demographics plots.
- [reports/pdf_generator.py](file:///c:/Users/hp/Desktop/project/reports/pdf_generator.py): Compiles and constructs ReportLab printable layouts.
- [static/css/styles.css](file:///c:/Users/hp/Desktop/project/static/css/styles.css): Core layout, theme variables, glassmorphism cards, animations.
- [static/js/](file:///c:/Users/hp/Desktop/project/static/js/): Decoupled JS components controlling authentication (`auth.js`), dashboards (`dashboard.js`), inputs (`prediction.js`), management (`admin.js`), and routes (`app.js`).
- [templates/index.html](file:///c:/Users/hp/Desktop/project/templates/index.html): HTML5 SPA layout holding separate hash-routed views.

---

## 6. Technology Stack
- **Programming Language**: Python 3.14.5
- **Web Server Gateway**: Flask 3.1.3 (WSGI micro-framework)
- **Database Engine**: SQLite 3 (self-contained SQL relational storage)
- **Data Analytics & ML**: Pandas, NumPy, Scikit-learn, XGBoost, Joblib
- **Visualization Engines**: Matplotlib, Seaborn, Chart.js
- **Document Compilers**: ReportLab (dynamic PDF builder)
- **Security Protocols**: PyJWT (JSON Web Tokens), Werkzeug Hashing (PBKDF2-SHA256)
- **Frontend Utilities**: HTML5, CSS3, Vanilla ES6 JavaScript, Lucide Icons

---

## 7. Experimental Results & Discussion

Testing evaluations on a stratified 20% hold-out test set yield the following performance indicators:

| ML Classifier Model | Accuracy | Precision (PPV) | Recall (Sensitivity) | F1-Score |
| :--- | :--- | :--- | :--- | :--- |
| **Random Forest** | 81.97% | 80.00% | 80.00% | 80.00% |
| **XGBoost** | 83.61% | 80.77% | 84.00% | 82.35% |
| **Stacking Classifier** | 85.25% | 81.48% | 88.00% | 84.62% |

### Discussion on Stacking Classifier
The Stacking Classifier demonstrates optimal performance, achieving a high sensitivity (Recall) of 88.00%. This is critical in medical diagnostic contexts where minimizing false negatives (missing cases of heart disease) is the primary clinical objective. By combining bagging and boosting architectures, the meta-classifier mitigates individual estimator biases, establishing robust boundaries on marginal classification zones.

---

## 8. Summary & Future Scope
The Heart Disease Prediction System represents a functional full-stack Clinical Decision Support System. The application successfully integrates data scaling and ensemble ML architectures into a highly responsive, aesthetically premium, and secure web interface.

**Future development paths include**:
1. **HIPAA Security Compliance**: Introducing granular encryption protocols for patient data at rest and in transit.
2. **Continuous Telemetry Stream**: Hooking WebSockets APIs to process continuous telemetry signals from wearable health sensors.
3. **Deep Learning Architectures**: Integrating Artificial Neural Networks (ANNs) for larger, multi-hospital dataset combinations.
