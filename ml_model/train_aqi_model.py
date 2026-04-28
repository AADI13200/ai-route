"""
AQI Prediction Model Training Script
Uses Random Forest Regression to predict AQI based on weather conditions.
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import os

def generate_synthetic_data(n_samples=5000):
    """
    Generate synthetic AQI training data.
    In production, replace with real historical data from air quality APIs.
    """
    np.random.seed(42)
    
    # Features: temperature, humidity, wind_speed, pressure, historical_aqi, hour_of_day
    temperature = np.random.uniform(-10, 45, n_samples)  # Celsius
    humidity = np.random.uniform(10, 95, n_samples)  # Percentage
    wind_speed = np.random.uniform(0, 30, n_samples)  # km/h
    pressure = np.random.uniform(980, 1030, n_samples)  # hPa
    historical_aqi = np.random.uniform(0, 300, n_samples)
    hour_of_day = np.random.randint(0, 24, n_samples)
    
    # AQI calculation formula (simplified physics-based model)
    # Higher temp + lower wind = higher AQI
    # Higher humidity can increase AQI due to particulate matter absorption
    base_aqi = (
        50 + 
        0.5 * temperature + 
        0.3 * humidity - 
        1.5 * wind_speed + 
        0.1 * historical_aqi +
        10 * np.sin(2 * np.pi * hour_of_day / 24)  # Daily pattern
    )
    
    # Add noise
    noise = np.random.normal(0, 15, n_samples)
    aqi = np.clip(base_aqi + noise, 0, 500)
    
    # Create DataFrame
    data = pd.DataFrame({
        'temperature': temperature,
        'humidity': humidity,
        'wind_speed': wind_speed,
        'pressure': pressure,
        'historical_aqi': historical_aqi,
        'hour_of_day': hour_of_day,
        'aqi': aqi
    })
    
    return data

def train_model():
    """Train and save the AQI prediction model."""
    print("Generating synthetic training data...")
    data = generate_synthetic_data(n_samples=10000)
    
    # Prepare features and target
    feature_columns = ['temperature', 'humidity', 'wind_speed', 'pressure', 'historical_aqi', 'hour_of_day']
    X = data[feature_columns]
    y = data['aqi']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Train Random Forest model
    print("Training Random Forest model...")
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=20,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate model
    y_pred = model.predict(X_test)
    mse = mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    print(f"\nModel Performance:")
    print(f"MSE: {mse:.2f}")
    print(f"RMSE: {np.sqrt(mse):.2f}")
    print(f"R2 Score: {r2:.4f}")
    
    # Feature importance
    print("\nFeature Importance:")
    for feature, importance in zip(feature_columns, model.feature_importances_):
        print(f"  {feature}: {importance:.4f}")
    
    # Save model
    os.makedirs('ml_model', exist_ok=True)
    model_path = os.path.join('ml_model', 'aqi_predictor.pkl')
    joblib.dump(model, model_path)
    print(f"\nModel saved to {model_path}")
    
    return model

if __name__ == "__main__":
    train_model()
