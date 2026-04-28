import React, { useEffect, useRef, useState } from 'react';

const Map = ({ 
  routes = [], 
  selectedRoute = null,
  onMapClick = null,
  markers = [],
  center = [20.5937, 78.9629],
  zoom = 5
}) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const routeLayers = useRef([]);
  const markerLayers = useRef([]);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState(null);

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
        zoomControl: true,
        attributionControl: true,
        minZoom: 3,
        maxZoom: 19
      }).setView(center, zoom);

      // Add OpenStreetMap tiles (most reliable)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(mapInstance.current);

      // Handle clicks
      if (onMapClick) {
        mapInstance.current.on('click', (e) => {
          onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
        });
      }

      // Invalidate size after a short delay to ensure proper rendering
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
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 3px 10px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 14px;
          font-weight: bold;
        ">${marker.type === 'source' ? 'A' : 'B'}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const markerLayer = L.marker([marker.lat, marker.lng], { icon: customIcon })
        .addTo(mapInstance.current)
        .bindPopup(`<b>${marker.label}</b>`);
      
      markerLayers.current.push(markerLayer);
    });

    // Fit bounds to show all markers
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
      mapInstance.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
    }
  }, [markers, mapReady]);

  // Update routes
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;

    const L = window.L;

    // Clear old routes
    routeLayers.current.forEach(layer => layer.remove());
    routeLayers.current = [];

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
      
      const layer = L.polyline(latlngs, {
        color: isSelected ? color : '#64748b',
        weight: isSelected ? 6 : 4,
        opacity: isSelected ? 1 : 0.6,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(mapInstance.current);

      // Add popup
      const dist = (route.distance_meters / 1000).toFixed(1);
      const dur = Math.round(route.duration_seconds / 60);
      const aqi = Math.round(route.avg_aqi || 50);
      
      layer.bindPopup(`
        <div style="font-family: sans-serif;">
          <b style="font-size: 14px; text-transform: capitalize;">${routeType}</b><br/>
          <span style="font-size: 12px; color: #666;">${dist} km • ${dur} min</span><br/>
          <span style="font-size: 12px;">AQI: ${aqi}</span>
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
  }, [routes, selectedRoute, mapReady]);

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
    <div 
      ref={mapRef} 
      style={{ 
        width: '100%', 
        height: '100%',
        background: '#e5e7eb',
        borderRadius: '12px'
      }} 
    />
  );
};

export default Map;
