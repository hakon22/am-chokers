import { useTranslation } from 'react-i18next';
import Link from 'next/link';

import { routes } from '@/routes';

export const NoAuthorization = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.profile' });

  return (
    <div className="d-flex flex-column flex-md-row justify-content-center align-items-center fs-5" style={{ letterSpacing: '0.5px', marginTop: '22%' }}>
      {t('entrace1')}
      <Link href={routes.loginPage} className="px-2 text-monospace text-decoration-underline">{t('entrace')}</Link>
      {t('entrace2')}
      <Link href={routes.signupPage} className="ps-2 text-monospace text-decoration-underline">{t('signup')}</Link>
    </div>
  );};
