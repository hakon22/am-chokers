import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Skeleton, Divider } from 'antd';
import axios from 'axios';
import InfiniteScroll from 'react-infinite-scroll-component';

import { Helmet } from '@/components/Helmet';
import { useAppDispatch, useAppSelector } from '@/utilities/hooks';
import { setPaginationParams } from '@/slices/appSlice';
import { routes } from '@/routes';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { BackButton } from '@/components/BackButton';
import { UserRoleEnum } from '@server/types/user/enums/user.role.enum';
import { OrderHistory } from '@/components/profile/OrderHistory';
import { OrderStatusEnum } from '@server/types/order/enums/order.status.enum';
import { OrderStatusFilter } from '@/components/filters/order/OrderStatusFilter';
import type { PaginationEntityInterface } from '@/types/PaginationInterface';
import type { FetchOrdersInterface } from '@/types/order/Order';
import type { OrderInterface } from '@/types/order/Order';


const Orders = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.orders' });
  const { t: tOrders } = useTranslation('translation', { keyPrefix: 'pages.profile.orders' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const dispatch = useAppDispatch();
  const urlParams = useSearchParams();

  const statusesParams = urlParams.getAll('statuses') as OrderStatusEnum[];

  const { axiosAuth, pagination } = useAppSelector((state) => state.app);
  const { role } = useAppSelector((state) => state.user);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statuses, setStatuses] = useState<OrderStatusEnum[]>(statusesParams);
  const [data, setData] = useState<OrderInterface[]>([]);

  const fetchOrders = async (params: FetchOrdersInterface, replacement = false) => {
    try {
      if (isLoading) {
        return;
      }
      setIsLoading(true);
      const { data: { items, paginationParams, code } } = await axios.get<PaginationEntityInterface<OrderInterface>>(routes.getAllOrders, {
        params,
      });
      if (code === 1) {
        dispatch(setPaginationParams(paginationParams));
        setData(replacement ? items : (state) => [...state, ...items]);
      }
      setIsLoading(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsLoading);
    }
  };

  useEffect(() => {
    if (axiosAuth) {
      const params: FetchOrdersInterface = {
        limit: 10,
        offset: 0,
        statuses,
      };
      fetchOrders(params, true);
    }
  }, [axiosAuth, statuses.length]);

  return role === UserRoleEnum.ADMIN ? (
    <div className="d-flex flex-column mb-5 justify-content-center">
      <Helmet title={t('title', { count: pagination.count })} description={t('description')} />
      <h1 className="font-mr_hamiltoneg text-center fs-1 fw-bold mb-5" style={{ marginTop: '12%' }}>{t('title', { count: pagination.count })}</h1>
      <div className="d-flex align-items-center gap-3 mb-5">
        <BackButton style={{}} />
        <OrderStatusFilter statuses={statuses} setStatuses={setStatuses} />
      </div>
      <InfiniteScroll
        dataLength={data.length}
        next={() => fetchOrders({ limit: pagination.limit, offset: pagination.offset + 10, statuses })}
        hasMore={data.length < pagination.count}
        loader={<Skeleton avatar paragraph={{ rows: 1 }} active />}
        endMessage={data.length ? <Divider plain className="font-oswald fs-6 mt-5">{t('finish')}</Divider> : null}
        scrollableTarget="scrollableDiv"
        style={{ overflow: 'unset' }}
      >
        <OrderHistory t={tOrders} data={data} setData={setData} />
      </InfiniteScroll>
    </div>
  ) : null;
};

export default Orders;

