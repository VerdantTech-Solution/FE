import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  initialized: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  status: 'idle',
  error: null,
  initialized: false,
};

const parseStoredUser = (storedUser: string | null): User | null => {
  if (!storedUser || storedUser === 'undefined') {
    return null;
  }

  try {
    const parsed = JSON.parse(storedUser) as User;
    if (parsed && parsed.id && parsed.fullName && parsed.email) {
      return parsed;
    }
  } catch (error) {
    console.error('[authSlice] Failed to parse stored user', error);
  }

  return null;
};

export const initializeAuth = createAsyncThunk('auth/initialize', async () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;

  const user = parseStoredUser(storedUser);

  if (!token || !user) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }
    return { token: null, user: null };
  }

  return { token, user };
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: User;
        token: string;
      }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.status = 'succeeded';
      state.error = null;
      state.initialized = true;
    },
    clearCredentials: (state) => {
      state.user = null;
      state.token = null;
      state.status = 'idle';
      state.error = null;
      state.initialized = true;
    },
    updateUserProfile: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.initialized = true;
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Không thể khởi tạo trạng thái đăng nhập';
        state.user = null;
        state.token = null;
        state.initialized = true;
      });
  },
});

export const { setCredentials, clearCredentials, updateUserProfile } = authSlice.actions;

export const selectAuthUser = (state: RootState) => state.auth.user;
export const selectAuthToken = (state: RootState) => state.auth.token;
export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectAuthInitialized = (state: RootState) => state.auth.initialized;
export const selectIsAuthenticated = (state: RootState) => Boolean(state.auth.user && state.auth.token);

export default authSlice.reducer;

