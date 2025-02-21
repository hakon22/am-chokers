import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { Spin } from 'antd';
import cn from 'classnames';

import { useAppSelector } from '@/utilities/hooks';
import { useErrorHandler } from '@/utilities/useErrorHandler';
import { useAuthHandler } from '@/utilities/useAuthHandler';
import { SubmitContext } from '@/components/Context';
import { NavBar } from '@/components/NavBar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Footer } from '@/components/Footer';
import { useRootStyle } from '@/utilities/useRootStyle';
import { useMobileContext } from '@/utilities/useMobileContext';
import { Spinner } from '@/components/Spinner';
import { routes } from '@/routes';
import { useAccessHandler } from '@/utilities/useAccessHandler';

export const App = ({ children }: { children: JSX.Element }) => {
  const { t } = useTranslation('translation', { keyPrefix: 'spinner' });
  const router = useRouter();

  const [isLoaded, setIsLoaded] = useState(false);

  const { error: userError } = useAppSelector((state) => state.user);
  const { error: orderError } = useAppSelector((state) => state.order);
  const { error: appError } = useAppSelector((state) => state.app);
  const { error: cartError } = useAppSelector((state) => state.cart);

  const { isSubmit } = useContext(SubmitContext);

  useErrorHandler(userError, orderError, appError, cartError);
  useAuthHandler();
  useAccessHandler();
  useRootStyle();
  useMobileContext();

  useEffect(() => {
    setTimeout(setIsLoaded, 1000, true);
  }, []);

  return (
    <>
      {isLoaded ? <Spin tip={t('loading')} spinning={isSubmit} fullscreen size="large" /> : <Spinner isLoaded={isLoaded} />}
      <header>
        <NavBar />
        <Breadcrumb />
      </header>
      <div className={cn({ 'index-bg': router.asPath === routes.homePage })} style={{ paddingBottom: '25%' }}>
        <main className="container">
          {children}
        </main>
      </div>
      <footer className="footer">
        <Footer />
      </footer>
    </>
  );
};
