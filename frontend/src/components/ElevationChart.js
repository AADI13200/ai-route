import React, { useMemo } from 'react';

const ElevationChart = ({ route, width = 280, height = 80 }) => {
  // Generate simulated elevation profile based on route distance
  const data = useMemo(() => {
    if (!route) return [];
    
    const dist = parseFloat(route.dist) || 5;
    const points = 20;
    const baseElevation = 500; // meters
    
    return Array.from({ length: points }, (_, i) => {
      const progress = i / (points - 1);
      // Simulate realistic terrain with hills
      const elevation = baseElevation + 
        Math.sin(progress * Math.PI * 3) * 80 + 
        Math.sin(progress * Math.PI * 7) * 40 +
        Math.sin(progress * Math.PI * 1.5) * 120 +
        (progress * 30); // slight incline
      return {
        x: progress * dist,
        y: Math.max(200, elevation)
      };
    });
  }, [route]);

  if (!data.length) return null;

  const padding = { top: 5, right: 5, bottom: 20, left: 35 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const minElevation = Math.min(...data.map(d => d.y));
  const maxElevation = Math.max(...data.map(d => d.y));
  const elevationRange = maxElevation - minElevation || 1;

  const scaleX = (val) => padding.left + (val / data[data.length - 1].x) * chartWidth;
  const scaleY = (val) => padding.top + chartHeight - ((val - minElevation) / elevationRange) * chartHeight;

  // Generate smooth path
  const pathD = data.reduce((path, point, i) => {
    const x = scaleX(point.x);
    const y = scaleY(point.y);
    return i === 0 ? `M ${x} ${y}` : `${path} L ${x} ${y}`;
  }, '');

  // Area path (for fill)
  const areaD = `${pathD} L ${scaleX(data[data.length - 1].x)} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`;

  return (
    <div style={{ width, marginTop: '10px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '4px'
      }}>
        <span style={{ fontSize: '11px', color: '#7589a8', fontWeight: 600 }}>⛰️ Elevation Profile</span>
        <span style={{ fontSize: '10px', color: '#06b6d4' }}>
          {Math.round(minElevation)}m - {Math.round(maxElevation)}m
        </span>
      </div>
      
      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(t => (
          <line
            key={`grid-${t}`}
            x1={padding.left + t * chartWidth}
            y1={padding.top}
            x2={padding.left + t * chartWidth}
            y2={padding.top + chartHeight}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
          />
        ))}
        
        {/* Elevation area fill */}
        <defs>
          <linearGradient id="elevationGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#elevationGradient)" />
        
        {/* Elevation line */}
        <path 
          d={pathD} 
          fill="none" 
          stroke="#06b6d4" 
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Distance axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map(t => {
          const dist = data[data.length - 1].x * t;
          return (
            <text
              key={`xlabel-${t}`}
              x={padding.left + t * chartWidth}
              y={height - 5}
              textAnchor="middle"
              fill="#7589a8"
              fontSize="8"
              fontFamily="monospace"
            >
              {dist.toFixed(1)}km
            </text>
          );
        })}
        
        {/* Elevation axis labels */}
        {[0, 0.5, 1].map(t => {
          const elev = minElevation + elevationRange * t;
          return (
            <text
              key={`ylabel-${t}`}
              x={padding.left - 5}
              y={scaleY(elev) + 3}
              textAnchor="end"
              fill="#7589a8"
              fontSize="8"
              fontFamily="monospace"
            >
              {Math.round(elev)}m
            </text>
          );
        })}
      </svg>
    </div>
  );
};

export default ElevationChart;
