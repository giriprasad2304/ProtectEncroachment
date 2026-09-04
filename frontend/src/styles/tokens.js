/**
 * Design Tokens for Bhoomi-Rakshak
 * Minimalist, high-legibility government/enterprise theme.
 */

export const tokens = {
  colors: {
    // Neutral Base (Charcoal / Dark Slate)
    bgBase: '#070a13',
    bgSurface: '#0d1322',
    bgCard: '#111827',
    bgCardSubtle: 'rgba(17, 24, 39, 0.85)',
    bgCardHover: '#1f2937',
    bgElevated: '#1e293b',

    // Borders
    borderSubtle: 'rgba(255, 255, 255, 0.07)',
    borderMedium: 'rgba(255, 255, 255, 0.14)',
    borderFocus: '#06b6d4',

    // Typography
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    textInverse: '#0f172a',

    // Semantic Accents
    accentPrimary: '#06b6d4',      // Cyan / Primary Action
    accentPrimaryHover: '#0891b2',
    accentPrimaryDim: 'rgba(6, 182, 212, 0.12)',

    legalBoundary: '#10b981',      // Emerald Green
    legalBoundaryDim: 'rgba(16, 185, 129, 0.15)',

    flaggedViolation: '#ef4444',   // Crimson Red
    flaggedViolationDim: 'rgba(239, 68, 68, 0.18)',

    pendingReview: '#f59e0b',      // Amber / Warning
    pendingReviewDim: 'rgba(245, 158, 11, 0.15)',

    info: '#3b82f6',
    infoDim: 'rgba(59, 130, 246, 0.12)',
  },

  typography: {
    fontFamilySans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontFamilyMono: "'JetBrains Mono', 'SFMono-Regular', Menlo, Monaco, Consolas, monospace",
    sizes: {
      xs: '11px',
      sm: '12px',
      base: '13px',
      md: '15px',
      lg: '18px',
      xl: '22px',
    },
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      black: 800,
    },
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px',
  },

  radii: {
    sm: '6px',
    md: '10px',
    lg: '14px',
    full: '9999px',
  },

  shadows: {
    card: '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
    modal: '0 20px 40px -10px rgba(0, 0, 0, 0.7)',
    glowCyan: '0 0 16px rgba(6, 182, 212, 0.35)',
    glowRed: '0 0 16px rgba(239, 68, 68, 0.35)',
  },

  transitions: {
    fast: 'all 0.15s ease-in-out',
    normal: 'all 0.25s ease-in-out',
  },

  zIndex: {
    base: 1,
    overlay: 100,
    popover: 500,
    modal: 9999,
    toast: 10000,
  }
};

export default tokens;
