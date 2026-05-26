import os
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

# Professional color scheme matching the app
PRIMARY_BLUE = colors.HexColor('#0F4C81')
SECONDARY_TEAL = colors.HexColor('#00A8A8')
CORAL_ACCENT = colors.HexColor('#FF6B6B')
DARK_NEUTRAL = colors.HexColor('#2D3748')
LIGHT_NEUTRAL = colors.HexColor('#F7FAFC')
BORDER_GRAY = colors.HexColor('#E2E8F0')

# Mappings for features
CP_MAP = {0: 'Typical Angina', 1: 'Atypical Angina', 2: 'Non-anginal Pain', 3: 'Asymptomatic'}
ECG_MAP = {0: 'Normal', 1: 'ST-T Wave Abnormality', 2: 'Left Ventricular Hypertrophy'}
SLOPE_MAP = {0: 'Upsloping', 1: 'Flat', 2: 'Downsloping'}
THAL_MAP = {3: 'Normal', 6: 'Fixed Defect', 7: 'Reversible Defect', 1: 'Normal (Fallback)', 2: 'Fixed (Fallback)'} # Handle fallback maps

def generate_report_pdf(prediction_data, filename):
    """
    Generates a premium clinical PDF report for a given prediction.
    
    prediction_data format:
    {
        'id': 42,
        'username': 'john_doe',
        'email': 'john@example.com',
        'age': 54,
        'sex': 1,
        'cp': 3,
        'trestbps': 140,
        'chol': 239,
        'fbs': 0,
        'restecg': 0,
        'thalach': 150,
        'exang': 0,
        'oldpeak': 1.2,
        'slope': 1,
        'ca': 0,
        'thal': 3,
        'model_used': 'Stacking Classifier',
        'prediction_result': 1,
        'probability': 0.84,
        'risk_level': 'High',
        'created_at': '2026-05-27 10:30:00'
    }
    """
    
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        rightMargin=40, leftMargin=40,
        topMargin=40, bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=PRIMARY_BLUE
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=SECONDARY_TEAL
    )
    
    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=PRIMARY_BLUE,
        spaceAfter=8,
        spaceBefore=12
    )
    
    body_style = ParagraphStyle(
        'BodyTextDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=DARK_NEUTRAL
    )
    
    body_bold = ParagraphStyle(
        'BodyTextBold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )
    
    meta_label = ParagraphStyle(
        'MetaLabel',
        parent=body_style,
        fontName='Helvetica-Bold',
        textColor=PRIMARY_BLUE
    )
    
    story = []
    
    # ----------------------------------------------------
    # Header Section (Logo / System Identity)
    # ----------------------------------------------------
    header_data = [
        [
            Paragraph("HEART HEALTH ANALYSIS REPORT", title_style),
            Paragraph("AI CLINICAL DECISION SUPPORT SYSTEM", subtitle_style)
        ]
    ]
    header_table = Table(header_data, colWidths=[350, 180])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 10))
    
    # Horizontal Divider Line
    divider = Table([['']], colWidths=[532])
    divider.setStyle(TableStyle([
        ('LINEABOVE', (0,0), (-1,-1), 1.5, PRIMARY_BLUE),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(divider)
    story.append(Spacer(1, 15))
    
    # ----------------------------------------------------
    # Metadata Block (Patient Info & General Analytics)
    # ----------------------------------------------------
    gender_txt = "Male" if prediction_data['sex'] == 1 else "Female"
    created_dt = prediction_data.get('created_at', datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
    
    meta_data = [
        [
            Paragraph("Patient Name:", meta_label), Paragraph(prediction_data.get('username', 'N/A'), body_style),
            Paragraph("Report ID:", meta_label), Paragraph(f"HT-2026-{prediction_data.get('id', '999'):03d}", body_style)
        ],
        [
            Paragraph("Age / Gender:", meta_label), Paragraph(f"{prediction_data['age']} yrs / {gender_txt}", body_style),
            Paragraph("Analysis Date:", meta_label), Paragraph(created_dt, body_style)
        ],
        [
            Paragraph("Model Used:", meta_label), Paragraph(prediction_data['model_used'], body_style),
            Paragraph("Classification Type:", meta_label), Paragraph("UCI Cleveland Multi-Model", body_style)
        ]
    ]
    
    meta_table = Table(meta_data, colWidths=[100, 166, 100, 166])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_NEUTRAL),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_GRAY),
        ('INNERGRID', (0, 0), (-1, -1), 0.25, BORDER_GRAY),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 20))
    
    # ----------------------------------------------------
    # AI Risk Diagnosis Result (Visual Alert Card)
    # ----------------------------------------------------
    risk_level = prediction_data['risk_level']
    probability = prediction_data['probability'] * 100
    
    if risk_level == 'High':
        risk_bg = colors.HexColor('#FFF5F5')
        risk_text_color = colors.HexColor('#E53E3E')
        risk_desc = "CRITICAL WARNING: The Stacking Classifier model indicates high likelihood of cardiovascular pathology. Immediate medical consultation, diagnostic tests (e.g. ECG stress test or angiography), and therapeutic adjustments are highly recommended."
    elif risk_level == 'Medium':
        risk_bg = colors.HexColor('#FEFCBF')
        risk_text_color = colors.HexColor('#D69E2E')
        risk_desc = "MODERATE RISK: Moderate indicators of heart disease detected. Lifestyle modifications, cardiovascular monitoring, and routine medical review are recommended to address emerging risk vectors."
    else:
        risk_bg = colors.HexColor('#F0FFF4')
        risk_text_color = colors.HexColor('#38A169')
        risk_desc = "NORMAL / LOW RISK: Normal clinical findings. Continue with positive lifestyle habits, regular exercise, and standard heart disease screening parameters."
        
    risk_title_style = ParagraphStyle(
        'RiskTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=risk_text_color
    )
    
    risk_card_data = [
        [
            Paragraph(f"DIAGNOSTIC OUTCOME: {risk_level.upper()} RISK", risk_title_style),
            Paragraph(f"AI Probability Score: {probability:.1f}%", ParagraphStyle('Prob', parent=body_bold, fontSize=12, textColor=PRIMARY_BLUE, alignment=2))
        ],
        [
            Paragraph(risk_desc, body_style),
            ""
        ]
    ]
    
    risk_card_table = Table(risk_card_data, colWidths=[360, 172])
    risk_card_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), risk_bg),
        ('SPAN', (0, 1), (1, 1)), # Span description across the columns
        ('BOX', (0, 0), (-1, -1), 1.0, risk_text_color),
        ('PADDING', (0, 0), (-1, -1), 12),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(risk_card_table)
    story.append(Spacer(1, 20))
    
    # ----------------------------------------------------
    # Clinical Features Table (The 13 inputs)
    # ----------------------------------------------------
    story.append(Paragraph("CLINICAL PATIENT DATA SHIFT MATRIX", h1_style))
    
    fbs_text = "Fasting Blood Sugar > 120 mg/dl" if prediction_data['fbs'] == 1 else "Fasting Blood Sugar <= 120 mg/dl"
    exang_text = "Exercise Induced Angina Present" if prediction_data['exang'] == 1 else "No Exercise Induced Angina"
    
    # Map ca and thal safe conversions
    ca_val = prediction_data['ca']
    thal_val = prediction_data['thal']
    thal_mapped = THAL_MAP.get(int(thal_val), 'Normal')
    
    features_data = [
        [
            Paragraph("Clinical Feature", body_bold), Paragraph("Value Measured", body_bold),
            Paragraph("Clinical Feature", body_bold), Paragraph("Value Measured", body_bold)
        ],
        [
            Paragraph("Chest Pain Type", body_style), Paragraph(CP_MAP.get(prediction_data['cp'], 'N/A'), body_style),
            Paragraph("Resting Blood Pressure", body_style), Paragraph(f"{prediction_data['trestbps']} mmHg", body_style)
        ],
        [
            Paragraph("Serum Cholesterol", body_style), Paragraph(f"{prediction_data['chol']} mg/dL", body_style),
            Paragraph("Fasting Blood Sugar", body_style), Paragraph(fbs_text, body_style)
        ],
        [
            Paragraph("Resting ECG Result", body_style), Paragraph(ECG_MAP.get(prediction_data['restecg'], 'N/A'), body_style),
            Paragraph("Max Heart Rate Achieved", body_style), Paragraph(f"{prediction_data['thalach']} bpm", body_style)
        ],
        [
            Paragraph("Exercise Induced Angina", body_style), Paragraph(exang_text, body_style),
            Paragraph("ST Depression (Oldpeak)", body_style), Paragraph(f"{prediction_data['oldpeak']} mm", body_style)
        ],
        [
            Paragraph("Slope of Peak Exercise ST", body_style), Paragraph(SLOPE_MAP.get(prediction_data['slope'], 'N/A'), body_style),
            Paragraph("Major Colored Vessels (ca)", body_style), Paragraph(str(int(ca_val)), body_style)
        ],
        [
            Paragraph("Thalassemia Diagnostic Type", body_style), Paragraph(thal_mapped, body_style),
            "", ""
        ]
    ]
    
    features_table = Table(features_data, colWidths=[150, 116, 150, 116])
    features_table.setStyle(TableStyle([
        ('SPAN', (1, 6), (3, 6)), # Span Thalassemia across
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY_BLUE),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_GRAY),
        ('GRID', (0, 0), (-1, -1), 0.25, BORDER_GRAY),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    
    # Loop to override header style
    for col in range(4):
        features_table.setStyle(TableStyle([
            ('TEXTCOLOR', (col, 0), (col, 0), colors.white)
        ]))
    story.append(features_table)
    story.append(Spacer(1, 20))
    
    # ----------------------------------------------------
    # Recommendations & Lifestyle Management
    # ----------------------------------------------------
    story.append(Paragraph("TAILORED CLINICAL INTERVENTIONS & RECOMMENDATIONS", h1_style))
    
    # Map recommendation arrays
    if risk_level == 'High':
        diet = "Strict low-sodium, heart-healthy diet. Limit saturated fats, trans-fats, and refined sugars. Focus on omega-3 rich foods, fiber, and legumes. DASH diet is recommended."
        exercise = "Exercise should only be undertaken under medical supervision. Avoid high-intensity workouts until cleared by a cardiologist. Structured cardiac rehabilitation is advised."
        medical = "Consult a cardiologist immediately for full review. Schedule a comprehensive diagnostic profile including an ECG, stress echocardiogram, or angiogram if ordered."
        lifestyle = "Minimize stressful activity, monitor daily blood pressure, stop any nicotine intake immediately, and strictly comply with prescribed medications."
    elif risk_level == 'Medium':
        diet = "Adopt Mediterranean or DASH diet principles. Increase leafy greens, whole grains, nuts, and fish. Decrease salt and red meat consumption."
        exercise = "Participate in moderate aerobic exercise (e.g., brisk walking, cycling) for 30 minutes, 3-5 days a week. Monitor heart rate to remain in moderate zones."
        medical = "Schedule a routine consultation with your primary physician to review lipid panels and blood pressure. Track metrics for subsequent follow-up."
        lifestyle = "Emphasize stress management techniques (yoga, meditation), ensure 7-8 hours of sleep, and reduce alcohol intake. Establish regular health logs."
    else:
        diet = "Maintain a balanced, nutritious diet rich in fruits, vegetables, whole grains, and lean proteins. Keep sodium and sugar intake moderate."
        exercise = "Engage in regular physical activity. 150 minutes of moderate aerobic exercise or 75 minutes of vigorous exercise weekly, paired with muscle-strengthening."
        medical = "Undergo standard annual wellness checkups. Monitor weight, blood pressure, and cholesterol levels periodically."
        lifestyle = "Avoid tobacco products, limit sitting times, manage daily stressors productively, and maintain healthy sleep hygiene."
        
    rec_data = [
        [Paragraph("Intervention Area", body_bold), Paragraph("Recommendations & Strategic Guidance", body_bold)],
        [Paragraph("Dietary Intake", body_bold), Paragraph(diet, body_style)],
        [Paragraph("Physical Exercise", body_bold), Paragraph(exercise, body_style)],
        [Paragraph("Medical Consultation", body_bold), Paragraph(medical, body_style)],
        [Paragraph("Lifestyle Changes", body_bold), Paragraph(lifestyle, body_style)],
    ]
    
    rec_table = Table(rec_data, colWidths=[120, 412])
    rec_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), SECONDARY_TEAL),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_GRAY),
        ('GRID', (0, 0), (-1, -1), 0.25, BORDER_GRAY),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(rec_table)
    story.append(Spacer(1, 20))
    
    # ----------------------------------------------------
    # Footer Disclaimer
    # ----------------------------------------------------
    disclaimer_style = ParagraphStyle(
        'DocDisclaimer',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=11,
        textColor=colors.gray
    )
    
    story.append(Paragraph(
        "Disclaimer: This report is generated programmatically by an Artificial Intelligence ensemble model (Random Forest + XGBoost Stacking) "
        "trained on the UCI Cleveland Heart Disease dataset. It is designed to act as a clinical decision support tool for education and demonstration, "
        "not as a replacement for professional medical diagnosis, advice, or therapy.",
        disclaimer_style
    ))
    
    # Build Document
    doc.build(story)
    print(f"Report PDF generated successfully at: {filename}")

if __name__ == '__main__':
    # Simple self-test
    mock_data = {
        'id': 1,
        'username': 'Test Patient',
        'email': 'patient@test.com',
        'age': 57,
        'sex': 1,
        'cp': 3,
        'trestbps': 130,
        'chol': 250,
        'fbs': 0,
        'restecg': 1,
        'thalach': 140,
        'exang': 1,
        'oldpeak': 1.8,
        'slope': 1,
        'ca': 0,
        'thal': 3,
        'model_used': 'Stacking Classifier',
        'prediction_result': 1,
        'probability': 0.76,
        'risk_level': 'High'
    }
    generate_report_pdf(mock_data, 'test_report.pdf')
