import cn from 'classnames';
import { useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { Spin } from 'antd';

import { useAppSelector } from '@/utilities/hooks';
import { useErrorHandler } from '@/utilities/useErrorHandler';
import { useAuthHandler } from '@/utilities/useAuthHandler';
import { MobileContext, SubmitContext } from '@/components/Context';
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

  const footerRef = useRef<HTMLElement>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [footerHeight, setFooterHeight] = useState(0);

  const { error: userError } = useAppSelector((state) => state.user);
  const { error: orderError } = useAppSelector((state) => state.order);
  const { error: appError } = useAppSelector((state) => state.app);
  const { error: cartError } = useAppSelector((state) => state.cart);

  const { isSubmit } = useContext(SubmitContext);
  const { isMobile } = useContext(MobileContext);

  useErrorHandler(userError, orderError, appError, cartError);
  useAuthHandler();
  useAccessHandler();
  useRootStyle();
  useMobileContext();

  useEffect(() => {
    setTimeout(setIsLoaded, 1000, true);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (footerRef.current) {
        const height = footerRef.current.getBoundingClientRect().height;

        setFooterHeight(Math.round(height + 200 + (isMobile ? 100 : 0)));
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile, footerRef]);

  return (
    <>
      {isLoaded ? <Spin tip={t('loading')} spinning={isSubmit} fullscreen size="large" /> : <Spinner isLoaded={isLoaded} />}
      <header>
        <NavBar />
        {isMobile ? null : <Breadcrumb />}
      </header>
      <div className={cn({ 'index-bg': router.asPath === routes.homePage })} style={{ paddingBottom: footerHeight }}>
        <main className="container">
          {children}
        </main>
      </div>
      <footer ref={footerRef} className="footer">
        <Footer />
      </footer>
    </>
  );
};
