import type { InferGetServerSidePropsType } from 'next';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useContext, useEffect, useState } from 'react';

import { routes } from '@/routes';
import { BackButton } from '@/components/BackButton';
import { Order as OrderComponent } from '@/components/profile/Order';
import { useAppSelector } from '@/utilities/hooks';
import { MobileContext, SubmitContext } from '@/components/Context';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import type { OrderInterface } from '@/types/order/Order';
import type { OrderResponseInterface } from '@/slices/orderSlice';
import { Helmet } from '@/components/Helmet';

export const getServerSideProps = async ({ params }: { params: { id: string; } }) => {
  const { id } = params;
  return {
    props: { id },
  };
};

const Order = ({ id }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const { t: tOrder } = useTranslation('translation', { keyPrefix: 'pages.profile.orders.order' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const { axiosAuth } = useAppSelector((state) => state.app);

  const { setIsSubmit } = useContext(SubmitContext);
  const { isMobile } = useContext(MobileContext);

  const [order, setOrder] = useState<OrderInterface | undefined>();

  const fetchOrder = async () => {
    try {
      setIsSubmit(true);
      const { data } = await axios.get<OrderResponseInterface>(routes.crudOrder(+id));
      if (data.code === 1) {
        setOrder(data.order);
      }
      setIsSubmit(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  useEffect(() => {
    if (axiosAuth) {
      fetchOrder();
    }
  }, [axiosAuth]);

  return (
    <div className="d-flex flex-column mb-5 justify-content-center">
      <Helmet title={tOrder('title', { id })} description={tOrder('description', { id })} />
      <h1 className="font-honey-vineyard text-center fs-1 fw-bold mb-3 mb-xl-5" style={{ marginTop: isMobile ? '30%' : '12%' }}>{tOrder('title', { id })}</h1>
      <div className="d-flex align-items-center gap-3 mb-5">
        <BackButton style={{}} />
      </div>
      {order && <OrderComponent order={order} orderId={order.id} />}
    </div>
  );
};

export default Order;
