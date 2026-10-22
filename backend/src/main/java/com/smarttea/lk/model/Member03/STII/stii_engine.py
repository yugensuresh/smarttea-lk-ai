"""
SmartTea-LK: Member 03 - STII Composite Engine Module
Calculates SmartTea Intelligence Index (STII) and classifies performance tiers.
"""

def calculate_stii(tea_grade, sustainability_score):
    """
    Calculates STII score using 50/50 weighted index formula.
    
    Parameters:
        tea_grade (str): Predicted Tea Grade ('A', 'B', 'C', 'D')
        sustainability_score (float): Predicted Sustainability Score (0 - 100)
        
    Returns:
        dict: Composite STII result with score and performance tier
    """
    grade_map = {'A': 92.5, 'B': 77.5, 'C': 60.0, 'D': 42.5}
    normalized_grade = str(tea_grade).strip().upper()
    if normalized_grade not in grade_map:
        raise ValueError(f"Invalid tea grade for STII: {tea_grade!r}")
    quality_score = grade_map[normalized_grade]
    
    stii_score = round((0.50 * quality_score) + (0.50 * float(sustainability_score)), 2)
    
    if stii_score >= 85:
        tier = 'Excellent'
    elif stii_score >= 70:
        tier = 'Good'
    elif stii_score >= 55:
        tier = 'Moderate'
    else:
        tier = 'Needs Improvement'
        
    return {
        'tea_grade': tea_grade,
        'quality_score_equiv': quality_score,
        'sustainability_score': round(float(sustainability_score), 2),
        'stii_score': stii_score,
        'performance_tier': tier
    }
