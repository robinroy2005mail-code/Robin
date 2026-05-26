import os
import jwt
import sqlite3
import pandas as pd
import numpy as np
import joblib
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import Flask, request, jsonify, send_file, render_template

# Initialize Database Manager
from database.db_manager import init_db, get_db_connection, DB_PATH
from reports.pdf_generator import generate_report_pdf
from ml.model import train_and_save_models
from ml.visualizations import create_visualizations

app = Flask(__name__, template_folder='templates', static_folder='static')
app.config['SECRET_KEY'] = 'heart_ai_clinical_token_secret_key_2026_spec'

# Ensure directories exist
os.makedirs(os.path.join(app.root_path, 'reports'), exist_ok=True)
os.makedirs(os.path.join(app.root_path, 'ml', 'models'), exist_ok=True)

# Initialize database schema at startup
print("Initializing database tables...")
init_db()

# --------------------------------------------------------------------------
# Route Guard Decorators
# --------------------------------------------------------------------------
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Check header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
                
        # Check query parameters (helpful for target="_blank" PDF report downloads)
        if not token and 'token' in request.args:
            token = request.args.get('token')

        if not token:
            return jsonify({'message': 'Authorization token is missing.'}), 401

        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute('SELECT id, username, email, role FROM users WHERE id = ?', (data['user_id'],))
            current_user = cursor.fetchone()
            conn.close()
            
            if not current_user:
                return jsonify({'message': 'User record not found.'}), 401
                
            # Convert row to dictionary
            current_user = dict(current_user)
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Session expired. Please log in again.'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid session token.'}), 401

        return f(current_user, *args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if current_user['role'] != 'admin':
            return jsonify({'message': 'Access denied. Administrative privilege required.'}), 403
        return f(current_user, *args, **kwargs)
    return decorated

# --------------------------------------------------------------------------
# Helper functions
# --------------------------------------------------------------------------
def load_ml_components():
    models_dir = os.path.join(app.root_path, 'ml', 'models')
    
    # Check if models are present, train them if not
    metrics_path = os.path.join(models_dir, 'metrics.json')
    if not os.path.exists(metrics_path):
        print("Model files not found. Launching training pipeline...")
        train_and_save_models()
        create_visualizations()
        
    scaler = joblib.load(os.path.join(models_dir, 'scaler.joblib'))
    rf_model = joblib.load(os.path.join(models_dir, 'rf_model.joblib'))
    xgb_model = joblib.load(os.path.join(models_dir, 'xgb_model.joblib'))
    stacking_model = joblib.load(os.path.join(models_dir, 'stacking_model.joblib'))
    
    return scaler, rf_model, xgb_model, stacking_model

# --------------------------------------------------------------------------
# 1. Base client serving route
# --------------------------------------------------------------------------
@app.route('/')
def index():
    return render_template('index.html')

# --------------------------------------------------------------------------
# 2. User Authentication APIs
# --------------------------------------------------------------------------
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({'message': 'All parameters are required.'}), 400

    from werkzeug.security import generate_password_hash
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        password_hash = generate_password_hash(password)
        cursor.execute(
            'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
            (username, email, password_hash, 'user')
        )
        conn.commit()
    except sqlite3.IntegrityError:
        return jsonify({'message': 'Username or Email is already registered.'}), 400
    finally:
        conn.close()

    return jsonify({'message': 'Registration successful.'}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'message': 'Please provide email and password.'}), 400

    from werkzeug.security import check_password_hash
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE email = ?', (email,))
    user = cursor.fetchone()
    conn.close()

    if not user or not check_password_hash(user['password_hash'], password):
        return jsonify({'message': 'Incorrect email or password.'}), 401

    # Issue JWT Token
    # Use timezone-aware UTC datetime for expiration
    token = jwt.encode({
        'user_id': user['id'],
        'exp': datetime.now(timezone.utc) + timedelta(hours=24)
    }, app.config['SECRET_KEY'], algorithm='HS256')

    return jsonify({
        'token': token,
        'user': {
            'id': user['id'],
            'username': user['username'],
            'email': user['email'],
            'role': user['role']
        }
    }), 200

@app.route('/api/auth/admin-login', methods=['POST'])
def admin_login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'message': 'Parameters missing.'}), 400

    from werkzeug.security import check_password_hash
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE email = ?', (email,))
    user = cursor.fetchone()
    conn.close()

    if not user or user['role'] != 'admin' or not check_password_hash(user['password_hash'], password):
        return jsonify({'message': 'Incorrect admin credentials.'}), 401

    token = jwt.encode({
        'user_id': user['id'],
        'exp': datetime.now(timezone.utc) + timedelta(hours=24)
    }, app.config['SECRET_KEY'], algorithm='HS256')

    return jsonify({
        'token': token,
        'user': {
            'id': user['id'],
            'username': user['username'],
            'email': user['email'],
            'role': user['role']
        }
    }), 200

@app.route('/api/auth/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id FROM users WHERE email = ?', (email,))
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        return jsonify({'message': 'Email address not found.'}), 404
        
    return jsonify({'message': 'Reset request completed.'}), 200

# --------------------------------------------------------------------------
# 3. Model Predictions & Inference Endpoints
# --------------------------------------------------------------------------
@app.route('/api/predict', methods=['POST'])
@token_required
def predict(current_user):
    data = request.get_json()
    
    # 13 Inputs Extraction
    try:
        age = int(data['age'])
        sex = int(data['sex'])
        cp = int(data['cp'])
        trestbps = int(data['trestbps'])
        chol = int(data['chol'])
        fbs = int(data['fbs'])
        restecg = int(data['restecg'])
        thalach = int(data['thalach'])
        exang = int(data['exang'])
        oldpeak = float(data['oldpeak'])
        slope = int(data['slope'])
        ca = int(data['ca'])
        thal = int(data['thal'])
        model_used = data.get('model_used', 'Stacking Classifier')
    except (KeyError, ValueError) as e:
        return jsonify({'message': f'Invalid vital inputs parameters: {str(e)}'}), 400

    # Execute scaling standardizer & ML classification
    try:
        scaler, rf, xgb, stacking = load_ml_components()
        
        # Match model selection
        if model_used == 'Random Forest':
            model = rf
        elif model_used == 'XGBoost':
            model = xgb
        else:
            model = stacking
            
        # Standardize features format match
        input_data = pd.DataFrame([{
            'age': age, 'sex': sex, 'cp': cp, 'trestbps': trestbps, 'chol': chol,
            'fbs': fbs, 'restecg': restecg, 'thalach': thalach, 'exang': exang,
            'oldpeak': oldpeak, 'slope': slope, 'ca': ca, 'thal': thal
        }])
        
        continuous_features = ['age', 'trestbps', 'chol', 'thalach', 'oldpeak']
        input_scaled = input_data.copy()
        input_scaled[continuous_features] = scaler.transform(input_data[continuous_features])
        
        # Predict
        prediction_result = int(model.predict(input_scaled)[0])
        probability = float(model.predict_proba(input_scaled)[0][1])
        
        # Risk levels boundaries
        if probability < 0.35:
            risk_level = 'Low'
        elif probability <= 0.65:
            risk_level = 'Medium'
        else:
            risk_level = 'High'
            
    except Exception as error:
        return jsonify({'message': f'Model inference failed: {str(error)}'}), 500

    # Save to SQL database
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO predictions (
            user_id, age, sex, cp, trestbps, chol, fbs, restecg, thalach, 
            exang, oldpeak, slope, ca, thal, model_used, prediction_result, 
            probability, risk_level
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        current_user['id'], age, sex, cp, trestbps, chol, fbs, restecg, thalach,
        exang, oldpeak, slope, ca, thal, model_used, prediction_result,
        probability, risk_level
    ))
    
    prediction_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return jsonify({
        'message': 'Inference calculated.',
        'prediction': {
            'id': prediction_id,
            'user_id': current_user['id'],
            'age': age, 'sex': sex, 'cp': cp, 'trestbps': trestbps, 'chol': chol,
            'fbs': fbs, 'restecg': restecg, 'thalach': thalach, 'exang': exang,
            'oldpeak': oldpeak, 'slope': slope, 'ca': ca, 'thal': thal,
            'model_used': model_used,
            'prediction_result': prediction_result,
            'probability': probability,
            'risk_level': risk_level
        }
    }), 201

@app.route('/api/predict/history', methods=['GET'])
@token_required
def get_prediction_history(current_user):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        'SELECT * FROM predictions WHERE user_id = ? ORDER BY created_at DESC',
        (current_user['id'],)
    )
    history = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify({'predictions': history}), 200

@app.route('/api/predict/metrics', methods=['GET'])
def get_model_metrics():
    metrics_path = os.path.join(app.root_path, 'ml', 'models', 'metrics.json')
    
    if not os.path.exists(metrics_path):
        # Triggers initial training if needed
        load_ml_components()
        
    with open(metrics_path, 'r') as file:
        import json
        metrics = json.load(file)
        
    return jsonify(metrics), 200

# --------------------------------------------------------------------------
# 4. Administrative Control Panels APIs
# --------------------------------------------------------------------------
@app.route('/api/admin/users', methods=['GET'])
@token_required
@admin_required
def admin_get_users(current_user):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id, username, email, role, created_at FROM users')
    users = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify({'users': users}), 200

@app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
@token_required
@admin_required
def admin_delete_user(current_user, user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM users WHERE id = ?', (user_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'User deleted.'}), 200

@app.route('/api/admin/predictions', methods=['GET'])
@token_required
@admin_required
def admin_get_predictions(current_user):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT p.*, u.username, u.email 
        FROM predictions p 
        JOIN users u ON p.user_id = u.id 
        ORDER BY p.created_at DESC
    ''')
    predictions = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify({'predictions': predictions}), 200

@app.route('/api/admin/predictions/<int:pred_id>', methods=['DELETE'])
@token_required
@admin_required
def admin_delete_prediction(current_user, pred_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM predictions WHERE id = ?', (pred_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Diagnostic log deleted.'}), 200

@app.route('/api/admin/upload-dataset', methods=['POST'])
@token_required
@admin_required
def admin_upload_dataset(current_user):
    if 'file' not in request.files:
        return jsonify({'message': 'No CSV dataset file uploaded.'}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({'message': 'Invalid file name.'}), 400
        
    if file and file.filename.endswith('.csv'):
        dataset_path = os.path.join(app.root_path, 'ml', 'dataset', 'heart_disease.csv')
        file.save(dataset_path)
        
        # Retrain ensemble classifiers
        try:
            train_and_save_models()
            create_visualizations()
        except Exception as e:
            return jsonify({'message': f'Retraining pipeline failed: {str(e)}'}), 500
            
        return jsonify({'message': 'Ensemble retrained successfully.'}), 200
        
    return jsonify({'message': 'Only CSV datasets supported.'}), 400

# --------------------------------------------------------------------------
# 5. PDF Export Streaming Route
# --------------------------------------------------------------------------
@app.route('/api/reports/download/<int:pred_id>', methods=['GET'])
def download_pdf(pred_id):
    # Query prediction
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT p.*, u.username, u.email 
        FROM predictions p 
        JOIN users u ON p.user_id = u.id 
        WHERE p.id = ?
    ''', (pred_id,))
    pred_row = cursor.fetchone()
    conn.close()
    
    if not pred_row:
        return "Prediction report record not found.", 404
        
    pred_data = dict(pred_row)
    pdf_path = os.path.join(app.root_path, 'reports', f'report_{pred_id}.pdf')
    
    # Generate PDF Report
    try:
        generate_report_pdf(pred_data, pdf_path)
    except Exception as e:
        return f"Failed to generate clinical PDF: {str(e)}", 500
        
    return send_file(
        pdf_path,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f"Cardiac_Analysis_Report_HT-{pred_id:03d}.pdf"
    )

# --------------------------------------------------------------------------
# Application Startup
# --------------------------------------------------------------------------
if __name__ == '__main__':
    print("Checking database tables...")
    init_db()
    
    print("Loading Machine Learning parameters...")
    load_ml_components()
    
    print("Initializing HTTP Gateway on port 5000...")
    app.run(debug=True, host='0.0.0.0', port=5000)
