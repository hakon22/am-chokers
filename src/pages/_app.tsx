import 'dayjs/locale/ru';
import type { AppProps, AppContext } from 'next/app';
import AppNext from 'next/app';
import Head from 'next/head';
import {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import { Provider } from 'react-redux';
import { I18nextProvider } from 'react-i18next';
import { ToastContainer } from 'react-toastify';
import axios from 'axios';
import AOS from 'aos';

import { AuthContext, SubmitContext, NavbarContext } from '@/components/Context';
import { routes } from '@/routes';
import { removeToken as removeUserToken } from '@/slices/userSlice';
import { removeMany as removeManyCart } from '@/slices/cartSlice';
import { removeMany } from '@/slices/orderSlice';
import favicon16 from '@/images/favicon16x16.png';
import favicon32 from '@/images/favicon32x32.png';
import favicon57 from '@/images/favicon57x57.png';
import favicon180 from '@/images/favicon180x180.png';
import store from '@/slices/index';
import { App } from '@/components/App';
import { setAppData } from '@/slices/appSlice';
import i18n from '@/locales';
import '@/scss/app.scss';
import type { ItemCollectionInterface, ItemGroupInterface, ItemInterface, AppDataInterface } from '@/types/item/Item';

const storageKey = process.env.NEXT_PUBLIC_STORAGE_KEY ?? '';

const Init = (props: AppProps & AppDataInterface) => {
  const { pageProps, Component, items, itemGroups, itemCollections } = props;
  const { dispatch } = store;

  const { id, refreshToken } = store.getState().user;

  const [isSubmit, setIsSubmit] = useState(false); // submit spinner
  const [isActive, setIsActive] = useState(false); // navbar
  const [loggedIn, setLoggedIn] = useState(false); // auth service

  const closeNavbar = () => setIsActive(false);

  const logIn = () => setLoggedIn(true);
  const logOut = useCallback(async () => {
    const refreshTokenStorage = window.localStorage.getItem(storageKey);
    if (refreshTokenStorage) {
      localStorage.removeItem(storageKey);
    }
    await axios.post(routes.logout, { id, refreshToken });
    setLoggedIn(false);
    dispatch(removeUserToken());
    dispatch(removeMany());
    dispatch(removeManyCart());
    axios.defaults.headers.common.Authorization = null;
  }, [id]);

  const authServices = useMemo(() => ({ loggedIn, logIn, logOut }), [loggedIn]);
  const submitServices = useMemo(() => ({ isSubmit, setIsSubmit }), [isSubmit]);
  const navbarServices = useMemo(() => ({ isActive, setIsActive, closeNavbar }), [isActive]);

  useEffect(() => {
    AOS.init();
    dispatch(setAppData({ items, itemGroups, itemCollections }));
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <AuthContext.Provider value={authServices}>
        <SubmitContext.Provider value={submitServices}>
          <NavbarContext.Provider value={navbarServices}>
            <Provider store={store}>
              <Head>
                <link rel="icon" type="image/png" sizes="16x16" href={favicon16.src} />
                <link rel="icon" type="image/png" sizes="32x32" href={favicon32.src} />
                <link rel="apple-touch-icon" sizes="57x57" href={favicon57.src} />
                <link rel="apple-touch-icon" sizes="180x180" href={favicon180.src} />
              </Head>
              <ToastContainer />
              <App>
                <Component {...pageProps} />
              </App>
            </Provider>
          </NavbarContext.Provider>
        </SubmitContext.Provider>
      </AuthContext.Provider>
    </I18nextProvider>
  );
};

Init.getInitialProps = async (context: AppContext) => {
  const [{ data: { items } }, { data: { itemGroups } }, { data: { itemCollections } }] = await Promise.all([
    axios.get<{ items: ItemInterface[] }>(routes.getItems({ isServer: false })),
    axios.get<{ itemGroups: ItemGroupInterface[] }>(routes.getItemGroups({ isServer: false })),
    axios.get<{ itemCollections: ItemCollectionInterface[] }>(routes.getItemCollections({ isServer: false })),
  ]);

  const props = await AppNext.getInitialProps(context);

  return { ...props, items, itemGroups, itemCollections };
};

export default Init;
