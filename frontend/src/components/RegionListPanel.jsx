import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectRegion,
  renameRegion,
  removeRegion,
  setDrawingMode,
  clearDraftPoints,
} from '../features/boundary/boundarySlice';
import { scanRegionThunk } from '../features/boundary/boundaryThunks';
import { addToast } from '../features/ui/uiSlice';
import tokens from '../styles/tokens';

export default function RegionListPanel() {
  const dispatch = useDispatch();
  const { regions, activeRegionId, drawingMode } = useSelector((state) => state.boundary);
  const agentStatus = useSelector((state) => state.agent.status);
  const demoMode = useSelector((state) => state.ui.demoMode);

  const [editingId, setEditingId] = useState(null);
  const [tempName, setTempName] = useState('');

  const activeRegion = regions.find((r) => r.id === activeRegionId);
  const isScanning = agentStatus === 'loading';

  const handleStartRename = (region) => {
    setEditingId(region.id);
    setTempName(region.name);
  };

  const handleSaveRename = (id) => {
    if (tempName.trim()) {
      dispatch(renameRegion({ id, name: tempName.trim() }));
    }
    setEditingId(null);
  };

  const handleDrawNew = () => {
    dispatch(clearDraftPoints());
    dispatch(setDrawingMode('draw'));
    dispatch(
      addToast({
        type: 'info',
        title: 'Drawing Mode Active',
        message: 'Click on the map to plot vertices for a new region boundary.',
        duration: 3500,
      })
    );
  };

  const handleScanRegion = () => {
    if (!activeRegion) {
      dispatch(
        addToast({
          type: 'warning',
          title: 'Select a Region',
          message: 'Draw or select a region on the map first before running a scan.',
        })
      );
      return;
    }

    dispatch(
      scanRegionThunk({
        region: activeRegion,
        demoMode,
      })
    );
  };

  return (
    <div className="glass" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
        <div>
          <div className="section-title" style={{ marginBottom: 2 }}>
            <span className="dot" style={{ background: tokens.colors.accentPrimary }} />
            Monitored Regions &amp; Parcels
          </div>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: tokens.colors.textPrimary }}>
            {regions.length} Active {regions.length === 1 ? 'Boundary' : 'Boundaries'}
          </h3>
        </div>

        <button
          type="button"
          onClick={handleDrawNew}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '5px 10px',
            borderRadius: 6,
            background: drawingMode === 'draw' ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${drawingMode === 'draw' ? tokens.colors.accentPrimary : 'rgba(255, 255, 255, 0.1)'}`,
            color: drawingMode === 'draw' ? tokens.colors.accentPrimary : tokens.colors.textPrimary,
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <span>✏️ Draw New Region</span>
        </button>
      </div>

      {/* Regions List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto', paddingRight: 2 }}>
        {regions.map((region) => {
          const isSelected = region.id === activeRegionId;
          const isEditing = editingId === region.id;

          return (
            <div
              key={region.id}
              onClick={() => dispatch(selectRegion(region.id))}
              style={{
                padding: '8px 10px',
                borderRadius: 6,
                background: isSelected ? 'rgba(6, 182, 212, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${isSelected ? tokens.colors.accentPrimary : 'rgba(255, 255, 255, 0.06)'}`,
                cursor: 'pointer',
                transition: tokens.transitions.fast,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: 12 }}>
                  {isSelected ? '🎯' : region.isSaved ? '📌' : '📐'}
                </span>

                {isEditing ? (
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={() => handleSaveRename(region.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveRename(region.id);
                    }}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      background: 'rgba(0,0,0,0.6)',
                      border: `1px solid ${tokens.colors.accentPrimary}`,
                      borderRadius: 4,
                      color: '#f8fafc',
                      fontSize: 12,
                      padding: '2px 6px',
                      outline: 'none',
                      width: '100%',
                    }}
                  />
                ) : (
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: isSelected ? 700 : 500,
                          color: isSelected ? tokens.colors.accentPrimary : tokens.colors.textPrimary,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {region.name}
                      </span>
                      {!region.isSaved && (
                        <span style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontFamily: tokens.typography.fontFamilyMono }}>
                          Draft
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Status Tags & Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                {region.scanStatus === 'scanned' && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontFamily: tokens.typography.fontFamilyMono,
                      background: region.scanSeverity === 'none' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.15)',
                      color: region.scanSeverity === 'none' ? '#10b981' : '#ef4444',
                      border: `1px solid ${region.scanSeverity === 'none' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    }}
                  >
                    {region.scanSeverity === 'none' ? '✓ Clear' : `🚨 ${region.overlapPercent}%`}
                  </span>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartRename(region);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: tokens.colors.textMuted,
                    cursor: 'pointer',
                    fontSize: 11,
                    padding: 2,
                  }}
                  title="Rename region"
                >
                  ✏️
                </button>

                {regions.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch(removeRegion(region.id));
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: 12,
                      padding: 2,
                    }}
                    title="Remove region"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Region Summary Card */}
      {activeRegion ? (
        <div
          style={{
            padding: '10px 12px',
            borderRadius: 6,
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            fontSize: 11,
            fontFamily: tokens.typography.fontFamilyMono,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: tokens.colors.textMuted }}>Active Selection:</span>
            <span style={{ color: tokens.colors.accentPrimary, fontWeight: 700 }}>
              {activeRegion.name}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', color: '#cbd5e1' }}>
            <div>
              <span style={{ color: tokens.colors.textMuted }}>Surface Area: </span>
              <strong>{activeRegion.areaSqM.toLocaleString()} m²</strong> ({(activeRegion.areaSqM / 10000).toFixed(2)} ha)
            </div>
            <div>
              <span style={{ color: tokens.colors.textMuted }}>Centroid: </span>
              <span>{activeRegion.centroid[0].toFixed(4)}, {activeRegion.centroid[1].toFixed(4)}</span>
            </div>
          </div>

          {/* Prominent Scan This Region Button */}
          <div style={{ marginTop: 4 }}>
            <button
              type="button"
              onClick={handleScanRegion}
              disabled={isScanning}
              style={{
                width: '100%',
                padding: '8px 14px',
                borderRadius: 6,
                background: tokens.colors.accentPrimary,
                color: '#070a13',
                border: 'none',
                fontWeight: 700,
                fontSize: 12,
                cursor: isScanning ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                boxShadow: '0 2px 10px rgba(6, 182, 212, 0.3)',
                transition: tokens.transitions.fast,
              }}
            >
              {isScanning ? (
                <>
                  <svg style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25" />
                    <path fill="currentColor" fillOpacity="0.75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Scanning Selected Region…</span>
                </>
              ) : (
                <>
                  <span>🛰️</span>
                  <span>Scan This Region ({activeRegion.name})</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: 12,
            borderRadius: 6,
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            color: '#f59e0b',
            fontSize: 11,
            textAlign: 'center',
          }}
        >
          Draw or select a region on the map first to inspect or launch an encroachment scan.
        </div>
      )}
    </div>
  );
}
