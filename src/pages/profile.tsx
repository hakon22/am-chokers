import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { Button, Result } from 'antd';
import { useRouter } from 'next/navigation';
import { Helmet } from '@/components/Helmet';
import Link from 'next/link';
import { useAppSelector } from '@/utilities/hooks';
import { useEffect } from 'react';
import { routes } from '@/routes';

const Profile = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.profile' });
  const router = useRouter();

  const { id, role } = useAppSelector((state) => state.user);

  return (
    <>
      <Helmet title={t('title')} description={t('description')} />
      {id ? (
        <div>Профиль</div>
      ) : (
        <div className="d-flex flex-column flex-md-row justify-content-center align-items-center fs-5" style={{ letterSpacing: '0.5px', marginTop: '22%' }}>
          {t('entrace1')}
          <Link href={routes.loginPage} className="px-2 text-monospace text-decoration-underline">{t('entrace')}</Link>
          {t('entrace2')}
          <Link href={routes.signupPage} className="ps-2 text-monospace text-decoration-underline">{t('signup')}</Link>
        </div>
      )}
    </>
  );
};

export default Profile;
