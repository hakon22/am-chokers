import { configureStore } from '@reduxjs/toolkit';

import appReducer from '@/slices/appSlice';
import userReducer from '@/slices/userSlice';
import orderReducer from '@/slices/orderSlice';
import cartReducer from '@/slices/cartSlice';
import { resolveBootstrapUserLang } from '@/utilities/bootstrapLanguage';

const store = configureStore({
  reducer: {
    app: appReducer,
    user: userReducer,
    order: orderReducer,
    cart: cartReducer,
  },
  ...(typeof window !== 'undefined' ? {
    preloadedState: {
      user: {
        loadingStatus: 'idle' as const,
        error: null,
        lang: resolveBootstrapUserLang(),
        favorites: [],
      },
    },
  } : {}),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
