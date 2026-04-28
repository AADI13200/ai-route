"""
AQI Prediction module for inference.
Loads the trained model and provides prediction functionality.
"""

import joblib
import numpy as np
import os
from datetime import datetime

class AQIPredictor:
    """AQI prediction using trained Random Forest model."""
    
    def __init__(self, model_path=None):
        """
        Initialize the predictor with a trained model.
        
        Args:
            model_path: Path to the saved model. If None, uses default path.
        """
        if model_path is None:
            # Try multiple paths for flexibility
            possible_paths = [
                'aqi_predictor.pkl',
                'ml_model/aqi_predictor.pkl',
                '../ml_model/aqi_predictor.pkl',
                os.path.join(os.path.dirname(__file__), 'aqi_predictor.pkl')
            ]
            
            model_path = None
            for path in possible_paths:
                if os.path.exists(path):
                    model_path = path
                    break
            
            if model_path is None:
                raise FileNotFoundError("Model file not found. Please train the model first.")
        
        self.model = joblib.load(model_path)
        self.feature_names = ['temperature', 'humidity', 'wind_speed', 'pressure', 'historical_aqi', 'hour_of_day']
    
    def predict(self, temperature, humidity, wind_speed, pressure, historical_aqi, hour_of_day=None):
        """
        Predict AQI based on weather parameters.
        
        Args:
            temperature: Temperature in Celsius
            humidity: Humidity percentage (0-100)
            wind_speed: Wind speed in km/h
            pressure: Atmospheric pressure in hPa
            historical_aqi: Historical AQI value
            hour_of_day: Hour of day (0-23), defaults to current hour
            
        Returns:
            Predicted AQI value
        """
        if hour_of_day is None:
            hour_of_day = datetime.now().hour
        
        # Create feature array
        features = np.array([[temperature, humidity, wind_speed, pressure, historical_aqi, hour_of_day]])
        
        # Predict
        prediction = self.model.predict(features)[0]
        
        # Clip to valid AQI range
        return float(np.clip(prediction, 0, 500))
    
    def predict_batch(self, data):
        """
        Predict AQI for multiple data points.
        
        Args:
            data: List of dicts with keys matching feature_names
            
        Returns:
            List of predicted AQI values
        """
        features = []
        for item in data:
            features.append([
                item['temperature'],
                item['humidity'],
                item['wind_speed'],
                item['pressure'],
                item['historical_aqi'],
                item.get('hour_of_day', datetime.now().hour)
            ])
        
        features = np.array(features)
        predictions = self.model.predict(features)
        return [float(np.clip(p, 0, 500)) for p in predictions]

    def get_aqi_category(self, aqi):
        """
        Get AQI category and health implications.
        
        Args:
            aqi: AQI value
            
        Returns:
            Dict with category, color, and description
        """
        if aqi <= 50:
            return {
                'category': 'Good',
                'color': '#22c55e',
                'description': 'Air quality is satisfactory',
                'health_implications': 'No health impacts expected'
            }
        elif aqi <= 100:
            return {
                'category': 'Moderate',
                'color': '#eab308',
                'description': 'Air quality is acceptable',
                'health_implications': 'Sensitive individuals should consider limiting prolonged outdoor exertion'
            }
        elif aqi <= 150:
            return {
                'category': 'Unhealthy for Sensitive Groups',
                'color': '#f97316',
                'description': 'Members of sensitive groups may experience health effects',
                'health_implications': 'People with respiratory or heart disease, the elderly and children should limit prolonged outdoor exertion'
            }
        elif aqi <= 200:
            return {
                'category': 'Unhealthy',
                'color': '#ef4444',
                'description': 'Everyone may begin to experience health effects',
                'health_implications': 'Avoid prolonged outdoor exertion'
            }
        elif aqi <= 300:
            return {
                'category': 'Very Unhealthy',
                'color': '#a855f7',
                'description': 'Health warnings of emergency conditions',
                'health_implications': 'Everyone should avoid outdoor exertion'
            }
        else:
            return {
                'category': 'Hazardous',
                'color': '#7f1d1d',
                'description': 'Health alert: everyone may experience more serious health effects',
                'health_implications': 'Avoid all outdoor activity'
            }

# Global predictor instance
_predictor = None

def get_predictor():
    """Get or create the global predictor instance."""
    global _predictor
    if _predictor is None:
        _predictor = AQIPredictor()
    return _predictor

def predict_aqi(temperature, humidity, wind_speed, pressure, historical_aqi, hour_of_day=None):
    """
    Convenience function for AQI prediction.
    
    Returns:
        Dict with predicted_aqi and category information
    """
    predictor = get_predictor()
    aqi = predictor.predict(temperature, humidity, wind_speed, pressure, historical_aqi, hour_of_day)
    category = predictor.get_aqi_category(aqi)
    
    return {
        'predicted_aqi': round(aqi, 1),
        'category': category['category'],
        'color': category['color'],
        'description': category['description'],
        'health_implications': category['health_implications']
    }

if __name__ == "__main__":
    # Test prediction
    result = predict_aqi(
        temperature=25,
        humidity=60,
        wind_speed=10,
        pressure=1013,
        historical_aqi=80
    )
    print(f"Predicted AQI: {result}")
