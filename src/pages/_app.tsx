import 'dayjs/locale/ru';
import type { AppProps, AppContext } from 'next/app';
import AppNext from 'next/app';
import Head from 'next/head';
import {
  useCallback, useEffect, useMemo, useState, type JSX,
} from 'react';
import { useRouter } from 'next/router';
import { Provider } from 'react-redux';
import { I18nextProvider } from 'react-i18next';
import { ToastContainer } from 'react-toastify';
import axios from 'axios';
import moment from 'moment';

import { AuthContext, SubmitContext, NavbarContext, ItemContext, SearchContext, MobileContext, VersionContext, CatalogPageContext } from '@/components/Context';
import { Spinner } from '@/components/Spinner';
import { useRouterHandler } from '@/hooks/useRouterHandler';
import { routes } from '@/routes';
import { isMobileDevice } from '@/utilities/isMobileDevice';
import { removeToken as removeUserToken } from '@/slices/userSlice';
import { removeMany as removeManyCart } from '@/slices/cartSlice';
import { scrollTop } from '@/utilities/scrollTop';
import { removeMany } from '@/slices/orderSlice';
import favicon16 from '@/images/favicons/favicon16x16.png';
import favicon32 from '@/images/favicons/favicon32x32.png';
import favicon57 from '@/images/favicons/favicon57x57.png';
import favicon180 from '@/images/favicons/favicon180x180.png';
import store from '@/slices/index';
import { useVersionedComponents } from '@/components/version-resolver';
import { TelegramMiniAppAuthBridge } from '@/components/telegram/TelegramMiniAppAuthBridge';
import { TelegramMiniAppBootstrap } from '@/components/telegram/TelegramMiniAppBootstrap';
import { TelegramMiniAppPageShell } from '@/components/telegram/TelegramMiniAppPageShell';
import { TelegramOrderAppRoutesContext, telegramOrderAppRoutesMiniApp } from '@/contexts/TelegramOrderAppRoutesContext';
import { setAppData } from '@/slices/appSlice';
import i18n, { getSeoI18n, resolveClientLanguage } from '@/locales';
import { getRequestLanguageFromCookieHeader } from '@/lib/server/get-request-language';
import { HtmlLangSync } from '@/components/HtmlLangSync';
import { CookieConsentBanner } from '@/components/cookie-consent/CookieConsentBanner';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { YandexMetrika } from '@/components/analytics/YandexMetrika';
import { InitialLanguageContext, parseInitialLanguageCode } from '@/contexts/InitialLanguageContext';
import '@/scss/app.scss';
import '@/themes/v2/styles/v2-fonts.scss';
import { emptySiteSettings, type SiteSettingsInterface } from '@/types/site/SiteSettings';
import type { SiteVersion } from '@/types/SiteVersion';
import type { ItemGroupInterface, ItemInterface } from '@/types/item/Item';
import type { ItemGroupEntity } from '@server/db/entities/item.group.entity';

const storageKey = process.env.NEXT_PUBLIC_STORAGE_KEY ?? '';

const VersionedShell = ({ children, itemGroups }: { children: JSX.Element; itemGroups: ItemGroupEntity[]; }) => {
  const { Layout } = useVersionedComponents();
  return <Layout itemGroups={itemGroups}>{children}</Layout>;
};

moment.updateLocale('ru-ru', {
  week: {
    dow: 1,
  },
});

interface InitPropsInterface extends AppProps {
  isMobile: boolean;
  siteVersion: SiteVersion;
  itemGroups: ItemGroupInterface[];
  siteSettings: SiteSettingsInterface;
  initialLanguage: string;
}

const Init = (props: InitPropsInterface) => {
  const { pageProps, Component, isMobile: isMobileProps, itemGroups, siteVersion, siteSettings, initialLanguage } = props;

  if (itemGroups.length > 0 && store.getState().app.itemGroups.length === 0) {
    store.dispatch(setAppData({ itemGroups, siteSettings }));
  }

  const isLoaded = useRouterHandler();
  const { dispatch } = store;

  const { id, refreshToken } = store.getState().user;

  const [isSubmit, setIsSubmit] = useState(false); // submit spinner
  const [isActive, setIsActive] = useState(false); // navbar
  const [loggedIn, setLoggedIn] = useState(false); // auth service
  const pageItem = pageProps?.item as ItemInterface | undefined;
  const pageItemGroup = pageProps?.itemGroup as ItemGroupInterface | undefined;
  const [internalItem, setItem] = useState<ItemInterface | undefined>();
  const item = pageItem ?? internalItem;
  const [isSearch, setIsSearch] = useState({ value: false, needFetch: false }); // global search service
  const [isMobile, setIsMobile] = useState(isMobileProps); // is mobile device

  const closeNavbar = () => setIsActive(false);

  const router = useRouter();
  const pathWithoutQuery = router.asPath.split('?')[0] ?? '';

  const isTelegramMiniAppRoute = pathWithoutQuery.startsWith('/telegram') || router.pathname.startsWith('/telegram');

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
  const versionService = useMemo(() => ({ version: siteVersion }), [siteVersion]);
  const catalogPageService = useMemo(() => ({ itemGroup: pageItemGroup }), [pageItemGroup]);

  const initialLanguageCode = parseInitialLanguageCode(initialLanguage);
  const seoI18nForProvider = typeof window === 'undefined'
    ? getSeoI18n(initialLanguageCode)
    : i18n;

  useEffect(() => {
    if (siteVersion === 'v1') {
      import('aos').then(({ default: aosLibrary }) => {
        aosLibrary.init();
      });
    }
    dispatch(setAppData({ itemGroups, siteSettings }));
  }, [dispatch, itemGroups, siteSettings, siteVersion]);

  useEffect(() => {
    if (i18n.language !== initialLanguage) {
      i18n.changeLanguage(initialLanguage);
    }
  }, [initialLanguage]);

  useEffect(() => {
    if (pathWithoutQuery !== routes.page.base.catalog) {
      scrollTop('instant');
    }
  }, [pathWithoutQuery]);

  return (
    <InitialLanguageContext.Provider value={initialLanguageCode}>
      <I18nextProvider i18n={seoI18nForProvider}>
        <VersionContext.Provider value={versionService}>
          <AuthContext.Provider value={authService}>
            <SubmitContext.Provider value={submitService}>
              <MobileContext.Provider value={mobileService}>
                <SearchContext.Provider value={searchService}>
                  <ItemContext.Provider value={itemService}>
                    <CatalogPageContext.Provider value={catalogPageService}>
                      <NavbarContext.Provider value={navbarService}>
                        <Provider store={store}>
                          <Head>
                            <link rel="manifest" href="/manifest.json" />
                            <link rel="icon" type="image/png" sizes="16x16" href={favicon16.src} />
                            <link rel="icon" type="image/png" sizes="32x32" href={favicon32.src} />
                            <link rel="apple-touch-icon" sizes="57x57" href={favicon57.src} />
                            <link rel="apple-touch-icon" sizes="180x180" href={favicon180.src} />
                          </Head>
                          {process.env.NODE_ENV === 'production' && process.env.DB !== 'LOCAL' && !isTelegramMiniAppRoute
                            ? (
                              <>
                                <GoogleAnalytics />
                                <YandexMetrika />
                              </>
                            ) : null}
                          <Spinner isLoaded={isLoaded} />
                          <HtmlLangSync />
                          <ToastContainer style={{ zIndex: 999999 }} />
                          {!isTelegramMiniAppRoute ? <CookieConsentBanner /> : null}
                          {isTelegramMiniAppRoute ? (
                            <TelegramOrderAppRoutesContext.Provider value={telegramOrderAppRoutesMiniApp}>
                              <TelegramMiniAppAuthBridge>
                                <TelegramMiniAppBootstrap>
                                  <TelegramMiniAppPageShell>
                                    <Component {...pageProps} />
                                  </TelegramMiniAppPageShell>
                                </TelegramMiniAppBootstrap>
                              </TelegramMiniAppAuthBridge>
                            </TelegramOrderAppRoutesContext.Provider>
                          ) : (
                            <VersionedShell itemGroups={itemGroups}>
                              <Component {...pageProps} />
                            </VersionedShell>
                          )}
                        </Provider>
                      </NavbarContext.Provider>
                    </CatalogPageContext.Provider>
                  </ItemContext.Provider>
                </SearchContext.Provider>
              </MobileContext.Provider>
            </SubmitContext.Provider>
          </AuthContext.Provider>
        </VersionContext.Provider>
      </I18nextProvider>
    </InitialLanguageContext.Provider>
  );
};

Init.getInitialProps = async (context: AppContext) => {
  const [
    { data: { itemGroups } },
    { data: settingsData },
  ] = await Promise.all([
    axios.get<{ itemGroups: ItemGroupInterface[]; }>(routes.itemGroup.findMany({ isServer: false })),
    axios.get<{ code: number; siteSettings?: SiteSettingsInterface; }>(routes.settings.getSettings({ isServer: false })),
  ]);

  const siteSettings = settingsData.siteSettings ?? emptySiteSettings;
  const siteVersion = siteSettings.siteVersion;

  const { req } = context.ctx;
  const userAgent = req ? req.headers['user-agent'] : navigator.userAgent;
  const isMobile = isMobileDevice(userAgent);
  const initialLanguage = typeof window === 'undefined'
    ? getRequestLanguageFromCookieHeader(req?.headers.cookie)
    : resolveClientLanguage();

  const props = await AppNext.getInitialProps(context);

  return {
    ...props,
    pageProps: {
      ...props.pageProps,
      itemGroups,
    },
    isMobile,
    itemGroups,
    siteVersion,
    siteSettings,
    initialLanguage,
  };
};

export default Init;
