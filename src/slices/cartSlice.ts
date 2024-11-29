import axios from 'axios';
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';

import type { CartItemInterface, CartItemFormInterface } from '@/types/cart/Cart';
import type { InitialState } from '@/types/InitialState';
import { routes } from '@/routes';

interface CartStoreInterface extends InitialState {
  cart: (CartItemInterface | CartItemFormInterface)[];
}

export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get<{ code: number, cart: CartItemInterface[] }>(routes.getCart);
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
      const response = await axios.post<{ code: number; item: CartItemInterface }>(routes.createCartItem, data);
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e.response.data);
    }
  },
);

export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async ({ id, data }: { id: number, data: Partial<CartItemInterface> }, { rejectWithValue }) => {
    try {
      const response = await axios.put<{ code: number; item: CartItemInterface }>(routes.crudCart(id), data);
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e.response.data);
    }
  },
);

export const removeCartItem = createAsyncThunk(
  'cart/removeCartItem',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await axios.delete<{ code: number; item: CartItemInterface }>(routes.crudCart(id));
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e.response.data);
    }
  },
);

export const removeManyCartItems = createAsyncThunk(
  'cart/removeCartItems',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.delete<{ code: number; }>(routes.removeManyCartItems);
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
    createOne: (state, { payload }: PayloadAction<CartItemFormInterface>) => {
      state.cart = [...state.cart, payload];
    },
    updateOne: (state, { payload }: PayloadAction<CartItemFormInterface>) => {
      const cartIndex = state.cart.findIndex((cartItem) => cartItem.item.name === payload.item.name);
      if (cartIndex !== -1) {
        state.cart[cartIndex] = payload;
      }
    },
    removeOne: (state, { payload }: PayloadAction<CartItemFormInterface>) => {
      state.cart = state.cart.filter((cartItem) => cartItem.item.name !== payload.item.name);
    },
    removeMany: (state) => {
      state.cart = [];
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
          state.cart = [...state.cart, payload.item];
        }
        state.loadingStatus = 'finish';
        state.error = null;
      })
      .addCase(addCartItem.rejected, (state, { payload }: PayloadAction<any>) => {
        state.loadingStatus = 'failed';
        state.error = payload.error;
      })
      .addCase(updateCartItem.pending, (state) => {
        state.loadingStatus = 'loading';
        state.error = null;
      })
      .addCase(updateCartItem.fulfilled, (state, { payload }) => {
        if (payload.code === 1) {
          const cartIndex = state.cart.findIndex((cartItem) => 'id' in cartItem && cartItem.item.id === payload.item.item.id);
          if (cartIndex !== -1) {
            state.cart[cartIndex] = payload.item;
          }
        }
        state.loadingStatus = 'finish';
        state.error = null;
      })
      .addCase(updateCartItem.rejected, (state, { payload }: PayloadAction<any>) => {
        state.loadingStatus = 'failed';
        state.error = payload.error;
      })
      .addCase(removeCartItem.pending, (state) => {
        state.loadingStatus = 'loading';
        state.error = null;
      })
      .addCase(removeCartItem.fulfilled, (state, { payload }) => {
        if (payload.code === 1) {
          state.cart = state.cart.filter((cartItem) => 'id' in cartItem && cartItem.item.id !== payload.item.item.id);
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

export const {
  createOne, updateOne, removeOne, removeMany,
} = cartSlice.actions;

export default cartSlice.reducer;
