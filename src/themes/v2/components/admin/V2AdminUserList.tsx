import { useTranslation } from 'react-i18next';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import axios from 'axios';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Skeleton, Table } from 'antd';
import type { TableProps } from 'antd';
import moment from 'moment';
import { useRouter } from 'next/navigation';

import { Helmet } from '@/components/Helmet';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { setPaginationParams } from '@/slices/appSlice';
import { routes } from '@/routes';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { BackButton } from '@/components/BackButton';
import { SubmitContext } from '@/components/Context';
import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { NotFoundContent } from '@/components/NotFoundContent';
import { getAntTableColumnSortOrder, parseAntTableSorter } from '@/utilities/parse-ant-table-sorter';
import { buildAntTableLocale } from '@/utilities/build-ant-table-locale';
import type { PaginationEntityInterface } from '@/types/PaginationInterface';
import type { FetchUserInterface, UserInterface } from '@/types/user/User';
import styles from '@/themes/v2/components/admin/V2AdminUserList.module.scss';

interface DataType extends Omit<Partial<UserInterface>, 'key'> {
  key: React.Key;
}

const USER_LIST_SORT_FIELD_MAPPING = {
  updated: 'lastActivity',
};

const PAGE_LIMIT = 20;

const getInitials = (name?: string) => {
  if (!name) {
    return '?';
  }
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name[0].toUpperCase();
};

export const V2AdminUserList = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.reports.users' });
  const { t: tRoot } = useTranslation('translation');
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const dispatch = useAppDispatch();
  const router = useRouter();

  const { axiosAuth, pagination } = useAppSelector((state) => state.app);
  const { isAdmin } = useAppSelector((state) => state.user);

  const { setIsSubmit, isSubmit } = useContext(SubmitContext);

  const [data, setData] = useState<DataType[]>([]);
  const [sortField, setSortField] = useState<FetchUserInterface['sortField']>();
  const [sortOrder, setSortOrder] = useState<FetchUserInterface['sortOrder']>();

  const fetchUsers = async (params: FetchUserInterface, replace = false) => {
    try {
      if (isSubmit) {
        return;
      }
      setIsSubmit(true);
      const { data: { items, paginationParams, code } } = await axios.get<PaginationEntityInterface<UserInterface>>(routes.reports.users, { params });
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
      limit: PAGE_LIMIT,
      offset: (pagination.offset || 0) + PAGE_LIMIT,
      ...(sortField ? { sortField, sortOrder } : {}),
    });
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className={styles.page}>
      <Helmet title={t('title', { count: pagination.count })} description={t('description')} />
      <h1 className={styles.pageTitle}>{t('title', { count: pagination.count })}</h1>

      <div className={styles.controls}>
        <BackButton style={{}} />
      </div>

      <InfiniteScroll
        dataLength={data.length}
        next={loadMoreUsers}
        hasMore={data.length < pagination.count}
        loader={<Skeleton active style={{ marginTop: 16 }} />}
        endMessage={data.length ? <p className={styles.endLine}>{t('finish')}</p> : null}
        style={{ overflow: 'unset' }}
      >
        {!data.length && !isSubmit && <NotFoundContent />}

        {!!data.length && (
          <div className={styles.tableCard}>
            <Table
              className={styles.table}
              dataSource={data}
              pagination={false}
              showHeader
              onChange={handleTableChange}
              onRow={(record) => ({
                onClick: () => router.push(`${routes.page.admin.userCard}/${record.id}`),
                className: styles.tableRow,
              })}
              locale={buildAntTableLocale(tRoot, {
                emptyText: <NotFoundContent />,
              })}
            >
              <Table.Column<DataType>
                width={48}
                className={styles.colAvatar}
                render={(_, user) => <div className={styles.avatar}>{getInitials(user.name)}</div>}
              />
              <Table.Column<DataType>
                title={t('table.username')}
                dataIndex="name"
                className={styles.colName}
                render={(_, user) => (
                  <div className={styles.nameCellContent}>
                    <span className={styles.cellName}>{user.name}</span>
                    <span className={styles.cellPhoneMobile}>{user.phone}</span>
                  </div>
                )}
              />
              <Table.Column<DataType>
                title={t('table.phone')}
                dataIndex="phone"
                responsive={['md']}
                className={styles.colPhone}
                render={(phone: string) => <span className={styles.cellMono}>{phone}</span>}
              />
              <Table.Column<DataType>
                title={t('table.signupDate')}
                dataIndex="created"
                responsive={['md']}
                sorter
                sortOrder={getAntTableColumnSortOrder('created', sortField, sortOrder)}
                className={styles.colSignupDate}
                render={(date: Date) => <span className={styles.cellDate}>{moment(date).format(DateFormatEnum.DD_MM_YYYY_HH_MM)}</span>}
              />
              <Table.Column<DataType>
                title={(
                  <span className={styles.activityTitle}>
                    <span className={styles.activityTitleDesktop}>{t('table.lastActivity')}</span>
                    <span className={styles.activityTitleMobile}>{t('table.activity')}</span>
                  </span>
                )}
                dataIndex="updated"
                sorter
                sortOrder={getAntTableColumnSortOrder('updated', sortField, sortOrder, USER_LIST_SORT_FIELD_MAPPING)}
                className={styles.colActivity}
                render={(date: Date) => <span className={styles.cellDate}>{moment(date).format(DateFormatEnum.DD_MM_YYYY_HH_MM)}</span>}
              />
              <Table.Column<DataType>
                width={24}
                className={styles.colChevron}
                render={() => <span className={styles.chevron}>›</span>}
              />
            </Table>
          </div>
        )}
      </InfiniteScroll>
    </div>
  );
};
