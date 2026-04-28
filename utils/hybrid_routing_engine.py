"""
Hybrid Routing Engine
Combines Google Maps real road data with AQI-aware routing and LLM intelligence.
"""

import math
import heapq
import asyncio
from typing import List, Dict, Any, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime
import os

# Import existing routing engine components
from utils.routing_engine import UltraPreciseRoutingEngine, Node, Edge
from api.google_maps_service import google_maps_service
from api.osrm_service import osrm_service
from api.llm_service import llm_service
from api.weather_service import WeatherService

@dataclass
class HybridRoute:
    """Enhanced route with real road data and AI analysis."""
    route_type: str
    path: List[Dict[str, float]]
    distance_meters: float
    duration_seconds: float
    avg_aqi: float
    max_aqi: float
    risk_score: float
    description: str
    source: str  # 'google_maps', 'local', or 'hybrid'
    turn_instructions: List[Dict[str, Any]]
    aqi_segments: List[Dict[str, Any]]
    pollution_hotspots: int
    llm_analysis: Optional[Dict[str, str]] = None
    recommended: bool = False


class HybridRoutingEngine:
    """
    Hybrid routing engine that combines:
    1. Google Maps API for real road network and traffic
    2. Local AQI model for pollution-aware routing
    3. LLM for intelligent recommendations
    """
    
    def __init__(self):
        self.local_engine = UltraPreciseRoutingEngine()
        self.google_service = google_maps_service
        self.osrm_service = osrm_service
        self.llm_service = llm_service
        self.weather_service = WeatherService()
        self.use_google_maps = False  # Disabled - using OSRM instead
        self.use_osrm = True  # Primary routing source
        self.use_llm = bool(os.getenv('GEMINI_API_KEY'))
        self.use_real_aqi = bool(os.getenv('OPENWEATHER_API_KEY'))
        
        # Health profile weights
        self.HEALTH_WEIGHTS = {
            'normal': 1.0,
            'asthma': 2.5,
            'cardiac': 2.0,
            'elderly': 1.5,
            'child': 1.8,
            'pregnant': 1.6
        }
    
    async def calculate_routes(
        self,
        source: Tuple[float, float],
        destination: Tuple[float, float],
        health_profile: str = 'normal',
        fitness_mode: bool = False,
        transport_mode: str = 'driving',
        priority: str = 'balanced'  # 'health', 'speed', 'balanced'
    ) -> List[HybridRoute]:
        """
        Calculate routes using hybrid approach.
        
        Priority levels:
        - health: Minimize AQI exposure
        - speed: Minimize travel time
        - balanced: Optimal trade-off
        """
        routes = []
        
        # Use OSRM for accurate real road routing (FREE, no API key needed)
        if self.use_osrm:
            osrm_routes = await self._get_osrm_routes(
                source, destination, transport_mode
            )
            if osrm_routes:
                routes.extend(osrm_routes)
        
        # Fall back to local engine if OSRM unavailable
        if not routes:
            local_routes = await self._get_local_routes(
                source, destination, health_profile, fitness_mode, transport_mode
            )
            routes.extend(local_routes)
        
        # Enhance with LLM analysis if available
        if self.use_llm and routes:
            routes = await self._enhance_with_llm(
                routes, source, destination, health_profile, priority
            )
        
        # Mark recommended route
        if routes:
            routes = self._mark_recommended(routes, health_profile, priority)
        
        return routes
    
    async def _get_google_maps_routes(
        self,
        source: Tuple[float, float],
        destination: Tuple[float, float],
        transport_mode: str
    ) -> List[HybridRoute]:
        """Get routes from Google Maps API with AQI enhancement."""
        routes = []
        
        try:
            # Get real routes from Google Maps
            google_routes = await self.google_service.get_multiple_routes(
                origin=source,
                destination=destination,
                avoid_highways=False,
                avoid_tolls=False
            )
            
            for google_route in google_routes:
                # Decode polyline to path
                path = self.google_service.decode_polyline(
                    google_route.get("polyline", "")
                )
                
                if not path or len(path) < 2:
                    continue
                
                # Calculate AQI profile along the route
                aqi_profile = self._calculate_aqi_profile(path)
                
                # Get turn instructions
                turns = self.google_service.extract_turn_instructions(
                    google_route.get("legs", [])
                )
                
                # Create enhanced route
                route = HybridRoute(
                    route_type=google_route.get("route_type", "balanced"),
                    path=path,
                    distance_meters=google_route.get("distance_meters", 0),
                    duration_seconds=google_route.get("duration_seconds", 0),
                    avg_aqi=aqi_profile["avg_aqi"],
                    max_aqi=aqi_profile["max_aqi"],
                    risk_score=self._calculate_risk(
                        aqi_profile["avg_aqi"],
                        google_route.get("duration_seconds", 0) / 60,
                        'normal'
                    ),
                    description=self._get_route_description(
                        google_route.get("route_type", "balanced"),
                        aqi_profile["avg_aqi"]
                    ),
                    source="google_maps",
                    turn_instructions=turns,
                    aqi_segments=aqi_profile["segments"],
                    pollution_hotspots=aqi_profile["hotspot_count"]
                )
                
                routes.append(route)
                
        except Exception as e:
            print(f"Error getting Google Maps routes: {e}")
        
        return routes
    
    async def _get_osrm_routes(
        self,
        source: Tuple[float, float],
        destination: Tuple[float, float],
        transport_mode: str
    ) -> List[HybridRoute]:
        """Get accurate routes from OSRM with REAL AQI analysis for each transport mode."""
        routes = []
        
        try:
            # Get 3 different routes from OSRM for the specific transport mode
            osrm_routes = await self.osrm_service.get_multiple_routes(
                origin=source,
                destination=destination,
                transport_mode=transport_mode
            )
            
            if not osrm_routes:
                return routes
            
            # For each OSRM route, calculate REAL AQI along the path
            for osrm_route in osrm_routes:
                path = osrm_route.get("path", [])
                if len(path) < 2:
                    continue
                
                # Get REAL AQI data along this specific route
                aqi_profile = await self._calculate_real_aqi_profile(path)
                
                # Get turn instructions
                turns = [
                    {
                        "instruction": step.get("instruction", "Continue"),
                        "distance": step.get("distance", 0),
                        "duration": step.get("duration", 0),
                        "maneuver": step.get("maneuver", "straight")
                    }
                    for step in osrm_route.get("steps", [])
                ]
                
                # Determine route type based on AQI
                route_type = osrm_route.get("route_type", "balanced")
                avg_aqi = aqi_profile["avg_aqi"]
                
                # Create the route with REAL AQI data
                route = HybridRoute(
                    route_type=route_type,
                    path=path,
                    distance_meters=osrm_route.get("distance_meters", 0),
                    duration_seconds=osrm_route.get("duration_seconds", 0),
                    avg_aqi=avg_aqi,
                    max_aqi=aqi_profile["max_aqi"],
                    risk_score=self._calculate_risk(
                        avg_aqi,
                        osrm_route.get("duration_seconds", 0) / 60,
                        'normal'
                    ),
                    description=self._get_route_description(route_type, avg_aqi, transport_mode),
                    source="osrm",
                    turn_instructions=turns,
                    aqi_segments=aqi_profile["segments"],
                    pollution_hotspots=aqi_profile["hotspot_count"]
                )
                
                routes.append(route)
            
            # If we have routes, identify the cleanest one based on REAL AQI
            if routes:
                # Sort by AQI to find the cleanest
                routes_by_aqi = sorted(routes, key=lambda r: r.avg_aqi)
                
                # Rename the cleanest route
                if len(routes_by_aqi) >= 3:
                    routes_by_aqi[0].route_type = "cleanest"
                    routes_by_aqi[0].description = f"Cleanest route - Lowest pollution exposure (AQI: {routes_by_aqi[0].avg_aqi:.0f})"
                    routes_by_aqi[1].route_type = "balanced"
                    routes_by_aqi[1].description = f"Balanced route - Good time/quality tradeoff (AQI: {routes_by_aqi[1].avg_aqi:.0f})"
                    routes_by_aqi[2].route_type = "fastest"
                    routes_by_aqi[2].description = f"Fastest route - Shortest travel time (AQI: {routes_by_aqi[2].avg_aqi:.0f})"
                elif len(routes_by_aqi) == 2:
                    routes_by_aqi[0].route_type = "cleanest"
                    routes_by_aqi[1].route_type = "fastest"
                elif len(routes_by_aqi) == 1:
                    routes_by_aqi[0].route_type = "balanced"
                    
        except Exception as e:
            print(f"Error getting OSRM routes: {e}")
        
        return routes
    
    async def _calculate_real_aqi_profile(self, path: List[Dict[str, float]]) -> Dict[str, Any]:
        """Calculate AQI profile - uses REAL API at start/end points only for speed."""
        if not path or len(path) < 2:
            return {"avg_aqi": 50, "max_aqi": 50, "segments": [], "hotspot_count": 0}
        
        segments = []
        aqi_values = []
        hotspots = []
        
        # Only sample 3 points: start, middle, end (much faster)
        sample_points = [
            path[0],  # Start
            path[len(path) // 2],  # Middle
            path[-1]  # End
        ]
        
        for point in sample_points:
            lat, lng = point["lat"], point["lng"]
            
            try:
                # Quick timeout for AQI fetch
                aqi_data = await asyncio.wait_for(
                    self.weather_service.get_air_quality(lat, lng),
                    timeout=2.0
                )
                aqi = aqi_data.get("aqi", 50)
                
                aqi_values.append(aqi)
                
                segments.append({
                    "lat": lat,
                    "lng": lng,
                    "aqi": aqi,
                    "category": aqi_data.get("aqi_category", "Unknown")
                })
                
                if aqi > 150:
                    hotspots.append({"lat": lat, "lng": lng, "aqi": aqi})
                    
            except Exception as e:
                # Use simulated AQI based on location if API fails
                simulated_aqi = self._simulate_aqi(lat, lng)
                aqi_values.append(simulated_aqi)
                segments.append({
                    "lat": lat,
                    "lng": lng,
                    "aqi": simulated_aqi,
                    "category": "Simulated"
                })
        
        if not aqi_values:
            aqi_values = [50]
        
        return {
            "avg_aqi": sum(aqi_values) / len(aqi_values),
            "max_aqi": max(aqi_values),
            "segments": segments,
            "hotspot_count": len(hotspots)
        }
    
    def _simulate_aqi(self, lat: float, lng: float) -> float:
        """Simulate AQI based on location (urban areas have worse air)."""
        # Major city centers have higher AQI
        city_centers = [
            (19.0760, 72.8777, 150),  # Mumbai
            (28.7041, 77.1025, 180),  # Delhi
            (12.9716, 77.5946, 120),  # Bangalore
            (18.5204, 73.8567, 130),  # Pune
        ]
        
        base_aqi = 50  # Rural baseline
        
        for city_lat, city_lng, city_aqi in city_centers:
            dist = math.sqrt((lat - city_lat)**2 + (lng - city_lng)**2)
            if dist < 0.5:  # Within ~50km of city
                base_aqi = max(base_aqi, city_aqi - dist * 100)
        
        # Add random variation
        import random
        random.seed(int(lat * 1000 + lng * 1000))
        return base_aqi + random.randint(-20, 20)
    
    def _get_route_description(self, route_type: str, avg_aqi: float, transport_mode: str) -> str:
        """Generate route description with AQI info."""
        mode_names = {
            "driving": "car",
            "car": "car",
            "walking": "walking",
            "walk": "walking",
            "foot": "walking",
            "cycling": "cycling",
            "cycle": "cycling",
            "bike": "cycling"
        }
        mode_name = mode_names.get(transport_mode, transport_mode)
        
        if route_type == "fastest":
            return f"Fastest {mode_name} route (AQI: {avg_aqi:.0f})"
        elif route_type == "cleanest":
            return f"Cleanest {mode_name} route - Avoids polluted areas (AQI: {avg_aqi:.0f})"
        else:
            return f"Balanced {mode_name} route (AQI: {avg_aqi:.0f})"
    
    def _add_path_variation(
        self,
        path: List[Dict[str, float]],
        variation: float = 0.05
    ) -> List[Dict[str, float]]:
        """Add slight variation to path for alternative routes."""
        if len(path) < 3:
            return path
        
        import random
        random.seed(42)  # Reproducible variations
        
        varied_path = [path[0]]  # Keep start point
        
        for i in range(1, len(path) - 1):
            point = path[i]
            # Add small random offset (except for start and end)
            lat_offset = (random.random() - 0.5) * variation * 0.01
            lng_offset = (random.random() - 0.5) * variation * 0.01
            
            varied_path.append({
                "lat": point["lat"] + lat_offset,
                "lng": point["lng"] + lng_offset
            })
        
        varied_path.append(path[-1])  # Keep end point
        return varied_path
    
    async def _get_local_routes(
        self,
        source: Tuple[float, float],
        destination: Tuple[float, float],
        health_profile: str,
        fitness_mode: bool,
        transport_mode: str
    ) -> List[HybridRoute]:
        """Get routes from local AQI-aware engine."""
        routes = []
        
        try:
            local_routes = self.local_engine.calculate_routes(
                source=source,
                destination=destination,
                health_profile=health_profile,
                fitness_mode=fitness_mode,
                transport_mode=transport_mode
            )
            
            for route_data in local_routes:
                hybrid_route = HybridRoute(
                    route_type=route_data.get("route_type", "balanced"),
                    path=route_data.get("path", []),
                    distance_meters=route_data.get("distance_meters", 0),
                    duration_seconds=route_data.get("duration_seconds", 0),
                    avg_aqi=route_data.get("avg_aqi", 0),
                    max_aqi=route_data.get("max_aqi", 0),
                    risk_score=route_data.get("risk_score", 0),
                    description=route_data.get("description", ""),
                    source="local",
                    turn_instructions=route_data.get("turns", []),
                    aqi_segments=[],
                    pollution_hotspots=route_data.get("pollution_hotspots", 0)
                )
                routes.append(hybrid_route)
                
        except Exception as e:
            print(f"Error getting local routes: {e}")
        
        return routes
    
    async def _enhance_with_llm(
        self,
        routes: List[HybridRoute],
        source: Tuple[float, float],
        destination: Tuple[float, float],
        health_profile: str,
        priority: str
    ) -> List[HybridRoute]:
        """Enhance routes with LLM analysis."""
        
        # Analyze each route
        for route in routes:
            try:
                route_dict = {
                    "distance_meters": route.distance_meters,
                    "duration_seconds": route.duration_seconds,
                    "avg_aqi": route.avg_aqi,
                    "max_aqi": route.max_aqi,
                    "risk_score": route.risk_score,
                    "num_turns": len(route.turn_instructions),
                    "pollution_hotspots": route.pollution_hotspots
                }
                
                analysis = await self.llm_service.analyze_route(
                    route_data=route_dict,
                    origin_name=f"Point ({source[0]:.4f}, {source[1]:.4f})",
                    destination_name=f"Point ({destination[0]:.4f}, {destination[1]:.4f})",
                    user_health_profile=health_profile
                )
                
                route.llm_analysis = analysis
                
                # Update description with LLM insights
                if analysis.get("summary"):
                    route.description = analysis["summary"]
                    
            except Exception as e:
                print(f"Error in LLM analysis: {e}")
        
        # Get route comparison
        try:
            route_dicts = [
                {
                    "route_type": r.route_type,
                    "distance_meters": r.distance_meters,
                    "duration_seconds": r.duration_seconds,
                    "avg_aqi": r.avg_aqi,
                    "max_aqi": r.max_aqi,
                    "risk_score": r.risk_score
                }
                for r in routes
            ]
            
            comparison = await self.llm_service.compare_routes(
                routes=route_dicts,
                user_health_profile=health_profile,
                priority=priority
            )
            
            # Mark recommended route
            recommended_type = comparison.get("recommended_route")
            for route in routes:
                if route.route_type == recommended_type:
                    route.recommended = True
                    
        except Exception as e:
            print(f"Error in LLM comparison: {e}")
        
        return routes
    
    def _mark_recommended(
        self,
        routes: List[HybridRoute],
        health_profile: str,
        priority: str
    ) -> List[HybridRoute]:
        """Mark the best route as recommended based on priority."""
        if not routes:
            return routes
        
        health_weight = self.HEALTH_WEIGHTS.get(health_profile, 1.0)
        
        # Calculate score for each route
        scored_routes = []
        for route in routes:
            # Normalize metrics (0-1 scale)
            time_score = route.duration_seconds / 3600  # Max 1 hour
            aqi_score = route.avg_aqi / 500  # Max AQI 500
            
            # Weighted score based on priority
            if priority == "health":
                score = (time_score * 0.3) + (aqi_score * health_weight * 0.7)
            elif priority == "speed":
                score = (time_score * 0.8) + (aqi_score * health_weight * 0.2)
            else:  # balanced
                score = (time_score * 0.5) + (aqi_score * health_weight * 0.5)
            
            scored_routes.append((score, route))
        
        # Sort by score and mark best as recommended
        scored_routes.sort(key=lambda x: x[0])
        
        for i, (_, route) in enumerate(scored_routes):
            route.recommended = (i == 0)
        
        return [route for _, route in scored_routes]
    
    def _calculate_aqi_profile(self, path: List[Dict[str, float]]) -> Dict[str, Any]:
        """Calculate AQI profile along a path."""
        if not path:
            return {"avg_aqi": 50, "max_aqi": 50, "segments": [], "hotspot_count": 0}
        
        segments = []
        aqi_values = []
        hotspots = []
        
        # Sample points along path
        sample_count = min(20, len(path))
        step = max(1, len(path) // sample_count)
        
        for i in range(0, len(path), step):
            point = path[i]
            
            # Get AQI from local engine
            aqi = self._get_aqi_at_point(point["lat"], point["lng"])
            
            segments.append({
                "index": i,
                "lat": point["lat"],
                "lng": point["lng"],
                "aqi": aqi
            })
            aqi_values.append(aqi)
            
            if aqi > 150:
                hotspots.append({"index": i, "lat": point["lat"], "lng": point["lng"], "aqi": aqi})
        
        return {
            "avg_aqi": sum(aqi_values) / len(aqi_values) if aqi_values else 50,
            "max_aqi": max(aqi_values) if aqi_values else 50,
            "segments": segments,
            "hotspot_count": len(hotspots),
            "hotspots": hotspots
        }
    
    def _get_aqi_at_point(self, lat: float, lng: float) -> float:
        """Get AQI at a specific point using local engine."""
        try:
            # Find nearest node
            nearest_id = self._find_nearest_node(lat, lng)
            if nearest_id is not None and nearest_id in self.local_engine.nodes:
                return self.local_engine.nodes[nearest_id].aqi
        except:
            pass
        
        # Default AQI
        return 80
    
    def _find_nearest_node(self, lat: float, lng: float) -> Optional[int]:
        """Find nearest graph node to coordinates."""
        min_dist = float('inf')
        nearest = None
        
        for node_id, node in self.local_engine.nodes.items():
            dist = self._haversine_distance(lat, lng, node.lat, node.lng)
            if dist < min_dist:
                min_dist = dist
                nearest = node_id
        
        return nearest
    
    def _haversine_distance(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """Calculate distance between two points in meters."""
        R = 6371000  # Earth's radius in meters
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lng = math.radians(lng2 - lng1)
        
        a = (math.sin(delta_lat / 2) ** 2 + 
             math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        return R * c
    
    def _calculate_risk(self, aqi: float, time_minutes: float, health_profile: str) -> float:
        """Calculate exposure risk score."""
        health_weight = self.HEALTH_WEIGHTS.get(health_profile, 1.0)
        return aqi * time_minutes * health_weight
    
    def get_route_with_ai_guidance(
        self,
        route: HybridRoute,
        origin_name: str = "Start",
        destination_name: str = "Destination"
    ) -> Dict[str, Any]:
        """Convert hybrid route to API response format with AI guidance."""
        return {
            "route_type": route.route_type,
            "path": route.path,
            "distance_meters": route.distance_meters,
            "duration_seconds": route.duration_seconds,
            "avg_aqi": route.avg_aqi,
            "max_aqi": route.max_aqi,
            "risk_score": route.risk_score,
            "description": route.description,
            "source": route.source,
            "recommended": route.recommended,
            "turn_instructions": route.turn_instructions,
            "aqi_segments": route.aqi_segments,
            "pollution_hotspots": route.pollution_hotspots,
            "ai_analysis": route.llm_analysis,
            "health_guidance": self._generate_health_guidance(route)
        }
    
    def _generate_health_guidance(self, route: HybridRoute) -> Dict[str, str]:
        """Generate health guidance for a route."""
        avg_aqi = route.avg_aqi
        max_aqi = route.max_aqi
        
        if max_aqi > 200:
            guidance_level = "critical"
            mask_recommendation = "N95 mask essential"
            health_tip = "Avoid outdoor exposure if possible. Stay in air-conditioned vehicle."
        elif max_aqi > 150:
            guidance_level = "high"
            mask_recommendation = "Mask recommended"
            health_tip = "Sensitive individuals should limit exposure. Keep medications handy."
        elif max_aqi > 100:
            guidance_level = "moderate"
            mask_recommendation = "Mask optional"
            health_tip = "Air quality is acceptable but sensitive people should be cautious."
        else:
            guidance_level = "good"
            mask_recommendation = "No mask needed"
            health_tip = "Air quality is good. Safe for all individuals."
        
        return {
            "guidance_level": guidance_level,
            "mask_recommendation": mask_recommendation,
            "health_tip": health_tip,
            "avg_aqi": f"{avg_aqi:.0f}",
            "max_aqi": f"{max_aqi:.0f}"
        }


# Singleton instance
hybrid_routing_engine = HybridRoutingEngine()
