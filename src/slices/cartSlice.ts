import axios from 'axios';
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';

import { routes } from '@/routes';
import type { CartItemInterface, CartItemFormInterface } from '@/types/cart/Cart';
import type { InitialState } from '@/types/InitialState';

interface CartStoreInterface extends InitialState {
  cart: CartItemInterface[];
}

export interface CartResponseInterface {
  code: number;
  cartItem: CartItemInterface;
}

export interface SelectedCartResponseInterface {
  code: number;
  cartItems: CartItemInterface[];
}

const cartStorageKey = process.env.NEXT_PUBLIC_CART_STORAGE_KEY ?? '';

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
      const cartCache = window.localStorage.getItem(cartStorageKey);
      if (cartCache) {
        const parcedCartCache: CartItemInterface[] = JSON.parse(cartCache);
        window.localStorage.setItem(cartStorageKey, JSON.stringify(parcedCartCache.filter((cartItem) => cartItem.id !== id)));
      }
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
      const cartStorage = window.localStorage.getItem(cartStorageKey);
      if (cartStorage) {
        window.localStorage.setItem(cartStorageKey, JSON.stringify((JSON.parse(cartStorage) as CartItemInterface[]).filter((cartItem) => !(payload || []).includes(cartItem.id))));
      }
    },
    addMany: (state) => {
      const cartStorage = window.localStorage.getItem(cartStorageKey);
      if (cartStorage) {
        state.cart = JSON.parse(cartStorage);
      }
    },
    replaceCart: (state, { payload }: PayloadAction<CartItemInterface[]>) => {
      state.cart = payload;
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
          const cartStorage = window.localStorage.getItem(cartStorageKey);
          if (cartStorage) {
            window.localStorage.removeItem(cartStorageKey);
          }
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
          if (!payload.cartItem.user) {
            window.localStorage.setItem(cartStorageKey, JSON.stringify(state.cart));
          }
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
            if (!payload.cartItem.user) {
              window.localStorage.setItem(cartStorageKey, JSON.stringify(state.cart));
            }
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
            if (!payload.cartItem.user) {
              window.localStorage.setItem(cartStorageKey, JSON.stringify(state.cart));
            }
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
          if (!payload.cartItem.user) {
            window.localStorage.setItem(cartStorageKey, JSON.stringify(state.cart));
          }
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
          const cartStorage = window.localStorage.getItem(cartStorageKey);
          if (cartStorage) {
            window.localStorage.removeItem(cartStorageKey);
          }
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

export const { removeMany, addMany, replaceCart } = cartSlice.actions;

export default cartSlice.reducer;
