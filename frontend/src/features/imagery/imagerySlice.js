import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  beforeUrl: 'http://localhost:8000/static/before.png',
  afterUrl: 'http://localhost:8000/static/after.png',
  diffUrl: 'http://localhost:8000/static/diff_overlay.png',
  status: 'idle',
};

const imagerySlice = createSlice({
  name: 'imagery',
  initialState,
  reducers: {
    setImageryUrls: (state, action) => {
      if (action.payload.beforeUrl) state.beforeUrl = action.payload.beforeUrl;
      if (action.payload.afterUrl) state.afterUrl = action.payload.afterUrl;
      if (action.payload.diffUrl) state.diffUrl = action.payload.diffUrl;
    },
    setDiffUrl: (state, action) => {
      state.diffUrl = action.payload;
    },
  },
});

export const { setImageryUrls, setDiffUrl } = imagerySlice.actions;
export default imagerySlice.reducer;
