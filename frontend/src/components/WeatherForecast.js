import React, { useMemo } from 'react';

const WeatherForecast = ({ route }) => {
  const forecast = useMemo(() => {
    if (!route) return null;
    
    const baseTemp = 28 + Math.random() * 8; // 28-36°C typical for India
    const baseHumidity = 45 + Math.random() * 35;
    const baseWind = 5 + Math.random() * 15;
    
    // Hourly forecast for next 6 hours along route
    const hourly = Array.from({ length: 6 }, (_, i) => {
      const hour = (new Date().getHours() + i) % 24;
      const tempChange = Math.sin((hour - 14) * Math.PI / 12) * 4; // Peak at 2 PM
      const temp = Math.round(baseTemp + tempChange + (Math.random() - 0.5) * 2);
      
      const conditions = [
        { icon: '☀️', label: 'Sunny', color: '#f59e0b' },
        { icon: '⛅', label: 'Partly Cloudy', color: '#fbbf24' },
        { icon: '☁️', label: 'Cloudy', color: '#94a3b8' },
        { icon: '🌧️', label: 'Light Rain', color: '#60a5fa' },
        { icon: '🌫️', label: 'Hazy', color: '#a78bfa' },
      ];
      const condition = conditions[Math.floor(Math.random() * conditions.length)];
      
      return {
        hour,
        label: `${hour}:00`,
        temp,
        humidity: Math.round(baseHumidity + (Math.random() - 0.5) * 10),
        wind: Math.round(baseWind + (Math.random() - 0.5) * 5),
        ...condition
      };
    });

    // Daily forecast (next 5 days)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date().getDay();
    const daily = Array.from({ length: 5 }, (_, i) => {
      const dayIdx = (today + i) % 7;
      const tempHigh = Math.round(baseTemp + 2 + Math.random() * 3);
      const tempLow = Math.round(baseTemp - 5 + Math.random() * 2);
      
      return {
        day: i === 0 ? 'Today' : days[dayIdx],
        high: tempHigh,
        low: tempLow,
        aqi: Math.round((route.aqi || 100) + (Math.random() - 0.5) * 40),
        icon: ['☀️', '⛅', '☁️', '🌧️', '🌫️'][Math.floor(Math.random() * 5)]
      };
    });

    return { hourly, daily, current: hourly[0] };
  }, [route]);

  if (!forecast) return null;
  const { hourly, daily, current } = forecast;

  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '18px',
      marginBottom: '14px',
      animation: 'fadeIn 0.5s ease 0.4s both'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px', 
        marginBottom: '16px',
        paddingBottom: '10px',
        borderBottom: '1px solid var(--border)'
      }}>
        <span style={{ fontSize: '20px' }}>🌤️</span>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 600 }}>Weather Forecast</div>
          <div style={{ fontSize: '11px', color: '#7589a8' }}>Conditions along your route</div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: '24px' }}>{current.icon}</div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f8' }}>{current.temp}°C</div>
        </div>
      </div>

      {/* Current Conditions */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr 1fr', 
        gap: '10px',
        marginBottom: '16px'
      }}>
        {[
          { label: 'Humidity', value: `${current.humidity}%`, icon: '💧' },
          { label: 'Wind', value: `${current.wind} km/h`, icon: '💨' },
          { label: 'AQI Impact', value: current.label, icon: '🌫️' },
        ].map((item, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '8px',
            padding: '10px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '16px', marginBottom: '4px' }}>{item.icon}</div>
            <div style={{ fontSize: '11px', color: '#7589a8', marginBottom: '2px' }}>{item.label}</div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f8' }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Hourly Forecast */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', color: '#7589a8', marginBottom: '10px', fontWeight: 600 }}>
          ⏰ Hourly Forecast
        </div>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {hourly.map((h, i) => (
            <div key={i} style={{
              background: i === 0 ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.02)',
              border: i === 0 ? '1px solid rgba(245,158,11,0.2)' : '1px solid rgba(255,255,255,0.05)',
              borderRadius: '10px',
              padding: '10px',
              minWidth: '60px',
              textAlign: 'center',
              transition: 'all 0.2s',
              cursor: 'pointer'
            }}>
              <div style={{ fontSize: '10px', color: '#7589a8', marginBottom: '4px' }}>{h.label}</div>
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>{h.icon}</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f8' }}>{h.temp}°</div>
              <div style={{ fontSize: '9px', color: h.color, marginTop: '2px' }}>{h.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Forecast */}
      <div>
        <div style={{ fontSize: '11px', color: '#7589a8', marginBottom: '10px', fontWeight: 600 }}>
          📅 5-Day Outlook
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {daily.map((d, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 12px',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '8px'
            }}>
              <div style={{ width: '50px', fontSize: '12px', fontWeight: 600, color: '#e2e8f8' }}>
                {d.day}
              </div>
              <div style={{ fontSize: '18px' }}>{d.icon}</div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ fontSize: '11px', color: '#7589a8' }}>{d.low}°</div>
                <div style={{ 
                  flex: 1, 
                  height: '4px', 
                  background: 'rgba(255,255,255,0.05)', 
                  borderRadius: '2px',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    left: `${((d.low - 20) / 20) * 100}%`,
                    right: `${100 - ((d.high - 20) / 20) * 100}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #3b82f6, #f59e0b)',
                    borderRadius: '2px'
                  }} />
                </div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#f59e0b' }}>{d.high}°</div>
              </div>
              <div style={{
                fontSize: '10px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '10px',
                background: d.aqi <= 50 ? 'rgba(34,197,94,0.15)' : d.aqi <= 100 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                color: d.aqi <= 50 ? '#22c55e' : d.aqi <= 100 ? '#f59e0b' : '#ef4444'
              }}>
                AQI {d.aqi}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeatherForecast;
