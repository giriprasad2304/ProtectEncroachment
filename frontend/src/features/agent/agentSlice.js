import { createSlice } from '@reduxjs/toolkit';
import { runAgentScan } from './agentThunks';

const initialState = {
  rawSteps: [],
  visibleSteps: [],
  visibleCount: 0,
  status: 'idle', // 'idle' | 'loading' | 'revealing' | 'succeeded' | 'failed'
  error: null,
};

const agentSlice = createSlice({
  name: 'agent',
  initialState,
  reducers: {
    revealNextStep: (state) => {
      if (state.visibleCount < state.rawSteps.length) {
        state.visibleSteps.push(state.rawSteps[state.visibleCount]);
        state.visibleCount += 1;
        if (state.visibleCount === state.rawSteps.length) {
          state.status = 'succeeded';
        }
      }
    },
    revealAllSteps: (state) => {
      state.visibleSteps = [...state.rawSteps];
      state.visibleCount = state.rawSteps.length;
      state.status = 'succeeded';
    },
    resetAgentState: (state) => {
      state.rawSteps = [];
      state.visibleSteps = [];
      state.visibleCount = 0;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(runAgentScan.pending, (state) => {
        state.status = 'loading';
        state.error = null;
        state.rawSteps = [];
        state.visibleSteps = [];
        state.visibleCount = 0;
      })
      .addCase(runAgentScan.fulfilled, (state, action) => {
        state.rawSteps = action.payload.steps || [];
        state.visibleSteps = [];
        state.visibleCount = 0;
        state.status = 'revealing';
      })
      .addCase(runAgentScan.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to complete agent scan';
      });
  },
});

export const { revealNextStep, revealAllSteps, resetAgentState } = agentSlice.actions;
export default agentSlice.reducer;
