import { createAsyncThunk } from '@reduxjs/toolkit';
import client from '../../api/client';

export const runAgentScan = createAsyncThunk(
  'agent/runAgentScan',
  async (payload = { imagery_id: 'img_001', boundary_geojson_id: 'parcel_001' }, { rejectWithValue }) => {
    try {
      const response = await client.post('/api/agent/run', payload);
      return response.data; // { steps: [...], report: {...} }
    } catch (error) {
      const message = error.response?.data?.detail || error.message || 'Agent scan failed';
      return rejectWithValue(message);
    }
  }
);
