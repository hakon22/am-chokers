import { configureStore } from '@reduxjs/toolkit';

import userReducer from '@/slices/userSlice';
import orderReducer from '@/slices/orderSlice';

const store = configureStore({
  reducer: {
    user: userReducer,
    order: orderReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
