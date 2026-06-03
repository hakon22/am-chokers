import { useTranslation } from 'react-i18next';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { Divider, Table, type TableProps } from 'antd';
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
import { getAntTableColumnSortOrder, parseAntTableSorter } from '@/utilities/parse-ant-table-sorter';
import { buildAntTableLocale } from '@/utilities/build-ant-table-locale';
import type { PaginationEntityInterface } from '@/types/PaginationInterface';
import type { FetchUserInterface, UserInterface } from '@/types/user/User';

interface DataType extends Omit<Partial<UserInterface>, 'key'> {
  key: React.Key;
}

const USER_LIST_SORT_FIELD_MAPPING = {
  updated: 'lastActivity',
};

const PAGE_LIMIT = 10;

export const V1AdminUserList = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.reports.users' });
  const { t: tRoot } = useTranslation('translation');
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const dispatch = useAppDispatch();
  const router = useRouter();

  const { axiosAuth, pagination } = useAppSelector((state) => state.app);
  const { isAdmin } = useAppSelector((state) => state.user);

  const { setIsSubmit, isSubmit } = useContext(SubmitContext);
  const { isMobile } = useContext(MobileContext);

  const [data, setData] = useState<DataType[]>([]);
  const [sortField, setSortField] = useState<FetchUserInterface['sortField']>();
  const [sortOrder, setSortOrder] = useState<FetchUserInterface['sortOrder']>();

  const fetchUsers = async (params: FetchUserInterface, replace = false) => {
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
        const nextItems = items.map((item) => ({ ...item, key: item.id }));
        setData((state) => (replace ? nextItems : [...state, ...nextItems]));
      }
      setIsSubmit(false);
    } catch (error) {
      axiosErrorHandler(error, tToast, setIsSubmit);
    }
  };

  const fetchUsersEffect = useEffectEvent(fetchUsers);

  useEffect(() => {
    if (axiosAuth) {
      fetchUsersEffect({ limit: PAGE_LIMIT, offset: 0 }, true);
    }
  }, [axiosAuth]);

  const handleTableChange: TableProps<DataType>['onChange'] = (_pagination, _filters, sorter) => {
    const nextSort = parseAntTableSorter(sorter, USER_LIST_SORT_FIELD_MAPPING) as Pick<FetchUserInterface, 'sortField' | 'sortOrder'>;
    setSortField(nextSort.sortField);
    setSortOrder(nextSort.sortOrder);
    fetchUsers({
      limit: PAGE_LIMIT,
      offset: 0,
      ...nextSort,
    }, true);
  };

  const loadMoreUsers = () => {
    fetchUsers({
      limit: pagination.limit || PAGE_LIMIT,
      offset: (pagination.offset || 0) + PAGE_LIMIT,
      ...(sortField ? { sortField, sortOrder } : {}),
    });
  };

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
        next={loadMoreUsers}
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
          onChange={handleTableChange}
          onRow={(record) => ({
            onClick: () => router.push(`${routes.page.admin.userCard}/${record.id}`),
            style: { cursor: 'pointer' },
          })}
          locale={buildAntTableLocale(tRoot, {
            emptyText: <NotFoundContent />,
          })}
        >
          <Table.Column<DataType> title={t('table.username')} dataIndex="name" />
          <Table.Column<DataType> title={t('table.phone')} dataIndex="phone" />
          <Table.Column<DataType>
            title={t('table.signupDate')}
            dataIndex="created"
            sorter
            sortOrder={getAntTableColumnSortOrder('created', sortField, sortOrder)}
            render={(date: Date) => moment(date).format(DateFormatEnum.DD_MM_YYYY_HH_MM)}
          />
          <Table.Column<DataType>
            title={t('table.lastActivity')}
            dataIndex="updated"
            sorter
            sortOrder={getAntTableColumnSortOrder('updated', sortField, sortOrder, USER_LIST_SORT_FIELD_MAPPING)}
            render={(date: Date) => moment(date).format(DateFormatEnum.DD_MM_YYYY_HH_MM)}
          />
        </Table>
      </InfiniteScroll>
    </div>
  ) : null;
};
