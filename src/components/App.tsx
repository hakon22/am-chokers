import cn from 'classnames';
import { useContext, useEffect, useRef, useState, type JSX } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { FloatButton, Spin } from 'antd';

import { useAppSelector } from '@/hooks/reduxHooks';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useAuthHandler } from '@/hooks/useAuthHandler';
import { MobileContext, SubmitContext } from '@/components/Context';
import { NavBar } from '@/components/NavBar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Footer } from '@/components/Footer';
import { useRootStyle } from '@/hooks/useRootStyle';
import { useMobileContext } from '@/hooks/useMobileContext';
import { Spinner } from '@/components/Spinner';
import { routes } from '@/routes';
import { useAccessHandler } from '@/hooks/useAccessHandler';
import { useRouterHandler } from '@/hooks/useRouterHandler';
import { ItemGroupEntity } from '@server/db/entities/item.group.entity';

export const App = ({ children, itemGroups }: { children: JSX.Element; itemGroups: ItemGroupEntity[]; }) => {
  const { t } = useTranslation('translation', { keyPrefix: 'spinner' });
  const router = useRouter();

  const footerRef = useRef<HTMLElement>(null);

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

  const isLoaded = useRouterHandler();

  useEffect(() => {
    const handleResize = () => {
      if (footerRef.current) {
        const height = footerRef.current.getBoundingClientRect().height;

        setFooterHeight(Math.round(height + 200 + (isMobile ? 100 : 0)));
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isMobile, footerRef]);

  return (
    <>
      {isLoaded ? <Spin tip={t('loading')} spinning={isSubmit} fullscreen size="large" /> : <Spinner isLoaded={isLoaded} />}
      <header>
        <NavBar />
        <Breadcrumb />
      </header>
      <div className={cn({ 'index-bg': router.asPath === routes.page.base.homePage })} style={{ paddingBottom: router.asPath === '/' ? footerHeight - 200 : footerHeight }}>
        <FloatButton.BackTop />
        <main className="container">
          {children}
        </main>
      </div>
      <footer ref={footerRef} className="footer">
        <Footer itemGroups={itemGroups} />
      </footer>
    </>
  );
};
