import { useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

import { changeLang, fetchTokenStorage, removeUrl, updateTokens } from '@/slices/userSlice';
import { fetchOrders } from '@/slices/orderSlice';
import { AuthContext } from '@/components/Context';
import { useAppDispatch, useAppSelector } from '@/utilities/hooks';
import { fetchCart, addMany } from '@/slices/cartSlice';
import { setAxiosAuth, setSpecialItems } from '@/slices/appSlice';
import { routes } from '@/routes';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';

const storageKey = process.env.NEXT_PUBLIC_STORAGE_KEY ?? '';
const languageKey = process.env.NEXT_PUBLIC_LANGUAGE_KEY ?? '';

export const useAuthHandler = () => {
  const { i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { logIn, loggedIn } = useContext(AuthContext);

  const { token, refreshToken, url, lang, isAdmin } = useAppSelector((state) => state.user);
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
    const langStorage = window.localStorage.getItem(languageKey) as UserLangEnum;
    if (!langStorage || (langStorage && langStorage !== lang)) {
      dispatch(changeLang({ token: !!token, lang: lang || langStorage || UserLangEnum.RU }));
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
    if (isAdmin) {
      dispatch(setSpecialItems());
    }
  }, [isAdmin]);

  useEffect(() => {
    if (refreshToken) {
      const fetch = () => dispatch(updateTokens(refreshToken));

      const timeAlive = setTimeout(fetch, 595000);
      return () => clearTimeout(timeAlive);
    }
    return undefined;
  }, [refreshToken]);
};
