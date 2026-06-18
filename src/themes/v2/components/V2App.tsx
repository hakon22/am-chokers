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

const FOOTER_CONTENT_GAP = 40;

/**
 * Откладывает измерение до следующего кадра после применения CSS body.v2-mobile
 * @param measureFooterHeight - callback измерения высоты footer
 */
const scheduleFooterHeightMeasure = (measureFooterHeight: () => void): void => {
  requestAnimationFrame(() => {
    requestAnimationFrame(measureFooterHeight);
  });
};

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
    /**
     * Сохраняет высоту footer для paddingBottom контентной области
     */
    const measureFooterHeight = (): void => {
      const { current: footerElement } = footerRef;

      if (!footerElement) {
        return;
      }

      const { height } = footerElement.getBoundingClientRect();
      setFooterHeight(Math.round(height));
    };

    if (isMobile) {
      document.body.classList.add('v2-mobile');
    } else {
      document.body.classList.remove('v2-mobile');
    }

    scheduleFooterHeightMeasure(measureFooterHeight);

    const { current: footerElement } = footerRef;
    let resizeObserver: ResizeObserver | undefined;

    if (footerElement && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(measureFooterHeight);
      resizeObserver.observe(footerElement);
    }

    window.addEventListener('resize', measureFooterHeight);

    return () => {
      document.body.classList.remove('v2-mobile');
      resizeObserver?.disconnect();
      window.removeEventListener('resize', measureFooterHeight);
    };
  }, [isMobile]);

  const isHomePage = router.pathname === routes.page.base.homePage;
  const isCatalogPage = router.pathname.includes(catalogPath);

  return (
    <AuthModalContext.Provider value={{ openAuthModal }}>
      <div className="v2-app" style={{ position: 'relative', minHeight: '100vh' }}>
        {isSubmit && <Spin tip={t('loading')} spinning fullscreen size="large" />}
        <header style={{ paddingTop: isMobile ? 56 : 100 }}>
          <NavBar itemGroups={itemGroups} />
          <Breadcrumb />
        </header>
        <div style={{ paddingBottom: footerHeight + FOOTER_CONTENT_GAP }}>
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
