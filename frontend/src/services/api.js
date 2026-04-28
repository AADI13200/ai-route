import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const routeApi = {
  getRoutes: async (source, destination, user_id = 'default', fitness_mode = false, transport_mode = 'driving') => {
    const response = await api.post('/get-routes', {
      source,
      destination,
      user_id,
      fitness_mode,
      transport_mode
    });
    return response.data;
  }
};

export const aqiApi = {
  predictAQI: async (data) => {
    const response = await api.post('/predict-aqi', data);
    return response.data;
  },

  getWeatherAQI: async (lat, lng) => {
    const response = await api.get('/weather-aqi', {
      params: { lat, lng }
    });
    return response.data;
  }
};

export const riskApi = {
  calculateRisk: async (aqi, exposure_time_minutes, health_profile) => {
    const response = await api.post('/calculate-risk', {
      aqi,
      exposure_time_minutes,
      health_profile
    });
    return response.data;
  }
};

export const profileApi = {
  updateProfile: async (user_id, health_profile, preferences = {}) => {
    const response = await api.post('/user-profile', {
      user_id,
      health_profile,
      preferences
    });
    return response.data;
  },

  getProfile: async (user_id) => {
    const response = await api.get(`/user-profile/${user_id}`);
    return response.data;
  }
};

export default api;
