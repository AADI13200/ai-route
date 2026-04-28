import React from 'react';

const RouteComparison = ({ routes, selectedRoute, onSelect }) => {
  if (!routes || routes.length < 2) return null;

  const getAQIColor = (aqi) => {
    if (aqi <= 50) return '#22c55e';
    if (aqi <= 100) return '#f59e0b';
    if (aqi <= 150) return '#f97316';
    if (aqi <= 200) return '#ef4444';
    return '#7c3aed';
  };

  const getAQILabel = (aqi) => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy';
    if (aqi <= 200) return 'Very Unhealthy';
    return 'Hazardous';
  };

  const maxTime = Math.max(...routes.map(r => r.time || 0));
  const maxDist = Math.max(...routes.map(r => parseFloat(r.dist) || 0));
  const maxAQI = Math.max(...routes.map(r => r.aqi || 0));

  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '18px',
      marginBottom: '14px',
      animation: 'fadeIn 0.4s ease 0.1s both'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px', 
        marginBottom: '16px',
        paddingBottom: '10px',
        borderBottom: '1px solid var(--border)'
      }}>
        <span style={{ fontSize: '20px' }}>📊</span>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 600 }}>Route Comparison</div>
          <div style={{ fontSize: '11px', color: '#7589a8' }}>Side-by-side analysis of all options</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {routes.map(route => {
          const routeType = route.id || route.route_type || 'balanced';
          const colors = {
            cleanest: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
            fastest: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
            balanced: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' }
          };
          const style = colors[routeType] || { color: '#64748b', bg: 'rgba(100,116,139,0.1)' };
          const isSelected = selectedRoute === routeType;
          const aqiColor = getAQIColor(route.aqi || 100);

          return (
            <div 
              key={routeType}
              onClick={() => onSelect?.(route)}
              style={{
                padding: '14px',
                borderRadius: '10px',
                background: isSelected ? style.bg : 'rgba(255,255,255,0.02)',
                border: `2px solid ${isSelected ? style.color : 'rgba(255,255,255,0.05)'}`,
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '3px',
                  height: '100%',
                  background: style.color,
                  borderRadius: '10px 0 0 10px'
                }} />
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <span style={{ fontSize: '18px' }}>{route.icon || '📍'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: style.color }}>
                    {route.name || routeType}
                  </div>
                  <div style={{ fontSize: '11px', color: '#7589a8' }}>
                    {route.tagline || `${route.via || 'Via main roads'}`}
                  </div>
                </div>
                {route.rec && (
                  <div style={{
                    background: 'var(--green)',
                    color: '#fff',
                    fontSize: '9px',
                    padding: '2px 8px',
                    borderRadius: '8px',
                    fontWeight: 700
                  }}>
                    BEST
                  </div>
                )}
              </div>

              {/* Comparison bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Time bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '3px' }}>
                    <span style={{ color: '#7589a8' }}>⏱️ Duration</span>
                    <span style={{ color: '#e2e8f8', fontWeight: 600 }}>{route.time} min</span>
                  </div>
                  <div style={{ 
                    height: '6px', 
                    background: 'rgba(255,255,255,0.05)', 
                    borderRadius: '3px', 
                    overflow: 'hidden' 
                  }}>
                    <div style={{
                      width: `${(route.time / maxTime) * 100}%`,
                      height: '100%',
                      background: style.color,
                      borderRadius: '3px',
                      transition: 'width 0.8s ease',
                      opacity: 0.7
                    }} />
                  </div>
                </div>

                {/* Distance bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '3px' }}>
                    <span style={{ color: '#7589a8' }}>📏 Distance</span>
                    <span style={{ color: '#e2e8f8', fontWeight: 600 }}>{route.dist} km</span>
                  </div>
                  <div style={{ 
                    height: '6px', 
                    background: 'rgba(255,255,255,0.05)', 
                    borderRadius: '3px', 
                    overflow: 'hidden' 
                  }}>
                    <div style={{
                      width: `${(parseFloat(route.dist) / maxDist) * 100}%`,
                      height: '100%',
                      background: '#a855f7',
                      borderRadius: '3px',
                      transition: 'width 0.8s ease',
                      opacity: 0.7
                    }} />
                  </div>
                </div>

                {/* AQI bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '3px' }}>
                    <span style={{ color: '#7589a8' }}>🌫️ AQI</span>
                    <span style={{ color: aqiColor, fontWeight: 600 }}>
                      {route.aqi} - {getAQILabel(route.aqi)}
                    </span>
                  </div>
                  <div style={{ 
                    height: '6px', 
                    background: 'rgba(255,255,255,0.05)', 
                    borderRadius: '3px', 
                    overflow: 'hidden' 
                  }}>
                    <div style={{
                      width: `${(route.aqi / maxAQI) * 100}%`,
                      height: '100%',
                      background: aqiColor,
                      borderRadius: '3px',
                      transition: 'width 0.8s ease'
                    }} />
                  </div>
                </div>

                {/* Exposure Score */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '6px 10px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '6px',
                  marginTop: '4px'
                }}>
                  <span style={{ fontSize: '10px', color: '#7589a8' }}>☢️ Exposure Risk</span>
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: 600,
                    color: (route.expScore || 50) < 40 ? '#22c55e' : (route.expScore || 50) < 70 ? '#f59e0b' : '#ef4444'
                  }}>
                    {route.expLabel || 'Moderate'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RouteComparison;
