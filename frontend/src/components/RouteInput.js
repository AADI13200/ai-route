import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const RouteInput = ({ onCalculate, loading }) => {
  const { fitnessMode, toggleFitnessMode, transportMode, setTransport } = useApp();
  
  const [source, setSource] = useState({ lat: '', lng: '', name: '' });
  const [destination, setDestination] = useState({ lat: '', lng: '', name: '' });
  const [errors, setErrors] = useState({});

  const transportModes = [
    { id: 'driving', name: 'Driving', icon: '🚗' },
    { id: 'cycling', name: 'Cycling', icon: '🚴' },
    { id: 'walking', name: 'Walking', icon: '🚶' }
  ];

  // Sample locations for demo - Pune, India
  const sampleLocations = [
    { name: 'Shaniwar Wada, Pune', lat: 18.5195, lng: 73.8553 },
    { name: 'Aga Khan Palace, Pune', lat: 18.5515, lng: 73.9008 },
    { name: 'Sinhagad Fort, Pune', lat: 18.3660, lng: 73.7558 },
    { name: 'Koregaon Park, Pune', lat: 18.5368, lng: 73.8933 },
    { name: 'Hinjewadi, Pune', lat: 18.5971, lng: 73.7180 },
    { name: 'Camp (MG Road), Pune', lat: 18.5186, lng: 73.8796 },
    { name: 'Katraj, Pune', lat: 18.4529, lng: 73.8652 },
    { name: 'Baner, Pune', lat: 18.5590, lng: 73.7868 },
    { name: 'Wakad, Pune', lat: 18.6242, lng: 73.7281 },
    { name: 'Magarpatta, Pune', lat: 18.5135, lng: 73.9288 }
  ];

  const validate = () => {
    const newErrors = {};
    
    if (!source.lat || !source.lng) {
      newErrors.source = 'Please enter source coordinates';
    }
    if (!destination.lat || !destination.lng) {
      newErrors.destination = 'Please enter destination coordinates';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onCalculate(
        { lat: parseFloat(source.lat), lng: parseFloat(source.lng) },
        { lat: parseFloat(destination.lat), lng: parseFloat(destination.lng) }
      );
    }
  };

  const handleQuickSelect = (type, location) => {
    if (type === 'source') {
      setSource({
        name: location.name,
        lat: location.lat.toString(),
        lng: location.lng.toString()
      });
    } else {
      setDestination({
        name: location.name,
        lat: location.lat.toString(),
        lng: location.lng.toString()
      });
    }
  };

  const swapLocations = () => {
    const temp = source;
    setSource(destination);
    setDestination(temp);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Plan Your Route</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Source Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Source Location
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              step="any"
              placeholder="Latitude"
              value={source.lat}
              onChange={(e) => setSource({ ...source, lat: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="number"
              step="any"
              placeholder="Longitude"
              value={source.lng}
              onChange={(e) => setSource({ ...source, lng: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {source.name && (
            <p className="text-sm text-green-600 mt-1">{source.name}</p>
          )}
          {errors.source && (
            <p className="text-sm text-red-600 mt-1">{errors.source}</p>
          )}
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={swapLocations}
            className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
            title="Swap locations"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>

        {/* Destination Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Destination Location
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              step="any"
              placeholder="Latitude"
              value={destination.lat}
              onChange={(e) => setDestination({ ...destination, lat: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="number"
              step="any"
              placeholder="Longitude"
              value={destination.lng}
              onChange={(e) => setDestination({ ...destination, lng: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {destination.name && (
            <p className="text-sm text-green-600 mt-1">{destination.name}</p>
          )}
          {errors.destination && (
            <p className="text-sm text-red-600 mt-1">{errors.destination}</p>
          )}
        </div>

        {/* Transport Mode */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Transport Mode
          </label>
          <div className="flex space-x-2">
            {transportModes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setTransport(mode.id)}
                className={`
                  flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg border-2 transition-all
                  ${transportMode === mode.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }
                `}
              >
                <span>{mode.icon}</span>
                <span className="text-sm font-medium">{mode.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Fitness Mode Toggle */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🏃</span>
            <div>
              <p className="font-medium text-gray-800">Fitness Mode</p>
              <p className="text-sm text-gray-500">Prioritize clean air routes</p>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleFitnessMode}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors
              ${fitnessMode ? 'bg-green-500' : 'bg-gray-300'}
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${fitnessMode ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
        </div>

        {/* Quick Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quick Select (Pune Locations)
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <select
              onChange={(e) => {
                const loc = sampleLocations.find(l => l.name === e.target.value);
                if (loc) handleQuickSelect('source', loc);
              }}
              className="p-2 border border-gray-300 rounded-lg"
              value=""
            >
              <option value="">Set Source...</option>
              {sampleLocations.map(loc => (
                <option key={loc.name} value={loc.name}>{loc.name}</option>
              ))}
            </select>
            <select
              onChange={(e) => {
                const loc = sampleLocations.find(l => l.name === e.target.value);
                if (loc) handleQuickSelect('destination', loc);
              }}
              className="p-2 border border-gray-300 rounded-lg"
              value=""
            >
              <option value="">Set Destination...</option>
              {sampleLocations.map(loc => (
                <option key={loc.name} value={loc.name}>{loc.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`
            w-full py-3 px-4 rounded-lg font-semibold text-white transition-all
            ${loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 shadow-lg hover:shadow-xl'
            }
          `}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Calculating Routes...
            </span>
          ) : (
            'Find Routes'
          )}
        </button>
      </form>
    </div>
  );
};

export default RouteInput;
