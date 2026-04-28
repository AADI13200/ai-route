import React from 'react';

const RouteCard = ({ route, isSelected, onSelect }) => {
  if (!route) return null;

  const { 
    route_type, 
    distance_meters, 
    duration_seconds, 
    avg_aqi, 
    max_aqi, 
    risk_score,
    description 
  } = route;

  // Format values
  const distance = (distance_meters / 1000).toFixed(1);
  const duration = Math.round(duration_seconds / 60);
  const aqiValue = Math.round(avg_aqi);

  // Get AQI category styles
  const getAQIStyles = (aqi) => {
    if (aqi <= 50) return { bg: 'bg-green-500', text: 'text-green-600', label: 'Good' };
    if (aqi <= 100) return { bg: 'bg-yellow-500', text: 'text-yellow-600', label: 'Moderate' };
    if (aqi <= 150) return { bg: 'bg-orange-500', text: 'text-orange-600', label: 'Unhealthy for Sensitive' };
    if (aqi <= 200) return { bg: 'bg-red-500', text: 'text-red-600', label: 'Unhealthy' };
    if (aqi <= 300) return { bg: 'bg-purple-500', text: 'text-purple-600', label: 'Very Unhealthy' };
    return { bg: 'bg-red-900', text: 'text-red-800', label: 'Hazardous' };
  };

  const aqiStyles = getAQIStyles(aqiValue);

  // Get route type styles
  const getRouteTypeStyles = (type) => {
    switch (type) {
      case 'cleanest':
        return { 
          icon: '🌿', 
          color: 'border-green-500 bg-green-50',
          badge: 'bg-green-100 text-green-800'
        };
      case 'fastest':
        return { 
          icon: '⚡', 
          color: 'border-blue-500 bg-blue-50',
          badge: 'bg-blue-100 text-blue-800'
        };
      case 'balanced':
        return { 
          icon: '⚖️', 
          color: 'border-amber-500 bg-amber-50',
          badge: 'bg-amber-100 text-amber-800'
        };
      default:
        return { 
          icon: '📍', 
          color: 'border-gray-500 bg-gray-50',
          badge: 'bg-gray-100 text-gray-800'
        };
    }
  };

  const typeStyles = getRouteTypeStyles(route_type);

  // Get risk level
  const getRiskLevel = (score) => {
    if (score < 1000) return { level: 'Low', color: 'text-green-600' };
    if (score < 3000) return { level: 'Moderate', color: 'text-yellow-600' };
    if (score < 6000) return { level: 'High', color: 'text-orange-600' };
    return { level: 'Very High', color: 'text-red-600' };
  };

  const riskInfo = getRiskLevel(risk_score);

  return (
    <div
      onClick={onSelect}
      className={`
        relative rounded-xl border-2 p-4 cursor-pointer transition-all duration-300
        ${typeStyles.color}
        ${isSelected 
          ? 'ring-2 ring-offset-2 ring-blue-500 shadow-lg scale-[1.02]' 
          : 'hover:shadow-md hover:scale-[1.01]'
        }
      `}
    >
      {/* Route Type Badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{typeStyles.icon}</span>
          <div>
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${typeStyles.badge}`}>
              {route_type.charAt(0).toUpperCase() + route_type.slice(1)}
            </span>
          </div>
        </div>
        {isSelected && (
          <span className="text-blue-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-4">{description}</p>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Distance */}
        <div className="bg-white/70 rounded-lg p-2">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Distance</p>
          <p className="text-lg font-semibold text-gray-800">{distance} km</p>
        </div>

        {/* Duration */}
        <div className="bg-white/70 rounded-lg p-2">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Time</p>
          <p className="text-lg font-semibold text-gray-800">{duration} min</p>
        </div>
      </div>

      {/* AQI Display */}
      <div className="bg-white rounded-lg p-3 mb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Avg AQI</p>
            <p className={`text-2xl font-bold ${aqiStyles.text}`}>{aqiValue}</p>
            <p className="text-xs text-gray-600">{aqiStyles.label}</p>
          </div>
          <div className={`w-16 h-16 rounded-full ${aqiStyles.bg} flex items-center justify-center text-white font-bold text-lg`}>
            {aqiValue}
          </div>
        </div>
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${aqiStyles.bg}`}
              style={{ width: `${Math.min((aqiValue / 300) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Max AQI: {Math.round(max_aqi)}</p>
        </div>
      </div>

      {/* Risk Score */}
      <div className="bg-slate-100 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Exposure Risk</p>
            <p className={`text-lg font-bold ${riskInfo.color}`}>{riskInfo.level}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-700">{Math.round(risk_score)}</p>
            <p className="text-xs text-gray-500">Risk Score</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteCard;
