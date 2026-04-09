import { useTranslation } from 'react-i18next';
import { useEffect, useEffectEvent, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Skeleton } from 'antd';
import axios from 'axios';
import InfiniteScroll from 'react-infinite-scroll-component';

import { Helmet } from '@/components/Helmet';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { setPaginationParams } from '@/slices/appSlice';
import { routes } from '@/routes';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { BackButton } from '@/components/BackButton';
import { V2OrderHistory } from '@/themes/v2/components/profile/V2OrderHistory';
import { V2OrderStatusFilter } from '@/themes/v2/components/profile/V2OrderStatusFilter';
import { OrderStatusEnum } from '@server/types/order/enums/order.status.enum';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import type { PaginationEntityInterface } from '@/types/PaginationInterface';
import type { FetchOrdersInterface, OrderInterface } from '@/types/order/Order';

import styles from './V2AdminOrders.module.scss';

export const V2AdminOrders = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.orders' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const dispatch = useAppDispatch();
  const urlParams = useSearchParams();

  const statusesParams = urlParams.getAll('statuses') as OrderStatusEnum[];
  const userIdParams = urlParams.get('userId');

  const { axiosAuth, pagination } = useAppSelector((state) => state.app);
  const { isAdmin, lang = UserLangEnum.RU } = useAppSelector((state) => state.user);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statuses, setStatuses] = useState<OrderStatusEnum[]>(statusesParams);
  const [data, setData] = useState<OrderInterface[]>([]);

  const fetchOrders = async (params: FetchOrdersInterface, replacement = false) => {
    try {
      if (isLoading) {
        return;
      }
      setIsLoading(true);
      const { data: { items, paginationParams, code } } = await axios.get<PaginationEntityInterface<OrderInterface>>(routes.order.getAllOrders, {
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

  const fetchOrdersEffect = useEffectEvent(fetchOrders);

  useEffect(() => {
    if (axiosAuth) {
      const params: FetchOrdersInterface = {
        limit: 10,
        offset: 0,
        statuses,
        ...(userIdParams ? { userId: +userIdParams } : {}),
      };
      fetchOrdersEffect(params, true);
    }

    return () => {
      setPaginationParams({ limit: 0, offset: 0, count: 0 });
    };
  }, [axiosAuth, statuses.length, userIdParams]);

  if (!isAdmin) return null;

  return (
    <div className={styles.page}>
      <Helmet title={t('title', { count: pagination.count })} description={t('description')} />
      <h1 className={styles.pageTitle}>{t('title', { count: pagination.count })}</h1>

      <div className={styles.controls}>
        <BackButton style={{}} />
        <V2OrderStatusFilter statuses={statuses} setStatuses={setStatuses} lang={lang as UserLangEnum} />
      </div>

      <InfiniteScroll
        dataLength={data.length}
        next={() => fetchOrders({ limit: pagination.limit, offset: (pagination.offset || 0) + 10, statuses, ...(userIdParams ? { userId: +userIdParams } : {}) })}
        hasMore={!(data.length < 10) && data.length < pagination.count}
        loader={<Skeleton active style={{ marginTop: 16 }} />}
        endMessage={data.length ? <p className={styles.endLine}>{t('finish')}</p> : null}
        style={{ overflow: 'unset' }}
      >
        <V2OrderHistory data={data} setData={setData} />
      </InfiniteScroll>
    </div>
  );
};
