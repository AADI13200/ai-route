"""
LLM Service for Intelligent Route Recommendations
Uses Google Gemini for natural language route analysis and recommendations.
"""

import os
import httpx
import json
from typing import List, Dict, Any, Optional
from datetime import datetime

class LLMService:
    """Service for LLM-powered route intelligence."""
    
    def __init__(self):
        self.api_key = os.getenv('GEMINI_API_KEY')
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
        self.fallback_mode = not bool(self.api_key)
        
    async def analyze_route(
        self,
        route_data: Dict[str, Any],
        origin_name: str = "Starting Point",
        destination_name: str = "Destination",
        user_health_profile: str = "normal",
        current_aqi_context: Optional[Dict] = None
    ) -> Dict[str, str]:
        """
        Generate intelligent route analysis using LLM.
        
        Args:
            route_data: Route metrics and details
            origin_name: Name of starting location
            destination_name: Name of destination
            user_health_profile: User's health sensitivity
            current_aqi_context: Current AQI conditions
            
        Returns:
            Dictionary with analysis, recommendation, and warnings
        """
        if self.fallback_mode:
            return self._fallback_analysis(route_data, user_health_profile)
        
        prompt = self._build_analysis_prompt(
            route_data, origin_name, destination_name,
            user_health_profile, current_aqi_context
        )
        
        try:
            response = await self._call_gemini(prompt)
            return self._parse_analysis_response(response)
        except Exception as e:
            print(f"LLM analysis error: {e}")
            return self._fallback_analysis(route_data, user_health_profile)
    
    async def generate_turn_instructions(
        self,
        route_steps: List[Dict[str, Any]],
        aqi_segments: List[Dict[str, Any]],
        landmarks: Optional[List[Dict]] = None
    ) -> List[Dict[str, Any]]:
        """
        Generate enhanced turn-by-turn instructions with AQI awareness.
        
        Args:
            route_steps: Basic route steps from routing engine
            aqi_segments: AQI data for route segments
            landmarks: Optional nearby landmarks
            
        Returns:
            Enhanced instructions with health tips and warnings
        """
        if self.fallback_mode or not route_steps:
            return self._enhance_basic_instructions(route_steps, aqi_segments)
        
        prompt = self._build_navigation_prompt(route_steps, aqi_segments, landmarks)
        
        try:
            response = await self._call_gemini(prompt)
            enhanced = self._parse_navigation_response(response, route_steps)
            return enhanced
        except Exception as e:
            print(f"LLM navigation error: {e}")
            return self._enhance_basic_instructions(route_steps, aqi_segments)
    
    async def compare_routes(
        self,
        routes: List[Dict[str, Any]],
        user_health_profile: str = "normal",
        priority: str = "balanced"  # 'health', 'speed', or 'balanced'
    ) -> Dict[str, Any]:
        """
        Compare multiple routes and recommend the best option.
        
        Args:
            routes: List of route options
            user_health_profile: User's health sensitivity
            priority: User's priority preference
            
        Returns:
            Comparison analysis with recommendation
        """
        if self.fallback_mode or len(routes) < 2:
            return self._fallback_comparison(routes, priority)
        
        prompt = self._build_comparison_prompt(routes, user_health_profile, priority)
        
        try:
            response = await self._call_gemini(prompt)
            return self._parse_comparison_response(response, routes)
        except Exception as e:
            print(f"LLM comparison error: {e}")
            return self._fallback_comparison(routes, priority)
    
    async def _call_gemini(self, prompt: str) -> str:
        """Call Google Gemini API."""
        url = f"{self.base_url}?key={self.api_key}"
        
        body = {
            "contents": [{
                "parts": [{"text": prompt}]
            }],
            "generationConfig": {
                "temperature": 0.3,
                "maxOutputTokens": 2048,
                "topP": 0.8,
                "topK": 40
            }
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                json=body,
                headers={"Content-Type": "application/json"},
                timeout=30.0
            )
            
            if response.status_code == 200:
                data = response.json()
                if "candidates" in data and len(data["candidates"]) > 0:
                    content = data["candidates"][0].get("content", {})
                    parts = content.get("parts", [])
                    if parts:
                        return parts[0].get("text", "")
            
            raise Exception(f"API error: {response.status_code}")
    
    def _build_analysis_prompt(
        self,
        route_data: Dict,
        origin_name: str,
        destination_name: str,
        health_profile: str,
        aqi_context: Optional[Dict]
    ) -> str:
        """Build prompt for route analysis."""
        
        current_hour = datetime.now().hour
        time_of_day = "morning" if 6 <= current_hour < 12 else "afternoon" if 12 <= current_hour < 17 else "evening" if 17 <= current_hour < 21 else "night"
        
        aqi_info = ""
        if aqi_context:
            aqi_info = f"""
Current AQI Context:
- Overall AQI: {aqi_context.get('aqi', 'Unknown')}
- PM2.5: {aqi_context.get('pm25', 'Unknown')} μg/m³
- PM10: {aqi_context.get('pm10', 'Unknown')} μg/m³
"""
        
        return f"""You are PurePath, an AI-powered pollution-aware navigation assistant. Analyze this route and provide health-conscious guidance.

Route Details:
- From: {origin_name}
- To: {destination_name}
- Distance: {route_data.get('distance_meters', 0) / 1000:.1f} km
- Duration: {route_data.get('duration_seconds', 0) / 60:.0f} minutes
- Average AQI: {route_data.get('avg_aqi', 0):.0f}
- Max AQI: {route_data.get('max_aqi', 0):.0f}
- Risk Score: {route_data.get('risk_score', 0):.0f}
- Number of turns: {route_data.get('num_turns', 0)}
- Pollution hotspots: {route_data.get('pollution_hotspots', 0)}

User Health Profile: {health_profile}
Time of Day: {time_of_day}
{aqi_info}

Provide a JSON response with these fields:
{{
    "summary": "Brief 1-2 sentence summary of the route",
    "health_assessment": "Health impact assessment for this profile",
    "aqi_warnings": "Any AQI warnings or alerts",
    "recommendations": "Specific recommendations for this user",
    "precautions": "Recommended precautions to take"
}}

Keep responses concise and actionable. Focus on health impact and practical advice."""

    def _build_navigation_prompt(
        self,
        steps: List[Dict],
        aqi_segments: List[Dict],
        landmarks: Optional[List[Dict]]
    ) -> str:
        """Build prompt for navigation instructions."""
        
        steps_text = "\n".join([
            f"Step {i+1}: {step.get('instruction', 'Continue')} "
            f"({step.get('distance', 0):.0f}m, AQI: {self._get_aqi_for_step(i, aqi_segments):.0f})"
            for i, step in enumerate(steps[:15])  # Limit to first 15 steps
        ])
        
        landmark_text = ""
        if landmarks:
            landmark_text = "\nNearby Landmarks:\n" + "\n".join([
                f"- {lm.get('name', 'Unknown')} at {lm.get('distance', 0):.0f}m"
                for lm in landmarks[:5]
            ])
        
        return f"""Enhance these navigation instructions with health-aware guidance.

Basic Steps:
{steps_text}
{landmark_text}

For each step, provide:
1. Clear, concise instruction
2. Health tip if entering high AQI zone (>100)
3. Landmark reference if available
4. Safety note if applicable

Return as JSON array:
[
    {{
        "step": 1,
        "instruction": "Enhanced instruction",
        "health_tip": "Optional health tip or null",
        "landmark": "Nearby landmark or null",
        "aqi_alert": true/false
    }}
]

Keep instructions natural and conversational."""

    def _build_comparison_prompt(
        self,
        routes: List[Dict],
        health_profile: str,
        priority: str
    ) -> str:
        """Build prompt for route comparison."""
        
        routes_text = "\n\n".join([
            f"Route {i+1} ({r.get('route_type', 'unknown')}):\n"
            f"- Distance: {r.get('distance_meters', 0) / 1000:.1f} km\n"
            f"- Duration: {r.get('duration_seconds', 0) / 60:.0f} min\n"
            f"- Avg AQI: {r.get('avg_aqi', 0):.0f}\n"
            f"- Max AQI: {r.get('max_aqi', 0):.0f}\n"
            f"- Risk Score: {r.get('risk_score', 0):.0f}"
            for i, r in enumerate(routes[:3])
        ])
        
        return f"""Compare these route options for a user with {health_profile} health profile.
User Priority: {priority}

{routes_text}

Analyze and recommend the best route considering:
1. Health impact (AQI exposure)
2. Time efficiency
3. Route safety
4. User's priority preference

Return JSON:
{{
    "recommended_route": "Route type (cleanest/fastest/balanced)",
    "reasoning": "Why this route is best for this user",
    "trade_offs": "What the user gains/loses with this choice",
    "health_advice": "Specific health guidance"
}}

Be decisive and practical."""

    def _parse_analysis_response(self, response: str) -> Dict[str, str]:
        """Parse LLM analysis response."""
        try:
            # Extract JSON from response
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            if json_start >= 0 and json_end > json_start:
                json_str = response[json_start:json_end]
                return json.loads(json_str)
        except:
            pass
        
        # Fallback: return structured text
        return {
            "summary": response[:200] if len(response) > 200 else response,
            "health_assessment": "See summary",
            "aqi_warnings": "",
            "recommendations": "",
            "precautions": ""
        }
    
    def _parse_navigation_response(self, response: str, original_steps: List[Dict]) -> List[Dict]:
        """Parse LLM navigation response."""
        try:
            json_start = response.find('[')
            json_end = response.rfind(']') + 1
            if json_start >= 0 and json_end > json_start:
                json_str = response[json_start:json_end]
                enhanced = json.loads(json_str)
                return enhanced if isinstance(enhanced, list) else original_steps
        except:
            pass
        
        return self._enhance_basic_instructions(original_steps, [])
    
    def _parse_comparison_response(self, response: str, routes: List[Dict]) -> Dict[str, Any]:
        """Parse LLM comparison response."""
        try:
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            if json_start >= 0 and json_end > json_start:
                json_str = response[json_start:json_end]
                return json.loads(json_str)
        except:
            pass
        
        return self._fallback_comparison(routes, "balanced")
    
    def _get_aqi_for_step(self, step_index: int, aqi_segments: List[Dict]) -> float:
        """Get AQI for a specific step."""
        if not aqi_segments:
            return 50
        
        # Map step index to nearest AQI segment
        if step_index < len(aqi_segments):
            return aqi_segments[step_index].get('aqi', 50)
        
        return aqi_segments[-1].get('aqi', 50) if aqi_segments else 50
    
    def _enhance_basic_instructions(
        self,
        steps: List[Dict],
        aqi_segments: List[Dict]
    ) -> List[Dict]:
        """Enhance basic instructions without LLM."""
        enhanced = []
        
        for i, step in enumerate(steps):
            aqi = self._get_aqi_for_step(i, aqi_segments)
            
            health_tip = None
            aqi_alert = False
            
            if aqi > 200:
                health_tip = "⚠️ Very poor air quality. Wear N95 mask if walking."
                aqi_alert = True
            elif aqi > 150:
                health_tip = "Poor air quality. Sensitive individuals should avoid outdoor exposure."
                aqi_alert = True
            elif aqi > 100:
                health_tip = "Moderate pollution. Consider closing windows."
            
            enhanced.append({
                "step": i + 1,
                "instruction": step.get('instruction', f'Continue for {step.get("distance", 0):.0f}m'),
                "health_tip": health_tip,
                "landmark": step.get('road', ''),
                "aqi_alert": aqi_alert,
                "distance_meters": step.get('distance', 0),
                "aqi": aqi
            })
        
        return enhanced
    
    def _fallback_analysis(self, route_data: Dict, health_profile: str) -> Dict[str, str]:
        """Generate analysis without LLM."""
        avg_aqi = route_data.get('avg_aqi', 0)
        max_aqi = route_data.get('max_aqi', 0)
        duration = route_data.get('duration_seconds', 0) / 60
        
        # Health assessment
        if health_profile == 'asthma':
            if max_aqi > 150:
                health_assessment = "⚠️ HIGH RISK: AQI exceeds safe limits for asthma patients."
            elif avg_aqi > 100:
                health_assessment = "Moderate risk. Keep inhaler accessible."
            else:
                health_assessment = "Good air quality for your condition."
        elif health_profile == 'cardiac':
            if max_aqi > 150:
                health_assessment = "⚠️ HIGH RISK: Poor air quality may stress cardiovascular system."
            else:
                health_assessment = "Acceptable air quality. Monitor for any discomfort."
        else:
            if max_aqi > 200:
                health_assessment = "Unhealthy air quality. Consider postponing non-essential travel."
            elif max_aqi > 150:
                health_assessment = "Moderate pollution. Sensitive individuals should take precautions."
            else:
                health_assessment = "Good air quality for general population."
        
        return {
            "summary": f"Route takes {duration:.0f} minutes with average AQI of {avg_aqi:.0f}.",
            "health_assessment": health_assessment,
            "aqi_warnings": f"Peak pollution: AQI {max_aqi:.0f}" if max_aqi > 100 else "No significant pollution warnings.",
            "recommendations": "Choose cleanest route for health." if health_profile != 'normal' else "Route is suitable for travel.",
            "precautions": "Carry mask if AQI > 150." if max_aqi > 150 else "No special precautions needed."
        }
    
    def _fallback_comparison(self, routes: List[Dict], priority: str) -> Dict[str, Any]:
        """Generate route comparison without LLM."""
        if not routes:
            return {
                "recommended_route": "none",
                "reasoning": "No routes available",
                "trade_offs": "",
                "health_advice": ""
            }
        
        # Find best route based on priority
        if priority == "health":
            best = min(routes, key=lambda r: r.get('avg_aqi', float('inf')))
        elif priority == "speed":
            best = min(routes, key=lambda r: r.get('duration_seconds', float('inf')))
        else:
            # Balanced: minimize risk score
            best = min(routes, key=lambda r: r.get('risk_score', float('inf')))
        
        route_type = best.get('route_type', 'unknown')
        
        return {
            "recommended_route": route_type,
            "reasoning": f"This route offers the best balance for your {priority} priority.",
            "trade_offs": f"Selected route may have different time/AQI trade-offs.",
            "health_advice": "Monitor AQI along the way."
        }


# Singleton instance
llm_service = LLMService()
