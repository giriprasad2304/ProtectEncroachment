import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ScanForm from '../components/ScanForm';
import RegionListPanel from '../components/RegionListPanel';
import ImageComparisonSlider from '../components/ImageComparisonSlider';
import BoundaryMap from '../components/BoundaryMap';
import AgentTrace from '../components/AgentTrace';
import ReportViewer from '../components/ReportViewer';
import ToastContainer from '../components/ToastContainer';
import DevStateViewer from '../components/DevStateViewer';
import { toggleDemoMode, toggleDevMode, dismissOnboarding } from '../features/ui/uiSlice';
import tokens from '../styles/tokens';

export default function Dashboard() {
  const dispatch = useDispatch();
  const demoMode = useSelector((state) => state.ui.demoMode);
  const devMode = useSelector((state) => state.ui.devMode);
  const showOnboarding = useSelector((state) => state.ui.showOnboarding);

  return (
    <div
      className="bg-grid"
      style={{
        minHeight: '100vh',
        background: tokens.colors.bgBase,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: tokens.typography.fontFamilySans,
      }}
    >
      <ToastContainer />
      <DevStateViewer />

      {/* ============================================================
          TOP NAV BAR (ENTERPRISE / GOV STANDARD)
          ============================================================ */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: tokens.zIndex.popover,
          background: 'rgba(7, 10, 19, 0.94)',
          backdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${tokens.colors.borderSubtle}`,
        }}
      >
        <div
          style={{
            maxWidth: 1600,
            margin: '0 auto',
            padding: '0 20px',
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          {/* Logo & Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                background: 'rgba(6, 182, 212, 0.15)',
                border: '1px solid rgba(6, 182, 212, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
              }}
            >
              🛡️
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: tokens.colors.textPrimary, letterSpacing: '-0.02em' }}>
                  Bhoomi-Rakshak
                </h1>
                <span className="badge badge-cyan" style={{ fontSize: 9, padding: '1px 6px' }}>
                  GIS &amp; AGENTIC AI
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 10, color: tokens.colors.textMuted, fontFamily: tokens.typography.fontFamilyMono }}>
                Public Land Encroachment Forensic System
              </p>
            </div>
          </div>

          {/* Center/Right Status & Testing Toggles */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {/* System Online Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 4,
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                fontSize: 11,
                fontFamily: tokens.typography.fontFamilyMono,
                color: tokens.colors.legalBoundary,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: tokens.colors.legalBoundary,
                }}
              />
              <span>System Online · Running fully on-premise</span>
            </div>

            {/* Demo Mode Toggle */}
            <div
              onClick={() => dispatch(toggleDemoMode())}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 4,
                background: demoMode ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${demoMode ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                cursor: 'pointer',
                fontSize: 11,
                fontFamily: tokens.typography.fontFamilyMono,
                color: demoMode ? '#f59e0b' : tokens.colors.textSecondary,
                userSelect: 'none',
              }}
              title="Toggle static demo data for instant offline testing and live presentations"
            >
              <span>{demoMode ? '⚡ Demo Mode: ON' : '⚙️ Demo Mode: OFF'}</span>
            </div>

            {/* Dev Inspector Button */}
            <button
              type="button"
              onClick={() => dispatch(toggleDevMode())}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 8px',
                borderRadius: 4,
                background: devMode ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${devMode ? tokens.colors.accentPrimary : 'rgba(255, 255, 255, 0.08)'}`,
                color: devMode ? tokens.colors.accentPrimary : tokens.colors.textMuted,
                fontSize: 11,
                cursor: 'pointer',
                fontFamily: tokens.typography.fontFamilyMono,
              }}
              title="Toggle Redux State Inspector"
            >
              <span>🛠️ Dev State</span>
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================
          MAIN CONTAINER
          ============================================================ */}
      <main
        style={{
          maxWidth: 1600,
          margin: '0 auto',
          padding: '16px 20px',
          width: '100%',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* Onboarding Quick Steps Banner */}
        {showOnboarding && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: tokens.radii.sm,
              background: 'rgba(6, 182, 212, 0.06)',
              border: '1px solid rgba(6, 182, 212, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: 12, color: tokens.colors.accentPrimary }}>
                🚀 Multi-Region Inspection Workflow:
              </span>
              <div style={{ display: 'flex', gap: 14, fontSize: 11, color: tokens.colors.textSecondary, flexWrap: 'wrap' }}>
                <span><strong>1.</strong> Draw or select target boundary region</span>
                <span>→</span>
                <span><strong>2.</strong> Click "Scan This Region"</span>
                <span>→</span>
                <span><strong>3.</strong> Inspect temporal diff &amp; violation overlay</span>
                <span>→</span>
                <span><strong>4.</strong> Download forensic PDF dossier</span>
              </div>
            </div>

            <button
              onClick={() => dispatch(dismissOnboarding())}
              style={{
                background: 'none',
                border: 'none',
                color: tokens.colors.textMuted,
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              Dismiss ✕
            </button>
          </div>
        )}

        {/* Top Scan Configuration Form */}
        <ScanForm />

        {/* Middle Section: Monitored Regions Side Panel + GIS Map + Image Comparison Slider */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 16,
            alignItems: 'stretch',
          }}
        >
          {/* Region List & Management Side Panel */}
          <div style={{ minWidth: 300, maxWidth: 420 }}>
            <RegionListPanel />
          </div>

          {/* Interactive Multi-Region Boundary Map */}
          <div style={{ flex: 1, minWidth: 380 }}>
            <BoundaryMap />
          </div>

          {/* Satellite Temporal Image Comparison */}
          <div style={{ flex: 1, minWidth: 380 }}>
            <ImageComparisonSlider />
          </div>
        </div>

        {/* Lower Section: Incident Report (Left) + Collapsible Agent Trace (Right) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
            gap: 16,
            alignItems: 'start',
          }}
        >
          <ReportViewer />
          <div style={{ minHeight: 360 }}>
            <AgentTrace />
          </div>
        </div>
      </main>

      {/* Enterprise Footer */}
      <footer
        style={{
          borderTop: `1px solid ${tokens.colors.borderSubtle}`,
          padding: '12px 20px',
          textAlign: 'center',
          fontSize: 11,
          color: tokens.colors.textMuted,
          fontFamily: tokens.typography.fontFamilyMono,
          background: 'rgba(0,0,0,0.3)',
        }}
      >
        🛡️ Bhoomi-Rakshak v1.0 · Autonomous On-Premise GeoAI Encroachment Guard · Smart India Hackathon 2024
      </footer>
    </div>
  );
}
