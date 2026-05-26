import os
import sqlite3
from datetime import datetime
from werkzeug.security import generate_password_hash

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    # Ensure directory exists
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Create Users Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 2. Create Predictions Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            age INTEGER NOT NULL,
            sex INTEGER NOT NULL, -- 1=Male, 0=Female
            cp INTEGER NOT NULL,  -- Chest Pain Type (0-3)
            trestbps INTEGER NOT NULL, -- Resting Blood Pressure
            chol INTEGER NOT NULL, -- Cholesterol
            fbs INTEGER NOT NULL,  -- Fasting Blood Sugar (1=True, 0=False)
            restecg INTEGER NOT NULL, -- Rest ECG (0-2)
            thalach INTEGER NOT NULL, -- Max Heart Rate
            exang INTEGER NOT NULL, -- Exercise Induced Angina (1=Yes, 0=No)
            oldpeak REAL NOT NULL, -- ST depression
            slope INTEGER NOT NULL, -- Slope of peak ST segment (0-2)
            ca INTEGER NOT NULL, -- Number of major vessels (0-3)
            thal INTEGER NOT NULL, -- Thal (3 = normal; 6 = fixed defect; 7 = reversable defect or simplified 0-2)
            model_used TEXT NOT NULL, -- 'Random Forest', 'XGBoost', 'Stacking Classifier'
            prediction_result INTEGER NOT NULL, -- 0=Low Risk, 1=Heart Disease Present
            probability REAL NOT NULL, -- Probability percentage (0.0 to 1.0)
            risk_level TEXT NOT NULL, -- 'Low', 'Medium', 'High'
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')
    
    # Seed default Admin and User if not already present
    cursor.execute("SELECT id FROM users WHERE role = 'admin' LIMIT 1")
    admin_exists = cursor.fetchone()
    
    if not admin_exists:
        admin_email = "admin@heartai.com"
        admin_username = "admin"
        admin_hash = generate_password_hash("AdminPass123!")
        cursor.execute(
            "INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)",
            (admin_username, admin_email, admin_hash, 'admin')
        )
        print("Admin user seeded: admin@heartai.com / AdminPass123!")
        
    cursor.execute("SELECT id FROM users WHERE role = 'user' LIMIT 1")
    user_exists = cursor.fetchone()
    if not user_exists:
        user_email = "patient@heartai.com"
        user_username = "patient"
        user_hash = generate_password_hash("PatientPass123!")
        cursor.execute(
            "INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)",
            (user_username, user_email, user_hash, 'user')
        )
        print("Standard user seeded: patient@heartai.com / PatientPass123!")
        
    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_db()
    print("Database initialized successfully at:", DB_PATH)
