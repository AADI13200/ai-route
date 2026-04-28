"""
Google Maps Routes API Integration
Provides real road network data and accurate routing using Google Maps.
"""

import os
import httpx
from typing import List, Dict, Any, Tuple, Optional
import math
from datetime import datetime

class GoogleMapsService:
    """Service for Google Maps Routes API integration."""
    
    def __init__(self):
        self.api_key = os.getenv('GOOGLE_MAPS_API_KEY')
        self.base_url = "https://routes.googleapis.com/directions/v2:computeRoutes"
        self.fallback_mode = not bool(self.api_key)
        
    async def get_real_routes(
        self,
        origin: Tuple[float, float],
        destination: Tuple[float, float],
        route_type: str = "balanced",
        avoid_highways: bool = False,
        avoid_tolls: bool = False
    ) -> Optional[Dict[str, Any]]:
        """
        Get real route from Google Maps Routes API.
        
        Args:
            origin: (lat, lng) tuple
            destination: (lat, lng) tuple
            route_type: 'fastest', 'shortest', or 'balanced'
            avoid_highways: Whether to avoid highways
            avoid_tolls: Whether to avoid tolls
            
        Returns:
            Route data with polyline, distance, duration, and steps
        """
        if self.fallback_mode:
            return None
            
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": self.api_key,
            "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.steps"
        }
        
        # Map route type to routing preference
        routing_preference = {
            "fastest": "TRAFFIC_AWARE",
            "shortest": "TRAFFIC_UNAWARE",
            "balanced": "TRAFFIC_AWARE_OPTIMAL"
        }.get(route_type, "TRAFFIC_AWARE_OPTIMAL")
        
        body = {
            "origin": {
                "location": {
                    "latLng": {
                        "latitude": origin[0],
                        "longitude": origin[1]
                    }
                }
            },
            "destination": {
                "location": {
                    "latLng": {
                        "latitude": destination[0],
                        "longitude": destination[1]
                    }
                }
            },
            "travelMode": "DRIVE",
            "routingPreference": routing_preference,
            "computeAlternativeRoutes": True,
            "routeModifiers": {
                "avoidHighways": avoid_highways,
                "avoidTolls": avoid_tolls,
                "avoidFerries": True
            },
            "languageCode": "en-IN",
            "units": "METRIC"
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.base_url,
                    headers=headers,
                    json=body,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if "routes" in data and len(data["routes"]) > 0:
                        route = data["routes"][0]
                        return {
                            "distance_meters": route.get("distanceMeters", 0),
                            "duration_seconds": self._parse_duration(route.get("duration", "0s")),
                            "polyline": route.get("polyline", {}).get("encodedPolyline", ""),
                            "legs": route.get("legs", []),
                            "source": "google_maps"
                        }
                else:
                    print(f"Google Maps API error: {response.status_code} - {response.text}")
                    return None
                    
        except Exception as e:
            print(f"Error calling Google Maps API: {e}")
            return None
    
    def _parse_duration(self, duration_str: str) -> float:
        """Parse duration string (e.g., '3600s') to seconds."""
        if not duration_str:
            return 0
        try:
            return float(duration_str.replace('s', ''))
        except:
            return 0
    
    def decode_polyline(self, encoded_polyline: str) -> List[Dict[str, float]]:
        """
        Decode Google Maps encoded polyline to list of coordinates.
        
        Returns:
            List of {lat, lng} dictionaries
        """
        if not encoded_polyline:
            return []
            
        coordinates = []
        index = 0
        lat = 0
        lng = 0
        
        while index < len(encoded_polyline):
            # Decode latitude
            shift = 0
            result = 0
            while True:
                byte = ord(encoded_polyline[index]) - 63
                index += 1
                result |= (byte & 0x1f) << shift
                shift += 5
                if byte < 0x20:
                    break
            
            delta_lat = ~(result >> 1) if (result & 1) else (result >> 1)
            lat += delta_lat
            
            # Decode longitude
            shift = 0
            result = 0
            while True:
                byte = ord(encoded_polyline[index]) - 63
                index += 1
                result |= (byte & 0x1f) << shift
                shift += 5
                if byte < 0x20:
                    break
            
            delta_lng = ~(result >> 1) if (result & 1) else (result >> 1)
            lng += delta_lng
            
            coordinates.append({
                "lat": lat / 100000.0,
                "lng": lng / 100000.0
            })
        
        return coordinates
    
    def extract_turn_instructions(self, legs: List[Dict]) -> List[Dict[str, Any]]:
        """
        Extract turn-by-turn instructions from route legs.
        
        Returns:
            List of turn instructions with distance and maneuver
        """
        turns = []
        step_number = 1
        
        for leg in legs:
            steps = leg.get("steps", [])
            for step in steps:
                navigation_instruction = step.get("navigationInstruction", {})
                maneuver = navigation_instruction.get("maneuver", "CONTINUE")
                instructions = navigation_instruction.get("instructions", "")
                
                turns.append({
                    "step": step_number,
                    "instruction": instructions,
                    "maneuver": maneuver,
                    "distance_meters": step.get("distanceMeters", 0),
                    "duration_seconds": self._parse_duration(step.get("duration", "0s"))
                })
                step_number += 1
        
        return turns
    
    async def get_multiple_routes(
        self,
        origin: Tuple[float, float],
        destination: Tuple[float, float],
        avoid_highways: bool = False,
        avoid_tolls: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Get multiple route alternatives from Google Maps.
        
        Returns:
            List of route dictionaries
        """
        routes = []
        
        # Try different routing preferences
        for route_type in ["balanced", "fastest", "shortest"]:
            route = await self.get_real_routes(
                origin, destination, route_type,
                avoid_highways, avoid_tolls
            )
            if route:
                route["route_type"] = route_type
                routes.append(route)
        
        return routes
    
    def calculate_route_aqi_profile(
        self,
        path: List[Dict[str, float]],
        aqi_service
    ) -> Dict[str, Any]:
        """
        Calculate AQI profile along a route path.
        
        Args:
            path: List of {lat, lng} coordinates
            aqi_service: Service to get AQI at coordinates
            
        Returns:
            AQI profile with segments, average, max, and hotspots
        """
        if not path or len(path) < 2:
            return {
                "avg_aqi": 0,
                "max_aqi": 0,
                "min_aqi": 0,
                "segments": [],
                "hotspots": []
            }
        
        segments = []
        aqi_values = []
        hotspots = []
        
        # Sample AQI at regular intervals along the route
        sample_interval = max(1, len(path) // 20)  # Sample ~20 points
        
        for i in range(0, len(path), sample_interval):
            point = path[i]
            aqi = aqi_service.get_aqi_at_location(point["lat"], point["lng"])
            
            segment = {
                "index": i,
                "lat": point["lat"],
                "lng": point["lng"],
                "aqi": aqi
            }
            segments.append(segment)
            aqi_values.append(aqi)
            
            # Identify hotspots (AQI > 150)
            if aqi > 150:
                hotspots.append({
                    "index": i,
                    "lat": point["lat"],
                    "lng": point["lng"],
                    "aqi": aqi
                })
        
        return {
            "avg_aqi": sum(aqi_values) / len(aqi_values) if aqi_values else 0,
            "max_aqi": max(aqi_values) if aqi_values else 0,
            "min_aqi": min(aqi_values) if aqi_values else 0,
            "segments": segments,
            "hotspot_count": len(hotspots),
            "hotspots": hotspots
        }


# Singleton instance
google_maps_service = GoogleMapsService()
