import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectRegion } from '../features/boundary/boundarySlice';
import { scanRegionThunk } from '../features/boundary/boundaryThunks';
import { addToast } from '../features/ui/uiSlice';
import tokens from '../styles/tokens';

export default function ScanForm() {
  const dispatch = useDispatch();
  const agentStatus = useSelector((state) => state.agent.status);
  const { regions, activeRegionId } = useSelector((state) => state.boundary);
  const demoMode = useSelector((state) => state.ui.demoMode);

  const [dateBefore, setDateBefore] = useState('2023-01-15');
  const [dateAfter, setDateAfter] = useState('2024-02-20');

  const activeRegion = regions.find((r) => r.id === activeRegionId);
  const isScanning = agentStatus === 'loading';
  const isRevealing = agentStatus === 'revealing';

  const handleScan = async (e) => {
    e.preventDefault();

    if (!activeRegion) {
      dispatch(
        addToast({
          type: 'warning',
          title: 'No Region Selected',
          message: 'Draw or select a region on the map first before running a scan.',
        })
      );
      return;
    }

    dispatch(
      scanRegionThunk({
        region: activeRegion,
        dateBefore,
        dateAfter,
        demoMode,
      })
    );
  };

  return (
    <div className="glass" style={{ padding: 18 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div className="section-title" style={{ marginBottom: 2 }}>
            <span className="dot" />
            Inspection Parameters &amp; Regional Scope
          </div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: tokens.colors.textPrimary, margin: 0 }}>
            Configure Satellite Acquisition Scope
          </h2>
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {demoMode && (
            <span
              className="badge badge-amber"
              style={{ fontSize: 10, padding: '2px 8px' }}
              title="Demo Mode active — uses static baseline captures"
            >
              ⚡ DEMO DATASET
            </span>
          )}
          <span className="badge badge-cyan" style={{ fontSize: 10 }}>
            Multi-Temporal Sentinel-2 (10m)
          </span>
        </div>
      </div>

      {/* Region Selector Pills */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: tokens.colors.textMuted, fontFamily: tokens.typography.fontFamilyMono, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Select Monitored Region:
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {regions.map((region) => {
            const isSelected = region.id === activeRegionId;
            return (
              <button
                key={region.id}
                type="button"
                onClick={() => dispatch(selectRegion(region.id))}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: isSelected ? `1px solid ${tokens.colors.accentPrimary}` : '1px solid rgba(255,255,255,0.08)',
                  background: isSelected ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255,255,255,0.03)',
                  color: isSelected ? tokens.colors.accentPrimary : tokens.colors.textSecondary,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: tokens.transitions.fast,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <span>{isSelected ? '🎯' : region.isSaved ? '📌' : '📐'}</span>
                <span>{region.name}</span>
                {region.scanStatus === 'scanned' && (
                  <span style={{ fontSize: 9, opacity: 0.8 }}>
                    ({region.scanSeverity === 'none' ? '✓ Clear' : '🚨 Violation'})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Date Range Inputs & Scope Info */}
      <form onSubmit={handleScan}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 10, color: tokens.colors.textMuted, fontFamily: tokens.typography.fontFamilyMono, display: 'block', marginBottom: 4 }}>
              BASELINE COMPARISON DATE
            </label>
            <input
              className="input-field"
              type="date"
              value={dateBefore}
              onChange={(e) => setDateBefore(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: 10, color: tokens.colors.textMuted, fontFamily: tokens.typography.fontFamilyMono, display: 'block', marginBottom: 4 }}>
              CURRENT INSPECTION DATE
            </label>
            <input
              className="input-field"
              type="date"
              value={dateAfter}
              onChange={(e) => setDateAfter(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: 10, color: tokens.colors.textMuted, fontFamily: tokens.typography.fontFamilyMono, display: 'block', marginBottom: 4 }}>
              BOUNDING BOX SCOPE (TURF.JS)
            </label>
            <div
              style={{
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 6,
                padding: '8px 10px',
                fontSize: 11,
                fontFamily: tokens.typography.fontFamilyMono,
                color: activeRegion ? tokens.colors.accentPrimary : tokens.colors.textMuted,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {activeRegion
                ? `[${activeRegion.bbox.map((v) => v.toFixed(3)).join(', ')}] +10% buffer`
                : 'No region selected'}
            </div>
          </div>
        </div>

        {/* Selected Region Status Notification */}
        {!activeRegion && (
          <div
            style={{
              marginBottom: 10,
              padding: '8px 12px',
              borderRadius: 6,
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              color: '#f59e0b',
              fontSize: 11,
              fontFamily: tokens.typography.fontFamilyMono,
            }}
          >
            ⚠ Draw or select a region on the map first to enable targeted bounding box scanning.
          </div>
        )}

        {/* Submit Action */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10 }}>
          {isRevealing && (
            <span style={{ fontSize: 11, color: '#f59e0b', fontFamily: tokens.typography.fontFamilyMono }}>
              ● Streaming trace nodes for {activeRegion?.name}…
            </span>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={isScanning || !activeRegion}
            style={{
              minWidth: 240,
              justifyContent: 'center',
              padding: '9px 18px',
              fontSize: 12,
              opacity: !activeRegion ? 0.6 : 1,
            }}
          >
            {isScanning ? (
              <>
                <svg style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25" />
                  <path fill="currentColor" fillOpacity="0.75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Scanning {activeRegion?.name}…</span>
              </>
            ) : (
              <>
                <span>🚀</span>
                <span>Scan This Region {activeRegion ? `(${activeRegion.name})` : ''}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
