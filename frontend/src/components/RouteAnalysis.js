import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RouteAnalysis = ({ route, source, destination }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (route && source && destination) {
      fetchAnalysis();
    }
  }, [route, source, destination]);

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/route-aqi-analysis', {
        params: {
          source_lat: source.lat,
          source_lng: source.lng,
          dest_lat: destination.lat,
          dest_lng: destination.lng
        }
      });
      setAnalysis(response.data);
    } catch (error) {
      console.error('Failed to fetch route analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAQIColor = (aqi) => {
    if (aqi <= 50) return '#22c55e';
    if (aqi <= 100) return '#eab308';
    if (aqi <= 150) return '#f97316';
    if (aqi <= 200) return '#ef4444';
    if (aqi <= 300) return '#a855f7';
    return '#7f1d1d';
  };

  const getAQILabel = (aqi) => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-4 mt-4">
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Analyzing route pollution...</span>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 mt-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Detailed Route Analysis</h3>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="bg-gray-50 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-500">Distance</p>
          <p className="font-semibold">{analysis.route_summary.distance_km} km</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-500">Duration</p>
          <p className="font-semibold">{analysis.route_summary.duration_min} min</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-500">Avg AQI</p>
          <p className="font-semibold" style={{ color: getAQIColor(analysis.route_summary.avg_aqi) }}>
            {Math.round(analysis.route_summary.avg_aqi)}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-500">Max AQI</p>
          <p className="font-semibold" style={{ color: getAQIColor(analysis.route_summary.max_aqi) }}>
            {Math.round(analysis.route_summary.max_aqi)}
          </p>
        </div>
      </div>

      {/* AQI Visualization */}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Route AQI Profile</p>
        <div className="flex h-8 rounded-lg overflow-hidden">
          {analysis.segments.map((segment, idx) => {
            const width = `${100 / analysis.segments.length}%`;
            return (
              <div
                key={idx}
                style={{ 
                  width, 
                  backgroundColor: getAQIColor(segment.aqi),
                  minWidth: '4px'
                }}
                title={`AQI: ${Math.round(segment.aqi)} - ${segment.aqi_category}`}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Start</span>
          <span>End</span>
        </div>
      </div>

      {/* Pollution Hotspots */}
      {analysis.pollution_hotspots.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">⚠️ Pollution Hotspots Detected</p>
          <div className="space-y-2">
            {analysis.pollution_hotspots.slice(0, 3).map((hotspot, idx) => (
              <div key={idx} className="bg-red-50 border border-red-200 rounded-lg p-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-red-800">
                    {Array.isArray(hotspot.name) ? hotspot.name.join(', ') : hotspot.name}
                  </span>
                  <span 
                    className="text-sm font-bold px-2 py-1 rounded"
                    style={{ 
                      backgroundColor: getAQIColor(hotspot.aqi),
                      color: 'white'
                    }}
                  >
                    AQI {Math.round(hotspot.aqi)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Segment Details */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Segment Details</p>
        <div className="max-h-48 overflow-y-auto space-y-1">
          {analysis.segments.slice(0, 10).map((segment, idx) => (
            <div key={idx} className="flex items-center justify-between py-1 px-2 bg-gray-50 rounded text-sm">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getAQIColor(segment.aqi) }}
                />
                <span className="text-gray-600 capitalize">{segment.area_type.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center space-x-2">
                {segment.pollution_sources.length > 0 && (
                  <span className="text-xs text-red-600">
                    ⚠️ {segment.pollution_sources.length} sources
                  </span>
                )}
                <span 
                  className="font-medium px-2 py-0.5 rounded text-xs"
                  style={{ 
                    backgroundColor: getAQIColor(segment.aqi) + '20',
                    color: getAQIColor(segment.aqi)
                  }}
                >
                  {Math.round(segment.aqi)}
                </span>
              </div>
            </div>
          ))}
          {analysis.segments.length > 10 && (
            <p className="text-xs text-gray-500 text-center py-1">
              + {analysis.segments.length - 10} more segments
            </p>
          )}
        </div>
      </div>

      {/* Health Recommendations */}
      <div className="mt-4 bg-blue-50 rounded-lg p-3">
        <p className="text-sm font-medium text-blue-800 mb-1">💡 Recommendations</p>
        <ul className="text-sm text-blue-700 space-y-1">
          {analysis.route_summary.avg_aqi > 150 && (
            <li>• Consider alternative transportation or timing</li>
          )}
          {analysis.route_summary.avg_aqi > 100 && (
            <li>• Wear an N95 mask if walking or cycling</li>
          )}
          {analysis.pollution_hotspots.length > 0 && (
            <li>• Avoid areas near industrial zones during peak hours</li>
          )}
          {analysis.route_summary.avg_aqi <= 100 && (
            <li>• Route is relatively clean - safe for all travelers</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default RouteAnalysis;
