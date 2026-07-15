import { useEffect, useContext, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

import { restoreSession, removeUrl, updateTokens } from '@/slices/userSlice';
import { fetchOrders } from '@/slices/orderSlice';
import { AuthContext } from '@/components/Context';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { useUserLang } from '@/hooks/useUserLang';
import { fetchCart, addMany } from '@/slices/cartSlice';
import { setAxiosAuth } from '@/slices/appSlice';
import { routes } from '@/routes';
import { enableAxiosSessionCredentials } from '@/utilities/axiosSessionConfig';

export const useAuthHandler = () => {
  const { i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { logIn, loggedIn } = useContext(AuthContext);

  const { token, url } = useAppSelector((state) => state.user);
  const lang = useUserLang();
  const { cart } = useAppSelector((state) => state.cart);

  const pathWithoutQuery = (router.asPath.split('?')[0] ?? '').split('#')[0];
  const isTelegramMiniAppRoute = pathWithoutQuery.startsWith(routes.page.telegram.root);

  const refreshAccessToken = useCallback(() => {
    if (token) {
      dispatch(updateTokens());
    }
  }, [dispatch, token]);

  useEffect(() => {
    enableAxiosSessionCredentials();
  }, []);

  useEffect(() => {
    if (isTelegramMiniAppRoute) {
      return;
    }

    dispatch(restoreSession());
  }, [dispatch, isTelegramMiniAppRoute]);

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
        if (!isTelegramMiniAppRoute) {
          router.push(url);
        }
        dispatch(removeUrl());
      } else if (!isTelegramMiniAppRoute && router.asPath === routes.page.base.loginPage) {
        router.push(routes.page.base.homePage);
      }
      dispatch(fetchOrders());
      dispatch(fetchCart(cart));
    }
  }, [token]);

  useEffect(() => {
    if (!token && lang) {
      axios.defaults.params = { lang };
    } else if (token && lang) {
      axios.defaults.params = {};
    }
    if (lang) {
      i18n.changeLanguage(lang.toLowerCase());
    }
  }, [lang, token]);

  useEffect(() => {
    if (token) {
      const timeAlive = setTimeout(refreshAccessToken, 595000);
      return () => clearTimeout(timeAlive);
    }
  }, [refreshAccessToken, token]);
};
