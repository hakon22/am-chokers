import axios from 'axios';
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';

import type {
  UserInterface, UserProfileType, UserSignupInterface, UserLoginInterface,
} from '@/types/user/User';
import type { ItemEntity } from '@server/db/entities/item.entity';
import type { InitialState } from '@/types/InitialState';
import { routes } from '@/routes';

type KeysUserInitialState = keyof UserInterface;

const storageKey = process.env.NEXT_PUBLIC_STORAGE_KEY ?? '';

export const fetchLogin = createAsyncThunk(
  'user/fetchLogin',
  async (data: UserLoginInterface, { rejectWithValue }) => {
    try {
      const response = await axios.post<{ code: number, user: UserInterface }>(routes.login, data);
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e.response.data);
    }
  },
);

export const fetchSignup = createAsyncThunk(
  'user/fetchSignup',
  async (data: UserSignupInterface, { rejectWithValue }) => {
    try {
      const response = await axios.post<{ code: number, user: UserInterface }>(routes.signup, data);
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e.response.data);
    }
  },
);

export const fetchTokenStorage = createAsyncThunk(
  'user/fetchTokenStorage',
  async (refreshTokenStorage: string, { rejectWithValue }) => {
    try {
      const response = await axios.get<{ code: number, user: UserInterface }>(routes.updateTokens, {
        headers: { Authorization: `Bearer ${refreshTokenStorage}` },
      });
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e.response.data);
    }
  },
);

export const fetchConfirmCode = createAsyncThunk(
  'user/fetchConfirmCode',
  async (data: { phone: string, key?: string, code?: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post<{ code: number, key: string, phone: string }>(routes.confirmPhone, data);
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e.response.data);
    }
  },
);

export const updateTokens = createAsyncThunk(
  'user/updateTokens',
  async (refresh: string | undefined, { rejectWithValue }) => {
    try {
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
        const { data } = await axios.get<{ code: number, user: UserInterface }>(routes.updateTokens, {
          headers: { Authorization: `Bearer ${refresh}` },
        });
        if (data.user.refreshToken) {
          return data;
        }
      }
      return null;
    } catch (e: any) {
      return rejectWithValue(e.response.data);
    }
  },
);

export const addFavorites = createAsyncThunk(
  'user/addFavorites',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await axios.get<{ code: number; item: ItemEntity }>(routes.addFavorites(id));
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e.response.data);
    }
  },
);

export const removeFavorites = createAsyncThunk(
  'user/removeFavorites',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await axios.delete<{ code: number; item: ItemEntity }>(routes.removeFavorites(id));
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e.response.data);
    }
  },
);

const initialState: { [K in keyof (Partial<UserInterface> & InitialState)]: UserInterface[K] } = {
  loadingStatus: 'idle',
  error: null,
  favorites: [],
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
    setUrl: (state, { payload }: PayloadAction<string>) => {
      state.url = payload;
    },
    removeUrl: (state) => {
      delete state.url;
    },
    removeTelegramId: (state) => {
      delete state.telegramId;
    },
    userProfileUpdate: (state, { payload }: PayloadAction<UserProfileType>) => {
      const { phone, name } = payload;
      if (phone) {
        state.phone = phone;
        if (state?.key) {
          delete state.key;
        }
      }
      if (name) {
        state.name = name;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLogin.pending, (state) => {
        state.loadingStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchLogin.fulfilled, (state, { payload }) => {
        if (payload.code === 1) {
          const entries = Object.entries(payload.user);
          entries.forEach(([key, value]) => { state[key] = value; });
          window.localStorage.setItem(storageKey, payload.user.refreshToken);
        }
        state.loadingStatus = 'finish';
        state.error = null;
      })
      .addCase(fetchLogin.rejected, (state, { payload }: PayloadAction<any>) => {
        state.loadingStatus = 'failed';
        state.error = payload.error;
      })
      .addCase(fetchSignup.pending, (state) => {
        state.loadingStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchSignup.fulfilled, (state, { payload }) => {
        if (payload.code === 1) {
          const entries = Object.entries(payload.user);
          entries.forEach(([key, value]) => { state[key] = value; });
          window.localStorage.setItem(storageKey, payload.user.refreshToken);
        }
        state.loadingStatus = 'finish';
        state.error = null;
      })
      .addCase(fetchSignup.rejected, (state, { payload }: PayloadAction<any>) => {
        state.loadingStatus = 'failed';
        state.error = payload.error;
      })
      .addCase(fetchTokenStorage.pending, (state) => {
        state.loadingStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchTokenStorage.fulfilled, (state, { payload }) => {
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
      .addCase(fetchTokenStorage.rejected, (state, { payload }: PayloadAction<any>) => {
        state.loadingStatus = 'failed';
        state.error = payload.error;
        window.localStorage.removeItem(storageKey);
      })
      .addCase(fetchConfirmCode.pending, (state) => {
        state.loadingStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchConfirmCode.fulfilled, (state, { payload }) => {
        if (payload.code === 1) {
          state.key = payload.key;
          if (!state.id) {
            state.phone = payload.phone;
          }
        }
        state.loadingStatus = 'finish';
        state.error = null;
      })
      .addCase(fetchConfirmCode.rejected, (state, { payload }: PayloadAction<any>) => {
        state.loadingStatus = 'failed';
        state.error = payload.error;
      })
      .addCase(updateTokens.pending, (state) => {
        state.loadingStatus = 'loading';
        state.error = null;
      })
      .addCase(updateTokens.fulfilled, (state, { payload }) => {
        if (payload.code === 1) {
          const entries = Object.entries(payload.user);
          entries.forEach(([key, value]) => { state[key] = value; });
        }
        state.loadingStatus = 'finish';
        state.error = null;
      })
      .addCase(updateTokens.rejected, (state, { payload }: PayloadAction<any>) => {
        state.loadingStatus = 'failed';
        state.error = payload.error;
        window.localStorage.removeItem(storageKey);
      })
      .addCase(addFavorites.pending, (state) => {
        state.loadingStatus = 'loading';
        state.error = null;
      })
      .addCase(addFavorites.fulfilled, (state, { payload }) => {
        if (payload.code === 1) {
          state.favorites = [...state.favorites as ItemEntity[], payload.item];
        }
        state.loadingStatus = 'finish';
        state.error = null;
      })
      .addCase(addFavorites.rejected, (state, { payload }: PayloadAction<any>) => {
        state.loadingStatus = 'failed';
        state.error = payload.error;
      })
      .addCase(removeFavorites.pending, (state) => {
        state.loadingStatus = 'loading';
        state.error = null;
      })
      .addCase(removeFavorites.fulfilled, (state, { payload }) => {
        if (payload.code === 1) {
          state.favorites = state.favorites?.filter((item) => item.id !== payload.item.id);
        }
        state.loadingStatus = 'finish';
        state.error = null;
      })
      .addCase(removeFavorites.rejected, (state, { payload }: PayloadAction<any>) => {
        state.loadingStatus = 'failed';
        state.error = payload.error;
      });
  },
});

export const {
  removeToken, setUrl, removeUrl, removeTelegramId, userProfileUpdate,
} = userSlice.actions;

export default userSlice.reducer;
