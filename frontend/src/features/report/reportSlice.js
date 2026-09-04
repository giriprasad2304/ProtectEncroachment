import { createSlice } from '@reduxjs/toolkit';
import { runAgentScan } from '../agent/agentThunks';

const initialState = {
  data: null,
  incidentId: null,
  isFalsePositive: false,
  status: 'idle',
};

const reportSlice = createSlice({
  name: 'report',
  initialState,
  reducers: {
    setReportData: (state, action) => {
      state.data = action.payload;
      if (action.payload?.incident_id) {
        state.incidentId = action.payload.incident_id;
      }
    },
    markFalsePositive: (state) => {
      state.isFalsePositive = true;
      if (state.data) {
        state.data.is_false_positive = true;
      }
    },
    clearReport: (state) => {
      state.data = null;
      state.incidentId = null;
      state.isFalsePositive = false;
      state.status = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(runAgentScan.pending, (state) => {
        state.status = 'loading';
        state.isFalsePositive = false;
      })
      .addCase(runAgentScan.fulfilled, (state, action) => {
        const report = action.payload.report || null;
        state.data = report;
        state.incidentId = report?.incident_id || null;
        state.isFalsePositive = false;
        state.status = 'succeeded';
      })
      .addCase(runAgentScan.rejected, (state) => {
        state.status = 'failed';
      });
  },
});

export const { setReportData, markFalsePositive, clearReport } = reportSlice.actions;
export default reportSlice.reducer;
