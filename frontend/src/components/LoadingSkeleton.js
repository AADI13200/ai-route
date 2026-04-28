import React from 'react';

const SkeletonItem = ({ width, height, style = {} }) => (
  <div style={{
    width,
    height,
    background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    borderRadius: '4px',
    ...style
  }} />
);

const RouteSkeleton = () => {
  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '18px',
      marginBottom: '14px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <SkeletonItem width="32px" height="32px" style={{ borderRadius: '8px' }} />
        <div style={{ flex: 1 }}>
          <SkeletonItem width="120px" height="16px" style={{ marginBottom: '6px' }} />
          <SkeletonItem width="80px" height="12px" />
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '10px',
            padding: '12px',
            border: '1px solid var(--border)'
          }}>
            <SkeletonItem width="40px" height="12px" style={{ marginBottom: '8px' }} />
            <SkeletonItem width="60px" height="20px" />
          </div>
        ))}
      </div>
      
      <SkeletonItem width="100%" height="120px" style={{ borderRadius: '8px' }} />
    </div>
  );
};

const MapSkeleton = () => {
  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      overflow: 'hidden',
      height: '400px',
      position: 'relative'
    }}>
      <SkeletonItem width="100%" height="100%" style={{ borderRadius: 0 }} />
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '28px', marginBottom: '8px' }}>🗺️</div>
        <SkeletonItem width="150px" height="14px" />
      </div>
    </div>
  );
};

const LoadingSkeleton = ({ type = 'route' }) => {
  if (type === 'map') return <MapSkeleton />;
  return <RouteSkeleton />;
};

export default LoadingSkeleton;
