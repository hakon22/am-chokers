import { useTranslation } from 'react-i18next';
import { useContext, useEffect, useEffectEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useSearchParams } from 'next/navigation';
import { LikeOutlined, DownloadOutlined } from '@ant-design/icons';
import { Popconfirm, Checkbox, Rate, Tag, Button, Skeleton, Modal, InputNumber, DatePicker } from 'antd';
import axios from 'axios';
import InfiniteScroll from 'react-infinite-scroll-component';
import cn from 'classnames';
import type { Moment } from 'moment';
import moment from 'moment';
import momentGenerateConfig from 'rc-picker/es/generate/moment';
import locale from 'antd/es/date-picker/locale/ru_RU';

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
import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { toast } from '@/utilities/toast';

import styles from './V2AdminItemList.module.scss';

const MomentDatePicker = DatePicker.generatePicker<Moment>(momentGenerateConfig);

// Same preview proportions as V1 admin item list (ImageHover 200 × width×1.3)
const PREVIEW_WIDTH = 200;
const PREVIEW_COEFFICIENT = 1.3;
const PREVIEW_HEIGHT = Math.round(PREVIEW_WIDTH * PREVIEW_COEFFICIENT);

const listParams = (
  withDeleted: boolean | undefined,
  search: string | undefined,
  outOfStock: boolean | undefined,
): Pick<FetchItemInterface, 'withDeleted' | 'search' | 'outOfStock'> => ({
  ...(withDeleted !== undefined ? { withDeleted } : {}),
  ...(search ? { search } : {}),
  ...(outOfStock ? { outOfStock: true } : {}),
});

type BulkSelection =
  | { all: true; withDeleted?: boolean; search?: string; outOfStock?: boolean }
  | { ids: number[] };

const buildBulkSelection = (
  selectAll: boolean,
  selectedIds: Set<number>,
  withDeleted: boolean | undefined,
  search: string | undefined,
  outOfStock: boolean | undefined,
): BulkSelection => {
  if (selectAll) {
    return {
      all: true,
      ...(withDeleted === true ? { withDeleted: true } : {}),
      ...(search ? { search } : {}),
      ...(outOfStock ? { outOfStock: true } : {}),
    };
  }
  return { ids: [...selectedIds] };
};

export const V2AdminItemList = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.itemList' });
  const { t: tPrice } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });
  const { t: tCart } = useTranslation('translation', { keyPrefix: 'pages.cart' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const dispatch = useAppDispatch();
  const router = useRouter();

  const urlParams = useSearchParams();
  const withDeletedParams = urlParams.get('withDeleted');
  const searchParams = urlParams.get('search');
  const outOfStockParams = urlParams.get('outOfStock');

  const { axiosAuth, pagination } = useAppSelector((state) => state.app);
  const { isAdmin, lang = UserLangEnum.RU } = useAppSelector((state) => state.user);

  const { setIsSubmit, isSubmit } = useContext(SubmitContext);

  const [data, setData] = useState<ItemInterface[]>([]);
  const [withDeleted, setWithDeleted] = useState<boolean | undefined>(booleanSchema.validateSync(withDeletedParams));
  const [outOfStock, setOutOfStock] = useState<boolean | undefined>(booleanSchema.validateSync(outOfStockParams));
  const [search, setSearch] = useState<{ value: string; onFetch: boolean; } | undefined>({ value: searchParams as string, onFetch: true });
  const [selectAll, setSelectAll] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  const [outStockModalOpen, setOutStockModalOpen] = useState(false);
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [bulkOutStockDate, setBulkOutStockDate] = useState<Moment | null>(() => moment().add(1, 'day'));
  const [bulkPercentage, setBulkPercentage] = useState<number>(10);
  const [bulkMultiple, setBulkMultiple] = useState<number>(100);

  const filters = useMemo(() => listParams(withDeleted, search?.value, outOfStock), [withDeleted, search?.value, outOfStock]);

  const withDeletedHandler = () => setWithDeleted(!withDeleted);
  const outOfStockHandler = () => setOutOfStock(!outOfStock);

  const fetchItems = async (params: FetchItemInterface, replacement = false, onFetch = true) => {
    try {
      if (isSubmit || !onFetch) {
        return;
      }
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

  const refetchFromStart = () => {
    setSelectAll(false);
    setSelectedIds(new Set());
    return fetchItems({ limit: 10, offset: 0, ...filters }, true);
  };

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

  const selectionActive = selectAll || selectedIds.size > 0;

  const postBulkOutStock = async () => {
    if (!bulkOutStockDate) {
      return;
    }
    try {
      setIsSubmit(true);
      const sel = buildBulkSelection(selectAll, selectedIds, withDeleted, search?.value, outOfStock);
      const { data } = await axios.post<{ code: number; affectedCount: number; }>(routes.item.bulkOutStock, {
        ...sel,
        outStock: bulkOutStockDate.format('YYYY-MM-DD'),
      });
      if (data.code === 1) {
        toast(tToast('itemBulkSuccess', { count: data.affectedCount }), 'success');
        setOutStockModalOpen(false);
        setIsSubmit(false);
        await refetchFromStart();
      } else {
        setIsSubmit(false);
      }
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  const postBulkClearOutStock = async () => {
    try {
      setIsSubmit(true);
      const sel = buildBulkSelection(selectAll, selectedIds, withDeleted, search?.value, outOfStock);
      const { data } = await axios.post<{ code: number; affectedCount: number }>(routes.item.bulkOutStockClear, sel);
      if (data.code === 1) {
        toast(tToast('itemBulkSuccess', { count: data.affectedCount }), 'success');
        setIsSubmit(false);
        await refetchFromStart();
      } else {
        setIsSubmit(false);
      }
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  const postBulkPriceAdjust = async () => {
    try {
      setIsSubmit(true);
      const sel = buildBulkSelection(selectAll, selectedIds, withDeleted, search?.value, outOfStock);
      const { data } = await axios.post<{ code: number; affectedCount: number; skippedBelowMin: number; }>(routes.item.bulkPriceAdjust, {
        ...sel,
        percentage: bulkPercentage,
        multiple: bulkMultiple,
      });
      if (data.code === 1) {
        toast(tToast('itemBulkSuccess', { count: data.affectedCount }), 'success');
        if (data.skippedBelowMin > 0) {
          toast(tToast('itemBulkPriceSkipped', { count: data.skippedBelowMin }), 'info');
        }
        setPriceModalOpen(false);
        setIsSubmit(false);
        await refetchFromStart();
      } else {
        setIsSubmit(false);
      }
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  const toggleRowSelected = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  useEffect(() => {
    if (!axiosAuth) {
      return;
    }
    fetchItemsEffect({ limit: 10, offset: 0, ...filters }, true, search?.onFetch);
  }, [axiosAuth, withDeleted, search?.value, outOfStock]);

  useEffect(() => {
    router.push(
      {
        query: {
          ...(withDeleted !== undefined ? { withDeleted } : {}),
          ...(search?.value !== undefined && search?.value !== null ? { search: search.value } : {}),
          ...(outOfStock ? { outOfStock: true } : {}),
        },
      },
      undefined,
      { shallow: true },
    );
  }, [withDeleted, search?.value, outOfStock]);

  if (!isAdmin) {
    return null;
  }

  return (
    <div className={cn(styles.page, { [styles.pageWithBulkDock]: selectionActive })}>
      <Helmet title={t('title', { count: pagination.count })} description={t('description')} />
      <h1 className={styles.pageTitle}>{t('title', { count: pagination.count })}</h1>

      <div className={styles.controls}>
        <div className={styles.controlsBack}>
          <BackButton style={{}} />
        </div>
        <div className={styles.controlsFilters}>
          <Checkbox checked={withDeleted} onChange={withDeletedHandler}>{t('withDeleted')}</Checkbox>
          <Checkbox checked={outOfStock} onChange={outOfStockHandler}>{t('outOfStockFilter')}</Checkbox>
          <Checkbox
            checked={selectAll}
            onChange={({ target }) => {
              setSelectAll(target.checked);
              if (target.checked) {
                setSelectedIds(new Set());
              }
            }}
          >
            {t('selectAll')}
          </Checkbox>
        </div>
        <div className={styles.controlsToolbar}>
          <div className={styles.controlsToolbarSearch}>
            <Search
              className="d-flex w-100"
              search={search}
              withDeleted={withDeleted}
              setSearch={setSearch}
              fetch={() => fetchItems({ limit: 10, offset: 0, ...filters }, true)}
            />
          </div>
          <Button icon={<DownloadOutlined />} type="primary" className={styles.controlsExcelBtn} onClick={fetchItemsExcel}>
            {t('getExcel')}
          </Button>
        </div>
      </div>

      {selectionActive && (
        <div className={styles.bulkBar}>
          <div className={styles.bulkBarInner}>
            <span className={styles.bulkMeta}>
              {selectAll ? t('selectedAllFiltered') : t('selectedCount', { count: selectedIds.size })}
            </span>
            <Button type="primary" className={cn(styles.bulkBtn, styles.bulkBtnPrimary)} onClick={() => setOutStockModalOpen(true)}>
              {t('setOutStock')}
            </Button>
            <div className={styles.bulkBarSecondary}>
              <div className={styles.bulkSecondaryCell}>
                <Popconfirm title={t('clearOutStockTitle')} description={t('clearOutStockDesc')} okText={t('okText')} cancelText={t('cancel')} onConfirm={postBulkClearOutStock}>
                  <Button className={cn(styles.bulkBtn, styles.bulkBtnOutline)}>{t('clearOutStock')}</Button>
                </Popconfirm>
              </div>
              <div className={styles.bulkSecondaryCell}>
                <Button className={cn(styles.bulkBtn, styles.bulkBtnOutline)} onClick={() => setPriceModalOpen(true)}>{t('adjustPrices')}</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal
        centered
        open={outStockModalOpen}
        title={t('outStockModalTitle')}
        onOk={postBulkOutStock}
        onCancel={() => setOutStockModalOpen(false)}
        okText={t('apply')}
        cancelText={t('cancel')}
        confirmLoading={isSubmit}
      >
        <MomentDatePicker
          className="w-100"
          style={{ width: '100%' }}
          value={bulkOutStockDate}
          onChange={setBulkOutStockDate}
          minDate={moment().add(1, 'day')}
          allowClear={false}
          showNow={false}
          format={DateFormatEnum.DD_MM_YYYY}
          locale={lang === UserLangEnum.RU ? locale : undefined}
        />
      </Modal>

      <Modal
        centered
        open={priceModalOpen}
        title={t('priceModalTitle')}
        onOk={postBulkPriceAdjust}
        onCancel={() => setPriceModalOpen(false)}
        okText={t('apply')}
        cancelText={t('cancel')}
        confirmLoading={isSubmit}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>{t('percentage')}</span>
          <InputNumber className="w-100" style={{ width: '100%' }} value={bulkPercentage} onChange={(v) => setBulkPercentage(typeof v === 'number' ? v : 0)} />
          <span style={{ fontSize: 12, color: '#64748b' }}>{t('multiple')}</span>
          <InputNumber className="w-100" style={{ width: '100%' }} min={1} value={bulkMultiple} onChange={(v) => setBulkMultiple(typeof v === 'number' ? v : 1)} />
        </div>
      </Modal>

      <InfiniteScroll
        dataLength={data.length}
        next={() => fetchItems({ limit: pagination.limit, offset: (pagination.offset || 0) + 10, ...filters })}
        hasMore={data.length < pagination.count}
        loader={<Skeleton active style={{ marginTop: 16 }} />}
        endMessage={data.length ? <p className={styles.endLine}>{t('finish')}</p> : null}
        style={{ overflow: 'unset' }}
      >
        {!data.length && !isSubmit && (
          <NotFoundContent text={t('reviewsNotExist')} />
        )}

        {data.map((item) => (
          <div key={item.id} className={styles.cardRow}>
            <div className={styles.card}>
              <div className={styles.cardImgWrap}>
                <div className={styles.cardImg}>
                  <ImageHover
                    height={PREVIEW_HEIGHT}
                    width={PREVIEW_WIDTH}
                    href={getHref(item)}
                    images={item?.images ?? []}
                  />
                </div>
                <div
                  className={styles.cardImgCheck}
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    checked={selectAll || selectedIds.has(item.id)}
                    onChange={() => {
                      if (!selectAll) {
                        toggleRowSelected(item.id);
                      }
                    }}
                    disabled={selectAll}
                  />
                </div>
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

                  {item.group?.translations?.find((tr) => tr.lang === lang)?.name
                    ? <span className={styles.itemGroup}>{item.group.translations.find((tr) => tr.lang === lang)?.name}</span>
                    : null}
                  <span className={styles.itemName}>
                    {item?.translations.find((translation) => translation.lang === lang)?.name}
                  </span>
                  {item.outStock
                    ? (
                      <span className={styles.itemOutStock}>
                        {tCart('isAbsentLabel')}{' '}
                        <span style={{ whiteSpace: 'nowrap' }}>{tCart('isAbsentDate', { date: moment(item.outStock).format(DateFormatEnum.DD_MM) })}</span>
                      </span>
                    )
                    : null}
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
          </div>
        ))}
      </InfiniteScroll>
    </div>
  );
};
