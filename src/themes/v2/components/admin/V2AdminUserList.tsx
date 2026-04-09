import { useTranslation } from 'react-i18next';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import axios from 'axios';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Skeleton } from 'antd';
import moment from 'moment';
import Link from 'next/link';

import { Helmet } from '@/components/Helmet';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { setPaginationParams } from '@/slices/appSlice';
import { routes } from '@/routes';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { BackButton } from '@/components/BackButton';
import { SubmitContext } from '@/components/Context';
import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { NotFoundContent } from '@/components/NotFoundContent';
import type { PaginationEntityInterface } from '@/types/PaginationInterface';
import type { FetchUserInterface, UserInterface } from '@/types/user/User';

import styles from './V2AdminUserList.module.scss';

const getInitials = (name?: string) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name[0].toUpperCase();
};

export const V2AdminUserList = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.reports.users' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const dispatch = useAppDispatch();

  const { axiosAuth, pagination } = useAppSelector((state) => state.app);
  const { isAdmin } = useAppSelector((state) => state.user);

  const { setIsSubmit, isSubmit } = useContext(SubmitContext);

  const [data, setData] = useState<UserInterface[]>([]);

  const fetchUsers = async (params: FetchUserInterface) => {
    try {
      if (isSubmit) return;
      setIsSubmit(true);
      const { data: { items, paginationParams, code } } = await axios.get<PaginationEntityInterface<UserInterface>>(routes.reports.users, { params });
      if (code === 1) {
        dispatch(setPaginationParams(paginationParams));
        setData((state) => [...state, ...items]);
      }
      setIsSubmit(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  const fetchUsersEffect = useEffectEvent(fetchUsers);

  useEffect(() => {
    if (axiosAuth) {
      fetchUsersEffect({ limit: 20, offset: 0 });
    }
  }, [axiosAuth]);

  if (!isAdmin) return null;

  return (
    <div className={styles.page}>
      <Helmet title={t('title', { count: pagination.count })} description={t('description')} />
      <h1 className={styles.pageTitle}>{t('title', { count: pagination.count })}</h1>

      <div className={styles.controls}>
        <BackButton style={{}} />
      </div>

      <InfiniteScroll
        dataLength={data.length}
        next={() => fetchUsers({ limit: 20, offset: (pagination.offset || 0) + 20 })}
        hasMore={data.length < pagination.count}
        loader={<Skeleton active style={{ marginTop: 16 }} />}
        endMessage={data.length ? <p className={styles.endLine}>{t('finish')}</p> : null}
        style={{ overflow: 'unset' }}
      >
        {!data.length && !isSubmit && <NotFoundContent />}

        {!!data.length && (
          <div className={styles.tableCard}>
            <div className={styles.tableHead}>
              <div />
              <div className={styles.thCell}>{t('table.username')}</div>
              <div className={styles.thCell}>{t('table.phone')}</div>
              <div className={styles.thCell}>{t('table.signupDate')}</div>
              <div className={styles.thCell}>{t('table.lastActivity')}</div>
              <div />
            </div>

            {data.map((user) => (
              <Link key={user.id} href={`${routes.page.admin.userCard}/${user.id}`} className={styles.tableRow}>
                <div className={styles.avatar}>{getInitials(user.name)}</div>
                <span className={styles.cellName}>{user.name}</span>
                <span className={styles.cellMono}>{user.phone}</span>
                <span className={styles.cellDate}>{moment(user.created).format(DateFormatEnum.DD_MM_YYYY_HH_MM)}</span>
                <span className={styles.cellDate}>{moment(user.updated).format(DateFormatEnum.DD_MM_YYYY_HH_MM)}</span>
                <span className={styles.chevron}>›</span>
              </Link>
            ))}
          </div>
        )}
      </InfiniteScroll>
    </div>
  );
};
