import 'dayjs/locale/ru';
import type { AppProps, AppContext } from 'next/app';
import AppNext from 'next/app';
import Head from 'next/head';
import Script from 'next/script';
import {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import Link from 'next/link';
import { Provider } from 'react-redux';
import { I18nextProvider } from 'react-i18next';
import { ToastContainer } from 'react-toastify';
import axios from 'axios';
import AOS from 'aos';
import CookieConsent from 'react-cookie-consent';
import moment from 'moment';

import { AuthContext, SubmitContext, NavbarContext, ItemContext, SearchContext, MobileContext } from '@/components/Context';
import { routes } from '@/routes';
import { isMobileDevice } from '@/utilities/isMobileDevice';
import { removeToken as removeUserToken } from '@/slices/userSlice';
import { removeMany as removeManyCart } from '@/slices/cartSlice';
import { removeMany } from '@/slices/orderSlice';
import { Promotional } from '@/components/Promotional';
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

const storageKey = process.env.NEXT_PUBLIC_STORAGE_KEY ?? '';

moment.updateLocale('ru-ru', {
  week: {
    dow: 1,
  },
});

interface InitPropsInterface extends AppProps, AppDataInterface {
  isMobile: boolean;
}

const Init = (props: InitPropsInterface) => {
  const { pageProps, Component, isMobile: isMobileProps, itemGroups } = props;
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
    await axios.post(routes.user.logout, { id, refreshToken });
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
    dispatch(setAppData({ itemGroups }));
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
                    {process.env.NODE_ENV === 'production' && process.env.DB !== 'LOCAL'
                      ? (
                        <>
                          <Script 
                            id="google-analytics"
                            src="https://www.googletagmanager.com/gtag/js?id=G-P50BP1JPGM"
                            async
                            onLoad={() => {
                              console.log('Google analytics script loaded');
                            }}
                            onError={(e) => {
                              console.error('Error loading Google metrics script', e);
                            }}
                          />
                          <Script
                            id="gtag-init"
                            strategy="afterInteractive"
                            dangerouslySetInnerHTML={{
                              __html: `
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        gtag('config', 'G-P50BP1JPGM');
                    `,
                            }}
                          />
                          <Script
                            id="yandex-metrika"
                            strategy="afterInteractive"
                            dangerouslySetInnerHTML={{
                              __html: `
                        (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                        m[i].l=1*new Date();
                        for (var j = 0; j < document.scripts.length; j++) {
                            if (document.scripts[j].src === r) { return; }
                        }
                        k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
                        (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

                        ym(100705426, "init", {
                            clickmap:true,
                            trackLinks:true,
                            accurateTrackBounce:true,
                            webvisor:true
                        });
                    `,
                            }}
                          />
                        </>
                      ) : null}
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
                    <Script 
                      id="russian-post-widget"
                      src="https://widget.pochta.ru/map/widget/widget.js"
                      strategy="lazyOnload"
                      onLoad={() => {
                        console.log('Russian Post widget script loaded');
                      }}
                      onError={(e) => {
                        console.error('Error loading Russian Post widget script', e);
                      }}
                    />
                    <ToastContainer style={{ zIndex: 999999 }} />
                    <CookieConsent
                      containerClasses="justify-content-center text-center"
                      style={{ zIndex: 1001, backgroundColor: '#2b3c5f' }}
                      buttonStyle={{ backgroundColor: '#eaeef6', borderRadius: '7px', padding: '10px 20px' }}
                      buttonText={i18n.t('cookieConsent.buttonText')}
                    >
                      <>
                        {i18n.t('cookieConsent.contentText')}
                        <Link className="text-decoration-underline" href={routes.page.base.privacyPolicy}>{i18n.t('cookieConsent.contentLink')}</Link>
                      </>
                    </CookieConsent>
                    <Promotional />
                    <App itemGroups={itemGroups}>
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
  const { data: { itemGroups } } = await axios.get<{ itemGroups: ItemGroupInterface[]; }>(routes.itemGroup.findMany({ isServer: false }));

  const { req } = context.ctx;
  const userAgent = req ? req.headers['user-agent'] : navigator.userAgent;
  const isMobile = isMobileDevice(userAgent);

  const props = await AppNext.getInitialProps(context);

  return { ...props, isMobile, itemGroups };
};

export default Init;
