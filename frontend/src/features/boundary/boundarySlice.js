import { createSlice } from '@reduxjs/toolkit';
import { fetchBoundaryData, saveCustomBoundary, scanRegionThunk } from './boundaryThunks';
import { runAgentScan } from '../agent/agentThunks';
import { calculateAreaSqM, calculateBbox, calculateCentroid, createPolygonGeoJson } from '../../utils/geoUtils';

// Initial default registered parcels
const initialPresets = [
  {
    id: 'parcel_001',
    name: 'Sector 4 Public Buffer',
    landType: 'Government Public Land',
    authority: 'Land Revenue Department',
    isSaved: true,
    scanStatus: 'idle',
    scanSeverity: null,
    overlapPercent: null,
    flaggedRegion: null,
    geojson: createPolygonGeoJson('parcel_001', 'Sector 4 Public Buffer', [
      [77.5926, 12.9736],
      [77.5966, 12.9736],
      [77.5966, 12.9696],
      [77.5926, 12.9696],
      [77.5926, 12.9736],
    ]),
    centroid: [12.9716, 77.5946],
    bbox: [77.5926, 12.9696, 77.5966, 12.9736],
    areaSqM: 196800,
  },
  {
    id: 'parcel_002',
    name: 'North Forest Reserve',
    landType: 'Protected Forest Buffer',
    authority: 'Forest & Wildlife Authority',
    isSaved: true,
    scanStatus: 'idle',
    scanSeverity: null,
    overlapPercent: null,
    flaggedRegion: null,
    geojson: createPolygonGeoJson('parcel_002', 'North Forest Reserve', [
      [77.5930, 12.9835],
      [77.5970, 12.9835],
      [77.5970, 12.9795],
      [77.5930, 12.9795],
      [77.5930, 12.9835],
    ]),
    centroid: [12.9815, 77.5950],
    bbox: [77.5930, 12.9795, 77.5970, 12.9835],
    areaSqM: 196800,
  },
  {
    id: 'parcel_003',
    name: 'Industrial Corridor',
    landType: 'Industrial Buffer Zone',
    authority: 'Industrial Development Board',
    isSaved: true,
    scanStatus: 'idle',
    scanSeverity: null,
    overlapPercent: null,
    flaggedRegion: null,
    geojson: createPolygonGeoJson('parcel_003', 'Industrial Corridor', [
      [77.6960, 12.9955],
      [77.7000, 12.9955],
      [77.7000, 12.9915],
      [77.6960, 12.9915],
      [77.6960, 12.9955],
    ]),
    centroid: [12.9935, 77.6980],
    bbox: [77.6960, 12.9915, 77.7000, 12.9955],
    areaSqM: 196800,
  },
];

const initialState = {
  regions: initialPresets,
  activeRegionId: 'parcel_001',

  // Interactive Drawing & Layer State
  drawingMode: 'idle', // 'idle' | 'draw' | 'edit'
  draftPoints: [], // [[lat, lng], ...]
  validationError: null,
  baseLayer: 'dark', // 'dark' | 'light' | 'satellite'
  showLegalBoundary: true,
  showEncroachment: true,
  status: 'idle',
  error: null,
};

let customRegionCounter = 1;

const boundarySlice = createSlice({
  name: 'boundary',
  initialState,
  reducers: {
    // Select Active Region
    selectRegion: (state, action) => {
      state.activeRegionId = action.payload;
      state.drawingMode = 'idle';
      state.draftPoints = [];
      state.validationError = null;
    },

    // Add New Region
    addRegion: (state, action) => {
      const region = action.payload;
      const existingIdx = state.regions.findIndex((r) => r.id === region.id);
      if (existingIdx >= 0) {
        state.regions[existingIdx] = { ...state.regions[existingIdx], ...region };
      } else {
        state.regions.push(region);
      }
      state.activeRegionId = region.id;
      state.drawingMode = 'idle';
      state.draftPoints = [];
    },

    // Add Region from Finished Drawing Draft
    createRegionFromDraft: (state, action) => {
      if (state.draftPoints.length < 3) return;

      const coords = state.draftPoints.map(([lat, lng]) => [lng, lat]);
      const id = `region_drawn_${Date.now().toString().slice(-5)}`;
      const name = action.payload?.name || `Region ${state.regions.length + 1}`;
      const geojson = createPolygonGeoJson(id, name, coords, {
        land_type: action.payload?.landType || 'Custom Parcel Area',
        authority: action.payload?.authority || 'Local Jurisdiction',
      });

      const areaSqM = calculateAreaSqM(coords);
      const centroid = calculateCentroid(coords);
      const bbox = calculateBbox(coords);

      const newRegion = {
        id,
        name,
        landType: action.payload?.landType || 'Custom Parcel Area',
        authority: action.payload?.authority || 'Local Jurisdiction',
        isSaved: false,
        scanStatus: 'idle',
        scanSeverity: null,
        overlapPercent: null,
        flaggedRegion: null,
        geojson,
        centroid,
        bbox,
        areaSqM,
      };

      state.regions.push(newRegion);
      state.activeRegionId = id;
      state.drawingMode = 'idle';
      state.draftPoints = [];
      state.validationError = null;
    },

    // Rename Region
    renameRegion: (state, action) => {
      const { id, name } = action.payload;
      const region = state.regions.find((r) => r.id === id);
      if (region) {
        region.name = name;
        if (region.geojson?.features?.[0]?.properties) {
          region.geojson.features[0].properties.name = name;
        }
      }
    },

    // Remove Region
    removeRegion: (state, action) => {
      const idToRemove = action.payload;
      state.regions = state.regions.filter((r) => r.id !== idToRemove);
      if (state.activeRegionId === idToRemove) {
        state.activeRegionId = state.regions.length > 0 ? state.regions[0].id : null;
      }
    },

    // Mark Region as Saved
    setRegionSaved: (state, action) => {
      const { id, name, landType, authority } = action.payload;
      const region = state.regions.find((r) => r.id === id);
      if (region) {
        region.isSaved = true;
        if (name) region.name = name;
        if (landType) region.landType = landType;
        if (authority) region.authority = authority;
      }
    },

    // Set Region Scanning state
    setRegionScanning: (state, action) => {
      const { id, isScanning } = action.payload;
      const region = state.regions.find((r) => r.id === id);
      if (region) {
        region.scanStatus = isScanning ? 'scanning' : region.scanStatus;
      }
    },

    // Set Scan Result for Region
    setRegionScanResult: (state, action) => {
      const { id, scanSeverity, overlapPercent, flaggedRegion } = action.payload;
      const region = state.regions.find((r) => r.id === id);
      if (region) {
        region.scanStatus = 'scanned';
        region.scanSeverity = scanSeverity;
        region.overlapPercent = overlapPercent;
        region.flaggedRegion = flaggedRegion;
      }
    },

    // Drawing Controls
    setDrawingMode: (state, action) => {
      state.drawingMode = action.payload;
      state.validationError = null;
    },
    setDraftPoints: (state, action) => {
      state.draftPoints = action.payload;
      state.validationError = null;
    },
    addDraftPoint: (state, action) => {
      state.draftPoints.push(action.payload);
      state.validationError = null;
    },
    removeDraftPoint: (state, action) => {
      state.draftPoints = state.draftPoints.filter((_, idx) => idx !== action.payload);
    },
    clearDraftPoints: (state) => {
      state.draftPoints = [];
      state.validationError = null;
    },
    loadActiveRegionToDraft: (state) => {
      const activeRegion = state.regions.find((r) => r.id === state.activeRegionId);
      if (activeRegion?.geojson?.features?.[0]?.geometry?.coordinates?.[0]) {
        const coords = activeRegion.geojson.features[0].geometry.coordinates[0];
        // Leaflet [lat, lon]
        state.draftPoints = coords.map(([lon, lat]) => [lat, lon]);
        state.drawingMode = 'edit';
      }
    },
    setValidationError: (state, action) => {
      state.validationError = action.payload;
    },
    setBaseLayer: (state, action) => {
      state.baseLayer = action.payload;
    },
    toggleLegalBoundary: (state) => {
      state.showLegalBoundary = !state.showLegalBoundary;
    },
    toggleEncroachment: (state) => {
      state.showEncroachment = !state.showEncroachment;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBoundaryData.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchBoundaryData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const p = action.payload;
        if (p && p.geojson) {
          const coords = p.geojson.features?.[0]?.geometry?.coordinates?.[0] || [];
          const areaSqM = calculateAreaSqM(coords);
          const centroid = calculateCentroid(coords);
          const bbox = calculateBbox(coords);

          const fetchedRegion = {
            id: p.id,
            name: p.name || p.id,
            landType: p.land_type || 'Government Land',
            authority: p.authority || 'Land Revenue Department',
            isSaved: true,
            scanStatus: 'idle',
            scanSeverity: null,
            overlapPercent: null,
            flaggedRegion: null,
            geojson: p.geojson,
            centroid,
            bbox,
            areaSqM,
          };

          const existingIdx = state.regions.findIndex((r) => r.id === p.id);
          if (existingIdx >= 0) {
            state.regions[existingIdx] = { ...state.regions[existingIdx], ...fetchedRegion };
          } else {
            state.regions.push(fetchedRegion);
          }
          state.activeRegionId = p.id;
          state.drawingMode = 'idle';
          state.draftPoints = [];
        }
      })
      .addCase(fetchBoundaryData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to load boundary GeoJSON';
      })
      .addCase(saveCustomBoundary.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(saveCustomBoundary.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.drawingMode = 'idle';
        state.draftPoints = [];
        const savedParcel = action.payload?.parcel;
        if (savedParcel) {
          const region = state.regions.find((r) => r.id === savedParcel.id);
          if (region) {
            region.isSaved = true;
            region.name = savedParcel.name;
            region.landType = savedParcel.land_type;
            region.authority = savedParcel.authority;
          }
        }
      })
      .addCase(runAgentScan.fulfilled, (state, action) => {
        const steps = action.payload.steps || [];
        const boundaryStep = steps.find((s) => s.node_name === 'boundary_check_node');
        const activeRegion = state.regions.find((r) => r.id === state.activeRegionId);

        if (activeRegion && boundaryStep && boundaryStep.output?.flagged_region_geojson) {
          const flagged = {
            ...boundaryStep.output.flagged_region_geojson,
            properties: {
              ...boundaryStep.output.flagged_region_geojson.properties,
              severity: action.payload.report?.severity || 'severe',
              overlap_percent: action.payload.report?.overlap_percent || 75.63,
            },
          };
          activeRegion.scanStatus = 'scanned';
          activeRegion.scanSeverity = action.payload.report?.severity || 'severe';
          activeRegion.overlapPercent = action.payload.report?.overlap_percent || 75.63;
          activeRegion.flaggedRegion = flagged;
        } else if (activeRegion) {
          activeRegion.scanStatus = 'scanned';
          activeRegion.scanSeverity = action.payload.report?.severity || 'none';
          activeRegion.overlapPercent = action.payload.report?.overlap_percent || 0.0;
        }
      });
  },
});

export const {
  selectRegion,
  addRegion,
  createRegionFromDraft,
  renameRegion,
  removeRegion,
  setRegionSaved,
  setRegionScanning,
  setRegionScanResult,
  setDrawingMode,
  setDraftPoints,
  addDraftPoint,
  removeDraftPoint,
  clearDraftPoints,
  loadActiveRegionToDraft,
  setValidationError,
  setBaseLayer,
  toggleLegalBoundary,
  toggleEncroachment,
} = boundarySlice.actions;

export default boundarySlice.reducer;
