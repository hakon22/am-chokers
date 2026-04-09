import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useContext, useEffect, useEffectEvent, useState } from 'react';

import { routes } from '@/routes';
import { V2Order } from '@/themes/v2/components/profile/V2Order';
import { useAppSelector } from '@/hooks/reduxHooks';
import { SubmitContext } from '@/components/Context';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { Helmet } from '@/components/Helmet';
import type { OrderInterface } from '@/types/order/Order';
import type { OrderResponseInterface } from '@/slices/orderSlice';

interface Props {
  id: string;
}

export const V2AdminOrder = ({ id }: Props) => {
  const { t: tOrder } = useTranslation('translation', { keyPrefix: 'pages.profile.orders.order' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const { axiosAuth } = useAppSelector((state) => state.app);

  const { setIsSubmit } = useContext(SubmitContext);

  const [order, setOrder] = useState<OrderInterface | undefined>();

  const fetchOrder = async () => {
    try {
      setIsSubmit(true);
      const { data } = await axios.get<OrderResponseInterface>(routes.order.findOne(+id));
      if (data.code === 1) {
        setOrder(data.order);
      }
      setIsSubmit(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  const fetchOrderEffect = useEffectEvent(fetchOrder);

  useEffect(() => {
    if (axiosAuth) {
      fetchOrderEffect();
    }
  }, [axiosAuth]);

  return (
    <>
      <Helmet title={tOrder('title', { id })} description={tOrder('description', { id })} />
      {order && <V2Order order={order} orderId={order.id} />}
    </>
  );
};
