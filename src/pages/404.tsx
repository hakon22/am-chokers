import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button, Result } from 'antd';
import { Helmet } from '@/components/Helmet';
import image404 from '@/images/404.svg';

const Page404 = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.404' });
  const router = useRouter();

  const back = () => router.back();

  return (
    <>
      <Helmet title={t('title')} description={t('description')} />
      <Result
        icon={<Image src={image404} alt={t('title')} />}
        title={t('title')}
        subTitle={t('description')}
        style={{ marginTop: '10%' }}
        extra={<Button className="button col-2" onClick={back}>{t('prev')}</Button>}
      />
    </>
  );
};

export default Page404;
