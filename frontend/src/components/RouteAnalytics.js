import React, { useMemo } from 'react';

const RouteAnalytics = ({ route, mode = 'drive' }) => {
  const analytics = useMemo(() => {
    if (!route) return null;
    
    const dist = parseFloat(route.dist) || 5;
    const time = route.time || 30;
    const aqi = route.aqi || 100;
    
    // Generate hourly AQI forecast along route
    const hourlyForecast = Array.from({ length: 12 }, (_, i) => {
      const hour = (new Date().getHours() + i) % 24;
      const baseAQI = aqi;
      // AQI varies by time of day (traffic patterns)
      const trafficMultiplier = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19) ? 1.3 : 
                                (hour >= 11 && hour <= 16) ? 1.1 : 0.85;
      const randomVar = 0.9 + Math.random() * 0.2;
      return {
        hour,
        label: `${hour}:00`,
        aqi: Math.round(baseAQI * trafficMultiplier * randomVar),
        traffic: trafficMultiplier > 1.2 ? 'heavy' : trafficMultiplier > 1 ? 'moderate' : 'light'
      };
    });

    // Pollutant breakdown (simulated based on AQI)
    const pm25 = route.pm25 || Math.round(aqi * 0.35);
    const pm10 = route.pm10 || Math.round(aqi * 0.55);
    const no2 = route.no2 || Math.round(aqi * 0.25);
    const o3 = route.o3 || Math.round(aqi * 0.15);
    const so2 = Math.round(aqi * 0.08);
    const co = Math.round(aqi * 0.05);
    const total = pm25 + pm10 + no2 + o3 + so2 + co;

    const pollutants = [
      { name: 'PM2.5', value: pm25, percent: Math.round((pm25/total)*100), color: '#ef4444' },
      { name: 'PM10', value: pm10, percent: Math.round((pm10/total)*100), color: '#f97316' },
      { name: 'NO₂', value: no2, percent: Math.round((no2/total)*100), color: '#f59e0b' },
      { name: 'O₃', value: o3, percent: Math.round((o3/total)*100), color: '#22c55e' },
      { name: 'SO₂', value: so2, percent: Math.round((so2/total)*100), color: '#3b82f6' },
      { name: 'CO', value: co, percent: Math.round((co/total)*100), color: '#a855f7' },
    ];

    // Exposure risk calculation
    const exposureScore = Math.min(100, Math.round((aqi * time * (mode === 'walk' ? 2.5 : mode === 'cycle' ? 1.8 : 1)) / 60));
    const riskLevel = exposureScore < 25 ? 'Low' : exposureScore < 50 ? 'Moderate' : exposureScore < 75 ? 'High' : 'Very High';
    const riskColor = exposureScore < 25 ? '#22c55e' : exposureScore < 50 ? '#f59e0b' : exposureScore < 75 ? '#f97316' : '#ef4444';

    // Route quality score (0-100)
    const qualityScore = Math.max(0, Math.min(100, Math.round(
      100 - (aqi * 0.3) - (time * 0.5) + (mode === 'walk' || mode === 'cycle' ? 15 : 0)
    )));

    return { hourlyForecast, pollutants, exposureScore, riskLevel, riskColor, qualityScore, dist, time };
  }, [route, mode]);

  if (!analytics) return null;

  const { hourlyForecast, pollutants, exposureScore, riskLevel, riskColor, qualityScore } = analytics;

  // Gauge SVG
  const gaugeRadius = 50;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const gaugeOffset = gaugeCircumference * (1 - exposureScore / 100);

  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '18px',
      marginBottom: '14px',
      animation: 'fadeIn 0.5s ease 0.3s both'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px', 
        marginBottom: '16px',
        paddingBottom: '10px',
        borderBottom: '1px solid var(--border)'
      }}>
        <span style={{ fontSize: '20px' }}>📈</span>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 600 }}>Route Analytics</div>
          <div style={{ fontSize: '11px', color: '#7589a8' }}>Deep insights into your journey</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {/* Exposure Risk Gauge */}
        <div style={{ 
          background: 'rgba(255,255,255,0.02)', 
          borderRadius: '10px', 
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '11px', color: '#7589a8', marginBottom: '8px', fontWeight: 600 }}>☢️ Exposure Risk</div>
          <svg width="110" height="60" viewBox="0 0 110 60">
            <path
              d={`M 10 55 A ${gaugeRadius} ${gaugeRadius} 0 0 1 100 55`}
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <path
              d={`M 10 55 A ${gaugeRadius} ${gaugeRadius} 0 0 1 100 55`}
              fill="none"
              stroke={riskColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={gaugeCircumference / 2}
              strokeDashoffset={gaugeOffset / 2}
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
            <text x="55" y="50" textAnchor="middle" fill={riskColor} fontSize="14" fontWeight="bold" fontFamily="monospace">
              {exposureScore}%
            </text>
          </svg>
          <div style={{ 
            fontSize: '12px', 
            color: riskColor, 
            fontWeight: 600,
            marginTop: '4px'
          }}>
            {riskLevel} Risk
          </div>
        </div>

        {/* Route Quality Score */}
        <div style={{ 
          background: 'rgba(255,255,255,0.02)', 
          borderRadius: '10px', 
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '11px', color: '#7589a8', marginBottom: '8px', fontWeight: 600 }}>⭐ Route Quality</div>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: `conic-gradient(${qualityScore > 70 ? '#22c55e' : qualityScore > 50 ? '#f59e0b' : '#ef4444'} ${qualityScore * 3.6}deg, rgba(255,255,255,0.05) 0deg)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'var(--card)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: qualityScore > 70 ? '#22c55e' : qualityScore > 50 ? '#f59e0b' : '#ef4444', fontFamily: 'monospace' }}>
                {qualityScore}
              </span>
            </div>
          </div>
          <div style={{ fontSize: '12px', color: '#7589a8', marginTop: '4px' }}>
            {qualityScore > 80 ? 'Excellent' : qualityScore > 60 ? 'Good' : qualityScore > 40 ? 'Fair' : 'Poor'}
          </div>
        </div>
      </div>

      {/* AQI Hourly Forecast */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', color: '#7589a8', marginBottom: '10px', fontWeight: 600 }}>
          📊 AQI Forecast (Next 12 Hours)
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '80px', padding: '0 4px' }}>
          {hourlyForecast.map((h, i) => {
            const height = Math.max(8, (h.aqi / 300) * 70);
            const barColor = h.aqi <= 50 ? '#22c55e' : h.aqi <= 100 ? '#f59e0b' : h.aqi <= 150 ? '#f97316' : '#ef4444';
            return (
              <div key={i} style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                gap: '4px'
              }}>
                <div style={{
                  width: '100%',
                  height: `${height}px`,
                  background: barColor,
                  borderRadius: '3px 3px 0 0',
                  opacity: 0.7,
                  transition: 'height 0.5s ease',
                  minWidth: '4px',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '-16px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '8px',
                    color: barColor,
                    fontWeight: 600,
                    fontFamily: 'monospace',
                    whiteSpace: 'nowrap'
                  }}>
                    {h.aqi}
                  </div>
                </div>
                <div style={{ fontSize: '8px', color: '#7589a8', fontFamily: 'monospace' }}>
                  {h.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pollutant Breakdown */}
      <div>
        <div style={{ fontSize: '11px', color: '#7589a8', marginBottom: '10px', fontWeight: 600 }}>
          🔬 Pollutant Composition
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {pollutants.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ 
                width: '50px', 
                fontSize: '11px', 
                color: '#e2e8f8',
                fontWeight: 500,
                flexShrink: 0
              }}>
                {p.name}
              </div>
              <div style={{ 
                flex: 1, 
                height: '6px', 
                background: 'rgba(255,255,255,0.05)', 
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${p.percent}%`,
                  height: '100%',
                  background: p.color,
                  borderRadius: '3px',
                  transition: 'width 1s ease',
                  opacity: 0.8
                }} />
              </div>
              <div style={{ 
                width: '40px', 
                fontSize: '10px', 
                color: p.color,
                fontWeight: 600,
                fontFamily: 'monospace',
                textAlign: 'right',
                flexShrink: 0
              }}>
                {p.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RouteAnalytics;
