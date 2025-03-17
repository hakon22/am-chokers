import 'dayjs/locale/ru';
import type { AppProps, AppContext } from 'next/app';
import AppNext from 'next/app';
import Head from 'next/head';
import Script from 'next/script';
import {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import { Provider } from 'react-redux';
import { I18nextProvider } from 'react-i18next';
import { ToastContainer } from 'react-toastify';
import axios from 'axios';
import AOS from 'aos';

import { AuthContext, SubmitContext, NavbarContext, ItemContext, SearchContext, MobileContext } from '@/components/Context';
import { routes } from '@/routes';
import { isMobileDevice } from '@/utilities/isMobileDevice';
import { removeToken as removeUserToken } from '@/slices/userSlice';
import { removeMany as removeManyCart } from '@/slices/cartSlice';
import { removeMany } from '@/slices/orderSlice';
import favicon16 from '@/images/favicons/favicon16x16.png';
import favicon32 from '@/images/favicons/favicon32x32.png';
import favicon57 from '@/images/favicons/favicon57x57.png';
import favicon180 from '@/images/favicons/favicon180x180.png';
import store from '@/slices/index';
import { App } from '@/components/App';
import { setAppData } from '@/slices/appSlice';
import i18n from '@/locales';
import '@/scss/app.scss';
import type { ItemGroupInterface, ItemInterface, AppDataInterface } from '@/types/item/Item';
import type { ImageEntity } from '@server/db/entities/image.entity';

const storageKey = process.env.NEXT_PUBLIC_STORAGE_KEY ?? '';

interface InitPropsInterface extends AppProps, AppDataInterface {
  isMobile: boolean;
}

const Init = (props: InitPropsInterface) => {
  const { pageProps, Component, isMobile: isMobileProps, itemGroups, specialItems, coverImages } = props;
  const { dispatch } = store;

  const { id, refreshToken } = store.getState().user;

  const [isSubmit, setIsSubmit] = useState(false); // submit spinner
  const [isActive, setIsActive] = useState(false); // navbar
  const [loggedIn, setLoggedIn] = useState(false); // auth service
  const [item, setItem] = useState<ItemInterface | undefined>(undefined); // item service
  const [isSearch, setIsSearch] = useState({ value: false, needFetch: false }); // global search service
  const [isMobile, setIsMobile] = useState(isMobileProps); // is mobile device

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

  const authService = useMemo(() => ({ loggedIn, logIn, logOut }), [loggedIn]);
  const submitService = useMemo(() => ({ isSubmit, setIsSubmit }), [isSubmit]);
  const navbarService = useMemo(() => ({ isActive, setIsActive, closeNavbar }), [isActive]);
  const itemService = useMemo(() => ({ item, setItem }), [item]);
  const searchService = useMemo(() => ({ isSearch, setIsSearch }), [isSearch]);
  const mobileService = useMemo(() => ({ isMobile, setIsMobile }), [isMobile]);

  useEffect(() => {
    AOS.init();
    dispatch(setAppData({ itemGroups, specialItems, coverImages }));
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <AuthContext.Provider value={authService}>
        <SubmitContext.Provider value={submitService}>
          <MobileContext.Provider value={mobileService}>
            <SearchContext.Provider value={searchService}>
              <ItemContext.Provider value={itemService}>
                <NavbarContext.Provider value={navbarService}>
                  <Provider store={store}>
                    <Head>
                      <link rel="icon" type="image/png" sizes="16x16" href={favicon16.src} />
                      <link rel="icon" type="image/png" sizes="32x32" href={favicon32.src} />
                      <link rel="apple-touch-icon" sizes="57x57" href={favicon57.src} />
                      <link rel="apple-touch-icon" sizes="180x180" href={favicon180.src} />
                    </Head>
                    <Script 
                      id="yandex-widget"
                      src="https://ndd-widget.landpro.site/widget.js"
                      strategy="lazyOnload"
                      onLoad={() => {
                        console.log('Yandex widget script loaded');
                      }}
                      onError={(e) => {
                        console.error('Error loading Yandex widget script', e);
                      }}
                    />
                    <ToastContainer style={{ zIndex: 999999 }} />
                    <App>
                      <Component {...pageProps} />
                    </App>
                  </Provider>
                </NavbarContext.Provider>
              </ItemContext.Provider>
            </SearchContext.Provider>
          </MobileContext.Provider>
        </SubmitContext.Provider>
      </AuthContext.Provider>
    </I18nextProvider>
  );
};

Init.getInitialProps = async (context: AppContext) => {
  const [{ data: { itemGroups } }, { data: { specialItems } }, { data: { coverImages } }] = await Promise.all([
    axios.get<{ itemGroups: ItemGroupInterface[] }>(routes.getItemGroups({ isServer: false })),
    axios.get<{ specialItems: ItemInterface[] }>(routes.getItemSpecials({ isServer: false })),
    axios.get<{ coverImages: ImageEntity[] }>(routes.getCoverImages({ isServer: false })),
  ]);

  const { req } = context.ctx;
  const userAgent = req ? req.headers['user-agent'] : navigator.userAgent;
  const isMobile = isMobileDevice(userAgent);

  const props = await AppNext.getInitialProps(context);

  return { ...props, isMobile, itemGroups, specialItems, coverImages };
};

export default Init;
