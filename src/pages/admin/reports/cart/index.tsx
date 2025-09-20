import { useTranslation } from 'react-i18next';
import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Table, Divider } from 'antd';
import Link from 'next/link';
import axios from 'axios';
import InfiniteScroll from 'react-infinite-scroll-component';
import moment from 'moment';
import { useSearchParams } from 'next/navigation';

import { Helmet } from '@/components/Helmet';
import { useAppDispatch, useAppSelector } from '@/utilities/hooks';
import { setPaginationParams } from '@/slices/appSlice';
import { routes } from '@/routes';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { BackButton } from '@/components/BackButton';
import { NotFoundContent } from '@/components/NotFoundContent';
import { ImageHover } from '@/components/ImageHover';
import { getHref } from '@/utilities/getHref';
import { MobileContext, SubmitContext } from '@/components/Context';
import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import type { ItemInterface } from '@/types/item/Item';
import type { PaginationEntityInterface } from '@/types/PaginationInterface';
import type { CartQueryInterface } from '@server/types/cart/cart.query.interface';
import type { CartItemInterface } from '@/types/cart/Cart';
import type { UserEntity } from '@server/db/entities/user.entity';

interface DataType {
  key: React.Key;
  item: ItemInterface;
  count: number;
  date: Date;
  user?: UserEntity;
}

const Cart = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.reports.cart' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const dispatch = useAppDispatch();
  const router = useRouter();

  const { setIsSubmit, isSubmit } = useContext(SubmitContext);
  const { isMobile } = useContext(MobileContext);

  const urlParams = useSearchParams();

  const userIdParams = urlParams.get('userId');

  const coefficient = 1.3;

  const width = 115;
  const height = width * coefficient;

  const { axiosAuth, pagination } = useAppSelector((state) => state.app);
  const { isAdmin, lang } = useAppSelector((state) => state.user);

  const [data, setData] = useState<DataType[]>([]);

  const fetchData = async (params: CartQueryInterface) => {
    try {
      if (isSubmit) {
        return;
      }
      setIsSubmit(true);
      const { data: { items, paginationParams, code } } = await axios.get<PaginationEntityInterface<CartItemInterface>>(routes.reports.cart, {
        params,
      });
      if (code === 1) {
        dispatch(setPaginationParams(paginationParams));
        setData((state) => [...state, ...items.map(cart => ({ key: cart.id, date: cart.created, item: cart.item, count: cart.count, user: cart.user }))]);
      }
      setIsSubmit(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  useEffect(() => {
    if (axiosAuth) {
      router.push({
        query: {
          ...router.query, 
        },
      },
      undefined,
      { shallow: true });

      const params: CartQueryInterface = {
        limit: pagination.limit || 10,
        offset: 0,
        ...(userIdParams ? { userId: +userIdParams } : {}),
      };
      fetchData(params);
    }

    return () => {
      setPaginationParams({ limit: 0, offset: 0, count: 0 });
    };
  }, [axiosAuth]);

  return isAdmin ? (
    <div className="d-flex flex-column mb-5 justify-content-center">
      <Helmet title={t('title')} description={t('description')} />
      <h1 className="font-good-vibes-pro text-center mb-5" style={{ marginTop: isMobile ? '30%' : '12%' }}>{t('titleWithCount', { count: pagination.count })}</h1>
      <div className="d-flex flex-column flex-xl-row align-items-start align-items-xl-center gap-3 mb-3 mb-xl-5">
        <BackButton style={{}} />
      </div>
      <InfiniteScroll
        dataLength={data.length}
        next={() => fetchData({ limit: pagination.limit, offset: (pagination.offset || 0) + 10, ...(userIdParams ? { userId: +userIdParams } : {}) })}
        hasMore={data.length < pagination.count}
        loader
        endMessage={data.length ? <Divider plain className="font-oswald fs-6 mt-5">{t('finish')}</Divider> : null}
        style={{ overflow: 'unset' }}
      >
        <Table
          dataSource={data}
          pagination={false}
          bordered
          className="td-padding-unset"
          locale={{
            emptyText: <NotFoundContent />,
          }}
        >
          <Table.Column<DataType> title={() => <div className="text-center">{t('table.item')}</div>} dataIndex="item" render={(item: ItemInterface) => (
            <div className="d-flex flex-column flex-xl-row align-items-center gap-4 w-100">
              <ImageHover className="align-self-start" href={getHref(item)} images={item.images} height={height} width={width} />
              <span>{item?.translations.find((translation) => translation.lang === lang)?.name}</span>
            </div>
          )} />
          <Table.Column<DataType> title={t('table.date')} dataIndex="date" render={(date: Date) => moment(date).format(DateFormatEnum.DD_MM_YYYY_HH_MM)} />
          <Table.Column<DataType> title={t('table.count')} dataIndex="count" width={'10%'} />
          <Table.Column<DataType> title={t('table.username')} dataIndex="user" render={(user: DataType['user']) => <Link href={`${routes.page.admin.userCard}/${user?.id}`}>{user?.name}</Link>} />
        </Table>
      </InfiniteScroll>
    </div>
  ) : null;
};

export default Cart;
