import { useTranslation } from 'react-i18next';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { useRouter } from 'next/router';
import { Table, Divider, DatePicker } from 'antd';
import Link from 'next/link';
import axios from 'axios';
import InfiniteScroll from 'react-infinite-scroll-component';
import moment, { type Moment } from 'moment';
import { useSearchParams } from 'next/navigation';
import momentGenerateConfig from 'rc-picker/lib/generate/moment';

import { Helmet } from '@/components/Helmet';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { setPaginationParams } from '@/slices/appSlice';
import { routes } from '@/routes';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { BackButton } from '@/components/BackButton';
import { NotFoundContent } from '@/components/NotFoundContent';
import { ImageHover } from '@/components/ImageHover';
import { getHref } from '@/utilities/getHref';
import { MobileContext, SubmitContext } from '@/components/Context';
import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { locale } from '@/locales/pickers.locale.ru';
import type { ItemInterface } from '@/types/item/Item';
import type { PaginationEntityInterface } from '@/types/PaginationInterface';
import type { CartQueryInterface } from '@server/types/cart/cart.query.interface';
import type { CartItemInterface } from '@/types/cart/Cart';
import type { UserEntity } from '@server/db/entities/user.entity';

const MomentDatePicker = DatePicker.generatePicker<Moment>(momentGenerateConfig);

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
  const fromParams = urlParams.get('from') || undefined;
  const toParams = urlParams.get('to') || undefined;

  const coefficient = 1.3;

  const width = 115;
  const height = width * coefficient;

  const { axiosAuth, pagination } = useAppSelector((state) => state.app);
  const { isAdmin, lang } = useAppSelector((state) => state.user);

  const [data, setData] = useState<DataType[]>([]);
  const [from, setFrom] = useState(fromParams);
  const [to, setTo] = useState(toParams);

  const fetchData = async (params: CartQueryInterface, replace = false) => {
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
        const newState = items.map(cart => ({ key: cart.id, date: cart.created, item: cart.item, count: cart.count, user: cart.user }));
        setData((state) => replace ? newState : [...state, ...newState]);
      }
      setIsSubmit(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  const fetchDataWithParams = (replace = false) => {
    if (axiosAuth) {
      router.push({
        query: {
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
        },
      },
      undefined,
      { shallow: true });

      const params: CartQueryInterface = {
        limit: pagination.limit || 10,
        offset: 0,
        ...(userIdParams ? { userId: +userIdParams } : {}),
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
      };
      fetchData(params, replace);
    }
  };

  const fetchDataWithParamsEffect = useEffectEvent(fetchDataWithParams);

  useEffect(() => {
    fetchDataWithParamsEffect(true);

    return () => {
      setPaginationParams({ limit: 0, offset: 0, count: 0 });
    };
  }, [axiosAuth, from, to]);

  return isAdmin ? (
    <div className="d-flex flex-column mb-5 justify-content-center">
      <Helmet title={t('title')} description={t('description')} />
      <h1 className="font-good-vibes-pro text-center mb-5" style={{ marginTop: isMobile ? '30%' : '12%' }}>{t('titleWithCount', { count: pagination.count })}</h1>
      <div className="d-flex flex-column flex-xl-row align-items-start align-items-xl-center justify-content-xl-between gap-2 mb-3 mb-xl-5">
        <BackButton style={{}} />
        <div className="d-flex flex-column flex-xl-row gap-2">
          <MomentDatePicker
            className="w-100"
            placeholder={t('from')}
            onChange={(value) => setFrom(value ? value.format(DateFormatEnum.YYYY_MM_DD) : undefined)}
            allowClear
            value={from ? moment(fromParams) : undefined}
            showNow={false}
            format={DateFormatEnum.DD_MM_YYYY}
            locale={lang === UserLangEnum.RU ? locale : undefined}
          />
          <MomentDatePicker
            className="w-100"
            placeholder={t('to')}
            onChange={(value) => setTo(value ? value.format(DateFormatEnum.YYYY_MM_DD) : undefined)}
            allowClear
            value={to ? moment(toParams) : undefined}
            showNow={false}
            format={DateFormatEnum.DD_MM_YYYY}
            locale={lang === UserLangEnum.RU ? locale : undefined}
          />
        </div>
      </div>
      <InfiniteScroll
        dataLength={data.length}
        next={() => fetchData({
          limit: pagination.limit,
          offset: (pagination.offset || 0) + 10,
          ...(userIdParams ? { userId: +userIdParams } : {}),
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
        })}
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
