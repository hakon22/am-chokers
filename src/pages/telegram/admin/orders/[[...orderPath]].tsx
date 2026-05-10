import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { VersionContext } from '@/components/Context';
import { Helmet } from '@/components/Helmet';
import { useAppSelector } from '@/hooks/reduxHooks';
import { routes } from '@/routes';
import { V1AdminOrder } from '@/themes/v1/components/admin/V1AdminOrder';
import { V1AdminOrders } from '@/themes/v1/components/admin/V1AdminOrders';
import { V2AdminOrder } from '@/themes/v2/components/admin/V2AdminOrder';
import { V2AdminOrders } from '@/themes/v2/components/admin/V2AdminOrders';
import { Spinner } from '@/components/Spinner';

/**
 * Mini App: список всех заказов и карточка заказа для администратора
 */
const TelegramAdminOrdersPage = () => {
  const router = useRouter();
  const { version } = useContext(VersionContext);
  const { t } = useTranslation('translation', { keyPrefix: 'pages.orders' });
  const { t: tOrder } = useTranslation('translation', { keyPrefix: 'pages.profile.orders.order' });
  const { id: userId, isAdmin } = useAppSelector((state) => state.user);
  const { pagination } = useAppSelector((state) => state.app);

  const orderPathSegments = router.query.orderPath as string[] | undefined;
  const firstSegment = orderPathSegments?.[0];
  const orderIdString = firstSegment !== undefined && /^\d+$/.test(firstSegment) ? firstSegment : undefined;

  useEffect(() => {
    if (!userId) {
      return;
    }
    if (!isAdmin) {
      void router.replace(routes.page.telegram.orders);
    }
  }, [userId, isAdmin, router]);

  if (!userId || !isAdmin) {
    return <Spinner isLoaded={false} />;
  }

  if (orderIdString !== undefined) {
    return (
      <>
        <Helmet title={tOrder('title', { id: orderIdString })} description={tOrder('description', { id: orderIdString })} />
        {version === 'v2' ? <V2AdminOrder id={orderIdString} /> : <V1AdminOrder id={orderIdString} />}
      </>
    );
  }

  return (
    <>
      <Helmet title={t('title', { count: pagination.count })} description={t('description')} />
      {version === 'v2' ? <V2AdminOrders /> : <V1AdminOrders />}
    </>
  );
};

export default TelegramAdminOrdersPage;
