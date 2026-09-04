import { createAsyncThunk } from '@reduxjs/toolkit';
import client from '../../api/client';
import { addToast } from '../ui/uiSlice';
import { fetchSatelliteImagery } from '../imagery/imageryThunks';
import { runAgentScan } from '../agent/agentThunks';
import { calculateBboxWithBuffer } from '../../utils/geoUtils';

export const fetchBoundaryData = createAsyncThunk(
  'boundary/fetchBoundaryData',
  async (parcelId = 'parcel_001', { dispatch, rejectWithValue }) => {
    try {
      const response = await client.get(`/api/boundary/${parcelId}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.detail || error.message || 'Failed to fetch boundary data';
      dispatch(
        addToast({
          type: 'error',
          title: 'Boundary Fetch Error',
          message: `Could not load parcel ${parcelId}: ${message}`,
        })
      );
      return rejectWithValue(message);
    }
  }
);

export const saveCustomBoundary = createAsyncThunk(
  'boundary/saveCustomBoundary',
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const response = await client.post('/api/boundary/save', payload);
      dispatch(
        addToast({
          type: 'success',
          title: 'Boundary Registered',
          message: `Legal boundary for "${payload.name}" successfully saved.`,
        })
      );
      return response.data;
    } catch (error) {
      const message = error.response?.data?.detail || error.message || 'Failed to save custom boundary';
      dispatch(
        addToast({
          type: 'error',
          title: 'Save Failed',
          message: `Unable to save boundary: ${message}`,
        })
      );
      return rejectWithValue(message);
    }
  }
);

// High-level Thunk: Scans a specific region with Bounding Box & GeoJSON polygon
export const scanRegionThunk = createAsyncThunk(
  'boundary/scanRegionThunk',
  async (
    { region, dateBefore = '2023-01-15', dateAfter = '2024-02-20', demoMode = false },
    { dispatch, rejectWithValue }
  ) => {
    if (!region) {
      dispatch(
        addToast({
          type: 'warning',
          title: 'No Region Selected',
          message: 'Draw or select a region on the map first before running a scan.',
        })
      );
      return rejectWithValue('No region selected');
    }

    try {
      const coords = region.geojson?.features?.[0]?.geometry?.coordinates?.[0] || [];
      const bboxWithMargin = calculateBboxWithBuffer(coords, 0.1);
      const [lat, lon] = region.centroid || [12.9716, 77.5946];

      dispatch(
        addToast({
          type: 'info',
          title: demoMode ? 'Demo Region Scan' : `Scanning ${region.name}`,
          message: `Analyzing satellite captures and GIS polygon for "${region.name}"...`,
          duration: 3500,
        })
      );

      // 1. Fetch satellite imagery
      if (!demoMode) {
        await dispatch(
          fetchSatelliteImagery({
            lat,
            lon,
            bbox: bboxWithMargin,
            region_id: region.id,
            date_before: dateBefore,
            date_after: dateAfter,
          })
        );
      }

      // 2. Run LangGraph Agent Scan
      const agentResult = await dispatch(
        runAgentScan({
          imagery_id: 'img_001',
          region_id: region.id,
          boundary_geojson_id: region.isSaved ? region.id : null,
          boundary_geojson: region.geojson,
          bbox: bboxWithMargin,
          lat,
          lon,
          date_before: dateBefore,
          date_after: dateAfter,
        })
      );

      if (agentResult.error) {
        throw new Error(agentResult.error.message || 'Scan execution failed');
      }

      const report = agentResult.payload?.report;
      const isViolation = report?.violation_detected;

      dispatch(
        addToast({
          type: isViolation ? 'warning' : 'success',
          title: isViolation ? 'Violation Detected' : 'Region Clear',
          message: `Scan finished for ${region.name}: ${
            isViolation ? `Encroachment detected (${report?.overlap_percent}% overlap)` : 'No violations detected'
          }.`,
        })
      );

      return agentResult.payload;
    } catch (err) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Scan Failed',
          message: err.message || 'Encroachment scan pipeline encountered an error.',
        })
      );
      return rejectWithValue(err.message);
    }
  }
);
