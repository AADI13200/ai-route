# PurePath - AI-Powered Pollution-Aware Route Planning System

PurePath helps you breathe cleaner air while navigating. Find the healthiest routes based on real-time Air Quality Index (AQI), personalized for your health conditions.

**Location: Pune, India** - Optimized for local air quality conditions and road networks.

## Features

### Core Features
- **Pollution-Aware Routing**: Integrates real-time AQI data into route calculations
- **AI AQI Prediction**: ML-powered AQI forecasting using weather data
- **Health Profile System**: Personalized routing for Normal, Asthma, Cardiac, Elderly, Child conditions
- **Exposure Risk Score**: Calculates risk based on AQI × time × health weight
- **Route Comparison**: Compare cleanest, fastest, and balanced routes
- **Fitness Mode**: Low-pollution routes for walking/running

### NEW: Hybrid Routing with Google Maps + AI
- **Real Road Network**: Google Maps Routes API for accurate road data and traffic
- **AI Route Analysis**: LLM-powered route recommendations and health guidance
- **Smart Navigation**: AI-enhanced turn-by-turn instructions with AQI alerts
- **Intelligent Comparison**: AI recommends optimal route based on user priority
- **Fallback System**: Local AQI engine when APIs unavailable

## Tech Stack

- **Frontend**: React.js + Tailwind CSS + Leaflet Maps
- **Backend**: Python FastAPI
- **ML**: Scikit-learn, Pandas, NumPy
- **AI/LLM**: Google Gemini API
- **Maps**: Google Maps Routes API
- **Database**: MongoDB
- **APIs**: OpenWeather API, Open-Meteo

## Project Structure

```
nebulax/
├── frontend/          # React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── hooks/         # Custom React hooks
│   └── public/
├── backend/           # FastAPI server
│   └── main.py        # Main API endpoints
├── ml_model/          # ML training & prediction
│   ├── train_aqi_model.py
│   └── predict_aqi.py
├── api/               # API integrations
│   ├── google_maps_service.py   # Google Maps Routes API
│   ├── llm_service.py            # Google Gemini LLM
│   └── weather_service.py        # Weather/AQI APIs
├── utils/             # Helper utilities
│   ├── routing_engine.py         # Ultra-precise local routing
│   ├── hybrid_routing_engine.py  # Hybrid Google Maps + AI routing
│   └── exposure_calculator.py
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 16+
- Python 3.9+
- MongoDB (local or Atlas)
- OpenWeather API key

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
# Create .env file with your API keys
uvicorn main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

### Environment Variables

Create `backend/.env`:

```env
# Required
OPENWEATHER_API_KEY=your_api_key_here
MONGODB_URI=mongodb://localhost:27017/nebulax
SECRET_KEY=your-secret-key-here

# Optional - For Hybrid Routing
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

## API Endpoints

### Core Endpoints
- `POST /get-routes` - Get pollution-aware routes
- `POST /predict-aqi` - Predict AQI using ML model
- `POST /calculate-risk` - Calculate exposure risk score
- `POST /user-profile` - Manage user health profiles

### Hybrid Routing Endpoints (NEW)
- `POST /get-hybrid-routes` - AI-enhanced routes with Google Maps + AQI + LLM
  ```json
  {
    "source": {"lat": 18.5204, "lng": 73.8567},
    "destination": {"lat": 18.525, "lng": 73.86},
    "health_profile": "normal",
    "priority": "health|speed|balanced"
  }
  ```
- `POST /get-navigation-guidance` - AI-enhanced turn-by-turn instructions
- `GET /routing-status` - Check API configuration status

## Hybrid Routing Features

The new hybrid routing system combines:

1. **Google Maps Routes API** - Real road network and traffic data
2. **Local AQI Engine** - 1,383+ nodes covering Pune with pollution modeling
3. **Google Gemini LLM** - Intelligent route analysis and recommendations

### Priority Modes
- **health**: Minimizes AQI exposure for sensitive users
- **speed**: Fastest travel time
- **balanced**: Optimal trade-off (default)

### AI Analysis Features
When LLM is configured, routes include:
- Route summary with health assessment
- AQI warnings and precautions
- Personalized recommendations
- Enhanced turn instructions with AQI alerts

## License

MIT License
