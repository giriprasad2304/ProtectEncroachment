import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  toasts: [],
  demoMode: false,
  devMode: false,
  showOnboarding: true,
};

let toastIdCounter = 0;

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    addToast: (state, action) => {
      // payload: { type: 'success' | 'error' | 'warning' | 'info', title, message, duration }
      const id = `toast_${Date.now()}_${++toastIdCounter}`;
      state.toasts.push({
        id,
        type: action.payload.type || 'info',
        title: action.payload.title || '',
        message: action.payload.message || '',
        duration: action.payload.duration || 4000,
      });
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    clearToasts: (state) => {
      state.toasts = [];
    },
    toggleDemoMode: (state) => {
      state.demoMode = !state.demoMode;
    },
    setDemoMode: (state, action) => {
      state.demoMode = !!action.payload;
    },
    toggleDevMode: (state) => {
      state.devMode = !state.devMode;
    },
    setDevMode: (state, action) => {
      state.devMode = !!action.payload;
    },
    dismissOnboarding: (state) => {
      state.showOnboarding = false;
    },
    resetOnboarding: (state) => {
      state.showOnboarding = true;
    },
  },
});

export const {
  addToast,
  removeToast,
  clearToasts,
  toggleDemoMode,
  setDemoMode,
  toggleDevMode,
  setDevMode,
  dismissOnboarding,
  resetOnboarding,
} = uiSlice.actions;

export default uiSlice.reducer;
