import axios from 'axios';
import {
  createSlice, createAsyncThunk, PayloadAction, createEntityAdapter,
} from '@reduxjs/toolkit';

import type { OrderInterface } from '@/types/order/Order';
import type { InitialState } from '@/types/InitialState';
import { routes } from '@/routes';
import type { RootState } from '@/slices';

export const orderAdapter = createEntityAdapter<OrderInterface>();

export const fetchOrders = createAsyncThunk(
  'order/fetchOrders',
  async () => {
    const response = await axios.get(routes.getOrders);
    return response.data;
  },
);

const initialState: InitialState = {
  loadingStatus: 'idle',
  error: null,
};

const orderSlice = createSlice({
  name: 'order',
  initialState: orderAdapter.getInitialState(initialState),
  reducers: {
    createOne: orderAdapter.addOne,
    createMany: orderAdapter.addMany,
    updateOne: orderAdapter.updateOne,
    removeOne: orderAdapter.removeOne,
    removeMany: orderAdapter.removeAll,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loadingStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, { payload }
        : PayloadAction<{ code: number, orders: OrderInterface[] }>) => {
        if (payload.code === 1) {
          orderAdapter.addMany(state, payload.orders);
        }
        state.loadingStatus = 'finish';
        state.error = null;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loadingStatus = 'failed';
        state.error = action.error.message ?? null;
      });
  },
});

export const {
  createOne, updateOne, removeOne, removeMany,
} = orderSlice.actions;

export const selectors = orderAdapter.getSelectors<RootState>((state) => state.order);

export default orderSlice.reducer;
