import { useTranslation } from 'react-i18next';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { Divider, Table } from 'antd';
import axios from 'axios';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useRouter } from 'next/navigation';
import moment from 'moment';

import { Helmet } from '@/components/Helmet';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { setPaginationParams } from '@/slices/appSlice';
import { routes } from '@/routes';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { BackButton } from '@/components/BackButton';
import { MobileContext, SubmitContext } from '@/components/Context';
import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { NotFoundContent } from '@/components/NotFoundContent';
import type { PaginationEntityInterface } from '@/types/PaginationInterface';
import type { FetchUserInterface, UserInterface } from '@/types/user/User';

interface DataType extends Omit<Partial<UserInterface>, 'key'> {
  key: React.Key;
}

const UserList = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.reports.users' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const dispatch = useAppDispatch();
  const router = useRouter();

  const { axiosAuth, pagination } = useAppSelector((state) => state.app);
  const { isAdmin } = useAppSelector((state) => state.user);

  const { setIsSubmit, isSubmit } = useContext(SubmitContext);
  const { isMobile } = useContext(MobileContext);

  const [data, setData] = useState<DataType[]>([]);

  const fetchUsers = async (params: FetchUserInterface) => {
    try {
      if (isSubmit) {
        return;
      }
      setIsSubmit(true);
      const { data: { items, paginationParams, code } } = await axios.get<PaginationEntityInterface<UserInterface>>(routes.reports.users, {
        params,
      });
      if (code === 1) {
        dispatch(setPaginationParams(paginationParams));
        setData((state) => [...state, ...items.map((item) => ({ ...item, key: item.id }))]);
      }
      setIsSubmit(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  const fetchUsersEffect = useEffectEvent(fetchUsers);

  useEffect(() => {
    if (axiosAuth) {
      const params: FetchUserInterface = {
        limit: 10,
        offset: 0,
      };
      fetchUsersEffect(params);
    }
  }, [axiosAuth]);

  return isAdmin ? (
    <div className="d-flex flex-column mb-5 justify-content-center" style={isMobile ? { marginTop: '50px' } : {}}>
      <Helmet title={t('title', { count: pagination.count })} description={t('description')} />
      <h1 className="font-good-vibes-pro text-center mb-5" style={{ marginTop: '12%' }}>{t('title', { count: pagination.count })}</h1>
      <div className="d-flex flex-column flex-xl-row align-items-xl-center justify-content-between gap-4 gap-xl-0 mb-5">
        <div className="d-flex align-items-center gap-3">
          <BackButton style={{}} />
        </div>
      </div>
      <InfiniteScroll
        dataLength={data.length}
        next={() => fetchUsers({ limit: pagination.limit, offset: (pagination.offset || 0) + 10 })}
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
          onRow={(record) => ({
            onClick: () => router.push(`${routes.page.admin.userCard}/${record.id}`),
            style: { cursor: 'pointer' },
          })}
          locale={{
            emptyText: <NotFoundContent />,
          }}
        >
          <Table.Column<DataType> title={t('table.username')} dataIndex="name" />
          <Table.Column<DataType> title={t('table.phone')} dataIndex="phone" />
          <Table.Column<DataType> title={t('table.signupDate')} dataIndex="created" render={(date: Date) => moment(date).format(DateFormatEnum.DD_MM_YYYY_HH_MM)} />
          <Table.Column<DataType> title={t('table.lastActivity')} dataIndex="updated" render={(date: Date) => moment(date).format(DateFormatEnum.DD_MM_YYYY_HH_MM)} />
        </Table>
      </InfiniteScroll>
    </div>
  ) : null;
};

export default UserList;
