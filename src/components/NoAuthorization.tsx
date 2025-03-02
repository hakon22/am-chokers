import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useContext, useEffect } from 'react';

import { setUrl } from '@/slices/userSlice';
import { routes } from '@/routes';
import { useAppDispatch } from '@/utilities/hooks';
import { MobileContext } from '@/components/Context';

export const NoAuthorization = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.profile' });

  const { isMobile } = useContext(MobileContext);

  const dispatch = useAppDispatch();
  const router = useRouter();

  useEffect(() => {
    dispatch(setUrl(router.asPath));
  }, [router.asPath]);

  return (
    <div className="d-flex flex-column flex-xl-row justify-content-center align-items-center fs-5" style={{ letterSpacing: '0.5px', marginTop: isMobile ? '65%' : '22%' }}>
      {t('entrace1')}
      <Link href={routes.loginPage} className="px-2 text-monospace text-decoration-underline">{t('entrace')}</Link>
      {t('entrace2')}
      <Link href={routes.signupPage} className="ps-2 text-monospace text-decoration-underline">{t('signup')}</Link>
    </div>
  );};
