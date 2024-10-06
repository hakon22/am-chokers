import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { Button, Result } from 'antd';
import { useRouter } from 'next/navigation';
import { Helmet } from '@/components/Helmet';
import image404 from '@/images/404.svg';
import { useAppSelector } from '@/utilities/hooks';
import { useEffect } from 'react';
import { routes } from '@/routes';

const Profile = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.profile' });
  const router = useRouter();

  const { id, role } = useAppSelector((state) => state.user);

  useEffect(() => {
    if (!id) {
      router.push(routes.loginPage);
    }
  }, [id]);

  return id && (
    <>
      <Helmet title={t('title')} description={t('description')} />
      профиль
    </>
  );
};

export default Profile;
