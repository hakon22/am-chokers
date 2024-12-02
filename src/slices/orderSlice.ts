import axios from 'axios';
import { createSlice, createAsyncThunk, createEntityAdapter, type PayloadAction } from '@reduxjs/toolkit';

import type { OrderInterface } from '@/types/order/Order';
import type { InitialState } from '@/types/InitialState';
import { routes } from '@/routes';
import type { RootState } from '@/slices';
import type { CartItemInterface } from '@/types/cart/Cart';

export const orderAdapter = createEntityAdapter<OrderInterface>();

export const fetchOrders = createAsyncThunk(
  'order/fetchOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get<{ code: number, orders: OrderInterface[] }>(routes.getOrders);
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e.response.data);
    }
  },
);

export const createOrder = createAsyncThunk(
  'order/createOrder',
  async (data: CartItemInterface[], { rejectWithValue }) => {
    try {
      const response = await axios.post<{ code: number, order: OrderInterface }>(routes.createOrder, data);
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e.response.data);
    }
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
      .addCase(fetchOrders.fulfilled, (state, { payload }) => {
        if (payload.code === 1) {
          orderAdapter.addMany(state, payload.orders);
        }
        state.loadingStatus = 'finish';
        state.error = null;
      })
      .addCase(fetchOrders.rejected, (state, { payload }: PayloadAction<any>) => {
        state.loadingStatus = 'failed';
        state.error = payload.error;
      })
      .addCase(createOrder.pending, (state) => {
        state.loadingStatus = 'loading';
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, { payload }) => {
        if (payload.code === 1) {
          orderAdapter.addOne(state, payload.order);
        }
        state.loadingStatus = 'finish';
        state.error = null;
      })
      .addCase(createOrder.rejected, (state, { payload }: PayloadAction<any>) => {
        state.loadingStatus = 'failed';
        state.error = payload.error;
      });
  },
});

export const {
  createOne, updateOne, removeOne, removeMany,
} = orderSlice.actions;

export const selectors = orderAdapter.getSelectors<RootState>((state) => state.order);

export default orderSlice.reducer;
