import React, { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Polygon,
  CircleMarker,
  ScaleControl,
  Popup,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import {
  selectRegion,
  addDraftPoint,
  setBaseLayer,
  toggleLegalBoundary,
  toggleEncroachment,
} from '../features/boundary/boundarySlice';
import BoundaryToolbar from './BoundaryToolbar';
import tokens from '../styles/tokens';
import 'leaflet/dist/leaflet.css';

const TILE_LAYERS = {
  dark: {
    name: 'Dark Matter',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
  },
  light: {
    name: 'Positron (Light)',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
  },
  satellite: {
    name: 'Satellite View',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
  },
};

// Fit bounds to active region or all regions
function MapViewController({ activeRegion, resetTrigger }) {
  const map = useMap();

  useEffect(() => {
    if (activeRegion?.geojson?.features?.[0]?.geometry?.coordinates?.[0]) {
      try {
        const coords = activeRegion.geojson.features[0].geometry.coordinates[0];
        const bounds = coords.map(([lng, lat]) => [lat, lng]);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17, animate: true });
      } catch (e) {
        console.error('Fit bounds error:', e);
      }
    }
  }, [activeRegion, resetTrigger, map]);

  return null;
}

// Map Drawing Click Listener
function MapDrawingHandler({ isDrawing, onAddPoint }) {
  useMapEvents({
    click(e) {
      if (isDrawing) {
        onAddPoint([e.latlng.lat, e.latlng.lng]);
      }
    },
  });
  return null;
}

export default function BoundaryMap() {
  const dispatch = useDispatch();
  const {
    regions,
    activeRegionId,
    drawingMode,
    draftPoints,
    baseLayer,
    showLegalBoundary,
    showEncroachment,
    status,
  } = useSelector((state) => state.boundary);

  const [resetTrigger, setResetTrigger] = useState(0);

  const activeRegion = useMemo(
    () => regions.find((r) => r.id === activeRegionId) || regions[0],
    [regions, activeRegionId]
  );

  const center = activeRegion?.centroid || [12.9736, 77.5958];

  const handleAddPoint = (point) => {
    dispatch(addDraftPoint(point));
  };

  const draftStyle = {
    color: '#f59e0b',
    weight: 2.5,
    fillColor: '#f59e0b',
    fillOpacity: 0.25,
    dashArray: '6, 6',
  };

  const flaggedStyle = {
    color: '#ef4444',
    weight: 2.5,
    fillColor: '#ef4444',
    fillOpacity: 0.5,
  };

  return (
    <div className="glass" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Top Header & Active Parcel Badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div>
          <div className="section-title" style={{ marginBottom: 2 }}>
            <span className="dot" style={{ background: tokens.colors.legalBoundary }} />
            GIS Parcel Boundary Validation
          </div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: tokens.colors.textPrimary }}>
            {activeRegion?.name || 'Multi-Region Inspection Area'}
          </h3>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              background: 'rgba(6, 182, 212, 0.12)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              color: tokens.colors.accentPrimary,
              fontSize: 11,
              fontFamily: tokens.typography.fontFamilyMono,
              fontWeight: 600,
            }}
          >
            {regions.length} {regions.length === 1 ? 'Region' : 'Regions'} on Map
          </span>

          {activeRegion && (
            <span className="badge badge-emerald" style={{ fontSize: 10 }}>
              {activeRegion.landType || 'Government Land'}
            </span>
          )}
        </div>
      </div>

      {/* Boundary Drawing & Edit Toolbar */}
      <BoundaryToolbar />

      {/* Layer Toggles & Map Control Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
          fontSize: 11,
          fontFamily: tokens.typography.fontFamilyMono,
        }}
      >
        {/* Layer Visibility Checkboxes */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: tokens.colors.legalBoundary }}>
            <input
              type="checkbox"
              checked={showLegalBoundary}
              onChange={() => dispatch(toggleLegalBoundary())}
              style={{ accentColor: tokens.colors.legalBoundary }}
            />
            <span>Authorized Boundaries</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: tokens.colors.flaggedViolation }}>
            <input
              type="checkbox"
              checked={showEncroachment}
              onChange={() => dispatch(toggleEncroachment())}
              style={{ accentColor: tokens.colors.flaggedViolation }}
            />
            <span>Encroachment Overlays</span>
          </label>
        </div>

        {/* Base Layer Switcher & Reset View */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.5)', padding: 2, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              type="button"
              onClick={() => dispatch(setBaseLayer('dark'))}
              style={{
                background: baseLayer === 'dark' ? 'rgba(255,255,255,0.12)' : 'transparent',
                border: 'none',
                color: baseLayer === 'dark' ? '#f8fafc' : '#64748b',
                padding: '3px 8px',
                borderRadius: 4,
                fontSize: 10,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Dark
            </button>
            <button
              type="button"
              onClick={() => dispatch(setBaseLayer('light'))}
              style={{
                background: baseLayer === 'light' ? 'rgba(255,255,255,0.12)' : 'transparent',
                border: 'none',
                color: baseLayer === 'light' ? '#f8fafc' : '#64748b',
                padding: '3px 8px',
                borderRadius: 4,
                fontSize: 10,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Light
            </button>
            <button
              type="button"
              onClick={() => dispatch(setBaseLayer('satellite'))}
              style={{
                background: baseLayer === 'satellite' ? 'rgba(6, 182, 212, 0.25)' : 'transparent',
                border: 'none',
                color: baseLayer === 'satellite' ? tokens.colors.accentPrimary : '#64748b',
                padding: '3px 8px',
                borderRadius: 4,
                fontSize: 10,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              🛰️ Satellite
            </button>
          </div>

          <button
            type="button"
            onClick={() => setResetTrigger((prev) => prev + 1)}
            style={{
              padding: '4px 8px',
              borderRadius: 6,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#cbd5e1',
              fontSize: 10,
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
            title="Re-center map on active region"
          >
            <span>🎯 Focus Region</span>
          </button>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 380,
          borderRadius: 10,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.08)',
          background: '#070a13',
          cursor: drawingMode !== 'idle' ? 'crosshair' : 'grab',
        }}
      >
        {status === 'loading' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 25,
              background: 'rgba(7, 10, 19, 0.85)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <svg
              style={{ width: 22, height: 22, animation: 'spin 1s linear infinite', color: tokens.colors.accentPrimary }}
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25" />
              <path fill="currentColor" fillOpacity="0.75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span style={{ fontSize: 11, color: tokens.colors.textMuted, fontFamily: tokens.typography.fontFamilyMono }}>
              Synchronizing GIS Parcel Boundaries…
            </span>
          </div>
        )}

        <MapContainer center={center} zoom={16} scrollWheelZoom={true} style={{ width: '100%', height: '100%' }}>
          <TileLayer
            key={baseLayer}
            attribution={TILE_LAYERS[baseLayer]?.attribution || TILE_LAYERS.dark.attribution}
            url={TILE_LAYERS[baseLayer]?.url || TILE_LAYERS.dark.url}
          />

          <ScaleControl position="bottomright" metric={true} imperial={false} />
          <MapViewController activeRegion={activeRegion} resetTrigger={resetTrigger} />
          <MapDrawingHandler isDrawing={drawingMode !== 'idle'} onAddPoint={handleAddPoint} />

          {/* Render All Regions Simultaneously */}
          {showLegalBoundary &&
            regions.map((region) => {
              const isActive = region.id === activeRegionId;
              const isScanningRegion = region.scanStatus === 'scanning';

              const regionStyle = {
                color: isActive ? '#06b6d4' : '#10b981',
                weight: isActive ? 3.5 : 2,
                fillColor: isActive ? '#06b6d4' : '#10b981',
                fillOpacity: isActive ? 0.22 : 0.1,
                dashArray: isActive ? 'none' : '4, 4',
              };

              return (
                <React.Fragment key={`region-${region.id}-${JSON.stringify(region.geojson)}`}>
                  <GeoJSON
                    data={region.geojson}
                    style={regionStyle}
                    eventHandlers={{
                      click: () => {
                        if (drawingMode === 'idle') {
                          dispatch(selectRegion(region.id));
                        }
                      },
                    }}
                  >
                    <Popup>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#f8fafc', padding: 2 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: isActive ? '#06b6d4' : '#10b981', marginBottom: 4 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: isActive ? '#06b6d4' : '#10b981' }} />
                          {region.name} {isActive ? '(Active)' : ''}
                        </div>
                        <div style={{ fontSize: 11, color: '#cbd5e1', lineHeight: 1.6 }}>
                          <strong>Authority:</strong> {region.authority || 'Local Jurisdiction'}<br />
                          <strong>Type:</strong> {region.landType || 'Boundary Zone'}<br />
                          <strong>Area:</strong> {region.areaSqM.toLocaleString()} m² ({(region.areaSqM / 10000).toFixed(2)} ha)<br />
                          <strong>Scan Status:</strong>{' '}
                          <span style={{ color: region.scanSeverity === 'none' ? '#10b981' : region.scanSeverity ? '#ef4444' : '#94a3b8', fontWeight: 600 }}>
                            {region.scanStatus === 'scanned'
                              ? region.scanSeverity === 'none'
                                ? '✓ Clear (No Violations)'
                                : `🚨 ${region.scanSeverity?.toUpperCase()} (${region.overlapPercent}%)`
                              : 'Not Scanned Yet'}
                          </span>
                        </div>
                      </div>
                    </Popup>
                    <Tooltip sticky direction="top">
                      <div style={{ fontSize: 11 }}>
                        <strong>{region.name}</strong> {isActive ? '· [ACTIVE]' : '· Click to select'}
                      </div>
                    </Tooltip>
                  </GeoJSON>

                  {/* Centroid Scan Status Indicator Marker */}
                  {region.centroid && (
                    <CircleMarker
                      center={region.centroid}
                      radius={isActive ? 8 : 6}
                      pathOptions={{
                        color:
                          region.scanSeverity === 'none'
                            ? '#10b981'
                            : region.scanSeverity
                            ? '#ef4444'
                            : isActive
                            ? '#06b6d4'
                            : '#64748b',
                        fillColor:
                          region.scanSeverity === 'none'
                            ? '#10b981'
                            : region.scanSeverity
                            ? '#ef4444'
                            : isActive
                            ? '#06b6d4'
                            : '#334155',
                        fillOpacity: 0.9,
                        weight: isActive ? 2 : 1,
                      }}
                      eventHandlers={{
                        click: () => {
                          if (drawingMode === 'idle') {
                            dispatch(selectRegion(region.id));
                          }
                        },
                      }}
                    >
                      <Tooltip direction="center" permanent offset={[0, 0]}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: '#fff' }}>
                          {region.scanSeverity === 'none' ? '✓' : region.scanSeverity ? '!' : '●'}
                        </span>
                      </Tooltip>
                    </CircleMarker>
                  )}

                  {/* Flagged Violation Overlay for this region */}
                  {showEncroachment && region.flaggedRegion && (
                    <GeoJSON
                      key={`flagged-${region.id}-${JSON.stringify(region.flaggedRegion)}`}
                      data={region.flaggedRegion}
                      style={flaggedStyle}
                    >
                      <Popup>
                        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#f8fafc', padding: 2 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#ef4444', marginBottom: 4 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                            Encroachment Violation: {region.name}
                          </div>
                          <div style={{ fontSize: 11, color: '#cbd5e1', lineHeight: 1.6 }}>
                            <strong>Severity:</strong> <strong style={{ color: '#ef4444', textTransform: 'uppercase' }}>{region.scanSeverity || 'SEVERE'}</strong><br />
                            <strong>Outside Overlap:</strong> <strong style={{ color: '#ef4444' }}>{region.overlapPercent}%</strong>
                          </div>
                        </div>
                      </Popup>
                    </GeoJSON>
                  )}
                </React.Fragment>
              );
            })}

          {/* User Draft Polygon while Drawing */}
          {drawingMode !== 'idle' && draftPoints.length > 1 && (
            <Polygon positions={draftPoints} pathOptions={draftStyle} />
          )}

          {/* Draft Point Markers */}
          {drawingMode !== 'idle' &&
            draftPoints.map((pt, idx) => (
              <CircleMarker
                key={`draft-pt-${idx}`}
                center={pt}
                radius={idx === 0 ? 6 : 4}
                pathOptions={{
                  color: idx === 0 ? '#10b981' : '#f59e0b',
                  fillColor: idx === 0 ? '#10b981' : '#f59e0b',
                  fillOpacity: 0.9,
                }}
              >
                {idx === 0 && (
                  <Tooltip direction="top" offset={[0, -6]}>
                    <span style={{ fontSize: 10 }}>Start Point</span>
                  </Tooltip>
                )}
              </CircleMarker>
            ))}
        </MapContainer>

        {/* Map Legend */}
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            zIndex: 15,
            background: 'rgba(7, 10, 19, 0.88)',
            backdropFilter: 'blur(10px)',
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: 11,
            fontFamily: tokens.typography.fontFamilyMono,
            lineHeight: 1.6,
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            pointerEvents: 'auto',
          }}
        >
          <div style={{ fontWeight: 700, color: tokens.colors.textSecondary, marginBottom: 4, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Map Legend
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#cbd5e1' }}>
            <span style={{ width: 12, height: 3, background: '#06b6d4', display: 'inline-block' }} />
            <span>Active Selected Region</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#cbd5e1' }}>
            <span style={{ width: 12, height: 3, borderTop: '2px dashed #10b981', display: 'inline-block' }} />
            <span>Other Registered Regions</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#cbd5e1' }}>
            <span style={{ width: 10, height: 10, background: 'rgba(239, 68, 68, 0.6)', border: '1px solid #ef4444', borderRadius: 2, display: 'inline-block' }} />
            <span>Flagged Encroachment</span>
          </div>
          {draftPoints.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#cbd5e1' }}>
              <span style={{ width: 12, height: 3, borderTop: '2px dashed #f59e0b', display: 'inline-block' }} />
              <span>Draft Drawing ({draftPoints.length} pts)</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom info strip */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 11,
          color: tokens.colors.textMuted,
          fontFamily: tokens.typography.fontFamilyMono,
        }}
      >
        <span>Click any polygon on map to switch active inspection scope</span>
        <span>Centroid badges indicate latest audit clearance</span>
      </div>
    </div>
  );
}
