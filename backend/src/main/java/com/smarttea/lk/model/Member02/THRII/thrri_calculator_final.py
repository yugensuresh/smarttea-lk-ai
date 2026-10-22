
def calculate_thrri(readiness_probability, high_risk_probability):
    """
    Calculate the proposed Tea Harvest Readiness and Risk Index.

    Inputs:
        readiness_probability: Ready-class probability (0 to 1)
        high_risk_probability: High-risk-class probability (0 to 1)

    Returns:
        Dictionary with THRRI score and recommendation.
    """

    for name, value in [
        ("readiness_probability", readiness_probability),
        ("high_risk_probability", high_risk_probability)
    ]:
        if not 0 <= value <= 1:
            raise ValueError(f"{name} must be between 0 and 1")

    readiness_score = readiness_probability * 100
    high_risk_score = high_risk_probability * 100

    thrri_score = (
        0.6 * readiness_score
        + 0.4 * (100 - high_risk_score)
    )

    if thrri_score >= 75:
        recommendation = "Consider Harvesting"
    elif thrri_score >= 50:
        recommendation = "Monitor Conditions"
    else:
        recommendation = "Delay and Reassess"

    return {
        "readiness_score": round(readiness_score, 2),
        "high_risk_score": round(high_risk_score, 2),
        "thrri_score": round(thrri_score, 2),
        "recommendation": recommendation
    }
