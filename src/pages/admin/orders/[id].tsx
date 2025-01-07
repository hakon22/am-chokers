import type { InferGetServerSidePropsType } from 'next';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useContext, useEffect, useState } from 'react';

import { routes } from '@/routes';
import { UserRoleEnum } from '@server/types/user/enums/user.role.enum';
import { BackButton } from '@/components/BackButton';
import { Order as OrderComponent } from '@/components/profile/Order';
import { useAppSelector } from '@/utilities/hooks';
import { SubmitContext } from '@/components/Context';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { paramsIdSchema } from '@server/utilities/convertation.params';
import type { OrderInterface } from '@/types/order/Order';
import type { OrderResponseInterface } from '@/slices/orderSlice';
import { Helmet } from '@/components/Helmet';
import { Navigate } from '@/components/Navigate';

export const getServerSideProps = async ({ params }: { params: { id: string; } }) => {
  try {
    const query = await paramsIdSchema.validate(params);

    return {
      props: { id: query.id },
    };
  } catch {
    return {
      redirect: {
        permanent: false,
        destination: routes.homePage,
      },
    };
  }
};

const Order = ({ id }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const { t: tOrder } = useTranslation('translation', { keyPrefix: 'pages.profile.orders.order' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const { axiosAuth } = useAppSelector((state) => state.app);
  const { role } = useAppSelector((state) => state.user);

  const { setIsSubmit } = useContext(SubmitContext);

  const [order, setOrder] = useState<OrderInterface | undefined>();

  const fetchOrder = async () => {
    try {
      setIsSubmit(true);
      const { data } = await axios.get<OrderResponseInterface>(routes.crudOrder(id));
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

  return role === UserRoleEnum.ADMIN ? (
    <div className="d-flex flex-column mb-5 justify-content-center">
      <Helmet title={tOrder('title', { id })} description={tOrder('description')} />
      <h1 className="font-mr_hamiltoneg text-center fs-1 fw-bold mb-5" style={{ marginTop: '12%' }}>{tOrder('title', { id })}</h1>
      <div className="d-flex align-items-center gap-3 mb-5">
        <BackButton style={{}} />
      </div>
      {order && <OrderComponent order={order} t={tOrder} orderId={order.id} />}
    </div>
  ) : <Navigate to={routes.homePage} replace />;
};

export default Order;
