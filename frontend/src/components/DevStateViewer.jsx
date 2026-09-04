import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toggleDevMode } from '../features/ui/uiSlice';
import tokens from '../styles/tokens';

export default function DevStateViewer() {
  const dispatch = useDispatch();
  const state = useSelector((s) => s);
  const { devMode } = useSelector((s) => s.ui);

  const [activeTab, setActiveTab] = useState('boundary');
  const [minimized, setMinimized] = useState(false);

  if (!devMode) return null;

  const tabs = ['boundary', 'agent', 'imagery', 'report', 'ui'];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: tokens.zIndex.modal,
        width: minimized ? 260 : 540,
        maxHeight: minimized ? 48 : 420,
        background: 'rgba(7, 10, 19, 0.95)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(6, 182, 212, 0.4)',
        borderRadius: 8,
        boxShadow: '0 12px 32px rgba(0,0,0,0.7)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontSize: 11,
        fontFamily: tokens.typography.fontFamilyMono,
        transition: 'all 0.2s ease-in-out',
      }}
    >
      {/* Drawer Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: 'rgba(6, 182, 212, 0.1)',
          borderBottom: minimized ? 'none' : '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: tokens.colors.accentPrimary }}>
          <span>🛠️</span>
          <span>Redux Dev Inspector</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            onClick={() => setMinimized(!minimized)}
            style={{
              background: 'none',
              border: 'none',
              color: tokens.colors.textSecondary,
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            {minimized ? '▲ Expand' : '▼ Minimize'}
          </button>
          <button
            type="button"
            onClick={() => dispatch(toggleDevMode())}
            style={{
              background: 'none',
              border: 'none',
              color: tokens.colors.textMuted,
              cursor: 'pointer',
              fontSize: 14,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Tab Selector */}
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '4px 8px', gap: 4 }}>
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                style={{
                  background: activeTab === tab ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                  border: 'none',
                  color: activeTab === tab ? tokens.colors.accentPrimary : tokens.colors.textMuted,
                  borderRadius: 4,
                  padding: '3px 8px',
                  fontSize: 10,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* JSON Tree Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 12, color: '#a5b4fc', maxHeight: 320 }}>
            <pre style={{ margin: 0, fontSize: 10, lineHeight: 1.45, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {JSON.stringify(state[activeTab], null, 2)}
            </pre>
          </div>
        </>
      )}
    </div>
  );
}
