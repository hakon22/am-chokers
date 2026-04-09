import { useContext, useEffect, useRef, useState, type JSX } from 'react';
import { useRouter } from 'next/router';
import { FloatButton, Spin } from 'antd';
import { useTranslation } from 'react-i18next';

import { useAppSelector } from '@/hooks/reduxHooks';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useAuthHandler } from '@/hooks/useAuthHandler';
import { MobileContext, SubmitContext, AuthModalContext } from '@/components/Context';
import { useRootStyle } from '@/hooks/useRootStyle';
import { useMobileContext } from '@/hooks/useMobileContext';
import { routes, catalogPath } from '@/routes';
import { useAccessHandler } from '@/hooks/useAccessHandler';
import { NavBar } from '@/themes/v2/components/NavBar';
import { Breadcrumb } from '@/themes/v2/components/Breadcrumb';
import { Footer } from '@/themes/v2/components/Footer';
import { BottomNav } from '@/themes/v2/components/BottomNav';
import { AuthModal } from '@/themes/v2/components/AuthModal';
import type { ItemGroupEntity } from '@server/db/entities/item.group.entity';
import type { AuthModalView } from '@/components/Context';

export const V2App = ({ children, itemGroups }: { children: JSX.Element; itemGroups: ItemGroupEntity[]; }) => {
  const { t } = useTranslation('translation', { keyPrefix: 'spinner' });
  const router = useRouter();

  const footerRef = useRef<HTMLElement>(null);
  const [footerHeight, setFooterHeight] = useState(0);
  const [authModal, setAuthModal] = useState<{ open: boolean; view: AuthModalView }>({ open: false, view: 'login' });

  const openAuthModal = (view: AuthModalView = 'login') => setAuthModal({ open: true, view });
  const closeAuthModal = () => setAuthModal((state) => ({ ...state, open: false }));

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
        const height = footerRef.current.getBoundingClientRect().height;
        setFooterHeight(Math.round(height));
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [footerRef]);

  useEffect(() => {
    if (!isMobile) {
      return;
    }
    document.body.classList.add('v2-mobile');
    return () => document.body.classList.remove('v2-mobile');
  }, [isMobile]);

  const isHomePage = router.pathname === routes.page.base.homePage;
  const isCatalogPage = router.pathname.includes(catalogPath);

  return (
    <AuthModalContext.Provider value={{ openAuthModal }}>
      <div className="v2-app" style={{ position: 'relative', minHeight: '100vh' }}>
        {isSubmit && <Spin tip={t('loading')} spinning fullscreen size="large" />}
        <header style={{ paddingTop: isMobile ? 56 : 100 }}>
          <NavBar />
          <Breadcrumb />
        </header>
        <div style={{ paddingBottom: footerHeight + (isMobile ? 80 : 40) }}>
          <FloatButton.BackTop />
          {isHomePage ? (
            children
          ) : (
            <main className="container" style={{ paddingTop: isMobile && isCatalogPage ? 56 : 32 }}>
              {children}
            </main>
          )}
        </div>
        <footer ref={footerRef} style={{ position: 'absolute', bottom: 0, width: '100%' }}>
          <Footer itemGroups={itemGroups} />
        </footer>
        {isMobile && <BottomNav />}
        <AuthModal open={authModal.open} initialView={authModal.view} onClose={closeAuthModal} />
      </div>
    </AuthModalContext.Provider>
  );
};
