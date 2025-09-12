import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Button, Result } from 'antd';
import { useContext } from 'react';

import { Helmet } from '@/components/Helmet';
import { routes } from '@/routes';
import { MobileContext } from '@/components/Context';

const Error = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.payment.error' });

  const router = useRouter();

  const { isMobile } = useContext(MobileContext);

  return (
    <div style={{ marginTop: isMobile ? '30%' : '12%' }}>
      <Helmet title={t('title')} description={t('description')} />
      <Result
        status="error"
        title={t('title')}
        subTitle={t('description')}
        style={{ marginTop: '10%' }}
        extra={
          <Button onClick={() => router.push(routes.page.base.profilePage)} className="mx-auto button">
            {t('profileButton')}
          </Button>}
      />
    </div>
  );
};

export default Error;
