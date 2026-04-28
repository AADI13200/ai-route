"""
PurePath FastAPI Backend
Main application entry point for pollution-aware routing API.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import httpx
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import custom modules
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml_model.predict_aqi import predict_aqi
from utils.routing_engine import RoutingEngine
from utils.exposure_calculator import calculate_exposure_risk, get_health_weight

# Initialize FastAPI app
app = FastAPI(
    title="PurePath API",
    description="AI-Powered Pollution-Aware Route Planning System",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize routing engine
routing_engine = RoutingEngine()

# In-memory user profiles storage (replace with MongoDB in production)
user_profiles: Dict[str, Dict] = {}

# ============================================================================
# Pydantic Models
# ============================================================================

class Location(BaseModel):
    """Location coordinates."""
    lat: float = Field(..., ge=-90, le=90, description="Latitude")
    lng: float = Field(..., ge=-180, le=180, description="Longitude")

class RouteRequest(BaseModel):
    """Request model for route calculation."""
    source: Location
    destination: Location
    user_id: Optional[str] = "default"
    fitness_mode: bool = False
    transport_mode: str = "driving"  # driving, walking, cycling

class AQIPredictionRequest(BaseModel):
    """Request model for AQI prediction."""
    temperature: float = Field(..., description="Temperature in Celsius")
    humidity: float = Field(..., ge=0, le=100, description="Humidity percentage")
    wind_speed: float = Field(..., ge=0, description="Wind speed in km/h")
    pressure: float = Field(..., description="Atmospheric pressure in hPa")
    historical_aqi: float = Field(..., ge=0, description="Historical AQI value")
    hour_of_day: Optional[int] = Field(None, ge=0, le=23, description="Hour of day")

class RiskCalculationRequest(BaseModel):
    """Request model for risk calculation."""
    aqi: float = Field(..., ge=0, description="AQI value")
    exposure_time_minutes: float = Field(..., gt=0, description="Exposure time in minutes")
    health_profile: str = Field(..., description="Health profile: normal, asthma, cardiac")

class UserProfileRequest(BaseModel):
    """Request model for user profile management."""
    user_id: str
    health_profile: str = Field(..., description="Health profile: normal, asthma, cardiac")
    preferences: Optional[Dict[str, Any]] = None

class RouteResponse(BaseModel):
    """Response model for route data."""
    route_type: str
    path: List[Dict[str, float]]
    distance_meters: float
    duration_seconds: float
    avg_aqi: float
    max_aqi: float
    risk_score: float
    description: str

# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint - API status."""
    return {
        "status": "operational",
        "service": "PurePath API",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

@app.post("/get-routes", response_model=List[RouteResponse])
async def get_routes(request: RouteRequest):
    """
    Get pollution-aware routes between two points.
    
    Returns 3 route options:
    - cleanest: Lowest AQI exposure
    - fastest: Shortest travel time
    - balanced: Optimal trade-off between time and AQI
    """
    try:
        # Get user's health profile
        health_profile = user_profiles.get(request.user_id, {}).get('health_profile', 'normal')
        
        # Calculate routes
        routes = routing_engine.calculate_routes(
            source=(request.source.lat, request.source.lng),
            destination=(request.destination.lat, request.destination.lng),
            health_profile=health_profile,
            fitness_mode=request.fitness_mode,
            transport_mode=request.transport_mode
        )
        
        return routes
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Route calculation failed: {str(e)}")

@app.post("/predict-aqi")
async def predict_aqi_endpoint(request: AQIPredictionRequest):
    """
    Predict AQI using the ML model based on weather conditions.
    """
    try:
        result = predict_aqi(
            temperature=request.temperature,
            humidity=request.humidity,
            wind_speed=request.wind_speed,
            pressure=request.pressure,
            historical_aqi=request.historical_aqi,
            hour_of_day=request.hour_of_day
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AQI prediction failed: {str(e)}")

@app.post("/calculate-risk")
async def calculate_risk_endpoint(request: RiskCalculationRequest):
    """
    Calculate exposure risk score based on AQI, time, and health profile.
    
    Formula: risk = AQI × time × health_weight
    """
    try:
        risk_score = calculate_exposure_risk(
            aqi=request.aqi,
            exposure_time_minutes=request.exposure_time_minutes,
            health_profile=request.health_profile
        )
        
        # Determine risk level
        if risk_score < 1000:
            risk_level = "Low"
            recommendation = "Safe to travel"
        elif risk_score < 3000:
            risk_level = "Moderate"
            recommendation = "Consider shorter exposure"
        elif risk_score < 6000:
            risk_level = "High"
            recommendation = "Minimize outdoor exposure"
        else:
            risk_level = "Very High"
            recommendation = "Avoid outdoor exposure"
        
        return {
            "risk_score": round(risk_score, 2),
            "risk_level": risk_level,
            "recommendation": recommendation,
            "health_profile": request.health_profile,
            "aqi": request.aqi,
            "exposure_time_minutes": request.exposure_time_minutes
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Risk calculation failed: {str(e)}")

@app.post("/user-profile")
async def manage_user_profile(request: UserProfileRequest):
    """
    Create or update user health profile.
    """
    try:
        valid_profiles = ['normal', 'asthma', 'cardiac']
        if request.health_profile not in valid_profiles:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid health profile. Must be one of: {valid_profiles}"
            )
        
        user_profiles[request.user_id] = {
            'user_id': request.user_id,
            'health_profile': request.health_profile,
            'health_weight': get_health_weight(request.health_profile),
            'preferences': request.preferences or {},
            'updated_at': datetime.now().isoformat()
        }
        
        return {
            "message": "Profile updated successfully",
            "profile": user_profiles[request.user_id]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Profile update failed: {str(e)}")

@app.get("/user-profile/{user_id}")
async def get_user_profile(user_id: str):
    """
    Get user health profile.
    """
    if user_id not in user_profiles:
        # Return default profile
        return {
            "user_id": user_id,
            "health_profile": "normal",
            "health_weight": get_health_weight("normal"),
            "preferences": {},
            "is_default": True
        }
    
    return user_profiles[user_id]

@app.get("/weather-aqi")
async def get_weather_and_aqi(lat: float, lng: float):
    """
    Get current weather and AQI data for a location.
    """
    try:
        api_key = os.getenv("OPENWEATHER_API_KEY")
        if not api_key:
            # Return mock data if no API key
            return {
                "weather": {
                    "temperature": 25,
                    "humidity": 60,
                    "wind_speed": 10,
                    "pressure": 1013
                },
                "aqi": 75,
                "aqi_category": "Moderate",
                "source": "mock"
            }
        
        # Fetch from OpenWeather API
        async with httpx.AsyncClient() as client:
            # Get air quality data
            aqi_url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lng}&appid={api_key}"
            aqi_response = await client.get(aqi_url)
            aqi_data = aqi_response.json()
            
            # Get weather data
            weather_url = f"http://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lng}&appid={api_key}&units=metric"
            weather_response = await client.get(weather_url)
            weather_data = weather_response.json()
        
        # Convert OpenWeather AQI (1-5) to standard AQI (0-500)
        ow_aqi = aqi_data['list'][0]['main']['aqi']
        standard_aqi = ow_aqi * 100
        
        return {
            "weather": {
                "temperature": weather_data['main']['temp'],
                "humidity": weather_data['main']['humidity'],
                "wind_speed": weather_data['wind']['speed'],
                "pressure": weather_data['main']['pressure']
            },
            "aqi": standard_aqi,
            "aqi_category": get_aqi_category_name(standard_aqi),
            "source": "openweather"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Weather/AQI fetch failed: {str(e)}")

@app.get("/route-aqi-analysis")
async def get_route_aqi_analysis(
    source_lat: float,
    source_lng: float,
    dest_lat: float,
    dest_lng: float
):
    """
    Get detailed AQI analysis for a route between two points.
    Returns segment-by-segment AQI data with pollution source information.
    """
    try:
        # Find the route and get AQI details
        source = (source_lat, source_lng)
        destination = (dest_lat, dest_lng)
        
        # Get the cleanest route with detailed analysis
        route = routing_engine.calculate_routes(
            source=source,
            destination=destination,
            health_profile='normal',
            fitness_mode=True
        )[0]  # Get cleanest route
        
        # Analyze each segment
        segments = []
        path = route['path']
        for i in range(len(path) - 1):
            lat1, lng1 = path[i]['lat'], path[i]['lng']
            lat2, lng2 = path[i+1]['lat'], path[i+1]['lng']
            
            # Get node data
            node_id = routing_engine._find_nearest_node(lat1, lng1)
            node = routing_engine.nodes.get(node_id)
            
            if node:
                segments.append({
                    'from': {'lat': lat1, 'lng': lng1},
                    'to': {'lat': lat2, 'lng': lng2},
                    'aqi': round(node.aqi, 1),
                    'area_type': node.area_type,
                    'pollution_sources': node.pollution_sources,
                    'aqi_category': get_aqi_category_name(node.aqi)
                })
        
        return {
            'route_summary': {
                'avg_aqi': route['avg_aqi'],
                'max_aqi': route['max_aqi'],
                'distance_km': round(route['distance_meters'] / 1000, 2),
                'duration_min': round(route['duration_seconds'] / 60, 1)
            },
            'segments': segments,
            'pollution_hotspots': [
                {'name': s['pollution_sources'], 'aqi': s['aqi']}
                for s in segments if s['pollution_sources']
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AQI analysis failed: {str(e)}")


@app.get("/aqi-heatmap")
async def get_aqi_heatmap(
    north: float = 18.75,
    south: float = 18.35,
    east: float = 73.95,
    west: float = 73.65
):
    """
    Get AQI data for heatmap visualization covering Pune area.
    """
    try:
        bounds = {'north': north, 'south': south, 'east': east, 'west': west}
        points = routing_engine.get_aqi_grid(bounds)
        
        return {
            'bounds': bounds,
            'points': points,
            'total_points': len(points),
            'aqi_stats': {
                'min': min(p['aqi'] for p in points) if points else 0,
                'max': max(p['aqi'] for p in points) if points else 0,
                'avg': sum(p['aqi'] for p in points) / len(points) if points else 0
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Heatmap generation failed: {str(e)}")


def get_aqi_category_name(aqi: float) -> str:
    """Get AQI category name."""
    if aqi <= 50:
        return "Good"
    elif aqi <= 100:
        return "Moderate"
    elif aqi <= 150:
        return "Unhealthy for Sensitive Groups"
    elif aqi <= 200:
        return "Unhealthy"
    elif aqi <= 300:
        return "Very Unhealthy"
    else:
        return "Hazardous"


# ============================================================================
# Hybrid Routing with Google Maps & LLM
# ============================================================================

# Import hybrid routing components
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.hybrid_routing_engine import hybrid_routing_engine

class HybridRouteRequest(BaseModel):
    """Request model for hybrid routing with AI."""
    source: Location
    destination: Location
    user_id: str = "default"
    health_profile: str = "normal"
    fitness_mode: bool = False
    transport_mode: str = "driving"
    priority: str = "balanced"  # 'health', 'speed', 'balanced'

@app.post("/get-hybrid-routes")
async def get_hybrid_routes(request: HybridRouteRequest):
    """
    Get AI-enhanced routes using Google Maps real road data + AQI + LLM.
    
    Combines:
    - Google Maps Routes API for real road network and traffic
    - Local AQI model for pollution-aware routing  
    - LLM for intelligent recommendations
    """
    try:
        routes = await hybrid_routing_engine.calculate_routes(
            source=(request.source.lat, request.source.lng),
            destination=(request.destination.lat, request.destination.lng),
            health_profile=request.health_profile,
            fitness_mode=request.fitness_mode,
            transport_mode=request.transport_mode,
            priority=request.priority
        )
        
        # Convert to API response format
        response_routes = [
            hybrid_routing_engine.get_route_with_ai_guidance(route)
            for route in routes
        ]
        
        return {
            "routes": response_routes,
            "total_options": len(response_routes),
            "ai_enhanced": hybrid_routing_engine.use_llm,
            "google_maps_enabled": hybrid_routing_engine.use_google_maps,
            "priority": request.priority,
            "health_profile": request.health_profile
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Hybrid routing failed: {str(e)}")


class NavigationGuidanceRequest(BaseModel):
    """Request for AI-powered navigation guidance."""
    route_type: str
    source: Location
    destination: Location
    health_profile: str = "normal"

@app.post("/get-navigation-guidance")
async def get_navigation_guidance(request: NavigationGuidanceRequest):
    """
    Get LLM-enhanced turn-by-turn navigation instructions.
    """
    try:
        # First get the route
        routes = await hybrid_routing_engine.calculate_routes(
            source=(request.source.lat, request.source.lng),
            destination=(request.destination.lat, request.destination.lng),
            health_profile=request.health_profile
        )
        
        # Find the requested route type
        target_route = None
        for route in routes:
            if route.route_type == request.route_type:
                target_route = route
                break
        
        if not target_route:
            target_route = routes[0] if routes else None
        
        if not target_route:
            raise HTTPException(status_code=404, detail="Route not found")
        
        # Enhance with LLM if available
        if hybrid_routing_engine.use_llm and hybrid_routing_engine.llm_service:
            enhanced_turns = await hybrid_routing_engine.llm_service.generate_turn_instructions(
                route_steps=target_route.turn_instructions,
                aqi_segments=target_route.aqi_segments
            )
        else:
            enhanced_turns = target_route.turn_instructions
        
        return {
            "route_type": target_route.route_type,
            "turn_instructions": enhanced_turns,
            "total_steps": len(enhanced_turns),
            "ai_enhanced": hybrid_routing_engine.use_llm,
            "health_profile": request.health_profile,
            "avg_aqi": target_route.avg_aqi,
            "max_aqi": target_route.max_aqi
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Navigation guidance failed: {str(e)}")


@app.get("/routing-status")
async def get_routing_status():
    """
    Get current routing engine status and available features.
    """
    return {
        "google_maps_api": {
            "enabled": hybrid_routing_engine.use_google_maps,
            "configured": bool(os.getenv('GOOGLE_MAPS_API_KEY'))
        },
        "llm_service": {
            "enabled": hybrid_routing_engine.use_llm,
            "configured": bool(os.getenv('GEMINI_API_KEY'))
        },
        "local_aqi_engine": {
            "enabled": True,
            "road_network_nodes": len(hybrid_routing_engine.local_engine.nodes)
        },
        "features": {
            "real_road_data": hybrid_routing_engine.use_google_maps,
            "ai_recommendations": hybrid_routing_engine.use_llm,
            "pollution_aware": True,
            "health_sensitive": True,
            "turn_by_turn": True
        },
        "location": {
            "city": "Pune",
            "country": "India",
            "lat_range": [18.366, 18.624],
            "lng_range": [73.718, 73.936]
        }
    }


# ============================================================================
# Main entry point
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
