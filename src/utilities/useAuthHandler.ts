import { useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

import { fetchTokenStorage, removeUrl, updateTokens } from '@/slices/userSlice';
import { fetchOrders } from '@/slices/orderSlice';
import { AuthContext } from '@/components/Context';
import { useAppDispatch, useAppSelector } from '@/utilities/hooks';
import { fetchCart, addMany } from '@/slices/cartSlice';
import { setAxiosAuth } from '@/slices/appSlice';
import { routes } from '@/routes';

const storageKey = process.env.NEXT_PUBLIC_STORAGE_KEY ?? '';

export const useAuthHandler = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { logIn, loggedIn } = useContext(AuthContext);

  const { token, refreshToken, url } = useAppSelector((state) => state.user);
  const { cart } = useAppSelector((state) => state.cart);

  useEffect(() => {
    const tokenStorage = window.localStorage.getItem(storageKey);
    if (tokenStorage) {
      dispatch(fetchTokenStorage(tokenStorage));
    }
  }, []);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      dispatch(setAxiosAuth(true));
    } else {
      dispatch(setAxiosAuth(false));
      dispatch(addMany());
    }
    if (token && !loggedIn) {
      logIn();
      if (url) {
        router.push(url);
        dispatch(removeUrl());
      } else if (router.asPath === routes.loginPage) {
        router.push(routes.homePage);
      }
      dispatch(fetchOrders());
      dispatch(fetchCart(cart));
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
