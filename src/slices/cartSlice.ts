import axios from 'axios';
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';

import type { CartItemInterface, CartItemFormInterface } from '@/types/cart/Cart';
import type { InitialState } from '@/types/InitialState';
import { routes } from '@/routes';

interface CartStoreInterface extends InitialState {
  cart: CartItemInterface[];
}

export interface CartResponseInterface {
  code: number;
  cartItem: CartItemInterface;
}

export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (data: CartItemInterface[], { rejectWithValue }) => {
    try {
      const response = await axios.post<{ code: number, cart: CartItemInterface[] }>(routes.getCart, data);
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e.response.data);
    }
  },
);

export const addCartItem = createAsyncThunk(
  'cart/addCartItem',
  async (data: CartItemFormInterface, { rejectWithValue }) => {
    try {
      const response = await axios.post<CartResponseInterface>(routes.createCartItem, data);
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e.response.data);
    }
  },
);

export const incrementCartItem = createAsyncThunk(
  'cart/incrementCartItem',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.get<CartResponseInterface>(routes.incrementCartItem(id));
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e.response.data);
    }
  },
);

export const decrementCartItem = createAsyncThunk(
  'cart/decrementCartItem',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.get<CartResponseInterface>(routes.decrementCartItem(id));
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e.response.data);
    }
  },
);

export const removeCartItem = createAsyncThunk(
  'cart/removeCartItem',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.delete<CartResponseInterface>(routes.removeCartItem(id));
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e.response.data);
    }
  },
);

export const removeManyCartItems = createAsyncThunk(
  'cart/removeCartItems',
  async (data: string[], { rejectWithValue }) => {
    try {
      const response = await axios.post<{ code: number; }>(routes.removeManyCartItems, data);
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e.response.data);
    }
  },
);

const initialState: CartStoreInterface = {
  loadingStatus: 'idle',
  error: null,
  cart: [],
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    removeMany: (state, { payload }: PayloadAction<string[] | undefined>) => {
      if (!payload) {
        state.cart = [];
      } else {
        state.cart = state.cart.filter(({ id }) => !payload.includes(id));
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loadingStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, { payload }) => {
        if (payload.code === 1) {
          state.cart = payload.cart;
        }
        state.loadingStatus = 'finish';
        state.error = null;
      })
      .addCase(fetchCart.rejected, (state, { payload }: PayloadAction<any>) => {
        state.loadingStatus = 'failed';
        state.error = payload.error;
      })
      .addCase(addCartItem.pending, (state) => {
        state.loadingStatus = 'loading';
        state.error = null;
      })
      .addCase(addCartItem.fulfilled, (state, { payload }) => {
        if (payload.code === 1) {
          state.cart = [...state.cart, payload.cartItem];
        }
        state.loadingStatus = 'finish';
        state.error = null;
      })
      .addCase(addCartItem.rejected, (state, { payload }: PayloadAction<any>) => {
        state.loadingStatus = 'failed';
        state.error = payload.error;
      })
      .addCase(incrementCartItem.pending, (state) => {
        state.loadingStatus = 'loading';
        state.error = null;
      })
      .addCase(incrementCartItem.fulfilled, (state, { payload }) => {
        if (payload.code === 1) {
          const cartIndex = state.cart.findIndex((cartItem) => cartItem.id === payload.cartItem.id);
          if (cartIndex !== -1) {
            state.cart[cartIndex] = payload.cartItem;
          }
        }
        state.loadingStatus = 'finish';
        state.error = null;
      })
      .addCase(incrementCartItem.rejected, (state, { payload }: PayloadAction<any>) => {
        state.loadingStatus = 'failed';
        state.error = payload.error;
      })
      .addCase(decrementCartItem.pending, (state) => {
        state.loadingStatus = 'loading';
        state.error = null;
      })
      .addCase(decrementCartItem.fulfilled, (state, { payload }) => {
        if (payload.code === 1) {
          const cartIndex = state.cart.findIndex((cartItem) => cartItem.id === payload.cartItem.id);
          if (cartIndex !== -1) {
            state.cart[cartIndex] = payload.cartItem;
          }
        }
        state.loadingStatus = 'finish';
        state.error = null;
      })
      .addCase(decrementCartItem.rejected, (state, { payload }: PayloadAction<any>) => {
        state.loadingStatus = 'failed';
        state.error = payload.error;
      })
      .addCase(removeCartItem.pending, (state) => {
        state.loadingStatus = 'loading';
        state.error = null;
      })
      .addCase(removeCartItem.fulfilled, (state, { payload }) => {
        if (payload.code === 1) {
          state.cart = state.cart.filter((cartItem) => cartItem.id !== payload.cartItem.id);
        }
        state.loadingStatus = 'finish';
        state.error = null;
      })
      .addCase(removeCartItem.rejected, (state, { payload }: PayloadAction<any>) => {
        state.loadingStatus = 'failed';
        state.error = payload.error;
      })
      .addCase(removeManyCartItems.pending, (state) => {
        state.loadingStatus = 'loading';
        state.error = null;
      })
      .addCase(removeManyCartItems.fulfilled, (state, { payload }) => {
        if (payload.code === 1) {
          state.cart = [];
        }
        state.loadingStatus = 'finish';
        state.error = null;
      })
      .addCase(removeManyCartItems.rejected, (state, { payload }: PayloadAction<any>) => {
        state.loadingStatus = 'failed';
        state.error = payload.error;
      });
  },
});

export const { removeMany } = cartSlice.actions;

export default cartSlice.reducer;
