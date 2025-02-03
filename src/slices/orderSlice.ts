import axios from 'axios';
import { createSlice, createAsyncThunk, createEntityAdapter, type PayloadAction } from '@reduxjs/toolkit';

import { routes } from '@/routes';
import type { OrderInterface } from '@/types/order/Order';
import type { InitialState } from '@/types/InitialState';
import type { RootState } from '@/slices';
import type { CartItemInterface } from '@/types/cart/Cart';
import type { GradeFormInterface } from '@/types/order/Grade';
import type { ItemGradeEntity } from '@server/db/entities/item.grade.entity';
import type { OrderPositionEntity } from '@server/db/entities/order.position.entity';
import type { PromotionalInterface } from '@/types/promotional/PromotionalInterface';

export interface OrderResponseInterface {
  code: number;
  order: OrderInterface;
}

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
  async ({ cart, promotional, deliveryPrice }: { cart: CartItemInterface[]; promotional?: PromotionalInterface; deliveryPrice: number; }, { rejectWithValue }) => {
    try {
      const response = await axios.post<OrderResponseInterface>(routes.createOrder, { cart, promotional, deliveryPrice });
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e.response.data);
    }
  },
);

export const updateOrder = createAsyncThunk(
  'order/updateOrder',
  async ({ id, data }: { id: number; data: Partial<OrderInterface>; }, { rejectWithValue }) => {
    try {
      const response = await axios.patch<OrderResponseInterface>(routes.crudOrder(id), data);
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e.response.data);
    }
  },
);

export const cancelOrder = createAsyncThunk(
  'order/cancelOrder',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await axios.get<OrderResponseInterface>(routes.cancelOrder(id));
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e.response.data);
    }
  },
);

export const createGrade = createAsyncThunk(
  'order/createGrade',
  async (data: GradeFormInterface, { rejectWithValue }) => {
    try {
      const response = await axios.post<{ code: number; grade: ItemGradeEntity; }>(routes.createGrade(data.position.id), data);
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
      })
      .addCase(updateOrder.pending, (state) => {
        state.loadingStatus = 'loading';
        state.error = null;
      })
      .addCase(updateOrder.fulfilled, (state, { payload }) => {
        if (payload.code === 1) {
          orderAdapter.updateOne(state, { id: payload.order.id, changes: payload.order });
        }
        state.loadingStatus = 'finish';
        state.error = null;
      })
      .addCase(updateOrder.rejected, (state, { payload }: PayloadAction<any>) => {
        state.loadingStatus = 'failed';
        state.error = payload.error;
      })
      .addCase(cancelOrder.pending, (state) => {
        state.loadingStatus = 'loading';
        state.error = null;
      })
      .addCase(cancelOrder.fulfilled, (state, { payload }) => {
        if (payload.code === 1) {
          orderAdapter.updateOne(state, { id: payload.order.id, changes: payload.order });
        }
        state.loadingStatus = 'finish';
        state.error = null;
      })
      .addCase(cancelOrder.rejected, (state, { payload }: PayloadAction<any>) => {
        state.loadingStatus = 'failed';
        state.error = payload.error;
      })
      .addCase(createGrade.pending, (state) => {
        state.loadingStatus = 'loading';
        state.error = null;
      })
      .addCase(createGrade.fulfilled, (state, { payload }) => {
        if (payload.code === 1) {
          const orderId = payload.grade.position.order.id;
          const orderPositions = orderAdapter.getSelectors().selectById(state, orderId).positions;
          const positions = orderPositions.map((position) => position.id === payload.grade.position.id ? ({ ...position, grade: payload.grade }) : position) as OrderPositionEntity[];
          orderAdapter.updateOne(state, { id: orderId, changes: { positions } });
        }
        state.loadingStatus = 'finish';
        state.error = null;
      })
      .addCase(createGrade.rejected, (state, { payload }: PayloadAction<any>) => {
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
