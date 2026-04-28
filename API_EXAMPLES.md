# PurePath API Examples

## Base URL
```
http://localhost:8000
```

## Endpoints

### 1. Health Check
```bash
curl http://localhost:8000/health
```

**Response:**
```json
{
  "status": "healthy"
}
```

---

### 2. Get Pollution-Aware Routes
```bash
curl -X POST http://localhost:8000/get-routes \
  -H "Content-Type: application/json" \
  -d '{
    "source": {"lat": 28.6329, "lng": 77.2195},
    "destination": {"lat": 28.6129, "lng": 77.2295},
    "user_id": "user123",
    "fitness_mode": false,
    "transport_mode": "driving"
  }'
```

**Response:**
```json
[
  {
    "route_type": "cleanest",
    "path": [
      {"lat": 28.6329, "lng": 77.2195},
      {"lat": 28.6300, "lng": 77.2200},
      {"lat": 28.6129, "lng": 77.2295}
    ],
    "distance_meters": 2850.5,
    "duration_seconds": 420.0,
    "avg_aqi": 65.3,
    "max_aqi": 85.0,
    "risk_score": 456.2,
    "description": "Lowest pollution exposure"
  },
  {
    "route_type": "fastest",
    "path": [...],
    "distance_meters": 2100.0,
    "duration_seconds": 300.0,
    "avg_aqi": 95.7,
    "max_aqi": 120.0,
    "risk_score": 478.5,
    "description": "Shortest travel time"
  },
  {
    "route_type": "balanced",
    "path": [...],
    "distance_meters": 2450.0,
    "duration_seconds": 350.0,
    "avg_aqi": 78.4,
    "max_aqi": 98.0,
    "risk_score": 457.0,
    "description": "Optimal balance of time and air quality"
  }
]
```

---

### 3. Predict AQI (ML Model)
```bash
curl -X POST http://localhost:8000/predict-aqi \
  -H "Content-Type: application/json" \
  -d '{
    "temperature": 28.5,
    "humidity": 65,
    "wind_speed": 12.5,
    "pressure": 1012,
    "historical_aqi": 85
  }'
```

**Response:**
```json
{
  "predicted_aqi": 92.4,
  "category": "Moderate",
  "color": "#eab308",
  "description": "Air quality is acceptable",
  "health_implications": "Sensitive individuals should consider limiting prolonged outdoor exertion"
}
```

---

### 4. Calculate Exposure Risk
```bash
curl -X POST http://localhost:8000/calculate-risk \
  -H "Content-Type: application/json" \
  -d '{
    "aqi": 95,
    "exposure_time_minutes": 30,
    "health_profile": "asthma"
  }'
```

**Response:**
```json
{
  "risk_score": 7125.0,
  "risk_level": "High",
  "recommendation": "Minimize outdoor exposure",
  "health_profile": "asthma",
  "aqi": 95,
  "exposure_time_minutes": 30
}
```

---

### 5. Update User Profile
```bash
curl -X POST http://localhost:8000/user-profile \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "health_profile": "asthma",
    "preferences": {
      "notifications": true,
      "aqi_threshold": 100
    }
  }'
```

**Response:**
```json
{
  "message": "Profile updated successfully",
  "profile": {
    "user_id": "user123",
    "health_profile": "asthma",
    "health_weight": 2.5,
    "preferences": {
      "notifications": true,
      "aqi_threshold": 100
    },
    "updated_at": "2024-01-15T10:30:00"
  }
}
```

---

### 6. Get User Profile
```bash
curl http://localhost:8000/user-profile/user123
```

**Response:**
```json
{
  "user_id": "user123",
  "health_profile": "asthma",
  "health_weight": 2.5,
  "preferences": {
    "notifications": true,
    "aqi_threshold": 100
  },
  "updated_at": "2024-01-15T10:30:00"
}
```

---

### 7. Get Weather and AQI (Pune)
```bash
curl "http://localhost:8000/weather-aqi?lat=18.5204&lng=73.8567"
```

**Response:**
```json
{
  "weather": {
    "temperature": 25.5,
    "humidity": 60,
    "wind_speed": 10.2,
    "pressure": 1013
  },
  "aqi": 75,
  "aqi_category": "Moderate",
  "source": "mock"
}
```

---

## Health Profile Weights

| Profile | Weight | Description |
|---------|--------|-------------|
| normal | 1.0 | No known respiratory or cardiovascular conditions |
| asthma | 2.5 | Asthma or other respiratory conditions |
| cardiac | 3.0 | Heart disease or cardiovascular conditions |

## Transport Modes

| Mode | Description |
|------|-------------|
| driving | Car, motorcycle, or other motor vehicle |
| cycling | Bicycle |
| walking | Walking or running |

## AQI Categories

| AQI Range | Category | Color |
|-----------|----------|-------|
| 0-50 | Good | Green |
| 51-100 | Moderate | Yellow |
| 101-150 | Unhealthy for Sensitive | Orange |
| 151-200 | Unhealthy | Red |
| 201-300 | Very Unhealthy | Purple |
| 301+ | Hazardous | Dark Red |
