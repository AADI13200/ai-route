"""
Exposure Risk Calculator
Calculates health risk based on AQI exposure, duration, and health profile.
"""

from typing import Dict, Any

# Health profile multipliers
# Higher values indicate greater sensitivity to air pollution
HEALTH_PROFILES = {
    'normal': {
        'weight': 1.0,
        'description': 'No known respiratory or cardiovascular conditions',
        'recommendations': {
            'good': 'No precautions needed',
            'moderate': 'No precautions needed',
            'unhealthy_sensitive': 'Reduce prolonged outdoor exertion',
            'unhealthy': 'Avoid prolonged outdoor exertion',
            'very_unhealthy': 'Avoid all outdoor exertion',
            'hazardous': 'Remain indoors'
        }
    },
    'asthma': {
        'weight': 2.5,
        'description': 'Asthma or other respiratory conditions',
        'recommendations': {
            'good': 'No precautions needed',
            'moderate': 'Keep rescue inhaler handy',
            'unhealthy_sensitive': 'Limit outdoor activities',
            'unhealthy': 'Avoid outdoor activities',
            'very_unhealthy': 'Remain indoors, use air purifier',
            'hazardous': 'Remain indoors, seek medical attention if symptoms worsen'
        }
    },
    'cardiac': {
        'weight': 3.0,
        'description': 'Heart disease or cardiovascular conditions',
        'recommendations': {
            'good': 'No precautions needed',
            'moderate': 'Monitor for symptoms',
            'unhealthy_sensitive': 'Avoid strenuous outdoor activities',
            'unhealthy': 'Avoid outdoor activities',
            'very_unhealthy': 'Remain indoors',
            'hazardous': 'Remain indoors, seek medical attention if symptoms occur'
        }
    }
}

def get_health_weight(health_profile: str) -> float:
    """
    Get health weight multiplier for a profile.
    
    Args:
        health_profile: 'normal', 'asthma', or 'cardiac'
        
    Returns:
        Weight multiplier
    """
    profile = HEALTH_PROFILES.get(health_profile, HEALTH_PROFILES['normal'])
    return profile['weight']

def get_health_recommendation(health_profile: str, aqi_category: str) -> str:
    """
    Get health recommendation based on profile and AQI.
    
    Args:
        health_profile: 'normal', 'asthma', or 'cardiac'
        aqi_category: AQI category string
        
    Returns:
        Recommendation string
    """
    profile = HEALTH_PROFILES.get(health_profile, HEALTH_PROFILES['normal'])
    recommendations = profile['recommendations']
    
    # Map category names
    category_map = {
        'Good': 'good',
        'Moderate': 'moderate',
        'Unhealthy for Sensitive Groups': 'unhealthy_sensitive',
        'Unhealthy': 'unhealthy',
        'Very Unhealthy': 'very_unhealthy',
        'Hazardous': 'hazardous'
    }
    
    key = category_map.get(aqi_category, 'moderate')
    return recommendations.get(key, 'Exercise caution')

def calculate_exposure_risk(
    aqi: float,
    exposure_time_minutes: float,
    health_profile: str = 'normal'
) -> float:
    """
    Calculate exposure risk score.
    
    Formula: risk = AQI × time × health_weight
    
    Args:
        aqi: Air Quality Index value (0-500)
        exposure_time_minutes: Duration of exposure in minutes
        health_profile: User health profile
        
    Returns:
        Risk score (higher = more risk)
    """
    health_weight = get_health_weight(health_profile)
    
    # Base risk calculation
    risk = aqi * exposure_time_minutes * health_weight
    
    return risk

def get_risk_level(risk_score: float) -> Dict[str, Any]:
    """
    Get risk level and recommendations based on risk score.
    
    Args:
        risk_score: Calculated risk score
        
    Returns:
        Dict with risk level, color, and recommendation
    """
    if risk_score < 1000:
        return {
            'level': 'Low',
            'color': '#22c55e',
            'icon': 'check-circle',
            'recommendation': 'Safe to travel'
        }
    elif risk_score < 3000:
        return {
            'level': 'Moderate',
            'color': '#eab308',
            'icon': 'alert-triangle',
            'recommendation': 'Consider shorter exposure'
        }
    elif risk_score < 6000:
        return {
            'level': 'High',
            'color': '#f97316',
            'icon': 'alert-octagon',
            'recommendation': 'Minimize outdoor exposure'
        }
    elif risk_score < 10000:
        return {
            'level': 'Very High',
            'color': '#ef4444',
            'icon': 'x-octagon',
            'recommendation': 'Avoid outdoor exposure'
        }
    else:
        return {
            'level': 'Extreme',
            'color': '#7f1d1d',
            'icon': 'skull',
            'recommendation': 'Emergency - Remain indoors'
        }

def calculate_route_exposure(
    route_segments: list,
    health_profile: str = 'normal'
) -> Dict[str, Any]:
    """
    Calculate total exposure for a multi-segment route.
    
    Args:
        route_segments: List of dicts with 'aqi', 'duration_minutes'
        health_profile: User health profile
        
    Returns:
        Dict with total exposure metrics
    """
    total_risk = 0
    total_time = 0
    max_aqi = 0
    
    for segment in route_segments:
        aqi = segment.get('aqi', 0)
        duration = segment.get('duration_minutes', 0)
        
        segment_risk = calculate_exposure_risk(aqi, duration, health_profile)
        total_risk += segment_risk
        total_time += duration
        max_aqi = max(max_aqi, aqi)
    
    avg_aqi = sum(s.get('aqi', 0) for s in route_segments) / max(1, len(route_segments))
    
    risk_info = get_risk_level(total_risk)
    
    return {
        'total_risk_score': round(total_risk, 2),
        'risk_level': risk_info['level'],
        'risk_color': risk_info['color'],
        'recommendation': risk_info['recommendation'],
        'total_exposure_time': round(total_time, 1),
        'average_aqi': round(avg_aqi, 1),
        'maximum_aqi': round(max_aqi, 1),
        'health_profile': health_profile,
        'health_weight': get_health_weight(health_profile)
    }

def estimate_health_impact(
    aqi: float,
    exposure_time_minutes: float,
    health_profile: str = 'normal'
) -> Dict[str, Any]:
    """
    Estimate potential health impact of exposure.
    
    Args:
        aqi: Air Quality Index
        exposure_time_minutes: Duration of exposure
        health_profile: User health profile
        
    Returns:
        Dict with estimated health impact
    """
    impacts = []
    severity = 'none'
    
    if health_profile == 'asthma':
        if aqi > 150:
            impacts.append('Possible asthma exacerbation')
            severity = 'high'
        elif aqi > 100:
            impacts.append('Increased respiratory symptoms')
            severity = 'moderate'
    
    elif health_profile == 'cardiac':
        if aqi > 150:
            impacts.append('Increased cardiovascular stress')
            severity = 'high'
        elif aqi > 100:
            impacts.append('Mild cardiovascular strain')
            severity = 'moderate'
    
    else:  # normal
        if aqi > 200:
            impacts.append('Respiratory irritation possible')
            severity = 'moderate'
    
    if exposure_time_minutes > 60 and aqi > 100:
        impacts.append('Prolonged exposure increases risk')
    
    return {
        'potential_impacts': impacts,
        'severity': severity,
        'should_avoid': severity == 'high' or (aqi > 200 and exposure_time_minutes > 30)
    }
