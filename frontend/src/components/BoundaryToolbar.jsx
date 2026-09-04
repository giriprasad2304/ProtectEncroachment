import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  setDrawingMode,
  clearDraftPoints,
  loadActiveRegionToDraft,
  createRegionFromDraft,
  setValidationError,
  setRegionSaved,
} from '../features/boundary/boundarySlice';
import { saveCustomBoundary } from '../features/boundary/boundaryThunks';
import { addToast } from '../features/ui/uiSlice';
import { calculateAreaSqM } from '../utils/geoUtils';
import tokens from '../styles/tokens';

export default function BoundaryToolbar() {
  const dispatch = useDispatch();
  const { drawingMode, draftPoints, validationError, regions, activeRegionId } =
    useSelector((state) => state.boundary);

  const activeRegion = regions.find((r) => r.id === activeRegionId);

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [parcelName, setParcelName] = useState('Custom Sector Boundary');
  const [parcelType, setParcelType] = useState('Public Utility & Buffer');
  const [parcelAuthority, setParcelAuthority] = useState('Municipal Land Authority');

  const pointCount = draftPoints.length;
  const draftCoords = draftPoints.map(([lat, lng]) => [lng, lat]);
  const computedArea = calculateAreaSqM(draftCoords);

  const handleStartDraw = () => {
    dispatch(clearDraftPoints());
    dispatch(setDrawingMode('draw'));
    dispatch(
      addToast({
        type: 'info',
        title: 'Drawing Mode Active',
        message: 'Click on the map to plot vertices. Place ≥ 3 points to define a region.',
        duration: 3500,
      })
    );
  };

  const handleStartEdit = () => {
    dispatch(loadActiveRegionToDraft());
    dispatch(
      addToast({
        type: 'info',
        title: 'Edit Mode Active',
        message: `Loaded points for "${activeRegion?.name || 'Selected Region'}". Click map to modify.`,
        duration: 3500,
      })
    );
  };

  const handleClear = () => {
    dispatch(clearDraftPoints());
    dispatch(setDrawingMode('idle'));
  };

  const handleCompleteDrawing = () => {
    if (pointCount < 3) {
      dispatch(setValidationError('A valid boundary polygon requires at least 3 vertices.'));
      dispatch(
        addToast({
          type: 'error',
          title: 'Incomplete Polygon',
          message: 'Please plot at least 3 points on the map.',
        })
      );
      return;
    }

    dispatch(createRegionFromDraft({ name: `Region ${regions.length + 1}` }));
    dispatch(
      addToast({
        type: 'success',
        title: 'Region Added',
        message: 'New drawn boundary region is now active and selectable for inspection.',
      })
    );
  };

  const handleOpenSave = () => {
    const targetRegion = activeRegion;
    if (!targetRegion) {
      dispatch(setValidationError('No active region selected to register.'));
      return;
    }
    setParcelName(targetRegion.name || `Parcel ${Date.now().toString().slice(-4)}`);
    setParcelType(targetRegion.landType || 'Government Public Buffer');
    setParcelAuthority(targetRegion.authority || 'Land Revenue Department');
    setShowSaveModal(true);
  };

  const handleConfirmSave = async (e) => {
    e.preventDefault();
    if (!activeRegion) return;

    const coords = activeRegion.geojson?.features?.[0]?.geometry?.coordinates?.[0] || [];
    if (coords.length < 3) return;

    const parcelId = activeRegion.id.startsWith('parcel_')
      ? activeRegion.id
      : `parcel_custom_${Date.now().toString().slice(-5)}`;

    setShowSaveModal(false);

    await dispatch(
      saveCustomBoundary({
        id: parcelId,
        name: parcelName,
        land_type: parcelType,
        authority: parcelAuthority,
        coordinates: coords,
      })
    );

    dispatch(
      setRegionSaved({
        id: activeRegion.id,
        name: parcelName,
        landType: parcelType,
        authority: parcelAuthority,
      })
    );
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '10px 14px',
        background: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 8,
        fontSize: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 700, color: tokens.colors.textSecondary, textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.05em' }}>
            Map Drawing:
          </span>

          <button
            type="button"
            onClick={drawingMode === 'draw' ? handleClear : handleStartDraw}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '5px 10px',
              borderRadius: 6,
              background: drawingMode === 'draw' ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${drawingMode === 'draw' ? tokens.colors.accentPrimary : 'rgba(255,255,255,0.1)'}`,
              color: drawingMode === 'draw' ? tokens.colors.accentPrimary : tokens.colors.textPrimary,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 11,
              transition: tokens.transitions.fast,
            }}
          >
            <span>{drawingMode === 'draw' ? '● Drawing Active' : '✏️ Draw Polygon'}</span>
          </button>

          {activeRegion && (
            <button
              type="button"
              onClick={drawingMode === 'edit' ? handleClear : handleStartEdit}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '5px 10px',
                borderRadius: 6,
                background: drawingMode === 'edit' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${drawingMode === 'edit' ? tokens.colors.pendingReview : 'rgba(255,255,255,0.1)'}`,
                color: drawingMode === 'edit' ? tokens.colors.pendingReview : tokens.colors.textSecondary,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 11,
                transition: tokens.transitions.fast,
              }}
            >
              <span>📐 Edit Active</span>
            </button>
          )}

          {(drawingMode !== 'idle' || pointCount > 0) && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '5px 10px',
                borderRadius: 6,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: tokens.colors.flaggedViolation,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 11,
              }}
            >
              <span>✕ Cancel</span>
            </button>
          )}
        </div>

        {/* Action Buttons: Add Region or Save to Database */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {drawingMode !== 'idle' && pointCount >= 3 ? (
            <button
              type="button"
              onClick={handleCompleteDrawing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 12px',
                borderRadius: 6,
                background: tokens.colors.accentPrimary,
                border: `1px solid ${tokens.colors.accentPrimary}`,
                color: '#070a13',
                fontWeight: 700,
                fontSize: 11,
                cursor: 'pointer',
                boxShadow: '0 0 10px rgba(6, 182, 212, 0.35)',
              }}
            >
              <span>✓ Add as Selectable Region</span>
            </button>
          ) : activeRegion ? (
            <button
              type="button"
              onClick={handleOpenSave}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 12px',
                borderRadius: 6,
                background: activeRegion.isSaved ? 'rgba(16, 185, 129, 0.15)' : tokens.colors.legalBoundary,
                border: `1px solid ${tokens.colors.legalBoundary}`,
                color: activeRegion.isSaved ? tokens.colors.legalBoundary : '#070a13',
                fontWeight: 700,
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              <span>{activeRegion.isSaved ? '✓ Saved to DB' : '💾 Register Boundary'}</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Drawing Instructions & Point Counter */}
      {drawingMode !== 'idle' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 11,
            color: tokens.colors.textMuted,
            fontFamily: tokens.typography.fontFamilyMono,
          }}
        >
          <span>
            {pointCount === 0
              ? '🎯 Click anywhere on the map to place vertices (at least 3 points).'
              : `📌 ${pointCount} vertices placed (${computedArea.toLocaleString()} m²). Click "Add as Selectable Region" to finish.`}
          </span>
          {validationError && (
            <span style={{ color: tokens.colors.flaggedViolation, fontWeight: 700 }}>
              ⚠ {validationError}
            </span>
          )}
        </div>
      )}

      {/* Save Boundary Modal */}
      {showSaveModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 99999,
              background: 'rgba(4, 7, 15, 0.85)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                background: tokens.colors.bgCard,
                border: `1px solid ${tokens.colors.borderMedium}`,
                borderRadius: tokens.radii.md,
                padding: 22,
                maxWidth: 460,
                width: '100%',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85)',
                position: 'relative',
                zIndex: 100000,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: tokens.colors.textPrimary }}>
                  Register Legal Parcel to Database
                </h3>
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  style={{ background: 'none', border: 'none', color: tokens.colors.textMuted, cursor: 'pointer', fontSize: 18, lineHeight: 1 }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleConfirmSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: tokens.colors.textSecondary, fontFamily: tokens.typography.fontFamilyMono, display: 'block', marginBottom: 4 }}>
                    PARCEL NAME
                  </label>
                  <input
                    className="input-field"
                    type="text"
                    value={parcelName}
                    onChange={(e) => setParcelName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, color: tokens.colors.textSecondary, fontFamily: tokens.typography.fontFamilyMono, display: 'block', marginBottom: 4 }}>
                    LAND CLASSIFICATION
                  </label>
                  <input
                    className="input-field"
                    type="text"
                    value={parcelType}
                    onChange={(e) => setParcelType(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, color: tokens.colors.textSecondary, fontFamily: tokens.typography.fontFamilyMono, display: 'block', marginBottom: 4 }}>
                    REGISTERING AUTHORITY
                  </label>
                  <input
                    className="input-field"
                    type="text"
                    value={parcelAuthority}
                    onChange={(e) => setParcelAuthority(e.target.value)}
                    required
                  />
                </div>

                <div
                  style={{
                    padding: '8px 10px',
                    borderRadius: 6,
                    background: 'rgba(6, 182, 212, 0.08)',
                    border: '1px solid rgba(6, 182, 212, 0.2)',
                    fontSize: 11,
                    fontFamily: tokens.typography.fontFamilyMono,
                    color: tokens.colors.accentPrimary,
                  }}
                >
                  Active Region: <strong>{activeRegion?.name}</strong> · Area: <strong>{activeRegion?.areaSqM.toLocaleString()} m²</strong> ({(activeRegion?.areaSqM / 10000).toFixed(2)} ha)
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setShowSaveModal(false)}
                    style={{ padding: '6px 12px', fontSize: 12 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ padding: '6px 14px', fontSize: 12, background: tokens.colors.legalBoundary, color: '#070a13' }}
                  >
                    Confirm &amp; Register
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
