import { useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';

import { VersionContext } from '@/components/Context';
import { Helmet } from '@/components/Helmet';
import { useAppSelector } from '@/hooks/reduxHooks';
import { routes } from '@/routes';
import { Order } from '@/components/profile/Order';
import { OrderHistory } from '@/components/profile/OrderHistory';
import { V2Order } from '@/themes/v2/components/profile/V2Order';
import { V2OrderHistory } from '@/themes/v2/components/profile/V2OrderHistory';
import { Spinner } from '@/components/Spinner';

/**
 * Mini App: история заказов пользователя и карточка заказа (маршруты под /telegram/orders)
 */
const TelegramUserOrdersPage = () => {
  const router = useRouter();
  const { version } = useContext(VersionContext);
  const { t } = useTranslation('translation', { keyPrefix: 'pages.profile.orders' });
  const { t: tOrder } = useTranslation('translation', { keyPrefix: 'pages.profile.orders.order' });
  const { id: userId, isAdmin } = useAppSelector((state) => state.user);

  const orderPathSegments = router.query.orderPath as string[] | undefined;
  const firstSegment = orderPathSegments?.[0];
  const orderIdNumeric = firstSegment !== undefined && /^\d+$/.test(firstSegment) ? Number(firstSegment) : undefined;

  useEffect(() => {
    if (!userId) {
      return;
    }
    if (isAdmin) {
      router.replace(routes.page.telegram.adminOrders);
    }
  }, [userId, isAdmin, router]);

  if (!userId) {
    return <Spinner isLoaded={false} />;
  }

  if (isAdmin) {
    return <Spinner isLoaded={false} />;
  }

  if (orderIdNumeric !== undefined) {
    return (
      <>
        <Helmet title={tOrder('title', { id: orderIdNumeric })} description={tOrder('description', { id: orderIdNumeric })} />
        {version === 'v2' ? <V2Order orderId={orderIdNumeric} /> : <Order orderId={orderIdNumeric} />}
      </>
    );
  }

  return (
    <>
      <Helmet title={t('title')} description={t('description')} />
      {version === 'v2' ? <V2OrderHistory /> : <OrderHistory />}
    </>
  );
};

export default TelegramUserOrdersPage;
