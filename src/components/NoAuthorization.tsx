import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useContext, useEffect } from 'react';

import { setUrl } from '@/slices/userSlice';
import { routes } from '@/routes';
import { useAppDispatch } from '@/hooks/reduxHooks';
import { MobileContext, AuthModalContext } from '@/components/Context';

export const NoAuthorization = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.profile' });

  const { isMobile } = useContext(MobileContext);
  const { openAuthModal } = useContext(AuthModalContext);

  const dispatch = useAppDispatch();
  const router = useRouter();

  useEffect(() => {
    dispatch(setUrl(router.asPath));
  }, [router.asPath]);

  const handleLoginClick = (event: React.MouseEvent) => {
    if (openAuthModal) {
      event.preventDefault();
      openAuthModal('login');
    }
  };

  const handleSignupClick = (event: React.MouseEvent) => {
    if (openAuthModal) {
      event.preventDefault();
      openAuthModal('signup');
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="d-flex flex-column flex-xl-row justify-content-center align-items-center fs-5" style={{ letterSpacing: '0.5px' }}>
        {t('entrace1')}
        <Link href={routes.page.base.loginPage} className="px-2 text-monospace text-decoration-underline" onClick={handleLoginClick}>{t('entrace')}</Link>
        {t('entrace2')}
        <Link href={routes.page.base.signupPage} className="ps-2 text-monospace text-decoration-underline" onClick={handleSignupClick}>{t('signup')}</Link>
      </div>
    </div>
  );
};
