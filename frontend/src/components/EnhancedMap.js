import React, { useEffect, useRef, useState, useCallback } from 'react';

// Generate realistic AQI hotspot data along and around routes
const generateAQIHotspots = (routes) => {
  const hotspots = [];
  
  routes.forEach(route => {
    if (!route.path || route.path.length < 2) return;
    
    // Generate hotspots along the route path
    const path = route.path;
    const numHotspots = Math.min(path.length - 1, 8);
    
    for (let i = 0; i < numHotspots; i++) {
      const idx = Math.floor((i / numHotspots) * (path.length - 1));
      const point = path[idx];
      
      // Offset slightly for visual variety
      const latOffset = (Math.random() - 0.5) * 0.003;
      const lngOffset = (Math.random() - 0.5) * 0.003;
      
      // AQI varies: high near industrial, low near parks
      const baseAQI = route.avg_aqi || 100;
      const variation = Math.floor(Math.random() * 60) - 30;
      const aqi = Math.max(20, Math.min(300, baseAQI + variation));
      
      hotspots.push({
        lat: point.lat + latOffset,
        lng: point.lng + lngOffset,
        aqi: aqi,
        radius: 300 + Math.random() * 400,
        type: aqi > 150 ? 'high' : aqi > 100 ? 'moderate' : 'low'
      });
    }
  });
  
  return hotspots;
};

// Generate POI markers near routes
const generatePOIs = (center, routes) => {
  const poiTypes = [
    { type: 'hospital', icon: '🏥', label: 'Hospital', color: '#ef4444' },
    { type: 'park', icon: '🌳', label: 'Park', color: '#22c55e' },
    { type: 'pharmacy', icon: '💊', label: 'Pharmacy', color: '#3b82f6' },
    { type: 'school', icon: '🏫', label: 'School', color: '#f59e0b' },
  ];
  
  const pois = [];
  
  // Get center point from routes or use provided center
  let baseLat = center[0];
  let baseLng = center[1];
  
  if (routes.length > 0 && routes[0].path && routes[0].path.length > 0) {
    const midPoint = routes[0].path[Math.floor(routes[0].path.length / 2)];
    baseLat = midPoint.lat;
    baseLng = midPoint.lng;
  }
  
  for (let i = 0; i < 6; i++) {
    const poiType = poiTypes[i % poiTypes.length];
    const angle = (i / 6) * 2 * Math.PI;
    const distance = 0.003 + Math.random() * 0.005;
    
    pois.push({
      lat: baseLat + Math.sin(angle) * distance,
      lng: baseLng + Math.cos(angle) * distance,
      ...poiType,
      name: `${poiType.label} ${i + 1}`
    });
  }
  
  return pois;
};

// Generate weather markers
const generateWeatherMarkers = (routes) => {
  if (!routes.length || !routes[0].path) return [];
  
  const weatherConditions = [
    { condition: 'sunny', icon: '☀️', temp: '32°C' },
    { condition: 'cloudy', icon: '☁️', temp: '29°C' },
    { condition: 'hazy', icon: '🌫️', temp: '30°C' },
  ];
  
  const markers = [];
  const path = routes[0].path;
  const step = Math.floor(path.length / 3);
  
  for (let i = 0; i < 3; i++) {
    const idx = Math.min(i * step, path.length - 1);
    markers.push({
      lat: path[idx].lat,
      lng: path[idx].lng,
      ...weatherConditions[i]
    });
  }
  
  return markers;
};

const TILE_LAYERS = {
  roadmap: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    name: 'OpenStreetMap'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri',
    name: 'Satellite'
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap contributors',
    name: 'Terrain'
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    name: 'Dark Mode'
  }
};

const EnhancedMap = ({ 
  routes = [], 
  selectedRoute = null,
  onMapClick = null,
  markers = [],
  center = [20.5937, 78.9629],
  zoom = 5,
  mapType = 'roadmap',
  showAQI = true,
  showPOI = true,
  showWeather = true,
  showTraffic = false
}) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const tileLayerRef = useRef(null);
  const routeLayers = useRef([]);
  const markerLayers = useRef([]);
  const aqiLayers = useRef([]);
  const poiLayers = useRef([]);
  const weatherLayers = useRef([]);
  const trafficLayers = useRef([]);
  const animatedLayers = useRef([]);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLayers, setShowLayers] = useState({
    aqi: showAQI,
    poi: showPOI,
    weather: showWeather,
    traffic: showTraffic
  });

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    if (typeof window.L === 'undefined') {
      setError('Leaflet not loaded');
      return;
    }

    try {
      const L = window.L;

      // Create map
      mapInstance.current = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: true,
        minZoom: 3,
        maxZoom: 19
      }).setView(center, zoom);

      // Add zoom control to top-right
      L.control.zoom({
        position: 'topright'
      }).addTo(mapInstance.current);

      // Add tile layer
      const layerConfig = TILE_LAYERS[mapType] || TILE_LAYERS.roadmap;
      tileLayerRef.current = L.tileLayer(layerConfig.url, {
        attribution: layerConfig.attribution,
        maxZoom: 19,
        subdomains: 'abc'
      }).addTo(mapInstance.current);

      // Handle clicks
      if (onMapClick) {
        mapInstance.current.on('click', (e) => {
          onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
        });
      }

      // Add scale control
      L.control.scale({
        position: 'bottomleft',
        metric: true,
        imperial: false
      }).addTo(mapInstance.current);

      // Invalidate size after a short delay
      setTimeout(() => {
        if (mapInstance.current) {
          mapInstance.current.invalidateSize();
          setMapReady(true);
        }
      }, 100);

    } catch (err) {
      setError('Failed to initialize map: ' + err.message);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Update tile layer when mapType changes
  useEffect(() => {
    if (!mapInstance.current || !mapReady || !tileLayerRef.current) return;
    
    const L = window.L;
    const layerConfig = TILE_LAYERS[mapType] || TILE_LAYERS.roadmap;
    
    tileLayerRef.current.setUrl(layerConfig.url);
  }, [mapType, mapReady]);

  // Update center when it changes
  useEffect(() => {
    if (mapInstance.current && center && mapReady) {
      mapInstance.current.setView(center, zoom);
    }
  }, [center, zoom, mapReady]);

  // Update markers
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;

    const L = window.L;

    // Clear old markers
    markerLayers.current.forEach(layer => layer.remove());
    markerLayers.current = [];

    // Add new markers
    markers.forEach(marker => {
      const color = marker.type === 'source' ? '#22c55e' : '#ef4444';
      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          background: ${color};
          width: 36px;
          height: 36px;
          border-radius: 50% 50% 50% 0;
          border: 3px solid white;
          box-shadow: 0 4px 15px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 14px;
          font-weight: bold;
          transform: rotate(-45deg);
        ">${marker.type === 'source' ? 'A' : 'B'}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36]
      });

      const markerLayer = L.marker([marker.lat, marker.lng], { icon: customIcon })
        .addTo(mapInstance.current)
        .bindPopup(`<div style="font-family: sans-serif; padding: 5px;"><b style="font-size: 15px;">${marker.label}</b><br/><span style="font-size: 12px; color: #666;">${marker.type === 'source' ? 'Starting Point' : 'Destination'}</span></div>`);
      
      markerLayers.current.push(markerLayer);
    });

    // Fit bounds to show all markers
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
      mapInstance.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
    }
  }, [markers, mapReady]);

  // Update AQI heatmap
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;

    const L = window.L;

    // Clear old AQI layers
    aqiLayers.current.forEach(layer => layer.remove());
    aqiLayers.current = [];

    if (!showLayers.aqi || routes.length === 0) return;

    const hotspots = generateAQIHotspots(routes);
    
    hotspots.forEach(spot => {
      const getColor = (aqi) => {
        if (aqi <= 50) return '#22c55e';
        if (aqi <= 100) return '#f59e0b';
        if (aqi <= 150) return '#f97316';
        if (aqi <= 200) return '#ef4444';
        return '#7c3aed';
      };

      const circle = L.circle([spot.lat, spot.lng], {
        radius: spot.radius,
        fillColor: getColor(spot.aqi),
        color: getColor(spot.aqi),
        weight: 1,
        opacity: 0.3,
        fillOpacity: 0.15
      }).addTo(mapInstance.current);

      circle.bindPopup(`
        <div style="font-family: sans-serif;">
          <b>AQI: ${spot.aqi}</b><br/>
          <span style="font-size: 11px; color: #666;">Pollution Level: ${spot.type.toUpperCase()}</span>
        </div>
      `);

      aqiLayers.current.push(circle);
    });
  }, [routes, showLayers.aqi, mapReady]);

  // Update POI markers
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;

    const L = window.L;

    // Clear old POI layers
    poiLayers.current.forEach(layer => layer.remove());
    poiLayers.current = [];

    if (!showLayers.poi || routes.length === 0) return;

    const pois = generatePOIs(center, routes);
    
    pois.forEach(poi => {
      const customIcon = L.divIcon({
        className: 'poi-marker',
        html: `<div style="
          background: ${poi.color};
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        ">${poi.icon}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([poi.lat, poi.lng], { icon: customIcon })
        .addTo(mapInstance.current)
        .bindPopup(`<div style="font-family: sans-serif;"><b>${poi.name}</b></div>`);

      poiLayers.current.push(marker);
    });
  }, [routes, showLayers.poi, center, mapReady]);

  // Update weather markers
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;

    const L = window.L;

    // Clear old weather layers
    weatherLayers.current.forEach(layer => layer.remove());
    weatherLayers.current = [];

    if (!showLayers.weather || routes.length === 0) return;

    const weatherMarkers = generateWeatherMarkers(routes);
    
    weatherMarkers.forEach(w => {
      const customIcon = L.divIcon({
        className: 'weather-marker',
        html: `<div style="
          background: rgba(255,255,255,0.95);
          padding: 4px 8px;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          font-weight: 600;
          font-family: sans-serif;
          white-space: nowrap;
        "><span style="font-size: 16px;">${w.icon}</span> ${w.temp}</div>`,
        iconSize: [60, 28],
        iconAnchor: [30, 14]
      });

      const marker = L.marker([w.lat, w.lng], { icon: customIcon })
        .addTo(mapInstance.current)
        .bindPopup(`<div style="font-family: sans-serif;"><b>Weather:</b> ${w.condition}<br/><b>Temperature:</b> ${w.temp}</div>`);

      weatherLayers.current.push(marker);
    });
  }, [routes, showLayers.weather, mapReady]);

  // Update traffic simulation
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;

    // Clear old traffic layers
    trafficLayers.current.forEach(layer => layer.remove());
    trafficLayers.current = [];

    if (!showLayers.traffic || routes.length === 0) return;

    const L = window.L;
    const path = routes[0]?.path || [];
    if (path.length < 2) return;

    // Simulate traffic with colored segments
    for (let i = 0; i < path.length - 1; i++) {
      const trafficLevel = Math.random();
      let color = '#22c55e'; // Green - low traffic
      let weight = 3;
      
      if (trafficLevel > 0.7) {
        color = '#ef4444'; // Red - heavy traffic
        weight = 5;
      } else if (trafficLevel > 0.4) {
        color = '#f59e0b'; // Orange - moderate
        weight = 4;
      }

      const segment = L.polyline(
        [[path[i].lat, path[i].lng], [path[i + 1].lat, path[i + 1].lng]],
        {
          color: color,
          weight: weight,
          opacity: 0.6,
          dashArray: '5, 10'
        }
      ).addTo(mapInstance.current);

      trafficLayers.current.push(segment);
    }
  }, [routes, showLayers.traffic, mapReady]);

  // Update routes with animation
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;

    const L = window.L;

    // Clear old route layers and animated layers
    routeLayers.current.forEach(layer => layer.remove());
    routeLayers.current = [];
    animatedLayers.current.forEach(layer => layer.remove());
    animatedLayers.current = [];

    // Draw new routes
    routes.forEach((route) => {
      if (!route.path || route.path.length < 2) return;

      const routeType = route.route_type || route.id || 'balanced';
      const isSelected = selectedRoute === routeType;
      
      const colors = {
        cleanest: '#22c55e',
        fastest: '#3b82f6',
        balanced: '#f59e0b'
      };
      const color = colors[routeType] || '#64748b';
      
      const latlngs = route.path.map(p => [p.lat, p.lng]);
      
      // Shadow/glow effect for selected route
      if (isSelected) {
        const glowLayer = L.polyline(latlngs, {
          color: color,
          weight: 12,
          opacity: 0.15,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(mapInstance.current);
        routeLayers.current.push(glowLayer);
      }

      // Main route line
      const layer = L.polyline(latlngs, {
        color: isSelected ? color : '#64748b',
        weight: isSelected ? 6 : 3,
        opacity: isSelected ? 1 : 0.5,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(mapInstance.current);

      // Animated dashed line overlay for selected route
      if (isSelected) {
        const animatedLine = L.polyline(latlngs, {
          color: '#ffffff',
          weight: 2,
          opacity: 0.8,
          dashArray: '10, 15',
          dashOffset: '0',
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(mapInstance.current);
        
        // Add CSS animation via class
        if (animatedLine._path) {
          animatedLine._path.classList.add('animated-route-line');
        }
        
        animatedLayers.current.push(animatedLine);
      }

      // Add popup
      const dist = (route.distance_meters / 1000).toFixed(1);
      const dur = Math.round(route.duration_seconds / 60);
      const aqi = Math.round(route.avg_aqi || 50);
      
      layer.bindPopup(`
        <div style="font-family: sans-serif; min-width: 150px;">
          <b style="font-size: 14px; text-transform: capitalize; color: ${color};">${routeType}</b><br/>
          <span style="font-size: 12px; color: #666;">${dist} km • ${dur} min</span><br/>
          <span style="font-size: 12px;">AQI: <b>${aqi}</b></span><br/>
          <span style="font-size: 11px; color: ${isSelected ? color : '#666'};">${isSelected ? 'SELECTED' : 'Click to select'}</span>
        </div>
      `);

      routeLayers.current.push(layer);
    });

    // Fit bounds to show routes if no markers
    if (routes.length > 0 && markers.length === 0) {
      const allPoints = routes.flatMap(r => r.path || []);
      if (allPoints.length > 0) {
        const bounds = L.latLngBounds(allPoints.map(p => [p.lat, p.lng]));
        mapInstance.current.fitBounds(bounds, { padding: [60, 60] });
      }
    }
  }, [routes, selectedRoute, markers, mapReady]);

  // Handle fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    const container = mapRef.current?.parentElement;
    if (!container) return;
    
    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Current location
  const goToCurrentLocation = useCallback(() => {
    if (!mapInstance.current || !navigator.geolocation) return;
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        mapInstance.current.setView([latitude, longitude], 15);
        
        // Add a pulsing marker
        const L = window.L;
        const pulseIcon = L.divIcon({
          className: 'pulse-marker',
          html: `<div style="
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #3b82f6;
            border: 3px solid white;
            box-shadow: 0 0 0 0 rgba(59,130,246,0.7);
            animation: pulse-ring 2s infinite;
          "></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });
        
        L.marker([latitude, longitude], { icon: pulseIcon })
          .addTo(mapInstance.current)
          .bindPopup('Your Location');
      },
      (err) => console.error('Geolocation error:', err)
    );
  }, []);

  if (error) {
    return (
      <div style={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#1a1d29',
        borderRadius: '12px',
        color: '#ef4444'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 10 }}>⚠️</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '12px', overflow: 'hidden' }}>
      {/* Map Container */}
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          background: '#e5e7eb',
          borderRadius: '12px'
        }} 
      />
      
      {/* Map Controls Overlay */}
      {mapReady && (
        <>
          {/* Layer Toggle Panel */}
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            zIndex: 1000,
            background: 'rgba(11, 15, 25, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: '10px',
            padding: '8px',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <button
              onClick={() => setShowLayers(p => ({ ...p, aqi: !p.aqi }))}
              style={{
                background: showLayers.aqi ? 'rgba(34,197,94,0.2)' : 'transparent',
                border: `1px solid ${showLayers.aqi ? '#22c55e' : 'rgba(255,255,255,0.2)'}`,
                borderRadius: '6px',
                padding: '6px 10px',
                color: showLayers.aqi ? '#22c55e' : '#7589a8',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s'
              }}
              title="Toggle AQI Heatmap"
            >
              🌡️ AQI
            </button>
            <button
              onClick={() => setShowLayers(p => ({ ...p, poi: !p.poi }))}
              style={{
                background: showLayers.poi ? 'rgba(59,130,246,0.2)' : 'transparent',
                border: `1px solid ${showLayers.poi ? '#3b82f6' : 'rgba(255,255,255,0.2)'}`,
                borderRadius: '6px',
                padding: '6px 10px',
                color: showLayers.poi ? '#3b82f6' : '#7589a8',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s'
              }}
              title="Toggle Points of Interest"
            >
              📍 POI
            </button>
            <button
              onClick={() => setShowLayers(p => ({ ...p, weather: !p.weather }))}
              style={{
                background: showLayers.weather ? 'rgba(245,158,11,0.2)' : 'transparent',
                border: `1px solid ${showLayers.weather ? '#f59e0b' : 'rgba(255,255,255,0.2)'}`,
                borderRadius: '6px',
                padding: '6px 10px',
                color: showLayers.weather ? '#f59e0b' : '#7589a8',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s'
              }}
              title="Toggle Weather Overlay"
            >
              🌤️ Weather
            </button>
            <button
              onClick={() => setShowLayers(p => ({ ...p, traffic: !p.traffic }))}
              style={{
                background: showLayers.traffic ? 'rgba(239,68,68,0.2)' : 'transparent',
                border: `1px solid ${showLayers.traffic ? '#ef4444' : 'rgba(255,255,255,0.2)'}`,
                borderRadius: '6px',
                padding: '6px 10px',
                color: showLayers.traffic ? '#ef4444' : '#7589a8',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s'
              }}
              title="Toggle Traffic Simulation"
            >
              🚗 Traffic
            </button>
          </div>

          {/* Right-side controls */}
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {/* Current Location Button */}
            <button
              onClick={goToCurrentLocation}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(11, 15, 25, 0.9)',
                backdropFilter: 'blur(10px)',
                color: '#e2e8f8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                transition: 'all 0.2s'
              }}
              title="Go to Current Location"
            >
              📍
            </button>
            
            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(11, 15, 25, 0.9)',
                backdropFilter: 'blur(10px)',
                color: '#e2e8f8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
              title="Toggle Fullscreen"
            >
              {isFullscreen ? '⛶' : '⛶'}
            </button>
          </div>

          {/* AQI Legend */}
          {showLayers.aqi && (
            <div style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              zIndex: 1000,
              background: 'rgba(11, 15, 25, 0.9)',
              backdropFilter: 'blur(10px)',
              borderRadius: '10px',
              padding: '10px 14px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ fontSize: '11px', color: '#7589a8', marginBottom: '6px', fontWeight: 600 }}>AQI Heatmap</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {[
                  { color: '#22c55e', label: 'Good (0-50)', range: '0-50' },
                  { color: '#f59e0b', label: 'Moderate (51-100)', range: '51-100' },
                  { color: '#f97316', label: 'Unhealthy (101-150)', range: '101-150' },
                  { color: '#ef4444', label: 'Very Unhealthy (151-200)', range: '151-200' },
                  { color: '#7c3aed', label: 'Hazardous (200+)', range: '200+' }
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color }}></div>
                    <span style={{ fontSize: '10px', color: '#e2e8f8' }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Route info card */}
          {routes.length > 0 && (
            <div style={{
              position: 'absolute',
              bottom: '12px',
              right: '12px',
              zIndex: 1000,
              background: 'rgba(11, 15, 25, 0.9)',
              backdropFilter: 'blur(10px)',
              borderRadius: '10px',
              padding: '10px 14px',
              border: '1px solid rgba(255,255,255,0.1)',
              minWidth: '140px'
            }}>
              <div style={{ fontSize: '11px', color: '#7589a8', marginBottom: '6px', fontWeight: 600 }}>Route Overview</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {routes.map(route => {
                  const routeType = route.route_type || route.id || 'balanced';
                  const colors = { cleanest: '#22c55e', fastest: '#3b82f6', balanced: '#f59e0b' };
                  const color = colors[routeType] || '#64748b';
                  const isSel = selectedRoute === routeType;
                  return (
                    <div 
                      key={routeType}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        padding: '3px 6px',
                        borderRadius: '4px',
                        background: isSel ? `${color}20` : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => { /* Could emit selection event */ }}
                    >
                      <div style={{ width: '8px', height: '3px', borderRadius: '2px', background: color }}></div>
                      <span style={{ fontSize: '10px', color: '#e2e8f8', textTransform: 'capitalize' }}>{routeType}</span>
                      <span style={{ fontSize: '10px', color: '#7589a8', marginLeft: 'auto' }}>
                        {Math.round(route.avg_aqi || 50)} AQI
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EnhancedMap;
