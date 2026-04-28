"""
Weather and Air Quality API Service
Handles integration with OpenWeather and other weather APIs.
"""

import httpx
import os
from typing import Dict, Any, Optional
from datetime import datetime

class WeatherService:
    """
    Service for fetching weather and air quality data.
    Supports OpenWeather API and fallback to mock data.
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize weather service.
        
        Args:
            api_key: OpenWeather API key. If None, uses env variable.
        """
        self.api_key = api_key or os.getenv('OPENWEATHER_API_KEY')
        self.base_url = "http://api.openweathermap.org/data/2.5"
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def get_current_weather(self, lat: float, lng: float) -> Dict[str, Any]:
        """
        Get current weather data for location.
        
        Args:
            lat: Latitude
            lng: Longitude
            
        Returns:
            Weather data dict
        """
        if not self.api_key:
            return self._get_mock_weather(lat, lng)
        
        try:
            url = f"{self.base_url}/weather"
            params = {
                'lat': lat,
                'lon': lng,
                'appid': self.api_key,
                'units': 'metric'
            }
            
            response = await self.client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            return {
                'temperature': data['main']['temp'],
                'feels_like': data['main']['feels_like'],
                'humidity': data['main']['humidity'],
                'pressure': data['main']['pressure'],
                'wind_speed': data['wind']['speed'],
                'wind_direction': data['wind'].get('deg', 0),
                'weather_main': data['weather'][0]['main'],
                'weather_description': data['weather'][0]['description'],
                'visibility': data.get('visibility', 10000),
                'clouds': data['clouds']['all'],
                'timestamp': datetime.now().isoformat(),
                'source': 'openweather'
            }
            
        except Exception as e:
            print(f"Weather API error: {e}")
            return self._get_mock_weather(lat, lng)
    
    async def get_air_quality(self, lat: float, lng: float) -> Dict[str, Any]:
        """
        Get air quality data for location.
        
        Args:
            lat: Latitude
            lng: Longitude
            
        Returns:
            Air quality data dict
        """
        if not self.api_key:
            return self._get_mock_aqi(lat, lng)
        
        try:
            url = f"{self.base_url}/air_pollution"
            params = {
                'lat': lat,
                'lon': lng,
                'appid': self.api_key
            }
            
            response = await self.client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            # Convert OpenWeather AQI (1-5) to standard AQI (0-500)
            ow_aqi = data['list'][0]['main']['aqi']
            standard_aqi = self._convert_ow_aqi(ow_aqi)
            
            components = data['list'][0]['components']
            
            return {
                'aqi': standard_aqi,
                'aqi_category': self._get_aqi_category(standard_aqi),
                'co': components.get('co', 0),
                'no': components.get('no', 0),
                'no2': components.get('no2', 0),
                'o3': components.get('o3', 0),
                'so2': components.get('so2', 0),
                'pm2_5': components.get('pm2_5', 0),
                'pm10': components.get('pm10', 0),
                'nh3': components.get('nh3', 0),
                'timestamp': datetime.now().isoformat(),
                'source': 'openweather'
            }
            
        except Exception as e:
            print(f"AQI API error: {e}")
            return self._get_mock_aqi(lat, lng)
    
    async def get_combined_data(self, lat: float, lng: float) -> Dict[str, Any]:
        """
        Get both weather and air quality data.
        
        Args:
            lat: Latitude
            lng: Longitude
            
        Returns:
            Combined data dict
        """
        weather = await self.get_current_weather(lat, lng)
        aqi = await self.get_air_quality(lat, lng)
        
        return {
            'location': {'lat': lat, 'lng': lng},
            'weather': weather,
            'air_quality': aqi,
            'fetched_at': datetime.now().isoformat()
        }
    
    def _convert_ow_aqi(self, ow_aqi: int) -> float:
        """Convert OpenWeather AQI (1-5) to standard AQI (0-500)."""
        # OpenWeather: 1=Good, 2=Fair, 3=Moderate, 4=Poor, 5=Very Poor
        conversion_map = {
            1: 25,   # 0-50
            2: 75,   # 51-100
            3: 125,  # 101-150
            4: 175,  # 151-200
            5: 250   # 201-300 (capped)
        }
        return float(conversion_map.get(ow_aqi, 100))
    
    def _get_aqi_category(self, aqi: float) -> str:
        """Get AQI category name."""
        if aqi <= 50:
            return 'Good'
        elif aqi <= 100:
            return 'Moderate'
        elif aqi <= 150:
            return 'Unhealthy for Sensitive Groups'
        elif aqi <= 200:
            return 'Unhealthy'
        elif aqi <= 300:
            return 'Very Unhealthy'
        else:
            return 'Hazardous'
    
    def _get_mock_weather(self, lat: float, lng: float) -> Dict[str, Any]:
        """Generate mock weather data."""
        # Use coordinates to generate consistent but varying data
        base_temp = 20 + (lat % 10) * 0.5
        
        return {
            'temperature': round(base_temp, 1),
            'feels_like': round(base_temp + 2, 1),
            'humidity': int(40 + (lng % 20) * 2),
            'pressure': int(1013 + (lat % 5)),
            'wind_speed': round(5 + (lng % 10) * 0.5, 1),
            'wind_direction': int((lat + lng) % 360),
            'weather_main': 'Clear',
            'weather_description': 'clear sky',
            'visibility': 10000,
            'clouds': int(lat % 30),
            'timestamp': datetime.now().isoformat(),
            'source': 'mock'
        }
    
    def _get_mock_aqi(self, lat: float, lng: float) -> Dict[str, Any]:
        """Generate mock AQI data."""
        # Simulate urban areas having worse air quality
        urban_factor = abs(lat - 28.6) + abs(lng - 77.2)
        base_aqi = 50 + urban_factor * 10
        
        return {
            'aqi': round(base_aqi, 1),
            'aqi_category': self._get_aqi_category(base_aqi),
            'co': round(200 + base_aqi * 2, 1),
            'no': round(10 + base_aqi * 0.1, 1),
            'no2': round(15 + base_aqi * 0.2, 1),
            'o3': round(30 + base_aqi * 0.3, 1),
            'so2': round(5 + base_aqi * 0.05, 1),
            'pm2_5': round(10 + base_aqi * 0.5, 1),
            'pm10': round(20 + base_aqi * 0.8, 1),
            'nh3': round(2 + base_aqi * 0.02, 1),
            'timestamp': datetime.now().isoformat(),
            'source': 'mock'
        }
    
    async def close(self):
        """Close HTTP client."""
        await self.client.aclose()

# Convenience function
async def fetch_weather_aqi(lat: float, lng: float) -> Dict[str, Any]:
    """Fetch weather and AQI data for a location."""
    service = WeatherService()
    try:
        return await service.get_combined_data(lat, lng)
    finally:
        await service.close()
