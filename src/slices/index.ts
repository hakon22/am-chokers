import { configureStore } from '@reduxjs/toolkit';

import appReducer from '@/slices/appSlice';
import userReducer from '@/slices/userSlice';
import orderReducer from '@/slices/orderSlice';

const store = configureStore({
  reducer: {
    app: appReducer,
    user: userReducer,
    order: orderReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
