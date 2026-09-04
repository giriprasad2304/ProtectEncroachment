import { createAsyncThunk } from '@reduxjs/toolkit';
import client from '../../api/client';
import { setImageryUrls } from './imagerySlice';

export const fetchSatelliteImagery = createAsyncThunk(
  'imagery/fetchSatelliteImagery',
  async (payload = { lat: 12.9716, lon: 77.5946, date_before: '2023-01-15', date_after: '2024-02-20' }, { dispatch, rejectWithValue }) => {
    try {
      const response = await client.post('/api/imagery/fetch', payload);
      const data = response.data;
      
      // Update imagery URLs in Redux store
      const timestamp = Date.now();
      const beforeUrl = data.before_url ? `http://localhost:8000${data.before_url}?t=${timestamp}` : `http://localhost:8000/static/before.png?t=${timestamp}`;
      const afterUrl = data.after_url ? `http://localhost:8000${data.after_url}?t=${timestamp}` : `http://localhost:8000/static/after.png?t=${timestamp}`;
      const diffUrl = data.diff_url ? `http://localhost:8000${data.diff_url}?t=${timestamp}` : `http://localhost:8000/static/diff_overlay.png?t=${timestamp}`;

      dispatch(setImageryUrls({
        beforeUrl,
        afterUrl,
        diffUrl,
      }));

      return data;
    } catch (error) {
      const message = error.response?.data?.detail || error.message || 'Failed to fetch imagery';
      return rejectWithValue(message);
    }
  }
);
