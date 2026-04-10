import { useTranslation } from 'react-i18next';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { useRouter } from 'next/router';
import { useSearchParams } from 'next/navigation';
import { LikeOutlined, DownloadOutlined } from '@ant-design/icons';
import { Popconfirm, Checkbox, Rate, Tag, Button, Skeleton } from 'antd';
import axios from 'axios';
import InfiniteScroll from 'react-infinite-scroll-component';
import cn from 'classnames';

import { Helmet } from '@/components/Helmet';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { deleteItem, restoreItem, setPaginationParams, type ItemResponseInterface } from '@/slices/appSlice';
import { routes } from '@/routes';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { booleanSchema } from '@server/utilities/convertation.params';
import { BackButton } from '@/components/BackButton';
import { Search } from '@/components/Search';
import { NotFoundContent } from '@/components/NotFoundContent';
import { ImageHover } from '@/components/ImageHover';
import { getHref } from '@/utilities/getHref';
import { SubmitContext } from '@/components/Context';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import type { FetchItemInterface, ItemInterface } from '@/types/item/Item';
import type { PaginationEntityInterface } from '@/types/PaginationInterface';

import styles from './V2AdminItemList.module.scss';

const width = 200;
const height = Math.round(width * 1.3);

export const V2AdminItemList = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.itemList' });
  const { t: tPrice } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const dispatch = useAppDispatch();
  const router = useRouter();

  const urlParams = useSearchParams();
  const withDeletedParams = urlParams.get('withDeleted');
  const searchParams = urlParams.get('search');

  const { axiosAuth, pagination } = useAppSelector((state) => state.app);
  const { isAdmin, lang = UserLangEnum.RU } = useAppSelector((state) => state.user);

  const { setIsSubmit, isSubmit } = useContext(SubmitContext);

  const [data, setData] = useState<ItemInterface[]>([]);
  const [withDeleted, setWithDeleted] = useState<boolean | undefined>(booleanSchema.validateSync(withDeletedParams));
  const [search, setSearch] = useState<{ value: string; onFetch: boolean; } | undefined>({ value: searchParams as string, onFetch: true });

  const withDeletedHandler = () => setWithDeleted(!withDeleted);

  const fetchItems = async (params: FetchItemInterface, replacement = false, onFetch = true) => {
    try {
      if (isSubmit || !onFetch) return;
      setIsSubmit(true);
      const { data: { items, paginationParams, code } } = await axios.get<PaginationEntityInterface<ItemInterface>>(routes.item.getList({ isServer: true }), { params });
      if (code === 1) {
        dispatch(setPaginationParams(paginationParams));
        setData(replacement ? items : (state) => [...state, ...items]);
      }
      setIsSubmit(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  const fetchItemsEffect = useEffectEvent(fetchItems);

  const fetchItemsExcel = async () => {
    try {
      setIsSubmit(true);
      const response = await axios.get(routes.item.getListExcel, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'item-register.xlsx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setIsSubmit(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  const handleUpdate = (result: ItemResponseInterface) => {
    if (result.code === 1) {
      setData((state) => {
        const index = state.findIndex((stateItem) => stateItem.id === result.item.id);
        if (index !== -1) {
          state[index] = result.item;
        }
        return state;
      });
    }
  };

  const onItemRemove = async (id: number) => {
    setIsSubmit(true);
    const { payload } = await dispatch(deleteItem(id)) as { payload: ItemResponseInterface };
    if (withDeleted) {
      handleUpdate(payload);
    } else {
      setData((state) => state.filter((item) => item.id !== id));
    }
    setIsSubmit(false);
  };

  const onItemRestore = async (id: number) => {
    setIsSubmit(true);
    const { payload } = await dispatch(restoreItem(id)) as { payload: ItemResponseInterface };
    handleUpdate(payload);
    setIsSubmit(false);
  };

  useEffect(() => {
    if (data.length) {
      fetchItemsEffect({ limit: pagination.limit || 10, offset: 0, withDeleted, search: search?.value }, true, search?.onFetch);
    }
  }, [withDeleted, search?.value]);

  useEffect(() => {
    router.push(
      {
        query: {
          ...(withDeleted !== undefined ? { withDeleted } : {}),
          ...(search?.value !== undefined && search?.value !== null ? { search: search.value } : {}),
        },
      },
      undefined,
      { shallow: true },
    );
  }, [withDeleted, search?.value]);

  useEffect(() => {
    if (axiosAuth) {
      fetchItemsEffect({ limit: 10, offset: 0, withDeleted, search: search?.value });
    }
  }, [axiosAuth]);

  if (!isAdmin) return null;

  return (
    <div className={styles.page}>
      <Helmet title={t('title', { count: pagination.count })} description={t('description')} />
      <h1 className={styles.pageTitle}>{t('title', { count: pagination.count })}</h1>

      <div className={styles.controls}>
        <BackButton style={{}} />
        <Checkbox checked={withDeleted} onChange={withDeletedHandler}>{t('withDeleted')}</Checkbox>
        <div className={styles.controlsRight}>
          <Search
            search={search}
            withDeleted={withDeleted}
            setSearch={setSearch}
            fetch={() => fetchItems({ limit: 10, offset: 0, withDeleted, search: search?.value }, true)}
          />
          <Button icon={<DownloadOutlined />} type="primary" onClick={fetchItemsExcel}>
            {t('getExcel')}
          </Button>
        </div>
      </div>

      <InfiniteScroll
        dataLength={data.length}
        next={() => fetchItems({ limit: pagination.limit, offset: (pagination.offset || 0) + 10, withDeleted, search: search?.value })}
        hasMore={data.length < pagination.count}
        loader={<Skeleton active style={{ marginTop: 16 }} />}
        endMessage={data.length ? <p className={styles.endLine}>{t('finish')}</p> : null}
        style={{ overflow: 'unset' }}
      >
        {!data.length && !isSubmit && (
          <NotFoundContent text={t('reviewsNotExist')} />
        )}

        {data.map((item) => (
          <div key={item.id} className={styles.card}>
            <div className={styles.cardImg}>
              <ImageHover
                height={height}
                width={width}
                href={getHref(item)}
                images={item?.images ?? []}
              />
            </div>

            <div className={styles.cardBody}>
              <div className={styles.meta}>
                <div className={styles.ratings}>
                  <div className={styles.ratingGroup} title={(item.rating?.rating ?? 0).toString()}>
                    <Rate disabled allowHalf value={item.rating?.rating ?? 0} />
                    <span>{item.rating?.rating ?? 0}</span>
                  </div>
                  <div className={styles.ratingGroup}>
                    <LikeOutlined />
                    <span>{tPrice('grades.gradeCount', { count: item.grades.length })}</span>
                  </div>
                  {item.deleted && <Tag color="volcano" variant="outlined">{t('deleted')}</Tag>}
                </div>

                <span className={styles.itemName}>
                  {item?.translations.find((translation) => translation.lang === lang)?.name}
                </span>
                <span className={styles.itemPrice}>
                  {tPrice('price', { price: item.price })}
                </span>
              </div>

              <div className={styles.cardActions}>
                {item.deleted
                  ? (
                    <a className={styles.cardLink} onClick={() => onItemRestore(item.id)}>
                      {t('restore')}
                    </a>
                  )
                  : (
                    <Popconfirm
                      title={t('removeTitle')}
                      description={t('removeDescription')}
                      okText={t('remove')}
                      cancelText={t('cancel')}
                      onConfirm={() => onItemRemove(item.id)}
                    >
                      <a className={cn(styles.cardLink, styles.danger)}>{t('remove')}</a>
                    </Popconfirm>
                  )}
              </div>
            </div>
          </div>
        ))}
      </InfiniteScroll>
    </div>
  );
};
