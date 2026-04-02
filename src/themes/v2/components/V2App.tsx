import { useContext, useEffect, useRef, useState, type JSX } from 'react';
import { useRouter } from 'next/router';
import { FloatButton, Spin } from 'antd';
import { useTranslation } from 'react-i18next';

import { useAppSelector } from '@/hooks/reduxHooks';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useAuthHandler } from '@/hooks/useAuthHandler';
import { MobileContext, SubmitContext } from '@/components/Context';
import { useRootStyle } from '@/hooks/useRootStyle';
import { useMobileContext } from '@/hooks/useMobileContext';
import { routes } from '@/routes';
import { useAccessHandler } from '@/hooks/useAccessHandler';
import { NavBar } from '@/themes/v2/components/NavBar';
import { Breadcrumb } from '@/themes/v2/components/Breadcrumb';
import { Footer } from '@/themes/v2/components/Footer';
import { BottomNav } from '@/themes/v2/components/BottomNav';
import type { ItemGroupEntity } from '@server/db/entities/item.group.entity';

export const V2App = ({ children, itemGroups }: { children: JSX.Element; itemGroups: ItemGroupEntity[]; }) => {
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

  useEffect(() => {
    const handleResize = () => {
      if (footerRef.current) {
        setFooterHeight(isMobile ? 100 : 0);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile, footerRef]);

  const isHomePage = router.pathname === routes.page.base.homePage;

  return (
    <>
      {isSubmit && <Spin tip={t('loading')} spinning fullscreen size="large" />}
      <header style={{ paddingTop: 100 }}>
        <NavBar />
        <Breadcrumb />
      </header>
      <div style={{ paddingBottom: footerHeight }}>
        <FloatButton.BackTop />
        {isHomePage ? (
          children
        ) : (
          <main className="container" style={{ paddingTop: 32 }}>
            {children}
          </main>
        )}
      </div>
      <footer ref={footerRef}>
        <Footer itemGroups={itemGroups} />
      </footer>
      {isMobile && <BottomNav />}
    </>
  );
};
