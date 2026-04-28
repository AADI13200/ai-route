import React, { useState } from 'react';

const FloatingActions = ({ onShare, onExport, onVoiceSearch, onReset }) => {
  const [expanded, setExpanded] = useState(false);

  const actions = [
    { icon: '🔗', label: 'Share', action: onShare, color: '#3b82f6' },
    { icon: '📥', label: 'Export GPX', action: onExport, color: '#22c55e' },
    { icon: '🎤', label: 'Voice Search', action: onVoiceSearch, color: '#a855f7' },
    { icon: '🔄', label: 'Reset', action: onReset, color: '#ef4444' },
  ];

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
      {expanded && actions.map((a, i) => (
        <button
          key={a.label}
          onClick={() => { a.action?.(); setExpanded(false); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 16px',
            borderRadius: '10px',
            border: `1px solid ${a.color}40`,
            background: 'rgba(19, 25, 41, 0.9)',
            backdropFilter: 'blur(10px)',
            color: '#e2e8f8',
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            animation: `slideIn 0.2s ease ${i * 0.05}s both`,
            boxShadow: `0 4px 15px ${a.color}20`
          }}
        >
          <span style={{ fontSize: '16px' }}>{a.icon}</span>
          <span style={{ fontWeight: 500 }}>{a.label}</span>
        </button>
      ))}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          border: 'none',
          background: expanded ? 'rgba(239,68,68,0.9)' : 'rgba(6,182,212,0.9)',
          backdropFilter: 'blur(10px)',
          color: '#fff',
          fontSize: '24px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          transition: 'all 0.3s ease',
          transform: expanded ? 'rotate(45deg)' : 'rotate(0)'
        }}
      >
        {expanded ? '✕' : '+'}
      </button>
    </div>
  );
};

export default FloatingActions;
