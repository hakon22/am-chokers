import { useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

import { fetchTokenStorage, removeUrl, updateTokens } from '@/slices/userSlice';
import { fetchOrders } from '@/slices/orderSlice';
import { AuthContext } from '@/components/Context';
import { useAppDispatch, useAppSelector } from '@/utilities/hooks';

const storageKey = process.env.NEXT_PUBLIC_STORAGE_KEY ?? '';

export const useAuthHandler = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { logIn, loggedIn } = useContext(AuthContext);
  const {
    id, token, refreshToken, url,
  } = useAppSelector((state) => state.user);

  useEffect(() => {
    const tokenStorage = window.localStorage.getItem(storageKey);
    if (tokenStorage) {
      dispatch(fetchTokenStorage(tokenStorage));
    }
  }, []);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    }
    if (token && !loggedIn) {
      logIn();
      if (url) {
        router.push(url);
        dispatch(removeUrl());
      }
      if (id) {
        dispatch(fetchOrders());
      }
    }
  }, [token]);

  useEffect(() => {
    if (refreshToken) {
      const fetch = () => dispatch(updateTokens(refreshToken));

      const timeAlive = setTimeout(fetch, 595000);
      return () => clearTimeout(timeAlive);
    }
    return undefined;
  }, [refreshToken]);
};
