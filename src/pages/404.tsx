import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { Result } from 'antd';
import { useContext } from 'react';

import { Helmet } from '@/components/Helmet';
import image404 from '@/images/404.svg';
import { BackButton } from '@/components/BackButton';
import { MobileContext } from '@/components/Context';

const Page404 = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.404' });

  const { isMobile } = useContext(MobileContext);

  return (
    <>
      <Helmet title={t('title')} description={t('description')} />
      <Result
        icon={<Image src={image404} alt={t('title')} />}
        title={t('title')}
        subTitle={t('description')}
        style={{ marginTop: isMobile ? '100px' : '10%' }}
        extra={<BackButton className="button col-4 col-xl-2 mx-auto" propsFullReplace />}
      />
    </>
  );
};

export default Page404;
