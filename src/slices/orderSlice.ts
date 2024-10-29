/* eslint-disable no-param-reassign */
import axios from 'axios';
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { UserInterface, UserProfileType, UserSignupInterface, UserLoginInterface } from '@/types/user/User';
import { routes } from '@/routes';

type KeysUserInitialState = keyof UserInterface;

export const fetchOrder = createAsyncThunk(
  'user/fetchOrder',
  async (data: UserLoginInterface) => {
    const response = await axios.post(routes.login, data);
    return response.data;
  },
);

export const initialState: { [K in keyof Partial<UserInterface>]: UserInterface[K] } = {
  loadingStatus: 'idle',
  error: null,
};

const orderSlice = createSlice({
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
      .addCase(fetchOrder.pending, (state) => {
        state.loadingStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchOrder.fulfilled, (state, { payload }
        : PayloadAction<{ code: number, user: UserInterface }>) => {
        if (payload.code === 1) {
          const entries = Object.entries(payload.user);
          entries.forEach(([key, value]) => { state[key] = value; });
        }
        state.loadingStatus = 'finish';
        state.error = null;
      })
      .addCase(fetchOrder.rejected, (state, action) => {
        state.loadingStatus = 'failed';
        state.error = action.error.message ?? null;
      });
  },
});

export const { removeToken } = orderSlice.actions;

export default orderSlice.reducer;
