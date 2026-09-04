import { configureStore } from '@reduxjs/toolkit';
import imageryReducer from '../features/imagery/imagerySlice';
import agentReducer from '../features/agent/agentSlice';
import reportReducer from '../features/report/reportSlice';
import boundaryReducer from '../features/boundary/boundarySlice';
import uiReducer from '../features/ui/uiSlice';

export const store = configureStore({
  reducer: {
    imagery: imageryReducer,
    agent: agentReducer,
    report: reportReducer,
    boundary: boundaryReducer,
    ui: uiReducer,
  },
});
