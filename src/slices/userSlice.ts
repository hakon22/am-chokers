/* eslint-disable no-param-reassign */
import axios from 'axios';
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { UserInterface } from '@/types/user/User';
import { routes } from '@/routes';

type KeysUserInitialState = keyof UserInterface;

const storageKey = process.env.NEXT_PUBLIC_STORAGE_KEY ?? '';

export const fetchLogin = createAsyncThunk(
  'user/fetchLogin',
  async (data: { phone: string, password: string }) => {
    const response = await axios.post(routes.login, data);
    return response.data;
  },
);

export const fetchTokenStorage = createAsyncThunk(
  'user/fetchTokenStorage',
  async (refreshTokenStorage: string) => {
    const response = await axios.get(routes.updateTokens, {
      headers: { Authorization: `Bearer ${refreshTokenStorage}` },
    });
    return response.data;
  },
);

export const fetchConfirmCode = createAsyncThunk(
  'user/fetchConfirmCode',
  async (data: { phone: string, key?: string, code?: string }) => {
    const response = await axios.post(routes.confirmPhone, data);
    return response.data;
  },
);

export const updateTokens = createAsyncThunk(
  'user/updateTokens',
  async (refresh: string | undefined) => {
    const refreshTokenStorage = window.localStorage.getItem(storageKey);
    if (refreshTokenStorage) {
      const { data } = await axios.get(routes.updateTokens, {
        headers: { Authorization: `Bearer ${refreshTokenStorage}` },
      });
      if (data.user.refreshToken) {
        window.localStorage.setItem(storageKey, data.user.refreshToken);
        return data;
      }
    } else {
      const { data } = await axios.get(routes.updateTokens, {
        headers: { Authorization: `Bearer ${refresh}` },
      });
      if (data.user.refreshToken) {
        return data;
      }
    }
    return null;
  },
);

export const initialState: { [K in keyof Partial<UserInterface>]: UserInterface[K] } = {
  loadingStatus: 'idle',
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    removeToken: (state) => {
      const entries = Object.keys(state) as KeysUserInitialState[];
      entries.forEach((key) => {
        if (key !== 'loadingStatus' && key !== 'error') {
          delete state[key];
        }
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLogin.pending, (state) => {
        state.loadingStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchLogin.fulfilled, (state, { payload }
        : PayloadAction<{ code: number, user: UserInterface, crew?: { users: string, cars: string }, temporaryToken?: string }>) => {
        if (payload.code === 1) {
          const entries = Object.entries(payload.user);
          entries.forEach(([key, value]) => { state[key] = value; });
          window.localStorage.setItem(storageKey, payload.user.refreshToken);
        }
        state.loadingStatus = 'finish';
        state.error = null;
      })
      .addCase(fetchLogin.rejected, (state, action) => {
        state.loadingStatus = 'failed';
        state.error = action.error.message ?? null;
      })
      .addCase(fetchTokenStorage.pending, (state) => {
        state.loadingStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchTokenStorage.fulfilled, (state, { payload }
        : PayloadAction<{ code: number, user: UserInterface }>) => {
        if (payload.code === 1) {
          if (window.localStorage.getItem(storageKey)) {
            window.localStorage.setItem(storageKey, payload.user.refreshToken);
          }
          const entries = Object.entries(payload.user);
          entries.forEach(([key, value]) => { state[key] = value; });
        }
        state.loadingStatus = 'finish';
        state.error = null;
      })
      .addCase(fetchTokenStorage.rejected, (state, action) => {
        state.loadingStatus = 'failed';
        state.error = action.error.message ?? null;
        window.localStorage.removeItem(storageKey);
      })
      .addCase(fetchConfirmCode.pending, (state) => {
        state.loadingStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchConfirmCode.fulfilled, (state, { payload }
        : PayloadAction<{ code: number, key: string, phone: string }>) => {
        if (payload.code === 1) {
          state.key = payload.key;
          if (!state.id) {
            state.phone = payload.phone;
          }
        }
        state.loadingStatus = 'finish';
        state.error = null;
      })
      .addCase(fetchConfirmCode.rejected, (state, action) => {
        state.loadingStatus = 'failed';
        state.error = action.error.message ?? null;
      })
      .addCase(updateTokens.pending, (state) => {
        state.loadingStatus = 'loading';
        state.error = null;
      })
      .addCase(updateTokens.fulfilled, (state, { payload }
        : PayloadAction<{ code: number, user: UserInterface }>) => {
        if (payload.code === 1) {
          const entries = Object.entries(payload.user);
          entries.forEach(([key, value]) => { state[key] = value; });
        }
        state.loadingStatus = 'finish';
        state.error = null;
      })
      .addCase(updateTokens.rejected, (state, action) => {
        state.loadingStatus = 'failed';
        state.error = action.error.message ?? null;
        window.localStorage.removeItem(storageKey);
      });
  },
});

export const { removeToken } = userSlice.actions;

export default userSlice.reducer;
