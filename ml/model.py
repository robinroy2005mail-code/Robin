import os
import json
import urllib.request
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier, StackingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from xgboost import XGBClassifier

# Constants
DATASET_URL = "https://archive.ics.uci.edu/ml/machine-learning-databases/heart-disease/processed.cleveland.data"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'dataset')
MODELS_DIR = os.path.join(BASE_DIR, 'models')
DATA_PATH = os.path.join(DATA_DIR, 'heart_disease.csv')

COLUMNS = [
    'age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg', 
    'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal', 'target'
]

def download_dataset():
    """Downloads the Cleveland dataset from UCI repository."""
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(DATA_PATH):
        print(f"Downloading dataset from {DATASET_URL}...")
        try:
            urllib.request.urlretrieve(DATASET_URL, DATA_PATH)
            print("Dataset downloaded successfully.")
        except Exception as e:
            print(f"Error downloading dataset: {e}")
            # Write a backup dataset (simplified mock of Cleveland shape) if network fails
            print("Writing local fallback mockup dataset...")
            write_fallback_dataset()

def write_fallback_dataset():
    """Fallback generator in case the internet is unavailable during development."""
    np.random.seed(42)
    n_samples = 303
    data = {
        'age': np.random.randint(29, 77, size=n_samples),
        'sex': np.random.choice([0, 1], p=[0.32, 0.68], size=n_samples),
        'cp': np.random.choice([0, 1, 2, 3], p=[0.07, 0.16, 0.28, 0.49], size=n_samples),
        'trestbps': np.random.randint(94, 200, size=n_samples),
        'chol': np.random.randint(126, 564, size=n_samples),
        'fbs': np.random.choice([0, 1], p=[0.85, 0.15], size=n_samples),
        'restecg': np.random.choice([0, 1, 2], p=[0.49, 0.01, 0.50], size=n_samples),
        'thalach': np.random.randint(71, 202, size=n_samples),
        'exang': np.random.choice([0, 1], p=[0.67, 0.33], size=n_samples),
        'oldpeak': np.round(np.random.exponential(scale=1.0, size=n_samples), 1),
        'slope': np.random.choice([0, 1, 2], p=[0.46, 0.46, 0.08], size=n_samples),
        'ca': np.random.choice(['0.0', '1.0', '2.0', '3.0', '?'], p=[0.58, 0.22, 0.12, 0.06, 0.02], size=n_samples),
        'thal': np.random.choice(['3.0', '6.0', '7.0', '?'], p=[0.55, 0.06, 0.38, 0.01], size=n_samples),
        'target': np.random.choice([0, 1, 2, 3, 4], p=[0.54, 0.18, 0.12, 0.11, 0.05], size=n_samples)
    }
    df = pd.DataFrame(data)
    df.to_csv(DATA_PATH, index=False, header=False)

def preprocess_data():
    """Loads, cleans and preprocesses the dataset."""
    # Read CSV
    # If the file has headers (fallback has headers), handle it:
    try:
        df = pd.read_csv(DATA_PATH, header=None, names=COLUMNS, na_values='?')
    except Exception:
        df = pd.read_csv(DATA_PATH, na_values='?')
        df.columns = COLUMNS
        
    # Replace '?' which pandas na_values might miss or read as string object
    df = df.replace('?', np.nan)
    
    # Impute missing values (ca and thal contain missing values)
    # ca is float/int, thal is float/int
    df['ca'] = pd.to_numeric(df['ca'], errors='coerce')
    df['thal'] = pd.to_numeric(df['thal'], errors='coerce')
    
    # Mode/median imputation
    df['ca'] = df['ca'].fillna(df['ca'].mode()[0])
    df['thal'] = df['thal'].fillna(df['thal'].mode()[0])
    
    # Convert target to binary: 0 = Low Risk (no disease), 1-4 = Heart Disease Present
    df['target'] = df['target'].apply(lambda x: 1 if x > 0 else 0)
    
    return df

def train_and_save_models():
    """Main model training script."""
    os.makedirs(MODELS_DIR, exist_ok=True)
    download_dataset()
    df = preprocess_data()
    
    X = df.drop('target', axis=1)
    y = df['target']
    
    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Scale continuous columns
    continuous_features = ['age', 'trestbps', 'chol', 'thalach', 'oldpeak']
    scaler = StandardScaler()
    
    # Fit scaler on training set
    X_train_scaled = X_train.copy()
    X_test_scaled = X_test.copy()
    
    X_train_scaled[continuous_features] = scaler.fit_transform(X_train[continuous_features])
    X_test_scaled[continuous_features] = scaler.transform(X_test[continuous_features])
    
    # Save the scaler
    joblib.dump(scaler, os.path.join(MODELS_DIR, 'scaler.joblib'))
    
    # 1. Random Forest
    rf = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)
    rf.fit(X_train_scaled, y_train)
    joblib.dump(rf, os.path.join(MODELS_DIR, 'rf_model.joblib'))
    
    # 2. XGBoost
    xgb = XGBClassifier(n_estimators=100, max_depth=3, learning_rate=0.05, eval_metric='logloss', random_state=42)
    xgb.fit(X_train_scaled, y_train)
    joblib.dump(xgb, os.path.join(MODELS_DIR, 'xgb_model.joblib'))
    
    # 3. Stacking Classifier
    estimators = [
        ('rf', RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)),
        ('xgb', XGBClassifier(n_estimators=100, max_depth=3, learning_rate=0.05, eval_metric='logloss', random_state=42))
    ]
    stacking = StackingClassifier(
        estimators=estimators,
        final_estimator=LogisticRegression(),
        cv=5
    )
    stacking.fit(X_train_scaled, y_train)
    joblib.dump(stacking, os.path.join(MODELS_DIR, 'stacking_model.joblib'))
    
    # Model evaluation
    models = {
        'Random Forest': rf,
        'XGBoost': xgb,
        'Stacking Classifier': stacking
    }
    
    metrics_summary = {}
    
    for name, model in models.items():
        y_pred = model.predict(X_test_scaled)
        y_prob = model.predict_proba(X_test_scaled)[:, 1]
        
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred)
        rec = recall_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred)
        cm = confusion_matrix(y_test, y_pred).tolist() # Convert array to list for JSON serialization
        
        metrics_summary[name] = {
            'accuracy': float(acc),
            'precision': float(prec),
            'recall': float(rec),
            'f1_score': float(f1),
            'confusion_matrix': cm
        }
    
    # Calculate feature importances from RF
    feature_importances = dict(zip(X.columns, rf.feature_importances_.astype(float)))
    metrics_summary['feature_importances'] = feature_importances
    
    # Save metrics to JSON
    with open(os.path.join(MODELS_DIR, 'metrics.json'), 'w') as f:
        json.dump(metrics_summary, f, indent=4)
        
    print("Models trained and saved successfully.")
    return metrics_summary

if __name__ == '__main__':
    train_and_save_models()
