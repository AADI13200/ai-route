import React, { useState } from 'react';
import { aqiApi } from '../services/api';

const AQIPredictor = () => {
  const [params, setParams] = useState({
    temperature: 25,
    humidity: 60,
    wind_speed: 10,
    pressure: 1013,
    historical_aqi: 80
  });
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await aqiApi.predictAQI(params);
      setResult(data);
    } catch (err) {
      setError('Failed to predict AQI. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getAQIColor = (aqi) => {
    if (aqi <= 50) return 'bg-green-500';
    if (aqi <= 100) return 'bg-yellow-500';
    if (aqi <= 150) return 'bg-orange-500';
    if (aqi <= 200) return 'bg-red-500';
    if (aqi <= 300) return 'bg-purple-500';
    return 'bg-red-900';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">AI AQI Predictor</h3>
      <p className="text-sm text-gray-500 mb-4">
        Predict Air Quality Index using machine learning based on weather conditions.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Temperature (°C)
          </label>
          <input
            type="number"
            value={params.temperature}
            onChange={(e) => setParams({ ...params, temperature: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Humidity (%)
          </label>
          <input
            type="number"
            value={params.humidity}
            onChange={(e) => setParams({ ...params, humidity: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Wind Speed (km/h)
          </label>
          <input
            type="number"
            value={params.wind_speed}
            onChange={(e) => setParams({ ...params, wind_speed: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Pressure (hPa)
          </label>
          <input
            type="number"
            value={params.pressure}
            onChange={(e) => setParams({ ...params, pressure: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Historical AQI
          </label>
          <input
            type="number"
            value={params.historical_aqi}
            onChange={(e) => setParams({ ...params, historical_aqi: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
      </div>

      <button
        onClick={handlePredict}
        disabled={loading}
        className="w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50"
      >
        {loading ? 'Predicting...' : 'Predict AQI'}
      </button>

      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}

      {result && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">Predicted AQI</span>
            <span className={`text-3xl font-bold text-white w-16 h-16 rounded-full flex items-center justify-center ${getAQIColor(result.predicted_aqi)}`}>
              {Math.round(result.predicted_aqi)}
            </span>
          </div>
          <div className="space-y-1 text-sm">
            <p><strong>Category:</strong> {result.category}</p>
            <p className="text-gray-600">{result.description}</p>
            <p className="text-gray-500 text-xs">{result.health_implications}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AQIPredictor;
