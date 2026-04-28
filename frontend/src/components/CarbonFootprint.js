import React, { useMemo } from 'react';

const CarbonFootprint = ({ route, mode }) => {
  const footprint = useMemo(() => {
    if (!route) return null;
    const dist = parseFloat(route.dist) || 5;
    const emissionFactors = {
      drive: 0.12,
      transit: 0.04,
      cycle: 0,
      walk: 0
    };
    const co2 = Math.round(dist * (emissionFactors[mode] || 0.12) * 1000) / 1000;
    const calories = Math.round(dist * (mode === 'walk' ? 55 : mode === 'cycle' ? 35 : 0));
    const fuelCost = mode === 'drive' ? Math.round(dist * 8.5) : 0;
    const treesNeeded = Math.ceil(co2 / 20);
    const alternatives = [
      { mode: 'drive', label: 'Driving', co2: dist * 0.12, active: mode === 'drive' },
      { mode: 'transit', label: 'Public Transit', co2: dist * 0.04, active: mode === 'transit' },
      { mode: 'cycle', label: 'Cycling', co2: 0, active: mode === 'cycle' },
      { mode: 'walk', label: 'Walking', co2: 0, active: mode === 'walk' },
    ].sort((a, b) => a.co2 - b.co2);
    return { co2, calories, fuelCost, treesNeeded, alternatives, dist };
  }, [route, mode]);

  if (!footprint) return null;
  const { co2, calories, fuelCost, treesNeeded, alternatives } = footprint;

  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '18px',
      marginBottom: '14px',
      animation: 'fadeIn 0.5s ease 0.5s both'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '16px',
        paddingBottom: '10px',
        borderBottom: '1px solid var(--border)'
      }}>
        <span style={{ fontSize: '20px' }}>🌍</span>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 600 }}>Environmental Impact</div>
          <div style={{ fontSize: '11px', color: '#7589a8' }}>Your carbon footprint for this trip</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
        <div style={{
          background: 'rgba(34,197,94,0.08)',
          border: '1px solid rgba(34,197,94,0.15)',
          borderRadius: '10px',
          padding: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '11px', color: '#22c55e', marginBottom: '4px' }}>CO₂ Emitted</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#22c55e', fontFamily: 'monospace' }}>
            {co2} <span style={{ fontSize: '11px' }}>kg</span>
          </div>
        </div>
        {calories > 0 && (
          <div style={{
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.15)',
            borderRadius: '10px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '11px', color: '#f59e0b', marginBottom: '4px' }}>Calories</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f59e0b', fontFamily: 'monospace' }}>
              {calories} <span style={{ fontSize: '11px' }}>kcal</span>
            </div>
          </div>
        )}
        {fuelCost > 0 && (
          <div style={{
            background: 'rgba(59,130,246,0.08)',
            border: '1px solid rgba(59,130,246,0.15)',
            borderRadius: '10px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '11px', color: '#3b82f6', marginBottom: '4px' }}>Fuel Cost</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#3b82f6', fontFamily: 'monospace' }}>
              ₹{fuelCost}
            </div>
          </div>
        )}
      </div>

      <div style={{
        background: 'rgba(34,197,94,0.05)',
        border: '1px solid rgba(34,197,94,0.1)',
        borderRadius: '10px',
        padding: '12px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <span style={{ fontSize: '24px' }}>🌳</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f8', marginBottom: '2px' }}>
            Offset Impact
          </div>
          <div style={{ fontSize: '11px', color: '#7589a8' }}>
            It would take <strong style={{ color: '#22c55e' }}>{treesNeeded} tree{treesNeeded !== 1 ? 's' : ''}</strong> a full year to absorb this CO₂.
          </div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: '11px', color: '#7589a8', marginBottom: '10px', fontWeight: 600 }}>
          🚗 Alternative Mode Comparison
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {alternatives.map((alt, i) => {
            const icons = { drive: '🚗', transit: '🚌', cycle: '🚴', walk: '🚶' };
            const barColor = alt.co2 === 0 ? '#22c55e' : alt.co2 < 0.5 ? '#f59e0b' : '#ef4444';
            const maxCo2 = Math.max(...alternatives.map(a => a.co2));
            return (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                background: alt.active ? `${barColor}10` : 'rgba(255,255,255,0.02)',
                border: `1px solid ${alt.active ? barColor : 'rgba(255,255,255,0.05)'}`,
                borderRadius: '8px',
                transition: 'all 0.2s'
              }}>
                <span style={{ fontSize: '16px' }}>{icons[alt.mode]}</span>
                <div style={{ width: '100px', fontSize: '11px', color: '#e2e8f8', fontWeight: 500 }}>{alt.label}</div>
                <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${maxCo2 > 0 ? (alt.co2 / maxCo2) * 100 : 0}%`,
                    height: '100%',
                    background: barColor,
                    borderRadius: '3px',
                    opacity: 0.7,
                    transition: 'width 0.8s ease'
                  }} />
                </div>
                <div style={{ width: '60px', fontSize: '11px', fontWeight: 600, color: barColor, textAlign: 'right', fontFamily: 'monospace' }}>
                  {alt.co2.toFixed(2)} kg
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CarbonFootprint;
