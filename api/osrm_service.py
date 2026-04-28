"""
OSRM (Open Source Routing Machine) Service
Provides free, accurate routing using OpenStreetMap data.
No API key required - uses public OSRM demo server.
"""

import httpx
from typing import List, Dict, Any, Tuple, Optional
import polyline

class OSRMService:
    """Service for free routing using OSRM."""
    
    def __init__(self):
        # Use routing.openstreetmap.de as primary (more reliable)
        self.base_url = "https://routing.openstreetmap.de/routed-car"
        self.fallback_url = "http://router.project-osrm.org"
    
    async def get_route(
        self,
        origin: Tuple[float, float],
        destination: Tuple[float, float],
        route_type: str = "balanced",
        transport_mode: str = "driving"
    ) -> Optional[Dict[str, Any]]:
        """
        Get route from OSRM.
        
        Args:
            origin: (lat, lng) tuple
            destination: (lat, lng) tuple
            route_type: 'fastest', 'shortest', or 'balanced'
            transport_mode: 'driving', 'walking', 'cycling'
            
        Returns:
            Route data with path, distance, duration
        """
        # OSRM uses [lng, lat] format
        coords = f"{origin[1]},{origin[0]};{destination[1]},{destination[0]}"
        
        # Map transport mode to OSRM profile
        profile_map = {
            "driving": "routed-car",
            "car": "routed-car",
            "walking": "routed-foot",
            "walk": "routed-foot",
            "foot": "routed-foot",
            "cycling": "routed-bike",
            "cycle": "routed-bike",
            "bike": "routed-bike"
        }
        
        # For routing.openstreetmap.de, the URL format is different
        profile = profile_map.get(transport_mode, "routed-car")
        base = self.base_url.replace("routed-car", profile)
        
        # Build URL with overview=full to get geometry
        url = f"{base}/route/v1/{transport_mode}/{coords}"
        params = {
            "overview": "full",
            "geometries": "polyline",
            "alternatives": "true",
            "steps": "true"
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, timeout=30.0)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("code") == "Ok" and data.get("routes"):
                        route = data["routes"][0]
                        
                        # Decode polyline to get path coordinates
                        geometry = route.get("geometry", "")
                        path = self._decode_polyline(geometry)
                        
                        # Extract turn-by-turn instructions
                        steps = []
                        for leg in route.get("legs", []):
                            for step in leg.get("steps", []):
                                steps.append({
                                    "instruction": step.get("name", "Continue"),
                                    "distance": step.get("distance", 0),
                                    "duration": step.get("duration", 0),
                                    "maneuver": step.get("maneuver", {}).get("type", "straight")
                                })
                        
                        return {
                            "distance_meters": route.get("distance", 0),
                            "duration_seconds": route.get("duration", 0),
                            "path": path,
                            "steps": steps,
                            "geometry": geometry,
                            "source": "osrm"
                        }
                else:
                    print(f"OSRM API error: {response.status_code}")
                    return None
                    
        except Exception as e:
            print(f"OSRM request failed: {e}")
            return None
    
    def _decode_polyline(self, encoded: str) -> List[Dict[str, float]]:
        """Decode polyline to list of coordinates."""
        try:
            coords = polyline.decode(encoded)
            return [{"lat": lat, "lng": lng} for lat, lng in coords]
        except Exception as e:
            print(f"Polyline decode error: {e}")
            return []
    
    async def get_multiple_routes(
        self,
        origin: Tuple[float, float],
        destination: Tuple[float, float],
        transport_mode: str = "driving"
    ) -> List[Dict[str, Any]]:
        """Get multiple route alternatives for specific transport mode."""
        routes = []
        
        # Get different route types for the transport mode
        route_types = ["fastest", "balanced", "shortest"]
        
        for route_type in route_types:
            route = await self.get_route(origin, destination, route_type, transport_mode)
            if route:
                route["route_type"] = route_type
                routes.append(route)
        
        return routes

# Global instance
osrm_service = OSRMService()
