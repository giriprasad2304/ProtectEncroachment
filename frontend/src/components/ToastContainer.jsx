import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeToast } from '../features/ui/uiSlice';

function ToastItem({ toast }) {
  const dispatch = useDispatch();

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(removeToast(toast.id));
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast, dispatch]);

  const typeStyles = {
    success: {
      border: '1px solid rgba(16, 185, 129, 0.4)',
      bg: 'rgba(10, 24, 20, 0.95)',
      accent: '#10b981',
      icon: '✓',
    },
    error: {
      border: '1px solid rgba(239, 68, 68, 0.4)',
      bg: 'rgba(30, 14, 18, 0.95)',
      accent: '#ef4444',
      icon: '✕',
    },
    warning: {
      border: '1px solid rgba(245, 158, 11, 0.4)',
      bg: 'rgba(28, 22, 12, 0.95)',
      accent: '#f59e0b',
      icon: '⚠',
    },
    info: {
      border: '1px solid rgba(6, 182, 212, 0.4)',
      bg: 'rgba(8, 20, 30, 0.95)',
      accent: '#06b6d4',
      icon: 'ℹ',
    },
  };

  const style = typeStyles[toast.type] || typeStyles.info;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '12px 14px',
        borderRadius: 8,
        background: style.bg,
        border: style.border,
        boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
        backdropFilter: 'blur(12px)',
        color: '#f8fafc',
        width: 320,
        maxWidth: '90vw',
        animation: 'slideInRight 0.25s ease-out forwards',
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: `${style.accent}25`,
          border: `1px solid ${style.accent}`,
          color: style.accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {style.icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {toast.title && (
          <div style={{ fontSize: 12, fontWeight: 700, color: style.accent, marginBottom: 2 }}>
            {toast.title}
          </div>
        )}
        <div style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.45, wordBreak: 'break-word' }}>
          {toast.message}
        </div>
      </div>

      <button
        onClick={() => dispatch(removeToast(toast.id))}
        style={{
          background: 'none',
          border: 'none',
          color: '#64748b',
          fontSize: 14,
          lineHeight: 1,
          cursor: 'pointer',
          padding: 2,
          marginLeft: 4,
        }}
        title="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useSelector((state) => state.ui.toasts);

  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
