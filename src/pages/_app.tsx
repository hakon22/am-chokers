import 'dayjs/locale/ru';
import type { AppProps } from 'next/app';
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
import { useItemGroupsBootstrap } from '@/hooks/useItemGroupsBootstrap';
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
import i18n, { getSeoI18n } from '@/locales';
import { HtmlLangSync } from '@/components/HtmlLangSync';
import { CookieConsentBanner } from '@/components/cookie-consent/CookieConsentBanner';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { YandexMetrika } from '@/components/analytics/YandexMetrika';
import { InitialLanguageContext, parseInitialLanguageCode } from '@/contexts/InitialLanguageContext';
import { getDefaultLanguageCode } from '@shared/language-config';
import '@/scss/app-vendor.scss';
import '@/scss/app-shared.scss';
import '@/scss/app-v1.scss';
import '@/scss/app-v2.scss';
import type { SiteSettingsInterface } from '@/types/site/SiteSettings';
import type { SiteVersion } from '@/types/SiteVersion';
import type { ItemGroupInterface, ItemInterface } from '@/types/item/Item';
import type { ItemGroupEntity } from '@server/db/entities/item.group.entity';

const VersionedShell = ({ children, itemGroups }: { children: JSX.Element; itemGroups: ItemGroupEntity[]; }) => {
  const { Layout } = useVersionedComponents();
  return <Layout itemGroups={itemGroups}>{children}</Layout>;
};

moment.updateLocale('ru-ru', {
  week: {
    dow: 1,
  },
});

interface InitPagePropsInterface {
  itemGroups?: ItemGroupInterface[];
  siteSettings?: SiteSettingsInterface;
  siteVersion?: SiteVersion;
  isMobile?: boolean;
  initialLanguage?: string;
  item?: ItemInterface;
  itemGroup?: ItemGroupInterface;
  [key: string]: unknown;
}

interface InitPropsInterface extends AppProps {
  pageProps: InitPagePropsInterface;
}

const Init = (props: InitPropsInterface) => {
  const { pageProps, Component } = props;
  const {
    itemGroups: pageItemGroups = [],
    siteSettings: pageSiteSettings,
    siteVersion: pageSiteVersion,
    isMobile: pageIsMobile,
    initialLanguage: pageInitialLanguage,
  } = pageProps;

  const bootstrapState = useItemGroupsBootstrap(pageItemGroups, pageSiteSettings, pageSiteVersion);

  const { itemGroups, siteSettings, siteVersion, isLoading: isBootstrapLoading } = bootstrapState;
  const isBootstrapReady = Boolean(siteVersion) && !isBootstrapLoading;

  const isLoaded = useRouterHandler();
  const { dispatch } = store;

  const { id } = store.getState().user;

  const [isSubmit, setIsSubmit] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const pageItem = pageProps?.item as ItemInterface | undefined;
  const pageItemGroup = pageProps?.itemGroup as ItemGroupInterface | undefined;
  const [internalItem, setItem] = useState<ItemInterface | undefined>();
  const item = pageItem ?? internalItem;
  const [isSearch, setIsSearch] = useState({ value: false, needFetch: false });
  const [isMobile, setIsMobile] = useState(pageIsMobile ?? false);

  const closeNavbar = () => setIsActive(false);

  const router = useRouter();
  const pathWithoutQuery = router.asPath.split('?')[0] ?? '';

  const isTelegramMiniAppRoute = pathWithoutQuery.startsWith('/telegram') || router.pathname.startsWith('/telegram');

  const logIn = () => setLoggedIn(true);
  const logOut = useCallback(async () => {
    await axios.post(routes.user.logout, { id }, { withCredentials: true });
    setLoggedIn(false);
    dispatch(removeUserToken());
    dispatch(removeMany());
    dispatch(removeManyCart());
    axios.defaults.headers.common.Authorization = null;
  }, [dispatch, id]);

  const authService = useMemo(() => ({ loggedIn, logIn, logOut }), [loggedIn, logIn, logOut]);
  const submitService = useMemo(() => ({ isSubmit, setIsSubmit }), [isSubmit]);
  const navbarService = useMemo(() => ({ isActive, setIsActive, closeNavbar }), [isActive, closeNavbar]);
  const itemService = useMemo(() => ({ item, setItem }), [item]);
  const searchService = useMemo(() => ({ isSearch, setIsSearch }), [isSearch]);
  const mobileService = useMemo(() => ({ isMobile, setIsMobile }), [isMobile, setIsMobile]);
  const catalogPageService = useMemo(() => ({ itemGroup: pageItemGroup }), [pageItemGroup]);

  const resolvedInitialLanguage = pageInitialLanguage ?? getDefaultLanguageCode();
  const initialLanguageCode = parseInitialLanguageCode(resolvedInitialLanguage);
  const seoI18nForProvider = typeof window === 'undefined'
    ? getSeoI18n(initialLanguageCode)
    : i18n;

  useEffect(() => {
    if (!siteVersion) {
      return;
    }

    if (siteVersion === 'v1') {
      import('aos').then(({ default: aosLibrary }) => {
        aosLibrary.init();
      });
    }

    dispatch(setAppData({ itemGroups, siteSettings }));
  }, [dispatch, itemGroups, siteSettings, siteVersion]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (pageIsMobile === undefined) {
      setIsMobile(isMobileDevice(navigator.userAgent));
    }
  }, [pageIsMobile]);

  useEffect(() => {
    if (i18n.language !== resolvedInitialLanguage) {
      i18n.changeLanguage(resolvedInitialLanguage);
    }
  }, [resolvedInitialLanguage]);

  useEffect(() => {
    if (pathWithoutQuery !== routes.page.base.catalog) {
      scrollTop('instant');
    }
  }, [pathWithoutQuery]);

  const appProvidersTree = (
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
                    <Spinner isLoaded={isLoaded && (isTelegramMiniAppRoute || isBootstrapReady)} />
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
                    ) : isBootstrapReady ? (
                      <VersionedShell itemGroups={itemGroups}>
                        <Component {...pageProps} />
                      </VersionedShell>
                    ) : null}
                  </Provider>
                </NavbarContext.Provider>
              </CatalogPageContext.Provider>
            </ItemContext.Provider>
          </SearchContext.Provider>
        </MobileContext.Provider>
      </SubmitContext.Provider>
    </AuthContext.Provider>
  );

  return (
    <InitialLanguageContext.Provider value={initialLanguageCode}>
      <I18nextProvider i18n={seoI18nForProvider}>
        <VersionContext.Provider value={{ version: siteVersion ?? 'v2' }}>
          {appProvidersTree}
        </VersionContext.Provider>
      </I18nextProvider>
    </InitialLanguageContext.Provider>
  );
};

export default Init;
