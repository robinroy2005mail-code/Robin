import os
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg') # Non-interactive background rendering
import matplotlib.pyplot as plt
import seaborn as sns

# Fix path resolution
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, 'dataset', 'heart_disease.csv')
IMG_DIR = os.path.join(os.path.dirname(BASE_DIR), 'static', 'img')

# Create image directory if not exists
os.makedirs(IMG_DIR, exist_ok=True)

# Custom color palette matching the healthcare theme
PRIMARY_COLOR = '#0F4C81' # Medical Blue
SECONDARY_COLOR = '#00A8A8' # Teal
ACCENT_COLOR = '#FF6B6B' # Coral
LIGHT_BG = '#F7FAFC'

# Apply global styling parameters
plt.rcParams['figure.facecolor'] = 'white'
plt.rcParams['axes.facecolor'] = '#F8FAFC'
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['text.color'] = '#2D3748'
plt.rcParams['axes.labelcolor'] = '#2D3748'
plt.rcParams['xtick.color'] = '#4A5568'
plt.rcParams['ytick.color'] = '#4A5568'

def load_data():
    from model import preprocess_data, download_dataset
    download_dataset()
    return preprocess_data()

def generate_heatmap(df):
    """Generates and saves a correlation heatmap."""
    plt.figure(figsize=(12, 10))
    
    # Calculate correlation matrix
    corr_matrix = df.corr()
    
    # Mask for upper triangle
    mask = np.triu(np.ones_like(corr_matrix, dtype=bool))
    
    # Custom divering color palette (Medical Blue -> White -> Teal)
    cmap = sns.diverging_palette(220, 170, as_cmap=True)
    
    # Plot heatmap
    sns.heatmap(
        corr_matrix, 
        mask=mask, 
        cmap=cmap, 
        vmax=.8, 
        center=0,
        square=True, 
        linewidths=.5, 
        cbar_kws={"shrink": .7}, 
        annot=True, 
        fmt=".2f",
        annot_kws={"size": 8}
    )
    
    plt.title('Cleveland Heart Disease Dataset Correlation Heatmap', fontsize=14, fontweight='bold', pad=20, color=PRIMARY_COLOR)
    plt.tight_layout()
    
    heatmap_path = os.path.join(IMG_DIR, 'heatmap.png')
    plt.savefig(heatmap_path, dpi=150, facecolor='white')
    plt.close()
    print(f"Heatmap saved to {heatmap_path}")

def generate_distributions(df):
    """Generates and saves distribution subplots."""
    fig, axes = plt.subplots(1, 2, figsize=(15, 6))
    
    # Map target numbers/risk labels for visual display
    df_plot = df.copy()
    df_plot['Diagnosis'] = df_plot['target'].map({0: 'Low Risk / Normal', 1: 'Heart Disease'})
    
    # Plot 1: Age Distribution split by Diagnosis
    sns.histplot(
        data=df_plot, 
        x='age', 
        hue='Diagnosis', 
        multiple='stack', 
        palette=[SECONDARY_COLOR, ACCENT_COLOR], 
        alpha=0.85, 
        edgecolor='white',
        ax=axes[0]
    )
    axes[0].set_title('Age Distribution by Diagnostic Output', fontsize=12, fontweight='bold', color=PRIMARY_COLOR)
    axes[0].set_xlabel('Age (Years)', fontsize=10)
    axes[0].set_ylabel('Patient Count', fontsize=10)
    
    # Plot 2: Max Heart Rate Achieved (thalach) vs Age colored by Diagnosis
    sns.scatterplot(
        data=df_plot, 
        x='age', 
        y='thalach', 
        hue='Diagnosis', 
        palette=[SECONDARY_COLOR, ACCENT_COLOR], 
        alpha=0.8, 
        style='Diagnosis',
        s=60, 
        ax=axes[1]
    )
    
    # Draw trendline / threshold
    axes[1].set_title('Maximum Heart Rate vs Age', fontsize=12, fontweight='bold', color=PRIMARY_COLOR)
    axes[1].set_xlabel('Age (Years)', fontsize=10)
    axes[1].set_ylabel('Maximum Heart Rate Achieved (bpm)', fontsize=10)
    
    plt.suptitle('UCI Cleveland Dataset Exploratory Analytics', fontsize=15, fontweight='bold', color=PRIMARY_COLOR, y=0.98)
    plt.tight_layout()
    
    dist_path = os.path.join(IMG_DIR, 'distributions.png')
    plt.savefig(dist_path, dpi=150, facecolor='white')
    plt.close()
    print(f"Distribution charts saved to {dist_path}")

def create_visualizations():
    df = load_data()
    generate_heatmap(df)
    generate_distributions(df)

if __name__ == '__main__':
    create_visualizations()
