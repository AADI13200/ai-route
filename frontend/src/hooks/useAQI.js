import { useState, useCallback } from 'react';
import { aqiApi } from '../services/api';

export const useAQI = () => {
  const [prediction, setPrediction] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const predictAQI = useCallback(async (params) => {
    setLoading(true);
    setError(null);

    try {
      const data = await aqiApi.predictAQI(params);
      setPrediction(data);
      return data;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to predict AQI';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWeatherAQI = useCallback(async (lat, lng) => {
    setLoading(true);
    setError(null);

    try {
      const data = await aqiApi.getWeatherAQI(lat, lng);
      setWeatherData(data);
      return data;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to fetch weather/AQI';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearPrediction = useCallback(() => {
    setPrediction(null);
    setWeatherData(null);
    setError(null);
  }, []);

  return {
    prediction,
    weatherData,
    loading,
    error,
    predictAQI,
    fetchWeatherAQI,
    clearPrediction
  };
};

export default useAQI;
